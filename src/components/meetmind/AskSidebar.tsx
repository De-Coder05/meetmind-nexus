import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Send, X, MessageSquareText, Clock, ArrowUpRight } from "lucide-react";

export interface ChatCitation {
  time: string;
  label: string;
}
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  citations?: ChatCitation[];
}

interface Props {
  open: boolean;
  onClose: () => void;
  onJump: (time: string) => void;
}

const QUICK_ACTIONS = [
  { label: "Summarize the slides", prompt: "Summarize the slides shown in this meeting." },
  { label: "Extract all dates", prompt: "Extract every date or deadline mentioned." },
  { label: "Draft follow-up email", prompt: "Draft a follow-up email to the participants based on these notes." },
  { label: "List open questions", prompt: "List all open questions that need follow-up." },
];

const SEED: ChatMessage[] = [
  {
    id: "seed-1",
    role: "assistant",
    text:
      "Hi — I've processed the full transcript, slides and speaker timeline. Ask anything, or try a quick action below.",
  },
];

export function AskSidebar({ open, onClose, onJump }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>(SEED);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const ask = (prompt: string) => {
    if (!prompt.trim()) return;
    const id = crypto.randomUUID();
    setMessages((m) => [...m, { id, role: "user", text: prompt }]);
    setInput("");
    setTyping(true);

    // Simulated reply (wire to FastAPI later)
    setTimeout(() => {
      setMessages((m) => [
        ...m,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: fakeAnswer(prompt),
          citations: [
            { time: "00:34", label: "Jordan on engineering capacity" },
            { time: "02:58", label: "Decision: ship 1 & 2" },
          ],
        },
      ]);
      setTyping(false);
    }, 900);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          />
          <motion.aside
            initial={{ x: 420, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 420, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 28 }}
            className="fixed right-0 top-14 bottom-0 z-40 w-full max-w-[400px] glass-strong border-l border-border/60 flex flex-col"
          >
            {/* header */}
            <div className="flex items-center justify-between px-4 h-14 border-b border-border/60">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-primary grid place-items-center shadow-glow">
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="leading-tight">
                  <p className="text-[13px] font-semibold">Ask MeetMind</p>
                  <p className="text-[10px] font-mono text-muted-foreground">Context-aware · grounded in this recording</p>
                </div>
              </div>
              <button onClick={onClose} className="w-8 h-8 grid place-items-center rounded-md hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {messages.map((m) => (
                <Bubble key={m.id} msg={m} onJump={onJump} />
              ))}
              {typing && (
                <div className="flex items-center gap-1.5 px-3 py-2 w-16 rounded-2xl bg-surface border border-border">
                  <Dot delay={0} /><Dot delay={0.15} /><Dot delay={0.3} />
                </div>
              )}
              <div ref={endRef} />
            </div>

            {/* quick actions */}
            <div className="px-4 pb-2">
              <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1.5">Quick actions</p>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_ACTIONS.map((q) => (
                  <button
                    key={q.label}
                    onClick={() => ask(q.prompt)}
                    className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full bg-surface border border-border text-[11px] text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
                  >
                    <Sparkles className="w-2.5 h-2.5" />
                    {q.label}
                  </button>
                ))}
              </div>
            </div>

            {/* input */}
            <form
              onSubmit={(e) => { e.preventDefault(); ask(input); }}
              className="p-3 border-t border-border/60"
            >
              <div className="flex items-center gap-2 px-3 h-11 rounded-xl bg-surface border border-border focus-within:border-primary/50 transition-colors">
                <MessageSquareText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about this recording…"
                  className="flex-1 bg-transparent outline-none text-[13px] placeholder:text-muted-foreground/60"
                />
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="w-7 h-7 rounded-md grid place-items-center bg-gradient-primary text-white disabled:opacity-30 disabled:saturate-0 transition-opacity"
                >
                  <Send className="w-3 h-3" />
                </button>
              </div>
            </form>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function Bubble({ msg, onJump }: { msg: ChatMessage; onJump: (t: string) => void }) {
  const isUser = msg.role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
          isUser
            ? "bg-gradient-primary text-white shadow-glow"
            : "bg-surface border border-border text-foreground/95"
        }`}
      >
        <p className="whitespace-pre-wrap">{msg.text}</p>
        {msg.citations && msg.citations.length > 0 && (
          <div className="mt-2.5 pt-2.5 border-t border-border/60 space-y-1">
            <p className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground mb-1">Citations</p>
            {msg.citations.map((c, i) => (
              <button
                key={i}
                onClick={() => onJump(c.time)}
                className="flex items-center gap-1.5 text-[11px] text-primary hover:text-primary-glow transition-colors group"
              >
                <Clock className="w-2.5 h-2.5" />
                <span className="font-mono">{c.time}</span>
                <span className="text-muted-foreground group-hover:text-foreground transition-colors">· {c.label}</span>
                <ArrowUpRight className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function Dot({ delay }: { delay: number }) {
  return (
    <motion.span
      className="w-1.5 h-1.5 rounded-full bg-muted-foreground"
      animate={{ opacity: [0.3, 1, 0.3] }}
      transition={{ duration: 1.1, repeat: Infinity, delay }}
    />
  );
}

function fakeAnswer(prompt: string) {
  const p = prompt.toLowerCase();
  if (p.includes("summar")) return "The four slides cover Q3 priorities (activation as north-star), experiment ranking, engineering capacity, and the shipping timeline. Headline: commit to progressive onboarding + empty-state redesign, defer referrals.";
  if (p.includes("date")) return "Key dates mentioned: Friday EOD (scoped engineering plan), Tue May 4 (onboarding v2 designs), Wed May 5 (empty-state brief), Thu May 6 (referral discovery hypothesis).";
  if (p.includes("email")) return "Subject: Q3 sync — decisions & owners\n\nHi team,\n\nQuick recap from today. North-star for Q3 is activation (+18% target). We're committing to progressive onboarding and empty-state redesign this quarter; referrals move to a discovery sprint. Owners: Jordan (eng plan, Fri), Amara (designs, Tue), Priya (referral hypothesis, Thu).\n\nThanks!";
  if (p.includes("question")) return "Open questions flagged: (1) Legal review for referral incentives, (2) Fallback if SSO slips past phase 1, (3) Owner for enterprise-roadmap communication.";
  return "Based on the transcript, the most relevant moment is around the middle of the discussion where the team aligned on priorities. See citations below.";
}
