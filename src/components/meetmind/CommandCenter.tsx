import { useEffect, useState } from "react";
import { Upload, Link2, Sparkles, FileVideo, Youtube, Mic, ArrowRight, Zap, Users, BookOpen, Presentation } from "lucide-react";
import { Waveform } from "./Waveform";
import { uploadMeeting, uploadFromUrl } from "@/lib/api";

interface Props {
  onLaunch: (meta: { title: string; type: "meeting" | "lecture"; source: string }) => void;
}

const RECENT = [
  {
    id: 1,
    type: "meeting" as const,
    title: "Q3 Growth Strategy — Product & Marketing Sync",
    snippet: "Team aligned on Q3 north-star: activation rate +18%. Three experiments approved, owners assigned.",
    duration: "54:12",
    participants: ["SR", "JM", "AK", "DL", "PN"],
    date: "2h ago",
    status: "ready",
    seed: 3,
  },
  {
    id: 2,
    type: "lecture" as const,
    title: "Stanford CS229 — Lecture 12: Support Vector Machines",
    snippet: "Covered margin maximization, kernel trick (RBF, polynomial) and soft-margin formulation with slack variables.",
    duration: "1:18:40",
    participants: ["AN"],
    date: "Yesterday",
    status: "ready",
    seed: 7,
  },
  {
    id: 3,
    type: "meeting" as const,
    title: "Acme × Northwind — Enterprise Onboarding Call",
    snippet: "SOC2 requirements confirmed. Rollout plan drafted across 3 phases. SSO integration blocker surfaced.",
    duration: "41:05",
    participants: ["MT", "RV", "JK"],
    date: "Yesterday",
    status: "ready",
    seed: 11,
  },
  {
    id: 4,
    type: "lecture" as const,
    title: "Designing Resilient Distributed Systems",
    snippet: "CAP theorem trade-offs, consensus (Raft vs Paxos), and practical patterns for graceful degradation.",
    duration: "48:22",
    participants: ["TG"],
    date: "2d ago",
    status: "ready",
    seed: 2,
  },
  {
    id: 5,
    type: "meeting" as const,
    title: "Engineering Retrospective — Sprint 47",
    snippet: "Velocity up 22%. Flaky test suite flagged as top priority. 4 action items committed.",
    duration: "32:18",
    participants: ["LP", "KM", "VB", "OR"],
    date: "3d ago",
    status: "ready",
    seed: 5,
  },
  {
    id: 6,
    type: "lecture" as const,
    title: "MIT 6.S191 — Deep Learning for Computer Vision",
    snippet: "CNN fundamentals, residual connections, and state-of-the-art vision transformers walkthrough.",
    duration: "1:02:54",
    participants: ["AL"],
    date: "4d ago",
    status: "ready",
    seed: 13,
  },
];

