import { useEffect, useState } from "react";
import {
  Upload, Link2, Sparkles, FileVideo, Youtube, Mic, ArrowRight, Zap,
  Users, BookOpen, Presentation, Clock, CheckCircle2, ListTodo,
  AlertCircle, Loader2, RefreshCw,
} from "lucide-react";
import { Waveform } from "./Waveform";
import { uploadMeeting, uploadFromUrl, listMeetings, getMeetingStats, type MeetingResult, type MeetingStats } from "@/lib/api";

interface Props {
  onLaunch: (meta: { title: string; type: "meeting" | "lecture"; source: string }) => void;
}

const SEED_PALETTE = [3, 7, 11, 2, 5, 13, 8, 4, 6, 9];

const SPEAKER_COLORS = [
  "linear-gradient(135deg, #6366f1, #8b5cf6)",
  "linear-gradient(135deg, #10b981, #06b6d4)",
  "linear-gradient(135deg, #f59e0b, #ef4444)",
  "linear-gradient(135deg, #ec4899, #8b5cf6)",
  "linear-gradient(135deg, #06b6d4, #3b82f6)",
];

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function timeAgo(dateStr?: string): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function detectTitle(url: string): string {
  if (/youtu/i.test(url)) return "YouTube recording";
  if (/vimeo/i.test(url)) return "Vimeo recording";
  return "External media";
}

// ── Main component ───────────────────────────────

