import { useNavigate, useLocation } from 'react-router-dom'

/**
 * GameOverScreen — post-session results screen.
 *
 * All data flows via React Router location.state from GameScreen:
 *   {
 *     score:     number,        // final accumulated score
 *     isNewBest: boolean,       // beat the previous lifetime best score
 *     maxStreak: number,        // highest streak reached during the run
 *     question:  object | null, // the question the player was stuck on
 *     playerSql: string,        // what the player last had in the editor
 *   }
 *
 * Layout:
 *   • Fixed top nav
 *   • Centred 12-col grid card (max-w-5xl to fit side-by-side SQL panes)
 *       – col-span-4  Left  : "GAME OVER" + final score + highest streak
 *       – col-span-8  Right : stuck-question prompt + side-by-side SQL diff
 *   • Fixed footer
 *   • Two ambient blur orbs behind the card
 */
export default function GameOverScreen() {
  const navigate = useNavigate()
  const location = useLocation()

  // Defensive defaults — if someone lands here without going through GameScreen
  // (hard refresh, deep link, etc.) the screen still renders cleanly.
  const {
    score     = 0,
    isNewBest = false,
    maxStreak = 0,
    question  = null,
    playerSql = '',
  } = location.state ?? {}

  // The correct SQL lives on the question itself; fall back to a friendly
  // placeholder string when there is no question in state.
  const correctSql = question?.correctSql ?? '-- No question recorded --'
  const prompt     = question?.prompt     ?? 'No question was active when time ran out.'
  const title      = question?.title      ?? 'Last Challenge'

  return (
    <div className="bg-surface text-on-surface font-body min-h-screen selection:bg-primary selection:text-on-primary">

      {/* ── Fixed top nav ── */}
      <nav className="bg-surface-container flex justify-between items-center w-full px-6 py-3 fixed top-0 z-50">
        <div className="flex items-center gap-8">
          <span className="text-xl font-bold tracking-tighter text-white font-display">
            SpeedSQL
          </span>
          <div className="hidden md:flex gap-6 items-center">
            {['Practice', 'Compete', 'Leaderboard'].map(l => (
              <span
                key={l}
                className="text-secondary hover:text-white transition-colors duration-200
                           font-display text-xs uppercase tracking-widest cursor-pointer"
              >
                {l}
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 mr-4 text-secondary">
            <span className="material-symbols-outlined text-sm">timer</span>
            <span className="material-symbols-outlined text-sm">bolt</span>
            <span className="material-symbols-outlined text-sm">military_tech</span>
          </div>
          <button className="text-secondary hover:text-white transition-colors duration-200
                             font-display text-xs uppercase tracking-widest px-3 py-1">
            Settings
          </button>
          <button
            onClick={() => navigate('/')}
            className="bg-primary text-on-primary px-4 py-1.5 text-xs font-bold
                       font-display uppercase tracking-tight rounded-xl
                       hover:opacity-90 active:scale-95 transition-all"
          >
            End Session
          </button>
        </div>
      </nav>

      {/* ── Main canvas ── */}
      <main className="min-h-screen pt-20 pb-16 px-6 flex items-center justify-center relative overflow-hidden">

        {/* Ambient decorative blurs */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%]
                          bg-error-container blur-[120px] rounded-full" />
          <div className="absolute bottom-[-5%] right-[-5%] w-[30%] h-[30%]
                          bg-surface-container-highest blur-[100px] rounded-full" />
        </div>

        {/* ── 12-col card ── */}
        <div className="w-full max-w-5xl relative z-10 grid grid-cols-1 md:grid-cols-12 gap-1">

          {/* ── LEFT PANEL (4 cols) — status + score ── */}
          <div className="md:col-span-4 bg-surface-container-low p-10 flex flex-col
                          justify-between border border-outline-variant/20">

            {/* Top: game-over heading */}
            <div>
              <span className="font-display text-xs font-bold tracking-[0.2em]
                               uppercase block mb-4"
                    style={{ color: '#ffb4ab' }}>
                Time Ran Out
              </span>
              <h1 className="font-display text-5xl font-bold tracking-tighter
                             text-white leading-none mb-2">
                GAME<br />OVER
              </h1>
            </div>

            {/* Bottom: score + highest streak */}
            <div className="space-y-8 mt-10">

              {/* Final score — real value from location.state */}
              <div>
                <p className="font-display text-[10px] text-secondary uppercase
                               tracking-widest mb-1">
                  Final Score
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-6xl font-extrabold text-white">
                    {score.toLocaleString()}
                  </span>
                  <span className="text-secondary text-xs font-medium">PTS</span>
                </div>
                {isNewBest && (
                  <p className="mt-2 font-display text-[10px] uppercase tracking-widest text-emerald-400">
                    New personal best
                  </p>
                )}
              </div>

              {/* Highest streak — Rank column removed entirely */}
              <div>
                <p className="font-display text-[10px] text-secondary uppercase
                               tracking-widest mb-1">
                  Highest Streak
                </p>
                <div className="flex items-center gap-1.5 text-white">
                  <span className="material-symbols-outlined text-sm filled">bolt</span>
                  <span className="font-display text-2xl font-bold">{maxStreak}</span>
                </div>
              </div>

            </div>
          </div>

          {/* ── RIGHT PANEL (8 cols) — analysis + actions ── */}
          <div className="md:col-span-8 bg-surface-container p-10 flex flex-col
                          gap-6 border border-outline-variant/20">

            {/* Section header */}
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-bold tracking-tight text-white
                             flex items-center gap-2">
                <span className="w-1.5 h-6 flex-shrink-0"
                      style={{ backgroundColor: '#ffb4ab' }} />
                Last Question Analysis
              </h2>
              <span className="px-3 py-1 rounded-full text-[10px] font-bold
                                font-display uppercase tracking-widest"
                    style={{
                      backgroundColor: 'rgba(147, 0, 10, 0.2)',
                      color: '#ffb4ab',
                    }}>
                Unsolved
              </span>
            </div>

            {/* Objective box — real prompt from the stuck question */}
            <div className="bg-surface-container-lowest p-5 border border-outline-variant/20">
              <p className="font-display text-[10px] text-secondary uppercase
                             tracking-widest mb-2">
                {title} — The Objective
              </p>
              <p className="text-on-surface text-sm font-medium leading-relaxed italic">
                "{prompt}"
              </p>
            </div>

            {/* ── Side-by-side SQL diff ─────────────────────────────────
                 Player's attempt vs. correct answer. Stacks on mobile,
                 goes side-by-side at md+.
            ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-grow">

              {/* Player's last SQL */}
              <div className="bg-surface-container-lowest border border-outline-variant/20
                              overflow-hidden flex flex-col">
                <div className="bg-surface-container-high px-4 py-2
                                border-b border-outline-variant/10
                                flex justify-between items-center">
                  <span className="font-display text-[10px] uppercase tracking-widest"
                        style={{ color: '#ffb4ab' }}>
                    Your Attempt
                  </span>
                </div>
                <div className="p-5 font-mono text-xs leading-relaxed overflow-auto
                                scrollbar-thin flex-grow">
                  <pre className="text-on-surface whitespace-pre-wrap break-words">
                    {playerSql.trim() || '-- (editor was empty) --'}
                  </pre>
                </div>
              </div>

              {/* Correct SQL from question.correctSql */}
              <div className="bg-surface-container-lowest border border-outline-variant/20
                              overflow-hidden flex flex-col">
                <div className="bg-surface-container-high px-4 py-2
                                border-b border-outline-variant/10
                                flex justify-between items-center">
                  <span className="font-display text-[10px] text-white uppercase tracking-widest">
                    Correct Solution
                  </span>
                  <button
                    aria-label="Copy SQL"
                    onClick={() => navigator.clipboard?.writeText(correctSql)}
                    className="material-symbols-outlined text-sm text-secondary
                               hover:text-white transition-colors cursor-pointer"
                  >
                    content_copy
                  </button>
                </div>
                <div className="p-5 font-mono text-xs leading-relaxed overflow-auto
                                scrollbar-thin flex-grow">
                  <pre className="text-on-surface whitespace-pre-wrap break-words">
                    {correctSql}
                  </pre>
                </div>
              </div>
            </div>

            {/* ── Action buttons ── */}
            <div className="flex items-center gap-4 mt-2">
              <button
                onClick={() => navigate('/game')}
                className="flex-1 bg-primary text-on-primary font-display font-bold
                           uppercase tracking-widest py-4 text-xs
                           hover:opacity-90 transition-opacity active:scale-[0.98]"
              >
                Play Again
              </button>
              <button
                onClick={() => navigate('/')}
                className="flex-1 bg-transparent border border-outline-variant/20
                           text-secondary font-display font-bold uppercase
                           tracking-widest py-4 text-xs
                           hover:text-white hover:border-white
                           transition-all active:scale-[0.98]"
              >
                Main Menu
              </button>
            </div>

          </div>
        </div>
      </main>

      {/* ── Fixed footer ── */}
      <footer className="bg-surface-container-lowest flex justify-between items-center
                         w-full px-6 py-2 fixed bottom-0 z-50
                         border-t border-surface-container-highest/20">
        <span className="text-secondary font-display text-[10px] uppercase tracking-widest">
          © 2024 SpeedSQL Architectural IDE
        </span>
        <div className="flex gap-6">
          {['Documentation', 'Privacy', 'Terms'].map(l => (
            <span
              key={l}
              className="text-secondary hover:text-white transition-colors
                         font-display text-[10px] uppercase tracking-widest cursor-pointer"
            >
              {l}
            </span>
          ))}
        </div>
      </footer>

    </div>
  )
}
