import React, { useState, useRef, useEffect, useCallback } from 'react'
import axios from 'axios'
import { v4 as uuidv4 } from 'uuid'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const API_BASE = 'http://localhost:8001'

const SUGGESTIONS = [
  { icon: '📊', title: 'Synthesize Data', desc: 'Design a data pipeline and analytics system' },
  { icon: '💡', title: 'Creative Architecture', desc: 'Generate a scalable microservices design' },
  { icon: '✅', title: 'Check Tech Stack', desc: 'Compare key differences between stacks' },
  { icon: '🏗️', title: 'System Design', desc: 'Design a production-ready backend system' },
]

function createSession(name = null) {
  return { id: uuidv4(), name: name || 'New Chat', messages: [], createdAt: Date.now() }
}

function AgentBadge({ name }) {
  const map = { '🏗️': '#7c3aed', '🔬': '#0891b2', '✍️': '#059669' }
  const emoji = name.split(' ')[0]
  const color = map[emoji] || '#7c3aed'
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      background: `${color}12`, border: `1px solid ${color}30`,
      color, borderRadius: 20, padding: '2px 10px',
      fontSize: 11, fontWeight: 500, marginRight: 4,
    }}>{name}</span>
  )
}

function TypingDots() {
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center', padding: '8px 0' }}>
      {[0,1,2].map(i => (
        <div key={i} style={{
          width: 7, height: 7, borderRadius: '50%', background: '#c4b5fd',
          animation: `bounce 1.2s ease ${i*0.2}s infinite`,
        }}/>
      ))}
      <style>{`@keyframes bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-5px)}}`}</style>
    </div>
  )
}

