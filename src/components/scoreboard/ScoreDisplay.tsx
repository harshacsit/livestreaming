import type { CSSProperties } from 'react'

// Shows a number and plays a small "pop" every time the value changes
export default function ScoreDisplay({ value, style, className }: { value: string | number; style?: CSSProperties; className?: string }) {
  return <span key={String(value)} className={`score-pop ${className ?? ''}`} style={style}>{value}</span>
}
