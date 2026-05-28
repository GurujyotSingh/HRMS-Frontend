import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { payrollAPI, employeesAPI, salaryStructureAPI, aiAPI } from '../services/api';
import {
  PageHeader, Card, Table, Btn, Modal, Input, Badge, Tabs, toast,
} from '../components/ui';
import { FileText, Plus, Check, Settings } from 'lucide-react';
import { Select } from '../components/ui';

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

export default function Payroll() {
  const { hasRole, user } = useAuth();
  const [tab, setTab]               = useState('my');
  const [myPayslips, setMyPayslips] = useState([]);
  const [allPayslips, setAllPayslips] = useState([]);
  const [employees, setEmployees]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showGenerate, setShowGenerate] = useState(false);
  const [showStructure, setShowStructure] = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [aiLoading, setAiLoading]   = useState(false);
  const [aiText, setAiText]         = useState('');

  const [genForm, setGenForm] = useState({ employee_id: '', month: '', year: new Date().getFullYear() });
  const [structForm, setStructForm] = useState({
    employee_id: '', basicSalary: '', hra: '', ta: '', da: '',
    otherAllowances: '', pfDeduction: '', professionalTax: '', tdsRate: '',
    workingDaysPerMonth: 26,
  });

  const isHR   = hasRole('admin', 'hr', 'hr_staff');
  const canGen = hasRole('admin', 'hr');

  const tabs = [
    { key: 'my',  label: 'My Payslips' },
    ...(isHR ? [{ key: 'all', label: 'All Payslips' }] : []),
  ];

  const loadData = async () => {
    setLoading(true);
    try {
      // My payslips (employees see their own finalized ones)
      const { data: me } = await payrollAPI.list({ status: 'PUBLISHED' });
      setMyPayslips(Array.isArray(me) ? me : (me?.data || []));

      if (isHR) {
        const [{ data: all }, { data: emps }] = await Promise.all([
          payrollAPI.list({}),
          employeesAPI.list(),
        ]);
        setAllPayslips(Array.isArray(all) ? all : (all?.data || []));
        setEmployees(Array.isArray(emps) ? emps : (emps?.data || []));
      }
    } catch (e) {
      toast(e.response?.data?.message || 'Failed to load payroll data', 'error');
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadData(); }, []);

  // ── Handlers ───────────────────────────────────────────────────────

  const handleGenerate = async (e) => {
    e.preventDefault();
    setGenerating(true);
    try {
      await payrollAPI.generate({
        employee_id: genForm.employee_id,
        month: Number(genForm.month),
        year: Number(genForm.year),
      });
      toast('Payslip generated successfully', 'success');
      setShowGenerate(false);
      setGenForm({ employee_id: '', month: '', year: new Date().getFullYear() });
      loadData();
    } catch (e) {
      toast(e.response?.data?.message || 'Failed to generate payslip', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleSetStructure = async (e) => {
    e.preventDefault();
    setGenerating(true);
    try {
      await salaryStructureAPI.set(structForm.employee_id, {
        basicSalary:        parseFloat(structForm.basicSalary) || 0,
        hra:                parseFloat(structForm.hra) || 0,
        ta:                 parseFloat(structForm.ta) || 0,
        da:                 parseFloat(structForm.da) || 0,
        otherAllowances:    parseFloat(structForm.otherAllowances) || 0,
        pfDeduction:        parseFloat(structForm.pfDeduction) || 0,
        professionalTax:    parseFloat(structForm.professionalTax) || 0,
        tdsRate:            parseFloat(structForm.tdsRate) || 0,
        workingDaysPerMonth: parseInt(structForm.workingDaysPerMonth) || 26,
      });
      toast('Salary structure saved successfully', 'success');
      setShowStructure(false);
    } catch (e) {
      toast(e.response?.data?.message || 'Failed to save salary structure', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handlePublish = async (id) => {
    try {
      await payrollAPI.publish(id);
      toast('Payslip published — employee can now view it', 'success');
      loadData();
    } catch (e) {
      toast(e.response?.data?.message || 'Failed to publish', 'error');
    }
  };

  const handleLoadStructure = async (empId) => {
    if (!empId) return;
    try {
      const { data } = await salaryStructureAPI.get(empId);
      if (data) {
        setStructForm({
          employee_id: empId,
          basicSalary: data.basicSalary ?? '',
          hra: data.hra ?? '',
          ta: data.ta ?? '',
          da: data.da ?? '',
          otherAllowances: data.otherAllowances ?? '',
          pfDeduction: data.pfDeduction ?? '',
          professionalTax: data.professionalTax ?? '',
          tdsRate: data.tdsRate ?? '',
          workingDaysPerMonth: data.workingDaysPerMonth ?? 26,
        });
      }
    } catch { /* no existing structure, keep blank */ }
  };

  const handleAiExplain = async () => {
    setAiLoading(true);
    setAiText('');
    try {
      const { data } = await aiAPI.chat(
        `Explain this payslip in simple terms for an employee:\n` +
        `Month: ${MONTHS[(showDetail.month || 1) - 1]} ${showDetail.year}\n` +
        `Basic: ₹${showDetail.basicSalary}, HRA: ₹${showDetail.hra}, TA: ₹${showDetail.ta}, DA: ₹${showDetail.da}\n` +
        `Gross: ₹${showDetail.grossSalary}, Absent Deduction: ₹${showDetail.absentDeduction}\n` +
        `PF: ₹${showDetail.pfDeduction}, Professional Tax: ₹${showDetail.professionalTax}, TDS: ₹${showDetail.tdsDeduction}\n` +
        `Net Pay: ₹${showDetail.netSalary}`
      );
      setAiText(data?.reply || data?.message || 'AI explanation unavailable');
    } catch {
      toast('AI explain unavailable', 'error');
    } finally {
      setAiLoading(false);
    }
  };

  // ── Table columns ──────────────────────────────────────────────────

  const periodCol = {
    key: 'month', label: 'Period',
    render: (r) => <span style={{ fontWeight: 500 }}>{MONTHS[(r.month || 1) - 1]} {r.year}</span>,
  };
  const statusCol = {
    key: 'status', label: 'Status',
    render: (r) => (
      <Badge variant={r.status === 'PUBLISHED' ? 'success' : 'warning'}>
        {r.status === 'PUBLISHED' ? 'Published' : 'Draft'}
      </Badge>
    ),
  };

  const myCols = [
    periodCol,
    { key: 'grossSalary',    label: 'Gross',       render: (r) => fmt(r.grossSalary) },
    { key: 'totalDeductions',label: 'Deductions',  render: (r) => <span style={{ color: 'var(--danger)' }}>{fmt(r.totalDeductions)}</span> },
    { key: 'netSalary',      label: 'Net Pay',     render: (r) => <span style={{ fontWeight: 700, color: 'var(--success)' }}>{fmt(r.netSalary)}</span> },
    statusCol,
    { key: 'view', label: '', render: (r) => (
      <Btn variant="ghost" size="xs" onClick={() => { setShowDetail(r); setAiText(''); }}><FileText size={14} /> View</Btn>
    )},
  ];

  const allCols = [
    { key: 'empId',   label: 'Emp ID', render: (r) => r.employee?.employee_id || '—' },
    { key: 'empName', label: 'Name',   render: (r) => `${r.employee?.first_name || ''} ${r.employee?.last_name || ''}` },
    { key: 'dept',    label: 'Dept',   render: (r) => r.employee?.department?.name || '—' },
    periodCol,
    { key: 'grossSalary', label: 'Gross',   render: (r) => fmt(r.grossSalary) },
    { key: 'netSalary',   label: 'Net Pay', render: (r) => <span style={{ fontWeight: 700, color: 'var(--success)' }}>{fmt(r.netSalary)}</span> },
    statusCol,
    { key: 'act', label: '', render: (r) => (
      <div style={{ display: 'flex', gap: 6 }}>
        <Btn variant="ghost" size="xs" onClick={() => { setShowDetail(r); setAiText(''); }}><FileText size={14} /></Btn>
        {canGen && r.status === 'DRAFT' && (
          <Btn variant="success" size="xs" onClick={() => handlePublish(r.id)}><Check size={13} /> Publish</Btn>
        )}
      </div>
    )},
  ];

  // ── Render ─────────────────────────────────────────────────────────

  return (
    <>
      <PageHeader
        title="Payroll"
        subtitle="Payslips, salary structures and payroll management"
        actions={
          isHR ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <Btn variant="secondary" size="sm" onClick={() => setShowStructure(true)}>
                <Settings size={15} /> Set Structure
              </Btn>
              {canGen && (
                <Btn size="sm" onClick={() => setShowGenerate(true)}>
                  <Plus size={15} /> Generate Payslip
                </Btn>
              )}
            </div>
          ) : null
        }
      />

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px 0' }}>
          <Tabs tabs={tabs} active={tab} onChange={setTab} />
        </div>
        {tab === 'my'  && <Table cols={myCols}  rows={myPayslips}  loading={loading} emptyMsg="No payslips available" />}
        {tab === 'all' && <Table cols={allCols} rows={allPayslips} loading={loading} emptyMsg="No payslips found" />}
      </Card>

      {/* ── Generate Modal ── */}
      <Modal open={showGenerate} onClose={() => setShowGenerate(false)} title="Generate Payslip" width={440}>
        <form onSubmit={handleGenerate}>
          <Select
            label="Employee"
            value={genForm.employee_id}
            onChange={(e) => setGenForm({ ...genForm, employee_id: e.target.value })}
            required id="gen-emp"
          >
            <option value="">-- Select Employee --</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.first_name} {e.last_name} ({e.employee_id})
              </option>
            ))}
          </Select>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <Select label="Month" value={genForm.month} onChange={(e) => setGenForm({ ...genForm, month: e.target.value })} required id="gen-month">
              <option value="">Month</option>
              {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
            </Select>
            <Input label="Year" type="number" min="2020" max="2030" value={genForm.year}
              onChange={(e) => setGenForm({ ...genForm, year: e.target.value })} required id="gen-year" />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
            <Btn variant="secondary" type="button" onClick={() => setShowGenerate(false)}>Cancel</Btn>
            <Btn type="submit" loading={generating}>Generate</Btn>
          </div>
        </form>
      </Modal>

      {/* ── Salary Structure Modal ── */}
      <Modal open={showStructure} onClose={() => setShowStructure(false)} title="Set Salary Structure" width={620}>
        <form onSubmit={handleSetStructure}>
          <Select
            label="Employee"
            value={structForm.employee_id}
            onChange={(e) => { setStructForm({ ...structForm, employee_id: e.target.value }); handleLoadStructure(e.target.value); }}
            required id="struct-emp"
          >
            <option value="">-- Select Employee --</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>{e.first_name} {e.last_name} ({e.employee_id})</option>
            ))}
          </Select>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <Input label="Basic Salary (₹)" type="number" step="0.01" required value={structForm.basicSalary} onChange={(e) => setStructForm({ ...structForm, basicSalary: e.target.value })} id="s-basic" />
            <Input label="HRA (₹)" type="number" step="0.01" value={structForm.hra} onChange={(e) => setStructForm({ ...structForm, hra: e.target.value })} id="s-hra" />
            <Input label="TA — Travel Allowance (₹)" type="number" step="0.01" value={structForm.ta} onChange={(e) => setStructForm({ ...structForm, ta: e.target.value })} id="s-ta" />
            <Input label="DA — Dearness Allowance (₹)" type="number" step="0.01" value={structForm.da} onChange={(e) => setStructForm({ ...structForm, da: e.target.value })} id="s-da" />
            <Input label="Other Allowances (₹)" type="number" step="0.01" value={structForm.otherAllowances} onChange={(e) => setStructForm({ ...structForm, otherAllowances: e.target.value })} id="s-other" />
            <Input label="PF Deduction (₹/month)" type="number" step="0.01" value={structForm.pfDeduction} onChange={(e) => setStructForm({ ...structForm, pfDeduction: e.target.value })} id="s-pf" />
            <Input label="Professional Tax (₹/month)" type="number" step="0.01" value={structForm.professionalTax} onChange={(e) => setStructForm({ ...structForm, professionalTax: e.target.value })} id="s-pt" />
            <Input label="TDS Rate (%)" type="number" step="0.01" min="0" max="40" value={structForm.tdsRate} onChange={(e) => setStructForm({ ...structForm, tdsRate: e.target.value })} id="s-tds" />
            <Input label="Working Days/Month" type="number" min="1" max="31" value={structForm.workingDaysPerMonth} onChange={(e) => setStructForm({ ...structForm, workingDaysPerMonth: e.target.value })} id="s-days" />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
            <Btn variant="secondary" type="button" onClick={() => setShowStructure(false)}>Cancel</Btn>
            <Btn type="submit" loading={generating}>Save Structure</Btn>
          </div>
        </form>
      </Modal>

      {/* ── Payslip Detail Modal ── */}
      <Modal open={!!showDetail} onClose={() => { setShowDetail(null); setAiText(''); }} title="Payslip Details" width={520}>
        {showDetail && (
          <div>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--border-color)' }}>
              <h3 style={{ fontSize: 18, marginBottom: 6 }}>
                {MONTHS[(showDetail.month || 1) - 1]} {showDetail.year}
              </h3>
              {showDetail.employee && (
                <div style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 6 }}>
                  {showDetail.employee.first_name} {showDetail.employee.last_name} · {showDetail.employee.department?.name || ''}
                </div>
              )}
              <Badge variant={showDetail.status === 'PUBLISHED' ? 'success' : 'warning'}>{showDetail.status}</Badge>
            </div>

            {/* Attendance summary */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 20, justifyContent: 'center' }}>
              {[
                ['Working Days', showDetail.workingDays],
                ['Present', showDetail.daysPresent],
                ['Absent', showDetail.daysAbsent],
                ['On Leave', showDetail.daysOnLeave],
              ].map(([l, v]) => (
                <div key={l} style={{ textAlign: 'center', padding: '8px 14px', background: 'var(--gray-50)', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>{v ?? '—'}</div>
                  <div style={{ fontSize: 11, color: 'var(--gray-500)' }}>{l}</div>
                </div>
              ))}
            </div>

            <div style={{ background: 'var(--gray-100)', borderRadius: 10, padding: 20 }}>
              {/* Earnings */}
              <h4 style={{ fontSize: 11, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Earnings</h4>
              {[
                ['Basic Salary', showDetail.basicSalary],
                ['HRA', showDetail.hra],
                ['Travel Allowance (TA)', showDetail.ta],
                ['Dearness Allowance (DA)', showDetail.da],
                ['Other Allowances', showDetail.otherAllowances],
                ['Gross Salary', showDetail.grossSalary],
              ].map(([label, val]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', fontSize: 13, borderBottom: label === 'Gross Salary' ? '2px solid var(--border-color)' : '1px solid var(--gray-200)', fontWeight: label === 'Gross Salary' ? 700 : 400 }}>
                  <span style={{ color: 'var(--text-light)' }}>{label}</span>
                  <span>{fmt(val)}</span>
                </div>
              ))}

              {/* Deductions */}
              <h4 style={{ fontSize: 11, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: 16, marginBottom: 10 }}>Deductions</h4>
              {[
                ['Absent Day Deduction', showDetail.absentDeduction],
                ['Provident Fund (PF)', showDetail.pfDeduction],
                ['Professional Tax', showDetail.professionalTax],
                ['TDS', showDetail.tdsDeduction],
                ['Total Deductions', showDetail.totalDeductions],
              ].map(([label, val]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', fontSize: 13, borderBottom: label === 'Total Deductions' ? '2px solid var(--border-color)' : '1px solid var(--gray-200)', fontWeight: label === 'Total Deductions' ? 700 : 400, color: label === 'Total Deductions' ? 'var(--danger)' : 'inherit' }}>
                  <span style={{ color: 'var(--text-light)' }}>{label}</span>
                  <span>{fmt(val)}</span>
                </div>
              ))}

              {/* Net */}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 0 4px', fontSize: 20, fontWeight: 700, color: 'var(--success)' }}>
                <span>Net Pay</span>
                <span>{fmt(showDetail.netSalary)}</span>
              </div>
            </div>

            {/* AI Explain */}
            <div style={{ marginTop: 18 }}>
              <Btn variant="outline" size="sm" onClick={handleAiExplain} loading={aiLoading} style={{ width: '100%', justifyContent: 'center', display: 'flex' }}>
                <span style={{ marginRight: 6 }}>✨</span> AI Explain This Payslip
              </Btn>
              {aiText && (
                <div style={{ padding: 16, background: '#f8fafc', borderRadius: 8, marginTop: 10, border: '1px solid #e2e8f0', fontSize: 13, color: '#334155', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                  {aiText}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
