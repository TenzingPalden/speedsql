import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import GameHeader from '../components/GameHeader'
import QuestionPanel from '../components/QuestionPanel'
import SqlEditor from '../components/SqlEditor'
import SettingsModal from '../components/SettingsModal'
import ConsolePanel from '../components/ConsolePanel'
import HistoryMenu from '../components/HistoryMenu'
import { useSounds } from '../hooks/useSounds'
import { getByDifficulty } from '../data/questions'
import { checkAnswer, prepareQuestion, useSqlEngine } from '../engine/sqlEngine'
import { loadDifficulty, loadSoundOn, saveSoundOn } from '../lib/settings'
import { version as appVersion } from '../../package.json'

// ─── Timer constants ──────────────────────────────────────────────────────────
const MAX_TIME           = 60
const CORRECT_BONUS      = 10
const CRITICAL_THRESHOLD = 0.30

// ─── Focused Preparation ──────────────────────────────────────────────────────
// Green overlay covers the editor pane for PREP_TIME seconds at the start of
// every question, giving the player time to read the objective and schema
// before the survival timer resumes ticking. "I'm Ready" cancels early.
const PREP_TIME = 15

// ─── Difficulty progression ───────────────────────────────────────────────────
/**
 * Difficulty advances automatically with the player's progress:
 *
 *   Easy   → progress 0–4
 *   Medium → progress 5–9
 *   Hard   → progress 10+, cycling the Hard pool indefinitely
 *
 * progress = START_OFFSET[starting difficulty] + correct answers so far, so
 * the Starting Difficulty setting simply skips the earlier tiers.
 *
 * These thresholds align exactly with the 5-question pools per tier in
 * questions.js so the player sees every Easy question before any Medium one.
 */
const EASY_THRESHOLD   = 5   // progress < 5  → Easy
const MEDIUM_THRESHOLD = 10  // progress < 10 → Medium, else Hard

const START_OFFSET = { Easy: 0, Medium: EASY_THRESHOLD, Hard: MEDIUM_THRESHOLD }

function getDifficulty(progress) {
  if (progress < EASY_THRESHOLD)   return 'Easy'
  if (progress < MEDIUM_THRESHOLD) return 'Medium'
  return 'Hard'
}

/** Footer status dot colour per engine status. */
const ENGINE_DOT = {
  idle:    'bg-amber-400',
  loading: 'bg-amber-400 animate-pulse',
  ready:   'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]',
  error:   'bg-error',
}

