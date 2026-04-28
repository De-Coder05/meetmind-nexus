import { useMemo } from "react";

interface Props {
  bars?: number;
  className?: string;
  seed?: number;
}

/** Deterministic mini waveform built with CSS bars — no external libs. */
export function Waveform({ bars = 48, className = "", seed = 1 }: Props) {
  const heights = useMemo(() => {
    const out: number[] = [];
    let s = seed * 9301 + 49297;
    for (let i = 0; i < bars; i++) {
      s = (s * 9301 + 49297) % 233280;
      const r = s / 233280;
      // pseudo-envelope for nicer shape
      const env = Math.sin((i / bars) * Math.PI);
      out.push(0.2 + r * 0.6 * env + 0.2 * env);
    }
    return out;
  }, [bars, seed]);

  return (
    <div className={`flex items-center gap-[2px] h-full ${className}`}>
      {heights.map((h, i) => (
        <span
          key={i}
          className="flex-1 rounded-[1px] bg-gradient-to-t from-primary/40 to-accent/80"
          style={{ height: `${Math.max(8, h * 100)}%` }}
        />
      ))}
    </div>
  );
}

export function LiveWaveform({ bars = 32, className = "" }: Props) {
  return (
    <div className={`flex items-end gap-[3px] h-full ${className}`}>
      {Array.from({ length: bars }).map((_, i) => (
        <span
          key={i}
          className="flex-1 rounded-full bg-gradient-to-t from-primary to-primary-glow"
          style={{
            height: "60%",
            animation: `waveform 1.${(i % 9)}s ease-in-out infinite`,
            animationDelay: `${(i * 60) % 600}ms`,
            transformOrigin: "bottom",
          }}
        />
      ))}
    </div>
  );
}
