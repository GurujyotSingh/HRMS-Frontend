import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, User, Users, Search, FileText, BrainCircuit, X, MessageSquare, Clock, AlertCircle, Sparkles, MoreVertical } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Card, Btn, Badge, toast } from '../components/ui';

const unwrap = (promise) => promise.then(res => res.data);

const STAGES = ['APPLIED', 'SCREENING', 'INTERVIEW', 'OFFERED', 'HIRED', 'REJECTED'];

const recruitmentAPI = {
  getApplicants: (jobId) => unwrap(api.get(`/recruitment/jobs/${jobId}/applicants`)),
  updateApplicant: (id, data) => unwrap(api.patch(`/recruitment/applicants/${id}`, data)),
  reopenApplicant: (id, reason) => unwrap(api.post(`/recruitment/applicants/${id}/reopen`, null, { params: { reason } })),
  analyzeResume: (id) => unwrap(api.post(`/recruitment/applicants/${id}/analyze`)),
  generateQuestions: (id) => unwrap(api.post(`/recruitment/applicants/${id}/interview-questions`))
};

const BACKEND_BASE_URL = process.env.REACT_APP_API_URL ? process.env.REACT_APP_API_URL.replace('/api/v1', '') : `http://${window.location.hostname}:8000`;

export default function RecruitmentPipeline({ job, onClose }) {
  const { user } = useAuth();
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);

  // Drawer state
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // AI State
  const [aiLoading, setAiLoading] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [showAiDetails, setShowAiDetails] = useState(false);
  const [activeTab, setActiveTab] = useState('details'); // 'details', 'ai', 'timeline'
  
  const boardRef = useRef(null);

  useEffect(() => {
    loadApplicants();
  }, [job.id]);

  const loadApplicants = async () => {
    setLoading(true);
    try {
      const data = await recruitmentAPI.getApplicants(job.id);
      const items = Array.isArray(data) ? data : (data?.items || data?.data?.items || []);
      setApplicants(items);
    } catch (err) {
      toast('Failed to load applicants.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (e, applicantId) => {
    e.dataTransfer.setData('applicantId', applicantId);
  };

  const handleDragOver = (e) => {
    e.preventDefault(); // allow drop
  };

  const handleBoardDragOver = (e) => {
    e.preventDefault();
    if (!boardRef.current) return;
    
    const SCROLL_SPEED = 20;
    const EDGE_THRESHOLD = 150;
    const rect = boardRef.current.getBoundingClientRect();
    
    if (e.clientX - rect.left < EDGE_THRESHOLD) {
      boardRef.current.scrollLeft -= SCROLL_SPEED;
    } else if (rect.right - e.clientX < EDGE_THRESHOLD) {
      boardRef.current.scrollLeft += SCROLL_SPEED;
    }
  };

  const handleDrop = async (e, targetStage) => {
    e.preventDefault();
    const applicantId = e.dataTransfer.getData('applicantId');
    if (!applicantId) return;

    const applicant = applicants.find(a => a.id === applicantId);
    if (!applicant || applicant.status === targetStage) return;

    // Optimistic UI update
    setApplicants(prev => prev.map(a => a.id === applicantId ? { ...a, status: targetStage } : a));

    try {
      await recruitmentAPI.updateApplicant(applicantId, { status: targetStage, send_email: true });
      toast(`Moved to ${targetStage}`, 'success');
      loadApplicants(); // Refresh to get timeline history
    } catch (err) {
      // Revert on error
      toast(err.response?.data?.detail || 'Invalid stage transition.', 'error');
      loadApplicants();
    }
  };

  const grouped = STAGES.reduce((acc, stage) => {
    acc[stage] = applicants.filter(a => {
      const normalizedStatus = (a.status || 'APPLIED').toUpperCase();
      return normalizedStatus === stage;
    });
    return acc;
  }, {});

  const openDrawer = (applicant) => {
    setSelectedCandidate(applicant);
    setDrawerOpen(true);
    setQuestions([]);
  };

  const handleAnalyze = async () => {
    if (!selectedCandidate) return;
    setAiLoading(true);
    try {
      const updated = await recruitmentAPI.analyzeResume(selectedCandidate.id);
      setSelectedCandidate(updated);
      setApplicants(prev => prev.map(a => a.id === updated.id ? updated : a));
      toast('AI Analysis Complete!', 'success');
    } catch (err) {
      toast(err.response?.data?.detail || 'Analysis failed.', 'error');
    } finally {
      setAiLoading(false);
    }
  };

  const handleGenerateQuestions = async () => {
    if (!selectedCandidate) return;
    setAiLoading(true);
    try {
      const data = await recruitmentAPI.generateQuestions(selectedCandidate.id);
      setQuestions(data.questions || []);
      toast('Questions Generated!', 'success');
    } catch (err) {
      toast(err.response?.data?.detail || 'Generation failed.', 'error');
    } finally {
      setAiLoading(false);
    }
  };

  const handleReopen = async () => {
    const reason = window.prompt("Reason for reopening application:");
    if (!reason) return;
    try {
      const updated = await recruitmentAPI.reopenApplicant(selectedCandidate.id, reason);
      setSelectedCandidate(updated);
      setApplicants(prev => prev.map(a => a.id === updated.id ? updated : a));
      toast('Application reopened.', 'success');
    } catch (err) {
      toast('Failed to reopen.', 'error');
    }
  };

  // Helper for generating an avatar color
  const getAvatarColor = (name) => {
    const colors = ['#f43f5e', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ec4899'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div style={{ padding: 24, maxWidth: 1600, margin: '0 auto', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)', background: '#f9fafb' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 32, background: 'var(--white)', padding: '20px 24px', borderRadius: 16, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.05)' }}>
        <button onClick={onClose} style={{ background: 'var(--gray-100)', border: 'none', width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: '0.2s' }}>
          <ArrowLeft size={18} color="var(--gray-700)" />
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: 'var(--text-dark)', letterSpacing: '-0.02em' }}>{job.title} Pipeline</h1>
          <p style={{ margin: '4px 0 0 0', color: 'var(--gray-500)', fontSize: 14 }}>Manage applicants through a strict forward-only workflow. Drag and drop to advance.</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ padding: '8px 16px', background: 'var(--indigo-50)', color: 'var(--indigo-600)', borderRadius: 20, fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={16} />
            {applicants.length} Total Candidates
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div 
        ref={boardRef}
        onDragOver={handleBoardDragOver}
        style={{ display: 'flex', gap: 20, overflowX: 'auto', flex: 1, paddingBottom: 24 }}
      >
        {STAGES.map(stage => (
          <div
            key={stage}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, stage)}
            style={{
              minWidth: 320, width: 320, background: 'rgba(243, 244, 246, 0.6)', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column',
              border: '1px solid rgba(229, 231, 235, 0.8)', backdropFilter: 'blur(8px)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 12, borderBottom: '2px solid rgba(229, 231, 235, 0.6)' }}>
              <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--gray-600)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stage}</h3>
              <div style={{ background: 'var(--white)', padding: '2px 8px', borderRadius: 12, fontSize: 12, fontWeight: 700, color: 'var(--gray-700)', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                {grouped[stage].length}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1, overflowY: 'auto', paddingRight: 4 }}>
              {grouped[stage].map(app => (
                <div
                  key={app.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, app.id)}
                  onClick={() => openDrawer(app)}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'none'}
                  style={{
                    background: 'var(--white)', padding: 16, borderRadius: 10, border: '1px solid rgba(0,0,0,0.04)',
                    cursor: 'grab', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)',
                    display: 'flex', flexDirection: 'column', gap: 12, transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                >
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: getAvatarColor(app.name), color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 600 }}>
                      {app.name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-dark)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{app.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>Applied {new Date(app.applied_at).toLocaleDateString()}</div>
                    </div>
                  </div>

                  {app.ai_analysis && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'linear-gradient(to right, #fdf4ff, #faf5ff)', padding: '6px 10px', borderRadius: 6, border: '1px solid #fae8ff' }}>
                      <Sparkles size={14} color="#d946ef" />
                      <span style={{ fontSize: 12, color: '#a21caf', fontWeight: 600 }}>Match Score: {app.ai_analysis.match_score}%</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Candidate Drawer Overlay */}
      {drawerOpen && selectedCandidate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', justifyContent: 'flex-end', transition: 'all 0.3s' }}>
          <div style={{ width: '100%', maxWidth: 800, background: 'var(--light-bg)', height: '100%', boxShadow: '-8px 0 30px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', animation: 'slideIn 0.3s ease-out' }}>

            <div style={{ background: 'linear-gradient(135deg, #1e1b4b, #4338ca)', padding: '32px 24px', color: 'white', position: 'relative' }}>
              <button onClick={() => setDrawerOpen(false)} style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.2)', border: 'none', width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: '0.2s', color: 'white' }}>
                <X size={18} />
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, border: '2px solid rgba(255,255,255,0.4)' }}>
                  {selectedCandidate.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>{selectedCandidate.name}</h2>
                  <p style={{ margin: '4px 0 0 0', color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>{selectedCandidate.email} • {selectedCandidate.phone || 'No phone provided'}</p>
                </div>
              </div>
            </div>

            <div style={{ background: 'white', padding: '0 24px', borderBottom: '1px solid var(--gray-200)', display: 'flex', gap: 24 }}>
              <button 
                onClick={() => setActiveTab('details')} 
                style={{ padding: '16px 0', background: 'none', border: 'none', borderBottom: `2px solid ${activeTab === 'details' ? 'var(--primary)' : 'transparent'}`, color: activeTab === 'details' ? 'var(--primary)' : 'var(--gray-500)', fontWeight: 600, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, transition: '0.2s' }}
              >
                <FileText size={16} /> Details & Resume
              </button>
              <button 
                onClick={() => setActiveTab('ai')} 
                style={{ padding: '16px 0', background: 'none', border: 'none', borderBottom: `2px solid ${activeTab === 'ai' ? '#c026d3' : 'transparent'}`, color: activeTab === 'ai' ? '#c026d3' : 'var(--gray-500)', fontWeight: 600, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, transition: '0.2s' }}
              >
                <Sparkles size={16} /> AI Analysis
              </button>
              <button 
                onClick={() => setActiveTab('timeline')} 
                style={{ padding: '16px 0', background: 'none', border: 'none', borderBottom: `2px solid ${activeTab === 'timeline' ? 'var(--secondary)' : 'transparent'}`, color: activeTab === 'timeline' ? 'var(--secondary)' : 'var(--gray-500)', fontWeight: 600, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, transition: '0.2s' }}
              >
                <Clock size={16} /> Timeline
              </button>
            </div>

            <div style={{ padding: 24, flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 24 }}>



              {/* TAB CONTENT: DETAILS & RESUME */}
              {activeTab === 'details' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24, height: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                    {selectedCandidate.status === 'REJECTED' && (
                      <Btn variant="danger" onClick={handleReopen}>Reopen Application</Btn>
                    )}
                  </div>
                  <div style={{ background: 'white', padding: 20, borderRadius: 12, border: '1px solid var(--gray-200)' }}>
                    <h3 style={{ margin: '0 0 16px 0', fontSize: 16, color: 'var(--text-dark)' }}>Candidate Information</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <div>
                        <div style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 4 }}>Applied Position</div>
                        <div style={{ fontSize: 14, fontWeight: 500 }}>{job.title}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 4 }}>Application Date</div>
                        <div style={{ fontSize: 14, fontWeight: 500 }}>{new Date(selectedCandidate.applied_at).toLocaleString()}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 4 }}>Current Stage</div>
                        <Badge variant="neutral">{selectedCandidate.status}</Badge>
                      </div>
                      {selectedCandidate.notes && (
                        <div style={{ gridColumn: '1 / -1' }}>
                          <div style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 4 }}>HR Notes</div>
                          <div style={{ fontSize: 14, color: 'var(--gray-700)', background: 'var(--gray-50)', padding: 12, borderRadius: 8 }}>{selectedCandidate.notes}</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {selectedCandidate.resume_url ? (
                    <div style={{ flex: 1, minHeight: 400, background: 'white', borderRadius: 12, border: '1px solid var(--gray-200)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                      <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--gray-200)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--gray-50)' }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--gray-700)' }}>Resume Preview</span>
                        <Btn variant="outline" size="sm" onClick={() => window.open(selectedCandidate.resume_url.startsWith('http') ? selectedCandidate.resume_url : `${BACKEND_BASE_URL}${selectedCandidate.resume_url}`, '_blank')}><FileText size={14} /> Open Fullscreen</Btn>
                      </div>
                      <iframe 
                        src={selectedCandidate.resume_url.startsWith('http') ? selectedCandidate.resume_url : `${BACKEND_BASE_URL}${selectedCandidate.resume_url}`} 
                        style={{ width: '100%', height: '100%', border: 'none', minHeight: 600 }}
                        title="Resume Preview"
                      />
                    </div>
                  ) : (
                    <div style={{ padding: 40, textAlign: 'center', background: 'white', borderRadius: 12, border: '1px dashed var(--gray-300)' }}>
                      <FileText size={48} color="var(--gray-300)" style={{ margin: '0 auto 16px' }} />
                      <p style={{ margin: 0, color: 'var(--gray-500)' }}>No resume provided.</p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB CONTENT: AI ANALYSIS */}
              {activeTab === 'ai' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <Btn variant="primary" onClick={handleAnalyze} disabled={aiLoading || !selectedCandidate.resume_url} style={{ background: '#9333ea', borderColor: '#9333ea' }}>
                      <BrainCircuit size={16} /> {aiLoading ? 'Analyzing...' : 'AI Analyze Resume'}
                    </Btn>
                    <Btn variant="secondary" onClick={handleGenerateQuestions} disabled={aiLoading || !selectedCandidate.resume_url}>
                      <MessageSquare size={16} /> Gen Interview Qs
                    </Btn>
                  </div>
                  {selectedCandidate.ai_analysis ? (
                    <div style={{ background: 'linear-gradient(to bottom right, #fdf4ff, #faf5ff)', borderRadius: 12, border: '1px solid #f5d0fe', padding: 24, position: 'relative', overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', top: -20, right: -20, opacity: 0.1 }}>
                        <Sparkles size={120} color="#c026d3" />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                        <div style={{ background: '#f0abfc', padding: 6, borderRadius: 8 }}>
                          <BrainCircuit size={20} color="#701a75" />
                        </div>
                        <h3 style={{ margin: 0, color: '#701a75', fontSize: 18, fontWeight: 700 }}>AI Match Analysis</h3>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
                        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                          <div style={{ flex: '1 1 120px', background: 'white', padding: 16, borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #fae8ff' }}>
                            <div style={{ fontSize: 12, color: '#c026d3', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Match Score</div>
                            <div style={{ fontSize: 32, fontWeight: 800, color: '#701a75', marginTop: 4 }}>{selectedCandidate.ai_analysis.match_score}%</div>
                          </div>
                          <div style={{ flex: '2 1 200px', background: 'white', padding: 16, borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #fae8ff' }}>
                            <div style={{ fontSize: 12, color: '#c026d3', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recommendation</div>
                            <div style={{ fontSize: 16, fontWeight: 600, color: '#701a75', marginTop: 4, lineHeight: 1.4 }}>{selectedCandidate.ai_analysis.recommendation}</div>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        {(selectedCandidate.ai_analysis.strengths?.length > 0 || selectedCandidate.ai_analysis.missing_skills?.length > 0 || selectedCandidate.ai_analysis.experience_assessment) && (
                          <Btn variant="ghost" size="sm" onClick={() => setShowAiDetails(!showAiDetails)} style={{ color: '#c026d3', padding: 0 }}>
                            {showAiDetails ? 'Hide Detailed Analysis' : 'View Detailed Analysis'}
                          </Btn>
                        )}
                      </div>

                      {showAiDetails && (
                        <div style={{ marginTop: 16, borderTop: '1px solid #fae8ff', paddingTop: 20 }}>
                          {(selectedCandidate.ai_analysis.strengths?.length > 0 || selectedCandidate.ai_analysis.missing_skills?.length > 0) && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 24, marginBottom: 20 }}>
                              {selectedCandidate.ai_analysis.strengths?.length > 0 && (
                                <div>
                                  <div style={{ fontSize: 13, color: '#86198f', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }}></div> Strengths
                                  </div>
                                  <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {selectedCandidate.ai_analysis.strengths.map((s, i) => (
                                      <li key={i} style={{ fontSize: 14, color: '#4a044e', display: 'flex', gap: 8, alignItems: 'flex-start', lineHeight: 1.4 }}><span style={{ color: '#22c55e', marginTop: 2 }}>✓</span> <span style={{ flex: 1 }}>{s}</span></li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              
                              {selectedCandidate.ai_analysis.missing_skills?.length > 0 && (
                                <div>
                                  <div style={{ fontSize: 13, color: '#86198f', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444' }}></div> Missing Skills
                                  </div>
                                  <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {selectedCandidate.ai_analysis.missing_skills.map((s, i) => (
                                      <li key={i} style={{ fontSize: 14, color: '#4a044e', display: 'flex', gap: 8, alignItems: 'flex-start', lineHeight: 1.4 }}><span style={{ color: '#ef4444', marginTop: 2 }}>✗</span> <span style={{ flex: 1 }}>{s}</span></li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          )}

                          {selectedCandidate.ai_analysis.experience_assessment && (
                            <div style={{ background: 'white', padding: 16, borderRadius: 8, border: '1px solid #fae8ff' }}>
                              <div style={{ fontSize: 12, color: '#c026d3', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>Experience Assessment</div>
                              <p style={{ margin: 0, fontSize: 14, color: '#4a044e', lineHeight: 1.5 }}>{selectedCandidate.ai_analysis.experience_assessment}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ padding: 40, textAlign: 'center', background: 'white', borderRadius: 12, border: '1px dashed var(--gray-300)' }}>
                      <BrainCircuit size={48} color="var(--gray-300)" style={{ margin: '0 auto 16px' }} />
                      <h3 style={{ margin: '0 0 8px 0', color: 'var(--gray-700)' }}>No AI Analysis yet</h3>
                      <p style={{ margin: 0, color: 'var(--gray-500)', fontSize: 14 }}>Click "AI Analyze Resume" to generate match scores and recommendations.</p>
                    </div>
                  )}

                  {questions.length > 0 && (
                    <div style={{ background: '#f0f9ff', borderRadius: 12, border: '1px solid #bae6fd', padding: 24 }}>
                      <h3 style={{ margin: '0 0 16px 0', color: '#0369a1', fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <MessageSquare size={18} /> Generated Interview Questions
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {questions.map((q, i) => (
                          <div key={i} style={{ background: 'white', padding: 12, borderRadius: 8, border: '1px solid #e0f2fe', fontSize: 14, color: '#0c4a6e', display: 'flex', gap: 12 }}>
                            <span style={{ color: '#0ea5e9', fontWeight: 700 }}>Q{i + 1}.</span>
                            <span style={{ flex: 1 }}>{q}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB CONTENT: TIMELINE */}
              {activeTab === 'timeline' && (
                <div style={{ background: 'white', padding: 24, borderRadius: 12, border: '1px solid var(--gray-200)' }}>
                  <h3 style={{ margin: '0 0 24px 0', fontSize: 16, color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Clock size={16} /> Candidate Timeline
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                    {selectedCandidate.history?.map((entry, index) => (
                      <div key={entry.id} style={{ display: 'flex', gap: 16 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--primary)', zIndex: 2 }} />
                          {index !== selectedCandidate.history.length - 1 && (
                            <div style={{ width: 2, flex: 1, background: 'var(--gray-200)', margin: '4px 0' }} />
                          )}
                        </div>
                        <div style={{ paddingBottom: 24, flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--gray-800)' }}>
                            {entry.action === 'STATUS_CHANGE' ? `Moved to ${entry.new_status}` : entry.action}
                          </div>
                          <div style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: 2 }}>
                            {new Date(entry.changed_at).toLocaleString()}
                          </div>
                          {entry.notes && (
                            <div style={{ marginTop: 8, fontSize: 14, color: 'var(--gray-700)', background: 'var(--gray-50)', padding: 12, borderRadius: 8, border: '1px solid var(--gray-200)' }}>
                              {entry.notes}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {(!selectedCandidate.history || selectedCandidate.history.length === 0) && (
                      <p style={{ margin: 0, color: 'var(--gray-500)', fontSize: 14 }}>No timeline history available.</p>
                    )}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
