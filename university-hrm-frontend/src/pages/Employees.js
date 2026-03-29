import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { deptAPI, employeesAPI } from '../services/api';
import { Btn, Card, Input, Modal, PageHeader, Select, Table, toast } from '../components/ui';

export default function Employees() {
  const { hasRole } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [depts, setDepts] = useState([]);
  const [modal, setModal] = useState(null);
  const [viewEmp, setViewEmp] = useState(null);
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    employee_id: '',
    date_of_joining: '',
    department_id: '',
  });

  const deptMap = useMemo(() => {
    const m = {};
    depts.forEach((d) => {
      m[d.id] = d.name;
    });
    return m;
  }, [depts]);

  const loadDepts = useCallback(async () => {
    try {
      const { data } = await deptAPI.list();
      setDepts(data);
    } catch (e) {
      toast(e.response?.data?.detail || 'Failed to load departments', 'error');
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await employeesAPI.list();
      setRows(data);
    } catch (e) {
      toast(e.response?.data?.detail || 'Failed to load employees', 'error');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDepts();
    load();
  }, [load, loadDepts]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        `${r.first_name} ${r.last_name}`.toLowerCase().includes(q) ||
        (r.employee_id || '').toLowerCase().includes(q) ||
        (r.email || '').toLowerCase().includes(q)
    );
  }, [rows, search]);

  const openCreate = () => {
    setForm({
      first_name: '',
      last_name: '',
      employee_id: '',
      date_of_joining: '',
      department_id: '',
    });
    setModal('create');
  };

  const saveCreate = async () => {
    try {
      await employeesAPI.create({
        first_name: form.first_name,
        last_name: form.last_name,
        employee_id: form.employee_id,
        date_of_joining: form.date_of_joining,
        department_id: form.department_id ? Number(form.department_id) : null,
      });
      toast('Employee created', 'success');
      setModal(null);
      load();
    } catch (e) {
      toast(e.response?.data?.detail || 'Create failed', 'error');
    }
  };

  const cols = [
    { key: 'employee_id', label: 'Employee ID' },
    {
      key: 'name',
      label: 'Name',
      render: (r) => `${r.first_name} ${r.last_name}`,
    },
    {
      key: 'designation',
      label: 'Designation',
      render: () => '—',
    },
    {
      key: 'department',
      label: 'Department',
      render: (r) => deptMap[r.department_id] || '—',
    },
    {
      key: 'date_of_joining',
      label: 'Date joined',
      render: (r) =>
        r.date_of_joining ? new Date(r.date_of_joining).toLocaleDateString('en-IN') : '—',
    },
    {
      key: 'status',
      label: 'Status',
      render: () => <span className="badge badge-success">Active</span>,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (r) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn size="sm" variant="secondary" onClick={() => setViewEmp(r)}>
            View
          </Btn>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Employees"
        subtitle="Directory and profiles"
        actions={
          hasRole('admin', 'hr') ? (
            <Btn onClick={openCreate}>+ Add Employee</Btn>
          ) : null
        }
      />
      <Card style={{ marginBottom: 20 }}>
        <Input
          label="Search"
          placeholder="Name, ID, or email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </Card>
      <Card style={{ padding: 0 }}>
        <Table cols={cols} rows={filtered} loading={loading} emptyMsg="No employees found" />
      </Card>

      <Modal open={modal === 'create'} onClose={() => setModal(null)} title="Add employee" width={560}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
          <Input
            label="First name"
            value={form.first_name}
            onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
          />
          <Input
            label="Last name"
            value={form.last_name}
            onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
          />
          <Input
            label="Employee ID"
            value={form.employee_id}
            onChange={(e) => setForm((f) => ({ ...f, employee_id: e.target.value }))}
          />
          <Input
            label="Date of joining"
            type="date"
            value={form.date_of_joining}
            onChange={(e) => setForm((f) => ({ ...f, date_of_joining: e.target.value }))}
          />
          <div style={{ gridColumn: '1 / -1' }}>
            <Select
              label="Department"
              value={form.department_id}
              onChange={(e) => setForm((f) => ({ ...f, department_id: e.target.value }))}
            >
              <option value="">— None —</option>
              {depts.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
          <Btn variant="secondary" onClick={() => setModal(null)}>
            Cancel
          </Btn>
          <Btn onClick={saveCreate}>Save</Btn>
        </div>
      </Modal>

      <Modal open={!!viewEmp} onClose={() => setViewEmp(null)} title="Employee profile" width={480}>
        {viewEmp && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  background: 'var(--accent-light)',
                  color: 'var(--accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--font-display)',
                  fontSize: 22,
                  fontWeight: 700,
                }}
              >
                {(viewEmp.first_name?.[0] || '') + (viewEmp.last_name?.[0] || '')}
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 22 }}>
                  {viewEmp.first_name} {viewEmp.last_name}
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>{viewEmp.employee_id}</div>
              </div>
            </div>
            {[
              ['Email', viewEmp.email || '—'],
              ['Department', deptMap[viewEmp.department_id] || '—'],
              [
                'Date joined',
                viewEmp.date_of_joining
                  ? new Date(viewEmp.date_of_joining).toLocaleDateString('en-IN')
                  : '—',
              ],
            ].map(([k, v]) => (
              <div
                key={k}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '10px 0',
                  borderBottom: '1px solid var(--border)',
                  fontSize: 14,
                }}
              >
                <span style={{ color: 'var(--text-muted)' }}>{k}</span>
                <span style={{ fontWeight: 500 }}>{v}</span>
              </div>
            ))}
          </>
        )}
      </Modal>
    </div>
  );
}
