/**
 * stats — lifetime player statistics, persisted in localStorage.
 *
 * Recorded once per finished game by GameScreen and shown on the Home
 * screen. Like settings.js, every storage access is wrapped so the game
 * still runs when storage is unavailable (stats just won't persist).
 */

const STATS_KEY = 'speedsql-stats'

const EMPTY = {
  gamesPlayed:   0,
  bestScore:     0,
  bestStreak:    0,
  totalCorrect:  0,   // queries graded correct, all games
  totalAttempts: 0,   // queries submitted, all games
}

export function loadStats() {
  try {
    const raw = JSON.parse(localStorage.getItem(STATS_KEY))
    return { ...EMPTY, ...(raw && typeof raw === 'object' ? raw : {}) }
  } catch {
    return { ...EMPTY }
  }
}

/**
 * Fold one finished game into the lifetime stats.
 *
 * @param {{ score: number, maxStreak: number, correct: number, attempts: number }} game
 * @returns {{ stats: typeof EMPTY, isNewBest: boolean }}
 */
export function recordGame({ score, maxStreak, correct, attempts }) {
  const prev = loadStats()
  const stats = {
    gamesPlayed:   prev.gamesPlayed + 1,
    bestScore:     Math.max(prev.bestScore, score),
    bestStreak:    Math.max(prev.bestStreak, maxStreak),
    totalCorrect:  prev.totalCorrect + correct,
    totalAttempts: prev.totalAttempts + attempts,
  }
  try { localStorage.setItem(STATS_KEY, JSON.stringify(stats)) } catch { /* storage unavailable */ }
  return { stats, isNewBest: score > prev.bestScore && score > 0 }
}
