import type { MatchStatistics, StatKey } from '../types/database'

export type StatValues = Record<StatKey, number>

// Statistics of one player, or all zeros if nothing has been recorded yet
export function statsFor(list: MatchStatistics[], playerId: string): StatValues {
  const s = list.find(x => x.player_id === playerId)
  return {
    forehand_winners: s?.forehand_winners ?? 0, backhand_winners: s?.backhand_winners ?? 0,
    forehand_unforced_errors: s?.forehand_unforced_errors ?? 0, backhand_unforced_errors: s?.backhand_unforced_errors ?? 0,
    forced_errors: s?.forced_errors ?? 0, net_points: s?.net_points ?? 0, baseline_points: s?.baseline_points ?? 0,
    under_9_shots: s?.under_9_shots ?? 0, over_9_shots: s?.over_9_shots ?? 0,
  }
}

/**
 * Performance rating (0-10), simple on purpose - change the weights any time.
 *   good = winners x1 + net points x0.5 + baseline x0.25 + under-9 x0.15 + over-9 x0.25
 *   bad  = unforced errors x1 + forced errors x0.5
 *   rating = 2 + 8 x good / (good + bad)    -> 5.0 when nothing is recorded yet
 */
export function performanceRating(s: StatValues): number {
  const good = (s.forehand_winners + s.backhand_winners) + s.net_points * 0.5 + s.baseline_points * 0.25
    + s.under_9_shots * 0.15 + s.over_9_shots * 0.25
  const bad = s.forehand_unforced_errors + s.backhand_unforced_errors + s.forced_errors * 0.5
  const ratio = good + bad === 0 ? 0.375 : good / (good + bad)
  return Math.round(Math.min(10, Math.max(0, 2 + 8 * ratio)) * 10) / 10
}

// "Roger Federer" -> first "ROGER", last "FEDERER"
export function splitName(name: string): { first: string; last: string } {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length <= 1) return { first: '', last: (parts[0] ?? '').toUpperCase() }
  return { first: parts.slice(0, -1).join(' ').toUpperCase(), last: parts[parts.length - 1].toUpperCase() }
}
