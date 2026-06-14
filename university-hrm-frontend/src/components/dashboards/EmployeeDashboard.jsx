import React, { useState, useEffect } from 'react';
import { Card, Badge } from '../ui';
import { BookOpen, Calendar, Clock, Megaphone, FileText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { leaveBalanceAPI, attendanceAPI, announcementsAPI } from '../../services/api';

export default function EmployeeDashboard() {
  const { user } = useAuth();
  
  const [balance, setBalance] = useState(null);
  const [todayAtt, setTodayAtt] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [balRes, attRes, annRes] = await Promise.all([
          leaveBalanceAPI.myBalance().catch(() => null),
          attendanceAPI.today().catch(() => null),
          announcementsAPI.list({ limit: 5 }).catch(() => ({ data: [] }))
        ]);
        
        setBalance(balRes);
        setTodayAtt(attRes);
        setAnnouncements(annRes?.data?.items || annRes?.data || []);
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="dashboard-view" style={{ animation: 'fadeIn 0.25s ease-out' }}>
      <h1 className="page-title" style={{ marginBottom: '24px' }}>
        Welcome back, {user?.first_name || user?.email.split('@')[0]}
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '24px' }}>
        <Card style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: '#F0FDF4', padding: '16px', borderRadius: '12px', color: '#16A34A' }}>
            <Calendar size={32} />
          </div>
          <div>
            <div style={{ color: 'var(--gray-500)', fontSize: '14px', fontWeight: 600 }}>Leave Balance</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-dark)' }}>
              {loading ? '...' : (Array.isArray(balance) ? balance.reduce((s, b) => s + ((b.total_days || 0) - (b.used_days || 0)), 0) : '0')} Days
            </div>
            <div style={{ fontSize: '12px', color: 'var(--gray-400)' }}>Available paid time off</div>
          </div>
        </Card>

        <Card style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: '#EFF6FF', padding: '16px', borderRadius: '12px', color: '#2563EB' }}>
            <Clock size={32} />
          </div>
          <div>
            <div style={{ color: 'var(--gray-500)', fontSize: '14px', fontWeight: 600 }}>Today's Status</div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-dark)', marginTop: '4px' }}>
              {loading ? '...' : (todayAtt ? (todayAtt.check_in ? `Checked in at ${new Date(todayAtt.check_in).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}` : 'Checked Out') : 'Not Checked In')}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--gray-400)' }}>
               {todayAtt?.status === 'PRESENT' ? <Badge variant="success">Present</Badge> : (todayAtt?.status === 'ABSENT' ? <Badge variant="danger">Absent</Badge> : <Badge variant="neutral">Pending</Badge>)}
            </div>
          </div>
        </Card>

        <Card style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: '#FFF7ED', padding: '16px', borderRadius: '12px', color: '#EA580C' }}>
            <FileText size={32} />
          </div>
          <div>
            <div style={{ color: 'var(--gray-500)', fontSize: '14px', fontWeight: 600 }}>Employment Type</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-dark)' }}>
              {user?.employment?.employment_type?.replace('_', ' ') || 'Not Assigned'}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--gray-400)' }}>
              {user?.employment?.designation || 'Staff'}
            </div>
          </div>
        </Card>
      </div>

      <Card style={{ marginTop: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px', borderBottom: '1px solid var(--border-color)' }}>
          <h3 style={{ fontSize: 16, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Megaphone size={18} color="var(--primary)" /> Recent Announcements
          </h3>
        </div>
        
        <div style={{ padding: '24px', background: 'var(--bg-card)' }}>
          {loading ? (
            <div style={{ textAlign: 'center', color: 'var(--gray-500)', padding: '20px' }}>Loading announcements...</div>
          ) : announcements.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--gray-500)', padding: '40px 20px' }}>
              <BookOpen size={32} style={{ opacity: 0.3, margin: '0 auto 12px' }} />
              No active announcements right now.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {announcements.map((ann, idx) => (
                <div key={idx} style={{ padding: 20, border: '1px solid var(--border-color)', borderRadius: 12, background: 'var(--gray-50)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-dark)', fontSize: 16 }}>{ann.title}</span>
                    <span style={{ fontSize: 12, color: 'var(--gray-500)', background: 'white', padding: '4px 10px', borderRadius: 12, border: '1px solid var(--border-color)' }}>
                      {new Date(ann.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: 14, color: 'var(--gray-600)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                    {ann.body}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
