const MAX_ROWS = 100

const VERDICT_STYLE = {
  correct:   { icon: 'check_circle', label: 'Correct',   color: 'text-emerald-400' },
  incorrect: { icon: 'cancel',       label: 'Incorrect', color: 'text-error'       },
  error:     { icon: 'error',        label: 'SQL Error', color: 'text-error'       },
}

/**
 * ConsolePanel — output of the most recent Run Query.
 *
 * Shows the grading verdict with its reason (wrong row count, wrong order,
 * Postgres error message …) and the rows the player's query actually
 * returned, so they can compare against the Expected Output on the left.
 *
 * @param {{
 *   lastRun: null | {
 *     verdict: 'correct' | 'incorrect' | 'error',
 *     message: string,
 *     result?: { columns: string[], rows: (string|null)[][] },
 *   }
 * }} props
 */
export default function ConsolePanel({ lastRun }) {
  return (
    <div className="h-56 flex-shrink-0 bg-surface-container-lowest border-t border-outline-variant/20
                    flex flex-col overflow-hidden">
      {!lastRun ? (
        <div className="flex-1 flex items-center justify-center text-xs text-secondary/60">
          Run a query to see its output here.
        </div>
      ) : (
        <>
          <Status lastRun={lastRun} />
          {lastRun.result && <ResultTable result={lastRun.result} />}
        </>
      )}
    </div>
  )
}

function Status({ lastRun }) {
  const style = VERDICT_STYLE[lastRun.verdict]
  return (
    <div className="px-4 py-2 flex items-start gap-2 border-b border-outline-variant/10 flex-shrink-0">
      <span className={`material-symbols-outlined text-base ${style.color}`}>{style.icon}</span>
      <div className="text-xs leading-5 min-w-0">
        <span className={`font-display uppercase tracking-widest mr-2 ${style.color}`}>{style.label}</span>
        <span className="text-on-surface/80 font-mono break-words">{lastRun.message}</span>
      </div>
    </div>
  )
}

function ResultTable({ result }) {
  const { columns, rows } = result
  const shown = rows.slice(0, MAX_ROWS)

  return (
    <div className="flex-1 overflow-auto">
      <table className="text-left border-collapse whitespace-nowrap">
        <thead className="sticky top-0 bg-surface-container-low">
          <tr>
            {columns.map((c, i) => (
              <th key={i} className="px-4 py-1.5 font-mono text-xs text-secondary font-semibold">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {shown.map((row, ri) => (
            <tr key={ri} className="border-t border-outline-variant/5">
              {row.map((cell, ci) => (
                <td key={ci} className="px-4 py-1 font-mono text-xs text-on-surface/80">
                  {cell === null ? <span className="text-secondary/50 italic">NULL</span> : cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="px-4 py-1.5 text-[11px] text-secondary/60 font-mono">
        {rows.length} row{rows.length === 1 ? '' : 's'}
        {rows.length > MAX_ROWS && ` (showing first ${MAX_ROWS})`}
      </div>
    </div>
  )
}
