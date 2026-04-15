/**
 * QuestionPanel — left split-panel of the GameScreen.
 *
 * Renders live question data passed from GameScreen:
 *   • Sticky sub-header : level badge + challenge title
 *   • Scrollable body   :
 *       – Objective / prompt
 *       – Schema table(s) — one section per table in question.schema
 *       – Sample data     — up to 4 rows per table
 *       – Expected output — column headers + up to 3 preview rows
 *
 * When `question` is null (loading), a centred spinner placeholder is shown
 * so the layout never shifts on first paint.
 *
 * @param {{ question: object | null }} props
 */
export default function QuestionPanel({ question }) {
  if (!question) {
    return (
      <section className="w-[45%] bg-surface-container-low flex items-center justify-center
                          border-r border-outline-variant/10">
        <span className="font-display text-xs uppercase tracking-widest text-secondary/40">
          Loading…
        </span>
      </section>
    )
  }

  const { title, prompt, schema, sampleData, expectedOutput } = question

  return (
    <section className="w-[45%] bg-surface-container-low flex flex-col
                        border-r border-outline-variant/10 overflow-hidden">

      {/* ── Sub-header ── */}
      <div className="px-6 py-4 bg-surface-container flex items-center justify-between
                      flex-shrink-0 border-b border-outline-variant/10">
        <div className="flex items-center gap-3">
          <span className="px-2.5 py-1 bg-secondary-container/30 text-secondary text-xs
                           font-display rounded border border-secondary/20 uppercase tracking-wider">
            {question.difficulty}
          </span>
          <h2 className="font-display text-lg font-semibold tracking-tight text-white">
            {title}
          </h2>
        </div>
        <span className="material-symbols-outlined text-secondary text-base">info</span>
      </div>

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto px-6 py-8 space-y-10">

        {/* Objective */}
        <div>
          <SectionLabel>Objective</SectionLabel>
          <p className="text-on-surface text-base leading-7">{prompt}</p>
        </div>

        {/* Schema — one block per table */}
        {schema.map(table => (
          <div key={table.tableName}>
            <SectionLabel>
              Table Schema:{' '}
              <code className="text-primary tracking-normal lowercase font-mono text-sm">
                {table.tableName}
              </code>
            </SectionLabel>
            <div className="bg-surface-container-lowest rounded border border-outline-variant/10 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-highest/30 text-secondary
                                 border-b border-outline-variant/10">
                    <th className="px-5 py-3 font-display text-xs uppercase tracking-wider font-medium">Column</th>
                    <th className="px-5 py-3 font-display text-xs uppercase tracking-wider font-medium">Type</th>
                    <th className="px-5 py-3 font-display text-xs uppercase tracking-wider font-medium">Constraint</th>
                  </tr>
                </thead>
                <tbody className="text-on-surface/90">
                  {table.columns.map((col, i) => (
                    <SchemaRow
                      key={col.name}
                      col={col.name}
                      type={col.type}
                      constraint={col.constraint}
                      isLast={i === table.columns.length - 1}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}

        {/* Sample Data — one block per table */}
        {schema.map(table => {
          const rows = sampleData[table.tableName]
          if (!rows?.length) return null
          const cols = Object.keys(rows[0])
          const preview = rows.slice(0, 4)

          return (
            <div key={`sample-${table.tableName}`}>
              <SectionLabel>
                Sample Data:{' '}
                <code className="text-primary tracking-normal lowercase font-mono text-sm">
                  {table.tableName}
                </code>
              </SectionLabel>
              <div className="bg-surface-container-lowest rounded border border-outline-variant/10 overflow-hidden overflow-x-auto">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="bg-surface-container-highest/30 text-secondary
                                   border-b border-outline-variant/10">
                      {cols.map(c => (
                        <th key={c} className="px-4 py-2.5 font-mono text-xs font-normal">{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, ri) => (
                      <tr key={ri} className={ri < preview.length - 1
                        ? 'border-b border-outline-variant/5' : ''}>
                        {cols.map(c => (
                          <td key={c} className="px-4 py-2.5 text-sm text-on-surface/70 font-mono">
                            {String(row[c])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        })}

        {/* Expected Output */}
        <div>
          <SectionLabel>Expected Output Format</SectionLabel>
          <div className="bg-surface-container-lowest rounded border border-outline-variant/10 overflow-hidden">
            {/* Meta bar */}
            <div className="bg-surface-container-highest/20 px-5 py-2 flex justify-between
                            items-center border-b border-outline-variant/10">
              <span className="text-xs text-secondary font-mono">
                {expectedOutput.columns.length} column{expectedOutput.columns.length !== 1 ? 's' : ''} expected
              </span>
              <span className="material-symbols-outlined text-base text-secondary/40">table_rows</span>
            </div>
            {/* Preview table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="border-b border-outline-variant/10">
                    {expectedOutput.columns.map(col => (
                      <th key={col}
                          className="px-5 py-3 font-mono text-sm text-secondary font-semibold">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {expectedOutput.rows.slice(0, 3).map((row, ri) => (
                    <tr key={ri}
                        className={ri < Math.min(expectedOutput.rows.length, 3) - 1
                          ? 'border-b border-outline-variant/5' : ''}>
                      {row.map((cell, ci) => (
                        <td key={ci} className="px-5 py-3 text-sm font-mono text-on-surface">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}

/* ── Internal helpers ─────────────────────────────────────────────────────── */

function SectionLabel({ children }) {
  return (
    <h3 className="font-display text-xs uppercase tracking-[0.18em] text-secondary mb-4 flex items-center gap-2">
      {children}
    </h3>
  )
}

function SchemaRow({ col, type, constraint, isLast }) {
  return (
    <tr className={isLast ? '' : 'border-b border-outline-variant/5'}>
      <td className="px-5 py-3 font-mono text-sm text-on-surface">{col}</td>
      <td className="px-5 py-3 text-sm text-on-surface/55 font-mono">{type}</td>
      <td className="px-5 py-3">
        <span className="text-xs font-display text-secondary bg-surface-container-highest/40
                         px-2 py-0.5 rounded border border-outline-variant/10">
          {constraint}
        </span>
      </td>
    </tr>
  )
}
