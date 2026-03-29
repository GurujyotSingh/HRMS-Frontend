import React, { useCallback, useEffect, useRef, useState } from 'react';
import { auditAPI } from '../services/api';
import { Btn, Card, Input, PageHeader, Select, Table, toast } from '../components/ui';

function actionBadge(action) {
  const a = (action || '').toLowerCase();
  let cls = 'badge-neutral';
  if (a.includes('login') && !a.includes('failed')) cls = 'badge-info';
  else if (a.includes('failed')) cls = 'badge-danger';
  else if (a.includes('create')) cls = 'badge-success';
  else if (a.includes('update')) cls = 'badge-warning';
  else if (a.includes('delete')) cls = 'badge-danger';
  else if (a.includes('approve')) cls = 'badge-success';
  else if (a.includes('reject')) cls = 'badge-danger';
  return <span className={`badge ${cls}`}>{action}</span>;
}

function statusBadge(status) {
  const ok = (status || '').toLowerCase() === 'success';
  return <span className={`badge ${ok ? 'badge-success' : 'badge-danger'}`}>{status}</span>;
}

export default function AuditLogs() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [action, setAction] = useState('');
  const [resource, setResource] = useState('');
  const [status, setStatus] = useState('');
  const [hasMore, setHasMore] = useState(false);
  const offsetRef = useRef(0);

  const load = useCallback(
    async (reset) => {
      setLoading(true);
      const off = reset ? 0 : offsetRef.current;
      try {
        const { data } = await auditAPI.list({
          limit: 50,
          offset: off,
          action: action || undefined,
          resource: resource || undefined,
        });
        const chunk = data || [];
        if (reset) {
          setRows(chunk);
          offsetRef.current = chunk.length;
        } else {
          setRows((r) => [...r, ...chunk]);
          offsetRef.current += chunk.length;
        }
        setHasMore(chunk.length >= 50);
      } catch (e) {
        toast(e.response?.data?.detail || 'Failed to load audit logs', 'error');
        if (reset) setRows([]);
      } finally {
        setLoading(false);
      }
    },
    [action, resource]
  );

  useEffect(() => {
    offsetRef.current = 0;
    load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = rows.filter((r) => {
    if (status && (r.status || '').toLowerCase() !== status.toLowerCase()) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (r.user_email || '').toLowerCase().includes(q) ||
      (r.detail || '').toLowerCase().includes(q) ||
      String(r.resource_id || '').includes(q)
    );
  });

  const cols = [
    {
      key: 'ts',
      label: 'Timestamp',
      render: (r) => (
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          {new Date(r.created_at).toLocaleString('en-IN')}
        </span>
      ),
    },
    { key: 'user_email', label: 'User' },
    { key: 'action', label: 'Action', render: (r) => actionBadge(r.action) },
    {
      key: 'resource',
      label: 'Resource',
      render: (r) => (
        <span>
          {r.resource || '—'} {r.resource_id != null ? `#${r.resource_id}` : ''}
        </span>
      ),
    },
    {
      key: 'detail',
      label: 'Detail',
      render: (r) => (
        <span style={{ maxWidth: 220, display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {r.detail || '—'}
        </span>
      ),
    },
    {
      key: 'ip',
      label: 'IP',
      render: (r) => (
        <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12 }}>{r.ip_address || '—'}</span>
      ),
    },
    { key: 'status', label: 'Status', render: (r) => statusBadge(r.status) },
  ];

  return (
    <div>
      <PageHeader title="Audit logs" subtitle="Security and compliance trail" />
      <Card style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 0 }}>
          The API currently allows HR to read logs. If you see 403 as Admin, extend the backend to include admin
          on <code style={{ fontSize: 12 }}>/audit/logs</code>.
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: 12,
            alignItems: 'end',
          }}
        >
          <Input label="Search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Email, detail…" />
          <Input label="Action contains" value={action} onChange={(e) => setAction(e.target.value)} />
          <Input label="Resource contains" value={resource} onChange={(e) => setResource(e.target.value)} />
          <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
          </Select>
          <Btn
            variant="secondary"
            onClick={() => {
              setSearch('');
              setAction('');
              setResource('');
              setStatus('');
              offsetRef.current = 0;
              setTimeout(() => load(true), 0);
            }}
          >
            Clear
          </Btn>
          <Btn
            onClick={() => {
              offsetRef.current = 0;
              load(true);
            }}
          >
            Apply filters
          </Btn>
        </div>
      </Card>
      <Card style={{ padding: 0 }}>
        <Table cols={cols} rows={filtered} loading={loading && !rows.length} emptyMsg="No logs" />
      </Card>
      {hasMore && (
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <Btn variant="secondary" loading={loading} onClick={() => load(false)}>
            Load more
          </Btn>
        </div>
      )}
    </div>
  );
}