function Message({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: 24, gap: 10, alignItems: 'flex-start' }}>
      {!isUser && (
        <div style={{
          width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(135deg, #8b5cf6, #a78bfa)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
          boxShadow: '0 2px 8px rgba(139,92,246,0.3)',
        }}>⚡</div>
      )}
      <div style={{ maxWidth: '78%', minWidth: 0 }}>
        {!isUser && msg.agents && (
          <div style={{ marginBottom: 8 }}>
            {msg.agents.map(a => <AgentBadge key={a} name={a} />)}
          </div>
        )}
        <div style={{
          background: isUser ? 'linear-gradient(135deg, #8b5cf6, #7c3aed)' : '#ffffff',
          border: isUser ? 'none' : '1px solid var(--border)',
          borderRadius: isUser ? '18px 18px 4px 18px' : '4px 18px 18px 18px',
          padding: '12px 16px',
          boxShadow: isUser ? '0 2px 12px rgba(139,92,246,0.25)' : 'var(--shadow-sm)',
          color: isUser ? '#fff' : 'inherit',
        }}>
          {isUser
            ? <p style={{ margin: 0, lineHeight: 1.5 }}>{msg.content}</p>
            : <div className="markdown-body"><ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown></div>
          }
        </div>
        <div style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 4, paddingLeft: isUser ? 0 : 4, textAlign: isUser ? 'right' : 'left' }}>
          {new Date(msg.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
      {isUser && (
        <div style={{
          width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(135deg, #f3e8ff, #ede9fe)',
          border: '1px solid #ddd6fe',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15,
        }}>👤</div>
      )}
    </div>
  )
}

export default function App() {
  const [sessions, setSessions] = useState([createSession('New Chat')])
  const [activeId, setActiveId] = useState(null)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const messagesEndRef = useRef(null)

  const activeSession = sessions.find(s => s.id === activeId) || sessions[0]

  useEffect(() => { if (!activeId && sessions.length) setActiveId(sessions[0].id) }, [])
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [activeSession?.messages, loading])

  const updateSession = useCallback((id, fn) => {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, ...fn(s) } : s))
  }, [])

  const newChat = () => {
    const s = createSession()
    setSessions(prev => [s, ...prev])
    setActiveId(s.id)
  }

  const sendMessage = async (text) => {
    const msg = (text || input).trim()
    if (!msg || loading) return
    setInput('')
    const sid = activeSession.id
    const userMsg = { role: 'user', content: msg, ts: Date.now() }
    updateSession(sid, s => ({
      messages: [...s.messages, userMsg],
      name: s.messages.length === 0 ? msg.slice(0, 30) + (msg.length > 30 ? '…' : '') : s.name,
    }))
    setLoading(true)
    try {
      const history = activeSession.messages.slice(-6).map(m => ({ role: m.role, content: m.content }))
      const res = await axios.post(`${API_BASE}/chat`, { session_id: sid, message: msg, history })
      updateSession(sid, s => ({
        messages: [...s.messages, { role: 'assistant', content: res.data.response, agents: res.data.agents_used, ts: Date.now() }]
      }))
    } catch (err) {
      updateSession(sid, s => ({
        messages: [...s.messages, { role: 'assistant', content: `**Error:** ${err.response?.data?.detail || err.message}`, ts: Date.now() }]
      }))
    } finally { setLoading(false) }
  }

  const hasMessages = activeSession?.messages?.length > 0

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg-base)' }}>
      {/* Sidebar */}
      {sidebarOpen && (
        <aside style={{
          width: 260, flexShrink: 0,
          background: '#1a1a1a',
          display: 'flex', flexDirection: 'column',
          borderRight: '1px solid #2a2a2a',
        }}>
          {/* Logo */}
          <div style={{ padding: '18px 16px 12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8,
                background: 'linear-gradient(135deg, #8b5cf6, #a78bfa)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
              }}>⚡</div>
              <span style={{ color: '#fff', fontWeight: 600, fontSize: 15, letterSpacing: '-0.2px' }}>AutoSysDesign</span>
            </div>
            <button onClick={newChat} style={{
              width: '100%', padding: '8px 12px',
              background: 'transparent',
              border: '1px solid #333',
              borderRadius: 8, color: '#ccc',
              fontSize: 13, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 8,
              transition: 'all 0.15s',
            }}
              onMouseOver={e => { e.currentTarget.style.background = '#2a2a2a'; e.currentTarget.style.color = '#fff' }}
              onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#ccc' }}
            >
              <span style={{ fontSize: 16 }}>+</span> New chat
            </button>
          </div>

          {/* Search bar */}
          <div style={{ padding: '0 12px 12px' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: '#2a2a2a', borderRadius: 6, padding: '6px 10px',
            }}>
              <span style={{ color: '#666', fontSize: 13 }}>🔍</span>
              <span style={{ color: '#555', fontSize: 13 }}>Search</span>
            </div>
          </div>

          {/* Nav items */}
          {['Explore', 'Library', 'Files', 'History'].map((item, i) => (
            <div key={item} style={{
              padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 10,
              color: '#888', fontSize: 13, cursor: 'pointer',
              transition: 'color 0.15s',
            }}
              onMouseOver={e => e.currentTarget.style.color = '#fff'}
              onMouseOut={e => e.currentTarget.style.color = '#888'}
            >
              <span>{['🧭','📚','📁','🕐'][i]}</span> {item}
            </div>
          ))}

          <div style={{ flex: 1, overflowY: 'auto', padding: '8px 8px', marginTop: 8 }}>
            {sessions.map(s => (
              <button key={s.id} onClick={() => setActiveId(s.id)} style={{
                width: '100%', textAlign: 'left', padding: '8px 10px',
                background: s.id === activeSession?.id ? '#2a2a2a' : 'transparent',
                border: 'none', borderRadius: 6,
                color: s.id === activeSession?.id ? '#fff' : '#888',
                fontSize: 13, cursor: 'pointer', marginBottom: 1,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                transition: 'all 0.15s',
              }}
                onMouseOver={e => { if (s.id !== activeSession?.id) { e.currentTarget.style.background = '#222'; e.currentTarget.style.color = '#ccc' }}}
                onMouseOut={e => { if (s.id !== activeSession?.id) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#888' }}}
              >
                💬 {s.name}
              </button>
            ))}
          </div>

          {/* User */}
          <div style={{ padding: '12px 16px', borderTop: '1px solid #2a2a2a', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #8b5cf6, #a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>U</div>
            <div>
              <div style={{ color: '#ccc', fontSize: 13, fontWeight: 500 }}>Yuvraj</div>
              <div style={{ color: '#555', fontSize: 11 }}>Free Plan</div>
            </div>
          </div>
        </aside>
      )}

      {/* Main */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#fff' }}>
        {/* Header */}
        <header style={{
          height: 52, borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 20px', background: '#fff', flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => setSidebarOpen(v => !v)} style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)', fontSize: 18, padding: '4px 6px', borderRadius: 6,
              transition: 'background 0.15s',
            }}
              onMouseOver={e => e.currentTarget.style.background = 'var(--bg-panel)'}
              onMouseOut={e => e.currentTarget.style.background = 'transparent'}
            >☰</button>
            <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>
              {activeSession?.name || 'New Chat'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              background: '#f0fdf4', border: '1px solid #bbf7d0',
              color: '#16a34a', borderRadius: 20, padding: '3px 10px',
              fontSize: 11, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 5,
            }}>
              <span style={{ width: 5, height: 5, background: '#22c55e', borderRadius: '50%', display: 'inline-block', animation: 'pulse 2s infinite' }}/>
              Groq · Llama 3.3 70B
            </span>
            <button style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, padding: '5px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              Upgrade
            </button>
            <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
          </div>
        </header>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '32px 0' }}>
          <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 24px' }}>
            {!hasMessages ? (
              <div style={{ textAlign: 'center', paddingTop: '8vh' }}>
                {/* Avatar */}
                <div style={{
                  width: 72, height: 72, margin: '0 auto 20px',
                  background: 'linear-gradient(135deg, #c4b5fd, #a78bfa)',
                  borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32,
                  boxShadow: '0 4px 24px rgba(139,92,246,0.2)',
                }}>⚡</div>
                <p style={{ color: 'var(--accent)', fontWeight: 600, fontSize: 15, marginBottom: 4 }}>AutoSysDesign</p>
                <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 32, letterSpacing: '-0.5px' }}>
                  How can I assist you today?
                </h1>
                {/* Suggestion chips */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, maxWidth: 620, margin: '0 auto' }}>
                  {SUGGESTIONS.slice(0,3).map(s => (
                    <button key={s.title} onClick={() => sendMessage(s.title + ': ' + s.desc)} style={{
                      background: '#fff', border: '1px solid var(--border)',
                      borderRadius: 12, padding: '12px 14px', textAlign: 'left',
                      cursor: 'pointer', transition: 'all 0.15s', boxShadow: 'var(--shadow-sm)',
                    }}
                      onMouseOver={e => { e.currentTarget.style.borderColor = '#a78bfa'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(139,92,246,0.12)' }}
                      onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)' }}
                    >
                      <div style={{ fontSize: 18, marginBottom: 6 }}>{s.icon}</div>
                      <div style={{ fontWeight: 600, fontSize: 12, color: 'var(--text-primary)', marginBottom: 3 }}>{s.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4 }}>{s.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {activeSession.messages.map((msg, i) => <Message key={i} msg={msg} />)}
                {loading && (
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 20 }}>
                    <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg, #8b5cf6, #a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>⚡</div>
                    <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '4px 18px 18px 18px', padding: '10px 16px', boxShadow: 'var(--shadow-sm)' }}>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>3 agents working…</div>
                      <TypingDots />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>
        </div>

        {/* Input */}
        <div style={{ padding: '16px 24px 24px', background: '#fff', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
          <div style={{ maxWidth: 720, margin: '0 auto' }}>
            <div style={{
              background: '#fff', border: '1px solid #ddd',
              borderRadius: 16, padding: '10px 14px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
              transition: 'border-color 0.2s, box-shadow 0.2s',
            }}
              onFocusCapture={e => { e.currentTarget.style.borderColor = '#a78bfa'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(167,139,250,0.12)' }}
              onBlurCapture={e => { e.currentTarget.style.borderColor = '#ddd'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)' }}
            >
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }}}
                placeholder="Ask me anything..."
                rows={1}
                style={{
                  width: '100%', background: 'transparent', border: 'none', outline: 'none',
                  color: 'var(--text-primary)', fontFamily: 'var(--font-body)',
                  fontSize: 14, resize: 'none', lineHeight: 1.6, maxHeight: 120, overflowY: 'auto',
                }}
                onInput={e => { e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px' }}
              />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[['🔍', 'Deeper Research'], ['📎', 'Attach file'], ['💡', 'Suggestions']].map(([icon, label]) => (
                    <button key={label} style={{
                      background: 'var(--bg-panel)', border: '1px solid var(--border)',
                      borderRadius: 20, padding: '4px 10px', fontSize: 11,
                      color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                    }}>{icon} {label}</button>
                  ))}
                </div>
                <button onClick={() => sendMessage()} disabled={!input.trim() || loading} style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: input.trim() && !loading ? 'var(--accent)' : 'var(--bg-panel)',
                  border: 'none', cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
                  color: input.trim() && !loading ? '#fff' : 'var(--text-muted)',
                  fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s',
                }}>↑</button>
              </div>
            </div>
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 11, marginTop: 8 }}>
              Enter ↵ to send · Shift+Enter for new line
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
