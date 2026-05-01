import React, { useState } from 'react';
import { Card, Btn, Input, Badge } from '../ui';
import { BookOpen, Send } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function EmployeeDashboard() {
  const { user } = useAuth();
  
  // Interactive Local State for Kudos
  const [kudosMsg, setKudosMsg] = useState('');
  const [kudosTo, setKudosTo] = useState('');
  const [kudos, setKudos] = useState([
    { to: 'Neha (IT)', from: 'Rahul', msg: 'Huge thanks for helping me debug the networking issue today!' },
    { to: 'Dr. Bhavin', from: 'Priya', msg: 'Great presentation on the new curriculum changes.' },
    { to: 'Finance Team', from: 'Bhavya(HR)', msg: 'Appreciate the quick turnaround on the payroll reports.' }
  ]);

  const handlePostKudo = (e) => {
    e.preventDefault();
    if (!kudosMsg.trim() || !kudosTo.trim()) return;
    
    setKudos([{ to: kudosTo, from: user?.first_name || 'Anonymous', msg: kudosMsg }, ...kudos]);
    setKudosMsg('');
    setKudosTo('');
  };

  return (
    <div className="dashboard-view" style={{ animation: 'fadeIn 0.25s ease-out' }}>
      <h1 className="page-title" style={{ marginBottom: '24px' }}>
        Welcome back, {user?.first_name || user?.email.split('@')[0]}
      </h1>

      <Card style={{ padding: '40px', textAlign: 'center', marginTop: 24 }}>
        <BookOpen size={48} color="var(--primary)" style={{ opacity: 0.2, marginBottom: 16 }} />
        <h2 style={{ fontSize: 20, color: 'var(--text-dark)' }}>Employee Portal</h2>
        <p style={{ color: 'var(--gray-500)', maxWidth: 400, margin: '10px auto 0' }}>
          Welcome to your self-service portal. Use the sidebar to track attendance, apply for leaves, or verify your payroll history constraint-free.
        </p>
      </Card>

      {/* Interactive Peer Kudos Widget */}
      <Card style={{ marginTop: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px', borderBottom: '1px solid var(--border-color)' }}>
          <h3 style={{ fontSize: 16, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            🎉 Team Shoutouts
          </h3>
        </div>
        
        <div style={{ padding: '24px', background: 'var(--gray-50)' }}>
          <form onSubmit={handlePostKudo} style={{ display: 'flex', gap: 12, marginBottom: 24, background: 'var(--bg-card)', padding: 16, borderRadius: 8, border: '1px solid var(--border-color)' }}>
            <div style={{ flex: 1 }}>
              <input 
                type="text" 
                placeholder="Who are you shouting out? (e.g. Finance Team)" 
                value={kudosTo}
                onChange={e => setKudosTo(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: 4, marginBottom: 8 }}
                required
              />
              <input 
                type="text" 
                placeholder="Give them some praise..." 
                value={kudosMsg}
                onChange={e => setKudosMsg(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: 4 }}
                required
              />
            </div>
            <Btn type="submit" variant="primary" style={{ display: 'flex', alignItems: 'center', gap: 6, height: 'fit-content' }}>
              <Send size={14} /> Post
            </Btn>
          </form>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
            {kudos.map((kudo, idx) => (
              <div key={idx} style={{ padding: 16, border: '1px solid var(--border-color)', borderRadius: 8, background: 'var(--bg-card)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontWeight: 600, color: 'var(--primary)' }}>@{kudo.to}</span>
                  <span style={{ fontSize: 12, color: 'var(--gray-500)', background: 'var(--gray-100)', padding: '2px 8px', borderRadius: 12 }}>from {kudo.from}</span>
                </div>
                <p style={{ margin: 0, fontSize: 14, color: 'var(--text-dark)', fontStyle: 'italic', lineHeight: 1.5 }}>"{kudo.msg}"</p>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
