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

// ─── Forgiving grading: automatic repair of small mistakes ────────────────────
/**
 * The game shouldn't punish slips in SQL's own syntax, so when Postgres
 * rejects a player's query for one we fix it and try again (up to MAX_FIXES):
 *
 *   • column "X" does not exist, X written in double quotes — it was meant
 *     as a string: "Electronics" → 'Electronics'. (If X is a real column in
 *     the wrong case, "First_Name", the quotes are dropped instead.)
 *   • function x() does not exist — typo of a common function → nearest.
 *   • syntax error — words one edit away from a SQL keyword (SELEC, FORM).
 *
 * Table, column and alias names are the player's to get right — misspelling
 * one is still an error (the editor autocompletes them with Tab).
 *
 * Repairs are driven by the actual Postgres error, so a query that already
 * runs is never touched, and a word is only replaced when exactly one
 * candidate is close enough (no guessing between two equally close ones).
 */
const MAX_FIXES = 6

const KEYWORDS = [
  'select', 'from', 'where', 'group', 'order', 'by', 'having', 'join', 'inner',
  'left', 'right', 'full', 'outer', 'cross', 'on', 'using', 'and', 'or', 'not',
  'as', 'limit', 'offset', 'distinct', 'union', 'all', 'with', 'case', 'when',
  'then', 'else', 'end', 'between', 'like', 'ilike', 'in', 'is', 'null', 'asc',
  'desc', 'over', 'partition', 'rows', 'exists', 'true', 'false',
]

const FUNCTIONS = [
  'count', 'sum', 'avg', 'min', 'max', 'round', 'rank', 'dense_rank',
  'row_number', 'lag', 'lead', 'date_trunc', 'extract', 'coalesce', 'age',
  'upper', 'lower', 'length', 'concat', 'abs', 'now', 'cast', 'nullif',
]

/** Optimal-string-alignment distance (Levenshtein + adjacent transposition). */
function editDistance(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)])
  for (let j = 1; j <= b.length; j++) d[0][j] = j
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost)
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1)
      }
    }
  }
  return d[a.length][b.length]
}

/**
 * The single candidate within `maxDist` edits of `word` (case-insensitive),
 * or null when none — or more than one equally close — qualifies.
 */
function closest(word, candidates, maxDist) {
  const w = word.toLowerCase()
  let best = null, bestDist = Infinity, tie = false
  for (const c of new Set(candidates)) {
    const dist = editDistance(w, c)
    if (dist < bestDist) { best = c; bestDist = dist; tie = false }
    else if (dist === bestDist) tie = true
  }
  return best !== null && bestDist <= maxDist && !tie ? best : null
}

/** Typo tolerance: 1 edit for short names, 2 for longer ones. */
const typoBudget = word => (word.length <= 4 ? 1 : 2)

/** Apply `fn` to the parts of `sql` outside single-quoted string literals. */
function outsideStrings(sql, fn) {
  return sql
    .split(/('(?:[^']|'')*')/)
    .map((part, i) => (i % 2 ? part : fn(part)))
    .join('')
}

const escapeRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

function replaceWord(sql, word, replacement) {
  const re = new RegExp(`(?<![\\w"])${escapeRe(word)}(?![\\w"])`, 'gi')
  return outsideStrings(sql, part => part.replace(re, replacement))
}

function replaceQuoted(sql, name, replacement) {
  return outsideStrings(sql, part => part.split(`"${name}"`).join(replacement))
}

/** Table names, column names, and aliases the player defined with AS. */
function knownNames(question, sql) {
  const names = []
  for (const t of question.schema) {
    names.push(t.tableName.toLowerCase(), ...t.columns.map(c => c.name.toLowerCase()))
  }
  for (const m of sql.matchAll(/\bas\s+"?(\w+)"?/gi)) names.push(m[1].toLowerCase())
  return names
}

/**
 * Propose one repair for the error Postgres raised, or null.
 * @returns {{ sql: string, note: string } | null}
 */
export function suggestFix(sql, message, question) {
  let m

  if ((m = message.match(/^column "(.+)" does not exist/)) && sql.includes(`"${m[1]}"`)) {
    const name = m[1]
    // Quoted identifier in the wrong case — drop the quotes, Postgres folds it.
    const ident = knownNames(question, sql).find(n => n === name.toLowerCase())
    if (ident) return { sql: replaceQuoted(sql, name, ident), note: `"${name}" → ${ident}` }
    const literal = `'${name.replace(/'/g, "''")}'`
    return { sql: replaceQuoted(sql, name, literal), note: `"${name}" → ${literal} (strings use single quotes)` }
  }

  if ((m = message.match(/^function (\w+)\(/))) {
    const fn = closest(m[1], FUNCTIONS, typoBudget(m[1]))
    if (!fn || fn === m[1].toLowerCase()) return null
    return { sql: replaceWord(sql, m[1], fn), note: `${m[1]}() → ${fn}()` }
  }

  if (/^syntax error/.test(message)) {
    // Find the first bare word that isn't valid anywhere but is one edit
    // away from a keyword. Postgres often reports the token *after* the
    // misspelling (FORM products → "near products"), so scan the query.
    const valid = new Set([...KEYWORDS, ...FUNCTIONS, ...knownNames(question, sql)])
    let fix = null
    outsideStrings(sql, part => {
      for (const w of part.replace(/"[^"]*"/g, ' ').match(/[A-Za-z_]\w*/g) ?? []) {
        if (fix || w.length < 3 || valid.has(w.toLowerCase())) continue
        const kw = closest(w, KEYWORDS, 1)
        if (kw) fix = { word: w, kw }
      }
      return part
    })
    if (!fix) return null
    return { sql: replaceWord(sql, fix.word, fix.kw.toUpperCase()), note: `${fix.word} → ${fix.kw.toUpperCase()}` }
  }

  return null
}

/**
 * Run a player's query, repairing small mistakes Postgres complains about.
 * Throws the *original* error if the query can't be repaired into one that
 * runs — the player should see what they actually wrote wrong.
 *
 * @returns {{ columns: string[], rows: (string|null)[][], fixes: string[] }}
 */
export async function runForgiving(db, question, sql) {
  const fixes = []
  let current = sql
  let firstError = null
  for (let attempt = 0; attempt <= MAX_FIXES; attempt++) {
    try {
      return { ...(await runOnFreshData(db, question, current)), fixes }
    } catch (err) {
      firstError ??= err
      const fix = suggestFix(current, err?.message ?? '', question)
      if (!fix || fix.sql === current) break
      current = fix.sql
      fixes.push(fix.note)
    }
  }
  throw firstError
}
