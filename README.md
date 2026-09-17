# CartFlow — Production Agentic E-Commerce Support Desk

[![FastAPI](https://img.shields.io/badge/FastAPI-0.141.1-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-16.3-black.svg?logo=next.js&logoColor=white)](https://nextjs.org)
[![LangGraph](https://img.shields.io/badge/LangGraph-1.2-blue.svg)](https://github.com/langchain-ai/langgraph)
[![ChromaDB](https://img.shields.io/badge/ChromaDB-Vector_Store-orange.svg)](https://www.trychroma.com/)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)

**CartFlow** is an enterprise-ready, production-oriented agentic customer support platform for e-commerce. Built with **LangGraph**, **FastAPI**, **ChromaDB**, and **Next.js 16**, CartFlow seamlessly orchestrates intent classification, order lookups, policy retrieval (RAG), PII redaction, prompt injection defense, fault tolerance, and checkpoint resumption.

---

## Architecture Overview

```
[User Browser]
      │
      │ HTTP / REST (CORS enabled)
      ▼
[Next.js Support Desk UI (frontend2)] ─── Port 3000
      │
      │ /api/chat, /api/threads, /api/documents/upload
      ▼
[FastAPI Backend (src/agent/main.py)] ─── Port 8000
      │
      ├─► [Request Audit Logger] ──► logs/agent_run/requests.jsonl
      ├─► [MLflow Tracing]      ──► storage/mlflow/traces.db
      ├─► [Session Store]       ──► storage/conversation/conversations.json
      │
      ▼
[LangGraph Agent (src/agent/graph.py)]
      │
      ├── classify_intent
      │     ├─ Prompt Injection Detector (Pre-filter guardrail)
      │     └─ PII Masker (Phone & Card numbers redacted)
      │
      ├── Conditional Routing:
      │     ├─ [order_status]    ──► call_sql_tool        ──► orders.db (SQLite)
      │     ├─ [policy_query]    ──► call_rag_tool        ──► ChromaDB Vector Store
      │     ├─ [feedback]        ──► call_feedback_tool   ──► storage/feedbacks/
      │     ├─ [escalation]      ──► call_defer_human_tool──► storage/deferred_cases/
      │     └─ [injection]       ──► Direct to Response Generation
      │
      ├── generate_response
      │     ├─ Structured Output JSON Schema Validation
      │     └─ Tenacity Exponential Backoff Retry Policy (@retry)
      │
      └── Checkpointer (SqliteSaver) ──► checkpoints.sqlite (Resume interrupted turns)
```

---

## Key Capabilities

1. **Stateful Agent Workflow (`LangGraph`)**:
   - Compiles a directed state graph with explicit node retries and fallback routing.
   - Dynamic intent routing: classifies customer questions into `order_status`, `policy_query`, `feedback_request`, `defer_request`, or `prompt_injection`.

2. **Security & Guardrails**:
   - **PII Masking**: Automatically detects and redacts 16-digit credit card numbers and telephone numbers before model ingestion and before writing to audit logs.
   - **Prompt Injection Defense**: Evaluates incoming prompts against adversarial instructions before execution.

3. **Multi-Turn Memory & Resilient State**:
   - **Cross-Turn Session Memory**: Dual storage in `conversations.json` allows the agent to recall context (e.g. referring to `ORD0003` across turns).
   - **Mid-Turn Checkpoint Resumption**: LangGraph `SqliteSaver` checkpoints in-flight turns so interrupted or failed steps can be resumed with a single click.

4. **Tools & Retrieval**:
   - **SQL Order Tool**: Looks up order metadata, computes normalized escalation scores, and determines delivery delays.
   - **RAG Knowledge Base**: High-confidence chunk retrieval over e-commerce policy documents with a 10s execution timeout boundary.
   - **Dynamic Document Ingestion**: Upload new PDF policy documents directly from the UI into the vector database.

5. **Production Observability**:
   - Structured JSON-Lines per-request audit logging (`logs/agent_run/requests.jsonl`).
   - MLflow tracing enabled for LangChain, OpenAI, and Groq calls.

---

## Project Structure

```text
cartflow/
├── config/                 # Tool configurations & JSON prompts
├── data/
│   ├── database/           # SQLite orders database (orders.db)
│   └── policy_docs/        # Knowledge base PDFs
├── eval/                   # Golden test cases & demonstration suites
│   ├── golden/
│   ├── insights/
│   ├── results/
│   └── scripts/
├── frontend2/              # Next.js 16 + React 19 + Tailwind CSS Support Desk
│   ├── src/app/            # App router, layouts, pages
│   ├── src/components/     # ChatArea, Sidebar, Composer, SettingsModal
│   └── src/lib/api.ts      # Backend API client
├── logs/                   # Audit logs and API retry traces
├── prompts/                # Versioned system prompts
├── schema/                 # Structured JSON schemas
├── scripts/                # Database seeding & dataset generation
├── src/                    # Backend Python source code
│   ├── agent/              # LangGraph workflow, nodes, FastAPI main.py
│   ├── guardrails/         # PII masking & injection detection
│   ├── memory/             # Multi-turn conversation store
│   ├── observability/      # MLflow tracing & structured request logging
│   ├── rag/                # Chunking, embeddings, retrieval & generation
│   ├── resilience/         # Timeout boundaries & thread workers
│   └── tools/              # SQL lookup, feedback, and escalation tools
├── storage/                # SQLite checkpoints, traces, and session JSON
├── run_all.bat             # One-click Windows launch script (Backend + Frontend)
├── run_backend.bat         # Start FastAPI backend
├── run_frontend.bat        # Start Next.js frontend
├── docker-compose.yml      # Multi-container production deployment
├── Dockerfile              # Backend container definition
└── pyproject.toml          # Python package definition & dependencies
```

---

## Quick Start

### Prerequisites
- Python 3.12 or 3.13
- Node.js 18+ and npm
- (Optional) Docker & Docker Compose

### 1. Environment Setup

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
*Note: By default, `MOCK_LLM=true` runs completely offline without external API keys. If you wish to use live Groq inference, set `MOCK_LLM=false` and provide your `api_key`.*

### 2. Run Locally (Windows One-Click)
Double-click `run_all.bat` or run:
```powershell
.\run_all.bat
# or in PowerShell:
.\run_all.ps1
```

### 3. Run Manually

**Terminal 1 — Backend (FastAPI):**
```bash
.\.venv\Scripts\python.exe -m uvicorn src.agent.main:app --host 127.0.0.1 --port 8000 --reload
```
API Documentation will be live at: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

**Terminal 2 — Frontend (Next.js):**
```bash
cd frontend2
npm run dev
```
Support Desk UI will be live at: [http://localhost:3000](http://localhost:3000)

---

## Docker Deployment

To launch both the backend and frontend in isolated production containers:

```bash
docker-compose up --build
```
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`

---

## API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Liveness health check |
| `POST` | `/api/chat` | Send a customer turn or resume an existing thread |
| `GET` | `/api/threads` | List all persisted tickets/threads |
| `GET` | `/api/threads/{thread_id}/messages` | Retrieve full message history for a thread |
| `GET` | `/api/threads/{thread_id}/state` | Check if a thread is interrupted mid-workflow |
| `POST` | `/api/threads/{thread_id}/resume` | Continue execution from a saved LangGraph checkpoint |
| `DELETE` | `/api/threads/{thread_id}` | Delete a thread's history |
| `POST` | `/api/documents/upload` | Upload and embed PDF into ChromaDB |

---

## Verification & Testing

Execute the core demonstration suite (verifying multi-turn memory, PII masking, prompt injection defense, LLM retry handling, and RAG timeouts):
```bash
.\.venv\Scripts\python.exe eval/scripts/missing_implementations_demo.py
```

Run frontend production build verification:
```bash
npm --prefix frontend2 run build
```

---

## License

This project is licensed under the [Apache-2.0 License](LICENSE).