// ─────────────────────────────────────────────────────────────────────────────
export default function GameScreen() {
  const navigate = useNavigate()

  // ── UI state ──────────────────────────────────────────────────────────────
  const [sql, setSql]               = useState('')
  const [soundOn, setSoundOn]       = useState(loadSoundOn)
  const [settingsOpen, setSettings] = useState(false)
  const [consoleOpen,  setConsole]  = useState(false)
  const [historyOpen,  setHistoryOpen] = useState(false)

  /** Persist sound preference on every toggle. */
  useEffect(() => { saveSoundOn(soundOn) }, [soundOn])

  // ── SQL engine (in-browser Postgres) ──────────────────────────────────────
  const engine = useSqlEngine()
  /** True while a submission is being graded — blocks double submits. */
  const [running, setRunning] = useState(false)
  const runningRef            = useRef(false)
  /** Most recent graded run, shown in the Console panel. */
  const [lastRun, setLastRun] = useState(null)
  /** Every submission this game, newest first, for the History menu. */
  const [history, setHistory] = useState([])
  const historyIdRef          = useRef(0)

  /** Guards async grading against landing after navigation to Game Over.
   *  Set on every mount — StrictMode mounts, unmounts and remounts in dev. */
  const mountedRef = useRef(false)
  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  // ── Sound effects ─────────────────────────────────────────────────────────
  // All three play functions are stable references (useSounds uses refs internally).
  const { playCorrect, playIncorrect, playTick } = useSounds(soundOn)

  // ── Timer state ───────────────────────────────────────────────────────────
  // Declared early so addTime and handleRunQuery can safely reference it in deps.
  const [timeLeft, setTimeLeft] = useState(MAX_TIME)
  const intervalRef             = useRef(null)

  // ── Focused-preparation state ─────────────────────────────────────────────
  // prepMode gates the main timer: while true, the survival countdown is
  // paused and the editor pane is covered by a green overlay. The open
  // Settings modal pauses the game too. pausedRef mirrors both so the 1 s
  // interval callback can check it without being re-created on every toggle
  // (which would miss sub-second boundaries).
  const [prepMode, setPrepMode] = useState(true)
  const [prepTime, setPrepTime] = useState(PREP_TIME)
  const pausedRef               = useRef(true)  // starts paused — first prep
  useEffect(() => { pausedRef.current = prepMode || settingsOpen }, [prepMode, settingsOpen])

  /** Start the 1-second countdown on mount; clean up on unmount.
   *  Skips ticks while pausedRef is true (prep mode). */
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      if (pausedRef.current) return
      setTimeLeft(prev => Math.max(0, prev - 1))
    }, 1000)
    return () => clearInterval(intervalRef.current)
  }, [])

  /** Prep countdown — independent 1 s tick that only runs while in prep mode.
   *  When it hits 0 we auto-dismiss; "I'm Ready" does the same thing early. */
  useEffect(() => {
    if (!prepMode || settingsOpen) return
    const id = setInterval(() => {
      setPrepTime(t => {
        if (t <= 1) { setPrepMode(false); return PREP_TIME }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [prepMode, settingsOpen])

  /** Handler for the "I'm Ready" button — skip the rest of the prep window. */
  const dismissPrep = useCallback(() => {
    setPrepMode(false)
    setPrepTime(PREP_TIME)
  }, [])

  /**
   * addTime — stable callback; uses functional setTimeLeft so it never needs
   * timeLeft in its own deps. Must be declared before handleRunQuery so it can
   * be listed in that callback's dependency array correctly.
   */
  const addTime = useCallback(() => {
    setTimeLeft(prev => prev + CORRECT_BONUS)
  }, []) // setTimeLeft is stable — no deps needed

  // ── Game state ────────────────────────────────────────────────────────────
  const [currentQuestion, setCurrentQuestion] = useState(null)
  const [score,        setScore]        = useState(0)
  const [streak,       setStreak]       = useState(0)
  /**
   * correctCount — total questions answered correctly this session.
   * getDifficulty(startOffset + correctCount) derives the active tier;
   * advancing it automatically escalates difficulty without any extra state.
   */
  const [correctCount, setCorrectCount] = useState(0)
  /** Read once per game — changing the setting mid-game applies next game. */
  const [startOffset] = useState(() => START_OFFSET[loadDifficulty()])

  /**
   * seenByDiffRef — tracks seen question IDs separately per difficulty tier.
   * This ensures the Easy pool exhausts before Medium starts, and Medium
   * before Hard, with no cross-tier contamination.
   * Each tier's Set is cleared independently when that pool runs out.
   */
  const seenByDiffRef = useRef({ Easy: new Set(), Medium: new Set(), Hard: new Set() })

  /**
   * pickNextQuestion(progress) — selects a random unseen question from the
   * tier that corresponds to `progress` (startOffset + correct answers).
   *
   * Accepting progress as a parameter (rather than reading state) keeps the
   * callback stable ([] deps) so it is safe to list in handleRunQuery's deps
   * and call from a setTimeout without stale-closure issues.
   *
   * Pool exhaustion is handled per-tier: when every question in the active
   * difficulty has been seen, that tier's Set is cleared and the pool cycles.
   * This means Hard questions repeat once all 5 are exhausted, while Easy and
   * Medium questions each appear exactly once before the tier advances.
   */
  const pickNextQuestion = useCallback((progress) => {
    const difficulty = getDifficulty(progress)
    const seenSet    = seenByDiffRef.current[difficulty]
    const pool       = getByDifficulty(difficulty)
    if (!pool.length) return

    let unseen = pool.filter(q => !seenSet.has(q.id))
    if (!unseen.length) {
      seenSet.clear()
      unseen = pool
    }

    const next = unseen[Math.floor(Math.random() * unseen.length)]
    seenSet.add(next.id)
    setCurrentQuestion(next)
  }, [])

  /** Load the first question on mount, from the chosen starting tier. */
  useEffect(() => { pickNextQuestion(startOffset) }, [pickNextQuestion, startOffset])

  /**
   * Re-arm prep mode every time a new question is loaded. Keyed on
   * currentQuestion?.id so repeated renders of the same question don't
   * restart the preparation window.
   */
  useEffect(() => {
    if (!currentQuestion) return
    setPrepMode(true)
    setPrepTime(PREP_TIME)
    // Compute the reference result while the player reads the question.
    prepareQuestion(currentQuestion)
  }, [currentQuestion?.id])

  // ── Flash feedback ────────────────────────────────────────────────────────
  /**
   * flash = 'correct' | 'incorrect' | null
   * Drives a full-screen colour overlay that fades in then out via
   * the .animate-flash CSS keyframe. The element is mounted/unmounted
   * so the animation always restarts cleanly for each submission.
   */
  const [flash, setFlash] = useState(null)
  const flashTimerRef     = useRef(null)

  const triggerFlash = useCallback((type) => {
    clearTimeout(flashTimerRef.current)
    setFlash(type)
    flashTimerRef.current = setTimeout(() => setFlash(null), 400)
  }, [])

  /** Clean up flash timer if the component unmounts mid-animation. */
  useEffect(() => () => clearTimeout(flashTimerRef.current), [])

  // ── Answer checker ────────────────────────────────────────────────────────
  /**
   * handleRunQuery — the core validation callback, wired to both Run Query
   * buttons (header and toolbar).
   *
   * The query runs against the question's sample data in the in-browser
   * Postgres and is graded by its *result* (see engine/sqlEngine.js), so any
   * query that returns the right rows passes.
   *
   * Correct   → +100 pts + time-left bonus, streak++, +10 s, advance question.
   * Incorrect → streak resets to 0, no time change, red flash, console opens.
   * SQL error → same as incorrect; the console shows Postgres's message.
   * Empty     → silent no-op (no penalty).
   */
  const handleRunQuery = useCallback(async () => {
    // Block submissions during the preparation window (editor is locked
    // behind the green overlay), while paused, and while already grading.
    if (prepMode || settingsOpen || runningRef.current) return
    const trimmed  = sql.trim()
    const question = currentQuestion
    if (!trimmed || !question) return

    runningRef.current = true
    setRunning(true)
    let outcome
    try {
      outcome = await checkAnswer(question, trimmed)
    } finally {
      runningRef.current = false
      if (mountedRef.current) setRunning(false)
    }

    // Time may have run out, or the player left, while the query ran.
    if (!mountedRef.current || questionRef.current?.id !== question.id) return

    setLastRun(outcome)
    setHistory(h => [{
      id:            ++historyIdRef.current,
      questionId:    question.id,
      questionTitle: question.title,
      sql:           trimmed,
      verdict:       outcome.verdict,
    }, ...h])

    if (outcome.verdict === 'correct') {
      // Compute the new count synchronously so pickNextQuestion receives it
      // inside the setTimeout — state update (setCorrectCount) is async and
      // would not be visible to the closure by the time the timer fires.
      const newCount  = correctCount + 1
      const newStreak = streak + 1
      const timeBonus = Math.floor(timeLeftRef.current * 2)   // speed bonus
      setScore(s  => s + 100 + timeBonus)
      setStreak(newStreak)
      setCorrectCount(newCount)
      // Track highest streak of the session for the GameOver screen.
      if (newStreak > maxStreakRef.current) maxStreakRef.current = newStreak
      addTime()
      playCorrect()
      triggerFlash('correct')
      // 320 ms delay: green flash is visible before the panel swaps. Keep
      // submissions locked until then so a double-click can't score twice.
      runningRef.current = true
      setTimeout(() => {
        runningRef.current = false
        if (mountedRef.current) pickNextQuestion(startOffset + newCount)
      }, 320)
    } else {
      setStreak(0)
      setConsole(true)
      playIncorrect()
      triggerFlash('incorrect')
    }
  }, [
    sql, currentQuestion, correctCount, streak, prepMode, settingsOpen, startOffset,
    addTime, playCorrect, playIncorrect, triggerFlash, pickNextQuestion,
  ])

  // ── Refs for gameover navigation ──────────────────────────────────────────
  // Keep score, max streak, current question, and the player's in-progress SQL
  // readable from the timeLeft effect without adding them to its dependency
  // array (which would cause a spurious tick every time they change).
  //
  // maxStreakRef tracks the HIGHEST streak achieved during the run — distinct
  // from the live `streak` state, which resets to 0 on every wrong answer.
  // It is updated imperatively inside handleRunQuery so we always have the
  // post-increment value synchronously, no sync-effect needed.
  const scoreRef     = useRef(0)
  const maxStreakRef = useRef(0)
  const questionRef  = useRef(null)
  const sqlRef       = useRef('')
  const timeLeftRef  = useRef(MAX_TIME)
  useEffect(() => { timeLeftRef.current = timeLeft        }, [timeLeft])
  useEffect(() => { scoreRef.current    = score           }, [score])
  useEffect(() => { questionRef.current = currentQuestion }, [currentQuestion])
  useEffect(() => { sqlRef.current      = sql             }, [sql])

  // ── Timer watcher ─────────────────────────────────────────────────────────
  /**
   * Runs after every timeLeft change.
   *   • At 0 → stop the interval and navigate to GameOver with final stats.
   *   • At 1–10 → play one tick per second; volume builds as urgency rises.
   *     Ticking stops automatically if addTime() pushes timeLeft back above 10.
   */
  useEffect(() => {
    if (timeLeft === 0) {
      clearInterval(intervalRef.current)
      navigate('/gameover', {
        state: {
          score:     scoreRef.current,
          maxStreak: maxStreakRef.current,
          question:  questionRef.current,
          playerSql: sqlRef.current,
        },
      })
      return
    }
    if (timeLeft <= 10) {
      playTick(timeLeft)
    }
  }, [timeLeft, navigate, playTick])

  // ── Derived engine labels ─────────────────────────────────────────────────
  const engineLabel = {
    idle:    'Starting Postgres…',
    loading: 'Starting Postgres…',
    ready:   `PostgreSQL ${engine.version}`,
    error:   'Database unavailable',
  }[engine.status]

  const engineFooter = {
    idle:    'Engine: starting',
    loading: 'Engine: starting',
    ready:   'Engine: in-browser Postgres (PGlite)',
    error:   'Engine: offline — text matching',
  }[engine.status]

  const LAST_RUN_LABEL = { correct: 'correct', incorrect: 'incorrect', error: 'SQL error' }
  const consoleStatus =
      running                   ? 'Running…'
    : lastRun                   ? `Last run: ${LAST_RUN_LABEL[lastRun.verdict]}`
    : engine.status === 'ready' ? 'Ready'
    : engine.status === 'error' ? 'Database unavailable — answers compared as text'
    :                             'Starting database…'

  // ── Derived timer values ──────────────────────────────────────────────────
  /** Capped at 100 so the bar never overflows when addTime pushes past MAX_TIME. */
  const pct        = Math.min(100, (timeLeft / MAX_TIME) * 100)
  const isCritical = timeLeft < MAX_TIME * CRITICAL_THRESHOLD

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="bg-surface text-on-surface font-body h-screen flex flex-col overflow-hidden relative">

      {/* ── Screen flash overlay ─────────────────────────────────────────────
            Absolutely covers the whole viewport. pointer-events-none so it
            never intercepts clicks. Mounts/unmounts on each submission so
            the .animate-flash keyframe always starts from the beginning.
      ── */}
      {flash && (
        <div
          className="absolute inset-0 z-50 animate-flash pointer-events-none"
          style={{
            backgroundColor: flash === 'correct'
              ? 'rgba(16, 185, 129, 0.18)'   /* emerald */
              : 'rgba(255, 100,  80, 0.18)',  /* red     */
          }}
        />
      )}

      {/* ── 1. Game header ── */}
      <GameHeader
        onMainMenu    ={() => navigate('/')}
        onRunQuery    ={handleRunQuery}
        running       ={running}
        soundOn       ={soundOn}
        onToggleSound ={() => setSoundOn(s => !s)}
        onOpenSettings={() => setSettings(true)}
        timeLeft      ={timeLeft}
        isCritical    ={isCritical}
        score         ={score}
        streak        ={streak}
      />

      {/* ── 2. Timer progress bar ─────────────────────────────────────────
            Width transitions over 1 s (matches the tick interval).
            Colour snaps immediately on threshold crossing — no transition
            on background-color, only on width.
      ── */}
      <div className="h-0.5 w-full bg-surface-container-low flex-shrink-0">
        <div
          style={{
            height:          '100%',
            width:           `${pct}%`,
            backgroundColor: isCritical ? '#ffb4ab' : '#b9c8de',
            transition:      'width 1s linear',
          }}
        />
      </div>

      {/* ── 3. Split-panel main canvas ── */}
      <main className="flex-1 flex overflow-hidden">

        {/* LEFT — live question data */}
        <QuestionPanel question={currentQuestion} />

        {/* RIGHT — Monaco editor + toolbar */}
        <section className="flex-1 bg-surface-container-lowest flex flex-col relative overflow-hidden">

          {/* ── Focused Preparation overlay ──────────────────────────────────
                Covers the ENTIRE right pane (toolbar + editor + console) so
                the player cannot start typing or click Run Query until they
                either press "I'm Ready" or the 15-second timer expires.
                Subtle green tint (#10b981 @ 18 %) keeps with the design-system
                aesthetic — no neon, no hacker-green. A centred card holds the
                countdown, a short instruction, and the primary CTA.
          ── */}
          {prepMode && (
            <div
              className="absolute inset-0 z-40 flex items-center justify-center
                         backdrop-blur-[2px]"
              style={{ backgroundColor: 'rgba(16, 185, 129, 0.18)' }}
            >
              <div className="flex flex-col items-center gap-5 glass
                              border border-outline-variant/20 rounded
                              px-12 py-10 max-w-sm text-center shadow-2xl">
                <span className="font-display text-[10px] uppercase tracking-[0.25em]
                                 text-secondary">
                  Focused Preparation
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-7xl font-extrabold text-white
                                   tracking-tighter leading-none">
                    {prepTime}
                  </span>
                  <span className="font-display text-xs uppercase tracking-widest
                                   text-secondary">s</span>
                </div>
                <p className="text-on-surface/80 text-sm leading-relaxed">
                  Review the objective and schema on the left.
                  The survival timer starts when you're ready.
                </p>
                <button
                  onClick={dismissPrep}
                  className="mt-2 bg-primary text-on-primary px-6 py-2.5 rounded
                             text-xs font-bold font-display uppercase tracking-widest
                             hover:shadow-[0_0_15px_rgba(255,255,255,0.25)]
                             active:scale-95 transition-all flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm filled">
                    play_arrow
                  </span>
                  I&rsquo;m Ready
                </button>
              </div>
            </div>
          )}

          {/* Toolbar */}
          <div className="h-12 bg-surface-container-low border-b border-outline-variant/10
                          flex items-center justify-between px-4 flex-shrink-0">
            {/* DB badge — reflects the real in-browser engine */}
            <div className="flex items-center gap-1">
              <div
                title={engine.error ?? undefined}
                className="flex items-center gap-2 bg-surface-container-lowest px-3 py-1
                           rounded text-xs text-secondary border border-outline-variant/10"
              >
                <span className="material-symbols-outlined text-sm">database</span>
                <span className="font-mono">{engineLabel}</span>
              </div>
            </div>

            {/* History + Run Query */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <button
                  onClick={() => setHistoryOpen(o => !o)}
                  aria-expanded={historyOpen}
                  className="flex items-center gap-2 text-secondary hover:text-white
                             transition-colors text-xs px-2"
                >
                  <span className="material-symbols-outlined text-sm">history</span>
                  <span>History{history.length ? ` (${history.length})` : ''}</span>
                </button>
                {historyOpen && (
                  <HistoryMenu
                    entries={history}
                    currentQuestionId={currentQuestion?.id ?? null}
                    onSelect={entrySql => { setSql(entrySql); setHistoryOpen(false) }}
                    onClose={() => setHistoryOpen(false)}
                  />
                )}
              </div>
              <button
                onClick={handleRunQuery}
                disabled={running}
                className="bg-primary text-on-primary px-5 py-1.5 rounded text-sm font-bold
                           font-display uppercase tracking-wide flex items-center gap-2
                           hover:shadow-[0_0_15px_rgba(255,255,255,0.2)]
                           active:scale-95 opacity-90 hover:opacity-100 transition-all
                           disabled:opacity-60 disabled:cursor-wait"
              >
                <span className="material-symbols-outlined text-sm filled">
                  {running ? 'hourglass_top' : 'play_arrow'}
                </span>
                {running ? 'Running…' : 'Run Query'}
              </button>
            </div>
          </div>

          {/* Monaco editor — absolute fill for correct height measurement */}
          <div className="flex-1 relative overflow-hidden">
            <div className="absolute inset-0">
              <SqlEditor
                value={sql}
                onChange={setSql}
                questionId={currentQuestion?.id ?? null}
              />
            </div>
          </div>

          {/* Console output — opens automatically on a wrong answer */}
          {consoleOpen && <ConsolePanel lastRun={lastRun} />}

          {/* Console bar */}
          <div className="h-10 bg-surface-container border-t border-outline-variant/20
                          flex items-center justify-between px-6 flex-shrink-0">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setConsole(o => !o)}
                className="flex items-center gap-2 text-secondary text-xs
                           hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined text-sm">terminal</span>
                <span>Console</span>
              </button>
              <span className="text-secondary/60 text-xs">{consoleStatus}</span>
            </div>
            <button
              onClick={() => setConsole(o => !o)}
              className="material-symbols-outlined text-secondary text-sm
                         cursor-pointer hover:text-white transition-colors"
            >
              {consoleOpen ? 'keyboard_arrow_down' : 'keyboard_arrow_up'}
            </button>
          </div>

        </section>
      </main>

      {/* ── 4. Footer ── */}
      <footer className="bg-surface-container-lowest text-secondary flex justify-between
                         items-center w-full px-6 py-2
                         border-t border-surface-container-highest/20 flex-shrink-0">
        <div className="flex items-center gap-4">
          <span className="font-display text-[10px] uppercase tracking-widest">
            © 2024 SpeedSQL Architectural IDE
          </span>
          <div className="h-3 w-px bg-outline-variant/20" />
          <div className="flex gap-4">
            {['Documentation', 'Privacy', 'Terms'].map(l => (
              <span
                key={l}
                className="font-display text-[10px] uppercase tracking-widest
                           hover:text-white transition-colors cursor-pointer"
              >
                {l}
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2" title={engine.error ?? undefined}>
            <span className={`w-1.5 h-1.5 rounded-full ${ENGINE_DOT[engine.status]}`} />
            <span className="font-display text-[10px] uppercase tracking-widest">
              {engineFooter}
            </span>
          </div>
          <span className="font-display text-[10px] uppercase tracking-widest text-secondary/40">
            v{appVersion}
          </span>
        </div>
      </footer>

      {/* ── Settings modal ── */}
      {settingsOpen && (
        <SettingsModal
          onClose={() => setSettings(false)}
          soundOn={soundOn}
          onToggleSound={() => setSoundOn(s => !s)}
          inGame
        />
      )}
    </div>
  )
}
