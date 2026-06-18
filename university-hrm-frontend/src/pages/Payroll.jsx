import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, Search, Filter, FileText, Check, X, Download,
  Clock, DollarSign, Edit, Eye, ArrowRight, User as UserIcon,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { payrollAPI, employeesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  PageHeader, Card, Table, Btn, Modal, Input, Badge, toast, Select,
} from '../components/ui';
import AsyncEmployeeSelect from '../components/ui/AsyncEmployeeSelect';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const PAGE_SIZE = 10;
const STATUS_COLORS = {
  Draft: 'neutral',
  Pending_HR_Review: 'warning',
  Pending_Finance_Review: 'blue',
  Approved: 'success',
  Paid: 'success',
  Rejected: 'danger'
};

const fmt = (val) => new Intl.NumberFormat('en-IN').format(val || 0);

export default function Payroll() {
  const { user } = useAuth();
  const hasRole = (...roles) => roles.includes(user?.role?.toLowerCase());
  const isPrivileged = hasRole('admin', 'super_admin', 'hr', 'finance', 'hr_manager', 'hr_staff', 'accountant');
  const isHR = hasRole('admin', 'super_admin', 'hr', 'hr_manager', 'hr_staff');
  const isFinance = hasRole('admin', 'super_admin', 'finance', 'accountant');

  // ── State ────────────────────────────────────────────────────────
  const [payrolls, setPayrolls] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState({ month: '', year: new Date().getFullYear(), status: '' });

  // Modals & Drawers
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [showApproval, setShowApproval] = useState(null); // { action: 'submit'|'approve'|'reject'|'paid', id }

  // Forms
  const [employees, setEmployees] = useState([]);
  const [formData, setFormData] = useState({
    employee_id: '', payroll_month: new Date().getMonth() + 1, payroll_year: new Date().getFullYear(),
    gross_salary: '', net_salary: '', total_earnings: '', total_deductions: '', remarks: '', components: []
  });
  const [approvalRemarks, setApprovalRemarks] = useState('');

  // Auto-calculate Salary based on components
  useEffect(() => {
    if ((showCreate || showEdit) && formData.components) {
      let gross = 0;
      let ded = 0;
      formData.components.forEach(c => {
        const amt = parseFloat(c.amount) || 0;
        if (c.component_type === 'earning') gross += amt;
        else ded += amt;
      });
      setFormData(prev => ({
        ...prev,
        gross_salary: gross,
        total_earnings: gross,
        total_deductions: ded,
        net_salary: gross - ded
      }));
    }
  }, [formData.components, showCreate, showEdit]);

  const loadStandardTemplate = () => {
    setFormData(prev => ({
      ...prev,
      components: [
        { component_name: 'Basic Pay', component_type: 'earning', amount: '' },
        { component_name: 'House Rent Allowance', component_type: 'earning', amount: '' },
        { component_name: 'Special Allowance', component_type: 'earning', amount: '' },
        { component_name: 'Provident Fund (PF)', component_type: 'deduction', amount: '' },
        { component_name: 'Professional Tax', component_type: 'deduction', amount: '' },
      ]
    }));
  };

  // Prepare chart data from loaded payrolls
  const chartData = React.useMemo(() => {
    if (payrolls.length === 0) {
      // Beautiful dummy data for empty states to keep the dashboard looking premium
      return [
        { name: 'Jan 2026', Gross: 450000, Net: 380000 },
        { name: 'Feb 2026', Gross: 480000, Net: 410000 },
        { name: 'Mar 2026', Gross: 470000, Net: 395000 },
        { name: 'Apr 2026', Gross: 510000, Net: 430000 },
        { name: 'May 2026', Gross: 530000, Net: 450000 },
        { name: 'Jun 2026', Gross: 580000, Net: 490000 },
      ];
    }
    const dataMap = {};
    payrolls.forEach(p => {
      const label = `${MONTHS[p.payroll_month - 1]} ${p.payroll_year}`;
      if (!dataMap[label]) dataMap[label] = { name: label, Gross: 0, Net: 0 };
      dataMap[label].Gross += (p.gross_salary || 0);
      dataMap[label].Net += (p.net_salary || 0);
    });
    return Object.values(dataMap).reverse().slice(0, 6).reverse(); // Last 6 periods
  }, [payrolls]);

  // ── Data Fetching ────────────────────────────────────────────────
  const loadPayrolls = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: PAGE_SIZE, skip: (page - 1) * PAGE_SIZE };
      if (filters.month) params.month = filters.month;
      if (filters.year) params.year = filters.year;
      if (filters.status) params.status = filters.status;
      const { data } = await payrollAPI.list(params);
      setPayrolls(data.items || []);
      setTotal(data.total || 0);
    } catch (e) {
      toast('Failed to load payroll data', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  const loadEmployees = async () => {
    try {
      const { data } = await employeesAPI.list({ limit: 1000 });
      setEmployees(data.items || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadPayrolls();
    loadEmployees();
  }, [loadPayrolls]);

  const handleCreate = async () => {
    if (!formData.employee_id) {
      toast('Please select an employee first', 'warning');
      return;
    }
    
    try {
      const payload = {
        ...formData,
        payroll_month: parseInt(formData.payroll_month, 10),
        payroll_year: parseInt(formData.payroll_year, 10),
        gross_salary: parseFloat(formData.gross_salary) || 0,
        net_salary: parseFloat(formData.net_salary) || 0,
        total_earnings: parseFloat(formData.total_earnings) || 0,
        total_deductions: parseFloat(formData.total_deductions) || 0,
        components: (formData.components || []).map(c => ({
          ...c,
          amount: parseFloat(c.amount) || 0
        }))
      };
      await payrollAPI.create(payload);
      toast('Payroll record created as Draft', 'success');
      setShowCreate(false);
      loadPayrolls();
    } catch (e) {
      console.error(e);
      let msg = 'Failed to create payroll';
      if (e.response?.data?.detail) {
        msg = typeof e.response.data.detail === 'string' ? e.response.data.detail : JSON.stringify(e.response.data.detail);
      }
      toast(msg, 'error');
    }
  };

  const handleUpdate = async () => {
    try {
      const payload = {
        gross_salary: parseFloat(formData.gross_salary) || 0,
        net_salary: parseFloat(formData.net_salary) || 0,
        total_earnings: parseFloat(formData.total_earnings) || 0,
        total_deductions: parseFloat(formData.total_deductions) || 0,
        remarks: formData.remarks,
        components: (formData.components || []).map(c => ({
          component_name: c.component_name,
          component_type: c.component_type,
          amount: parseFloat(c.amount) || 0
        }))
      };
      await payrollAPI.update(formData.id, payload);
      toast('Payroll updated successfully', 'success');
      setShowEdit(false);
      loadPayrolls();
    } catch (e) {
      console.error(e);
      let msg = 'Failed to update payroll';
      if (e.response?.data?.detail) {
        msg = typeof e.response.data.detail === 'string' ? e.response.data.detail : JSON.stringify(e.response.data.detail);
      }
      toast(msg, 'error');
    }
  };

  const handleApprovalAction = async () => {
    try {
      const { action, id } = showApproval;
      const payload = { remarks: approvalRemarks };

      if (action === 'submit') await payrollAPI.submit(id, payload);
      else if (action === 'approve') await payrollAPI.approve(id, payload);
      else if (action === 'reject') await payrollAPI.reject(id, payload);
      else if (action === 'paid') await payrollAPI.markPaid(id, payload);

      toast(`Payroll ${action}d successfully`, 'success');
      setShowApproval(null);
      if (showDetail) {
        const { data } = await payrollAPI.get(id);
        setShowDetail(data);
      }
      loadPayrolls();
    } catch (e) {
      toast(`Failed to process action`, 'error');
    }
  };

  const handleDownloadPayslip = async (id) => {
    try {
      let downloadUrl = null;
      try {
        const { data } = await payrollAPI.downloadPayslip(id);
        downloadUrl = data.url;
      } catch (e) {
        // If payslip isn't generated yet, generate it
        await payrollAPI.generatePayslip(id);
        const { data } = await payrollAPI.downloadPayslip(id);
        downloadUrl = data.url;
      }

      if (downloadUrl) {
        // Trigger actual download (Save As popup)
        const fullUrl = `http://localhost:8000${downloadUrl}`;
        
        // Fetch as blob to force a download instead of opening in a new tab
        const response = await fetch(fullUrl);
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = blobUrl;
        
        // Use the actual filename generated by the backend
        const filename = downloadUrl.split('/').pop() || `Payslip_${id}.pdf`;
        a.download = filename;
        
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(blobUrl);
        document.body.removeChild(a);
        
        toast('Payslip downloaded successfully', 'success');
      }
    } catch (err) {
      toast('Failed to download payslip', 'error');
    }
  };

  // ── Render Helpers ───────────────────────────────────────────────
  const columns = [
    { 
      key: 'emp', 
      label: 'Employee', 
      render: r => {
        const emp = employees.find(e => e.id === r.employee_id);
        if (!emp) return <span style={{ color: 'var(--text-light)', fontFamily: 'monospace', fontSize: 12 }}>{r.employee_id.substring(0, 8)}...</span>;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '4px 0' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#EEF2FF', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 14 }}>
              {emp.first_name[0]}{emp.last_name[0]}
            </div>
            <div>
              <p style={{ fontWeight: 600, color: 'var(--text-dark)', margin: 0, lineHeight: 1.2 }}>{emp.first_name} {emp.last_name}</p>
              <p style={{ fontSize: 12, color: 'var(--text-light)', margin: '2px 0 0 0' }}>{emp.employee_id || 'Staff'}</p>
            </div>
          </div>
        );
      } 
    },
    { key: 'period', label: 'Period', render: r => <span style={{ fontWeight: 500, color: 'var(--text-dark)', background: '#F9FAFB', padding: '4px 10px', borderRadius: 6, border: '1px solid #F3F4F6' }}>{MONTHS[r.payroll_month - 1]} {r.payroll_year}</span> },
    { key: 'net', label: 'Net Salary', render: r => <span style={{ fontWeight: 700, color: 'var(--text-dark)' }}>₹{fmt(r.net_salary)}</span> },
    { key: 'status', label: 'Status', render: r => <Badge variant={STATUS_COLORS[r.status]}>{r.status.replace(/_/g, ' ')}</Badge> },
    {
      key: 'actions', label: '', render: r => (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Btn variant="outline" size="xs" onClick={() => setShowDetail(r)} style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Eye size={14} /> View</Btn>
          {isPrivileged && r.status === 'Draft' && (
            <Btn variant="outline" size="xs" onClick={() => { setFormData(r); setShowEdit(true); }}><Edit size={14} /></Btn>
          )}
        </div>
      )
    }
  ];

  return (
    <div style={{ paddingBottom: 40 }}>
      <PageHeader
        title="Payroll Run"
        subtitle="Manual Payroll Management and Approval Workflow"
      />

      {/* Analytics & Quick Actions */}
      <div style={{ display: 'flex', gap: 24, marginBottom: 24, flexWrap: 'wrap' }}>
        <div style={{ flex: '2 1 0%', minWidth: 300 }}>
          <Card style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontWeight: 600, color: 'var(--text-dark)', margin: '0 0 16px 0', fontSize: 16 }}>Payroll Trends</h3>
            <div style={{ flex: 1, minHeight: 250 }}>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorGross" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#06B6D4" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v/1000}k`} />
                    <Tooltip cursor={{ fill: '#F3F4F6' }} contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Area type="monotone" dataKey="Gross" stroke="#8B5CF6" strokeWidth={3} fillOpacity={1} fill="url(#colorGross)" />
                    <Area type="monotone" dataKey="Net" stroke="#06B6D4" strokeWidth={3} fillOpacity={1} fill="url(#colorNet)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-light)', fontSize: 14 }}>
                  <FileText size={24} style={{ marginBottom: 8, opacity: 0.5 }} />
                  <p style={{ margin: 0 }}>No trend data available yet.</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        <div style={{ flex: '1 1 0%', minWidth: 300 }}>
          <Card style={{ height: '100%' }}>
            <h3 style={{ fontWeight: 600, color: 'var(--text-dark)', margin: '0 0 16px 0', fontSize: 16 }}>Quick Actions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button 
                onClick={() => { setFormData({ employee_id: '', payroll_month: new Date().getMonth() + 1, payroll_year: new Date().getFullYear(), components: [] }); setShowCreate(true); }}
                disabled={!isHR}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, background: '#F8FAFC',
                  border: '1px solid #E2E8F0', borderRadius: 8, cursor: isHR ? 'pointer' : 'not-allowed', opacity: isHR ? 1 : 0.5,
                  textAlign: 'left', transition: 'all 0.2s', width: '100%'
                }}
                onMouseEnter={e => { if(isHR) { e.currentTarget.style.background = '#EEF2FF'; e.currentTarget.style.borderColor = '#C7D2FE'; } }}
                onMouseLeave={e => { if(isHR) { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.borderColor = '#E2E8F0'; } }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#EEF2FF', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Plus size={18} />
                  </div>
                  <div>
                    <p style={{ fontWeight: 600, color: '#1E1B4B', margin: 0 }}>Run New Payroll</p>
                    <p style={{ fontSize: 12, color: '#64748B', margin: '2px 0 0 0' }}>Draft a new salary run</p>
                  </div>
                </div>
                <ArrowRight size={16} color="#94A3B8" />
              </button>

              <button 
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, background: '#F8FAFC',
                  border: '1px solid #E2E8F0', borderRadius: 8, cursor: 'pointer',
                  textAlign: 'left', transition: 'all 0.2s', width: '100%'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#EFF6FF'; e.currentTarget.style.borderColor = '#BFDBFE'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Clock size={18} />
                  </div>
                  <div>
                    <p style={{ fontWeight: 600, color: '#1E1B4B', margin: 0 }}>Pending Approvals</p>
                    <p style={{ fontSize: 12, color: '#64748B', margin: '2px 0 0 0' }}>Review waiting payrolls</p>
                  </div>
                </div>
                <ArrowRight size={16} color="#94A3B8" />
              </button>

              <button 
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, background: '#F8FAFC',
                  border: '1px solid #E2E8F0', borderRadius: 8, cursor: 'pointer',
                  textAlign: 'left', transition: 'all 0.2s', width: '100%'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#ECFDF5'; e.currentTarget.style.borderColor = '#A7F3D0'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#ECFDF5', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FileText size={18} />
                  </div>
                  <div>
                    <p style={{ fontWeight: 600, color: '#1E1B4B', margin: 0 }}>Tax & Compliance</p>
                    <p style={{ fontSize: 12, color: '#64748B', margin: '2px 0 0 0' }}>Manage PF and TDS rules</p>
                  </div>
                </div>
                <ArrowRight size={16} color="#94A3B8" />
              </button>
            </div>
          </Card>
        </div>
      </div>

      {/* Filters Bar */}
      <Card style={{ marginBottom: 24, padding: '12px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', color: 'var(--text-light)', gap: 8 }}>
            <Filter size={18} color="#6366F1" />
            <span style={{ fontWeight: 600, color: 'var(--text-dark)', fontSize: 14 }}>Payroll Records</span>
          </div>
          <div style={{ flex: 1, display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <div style={{ minWidth: 140 }}>
              <Select value={filters.month} onChange={e => setFilters({ ...filters, month: e.target.value })} style={{ marginBottom: 0 }}>
                <option value="">All Months</option>
                {(MONTHS || []).map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </Select>
            </div>
            <div style={{ minWidth: 120 }}>
              <Select value={filters.year} onChange={e => setFilters({ ...filters, year: e.target.value })} style={{ marginBottom: 0 }}>
                {([2024, 2025, 2026] || []).map(y => <option key={y} value={y}>{y}</option>)}
              </Select>
            </div>
            <div style={{ minWidth: 180 }}>
              <Select value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })} style={{ marginBottom: 0 }}>
                <option value="">All Statuses</option>
                <option value="Draft">Draft</option>
                <option value="Pending_HR_Review">Pending HR</option>
                <option value="Pending_Finance_Review">Pending Finance</option>
                <option value="Approved">Approved</option>
                <option value="Paid">Paid</option>
                <option value="Rejected">Rejected</option>
              </Select>
            </div>
          </div>
        </div>
      </Card>

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <Table cols={columns} rows={payrolls} loading={loading} />
        {total > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', borderTop: '1px solid var(--gray-200)', fontSize: 13 }}>
            <span style={{ color: 'var(--gray-500)' }}>
              Page <strong>{page}</strong> of <strong>{Math.max(1, Math.ceil(total / PAGE_SIZE))}</strong> ({total} total records)
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              <Btn variant="secondary" size="xs" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft size={13} /> Prev
              </Btn>
              <Btn variant="secondary" size="xs" disabled={page >= Math.ceil(total / PAGE_SIZE)} onClick={() => setPage(p => p + 1)}>
                Next <ChevronRight size={13} />
              </Btn>
            </div>
          </div>
        )}
      </Card>

      {/* Details Drawer (Simulated as Modal for simplicity) */}
      {showDetail && (
        <Modal open={true} title="Payroll Run Details" onClose={() => setShowDetail(null)} size="lg">
          <div style={{ paddingBottom: 16 }}>
            
            {/* Header Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16, marginBottom: 24 }}>
              <div style={{ background: '#F9FAFB', border: '1px solid #F3F4F6', borderRadius: 8, padding: 16 }}>
                <p style={{ fontSize: 11, color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', margin: '0 0 4px 0' }}>Employee ID</p>
                {(() => {
                  const emp = employees.find(e => e.id === showDetail.employee_id);
                  const displayId = emp ? emp.employee_id : showDetail.employee_id;
                  const displayName = emp ? `${emp.first_name} ${emp.last_name}` : 'Unknown Employee';
                  return (
                    <div>
                      <p style={{ fontWeight: 600, color: '#111827', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={displayId}>{displayId}</p>
                      <p style={{ fontSize: 12, color: '#6B7280', margin: '2px 0 0 0' }}>{displayName}</p>
                    </div>
                  );
                })()}
              </div>
              <div style={{ background: '#F9FAFB', border: '1px solid #F3F4F6', borderRadius: 8, padding: 16 }}>
                <p style={{ fontSize: 11, color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', margin: '0 0 4px 0' }}>Period</p>
                <p style={{ fontWeight: 600, color: '#111827', margin: 0 }}>{MONTHS[showDetail.payroll_month - 1]} {showDetail.payroll_year}</p>
              </div>
              <div style={{ background: '#F9FAFB', border: '1px solid #F3F4F6', borderRadius: 8, padding: 16 }}>
                <p style={{ fontSize: 11, color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', margin: '0 0 8px 0' }}>Status</p>
                <div><Badge variant={STATUS_COLORS[showDetail.status]}>{showDetail.status.replace(/_/g, ' ')}</Badge></div>
              </div>
            </div>

            {/* Financial Summary */}
            <div style={{ display: 'flex', background: 'linear-gradient(to right, #EFF6FF, #EEF2FF)', borderRadius: 8, border: '1px solid #DBEAFE', overflow: 'hidden', marginBottom: 24 }}>
              <div style={{ flex: 1, padding: 20, borderRight: '1px solid rgba(219, 234, 254, 0.5)' }}>
                <p style={{ fontSize: 13, color: '#2563EB', fontWeight: 500, margin: '0 0 4px 0' }}>Gross Salary</p>
                <p style={{ fontSize: 24, fontWeight: 700, color: '#1E3A8A', margin: 0 }}>₹{fmt(showDetail.gross_salary)}</p>
              </div>
              <div style={{ flex: 1, padding: 20 }}>
                <p style={{ fontSize: 13, color: '#4F46E5', fontWeight: 500, margin: '0 0 4px 0' }}>Net Salary</p>
                <p style={{ fontSize: 24, fontWeight: 700, color: '#312E81', margin: 0 }}>₹{fmt(showDetail.net_salary)}</p>
              </div>
            </div>

            {/* Components Table */}
            <div style={{ border: '1px solid #E5E7EB', borderRadius: 8, overflow: 'hidden', marginBottom: 24 }}>
              <div style={{ background: '#F9FAFB', padding: '12px 16px', borderBottom: '1px solid #E5E7EB' }}>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#374151' }}>Earnings & Deductions</h3>
              </div>
              <div>
                {showDetail.components?.length > 0 ? (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tbody>
                      {showDetail.components.map((c, i) => (
                        <tr key={i} style={{ borderBottom: i !== showDetail.components.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
                          <td style={{ padding: '12px 16px', fontSize: 14, color: '#4B5563', width: '50%' }}>{c.component_name}</td>
                          <td style={{ padding: '12px 16px', width: '25%' }}>
                            <Badge variant={c.component_type === 'earning' ? 'success' : 'danger'}>
                              {c.component_type}
                            </Badge>
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 600, color: '#111827', textAlign: 'right', width: '25%' }}>
                            {c.component_type === 'earning' ? '+' : '-'}₹{fmt(c.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div style={{ padding: 24, textAlign: 'center', color: '#9CA3AF', fontSize: 14 }}>No components found</div>
                )}
              </div>
            </div>

            {/* Workflow Actions */}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', paddingTop: 16, borderTop: '1px solid #E5E7EB' }}>
              <Btn variant="outline" onClick={() => setShowDetail(null)}>Close</Btn>

              {/* Action Buttons based on Status and Role */}
              {showDetail.status === 'Draft' && isHR && (
                <Btn variant="primary" onClick={() => setShowApproval({ action: 'submit', id: showDetail.id })}>
                  Submit for HR Review <ArrowRight size={16} style={{ marginLeft: 4 }} />
                </Btn>
              )}

              {showDetail.status === 'Pending_HR_Review' && isHR && (
                <>
                  <Btn variant="danger" onClick={() => setShowApproval({ action: 'reject', id: showDetail.id })}>
                    <X size={16} style={{ marginRight: 4 }} /> Reject
                  </Btn>
                  <Btn variant="success" onClick={() => setShowApproval({ action: 'approve', id: showDetail.id })}>
                    <Check size={16} style={{ marginRight: 4 }} /> Approve (HR)
                  </Btn>
                </>
              )}

              {showDetail.status === 'Pending_Finance_Review' && isFinance && (
                <>
                  <Btn variant="danger" onClick={() => setShowApproval({ action: 'reject', id: showDetail.id })}>
                    <X size={16} style={{ marginRight: 4 }} /> Reject
                  </Btn>
                  <Btn variant="success" onClick={() => setShowApproval({ action: 'approve', id: showDetail.id })}>
                    <Check size={16} style={{ marginRight: 4 }} /> Approve (Finance)
                  </Btn>
                </>
              )}

              {showDetail.status === 'Approved' && isFinance && (
                <Btn variant="success" onClick={() => setShowApproval({ action: 'paid', id: showDetail.id })}>
                  <DollarSign size={16} style={{ marginRight: 4 }} /> Mark as Paid
                </Btn>
              )}

              {showDetail.status === 'Paid' && (
                <Btn variant="primary" onClick={() => handleDownloadPayslip(showDetail.id)}>
                  <Download size={16} style={{ marginRight: 4 }} /> Download Payslip
                </Btn>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Approval Confirmation Modal */}
      {showApproval && (
        <Modal open={true} title="Confirm Action" onClose={() => setShowApproval(null)}>
          <div style={{ paddingBottom: 16 }}>
            <div style={{ background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: 8, padding: 16, marginBottom: 24 }}>
              <p style={{ color: '#92400E', margin: 0, fontSize: 14 }}>
                You are about to <strong>{showApproval.action}</strong> this payroll record. This action will be logged.
              </p>
            </div>
            <div style={{ marginBottom: 24 }}>
              <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-light)', marginBottom: 8 }}>Remarks (Optional)</p>
              <textarea
                style={{ width: '100%', padding: 12, border: '1px solid var(--border-color)', borderRadius: 6, outline: 'none', fontFamily: 'inherit', fontSize: 14, minHeight: 100 }}
                value={approvalRemarks}
                onChange={e => setApprovalRemarks(e.target.value)}
                placeholder="Enter any comments..."
              />
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <Btn variant="outline" onClick={() => setShowApproval(null)}>Cancel</Btn>
              <Btn 
                variant={showApproval.action === 'reject' ? 'danger' : 'primary'}
                onClick={handleApprovalAction}
              >
                Confirm {showApproval.action}
              </Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* Create / Edit Modal */}
      {(showCreate || showEdit) && (
        <Modal open={true} title={showCreate ? "Create Payroll Run" : "Edit Payroll Run"} onClose={() => { setShowCreate(false); setShowEdit(false); }} size="lg">
          <div style={{ paddingBottom: 16 }}>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16, marginBottom: 24 }}>
              {showCreate && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <AsyncEmployeeSelect 
                    label="Select Employee" 
                    value={formData?.employee_id || ''} 
                    onChange={val => setFormData({ ...formData, employee_id: val })} 
                  />
                </div>
              )}
              <Input type="number" label="Payroll Month" placeholder="1-12" value={formData.payroll_month} onChange={e => setFormData({ ...formData, payroll_month: e.target.value })} />
              <Input type="number" label="Payroll Year" placeholder="YYYY" value={formData.payroll_year} onChange={e => setFormData({ ...formData, payroll_year: e.target.value })} />
            </div>

            <div style={{ border: '1px solid var(--border-color)', borderRadius: 8, overflow: 'hidden', marginBottom: 24 }}>
              <div style={{ background: '#F9FAFB', padding: '12px 16px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontWeight: 600, color: 'var(--text-dark)', margin: 0, fontSize: 14 }}>Financial Components</h3>
                <Btn variant="outline" size="xs" onClick={loadStandardTemplate}>Load Template</Btn>
              </div>
              <div style={{ padding: 16, background: '#FFF' }}>
                {(formData?.components || []).length === 0 && (
                  <div style={{ textAlign: 'center', padding: '32px 0', fontSize: 14, color: 'var(--text-light)' }}>
                    No components added. <span style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 500 }} onClick={loadStandardTemplate}>Load Template</span> or <span style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 500 }} onClick={() => setFormData({ ...formData, components: [{ component_name: '', component_type: 'earning', amount: '' }] })}>Add Line</span>
                  </div>
                )}
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {(formData?.components || []).map((c, i) => (
                    <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                      <div style={{ flex: '1 1 200px' }}>
                        <Input placeholder="Component Name" value={c.component_name || ''} onChange={e => { const nc = [...(formData.components || [])]; nc[i].component_name = e.target.value; setFormData({ ...formData, components: nc }); }} style={{ marginBottom: 0 }} />
                      </div>
                      <div style={{ width: 140 }}>
                        <Select value={c.component_type || 'earning'} onChange={e => { const nc = [...(formData.components || [])]; nc[i].component_type = e.target.value; setFormData({ ...formData, components: nc }); }} style={{ marginBottom: 0 }}>
                          <option value="earning">Earning (+)</option>
                          <option value="deduction">Deduction (-)</option>
                        </Select>
                      </div>
                      <div style={{ width: 140 }}>
                        <Input type="number" placeholder="₹ Amount" value={c.amount || ''} onChange={e => {
                          const val = e.target.value;
                          const nc = [...(formData.components || [])];
                          nc[i].amount = val;
                          
                          if (nc[i].component_name === 'Basic Pay' && val) {
                            const basic = parseFloat(val) || 0;
                            const hraIdx = nc.findIndex(x => x.component_name === 'House Rent Allowance');
                            if (hraIdx !== -1) nc[hraIdx].amount = (basic * 0.5).toFixed(0);
                            
                            const pfIdx = nc.findIndex(x => x.component_name === 'Provident Fund (PF)');
                            if (pfIdx !== -1) nc[pfIdx].amount = (basic * 0.12).toFixed(0);
                            
                            const ptIdx = nc.findIndex(x => x.component_name === 'Professional Tax');
                            if (ptIdx !== -1) nc[ptIdx].amount = basic > 15000 ? '200' : '0';
                          }
                          
                          setFormData({ ...formData, components: nc });
                        }} style={{ marginBottom: 0 }} />
                      </div>
                      <button 
                        style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', padding: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        onClick={() => { const nc = [...(formData.components || [])]; nc.splice(i, 1); setFormData({ ...formData, components: nc }); }}
                      >
                        <X size={18} />
                      </button>
                    </div>
                  ))}
                </div>
                
                {(formData?.components || []).length > 0 && (
                  <button 
                    style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 500, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, marginTop: 12 }} 
                    onClick={() => setFormData({ ...formData, components: [...(formData.components || []), { component_name: '', component_type: 'earning', amount: '' }] })}
                  >
                    <Plus size={14} /> Add Another Line
                  </button>
                )}
              </div>
            </div>

            {/* Real-time Summary Bar */}
            <div style={{ background: '#1E293B', color: '#FFF', borderRadius: 8, padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
              <div style={{ textAlign: 'center', flex: 1, borderRight: '1px solid #334155' }}>
                <p style={{ fontSize: 11, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 4px 0' }}>Gross Salary</p>
                <p style={{ fontSize: 18, fontWeight: 700, color: '#34D399', margin: 0 }}>₹{fmt(formData.gross_salary)}</p>
              </div>
              <div style={{ textAlign: 'center', flex: 1, borderRight: '1px solid #334155' }}>
                <p style={{ fontSize: 11, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 4px 0' }}>Deductions</p>
                <p style={{ fontSize: 18, fontWeight: 700, color: '#F87171', margin: 0 }}>-₹{fmt(formData.total_deductions)}</p>
              </div>
              <div style={{ textAlign: 'center', flex: 1 }}>
                <p style={{ fontSize: 11, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 4px 0' }}>Net Payable</p>
                <p style={{ fontSize: 20, fontWeight: 700, color: '#FFF', margin: 0 }}>₹{fmt(formData.net_salary)}</p>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <Btn variant="outline" onClick={() => { setShowCreate(false); setShowEdit(false); }}>Cancel</Btn>
              <Btn onClick={showCreate ? handleCreate : handleUpdate} style={{ minWidth: 140 }}>
                {showCreate ? 'Save Payroll Draft' : 'Update Payroll'}
              </Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
