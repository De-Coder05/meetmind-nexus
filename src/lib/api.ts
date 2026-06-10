const API_URL = import.meta.env.VITE_API_URL || "https://meetmind-backend-vdim.onrender.com";

function getWsUrl(): string {
  const url = new URL(API_URL);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  return url.toString().replace(/\/$/, "");
}

const WS_URL = getWsUrl();

// ── Meetings ─────────────────────────────────────

export async function uploadMeeting(formData: FormData) {
  const res = await fetch(`${API_URL}/api/v1/meetings/upload`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to upload meeting");
  }
  return res.json();
}

export async function uploadFromUrl(payload: {
  url: string;
  title: string;
  participants: string;
  push_notion: boolean;
  push_slack: boolean;
  push_linear: boolean;
}) {
  const res = await fetch(`${API_URL}/api/v1/meetings/upload-url`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to process URL");
  }
  return res.json();
}

export async function getMeetingStatus(id: string) {
  const res = await fetch(`${API_URL}/api/v1/meetings/${id}/status`);
  if (!res.ok) throw new Error("Failed to get meeting status");
  return res.json();
}

export async function getMeetingResult(id: string) {
  const res = await fetch(`${API_URL}/api/v1/meetings/${id}`);
  if (!res.ok) throw new Error("Failed to get meeting result");
  return res.json();
}

export async function listMeetings(): Promise<MeetingResult[]> {
  const res = await fetch(`${API_URL}/api/v1/meetings/`);
  if (!res.ok) throw new Error("Failed to list meetings");
  return res.json();
}

export async function getMeetingStats(): Promise<MeetingStats> {
  const res = await fetch(`${API_URL}/api/v1/meetings/stats`);
  if (!res.ok) throw new Error("Failed to get stats");
  return res.json();
}

// ── Intelligence (Ask Agent) ──────────────────────

