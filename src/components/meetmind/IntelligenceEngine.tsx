import { useState, useEffect, useRef, useCallback } from "react";
import {
  ArrowLeft, Share2, CheckCircle2, HelpCircle, User, Calendar,
  BookOpen, Sparkles, FileDown, MessageSquare,
  Zap, Loader2, Edit3, X, BarChart3, Send, Bot,
  ChevronDown, ChevronUp, Copy, Check, Download,
  Presentation, Clock, Search, SlidersHorizontal,
  Lightbulb, Target, CircleDot, Brain,
} from "lucide-react";
import { Waveform } from "./Waveform";
import {
  getMeetingResult, submitFeedback, askMeeting,
  exportMeetingAsMarkdown, exportMeetingAsJson,
  type MeetingResult, type Utterance, type Task,
} from "@/lib/api";

interface Props {
  title: string;
  type: "meeting" | "lecture";
  meetingId: string;
  onBack: () => void;
}

// ── Types ─────────────────────────────────────────

type Tab = "overview" | "transcript" | "actions" | "slides";

interface ChatMessage {
  id: number;
  role: "user" | "assistant";
  content: string;
  loading?: boolean;
}

// ── Colour maps ───────────────────────────────────

const MEETING_COLORS: Record<string, { bg: string; border: string; text: string; icon: string; label: string }> = {
  decision:      { bg: "bg-emerald-500/8",  border: "border-emerald-500/25", text: "text-emerald-400", icon: "text-emerald-400", label: "Decision" },
  commitment:    { bg: "bg-blue-500/8",     border: "border-blue-500/25",    text: "text-blue-400",    icon: "text-blue-400",    label: "Commitment" },
  discussion:    { bg: "bg-gray-500/8",     border: "border-gray-500/20",    text: "text-gray-400",    icon: "text-gray-400",    label: "Discussion" },
  open_question: { bg: "bg-amber-500/8",    border: "border-amber-500/25",   text: "text-amber-400",   icon: "text-amber-400",   label: "Open Question" },
};

const LECTURE_COLORS: Record<string, { bg: string; border: string; text: string; label: string }> = {
  "Core Concept": { bg: "bg-violet-500/8",  border: "border-violet-500/25",  text: "text-violet-400",  label: "Core Concept" },
  "Key Takeaway": { bg: "bg-emerald-500/8", border: "border-emerald-500/25", text: "text-emerald-400", label: "Key Takeaway" },
  "Question":     { bg: "bg-amber-500/8",   border: "border-amber-500/25",   text: "text-amber-400",   label: "Question" },
  "Exercise":     { bg: "bg-blue-500/8",    border: "border-blue-500/25",    text: "text-blue-400",    label: "Exercise" },
  "Example":      { bg: "bg-cyan-500/8",    border: "border-cyan-500/20",    text: "text-cyan-400",    label: "Example" },
  "Context":      { bg: "bg-gray-500/8",    border: "border-gray-500/20",    text: "text-gray-400",    label: "Context" },
};

const SPEAKER_COLORS = [
  "linear-gradient(135deg,#6366f1,#8b5cf6)",
  "linear-gradient(135deg,#10b981,#06b6d4)",
  "linear-gradient(135deg,#f59e0b,#ef4444)",
  "linear-gradient(135deg,#ec4899,#8b5cf6)",
  "linear-gradient(135deg,#06b6d4,#3b82f6)",
  "linear-gradient(135deg,#84cc16,#22d3ee)",
  "linear-gradient(135deg,#f97316,#fb923c)",
];

const STARTER_QS = [
  "What were the key decisions?",
  "Who has the most action items?",
  "What are the blockers?",
  "Give me a 3-bullet summary.",
  "What needs follow-up urgently?",
];

// ── Helpers ───────────────────────────────────────

