export type MatchStatus = 'SCHEDULED' | 'LIVE' | 'PAUSED' | 'FINISHED'

export interface Player {
  id: string
  name: string
  photo_url: string | null
  photo_path: string | null
  country: string | null
  ranking: number | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Match {
  id: string
  event_name: string
  stage: string
  status: MatchStatus
  player1_id: string
  player2_id: string
  current_set: number
  player1_score: number
  player2_score: number
  created_at: string
  updated_at: string
}

export interface MatchStatistics {
  id: string
  match_id: string
  player_id: string
  forehand_winners: number
  backhand_winners: number
  forehand_unforced_errors: number
  backhand_unforced_errors: number
  forced_errors: number
  net_points: number
  baseline_points: number
  under_9_shots: number
  over_9_shots: number
}

export interface MatchEvent {
  id: string
  match_id: string
  player_id: string
  event_type: string
  value: number
  reversed: boolean
  created_at: string
}

export type StatKey =
  | 'forehand_winners' | 'backhand_winners'
  | 'forehand_unforced_errors' | 'backhand_unforced_errors' | 'forced_errors'
  | 'net_points' | 'baseline_points' | 'under_9_shots' | 'over_9_shots'
