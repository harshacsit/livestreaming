import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { Match, MatchStatistics, Player } from '../../types/database'
import type { BroadcastPhase } from '../../hooks/useBroadcastPhase'
import { statsFor } from '../../lib/rating'
import MatchHeader from './MatchHeader'
import PlayerPanel from './PlayerPanel'
import StatisticsPanel from './StatisticsPanel'
import { W, H, SIDE, CENTER_W, HDR_H } from './constants'

export { W, H, SIDE, CENTER_W, HDR_H }

interface Props {
  match: Match
  p1: Player
  p2: Player
  stats: MatchStatistics[]
  /** Transparent 16:9 canvas for OBS Browser Source. */
  overlay?: boolean
  /** Broadcast enter/exit phase. Omit on the admin preview. */
  phase?: BroadcastPhase
}

export function Stage({
  children, overlay = false,
}: {
  children: ReactNode
  overlay?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: W, h: H })
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const update = () => setSize({ w: el.clientWidth, h: el.clientHeight })
    const ro = new ResizeObserver(update)
    ro.observe(el); update()
    return () => ro.disconnect()
  }, [])
  const s = Math.min(size.w / W, size.h / H)
  return (
    <div ref={ref} style={{
      position: 'relative', width: '100%', height: '100%', overflow: 'hidden',
      background: overlay ? 'transparent' : '#02040c',
    }}>
      <div
        style={{
          position: 'absolute',
          width: W, height: H,
          left: (size.w - W * s) / 2,
          top:  (size.h - H * s) / 2,
          transform: `scale(${s})`,
          transformOrigin: 'top left',
          overflow: 'hidden',
          fontFamily: "'Barlow Condensed', 'Oswald', 'Segoe UI', Arial, sans-serif",
          color: '#fff',
        }}
      >
        {!overlay && <Arena />}
        {children}
      </div>
    </div>
  )
}

function Arena() {
  return (
    <div aria-hidden style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
      <div className="arena-sky" />
      <div className="arena-crowd" />
      <div className="arena-court" />
      <div className="arena-lights" />
      <div className="arena-vignette" />
    </div>
  )
}

export default function Scoreboard({ match, p1, p2, stats, overlay = false, phase }: Props) {
  const s1 = statsFor(stats, p1.id)
  const s2 = statsFor(stats, p2.id)
  const bcast = phase ? `bcast-${phase}` : undefined
  return (
    <Stage overlay={overlay}>
      <div className={`hud-board ${bcast ?? ''}`.trim()} style={{
        position: 'absolute',
        left: 36, right: 36, top: 28, bottom: 28,
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 18,
        overflow: 'hidden',
        zIndex: 2,
        background: 'linear-gradient(180deg, rgba(12,32,190,.55) 0%, rgba(8,18,120,.4) 100%)',
        boxShadow: '0 28px 80px rgba(0,0,0,.65), 0 0 0 1px rgba(255,255,255,.14), inset 0 1px 0 rgba(255,255,255,.18)',
      }}>
        <div className="hud-shine" />
        <MatchHeader match={match} p1={p1} p2={p2} />
        <div style={{ flex: 1, minHeight: 0, display: 'flex', position: 'relative' }}>
          <PlayerPanel side="left"  player={p1} stats={s1} />
          <div className="cin-stats" style={{ flex: 1, minWidth: 0, height: '100%', display: 'flex', overflow: 'hidden' }}>
            <StatisticsPanel a={s1} b={s2} />
          </div>
          <PlayerPanel side="right" player={p2} stats={s2} />
        </div>
      </div>
    </Stage>
  )
}
