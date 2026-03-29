import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { onboardAPI } from '../services/api';
import { Btn, Card, Input, Modal, PageHeader, Table, toast } from '../components/ui';

export default function Onboarding() {
  const { hasRole } = useAuth();
  const [mainTab, setMainTab] = useState('on');
  const [onRecords, setOnRecords] = useState([]);
  const [offRecords, setOffRecords] = useState([]);
  const [myRecord, setMyRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewTasks, setViewTasks] = useState(null);
  const [offModal, setOffModal] = useState(false);
  const [offForm, setOffForm] = useState({ employee_id: '', reason: '', last_working_date: '' });

  const loadHr = useCallback(async () => {
    if (!hasRole('admin', 'hr')) return;
    try {
      const [on, off] = await Promise.all([onboardAPI.allRecords(), onboardAPI.offAll()]);
      setOnRecords(on.data);
      setOffRecords(off.data);
    } catch (e) {
      toast(e.response?.data?.detail || 'Failed to load records', 'error');
    }
  }, [hasRole]);

  const loadMy = useCallback(async () => {
    try {
      const { data } = await onboardAPI.myRecord();
      setMyRecord(data);
    } catch {
      setMyRecord(null);
    }
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      if (hasRole('admin', 'hr')) await loadHr();
      if (!hasRole('admin', 'hr') || mainTab === 'on') await loadMy();
    } finally {
      setLoading(false);
    }
  }, [hasRole, loadHr, loadMy, mainTab]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const completeOnTask = async (taskId) => {
    try {
      await onboardAPI.completeTask(taskId);
      toast('Task completed', 'success');
      loadMy();
      loadHr();
    } catch (e) {
      toast(e.response?.data?.detail || 'Failed', 'error');
    }
  };

  const completeOffTask = async (recordId, taskId) => {
    try {
      await onboardAPI.offCompleteTask(recordId, taskId);
      toast('Offboarding task done', 'success');
      loadHr();
    } catch (e) {
      toast(e.response?.data?.detail || 'Failed', 'error');
    }
  };

  const submitOff = async () => {
    try {
      await onboardAPI.offInitiate({
        employee_id: Number(offForm.employee_id),
        reason: offForm.reason || null,
        last_working_date: offForm.last_working_date || null,
      });
      toast('Offboarding initiated', 'success');
      setOffModal(false);
      loadHr();
    } catch (e) {
      toast(e.response?.data?.detail || 'Failed', 'error');
    }
  };

  const onCols = [
    { key: 'employee_id', label: 'Employee', render: (r) => `#${r.employee_id}` },
    { key: 'status', label: 'Status', render: (r) => <span className="badge badge-info">{r.status}</span> },
    {
      key: 'started',
      label: 'Started',
      render: (r) => new Date(r.started_at).toLocaleDateString('en-IN'),
    },
    {
      key: 'completed',
      label: 'Completed',
      render: (r) => (r.completed_at ? new Date(r.completed_at).toLocaleDateString('en-IN') : '—'),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (r) => (
        <Btn size="sm" variant="secondary" onClick={() => setViewTasks({ type: 'on', record: r })}>
          View tasks
        </Btn>
      ),
    },
  ];

  const offCols = [
    { key: 'employee_id', label: 'Employee', render: (r) => `#${r.employee_id}` },
    { key: 'status', label: 'Status', render: (r) => <span className="badge badge-info">{r.status}</span> },
    {
      key: 'initiated',
      label: 'Started',
      render: (r) => new Date(r.initiated_at).toLocaleDateString('en-IN'),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (r) => (
        <Btn size="sm" variant="secondary" onClick={() => setViewTasks({ type: 'off', record: r })}>
          View tasks
        </Btn>
      ),
    },
  ];

  const tasks = myRecord?.tasks || [];
  const doneCount = tasks.filter((t) => t.is_completed).length;
  const progress = tasks.length ? Math.round((doneCount / tasks.length) * 100) : 0;

  return (
    <div>
      <PageHeader
        title="Onboarding"
        subtitle="Checklists and offboarding"
        actions={
          hasRole('admin', 'hr') ? (
            <Btn onClick={() => setOffModal(true)}>Initiate offboarding</Btn>
          ) : null
        }
      />

      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <Btn variant={mainTab === 'on' ? 'primary' : 'secondary'} onClick={() => setMainTab('on')}>
          Onboarding
        </Btn>
        <Btn variant={mainTab === 'off' ? 'primary' : 'secondary'} onClick={() => setMainTab('off')}>
          Offboarding
        </Btn>
      </div>

      {hasRole('admin', 'hr') && mainTab === 'on' && (
        <Card style={{ padding: 0, marginBottom: 24 }}>
          <Table cols={onCols} rows={onRecords} loading={loading} emptyMsg="No onboarding records" />
        </Card>
      )}

      {hasRole('admin', 'hr') && mainTab === 'off' && (
        <Card style={{ padding: 0, marginBottom: 24 }}>
          <Table cols={offCols} rows={offRecords} loading={loading} emptyMsg="No offboarding records" />
        </Card>
      )}

      {mainTab === 'on' && (
        <Card>
          <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: 12 }}>My onboarding</h3>
          {!myRecord ? (
            <p style={{ color: 'var(--text-muted)' }}>No onboarding record assigned.</p>
          ) : (
            <>
              <p style={{ color: 'var(--text-secondary)' }}>
                {doneCount}/{tasks.length} tasks completed
              </p>
              <div
                style={{
                  height: 8,
                  background: 'var(--surface-2)',
                  borderRadius: 4,
                  overflow: 'hidden',
                  marginBottom: 20,
                }}
              >
                <div style={{ width: `${progress}%`, height: '100%', background: 'var(--sage)' }} />
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {tasks.map((t) => (
                  <li
                    key={t.id}
                    style={{
                      padding: '14px 16px',
                      marginBottom: 10,
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border)',
                      background: t.is_completed ? 'var(--success-light)' : 'var(--surface)',
                      textDecoration: t.is_completed ? 'line-through' : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                      <span style={{ fontSize: 18 }}>{t.is_completed ? '✓' : '○'}</span>
                      <div style={{ flex: 1 }}>
                        <strong>{t.title}</strong>
                        {t.description && (
                          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                            {t.description}
                          </div>
                        )}
                      </div>
                      {!t.is_completed && (
                        <Btn size="sm" variant="success" onClick={() => completeOnTask(t.id)}>
                          Mark done
                        </Btn>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>
      )}

      {mainTab === 'off' && !hasRole('admin', 'hr') && (
        <Card>
          <p style={{ color: 'var(--text-muted)' }}>
            Offboarding is managed by HR. Contact HR for status updates.
          </p>
        </Card>
      )}

      <Modal
        open={!!viewTasks}
        onClose={() => setViewTasks(null)}
        title={viewTasks?.type === 'off' ? 'Offboarding tasks' : 'Onboarding tasks'}
        width={520}
      >
        {viewTasks && (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {(viewTasks.record.tasks || []).map((t) => (
              <li
                key={t.id}
                style={{
                  padding: 12,
                  marginBottom: 8,
                  background: t.is_completed ? 'var(--success-light)' : 'var(--surface-2)',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <strong>{t.title}</strong>
                {viewTasks.type === 'off' && hasRole('admin', 'hr') && !t.is_completed && (
                  <Btn
                    size="sm"
                    style={{ marginLeft: 12 }}
                    onClick={() => completeOffTask(viewTasks.record.id, t.id)}
                  >
                    Complete
                  </Btn>
                )}
                {viewTasks.type === 'on' && hasRole('admin', 'hr') && !t.is_completed && (
                  <span style={{ marginLeft: 12, fontSize: 12, color: 'var(--text-muted)' }}>
                    Employee marks complete
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </Modal>

      <Modal open={offModal} onClose={() => setOffModal(false)} title="Initiate offboarding">
        <Input
          label="Employee ID (numeric)"
          value={offForm.employee_id}
          onChange={(e) => setOffForm((f) => ({ ...f, employee_id: e.target.value }))}
        />
        <Input
          label="Last working date"
          type="datetime-local"
          value={offForm.last_working_date}
          onChange={(e) => setOffForm((f) => ({ ...f, last_working_date: e.target.value }))}
        />
        <label style={{ display: 'block', marginBottom: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Reason</span>
          <textarea
            value={offForm.reason}
            onChange={(e) => setOffForm((f) => ({ ...f, reason: e.target.value }))}
            rows={3}
            style={{
              width: '100%',
              marginTop: 6,
              padding: 10,
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)',
              fontFamily: 'var(--font-body)',
            }}
          />
        </label>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <Btn variant="secondary" onClick={() => setOffModal(false)}>
            Cancel
          </Btn>
          <Btn onClick={submitOff}>Submit</Btn>
        </div>
      </Modal>
    </div>
  );
}