function initials(name: string) {
  return name.split(/\s+/).map(w => w[0]).join("").toUpperCase().slice(0, 2);
}
function fmt(s: number) {
  const m = Math.floor(s / 60), sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, "0")}`;
}
function conf(c: number) {
  if (c >= 0.85) return { dot: "bg-emerald-400", label: "High" };
  if (c >= 0.70) return { dot: "bg-amber-400",   label: "Med" };
  return           { dot: "bg-red-400",           label: "Low" };
}
function getLectureStyle(u: Utterance) {
  const m = u.reasoning?.match(/^([^:]+):/);
  if (m) {
    const cat = m[1].trim();
    if (LECTURE_COLORS[cat]) return { ...LECTURE_COLORS[cat] };
  }
  const fb: Record<string, typeof LECTURE_COLORS[string]> = {
    decision:      LECTURE_COLORS["Core Concept"],
    commitment:    LECTURE_COLORS["Key Takeaway"],
    open_question: LECTURE_COLORS["Question"],
    discussion:    LECTURE_COLORS["Context"],
  };
  return fb[u.utterance_type] ?? LECTURE_COLORS["Context"];
}
function getStyle(isLecture: boolean, u: Utterance) {
  if (isLecture) { const s = getLectureStyle(u); return { bg: s.bg, border: s.border, text: s.text, label: s.label }; }
  const s = MEETING_COLORS[u.utterance_type] ?? MEETING_COLORS.discussion;
  return { bg: s.bg, border: s.border, text: s.text, label: s.label };
}
function useCopy() {
  const [copied, setCopied] = useState(false);
  const copy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); });
  };
  return { copied, copy };
}

// ── Main component ────────────────────────────────

export function IntelligenceEngine({ title, type, meetingId, onBack }: Props) {
  const isLecture = type === "lecture";
  const [data, setData]           = useState<MeetingResult | null>(null);
  const [loading, setLoading]     = useState(true);
  const [tab, setTab]             = useState<Tab>("overview");
  const [search, setSearch]       = useState("");
  const [exportOpen, setExportOpen] = useState(false);
  const [copied, setCopied]       = useState(false);
  const [checkedTasks, setCheckedTasks] = useState<Set<number>>(new Set());
  const [feedbackSent, setFeedbackSent] = useState<Set<number>>(new Set());
  const [editingIdx, setEditingIdx]     = useState<number | null>(null);
  const [pushed, setPushed]       = useState(false);

  // Chat
  const [chatOpen, setChatOpen]   = useState(false);
  const [msgs, setMsgs]           = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef  = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getMeetingResult(meetingId)
      .then(setData).catch(console.error).finally(() => setLoading(false));
  }, [meetingId]);

  useEffect(() => { if (chatOpen) setTimeout(() => chatInputRef.current?.focus(), 80); }, [chatOpen]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  const handleAsk = useCallback(async (q?: string) => {
    const question = (q ?? chatInput).trim();
    if (!question || chatLoading) return;
    setChatInput("");
    const id = Date.now();
    setMsgs(p => [...p, { id, role: "user", content: question }, { id: id + 1, role: "assistant", content: "", loading: true }]);
    setChatLoading(true);
    try {
      const res = await askMeeting(meetingId, question);
      setMsgs(p => p.map(m => m.id === id + 1 ? { ...m, content: res.answer, loading: false } : m));
    } catch {
      setMsgs(p => p.map(m => m.id === id + 1 ? { ...m, content: "Couldn't process that. Please try again.", loading: false } : m));
    } finally { setChatLoading(false); }
  }, [chatInput, chatLoading, meetingId]);

  function handleShare() {
    navigator.clipboard.writeText(`${window.location.origin}?meeting_id=${meetingId}`)
      .then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }

  async function handleCorrection(idx: number, u: Utterance, newType: string) {
    try {
      await submitFeedback({ meeting_id: meetingId, utterance_text: u.text, original_type: u.utterance_type, corrected_type: newType });
      setFeedbackSent(p => new Set(p).add(idx));
      setEditingIdx(null);
    } catch { /* silent */ }
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <p className="text-muted-foreground font-mono text-sm">Synthesizing intelligence…</p>
    </div>
  );
  if (!data) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <p className="text-muted-foreground text-sm">No data found.</p>
      <button onClick={onBack} className="text-primary underline text-sm">Go back</button>
    </div>
  );

  const utterances  = data.utterances    ?? [];
  const decisions   = data.decisions     ?? [];
  const commitments = data.commitments   ?? [];
  const openQs      = data.open_questions ?? [];
  const tasks       = data.tasks         ?? [];
  const summary     = data.summary       ?? "";
  const metrics     = data.pipeline_metrics ?? null;
  const slides      = data.slide_contents   ?? [];
  const duration    = data.duration_seconds ?? 0;
  const contentType = data.content_type     ?? "meeting";
  const takeaways   = data.key_takeaways    ?? [];
  const studyNotes  = data.study_notes      ?? [];

  const speakerList = Array.from(new Set(utterances.map(u => u.speaker)))
    .map((name, i) => ({ name, color: SPEAKER_COLORS[i % SPEAKER_COLORS.length], initials: initials(name) }));

  const filteredUtterances = search
    ? utterances.filter(u => u.text.toLowerCase().includes(search.toLowerCase()) || u.speaker.toLowerCase().includes(search.toLowerCase()))
    : utterances;

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: "overview",    label: "Overview" },
    { key: "transcript",  label: "Transcript", count: utterances.length },
    { key: "actions",     label: isLecture ? "Study Guide" : "Actions", count: isLecture ? takeaways.length : tasks.length },
    ...(slides.length > 0 ? [{ key: "slides" as Tab, label: "Slides", count: slides.length }] : []),
  ];

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-6 pb-28">

      {/* ── Top bar ──────────────────────────────────── */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
        <button onClick={onBack} className="inline-flex items-center gap-2 h-9 px-3 rounded-lg bg-surface border border-border text-[13px] text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>
        <div className="flex items-center gap-2 flex-wrap">
          <IntegrationBadge label="Notion"  active={!!metrics} />
          <IntegrationBadge label="Slack"   active={!!metrics} />
          <IntegrationBadge label="Linear"  active={false} />
          <button onClick={handleShare} className="inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-border text-[13px] text-muted-foreground hover:text-foreground transition-colors">
            {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Share2 className="w-3.5 h-3.5" />}
            {copied ? "Copied!" : "Share"}
          </button>
          <div className="relative">
            <button onClick={() => setExportOpen(v => !v)} className="inline-flex items-center gap-2 h-9 px-3 rounded-lg bg-gradient-primary text-white text-[13px] font-medium shadow-glow">
              <FileDown className="w-3.5 h-3.5" />
              Export {exportOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            {exportOpen && (
              <div className="absolute right-0 mt-1 w-44 glass-strong rounded-xl border border-border shadow-elevated z-20 overflow-hidden">
                <button onClick={() => { exportMeetingAsMarkdown(data); setExportOpen(false); }} className="w-full flex items-center gap-2 px-4 py-2.5 text-[13px] hover:bg-white/5">
                  <Download className="w-3.5 h-3.5 text-muted-foreground" /> Markdown (.md)
                </button>
                <button onClick={() => { exportMeetingAsJson(data); setExportOpen(false); }} className="w-full flex items-center gap-2 px-4 py-2.5 text-[13px] hover:bg-white/5">
                  <Download className="w-3.5 h-3.5 text-muted-foreground" /> JSON (.json)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Hero summary ─────────────────────────────── */}
      <div className="relative rounded-2xl overflow-hidden mb-5 animate-fade-in-up">
        <div className="absolute inset-0 bg-gradient-primary opacity-90" />
        <div className="absolute inset-0 dot-grid opacity-25" />
        <div className="relative p-5 md:p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-[220px]">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 text-[10px] font-mono text-white/90 mb-2 uppercase tracking-wider">
                <Sparkles className="w-3 h-3" />
                {isLecture ? "Scholar Mode" : "Meeting Intelligence"} · TL;DR
              </span>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white mb-2 text-balance max-w-2xl">{title}</h1>
              {summary && <p className="text-[13px] text-white/85 leading-relaxed max-w-2xl line-clamp-3">{summary}</p>}
            </div>
            <div className="flex items-center gap-5 text-white/90 shrink-0 flex-wrap">
              <MiniStat k={fmt(duration)}          v="Duration" />
              <MiniStat k={String(speakerList.length)} v={isLecture ? "Speaker" : "Speakers"} />
              <MiniStat k={String(decisions.length)}   v={isLecture ? "Concepts" : "Decisions"} />
              <MiniStat k={String(isLecture ? takeaways.length : tasks.length)} v={isLecture ? "Takeaways" : "Tasks"} />
            </div>
          </div>

          {/* Speaker strip */}
          {speakerList.length > 0 && (
            <div className="mt-4 flex items-center gap-3 flex-wrap">
              {speakerList.map((s, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 px-2.5 h-6 rounded-full bg-white/15 text-[11px] text-white/90">
                  <span className="w-4 h-4 rounded-full grid place-items-center text-[7px] font-bold text-white shrink-0" style={{ background: s.color }}>{s.initials}</span>
                  {s.name}
                </span>
              ))}
              {metrics && (
                <span className="ml-auto inline-flex items-center gap-1.5 px-2.5 h-6 rounded-full bg-white/10 text-[11px] text-white/70 font-mono">
                  <BarChart3 className="w-3 h-3" />
                  ${metrics.estimated_cost_usd.toFixed(4)} · {(metrics.total_ms / 1000).toFixed(1)}s · {metrics.gemini_model}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Tab bar ──────────────────────────────────── */}
      <div className="flex items-center gap-1 mb-5 p-1 bg-surface rounded-xl border border-border w-fit">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 h-8 rounded-lg text-[13px] font-medium transition-all ${
              tab === t.key ? "bg-gradient-primary text-white shadow-glow" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
            {t.count !== undefined && (
              <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono ${tab === t.key ? "bg-white/20" : "bg-surface-2"}`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════════════ */}
      {/* OVERVIEW TAB                                 */}
      {/* ════════════════════════════════════════════ */}
      {tab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 animate-fade-in-up">

          {/* Column 1 — Decisions / Core Concepts */}
          <div className="space-y-3">
            <SectionHeader
              icon={isLecture ? Lightbulb : CheckCircle2}
              title={isLecture ? "Core Concepts" : "Decisions"}
              count={decisions.length}
              color="text-emerald-400"
            />
            {decisions.length === 0 ? <EmptyCard text={`No ${isLecture ? "core concepts" : "decisions"} detected`} /> :
              decisions.map((u, i) => (
                <InsightCard
                  key={i}
                  utterance={u}
                  isLecture={isLecture}
                  typeOverride={isLecture ? "Core Concept" : undefined}
                />
              ))
            }
          </div>

          {/* Column 2 — Tasks / Key Takeaways */}
          <div className="space-y-3">
            <SectionHeader
              icon={isLecture ? Target : CircleDot}
              title={isLecture ? "Key Takeaways" : "Action Items"}
              count={isLecture ? commitments.length : tasks.length}
              color="text-primary"
            />
            {isLecture ? (
              commitments.length === 0 ? <EmptyCard text="No key takeaways identified" /> :
              commitments.map((u, i) => <InsightCard key={i} utterance={u} isLecture={isLecture} typeOverride="Key Takeaway" />)
            ) : (
              tasks.length === 0 ? <EmptyCard text="No action items extracted" /> :
              tasks.map((t, i) => (
                <TaskCard
                  key={i}
                  task={t}
                  checked={checkedTasks.has(i)}
                  onToggle={() => setCheckedTasks(p => { const n = new Set(p); n.has(i) ? n.delete(i) : n.add(i); return n; })}
                />
              ))
            )}
          </div>

          {/* Column 3 — Open Questions */}
          <div className="space-y-3">
            <SectionHeader
              icon={HelpCircle}
              title={isLecture ? "Questions & Exercises" : "Open Questions"}
              count={openQs.length}
              color="text-warning"
            />
            {openQs.length === 0 ? <EmptyCard text={`No ${isLecture ? "questions" : "open questions"} detected`} /> :
              openQs.map((u, i) => (
                <InsightCard
                  key={i}
                  utterance={u}
                  isLecture={isLecture}
                  typeOverride={isLecture ? "Question" : undefined}
                />
              ))
            }
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════ */}
      {/* TRANSCRIPT TAB                               */}
      {/* ════════════════════════════════════════════ */}
      {tab === "transcript" && (
        <div className="animate-fade-in-up">
          {/* Search bar */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex-1 flex items-center gap-2 px-3 h-9 rounded-lg bg-surface border border-border">
              <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search transcript…"
                className="flex-1 bg-transparent outline-none text-[13px] placeholder:text-muted-foreground/60"
              />
              {search && <button onClick={() => setSearch("")}><X className="w-3.5 h-3.5 text-muted-foreground" /></button>}
            </div>
            <span className="text-[12px] text-muted-foreground font-mono shrink-0">
              {filteredUtterances.length} / {utterances.length}
            </span>
          </div>

          {/* Speaker timeline mini */}
          {speakerList.length > 1 && duration > 0 && (
            <div className="card-surface rounded-xl p-4 mb-4">
              <p className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider mb-3">Speaker timeline · {fmt(duration)}</p>
              <div className="space-y-1.5">
                {speakerList.map(s => {
                  const su = utterances.filter(u => u.speaker === s.name);
                  const pct = ((su.reduce((a, u) => a + (u.end_time - u.start_time), 0) / duration) * 100).toFixed(0);
                  return (
                    <div key={s.name} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full grid place-items-center text-[8px] font-bold text-white shrink-0" style={{ background: s.color }}>{s.initials}</div>
                      <span className="text-[11px] w-20 truncate">{s.name}</span>
                      <div className="flex-1 h-4 rounded bg-surface-2 relative overflow-hidden">
                        {su.map((u, i) => (
                          <div key={i} className="absolute top-0 bottom-0 rounded-sm opacity-80"
                            style={{ left: `${(u.start_time / duration) * 100}%`, width: `${Math.max(0.5, ((u.end_time - u.start_time) / duration) * 100)}%`, background: s.color }} />
                        ))}
                      </div>
                      <span className="font-mono text-[10px] text-muted-foreground w-8 text-right">{pct}%</span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 h-6 opacity-50"><Waveform bars={100} seed={4} /></div>
            </div>
          )}

          {/* Utterance list */}
          <div className="space-y-2">
            {filteredUtterances.map((u, i) => {
              const sp = speakerList.find(s => s.name === u.speaker);
              const style = getStyle(isLecture, u);
              const c = conf(u.classification_confidence ?? 0);
              const isEditing = editingIdx === i;
              const corrected = feedbackSent.has(i);
              return (
                <div key={i} className={`group relative p-3.5 rounded-xl border transition-colors ${style.bg} ${style.border}`}>
                  <div className="flex items-center gap-2 mb-2">
                    {sp && <div className="w-5 h-5 rounded-full grid place-items-center text-[8px] font-bold text-white shrink-0" style={{ background: sp.color }}>{sp.initials}</div>}
                    <span className="text-[12px] font-semibold truncate max-w-[100px]">{u.speaker}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">{fmt(u.start_time)}</span>
                    <span className={`ml-auto px-1.5 py-0.5 rounded text-[9px] font-mono uppercase ${style.bg} ${style.text} border ${style.border}`}>{style.label}</span>
                    <span className={`w-1.5 h-1.5 rounded-full ${c.dot} shrink-0`} title={`${c.label} confidence`} />
                    {!corrected ? (
                      <button onClick={() => setEditingIdx(isEditing ? null : i)} className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-white/5">
                        <Edit3 className="w-3 h-3 text-muted-foreground" />
                      </button>
                    ) : <span className="text-[9px] text-emerald-400 font-mono shrink-0">✓ fixed</span>}
                  </div>
                  <p className="text-[13px] leading-relaxed pl-7">{u.text}</p>
                  {u.reasoning && <p className="text-[10px] text-muted-foreground/50 italic pl-7 mt-1 truncate">{u.reasoning}</p>}
                  {isEditing && (
                    <div className="mt-3 ml-7 p-2.5 rounded-lg bg-surface border border-border animate-fade-in-up">
                      <p className="text-[10px] text-muted-foreground mb-2 font-mono">CORRECT TO:</p>
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(MEETING_COLORS).map(([key, val]) => (
                          <button key={key} onClick={() => handleCorrection(i, u, key)}
                            disabled={key === u.utterance_type}
                            className={`px-2 py-1 rounded text-[10px] font-mono transition-all ${key === u.utterance_type ? "opacity-30 cursor-not-allowed" : `${val.bg} ${val.text} hover:opacity-80`}`}>
                            {val.label}
                          </button>
                        ))}
                        <button onClick={() => setEditingIdx(null)} className="p-1 rounded hover:bg-surface-2"><X className="w-3 h-3 text-muted-foreground" /></button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {filteredUtterances.length === 0 && (
              <div className="text-center py-16 text-muted-foreground text-sm">No utterances match "{search}"</div>
            )}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════ */}
      {/* ACTIONS / STUDY GUIDE TAB                    */}
      {/* ════════════════════════════════════════════ */}
      {tab === "actions" && (
        <div className="animate-fade-in-up">
          {isLecture ? (
            // Study guide for lectures
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {takeaways.length > 0 && (
                <div>
                  <SectionHeader icon={Target} title="Key Takeaways" count={takeaways.length} color="text-emerald-400" />
                  <div className="space-y-3 mt-3">
                    {takeaways.map((t, i) => (
                      <div key={i} className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                        <div className="flex items-start gap-2 mb-1">
                          <span className="mt-0.5 w-5 h-5 rounded-full bg-emerald-500/20 grid place-items-center shrink-0">
                            <Check className="w-2.5 h-2.5 text-emerald-400" />
                          </span>
                          <p className="text-[13px] font-semibold">{t.title}</p>
                          <span className={`ml-auto shrink-0 text-[9px] font-mono px-1.5 py-0.5 rounded uppercase ${t.importance === "high" ? "bg-destructive/10 text-destructive" : t.importance === "low" ? "bg-gray-500/10 text-gray-400" : "bg-warning/10 text-warning"}`}>{t.importance}</span>
                        </div>
                        <p className="text-[12px] text-muted-foreground pl-7 leading-relaxed">{t.explanation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {studyNotes.length > 0 && (
                <div>
                  <SectionHeader icon={BookOpen} title="Study Notes" count={studyNotes.length} color="text-warning" />
                  <div className="space-y-3 mt-3">
                    {studyNotes.map((n, i) => (
                      <div key={i} className="p-4 rounded-xl card-surface">
                        <p className="text-[13px] font-semibold mb-1">{n.topic}</p>
                        <p className="text-[12px] text-muted-foreground leading-relaxed mb-2">{n.content}</p>
                        {n.key_terms.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {n.key_terms.map((term, j) => (
                              <span key={j} className="px-2 py-0.5 rounded-full bg-surface-2 border border-border text-[10px] font-mono text-muted-foreground">{term}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {takeaways.length === 0 && studyNotes.length === 0 && <EmptyCard text="No study guide data generated" />}
            </div>
          ) : (
            // Task checklist for meetings
            <div className="max-w-2xl space-y-4">
              <div className="flex items-center justify-between mb-1">
                <SectionHeader icon={CircleDot} title="Action Items" count={tasks.length} color="text-primary" />
                <span className="text-[12px] text-muted-foreground font-mono">{checkedTasks.size}/{tasks.length} done</span>
              </div>
              {/* Progress bar */}
              {tasks.length > 0 && (
                <div className="h-1.5 rounded-full bg-surface overflow-hidden mb-4">
                  <div className="h-full rounded-full bg-gradient-primary transition-all duration-500"
                    style={{ width: `${(checkedTasks.size / tasks.length) * 100}%` }} />
                </div>
              )}
              {tasks.length === 0 ? <EmptyCard text="No action items extracted" /> :
                tasks.map((t, i) => (
                  <div key={i}
                    className={`flex items-start gap-3 p-4 rounded-xl border transition-all cursor-pointer ${checkedTasks.has(i) ? "opacity-50 bg-surface border-border" : "card-surface hover:border-primary/30"}`}
                    onClick={() => setCheckedTasks(p => { const n = new Set(p); n.has(i) ? n.delete(i) : n.add(i); return n; })}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 grid place-items-center shrink-0 mt-0.5 transition-all ${checkedTasks.has(i) ? "bg-success border-success" : "border-border"}`}>
                      {checkedTasks.has(i) && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-[14px] font-medium leading-snug ${checkedTasks.has(i) ? "line-through" : ""}`}>{t.title}</p>
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        {t.owner && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                            <User className="w-3 h-3" />{t.owner}
                          </span>
                        )}
                        {t.deadline && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground font-mono">
                            <Calendar className="w-3 h-3" />{t.deadline}
                          </span>
                        )}
                        <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider font-mono ${t.priority === "high" ? "bg-destructive/10 text-destructive" : t.priority === "low" ? "bg-gray-500/10 text-gray-400" : "bg-warning/10 text-warning"}`}>
                          {t.priority}
                        </span>
                      </div>
                      {t.context_quote && <p className="text-[11px] text-muted-foreground mt-1.5 italic">"{t.context_quote}"</p>}
                    </div>
                  </div>
                ))
              }
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════ */}
      {/* SLIDES TAB                                   */}
      {/* ════════════════════════════════════════════ */}
      {tab === "slides" && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-fade-in-up">
          {slides.map((s, i) => (
            <div key={i} className="group cursor-pointer">
              <div className="relative aspect-video rounded-xl bg-gradient-subtle border border-border overflow-hidden group-hover:border-primary/40 transition-colors">
                <div className="absolute inset-0 dot-grid opacity-30" />
                <div className="absolute inset-0 p-3 flex flex-col justify-between">
                  <span className="font-mono text-[9px] text-muted-foreground">SLIDE {String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <p className="text-[12px] font-semibold leading-tight mb-1">{s.title || `Slide ${i + 1}`}</p>
                    <div className="flex gap-0.5"><div className="h-1 w-5 rounded bg-primary/60" /><div className="h-1 w-3 rounded bg-primary/30" /></div>
                  </div>
                </div>
              </div>
              {s.content && <p className="text-[11px] text-muted-foreground mt-1.5 leading-snug px-0.5 line-clamp-2">{s.content}</p>}
            </div>
          ))}
        </div>
      )}

      {/* ── Floating action bar ───────────────────── */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 glass-strong rounded-full px-2 py-2 flex items-center gap-1 shadow-elevated">
        <FabBtn icon={MessageSquare} label="Ask AI" onClick={() => setChatOpen(true)} primary />
        <FabBtn icon={Share2}        label="Share"   onClick={handleShare} />
        <FabBtn icon={FileDown}      label="Export"  onClick={() => setExportOpen(v => !v)} />
        <div className="w-px h-5 bg-border mx-1" />
        <FabBtn
          icon={pushed ? Check : Zap}
          label={pushed ? "Pushed!" : "Push to Linear"}
          onClick={() => { setPushed(true); setTimeout(() => setPushed(false), 3000); }}
          success={pushed}
        />
      </div>

      {/* ── Chat panel ──────────────────────────────── */}
      {chatOpen && (
        <div className="fixed inset-0 z-40 flex items-end justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setChatOpen(false)} />
          <div className="relative w-full max-w-2xl glass-strong rounded-2xl border border-border shadow-elevated flex flex-col max-h-[72vh] animate-fade-in-up">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-border shrink-0">
              <div className="w-8 h-8 rounded-xl bg-gradient-primary grid place-items-center shadow-glow">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-[14px] font-semibold">Ask about this {isLecture ? "lecture" : "meeting"}</p>
                <p className="text-[11px] text-muted-foreground font-mono">Gemini 2.5 Flash · Conversational agent</p>
              </div>
              <button onClick={() => setChatOpen(false)} className="ml-auto p-1.5 rounded-lg hover:bg-white/5 text-muted-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4 min-h-0">
              {msgs.length === 0 ? (
                <div className="text-center py-6">
                  <Bot className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-[13px] text-muted-foreground mb-4">Ask anything — decisions, owners, next steps, concepts.</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {STARTER_QS.map(q => (
                      <button key={q} onClick={() => handleAsk(q)}
                        className="text-[12px] px-3 py-1.5 rounded-full glass border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all">
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              ) : msgs.map(m => (
                <div key={m.id} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                  <div className={`w-7 h-7 rounded-full shrink-0 grid place-items-center text-[11px] font-semibold ${m.role === "user" ? "bg-primary text-white" : "bg-gradient-primary text-white"}`}>
                    {m.role === "user" ? "U" : <Bot className="w-3.5 h-3.5" />}
                  </div>
                  <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-[13px] leading-relaxed ${m.role === "user" ? "bg-primary text-white rounded-tr-sm" : "bg-surface border border-border rounded-tl-sm"}`}>
                    {m.loading ? <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="w-3.5 h-3.5 animate-spin" /><span className="text-[12px]">Thinking…</span></div>
                      : <p className="whitespace-pre-wrap">{m.content}</p>}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <div className="px-4 pb-4 pt-3 border-t border-border shrink-0">
              <div className="flex items-center gap-2 bg-surface rounded-xl border border-border px-4 py-2.5">
                <input ref={chatInputRef} value={chatInput} onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAsk(); } }}
                  placeholder="Ask anything about this content…" disabled={chatLoading}
                  className="flex-1 bg-transparent outline-none text-[13px] placeholder:text-muted-foreground/60" />
                <button onClick={() => handleAsk()} disabled={!chatInput.trim() || chatLoading}
                  className="w-8 h-8 rounded-lg bg-gradient-primary text-white grid place-items-center shadow-glow disabled:opacity-40 transition-opacity">
                  {chatLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ───────────────────────────────

function InsightCard({ utterance, isLecture, typeOverride }: { utterance: Utterance; isLecture: boolean; typeOverride?: string }) {
  const [expanded, setExpanded] = useState(false);
  const { copied, copy } = useCopy();
  const style = typeOverride
    ? (LECTURE_COLORS[typeOverride] ?? { bg: "bg-gray-500/8", border: "border-gray-500/20", text: "text-gray-400", label: typeOverride })
    : getStyle(isLecture, utterance);

  return (
    <div
      onClick={() => setExpanded(v => !v)}
      className={`group relative p-4 rounded-xl border cursor-pointer transition-all hover:shadow-sm ${style.bg} ${style.border}`}
    >
      <p className={`text-[13px] leading-relaxed ${expanded ? "" : "line-clamp-2"}`}>{utterance.text}</p>
      <div className="flex items-center gap-2 mt-2.5">
        <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono uppercase ${style.text}`}>{style.label}</span>
        <span className="text-[10px] text-muted-foreground">{utterance.speaker}</span>
        <span className="text-[10px] text-muted-foreground font-mono">{fmt(utterance.start_time)}</span>
        <button
          onClick={e => { e.stopPropagation(); copy(utterance.text); }}
          className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-white/5"
        >
          {copied ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
        </button>
      </div>
      {!expanded && utterance.text.length > 120 && (
        <div className={`absolute bottom-0 left-0 right-0 h-6 rounded-b-xl`}
          style={{ background: `linear-gradient(to bottom, transparent, hsl(var(--card)))` }} />
      )}
    </div>
  );
}

function TaskCard({ task, checked, onToggle }: { task: Task; checked: boolean; onToggle: () => void }) {
  return (
    <div
      onClick={onToggle}
      className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${checked ? "opacity-50 bg-surface border-border" : "card-surface hover:border-primary/20"}`}
    >
      <div className={`w-4 h-4 rounded border-2 grid place-items-center shrink-0 mt-0.5 transition-all ${checked ? "bg-success border-success" : "border-border"}`}>
        {checked && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-[13px] font-medium leading-snug ${checked ? "line-through text-muted-foreground" : ""}`}>{task.title}</p>
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          {task.owner && <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground"><User className="w-2.5 h-2.5" />{task.owner}</span>}
          {task.deadline && <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground font-mono"><Calendar className="w-2.5 h-2.5" />{task.deadline}</span>}
          <span className={`px-1 py-0.5 rounded text-[8px] uppercase font-mono ${task.priority === "high" ? "bg-destructive/10 text-destructive" : task.priority === "low" ? "text-gray-400" : "bg-warning/10 text-warning"}`}>
            {task.priority}
          </span>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ icon: Icon, title, count, color }: { icon: React.ElementType; title: string; count: number; color: string }) {
  return (
    <div className="flex items-center gap-2 mb-1">
      <Icon className={`w-4 h-4 ${color}`} />
      <h3 className="text-[14px] font-semibold">{title}</h3>
      <span className="ml-auto text-[11px] font-mono text-muted-foreground">{count}</span>
    </div>
  );
}

function EmptyCard({ text }: { text: string }) {
  return (
    <div className="p-5 rounded-xl border border-dashed border-border text-center">
      <p className="text-[12px] text-muted-foreground opacity-60">{text}</p>
    </div>
  );
}

function MiniStat({ k, v }: { k: string; v: string }) {
  return (
    <div className="text-center">
      <div className="text-lg font-semibold font-mono tracking-tight">{k}</div>
      <div className="text-[9px] uppercase tracking-wider text-white/65">{v}</div>
    </div>
  );
}

function IntegrationBadge({ label, active }: { label: string; active?: boolean }) {
  return (
    <button className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[12px] font-medium border transition-all ${active ? "bg-success/10 text-success border-success/30" : "bg-surface text-muted-foreground border-border hover:text-foreground"}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${active ? "bg-success animate-pulse" : "bg-muted-foreground/40"}`} />
      {label}
    </button>
  );
}

function FabBtn({ icon: Icon, label, onClick, primary, success }: { icon: React.ElementType; label: string; onClick: () => void; primary?: boolean; success?: boolean }) {
  return (
    <button onClick={onClick} className={`inline-flex items-center gap-2 h-10 px-4 rounded-full text-[12px] font-medium transition-all ${primary ? "bg-gradient-primary text-white shadow-glow hover:scale-[1.02]" : success ? "bg-success/15 text-success border border-success/30" : "text-muted-foreground hover:text-foreground hover:bg-white/5"}`}>
      <Icon className="w-3.5 h-3.5" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