export async function askMeeting(meetingId: string, question: string): Promise<{ answer: string }> {
  const res = await fetch(`${API_URL}/api/v1/intelligence/${meetingId}/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Ask agent failed");
  }
  return res.json();
}

export async function getPlatformStats(): Promise<PlatformStats> {
  const res = await fetch(`${API_URL}/api/v1/intelligence/stats`);
  if (!res.ok) throw new Error("Failed to get platform stats");
  return res.json();
}

// ── Feedback ─────────────────────────────────────

export async function submitFeedback(payload: {
  meeting_id: string;
  utterance_text: string;
  original_type: string;
  corrected_type: string;
}) {
  const res = await fetch(`${API_URL}/api/v1/tasks/feedback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to submit feedback");
  return res.json();
}

export async function getFeedbackStats() {
  const res = await fetch(`${API_URL}/api/v1/tasks/feedback/stats`);
  if (!res.ok) throw new Error("Failed to get feedback stats");
  return res.json();
}

// ── Export helpers (client-side) ──────────────────

export function exportMeetingAsMarkdown(data: MeetingResult): void {
  const lines: string[] = [];

  lines.push(`# ${data.title}`);
  lines.push(`\n*Content type: ${data.content_type} · Duration: ${formatDuration(data.duration_seconds ?? 0)}*\n`);

  if (data.summary) {
    lines.push(`## Summary\n\n${data.summary}\n`);
  }

  if (data.decisions?.length) {
    lines.push(`## Decisions (${data.decisions.length})\n`);
    data.decisions.forEach((d) => lines.push(`- **${d.speaker}**: ${d.text}`));
    lines.push("");
  }

  if (data.commitments?.length) {
    lines.push(`## Commitments (${data.commitments.length})\n`);
    data.commitments.forEach((c) => lines.push(`- **${c.speaker}**: ${c.text}`));
    lines.push("");
  }

  if (data.tasks?.length) {
    lines.push(`## Action Items (${data.tasks.length})\n`);
    data.tasks.forEach((t) => {
      lines.push(`- [ ] **${t.title}**`);
      if (t.owner) lines.push(`  - Owner: ${t.owner}`);
      if (t.deadline) lines.push(`  - Due: ${t.deadline}`);
      lines.push(`  - Priority: ${t.priority}`);
    });
    lines.push("");
  }

  if (data.open_questions?.length) {
    lines.push(`## Open Questions (${data.open_questions.length})\n`);
    data.open_questions.forEach((q) => lines.push(`- **${q.speaker}**: ${q.text}`));
    lines.push("");
  }

  if (data.key_takeaways?.length) {
    lines.push(`## Key Takeaways\n`);
    data.key_takeaways.forEach((t) => {
      lines.push(`### ${t.title}`);
      lines.push(`${t.explanation}\n`);
    });
  }

  if (data.utterances?.length) {
    lines.push(`## Full Transcript\n`);
    data.utterances.forEach((u) => {
      lines.push(`**[${formatDuration(u.start_time)}] ${u.speaker}** *(${u.utterance_type})*`);
      lines.push(`${u.text}\n`);
    });
  }

  const blob = new Blob([lines.join("\n")], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${data.title.replace(/[^a-zA-Z0-9]/g, "_")}_meetmind.md`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportMeetingAsJson(data: MeetingResult): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${data.title.replace(/[^a-zA-Z0-9]/g, "_")}_meetmind.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

// ── WebSocket ────────────────────────────────────

export type WsMessage =
  | { type: "stage_update"; data: { stage: string; status: string; detail: string } }
  | { type: "utterance"; data: { speaker: string; text: string; type: string; confidence: number; reasoning: string } }
  | { type: "metrics"; data: Record<string, unknown> }
  | { type: "complete"; data: { status: string } }
  | { type: "error"; data: { message: string } }
  | { type: "ping" }
  | { type: "pong" };

export function connectWebSocket(
  meetingId: string,
  onMessage: (msg: WsMessage) => void,
  onClose?: () => void,
): WebSocket {
  const ws = new WebSocket(`${WS_URL}/api/v1/ws/${meetingId}`);

  ws.onmessage = (event) => {
    try {
      const msg: WsMessage = JSON.parse(event.data);
      if (msg.type === "ping") {
        ws.send("ping");
        return;
      }
      onMessage(msg);
    } catch {
      console.warn("Failed to parse WebSocket message:", event.data);
    }
  };

  ws.onclose = () => onClose?.();
  ws.onerror = (err) => console.error("WebSocket error:", err);

  return ws;
}

// ── Types ────────────────────────────────────────

export interface MeetingStats {
  total_meetings: number;
  processed_meetings: number;
  total_decisions: number;
  total_tasks: number;
  total_hours: number;
}

export interface PlatformStats extends MeetingStats {
  total_commitments: number;
  total_cost_usd: number;
  content_type_breakdown: Record<string, number>;
  total_feedback: number;
  classifier_corrections: number;
}

export interface MeetingResult {
  meeting_id: string;
  title: string;
  status: string;
  content_type: string;
  duration_seconds?: number;
  decisions: Utterance[];
  commitments: Utterance[];
  discussions: Utterance[];
  open_questions: Utterance[];
  tasks: Task[];
  key_takeaways: Takeaway[];
  study_notes: StudyNote[];
  slide_contents: SlideContent[];
  scene_description: string;
  utterances: Utterance[];
  summary?: string;
  source_url?: string;
  created_at?: string;
  pipeline_metrics?: PipelineMetrics;
}

export interface Utterance {
  speaker: string;
  text: string;
  start_time: number;
  end_time: number;
  utterance_type: string;
  classification_confidence: number;
  reasoning?: string;
}

export interface Task {
  title: string;
  owner?: string;
  deadline?: string;
  priority: string;
  context_quote: string;
  source_speaker?: string;
  notion_page_id?: string;
  linear_issue_id?: string;
}

export interface Takeaway {
  title: string;
  explanation: string;
  importance: string;
}

export interface StudyNote {
  topic: string;
  content: string;
  key_terms: string[];
}

export interface SlideContent {
  timestamp: number;
  title: string;
  content: string;
  description?: string;
}

export interface PipelineMetrics {
  total_ms: number;
  transcription_ms: number;
  classification_ms: number;
  extraction_ms: number;
  integration_ms: number;
  estimated_cost_usd: number;
  input_tokens: number;
  output_tokens: number;
  whisper_model: string;
  gemini_model: string;
}
