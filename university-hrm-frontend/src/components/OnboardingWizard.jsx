import React, { useState, useEffect } from 'react';
import { Card, Btn, Badge } from './ui';
import { 
  CheckCircle2, Circle, ChevronRight, ChevronLeft,
  FileText, BookOpen, ShieldCheck, Users, PartyPopper, Check, Clock
} from 'lucide-react';

/**
 * OnboardingWizard
 * 
 * @param {object} record - The full onboarding record including `tasks` and `employee` info.
 * @param {boolean} isHR - Determines whether the view is HR mode (can verify) or Employee mode.
 * @param {function} onCompleteTask - Callback when a task is completed `(taskId) => Promise`
 */
export const OnboardingWizard = ({ record, isHR, onCompleteTask }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loadingTask, setLoadingTask] = useState(null);

  const tasks = record?.tasks || [];
  
  // Calculate Progress
  const totalTasks = tasks.length || 8;
  const completedTasks = tasks.filter(t => t.is_completed).length;
  const progress = Math.round((completedTasks / totalTasks) * 100) || 0;

  // Helpers to get task status
  const getTask = (title) => tasks.find(t => t.title === title);
  
  const isCompleted = (title) => getTask(title)?.is_completed;

  // Step 2 Dependency Check
  const employeeDocsDone = isCompleted("Submit Personal Documents");

  // Determine automatic starting step based on progress
  useEffect(() => {
    if (!record) return;
    if (progress === 100) {
      setCurrentStep(6);
    } else if (isCompleted("Submit Personal Documents") && isCompleted("Complete Tax Forms") && !isCompleted("Read Employee Handbook")) {
      setCurrentStep(3);
    } else if (isCompleted("Read Employee Handbook") && !isCompleted("Complete Cybersecurity Training")) {
      setCurrentStep(4);
    } else if (isCompleted("Complete Cybersecurity Training") && !isCompleted("Meet Reporting Manager")) {
      setCurrentStep(5);
    } else {
      setCurrentStep(progress === 100 ? 6 : 2); // Default to documents if not done
    }
  }, [record]);

  const handleTaskClick = async (task) => {
    if (!task || task.is_completed || loadingTask) return;
    
    // Check constraints
    if (task.title === "Verify Documents" && !employeeDocsDone) return;
    if (!isHR && task.assigned_to === "HR") return;

    setLoadingTask(task.id);
    try {
      await onCompleteTask(task.id);
    } finally {
      setLoadingTask(null);
    }
  };

  const steps = [
    { id: 1, label: 'Welcome', icon: <PartyPopper size={18} /> },
    { id: 2, label: 'Documents', icon: <FileText size={18} /> },
    { id: 3, label: 'Policies', icon: <BookOpen size={18} /> },
    { id: 4, label: 'Training', icon: <ShieldCheck size={18} /> },
    { id: 5, label: 'Integration', icon: <Users size={18} /> },
    { id: 6, label: 'Complete', icon: <CheckCircle2 size={18} /> },
  ];

  const TaskRow = ({ title, description }) => {
    const task = getTask(title);
    if (!task) return null;
    
    const isOwner = isHR || task.assigned_to === "EMPLOYEE";
    const locked = task.title === "Verify Documents" && !employeeDocsDone;
    const canComplete = isOwner && !task.is_completed && !locked;

    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 16, padding: '16px',
        background: task.is_completed ? 'rgba(16, 185, 129, 0.05)' : 'var(--bg)',
        borderRadius: 8,
        border: `1px solid ${task.is_completed ? 'var(--success)' : 'var(--border-color)'}`,
        opacity: locked ? 0.6 : 1,
        transition: 'all 0.2s ease',
        marginBottom: 12
      }}>
        <div style={{ flexShrink: 0 }}>
          {task.is_completed ? (
            <CheckCircle2 size={24} color="var(--success)" />
          ) : canComplete ? (
            <button
              onClick={() => handleTaskClick(task)}
              disabled={loadingTask === task.id}
              style={{
                width: 24, height: 24, borderRadius: '50%', border: '2px solid var(--gray-400)',
                background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0
              }}
            >
              {loadingTask === task.id && <Clock size={14} color="var(--gray-500)" style={{ animation: 'spin 1s linear infinite' }} />}
            </button>
          ) : (
            <div style={{ width: 24, height: 24, borderRadius: '50%', border: '2px solid var(--gray-300)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Circle size={14} color="var(--gray-300)" />
            </div>
          )}
        </div>
        
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: task.is_completed ? 'var(--gray-600)' : 'var(--text-dark)', textDecoration: task.is_completed ? 'line-through' : 'none' }}>
              {title}
            </span>
            <Badge variant={task.assigned_to === 'HR' ? 'warning' : 'info'} style={{ fontSize: 10, padding: '2px 6px' }}>
              {task.assigned_to === 'HR' ? 'HR TASK' : 'EMPLOYEE TASK'}
            </Badge>
            {locked && <Badge variant="secondary" style={{ fontSize: 10, padding: '2px 6px' }}>LOCKED</Badge>}
          </div>
          <p style={{ fontSize: 13, color: 'var(--gray-500)', margin: 0 }}>
            {description || 'Complete this task to proceed with onboarding.'}
          </p>
        </div>
        
        {task.completed_at && (
          <div style={{ fontSize: 12, color: 'var(--gray-500)', textAlign: 'right' }}>
            <div>Completed</div>
            <div>{new Date(task.completed_at).toLocaleDateString()}</div>
          </div>
        )}
      </div>
    );
  };

  const renderStepContent = () => {
    switch(currentStep) {
      case 1:
        return (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ width: 80, height: 80, background: 'var(--primary-light)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <PartyPopper size={40} color="var(--primary)" />
            </div>
            <h2 style={{ fontSize: 24, marginBottom: 12 }}>Welcome to the University!</h2>
            <p style={{ fontSize: 16, color: 'var(--gray-600)', maxWidth: 500, margin: '0 auto 32px', lineHeight: 1.6 }}>
              We're thrilled to have you on board. You have <strong>{totalTasks} onboarding tasks</strong> to complete before your orientation process is finalized.
            </p>
            
            <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 32 }}>
              <div style={{ textAlign: 'left', padding: '16px 24px', background: 'var(--gray-50)', borderRadius: 8, border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: 12, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Employee Info</div>
                <div style={{ fontWeight: 600, fontSize: 16 }}>{record.employee?.first_name} {record.employee?.last_name}</div>
                <div style={{ color: 'var(--gray-600)', fontSize: 14 }}>{record.employee?.employee_id} • {(record.employee?.role || '').replace('_', ' ')}</div>
              </div>
              <div style={{ textAlign: 'left', padding: '16px 24px', background: 'var(--gray-50)', borderRadius: 8, border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: 12, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Start Date</div>
                <div style={{ fontWeight: 600, fontSize: 16 }}>{new Date(record.start_date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</div>
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div style={{ animation: 'fadeIn 0.3s ease-in-out' }}>
            <h3 style={{ fontSize: 18, marginBottom: 8 }}>Document Submission</h3>
            <p style={{ color: 'var(--gray-600)', marginBottom: 24, fontSize: 14 }}>Please upload all required documentation. HR will verify these records.</p>
            <TaskRow title="Submit Personal Documents" description="Upload Aadhaar, PAN, Passport Photo, Degree, and Bank Details." />
            <TaskRow title="Complete Tax Forms" description="Sign and submit the standard tax declaration forms." />
            <TaskRow title="Verify Documents" description="HR will review and verify all submitted documents." />
          </div>
        );
      case 3:
        return (
          <div style={{ animation: 'fadeIn 0.3s ease-in-out' }}>
            <h3 style={{ fontSize: 18, marginBottom: 8 }}>Policies & Handbook</h3>
            <p style={{ color: 'var(--gray-600)', marginBottom: 24, fontSize: 14 }}>Review our internal guidelines and policies.</p>
            <TaskRow title="Read Employee Handbook" description="Read the complete university handbook and acknowledge receipt." />
          </div>
        );
      case 4:
        return (
          <div style={{ animation: 'fadeIn 0.3s ease-in-out' }}>
            <h3 style={{ fontSize: 18, marginBottom: 8 }}>Training & Orientation</h3>
            <p style={{ color: 'var(--gray-600)', marginBottom: 24, fontSize: 14 }}>Complete your mandatory initial training modules.</p>
            <TaskRow title="Complete Cybersecurity Training" description="Complete the online cybersecurity awareness course." />
            <TaskRow title="Department Orientation" description="Attend the HR-led department overview session." />
          </div>
        );
      case 5:
        return (
          <div style={{ animation: 'fadeIn 0.3s ease-in-out' }}>
            <h3 style={{ fontSize: 18, marginBottom: 8 }}>Team Integration</h3>
            <p style={{ color: 'var(--gray-600)', marginBottom: 24, fontSize: 14 }}>Meet your team and finalize your IT setup.</p>
            <TaskRow title="Meet Reporting Manager" description="Schedule an initial 1:1 meeting with your direct manager." />
            <TaskRow title="IT Account Verification" description="IT department will verify and provision all system access." />
          </div>
        );
      case 6:
        return (
          <div style={{ textAlign: 'center', padding: '40px 20px', animation: 'fadeIn 0.5s ease-in-out' }}>
            {progress === 100 ? (
              <>
                <div style={{ width: 80, height: 80, background: 'var(--success)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', boxShadow: '0 8px 24px rgba(16,185,129,0.3)' }}>
                  <Check size={40} color="white" />
                </div>
                <h2 style={{ fontSize: 28, marginBottom: 12, color: 'var(--success)' }}>Onboarding Completed!</h2>
                <p style={{ fontSize: 16, color: 'var(--gray-600)', maxWidth: 500, margin: '0 auto 32px' }}>
                  Congratulations! All tasks have been verified and your onboarding is officially finalized.
                </p>
                {record.completed_at && (
                  <div style={{ display: 'inline-block', background: 'var(--gray-100)', padding: '8px 16px', borderRadius: 20, fontSize: 14, color: 'var(--gray-600)' }}>
                    Completed on {new Date(record.completed_at).toLocaleString()}
                  </div>
                )}
              </>
            ) : (
              <>
                <div style={{ width: 80, height: 80, background: 'var(--gray-200)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                  <Clock size={40} color="var(--gray-500)" />
                </div>
                <h2 style={{ fontSize: 24, marginBottom: 12 }}>Almost There</h2>
                <p style={{ fontSize: 16, color: 'var(--gray-600)', maxWidth: 500, margin: '0 auto 32px' }}>
                  You have {totalTasks - completedTasks} tasks remaining. Please review the previous steps and ensure all required actions are completed by both you and HR.
                </p>
              </>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Card style={{ padding: 0, overflow: 'hidden' }}>
      {/* Header & Progress */}
      <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border-color)', background: 'var(--surface)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Onboarding Journey</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 12, color: 'var(--gray-500)', fontWeight: 600, textTransform: 'uppercase' }}>Overall Progress</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: progress === 100 ? 'var(--success)' : 'var(--primary)' }}>{progress}%</div>
            </div>
            {/* Circular Progress Ring */}
            <div style={{ position: 'relative', width: 48, height: 48 }}>
              <svg width="48" height="48" viewBox="0 0 48 48">
                <circle cx="24" cy="24" r="20" fill="none" stroke="var(--gray-200)" strokeWidth="6" />
                <circle cx="24" cy="24" r="20" fill="none" stroke={progress === 100 ? 'var(--success)' : 'var(--primary)'} strokeWidth="6" 
                  strokeDasharray="125.6" strokeDashoffset={125.6 - (125.6 * progress) / 100} 
                  strokeLinecap="round" style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'stroke-dashoffset 0.8s ease-out, stroke 0.4s ease' }} 
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Horizontal Stepper */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 20, left: 30, right: 30, height: 2, background: 'var(--gray-200)', zIndex: 0 }} />
          <div style={{ position: 'absolute', top: 20, left: 30, height: 2, background: progress === 100 ? 'var(--success)' : 'var(--primary)', zIndex: 1, width: `calc(${((currentStep - 1) / 5) * 100}% - ${currentStep === 6 ? 60 : 30}px)`, transition: 'width 0.4s ease' }} />
          
          {steps.map((step) => {
            const isActive = currentStep === step.id;
            const isPast = currentStep > step.id || progress === 100;
            
            return (
              <div key={step.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 2, cursor: 'pointer' }} onClick={() => setCurrentStep(step.id)}>
                <div style={{ 
                  width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: isPast || progress === 100 ? (progress === 100 ? 'var(--success)' : 'var(--primary)') : isActive ? 'var(--primary-light)' : 'var(--bg)',
                  border: `2px solid ${isPast || isActive || progress === 100 ? (progress === 100 ? 'var(--success)' : 'var(--primary)') : 'var(--gray-300)'}`,
                  color: isPast || progress === 100 ? 'white' : isActive ? 'var(--primary)' : 'var(--gray-400)',
                  transition: 'all 0.3s ease',
                  marginBottom: 8
                }}>
                  {step.icon}
                </div>
                <span style={{ fontSize: 12, fontWeight: isActive ? 600 : 500, color: isActive ? 'var(--text-dark)' : 'var(--gray-500)' }}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ padding: '32px', minHeight: 380, background: 'var(--bg)' }} id="onboarding-step-content">
        {renderStepContent()}
      </div>

      {/* Footer Navigation */}
      <div style={{ padding: '16px 32px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface)' }}>
        <Btn variant="secondary" onClick={() => setCurrentStep(s => Math.max(1, s - 1))} disabled={currentStep === 1}>
          <ChevronLeft size={16} /> Previous Step
        </Btn>
        <div style={{ fontSize: 13, color: 'var(--gray-500)' }}>
          Step {currentStep} of 6
        </div>
        <Btn onClick={() => setCurrentStep(s => Math.min(6, s + 1))} disabled={currentStep === 6}>
          {currentStep === 5 ? 'Finish' : 'Next Step'} <ChevronRight size={16} />
        </Btn>
      </div>
      
      {/* Required CSS Animations */}
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </Card>
  );
};