export function CommandCenter({ onLaunch }: Props) {
  const [mode, setMode] = useState<"upload" | "url">("url");
  const [isProcessing, setIsProcessing] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [isValid, setIsValid] = useState(false);

  // Real data
  const [meetings, setMeetings] = useState<MeetingResult[]>([]);
  const [stats, setStats] = useState<MeetingStats | null>(null);
  const [loadingLibrary, setLoadingLibrary] = useState(true);
  const [filterType, setFilterType] = useState<"all" | "meeting" | "lecture">("all");

  useEffect(() => {
    const v = /^(https?:\/\/)(www\.)?(youtube\.com|youtu\.be|vimeo\.com|.+\.(mp4|mov|m4a|mp3|wav|webm))/i.test(
      url.trim(),
    );
    setIsValid(v);
  }, [url]);

  const loadData = async () => {
    setLoadingLibrary(true);
    try {
      const [meetingsData, statsData] = await Promise.all([
        listMeetings().catch(() => []),
        getMeetingStats().catch(() => null),
      ]);
      setMeetings(meetingsData);
      setStats(statsData);
    } finally {
      setLoadingLibrary(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const launch = async (type: "meeting" | "lecture") => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      let data;
      let resolvedTitle: string;
      if (mode === "url") {
        if (!isValid) throw new Error("Please enter a valid URL");
        resolvedTitle = detectTitle(url);
        data = await uploadFromUrl({
          url: url.trim(),
          title: resolvedTitle,
          participants: "",
          push_notion: false,
          push_slack: false,
          push_linear: false,
        });
      } else {
        if (!file) throw new Error("Please select a file first");
        resolvedTitle = file.name.replace(/\.[^.]+$/, "");
        const formData = new FormData();
        formData.append("file", file);
        formData.append("title", resolvedTitle);
        formData.append("participants", "");
        formData.append("push_notion", "false");
        formData.append("push_slack", "false");
        formData.append("push_linear", "false");
        data = await uploadMeeting(formData);
      }
      onLaunch({
        title: resolvedTitle,
        type,
        source: data.meeting_id,
      });
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to start processing");
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredMeetings = meetings.filter((m) => {
    if (filterType === "all") return true;
    return m.content_type === filterType || (filterType === "meeting" && m.content_type === "meeting");
  });

  const doneMeetings = filteredMeetings.filter((m) => m.status === "done");
  const processingMeetings = filteredMeetings.filter(
    (m) => m.status !== "done" && m.status !== "failed",
  );

  // Stats to display
  const displayStats = stats
    ? [
        { k: stats.total_meetings.toString(), v: "Meetings processed" },
        { k: stats.total_decisions.toString(), v: "Decisions captured" },
        { k: stats.total_tasks.toString(), v: "Tasks extracted" },
        { k: `${stats.total_hours}h`, v: "Audio analyzed" },
      ]
    : [
        { k: "—", v: "Meetings processed" },
        { k: "—", v: "Decisions captured" },
        { k: "—", v: "Tasks extracted" },
        { k: "—", v: "Audio analyzed" },
      ];

  return (
    <div className="max-w-[1500px] mx-auto px-6 pt-12 pb-24">
      {/* Hero */}
      <div className="text-center mb-10 animate-fade-in-up">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-[11px] font-mono text-muted-foreground mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
          MULTIMODAL AGENT ENGINE · ONLINE
        </div>
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-balance mb-4">
          The intelligence layer for
          <br />
          <span className="gradient-text">meetings & lectures.</span>
        </h1>
        <p className="text-[15px] text-muted-foreground max-w-xl mx-auto text-balance">
          Drop any recording or link. A multi-agent pipeline extracts decisions, commitments,
          slides and study notes — structured, searchable, and integration-ready.
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
                  mode === "url"
                    ? "bg-gradient-primary text-white shadow-glow"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Link2 className="w-3.5 h-3.5" />
                Paste External URL
              </button>
              <button
                onClick={() => setMode("upload")}
                className={`flex-1 flex items-center justify-center gap-2 h-10 rounded-lg text-[13px] font-medium transition-all ${
                  mode === "upload"
                    ? "bg-gradient-primary text-white shadow-glow"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                Upload Local File
              </button>
            </div>

            {mode === "url" ? (
              <div className="flex items-center gap-2 px-4 h-14">
                <div className="flex items-center gap-2 text-muted-foreground">
                  {url.includes("youtu") ? (
                    <Youtube className="w-4 h-4 text-[#ff3b3b]" />
                  ) : (
                    <Link2 className="w-4 h-4" />
                  )}
                </div>
                <input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && isValid && launch("meeting")}
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
                  {isProcessing ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  {isProcessing ? "Starting…" : "Analyze"}
                  {!isProcessing && <ArrowRight className="w-3.5 h-3.5" />}
                </button>
              </div>
            ) : (
              <div className="relative m-1 rounded-xl border-2 border-dashed border-border hover:border-primary/50 transition-colors p-8 text-center cursor-pointer group">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-surface grid place-items-center group-hover:bg-primary/10 transition-colors">
                    <FileVideo className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <div>
                    <p className="text-[14px] font-medium">
                      {file ? file.name : "Drop a file or click to browse"}
                    </p>
                    <p className="text-[12px] text-muted-foreground mt-0.5 font-mono">
                      MP4 · MOV · MP3 · M4A · WAV · WEBM — up to 500 MB
                    </p>
                  </div>
                  <input
                    type="file"
                    accept=".mp3,.mp4,.wav,.m4a,.ogg,.webm,.mov"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      launch("meeting");
                    }}
                    disabled={isProcessing || !file}
                    className="mt-2 inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-gradient-primary text-white text-[13px] font-medium shadow-glow relative z-10 disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    {isProcessing ? "Processing…" : "Process Recording"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick demos */}
        <div className="mt-4 flex items-center justify-center gap-2 flex-wrap">
          <span className="text-[11px] font-mono text-muted-foreground mr-1">ANALYZE →</span>
          <QuickPill icon={Presentation} label="Meeting" onClick={() => launch("meeting")} />
          <QuickPill icon={BookOpen} label="Lecture" onClick={() => launch("lecture")} />
          <QuickPill icon={Mic} label="Audio only" onClick={() => launch("meeting")} />
        </div>
      </div>

      {/* Stats strip — real data */}
      <div
        className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto mb-14 animate-fade-in-up"
        style={{ animationDelay: "120ms" }}
      >
        {displayStats.map((s) => (
          <div key={s.v} className="card-surface rounded-xl px-4 py-3">
            <div className="text-[20px] font-semibold font-mono tracking-tight">
              {loadingLibrary ? (
                <span className="inline-block w-12 h-5 bg-surface-2 rounded animate-pulse" />
              ) : (
                s.k
              )}
            </div>
            <div className="text-[11px] text-muted-foreground uppercase tracking-wider mt-0.5">
              {s.v}
            </div>
          </div>
        ))}
      </div>

      {/* Recent library — real meetings */}
      <div className="animate-fade-in-up" style={{ animationDelay: "160ms" }}>
        <div className="flex items-end justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Meeting library</h2>
            <p className="text-[13px] text-muted-foreground">
              {loadingLibrary
                ? "Loading…"
                : meetings.length === 0
                ? "No meetings yet — upload your first recording above."
                : `${meetings.length} recording${meetings.length !== 1 ? "s" : ""} in your workspace`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              className="h-8 w-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingLibrary ? "animate-spin" : ""}`} />
            </button>
            <div className="hidden md:flex items-center gap-1 p-1 bg-surface rounded-lg border border-border">
              {(["all", "meeting", "lecture"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilterType(f)}
                  className={`px-3 h-7 rounded-md text-[12px] capitalize transition-colors ${
                    filterType === f
                      ? "bg-white/5 text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Processing in-flight */}
        {processingMeetings.length > 0 && (
          <div className="mb-4 p-3 rounded-xl border border-primary/30 bg-primary/5 flex items-center gap-3">
            <Loader2 className="w-4 h-4 text-primary animate-spin shrink-0" />
            <p className="text-[13px] text-primary">
              {processingMeetings.length} meeting{processingMeetings.length > 1 ? "s" : ""} currently
              processing…
            </p>
            <button
              onClick={loadData}
              className="ml-auto text-[12px] text-primary underline underline-offset-2"
            >
              Refresh
            </button>
          </div>
        )}

        {loadingLibrary ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card-surface rounded-xl p-4 animate-pulse">
                <div className="h-4 w-24 bg-surface-2 rounded mb-3" />
                <div className="h-5 w-4/5 bg-surface-2 rounded mb-2" />
                <div className="h-4 w-full bg-surface-2 rounded mb-1" />
                <div className="h-4 w-3/4 bg-surface-2 rounded mb-6" />
                <div className="h-8 w-full bg-surface-2 rounded" />
              </div>
            ))}
          </div>
        ) : doneMeetings.length === 0 && processingMeetings.length === 0 ? (
          <EmptyLibrary onLaunch={() => launch("meeting")} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {doneMeetings.map((m, i) => (
              <MeetingCard
                key={m.meeting_id}
                meeting={m}
                seed={SEED_PALETTE[i % SEED_PALETTE.length]}
                delay={i * 40}
                onOpen={() =>
                  onLaunch({
                    title: m.title,
                    type: m.content_type === "lecture" ? "lecture" : "meeting",
                    source: m.meeting_id,
                  })
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sub-components ───────────────────────────────

function QuickPill({ icon: Icon, label, onClick }: { icon: React.ElementType; label: string; onClick: () => void }) {
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

function MeetingCard({
  meeting,
  seed,
  delay,
  onOpen,
}: {
  meeting: MeetingResult;
  seed: number;
  delay: number;
  onOpen: () => void;
}) {
  const isLecture = meeting.content_type === "lecture";
  const speakers = Array.from(
    new Set((meeting.utterances || []).map((u) => u.speaker)),
  ).filter((s) => s && s !== "Unknown");

  const decisions = meeting.decisions?.length ?? 0;
  const tasks = meeting.tasks?.length ?? 0;

  const snippetUtterances = (meeting.decisions?.length
    ? meeting.decisions
    : meeting.utterances
  )?.slice(0, 1);
  const snippet = snippetUtterances?.[0]?.text?.slice(0, 110) || meeting.summary?.slice(0, 110) || "";

  return (
    <button
      onClick={onOpen}
      style={{ animationDelay: `${delay}ms` }}
      className="group text-left card-surface rounded-xl p-4 hover:border-primary/40 hover:shadow-elevated transition-all animate-fade-in-up relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-[0.04] transition-opacity" />

      <div className="relative flex items-center justify-between mb-3">
        <span
          className={`inline-flex items-center gap-1 px-2 h-5 rounded-md text-[10px] font-mono uppercase tracking-wider ${
            isLecture
              ? "bg-warning/10 text-warning border border-warning/20"
              : "bg-primary/10 text-primary border border-primary/20"
          }`}
        >
          {isLecture ? <BookOpen className="w-2.5 h-2.5" /> : <Users className="w-2.5 h-2.5" />}
          {meeting.content_type}
        </span>
        <span className="font-mono text-[11px] text-muted-foreground">
          {formatDuration(meeting.duration_seconds ?? 0)}
        </span>
      </div>

      <h3 className="relative text-[14px] font-semibold leading-snug mb-2 line-clamp-2">
        {meeting.title}
      </h3>

      {snippet && (
        <p className="relative text-[12px] text-muted-foreground line-clamp-2 leading-relaxed mb-3">
          {snippet}
        </p>
      )}

      {/* Waveform */}
      <div className="relative h-10 mb-3 opacity-70">
        <Waveform bars={56} seed={seed} />
      </div>

      {/* Footer */}
      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Speaker avatars */}
          <div className="flex -space-x-1.5">
            {speakers.slice(0, 4).map((s, i) => (
              <div
                key={i}
                className="w-6 h-6 rounded-full ring-2 ring-card grid place-items-center text-[9px] font-semibold text-white"
                style={{ background: SPEAKER_COLORS[i % SPEAKER_COLORS.length] }}
              >
                {initials(s)}
              </div>
            ))}
            {speakers.length > 4 && (
              <div className="w-6 h-6 rounded-full bg-surface-2 ring-2 ring-card grid place-items-center text-[9px] text-muted-foreground">
                +{speakers.length - 4}
              </div>
            )}
          </div>
          {/* Quick stats */}
          {decisions > 0 && (
            <span className="inline-flex items-center gap-1 text-[10px] text-success font-mono">
              <CheckCircle2 className="w-2.5 h-2.5" />
              {decisions}
            </span>
          )}
          {tasks > 0 && (
            <span className="inline-flex items-center gap-1 text-[10px] text-primary font-mono">
              <ListTodo className="w-2.5 h-2.5" />
              {tasks}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <Clock className="w-3 h-3" />
          <span className="font-mono">{timeAgo(meeting.created_at)}</span>
        </div>
      </div>
    </button>
  );
}

function EmptyLibrary({ onLaunch }: { onLaunch: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-surface border border-border grid place-items-center mb-4">
        <Sparkles className="w-7 h-7 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">No recordings yet</h3>
      <p className="text-[13px] text-muted-foreground max-w-xs mb-6">
        Upload an audio or video file, or paste a YouTube link to get started.
      </p>
      <button
        onClick={onLaunch}
        className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-gradient-primary text-white text-[13px] font-medium shadow-glow"
      >
        <Sparkles className="w-3.5 h-3.5" />
        Analyze first recording
      </button>
    </div>
  );
}
