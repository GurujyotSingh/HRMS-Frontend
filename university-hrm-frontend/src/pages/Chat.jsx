import React, { useEffect, useState, useRef } from 'react';
import { chatAPI } from '../services/api';
import { Card, Btn, Spinner, toast } from '../components/ui';
import { Send, Plus, Trash2, MessageSquare, Bot, User } from 'lucide-react';

const SUGGESTIONS = [
  'Show me all pending leave requests',
  'How many employees are in each department?',
  'What is the payroll cost for this month?',
  'Who has the most leave days remaining?',
  'Generate an attendance summary report',
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
          flex: 1, padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}
      >
        {/* Messages */}
        <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <Spinner size={28} />
            </div>
          ) : messages.length === 0 ? (
            /* Empty state with suggestions */
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div
                style={{
                  width: 64, height: 64, borderRadius: '16px', background: 'rgba(30, 23, 96, 0.1)',
                  color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
                }}
              >
                <Bot size={32} />
              </div>
              <h3 style={{ marginBottom: 8 }}>HR AI Assistant</h3>
              <p style={{ color: 'var(--gray-500)', fontSize: 14, marginBottom: 24, maxWidth: 400, margin: '0 auto 24px' }}>
                Ask me anything about employees, leaves, attendance, payroll, or HR operations.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 400, margin: '0 auto' }}>
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s} onClick={() => handleSend(s)}
                    style={{
                      padding: '10px 16px', border: '1px solid var(--border-color)', borderRadius: '6px',
                      background: 'var(--white)', color: 'var(--text-dark)', fontSize: 13, cursor: 'pointer',
                      textAlign: 'left', transition: 'all 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--primary)';
                      e.currentTarget.style.background = 'rgba(30, 23, 96, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border-color)';
                      e.currentTarget.style.background = 'var(--white)';
                    }}
                  >
                    {s}
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
                  }}
                >
                  {msg.role !== 'user' && (
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(30, 23, 96, 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Bot size={18} />
                    </div>
                  )}
                  <div
                    style={{
                      maxWidth: '70%', padding: '12px 16px',
                      borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      background: msg.role === 'user' ? 'var(--primary)' : 'var(--gray-100)',
                      color: msg.role === 'user' ? 'var(--white)' : 'var(--text-dark)',
                      fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                    }}
                  >
                    {msg.content}
                  </div>
                  {msg.role === 'user' && (
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary)', color: 'var(--white)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <User size={18} />
                    </div>
                  )}
                </div>
              ))}
              {sending && (
                <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(30, 23, 96, 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Bot size={18} />
                  </div>
                  <div style={{ padding: '12px 20px', background: 'var(--gray-100)', borderRadius: '16px 16px 16px 4px', display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span style={{ animation: 'pulse 1.5s infinite', fontSize: 20, lineHeight: 1 }}>•</span>
                    <span style={{ animation: 'pulse 1.5s infinite 0.3s', fontSize: 20, lineHeight: 1 }}>•</span>
                    <span style={{ animation: 'pulse 1.5s infinite 0.6s', fontSize: 20, lineHeight: 1 }}>•</span>
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
