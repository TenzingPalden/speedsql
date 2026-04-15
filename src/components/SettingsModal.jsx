import { useState, useEffect } from 'react'

const DIFFICULTIES = ['Easy', 'Medium', 'Hard']
const STORAGE_KEY = 'speedsql-difficulty'

/**
 * SettingsModal — glassmorphism overlay with difficulty persistence.
 * Difficulty (Easy / Medium / Hard) is read from and written to localStorage.
 * Default: "Medium".
 *
 * @param {{ onClose: () => void }} props
 */
export default function SettingsModal({ onClose }) {
  const [difficulty, setDifficulty] = useState(
    () => localStorage.getItem(STORAGE_KEY) ?? 'Medium'
  )

  // Persist every time difficulty changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, difficulty)
  }, [difficulty])

  return (
    /* Backdrop — click outside to dismiss */
    <div
      className="fixed inset-0 bg-surface-container-lowest/60 flex items-center justify-center z-[60]"
      onClick={onClose}
    >
      {/* Panel */}
      <div
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

        {/* ── Difficulty selector (wired to localStorage) ── */}
        <div className="flex flex-col gap-3">
          <span className="font-display text-[10px] uppercase tracking-widest text-secondary">
            Difficulty
          </span>
          <div className="flex gap-1">
            {DIFFICULTIES.map(d => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
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
        </div>

        {/* Placeholder setting rows */}
        <div className="flex flex-col gap-4">
          <SettingRow label="Time Limit" value="60 s" />
          <SettingRow label="Sound"      value="On"   />
        </div>

        {/* Cancel */}
        <button
          onClick={onClose}
          className="font-display text-xs uppercase tracking-widest text-secondary/50 hover:text-secondary transition-colors self-center"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

function SettingRow({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="font-display text-xs uppercase tracking-widest text-secondary">
        {label}
      </span>
      <span className="font-body text-sm text-primary">{value}</span>
    </div>
  )
}
