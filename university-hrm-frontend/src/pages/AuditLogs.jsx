import React, { useEffect, useState } from 'react';
import { PageHeader, Card, Table, Badge } from '../components/ui';
import { auditAPI } from '../services/api';

const actionColors = {
  'LOGIN': 'success',
  'LOGOUT': 'neutral',
  'CREATE_USER': 'info',
  'DELETE_USER': 'danger',
  'APPROVE_LEAVE': 'primary',
  'REJECT_LEAVE': 'warning',
  'UPDATE_PAYROLL': 'warning',
};

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    auditAPI.list().then(res => {
      setLogs(res.data?.data || res.data || []);
    }).catch(err => {
      console.error(err);
      setLogs([]);
    }).finally(() => {
      setLoading(false);
    });
  }, []);

  const cols = [
    { key: 'createdAt', label: 'Timestamp', render: (r) => new Date(r.timestamp || r.createdAt).toLocaleString() },
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
      </Card>
    </>
  );
}
