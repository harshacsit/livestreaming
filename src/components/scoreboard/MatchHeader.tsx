import type { Match, MatchStatus, Player } from '../../types/database'
import ScoreDisplay from './ScoreDisplay'
import { COLORS, fontSizeFor } from './constants'

const STATUS: Record<MatchStatus, { text: string; color: string }> = {
  SCHEDULED: { text: 'UPCOMING', color: '#94a3b8' },
  LIVE:      { text: 'LIVE',     color: '#22c55e' },
  PAUSED:    { text: 'BREAK',    color: '#eab308' },
  FINISHED:  { text: 'FINAL',    color: '#ef4444' },
}

interface Props { match: Match; p1: Player; p2: Player }

function NameLine({ n, name }: { n: 1 | 2; name: string }) {
  const size = fontSizeFor(name, 32, 18, 18)
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      minHeight: 52,
      borderBottom: n === 1 ? '1px solid rgba(255,255,255,.22)' : undefined,
      padding: '4px 0',
    }}>
      <span style={{
        width: 28, height: 28, flexShrink: 0,
        borderRadius: 4,
        background: 'rgba(255,255,255,.12)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 16, fontWeight: 900,
      }}>{n}</span>
      <span style={{
        fontSize: size, fontWeight: 800, letterSpacing: 0.4,
        lineHeight: 1.15,
        textTransform: 'uppercase',
        whiteSpace: 'normal',
        overflowWrap: 'anywhere',
        wordBreak: 'break-word',
      }}>
        {name}
      </span>
    </div>
  )
}

export default function MatchHeader({ match, p1, p2 }: Props) {
  const st = STATUS[match.status]
  const event = (match.event_name || 'TENNIS TOURNAMENT').trim()
  const eventSize = fontSizeFor(event, 18, 13, 24)
  const p1Lead = match.player1_score > match.player2_score
  const p2Lead = match.player2_score > match.player1_score

  return (
    <div className="cin-header" style={{
      height: 142,
      flexShrink: 0,
      background: 'linear-gradient(90deg,#1436f4 0%,#1b4bff 45%,#1026d4 100%)',
      display: 'flex',
      alignItems: 'stretch',
      boxShadow: '0 8px 28px rgba(0,0,0,.35)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'linear-gradient(180deg, rgba(255,255,255,.1) 0%, transparent 55%)',
      }} />

      <div style={{
        width: 400, flexShrink: 0,
        padding: '16px 18px 16px 28px',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        zIndex: 1,
      }}>
        <div style={{
          fontSize: 36, fontWeight: 900, letterSpacing: 1.2, lineHeight: 1.05,
          textTransform: 'uppercase', whiteSpace: 'normal',
        }}>
          SET {match.current_set} STATISTICS
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10, flexWrap: 'wrap' }}>
          <span style={{
            fontSize: 18, fontWeight: 800, letterSpacing: 2,
            opacity: 0.92, textTransform: 'uppercase',
          }}>
            {match.stage || 'MATCH'}
          </span>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: st.color,
            padding: '3px 12px', borderRadius: 999,
            fontSize: 15, fontWeight: 900, letterSpacing: 1.6,
            color: '#041016',
          }}>
            {match.status === 'LIVE' && <span className="live-dot" />}
            {st.text}
          </span>
        </div>
      </div>

      <div style={{
        flex: 1, minWidth: 0,
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '8px 12px 8px 8px',
        zIndex: 1,
      }}>
        <NameLine n={1} name={p1.name.toUpperCase()} />
        <NameLine n={2} name={p2.name.toUpperCase()} />
      </div>

      <div style={{
        width: 92, flexShrink: 0,
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '8px 8px',
        zIndex: 1,
        borderLeft: '1px solid rgba(255,255,255,.12)',
      }}>
        <div style={{
          minHeight: 52, display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderBottom: '1px solid rgba(255,255,255,.22)',
        }}>
          <ScoreDisplay value={match.player1_score} style={{
            fontSize: 42, fontWeight: 900,
            color: p1Lead ? COLORS.YELLOW : '#fff',
            textShadow: p1Lead ? '0 0 18px rgba(246,231,18,.35)' : undefined,
          }} />
        </div>
        <div style={{ minHeight: 52, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ScoreDisplay value={match.player2_score} style={{
            fontSize: 42, fontWeight: 900,
            color: p2Lead ? COLORS.YELLOW : '#fff',
            textShadow: p2Lead ? '0 0 18px rgba(246,231,18,.35)' : undefined,
          }} />
        </div>
      </div>

      <div style={{
        width: 268, flexShrink: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '12px 16px',
        textAlign: 'center',
        zIndex: 1,
        background: 'linear-gradient(180deg, rgba(0,0,0,.12), rgba(0,0,0,.02))',
        borderLeft: '1px solid rgba(255,255,255,.1)',
      }}>
        <div style={{
          fontFamily: "'Oswald', 'Barlow Condensed', sans-serif",
          fontSize: 34, fontWeight: 700, letterSpacing: 6, lineHeight: 1,
          fontStyle: 'italic',
          textTransform: 'uppercase',
        }}>Tennis</div>
        <div style={{
          marginTop: 6, height: 3, width: 72,
          background: COLORS.YELLOW, borderRadius: 2,
        }} />
        <div style={{
          marginTop: 8,
          fontSize: eventSize, fontWeight: 800, fontStyle: 'italic',
          lineHeight: 1.2, letterSpacing: 0.6,
          textTransform: 'uppercase',
          whiteSpace: 'normal',
          overflowWrap: 'anywhere',
          wordBreak: 'break-word',
          maxWidth: '100%',
        }}>
          {event}
        </div>
      </div>
    </div>
  )
}