export function CommandCenter({ onLaunch }: Props) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const launch = async (type: "meeting" | "lecture") => {
    if (isProcessing) return;
    setIsProcessing(true);
    
    try {
      let data;
      if (mode === "url") {
        if (!isValid) throw new Error("Please enter a valid URL");
        data = await uploadFromUrl({
          url: url.trim(),
          title: detectTitle(url),
          participants: "",
          push_notion: false,
          push_slack: false,
          push_linear: false
        });
      } else {
        if (!file) throw new Error("Please select a file first");
        const formData = new FormData();
        formData.append("file", file);
        formData.append("title", file.name);
        formData.append("participants", "");
        formData.append("push_notion", "false");
        formData.append("push_slack", "false");
        formData.append("push_linear", "false");
        data = await uploadMeeting(formData);
      }
      
      onLaunch({ 
        title: data.title || "Processing...", 
        type, 
        source: data.meeting_id 
      });
    } catch (err: any) {
      alert(err.message || "Failed to start processing");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-[1500px] mx-auto px-6 pt-12 pb-24">
      {/* Hero */}
      <div className="text-center mb-10 animate-fade-in-up">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-[11px] font-mono text-muted-foreground mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
          MULTIMODAL ENGINE · ONLINE
        </div>
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-balance mb-4">
          The intelligence layer for<br />
          <span className="gradient-text">meetings & lectures.</span>
        </h1>
        <p className="text-[15px] text-muted-foreground max-w-xl mx-auto text-balance">
          Drop any recording or link. MeetMind extracts decisions, commitments, slides and study notes — structured, searchable, and integration-ready.
        </p>
      </div>

      {/* Intelligence Input */}
      <div className="max-w-3xl mx-auto mb-14 animate-fade-in-up" style={{ animationDelay: "80ms" }}>
        <div className="relative">
          <div className="absolute -inset-px rounded-2xl bg-gradient-primary opacity-30 blur-xl" />
          <div className="relative glass-strong rounded-2xl p-1.5">
            {/* Mode toggle */}
            <div className="flex items-center gap-1 p-1 bg-surface/80 rounded-xl mb-1.5">
              <button
                onClick={() => setMode("url")}
                className={`flex-1 flex items-center justify-center gap-2 h-10 rounded-lg text-[13px] font-medium transition-all ${
                  mode === "url" ? "bg-gradient-primary text-white shadow-glow" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Link2 className="w-3.5 h-3.5" />
                Paste External URL
              </button>
              <button
                onClick={() => setMode("upload")}
                className={`flex-1 flex items-center justify-center gap-2 h-10 rounded-lg text-[13px] font-medium transition-all ${
                  mode === "upload" ? "bg-gradient-primary text-white shadow-glow" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                Upload Local File
              </button>
            </div>

            {mode === "url" ? (
              <div className="flex items-center gap-2 px-4 h-14">
                <div className="flex items-center gap-2 text-muted-foreground">
                  {url.includes("youtu") ? <Youtube className="w-4 h-4 text-[#ff3b3b]" /> : <Link2 className="w-4 h-4" />}
                </div>
                <input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Paste YouTube, Vimeo, or direct media link…"
                  className="flex-1 bg-transparent outline-none text-[14px] placeholder:text-muted-foreground/60"
                />
                <button
                  onClick={() => launch("meeting")}
                  disabled={(!isValid && url.length > 0) || isProcessing}
                  className={`flex items-center gap-2 h-10 px-4 rounded-lg text-[13px] font-medium transition-all ${
                    isValid
                      ? "bg-gradient-primary text-white shadow-glow hover:scale-[1.02] animate-pulse-ring"
                      : "bg-surface text-muted-foreground border border-border"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {isProcessing ? "Starting..." : "Scan Multimodal"}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="relative m-1 rounded-xl border-2 border-dashed border-border hover:border-primary/50 transition-colors p-8 text-center cursor-pointer group">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-surface grid place-items-center group-hover:bg-primary/10 transition-colors">
                    <FileVideo className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <div>
                    <p className="text-[14px] font-medium">{file ? file.name : "Drop a file or click to browse"}</p>
                    <p className="text-[12px] text-muted-foreground mt-0.5 font-mono">MP4 · MOV · MP3 · M4A · WAV — up to 4 GB</p>
                  </div>
                  <input
                    type="file"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                  <button
                    onClick={(e) => { e.stopPropagation(); launch("meeting"); }}
                    className="mt-2 inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-gradient-primary text-white text-[13px] font-medium shadow-glow relative z-10"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {isProcessing ? "Processing..." : "Process Recording"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick demos */}
        <div className="mt-4 flex items-center justify-center gap-2 flex-wrap">
          <span className="text-[11px] font-mono text-muted-foreground mr-1">TRY →</span>
          <QuickDemo icon={Presentation} label="Meeting demo" onClick={() => launch("meeting")} />
          <QuickDemo icon={BookOpen} label="Lecture demo" onClick={() => launch("lecture")} />
          <QuickDemo icon={Mic} label="Audio only" onClick={() => launch("meeting")} />
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto mb-14 animate-fade-in-up" style={{ animationDelay: "120ms" }}>
        {[
          { k: "14,208", v: "Hours transcribed" },
          { k: "98.4%", v: "Avg. accuracy" },
          { k: "< 2 min", v: "Median turnaround" },
          { k: "42+", v: "Languages" },
        ].map((s) => (
          <div key={s.v} className="card-surface rounded-xl px-4 py-3">
            <div className="text-[20px] font-semibold font-mono tracking-tight">{s.k}</div>
            <div className="text-[11px] text-muted-foreground uppercase tracking-wider mt-0.5">{s.v}</div>
          </div>
        ))}
      </div>

      {/* Recent library */}
      <div className="animate-fade-in-up" style={{ animationDelay: "160ms" }}>
        <div className="flex items-end justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Recent library</h2>
            <p className="text-[13px] text-muted-foreground">Your multimodal memory — every meeting, searchable.</p>
          </div>
          <div className="hidden md:flex items-center gap-1 p-1 bg-surface rounded-lg border border-border">
            {["All", "Meetings", "Lectures"].map((f, i) => (
              <button
                key={f}
                className={`px-3 h-7 rounded-md text-[12px] transition-colors ${
                  i === 0 ? "bg-white/5 text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {RECENT.map((r, i) => (
            <RecordingCard key={r.id} item={r} onOpen={() => onLaunch({ title: r.title, type: r.type, source: "library://" + r.id })} delay={i * 40} />
          ))}
        </div>
      </div>
    </div>
  );
}

function QuickDemo({ icon: Icon, label, onClick }: { icon: any; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full glass text-[12px] text-muted-foreground hover:text-foreground transition-colors"
    >
      <Icon className="w-3 h-3" />
      {label}
    </button>
  );
}

function RecordingCard({ item, onOpen, delay }: { item: (typeof RECENT)[number]; onOpen: () => void; delay: number }) {
  const isMeeting = item.type === "meeting";
  return (
    <button
      onClick={onOpen}
      style={{ animationDelay: `${delay}ms` }}
      className="group text-left card-surface rounded-xl p-4 hover:border-primary/40 hover:shadow-elevated transition-all animate-fade-in-up relative overflow-hidden"
    >
      {/* subtle hover gradient */}
      <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-[0.04] transition-opacity" />

      <div className="relative flex items-center justify-between mb-3">
        <span
          className={`inline-flex items-center gap-1 px-2 h-5 rounded-md text-[10px] font-mono uppercase tracking-wider ${
            isMeeting
              ? "bg-primary/10 text-primary border border-primary/20"
              : "bg-warning/10 text-warning border border-warning/20"
          }`}
        >
          {isMeeting ? <Users className="w-2.5 h-2.5" /> : <BookOpen className="w-2.5 h-2.5" />}
          {item.type}
        </span>
        <span className="font-mono text-[11px] text-muted-foreground">{item.duration}</span>
      </div>

      <h3 className="relative text-[14px] font-semibold leading-snug mb-2 line-clamp-2">{item.title}</h3>
      <p className="relative text-[12px] text-muted-foreground line-clamp-2 leading-relaxed mb-3">{item.snippet}</p>

      {/* waveform */}
      <div className="relative h-10 mb-3 opacity-80">
        <Waveform bars={56} seed={item.seed} />
      </div>

      <div className="relative flex items-center justify-between">
        <div className="flex -space-x-1.5">
          {item.participants.slice(0, 4).map((p, i) => (
            <div
              key={i}
              className="w-6 h-6 rounded-full ring-2 ring-card grid place-items-center text-[9px] font-semibold"
              style={{ background: PALETTE[i % PALETTE.length] }}
            >
              {p}
            </div>
          ))}
          {item.participants.length > 4 && (
            <div className="w-6 h-6 rounded-full bg-surface-2 ring-2 ring-card grid place-items-center text-[9px] text-muted-foreground">
              +{item.participants.length - 4}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <Zap className="w-3 h-3 text-success" />
          <span className="font-mono">{item.date}</span>
        </div>
      </div>
    </button>
  );
}

const PALETTE = [
  "linear-gradient(135deg, #6366f1, #8b5cf6)",
  "linear-gradient(135deg, #10b981, #06b6d4)",
  "linear-gradient(135deg, #f59e0b, #ef4444)",
  "linear-gradient(135deg, #ec4899, #8b5cf6)",
  "linear-gradient(135deg, #06b6d4, #3b82f6)",
];

function detectTitle(url: string) {
  if (/youtu/i.test(url)) return "YouTube recording";
  if (/vimeo/i.test(url)) return "Vimeo recording";
  return "External media";
}
