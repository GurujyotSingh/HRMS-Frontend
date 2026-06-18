import React, { useState, useEffect } from 'react';
import { leavesAPI } from '../../services/api';
import { toast, Btn, Textarea, Spinner } from '../ui';
import { Sparkles, ChevronLeft, ChevronRight, CheckCircle, XCircle, User, Calendar, FileText, Info } from 'lucide-react';

export default function LeaveProcessingWizard({ open, leaveRequest, onClose, onSuccess }) {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [showEmpDetails, setShowEmpDetails] = useState(false);
  
  // AI States
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiDraftLoading, setAiDraftLoading] = useState(false);

  // Form States
  const [decision, setDecision] = useState(''); // 'approve' or 'reject'
  const [hrNote, setHrNote] = useState('');

  useEffect(() => {
    if (open && leaveRequest) {
      setStep(1);
      setDecision('');
      setHrNote(leaveRequest.remarks || '');
      setAiAnalysis('');
      setShowEmpDetails(false);
    }
  }, [open, leaveRequest]);

  if (!open || !leaveRequest) return null;

  const STEPS = [
    { num: 1, title: 'Review & Analyze' },
    { num: 2, title: 'Decision & Note' }
  ];

  const handleAiAnalyze = async () => {
    setAiLoading(true);
    setAiAnalysis('');
    try {
      const { data } = await leavesAPI.aiGenerate({ prompt:
        `I am an HR manager reviewing a leave request. \n` +
        `Leave Type: ${leaveRequest.leave_type}\n` +
        `Duration: ${leaveRequest.total_days} days (${new Date(leaveRequest.from_date).toLocaleDateString()} to ${new Date(leaveRequest.to_date).toLocaleDateString()})\n` +
        `Reason provided by employee: "${leaveRequest.reason}"\n\n` +
        `Analyze this request. Highlight if it's standard or if there are any red flags (like understaffing, long duration, policy violations). Keep it to 3-4 sentences. Do NOT use tool calls or <function> tags.`
      });
      const analysis = data?.response || data?.reply || data?.message || '';
      if (analysis) {
        setAiAnalysis(analysis);
        toast('AI analysis complete!', 'success');
      }
    } catch (err) {
      toast('AI assistant unavailable', 'error');
    } finally {
      setAiLoading(false);
    }
  };

  const handleAiDraftDecision = async (selectedDecision) => {
    if (!aiAnalysis) {
      toast('Please run the AI analysis first!', 'warning');
      return;
    }
    setDecision(selectedDecision);
    setAiDraftLoading(true);
    try {
      const { data } = await leavesAPI.aiGenerate({ prompt:
        `Based on this HR analysis: "${aiAnalysis}"\n\n` +
        `As the HR manager, you have decided to ${selectedDecision.toUpperCase()} this leave. ` +
        `Please draft a short, highly professional internal HR note (1-2 sentences) to save in the system. ` +
        `Write strictly in the FIRST PERSON perspective (e.g., "I am approving this because..." or "I am rejecting this due to..."). ` +
        `Do not include greetings. Do NOT use tool calls or <function> tags.`
      });
      const note = data?.response || data?.reply || data?.message || '';
      if (note) {
        setHrNote(note.replace(/^"|"$/g, '').trim());
      }
    } catch (err) {
      toast('AI assistant unavailable', 'error');
    } finally {
      setAiDraftLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!decision) return toast('Please select whether to approve or reject the leave.', 'warning');
    if (!hrNote.trim()) return toast('Please provide an HR note before finalizing.', 'warning');
    
    setSubmitting(true);
    try {
      await leavesAPI.hrProcess(leaveRequest.id, decision);
      await leavesAPI.hrUpdate(leaveRequest.id, { remarks: hrNote });
      toast(`Leave successfully ${decision}d`, 'success');
      onSuccess();
    } catch (e) {
      toast(e.response?.data?.message || `Failed to ${decision} leave`, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const nextStep = () => setStep(2);
  const prevStep = () => setStep(1);

  const empName = `${leaveRequest.employee?.first_name || ''} ${leaveRequest.employee?.last_name || ''}`;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '900px', height: '75vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', animation: 'fadeInScale 0.2s ease-out', overflow: 'hidden' }}>
        
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--gray-200)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: '#0f172a' }}>Leave Request Processing</h2>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--gray-500)' }}>Review and manage employee leave</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: 'var(--gray-400)' }}>&times;</button>
        </div>

        {/* Body Layout */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          
          {/* Left Sidebar - Progress */}
          <div style={{ width: '260px', background: '#f8fafc', borderRight: '1px solid var(--gray-200)', padding: '32px 24px', overflowY: 'auto' }}>
            {STEPS.map((s, i) => {
              const isActive = step === s.num;
              const isPast = step > s.num;
              return (
                <div key={s.num} style={{ display: 'flex', gap: 16, marginBottom: 28, position: 'relative' }}>
                  {i !== STEPS.length - 1 && (
                    <div style={{ position: 'absolute', top: 32, left: 15, bottom: -20, width: 2, background: isPast ? 'var(--primary)' : 'var(--gray-200)', zIndex: 1 }} />
                  )}
                  <div style={{ 
                    width: 32, height: 32, borderRadius: '50%', background: isActive ? 'var(--primary)' : isPast ? 'var(--primary)' : '#fff', border: `2px solid ${isActive || isPast ? 'var(--primary)' : 'var(--gray-300)'}`, color: isActive || isPast ? '#fff' : 'var(--gray-400)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 600, zIndex: 2 
                  }}>
                    {isPast ? <CheckCircle size={16} /> : s.num}
                  </div>
                  <div style={{ paddingTop: 6 }}>
                    <div style={{ fontSize: 14, fontWeight: isActive ? 600 : 500, color: isActive ? 'var(--primary)' : isPast ? '#0f172a' : 'var(--gray-400)' }}>{s.title}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Content Area */}
          <div style={{ flex: 1, padding: '40px', overflowY: 'auto', background: '#fff' }}>
            
            {/* STEP 1: REVIEW & ANALYZE */}
            {step === 1 && (
              <div style={{ animation: 'fadeIn 0.3s' }}>
                <h3 style={{ fontSize: 18, marginBottom: 24, color: '#0f172a' }}>Employee Request</h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
                  <div style={{ background: '#f8fafc', padding: 16, borderRadius: 8, border: '1px solid var(--gray-200)' }}>
                    <div style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--gray-500)', fontWeight: 600, marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      Applicant
                      <button type="button" onClick={() => setShowEmpDetails(!showEmpDetails)} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }} title="View Employee Details">
                        <Info size={14} />
                      </button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <User size={20} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{empName}</div>
                        <div style={{ fontSize: 13, color: 'var(--gray-500)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{leaveRequest.employee?.employment?.department?.name || leaveRequest.employee?.department?.name || 'Department'}</div>
                      </div>
                    </div>
                    
                    {showEmpDetails && (
                      <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--gray-200)', fontSize: 13, color: 'var(--gray-600)', lineHeight: 1.6, animation: 'fadeIn 0.2s' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontWeight: 500 }}>Email:</span>
                          <span>{leaveRequest.employee?.email}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontWeight: 500 }}>Phone:</span>
                          <span>{leaveRequest.employee?.phone || 'N/A'}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontWeight: 500 }}>Role:</span>
                          <span style={{ textTransform: 'capitalize' }}>{(leaveRequest.employee?.role || 'Employee').replace('_', ' ').toLowerCase()}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div style={{ background: '#f8fafc', padding: 16, borderRadius: 8, border: '1px solid var(--gray-200)' }}>
                    <div style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--gray-500)', fontWeight: 600, marginBottom: 12 }}>Duration</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#e0e7ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Calendar size={20} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{leaveRequest.total_days} Days</div>
                        <div style={{ fontSize: 13, color: 'var(--gray-500)' }}>{new Date(leaveRequest.from_date).toLocaleDateString('en-IN')} - {new Date(leaveRequest.to_date).toLocaleDateString('en-IN')}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ background: '#fff', padding: 20, borderRadius: 8, border: '1px solid var(--gray-200)', marginBottom: 24 }}>
                  <div style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--gray-500)', fontWeight: 600, marginBottom: 8 }}>Leave Type & Reason</div>
                  <div style={{ fontWeight: 600, color: '#0f172a', marginBottom: 8, textTransform: 'capitalize' }}>{(leaveRequest.leave_type || '').toLowerCase()} Leave</div>
                  <div style={{ fontSize: 14, color: 'var(--gray-700)', lineHeight: 1.6 }}>{leaveRequest.reason}</div>
                  
                  {leaveRequest.attachment_url && (
                    <div style={{ marginTop: 16, display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--primary)', background: 'var(--primary-light)', padding: '8px 12px', borderRadius: 6 }}>
                      <FileText size={16} />
                      <a href={leaveRequest.attachment_url} target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'none', fontWeight: 500 }}>View Attachment</a>
                    </div>
                  )}
                </div>

                <div style={{ padding: 20, background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: aiAnalysis ? 16 : 0 }}>
                    <strong style={{ color: '#6b21a8', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Sparkles size={16} /> AI Policy & Risk Analysis
                    </strong>
                    {!aiAnalysis && (
                      <Btn type="button" variant="ghost" size="sm" onClick={handleAiAnalyze} disabled={aiLoading} style={{ color: '#7e22ce', background: '#f3e8ff' }}>
                        {aiLoading ? <Spinner size={14} color="#7e22ce" /> : 'Analyze Request'}
                      </Btn>
                    )}
                  </div>
                  
                  {aiAnalysis && (
                    <div style={{ fontSize: 14, color: '#4c1d95', lineHeight: 1.6, animation: 'fadeIn 0.3s' }}>
                      {aiAnalysis}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 2: DECISION */}
            {step === 2 && (
              <div style={{ animation: 'fadeIn 0.3s' }}>
                <h3 style={{ fontSize: 18, marginBottom: 24, color: '#0f172a' }}>HR Decision</h3>
                
                <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
                  <div 
                    onClick={() => {
                      if (!decision) handleAiDraftDecision('approve');
                      else setDecision('approve');
                    }}
                    style={{ flex: 1, padding: 20, borderRadius: 12, border: `2px solid ${decision === 'approve' ? 'var(--success)' : 'var(--gray-200)'}`, background: decision === 'approve' ? '#f0fdf4' : '#fff', cursor: 'pointer', transition: 'all 0.2s ease', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}
                  >
                    <CheckCircle size={32} color={decision === 'approve' ? 'var(--success)' : 'var(--gray-400)'} />
                    <span style={{ fontWeight: 600, color: decision === 'approve' ? 'var(--success)' : '#0f172a' }}>Approve Leave</span>
                  </div>
                  
                  <div 
                    onClick={() => {
                      if (!decision) handleAiDraftDecision('reject');
                      else setDecision('reject');
                    }}
                    style={{ flex: 1, padding: 20, borderRadius: 12, border: `2px solid ${decision === 'reject' ? 'var(--danger)' : 'var(--gray-200)'}`, background: decision === 'reject' ? '#fef2f2' : '#fff', cursor: 'pointer', transition: 'all 0.2s ease', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}
                  >
                    <XCircle size={32} color={decision === 'reject' ? 'var(--danger)' : 'var(--gray-400)'} />
                    <span style={{ fontWeight: 600, color: decision === 'reject' ? 'var(--danger)' : '#0f172a' }}>Reject Leave</span>
                  </div>
                </div>

                <div style={{ position: 'relative' }}>
                  {aiDraftLoading && (
                    <div style={{ position: 'absolute', inset: 0, zIndex: 10, background: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8 }}>
                      <Spinner size={24} color="var(--primary)" />
                    </div>
                  )}
                  <Textarea 
                    label="HR Notes (Internal)"
                    value={hrNote} 
                    onChange={(e) => setHrNote(e.target.value)} 
                    placeholder={decision ? "Review the AI drafted note or write your own..." : "Select a decision above to draft a note..."}
                    rows={4}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{ padding: '20px 24px', borderTop: '1px solid var(--gray-200)', display: 'flex', justifyContent: 'space-between', background: '#fff' }}>
          <Btn variant="secondary" onClick={step === 1 ? onClose : prevStep} style={{ width: 100 }}>
            {step === 1 ? 'Cancel' : 'Back'}
          </Btn>
          
          {step === 1 ? (
            <Btn variant="primary" onClick={nextStep} style={{ width: 140 }}>
              Decision <ChevronRight size={16} />
            </Btn>
          ) : (
            <Btn variant="primary" onClick={handleSubmit} loading={submitting} disabled={!decision || !hrNote.trim()}>
              Confirm Decision
            </Btn>
          )}
        </div>
      </div>
    </div>
  );
}
