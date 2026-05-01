import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { attendanceAPI } from '../services/api';
import { PageHeader, Card, Table, Btn, Badge, Tabs, Select, Modal, Input, toast } from '../components/ui';
import { LogIn, LogOut, Clock, Edit2 } from 'lucide-react';

export default function Attendance() {
  const { hasRole } = useAuth();
  const [tab, setTab] = useState('clock');
  const [todayStatus, setTodayStatus] = useState(null);
  const [myRecords, setMyRecords] = useState([]);
  const [hrToday, setHrToday] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clocking, setClocking] = useState(false);
  const [editAtt, setEditAtt] = useState(null);
  const [editing, setEditing] = useState(false);
  const [time, setTime] = useState(new Date());
  const timerRef = useRef();

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const isHR = hasRole('hr', 'admin', 'hr_staff');

  const tabs = [
    { key: 'clock', label: 'Clock In/Out' },
    { key: 'my', label: 'My Records' },
    ...(isHR ? [{ key: 'hr', label: 'All Employees' }] : []),
  ];

  useEffect(() => {
    timerRef.current = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  const loadToday = async () => {
    try {
      const { data } = await attendanceAPI.today();
      setTodayStatus(data);
    } catch {
      setTodayStatus(null);
    }
  };

  const loadMyRecords = async () => {
    setLoading(true);
    try {
      const { data } = await attendanceAPI.myRecords(month, year);
      setMyRecords(data?.data || data || []);
    } catch (e) {
      toast(e.response?.data?.message || 'Failed to load records', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadHrToday = async () => {
    setLoading(true);
    try {
      const { data } = await attendanceAPI.hrToday();
      setHrToday(data?.data || data || []);
    } catch {
      setHrToday([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAutoClockOut = async () => {
    try {
      const { data } = await attendanceAPI.autoClockOut();
      toast(data.message || 'Auto clock out executed successfully', 'success');
      loadHrToday();
    } catch (e) {
      toast(e.response?.data?.message || 'Failed to execute auto clock-out', 'error');
    }
  };

  useEffect(() => {
    loadToday();
    setLoading(false);
  }, []);

  useEffect(() => {
    if (tab === 'my') loadMyRecords();
    if (tab === 'hr') loadHrToday();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, month, year]);

  const handleClockIn = async () => {
    setClocking(true);
    try {
      await attendanceAPI.clockIn();
      toast('Clocked in successfully!', 'success');
      loadToday();
    } catch (e) {
      toast(e.response?.data?.message || 'Failed to clock in', 'error');
    } finally {
      setClocking(false);
    }
  };

  const handleClockOut = async () => {
    setClocking(true);
    try {
      await attendanceAPI.clockOut();
      toast('Clocked out successfully!', 'success');
      loadToday();
    } catch (e) {
      toast(e.response?.data?.message || 'Failed to clock out', 'error');
    } finally {
      setClocking(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditing(true);
    try {
      await attendanceAPI.hrUpdate(editAtt.id, {
        clockIn: editAtt.clockIn ? new Date(editAtt.clockIn).toISOString() : null,
        clockOut: editAtt.clockOut ? new Date(editAtt.clockOut).toISOString() : null,
        status: editAtt.status,
      });
      toast('Attendance record updated successfully', 'success');
      setEditAtt(null);
      loadHrToday();
    } catch (e) {
      toast(e.response?.data?.message || 'Failed to update attendance', 'error');
    } finally {
      setEditing(false);
    }
  };

  const formatTime = (dt) => {
    if (!dt) return '—';
    return new Date(dt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  const recordCols = [
    { key: 'date', label: 'Date', render: (r) => new Date(r.date).toLocaleDateString('en-IN') },
    { key: 'clockIn', label: 'Clock In', render: (r) => formatTime(r.clockIn) },
    { key: 'clockOut', label: 'Clock Out', render: (r) => formatTime(r.clockOut) },
    { key: 'totalHours', label: 'Hours', render: (r) => r.totalHours ? `${r.totalHours.toFixed(1)}h` : '—' },
    { key: 'isLate', label: 'Late', render: (r) =>
      r.isLate ? <Badge variant="warning">Late</Badge> : <Badge variant="success">On Time</Badge>
    },
    { key: 'status', label: 'Status', render: (r) => (
      <Badge variant={r.status === 'PRESENT' ? 'success' : 'neutral'}>{r.status}</Badge>
    )},
  ];

  const hrCols = [
    { key: 'employeeId', label: 'Emp ID', render: (r) => r.employee?.employeeId || '—' },
    { key: 'employeeName', label: 'Name', render: (r) => `${r.employee?.firstName || ''} ${r.employee?.lastName || ''}` },
    { key: 'clockIn', label: 'Clock In', render: (r) => formatTime(r.clockIn) },
    { key: 'clockOut', label: 'Clock Out', render: (r) => formatTime(r.clockOut) },
    { key: 'totalHours', label: 'Hours', render: (r) => {
      if (!r.totalHours) return '—';
      const isBurnout = r.totalHours > 9;
      return (
        <span style={{ 
          color: isBurnout ? 'var(--danger)' : 'inherit', 
          fontWeight: isBurnout ? 700 : 'normal' 
        }}>
          {r.totalHours.toFixed(1)}h {isBurnout && ' ⚠️'}
        </span>
      );
    }},
    { key: 'isLate', label: 'Late', render: (r) =>
      r.isLate ? <Badge variant="warning">Late</Badge> : <Badge variant="success">On Time</Badge>
    },
    { key: 'actions', label: 'Actions', render: (r) => (
      <Btn variant="secondary" size="xs" onClick={() => setEditAtt(r)}>
        <Edit2 size={13} /> Edit
      </Btn>
    )},
  ];

  return (
    <>
      <PageHeader
        title="Attendance"
        subtitle="Track your daily attendance"
      />

      <Tabs tabs={tabs} active={tab} onChange={setTab} />

      {/* Clock In/Out Tab */}
      {tab === 'clock' && (
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 20 }}>
          <Card style={{ textAlign: 'center', padding: '40px 60px', maxWidth: 480, width: '100%' }}>
            <div style={{ marginBottom: 8 }}>
              <Clock size={40} color="var(--primary)" strokeWidth={1.5} />
            </div>
            <div
              style={{
                fontSize: 52,
                fontWeight: 700,
                letterSpacing: '-0.03em',
                color: 'var(--text-dark)',
                fontVariantNumeric: 'tabular-nums',
                marginBottom: 6,
              }}
            >
              {time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
            <div style={{ fontSize: 14, color: 'var(--gray-500)', marginBottom: 28 }}>
              {time.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>

            {/* Today's status */}
            {todayStatus && (
              <div
                style={{
                  background: 'var(--gray-100)',
                  borderRadius: '10px',
                  padding: '14px 20px',
                  marginBottom: 24,
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                  <span style={{ color: 'var(--gray-500)' }}>Clock In</span>
                  <span style={{ fontWeight: 600 }}>{formatTime(todayStatus.clockIn)}</span>
                </div>
                {todayStatus.clockOut && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                    <span style={{ color: 'var(--gray-500)' }}>Clock Out</span>
                    <span style={{ fontWeight: 600 }}>{formatTime(todayStatus.clockOut)}</span>
                  </div>
                )}
                {todayStatus.totalHours != null && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: 'var(--gray-500)' }}>Total Hours</span>
                    <span style={{ fontWeight: 600 }}>{todayStatus.totalHours.toFixed(1)}h</span>
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              {!todayStatus?.clockIn ? (
                <Btn
                  size="lg"
                  onClick={handleClockIn}
                  loading={clocking}
                  style={{ minWidth: 160, background: 'var(--success)', fontSize: 15 }}
                >
                  <LogIn size={18} /> Clock In
                </Btn>
              ) : !todayStatus?.clockOut ? (
                <Btn
                  size="lg"
                  variant="danger"
                  onClick={handleClockOut}
                  loading={clocking}
                  style={{ minWidth: 160, fontSize: 15 }}
                >
                  <LogOut size={18} /> Clock Out
                </Btn>
              ) : (
                <div
                  style={{
                    background: 'rgba(16, 185, 129, 0.1)',
                    color: 'var(--success)',
                    padding: '12px 24px',
                    borderRadius: '50%',
                    fontWeight: 600,
                    fontSize: 14,
                  }}
                >
                  ✓ Day completed
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* My Records Tab */}
      {tab === 'my' && (
        <>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <Select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              style={{ marginBottom: 0, maxWidth: 160 }}
              id="att-month"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(2000, i).toLocaleString('en', { month: 'long' })}
                </option>
              ))}
            </Select>
            <Select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              style={{ marginBottom: 0, maxWidth: 120 }}
              id="att-year"
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </Select>
          </div>
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            <Table cols={recordCols} rows={myRecords} loading={loading} emptyMsg="No attendance records for this month" />
          </Card>
        </>
      )}

      {/* HR Tab */}
      {tab === 'hr' && (
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid var(--gray-200)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 500 }}>Today's Clock Events</span>
            <Btn size="sm" onClick={handleAutoClockOut}>Force Auto Clock-Out</Btn>
          </div>
          <Table cols={hrCols} rows={hrToday} loading={loading} emptyMsg="No attendance recorded today" />
        </Card>
      )}

      {/* HR Edit Modal */}
      {editAtt && (
        <Modal open={!!editAtt} onClose={() => setEditAtt(null)} title="Edit Attendance (HR Only)">
          <form onSubmit={handleEditSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
              <Input
                label="Clock In (Datetime)"
                type="datetime-local"
                value={editAtt.clockIn ? editAtt.clockIn.substring(0, 16) : ''}
                onChange={(e) => setEditAtt({ ...editAtt, clockIn: e.target.value })}
                id="edit-att-in"
              />
              <Input
                label="Clock Out (Datetime)"
                type="datetime-local"
                value={editAtt.clockOut ? editAtt.clockOut.substring(0, 16) : ''}
                onChange={(e) => setEditAtt({ ...editAtt, clockOut: e.target.value })}
                id="edit-att-out"
              />
            </div>
            <Select
              label="Status"
              value={editAtt.status || 'PRESENT'}
              onChange={(e) => setEditAtt({ ...editAtt, status: e.target.value })}
              id="edit-att-status"
            >
              <option value="PRESENT">Present</option>
              <option value="ABSENT">Absent</option>
              <option value="HALF_DAY">Half Day</option>
            </Select>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
              <Btn variant="secondary" type="button" onClick={() => setEditAtt(null)}>Cancel</Btn>
              <Btn type="submit" loading={editing}>Update Record</Btn>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
