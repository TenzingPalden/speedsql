/**
 * sqlCore — environment-agnostic helpers for running and grading queries
 * against a PGlite (in-browser Postgres) instance.
 *
 * Used by the Web Worker in the browser (sqlWorker.js) and directly by the
 * Node verification script (scripts/verify-questions.mjs), so it must not
 * touch `window`, `self`, or any DOM API.
 */

// ─── Raw-text parsers ─────────────────────────────────────────────────────────
/**
 * PGlite converts results into JS values (Date, number, boolean …) by type
 * OID. We want Postgres's own text output instead — it is exactly what psql
 * would print, needs no timezone handling, and compares predictably.
 * Mapping every built-in OID (< 16384) to identity disables all conversion;
 * user-defined types above that range have no default parser anyway.
 */
const RAW_TEXT_PARSERS = {}
for (let oid = 0; oid < 16384; oid++) RAW_TEXT_PARSERS[oid] = v => v

const BOOL_OID = 16

// ─── Database setup ───────────────────────────────────────────────────────────
function quoteIdent(name) {
  return '"' + String(name).replace(/"/g, '""') + '"'
}

/**
 * Wipe everything the previous query may have left behind and rebuild the
 * question's tables from its schema + sampleData.
 *
 * Constraints are intentionally omitted: sample rows sometimes list only the
 * columns relevant to the question, and FK targets may not be present.
 */
export async function resetDatabase(db, question) {
  // A player query like BEGIN or SET search_path could leave the session in
  // an odd state — roll back and reset before rebuilding. ROLLBACK outside a
  // transaction only raises a warning.
  let script = 'ROLLBACK; RESET ALL; DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public; SET search_path TO public;\n'

  for (const table of question.schema) {
    const cols = table.columns.map(c => `${quoteIdent(c.name)} ${c.type}`).join(', ')
    script += `CREATE TABLE ${quoteIdent(table.tableName)} (${cols});\n`
  }
  await db.exec(script)

  for (const table of question.schema) {
    const rows = question.sampleData[table.tableName] ?? []
    if (!rows.length) continue
    const colNames = Object.keys(rows[0])
    const params   = []
    const tuples   = rows.map(row =>
      '(' + colNames.map(c => { params.push(row[c]); return '$' + params.length }).join(', ') + ')'
    )
    await db.query(
      `INSERT INTO ${quoteIdent(table.tableName)} (${colNames.map(quoteIdent).join(', ')}) VALUES ${tuples.join(', ')}`,
      params,
    )
  }
}

/**
 * Run a single SQL statement and return its result as plain strings.
 * db.query uses the extended protocol, which rejects multiple statements —
 * exactly what we want for a "one answer" game.
 *
 * @returns {{ columns: string[], rows: (string|null)[][] }}
 */
export async function runQuery(db, sql) {
  const res = await db.query(sql, [], { rowMode: 'array', parsers: RAW_TEXT_PARSERS })
  const fields = res.fields ?? []
  const rows = (res.rows ?? []).map(row =>
    row.map((v, i) =>
      v === null ? null
        : fields[i]?.dataTypeID === BOOL_OID ? (v === 't' ? 'true' : 'false')
        : String(v)
    )
  )
  return { columns: fields.map(f => f.name), rows }
}

/** Reset the database to the question's data, then run `sql` against it. */
export async function runOnFreshData(db, question, sql) {
  await resetDatabase(db, question)
  return runQuery(db, sql)
}

// ─── Grading ──────────────────────────────────────────────────────────────────
/**
 * True when the query's outermost level has an ORDER BY — i.e. row order is
 * part of the answer. ORDER BY inside parentheses (window functions,
 * subqueries) doesn't count.
 */
export function hasTopLevelOrderBy(sql) {
  let s = sql
    .replace(/--[^\n]*/g, ' ')
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/'(?:[^']|'')*'/g, "''")
  let prev
  do { prev = s; s = s.replace(/\([^()]*\)/g, ' ') } while (s !== prev)
  return /\border\s+by\b/i.test(s)
}

const NUMERIC_RE = /^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/i

/** Canonical form of a cell for comparison: numbers compare by value. */
function cellKey(v) {
  if (v === null) return '\u0000NULL'
  if (NUMERIC_RE.test(v)) return String(Number(v))
  return v
}

const rowKey = row => JSON.stringify(row.map(cellKey))

/**
 * Compare the player's result against the reference result.
 * Column *names* are ignored (aliases are the player's business); column
 * count, column order, values and — when the reference query has a top-level
 * ORDER BY — row order must all match.
 *
 * @returns {{ correct: boolean, reason?: string }}
 */
export function compareResults(expected, actual, ordered) {
  if (actual.columns.length !== expected.columns.length) {
    return {
      correct: false,
      reason: `Expected ${expected.columns.length} column${expected.columns.length === 1 ? '' : 's'} ` +
              `(${expected.columns.join(', ')}), got ${actual.columns.length}.`,
    }
  }
  if (actual.rows.length !== expected.rows.length) {
    return {
      correct: false,
      reason: `Expected ${expected.rows.length} row${expected.rows.length === 1 ? '' : 's'}, got ${actual.rows.length}.`,
    }
  }

  const expKeys = expected.rows.map(rowKey)
  const actKeys = actual.rows.map(rowKey)

  const sameSet = [...expKeys].sort().join('\n') === [...actKeys].sort().join('\n')
  if (!sameSet) {
    const i = actKeys.findIndex(k => !expKeys.includes(k))
    return { correct: false, reason: `Row ${i + 1} of your result isn't in the expected output.` }
  }
  if (ordered) {
    const i = actKeys.findIndex((k, idx) => k !== expKeys[idx])
    if (i !== -1) {
      return { correct: false, reason: `Right rows, wrong order — first difference at row ${i + 1}.` }
    }
  }
  return { correct: true }
}
