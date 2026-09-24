/**
 * sqlWorker — hosts the PGlite (Postgres-in-WASM) instance off the main
 * thread, so booting the database never stalls the game timer or animations,
 * and a runaway query can be killed by terminating the worker.
 *
 * Protocol (request → response, correlated by `id`):
 *   { id, type: 'init' }                 → { id, ok, result: serverVersion }
 *   { id, type: 'run', question, sql, forgiving }
 *                                        → { id, ok, result: { columns, rows, fixes } }
 *     forgiving: repair small mistakes (typos, "double-quoted" strings) and retry
 *   failures                             → { id, ok: false, error: message }
 */
import { PGlite } from '@electric-sql/pglite'
import { runForgiving, runOnFreshData } from './sqlCore'

let dbPromise = null

function getDb() {
  if (!dbPromise) dbPromise = PGlite.create()
  return dbPromise
}

self.onmessage = async ({ data }) => {
  const { id, type } = data
  try {
    const db = await getDb()
    let result
    if (type === 'init') {
      const res = await db.query('SHOW server_version')
      result = res.rows[0].server_version
    } else if (type === 'run') {
      result = data.forgiving
        ? await runForgiving(db, data.question, data.sql)
        : { ...(await runOnFreshData(db, data.question, data.sql)), fixes: [] }
    } else {
      throw new Error(`Unknown message type: ${type}`)
    }
    self.postMessage({ id, ok: true, result })
  } catch (err) {
    self.postMessage({ id, ok: false, error: err?.message ?? String(err) })
  }
}
