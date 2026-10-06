import { useState } from 'react'
import type { Player } from '../../types/database'
import { SILHOUETTE } from '../Avatar'
import { performanceRating, splitName, type StatValues } from '../../lib/rating'
import ScoreDisplay from './ScoreDisplay'
import { COLORS, SIDE, fontSizeFor, verticalNameSize } from './constants'

export default function PlayerPanel({
  player, stats, side,
}: {
  player: Player; stats: StatValues; side: 'left' | 'right'
}) {
  const left = side === 'left'
  const [failedUrl, setFailedUrl] = useState<string | null>(null)
  const src = player.photo_url && failedUrl !== player.photo_url ? player.photo_url : SILHOUETTE

  const { first, last } = splitName(player.name)
  const accent = left ? COLORS.YELLOW : '#ffffff'
  const wash = left ? COLORS.YELLOW : COLORS.CYAN
  const rating = performanceRating(stats).toFixed(1)

  // One-letter last names ("Harsha E") stay a full readable name, never a clipped giant letter
  const shortLast = last.length > 0 && last.length <= 2
  const displayLast = !last ? first : shortLast ? player.name.toUpperCase() : last
  const displayFirst = !last || shortLast ? '' : first
  // First + last share the photo height so every letter stays on screen
  const lastV = verticalNameSize(displayLast, 480, 90, 32)
  const firstV = displayFirst ? Math.min(28, verticalNameSize(displayFirst, 140, 26, 15)) : 0
  const plateLast = fontSizeFor(displayLast, 36, 20, 10)
  const plateFirst = fontSizeFor(displayFirst, 16, 12, 14)

  return (
    <div
      className={left ? 'cin-photo-l' : 'cin-photo-r'}
      style={{
        position: 'relative',
        width: SIDE,
        flexShrink: 0,
        height: '100%',
        overflow: 'hidden',
      }}
    >
      <img
        key={src} src={src} alt={player.name}
        onError={() => setFailedUrl(player.photo_url)}
        className="fade-in"
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          objectFit: 'cover', objectPosition: 'center 12%',
          filter: left
            ? 'saturate(1.18) contrast(1.1)'
            : 'saturate(1.12) contrast(1.1) hue-rotate(12deg)',
        }}
      />

      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: left
          ? `linear-gradient(185deg, ${wash}66 0%, transparent 32%, rgba(2,8,28,.15) 50%, rgba(2,8,28,.94) 100%)`
          : `linear-gradient(175deg, ${wash}60 0%, transparent 32%, rgba(2,8,28,.15) 50%, rgba(2,8,28,.94) 100%)`,
      }} />
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: left
          ? 'linear-gradient(to right, transparent 58%, rgba(10,22,110,.5) 100%)'
          : 'linear-gradient(to left, transparent 58%, rgba(10,22,110,.5) 100%)',
      }} />

      {/* Broadcast vertical name — sized to the panel so nothing is clipped */}
      <div style={{
        position: 'absolute',
        top: 20,
        bottom: 210,
        ...(left ? { right: 10 } : { left: 10 }),
        display: 'flex',
        alignItems: 'flex-end',
        zIndex: 4,
        pointerEvents: 'none',
        maxHeight: '100%',
      }}>
        <div style={{
          writingMode: 'vertical-rl',
          transform: 'rotate(180deg)',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'flex-end',
          gap: 16,
          maxHeight: '100%',
        }}>
          {displayFirst ? (
            <div style={{
              fontSize: firstV,
              fontWeight: 700,
              letterSpacing: 5,
              color: 'rgba(255,255,255,.88)',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
              lineHeight: 1,
            }}>
              {displayFirst}
            </div>
          ) : null}
          <div style={{
            fontSize: lastV,
            fontWeight: 900,
            letterSpacing: 3,
            color: accent,
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            lineHeight: 0.9,
            textShadow: '0 6px 22px rgba(0,0,0,.8)',
          }}>
            {displayLast}
          </div>
        </div>
      </div>

      {/* Horizontal plate: full name wrapping + rating. Never ellipsis. */}
      <div style={{
        position: 'absolute',
        left: 14, right: 14, bottom: 14,
        zIndex: 5,
        display: 'flex',
        flexDirection: left ? 'row' : 'row-reverse',
        alignItems: 'flex-end',
        gap: 10,
      }}>
        <div style={{ minWidth: 0, flex: 1, textAlign: left ? 'left' : 'right' }}>
          {displayFirst ? (
            <div style={{
              fontSize: plateFirst,
              fontWeight: 700,
              letterSpacing: 2,
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,.8)',
              lineHeight: 1.15,
              whiteSpace: 'normal',
              overflowWrap: 'anywhere',
              wordBreak: 'break-word',
            }}>
              {displayFirst}
            </div>
          ) : null}
          <div style={{
            fontSize: plateLast,
            fontWeight: 900,
            letterSpacing: 0.8,
            textTransform: 'uppercase',
            color: accent,
            lineHeight: 1.05,
            whiteSpace: 'normal',
            overflowWrap: 'anywhere',
            wordBreak: 'break-word',
            textShadow: '0 3px 12px rgba(0,0,0,.9)',
          }}>
            {displayLast}
          </div>
          {player.country ? (
            <div style={{
              marginTop: 4,
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: 2,
              color: 'rgba(255,255,255,.68)',
              textTransform: 'uppercase',
            }}>
              {player.country}
            </div>
          ) : null}
        </div>

        <div className="cin-rating" style={{ flexShrink: 0, textAlign: left ? 'right' : 'left' }}>
          <div style={{
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: 1.4,
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,.62)',
            whiteSpace: 'nowrap',
          }}>
            PERFORMANCE RATING
          </div>
          <ScoreDisplay
            value={rating}
            style={{
              fontSize: 62,
              fontWeight: 900,
              lineHeight: 0.9,
              color: accent,
              textShadow: `0 0 22px ${wash}70`,
            }}
          />
        </div>
      </div>
    </div>
  )
}
