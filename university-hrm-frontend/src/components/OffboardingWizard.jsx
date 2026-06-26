import React, { useState, useEffect } from 'react';
import { Modal, Input, Textarea, Btn, toast } from './ui';
import AsyncEmployeeSelect from './ui/AsyncEmployeeSelect';
import { onboardAPI } from '../services/api';
import { UserMinus, ChevronRight, ChevronLeft, CheckCircle2, AlertTriangle, Plus, Trash2 } from 'lucide-react';

export function OffboardingWizard({ open, onClose, onSuccess }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    employee_id: '',
    employee_details: null,
    reason: '',
    last_working_date: '',
    remarks: '',
    tasks: []
  });

  // Reset wizard when opened/closed
  useEffect(() => {
    if (open) {
      setStep(1);
      setFormData({
        employee_id: '',
        employee_details: null,
        reason: '',
        last_working_date: '',
        remarks: '',
        tasks: []
      });
    }
  }, [open]);

  // Fetch template tasks when reaching step 3
  useEffect(() => {
    if (step === 3 && formData.employee_id && formData.tasks.length === 0) {
      fetchTemplate();
    }
  }, [step]);

  const fetchTemplate = async () => {
    try {
      setLoading(true);
      const res = await onboardAPI.getOffboardingTemplate(formData.employee_id);
      setFormData(prev => ({ ...prev, tasks: res.tasks }));
    } catch (err) {
      toast.error('Failed to load offboarding template');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (step === 1 && !formData.employee_id) return toast.error("Please select an employee");
    if (step === 2 && (!formData.reason || !formData.last_working_date)) return toast.error("Please fill required fields");
    setStep(s => s + 1);
  };

  const handleBack = () => setStep(s => s - 1);

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const payload = {
        employee_id: formData.employee_id,
        reason: `${formData.reason}${formData.remarks ? ` - ${formData.remarks}` : ''}`,
        last_working_date: formData.last_working_date || null,
        tasks: formData.tasks
      };
      
      await onboardAPI.offInitiate(payload);
      toast.success('Offboarding initiated successfully');
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to initiate offboarding');
    } finally {
      setSubmitting(false);
    }
  };

  const updateTask = (index, field, value) => {
    const newTasks = [...formData.tasks];
    newTasks[index][field] = value;
    setFormData({ ...formData, tasks: newTasks });
  };

  const removeTask = (index) => {
    const newTasks = [...formData.tasks];
    newTasks.splice(index, 1);
    setFormData({ ...formData, tasks: newTasks });
  };

  const addTask = () => {
    setFormData({
      ...formData,
      tasks: [...formData.tasks, { title: '', description: '' }]
    });
  };

  // --- Step Components ---

  const renderStep1 = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ padding: '16px', background: 'var(--gray-50)', borderRadius: '8px', border: '1px solid var(--gray-200)' }}>
        <AsyncEmployeeSelect
          label="Select Employee"
          value={formData.employee_id}
          onChange={(val, opt) => setFormData({ ...formData, employee_id: val, employee_details: opt })}
          required
        />
      </div>
      {formData.employee_details && (
        <div style={{ padding: 16, border: '1px solid var(--gray-200)', borderRadius: 8 }}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: 14 }}>Employee Profile</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13 }}>
            <div><span style={{ color: 'var(--gray-500)', display: 'block' }}>Name</span><strong>{formData.employee_details.label.split(' (')[0]}</strong></div>
            <div><span style={{ color: 'var(--gray-500)', display: 'block' }}>Department</span><strong>{formData.employee_details.department || 'N/A'}</strong></div>
            <div><span style={{ color: 'var(--gray-500)', display: 'block' }}>Role</span><strong>{formData.employee_details.role || 'N/A'}</strong></div>
          </div>
        </div>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--gray-700)' }}>Offboarding Reason *</label>
        <select 
          style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--gray-300)' }}
          value={formData.reason}
          onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
        >
          <option value="">Select a reason...</option>
          <option value="Resignation">Resignation</option>
          <option value="Retirement">Retirement</option>
          <option value="Contract End">Contract End</option>
          <option value="Termination">Termination</option>
          <option value="Transfer">Transfer</option>
          <option value="Other">Other</option>
        </select>
      </div>

      <Input 
        label="Last Working Date *" 
        type="date" 
        value={formData.last_working_date} 
        onChange={(e) => setFormData({ ...formData, last_working_date: e.target.value })} 
      />
      
      <Textarea 
        label="HR Remarks (Optional)" 
        value={formData.remarks} 
        onChange={(e) => setFormData({ ...formData, remarks: e.target.value })} 
        placeholder="Additional context about the departure..." 
        rows={3}
      />
    </div>
  );

  const renderStep3 = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h4 style={{ margin: 0, fontSize: 16 }}>Checklist Preview</h4>
          <p style={{ margin: '4px 0 0 0', fontSize: 13, color: 'var(--gray-500)' }}>Generated based on role and department.</p>
        </div>
        <Btn variant="outline" size="sm" onClick={addTask}><Plus size={14} /> Add Task</Btn>
      </div>

      {loading ? (
        <div style={{ padding: 30, textAlign: 'center', color: 'var(--gray-500)' }}>Generating template...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: '40vh', overflowY: 'auto', paddingRight: 8 }}>
          {formData.tasks.map((task, idx) => (
            <div key={idx} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', background: 'var(--gray-50)', padding: 12, borderRadius: 8, border: '1px solid var(--gray-200)' }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <input 
                  value={task.title}
                  onChange={(e) => updateTask(idx, 'title', e.target.value)}
                  placeholder="Task Title"
                  style={{ width: '100%', padding: 6, border: '1px solid transparent', background: 'transparent', fontWeight: 600, fontSize: 14 }}
                />
                <input 
                  value={task.description}
                  onChange={(e) => updateTask(idx, 'description', e.target.value)}
                  placeholder="Task Description"
                  style={{ width: '100%', padding: 6, border: '1px solid transparent', background: 'transparent', fontSize: 13, color: 'var(--gray-600)' }}
                />
              </div>
              <button 
                onClick={() => removeTask(idx)}
                style={{ background: 'transparent', border: 'none', color: 'var(--danger-500)', cursor: 'pointer', padding: 4 }}
                title="Remove task"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          {formData.tasks.length === 0 && (
            <div style={{ textAlign: 'center', padding: 20, color: 'var(--gray-500)' }}>No tasks. Click 'Add Task' to create one.</div>
          )}
        </div>
      )}
    </div>
  );

  const renderStep4 = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ padding: 16, background: 'var(--danger-50)', color: 'var(--danger-700)', borderRadius: 8, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <AlertTriangle size={20} style={{ flexShrink: 0, marginTop: 2 }} />
        <div>
          <strong style={{ display: 'block', marginBottom: 4 }}>You are about to initiate offboarding</strong>
          <span style={{ fontSize: 13 }}>This will lock the employee's profile from standard edits and alert relevant departments.</span>
        </div>
      </div>

      <div style={{ border: '1px solid var(--gray-200)', borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--gray-200)', background: 'var(--gray-50)', display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--gray-500)', fontSize: 13 }}>Employee</span>
          <strong style={{ fontSize: 13 }}>{formData.employee_details?.label.split(' (')[0]}</strong>
        </div>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--gray-200)', display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--gray-500)', fontSize: 13 }}>Reason</span>
          <strong style={{ fontSize: 13 }}>{formData.reason}</strong>
        </div>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--gray-200)', background: 'var(--gray-50)', display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--gray-500)', fontSize: 13 }}>Last Working Date</span>
          <strong style={{ fontSize: 13 }}>{formData.last_working_date}</strong>
        </div>
        <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--gray-500)', fontSize: 13 }}>Assigned Tasks</span>
          <strong style={{ fontSize: 13 }}>{formData.tasks.length} items</strong>
        </div>
      </div>
    </div>
  );

  const stepTitles = ["Select Employee", "Details", "Checklist", "Confirm"];

  return (
    <Modal open={open} onClose={onClose} title="Initiate Offboarding" width={600}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {stepTitles.map((title, idx) => (
          <div key={idx} style={{ flex: 1, height: 4, background: step > idx ? 'var(--brand-500)' : 'var(--gray-200)', borderRadius: 2 }} />
        ))}
      </div>
      
      <div style={{ minHeight: 300 }}>
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--gray-200)' }}>
        <Btn variant="secondary" onClick={step === 1 ? onClose : handleBack}>
          {step === 1 ? 'Cancel' : <><ChevronLeft size={16} /> Back</>}
        </Btn>
        
        {step < 4 ? (
          <Btn variant="primary" onClick={handleNext}>
            Next <ChevronRight size={16} />
          </Btn>
        ) : (
          <Btn variant="danger" onClick={handleSubmit} loading={submitting}>
            <UserMinus size={16} /> Initiate Offboarding
          </Btn>
        )}
      </div>
    </Modal>
  );
}
