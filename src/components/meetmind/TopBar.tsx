import { Logo } from "./Logo";
import { Bell, Search, Settings, Command } from "lucide-react";

interface Props {
  onReset?: () => void;
}

export function TopBar({ onReset }: Props) {
  return (
    <header className="sticky top-0 z-40 glass-strong border-b border-border/60">
      <div className="max-w-[1500px] mx-auto flex items-center justify-between px-6 h-14">
        <button onClick={onReset} className="hover:opacity-80 transition-opacity">
          <Logo />
        </button>

        <nav className="hidden md:flex items-center gap-1">
          {["Library", "Pipelines", "Integrations", "Teams"].map((item, i) => (
            <button
              key={item}
              className={`px-3 py-1.5 text-[13px] rounded-md transition-colors ${
                i === 0 ? "bg-white/5 text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              }`}
            >
              {item}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button className="hidden md:flex items-center gap-2 px-3 h-8 rounded-md border border-border bg-surface/80 text-[12px] text-muted-foreground hover:text-foreground transition-colors">
            <Search className="w-3.5 h-3.5" />
            <span>Search</span>
            <kbd className="ml-4 font-mono text-[10px] inline-flex items-center gap-0.5 text-muted-foreground/80">
              <Command className="w-2.5 h-2.5" />K
            </kbd>
          </button>
          <button className="w-8 h-8 rounded-md grid place-items-center text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors">
            <Bell className="w-4 h-4" />
          </button>
          <button className="w-8 h-8 rounded-md grid place-items-center text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors">
            <Settings className="w-4 h-4" />
          </button>
          <div className="w-8 h-8 rounded-full bg-gradient-primary grid place-items-center text-[11px] font-semibold">AK</div>
        </div>
      </div>
    </header>
  );
}
