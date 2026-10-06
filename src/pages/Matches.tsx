import { useCallback, useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { Match, MatchStatus, Player } from '../types/database'
import MatchForm from '../components/admin/MatchForm'
import StatusButtons, { STATUS_LABEL, STATUS_STYLE } from '../components/admin/StatusButtons'
import Avatar from '../components/Avatar'

export default function Matches() {
  const [matches, setMatches] = useState<Match[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState<Match | 'new' | null>(null)

  const load = useCallback(async () => {
    const [m, p] = await Promise.all([
      supabase.from('matches').select('*').order('created_at', { ascending: false }),
      supabase.from('players').select('*').eq('is_active', true).order('name'),
    ])
    if (m.error || p.error) setError('Unable to load matches. Please refresh.')
    else { setMatches(m.data as Match[]); setPlayers(p.data as Player[]); setError('') }
    setLoading(false)
  }, [])
  useEffect(() => { void load() }, [load])

  async function setStatus(id: string, status: MatchStatus) {
    const { error } = await supabase.rpc('set_match_status', { p_match: id, p_status: status })
    if (error) setError('Unable to change the match status. Please try again.')
    void load()
  }
  async function reset(id: string) {
    if (!window.confirm('Reset scores, statistics and history for this match?')) return
    const { error } = await supabase.rpc('reset_match', { p_match: id })
    if (error) setError('Unable to reset the match.')
    void load()
  }
  async function remove(id: string) {
    if (!window.confirm('Delete this match?')) return
    const { error } = await supabase.from('matches').delete().eq('id', id)
    if (error) setError('Unable to delete the match.')
    void load()
  }

  const find = (id: string) => players.find(p => p.id === id)
    ?? { id, name: 'Unknown player', photo_url: null } as Pick<Player, 'id' | 'name' | 'photo_url'>

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Matches</h1>
        <button onClick={() => setEditing('new')} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 font-semibold hover:bg-blue-500"><Plus size={18} /> Create match</button>
      </div>
      {editing && <MatchForm match={editing === 'new' ? null : editing} players={players}
        onCancel={() => setEditing(null)} onDone={() => { setEditing(null); void load() }} />}
      {error && <p className="text-red-400">{error}</p>}
      {loading ? <p className="text-slate-400">Loading matches...</p> : matches.length === 0 ? (
        <p className="py-10 text-center text-slate-400">No matches yet. Create your first match.</p>
      ) : (
        <div className="space-y-3">
          {matches.map(m => {
            const a = find(m.player1_id), b = find(m.player2_id)
            return (
              <div key={m.id} className="flex flex-wrap items-center gap-4 rounded-xl border border-white/10 bg-[#111a3a] p-4">
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${STATUS_STYLE[m.status]}`}>{STATUS_LABEL[m.status]}</span>
                <div className="min-w-48 flex-1">
                  <div className="font-semibold">{m.event_name || 'Untitled event'} <span className="text-slate-400">· {m.stage || 'No stage'} · Set {m.current_set}</span></div>
                  <div className="mt-2 flex items-center gap-3 text-sm">
                    <Avatar name={a.name} src={a.photo_url} className="h-9 w-9" /> {a.name}
                    <span className="font-bold text-yellow-300">{m.player1_score} - {m.player2_score}</span>
                    <Avatar name={b.name} src={b.photo_url} className="h-9 w-9" /> {b.name}
                  </div>
                </div>
                <StatusButtons status={m.status} onSet={s => setStatus(m.id, s)} />
                <div className="flex gap-2 text-sm">
                  <button onClick={() => setEditing(m)} className="rounded-lg bg-white/10 px-3 py-1.5 hover:bg-white/20">Edit</button>
                  <button onClick={() => reset(m.id)} className="rounded-lg bg-white/10 px-3 py-1.5 hover:bg-white/20">Reset</button>
                  <button onClick={() => remove(m.id)} className="rounded-lg bg-red-500/20 px-3 py-1.5 text-red-300 hover:bg-red-500/30">Delete</button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
