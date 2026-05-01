import React from 'react';
import { Card } from '../ui';
import { BadgeDollarSign, CreditCard } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function AccountantDashboard() {
  const { user } = useAuth();

  return (
    <div className="dashboard-view" style={{ animation: 'fadeIn 0.25s ease-out' }}>
      <h1 className="page-title" style={{ marginBottom: '24px' }}>
        Finance Portal - {user?.first_name || 'Accountant'}
      </h1>
      <p style={{ color: 'var(--gray-500)', marginBottom: 24 }}>
        Manage University salary disbursements and audit trails.
      </p>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <Card style={{ padding: 24, background: 'var(--blue-50)', border: '1px solid var(--blue-200)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <BadgeDollarSign size={28} color="var(--primary)" />
            <div>
              <div style={{ fontSize: 13, color: 'var(--gray-500)', fontWeight: 600 }}>Payroll Generation</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--primary)' }}>Awaiting run</div>
            </div>
          </div>
        </Card>
      </div>

      <Card style={{ marginTop: 24, padding: '24px', textAlign: 'center' }}>
        <CreditCard size={48} color="var(--success)" style={{ opacity: 0.2, marginBottom: 16 }} />
        <h2 style={{ fontSize: 20, color: 'var(--text-dark)' }}>Disbursement Center</h2>
        <p style={{ color: 'var(--gray-500)', maxWidth: 400, margin: '10px auto 0' }}>
          Head over to the Payroll tab to generate and finalize payouts based on HR's structural mappings.
        </p>
      </Card>
    </div>
  );
}
