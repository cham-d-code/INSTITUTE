/**
 * Tiny deterministic PRNG (mulberry32) so the seeded demo dataset is stable
 * across reloads — the same student always gets the same guardians, the same
 * classes always have the same rosters. Deterministic data makes the UI
 * reviewable without values jumping around on every refresh.
 *
 * This is demo-data scaffolding only. It has nothing to do with the QR token
 * generation (FR-041), which is the server's job and must use real CSPRNG
 * randomness — never this.
 */
export function makeRng(seed: number) {
  let a = seed >>> 0
  const next = () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  return {
    next,
    /** Integer in [min, max]. */
    int: (min: number, max: number) => Math.floor(next() * (max - min + 1)) + min,
    /** A random element. */
    pick: <T>(arr: readonly T[]): T => arr[Math.floor(next() * arr.length)],
    /** True with probability p. */
    chance: (p: number) => next() < p,
    /** k distinct elements (or fewer if the pool is smaller). */
    sample: <T>(arr: readonly T[], k: number): T[] => {
      const copy = [...arr]
      const out: T[] = []
      while (out.length < k && copy.length) {
        out.push(copy.splice(Math.floor(next() * copy.length), 1)[0])
      }
      return out
    },
  }
}
