import React, { useEffect, useState } from 'react';
import { employeesAPI, deptAPI, authAPI } from '../services/api';
import {
  PageHeader, Card, Table, Btn, Modal, Input, Select, Badge, toast, Avatar,
} from '../components/ui';
import { Plus, Eye } from 'lucide-react';

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showView, setShowView] = useState(null);
  const [creating, setCreating] = useState(false);
  
  const [form, setForm] = useState({
    email: '', password: '', role: 'STAFF',
    firstName: '', lastName: '', employeeId: '',
    joinDate: '', departmentId: '', designation: '',
  });

  const load = async () => {
    setLoading(true);
    try {
      const [empRes, deptRes] = await Promise.all([
        employeesAPI.list(),
        deptAPI.list(),
      ]);
      setEmployees(empRes.data?.data || empRes.data || []);
      setDepartments(deptRes.data?.data || deptRes.data || []);
    } catch (e) {
      toast(e.response?.data?.message || 'Failed to load employees', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => setForm({
    email: '', password: '', role: 'STAFF',
    firstName: '', lastName: '', employeeId: '',
    joinDate: '', departmentId: '', designation: '',
  });

  const ROLE_PREFIX_MAP = {
    'SUPER_ADMIN': 'UNI-AD-',
    'HR_MANAGER':  'UNI-HR-',
    'HR_STAFF':    'UNI-HRS-',
    'DIRECTOR':    'UNI-DR-',
    'FACULTY':     'UNI-FA-',
    'STAFF':       'UNI-ST-',
  };

  useEffect(() => {
    if (showCreate) {
      const prefix = ROLE_PREFIX_MAP[form.role] || 'UNI-EMP-';
      const roleEmployees = employees.filter(e => e.employeeId?.startsWith(prefix));
      let nextNum = 1;
      if (roleEmployees.length > 0) {
        // NestJS returns camelCase
        const sorted = roleEmployees.sort((a,b) => b.employeeId.localeCompare(a.employeeId));
        const match = sorted[0].employeeId.match(/(\d+)$/);
        if (match) nextNum = parseInt(match[1], 10) + 1;
      }
      setForm(prev => ({ ...prev, employeeId: `${prefix}${nextNum.toString().padStart(3, '0')}` }));
    }
  }, [form.role, showCreate, employees]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await employeesAPI.create({
        email: form.email,
        password: form.password,
        role: form.role,
        firstName: form.firstName,
        lastName: form.lastName,
        employeeId: form.employeeId,
        joinDate: form.joinDate,
        departmentId: form.departmentId || null,
        designation: form.designation || null,
        salary: null,
      });

      toast('Employee created successfully', 'success');
      setShowCreate(false);
      resetForm();
      load();
    } catch (e) {
      toast(e.response?.data?.message || 'Failed to create employee', 'error');
    } finally {
      setCreating(false);
    }
  };

  const getDeptName = (id) => departments.find((d) => d.id === id)?.name || '—';

  const cols = [
    {
      key: 'employeeId',
      label: 'Emp ID',
      render: (r) => (
        <span style={{ fontWeight: 600, color: 'var(--primary)', fontSize: 13 }}>
          {r.employeeId}
        </span>
      ),
    },
    {
      key: 'name',
      label: 'Name',
      render: (r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar name={`${r.firstName} ${r.lastName}`} size={32} />
          <div>
            <div style={{ fontWeight: 500 }}>{r.firstName} {r.lastName}</div>
            <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>{r.email}</div>
          </div>
        </div>
      ),
    },
    { key: 'role', label: 'Role', render: (r) => <span style={{ fontSize: 12, fontWeight: 500 }}>{r.role.replace('_', ' ')}</span> },
    { key: 'department', label: 'Department', render: (r) => getDeptName(r.departmentId) },
    { key: 'joinDate', label: 'Date Joined', render: (r) => r.joinDate ? new Date(r.joinDate).toLocaleDateString() : '—' },
    { key: 'status', label: 'Status', render: (r) => <Badge variant={r.status === 'ACTIVE' ? 'success' : 'danger'}>{r.status}</Badge> },
    {
      key: 'actions',
      label: 'Actions',
      render: (r) => (
        <Btn variant="ghost" size="xs" onClick={() => setShowView(r)}>
          <Eye size={15} /> View
        </Btn>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Employees"
        subtitle="Manage all employee records"
        actions={
          <Btn onClick={() => { resetForm(); setShowCreate(true); }}>
            <Plus size={16} /> Add Employee
          </Btn>
        }
      />

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <Table cols={cols} rows={employees} loading={loading} emptyMsg="No employees found" />
      </Card>

      {/* Create Employee Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Add New Employee" width={580}>
        <form onSubmit={handleCreate}>
          <h4 style={{ fontSize: 12, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14, paddingBottom: 8, borderBottom: '1px solid var(--gray-200)' }}>
            Login Account
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required id="emp-email" />
            <Input label="Temporary Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required id="emp-password" />
          </div>
          <Select label="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} id="emp-role">
            <option value="STAFF">Staff</option>
            <option value="FACULTY">Faculty</option>
            <option value="DIRECTOR">Director (HOD)</option>
            <option value="HR_STAFF">HR Staff</option>
            <option value="HR_MANAGER">HR Manager</option>
            <option value="SUPER_ADMIN">System Admin</option>
          </Select>

          <h4 style={{ fontSize: 12, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14, marginTop: 8, paddingBottom: 8, borderBottom: '1px solid var(--gray-200)' }}>
            Employee Profile
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <Input label="First Name" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required id="emp-fn" />
            <Input label="Last Name" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required id="emp-ln" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <Input label="Employee ID (Auto-Generated)" value={form.employeeId} disabled required id="emp-id" />
            <Input label="Date of Joining" type="date" value={form.joinDate} onChange={(e) => setForm({ ...form, joinDate: e.target.value })} required id="emp-doj" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <Select label="Department" value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })} id="emp-dept">
              <option value="">Select Department</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </Select>
            <Input label="Designation" value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} placeholder="e.g. Associate Professor" id="emp-desig" />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
            <Btn variant="secondary" type="button" onClick={() => setShowCreate(false)}>Cancel</Btn>
            <Btn type="submit" loading={creating}>Create Employee</Btn>
          </div>
        </form>
      </Modal>

      {/* View Employee Modal */}
      <Modal open={!!showView} onClose={() => setShowView(null)} title="Employee Details" width={440}>
        {showView && (
          <div style={{ textAlign: 'center' }}>
            <Avatar name={`${showView.firstName} ${showView.lastName}`} size={72} style={{ margin: '0 auto 16px' }} />
            <h2 style={{ fontSize: 20, marginBottom: 4 }}>{showView.firstName} {showView.lastName}</h2>
            <p style={{ color: 'var(--gray-500)', fontSize: 14, marginBottom: 20 }}>{showView.email}</p>

            <div style={{ background: 'var(--gray-100)', borderRadius: '10px', padding: 20, textAlign: 'left' }}>
              {[
                ['Employee ID', showView.employeeId],
                ['Role', showView.role.replace('_', ' ')],
                ['Department', getDeptName(showView.departmentId)],
                ['Designation', showView.designation],
                ['Date of Joining', showView.joinDate ? new Date(showView.joinDate).toLocaleDateString() : '—'],
                ['Status', showView.status],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--gray-200)', fontSize: 14 }}>
                  <span style={{ color: 'var(--gray-500)' }}>{k}</span>
                  <span style={{ fontWeight: 500 }}>{v || '—'}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}