import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Bot, MessageSquarePlus, Sparkles, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { chatAPI } from '../services/api';
import { Btn, Card, toast } from '../components/ui';

const MOCK_KEY = 'hrm_mock_chat';

function mockReply(q) {
  const s = q.toLowerCase();
  if (s.includes('leave')) return 'For leave balance and applications, open the Leave page from the sidebar.';
  if (s.includes('pay')) return 'Payslips are under Payroll. HR finalizes drafts before you can view them.';
  if (s.includes('attend')) return 'Use Attendance to clock in/out and review your monthly history.';
  return "I'm a local helper (HR uses the live AI). Try asking about leave, payroll, or attendance.";
}

export default function Chat() {
  const { hasRole } = useAuth();
  const isHrAi = hasRole('hr');
  const [sessions, setSessions] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [mockSessions, setMockSessions] = useState([]);
  const bottomRef = useRef(null);

  const scrollDown = () => {
    requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }));
  };

  const loadSessionsHr = useCallback(async () => {
    try {
      const { data } = await chatAPI.sessions();
      const open = (data || []).filter((s) => s.status !== 'closed');
      setSessions(open);
    } catch (e) {
      toast(e.response?.data?.detail || 'Could not load sessions', 'error');
    }
  }, []);

  const loadSessionHr = async (id) => {
    try {
      const { data } = await chatAPI.session(id);
      setMessages(data.messages || []);
      setActiveId(id);
      scrollDown();
    } catch (e) {
      toast(e.response?.data?.detail || 'Could not open session', 'error');
    }
  };

  useEffect(() => {
    if (isHrAi) loadSessionsHr();
    else {
      try {
        const raw = localStorage.getItem(MOCK_KEY);
        setMockSessions(raw ? JSON.parse(raw) : []);
      } catch {
        setMockSessions([]);
      }
    }
  }, [isHrAi, loadSessionsHr]);

  useEffect(() => {
    scrollDown();
  }, [messages, typing]);

  const saveMockSessions = (nextOrUpdater) => {
    setMockSessions((prev) => {
      const next = typeof nextOrUpdater === 'function' ? nextOrUpdater(prev) : nextOrUpdater;
      localStorage.setItem(MOCK_KEY, JSON.stringify(next));
      return next;
    });
  };

  const newMockChat = () => {
    const id = `m-${Date.now()}`;
    const sess = { id, title: 'New chat', messages: [], created: new Date().toISOString() };
    saveMockSessions((prev) => [sess, ...prev]);
    setActiveId(id);
    setMessages([]);
  };

  const openMock = (s) => {
    setActiveId(s.id);
    setMessages(s.messages || []);
  };

  const deleteMock = (id) => {
    saveMockSessions((prev) => prev.filter((x) => x.id !== id));
    if (activeId === id) {
      setActiveId(null);
      setMessages([]);
    }
  };

  const sendHr = async (text, confirm = false) => {
    setTyping(true);
    try {
      const { data } = await chatAPI.send(text, activeId, confirm);
      const sid = data.session_id;
      if (!activeId) setActiveId(sid);
      await loadSessionHr(sid);
      await loadSessionsHr();
      if (data.requires_confirmation) {
        toast('This action needs confirmation — send again with confirm if the UI adds it.', 'warning');
      }
    } catch (e) {
      toast(e.response?.data?.detail || 'Send failed', 'error');
    } finally {
      setTyping(false);
    }
  };

  const sendMock = (text) => {
    const userMsg = { id: `u-${Date.now()}`, role: 'user', content: text, created_at: new Date().toISOString() };
    const botMsg = {
      id: `a-${Date.now()}`,
      role: 'assistant',
      content: mockReply(text),
      created_at: new Date().toISOString(),
    };

    if (!activeId) {
      const id = `m-${Date.now()}`;
      const title = text.slice(0, 40) + (text.length > 40 ? '…' : '');
      const msgs = [userMsg, botMsg];
      const sess = { id, title, messages: msgs, created: new Date().toISOString() };
      saveMockSessions((prev) => [sess, ...prev]);
      setActiveId(id);
      setMessages(msgs);
      return;
    }

    const nextMsgs = [...messages, userMsg, botMsg];
    setMessages(nextMsgs);
    saveMockSessions((prev) =>
      prev.map((s) =>
        s.id === activeId
          ? {
              ...s,
              messages: nextMsgs,
              title: messages.length === 0 ? text.slice(0, 40) + (text.length > 40 ? '…' : '') : s.title,
            }
          : s
      )
    );
  };

  const send = () => {
    const text = input.trim();
    if (!text) return;
    setInput('');
    if (isHrAi) sendHr(text);
    else sendMock(text);
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const newHrChat = () => {
    setActiveId(null);
    setMessages([]);
  };

  const deleteHr = async (sid) => {
    try {
      await chatAPI.deleteSession(sid);
      toast('Session closed', 'success');
      if (activeId === sid) {
        setActiveId(null);
        setMessages([]);
      }
      loadSessionsHr();
    } catch (e) {
      toast(e.response?.data?.detail || 'Delete failed', 'error');
    }
  };

  const suggestions = [
    'Summarize pending leaves',
    'Payroll cost this month',
    'Employees in Computer Science',
    'Onboarding status',
    'Attendance anomalies',
  ];

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 56px)', minHeight: 480, gap: 0 }}>
      <div
        style={{
          width: 240,
          borderRight: '1px solid var(--border)',
          background: 'var(--surface)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ padding: 12, borderBottom: '1px solid var(--border)' }}>
          <Btn size="sm" style={{ width: '100%' }} onClick={isHrAi ? newHrChat : newMockChat}>
            <MessageSquarePlus size={16} /> New chat
          </Btn>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
          {(isHrAi ? sessions : mockSessions).map((s) => (
            <div
              key={s.id}
              style={{
                padding: 10,
                borderRadius: 'var(--radius-sm)',
                marginBottom: 6,
                background: activeId === s.id ? 'var(--accent-light)' : 'var(--surface-2)',
                cursor: 'pointer',
                border: activeId === s.id ? '1px solid var(--accent)' : '1px solid transparent',
              }}
              onClick={() => (isHrAi ? loadSessionHr(s.id) : openMock(s))}
            >
              <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.3 }}>
                {s.title || 'Chat'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                {new Date(s.created_at || s.created).toLocaleDateString('en-IN')}
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  isHrAi ? deleteHr(s.id) : deleteMock(s.id);
                }}
                style={{
                  marginTop: 6,
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  color: 'var(--danger)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 12,
                }}
              >
                <Trash2 size={14} /> Remove
              </button>
            </div>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 24, minWidth: 0 }}>
        <Card style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              background: 'var(--surface-2)',
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: 'var(--accent-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent)',
              }}
            >
              <Bot size={24} />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 18 }}>
                {isHrAi ? 'HR command assistant' : 'Campus assistant (offline)'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {isHrAi ? 'Powered by your /ai/chat API' : 'Local tips — HR gets the live agent'}
              </div>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
            {!messages.length && !typing ? (
              <div style={{ textAlign: 'center', padding: '48px 24px' }}>
                <Sparkles size={48} strokeWidth={1.25} style={{ color: 'var(--terracotta)', marginBottom: 16 }} />
                <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: 8 }}>Ask anything</h2>
                <p style={{ color: 'var(--text-muted)', maxWidth: 400, margin: '0 auto 24px' }}>
                  {isHrAi
                    ? 'Use natural language to query HR data. Examples: pending leaves, headcount, approvals.'
                    : 'Quick suggestions below. Sign in as HR for the full AI assistant tied to your API.'}
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        if (isHrAi) {
                          setInput(s);
                        } else {
                          sendMock(s);
                        }
                      }}
                      style={{
                        padding: '8px 14px',
                        borderRadius: 999,
                        border: '1px solid var(--border)',
                        background: 'var(--surface)',
                        cursor: 'pointer',
                        fontSize: 13,
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {messages.map((m) => (
                  <div
                    key={m.id}
                    style={{
                      alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                      maxWidth: '78%',
                      padding: '12px 16px',
                      borderRadius: 'var(--radius)',
                      background: m.role === 'user' ? 'var(--soil)' : 'var(--surface-2)',
                      color: m.role === 'user' ? 'var(--linen)' : 'var(--text-primary)',
                      fontSize: 14,
                      lineHeight: 1.5,
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {m.content}
                  </div>
                ))}
                {typing && (
                  <div
                    style={{
                      alignSelf: 'flex-start',
                      padding: '12px 20px',
                      background: 'var(--surface-2)',
                      borderRadius: 'var(--radius)',
                      display: 'flex',
                      gap: 6,
                    }}
                  >
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: 'var(--stone)',
                          animation: `fadeIn 0.6s ease ${i * 0.15}s infinite alternate`,
                        }}
                      />
                    ))}
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
            )}
          </div>

          <div style={{ padding: 16, borderTop: '1px solid var(--border)', display: 'flex', gap: 10 }}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Message… Enter to send, Shift+Enter for newline"
              rows={2}
              style={{
                flex: 1,
                resize: 'none',
                padding: '12px 14px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)',
                fontFamily: 'var(--font-body)',
                fontSize: 14,
              }}
            />
            <Btn onClick={send} style={{ alignSelf: 'flex-end' }}>
              Send
            </Btn>
          </div>
        </Card>
      </div>
    </div>
  );
}
