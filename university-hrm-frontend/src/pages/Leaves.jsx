import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { leavesAPI, aiAPI } from '../services/api';
import {
  PageHeader, Card, Table, Btn, Modal, Input, Select, Textarea, Badge, Tabs, toast, StatCard,
} from '../components/ui';
import { formatDistanceToNow } from 'date-fns';
import { Plus, X, Check, Edit2, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import LeaveApplicationWizard from '../components/leaves/LeaveApplicationWizard';
import LeaveProcessingWizard from '../components/leaves/LeaveProcessingWizard';

const STATUS_BADGE = {
  PENDING:   { variant: 'warning', label: 'Pending' },
  APPROVED:  { variant: 'success', label: 'Approved' },
  REJECTED:  { variant: 'danger',  label: 'Rejected' },
  CANCELLED: { variant: 'neutral', label: 'Cancelled' },
};

const LEAVE_TYPES = [
  { value: 'ANNUAL',       label: 'Annual' },
  { value: 'SICK',         label: 'Sick' },
  { value: 'CASUAL',       label: 'Casual' },
  { value: 'MATERNITY',    label: 'Maternity' },
  { value: 'PATERNITY',    label: 'Paternity' },
  { value: 'UNPAID',       label: 'Unpaid' },
  { value: 'COMPENSATORY', label: 'Compensatory' },
  { value: 'SABBATICAL',   label: 'Sabbatical' },
  { value: 'EXAM_DUTY',    label: 'Exam Duty' },
];

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const PAGE_SIZE = 25; 

export default function Leaves() {
  const { hasRole } = useAuth();

  const [tab, setTab]           = useState('my');
  const [myLeaves, setMyLeaves] = useState([]);
  const [allLeaves, setAllLeaves] = useState([]);
  const [balances, setBalances] = useState(null);
  const [loading, setLoading]   = useState(true);

  const [myPage, setMyPage]   = useState(1);
  const [allPage, setAllPage] = useState(1);
  const [myTotal, setMyTotal] = useState(0);
  const [allTotal, setAllTotal] = useState(0);

  const [showApply, setShowApply]   = useState(false);
  const [editLeave, setEditLeave]   = useState(null);

  const abortRef = useRef(null); 

  const isHR       = hasRole('admin', 'hr', 'hr_staff');
  const isDirector = hasRole('director');
  const isAdmin    = hasRole('admin');
  const canManage  = isHR || isDirector || isAdmin;

  const tabs = [
    { key: 'my', label: 'My Leaves' },
    ...(canManage ? [{ key: 'manage', label: isHR ? 'All Requests' : 'Team Requests' }] : []),
  ];

  const loadData = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    setLoading(true);
    try {
      const balRes = await leavesAPI.balance().catch(() => ({ data: null }));
      setBalances(balRes.data);

      if (tab === 'my') {
        const { data: myRes } = await leavesAPI.list({
          limit: PAGE_SIZE,
          skip: (myPage - 1) * PAGE_SIZE,
        });
        const items = myRes?.data?.items || myRes?.items || myRes?.data || (Array.isArray(myRes) ? myRes : []);
        setMyLeaves(items);
        setMyTotal(myRes?.data?.total || myRes?.total || items.length);
      } else if (tab === 'manage' && canManage) {
        const endpoint = isHR ? leavesAPI.hrAll : leavesAPI.hodPending;
        const { data } = await endpoint({
          limit: PAGE_SIZE,
          skip: (allPage - 1) * PAGE_SIZE,
          status: 'PENDING', 
        });
        const items = data?.data?.items || data?.items || data?.data || (Array.isArray(data) ? data : []);
        setAllLeaves(items);
        setAllTotal(data?.data?.total || data?.total || items.length);
      }
    } catch (e) {
      if (e.name !== 'CanceledError' && e.code !== 'ERR_CANCELED') {
        toast(e.response?.data?.message || 'Failed to load leave data', 'error');
      }
    } finally {
      setLoading(false);
    }
  }, [tab, myPage, allPage, canManage, isHR]);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => { setMyPage(1); setAllPage(1); }, [tab]);

  // ── Handlers ───────────────────────────────────────────────────────

  const handleCancel = async (id) => {
    try {
      await leavesAPI.cancel(id);
      toast('Leave cancelled', 'success');
      loadData();
    } catch (e) {
      toast(e.response?.data?.message || 'Failed to cancel', 'error');
    }
  };

  const handleAction = async (leaveId, action) => {
    try {
      await leavesAPI.hrProcess(leaveId, action.toLowerCase());
      toast(`Leave ${action === 'APPROVE' ? 'approved' : 'rejected'}`, 'success');
      loadData();
    } catch (e) {
      toast(e.response?.data?.detail || `Failed to ${action}`, 'error');
    }
  };

  // ── Leave balance cards ─────────────────────────────────────────────

  const BalanceCards = () => {
    if (!balances || !Array.isArray(balances)) return null;

    const getBal = (type) => balances.find(b => (b.leave_type || '').toUpperCase() === type) || { total_days: 0, used_days: 0 };

    const types = [
      { key: 'annual',       label: 'Annual',   total: getBal('ANNUAL').total_days,        used: getBal('ANNUAL').used_days },
      { key: 'sick',         label: 'Sick',     total: getBal('SICK').total_days,          used: getBal('SICK').used_days },
      { key: 'casual',       label: 'Casual',   total: getBal('CASUAL').total_days,        used: getBal('CASUAL').used_days },
      { key: 'compensatory', label: 'Comp Off', total: getBal('COMPENSATORY').total_days,  used: getBal('COMPENSATORY').used_days },
    ].filter(t => t.total > 0);

    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 24 }}>
        {types.map((t) => {
          const remaining = t.total - t.used;
          return (
            <StatCard 
              key={t.key} 
              label={t.label} 
              value={remaining} 
              sub={`/ ${t.total} left`} 
              color={remaining <= 2 ? 'var(--danger)' : 'var(--primary)'} 
            />
          );
        })}
      </div>
    );
  };

  // ── Table columns ──────────────────────────────────────────────────

  const typeCol = {
    key: 'leave_type', label: 'Type',
    render: (r) => <span style={{ textTransform: 'capitalize', fontWeight: 500 }}>{(r.leave_type || '').toLowerCase()}</span>,
  };
  const statusCol = {
    key: 'status', label: 'Status',
    render: (r) => {
      const s = STATUS_BADGE[r.status] || STATUS_BADGE.PENDING;
      return <Badge variant={s.variant}>{s.label}</Badge>;
    },
  };

  const myCols = [
    typeCol,
    { key: 'from_date', label: 'From',   render: (r) => fmtDate(r.from_date) },
    { key: 'to_date',   label: 'To',     render: (r) => fmtDate(r.to_date) },
    { key: 'total_days',label: 'Days',   render: (r) => r.total_days ?? '—' },
    { key: 'applied_at', label: 'Requested', render: (r) => r.applied_at ? formatDistanceToNow(new Date(r.applied_at), { addSuffix: true }) : '—' },
    { key: 'reason',   label: 'Reason', render: (r) => <span style={{ maxWidth: 180, display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.reason}>{r.reason}</span> },
    statusCol,
    { key: 'act', label: '', render: (r) =>
      r.status === 'PENDING' ? (
        <Btn variant="ghost" size="xs" onClick={() => handleCancel(r.id)} style={{ color: 'var(--danger)' }}>
          <X size={14} /> Cancel
        </Btn>
      ) : null,
    },
  ];

  const manageCols = [
    { key: 'emp', label: 'Employee', render: (r) => `${r.employee?.first_name || ''} ${r.employee?.last_name || ''}` },
    typeCol,
    { key: 'from_date', label: 'From', render: (r) => fmtDate(r.from_date) },
    { key: 'to_date',   label: 'To',   render: (r) => fmtDate(r.to_date) },
    { key: 'total_days',label: 'Days', render: (r) => r.total_days ?? '—' },
    { key: 'applied_at', label: 'Requested', render: (r) => r.applied_at ? formatDistanceToNow(new Date(r.applied_at), { addSuffix: true }) : '—' },
    { key: 'reason',   label: 'Reason', render: (r) => <span style={{ maxWidth: 180, display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.reason}>{r.reason}</span> },
    statusCol,
    { key: 'act', label: 'Actions', render: (r) => {
      if (r.status !== 'PENDING') return null;
      return (
        <div style={{ display: 'flex', gap: 6 }}>
          <Btn variant="success" size="xs" onClick={() => handleAction(r.id, 'APPROVE')}>
            <Check size={13} /> Approve
          </Btn>
          <Btn variant="danger" size="xs" onClick={() => handleAction(r.id, 'REJECT')}>
            <X size={13} /> Reject
          </Btn>
          {isHR && (
            <Btn variant="secondary" size="xs" onClick={() => setEditLeave(r)}>
              <Edit2 size={13} />
            </Btn>
          )}
        </div>
      );
    }},
  ];

  // ── Pagination bar ──────────────────────────────────────────────────
  const myTotalPages  = Math.max(1, Math.ceil(myTotal  / PAGE_SIZE));
  const allTotalPages = Math.max(1, Math.ceil(allTotal / PAGE_SIZE));

  const PaginationBar = ({ page, setPage, totalPages, total }) => totalPages <= 1 ? null : (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', borderTop: '1px solid var(--gray-200)', fontSize: 13 }}>
      <span style={{ color: 'var(--gray-500)' }}>
        Page <strong>{page}</strong> of <strong>{totalPages}</strong>
        {total > 0 && <> &nbsp;({total} total)</>}
      </span>
      <div style={{ display: 'flex', gap: 6 }}>
        <Btn variant="secondary" size="xs" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
          <ChevronLeft size={13} /> Prev
        </Btn>
        <Btn variant="secondary" size="xs" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
          Next <ChevronRight size={13} />
        </Btn>
      </div>
    </div>
  );

  return (
    <>
      <PageHeader
        title="Leave Management"
        subtitle="Apply for leave and manage requests"
        actions={
          <Btn onClick={() => setShowApply(true)}>
            <Plus size={16} /> Apply Leave
          </Btn>
        }
      />

      <BalanceCards />

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px 0' }}>
          <Tabs tabs={tabs} active={tab} onChange={setTab} />
        </div>
        <div style={{ position: 'relative' }}>
          {loading && (tab === 'my' ? myLeaves : allLeaves).length > 0 && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
              <span style={{ fontSize: 13, color: 'var(--gray-500)' }}>Loading…</span>
            </div>
          )}
          {tab === 'my'     && <Table cols={myCols}    rows={myLeaves}  loading={loading && myLeaves.length === 0}  emptyMsg="No leave records" />}
          {tab === 'manage' && <Table cols={manageCols} rows={allLeaves} loading={loading && allLeaves.length === 0} emptyMsg="No pending requests" />}
        </div>
        {tab === 'my'     && <PaginationBar page={myPage}  setPage={setMyPage}  totalPages={myTotalPages}  total={myTotal} />}
        {tab === 'manage' && <PaginationBar page={allPage} setPage={setAllPage} totalPages={allTotalPages} total={allTotal} />}
      </Card>

      {/* ── Wizard Component ── */}
      <LeaveApplicationWizard 
        open={showApply} 
        onClose={() => setShowApply(false)} 
        onSuccess={() => { setShowApply(false); setMyPage(1); loadData(); }} 
        balances={balances} 
      />

      {/* ── HR Edit Modal ── */}
      <LeaveProcessingWizard 
        open={!!editLeave} 
        leaveRequest={editLeave} 
        onClose={() => setEditLeave(null)} 
        onSuccess={() => { setEditLeave(null); loadData(); }} 
      />
    </>
  );
}
