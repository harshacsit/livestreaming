import { Link } from 'react-router-dom'
import { useActiveMatch } from '../hooks/useActiveMatch'
import { useRealtimeMatch } from '../hooks/useRealtimeMatch'
import Avatar from '../components/Avatar'
import { STATUS_LABEL, STATUS_STYLE } from '../components/admin/StatusButtons'

export default function AdminDashboard() {
  const { matchId, loading: finding } = useActiveMatch()
  const { match, players, loading } = useRealtimeMatch(matchId)
  const p1 = match ? players[match.player1_id] : undefined
  const p2 = match ? players[match.player2_id] : undefined
  const btn = 'rounded-lg px-5 py-3 font-semibold'
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      {finding || loading ? <p className="text-slate-400">Loading match...</p> : !match || !p1 || !p2 ? (
        <p className="rounded-xl border border-white/10 bg-[#111a3a] p-6 text-slate-300">No live match. Create one in Matches and press Start.</p>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-[#111a3a] p-6">
          <div className="mb-4 flex items-center justify-between">
            <div><div className="text-lg font-bold">{match.event_name || 'Untitled event'}</div><div className="text-slate-400">{match.stage} · Set {match.current_set}</div></div>
            <span className={`rounded-full px-4 py-1.5 text-sm font-bold ${STATUS_STYLE[match.status]}`}>{STATUS_LABEL[match.status]}</span>
          </div>
          <div className="flex items-center justify-around gap-4">
            <div className="text-center"><Avatar name={p1.name} src={p1.photo_url} className="mx-auto h-24 w-24" /><div className="mt-2 font-semibold">{p1.name}</div></div>
            <div className="text-6xl font-black text-yellow-300">{match.player1_score} - {match.player2_score}</div>
            <div className="text-center"><Avatar name={p2.name} src={p2.photo_url} className="mx-auto h-24 w-24" /><div className="mt-2 font-semibold">{p2.name}</div></div>
          </div>
        </div>
      )}
      <div className="flex flex-wrap gap-3">
        <Link to="/admin/live" className={`${btn} bg-green-600 hover:bg-green-500`}>Open Live Controls</Link>
        <a href="/projection" target="_blank" rel="noreferrer" className={`${btn} bg-blue-600 hover:bg-blue-500`}>Open Projection</a>
        <Link to="/admin/players" className={`${btn} bg-white/10 hover:bg-white/20`}>Manage Players</Link>
        <Link to="/admin/matches" className={`${btn} bg-white/10 hover:bg-white/20`}>Manage Matches</Link>
      </div>
    </div>
  )
}
