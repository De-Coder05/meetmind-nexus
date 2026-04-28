import { motion } from "framer-motion";
import { Presentation, Eye, Users2 } from "lucide-react";

export interface VisualCue {
  kind: "slide" | "participant" | "screen";
  time: string;     // "mm:ss"
  title: string;
  subtitle?: string;
  seed?: number;
}

interface Props {
  cues: VisualCue[];
  onJump: (time: string) => void;
  activeTime?: string;
}

/** Horizontal ribbon of detected visual moments — clickable to jump transcript. */
export function VisualContextRibbon({ cues, onJump, activeTime }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="card-surface rounded-2xl p-4 mb-5 relative overflow-hidden"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Eye className="w-3.5 h-3.5 text-primary" />
          <h3 className="text-[12px] font-mono uppercase tracking-wider text-muted-foreground">
            Visual context ribbon
          </h3>
          <span className="text-[10px] font-mono text-muted-foreground/70">
            · {cues.length} moments detected
          </span>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
          <LegendDot color="hsl(239 84% 67%)" label="Slide" />
          <LegendDot color="hsl(160 84% 39%)" label="Participant" />
          <LegendDot color="hsl(38 92% 50%)" label="Screen" />
        </div>
      </div>

      <div className="relative">
        {/* timeline axis */}
        <div className="absolute left-0 right-0 top-[50%] h-px bg-border" />
        <div className="overflow-x-auto scrollbar-thin">
          <div className="flex items-stretch gap-2 min-w-max py-1">
            {cues.map((cue, i) => (
              <RibbonCue
                key={i}
                cue={cue}
                onClick={() => onJump(cue.time)}
                active={activeTime === cue.time}
                index={i}
              />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function RibbonCue({
  cue,
  onClick,
  active,
  index,
}: {
  cue: VisualCue;
  onClick: () => void;
  active: boolean;
  index: number;
}) {
  const palette =
    cue.kind === "slide"
      ? "from-primary/30 to-accent/20 border-primary/30 text-primary"
      : cue.kind === "participant"
      ? "from-success/20 to-success/5 border-success/30 text-success"
      : "from-warning/20 to-warning/5 border-warning/30 text-warning";

  const Icon = cue.kind === "slide" ? Presentation : cue.kind === "participant" ? Users2 : Eye;

  return (
    <motion.button
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
      whileHover={{ y: -3 }}
      onClick={onClick}
      className={`relative group shrink-0 w-[138px] rounded-lg border bg-gradient-to-b ${palette} p-2 pt-1.5 text-left transition-shadow ${
        active ? "shadow-glow ring-1 ring-primary/60" : ""
      }`}
    >
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1">
          <Icon className="w-2.5 h-2.5" />
          <span className="text-[9px] font-mono uppercase tracking-wider opacity-80">{cue.kind}</span>
        </div>
        <span className="font-mono text-[9px] opacity-70">{cue.time}</span>
      </div>

      {/* thumbnail */}
      <div className="relative aspect-video rounded-md bg-surface border border-border/60 overflow-hidden mb-1.5">
        <div className="absolute inset-0 dot-grid opacity-40" />
        <div className="absolute inset-0 grid place-items-center">
          <Icon className="w-5 h-5 opacity-50" />
        </div>
      </div>

      <p className="text-[11px] font-semibold leading-tight text-foreground line-clamp-1">{cue.title}</p>
      {cue.subtitle && (
        <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">{cue.subtitle}</p>
      )}

      {/* axis dot */}
      <span className="absolute left-1/2 -bottom-[9px] -translate-x-1/2 w-2 h-2 rounded-full bg-current ring-2 ring-background" />
    </motion.button>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}
