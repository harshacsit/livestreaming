import type { MatchStatistics, StatKey } from '../../types/database'

const GROUPS: { title: string; items: { key: StatKey; label: string }[] }[] = [
  { title: 'Winners', items: [
    { key: 'forehand_winners', label: 'Forehand Winner' },
    { key: 'backhand_winners', label: 'Backhand Winner' } ] },
  { title: 'Errors', items: [
    { key: 'forehand_unforced_errors', label: 'Forehand Unforced Error' },
    { key: 'backhand_unforced_errors', label: 'Backhand Unforced Error' },
    { key: 'forced_errors', label: 'Forced Error' } ] },
  { title: 'Points won', items: [
    { key: 'net_points', label: 'Net Point' },
    { key: 'baseline_points', label: 'Baseline Point' },
    { key: 'under_9_shots', label: 'Under 9 Shots' },
    { key: 'over_9_shots', label: 'Over 9 Shots' } ] },
]

interface Props { stats: MatchStatistics | undefined; onChange: (key: StatKey, delta: number) => void; disabled?: boolean }

export default function StatisticsControls({ stats, onChange, disabled }: Props) {
  return (
    <div className="space-y-4">
      {GROUPS.map(g => (
        <div key={g.title}>
          <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-yellow-400">{g.title}</div>
          <div className="space-y-2">
            {g.items.map(({ key, label }) => (
              <div key={key} className="flex items-center gap-2 rounded-xl bg-white/5 p-2">
                <button disabled={disabled} onClick={() => onChange(key, -1)} aria-label={`${label} minus`}
                  className="h-12 w-12 rounded-lg bg-white/10 text-2xl font-bold hover:bg-white/20 disabled:opacity-40">-</button>
                <div className="flex-1 text-center text-sm">{label}</div>
                <div className="w-10 text-center text-2xl font-bold text-yellow-300">{stats?.[key] ?? 0}</div>
                <button disabled={disabled} onClick={() => onChange(key, 1)} aria-label={`${label} plus`}
                  className="h-12 w-16 rounded-lg bg-blue-600 text-2xl font-bold hover:bg-blue-500 disabled:opacity-40">+</button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
