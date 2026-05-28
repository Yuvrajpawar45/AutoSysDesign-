from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uuid
from agents import run_agents

app = FastAPI(title="AutoSysDesign API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Message(BaseModel):
    role: str  # "user" or "assistant"
    content: str

class ChatRequest(BaseModel):
    session_id: Optional[str] = None
    message: str
    history: Optional[List[Message]] = []

class ChatResponse(BaseModel):
    session_id: str
    response: str
    agents_used: List[str]

@app.get("/")
def root():
    return {"status": "AutoSysDesign API running"}

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    session_id = request.session_id or str(uuid.uuid4())
    
    history_text = ""
    if request.history:
        for msg in request.history[-6:]:  # last 3 turns
            role = "User" if msg.role == "user" else "Assistant"
            history_text += f"{role}: {msg.content}\n"
    
    try:
        result = run_agents(request.message, history_text)
        return ChatResponse(
            session_id=session_id,
            response=result["response"],
            agents_used=result["agents_used"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
def health():
    return {"status": "ok"}
