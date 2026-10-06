import type { MatchStatus } from '../../types/database'

export const STATUS_STYLE: Record<MatchStatus, string> = {
  SCHEDULED: 'bg-slate-600', LIVE: 'bg-green-600', PAUSED: 'bg-yellow-600', FINISHED: 'bg-red-700',
}

/** PAUSED is the broadcast break overlay (existing DB value). */
export const STATUS_LABEL: Record<MatchStatus, string> = {
  SCHEDULED: 'SCHEDULED', LIVE: 'LIVE', PAUSED: 'BREAK', FINISHED: 'FINISHED',
}

// Start / Pause / Resume / Finish buttons that fit the current status
export default function StatusButtons({ status, onSet, size = 'md' }: { status: MatchStatus; onSet: (s: MatchStatus) => void; size?: 'md' | 'lg' }) {
  const pad = size === 'lg' ? 'px-6 py-3 text-lg' : 'px-3 py-1.5 text-sm'
  const b = (label: string, to: MatchStatus, color: string) => (
    <button key={label} onClick={() => onSet(to)} className={`rounded-lg font-semibold ${pad} ${color}`}>{label}</button>
  )
  return (
    <div className="flex flex-wrap gap-2">
      {status === 'SCHEDULED' && b('Start', 'LIVE', 'bg-green-600 hover:bg-green-500')}
      {status === 'LIVE' && b('Break', 'PAUSED', 'bg-yellow-600 hover:bg-yellow-500')}
      {status === 'PAUSED' && b('Live', 'LIVE', 'bg-green-600 hover:bg-green-500')}
      {(status === 'LIVE' || status === 'PAUSED') && b('Finish', 'FINISHED', 'bg-red-700 hover:bg-red-600')}
    </div>
  )
}
