const VERDICT_ICON = {
  correct:   { icon: 'check_circle', color: 'text-emerald-400' },
  incorrect: { icon: 'cancel',       color: 'text-error'       },
  error:     { icon: 'error',        color: 'text-error'       },
}

/**
 * HistoryMenu — dropdown of every query submitted this game, newest first.
 * Clicking an entry loads its SQL back into the editor.
 *
 * @param {{
 *   entries:           { id: number, questionId: number, questionTitle: string, sql: string, verdict: string }[],
 *   currentQuestionId: number | null,
 *   onSelect:          (sql: string) => void,
 *   onClose:           () => void,
 * }} props
 */
export default function HistoryMenu({ entries, currentQuestionId, onSelect, onClose }) {
  return (
    <>
      {/* Invisible backdrop — click anywhere else to close */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      <div className="absolute right-0 top-full mt-2 z-50 w-96 max-h-80 overflow-y-auto
                      glass border border-outline-variant/20 rounded shadow-2xl">
        <div className="px-4 py-2 font-display text-[10px] uppercase tracking-widest text-secondary
                        border-b border-outline-variant/10">
          Query History
        </div>

        {!entries.length ? (
          <div className="px-4 py-6 text-xs text-secondary/60 text-center">
            No queries run yet this game.
          </div>
        ) : (
          <ul>
            {entries.map(entry => {
              const v = VERDICT_ICON[entry.verdict]
              return (
                <li key={entry.id}>
                  <button
                    onClick={() => onSelect(entry.sql)}
                    className="w-full text-left px-4 py-2 flex items-start gap-2
                               hover:bg-surface-container-highest/40 transition-colors
                               border-b border-outline-variant/5"
                  >
                    <span className={`material-symbols-outlined text-sm mt-0.5 ${v.color}`}>{v.icon}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[10px] font-display uppercase tracking-widest text-secondary/70">
                        {entry.questionId === currentQuestionId ? 'This question' : entry.questionTitle}
                      </span>
                      <span className="block font-mono text-xs text-on-surface/80 truncate">
                        {entry.sql.replace(/\s+/g, ' ')}
                      </span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </>
  )
}
