import { Pencil, Trash2 } from 'lucide-react'
import type { Player } from '../../types/database'
import Avatar from '../Avatar'

interface Props { players: Player[]; onEdit: (p: Player) => void; onDelete: (p: Player) => void }

export default function PlayerTable({ players, onEdit, onDelete }: Props) {
  if (players.length === 0) return <p className="py-10 text-center text-slate-400">No players found.</p>
  return (
    <div className="overflow-x-auto rounded-xl border border-white/10">
      <table className="w-full text-left text-sm">
        <thead className="bg-white/5 text-slate-400"><tr><th className="p-3">Player</th><th className="p-3">Country</th><th className="p-3">Ranking</th><th className="p-3" /></tr></thead>
        <tbody>
          {players.map(p => (
            <tr key={p.id} className="border-t border-white/10">
              <td className="p-3"><div className="flex items-center gap-3"><Avatar name={p.name} src={p.photo_url} /><span className="font-medium">{p.name}</span></div></td>
              <td className="p-3">{p.country ?? '-'}</td>
              <td className="p-3">{p.ranking ?? '-'}</td>
              <td className="p-3 text-right">
                <button onClick={() => onEdit(p)} className="mr-2 rounded-lg bg-white/10 p-2 hover:bg-white/20" aria-label="Edit"><Pencil size={16} /></button>
                <button onClick={() => onDelete(p)} className="rounded-lg bg-red-500/20 p-2 text-red-300 hover:bg-red-500/30" aria-label="Delete"><Trash2 size={16} /></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
