import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { onboardAPI, employeesAPI } from '../services/api';
import {
  PageHeader, Card, Table, Btn, Modal, Input, Textarea, Badge, Tabs, Skeleton, toast, Select,
} from '../components/ui';
import { CheckCircle2, Circle, UserMinus, Eye } from 'lucide-react';

export default function Onboarding() {
  const { hasRole } = useAuth();
  const [tab, setTab] = useState('onboarding');
  const [myRecord, setMyRecord] = useState(null);
  const [allRecords, setAllRecords] = useState([]);
  const [offRecords, setOffRecords] = useState([]);
  const [empList, setEmpList] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showInitOff, setShowInitOff] = useState(false);
  const [offForm, setOffForm] = useState({ employee_id: '', reason: '', last_working_date: '' });
  const [submitting, setSubmitting] = useState(false);
  const [viewOff, setViewOff] = useState(null);

  const isPrivileged = hasRole('admin', 'hr', 'hr_manager', 'hr_staff');

  const tabs = [
    { key: 'onboarding', label: 'Onboarding' },
    ...(isPrivileged ? [{ key: 'offboarding', label: 'Offboarding' }] : []),
  ];

  const loadData = async () => {
    setLoading(true);
    try {
      // Load own onboarding
      try {
        const { data } = await onboardAPI.myRecord();
        setMyRecord(data?.data || data);
      } catch {
        setMyRecord(null);
      }

      // HR: all records
      if (isPrivileged) {
        try {
          const { data } = await onboardAPI.allRecords();
          setAllRecords(data?.data || data || []);
        } catch { setAllRecords([]); }

        try {
          const { data } = await onboardAPI.offAll();
          setViewOff(null); // Clear active detail view during refresh if needed
          setOffRecords(data?.data || data || []);
        } catch { setOffRecords([]); }
        
        try {
          const { data } = await employeesAPI.list();
          setEmpList(data?.items || data?.data || data || []);
        } catch { setEmpList([]); }
      }
    } catch (e) {
      toast('Failed to load onboarding data', 'error');
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadData(); }, []);

  const handleCompleteTask = async (taskId) => {
    try {
      await onboardAPI.completeTask(taskId);
      toast('Task completed!', 'success');
      loadData();
    } catch (e) {
      toast(e.response?.data?.message || 'Failed to complete task', 'error');
    }
  };

  const handleOffCompleteTask = async (recordId, taskId) => {
    try {
      await onboardAPI.offCompleteTask(recordId, taskId);
      toast('Offboarding task completed!', 'success');
      // Update local view manually to avoid full reload flicker
      setViewOff((prev) => {
        if (!prev) return prev;
        const newTasks = prev.tasks.map(t => t.id === taskId ? { ...t, isCompleted: true } : t);
        return { ...prev, tasks: newTasks };
      });
      loadData();
    } catch (e) {
      toast(e.response?.data?.message || 'Failed to complete offboarding task', 'error');
    }
  };

  const handleInitiateOff = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onboardAPI.offInitiate({
        employee_id: offForm.employee_id,
        reason: offForm.reason,
        last_working_date: offForm.last_working_date,
      });
      toast('Offboarding initiated', 'success');
      setShowInitOff(false);
      setOffForm({ employee_id: '', reason: '', last_working_date: '' });
      loadData();
    } catch (e) {
      toast(e.response?.data?.message || 'Failed to initiate offboarding', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <>
        <PageHeader title="Onboarding & Offboarding" subtitle="Track employee onboarding tasks and offboarding processes" />
        <Skeleton width="100%" height="40px" style={{ marginBottom: 24 }} />
        <Card style={{ marginBottom: 24 }}>
          <div style={{ marginBottom: 16 }}>
            <Skeleton width="200px" height="20px" style={{ marginBottom: 8 }} />
            <Skeleton width="120px" height="14px" />
          </div>
          <Skeleton width="100%" height="8px" style={{ marginBottom: 20 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[1, 2, 3].map(i => (
              <Skeleton key={i} width="100%" height="52px" style={{ borderRadius: '6px' }} />
            ))}
          </div>
        </Card>
      </>
    );
  }

  const completedTasks = myRecord?.tasks?.filter((t) => t.isCompleted)?.length || 0;
  const totalTasks = myRecord?.tasks?.length || 0;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <>
      <PageHeader
        title="Onboarding & Offboarding"
        subtitle="Track employee onboarding tasks and offboarding processes"
        actions={
          isPrivileged && (
            <Btn onClick={() => setShowInitOff(true)}>
              <UserMinus size={16} /> Initiate Offboarding
            </Btn>
          )
        }
      />

      <Tabs tabs={tabs} active={tab} onChange={setTab} />

      {/* Onboarding Tab */}
      {tab === 'onboarding' && (
        <>
          {/* My onboarding checklist */}
          {myRecord && (
            <Card style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <h3 style={{ fontSize: 16, margin: 0 }}>My Onboarding Journey</h3>
                    <Badge variant={progress === 100 ? 'success' : progress >= 50 ? 'info' : 'warning'}>
                      {progress === 100 ? 'Officially on Board! 🏆' : progress >= 50 ? 'Getting the Hang of It 🚀' : 'Orientation Pending 🥚'}
                    </Badge>
                  </div>
                  <span style={{ color: 'var(--gray-500)', fontSize: 13 }}>
                    {completedTasks} of {totalTasks} tasks completed
                  </span>
                </div>
                <div style={{ fontSize: 24, fontWeight: 800, color: progress === 100 ? 'var(--success)' : 'var(--primary)' }}>
                  {progress}%
                </div>
              </div>

              {/* Progress bar */}
              <div style={{ height: 8, background: 'var(--gray-200)', borderRadius: 4, overflow: 'hidden', marginBottom: 20 }}>
                <div
                  style={{
                    height: '100%',
                    width: `${progress}%`,
                    background: progress === 100 ? 'var(--success)' : 'linear-gradient(90deg, #0052CC, #0065FF)',
                    borderRadius: 4,
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>

              {/* Task list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {myRecord.tasks?.map((task) => (
                  <div
                    key={task.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                      background: task.isCompleted ? 'rgba(16, 185, 129, 0.1)' : 'var(--gray-100)',
                      borderRadius: '6px',
                      border: `1px solid ${task.isCompleted ? 'var(--success-border)' : 'var(--gray-200)'}`,
                    }}
                  >
                    {task.isCompleted ? (
                      <CheckCircle2 size={20} color="var(--success)" />
                    ) : (
                      <button
                        onClick={() => handleCompleteTask(task.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--gray-500)' }}
                      >
                        <Circle size={20} />
                      </button>
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, textDecoration: task.isCompleted ? 'line-through' : 'none', color: task.isCompleted ? 'var(--gray-500)' : 'var(--text-dark)' }}>
                        {task.title}
                      </div>
                      {task.description && (
                        <div style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 2 }}>{task.description}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* HR view: all onboarding records */}
          {isPrivileged && allRecords.length > 0 && (
            <Card style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)' }}>
                <h3 style={{ fontSize: 16 }}>All Onboarding Records</h3>
              </div>
              <Table
                cols={[
                  { key: 'emp', label: 'Employee', render: (r) => `${r.employee?.first_name || ''} ${r.employee?.last_name || ''}` },
                  { key: 'status', label: 'Status', render: (r) => (
                    <Badge variant={r.status === 'COMPLETED' ? 'success' : 'info'}>{r.status}</Badge>
                  )},
                  { key: 'tasks', label: 'Progress', render: (r) => {
                    const done = r.tasks?.filter((t) => t.isCompleted)?.length || 0;
                    const total = r.tasks?.length || 0;
                    return `${done}/${total}`;
                  }},
                  { key: 'createdAt', label: 'Started', render: (r) => new Date(r.created_at).toLocaleDateString() },
                ]}
                rows={allRecords}
                loading={false}
              />
            </Card>
          )}
        </>
      )}

      {/* Offboarding Tab */}
      {tab === 'offboarding' && isPrivileged && (
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 16 }}>Offboarding Pipeline</h3>
            <Btn size="sm" onClick={() => setShowInitOff(true)}>Initiate Offboarding</Btn>
          </div>
          <Table
            cols={[
              { key: 'emp', label: 'Employee', render: (r) => `${r.employee?.first_name || ''} ${r.employee?.last_name || ''}` },
              { key: 'reason', label: 'Reason', render: (r) => r.reason || '—' },
              { key: 'lastWorkingDate', label: 'Last Day', render: (r) => new Date(r.last_working_date).toLocaleDateString() },
              { key: 'clearanceStatus', label: 'Clearance', render: (r) => (
                <Badge variant={r.clearanceStatus === 'CLEARED' ? 'success' : r.clearanceStatus === 'HOLD' ? 'danger' : 'warning'}>
                  {r.clearanceStatus || 'PENDING'}
                </Badge>
              )},
              { key: 'tasks', label: 'Tasks', render: (r) => {
                const done = r.tasks?.filter((t) => t.isCompleted)?.length || 0;
                const total = r.tasks?.length || 0;
                return `${done}/${total}`;
              }},
              { key: 'actions', label: '', render: (r) => (
                <Btn variant="secondary" size="xs" onClick={() => setViewOff(r)}>
                  <Eye size={13} /> Details
                </Btn>
              )},
            ]}
            rows={offRecords}
            loading={false}
            emptyMsg="No offboarding records"
          />
        </Card>
      )}

      {/* Initiate Offboarding Modal */}
      <Modal open={showInitOff} onClose={() => setShowInitOff(false)} title="Initiate Offboarding" width={480}>
        <form onSubmit={handleInitiateOff}>
          <Select label="Employee" value={offForm.employee_id} onChange={(e) => setOffForm({ ...offForm, employee_id: e.target.value })} required id="off-emp">
            <option value="">-- Select Employee --</option>
            {empList.map((e) => <option key={e.id} value={e.id}>{e.first_name} {e.last_name} ({e.employee_id})</option>)}
          </Select>
          <Textarea label="Reason" value={offForm.reason} onChange={(e) => setOffForm({ ...offForm, reason: e.target.value })} placeholder="Reason for offboarding" required id="off-reason" />
          <Input label="Last Working Date" type="date" value={offForm.last_working_date} onChange={(e) => setOffForm({ ...offForm, last_working_date: e.target.value })} required id="off-last" />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
            <Btn variant="secondary" type="button" onClick={() => setShowInitOff(false)}>Cancel</Btn>
            <Btn type="submit" loading={submitting}>Initiate</Btn>
          </div>
        </form>
      </Modal>

      {/* View Offboarding Details Modal */}
      {viewOff && (
        <Modal open={!!viewOff} onClose={() => setViewOff(null)} title="Offboarding Details" width={560}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div><strong>Employee:</strong> {viewOff.employee?.first_name} {viewOff.employee?.last_name}</div>
              <div><strong>Last Working Date:</strong> {new Date(viewOff.last_working_date).toLocaleDateString()}</div>
              <div><strong>Status:</strong> <Badge variant="info">{viewOff.status}</Badge></div>
              <div><strong>Clearance:</strong> <Badge variant="warning">{viewOff.clearanceStatus}</Badge></div>
              <div style={{ gridColumn: '1 / -1' }}><strong>Notes:</strong> {viewOff.notes || '—'}</div>
              <div style={{ gridColumn: '1 / -1' }}><strong>Reason:</strong> {viewOff.reason || '—'}</div>
            </div>
          </div>
          
          <h4 style={{ marginBottom: 12, borderBottom: '1px solid var(--border-color)', paddingBottom: 6 }}>Clearance Tasks</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {viewOff.tasks?.length === 0 ? (
              <div style={{ fontSize: 13, color: 'var(--gray-500)' }}>No tasks generated.</div>
            ) : (
              viewOff.tasks?.map((task) => (
                <div
                  key={task.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px',
                    background: task.isCompleted ? 'rgba(16, 185, 129, 0.05)' : 'var(--bg)',
                    borderRadius: '6px',
                    border: `1px solid ${task.isCompleted ? 'var(--success)' : 'var(--border-color)'}`,
                  }}
                >
                  {task.isCompleted ? (
                    <CheckCircle2 size={18} color="var(--success)" />
                  ) : (
                    <button
                      onClick={() => handleOffCompleteTask(viewOff.id, task.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    >
                      <Circle size={18} color="var(--gray-500)" />
                    </button>
                  )}
                  <div style={{ flex: 1, fontSize: 13 }}>
                    <div style={{ fontWeight: 500, color: task.isCompleted ? 'var(--gray-500)' : 'var(--text-dark)', textDecoration: task.isCompleted ? 'line-through' : 'none' }}>
                      {task.title}
                    </div>
                    {task.description && <div style={{ fontSize: 11, color: 'var(--gray-500)' }}>{task.description}</div>}
                  </div>
                </div>
              ))
            )}
          </div>
          <div style={{ marginTop: 24, textAlign: 'right' }}>
            <Btn onClick={() => setViewOff(null)}>Close</Btn>
          </div>
        </Modal>
      )}
    </>
  );
}
