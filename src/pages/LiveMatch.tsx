import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Undo2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useActiveMatch } from '../hooks/useActiveMatch'
import { useRealtimeMatch } from '../hooks/useRealtimeMatch'
import type { MatchEvent, MatchStatistics, MatchStatus, StatKey } from '../types/database'
import Avatar from '../components/Avatar'
import ScoreControls from '../components/admin/ScoreControls'
import StatisticsControls from '../components/admin/StatisticsControls'
import Scoreboard from '../components/scoreboard/Scoreboard'
import StatusButtons, { STATUS_LABEL, STATUS_STYLE } from '../components/admin/StatusButtons'

const label = (t: string) => (t === 'POINT' ? 'Point' : t.replace(/_/g, ' '))

export default function LiveMatch() {
  const { matchId, loading: finding } = useActiveMatch()
  const { match, players, stats, loading, error, connection, setMatch, setStats, reload } = useRealtimeMatch(matchId)
  const [notice, setNotice] = useState('')
  const [last, setLast] = useState<MatchEvent | null>(null)

  const loadLast = useCallback(async () => {
    if (!matchId) { setLast(null); return }
    const { data } = await supabase.from('match_events').select('*')
      .eq('match_id', matchId).eq('reversed', false).order('created_at', { ascending: false }).limit(1)
    setLast(data && data.length ? (data[0] as MatchEvent) : null)
  }, [matchId])
  useEffect(() => { void loadLast() }, [loadLast])

  function fail(msg: string) { setNotice(msg); window.setTimeout(() => setNotice(''), 4000) }

  // Optimistic: change the screen first, send to Supabase, roll back if it fails
  function bumpScore(playerId: string, delta: number) {
    setMatch(m => {
      if (!m) return m
      return playerId === m.player1_id
        ? { ...m, player1_score: Math.max(0, m.player1_score + delta) }
        : { ...m, player2_score: Math.max(0, m.player2_score + delta) }
    })
  }
  function bumpStat(playerId: string, key: StatKey, delta: number) {
    setStats(list => {
      const row = list.find(s => s.player_id === playerId)
      if (!row) {
        const fresh = { id: `tmp-${playerId}`, match_id: matchId ?? '', player_id: playerId, forehand_winners: 0, backhand_winners: 0,
          forehand_unforced_errors: 0, backhand_unforced_errors: 0, forced_errors: 0, net_points: 0, baseline_points: 0,
          under_9_shots: 0, over_9_shots: 0 } satisfies MatchStatistics
        return [...list, { ...fresh, [key]: Math.max(0, delta) }]
      }
      return list.map(s => (s.player_id === playerId ? { ...s, [key]: Math.max(0, s[key] + delta) } : s))
    })
  }

  async function act(playerId: string, type: 'POINT' | StatKey, delta: number) {
    if (!match) return
    if (type === 'POINT') bumpScore(playerId, delta); else bumpStat(playerId, type, delta)
    const { error } = await supabase.rpc('record_action', { p_match: match.id, p_player: playerId, p_type: type, p_delta: delta })
    if (error) {
      if (type === 'POINT') bumpScore(playerId, -delta); else bumpStat(playerId, type, -delta)
      fail(type === 'POINT' ? 'Unable to update score. Please try again.' : 'Unable to update statistic. Please try again.')
    } else void loadLast()
  }

  async function undo() {
    if (!match) return
    const { error } = await supabase.rpc('undo_last_action', { p_match: match.id })
    if (error) fail('Unable to undo. Please try again.')
    reload(); void loadLast()
  }
  async function setStatus(s: MatchStatus) {
    if (!match) return
    const { error } = await supabase.rpc('set_match_status', { p_match: match.id, p_status: s })
    if (error) fail('Unable to change the match status.')
    reload()
  }
  async function changeSet(delta: number) {
    if (!match || match.current_set + delta < 1) return
    const { error } = await supabase.from('matches').update({ current_set: match.current_set + delta }).eq('id', match.id)
    if (error) fail('Unable to change the set.')
  }

  if (finding || loading) return <p className="text-slate-400">Loading match...</p>
  if (error) return <p className="text-red-400">{error}</p>
  if (!matchId || !match) {
    return <div className="py-16 text-center"><p className="mb-4 text-xl">No live match.</p>
      <Link to="/admin/matches" className="rounded-lg bg-blue-600 px-5 py-3 font-semibold">Go to Matches to start one</Link></div>
  }
  const p1 = players[match.player1_id], p2 = players[match.player2_id]
  if (!p1 || !p2) return <p className="text-slate-400">Loading players...</p>
  const editable = match.status !== 'FINISHED'
  const lastPlayer = last ? (last.player_id === p1.id ? p1.name : p2.name) : ''

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#111a3a] p-4">
        <div>
          <div className="text-xl font-bold">{match.event_name || 'Untitled event'}</div>
          <div className="text-slate-300">{match.stage} · Set {match.current_set}
            <button onClick={() => changeSet(-1)} className="ml-3 rounded bg-white/10 px-2">-</button>
            <button onClick={() => changeSet(1)} className="ml-1 rounded bg-white/10 px-2">+</button></div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs ${connection === 'connected' ? 'text-green-400' : 'text-red-400'}`}>
            {connection === 'connected' ? '● Realtime connected' : connection === 'connecting' ? 'Connecting...' : '● Connection lost'}</span>
          <span className={`rounded-full px-4 py-1.5 text-sm font-bold ${STATUS_STYLE[match.status]}`}>{STATUS_LABEL[match.status]}</span>
          <StatusButtons status={match.status} onSet={setStatus} size="lg" />
        </div>
      </div>

      {notice && <div className="rounded-lg bg-red-600/30 px-4 py-3 text-red-200">{notice}</div>}

      <div className="flex items-center justify-between rounded-xl border border-white/10 bg-[#111a3a] p-3">
        <div className="text-sm text-slate-300">Last action: {last ? <b className="text-white">{lastPlayer} {last.value > 0 ? '+' : ''}{last.value} {label(last.event_type)}</b> : 'none'}</div>
        <button disabled={!last} onClick={undo} className="flex items-center gap-2 rounded-lg bg-yellow-500 px-5 py-3 font-bold text-black disabled:opacity-40"><Undo2 size={18} /> UNDO</button>
      </div>

      <div className="rounded-xl border border-white/10 bg-[#111a3a] p-3">
        <div className="mb-2 text-xs font-semibold tracking-widest text-yellow-400">CURRENT PROJECTION</div>
        <div className="mx-auto aspect-video w-full max-w-xl overflow-hidden rounded-lg">
          <Scoreboard match={match} p1={p1} p2={p2} stats={stats} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {[{ p: p1, score: match.player1_score }, { p: p2, score: match.player2_score }].map(({ p, score }) => (
          <div key={p.id} className="space-y-4 rounded-2xl border border-white/10 bg-[#111a3a] p-5">
            <div className="flex items-center gap-4">
              <Avatar name={p.name} src={p.photo_url} className="h-24 w-24" />
              <div className="flex-1 text-2xl font-bold">{p.name}</div>
              <div className="text-7xl font-black text-yellow-300">{score}</div>
            </div>
            <ScoreControls playerName={p.name} disabled={!editable} onChange={d => act(p.id, 'POINT', d)} />
            <StatisticsControls disabled={!editable} stats={stats.find(s => s.player_id === p.id)} onChange={(k, d) => act(p.id, k, d)} />
          </div>
        ))}
      </div>
    </div>
  )
}
