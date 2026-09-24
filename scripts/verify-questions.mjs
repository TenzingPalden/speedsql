/**
 * verify-questions — run every question's correctSql against its sampleData
 * in PGlite and check the result matches the expectedOutput shown to players.
 *
 *   npm run verify:questions
 *
 * Run this after adding or editing questions in src/data/questions.js.
 */
import { PGlite } from '@electric-sql/pglite'
import { questions } from '../src/data/questions.js'
import { runOnFreshData, compareResults, hasTopLevelOrderBy } from '../src/engine/sqlCore.js'

const db = await PGlite.create()
let failures = 0

for (const q of questions) {
  const label = `#${q.id} ${q.difficulty.padEnd(6)} ${q.title}`
  try {
    const actual = await runOnFreshData(db, q, q.correctSql)
    // expectedOutput is display data — it writes SQL NULL as the string 'NULL'.
    const expected = {
      columns: q.expectedOutput.columns,
      rows:    q.expectedOutput.rows.map(r => r.map(c => (c === 'NULL' ? null : c))),
    }
    const verdict = compareResults(expected, actual, hasTopLevelOrderBy(q.correctSql))
    if (verdict.correct) {
      console.log(`ok    ${label}`)
    } else {
      failures++
      console.log(`FAIL  ${label}\n      ${verdict.reason}`)
      console.log('      expected:', JSON.stringify(q.expectedOutput.rows))
      console.log('      actual:  ', JSON.stringify(actual.rows))
    }
  } catch (err) {
    failures++
    console.log(`ERROR ${label}\n      ${err.message}`)
  }
}

await db.close()
console.log(failures ? `\n${failures} question(s) need attention.` : '\nAll questions verified.')
process.exit(failures ? 1 : 0)
