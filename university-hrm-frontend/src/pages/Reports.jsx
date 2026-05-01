import React, { useEffect, useState } from 'react';
import { PageHeader, Card, Table, Tabs, Btn, Modal, toast } from '../components/ui';
import { reportsAPI, aiAgentsAPI } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function Reports() {
  const [tab, setTab] = useState('attendance');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState('');
  const [showSummary, setShowSummary] = useState(false);

  const tabs = [
    { key: 'attendance', label: 'Attendance Reports' },
    { key: 'payroll', label: 'Payroll Costs' },
    { key: 'leaves', label: 'Leave Stats' }
  ];

  useEffect(() => {
    setLoading(true);
    let promise;
    if (tab === 'attendance') promise = reportsAPI.attendanceWeekly();
    else if (tab === 'payroll') promise = reportsAPI.payrollCost(new Date().getMonth()+1, new Date().getFullYear());
    else if (tab === 'leaves') promise = reportsAPI.leaveStats();

    promise.then(res => {
      setData(res.data || []);
    }).catch(err => {
      console.error(err);
      setData([]);
    }).finally(() => {
      setLoading(false);
    });
  }, [tab]);

  const handleSummarize = async () => {
    setAiLoading(true);
    try {
      const typeMap = {
        'attendance': 'attendance',
        'payroll': 'payroll',
        'leaves': 'leave'
      };
      const { data } = await aiAgentsAPI.summarizeReport({
        report_type: typeMap[tab] || 'attendance',
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear()
      });
      setAiSummary(data.result);
      setShowSummary(true);
    } catch(e) {
      toast(e.response?.data?.detail || 'Failed to generate summary', 'error');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <>
      <PageHeader
        title="University Reports"
        subtitle="Analytical insights into HR and Academic operations"
        actions={
          <Btn onClick={handleSummarize} loading={aiLoading}>
            <span style={{ marginRight: 6 }}>✨</span> AI Summarize
          </Btn>
        }
      />
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px 0' }}>
          <Tabs tabs={tabs} active={tab} onChange={setTab} />
        </div>
        
        <div style={{ padding: 24, minHeight: 400 }}>
          {loading ? (
            <div>Loading insights...</div>
          ) : (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--gray-200)" />
                <XAxis dataKey={tab === 'attendance' ? 'date' : tab === 'payroll' ? 'department_name' : 'leave_type'} tick={{ fill: 'var(--gray-500)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--gray-500)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: 'var(--gray-100)' }} />
                <Bar dataKey={tab === 'attendance' ? 'present_count' : tab === 'payroll' ? 'total_cost' : 'used_days'} fill="var(--primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>

      <Modal open={showSummary} onClose={() => setShowSummary(false)} title="✨ AI Executive Summary" width={600}>
        <div style={{ padding: '8px', fontSize: 14, color: 'var(--text-dark)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
          {aiSummary}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
          <Btn onClick={() => setShowSummary(false)}>Close</Btn>
        </div>
      </Modal>
    </>
  );
}
