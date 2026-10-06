interface Props { playerName: string; onChange: (delta: number) => void; disabled?: boolean }

// Big touch-friendly score buttons
export default function ScoreControls({ playerName, onChange, disabled }: Props) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <button disabled={disabled} onClick={() => onChange(1)} aria-label={`${playerName} plus one point`}
        className="col-span-2 min-h-24 rounded-2xl bg-green-600 text-3xl font-extrabold text-white active:scale-95 hover:bg-green-500 disabled:opacity-40">
        +1 POINT
      </button>
      <button disabled={disabled} onClick={() => onChange(-1)} aria-label={`${playerName} minus one point`}
        className="min-h-24 rounded-2xl bg-red-700 text-2xl font-extrabold text-white active:scale-95 hover:bg-red-600 disabled:opacity-40">
        -1
      </button>
    </div>
  )
}
