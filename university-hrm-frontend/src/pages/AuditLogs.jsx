import React, { useEffect, useState } from 'react';
import { PageHeader, Card, Table, Badge, Btn } from '../components/ui';
import { auditAPI } from '../services/api';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const actionColors = {
  'LOGIN': 'success',
  'LOGOUT': 'neutral',
  'CREATE_USER': 'info',
  'DELETE_USER': 'danger',
  'APPROVE_LEAVE': 'primary',
  'REJECT_LEAVE': 'warning',
  'UPDATE_PAYROLL': 'warning',
};

const PAGE_SIZE = 50;

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    setLoading(true);
    // Fetch PAGE_SIZE + 1 to check if there is a next page
    auditAPI.list({ limit: PAGE_SIZE + 1, skip: (page - 1) * PAGE_SIZE }).then(res => {
      const data = res.data?.data || res.data || [];
      if (data.length > PAGE_SIZE) {
        setHasMore(true);
        setLogs(data.slice(0, PAGE_SIZE));
      } else {
        setHasMore(false);
        setLogs(data);
      }
    }).catch(err => {
      console.error(err);
      setLogs([]);
      setHasMore(false);
    }).finally(() => {
      setLoading(false);
    });
  }, [page]);

  const cols = [
    { key: 'createdAt', label: 'Timestamp', render: (r) => new Date(r.timestamp || r.created_at).toLocaleString() },
    { key: 'userEmail', label: 'Actor', render: (r) => r.userEmail || r.user_email || 'System' },
    { key: 'action', label: 'Action', render: (r) => {
      const act = (r.action || '').toUpperCase();
      return <Badge variant={actionColors[act] || 'neutral'}>{act.replace(/_/g, ' ')}</Badge>;
    }},
    { key: 'details', label: 'Details', render: (r) => r.details || '—' },
    { key: 'ipAddress', label: 'IP Address', render: (r) => r.ipAddress || r.ip_address || '—' }
  ];

  return (
    <>
      <PageHeader
        title="Audit Logs"
        subtitle="System-wide action tracking and security events"
      />
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <Table cols={cols} rows={logs} loading={loading} emptyMsg="No audit logs available" />
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', borderTop: '1px solid var(--gray-200)', fontSize: 13 }}>
          <span style={{ color: 'var(--gray-500)' }}>
            Page <strong>{page}</strong>
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            <Btn variant="secondary" size="xs" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft size={13} /> Prev
            </Btn>
            <Btn variant="secondary" size="xs" disabled={!hasMore} onClick={() => setPage(p => p + 1)}>
              Next <ChevronRight size={13} />
            </Btn>
          </div>
        </div>
      </Card>
    </>
  );
}
