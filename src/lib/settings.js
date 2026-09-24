/**
 * settings — persisted player preferences (localStorage).
 *
 * Every access is wrapped in try/catch: storage can be unavailable (private
 * windows, blocked site data) and the game must still run on defaults.
 */

export const DIFFICULTIES = ['Easy', 'Medium', 'Hard']

const DIFFICULTY_KEY = 'speedsql-difficulty'
const SOUND_KEY      = 'speedsql-sound'

function read(key) {
  try { return localStorage.getItem(key) } catch { return null }
}

function write(key, value) {
  try { localStorage.setItem(key, value) } catch { /* storage unavailable */ }
}

/** Starting difficulty for a new game. Defaults to Easy. */
export function loadDifficulty() {
  const v = read(DIFFICULTY_KEY)
  return DIFFICULTIES.includes(v) ? v : 'Easy'
}

export function saveDifficulty(difficulty) {
  write(DIFFICULTY_KEY, difficulty)
}

export function loadSoundOn() {
  return read(SOUND_KEY) !== 'false'
}

export function saveSoundOn(on) {
  write(SOUND_KEY, String(on))
}
