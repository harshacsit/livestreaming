import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Match, MatchStatistics, Player } from '../types/database'

export type Connection = 'connecting' | 'connected' | 'disconnected'

// Loads one match + its players + statistics, then keeps them up to date with Supabase Realtime.
export function useRealtimeMatch(matchId: string | null) {
  const [match, setMatch] = useState<Match | null>(null)
  const [players, setPlayers] = useState<Record<string, Player>>({})
  const [stats, setStats] = useState<MatchStatistics[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [connection, setConnection] = useState<Connection>('connecting')
  const matchRef = useRef<Match | null>(null)
  const reloadRef = useRef<() => void>(() => {})

  useEffect(() => {
    if (!matchId) { setMatch(null); setStats([]); setLoading(false); return }
    let cancelled = false
    setLoading(true)

    async function loadPlayers(m: Match) {
      const { data } = await supabase.from('players').select('*').in('id', [m.player1_id, m.player2_id])
      if (!cancelled && data) setPlayers(Object.fromEntries((data as Player[]).map(p => [p.id, p])))
    }
    async function loadStats() {
      const { data } = await supabase.from('match_statistics').select('*').eq('match_id', matchId)
      if (!cancelled && data) setStats(data as MatchStatistics[])
    }
    async function loadAll() {
      const { data, error: e } = await supabase.from('matches').select('*').eq('id', matchId).single()
      if (cancelled) return
      if (e || !data) { setError('Unable to load the match.'); setLoading(false); return }
      const m = data as Match
      matchRef.current = m; setMatch(m); setError('')
      await Promise.all([loadPlayers(m), loadStats()])
      if (!cancelled) setLoading(false)
    }
    reloadRef.current = () => { void loadAll() }
    void loadAll()

    let firstSubscribe = true
    const channel = supabase.channel(`match-${matchId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches', filter: `id=eq.${matchId}` }, payload => {
        if (payload.eventType === 'DELETE') return
        const next = payload.new as Match
        const prev = matchRef.current
        matchRef.current = next
        setMatch(next)
        if (!prev || prev.player1_id !== next.player1_id || prev.player2_id !== next.player2_id) void loadPlayers(next)
        if (next.status === 'SCHEDULED') void loadStats() // a reset deletes statistics
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'match_statistics', filter: `match_id=eq.${matchId}` }, payload => {
        if (payload.eventType === 'DELETE') {
          const old = payload.old as Partial<MatchStatistics>
          setStats(p => p.filter(s => s.id !== old.id))
          return
        }
        const row = payload.new as MatchStatistics
        setStats(p => [...p.filter(s => s.player_id !== row.player_id), row])
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'players' }, payload => {
        const p = payload.new as Player
        setPlayers(prev => (p.id in prev ? { ...prev, [p.id]: p } : prev))
      })
      .subscribe(status => {
        if (cancelled) return
        if (status === 'SUBSCRIBED') {
          setConnection('connected')
          if (!firstSubscribe) void loadAll() // reconnected: catch up on anything missed
          firstSubscribe = false
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          setConnection('disconnected')
        }
      })

    return () => { cancelled = true; void supabase.removeChannel(channel) }
  }, [matchId])

  return { match, players, stats, loading, error, connection, setMatch, setStats, reload: () => reloadRef.current() }
}
