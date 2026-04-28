import { useEffect, useState } from "react";
import { Check, Loader2, Download, Eye, Mic, Brain } from "lucide-react";
import { getMeetingStatus } from "@/lib/api";

interface Props {
  title: string;
  meetingId: string; // Changed from source to meetingId
  onComplete: () => void;
}

const STAGES = [
  { icon: Download, label: "Fetching Media", detail: "Downloading source...", duration: 0 },
  { icon: Eye, label: "Visual Analysis", detail: "Extracting frames & identifying participants", duration: 0 },
  { icon: Mic, label: "Transcription", detail: "Whisper AI + Speaker Diarization", duration: 0 },
  { icon: Brain, label: "Intelligence Extraction", detail: "Extracting decisions & action items", duration: 0 },
];

export function ActivePipeline({ title, meetingId, onComplete }: Props) {
  const [current, setCurrent] = useState(0);
  const [pulses, setPulses] = useState<string[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let pollInterval: any;
    
    const poll = async () => {
      try {
        const data = await getMeetingStatus(meetingId);
        
        if (data.status === "uploading") setCurrent(0);
        else if (data.status === "analyzing") setCurrent(1);
        else if (data.status === "transcribing") setCurrent(2);
        else if (data.status === "completed") {
          setCurrent(3);
          setTimeout(onComplete, 1500);
          clearInterval(pollInterval);
        } else if (data.status === "failed") {
          setError(data.progress_message || "Processing failed");
          clearInterval(pollInterval);
        }

        if (data.progress_message) {
          setPulses([data.progress_message]);
        }
      } catch (err) {
        console.error("Polling error", err);
      }
    };

    poll(); // Initial poll
    pollInterval = setInterval(poll, 3000);

    return () => clearInterval(pollInterval);
  }, [meetingId, onComplete]);

  return (
    <div className="max-w-[1100px] mx-auto px-6 py-16">
      <div className="text-center mb-10 animate-fade-in-up">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-[11px] font-mono text-primary mb-5">
          <Loader2 className="w-3 h-3 animate-spin" />
          PIPELINE ACTIVE
        </div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2 text-balance">Analyzing your recording</h1>
        <p className="text-[14px] text-muted-foreground font-mono truncate max-w-xl mx-auto">{title}</p>
      </div>

      {/* Stage tracker */}
      <div className="relative card-surface rounded-2xl p-6 md:p-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-primary opacity-[0.04]" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />

        <div className="relative grid gap-3">
          {STAGES.map((stage, i) => {
            const Icon = stage.icon;
            const state = i < current ? "done" : i === current ? "active" : "pending";
            return (
              <div
                key={stage.label}
                className={`flex items-start gap-4 p-4 rounded-xl transition-all ${
                  state === "active" ? "bg-primary/5 border border-primary/20 shimmer" : "border border-transparent"
                }`}
              >
                {/* step indicator */}
                <div className="relative flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-xl grid place-items-center transition-all ${
                      state === "done"
                        ? "bg-success/15 text-success"
                        : state === "active"
                        ? "bg-gradient-primary text-white shadow-glow animate-pulse-ring"
                        : "bg-surface text-muted-foreground border border-border"
                    }`}
                  >
                    {state === "done" ? <Check className="w-4 h-4" strokeWidth={3} /> : <Icon className="w-4 h-4" />}
                  </div>
                  {i < STAGES.length - 1 && (
                    <div className={`w-px flex-1 mt-1 min-h-[20px] ${i < current ? "bg-success/40" : "bg-border"}`} />
                  )}
                </div>

                {/* content */}
                <div className="flex-1 pt-1.5 min-w-0">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className={`text-[14px] font-semibold ${state === "pending" ? "text-muted-foreground" : ""}`}>
                      <span className="font-mono text-[11px] text-muted-foreground mr-2">0{i + 1}</span>
                      {stage.label}
                    </h3>
                    <span className="font-mono text-[11px] text-muted-foreground uppercase tracking-wider">
                      {state === "done" ? "COMPLETE" : state === "active" ? "RUNNING" : "QUEUED"}
                    </span>
                  </div>
                  <p className="text-[12px] text-muted-foreground mt-0.5">{stage.detail}</p>

                  {state === "active" && pulses.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {pulses.map((p, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 px-2 h-6 rounded-md bg-surface border border-border text-[11px] font-mono text-muted-foreground animate-fade-in-up"
                        >
                          <span className="w-1 h-1 rounded-full bg-primary" />
                          {p}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
