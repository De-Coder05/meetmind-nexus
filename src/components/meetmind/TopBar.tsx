import { Logo } from "./Logo";
import { Bell, Search, Settings, Command, X } from "lucide-react";
import { useState } from "react";

export type NavView = "library" | "pipelines" | "integrations" | "teams";

interface Props {
  onReset?: () => void;
  activeNav?: NavView;
  onNav?: (v: NavView) => void;
}

export function TopBar({ onReset, activeNav = "library", onNav }: Props) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchVal, setSearchVal]   = useState("");

  const NAV: { key: NavView; label: string }[] = [
    { key: "library",      label: "Library" },
    { key: "pipelines",    label: "Pipelines" },
    { key: "integrations", label: "Integrations" },
    { key: "teams",        label: "Teams" },
  ];

  return (
    <header className="sticky top-0 z-40 glass-strong border-b border-border/60">
      <div className="max-w-[1500px] mx-auto flex items-center justify-between px-6 h-14">
        <button onClick={onReset} className="hover:opacity-80 transition-opacity">
          <Logo />
        </button>

        <nav className="hidden md:flex items-center gap-1">
          {NAV.map(item => (
            <button
              key={item.key}
              onClick={() => onNav?.(item.key)}
              className={`px-3 py-1.5 text-[13px] rounded-md transition-colors ${
                activeNav === item.key
                  ? "bg-white/8 text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {searchOpen ? (
            <div className="flex items-center gap-2 px-3 h-8 rounded-md border border-primary/40 bg-surface/80 text-[12px] min-w-[200px] animate-fade-in-up">
              <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <input
                autoFocus
                value={searchVal}
                onChange={e => setSearchVal(e.target.value)}
                placeholder="Search meetings…"
                className="flex-1 bg-transparent outline-none text-[12px] placeholder:text-muted-foreground/60"
                onKeyDown={e => e.key === "Escape" && setSearchOpen(false)}
              />
              <button onClick={() => { setSearchOpen(false); setSearchVal(""); }}>
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setSearchOpen(true)}
              className="hidden md:flex items-center gap-2 px-3 h-8 rounded-md border border-border bg-surface/80 text-[12px] text-muted-foreground hover:text-foreground transition-colors"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search</span>
              <kbd className="ml-4 font-mono text-[10px] inline-flex items-center gap-0.5 text-muted-foreground/80">
                <Command className="w-2.5 h-2.5" />K
              </kbd>
            </button>
          )}
          <button className="w-8 h-8 rounded-md grid place-items-center text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors">
            <Bell className="w-4 h-4" />
          </button>
          <button
            onClick={() => onNav?.("integrations")}
            className="w-8 h-8 rounded-md grid place-items-center text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>
          <div className="w-8 h-8 rounded-full bg-gradient-primary grid place-items-center text-[11px] font-semibold text-white">AK</div>
        </div>
      </div>
    </header>
  );
}
