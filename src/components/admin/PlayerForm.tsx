import { useState, type FormEvent } from 'react'
import { supabase } from '../../lib/supabase'
import type { Player } from '../../types/database'
import Avatar from '../Avatar'

interface Props { player: Player | null; onDone: () => void; onCancel: () => void }

export default function PlayerForm({ player, onDone, onCancel }: Props) {
  const [name, setName] = useState(player?.name ?? '')
  const [country, setCountry] = useState(player?.country ?? '')
  const [ranking, setRanking] = useState(player?.ranking?.toString() ?? '')
  const [file, setFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('Please enter the player name.'); return }
    setSaving(true); setError('')
    try {
      let photo_url = player?.photo_url ?? null
      let photo_path = player?.photo_path ?? null

      if (file) {
        const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
        const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')
        const path = `${slug}-${Date.now()}.${ext}`
        const up = await supabase.storage.from('player-photos').upload(path, file, { upsert: false })
        if (up.error) throw new Error('upload')
        photo_url = supabase.storage.from('player-photos').getPublicUrl(path).data.publicUrl
        // remove the old photo so no orphaned files stay behind
        if (player?.photo_path) await supabase.storage.from('player-photos').remove([player.photo_path])
        photo_path = path
      }

      const row = { name: name.trim(), country: country.trim() || null, ranking: ranking ? Number(ranking) : null, photo_url, photo_path }
      const res = player
        ? await supabase.from('players').update(row).eq('id', player.id)
        : await supabase.from('players').insert(row)
      if (res.error) throw new Error('save')
      onDone()
    } catch (err) {
      setError(err instanceof Error && err.message === 'upload'
        ? 'Unable to upload the photo. Please try a smaller JPG or PNG.'
        : 'Unable to save the player. Please try again.')
    } finally { setSaving(false) }
  }

  const input = 'w-full rounded-lg border border-white/10 bg-[#0b1020] px-3 py-2.5 text-white outline-none focus:border-blue-500'
  return (
    <form onSubmit={submit} className="space-y-4 rounded-xl border border-white/10 bg-[#111a3a] p-5">
      <h2 className="text-lg font-semibold">{player ? 'Edit player' : 'Add player'}</h2>
      <div className="flex items-center gap-4">
        <Avatar name={name || 'Player'} src={file ? URL.createObjectURL(file) : player?.photo_url} className="h-20 w-20" />
        <input type="file" accept="image/*" onChange={e => setFile(e.target.files?.[0] ?? null)} className="text-sm text-slate-300" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block text-sm">Name *<input className={input} value={name} onChange={e => setName(e.target.value)} /></label>
        <label className="block text-sm">Country<input className={input} value={country} onChange={e => setCountry(e.target.value)} /></label>
        <label className="block text-sm">Ranking<input type="number" min={1} className={input} value={ranking} onChange={e => setRanking(e.target.value)} /></label>
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <div className="flex gap-3">
        <button disabled={saving} className="rounded-lg bg-blue-600 px-5 py-2.5 font-semibold hover:bg-blue-500 disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
        <button type="button" onClick={onCancel} className="rounded-lg bg-white/10 px-5 py-2.5 hover:bg-white/20">Cancel</button>
      </div>
    </form>
  )
}
