import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { attendanceAPI, employeesAPI } from '../services/api';
import { Btn, Card, PageHeader, Select, Table, toast } from '../components/ui';

export default function Attendance() {
  const { hasRole } = useAuth();
  const [now, setNow] = useState(() => new Date());
  const [todayRec, setTodayRec] = useState(null);
  const [tab, setTab] = useState('my');
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [myList, setMyList] = useState([]);
  const [allToday, setAllToday] = useState([]);
  const [loading, setLoading] = useState(false);
  const [empMap, setEmpMap] = useState({});

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const loadToday = useCallback(async () => {
    try {
      const { data } = await attendanceAPI.today();
      setTodayRec(data);
    } catch {
      setTodayRec(null);
    }
  }, []);

  const loadMyMonth = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await attendanceAPI.myRecords(month, year);
      setMyList(data);
    } catch (e) {
      toast(e.response?.data?.detail || 'Failed to load attendance', 'error');
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  const loadHrToday = useCallback(async () => {
    if (!hasRole('admin', 'hr')) return;
    try {
      const { data } = await attendanceAPI.hrToday();
      setAllToday(data);
      const { data: emps } = await employeesAPI.list().catch(() => ({ data: [] }));
      const m = {};
      (emps || []).forEach((e) => {
        m[e.id] = `${e.first_name} ${e.last_name}`;
      });
      setEmpMap(m);
    } catch {
      setAllToday([]);
    }
  }, [hasRole]);

  useEffect(() => {
    loadToday();
  }, [loadToday]);

  useEffect(() => {
    if (tab === 'my') loadMyMonth();
    else loadHrToday();
  }, [tab, loadMyMonth, loadHrToday]);

  const clockIn = async () => {
    try {
      await attendanceAPI.clockIn();
      toast('Clocked in', 'success');
      loadToday();
      if (tab === 'my') loadMyMonth();
    } catch (e) {
      toast(e.response?.data?.detail || 'Clock-in failed', 'error');
    }
  };

  const clockOut = async () => {
    try {
      await attendanceAPI.clockOut();
      toast('Clocked out', 'success');
      loadToday();
      if (tab === 'my') loadMyMonth();
    } catch (e) {
      toast(e.response?.data?.detail || 'Clock-out failed', 'error');
    }
  };

  const fmtTime = (iso) => (iso ? new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—');

  const showIn = !todayRec?.clock_in;
  const showOut = todayRec?.clock_in && !todayRec.clock_out;
  const done = todayRec?.clock_in && todayRec?.clock_out;

  const myCols = [
    {
      key: 'date',
      label: 'Date',
      render: (r) => new Date(r.date).toLocaleDateString('en-IN'),
    },
    { key: 'clock_in', label: 'Clock in', render: (r) => fmtTime(r.clock_in) },
    { key: 'clock_out', label: 'Clock out', render: (r) => fmtTime(r.clock_out) },
    {
      key: 'hours',
      label: 'Total hours',
      render: (r) => (r.total_hours != null ? r.total_hours.toFixed(2) : '—'),
    },
    {
      key: 'late',
      label: 'Late',
      render: (r) =>
        r.is_late ? <span className="badge badge-warning">Late</span> : <span className="badge badge-neutral">On time</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (r) => <span className="badge badge-info">{r.status}</span>,
    },
  ];

  const allCols = [
    {
      key: 'employee',
      label: 'Employee',
      render: (r) => empMap[r.employee_id] || `Employee #${r.employee_id}`,
    },
    ...myCols.slice(0, 5),
  ];

  return (
    <div>
      <PageHeader title="Attendance" subtitle="Clock in/out and history" />
      <Card
        style={{
          background: 'linear-gradient(135deg, var(--soil), var(--bark))',
          color: 'var(--linen)',
          marginBottom: 24,
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 20 }}>
          <div>
            <div style={{ fontSize: 42, fontFamily: 'var(--font-display)', fontWeight: 700 }}>
              {now.toLocaleTimeString('en-IN')}
            </div>
            <div style={{ opacity: 0.85, marginTop: 8 }}>
              {now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
            {todayRec && (
              <div style={{ marginTop: 16, fontSize: 14, opacity: 0.9 }}>
                <div>Clock in: {fmtTime(todayRec.clock_in)}</div>
                <div>Clock out: {fmtTime(todayRec.clock_out)}</div>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, justifyContent: 'center' }}>
            {showIn && (
              <Btn variant="success" size="lg" onClick={clockIn}>
                Clock In
              </Btn>
            )}
            {showOut && (
              <Btn size="lg" onClick={clockOut}>
                Clock Out
              </Btn>
            )}
            {done && (
              <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.1)', borderRadius: 'var(--radius)' }}>
                Shift complete for today.
              </div>
            )}
          </div>
        </div>
      </Card>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <Btn variant={tab === 'my' ? 'primary' : 'secondary'} onClick={() => setTab('my')}>
          My attendance
        </Btn>
        {hasRole('admin', 'hr') && (
          <Btn variant={tab === 'all' ? 'primary' : 'secondary'} onClick={() => setTab('all')}>
            All employees (today)
          </Btn>
        )}
      </div>

      {tab === 'my' && (
        <Card style={{ marginBottom: 16, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <Select label="Month" value={String(month)} onChange={(e) => setMonth(Number(e.target.value))}>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {i + 1}
              </option>
            ))}
          </Select>
          <InputLocalYear value={year} onChange={setYear} />
        </Card>
      )}

      <Card style={{ padding: 0 }}>
        <Table
          cols={tab === 'my' ? myCols : allCols}
          rows={tab === 'my' ? myList : allToday}
          loading={tab === 'my' ? loading : false}
          emptyMsg="No records"
        />
      </Card>
    </div>
  );
}

function InputLocalYear({ value, onChange }) {
  return (
    <label style={{ display: 'block' }}>
      <span
        style={{
          display: 'block',
          fontSize: 13,
          fontWeight: 600,
          color: 'var(--text-secondary)',
          marginBottom: 6,
        }}
      >
        Year
      </span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          padding: '10px 12px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border)',
          fontFamily: 'var(--font-body)',
          width: 120,
        }}
      />
    </label>
  );
}
