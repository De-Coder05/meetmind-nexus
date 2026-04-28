import { Sparkles } from "lucide-react";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className="relative w-8 h-8 rounded-lg bg-gradient-primary grid place-items-center shadow-glow">
        <Sparkles className="w-4 h-4 text-white" strokeWidth={2.5} />
        <div className="absolute inset-0 rounded-lg ring-1 ring-white/20" />
      </div>
      <div className="flex flex-col leading-none">
        <span className="text-[15px] font-semibold tracking-tight">MeetMind</span>
        <span className="text-[10px] font-mono text-muted-foreground tracking-wider">INTELLIGENCE.v2</span>
      </div>
    </div>
  );
}
