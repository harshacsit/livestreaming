import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

// Finds the match to show: the LIVE one, else a PAUSED one, else the most recently FINISHED one.
// Re-checks automatically (via Realtime) whenever any match changes. No polling.
export function useActiveMatch() {
  const [matchId, setMatchId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function find() {
      const { data, error } = await supabase
        .from('matches').select('id,status,updated_at')
        .in('status', ['LIVE', 'PAUSED', 'FINISHED'])
        .order('updated_at', { ascending: false })
      if (cancelled) return
      if (!error && data) {
        const rows = data as { id: string; status: string }[]
        const pick = rows.find(r => r.status === 'LIVE') ?? rows.find(r => r.status === 'PAUSED') ?? rows[0]
        setMatchId(pick?.id ?? null)
      }
      setLoading(false)
    }
    void find()
    const channel = supabase.channel('active-match')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, () => { void find() })
      .subscribe()
    return () => { cancelled = true; void supabase.removeChannel(channel) }
  }, [])

  return { matchId, loading }
}
