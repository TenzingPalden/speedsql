import { useRef, useEffect, useCallback } from 'react'

/**
 * useSounds — synthesised sound effects via the Web Audio API.
 *
 * No audio files are needed; every sound is generated on the fly from
 * oscillators and gain envelopes.
 *
 * The AudioContext is created lazily on the first call so the browser's
 * autoplay policy never blocks it (it only activates after a user gesture).
 *
 * All returned functions are stable references (useCallback with no
 * state deps). soundOn changes are tracked through a ref so the callbacks
 * never need to be recreated — this keeps them safe to list as effect deps
 * without causing spurious re-runs.
 *
 * @param {boolean} soundOn  – when false every play function is a no-op.
 * @returns {{ playCorrect: Function, playIncorrect: Function, playTick: Function }}
 */
export function useSounds(soundOn) {
  // ── Shared AudioContext ─────────────────────────────────────────────────────
  const ctxRef = useRef(null)

  // Mirror soundOn into a ref so callbacks stay stable across toggles.
  const soundOnRef = useRef(soundOn)
  useEffect(() => { soundOnRef.current = soundOn }, [soundOn])

  /** Lazy-init the AudioContext; resume it if the browser suspended it. */
  const getCtx = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext || window.webkitAudioContext)()
    }
    if (ctxRef.current.state === 'suspended') {
      ctxRef.current.resume()
    }
    return ctxRef.current
  }, []) // never changes

  // ── Correct answer — two-note ascending chime (E5 → G5) ────────────────────
  /**
   * Two overlapping sine tones with a quick linear attack and a smooth
   * exponential decay. The ascending interval (minor third) reads as
   * "achievement" without being jarring.
   */
  const playCorrect = useCallback(() => {
    if (!soundOnRef.current) return
    const ctx = getCtx()
    const t   = ctx.currentTime

    const notes = [
      { freq: 659.25, delay: 0,    duration: 0.45 }, // E5
      { freq: 783.99, delay: 0.12, duration: 0.55 }, // G5
    ]

    notes.forEach(({ freq, delay, duration }) => {
      const osc  = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.type           = 'sine'
      osc.frequency.value = freq

      // Attack in 12 ms → exponential tail
      gain.gain.setValueAtTime(0, t + delay)
      gain.gain.linearRampToValueAtTime(0.28, t + delay + 0.012)
      gain.gain.exponentialRampToValueAtTime(0.0001, t + delay + duration)

      osc.start(t + delay)
      osc.stop(t + delay + duration)
    })
  }, [getCtx])

  // ── Incorrect answer — filtered sawtooth buzz ───────────────────────────────
  /**
   * A descending sawtooth (220 Hz → 80 Hz) with a low-pass filter at 400 Hz
   * to round off the harshness. Reads as "wrong" without being abrasive.
   */
  const playIncorrect = useCallback(() => {
    if (!soundOnRef.current) return
    const ctx = getCtx()
    const t   = ctx.currentTime

    const osc    = ctx.createOscillator()
    const filter = ctx.createBiquadFilter()
    const gain   = ctx.createGain()

    osc.connect(filter)
    filter.connect(gain)
    gain.connect(ctx.destination)

    filter.type            = 'lowpass'
    filter.frequency.value = 400

    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(220, t)
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.35)

    gain.gain.setValueAtTime(0.22, t)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.35)

    osc.start(t)
    osc.stop(t + 0.35)
  }, [getCtx])

  // ── Per-second tick — short sine pop ───────────────────────────────────────
  /**
   * A 50 ms sine burst at 880 Hz.
   * Volume scales from 0.08 (at 10 s) to 0.20 (at 1 s) so urgency builds
   * naturally as time runs out. Stops automatically when the caller stops
   * calling it (i.e. when timeLeft > 10 or the game ends).
   *
   * @param {number} timeLeft  – current seconds remaining (used for urgency scaling).
   */
  const playTick = useCallback((timeLeft = 10) => {
    if (!soundOnRef.current) return
    const ctx = getCtx()
    const t   = ctx.currentTime

    // 0 at 10 s → 1 at 1 s; clamp to [0,1]
    const urgency = Math.min(1, Math.max(0, 1 - (timeLeft - 1) / 9))
    const vol     = 0.08 + urgency * 0.12  // 0.08 → 0.20

    const osc  = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.type            = 'sine'
    osc.frequency.value = 880

    gain.gain.setValueAtTime(vol, t)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.05)

    osc.start(t)
    osc.stop(t + 0.05)
  }, [getCtx])

  return { playCorrect, playIncorrect, playTick }
}
