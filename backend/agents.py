"""
Multi-Agent System using Groq Free API
"""

import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    raise ValueError("GROQ_API_KEY not found in .env file.")

client = Groq(api_key=GROQ_API_KEY)
MODEL_NAME = "llama-3.3-70b-versatile"


def call_llm(system_prompt: str, user_prompt: str) -> str:
    response = client.chat.completions.create(
        model=MODEL_NAME,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user",   "content": user_prompt}
        ],
        max_tokens=1500,
        temperature=0.7,
    )
    return response.choices[0].message.content


def architect_agent(requirement: str, history: str) -> str:
    system = """You are a Senior Software Architect AI agent.
Analyze requirements and produce a high-level system architecture.
Focus on components, communication patterns, scalability, and key decisions.
Use markdown with clear headings."""
    prompt = f"Context:\n{history or 'None'}\n\nRequirement:\n{requirement}\n\nProduce architecture design."
    return call_llm(system, prompt)


def tech_analyst_agent(requirement: str, architecture: str) -> str:
    system = """You are a Tech Stack Analyst AI agent.
Recommend the best tech stack with trade-offs. Cover frontend, backend, database, caching.
Use markdown tables. Be opinionated."""
    prompt = f"Requirement:\n{requirement}\n\nArchitecture:\n{architecture}\n\nRecommend tech stack."
    return call_llm(system, prompt)


def solution_writer_agent(requirement: str, architecture: str, tech_analysis: str) -> str:
    system = """You are a Technical Solution Writer AI agent.
Write a final solution document with:
1. Executive Summary
2. System Architecture
3. Tech Stack Table
4. Implementation Roadmap
5. Key Risks & Mitigations
6. Quick Start (3 steps)"""
    prompt = f"Requirement:\n{requirement}\n\nArchitecture:\n{architecture}\n\nTech Analysis:\n{tech_analysis}\n\nWrite final document."
    return call_llm(system, prompt)


def run_agents(user_message: str, history: str = "") -> dict:
    arch_output  = architect_agent(user_message, history)
    tech_output  = tech_analyst_agent(user_message, arch_output)
    final_output = solution_writer_agent(user_message, arch_output, tech_output)
    return {
        "response": final_output,
        "agents_used": ["🏗️ Architect Agent", "🔬 Tech Analyst Agent", "✍️ Solution Writer Agent"]
    }