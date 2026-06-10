import { useEffect, useState, useRef, useCallback } from "react";
import {
  Check, Loader2, Eye, Mic, Brain, Zap, Send, AlertCircle,
  Search, BarChart3, Cpu,
} from "lucide-react";
import { connectWebSocket, getMeetingStatus, type WsMessage } from "@/lib/api";

interface Props {
  title: string;
  meetingId: string;
  onComplete: () => void;
}

const STAGES = [
  {
    key: "analyzing_video",
    icon: Eye,
    label: "Visual Intelligence Agent",
    detail: "Extracting frames · Identifying participants · Reading slides",
    agent: "Gemini Vision",
  },
  {
    key: "transcribing",
    icon: Mic,
    label: "Transcription & Diarization Agent",
    detail: "Whisper ASR · Speaker identification · Utterance segmentation",
    agent: "Whisper + Gemini",
  },
  {
    key: "detecting",
    icon: Search,
    label: "Content Classification Agent",
    detail: "Detecting content type · Meeting vs lecture vs podcast",
    agent: "Gemini 1.5 Pro",
  },
  {
    key: "classifying",
    icon: Brain,
    label: "4-Bucket Classifier Agent",
    detail: "Decisions · Commitments · Discussions · Open questions",
    agent: "Gemini 1.5 Pro",
  },
  {
    key: "extracting",
    icon: Zap,
    label: "Insight Extractor Agent",
    detail: "Action items · Owners · Deadlines · Meeting summary",
    agent: "Gemini 1.5 Pro",
  },
  {
    key: "pushing",
    icon: Send,
    label: "Integration Dispatcher",
    detail: "Routing to Notion · Slack · Linear per rule engine",
    agent: "Rule Engine",
  },
];

interface StageState {
  status: "pending" | "running" | "done";
  detail: string;
  startTime?: number;
  duration?: number;
}

interface LiveUtterance {
  speaker: string;
  text: string;
  type: string;
  confidence: number;
  reasoning?: string;
}

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  decision: { bg: "bg-emerald-500/15", text: "text-emerald-400" },
  commitment: { bg: "bg-blue-500/15", text: "text-blue-400" },
  open_question: { bg: "bg-amber-500/15", text: "text-amber-400" },
  discussion: { bg: "bg-gray-500/15", text: "text-gray-400" },
};

