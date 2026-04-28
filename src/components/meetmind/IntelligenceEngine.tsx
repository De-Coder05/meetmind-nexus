import { useState, useEffect } from "react";
import { ArrowLeft, Share2, Download, CheckCircle2, Circle, HelpCircle, Clock, User, Calendar, Presentation, Users2, BookOpen, Sparkles, Play, FileDown, MessageSquare, Zap, Loader2 } from "lucide-react";
import { Waveform } from "./Waveform";
import { getMeetingResult } from "@/lib/api";

interface Props {
  title: string;
  type: "meeting" | "lecture";
  meetingId: string;
  onBack: () => void;
}

const SPEAKERS = [
  { id: "SR", name: "Sarah Rhodes", role: "Product Lead", color: "linear-gradient(135deg, #6366f1, #8b5cf6)" },
  { id: "JM", name: "Jordan Myles", role: "Engineering", color: "linear-gradient(135deg, #10b981, #06b6d4)" },
  { id: "AK", name: "Amara Kade", role: "Design", color: "linear-gradient(135deg, #f59e0b, #ef4444)" },
  { id: "DL", name: "Daniel Liu", role: "Growth", color: "linear-gradient(135deg, #ec4899, #8b5cf6)" },
  { id: "PN", name: "Priya Nair", role: "Data", color: "linear-gradient(135deg, #06b6d4, #3b82f6)" },
];

const TRANSCRIPT = [
  { speaker: "SR", time: "00:12", text: "Alright, let's kick off. The goal today is to lock the Q3 north-star and walk away with owners on the top three experiments." },
  { speaker: "JM", time: "00:34", text: "Before we do — engineering capacity is tight. We can commit to two experiments cleanly, the third will need tradeoffs." },
  { speaker: "AK", time: "01:02", text: "Design is aligned with activation as the north-star. The new onboarding flow tested well — 18% lift in week-one retention." },
  { speaker: "DL", time: "01:45", text: "Growth is proposing: 1) progressive onboarding, 2) empty-state redesign, 3) referral loops. Ranked by projected impact." },
  { speaker: "PN", time: "02:20", text: "Data supports 1 and 2. For referrals, we don't have enough signal yet — I'd suggest scoping a discovery sprint first." },
  { speaker: "SR", time: "02:58", text: "Good. Decision: we ship 1 and 2 this quarter, referrals moves to discovery. Jordan, can you own the engineering plan by Friday?" },
  { speaker: "JM", time: "03:15", text: "Yes. I'll have a scoped plan with estimates in the doc by EOD Friday." },
];

const DECISIONS = [
  { title: "Activation rate chosen as Q3 north-star metric", detail: "Target: +18% lift over baseline by end of quarter." },
  { title: "Ship progressive onboarding + empty-state redesign this quarter", detail: "Referral loops deferred to discovery sprint." },
  { title: "Adopt SOC2 Type II as compliance baseline", detail: "Enterprise prerequisite surfaced in Northwind call." },
];

const COMMITMENTS = [
  { who: "JM", text: "Deliver scoped engineering plan with estimates", due: "Fri · Apr 30", priority: "high" },
  { who: "AK", text: "Finalize onboarding v2 designs for review", due: "Tue · May 4", priority: "high" },
  { who: "PN", text: "Scope referral discovery sprint (hypothesis doc)", due: "Thu · May 6", priority: "med" },
  { who: "DL", text: "Draft experiment brief for empty-state redesign", due: "Wed · May 5", priority: "med" },
];

const QUESTIONS = [
  "Do we need legal review for the referral incentive structure?",
  "What's the fallback if SSO integration slips past phase 1?",
  "Who owns communication to enterprise customers about the roadmap shift?",
];

const SLIDES = [
  { title: "Q3 Priorities", caption: "Activation as north-star · +18% target" },
  { title: "Experiment Ranking", caption: "Progressive onboarding > Empty-state > Referrals" },
  { title: "Engineering Capacity", caption: "2 experiments committed, 1 in discovery" },
  { title: "Timeline", caption: "Ship by Week 10 · Review Week 12" },
];

