import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { deptAPI, employeesAPI } from '../services/api';
import api from '../services/api';
import { Btn, Card, Input, Modal, PageHeader, Select, Table, toast } from '../components/ui';

const ROLES = ['employee', 'hr', 'accountant', 'department_head', 'admin'];

const EMPTY_FORM = {
  email: '', password: '', role_name: 'employee',
  first_name: '', last_name: '', employee_id: '', date_of_joining: '', department_id: '',
};

export default function Employees() {
  const { hasRole } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [depts, setDepts] = useState([]);
  const [modal, setModal] = useState(null);
  const [viewEmp, setViewEmp] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const deptMap = useMemo(() => {
    const m = {}; depts.forEach((d) => { m[d.id] = d.name; }); return m;
  }, [depts]);

  const loadDepts = useCallback(async () => {
    try { const { data } = await deptAPI.list(); setDepts(data); }
    catch { toast('Failed to load departments', 'error'); }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try { const { data } = await employeesAPI.list(); setRows(data); }
    catch { toast('Failed to load employees', 'error'); setRows([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadDepts(); load(); }, [load, loadDepts]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      `${r.first_name} ${r.last_name}`.toLowerCase().includes(q) ||
      (r.employee_id || '').toLowerCase().includes(q) ||
      (r.email || '').toLowerCase().includes(q)
    );
  }, [rows, search]);

  const f = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));
  const openCreate = () => { setForm(EMPTY_FORM); setModal('create'); };

  const saveCreate = async () => {
    const { email, password, role_name, first_name, last_name, employee_id, date_of_joining, department_id } = form;
    if (!email || !password || !first_name || !last_name || !employee_id || !date_of_joining) {
      toast('Please fill all required fields', 'error'); return;
    }
    setSaving(true);
    try {
      const userRes = await api.post('/auth/register', { email, password, role_name });
      const userId = userRes.data?.user_id || null;
      await employeesAPI.create({
        first_name, last_name, employee_id, date_of_joining,
        department_id: department_id ? Number(department_id) : null,
        user_id: userId,
      });
      toast(`Employee ${first_name} ${last_name} created`, 'success');
      setModal(null); load();
    } catch (e) {
      const detail = e.response?.data?.detail;
      toast(typeof detail === 'string' ? detail : 'Failed to create employee', 'error');
    }
    setSaving(false);
  };

  const cols = [
    { key: 'employee_id', label: 'Employee ID' },
    { key: 'name', label: 'Name', render: (r) => `${r.first_name} ${r.last_name}` },
    { key: 'email', label: 'Email', render: (r) => r.email || '—' },
    { key: 'department', label: 'Department', render: (r) => deptMap[r.department_id] || '—' },
    { key: 'date_of_joining', label: 'Date joined', render: (r) => r.date_of_joining ? new Date(r.date_of_joining).toLocaleDateString('en-IN') : '—' },
    { key: 'status', label: 'Status', render: () => <span className="badge badge-success">Active</span> },
    { key: 'actions', label: '', render: (r) => <Btn size="sm" variant="secondary" onClick={() => setViewEmp(r)}>View</Btn> },
  ];

  return (
    <div>
      <PageHeader title="Employees" subtitle="Directory and profiles"
        actions={hasRole('admin', 'hr') ? <Btn onClick={openCreate}>+ Add Employee</Btn> : null}
      />
      <Card style={{ marginBottom: 20 }}>
        <Input label="Search" placeholder="Name, ID, or email" value={search} onChange={(e) => setSearch(e.target.value)} />
      </Card>
      <Card style={{ padding: 0 }}>
        <Table cols={cols} rows={filtered} loading={loading} emptyMsg="No employees found" />
      </Card>

      {/* Create Modal */}
      <Modal open={modal === 'create'} onClose={() => setModal(null)} title="Add new employee" width={580}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: 'var(--surface-2)', borderRadius: 'var(--radius)', padding: '14px 16px' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Login account</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ gridColumn: '1/-1' }}>
                <Input label="Email *" type="email" value={form.email} onChange={f('email')} placeholder="employee@uni.edu" />
              </div>
              <Input label="Password *" type="password" value={form.password} onChange={f('password')} placeholder="Min 6 characters" />
              <Select label="Role *" value={form.role_name} onChange={f('role_name')}>
                {ROLES.map((r) => <option key={r} value={r}>{r.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</option>)}
              </Select>
            </div>
          </div>
          <div style={{ background: 'var(--surface-2)', borderRadius: 'var(--radius)', padding: '14px 16px' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Employee profile</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Input label="First name *" value={form.first_name} onChange={f('first_name')} placeholder="Divyansh" />
              <Input label="Last name *" value={form.last_name} onChange={f('last_name')} placeholder="Shah" />
              <Input label="Employee ID *" value={form.employee_id} onChange={f('employee_id')} placeholder="UNI-CS-002" />
              <Input label="Date of joining *" type="date" value={form.date_of_joining} onChange={f('date_of_joining')} />
              <div style={{ gridColumn: '1/-1' }}>
                <Select label="Department" value={form.department_id} onChange={f('department_id')}>
                  <option value="">— None —</option>
                  {depts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </Select>
              </div>
            </div>
          </div>
          <div style={{ background: 'var(--info-light)', border: '1px solid var(--info)', borderRadius: 'var(--radius)', padding: '10px 14px', fontSize: 12, color: 'var(--info)' }}>
            This creates a login account + employee profile. The employee can log in with the email and password you set.
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <Btn variant="secondary" onClick={() => setModal(null)}>Cancel</Btn>
            <Btn onClick={saveCreate} loading={saving}>Create Employee</Btn>
          </div>
        </div>
      </Modal>

      {/* View Modal */}
      <Modal open={!!viewEmp} onClose={() => setViewEmp(null)} title="Employee profile" width={480}>
        {viewEmp && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, padding: 16, background: 'var(--surface-2)', borderRadius: 'var(--radius)' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--terracotta)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700 }}>
                {(viewEmp.first_name?.[0] || '')}{(viewEmp.last_name?.[0] || '')}
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 20 }}>{viewEmp.first_name} {viewEmp.last_name}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>{viewEmp.employee_id}</div>
              </div>
            </div>
            {[
              ['Email', viewEmp.email || '—'],
              ['Department', deptMap[viewEmp.department_id] || '—'],
              ['Date joined', viewEmp.date_of_joining ? new Date(viewEmp.date_of_joining).toLocaleDateString('en-IN') : '—'],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)', fontSize: 14 }}>
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