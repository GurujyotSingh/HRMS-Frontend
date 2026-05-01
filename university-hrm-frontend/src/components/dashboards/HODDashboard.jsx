import React from 'react';
import { Card } from '../ui';
import { Users, FileText, Target } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function HODDashboard() {
  const { user } = useAuth();

  return (
    <div className="dashboard-view" style={{ animation: 'fadeIn 0.25s ease-out' }}>
      <h1 className="page-title" style={{ marginBottom: '24px' }}>
        Department Head Portal - {user?.first_name || 'HOD'}
      </h1>
      <p style={{ color: 'var(--gray-500)', marginBottom: 24 }}>
        Overview of your academic division workflow.
      </p>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <Card style={{ padding: 24, background: 'var(--blue-50)', border: '1px solid var(--blue-200)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Users size={28} color="var(--primary)" />
            <div>
              <div style={{ fontSize: 13, color: 'var(--gray-500)', fontWeight: 600 }}>Active Members</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--primary)' }}>14</div>
            </div>
          </div>
        </Card>
        <Card style={{ padding: 24, background: 'var(--yellow-50)', border: '1px solid var(--yellow-200)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <FileText size={28} color="var(--warning)" />
            <div>
              <div style={{ fontSize: 13, color: 'var(--gray-500)', fontWeight: 600 }}>Pending Leaves</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--warning)' }}>3</div>
            </div>
          </div>
        </Card>
        <Card style={{ padding: 24, background: 'var(--green-50)', border: '1px solid var(--green-200)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Target size={28} color="var(--success)" />
            <div>
              <div style={{ fontSize: 13, color: 'var(--gray-500)', fontWeight: 600 }}>Goal Appraisals</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--success)' }}>5</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
