interface ScoreRingProps {
  score: number;
}

function tier(score: number): { label: string; ring: string; text: string; glow: string } {
  if (score >= 75) return { label: "Strong match", ring: "#34d399", text: "text-emerald-400", glow: "shadow-emerald-500/20" };
  if (score >= 50) return { label: "Partial match", ring: "#fbbf24", text: "text-amber-400", glow: "shadow-amber-500/20" };
  return { label: "Weak match", ring: "#fb7185", text: "text-rose-400", glow: "shadow-rose-500/20" };
}

export default function ScoreRing({ score }: ScoreRingProps) {
  const size = 168;
  const stroke = 10;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - Math.min(Math.max(score, 0), 100) / 100);
  const { label, ring, text, glow } = tier(score);

  return (
    <div className={`relative flex h-[168px] w-[168px] items-center justify-center rounded-full shadow-2xl ${glow}`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-slate-800" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={ring}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="animate-ring-fill"
          style={
            {
              "--ring-circumference": circumference,
              "--ring-offset": offset,
            } as React.CSSProperties
          }
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={`text-4xl font-bold tabular-nums ${text}`}>{score}</span>
        <span className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-slate-500">{label}</span>
      </div>
    </div>
  );
}
