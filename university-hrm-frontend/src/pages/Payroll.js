import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { employeesAPI, payrollAPI } from '../services/api';
import { Btn, Card, Input, Modal, PageHeader, Select, Table, toast } from '../components/ui';

const fmtMoney = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

function statusBadge(s) {
  const cls = s === 'finalized' ? 'badge-success' : 'badge-warning';
  return <span className={`badge ${cls}`}>{s}</span>;
}

export default function Payroll() {
  const { hasRole } = useAuth();
  const [tab, setTab] = useState('my');
  const [myList, setMyList] = useState([]);
  const [allList, setAllList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState(null);
  const [genOpen, setGenOpen] = useState(false);
  const [gen, setGen] = useState({ employee_id: '', month: String(new Date().getMonth() + 1), year: String(new Date().getFullYear()) });
  const [empMap, setEmpMap] = useState({});

  const canManage = hasRole('admin', 'hr', 'accountant');

  const loadNames = useCallback(async () => {
    if (!hasRole('admin', 'hr')) return;
    try {
      const { data } = await employeesAPI.list();
      const m = {};
      (data || []).forEach((e) => {
        m[e.id] = `${e.first_name} ${e.last_name}`;
      });
      setEmpMap(m);
    } catch {
      /* ignore */
    }
  }, [hasRole]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: mine } = await payrollAPI.myPayslips();
      setMyList(mine);
      if (tab === 'all' && hasRole('admin', 'hr')) {
        const { data: all } = await payrollAPI.allPayslips();
        setAllList(all);
      } else {
        setAllList([]);
      }
    } catch (e) {
      toast(e.response?.data?.detail || 'Failed to load payslips', 'error');
    } finally {
      setLoading(false);
    }
  }, [tab, hasRole]);

  useEffect(() => {
    loadNames();
  }, [loadNames]);

  useEffect(() => {
    load();
  }, [load]);

  const rows = tab === 'my' ? myList : allList;

  const finalize = async (id) => {
    try {
      await payrollAPI.finalize(id);
      toast('Payslip finalized', 'success');
      load();
    } catch (e) {
      toast(e.response?.data?.detail || 'Finalize failed', 'error');
    }
  };

  const generate = async () => {
    try {
      await payrollAPI.generate({
        employee_id: Number(gen.employee_id),
        month: Number(gen.month),
        year: Number(gen.year),
      });
      toast('Payslip generated (draft)', 'success');
      setGenOpen(false);
      load();
    } catch (e) {
      toast(e.response?.data?.detail || 'Generate failed', 'error');
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
      key: 'period',
      label: 'Period',
      render: (r) =>
        `${new Date(2000, r.month - 1).toLocaleString('en-IN', { month: 'long' })} ${r.year}`,
    },
    { key: 'gross_salary', label: 'Gross', render: (r) => fmtMoney(r.gross_salary) },
    { key: 'total_deductions', label: 'Deductions', render: (r) => fmtMoney(r.total_deductions) },
    {
      key: 'net_pay',
      label: 'Net pay',
      render: (r) => (
        <strong style={{ color: 'var(--success)' }}>{fmtMoney(r.net_pay)}</strong>
      ),
    },
    { key: 'status', label: 'Status', render: (r) => statusBadge(r.status) },
    {
      key: 'actions',
      label: 'Actions',
      render: (r) => (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Btn size="sm" variant="secondary" onClick={() => setView(r)}>
            View
          </Btn>
          {hasRole('admin', 'hr') && r.status !== 'finalized' && (
            <Btn size="sm" onClick={() => finalize(r.id)}>
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
        title="Payroll"
        subtitle="Payslips and salary"
        actions={
          canManage && hasRole('admin', 'hr') ? (
            <Btn onClick={() => setGenOpen(true)}>+ Generate payslip</Btn>
          ) : null
        }
      />
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <Btn variant={tab === 'my' ? 'primary' : 'secondary'} onClick={() => setTab('my')}>
          My payslips
        </Btn>
        {hasRole('admin', 'hr', 'accountant') && (
          <Btn variant={tab === 'all' ? 'primary' : 'secondary'} onClick={() => setTab('all')}>
            All payslips
          </Btn>
        )}
      </div>
      <Card style={{ padding: 0 }}>
        <Table cols={cols} rows={rows} loading={loading} emptyMsg="No payslips" />
      </Card>

      <Modal open={!!view} onClose={() => setView(null)} title="Payslip" width={520}>
        {view && (
          <>
            <div
              style={{
                background: 'var(--soil)',
                color: 'var(--linen)',
                padding: 20,
                borderRadius: 'var(--radius)',
                marginBottom: 20,
              }}
            >
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 22 }}>
                {tab === 'all' ? empMap[view.employee_id] || 'Employee' : 'Your payslip'}
              </div>
              <div style={{ fontSize: 28, fontWeight: 700, marginTop: 8 }}>{fmtMoney(view.net_pay)}</div>
              <div style={{ opacity: 0.85, fontSize: 13 }}>Net pay</div>
            </div>
            {[
              ['Basic', view.basic_salary],
              ['HRA', view.hra],
              ['TA', view.ta],
              ['DA', view.da],
              ['Other allowances', view.other_allowances],
              ['Gross', view.gross_salary],
              ['PF', view.pf_deduction],
              ['Professional tax', view.professional_tax],
              ['TDS', view.tds_deduction],
              ['Absent deduction', view.absent_deduction],
              ['Total deductions', view.total_deductions],
              ['Net pay', view.net_pay],
            ].map(([k, v]) => (
              <div
                key={k}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '8px 0',
                  borderBottom: '1px solid var(--border)',
                  fontSize: 14,
                }}
              >
                <span style={{ color: 'var(--text-muted)' }}>{k}</span>
                <span style={{ fontWeight: k.includes('Net') ? 700 : 500 }}>{fmtMoney(v)}</span>
              </div>
            ))}
          </>
        )}
      </Modal>

      <Modal open={genOpen} onClose={() => setGenOpen(false)} title="Generate payslip">
        <Input
          label="Employee ID (numeric)"
          value={gen.employee_id}
          onChange={(e) => setGen((g) => ({ ...g, employee_id: e.target.value }))}
        />
        <Select
          label="Month"
          value={gen.month}
          onChange={(e) => setGen((g) => ({ ...g, month: e.target.value }))}
        >
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={i + 1}>
              {i + 1}
            </option>
          ))}
        </Select>
        <Input
          label="Year"
          type="number"
          value={gen.year}
          onChange={(e) => setGen((g) => ({ ...g, year: e.target.value }))}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
          <Btn variant="secondary" onClick={() => setGenOpen(false)}>
            Cancel
          </Btn>
          <Btn onClick={generate}>Generate</Btn>
        </div>
      </Modal>
    </div>
  );
}
