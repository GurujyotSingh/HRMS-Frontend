import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { differenceInCalendarDays } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { leaveBalanceAPI, leavesAPI } from '../services/api';
import { Btn, Card, Input, Modal, PageHeader, Select, Table, toast } from '../components/ui';

const LEAVE_TYPES = ['casual', 'sick', 'earned', 'unpaid'];

function statusBadge(status) {
  const map = {
    pending: 'badge-warning',
    approved_by_hod: 'badge-info',
    approved: 'badge-success',
    rejected: 'badge-danger',
    cancelled: 'badge-neutral',
  };
  const cls = map[status] || 'badge-neutral';
  return <span className={`badge ${cls}`}>{String(status).replace(/_/g, ' ')}</span>;
}

export default function Leaves() {
  const { hasRole } = useAuth();
  const [tab, setTab] = useState('my');
  const [myRows, setMyRows] = useState([]);
  const [allRows, setAllRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [balances, setBalances] = useState([]);
  const [applyOpen, setApplyOpen] = useState(false);
  const [apply, setApply] = useState({
    leave_type: 'casual',
    start_date: '',
    end_date: '',
    reason: '',
  });

  const canSeeAll = hasRole('admin', 'hr', 'department_head');

  const loadBalances = useCallback(async () => {
    try {
      const { data } = await leaveBalanceAPI.myBalance();
      setBalances(data);
    } catch {
      setBalances([]);
    }
  }, []);

  const loadMy = useCallback(async () => {
    const { data } = await leavesAPI.myLeaves();
    setMyRows(data);
  }, []);

  const loadAll = useCallback(async () => {
    if (hasRole('hr')) {
      const { data } = await leavesAPI.hrAll();
      setAllRows(data);
      return;
    }
    if (hasRole('admin')) {
      try {
        const { data } = await leavesAPI.adminQueue();
        setAllRows(data);
      } catch {
        setAllRows([]);
      }
      return;
    }
    if (hasRole('department_head')) {
      const { data } = await leavesAPI.hodPending();
      setAllRows(data);
    }
  }, [hasRole]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([loadMy(), loadBalances(), canSeeAll ? loadAll() : Promise.resolve()]);
    } catch (e) {
      toast(e.response?.data?.detail || 'Failed to load leaves', 'error');
    } finally {
      setLoading(false);
    }
  }, [loadMy, loadAll, loadBalances, canSeeAll]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const daysPreview = useMemo(() => {
    if (!apply.start_date || !apply.end_date) return null;
    const a = new Date(apply.start_date);
    const b = new Date(apply.end_date);
    if (b < a) return null;
    return differenceInCalendarDays(b, a) + 1;
  }, [apply.start_date, apply.end_date]);

  const submitApply = async () => {
    try {
      await leavesAPI.apply({
        leave_type: apply.leave_type,
        start_date: apply.start_date,
        end_date: apply.end_date,
        reason: apply.reason,
      });
      toast('Leave applied', 'success');
      setApplyOpen(false);
      refresh();
    } catch (e) {
      toast(e.response?.data?.detail || 'Apply failed', 'error');
    }
  };

  const tableRows = tab === 'my' ? myRows : allRows;

  const cols = [
    ...(tab === 'all'
      ? [
          {
            key: 'employee_id',
            label: 'Employee',
            render: (r) => `ID ${r.employee_id}`,
          },
        ]
      : []),
    { key: 'leave_type', label: 'Type', render: (r) => String(r.leave_type) },
    {
      key: 'dates',
      label: 'Dates',
      render: (r) =>
        `${new Date(r.start_date).toLocaleDateString('en-IN')} – ${new Date(
          r.end_date
        ).toLocaleDateString('en-IN')}`,
    },
    {
      key: 'days',
      label: 'Days',
      render: (r) =>
        differenceInCalendarDays(new Date(r.end_date), new Date(r.start_date)) + 1,
    },
    { key: 'reason', label: 'Reason', render: (r) => (r.reason || '').slice(0, 60) },
    { key: 'status', label: 'Status', render: (r) => statusBadge(r.status) },
    {
      key: 'actions',
      label: 'Actions',
      render: (r) => (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {hasRole('department_head') && r.status === 'pending' && tab === 'all' && (
            <>
              <Btn size="sm" variant="success" onClick={() => hodAct(r.id, 'approve')}>
                Approve
              </Btn>
              <Btn size="sm" variant="danger" onClick={() => hodAct(r.id, 'reject')}>
                Reject
              </Btn>
            </>
          )}
          {hasRole('hr') && r.status === 'approved_by_hod' && tab === 'all' && (
            <>
              <Btn size="sm" variant="success" onClick={() => hrAct(r.id, 'approve')}>
                Approve
              </Btn>
              <Btn size="sm" variant="danger" onClick={() => hrAct(r.id, 'reject')}>
                Reject
              </Btn>
            </>
          )}
          {hasRole('admin') && tab === 'all' && r.status === 'pending' && (
            <>
              <Btn size="sm" variant="success" onClick={() => adminAct(r.id, 'approve')}>
                Approve
              </Btn>
              <Btn size="sm" variant="danger" onClick={() => adminAct(r.id, 'reject')}>
                Reject
              </Btn>
            </>
          )}
          {tab === 'my' && r.status === 'pending' && (
            <Btn size="sm" variant="secondary" onClick={() => cancelLeave(r.id)}>
              Cancel
            </Btn>
          )}
        </div>
      ),
    },
  ];

  async function hodAct(id, side) {
    try {
      if (side === 'approve') await leavesAPI.hodApprove(id);
      else await leavesAPI.hodReject(id);
      toast(side === 'approve' ? 'Approved (HOD)' : 'Rejected (HOD)', 'success');
      refresh();
    } catch (e) {
      toast(e.response?.data?.detail || 'Action failed', 'error');
    }
  }

  async function hrAct(id, action) {
    try {
      await leavesAPI.hrProcess(id, action);
      toast(action === 'approve' ? 'Approved (HR)' : 'Rejected (HR)', 'success');
      refresh();
    } catch (e) {
      toast(e.response?.data?.detail || 'Action failed', 'error');
    }
  }

  async function adminAct(id, action) {
    try {
      await leavesAPI.adminProcess(id, action);
      toast(action === 'approve' ? 'Approved (Admin)' : 'Rejected (Admin)', 'success');
      refresh();
    } catch (e) {
      toast(e.response?.data?.detail || 'Action failed', 'error');
    }
  }

  async function cancelLeave(id) {
    try {
      await leavesAPI.cancel(id);
      toast('Leave cancelled', 'success');
      refresh();
    } catch (e) {
      toast(e.response?.data?.detail || 'Cancel failed', 'error');
    }
  }

  return (
    <div>
      <PageHeader title="Leave" subtitle="Balances, requests, and approvals" />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        {balances.map((b) => (
          <Card key={b.leave_type} style={{ minWidth: 160, padding: 16 }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'capitalize' }}>
              {b.leave_type}
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, marginTop: 4 }}>
              {b.remaining_days}
              <span style={{ fontSize: 14, color: 'var(--text-muted)' }}> / {b.total_days}</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>remaining / total</div>
          </Card>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <Btn variant={tab === 'my' ? 'primary' : 'secondary'} onClick={() => setTab('my')}>
          My Leaves
        </Btn>
        {canSeeAll && (
          <Btn variant={tab === 'all' ? 'primary' : 'secondary'} onClick={() => setTab('all')}>
            {hasRole('department_head') && !hasRole('hr', 'admin')
              ? 'Team pending'
              : 'All employees'}
          </Btn>
        )}
        <Btn variant="success" onClick={() => setApplyOpen(true)}>
          Apply leave
        </Btn>
      </div>

      <Card style={{ padding: 0 }}>
        <Table cols={cols} rows={tableRows} loading={loading} emptyMsg="No leave records" />
      </Card>

      <Modal open={applyOpen} onClose={() => setApplyOpen(false)} title="Apply for leave">
        <Select
          label="Leave type"
          value={apply.leave_type}
          onChange={(e) => setApply((a) => ({ ...a, leave_type: e.target.value }))}
        >
          {LEAVE_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </Select>
        <Input
          label="Start date"
          type="date"
          value={apply.start_date}
          onChange={(e) => setApply((a) => ({ ...a, start_date: e.target.value }))}
        />
        <Input
          label="End date"
          type="date"
          value={apply.end_date}
          onChange={(e) => setApply((a) => ({ ...a, end_date: e.target.value }))}
        />
        {daysPreview != null && (
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Working days (inclusive): {daysPreview}</p>
        )}
        <label style={{ display: 'block', marginBottom: 12 }}>
          <span
            style={{
              display: 'block',
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--text-secondary)',
              marginBottom: 6,
            }}
          >
            Reason
          </span>
          <textarea
            value={apply.reason}
            onChange={(e) => setApply((a) => ({ ...a, reason: e.target.value }))}
            rows={3}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)',
              fontFamily: 'var(--font-body)',
            }}
          />
        </label>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <Btn variant="secondary" onClick={() => setApplyOpen(false)}>
            Close
          </Btn>
          <Btn onClick={submitApply}>Submit</Btn>
        </div>
      </Modal>
    </div>
  );
}
