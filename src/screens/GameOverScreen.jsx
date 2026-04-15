import { useNavigate } from 'react-router-dom'

/**
 * GameOverScreen — post-session results screen.
 *
 * Layout:
 *   • Fixed top nav  (same chrome as HomeScreen)
 *   • Centred 12-col grid card  (max-w-4xl)
 *       – col-span-4  Left panel  : "GAME OVER / Time Ran Out" + final score + streak/rank
 *       – col-span-8  Right panel : last question analysis + correct SQL + action buttons
 *   • Fixed footer
 *   • Two ambient blur orbs behind the card (error-red top-left, surface bottom-right)
 *
 * All data is placeholder — wired to real game state in a later pass.
 */
export default function GameOverScreen() {
  const navigate = useNavigate()

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
          {/* Error-red orb — top-left */}
          <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%]
                          bg-error-container blur-[120px] rounded-full" />
          {/* Neutral orb — bottom-right */}
          <div className="absolute bottom-[-5%] right-[-5%] w-[30%] h-[30%]
                          bg-surface-container-highest blur-[100px] rounded-full" />
        </div>

        {/* ── 12-col card ── */}
        <div className="w-full max-w-4xl relative z-10 grid grid-cols-1 md:grid-cols-12 gap-1">

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

            {/* Bottom: score + secondary stats */}
            <div className="space-y-8">

              {/* Final score */}
              <div>
                <p className="font-display text-[10px] text-secondary uppercase
                               tracking-widest mb-1">
                  Final Score
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-6xl font-extrabold text-white">
                    12,450
                  </span>
                  <span className="text-secondary text-xs font-medium">PTS</span>
                </div>
              </div>

              {/* Streak + Rank */}
              <div className="flex gap-10">
                <div>
                  <p className="font-display text-[10px] text-secondary uppercase
                                 tracking-widest mb-1">
                    Highest Streak
                  </p>
                  <div className="flex items-center gap-1.5 text-white">
                    <span className="material-symbols-outlined text-sm filled">bolt</span>
                    <span className="font-display text-2xl font-bold">14</span>
                  </div>
                </div>
                <div>
                  <p className="font-display text-[10px] text-secondary uppercase
                                 tracking-widest mb-1">
                    Rank
                  </p>
                  <div className="flex items-center gap-1.5 text-white">
                    <span className="material-symbols-outlined text-sm">military_tech</span>
                    <span className="font-display text-2xl font-bold">#242</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* ── RIGHT PANEL (8 cols) — analysis + actions ── */}
          <div className="md:col-span-8 bg-surface-container p-10 flex flex-col
                          gap-8 border border-outline-variant/20">

            {/* Last question analysis */}
            <div className="flex-grow flex flex-col gap-6">

              {/* Section header */}
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl font-bold tracking-tight text-white
                               flex items-center gap-2">
                  {/* Red accent bar */}
                  <span className="w-1.5 h-6 flex-shrink-0"
                        style={{ backgroundColor: '#ffb4ab' }} />
                  Last Question Analysis
                </h2>
                {/* Error badge */}
                <span className="px-3 py-1 rounded-full text-[10px] font-bold
                                  font-display uppercase tracking-widest"
                      style={{
                        backgroundColor: 'rgba(147, 0, 10, 0.2)',
                        color: '#ffb4ab',
                      }}>
                  Syntax Error
                </span>
              </div>

              {/* Objective box */}
              <div className="bg-surface-container-lowest p-6 border border-outline-variant/20">
                <p className="font-display text-[10px] text-secondary uppercase
                               tracking-widest mb-3">
                  The Objective
                </p>
                <p className="text-on-surface text-sm font-medium leading-relaxed italic">
                  "Retrieve all columns from the 'architects' table where the
                  project_count exceeds 5, ordered by experience_years descending."
                </p>
              </div>

              {/* Correct SQL solution */}
              <div className="bg-surface-container-lowest border border-outline-variant/20
                              overflow-hidden">
                {/* Code block header */}
                <div className="bg-surface-container-high px-4 py-2
                                border-b border-outline-variant/10
                                flex justify-between items-center">
                  <span className="font-display text-[10px] text-white uppercase tracking-widest">
                    Correct SQL Solution
                  </span>
                  <button
                    aria-label="Copy SQL"
                    className="material-symbols-outlined text-sm text-secondary
                               hover:text-white transition-colors cursor-pointer"
                  >
                    content_copy
                  </button>
                </div>
                {/* Highlighted code */}
                <div className="p-6 font-mono text-sm leading-relaxed overflow-x-auto
                                scrollbar-thin">
                  <pre className="text-on-surface whitespace-pre"><CorrectSQL /></pre>
                </div>
              </div>

            </div>

            {/* ── Action buttons ── */}
            <div className="flex items-center gap-4">
              {/* Play Again — primary */}
              <button
                onClick={() => navigate('/game')}
                className="flex-1 bg-primary text-on-primary font-display font-bold
                           uppercase tracking-widest py-4 text-xs
                           hover:opacity-90 transition-opacity active:scale-[0.98]"
              >
                Play Again
              </button>
              {/* Main Menu — ghost */}
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

/* ─────────────────────────────────────────────
   CorrectSQL — inline syntax-highlighted block.
   Keywords → tertiary (#d8e3fb)
   Everything else → on-surface (#dae2fd)
   Placeholder query; replaced when game logic lands.
───────────────────────────────────────────── */
function CorrectSQL() {
  /* eslint-disable react/jsx-key */
  const KW = ({ children }) => (
    <span style={{ color: '#d8e3fb' }}>{children}</span>
  )

  return (
    <>
      <KW>SELECT</KW>{' * '}
      <KW>FROM</KW>{' architects\n'}
      <KW>WHERE</KW>{' project_count > 5\n'}
      <KW>ORDER BY</KW>{' experience_years '}
      <KW>DESC</KW>{';'}
    </>
  )
}
