// ── Shared scoreboard layout constants ──────────────────────────
// All components import from here; Scoreboard.tsx also imports here.
// This breaks the circular dependency that would occur if child
// components imported constants directly from Scoreboard.tsx.

export const W       = 1920   // Canvas width
export const H       = 1080   // Canvas height
export const SIDE    = 460    // Each player panel width
export const CENTER_W = W - SIDE * 2   // 1000 – centre stats panel width
export const HDR_H   = 142    // Match header height

const YELLOW = '#f6e712'
const CYAN = '#4de2ff'

export const COLORS = { YELLOW, CYAN }

/** Scale a font so the full string stays on screen — never ellipsis. */
export function fontSizeFor(text: string, max: number, min: number, charsAtMax: number) {
  const n = text.trim().length
  if (n <= charsAtMax) return max
  return Math.max(min, Math.round(max * (charsAtMax / n)))
}

/** Vertical name size so every letter fits in `maxH` pixels. */
export function verticalNameSize(text: string, maxH: number, maxPx: number, minPx: number) {
  const n = Math.max(text.trim().length, 1)
  return Math.min(maxPx, Math.max(minPx, Math.floor(maxH / (n * 0.72))))
}
