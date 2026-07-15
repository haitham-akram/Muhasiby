/**
 * Generates a RFC 4122 v4 UUID.
 * Uses crypto.randomUUID when available (modern browsers/Node 19+),
 * falls back to a manual implementation.
 */
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  // Polyfill
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export function nowISO(): string {
  return new Date().toISOString()
}
