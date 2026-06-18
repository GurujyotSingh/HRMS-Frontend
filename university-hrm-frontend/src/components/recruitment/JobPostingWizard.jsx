import React, { useState, useEffect } from 'react';
import { recruitmentAPI, deptAPI } from '../../services/api';
import { toast, Btn, Input, Select, Textarea, Spinner } from '../ui';
import { Briefcase, Calendar, CheckCircle, ChevronLeft, ChevronRight, ListPlus, X, Sparkles } from 'lucide-react';

export default function JobPostingWizard({ open, onClose, onSuccess }) {
  const [step, setStep] = useState(1);
  const [departments, setDepartments] = useState([]);
  const [loadingDepts, setLoadingDepts] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  
  const [newReq, setNewReq] = useState('');

  const [form, setForm] = useState({
    title: '',
    department_id: '',
    type: 'FULL_TIME',
    description: '',
    requirements: [],
    closing_date: '',
    status: 'OPEN'
  });

  useEffect(() => {
    if (open) {
      loadDepts();
      setStep(1);
      setForm({
        title: '', department_id: '', type: 'FULL_TIME', description: '', requirements: [], closing_date: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0], status: 'OPEN'
      });
      setNewReq('');
    }
  }, [open]);

  const loadDepts = async () => {
    setLoadingDepts(true);
    try {
      const res = await deptAPI.list();
      setDepartments(res.data?.data || res.data || []);
    } catch (e) {
      toast('Failed to load departments', 'error');
    } finally {
      setLoadingDepts(false);
    }
  };

  const validateStep = () => {
    if (step === 1) {
      if (!form.title) return toast('Job title is required', 'warning');
      if (!form.department_id) return toast('Department is required', 'warning');
      if (!form.type) return toast('Employment type is required', 'warning');
      return true;
    }
    if (step === 2) {
      if (!form.description) return toast('Job description is required', 'warning');
      if (form.description.length < 20) return toast('Please provide a more detailed description', 'warning');
      return true;
    }
    if (step === 3) {
      if (!form.closing_date) return toast('Closing date is required', 'warning');
      if (new Date(form.closing_date) <= new Date()) return toast('Closing date must be in the future', 'warning');
      return true;
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep()) setStep(s => s + 1);
  };

  const prevStep = () => setStep(s => s - 1);

  const addRequirement = (e) => {
    e?.preventDefault();
    if (newReq.trim()) {
      setForm(p => ({ ...p, requirements: [...p.requirements, newReq.trim()] }));
      setNewReq('');
    }
  };

  const removeRequirement = (idx) => {
    setForm(p => ({ ...p, requirements: p.requirements.filter((_, i) => i !== idx) }));
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        closing_date: new Date(form.closing_date).toISOString()
      };
      await recruitmentAPI.createJob(payload);
      toast('Job posted successfully!', 'success');
      onSuccess();
    } catch (e) {
      toast(e.response?.data?.detail || 'Failed to post job', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAIGenerate = async () => {
    if (!form.title || !form.department_id) {
      toast('Please fill out the Job Title and Department in Step 1 first.', 'warning');
      return;
    }
    
    setGeneratingAI(true);
    try {
      const dept = departments.find(d => d.id === form.department_id);
      const res = await recruitmentAPI.generateAiDescription({
        title: form.title,
        department_name: dept ? dept.name : 'Unknown Department',
        employment_type: form.type
      });
      
      const { description, requirements } = res.data;
      setForm(prev => ({
        ...prev,
        description: description || prev.description,
        requirements: requirements && requirements.length > 0 
          ? [...prev.requirements, ...requirements]
          : prev.requirements
      }));
      toast('AI perfectly crafted your job description!', 'success');
    } catch (e) {
      toast(e.response?.data?.detail || 'Failed to generate AI description', 'error');
    } finally {
      setGeneratingAI(false);
    }
  };

  if (!open) return null;

  const STEPS = [
    { num: 1, title: 'Role Definition' },
    { num: 2, title: 'Requirements & JD' },
    { num: 3, title: 'Logistics' },
    { num: 4, title: 'Review & Post' }
  ];

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '1000px', height: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', animation: 'fadeInScale 0.2s ease-out', overflow: 'hidden' }}>
        
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--gray-200)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: '#0f172a' }}>Create Job Posting</h2>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--gray-500)' }}>Standardized job creation wizard</p>
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
            
            {/* STEP 1: ROLE */}
            {step === 1 && (
              <div style={{ animation: 'fadeIn 0.3s', maxWidth: 600 }}>
                <h3 style={{ fontSize: 18, marginBottom: 24, color: '#0f172a' }}>Role Definition</h3>
                <Input 
                  label="Job Title" 
                  value={form.title} 
                  onChange={e => setForm({...form, title: e.target.value})} 
                  required 
                  placeholder="e.g. Senior Frontend Engineer"
                />
                
                {loadingDepts ? (
                  <div style={{ padding: 20, textAlign: 'center' }}><Spinner /></div>
                ) : (
                  <Select 
                    label="Department" 
                    value={form.department_id} 
                    onChange={e => setForm({...form, department_id: e.target.value})} 
                    required
                  >
                    <option value="">Select Department</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </Select>
                )}

                <Select 
                  label="Employment Type" 
                  value={form.type} 
                  onChange={e => setForm({...form, type: e.target.value})}
                >
                  <option value="FULL_TIME">Full Time</option>
                  <option value="PART_TIME">Part Time</option>
                  <option value="CONTRACT">Contract</option>
                  <option value="VISITING">Visiting</option>
                </Select>
              </div>
            )}

            {/* STEP 2: REQUIREMENTS */}
            {step === 2 && (
              <div style={{ animation: 'fadeIn 0.3s', maxWidth: 600 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                  <h3 style={{ fontSize: 18, color: '#0f172a', margin: 0 }}>Requirements & Description</h3>
                  <button 
                    onClick={handleAIGenerate}
                    disabled={generatingAI}
                    type="button"
                    style={{ 
                      display: 'flex', alignItems: 'center', gap: 6, 
                      background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', 
                      color: '#fff', border: 'none', padding: '8px 16px', 
                      borderRadius: 20, fontSize: 13, fontWeight: 600, 
                      cursor: generatingAI ? 'not-allowed' : 'pointer',
                      opacity: generatingAI ? 0.8 : 1,
                      boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {generatingAI ? <Spinner /> : <Sparkles size={14} />}
                    {generatingAI ? 'AI is drafting...' : 'Generate with AI'}
                  </button>
                </div>
                
                <Textarea 
                  label="Job Description" 
                  value={form.description} 
                  onChange={e => setForm({...form, description: e.target.value})} 
                  required 
                  rows={6}
                  placeholder="Describe the role, responsibilities, and team..."
                />

                <div style={{ marginTop: 24 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-light)', marginBottom: 5 }}>
                    Specific Requirements (Skills, Experience)
                  </label>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                    <Input 
                      value={newReq} 
                      onChange={e => setNewReq(e.target.value)} 
                      placeholder="e.g. 5+ years of React experience"
                      style={{ flex: 1, marginBottom: 0 }}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addRequirement(e);
                        }
                      }}
                    />
                    <Btn type="button" variant="secondary" onClick={addRequirement}>
                      <ListPlus size={16} /> Add
                    </Btn>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {form.requirements.length === 0 && (
                      <div style={{ fontSize: 13, color: 'var(--gray-400)', fontStyle: 'italic' }}>No requirements added yet.</div>
                    )}
                    {form.requirements.map((req, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--gray-200)', fontSize: 14, color: '#0f172a' }}>
                        <span>• {req}</span>
                        <button onClick={() => removeRequirement(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-400)' }}>
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: LOGISTICS */}
            {step === 3 && (
              <div style={{ animation: 'fadeIn 0.3s', maxWidth: 500 }}>
                <h3 style={{ fontSize: 18, marginBottom: 24, color: '#0f172a' }}>Logistics</h3>
                
                <Input 
                  label="Closing Date" 
                  type="date" 
                  value={form.closing_date} 
                  onChange={e => setForm({...form, closing_date: e.target.value})} 
                  required 
                />
                
                <Select 
                  label="Initial Status" 
                  value={form.status} 
                  onChange={e => setForm({...form, status: e.target.value})}
                >
                  <option value="OPEN">Open (Accepting Applications)</option>
                  <option value="PAUSED">Paused</option>
                  <option value="ON_HOLD">On Hold</option>
                </Select>
                
                <div style={{ marginTop: 24, padding: 16, background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8, display: 'flex', gap: 12, color: '#0369a1' }}>
                  <Calendar size={20} />
                  <div style={{ fontSize: 13 }}>
                    The job posting will automatically be marked as closed on the selected closing date.
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: REVIEW */}
            {step === 4 && (
              <div style={{ animation: 'fadeIn 0.3s' }}>
                <h3 style={{ fontSize: 18, marginBottom: 24, color: '#0f172a' }}>Review & Post</h3>
                
                <div style={{ background: '#f8fafc', borderRadius: 12, border: '1px solid var(--gray-200)', padding: 24, marginBottom: 24 }}>
                  <h4 style={{ fontSize: 14, textTransform: 'uppercase', color: 'var(--gray-500)', letterSpacing: '0.05em', marginBottom: 12, borderBottom: '1px solid var(--gray-200)', paddingBottom: 8 }}>Job Configuration</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '8px 16px', fontSize: 14, marginBottom: 24 }}>
                    <span style={{ color: 'var(--gray-500)' }}>Title:</span> <span style={{ fontWeight: 600 }}>{form.title}</span>
                    <span style={{ color: 'var(--gray-500)' }}>Department:</span> <span style={{ fontWeight: 500 }}>{departments.find(d => d.id === form.department_id)?.name}</span>
                    <span style={{ color: 'var(--gray-500)' }}>Type:</span> <span style={{ fontWeight: 500 }}>{form.type.replace('_', ' ')}</span>
                    <span style={{ color: 'var(--gray-500)' }}>Status:</span> <span style={{ fontWeight: 500 }}>{form.status.replace('_', ' ')}</span>
                    <span style={{ color: 'var(--gray-500)' }}>Closing Date:</span> <span style={{ fontWeight: 500 }}>{form.closing_date}</span>
                  </div>

                  <h4 style={{ fontSize: 14, textTransform: 'uppercase', color: 'var(--gray-500)', letterSpacing: '0.05em', marginBottom: 12, borderBottom: '1px solid var(--gray-200)', paddingBottom: 8 }}>Requirements</h4>
                  <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: '#0f172a', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {form.requirements.length === 0 ? <li style={{ color: 'var(--gray-400)' }}>None specified</li> : form.requirements.map((req, i) => <li key={i}>{req}</li>)}
                  </ul>
                </div>

                <div style={{ padding: 16, background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: 8, display: 'flex', gap: 12, color: 'var(--success)' }}>
                  <CheckCircle size={20} />
                  <div style={{ fontSize: 14 }}>By submitting, this job will be instantly visible in the careers portal based on the selected status.</div>
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
          
          {step < 4 ? (
            <Btn variant="primary" onClick={nextStep} style={{ width: 140 }}>
              Continue <ChevronRight size={16} />
            </Btn>
          ) : (
            <Btn variant="primary" onClick={handleSubmit} loading={submitting} style={{ width: 160 }}>
              Post Job
            </Btn>
          )}
        </div>
      </div>
    </div>
  );
}
