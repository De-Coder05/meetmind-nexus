import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ExternalLink, Loader2, Send } from "lucide-react";

type State = "idle" | "beaming" | "success";

interface Integration {
  id: string;
  name: string;
  accent: string;      // hex for brand dot
  viewUrl: string;
}

const INTEGRATIONS: Integration[] = [
  { id: "notion", name: "Notion",  accent: "#ffffff", viewUrl: "https://notion.so" },
  { id: "slack",  name: "Slack",   accent: "#e01e5a", viewUrl: "https://slack.com" },
  { id: "linear", name: "Linear",  accent: "#5e6ad2", viewUrl: "https://linear.app" },
];

export function IntegrationTray({ onStageTasks }: { onStageTasks: () => void }) {
  const [states, setStates] = useState<Record<string, State>>({});

  const push = (id: string) => {
    if (id === "linear") {
      onStageTasks();
      return;
    }
    setStates((s) => ({ ...s, [id]: "beaming" }));
    setTimeout(() => setStates((s) => ({ ...s, [id]: "success" })), 1100);
  };

  return (
    <div className="flex items-center gap-2">
      {INTEGRATIONS.map((i) => (
        <TrayPill key={i.id} integration={i} state={states[i.id] || "idle"} onPush={() => push(i.id)} />
      ))}
    </div>
  );
}

function TrayPill({
  integration,
  state,
  onPush,
}: {
  integration: Integration;
  state: State;
  onPush: () => void;
}) {
  return (
    <div className="relative">
      <motion.button
        layout
        onClick={onPush}
        disabled={state === "beaming"}
        className={`relative overflow-hidden inline-flex items-center gap-2 h-9 px-3 rounded-lg border text-[12px] font-medium transition-all ${
          state === "success"
            ? "bg-success/10 text-success border-success/30"
            : state === "beaming"
            ? "bg-primary/10 text-primary border-primary/40"
            : "bg-surface text-foreground/90 border-border hover:border-primary/40"
        }`}
      >
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: integration.accent }} />
        <span>{integration.id === "linear" ? `Push to ${integration.name}` : `Push to ${integration.name}`}</span>

        <AnimatePresence mode="wait" initial={false}>
          {state === "idle" && (
            <motion.span key="s" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Send className="w-3 h-3" />
            </motion.span>
          )}
          {state === "beaming" && (
            <motion.span key="b" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Loader2 className="w-3 h-3 animate-spin" />
            </motion.span>
          )}
          {state === "success" && (
            <motion.span key="c" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 380, damping: 18 }}>
              <Check className="w-3 h-3" strokeWidth={3} />
            </motion.span>
          )}
        </AnimatePresence>

        {/* Beam particles */}
        {state === "beaming" && (
          <span className="pointer-events-none absolute inset-0 overflow-hidden">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="beam-particle absolute top-1/2 left-4 w-2 h-0.5 rounded-full bg-gradient-primary"
                style={{ animationDelay: `${i * 120}ms` }}
              />
            ))}
          </span>
        )}
      </motion.button>

      {/* Success dropdown */}
      <AnimatePresence>
        {state === "success" && (
          <motion.a
            href={integration.viewUrl}
            target="_blank"
            rel="noreferrer"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute right-0 top-full mt-1.5 inline-flex items-center gap-1.5 px-2.5 h-7 rounded-md glass-strong text-[11px] text-success whitespace-nowrap hover:shadow-glow transition-shadow"
          >
            <Check className="w-3 h-3" />
            Viewed in {integration.name}
            <ExternalLink className="w-2.5 h-2.5 opacity-70" />
          </motion.a>
        )}
      </AnimatePresence>
    </div>
  );
}
