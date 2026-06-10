import { useEffect, useState } from "react";
import { Loader2, CheckCircle2, XCircle, Clock, Zap, RefreshCw, BarChart3 } from "lucide-react";
import { listMeetings, type MeetingResult } from "@/lib/api";

const STATUS_STYLE: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  done:         { icon: CheckCircle2, color: "text-success",     label: "Done" },
  failed:       { icon: XCircle,      color: "text-destructive", label: "Failed" },
  transcribing: { icon: Loader2,      color: "text-primary",     label: "Transcribing" },
  classifying:  { icon: Loader2,      color: "text-primary",     label: "Classifying" },
  extracting:   { icon: Loader2,      color: "text-primary",     label: "Extracting" },
  detecting:    { icon: Loader2,      color: "text-primary",     label: "Detecting" },
  pushing:      { icon: Loader2,      color: "text-primary",     label: "Pushing" },
  uploading:    { icon: Clock,        color: "text-warning",     label: "Uploading" },
};

function fmt(s: number) {
  const m = Math.floor(s / 60), sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, "0")}`;
}
function timeAgo(d?: string) {
  if (!d) return "";
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function PipelinesPage() {
  const [meetings, setMeetings] = useState<MeetingResult[]>([]);
  const [loading, setLoading]   = useState(true);

  const load = async () => {
    setLoading(true);
    const data = await listMeetings().catch(() => []);
    setMeetings(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const totalCost = meetings.reduce((s, m) => s + (m.pipeline_metrics?.estimated_cost_usd ?? 0), 0);
  const totalHours = meetings.reduce((s, m) => s + (m.duration_seconds ?? 0), 0) / 3600;
  const done = meetings.filter(m => m.status === "done");

  return (
    <div className="max-w-[1100px] mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Pipeline History</h1>
          <p className="text-muted-foreground text-[14px]">All processing runs — status, metrics, and cost.</p>
        </div>
        <button onClick={load} className="inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-border text-[13px] text-muted-foreground hover:text-foreground transition-colors">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { k: meetings.length.toString(), v: "Total runs" },
          { k: done.length.toString(),     v: "Completed" },
          { k: `${totalHours.toFixed(1)}h`, v: "Audio processed" },
          { k: `$${totalCost.toFixed(4)}`,  v: "Total cost" },
        ].map(s => (
          <div key={s.v} className="card-surface rounded-xl px-4 py-3">
            <div className="text-[20px] font-semibold font-mono">{s.k}</div>
            <div className="text-[11px] text-muted-foreground uppercase tracking-wider mt-0.5">{s.v}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : meetings.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground text-[14px]">No pipeline runs yet. Upload a recording to get started.</div>
      ) : (
        <div className="space-y-2">
          {meetings.map(m => {
            const s = STATUS_STYLE[m.status] ?? STATUS_STYLE.uploading;
            const Icon = s.icon;
            const pm = m.pipeline_metrics;
            const isProcessing = !["done", "failed"].includes(m.status);
            return (
              <div key={m.meeting_id} className="card-surface rounded-xl p-4 flex items-center gap-4 flex-wrap">
                {/* Status icon */}
                <Icon className={`w-4 h-4 shrink-0 ${s.color} ${isProcessing ? "animate-spin" : ""}`} />

                {/* Title */}
                <div className="flex-1 min-w-[140px]">
                  <p className="text-[14px] font-medium truncate">{m.title}</p>
                  <p className="text-[11px] text-muted-foreground font-mono">{m.meeting_id.slice(0, 8)}…</p>
                </div>

                {/* Status badge */}
                <span className={`text-[11px] font-mono px-2 py-0.5 rounded border ${
                  m.status === "done"   ? "border-success/30 text-success bg-success/5" :
                  m.status === "failed" ? "border-destructive/30 text-destructive bg-destructive/5" :
                  "border-primary/30 text-primary bg-primary/5"
                }`}>{s.label}</span>

                {/* Content type */}
                <span className="text-[11px] text-muted-foreground font-mono capitalize hidden sm:block">{m.content_type}</span>

                {/* Duration */}
                <span className="text-[11px] text-muted-foreground font-mono hidden md:block w-12 text-right">
                  {m.duration_seconds ? fmt(m.duration_seconds) : "—"}
                </span>

                {/* Metrics */}
                {pm ? (
                  <div className="flex items-center gap-3 hidden lg:flex">
                    <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground font-mono">
                      <BarChart3 className="w-3 h-3" />{(pm.total_ms / 1000).toFixed(1)}s
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] text-primary font-mono">
                      <Zap className="w-3 h-3" />${pm.estimated_cost_usd.toFixed(4)}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">{pm.gemini_model}</span>
                  </div>
                ) : <div className="w-48 hidden lg:block" />}

                {/* Time ago */}
                <span className="text-[11px] text-muted-foreground font-mono shrink-0">{timeAgo(m.created_at)}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
