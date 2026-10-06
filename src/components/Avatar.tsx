import { useState } from 'react'

// Demo silhouette shown when a player has no photo (or the photo fails to load)
export const SILHOUETTE = 'data:image/svg+xml;utf8,' + encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 250"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1d4ed8"/><stop offset="1" stop-color="#0b1b4d"/></linearGradient></defs><rect width="200" height="250" fill="url(#g)"/><circle cx="100" cy="90" r="42" fill="#5b7bd6"/><path d="M20 250c0-60 35-95 80-95s80 35 80 95z" fill="#5b7bd6"/></svg>`)

interface Props { name: string; src?: string | null; className?: string }

export default function Avatar({ name, src, className = 'h-12 w-12' }: Props) {
  const [failed, setFailed] = useState(false)
  const initials = name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase()
  return (
    <div className={`relative overflow-hidden rounded-full bg-blue-900 ${className}`} title={name}>
      <img
        src={!src || failed ? SILHOUETTE : src}
        alt={name}
        onError={() => setFailed(true)}
        className="h-full w-full object-cover object-top"
      />
      {(!src || failed) && (
        <span className="absolute inset-0 flex items-end justify-center pb-1 text-xs font-bold text-white/90">{initials}</span>
      )}
    </div>
  )
}
