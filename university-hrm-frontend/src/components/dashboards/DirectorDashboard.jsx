import React, { useEffect, useState } from 'react';
import { Card } from '../ui';
import { Users, FileText, Clock, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { dashboardAPI } from '../../services/api';

export default function DirectorDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardAPI.director()
      .then(({ data: d }) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const stats = data?.stats || {};
  const team  = data?.team  || [];

  return (
    <div className="dashboard-view" style={{ animation: 'fadeIn 0.25s ease-out' }}>
      <h1 className="page-title" style={{ marginBottom: 6 }}>
        Director Portal — {user?.firstName || user?.first_name || 'Director'}
      </h1>
      <p style={{ color: 'var(--gray-500)', marginBottom: 24 }}>
        Overview of your department's operational status.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: 28 }}>
        <Card style={{ padding: 24, background: 'var(--blue-50)', border: '1px solid var(--blue-200)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Users size={28} color="var(--primary)" />
            <div>
              <div style={{ fontSize: 13, color: 'var(--gray-500)', fontWeight: 600 }}>Team Size</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--primary)' }}>
                {loading ? '—' : stats.teamSize ?? 0}
              </div>
            </div>
          </div>
        </Card>

        <Card style={{ padding: 24, background: 'var(--green-50)', border: '1px solid var(--green-200)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Clock size={28} color="var(--success)" />
            <div>
              <div style={{ fontSize: 13, color: 'var(--gray-500)', fontWeight: 600 }}>Present Today</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--success)' }}>
                {loading ? '—' : stats.todayPresent ?? 0}
              </div>
            </div>
          </div>
        </Card>

        <Card style={{ padding: 24, background: 'var(--yellow-50)', border: '1px solid var(--yellow-200)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <FileText size={28} color="var(--warning)" />
            <div>
              <div style={{ fontSize: 13, color: 'var(--gray-500)', fontWeight: 600 }}>Pending Leaves</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--warning)' }}>
                {loading ? '—' : stats.pending ?? 0}
              </div>
            </div>
          </div>
        </Card>

        <Card style={{ padding: 24, background: 'var(--red-50, #fef2f2)', border: '1px solid var(--red-200, #fecaca)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <CheckCircle size={28} color="var(--danger, #ef4444)" />
            <div>
              <div style={{ fontSize: 13, color: 'var(--gray-500)', fontWeight: 600 }}>On Leave</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--danger, #ef4444)' }}>
                {loading ? '—' : stats.onLeave ?? 0}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Team members */}
      {team.length > 0 && (
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', fontWeight: 600, fontSize: 14 }}>
            Department Team
          </div>
          <div style={{ display: 'grid', gap: 0 }}>
            {team.slice(0, 8).map((member) => (
              <div
                key={member.id}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: '1px solid var(--border-light, var(--border))' }}
              >
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                  {member.firstName?.[0]}{member.lastName?.[0]}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{member.firstName} {member.lastName}</div>
                  <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>{member.designation || member.role}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