export function ActivePipeline({ title, meetingId, onComplete }: Props) {
  const [stages, setStages] = useState<Record<string, StageState>>(() => {
    const init: Record<string, StageState> = {};
    STAGES.forEach((s) => {
      init[s.key] = { status: "pending", detail: s.detail };
    });
    return init;
  });
  const [liveUtterances, setLiveUtterances] = useState<LiveUtterance[]>([]);
  const [error, setError] = useState("");
  const [metrics, setMetrics] = useState<Record<string, unknown> | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const onCompleteRef = useRef(onComplete);
  const utterancesEndRef = useRef<HTMLDivElement>(null);
  onCompleteRef.current = onComplete;

  const handleMessage = useCallback((msg: WsMessage) => {
    switch (msg.type) {
      case "stage_update":
        setStages((prev) => ({
          ...prev,
          [msg.data.stage]: {
            status: msg.data.status === "done" ? "done" : "running",
            detail: msg.data.detail || prev[msg.data.stage]?.detail || "",
            startTime:
              msg.data.status === "running"
                ? Date.now()
                : prev[msg.data.stage]?.startTime,
            duration:
              msg.data.status === "done" && prev[msg.data.stage]?.startTime
                ? Date.now() - (prev[msg.data.stage]?.startTime ?? Date.now())
                : undefined,
          },
        }));
        break;

      case "utterance":
        setLiveUtterances((prev) => [
          ...prev.slice(-20),
          {
            speaker: msg.data.speaker,
            text: msg.data.text,
            type: msg.data.type,
            confidence: msg.data.confidence,
            reasoning: msg.data.reasoning,
          },
        ]);
        break;

      case "metrics":
        setMetrics(msg.data);
        break;

      case "complete":
        setTimeout(() => onCompleteRef.current(), 1600);
        break;

      case "error":
        setError(msg.data.message);
        break;
    }
  }, []);

  useEffect(() => {
    utterancesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [liveUtterances]);

  useEffect(() => {
    let pollInterval: ReturnType<typeof setInterval> | null = null;
    let ws: WebSocket | null = null;

    try {
      ws = connectWebSocket(meetingId, handleMessage, () => {
        if (!error) startPolling();
      });
      wsRef.current = ws;
    } catch {
      startPolling();
    }

    function startPolling() {
      if (pollInterval) return;
      pollInterval = setInterval(async () => {
        try {
          const data = await getMeetingStatus(meetingId);
          if (data.status === "done") {
            setTimeout(() => onCompleteRef.current(), 1600);
            if (pollInterval) clearInterval(pollInterval);
          } else if (data.status === "failed") {
            setError(data.progress_message || "Processing failed");
            if (pollInterval) clearInterval(pollInterval);
          }

          // Map backend status → stage key
          const stageMap: Record<string, string> = {
            analyzing_video: "analyzing_video",
            transcribing: "transcribing",
            detecting: "detecting",
            classifying: "classifying",
            extracting: "extracting",
            pushing: "pushing",
          };
          const stageKey = stageMap[data.status] ?? data.status;
          setStages((prev) => ({
            ...prev,
            [stageKey]: {
              ...prev[stageKey],
              status: "running",
              detail: data.progress_message || prev[stageKey]?.detail || "",
            },
          }));
        } catch {
          // silently ignore polling errors
        }
      }, 2500);
    }

    return () => {
      if (ws && ws.readyState <= 1) ws.close();
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [meetingId, handleMessage, error]);

  const completedCount = Object.values(stages).filter((s) => s.status === "done").length;
  const totalStages = STAGES.length;
  const progressPct = Math.round((completedCount / totalStages) * 100);
  const runningStage = STAGES.find((s) => stages[s.key]?.status === "running");

  return (
    <div className="max-w-[1100px] mx-auto px-6 py-16">
      {/* Header */}
      <div className="text-center mb-10 animate-fade-in-up">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-[11px] font-mono text-primary mb-5">
          <Loader2 className="w-3 h-3 animate-spin" />
          AGENT PIPELINE ACTIVE · {progressPct}%
        </div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2 text-balance">
          {error ? "Pipeline encountered an error" : "Agents are analyzing your recording"}
        </h1>
        <p className="text-[14px] text-muted-foreground font-mono truncate max-w-xl mx-auto">
          {title}
        </p>
        {runningStage && !error && (
          <p className="text-[12px] text-primary/80 font-mono mt-2">
            Active: {runningStage.agent}
          </p>
        )}
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/30 flex items-start gap-3 animate-fade-in-up">
          <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-destructive">Pipeline Error</p>
            <p className="text-xs text-muted-foreground mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Progress bar */}
      <div className="mb-6 h-1.5 rounded-full bg-surface overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-primary transition-all duration-700 ease-out"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Stage tracker */}
      <div className="relative card-surface rounded-2xl p-6 md:p-8 overflow-hidden mb-5">
        <div className="absolute inset-0 bg-gradient-primary opacity-[0.03]" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />

        <div className="relative grid gap-2">
          {STAGES.map((stage, i) => {
            const Icon = stage.icon;
            const stageData = stages[stage.key];
            const state = stageData?.status ?? "pending";

            return (
              <div
                key={stage.key}
                className={`flex items-start gap-4 p-4 rounded-xl transition-all ${
                  state === "running"
                    ? "bg-primary/5 border border-primary/20 shimmer"
                    : "border border-transparent"
                }`}
              >
                {/* step indicator */}
                <div className="relative flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-xl grid place-items-center transition-all ${
                      state === "done"
                        ? "bg-success/15 text-success"
                        : state === "running"
                        ? "bg-gradient-primary text-white shadow-glow animate-pulse-ring"
                        : "bg-surface text-muted-foreground border border-border"
                    }`}
                  >
                    {state === "done" ? (
                      <Check className="w-4 h-4" strokeWidth={3} />
                    ) : (
                      <Icon className={`w-4 h-4 ${state === "running" ? "animate-pulse" : ""}`} />
                    )}
                  </div>
                  {i < STAGES.length - 1 && (
                    <div
                      className={`w-px flex-1 mt-1 min-h-[20px] ${
                        state === "done" ? "bg-success/40" : "bg-border"
                      }`}
                    />
                  )}
                </div>

                {/* content */}
                <div className="flex-1 pt-1.5 min-w-0">
                  <div className="flex items-center justify-between gap-4">
                    <h3
                      className={`text-[14px] font-semibold ${
                        state === "pending" ? "text-muted-foreground" : ""
                      }`}
                    >
                      <span className="font-mono text-[11px] text-muted-foreground mr-2">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      {stage.label}
                    </h3>
                    <div className="flex items-center gap-3 shrink-0">
                      {/* Agent badge */}
                      <span
                        className={`hidden sm:inline font-mono text-[9px] px-2 py-0.5 rounded border uppercase tracking-wider ${
                          state === "running"
                            ? "border-primary/40 text-primary bg-primary/5"
                            : state === "done"
                            ? "border-success/30 text-success/70"
                            : "border-border text-muted-foreground/40"
                        }`}
                      >
                        {stage.agent}
                      </span>
                      {state === "done" && stageData?.duration && (
                        <span className="font-mono text-[10px] text-muted-foreground">
                          {(stageData.duration / 1000).toFixed(1)}s
                        </span>
                      )}
                      <span className="font-mono text-[11px] text-muted-foreground uppercase tracking-wider">
                        {state === "done" ? "DONE" : state === "running" ? "RUNNING" : "QUEUED"}
                      </span>
                    </div>
                  </div>
                  <p className="text-[12px] text-muted-foreground mt-0.5">
                    {stageData?.detail || stage.detail}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live classification stream */}
      {liveUtterances.length > 0 && (
        <div className="card-surface rounded-2xl p-6 overflow-hidden animate-fade-in-up mb-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <h3 className="text-sm font-semibold">Live Classification Stream</h3>
            <span className="text-[11px] text-muted-foreground font-mono ml-auto">
              {liveUtterances.length} utterances classified
            </span>
          </div>
          <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
            {liveUtterances.map((u, i) => {
              const typeStyle = TYPE_COLORS[u.type] ?? TYPE_COLORS.discussion;
              return (
                <div
                  key={i}
                  className="flex items-start gap-3 p-2.5 rounded-lg bg-surface/60 animate-fade-in-up"
                >
                  <span
                    className={`shrink-0 mt-0.5 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${typeStyle.bg} ${typeStyle.text}`}
                  >
                    {u.type.replace("_", " ")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <span className="text-[11px] font-semibold text-primary">{u.speaker}</span>
                    <p className="text-[12px] text-muted-foreground truncate">{u.text}</p>
                    {u.reasoning && (
                      <p className="text-[10px] text-muted-foreground/60 italic mt-0.5 truncate">
                        {u.reasoning}
                      </p>
                    )}
                  </div>
                  <span
                    className={`shrink-0 text-[10px] font-mono ${
                      u.confidence >= 0.85
                        ? "text-success"
                        : u.confidence >= 0.7
                        ? "text-amber-400"
                        : "text-destructive"
                    }`}
                  >
                    {(u.confidence * 100).toFixed(0)}%
                  </span>
                </div>
              );
            })}
            <div ref={utterancesEndRef} />
          </div>
        </div>
      )}

      {/* Metrics card — appears after pipeline completes */}
      {metrics && (
        <div className="card-surface rounded-2xl p-6 animate-fade-in-up">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold">Pipeline Metrics</h3>
            <span className="text-[11px] text-muted-foreground ml-auto font-mono">
              <Cpu className="w-3 h-3 inline mr-1" />
              {String(metrics.whisper_model)} + {String(metrics.gemini_model)}
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricTile label="Total Time" value={`${(Number(metrics.total_ms ?? 0) / 1000).toFixed(1)}s`} />
            <MetricTile label="Est. Cost" value={`$${Number(metrics.estimated_cost_usd ?? 0).toFixed(4)}`} highlight />
            <MetricTile label="Input Tokens" value={Number(metrics.input_tokens ?? 0).toLocaleString()} />
            <MetricTile label="Output Tokens" value={Number(metrics.output_tokens ?? 0).toLocaleString()} />
          </div>
        </div>
      )}
    </div>
  );
}

function MetricTile({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className={`rounded-xl p-3 ${highlight ? "bg-primary/5 border border-primary/20" : "bg-surface"}`}>
      <p className="text-[10px] text-muted-foreground font-mono uppercase">{label}</p>
      <p className={`text-lg font-bold font-mono ${highlight ? "text-primary" : ""}`}>{value}</p>
    </div>
  );
}
