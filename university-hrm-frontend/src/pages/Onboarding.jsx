import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { onboardAPI, employeesAPI } from '../services/api';
import {
  PageHeader, Card, Table, Btn, Modal, Input, Textarea, Badge, Tabs, Skeleton, toast, Select, StatCard
} from '../components/ui';
import AsyncEmployeeSelect from '../components/ui/AsyncEmployeeSelect';
import { OnboardingWizard } from '../components/OnboardingWizard';
import { OffboardingWizard } from '../components/OffboardingWizard';
import { CheckCircle2, Circle, UserMinus, Eye, Search, FilterX, Users, UserCheck, TrendingUp, Calendar, AlertTriangle } from 'lucide-react';

// Fixed: Added ONBOARDING_REQUIRED_ROLES for correct metric calculations and visibility filtering
const ONBOARDING_REQUIRED_ROLES = ['DIRECTOR', 'FACULTY', 'STAFF', 'ACCOUNTANT'];

export default function Onboarding() {
  const { user, hasRole } = useAuth();
  const [tab, setTab] = useState('onboarding');
  const [myRecord, setMyRecord] = useState(null);
  const [allRecords, setAllRecords] = useState([]);
  const [offRecords, setOffRecords] = useState([]);
  const [empList, setEmpList] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showInitOff, setShowInitOff] = useState(false);
  const [offForm, setOffForm] = useState({ employee_id: '', reason: '', last_working_date: '' });
  const [submitting, setSubmitting] = useState(false);
  const [viewOff, setViewOff] = useState(null);

  // Enterprise Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [viewOnboarding, setViewOnboarding] = useState(null);

  // Offboarding Filters
  const [offSearchQuery, setOffSearchQuery] = useState('');
  const [offClearanceFilter, setOffClearanceFilter] = useState('');

  const isPrivileged = hasRole('admin', 'hr', 'hr_manager', 'hr_staff');

  const tabs = [
    { key: 'onboarding', label: 'Onboarding' },
    ...(isPrivileged ? [{ key: 'offboarding', label: 'Offboarding' }] : []),
  ];

  const loadData = async () => {
    setLoading(true);
    try {
      // Load own onboarding
      try {
        const { data } = await onboardAPI.myRecord();
        setMyRecord(data?.data || data);
      } catch {
        setMyRecord(null);
      }

      // HR: all records
      if (isPrivileged) {
        try {
          const { data } = await onboardAPI.allRecords();
          const records = data?.data || data || [];
          console.log(`[Debugging] Total Onboarding Records found: ${records.length}`);
          setAllRecords(records);
        } catch (e) {
          console.error('[Debugging] Database/API query error fetching onboarding records:', e);
          setAllRecords([]);
        }

        try {
          const { data } = await onboardAPI.offAll();
          setViewOff(null); // Clear active detail view during refresh if needed
          setOffRecords(data?.data || data || []);
        } catch { setOffRecords([]); }

        try {
          const { data } = await employeesAPI.list();
          const employees = data?.items || data?.data || data || [];
          console.log(`[Debugging] Total Employees found: ${employees.length}`);
          setEmpList(employees);
        } catch (e) {
          console.error('[Debugging] Database/API query error fetching employees:', e);
          setEmpList([]);
        }
      }
    } catch (e) {
      toast('Failed to load onboarding data', 'error');
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadData(); }, []);

  const handleCompleteTask = async (taskId) => {
    try {
      await onboardAPI.completeTask(taskId);
      toast('Task completed!', 'success');
      loadData();
    } catch (e) {
      toast(e.response?.data?.message || 'Failed to complete task', 'error');
    }
  };

  const handleHRCompleteTask = async (employeeId, taskId) => {
    try {
      await onboardAPI.hrCompleteTask(taskId);
      toast('HR task completed!', 'success');
      loadData();

      setViewOnboarding((prev) => {
        if (!prev) return prev;
        const newRecord = { ...prev.record };
        if (newRecord.tasks) {
          const tIndex = newRecord.tasks.findIndex(t => t.id === taskId);
          if (tIndex > -1) {
            newRecord.tasks[tIndex].is_completed = true;
          }
        }
        return { ...prev, record: newRecord };
      });

    } catch (e) {
      toast(e.response?.data?.message || 'Failed to complete HR task', 'error');
    }
  };

  const handleStartOnboarding = async (employeeId) => {
    try {
      await onboardAPI.create({ employee_id: employeeId });
      toast('Onboarding started successfully!', 'success');
      loadData();
    } catch (e) {
      toast(e.response?.data?.message || 'Failed to start onboarding', 'error');
    }
  };

  const handleOffCompleteTask = async (recordId, taskId) => {
    try {
      await onboardAPI.offCompleteTask(recordId, taskId);
      toast('Offboarding task completed!', 'success');
      // Update local view manually to avoid full reload flicker
      setViewOff((prev) => {
        if (!prev) return prev;
        const newTasks = prev.tasks.map(t => t.id === taskId ? { ...t, isCompleted: true } : t);
        return { ...prev, tasks: newTasks };
      });
      loadData();
    } catch (e) {
      toast(e.response?.data?.message || 'Failed to complete offboarding task', 'error');
    }
  };




  if (loading) {
    return (
      <>
        <PageHeader title="Onboarding & Offboarding" subtitle="Track employee onboarding tasks and offboarding processes" />
        <Skeleton width="100%" height="40px" style={{ marginBottom: 24 }} />
        <Card style={{ marginBottom: 24 }}>
          <div style={{ marginBottom: 16 }}>
            <Skeleton width="200px" height="20px" style={{ marginBottom: 8 }} />
            <Skeleton width="120px" height="14px" />
          </div>
          <Skeleton width="100%" height="8px" style={{ marginBottom: 20 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[1, 2, 3].map(i => (
              <Skeleton key={i} width="100%" height="52px" style={{ borderRadius: '6px' }} />
            ))}
          </div>
        </Card>
      </>
    );
  }

  const completedTasks = myRecord?.tasks?.filter((t) => t.isCompleted)?.length || 0;
  const totalTasks = myRecord?.tasks?.length || 0;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Enterprise HR Calculations
  const eligibleEmpList = (empList || []).filter(e => ONBOARDING_REQUIRED_ROLES.includes(e.role));

  const stats = { total: 0, notStarted: 0, inProgress: 0, completed: 0 };
  if (eligibleEmpList) {
    stats.total = eligibleEmpList.length;
    eligibleEmpList.forEach(e => {
      const rec = allRecords.find(or => or.employee_id === e.id);
      if (!rec) stats.notStarted++;
      else if (rec.status === 'COMPLETED') stats.completed++;
      else stats.inProgress++;
    });
  }

  const uniqueDepts = [...new Set(eligibleEmpList.map(e => e.employment?.department?.name).filter(Boolean))].sort();

  const filteredEmployees = eligibleEmpList.filter(e => {
    const rec = allRecords.find(or => or.employee_id === e.id);
    const status = !rec ? 'Not Started' : rec.status;

    const name = `${e.first_name || ''} ${e.last_name || ''}`.toLowerCase();
    if (searchQuery && !name.includes(searchQuery.toLowerCase()) && !e.id.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (deptFilter && e.employment?.department?.name !== deptFilter) return false;
    if (statusFilter === 'NOT_STARTED' && status !== 'Not Started') return false;
    if (statusFilter === 'IN_PROGRESS' && status !== 'IN_PROGRESS') return false;
    if (statusFilter === 'COMPLETED' && status !== 'COMPLETED') return false;

    return true;
  });

  // Offboarding HR Calculations
  const offStats = { total: offRecords.length, pending: 0, cleared: 0, hold: 0 };
  offRecords.forEach(r => {
    if (r.clearanceStatus === 'CLEARED') offStats.cleared++;
    else if (r.clearanceStatus === 'HOLD') offStats.hold++;
    else offStats.pending++;
  });

  const filteredOffRecords = offRecords.filter(r => {
    const name = `${r.employee?.first_name || ''} ${r.employee?.last_name || ''}`.toLowerCase();
    if (offSearchQuery && !name.includes(offSearchQuery.toLowerCase())) return false;
    
    const status = r.clearanceStatus || 'PENDING';
    if (offClearanceFilter && status !== offClearanceFilter) return false;
    
    return true;
  });

  return (
    <>
      <PageHeader
        title="Onboarding & Offboarding"
        subtitle="Track employee onboarding tasks and offboarding processes"
        actions={
          isPrivileged && (
            <Btn onClick={() => setShowInitOff(true)}>
              <UserMinus size={16} /> Initiate Offboarding
            </Btn>
          )
        }
      />

      <Tabs tabs={tabs} active={tab} onChange={setTab} />

      {/* Onboarding Tab */}
      {tab === 'onboarding' && (
        <>
          {/* My onboarding checklist */}
          {myRecord && ONBOARDING_REQUIRED_ROLES.includes(user?.role) && (
            <div style={{ marginBottom: 24 }}>
              <OnboardingWizard record={{ ...myRecord, employee: user }} isHR={false} onCompleteTask={handleCompleteTask} />
            </div>
          )}

          {/* HR view: all onboarding records */}
          {isPrivileged && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                <StatCard label="Total Employees" value={stats.total} icon={<Users size={24} color="var(--primary)" />} />
                <StatCard label="Not Started" value={stats.notStarted} icon={<UserMinus size={24} color="var(--gray-500)" />} />
                <StatCard label="In Progress" value={stats.inProgress} icon={<TrendingUp size={24} color="#3b82f6" />} />
                <StatCard label="Completed" value={stats.completed} icon={<UserCheck size={24} color="var(--success)" />} />
              </div>

              <Card style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                  <h3 style={{ fontSize: 16, margin: 0, marginRight: 'auto' }}>All Onboarding Records</h3>
                  <Input
                    prefix={<Search size={16} />}
                    placeholder="Search employees..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    style={{ width: 220, marginBottom: 0 }}
                  />
                  <Select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} style={{ width: 180, marginBottom: 0 }}>
                    <option value="">All Departments</option>
                    {uniqueDepts.map(d => <option key={d} value={d}>{d}</option>)}
                  </Select>
                  <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ width: 160, marginBottom: 0 }}>
                    <option value="">All Statuses</option>
                    <option value="NOT_STARTED">Not Started</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                  </Select>
                  {(searchQuery || deptFilter || statusFilter) && (
                    <Btn variant="secondary" onClick={() => { setSearchQuery(''); setDeptFilter(''); setStatusFilter(''); }}>
                      <FilterX size={16} /> Clear
                    </Btn>
                  )}
                </div>
                <Table
                  cols={[
                    { key: 'emp_id', label: 'Employee ID', render: (r) => r.id.substring(0, 8).toUpperCase() },
                    { key: 'emp', label: 'Employee', render: (r) => `${r.first_name || ''} ${r.last_name || ''}` },
                    { key: 'dept', label: 'Department', render: (r) => r.employment?.department?.name || '—' },
                    { key: 'role', label: 'Role', render: (r) => (r.role || '—').replace('_', ' ') },
                    { key: 'joined', label: 'Joining Date', render: (r) => r.created_at ? new Date(r.created_at).toLocaleDateString() : '—' },
                    {
                      key: 'status', label: 'Status', render: (r) => {
                        const rec = allRecords.find(or => or.employee_id === r.id);
                        if (!rec) return <Badge variant="secondary">Not Started</Badge>;
                        return <Badge variant={rec.status === 'COMPLETED' ? 'success' : 'info'}>{rec.status}</Badge>;
                      }
                    },
                    {
                      key: 'tasks', label: 'Progress', render: (r) => {
                        const rec = allRecords.find(or => or.employee_id === r.id);
                        if (!rec) return '—';
                        const done = rec.tasks?.filter((t) => t.is_completed)?.length || 0;
                        const total = rec.tasks?.length || 0;
                        const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                        return (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ flex: 1, height: 6, background: 'var(--gray-200)', borderRadius: 3, width: 60, overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${pct}%`, background: pct === 100 ? 'var(--success)' : '#3b82f6', transition: 'width 0.3s' }} />
                            </div>
                            <span style={{ fontSize: 12, color: 'var(--gray-600)', minWidth: 28 }}>{pct}%</span>
                          </div>
                        );
                      }
                    },
                    {
                      key: 'actions', label: '', render: (r) => {
                        const rec = allRecords.find(or => or.employee_id === r.id);
                        if (!rec) {
                          return (
                            <Btn size="xs" onClick={() => handleStartOnboarding(r.id)}>
                              Start Onboarding
                            </Btn>
                          );
                        }
                        return (
                          <Btn variant="secondary" size="xs" onClick={() => setViewOnboarding({ emp: r, record: rec })}>
                            <Eye size={13} /> View
                          </Btn>
                        );
                      }
                    },
                  ]}
                  rows={filteredEmployees}
                  loading={false}
                  emptyMsg={
                    empList.length === 0
                      ? "No employees available."
                      : filteredEmployees.length === 0
                        ? "No employees match your filters."
                        : "No onboarding records found. Start onboarding for an employee."
                  }
                />
              </Card>
            </>
          )}
        </>
      )}

      {/* Offboarding Tab */}
      {tab === 'offboarding' && isPrivileged && (
        <>
          {/* KPI StatCards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <StatCard label="Total Offboarding" value={offStats.total} icon={<Users size={24} color="var(--primary)" />} />
            <StatCard label="Pending Clearance" value={offStats.pending} icon={<UserMinus size={24} color="var(--gray-500)" />} />
            <StatCard label="On Hold" value={offStats.hold} icon={<AlertTriangle size={24} color="var(--danger)" />} />
            <StatCard label="Cleared" value={offStats.cleared} icon={<UserCheck size={24} color="var(--success)" />} />
          </div>

          <Card style={{ padding: 0, overflow: 'hidden' }}>
            {/* Filter Bar */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <h3 style={{ fontSize: 16, margin: 0, marginRight: 'auto' }}>Offboarding Pipeline</h3>
              <Input
                prefix={<Search size={16} />}
                placeholder="Search employees..."
                value={offSearchQuery}
                onChange={e => setOffSearchQuery(e.target.value)}
                style={{ width: 220, marginBottom: 0 }}
              />
              <Select value={offClearanceFilter} onChange={e => setOffClearanceFilter(e.target.value)} style={{ width: 180, marginBottom: 0 }}>
                <option value="">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="HOLD">On Hold</option>
                <option value="CLEARED">Cleared</option>
              </Select>
              {(offSearchQuery || offClearanceFilter) && (
                <Btn variant="secondary" onClick={() => { setOffSearchQuery(''); setOffClearanceFilter(''); }}>
                  <FilterX size={16} /> Clear
                </Btn>
              )}
              <div style={{ width: 1, height: 24, background: 'var(--border-color)', margin: '0 8px' }} />
              <Btn size="sm" onClick={() => setShowInitOff(true)}>
                <UserMinus size={16} /> Initiate Offboarding
              </Btn>
            </div>
          <Table
            cols={[
              { key: 'emp', label: 'Employee', render: (r) => `${r.employee?.first_name || ''} ${r.employee?.last_name || ''}` },
              { key: 'reason', label: 'Reason', render: (r) => r.reason || '—' },
              { key: 'lastWorkingDate', label: 'Last Day', render: (r) => new Date(r.last_working_date).toLocaleDateString() },
              {
                key: 'clearanceStatus', label: 'Clearance', render: (r) => (
                  <Badge variant={r.clearanceStatus === 'CLEARED' ? 'success' : r.clearanceStatus === 'HOLD' ? 'danger' : 'warning'}>
                    {r.clearanceStatus || 'PENDING'}
                  </Badge>
                )
              },
              {
                key: 'tasks', label: 'Clearance Progress', render: (r) => {
                  const done = r.tasks?.filter((t) => t.is_completed)?.length || 0;
                  const total = r.tasks?.length || 0;
                  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                  return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, height: 6, background: 'var(--gray-200)', borderRadius: 3, width: 60, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: pct === 100 ? 'var(--success)' : '#3b82f6', transition: 'width 0.3s' }} />
                      </div>
                      <span style={{ fontSize: 12, color: 'var(--gray-600)', minWidth: 28 }}>{pct}%</span>
                    </div>
                  );
                }
              },
              {
                key: 'actions', label: '', render: (r) => (
                  <Btn variant="secondary" size="xs" onClick={() => setViewOff(r)}>
                    <Eye size={13} /> Details
                  </Btn>
                )
              },
            ]}
            rows={filteredOffRecords}
            loading={false}
            emptyMsg="No offboarding records match the filters."
          />
        </Card>
        </>
      )}

      {/* Initiate Offboarding Wizard */}
      <OffboardingWizard 
        open={showInitOff} 
        onClose={() => setShowInitOff(false)} 
        onSuccess={loadData} 
      />

      {/* View Offboarding Details Modal */}
      {viewOff && (
        <Modal open={!!viewOff} onClose={() => setViewOff(null)} title="Offboarding Details" width={600}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Employee Summary Card */}
            <div style={{ padding: 16, background: 'var(--gray-50)', borderRadius: 8, border: '1px solid var(--gray-200)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: 16, color: 'var(--gray-800)' }}>
                    {viewOff.employee?.first_name} {viewOff.employee?.last_name}
                  </h4>
                  <div style={{ fontSize: 13, color: 'var(--gray-500)' }}>{viewOff.employee?.email}</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Badge variant="info">{viewOff.status}</Badge>
                  <Badge variant={viewOff.clearanceStatus === 'CLEARED' ? 'success' : viewOff.clearanceStatus === 'HOLD' ? 'danger' : 'warning'}>
                    {viewOff.clearanceStatus || 'PENDING'} Clearance
                  </Badge>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13 }}>
                <div>
                  <span style={{ color: 'var(--gray-500)', display: 'block', marginBottom: 2 }}>Last Working Date</span>
                  <span style={{ fontWeight: 600, color: 'var(--gray-800)' }}>{new Date(viewOff.last_working_date).toLocaleDateString()}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--gray-500)', display: 'block', marginBottom: 2 }}>Reason</span>
                  <span style={{ fontWeight: 500, color: 'var(--gray-800)' }}>{viewOff.reason || '—'}</span>
                </div>
              </div>
              
              {viewOff.notes && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--gray-200)', fontSize: 13 }}>
                  <span style={{ color: 'var(--gray-500)', display: 'block', marginBottom: 2 }}>HR Notes</span>
                  <span style={{ color: 'var(--gray-700)' }}>{viewOff.notes}</span>
                </div>
              )}
            </div>

            {/* Clearance Checklist */}
            <div>
              <h4 style={{ margin: '0 0 12px 0', fontSize: 15, color: 'var(--gray-700)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle2 size={18} color="var(--primary)" /> Clearance Checklist
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {viewOff.tasks?.length === 0 ? (
                  <div style={{ padding: 20, textAlign: 'center', background: 'var(--gray-50)', borderRadius: 8, color: 'var(--gray-500)', fontSize: 13 }}>
                    No clearance tasks generated for this employee.
                  </div>
                ) : (
                  viewOff.tasks?.map((task) => (
                    <div
                      key={task.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                        background: task.is_completed ? 'rgba(16, 185, 129, 0.05)' : 'white',
                        borderRadius: '8px',
                        border: `1px solid ${task.is_completed ? 'var(--success)' : 'var(--gray-200)'}`,
                        boxShadow: task.is_completed ? 'none' : '0 1px 2px rgba(0,0,0,0.02)',
                        transition: 'all 0.2s'
                      }}
                    >
                      {task.is_completed ? (
                        <CheckCircle2 size={20} color="var(--success)" />
                      ) : (
                        <button
                          onClick={() => handleOffCompleteTask(viewOff.id, task.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}
                          title="Mark as completed"
                        >
                          <Circle size={20} color="var(--gray-400)" />
                        </button>
                      )}
                      <div style={{ flex: 1, fontSize: 14 }}>
                        <div style={{ fontWeight: 600, color: task.is_completed ? 'var(--gray-500)' : 'var(--gray-800)', textDecoration: task.is_completed ? 'line-through' : 'none' }}>
                          {task.title}
                        </div>
                        {task.description && <div style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 2 }}>{task.description}</div>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          
          <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--gray-200)', textAlign: 'right' }}>
            <Btn variant="secondary" onClick={() => setViewOff(null)}>Close</Btn>
          </div>
        </Modal>
      )}

      {/* View Onboarding Details Modal */}
      {viewOnboarding && (
        <Modal open={!!viewOnboarding} onClose={() => setViewOnboarding(null)} title="Onboarding Details" width={640}>
          <div style={{ margin: '-16px -24px' }}>
            <OnboardingWizard
              record={{ ...viewOnboarding.record, employee: viewOnboarding.emp }}
              isHR={true}
              onCompleteTask={(taskId) => handleHRCompleteTask(viewOnboarding.emp.id, taskId)}
            />
          </div>
          <div style={{ marginTop: 24, textAlign: 'right' }}>
            <Btn onClick={() => setViewOnboarding(null)}>Close</Btn>
          </div>
        </Modal>
      )}
    </>
  );
}
