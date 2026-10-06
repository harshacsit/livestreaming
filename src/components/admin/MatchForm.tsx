import { useState, type FormEvent } from 'react'
import { supabase } from '../../lib/supabase'
import type { Match, Player } from '../../types/database'
import Avatar from '../Avatar'

function PlayerPicker({ label, players, value, blockedId, onChange }: {
  label: string; players: Player[]; value: string; blockedId: string; onChange: (id: string) => void
}) {
  const [q, setQ] = useState('')
  const shown = players.filter(p => p.name.toLowerCase().includes(q.toLowerCase()))
  return (
    <div className="rounded-xl border border-white/10 p-3">
      <div className="mb-2 text-sm font-semibold">{label}</div>
      <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search..."
        className="mb-2 w-full rounded-lg border border-white/10 bg-[#0b1020] px-3 py-2 text-sm outline-none" />
      <div className="max-h-52 space-y-1 overflow-y-auto">
        {shown.map(p => (
          <button type="button" key={p.id} disabled={p.id === blockedId} onClick={() => onChange(p.id)}
            className={`flex w-full items-center gap-3 rounded-lg p-2 text-left text-sm disabled:opacity-30 ${p.id === value ? 'bg-blue-600' : 'hover:bg-white/10'}`}>
            <Avatar name={p.name} src={p.photo_url} className="h-9 w-9" /> {p.name}
          </button>
        ))}
        {shown.length === 0 && <p className="p-2 text-sm text-slate-400">No players found.</p>}
      </div>
    </div>
  )
}

interface Props { match: Match | null; players: Player[]; onDone: () => void; onCancel: () => void }

export default function MatchForm({ match, players, onDone, onCancel }: Props) {
  const [eventName, setEventName] = useState(match?.event_name ?? '')
  const [stage, setStage] = useState(match?.stage ?? '')
  const [currentSet, setCurrentSet] = useState(match?.current_set ?? 1)
  const [p1, setP1] = useState(match?.player1_id ?? '')
  const [p2, setP2] = useState(match?.player2_id ?? '')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!p1 || !p2) { setError('Please select both players.'); return }
    if (p1 === p2) { setError('Player 1 and Player 2 must be different.'); return }
    setSaving(true); setError('')
    const row = { event_name: eventName.trim(), stage: stage.trim(), current_set: currentSet, player1_id: p1, player2_id: p2 }
    const res = match ? await supabase.from('matches').update(row).eq('id', match.id) : await supabase.from('matches').insert(row)
    setSaving(false)
    if (res.error) setError('Unable to save the match. Please try again.'); else onDone()
  }

  const input = 'w-full rounded-lg border border-white/10 bg-[#0b1020] px-3 py-2.5 outline-none focus:border-blue-500'
  return (
    <form onSubmit={submit} className="space-y-4 rounded-xl border border-white/10 bg-[#111a3a] p-5">
      <h2 className="text-lg font-semibold">{match ? 'Edit match' : 'Create match'}</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="text-sm">Event name<input className={input} value={eventName} onChange={e => setEventName(e.target.value)} /></label>
        <label className="text-sm">Stage (e.g. Semi-Final)<input className={input} value={stage} onChange={e => setStage(e.target.value)} /></label>
        <label className="text-sm">Current set<input type="number" min={1} className={input} value={currentSet} onChange={e => setCurrentSet(Math.max(1, Number(e.target.value) || 1))} /></label>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <PlayerPicker label="Player 1" players={players} value={p1} blockedId={p2} onChange={setP1} />
        <PlayerPicker label="Player 2" players={players} value={p2} blockedId={p1} onChange={setP2} />
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <div className="flex gap-3">
        <button disabled={saving} className="rounded-lg bg-blue-600 px-5 py-2.5 font-semibold hover:bg-blue-500 disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
        <button type="button" onClick={onCancel} className="rounded-lg bg-white/10 px-5 py-2.5 hover:bg-white/20">Cancel</button>
      </div>
    </form>
  )
}