const LECTURE_NOTES = [
  {
    keyword: "Margin",
    content: "The SVM seeks the hyperplane that maximizes the margin — the distance to the nearest points (support vectors) of each class.",
  },
  {
    keyword: "Kernel trick",
    content: "Implicit mapping to higher-dimensional spaces. Common kernels: linear, polynomial, RBF (Gaussian). Enables non-linear decision boundaries without explicit feature engineering.",
  },
  {
    keyword: "Soft margin",
    content: "Introduces slack variables ξᵢ to tolerate misclassification. Parameter C controls the tradeoff: large C → hard margin, small C → more tolerance to noise.",
  },
  {
    keyword: "Dual form",
    content: "Lagrangian dual reveals dependence only on inner products — the gateway to the kernel trick. Only support vectors have non-zero αᵢ.",
  },
];

const FLASHCARDS = [
  { q: "What defines a support vector?", a: "A training point lying on or inside the margin — the only points that influence the decision boundary." },
  { q: "Why use the kernel trick?", a: "To capture non-linear patterns without computing the high-dimensional feature map explicitly — only inner products matter." },
  { q: "Role of the C parameter?", a: "Regularization: balances margin width against training error tolerance." },
];

export function IntelligenceEngine({ title, type, meetingId, onBack }: Props) {
  const isLecture = type === "lecture";
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await getMeetingResult(meetingId);
        setData(result);
      } catch (err) {
        console.error("Failed to fetch results", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [meetingId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground font-mono">Synthesizing intelligence...</p>
      </div>
    );
  }

  // Use fallback mock data if real data is empty for demo purposes
  const transcript = data?.segments || [];
  const decisions = data?.decisions || [];
  const commitments = data?.tasks || [];
  const questions = data?.questions || [];
  const slides = data?.visual_context?.slides || [];

  return (
    <div className="max-w-[1500px] mx-auto px-6 py-6">
      {/* Top navigation row */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={onBack} className="inline-flex items-center gap-2 h-9 px-3 rounded-lg bg-surface border border-border text-[13px] text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to library
        </button>
        <div className="flex items-center gap-2">
          <IntegrationPill label="Notion" active />
          <IntegrationPill label="Slack" active />
          <IntegrationPill label="Linear" />
          <button className="inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-border text-[13px] text-muted-foreground hover:text-foreground transition-colors">
            <Share2 className="w-3.5 h-3.5" />
            Share
          </button>
          <button className="inline-flex items-center gap-2 h-9 px-3 rounded-lg bg-gradient-primary text-white text-[13px] font-medium shadow-glow">
            <FileDown className="w-3.5 h-3.5" />
            Export
          </button>
        </div>
      </div>

      {/* AI Summary Header */}
      <div className="relative rounded-2xl overflow-hidden mb-6 animate-fade-in-up">
        <div className="absolute inset-0 bg-gradient-primary opacity-90" />
        <div className="absolute inset-0 dot-grid opacity-30" />
        <div className="relative p-6 md:p-8">
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div className="flex-1 min-w-[260px]">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/15 text-[10px] font-mono text-white/90 mb-3 uppercase tracking-wider">
                <Sparkles className="w-3 h-3" />
                {isLecture ? "Scholar Mode · TL;DR" : "Intelligence · TL;DR"}
              </div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white text-balance mb-4 max-w-3xl">{title}</h1>
              <ul className="grid md:grid-cols-3 gap-3 max-w-4xl">
                {(isLecture
                  ? [
                      "SVMs maximize the margin between classes, with support vectors alone defining the boundary.",
                      "The kernel trick enables non-linear classification via implicit high-dimensional mapping.",
                      "Soft-margin formulation balances generalization and training error via parameter C.",
                    ]
                  : [
                      "Activation adopted as Q3 north-star metric with +18% target.",
                      "Two experiments committed; referral loops moved to discovery sprint.",
                      "Engineering plan due Friday; onboarding v2 designs due next Tuesday.",
                    ]
                ).map((b, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-[13px] text-white/95 leading-relaxed">
                    <span className="mt-1 w-1.5 h-1.5 rounded-full bg-white shrink-0" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex items-center gap-6 text-white/90">
              <Stat k={isLecture ? "1:18:40" : "54:12"} v="Duration" />
              <Stat k={isLecture ? "1" : "5"} v={isLecture ? "Lecturer" : "Speakers"} />
              <Stat k={isLecture ? "12" : "8"} v={isLecture ? "Key points" : "Decisions"} />
            </div>
          </div>

          {/* Context strip */}
          <div className="mt-6 flex items-center gap-2 flex-wrap">
            <ContextChip icon={isLecture ? BookOpen : Users2} label={isLecture ? "Lecture · University" : "Video conference"} />
            <ContextChip icon={Presentation} label={`${SLIDES.length} slides detected`} />
            <ContextChip icon={Play} label="Screen shared" />
            <ContextChip icon={MessageSquare} label="214 utterances" />
          </div>
        </div>
      </div>

      {/* Diarization timeline */}
      <div className="card-surface rounded-xl p-4 mb-6 animate-fade-in-up">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[12px] font-mono uppercase tracking-wider text-muted-foreground">Speaker timeline</h3>
          <span className="font-mono text-[11px] text-muted-foreground">{isLecture ? "01:18:40" : "54:12"}</span>
        </div>
        <div className="space-y-1.5">
          {(isLecture ? SPEAKERS.slice(0, 1) : SPEAKERS).map((s, idx) => (
            <div key={s.id} className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full grid place-items-center text-[9px] font-semibold shrink-0" style={{ background: s.color }}>
                {s.id}
              </div>
              <div className="flex-1 h-5 rounded bg-surface-2 relative overflow-hidden">
                {generateSegments(idx, isLecture).map((seg, i) => (
                  <div
                    key={i}
                    className="absolute top-0 bottom-0 rounded-sm"
                    style={{ left: `${seg.start}%`, width: `${seg.width}%`, background: s.color, opacity: 0.85 }}
                  />
                ))}
              </div>
              <span className="font-mono text-[10px] text-muted-foreground w-10 text-right">{isLecture ? "100%" : `${20 - idx * 3}%`}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 h-8 opacity-60">
          <Waveform bars={120} seed={4} />
        </div>
      </div>

      {/* Main 3-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* LEFT — Transcript */}
        <div className="lg:col-span-4">
          <Section title="Transcript" sub={isLecture ? "1 speaker · 214 utterances" : "5 speakers · 214 utterances"}>
            <div className="space-y-4 max-h-[620px] overflow-y-auto pr-1">
              {TRANSCRIPT.map((u, i) => {
                const sp = SPEAKERS.find((s) => s.id === u.speaker)!;
                return (
                  <div key={i} className="group">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-6 h-6 rounded-full grid place-items-center text-[9px] font-semibold" style={{ background: sp.color }}>
                        {sp.id}
                      </div>
                      <span className="text-[12px] font-semibold">{sp.name}</span>
                      <span className="text-[10px] text-muted-foreground">· {sp.role}</span>
                      <button className="ml-auto font-mono text-[10px] text-muted-foreground hover:text-primary transition-colors">
                        {u.time}
                      </button>
                    </div>
                    <p className="text-[13px] leading-relaxed text-foreground/90 pl-8">{u.text}</p>
                  </div>
                );
              })}
            </div>
          </Section>
        </div>

        {/* CENTER — Buckets OR Notes */}
        <div className="lg:col-span-5 space-y-5">
          {isLecture ? (
            <>
              <Section title="Study notes" sub="Cornell-style · keywords in margins">
                <div className="space-y-4">
                  {LECTURE_NOTES.map((n, i) => (
                    <div key={i} className="grid grid-cols-[120px_1fr] gap-4 pb-4 border-b border-border last:border-0 last:pb-0">
                      <div className="text-right">
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-mono uppercase tracking-wider bg-warning/10 text-warning border border-warning/20">
                          {n.keyword}
                        </span>
                      </div>
                      <p className="text-[13px] leading-relaxed text-foreground/90">{n.content}</p>
                    </div>
                  ))}
                </div>
              </Section>

              <Section title="Flashcards" sub="Spaced-repetition ready">
                <div className="grid sm:grid-cols-2 gap-3">
                  {FLASHCARDS.map((f, i) => (
                    <div key={i} className="gradient-border rounded-xl p-4 hover:shadow-glow transition-shadow cursor-pointer">
                      <p className="text-[12px] font-mono uppercase tracking-wider text-primary mb-2">Q · {String(i + 1).padStart(2, "0")}</p>
                      <p className="text-[13px] font-semibold mb-2.5 leading-snug">{f.q}</p>
                      <p className="text-[12px] text-muted-foreground leading-relaxed">{f.a}</p>
                    </div>
                  ))}
                </div>
              </Section>
            </>
          ) : (
            <>
              <Section title="Decisions" sub={`${DECISIONS.length} captured`} icon={CheckCircle2} iconClass="text-success">
                <div className="space-y-2.5">
                  {DECISIONS.map((d, i) => (
                    <div key={i} className="flex items-start gap-3 p-3.5 rounded-xl bg-success/5 border border-success/20 hover:border-success/40 transition-colors">
                      <div className="w-7 h-7 rounded-lg bg-success/15 grid place-items-center shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5 text-success" strokeWidth={2.5} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold leading-snug">{d.title}</p>
                        <p className="text-[12px] text-muted-foreground mt-1 leading-relaxed">{d.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>

              <Section title="Commitments" sub={`${COMMITMENTS.length} tasks · assignees extracted`} icon={Circle} iconClass="text-primary">
                <div className="space-y-2">
                  {COMMITMENTS.map((c, i) => {
                    const sp = SPEAKERS.find((s) => s.id === c.who)!;
                    return (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl card-surface hover:border-primary/30 transition-colors group">
                        <Circle className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-medium leading-snug">{c.text}</p>
                          <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground">
                            <span className="inline-flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {sp.name}
                            </span>
                            <span className="inline-flex items-center gap-1 font-mono">
                              <Calendar className="w-3 h-3" />
                              {c.due}
                            </span>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider font-mono ${
                                c.priority === "high" ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning"
                              }`}
                            >
                              {c.priority}
                            </span>
                          </div>
                        </div>
                        <div className="w-6 h-6 rounded-full grid place-items-center text-[9px] font-semibold" style={{ background: sp.color }}>
                          {sp.id}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Section>

              <Section title="Open questions" sub="Unresolved · needs follow-up" icon={HelpCircle} iconClass="text-warning">
                <div className="space-y-2">
                  {QUESTIONS.map((q, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-warning/5 border border-warning/20">
                      <div className="w-6 h-6 rounded-lg bg-warning/15 grid place-items-center shrink-0">
                        <HelpCircle className="w-3.5 h-3.5 text-warning" />
                      </div>
                      <p className="text-[13px] leading-snug flex-1">{q}</p>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-warning/80">Unresolved</span>
                    </div>
                  ))}
                </div>
              </Section>
            </>
          )}
        </div>

        {/* RIGHT — Multimodal context */}
        <div className="lg:col-span-3 space-y-5">
          <Section title="Slide gallery" sub={`${SLIDES.length} extracted`}>
            <div className="space-y-3">
              {SLIDES.map((s, i) => (
                <div key={i} className="group cursor-pointer">
                  <div className="relative aspect-video rounded-lg bg-gradient-subtle border border-border overflow-hidden mb-1.5 group-hover:border-primary/40 transition-colors">
                    <div className="absolute inset-0 dot-grid opacity-40" />
                    <div className="absolute inset-0 p-3 flex flex-col justify-between">
                      <span className="font-mono text-[9px] text-muted-foreground">SLIDE · {String(i + 1).padStart(2, "0")}</span>
                      <div>
                        <p className="text-[13px] font-semibold text-foreground mb-1 leading-tight">{s.title}</p>
                        <div className="flex gap-0.5">
                          <div className="h-1 w-6 rounded bg-primary/60" />
                          <div className="h-1 w-3 rounded bg-primary/30" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-snug px-0.5">{s.caption}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Environmental context">
            <div className="space-y-2 text-[12px]">
              <KV k="Scene" v={isLecture ? "Lecture hall" : "Video conference"} />
              <KV k="Participants" v={isLecture ? "1 speaker · audience" : "5 on-screen"} />
              <KV k="Screen share" v="Detected · slides" />
              <KV k="Audio quality" v="High · 48kHz" />
              <KV k="Language" v="English (US)" />
            </div>
          </Section>
        </div>
      </div>

      {/* Floating action bar */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 glass-strong rounded-full px-2 py-2 flex items-center gap-1 shadow-elevated animate-fade-in-up">
        <FAB icon={Play} label="Play" primary />
        <FAB icon={Share2} label="Share" />
        <FAB icon={FileDown} label="Export" />
        <FAB icon={MessageSquare} label="Ask" />
        <div className="w-px h-5 bg-border mx-1" />
        <FAB icon={Zap} label="Push to Linear" accent />
      </div>
    </div>
  );
}

function Section({
  title,
  sub,
  icon: Icon,
  iconClass,
  children,
}: {
  title: string;
  sub?: string;
  icon?: any;
  iconClass?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card-surface rounded-2xl p-5 animate-fade-in-up">
      <div className="flex items-center gap-2 mb-4">
        {Icon && <Icon className={`w-4 h-4 ${iconClass || "text-foreground"}`} />}
        <h3 className="text-[14px] font-semibold tracking-tight">{title}</h3>
        {sub && <span className="text-[11px] text-muted-foreground ml-auto font-mono">{sub}</span>}
      </div>
      {children}
    </div>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div className="text-center">
      <div className="text-xl font-semibold font-mono tracking-tight">{k}</div>
      <div className="text-[10px] uppercase tracking-wider text-white/70">{v}</div>
    </div>
  );
}

function ContextChip({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 h-7 rounded-full bg-white/10 border border-white/15 text-[11px] text-white/90 backdrop-blur-sm">
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}

function IntegrationPill({ label, active }: { label: string; active?: boolean }) {
  return (
    <button
      className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-[12px] font-medium transition-all border ${
        active
          ? "bg-success/10 text-success border-success/30"
          : "bg-surface text-muted-foreground border-border hover:text-foreground"
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${active ? "bg-success animate-pulse" : "bg-muted-foreground/40"}`} />
      {label}
    </button>
  );
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-medium">{v}</span>
    </div>
  );
}

function FAB({ icon: Icon, label, primary, accent }: { icon: any; label: string; primary?: boolean; accent?: boolean }) {
  return (
    <button
      className={`inline-flex items-center gap-2 h-10 px-4 rounded-full text-[12px] font-medium transition-all ${
        primary
          ? "bg-gradient-primary text-white shadow-glow"
          : accent
          ? "bg-success/15 text-success border border-success/30"
          : "text-muted-foreground hover:text-foreground hover:bg-white/5"
      }`}
    >
      <Icon className="w-3.5 h-3.5" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function generateSegments(offset: number, lecture: boolean) {
  if (lecture) return [{ start: 0, width: 98 }];
  const segs: { start: number; width: number }[] = [];
  let pos = offset * 6;
  let s = offset * 17 + 11;
  while (pos < 95) {
    s = (s * 9301 + 49297) % 233280;
    const w = 2 + (s % 8);
    segs.push({ start: pos, width: w });
    s = (s * 9301 + 49297) % 233280;
    pos += w + 3 + (s % 12);
  }
  return segs;
}
