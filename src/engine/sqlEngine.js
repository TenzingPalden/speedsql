import { useEffect, useSyncExternalStore } from 'react'
import { compareResults, hasTopLevelOrderBy } from './sqlCore'

/**
 * sqlEngine — main-thread client for the PGlite worker.
 *
 * Answers are graded by *result*, not by text: the reference solution and the
 * player's query both run against the question's sample data, and the two
 * result sets are compared (see compareResults). Any query that returns the
 * right rows passes, whatever joins, aliases or CTEs it uses.
 *
 * If the database fails to boot (very old browser, blocked WASM), grading
 * falls back to the original normalised-text comparison so the game still
 * works.
 */

const INIT_TIMEOUT_MS  = 30_000
const QUERY_TIMEOUT_MS = 5_000

// ─── Status store (consumed by React via useSqlEngine) ────────────────────────
/** @type {{ status: 'idle'|'loading'|'ready'|'error', version: string|null, error: string|null }} */
let state = { status: 'idle', version: null, error: null }
const listeners = new Set()

function setState(patch) {
  state = { ...state, ...patch }
  listeners.forEach(fn => fn())
}

function subscribe(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

/** React hook — current engine status; also kicks off the boot on first use. */
export function useSqlEngine() {
  useEffect(() => { startEngine() }, [])
  return useSyncExternalStore(subscribe, () => state)
}

// ─── Worker plumbing ──────────────────────────────────────────────────────────
let worker      = null
let readyPromise = null
let nextId      = 1
const pending   = new Map()   // id → { resolve, reject, timer }

function spawnWorker() {
  worker = new Worker(new URL('./sqlWorker.js', import.meta.url), { type: 'module' })
  worker.onmessage = ({ data }) => {
    const entry = pending.get(data.id)
    if (!entry) return
    pending.delete(data.id)
    clearTimeout(entry.timer)
    data.ok ? entry.resolve(data.result) : entry.reject(new Error(data.error))
  }
  worker.onerror = e => {
    e.preventDefault?.()
    failAll(new Error(e.message || 'Database worker crashed'))
    setState({ status: 'error', error: e.message || 'Database worker crashed' })
  }
}

function failAll(err) {
  for (const { reject, timer } of pending.values()) { clearTimeout(timer); reject(err) }
  pending.clear()
}

/** Kill a wedged worker (e.g. an infinite recursive CTE) and boot a fresh one. */
function restartWorker() {
  worker?.terminate()
  worker = null
  readyPromise = null
  failAll(new Error('Database restarted'))
  startEngine()
}

function send(message, timeoutMs) {
  return new Promise((resolve, reject) => {
    const id = nextId++
    const timer = setTimeout(() => {
      pending.delete(id)
      reject(Object.assign(new Error('timeout'), { timeout: true }))
    }, timeoutMs)
    pending.set(id, { resolve, reject, timer })
    worker.postMessage({ id, ...message })
  })
}

/** Boot the database once; safe to call repeatedly. */
export function startEngine() {
  if (readyPromise) return readyPromise
  if (typeof Worker === 'undefined') {
    setState({ status: 'error', error: 'Web Workers are not supported in this browser' })
    return (readyPromise = Promise.resolve(false))
  }
  setState({ status: 'loading', error: null })
  try {
    spawnWorker()
  } catch (err) {
    setState({ status: 'error', error: err.message })
    return (readyPromise = Promise.resolve(false))
  }
  readyPromise = send({ type: 'init' }, INIT_TIMEOUT_MS).then(
    version => { setState({ status: 'ready', version }); return true },
    err => {
      setState({ status: 'error', error: err.timeout ? 'Database took too long to start' : err.message })
      return false
    },
  )
  return readyPromise
}

async function run(question, sql) {
  try {
    return await send({ type: 'run', question, sql }, QUERY_TIMEOUT_MS)
  } catch (err) {
    if (err.timeout) {
      restartWorker()
      throw new Error(`Query timed out after ${QUERY_TIMEOUT_MS / 1000} s — the database was restarted.`)
    }
    throw err
  }
}

// ─── Grading ──────────────────────────────────────────────────────────────────
/** Reference results, keyed by question id — computed once per question. */
const expectedCache = new Map()

async function getExpected(question) {
  if (!expectedCache.has(question.id)) {
    expectedCache.set(question.id, await run(question, question.correctSql))
  }
  return expectedCache.get(question.id)
}

/** Warm the reference result while the player is still reading the question. */
export function prepareQuestion(question) {
  startEngine().then(ok => { if (ok) getExpected(question).catch(() => {}) })
}

/**
 * Grade a submission.
 *
 * @returns {Promise<{
 *   verdict: 'correct' | 'incorrect' | 'error',
 *   message: string,
 *   result?: { columns: string[], rows: (string|null)[][] },
 *   mode:    'engine' | 'text',
 * }>}
 */
export async function checkAnswer(question, sql) {
  const ok = await startEngine()
  if (!ok) return checkByText(question, sql)

  let expected
  try {
    expected = await getExpected(question)
  } catch (err) {
    // The reference solution itself failed — a bug in the question bank,
    // not the player's fault. Don't block play; grade by text instead.
    console.error(`Reference SQL for question ${question.id} failed:`, err)
    return checkByText(question, sql)
  }

  let result
  try {
    result = await run(question, sql)
  } catch (err) {
    return { verdict: 'error', message: err.message, mode: 'engine' }
  }

  const { correct, reason } = compareResults(expected, result, hasTopLevelOrderBy(question.correctSql))
  return {
    verdict: correct ? 'correct' : 'incorrect',
    message: correct ? 'Result matches the expected output.' : reason,
    result,
    mode: 'engine',
  }
}

// ─── Text-match fallback ──────────────────────────────────────────────────────
/**
 * Reduce a SQL string to a canonical form for loose comparison: lowercase,
 * comments stripped, trailing semicolon dropped, whitespace collapsed.
 */
function normalizeSql(raw) {
  return raw
    .trim()
    .toLowerCase()
    .replace(/--[^\n]*/g, ' ')
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/;+\s*$/, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function checkByText(question, sql) {
  const correct = normalizeSql(sql) === normalizeSql(question.correctSql)
  return {
    verdict: correct ? 'correct' : 'incorrect',
    message: correct
      ? 'Matches the reference solution.'
      : "Doesn't match the reference solution (database unavailable, so answers are compared as text).",
    mode: 'text',
  }
}
