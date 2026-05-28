# ⚡ AutoSysDesign

A full-stack multi-agent AI application. You describe a system — 3 specialized AI agents (Architect, Tech Analyst, Solution Writer) collaborate via Google Gemini to produce a complete architecture document.

**Tech Stack:** React + Vite · FastAPI · Google Gemini 1.5 Flash (free)

---

## 🚀 Quick Start

### Step 1 — Get a Free Gemini API Key

1. Go to: https://aistudio.google.com/app/apikey
2. Click **"Create API key"**
3. Copy the key

### Step 2 — Configure the Backend

```bash
cd backend
cp .env.example .env
# Open .env and paste your API key:
# GEMINI_API_KEY=AIza...your-key-here
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
│  (Gemini 1.5 Flash call 1)  │    Components, patterns, scale
└─────────────────────────────┘
    │
    ▼
┌─────────────────────────────┐
│  🔬 Tech Analyst Agent       │  → Tech stack + trade-offs
│  (Gemini 1.5 Flash call 2)  │    Tables, comparisons, rationale
└─────────────────────────────┘
    │
    ▼
┌─────────────────────────────┐
│  ✍️  Solution Writer Agent   │  → Final unified document
│  (Gemini 1.5 Flash call 3)  │    Roadmap, risks, quick start
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
│   ├── agents.py        # 3-agent pipeline (Gemini)
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

## ⚠️ Gemini Free Tier Limits

- 15 requests/minute on Gemini 1.5 Flash
- Each chat message = 3 API calls (one per agent)
- Effective: ~5 messages/minute — plenty for dev/demo

---

## 🛠️ Customizing Agents

Edit `backend/agents.py` to change agent behavior:

```python
def architect_agent(requirement, history):
    system = """Your custom system prompt here..."""
    ...
```

Add more agents by following the same pattern and chaining them in `run_agents()`.
