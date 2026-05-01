import React, { useEffect, useState, useRef } from 'react';
import { chatAPI } from '../services/api';
import { Card, Btn, Spinner, toast } from '../components/ui';
import { Send, Plus, Trash2, MessageSquare, Bot, User } from 'lucide-react';

const SUGGESTIONS = [
  { text: 'Show me all pending leave requests', icon: '🏖️' },
  { text: 'How many employees are in each department?', icon: '🏢' },
  { text: 'What is the payroll cost for this month?', icon: '💰' },
  { text: 'Who has the most leave days remaining?', icon: '📅' },
  { text: 'Generate an attendance summary report', icon: '📊' },
];

export default function Chat() {
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef();

  const loadSessions = async () => {
    try {
      const { data } = await chatAPI.sessions();
      setSessions(data?.data || data || []);
    } catch {
      setSessions([]);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    if (activeSession) {
      loadMessages(activeSession);
    }
  }, [activeSession]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const loadMessages = async (sid) => {
    setLoading(true);
    try {
      const { data } = await chatAPI.session(sid);
      setMessages(data?.data?.messages || data?.messages || []);
    } catch {
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (msg) => {
    const text = msg || input.trim();
    if (!text) return;

    // Optimistic local message
    const userMsg = { id: Date.now(), role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setSending(true);

    try {
      const { data } = await chatAPI.send(text, activeSession);

      const newId = data?.data?.conversationId || data?.conversationId;
      
      // Sync active session if this is the first message
      if (newId && newId !== activeSession) {
        setActiveSession(newId);
        loadSessions(); 
        return; // loadMessages will fetch the new AI response
      }

      // We are in the same session, optimistic append is safe
      const aiMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        content: data?.data?.response || data?.response || data?.message || 'I processed your request.',
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (e) {
      const errMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        content: `Error: ${e.response?.data?.message || 'Failed to get response'}`,
      };
      setMessages((prev) => [...prev, errMsg]);
      toast(e.response?.data?.message || 'Chat error', 'error');
    } finally {
      setSending(false);
    }
  };

  const handleDeleteSession = async (sid) => {
    try {
      await chatAPI.deleteSession(sid);
      toast('Session closed', 'success');
      if (activeSession === sid) {
        setActiveSession(null);
        setMessages([]);
      }
      loadSessions();
    } catch (e) {
      toast(e.response?.data?.message || 'Failed to delete session', 'error');
    }
  };

  const handleNewChat = () => {
    setActiveSession(null);
    setMessages([]);
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={{ display: 'flex', gap: 20, height: 'calc(100vh - var(--topbar-h) - 80px)', minHeight: 500 }}>
      {/* Sessions Sidebar */}
      <Card
        style={{
          width: 260,
          minWidth: 260,
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)' }}>
          <Btn style={{ width: '100%' }} onClick={handleNewChat}>
            <Plus size={16} /> New Chat
          </Btn>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '8px' }}>
          {sessions.map((s) => {
            let chatTitle = `Chat ${s.id.substring(0, 8)}`;
            if (s.title) {
              chatTitle = s.title;
            } else if (s.messages && s.messages.length > 0) {
              const firstUserMsg = s.messages.find(m => m.role === 'user');
              if (firstUserMsg && firstUserMsg.content) {
                chatTitle = firstUserMsg.content.substring(0, 26) + (firstUserMsg.content.length > 26 ? '...' : '');
              }
            }

            return (
            <div
              key={s.id}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                padding: '10px 12px', borderRadius: '6px', cursor: 'pointer',
                background: activeSession === s.id ? 'rgba(30, 23, 96, 0.1)' : 'transparent',
                transition: 'background 0.1s', marginBottom: 2,
              }}
              onClick={() => setActiveSession(s.id)}
              onMouseEnter={(e) => {
                if (activeSession !== s.id) e.currentTarget.style.background = 'var(--gray-100)';
              }}
              onMouseLeave={(e) => {
                if (activeSession !== s.id) e.currentTarget.style.background = 'transparent';
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  className="truncate"
                  style={{
                    fontSize: 13, fontWeight: activeSession === s.id ? 600 : 400,
                    color: activeSession === s.id ? 'var(--primary)' : 'var(--text-dark)',
                  }}
                >
                  <MessageSquare size={13} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                  {chatTitle}
                </div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); handleDeleteSession(s.id); }}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-500)',
                  padding: 4, borderRadius: '4px', flexShrink: 0, opacity: 0.5, transition: 'opacity 0.15s',
                }}
                onMouseEnter={(e) => (e.target.style.opacity = '1')}
                onMouseLeave={(e) => (e.target.style.opacity = '0.5')}
              >
                <Trash2 size={14} />
              </button>
            </div>
            );
          })}
          {sessions.length === 0 && (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--gray-500)', fontSize: 13 }}>
              No conversations yet
            </div>
          )}
        </div>
      </Card>

      {/* Chat Area */}
      <Card
        style={{
          flex: 1, padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative'
        }}
      >
        <style>{`
          .bouncing-dot {
            width: 8px;
            height: 8px;
            background-color: var(--primary);
            border-radius: 50%;
            animation: bounce 1.4s infinite ease-in-out both;
          }
          @keyframes bounce {
            0%, 80%, 100% { transform: scale(0); opacity: 0.3; }
            40% { transform: scale(1); opacity: 1; }
          }
          .spin-slow {
            animation: spin 3s linear infinite;
          }
          @keyframes spin {
            100% { transform: rotate(360deg); }
          }
        `}</style>
        {/* Messages */}
        <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <Spinner size={28} />
            </div>
          ) : messages.length === 0 ? (
            /* Empty state with suggestions */
            <div style={{ textAlign: 'center', padding: '60px 20px', animation: 'fadeIn 0.5s ease-in-out' }}>
              <div
                style={{
                  width: 72, height: 72, borderRadius: '20px', background: 'linear-gradient(135deg, rgba(30, 23, 96, 0.1) 0%, rgba(142, 45, 226, 0.1) 100%)',
                  color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
                  boxShadow: '0 8px 24px rgba(30, 23, 96, 0.05)'
                }}
              >
                <Bot size={36} />
              </div>
              <h3 style={{ marginBottom: 12, fontSize: 24, fontWeight: 700, background: 'linear-gradient(135deg, var(--primary) 0%, #8e2de2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                HR AI Assistant ✨
              </h3>
              <p style={{ color: 'var(--gray-500)', fontSize: 15, marginBottom: 32, maxWidth: 450, margin: '0 auto 32px', lineHeight: 1.6 }}>
                Hi there! 👋 I'm your intelligent HR companion. Ask me anything about employees, leaves, attendance, payroll, or day-to-day operations!
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12, maxWidth: 600, margin: '0 auto' }}>
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s.text} onClick={() => handleSend(s.text)}
                    style={{
                      padding: '14px 18px', border: '1px solid var(--border-color)', borderRadius: '12px',
                      background: 'var(--white)', color: 'var(--text-dark)', fontSize: 14, cursor: 'pointer',
                      textAlign: 'left', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--primary)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 16px rgba(30, 23, 96, 0.08)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border-color)';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.02)';
                    }}
                  >
                    <span style={{ fontSize: 20 }}>{s.icon}</span>
                    <span style={{ flex: 1, fontWeight: 500 }}>{s.text}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg, idx) => (
                <div
                  key={msg.id || idx}
                  style={{
                    display: 'flex', gap: 12, marginBottom: 20,
                    justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    animation: 'fadeIn 0.3s ease-in-out'
                  }}
                >
                  {msg.role !== 'user' && (
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(30, 23, 96, 0.1) 0%, rgba(142, 45, 226, 0.1) 100%)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Bot size={20} />
                    </div>
                  )}
                  <div
                    style={{
                      maxWidth: '75%', padding: '14px 18px',
                      borderRadius: msg.role === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                      background: msg.role === 'user' ? 'linear-gradient(135deg, var(--primary) 0%, #2b227c 100%)' : 'var(--gray-50)',
                      color: msg.role === 'user' ? 'var(--white)' : 'var(--text-dark)',
                      boxShadow: msg.role === 'user' ? '0 4px 12px rgba(30, 23, 96, 0.15)' : '0 2px 8px rgba(0,0,0,0.03)',
                      border: msg.role === 'user' ? 'none' : '1px solid var(--border-color)',
                      fontSize: 14.5, lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                    }}
                  >
                    {msg.content}
                  </div>
                  {msg.role === 'user' && (
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary) 0%, #2b227c 100%)', color: 'var(--white)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <User size={20} />
                    </div>
                  )}
                </div>
              ))}
              {sending && (
                <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(30, 23, 96, 0.1) 0%, rgba(142, 45, 226, 0.1) 100%)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Bot size={20} className="spin-slow" />
                  </div>
                  <div style={{ padding: '16px 20px', background: 'var(--gray-50)', borderRadius: '20px 20px 20px 4px', border: '1px solid var(--border-color)', display: 'flex', gap: 6, alignItems: 'center' }}>
                    <div className="bouncing-dot" style={{ animationDelay: '0s' }}></div>
                    <div className="bouncing-dot" style={{ animationDelay: '0.2s' }}></div>
                    <div className="bouncing-dot" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </>
          )}
        </div>

        {/* Input */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-color)', display: 'flex', gap: 10 }}>
          <input
            value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown}
            placeholder="Type your message..." disabled={sending}
            style={{ flex: 1, padding: '11px 16px', border: '1px solid var(--border-color)', borderRadius: '50px', fontSize: 14, outline: 'none', background: 'var(--gray-100)', color: 'var(--text-dark)', transition: 'border-color 0.15s' }}
            onFocus={(e) => (e.target.style.borderColor = 'var(--primary)')}
            onBlur={(e) => (e.target.style.borderColor = 'var(--border-color)')}
            id="chat-input"
          />
          <Btn onClick={() => handleSend()} disabled={!input.trim() || sending} style={{ borderRadius: '50%', padding: '11px 20px' }} id="chat-send">
            <Send size={16} />
          </Btn>
        </div>
      </Card>
    </div>
  );
}
