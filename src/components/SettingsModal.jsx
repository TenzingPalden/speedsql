import { useState, useEffect } from 'react'
import { DIFFICULTIES, loadDifficulty, saveDifficulty } from '../lib/settings'

const DIFFICULTY_HINTS = {
  Easy:   'Start with the basics, then Medium after 5 correct answers and Hard after 10.',
  Medium: 'Skip the Easy round. Joins and aggregates first, then Hard after 5 correct answers.',
  Hard:   'Straight into CTEs and window functions.',
}

/**
 * SettingsModal — glassmorphism overlay for player preferences.
 *
 *   • Starting difficulty — persisted to localStorage, read by GameScreen when
 *     a new game starts.
 *   • Sound — controlled by the parent so the live game reacts immediately.
 *
 * @param {{
 *   onClose:       () => void,
 *   soundOn:       boolean,
 *   onToggleSound: () => void,
 *   inGame?:       boolean,   // shows the "applies next game / timer paused" note
 * }} props
 */
export default function SettingsModal({ onClose, soundOn, onToggleSound, inGame = false }) {
  const [difficulty, setDifficulty] = useState(loadDifficulty)

  // Escape closes the modal.
  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function chooseDifficulty(d) {
    setDifficulty(d)
    saveDifficulty(d)
  }

  return (
    /* Backdrop — click outside to dismiss */
    <div
      className={[
        'fixed inset-0 flex items-center justify-center z-[60]',
        inGame ? 'bg-surface-container-lowest/80 backdrop-blur-md' : 'bg-surface-container-lowest/60',
      ].join(' ')}
      onClick={onClose}
    >
      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
        className="glass rounded-xl w-full max-w-sm shadow-modal p-8 flex flex-col gap-6"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-primary">
            Settings
          </h2>
          <button
            onClick={onClose}
            aria-label="Close settings"
            className="font-display text-xs uppercase tracking-widest text-secondary hover:text-primary transition-colors"
          >
            Close
          </button>
        </div>

        {inGame && (
          <p className="text-xs text-secondary leading-relaxed bg-surface-container-highest/30
                        border border-outline-variant/10 rounded px-3 py-2">
            Game paused. Difficulty changes apply to your next game.
          </p>
        )}

        {/* ── Starting difficulty ── */}
        <div className="flex flex-col gap-3">
          <span className="font-display text-[10px] uppercase tracking-widest text-secondary">
            Starting Difficulty
          </span>
          <div className="flex gap-1">
            {DIFFICULTIES.map(d => (
              <button
                key={d}
                onClick={() => chooseDifficulty(d)}
                aria-pressed={difficulty === d}
                className={[
                  'flex-1 py-2 text-xs font-display uppercase tracking-widest rounded-xl transition-colors',
                  difficulty === d
                    ? 'bg-primary text-on-primary font-semibold'
                    : 'text-secondary border border-outline-variant/20 hover:text-primary hover:border-outline-variant/40',
                ].join(' ')}
              >
                {d}
              </button>
            ))}
          </div>
          <p className="text-xs text-secondary/80 leading-relaxed">{DIFFICULTY_HINTS[difficulty]}</p>
        </div>

        <div className="flex flex-col gap-4">
          {/* Sound toggle */}
          <div className="flex items-center justify-between">
            <span className="font-display text-xs uppercase tracking-widest text-secondary">
              Sound
            </span>
            <button
              onClick={onToggleSound}
              role="switch"
              aria-checked={soundOn}
              className="flex items-center gap-2 text-sm text-primary hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">
                {soundOn ? 'volume_up' : 'volume_off'}
              </span>
              {soundOn ? 'On' : 'Off'}
            </button>
          </div>

          {/* Time limit — informational */}
          <div className="flex items-center justify-between">
            <span className="font-display text-xs uppercase tracking-widest text-secondary">
              Time Limit
            </span>
            <span className="font-body text-sm text-primary">60 s · +10 s per correct</span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="font-display text-xs uppercase tracking-widest text-secondary/50 hover:text-secondary transition-colors self-center"
        >
          Done
        </button>
      </div>
    </div>
  )
}
