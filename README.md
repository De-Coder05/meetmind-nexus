# MeetMind — Meeting & Lecture Intelligence Platform

> An agentic AI platform that transforms raw recordings into structured, actionable intelligence. Upload a YouTube link or audio file and watch a 6-stage multi-agent pipeline transcribe, classify, and extract every decision, commitment, open question, concept, and task — then push them to Notion, Slack, and Linear automatically.

<div align="center">

![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Gemini](https://img.shields.io/badge/Gemini_2.0_Flash-GenAI-4285F4?style=for-the-badge&logo=google&logoColor=white)
![Whisper](https://img.shields.io/badge/OpenAI_Whisper-ASR-412991?style=for-the-badge&logo=openai&logoColor=white)

</div>

---

## What It Does

MeetMind works for **meetings and lectures alike**. The same pipeline adapts its classification strategy based on what it detects:

| Content Type | Classification Buckets | Extracted Deliverables |
|---|---|---|
| **Meeting** | Decisions · Commitments · Open Questions · Discussion | Action items, owners, deadlines |
| **Lecture** | Core Concepts · Key Takeaways · Questions/Exercises · Examples | Study notes, review questions |

Every utterance is classified, every speaker identified, and every task assigned an owner — all without human intervention.

---

## Architecture

```
                        ┌──────────────────────────────────┐
                        │         MeetMind Frontend         │
                        │  React + TypeScript + Tailwind    │
                        │                                   │
                        │  ┌────────────┐  ┌────────────┐  │
                        │  │  Command   │  │  Active    │  │
                        │  │  Center    │  │  Pipeline  │  │
                        │  │ (library,  │  │ (WebSocket │  │
                        │  │  upload)   │  │  stream)   │  │
                        │  └────────────┘  └────────────┘  │
                        │  ┌──────────────────────────────┐ │
                        │  │     Intelligence Engine       │ │
                        │  │  Overview · Transcript ·      │ │
                        │  │  Actions · Study Guide        │ │
                        │  │  AI Chat · Export · Share     │ │
                        │  └──────────────────────────────┘ │
                        └─────────────┬────────────────────┘
                                      │ REST + WebSocket
                        ┌─────────────▼────────────────────┐
                        │         FastAPI Backend           │
                        │                                   │
                        │  ┌──────────────────────────────┐ │
                        │  │     6-Stage Agent Pipeline   │ │
                        │  │                              │ │
                        │  │  1. Video Analysis           │ │
                        │  │     └─ Gemini Vision         │ │
                        │  │        (frames, slides,      │ │
                        │  │         speaker cues)        │ │
                        │  │                              │ │
                        │  │  2. Transcription + Diarize  │ │
                        │  │     └─ OpenAI Whisper ASR    │ │
                        │  │     └─ Gemini (speaker IDs)  │ │
                        │  │                              │ │
                        │  │  3. Content Detection        │ │
                        │  │     └─ meeting / lecture /   │ │
                        │  │        podcast / interview   │ │
                        │  │                              │ │
                        │  │  4. Classification           │ │
                        │  │     └─ Gemini 4-bucket +     │ │
                        │  │        confidence scoring    │ │
                        │  │                              │ │
                        │  │  5. Extraction               │ │
                        │  │     └─ Tasks · Owners ·      │ │
                        │  │        Deadlines · Summary   │ │
                        │  │                              │ │
                        │  │  6. Integration Push         │ │
                        │  │     └─ Notion · Slack ·      │ │
                        │  │        Linear (rule-based)   │ │
                        │  └──────────────────────────────┘ │
                        │                                   │
                        │  SQLite (dev) / PostgreSQL (prod) │
                        └──────────────────────────────────┘
```

---

## Key Features

### Agentic AI Pipeline
- **6 specialized agents** run sequentially, each with its own Gemini prompt and retry logic
- **Async non-blocking** — Whisper runs in a thread pool, Gemini calls use `run_in_executor`; the event loop never blocks
- **Rate-limit aware** — 6-second inter-call spacing keeps usage within Gemini free-tier (10 RPM)
- **Exponential backoff** on 429/500/503 errors with configurable max retries

### Dual-Mode Intelligence
- **Auto-detects** whether content is a meeting, lecture, podcast, or interview
- **Meeting mode**: surfaces decisions, action items, blockers, open questions
- **Lecture mode**: extracts core concepts, key takeaways, exercises, examples with study-guide layout

### Real-Time Frontend
- **WebSocket streaming** — see utterances classified live as the pipeline runs
- **Tab-based results** — Overview, Transcript, Actions/Study Guide, Slides
- **AI Chat panel** — ask follow-up questions against the full transcript (powered by Gemini 2.0 Flash)
- **Export** — one-click download as Markdown or JSON
- **Push to Linear** — create issues directly from the results view
- **Integrations page** — configure Notion, Slack, Linear API keys in-app

### Production-Ready Backend
- Async SQLAlchemy (SQLite for dev, PostgreSQL for prod)
- Structured JSON logging with per-request `meeting_id` context
- Per-pipeline cost and token tracking (`PipelineMetrics`)
- `/health/gemini` diagnostic endpoint — lists available models, tests the configured model live
- Full CORS configuration via environment variable

---

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- `ffmpeg` (for audio preprocessing)
- Google Gemini API key (free tier works; [get one here](https://aistudio.google.com/app/apikey))

### 1. Clone & Install

```bash
git clone https://github.com/De-Coder05/meetmind.git
cd meetmind

# Backend
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cd ..

# Frontend
cd frontend && npm install && cd ..
```

### 2. Configure

Create a `.env` file at the **project root** (`meetmind/.env`):

```env
# Required
GEMINI_API_KEY=your_key_here

# Optional — defaults shown
GEMINI_MODEL=gemini-2.0-flash
WHISPER_MODEL=base
DATABASE_URL=sqlite+aiosqlite:///./meetmind.db
CORS_ORIGINS=*

# Optional — Integrations
NOTION_API_KEY=
NOTION_DATABASE_ID=
SLACK_BOT_TOKEN=
SLACK_DEFAULT_CHANNEL=#meeting-notes
LINEAR_API_KEY=
LINEAR_TEAM_ID=
```

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:8000
```

### 3. Run

```bash
# Terminal 1 — Backend
cd backend
source .venv/bin/activate
uvicorn main:app --reload --port 8000

# Terminal 2 — Frontend
cd frontend
npm run dev
```

Open **http://localhost:8080** (or the port Vite reports).

---

## API Reference

### Pipeline

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/meetings/upload` | Upload audio/video file, start pipeline |
| `POST` | `/api/v1/meetings/upload-url` | Process from YouTube URL or direct link |
| `GET` | `/api/v1/meetings/{id}/status` | Poll pipeline status |
| `GET` | `/api/v1/meetings/{id}` | Get full classified result |
| `GET` | `/api/v1/meetings/` | List all meetings |
| `GET` | `/api/v1/meetings/stats` | Platform-wide analytics |
| `WS` | `/api/v1/ws/{meeting_id}` | Real-time pipeline events (WebSocket) |

### Intelligence

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/intelligence/{id}/ask` | Q&A against the meeting transcript |
| `GET` | `/api/v1/intelligence/stats` | Aggregate intelligence stats |

### Tasks & Feedback

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/tasks/feedback` | Submit a classification correction |
| `GET` | `/api/v1/tasks/feedback/stats` | Classifier accuracy from corrections |
| `POST` | `/api/v1/tasks/notion` | Push a task to Notion |
| `POST` | `/api/v1/tasks/linear` | Push a task to Linear |

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Basic liveness check |
| `GET` | `/health/gemini` | Tests configured Gemini model, lists available models |

### Example: Process a YouTube Video

```bash
curl -X POST http://localhost:8000/api/v1/meetings/upload-url \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.youtube.com/watch?v=...",
    "title": "Sprint Planning Q3",
    "participants": "Alice, Bob, Charlie",
    "push_slack": true
  }'
```

### WebSocket Event Stream

Connect to `ws://localhost:8000/api/v1/ws/{meeting_id}` — events arrive as they happen:

```jsonc
// Stage transitions
{"type": "stage_update", "data": {"stage": "transcribing", "status": "running", "detail": "Whisper AI + Speaker Diarization"}}

// Live classified utterances
{"type": "utterance", "data": {"speaker": "Alice", "text": "We'll ship by Friday.", "type": "commitment", "confidence": 0.96}}

// Pipeline complete with full metrics
{"type": "metrics", "data": {"total_ms": 45000, "estimated_cost_usd": 0.023, "input_tokens": 8500}}
{"type": "complete", "data": {"status": "done"}}
```

---

## Project Structure

```
meetmind/
├── .env                             ← API keys (gitignored)
├── render.yaml                      ← Render deployment config
│
├── backend/
│   ├── main.py                      ← FastAPI app, CORS, route registration
│   ├── requirements.txt
│   ├── core/
│   │   ├── config.py                ← Pydantic settings (reads .env)
│   │   ├── gemini_client.py         ← Async Gemini wrapper + retry + token tracking
│   │   ├── logging.py               ← Structured logging with context vars
│   │   └── telemetry.py             ← Per-stage timing + cost estimation
│   ├── agents/
│   │   ├── classifier.py            ← 4-bucket classifier (meeting + lecture modes)
│   │   ├── action_extractor.py      ← Tasks, owners, deadlines, summary
│   │   ├── content_detector.py      ← Detects meeting / lecture / podcast
│   │   └── video_analyzer.py        ← Gemini Vision frame analysis
│   ├── services/
│   │   ├── transcription.py         ← Whisper ASR + Gemini diarization (batched)
│   │   ├── audio.py                 ← ffmpeg preprocessing (async subprocess)
│   │   ├── downloader.py            ← yt-dlp + HTTP download with fallbacks
│   │   ├── frame_extractor.py       ← Video frame sampling for Vision
│   │   ├── notion.py                ← Notion API
│   │   ├── slack.py                 ← Slack Block Kit digest
│   │   └── linear.py                ← Linear GraphQL
│   ├── models/
│   │   ├── meeting.py               ← All Pydantic models + PipelineMetrics
│   │   └── integration_rules.py     ← Routing rules for integrations
│   ├── api/routes/
│   │   ├── meetings.py              ← Full pipeline orchestration
│   │   ├── intelligence.py          ← Q&A + analytics
│   │   ├── tasks.py                 ← Feedback + correction + push
│   │   └── ws.py                    ← WebSocket real-time stream
│   └── db/
│       ├── database.py              ← Async SQLAlchemy engine
│       └── schemas.py               ← Meeting + Feedback ORM tables
│
├── frontend/
│   ├── .env                         ← VITE_API_URL (gitignored)
│   └── src/
│       ├── pages/
│       │   ├── Index.tsx            ← App shell + view routing
│       │   ├── IntegrationsPage.tsx ← Notion / Slack / Linear config UI
│       │   └── PipelinesPage.tsx    ← Pipeline run history + stats
│       ├── components/meetmind/
│       │   ├── CommandCenter.tsx    ← Library + upload / URL input
│       │   ├── ActivePipeline.tsx   ← Live 6-stage progress (WebSocket)
│       │   ├── IntelligenceEngine.tsx ← Results: tabs, chat, export
│       │   ├── TopBar.tsx           ← Navigation
│       │   ├── Logo.tsx
│       │   └── Waveform.tsx
│       └── lib/
│           └── api.ts               ← Typed API client + export helpers
│
└── scripts/
    ├── setup.sh
    ├── test_pipeline.py
    ├── benchmark.py
    └── generate_ground_truth.py
```

---

## Classification Schema

### Meeting Mode

| Bucket | Meaning | Example |
|--------|---------|---------|
| `decision` | Something was resolved or agreed | *"We're going with Postgres."* |
| `commitment` | Someone is taking ownership of an action | *"I'll have the PR up by Thursday."* |
| `open_question` | An unresolved question needing follow-up | *"Who owns the billing migration?"* |
| `discussion` | Context, debate, or background | *"We've been having latency spikes since last week."* |

### Lecture Mode

| Bucket | Educational Meaning | Example |
|--------|---------------------|---------|
| `decision` → **Core Concept** | A foundational idea being taught | *"Transformers use self-attention to weigh token relevance."* |
| `commitment` → **Key Takeaway** | The main point to remember | *"Always normalize before feeding to a neural net."* |
| `open_question` → **Question / Exercise** | A question posed to the audience | *"What happens if the learning rate is too high?"* |
| `discussion` → **Example / Context** | Illustrative example or analogy | *"Think of it like sorting mail by category."* |

Each classified utterance carries a `confidence` score (0–1) and a `reasoning` field explaining why it was classified that way.

---

## Configuration Reference

### Required

| Variable | Description |
|----------|-------------|
| `GEMINI_API_KEY` | Google AI Studio API key |

### Model Tuning

| Variable | Default | Options |
|----------|---------|---------|
| `GEMINI_MODEL` | `gemini-2.0-flash` | Any model returned by `/health/gemini` |
| `WHISPER_MODEL` | `base` | `tiny` · `base` · `small` · `medium` · `large-v3` |

### Integrations

| Variable | Description |
|----------|-------------|
| `NOTION_API_KEY` | Internal integration token |
| `NOTION_DATABASE_ID` | Target database ID |
| `SLACK_BOT_TOKEN` | `xoxb-...` bot token |
| `SLACK_DEFAULT_CHANNEL` | Default channel for digests |
| `LINEAR_API_KEY` | Linear personal API key |
| `LINEAR_TEAM_ID` | Team to create issues in |

### App

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | SQLite | Set to `postgresql+asyncpg://...` for production |
| `CORS_ORIGINS` | `*` | Comma-separated allowed origins |
| `APP_ENV` | `development` | `production` enables JSON log output |
| `MAX_UPLOAD_MB` | `500` | Max file upload size |

---

## Observability

Every pipeline run produces a `PipelineMetrics` object:

```json
{
  "total_ms": 42300,
  "transcription_ms": 18500,
  "classification_ms": 15200,
  "extraction_ms": 6400,
  "integration_ms": 2200,
  "estimated_cost_usd": 0.0234,
  "input_tokens": 8500,
  "output_tokens": 2100,
  "whisper_model": "base",
  "gemini_model": "gemini-2.0-flash"
}
```

Logs are structured JSON in production. Every line includes `request_id`, `meeting_id`, and `stage` — filterable in Datadog, Loki, or CloudWatch.

---

## Deployment

### Render (backend)

A `render.yaml` is included. Set the following environment variables in the Render dashboard:

```
GEMINI_API_KEY=...
DATABASE_URL=postgresql+asyncpg://...
APP_ENV=production
CORS_ORIGINS=https://your-frontend.vercel.app
```

### Vercel (frontend)

```bash
cd frontend
vercel deploy --prod
```

Set `VITE_API_URL` to your Render backend URL in the Vercel project settings.

---

## Known Limitations

| Area | Limitation |
|------|-----------|
| **Diarization** | LLM-based (Gemini), not a dedicated diarization model. Works well for 2–5 speakers; degrades with overlapping speech or > 8 speakers. |
| **Rate limits** | Free Gemini tier = 10 RPM / 1500 RPD (2.0-flash). Pipeline spaces calls 6s apart to stay within limits. Enable billing for production workloads. |
| **Latency** | 30–90 seconds end-to-end for a 30-minute recording (Whisper is the bottleneck; upgrade to `small` or `medium` model for better accuracy at higher latency). |
| **Language** | Whisper supports 99 languages; classification prompts are English-only. Multilingual classification is on the roadmap. |
| **Storage** | SQLite by default. Set `DATABASE_URL` to PostgreSQL for any production deployment. |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **LLM** | Google Gemini 2.0 Flash (classification, diarization, Q&A, vision) |
| **ASR** | OpenAI Whisper (local, runs on CPU or GPU) |
| **Backend** | FastAPI · Python 3.11 · asyncio |
| **ORM** | SQLAlchemy (async) · aiosqlite / asyncpg |
| **Frontend** | React 18 · TypeScript · Vite · Tailwind CSS · shadcn/ui |
| **Real-time** | WebSockets (native FastAPI) |
| **Media** | yt-dlp · ffmpeg |
| **Deployment** | Render (backend) · Vercel (frontend) |

---

## License

MIT — see [LICENSE](LICENSE).
