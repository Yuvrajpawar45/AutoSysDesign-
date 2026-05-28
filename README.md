# ⚡ AutoSysDesign

A full-stack multi-agent AI application. You describe a system — 3 specialized AI agents (Architect, Tech Analyst, Solution Writer) collaborate via Groq-hosted Llama 3.3 70B to produce a complete architecture document.

**Tech Stack:** React + Vite · FastAPI · Groq + Llama 3.3 70B

---

## 🚀 Quick Start

### Step 1 — Get a Groq API Key

1. Go to your Groq console/docs to create an API key
2. Click **"Create API key"**
3. Copy the key

### Step 2 — Configure the Backend

```bash
cd backend
cp .env.example .env
# Open .env and paste your API key:
# GROQ_API_KEY=your-groq-api-key-here
```

### Step 3 — Start the Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Backend runs at: http://localhost:8000

### Step 4 — Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: http://localhost:5173

---

## 🤖 How the Agent Pipeline Works

```
User Input
    │
    ▼
┌─────────────────────────────┐
│  🏗️  Architect Agent         │  → High-level system design
│  (Groq Llama 3.3 70B call 1)│    Components, patterns, scale
└─────────────────────────────┘
    │
    ▼
┌─────────────────────────────┐
│  🔬 Tech Analyst Agent       │  → Tech stack + trade-offs
│  (Groq Llama 3.3 70B call 2)│    Tables, comparisons, rationale
└─────────────────────────────┘
    │
    ▼
┌─────────────────────────────┐
│  ✍️  Solution Writer Agent   │  → Final unified document
│  (Groq Llama 3.3 70B call 3)│    Roadmap, risks, quick start
└─────────────────────────────┘
    │
    ▼
Rendered Markdown Response
```

Each agent builds on the previous one's output.

---

## 📁 Project Structure

```
autosysdesign/
├── backend/
│   ├── main.py          # FastAPI app + routes
│   ├── agents.py        # 3-agent pipeline (Groq + Llama 3.3 70B)
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── App.jsx      # Full chat UI
    │   ├── index.css    # Design system
    │   └── main.jsx
    ├── index.html
    ├── package.json
    └── vite.config.js
```

---

## ⚠️ Model / Rate Limits

- Uses Llama 3.3 70B hosted via Groq. Check Groq docs for exact rate limits.
- Each chat message results in 3 model calls (one per agent)
- Effective throughput depends on your Groq plan and model latency

---

## 🛠️ Customizing Agents

Edit `backend/agents.py` to change agent behavior:

```python
def architect_agent(requirement, history):
    system = """Your custom system prompt here..."""
    ...
```

Add more agents by following the same pattern and chaining them in `run_agents()`.
