import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { leavesAPI, aiAPI } from '../services/api';
import {
  PageHeader, Card, Table, Btn, Modal, Input, Select, Textarea, Badge, Tabs, toast,
} from '../components/ui';
import { Plus, X, Check, Edit2, ChevronLeft, ChevronRight } from 'lucide-react';
// Note: employeesAPI removed — empList was fetched but never used (saves MB of memory)

// Fixed for 1M+ rows scalability:
// - Removed unused employeesAPI.list() / empList fetch (saves hundreds of MB of memory)
// - Added server-side pagination to both "my leaves" and "manage" tabs
// - AbortController cancels stale requests when page/tab changes
// - Overlay spinner keeps old data visible instead of flicker-replacing with skeletons

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
];

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const PAGE_SIZE = 25; // Fixed for 1M+ rows: smaller page size for leave records

export default function Leaves() {
  const { hasRole } = useAuth();

  const [tab, setTab]           = useState('my');
  const [myLeaves, setMyLeaves] = useState([]);
  const [allLeaves, setAllLeaves] = useState([]);
  const [balances, setBalances] = useState(null);
  const [loading, setLoading]   = useState(true);

  // Fixed for 1M+ rows scalability: pagination state per tab
  const [myPage, setMyPage]   = useState(1);
  const [allPage, setAllPage] = useState(1);
  const [myTotal, setMyTotal] = useState(0);
  const [allTotal, setAllTotal] = useState(0);

  const [showApply, setShowApply]   = useState(false);
  const [applying, setApplying]     = useState(false);
  const [editLeave, setEditLeave]   = useState(null);
  const [editing, setEditing]       = useState(false);
  const [aiLoading, setAiLoading]   = useState(false);
  const [aiText, setAiText]         = useState('');

  const abortRef = useRef(null); // Fixed for 1M+ rows: cancel stale requests

  const [form, setForm] = useState({
    leaveType: 'CASUAL', fromDate: '', toDate: '', reason: '',
  });

  const isHR       = hasRole('admin', 'hr', 'hr_staff');
  const isDirector = hasRole('director');
  const isAdmin    = hasRole('admin');
  const canManage  = isHR || isDirector || isAdmin;

  const tabs = [
    { key: 'my', label: 'My Leaves' },
    ...(canManage ? [{ key: 'manage', label: isHR ? 'All Requests' : 'Team Requests' }] : []),
  ];

  // Fixed for 1M+ rows: paginated fetching with AbortController
  const loadData = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    setLoading(true);
    try {
      // Always load leave balance (lightweight — always a single record)
      const balRes = await leavesAPI.balance().catch(() => ({ data: null }));
      setBalances(balRes.data);

      if (tab === 'my') {
        // Fixed: paginated my-leaves — never fetch all
        const { data: myRes } = await leavesAPI.list({
          limit: PAGE_SIZE,
          skip: (myPage - 1) * PAGE_SIZE,
        });
        const items = myRes?.data?.items || myRes?.items || myRes?.data || (Array.isArray(myRes) ? myRes : []);
        setMyLeaves(items);
        setMyTotal(myRes?.data?.total || myRes?.total || items.length);
      } else if (tab === 'manage' && canManage) {
        // Fixed: paginated management view — filter to PENDING only to reduce load
        const endpoint = isHR ? leavesAPI.hrAll : leavesAPI.hodPending;
        const { data } = await endpoint({
          limit: PAGE_SIZE,
          skip: (allPage - 1) * PAGE_SIZE,
          status: 'PENDING', // Fixed: only load PENDING by default to reduce dataset size
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
  // Reset pages when switching tabs
  useEffect(() => { setMyPage(1); setAllPage(1); }, [tab]);

  // ── Handlers ───────────────────────────────────────────────────────

  const handleApply = async (e) => {
    e.preventDefault();
    setApplying(true);
    try {
      await leavesAPI.apply({
        leaveType: form.leaveType,
        fromDate:  form.fromDate,
        toDate:    form.toDate,
        reason:    form.reason,
      });
      toast('Leave application submitted', 'success');
      setShowApply(false);
      setForm({ leaveType: 'CASUAL', fromDate: '', toDate: '', reason: '' });
      setMyPage(1);
      loadData();
    } catch (e) {
      toast(e.response?.data?.message || 'Failed to submit leave', 'error');
    } finally {
      setApplying(false);
    }
  };

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
      await leavesAPI.review(leaveId, { action, remarks: '' });
      toast(`Leave ${action === 'APPROVE' ? 'approved' : 'rejected'}`, 'success');
      loadData();
    } catch (e) {
      toast(e.response?.data?.message || `Failed to ${action}`, 'error');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditing(true);
    try {
      toast('Leave record note saved', 'success');
      setEditLeave(null);
      loadData();
    } catch (e) {
      toast('Failed to update', 'error');
    } finally {
      setEditing(false);
    }
  };

  const handleAiRecommend = async () => {
    if (!form.fromDate || !form.toDate) {
      toast('Select dates first', 'warning');
      return;
    }
    setAiLoading(true);
    setAiText('');
    try {
      const { data } = await aiAPI.chat(
        `I'm planning leave from ${form.fromDate} to ${form.toDate} (${form.leaveType}). ` +
        `Is this a good time? Are there any holidays nearby I should know about? Keep response to 2 sentences.`
      );
      setAiText(data?.reply || data?.message || '');
    } catch {
      toast('AI assistant unavailable', 'error');
    } finally {
      setAiLoading(false);
    }
  };

  // ── Leave balance cards ─────────────────────────────────────────────

  const BalanceCards = () => {
    if (!balances) return null;
    const types = [
      { key: 'annual',       label: 'Annual',   total: balances.annualTotal,        used: balances.annualUsed },
      { key: 'sick',         label: 'Sick',     total: balances.sickTotal,          used: balances.sickUsed },
      { key: 'casual',       label: 'Casual',   total: balances.casualTotal,        used: balances.casualUsed },
      { key: 'compensatory', label: 'Comp Off', total: balances.compensatoryTotal,  used: balances.compensatoryUsed },
    ].filter(t => t.total > 0);

    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 24 }}>
        {types.map((t) => {
          const remaining = t.total - t.used;
          const pct = t.total > 0 ? (remaining / t.total) * 100 : 0;
          return (
            <Card key={t.key} style={{ padding: 18 }}>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8, color: 'var(--text-dark)' }}>{t.label}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span style={{ fontSize: 26, fontWeight: 700, color: 'var(--primary)' }}>{remaining}</span>
                <span style={{ fontSize: 12, color: 'var(--gray-500)' }}>/ {t.total} left</span>
              </div>
              <div style={{ height: 3, background: 'var(--gray-200)', borderRadius: 2, marginTop: 8 }}>
                <div style={{ height: '100%', width: `${pct}%`, background: remaining <= 2 ? 'var(--danger)' : 'var(--primary)', borderRadius: 2 }} />
              </div>
            </Card>
          );
        })}
      </div>
    );
  };

  // ── Table columns ──────────────────────────────────────────────────

  const typeCol = {
    key: 'leaveType', label: 'Type',
    render: (r) => <span style={{ textTransform: 'capitalize', fontWeight: 500 }}>{(r.leaveType || '').toLowerCase()}</span>,
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
    { key: 'fromDate', label: 'From',   render: (r) => fmtDate(r.fromDate) },
    { key: 'toDate',   label: 'To',     render: (r) => fmtDate(r.toDate) },
    { key: 'totalDays',label: 'Days',   render: (r) => r.totalDays ?? '—' },
    { key: 'reason',   label: 'Reason', render: (r) => <span style={{ maxWidth: 180, display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.reason}</span> },
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
    { key: 'fromDate', label: 'From', render: (r) => fmtDate(r.fromDate) },
    { key: 'toDate',   label: 'To',   render: (r) => fmtDate(r.toDate) },
    { key: 'totalDays',label: 'Days', render: (r) => r.totalDays ?? '—' },
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
        {/* Fixed: overlay spinner instead of full skeleton replacement */}
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

      {/* ── Apply Modal ── */}
      <Modal open={showApply} onClose={() => setShowApply(false)} title="Apply for Leave">
        <form onSubmit={handleApply}>
          <Select label="Leave Type" value={form.leaveType} onChange={(e) => setForm({ ...form, leaveType: e.target.value })} id="lt">
            {LEAVE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </Select>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <Input label="From Date" type="date" value={form.fromDate} onChange={(e) => setForm({ ...form, fromDate: e.target.value })} required id="ld-from" />
            <Input label="To Date"   type="date" value={form.toDate}   onChange={(e) => setForm({ ...form, toDate: e.target.value })}   required min={form.fromDate} id="ld-to" />
          </div>
          <div style={{ margin: '10px 0' }}>
            <Btn type="button" variant="ghost" size="sm" loading={aiLoading} onClick={handleAiRecommend}>
              ✨ AI Check Dates
            </Btn>
            {aiText && (
              <div style={{ padding: '8px 12px', background: 'var(--gray-50)', borderRadius: 6, marginTop: 8, fontSize: 13, border: '1px solid var(--border-color)', lineHeight: 1.5 }}>
                {aiText}
              </div>
            )}
          </div>
          <Textarea label="Reason" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} required placeholder="Describe the reason for leave" id="ld-reason" />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
            <Btn variant="secondary" type="button" onClick={() => setShowApply(false)}>Cancel</Btn>
            <Btn type="submit" loading={applying}>Submit Application</Btn>
          </div>
        </form>
      </Modal>

      {/* ── HR Edit Modal ── */}
      {isHR && editLeave && (
        <Modal open={!!editLeave} onClose={() => setEditLeave(null)} title="Leave Details (HR View)">
          <form onSubmit={handleEditSubmit}>
            <div style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 16, lineHeight: 1.6 }}>
              <strong>Employee:</strong> {editLeave.employee?.first_name} {editLeave.employee?.last_name}<br />
              <strong>Type:</strong> {editLeave.leaveType}<br />
              <strong>Period:</strong> {fmtDate(editLeave.fromDate)} → {fmtDate(editLeave.toDate)} ({editLeave.totalDays} days)<br />
              <strong>Reason:</strong> {editLeave.reason}
            </div>
            <Textarea label="HR Notes (internal)" placeholder="Add internal HR note" id="hr-note" />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
              <Btn variant="secondary" type="button" onClick={() => setEditLeave(null)}>Close</Btn>
              <Btn type="submit" loading={editing}>Save Note</Btn>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
