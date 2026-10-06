import { useEffect, useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useActiveMatch } from '../hooks/useActiveMatch'
import { useRealtimeMatch } from '../hooks/useRealtimeMatch'
import { useBroadcastPhase } from '../hooks/useBroadcastPhase'
import Scoreboard from '../components/scoreboard/Scoreboard'

function Frame({ children, transparent }: { children?: ReactNode; transparent?: boolean }) {
  useEffect(() => {
    if (!transparent) return
    const root = document.documentElement
    root.classList.add('obs-overlay')
    return () => root.classList.remove('obs-overlay')
  }, [transparent])
  return (
    <div className="fixed inset-0 overflow-hidden" style={{ background: transparent ? 'transparent' : '#02040c' }}>
      {children}
    </div>
  )
}

export default function Projection() {
  const [params] = useSearchParams()
  const preview = params.get('preview') === '1'
  const obs = params.get('obs') === '1'
  const { matchId, loading: finding } = useActiveMatch()
  const { match, players, stats, loading, connection } = useRealtimeMatch(matchId)
  const [showLost, setShowLost] = useState(false)
  const phase = useBroadcastPhase(match?.status, preview, match?.id)

  useEffect(() => {
    if (connection !== 'disconnected') { setShowLost(false); return }
    const t = window.setTimeout(() => setShowLost(true), 3000)
    return () => window.clearTimeout(t)
  }, [connection])

  if (finding || (matchId && loading) || !matchId || !match) {
    return <Frame transparent={obs} />
  }
  const p1 = players[match.player1_id]
  const p2 = players[match.player2_id]
  if (!p1 || !p2) return <Frame transparent={obs} />

  return (
    <Frame transparent={obs}>
      <Scoreboard match={match} p1={p1} p2={p2} stats={stats} overlay={obs} phase={phase} />
      {phase !== 'idle' && (
        <div className="absolute bottom-4 right-6 z-40 text-sm font-bold tracking-widest" style={{
          color: showLost ? '#fbbf24' : '#4ade80',
          textShadow: '0 1px 6px #000',
          pointerEvents: 'none',
        }}>
          {showLost ? 'CONNECTION LOST' : connection === 'connected' ? '● LIVE' : ''}
        </div>
      )}
    </Frame>
  )
}
