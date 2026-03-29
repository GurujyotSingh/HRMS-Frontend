import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { employeesAPI, perfAPI } from '../services/api';
import { Btn, Card, Modal, PageHeader, Select, Table, toast } from '../components/ui';

function Stars({ value }) {
  const v = Math.round(Number(value) || 0);
  return (
    <span style={{ color: '#C4922D', letterSpacing: 2 }}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i}>{i < v ? '★' : '☆'}</span>
      ))}
    </span>
  );
}

function statusBadge(s) {
  const map = {
    draft: 'badge-neutral',
    submitted: 'badge-warning',
    hod_reviewed: 'badge-info',
    finalized: 'badge-success',
  };
  return <span className={`badge ${map[s] || 'badge-neutral'}`}>{s}</span>;
}

export default function Performance() {
  const { hasRole } = useAuth();
  const [cycles, setCycles] = useState([]);
  const [tab, setTab] = useState('my');
  const [myGoals, setMyGoals] = useState([]);
  const [allGoals, setAllGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [empMap, setEmpMap] = useState({});
  const [goalModal, setGoalModal] = useState(null);
  const [reviewModal, setReviewModal] = useState(null);
  const [gForm, setGForm] = useState({ cycle_id: '', goals_text: '' });
  const [rForm, setRForm] = useState({ rating: 3, comments: '' });

  const cycleTitle = useMemo(() => {
    const m = {};
    cycles.forEach((c) => {
      m[c.id] = c.title;
    });
    return m;
  }, [cycles]);

  const loadCycles = useCallback(async () => {
    try {
      const { data } = await perfAPI.cycles();
      setCycles(data);
    } catch (e) {
      toast(e.response?.data?.detail || 'Failed to load cycles', 'error');
    }
  }, []);

  const loadNames = useCallback(async () => {
    if (!hasRole('hr')) return;
    try {
      const { data } = await employeesAPI.list();
      const m = {};
      (data || []).forEach((e) => {
        m[e.id] = `${e.first_name} ${e.last_name}`;
      });
      setEmpMap(m);
    } catch {
      /* HOD may not access employee list */
    }
  }, [hasRole]);

  const loadMy = useCallback(async () => {
    const { data } = await perfAPI.myGoals();
    setMyGoals(data);
  }, []);

  const loadAll = useCallback(async () => {
    if (hasRole('hr')) {
      const { data } = await perfAPI.allGoals({});
      setAllGoals(data);
      return;
    }
    if (hasRole('department_head')) {
      const { data } = await perfAPI.hodPending();
      setAllGoals(data);
    }
  }, [hasRole]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      await loadCycles();
      await loadMy();
      if (hasRole('hr', 'department_head') && tab === 'all') await loadAll();
      await loadNames();
    } catch (e) {
      toast(e.response?.data?.detail || 'Failed to load', 'error');
    } finally {
      setLoading(false);
    }
  }, [loadCycles, loadMy, loadAll, loadNames, hasRole, tab]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const rows = tab === 'my' ? myGoals : allGoals;

  const openReview = (mode, row) => {
    setReviewModal({ mode, row });
    setRForm({ rating: 3, comments: '' });
  };

  const saveReview = async () => {
    const { mode, row } = reviewModal;
    try {
      if (mode === 'self') {
        await perfAPI.selfRate(row.id, {
          self_rating: Number(rForm.rating),
          self_comments: rForm.comments || null,
        });
      } else if (mode === 'hod') {
        await perfAPI.hodReview(row.id, {
          hod_rating: Number(rForm.rating),
          hod_comments: rForm.comments || null,
        });
      } else if (mode === 'hr') {
        await perfAPI.hrFinalize(row.id, {
          final_rating: Number(rForm.rating),
          hr_comments: rForm.comments || null,
        });
      }
      toast('Saved', 'success');
      setReviewModal(null);
      refresh();
    } catch (e) {
      toast(e.response?.data?.detail || 'Save failed', 'error');
    }
  };

  const submitNewGoals = async () => {
    try {
      await perfAPI.submitGoals({
        cycle_id: Number(gForm.cycle_id),
        goals_text: gForm.goals_text,
      });
      toast('Goals created', 'success');
      setGoalModal(null);
      setGForm((f) => ({ ...f, goals_text: '' }));
      refresh();
    } catch (e) {
      toast(e.response?.data?.detail || 'Failed', 'error');
    }
  };

  const submitForHod = async (id) => {
    try {
      await perfAPI.submitGoal(id);
      toast('Submitted for HOD review', 'success');
      refresh();
    } catch (e) {
      toast(e.response?.data?.detail || 'Failed', 'error');
    }
  };

  const cols = [
    ...(tab === 'all'
      ? [
          {
            key: 'emp',
            label: 'Employee',
            render: (r) => empMap[r.employee_id] || `#${r.employee_id}`,
          },
        ]
      : []),
    {
      key: 'cycle',
      label: 'Cycle',
      render: (r) => cycleTitle[r.cycle_id] || `#${r.cycle_id}`,
    },
    { key: 'status', label: 'Status', render: (r) => statusBadge(r.status) },
    { key: 'self', label: 'Self', render: (r) => <Stars value={r.self_rating} /> },
    { key: 'hod', label: 'HOD', render: (r) => <Stars value={r.hod_rating} /> },
    {
      key: 'final',
      label: 'Final',
      render: (r) => (r.final_rating != null ? <Stars value={r.final_rating} /> : '—'),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (r) => (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {tab === 'my' && r.status === 'draft' && (
            <Btn size="sm" onClick={() => submitForHod(r.id)}>
              Submit goals
            </Btn>
          )}
          {tab === 'my' && (r.status === 'submitted' || r.status === 'draft') && r.self_rating == null && (
            <Btn size="sm" variant="secondary" onClick={() => openReview('self', r)}>
              Self-rate
            </Btn>
          )}
          {tab === 'all' && hasRole('department_head') && r.status === 'submitted' && (
            <Btn size="sm" onClick={() => openReview('hod', r)}>
              HOD review
            </Btn>
          )}
          {tab === 'all' && hasRole('hr') && r.status === 'hod_reviewed' && (
            <Btn size="sm" variant="success" onClick={() => openReview('hr', r)}>
              Finalize
            </Btn>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Performance"
        subtitle="Goals and appraisals"
        actions={
          <Btn
            onClick={() => {
              if (cycles.length) {
                const active = cycles.find((c) => c.status === 'active');
                setGForm((f) => ({
                  ...f,
                  cycle_id: String(active?.id || cycles[0].id),
                }));
              }
              setGoalModal(true);
            }}
          >
            Submit goals
          </Btn>
        }
      />

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        {cycles.map((c) => (
          <Card
            key={c.id}
            style={{
              minWidth: 220,
              borderLeft: '4px solid var(--terracotta)',
              padding: 16,
            }}
          >
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 18 }}>{c.title}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>{c.year}</div>
            <div style={{ marginTop: 8 }}>{statusBadge(c.status)}</div>
          </Card>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <Btn variant={tab === 'my' ? 'primary' : 'secondary'} onClick={() => setTab('my')}>
          My appraisals
        </Btn>
        {(hasRole('department_head') || hasRole('hr')) && (
          <Btn variant={tab === 'all' ? 'primary' : 'secondary'} onClick={() => setTab('all')}>
            All employees
          </Btn>
        )}
      </div>

      <Card style={{ padding: 0 }}>
        <Table cols={cols} rows={rows} loading={loading} emptyMsg="No goals" />
      </Card>

      <Modal open={!!goalModal} onClose={() => setGoalModal(null)} title="Submit goals" width={520}>
        <Select
          label="Cycle"
          value={gForm.cycle_id}
          onChange={(e) => setGForm((f) => ({ ...f, cycle_id: e.target.value }))}
        >
          {cycles.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title} ({c.year})
            </option>
          ))}
        </Select>
        <label style={{ display: 'block', marginBottom: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Goals</span>
          <textarea
            value={gForm.goals_text}
            onChange={(e) => setGForm((f) => ({ ...f, goals_text: e.target.value }))}
            rows={6}
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
          <Btn variant="secondary" onClick={() => setGoalModal(null)}>
            Cancel
          </Btn>
          <Btn onClick={submitNewGoals}>Save</Btn>
        </div>
      </Modal>

      <Modal open={!!reviewModal} onClose={() => setReviewModal(null)} title="Review" width={480}>
        {reviewModal && (
          <>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
              {reviewModal.row.goals_text}
            </p>
            <Select
              label="Rating (1–5)"
              value={String(rForm.rating)}
              onChange={(e) => setRForm((f) => ({ ...f, rating: e.target.value }))}
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </Select>
            <label style={{ display: 'block' }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Comments</span>
              <textarea
                value={rForm.comments}
                onChange={(e) => setRForm((f) => ({ ...f, comments: e.target.value }))}
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
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
              <Btn variant="secondary" onClick={() => setReviewModal(null)}>
                Cancel
              </Btn>
              <Btn onClick={saveReview}>Save</Btn>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
