import { useEffect, useRef, useState } from 'react'
import type { MatchStatus } from '../types/database'

export type OverlayPhase = 'IDLE' | 'ENTERING' | 'VISIBLE' | 'EXITING'

export const ENTER_MS = 1350
export const EXIT_MS = 900

/** Broadcast break uses the existing PAUSED match status — no schema change. */
export function isBreakStatus(status: MatchStatus | undefined | null) {
  return status === 'PAUSED'
}

function prefersReducedMotion() {
  return typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Overlay state machine for the OBS projection.
 * Only LIVE → BREAK (PAUSED) enters, and BREAK → LIVE/FINISHED exits.
 * Repeat BREAK updates do not replay the entrance.
 */
export function useBroadcastOverlay(status: MatchStatus | undefined | null) {
  const [phase, setPhase] = useState<OverlayPhase>('IDLE')
  const wasBreak = useRef<boolean | null>(null)

  useEffect(() => {
    if (!status) return
    const wantShow = isBreakStatus(status)
    const prev = wasBreak.current
    wasBreak.current = wantShow

    if (prefersReducedMotion()) {
      setPhase(wantShow ? 'VISIBLE' : 'IDLE')
      return
    }

    if (prev === null) {
      setPhase(wantShow ? 'ENTERING' : 'IDLE')
      return
    }
    if (wantShow && !prev) setPhase('ENTERING')
    else if (!wantShow && prev) setPhase('EXITING')
  }, [status])

  useEffect(() => {
    if (phase !== 'ENTERING' && phase !== 'EXITING') return
    const ms = phase === 'ENTERING' ? ENTER_MS : EXIT_MS
    const t = window.setTimeout(() => {
      setPhase(phase === 'ENTERING' ? 'VISIBLE' : 'IDLE')
    }, ms)
    return () => window.clearTimeout(t)
  }, [phase])

  return phase
}
