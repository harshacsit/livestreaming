import { useCallback, useEffect, useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { Player } from '../types/database'
import PlayerForm from '../components/admin/PlayerForm'
import PlayerTable from '../components/admin/PlayerTable'

export default function Players() {
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<Player | 'new' | null>(null)

  const load = useCallback(async () => {
    const { data, error } = await supabase.from('players').select('*').eq('is_active', true).order('name')
    if (error) setError('Unable to load players. Please refresh.')
    else { setPlayers(data as Player[]); setError('') }
    setLoading(false)
  }, [])
  useEffect(() => { void load() }, [load])

  async function remove(p: Player) {
    if (!window.confirm(`Delete ${p.name}?`)) return
    const res = await supabase.from('players').delete().eq('id', p.id)
    if (res.error) {
      // Player is used in a match: hide (deactivate) instead of deleting
      const soft = await supabase.from('players').update({ is_active: false }).eq('id', p.id)
      if (soft.error) { setError('Unable to remove this player.'); return }
    } else if (p.photo_path) {
      await supabase.storage.from('player-photos').remove([p.photo_path])
    }
    void load()
  }

  const shown = players.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Players</h1>
        <button onClick={() => setEditing('new')} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 font-semibold hover:bg-blue-500"><Plus size={18} /> Add player</button>
      </div>
      {editing && (
        <PlayerForm player={editing === 'new' ? null : editing}
          onCancel={() => setEditing(null)} onDone={() => { setEditing(null); void load() }} />
      )}
      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-3.5 text-slate-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search players"
          className="w-full rounded-lg border border-white/10 bg-[#111a3a] py-2.5 pl-9 pr-3 outline-none focus:border-blue-500" />
      </div>
      {error && <p className="text-red-400">{error}</p>}
      {loading ? <p className="text-slate-400">Loading players...</p>
        : <PlayerTable players={shown} onEdit={setEditing} onDelete={remove} />}
    </div>
  )
}
