import type { ScanOutcome } from '@/types/domain'

/**
 * Distinct audible + haptic feedback per scan outcome (FR-052).
 *
 * The assistant is not looking at the screen while scanning a queue of
 * students — they are looking at the students. So each outcome has its own
 * sound: a short bright tone for OK, a lower double-buzz for unpaid, a harsh
 * low tone for a rejection. This is the primary channel; the colour and text
 * on screen are the confirmation, not the alert.
 */

type Tone = { freq: number; duration: number; type: OscillatorType; gap?: number }

const PATTERNS: Record<'ok' | 'warn' | 'stop', Tone[]> = {
  // Rising, pleasant — proceed.
  ok: [{ freq: 660, duration: 90, type: 'sine' }, { freq: 990, duration: 120, type: 'sine', gap: 20 }],
  // Two flat mid buzzes — attention, go to the desk.
  warn: [
    { freq: 480, duration: 130, type: 'square' },
    { freq: 480, duration: 130, type: 'square', gap: 90 },
  ],
  // Low, harsh — stop.
  stop: [{ freq: 200, duration: 320, type: 'sawtooth' }],
}

function outcomeTone(outcome: ScanOutcome): 'ok' | 'warn' | 'stop' {
  switch (outcome) {
    case 'ok':
      return 'ok'
    case 'unpaid':
    case 'duplicate':
      return 'warn'
    default:
      return 'stop'
  }
}

let ctx: AudioContext | null = null

export function playScanFeedback(outcome: ScanOutcome) {
  const kind = outcomeTone(outcome)

  // Haptics where supported (Android). Distinct patterns mirror the tones.
  if ('vibrate' in navigator) {
    navigator.vibrate(kind === 'ok' ? 40 : kind === 'warn' ? [60, 50, 60] : [200])
  }

  try {
    ctx ??= new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    if (ctx.state === 'suspended') void ctx.resume()
    let when = ctx.currentTime
    for (const tone of PATTERNS[kind]) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = tone.type
      osc.frequency.value = tone.freq
      gain.gain.setValueAtTime(0.0001, when)
      gain.gain.exponentialRampToValueAtTime(0.25, when + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.0001, when + tone.duration / 1000)
      osc.connect(gain).connect(ctx.destination)
      osc.start(when)
      osc.stop(when + tone.duration / 1000)
      when += (tone.duration + (tone.gap ?? 0)) / 1000
    }
  } catch {
    // Audio blocked until the first user gesture — the visual result still shows.
  }
}
