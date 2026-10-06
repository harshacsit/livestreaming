import { useEffect, useRef, useState } from 'react'
import type { MatchStatus } from '../types/database'

export type BroadcastPhase = 'idle' | 'entering' | 'visible' | 'exiting'

export const ENTER_MS = 1500
export const EXIT_MS = 980

/** PAUSED is the existing DB status used for a telecast break. */
export function isBreakStatus(status: MatchStatus | undefined | null) {
  return status === 'PAUSED'
}

/**
 * Opening the projection always plays the scorecard intro once.
 * After that:
 *   PAUSED (Break) → enter once, stay visible (no replay on duplicate updates)
 *   LIVE / FINISHED → exit once, then idle (camera shows through)
 */
export function useBroadcastPhase(
  status: MatchStatus | undefined | null,
  previewAlways = false,
  matchId?: string | null,
) {
  const [phase, setPhase] = useState<BroadcastPhase>('idle')
  const prevStatus = useRef<MatchStatus | null>(null)
  const started = useRef(false)
  const phaseRef = useRef<BroadcastPhase>('idle')
  phaseRef.current = phase

  useEffect(() => {
    started.current = false
    prevStatus.current = null
  }, [matchId])

  useEffect(() => {
    if (!status) {
      setPhase('idle')
      prevStatus.current = null
      started.current = false
      return
    }

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const breakOn = isBreakStatus(status) || previewAlways

    if (!started.current) {
      started.current = true
      prevStatus.current = status
      if (status === 'SCHEDULED' && !previewAlways) { setPhase('idle'); return }
      setPhase(reduce ? 'visible' : 'entering')
      return
    }

    if (prevStatus.current === status) return
    const from = prevStatus.current
    prevStatus.current = status

    const fromBreak = isBreakStatus(from) || previewAlways
    const toBreak = breakOn

    if (!fromBreak && toBreak) {
      setPhase(reduce ? 'visible' : 'entering')
      return
    }
    if ((fromBreak && !toBreak) || (!toBreak && (status === 'LIVE' || status === 'FINISHED'))) {
      if (reduce || phaseRef.current === 'idle') setPhase('idle')
      else setPhase('exiting')
    }
  }, [status, previewAlways])

  useEffect(() => {
    if (phase !== 'entering' && phase !== 'exiting') return
    const ms = phase === 'entering' ? ENTER_MS : EXIT_MS
    const t = window.setTimeout(() => {
      setPhase(p => (p === 'entering' ? 'visible' : p === 'exiting' ? 'idle' : p))
    }, ms)
    return () => window.clearTimeout(t)
  }, [phase])

  return phase
}
