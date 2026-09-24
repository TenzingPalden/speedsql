/**
 * GameHeader — full-width top bar for the gameplay screen.
 *
 * Layout (three zones, centre is absolutely positioned):
 *   LEFT   : SpeedSQL wordmark · "Main Menu" ghost button
 *   CENTRE : Survival Timer · Streak 🔥 · Score          [absolute pill]
 *   RIGHT  : Sound toggle · Settings · RUN QUERY primary button
 *
 * Timer display rules
 * ───────────────────
 *   • Always formatted as MM:SS with leading zeros.
 *   • Text colour is always the error/red token (#ffb4ab) — matches the
 *     prototype's "survival" aesthetic.
 *   • When isCritical (< 30 % remaining) the number gains .animate-critical
 *     — a scale pulse defined in index.css — to signal urgency without
 *     obscuring the value.
 *
 * @param {{
 *   onMainMenu:    () => void,
 *   onRunQuery:    () => void,
 *   running:       boolean,  // a query is being graded — button shows progress
 *   soundOn:       boolean,
 *   onToggleSound: () => void,
 *   onOpenSettings:() => void,
 *   timeLeft:      number,   // seconds remaining
 *   isCritical:    boolean,  // true when < 30 % of max time remains
 *   score:         number,   // current score
 *   streak:        number,   // consecutive correct answers
 * }} props
 */

/** Format seconds → "MM:SS". */
function fmt(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function GameHeader({
  onMainMenu,
  onRunQuery,
  running    = false,
  soundOn,
  onToggleSound,
  onOpenSettings,
  timeLeft   = 30,
  isCritical = false,
  score      = 0,
  streak     = 0,
}) {
  return (
    <header className="bg-surface-container text-white flex justify-between items-center
                       w-full px-6 py-3 z-50 relative flex-shrink-0">

      {/* ── LEFT ── logo + main-menu ── */}
      <div className="flex items-center gap-6">
        <span className="text-xl font-bold tracking-tighter text-white font-display">
          SpeedSQL
        </span>
        <button
          onClick={onMainMenu}
          className="font-display text-xs uppercase tracking-widest text-secondary
                     border border-outline-variant/20 px-3 py-1 rounded
                     hover:text-white hover:border-outline-variant/50 transition-colors"
        >
          Main Menu
        </button>
      </div>

      {/* ── CENTRE (absolute) — stats pill ── */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-10
                      bg-surface-container-lowest px-8 py-2 rounded-lg
                      border border-outline-variant/10">

        {/* Survival Timer */}
        <div className="flex flex-col items-center">
          <span className="font-display text-[10px] uppercase tracking-widest text-secondary">
            Survival Timer
          </span>
          {/*
            .animate-critical applies the scale-pulse keyframe.
            Uses display:inline-block (set in the class itself) so
            transform works on inline text.
          */}
          <span
            className={`font-display text-xl font-bold tracking-tighter${isCritical ? ' animate-critical' : ''}`}
            style={{ color: '#ffb4ab' }}
          >
            {fmt(timeLeft)}
          </span>
        </div>

        {/* Streak */}
        <div className="flex flex-col items-center">
          <span className="font-display text-[10px] uppercase tracking-widest text-secondary">
            Streak
          </span>
          <div className="flex items-center gap-1">
            <span className="text-base leading-none">🔥</span>
            <span className="font-display text-xl font-bold text-primary tracking-tighter">
              {streak}
            </span>
          </div>
        </div>

        {/* Score */}
        <div className="flex flex-col items-center">
          <span className="font-display text-[10px] uppercase tracking-widest text-secondary">
            Score
          </span>
          <span className="font-display text-xl font-bold text-primary tracking-tighter">
            {score.toLocaleString()}
          </span>
        </div>
      </div>

      {/* ── RIGHT — sound toggle + settings + RUN QUERY ── */}
      <div className="flex items-center gap-4">
        {/* Sound toggle */}
        <button
          onClick={onToggleSound}
          aria-label={soundOn ? 'Mute sound' : 'Unmute sound'}
          className="text-secondary hover:text-white transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">
            {soundOn ? 'volume_up' : 'volume_off'}
          </span>
        </button>

        {/* Settings */}
        <button
          onClick={onOpenSettings}
          aria-label="Settings"
          className="text-secondary hover:text-white transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">settings</span>
        </button>

        {/* RUN QUERY — primary CTA */}
        <button
          onClick={onRunQuery}
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
    </header>
  )
}
