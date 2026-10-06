import type { StatKey } from '../../types/database'
import type { StatValues } from '../../lib/rating'
import { COLORS } from './constants'

function Bar({ title }: { title: string }) {
  return (
    <div style={{
      height: 34, flexShrink: 0,
      background: 'linear-gradient(90deg,#0d1ec4 0%,#1a38ea 50%,#0d1ec4 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 15, fontWeight: 900, letterSpacing: 5,
      color: 'rgba(255,255,255,.92)',
      textTransform: 'uppercase',
      borderTop: '1px solid rgba(255,255,255,.14)',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,.12)',
    }}>
      {title}
    </div>
  )
}

interface RowProps {
  label: string
  a: number
  b: number
  better?: 'high' | 'low'
  delay: number
}

function Row({ label, a, b, better = 'high', delay }: RowProps) {
  const aWin = better === 'high' ? a > b : a < b
  const bWin = better === 'high' ? b > a : b < a
  const max = Math.max(a, b)
  const aPct = max === 0 ? 28 : (a / max) * 100
  const bPct = max === 0 ? 28 : (b / max) * 100

  return (
    <div className="cin-row" style={{
      flex: 1,
      minHeight: 0,
      display: 'flex',
      alignItems: 'center',
      background: 'linear-gradient(90deg,rgba(9,24,150,.92) 0%,rgba(16,46,190,.78) 50%,rgba(9,24,150,.92) 100%)',
      borderBottom: '1px solid rgba(255,255,255,.08)',
      animationDelay: `${delay}ms`,
    }}>
      <div style={{
        width: 120, flexShrink: 0,
        textAlign: 'center',
        fontSize: 44, fontWeight: 900,
        color: aWin ? COLORS.YELLOW : '#fff',
        lineHeight: 1,
        textShadow: aWin ? '0 0 16px rgba(246,231,18,.35)' : undefined,
      }}>
        <span key={a} className="stat-pop">{a}</span>
      </div>

      <div style={{ flex: 1, position: 'relative', padding: '0 8px' }}>
        <div style={{
          fontSize: 22, fontWeight: 800, letterSpacing: 2.2,
          textTransform: 'uppercase',
          color: '#fff',
          textAlign: 'center',
          whiteSpace: 'normal',
          lineHeight: 1.1,
        }}>
          {label}
        </div>
        <div style={{
          marginTop: 8,
          display: 'flex',
          alignItems: 'center',
          height: 5,
          gap: 0,
        }}>
          <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{
              width: `${aPct}%`,
              height: 5,
              borderRadius: 3,
              background: `linear-gradient(90deg, transparent, ${COLORS.YELLOW})`,
              boxShadow: `0 0 8px ${COLORS.YELLOW}88`,
            }} />
          </div>
          <div style={{
            width: 8, height: 8, borderRadius: 99, flexShrink: 0,
            background: COLORS.YELLOW, margin: '0 4px',
            boxShadow: `0 0 10px ${COLORS.YELLOW}`,
          }} />
          <div style={{ flex: 1 }}>
            <div style={{
              width: `${bPct}%`,
              height: 5,
              borderRadius: 3,
              background: `linear-gradient(90deg, ${COLORS.YELLOW}, transparent)`,
              boxShadow: `0 0 8px ${COLORS.YELLOW}88`,
            }} />
          </div>
        </div>
      </div>

      <div style={{
        width: 120, flexShrink: 0,
        textAlign: 'center',
        fontSize: 44, fontWeight: 900,
        color: bWin ? COLORS.YELLOW : '#fff',
        lineHeight: 1,
        textShadow: bWin ? '0 0 16px rgba(246,231,18,.35)' : undefined,
      }}>
        <span key={b} className="stat-pop">{b}</span>
      </div>
    </div>
  )
}

const sections: { title: string; better: 'high' | 'low'; rows: [string, StatKey][] }[] = [
  {
    title: 'WINNINGS', better: 'high',
    rows: [
      ['FOREHAND', 'forehand_winners'],
      ['BACKHAND', 'backhand_winners'],
    ],
  },
  {
    title: 'ERRORS', better: 'low',
    rows: [
      ['FOREHAND UNFORCED', 'forehand_unforced_errors'],
      ['BACKHAND UNFORCED', 'backhand_unforced_errors'],
      ['FORCED',            'forced_errors'],
    ],
  },
  {
    title: 'POINTS WON', better: 'high',
    rows: [
      ['NETS',          'net_points'],
      ['BASELINE',      'baseline_points'],
      ['UNDER 9 SHOTS', 'under_9_shots'],
      ['OVER 9 SHOTS',  'over_9_shots'],
    ],
  },
]

export default function StatisticsPanel({ a, b }: { a: StatValues; b: StatValues }) {
  let i = 0
  return (
    <div style={{
      flex: 1, minWidth: 0, height: '100%',
      display: 'flex', flexDirection: 'column',
      background: 'linear-gradient(180deg, rgba(10,28,170,.55) 0%, rgba(8,20,120,.4) 100%)',
    }}>
      {sections.map(s => (
        <div key={s.title} style={{ display: 'flex', flexDirection: 'column', flex: s.rows.length, minHeight: 0 }}>
          <Bar title={s.title} />
          {s.rows.map(([label, key]) => {
            const delay = 420 + i * 55
            i += 1
            return (
              <Row key={key} label={label} a={a[key]} b={b[key]} better={s.better} delay={delay} />
            )
          })}
        </div>
      ))}
    </div>
  )
}
