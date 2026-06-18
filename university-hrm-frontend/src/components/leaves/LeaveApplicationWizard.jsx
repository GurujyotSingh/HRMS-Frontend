import React, { useState, useEffect } from 'react';
import { leavesAPI, aiAPI } from '../../services/api';
import { toast, Btn, Input, Select, Textarea, Spinner } from '../ui';
import { Calendar, CheckCircle, ChevronLeft, ChevronRight, FileText, Info, Sparkles, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const LEAVE_TYPES = [
  { value: 'ANNUAL',       label: 'Annual Leave' },
  { value: 'SICK',         label: 'Sick Leave' },
  { value: 'CASUAL',       label: 'Casual Leave' },
  { value: 'MATERNITY',    label: 'Maternity Leave' },
  { value: 'PATERNITY',    label: 'Paternity Leave' },
  { value: 'UNPAID',       label: 'Unpaid Leave' },
  { value: 'COMPENSATORY', label: 'Compensatory Off' },
  { value: 'SABBATICAL',   label: 'Sabbatical' },
  { value: 'EXAM_DUTY',    label: 'Exam Duty' },
];

export default function LeaveApplicationWizard({ open, onClose, onSuccess, balances }) {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  
  // AI States
  const [aiLoading, setAiLoading] = useState(false);
  const [aiText, setAiText] = useState('');
  const [refiningReason, setRefiningReason] = useState(false);

  const [form, setForm] = useState({
    leave_type: 'CASUAL',
    from_date: '',
    to_date: '',
    reason: '',
    attachment_url: ''
  });

  useEffect(() => {
    if (open) {
      setStep(1);
      setForm({
        leave_type: 'CASUAL',
        from_date: '',
        to_date: '',
        reason: '',
        attachment_url: ''
      });
      setAiText('');
    }
  }, [open]);

  // Calculate days difference
  const getDaysDiff = () => {
    if (!form.from_date || !form.to_date) return 0;
    const from = new Date(form.from_date);
    const to = new Date(form.to_date);
    if (to < from) return 0;
    const diffTime = Math.abs(to - from);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const totalDays = getDaysDiff();

  const validateStep = () => {
    if (step === 1) {
      if (!form.leave_type) return toast('Please select a leave type.', 'warning');
      if (!form.from_date) return toast('Please select a starting date.', 'warning');
      if (!form.to_date) return toast('Please select an ending date.', 'warning');
      
      const from = new Date(form.from_date);
      const to = new Date(form.to_date);
      if (to < from) return toast('The ending date cannot be before the starting date.', 'warning');
      if (totalDays === 0) return toast('Invalid date range selected.', 'warning');
      
      return true;
    }
    if (step === 2) {
      if (!form.reason.trim()) return toast('Please provide a reason for your leave.', 'warning');
      if (form.reason.trim().length < 10) return toast('Please provide a slightly more detailed reason.', 'warning');
      return true;
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep()) setStep(s => s + 1);
  };

  const prevStep = () => setStep(s => s - 1);

  // --- AI Integrations ---

  const handleAiRecommend = async () => {
    if (!form.from_date || !form.to_date) {
      toast('Please select your dates first.', 'warning');
      return;
    }
    setAiLoading(true);
    setAiText('');
    try {
      const { data } = await aiAPI.chat(
        `I'm planning leave from ${form.from_date} to ${form.to_date} (${form.leave_type}). ` +
        `Is this a good time? Are there any holidays nearby I should know about? Keep response to 2 sentences.`
      );
      setAiText(data?.response || data?.reply || data?.message || '');
    } catch {
      toast('AI assistant unavailable at the moment.', 'error');
    } finally {
      setAiLoading(false);
    }
  };

  const handleAiRefineReason = async () => {
    if (!form.reason.trim()) {
      toast('Please type a rough draft of your reason first.', 'warning');
      return;
    }
    setRefiningReason(true);
    try {
      const { data } = await aiAPI.chat(
        `I am applying for a ${form.leave_type} leave from ${form.from_date || 'TBD'} to ${form.to_date || 'TBD'}. ` +
        `My rough reason is: "${form.reason}". ` +
        `Please rewrite this into a single, highly professional, polite, and concise paragraph suitable for a formal HR leave application. Do not include greetings or sign-offs, just the reason itself.`
      );
      const refined = data?.response || data?.reply || data?.message || '';
      if (refined) {
        setForm(prev => ({ ...prev, reason: refined.replace(/^"|"$/g, '').trim() }));
        toast('Reason redefined successfully!', 'success');
      } else {
        toast('AI returned an empty response', 'warning');
      }
    } catch (err) {
      toast('AI assistant unavailable', 'error');
    } finally {
      setRefiningReason(false);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setSubmitting(true);
    try {
      await leavesAPI.apply({
        leave_type: form.leave_type,
        from_date: new Date(form.from_date).toISOString(),
        to_date: new Date(form.to_date).toISOString(),
        total_days: totalDays,
        reason: form.reason,
        attachment_url: form.attachment_url || null
      });
      toast('Leave application submitted successfully!', 'success');
      onSuccess();
    } catch (e) {
      toast(e.response?.data?.message || 'Failed to submit leave application', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  const STEPS = [
    { num: 1, title: 'Leave Details' },
    { num: 2, title: 'Reason & Documents' },
    { num: 3, title: 'Review & Submit' }
  ];

  // Look up remaining balance if available
  let remainingBal = null;
  let totalBal = null;
  if (balances && Array.isArray(balances)) {
    const balObj = balances.find(b => (b.leave_type || '').toUpperCase() === form.leave_type);
    if (balObj) {
      remainingBal = balObj.total_days - balObj.used_days;
      totalBal = balObj.total_days;
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '900px', height: '75vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', animation: 'fadeInScale 0.2s ease-out', overflow: 'hidden' }}>
        
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--gray-200)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: '#0f172a' }}>Apply for Leave</h2>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--gray-500)' }}>Standardized leave application process</p>
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

            {/* Quick Stats sidebar widget */}
            {step > 1 && remainingBal !== null && (
              <div style={{ marginTop: 40, padding: 16, background: '#fff', borderRadius: 12, border: '1px solid var(--gray-200)', animation: 'fadeIn 0.3s' }}>
                <div style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--gray-500)', letterSpacing: '0.05em', marginBottom: 8, fontWeight: 600 }}>Balance</div>
                <div style={{ fontSize: 13, color: '#0f172a' }}>
                  You have <strong style={{ color: remainingBal < totalDays ? 'var(--danger)' : 'var(--primary)', fontSize: 15 }}>{remainingBal}</strong> out of {totalBal} days left for {form.leave_type.replace('_', ' ').toLowerCase()}.
                </div>
              </div>
            )}
          </div>

          {/* Right Content Area */}
          <div style={{ flex: 1, padding: '40px', overflowY: 'auto', background: '#fff' }}>
            
            {/* STEP 1: DETAILS */}
            {step === 1 && (
              <div style={{ animation: 'fadeIn 0.3s', maxWidth: 500 }}>
                <h3 style={{ fontSize: 18, marginBottom: 24, color: '#0f172a' }}>Leave Details</h3>
                
                <Select 
                  label="Leave Type" 
                  value={form.leave_type} 
                  onChange={e => setForm({...form, leave_type: e.target.value})}
                  required
                >
                  {LEAVE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </Select>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <Input 
                    label="From Date" 
                    type="date" 
                    value={form.from_date} 
                    onChange={e => setForm({...form, from_date: e.target.value})} 
                    required 
                  />
                  <Input 
                    label="To Date" 
                    type="date" 
                    value={form.to_date} 
                    onChange={e => setForm({...form, to_date: e.target.value})} 
                    required 
                    min={form.from_date}
                  />
                </div>

                {totalDays > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '12px 16px', borderRadius: 8, border: '1px solid var(--gray-200)', marginTop: 8 }}>
                    <span style={{ fontSize: 14, color: 'var(--gray-600)' }}>Total Duration:</span>
                    <span style={{ fontSize: 16, fontWeight: 600, color: '#0f172a' }}>{totalDays} {totalDays === 1 ? 'Day' : 'Days'}</span>
                  </div>
                )}

                <div style={{ marginTop: 24, padding: 20, background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: aiText ? 12 : 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#7e22ce' }}>
                      <Calendar size={18} />
                      <span style={{ fontSize: 14, fontWeight: 500 }}>Smart Schedule Check</span>
                    </div>
                    <Btn type="button" variant="ghost" size="sm" onClick={handleAiRecommend} disabled={aiLoading} style={{ color: '#7e22ce', background: '#f3e8ff' }}>
                      {aiLoading ? <Spinner size={14} color="#7e22ce" /> : <Sparkles size={14} />}
                      {aiLoading ? 'Checking...' : 'Check Dates'}
                    </Btn>
                  </div>
                  
                  {aiText && (
                    <div style={{ fontSize: 13, color: '#6b21a8', lineHeight: 1.5, animation: 'fadeIn 0.3s' }}>
                      {aiText}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 2: REASON */}
            {step === 2 && (
              <div style={{ animation: 'fadeIn 0.3s', maxWidth: 600 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                  <h3 style={{ fontSize: 18, color: '#0f172a', margin: 0 }}>Reason & Documentation</h3>
                  <button 
                    type="button"
                    onClick={handleAiRefineReason}
                    disabled={refiningReason}
                    style={{ 
                      display: 'flex', alignItems: 'center', gap: 6, 
                      background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', 
                      color: '#fff', border: 'none', padding: '8px 16px', 
                      borderRadius: 20, fontSize: 13, fontWeight: 600, 
                      cursor: refiningReason ? 'not-allowed' : 'pointer',
                      opacity: refiningReason ? 0.8 : 1,
                      boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {refiningReason ? <Spinner size={14} color="#fff" /> : <Sparkles size={14} />}
                    {refiningReason ? 'Drafting...' : 'Ask AI to Rewrite'}
                  </button>
                </div>
                
                <Textarea 
                  label="Explanation for Leave" 
                  value={form.reason} 
                  onChange={e => setForm({...form, reason: e.target.value})} 
                  required 
                  rows={6}
                  placeholder="Draft your reason here. If you'd like, the AI can rewrite it to be more professional."
                />

                <div style={{ marginTop: 24 }}>
                  <Input 
                    label="Attachment URL (Optional)" 
                    value={form.attachment_url}
                    onChange={e => setForm({...form, attachment_url: e.target.value})}
                    placeholder="https://drive.google.com/..."
                    helperText="Provide a link to any supporting documents (e.g., medical certificates for sick leave)."
                  />
                </div>
                
                {form.leave_type === 'SICK' && totalDays > 2 && !form.attachment_url && (
                  <div style={{ marginTop: 16, padding: 12, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, display: 'flex', gap: 10, color: '#b45309' }}>
                    <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
                    <div style={{ fontSize: 13 }}>
                      <strong>Note:</strong> Sick leaves exceeding 2 days typically require a medical certificate per university policy.
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 3: REVIEW */}
            {step === 3 && (
              <div style={{ animation: 'fadeIn 0.3s' }}>
                <h3 style={{ fontSize: 18, marginBottom: 24, color: '#0f172a' }}>Review & Submit</h3>
                
                <div style={{ background: '#f8fafc', borderRadius: 12, border: '1px solid var(--gray-200)', padding: 24, marginBottom: 24 }}>
                  <h4 style={{ fontSize: 14, textTransform: 'uppercase', color: 'var(--gray-500)', letterSpacing: '0.05em', marginBottom: 12, borderBottom: '1px solid var(--gray-200)', paddingBottom: 8 }}>Leave Summary</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '8px 16px', fontSize: 14, marginBottom: 24 }}>
                    <span style={{ color: 'var(--gray-500)' }}>Type:</span> 
                    <span style={{ fontWeight: 600, color: '#0f172a' }}>{LEAVE_TYPES.find(t => t.value === form.leave_type)?.label}</span>
                    
                    <span style={{ color: 'var(--gray-500)' }}>Dates:</span> 
                    <span style={{ fontWeight: 500 }}>{new Date(form.from_date).toLocaleDateString('en-IN')} to {new Date(form.to_date).toLocaleDateString('en-IN')}</span>
                    
                    <span style={{ color: 'var(--gray-500)' }}>Duration:</span> 
                    <span style={{ fontWeight: 600 }}>{totalDays} {totalDays === 1 ? 'Day' : 'Days'}</span>

                    {remainingBal !== null && (
                      <>
                        <span style={{ color: 'var(--gray-500)' }}>Balance Impact:</span> 
                        <span style={{ fontWeight: 500, color: remainingBal < totalDays ? 'var(--danger)' : 'var(--success)' }}>
                          {remainingBal} days available → {remainingBal - totalDays} days remaining
                        </span>
                      </>
                    )}
                  </div>

                  <h4 style={{ fontSize: 14, textTransform: 'uppercase', color: 'var(--gray-500)', letterSpacing: '0.05em', marginBottom: 12, borderBottom: '1px solid var(--gray-200)', paddingBottom: 8 }}>Reason & Documents</h4>
                  <div style={{ fontSize: 14, color: '#0f172a', lineHeight: 1.6, marginBottom: 16 }}>
                    {form.reason}
                  </div>
                  
                  {form.attachment_url && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--primary)', background: 'var(--primary-light)', padding: '8px 12px', borderRadius: 6, display: 'inline-flex' }}>
                      <FileText size={16} />
                      <a href={form.attachment_url} target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'none', fontWeight: 500 }}>View Attachment</a>
                    </div>
                  )}
                </div>

                {remainingBal !== null && remainingBal < totalDays && (
                  <div style={{ padding: 16, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, display: 'flex', gap: 12, color: '#b91c1c', marginBottom: 24 }}>
                    <AlertCircle size={20} style={{ flexShrink: 0 }} />
                    <div style={{ fontSize: 14 }}>
                      <strong>Insufficient Balance Warning:</strong> You are requesting {totalDays} days but only have {remainingBal} days available. This request may be automatically flagged or require UNPAID leave conversion upon approval.
                    </div>
                  </div>
                )}
                
                <div style={{ padding: 16, background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: 8, display: 'flex', gap: 12, color: 'var(--success)' }}>
                  <Info size={20} />
                  <div style={{ fontSize: 14 }}>By submitting, your leave request will be routed to your Department Head for approval.</div>
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
          
          {step < 3 ? (
            <Btn variant="primary" onClick={nextStep} style={{ width: 140 }}>
              Continue <ChevronRight size={16} />
            </Btn>
          ) : (
            <Btn variant="primary" onClick={handleSubmit} loading={submitting} style={{ width: 160 }} disabled={remainingBal !== null && remainingBal < totalDays}>
              Submit Request
            </Btn>
          )}
        </div>
      </div>
    </div>
  );
}
