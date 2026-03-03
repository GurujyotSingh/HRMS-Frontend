import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCalendarAlt,

  faInfoCircle,
} from '@fortawesome/free-solid-svg-icons';
import Card from '../../../components/ui/Card';
import Chart from '../../../components/ui/Chart';
import { formatDate } from '../../../utils/formatters';

interface LeaveBalance {
  type: string;
  total: number;
  used: number;
  remaining: number;
  pending: number;
  color: string;
}

interface LeaveTransaction {
  id: number;
  date: string;
  type: string;
  days: number;
  status: string;
  balance: number;
}

const LeaveBalancePage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [transactions, setTransactions] = useState<LeaveTransaction[]>([]);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setBalances([
        { type: 'Annual Leave', total: 20, used: 5, remaining: 15, pending: 2, color: '#4361ee' },
        { type: 'Sick Leave', total: 12, used: 2, remaining: 10, pending: 0, color: '#f72585' },
        { type: 'Personal Leave', total: 5, used: 1, remaining: 4, pending: 1, color: '#4cc9f0' },
        { type: 'Study Leave', total: 10, used: 0, remaining: 10, pending: 0, color: '#f8961e' },
      ]);

      setTransactions([
        { id: 1, date: '2024-03-15', type: 'Annual Leave', days: 6, status: 'Approved', balance: 14 },
        { id: 2, date: '2024-02-10', type: 'Sick Leave', days: 2, status: 'Approved', balance: 10 },
        { id: 3, date: '2024-01-20', type: 'Personal Leave', days: 1, status: 'Approved', balance: 4 },
        { id: 4, date: '2024-03-20', type: 'Annual Leave', days: 2, status: 'Pending', balance: 12 },
      ]);

      setLoading(false);
    }, 1000);
  }, []);

  const years = [2024, 2023, 2022, 2021, 2020];

  const chartData = balances.map(b => ({
    name: b.type.split(' ')[0],
    Used: b.used,
    Remaining: b.remaining,
  }));

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading leave balance...</p>
      </div>
    );
  }

  const totalLeaves = balances.reduce((sum, b) => sum + b.total, 0);
  const totalUsed = balances.reduce((sum, b) => sum + b.used, 0);
  const totalRemaining = balances.reduce((sum, b) => sum + b.remaining, 0);

  return (
    <div className="leave-balance-page">
      <div className="page-header">
        <h1>Leave Balance</h1>
        <p>Track your leave usage and remaining balance</p>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <Card className="summary-card">
          <h3>Total Leaves</h3>
          <p className="value">{totalLeaves} days</p>
        </Card>
        <Card className="summary-card">
          <h3>Used</h3>
          <p className="value warning">{totalUsed} days</p>
        </Card>
        <Card className="summary-card">
          <h3>Remaining</h3>
          <p className="value success">{totalRemaining} days</p>
        </Card>
        <Card className="summary-card">
          <h3>Pending</h3>
          <p className="value info">
            {balances.reduce((sum, b) => sum + b.pending, 0)} days
          </p>
        </Card>
      </div>

      {/* Year Selector */}
      <Card className="year-selector-card">
        <div className="year-selector">
          <label>Select Year:</label>
          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            className="year-select"
          >
            {years.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </Card>

      {/* Balance Cards */}
      <div className="balance-cards-grid">
        {balances.map(balance => (
          <Card key={balance.type} className="balance-card" style={{ borderTopColor: balance.color }}>
            <div className="balance-header">
              <h3>{balance.type}</h3>
              <span className="balance-icon" style={{ color: balance.color }}>
                <FontAwesomeIcon icon={faCalendarAlt} />
              </span>
            </div>
            <div className="balance-numbers">
              <div className="number-item">
                <span className="label">Total</span>
                <span className="value">{balance.total}</span>
              </div>
              <div className="number-item">
                <span className="label">Used</span>
                <span className="value warning">{balance.used}</span>
              </div>
              <div className="number-item">
                <span className="label">Remaining</span>
                <span className="value success">{balance.remaining}</span>
              </div>
              <div className="number-item">
                <span className="label">Pending</span>
                <span className="value info">{balance.pending}</span>
              </div>
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: `${(balance.used / balance.total) * 100}%`,
                  backgroundColor: balance.color,
                }}
              ></div>
            </div>
            <div className="balance-footer">
              <span>Used: {((balance.used / balance.total) * 100).toFixed(1)}%</span>
            </div>
          </Card>
        ))}
      </div>

      {/* Chart */}
      <Card className="chart-card" title="Leave Distribution">
        <Chart
          type="bar"
          data={chartData}
          xAxisKey="name"
          dataKeys={['Used', 'Remaining']}
          colors={['#f72585', '#4361ee']}
          height={300}
        />
      </Card>

      {/* Transaction History */}
      <Card className="transactions-card" title="Transaction History">
        <table className="transactions-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Leave Type</th>
              <th>Days</th>
              <th>Status</th>
              <th>Remaining Balance</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map(transaction => (
              <tr key={transaction.id}>
                <td>{formatDate(transaction.date)}</td>
                <td>{transaction.type}</td>
                <td>{transaction.days}</td>
                <td>
                  <span className={`status-badge status-${transaction.status.toLowerCase()}`}>
                    {transaction.status}
                  </span>
                </td>
                <td>{transaction.balance} days</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Leave Policy Info */}
      <Card className="policy-card" title="Leave Policy Information">
        <div className="policy-grid">
          <div className="policy-item">
            <FontAwesomeIcon icon={faInfoCircle} className="policy-icon" />
            <div>
              <h4>Annual Leave</h4>
              <p>20 days per year. Must be approved at least 5 days in advance.</p>
            </div>
          </div>
          <div className="policy-item">
            <FontAwesomeIcon icon={faInfoCircle} className="policy-icon" />
            <div>
              <h4>Sick Leave</h4>
              <p>12 days per year. Medical certificate required for 3+ consecutive days.</p>
            </div>
          </div>
          <div className="policy-item">
            <FontAwesomeIcon icon={faInfoCircle} className="policy-icon" />
            <div>
              <h4>Carry Forward</h4>
              <p>Up to 10 days of unused annual leave can be carried forward.</p>
            </div>
          </div>
          <div className="policy-item">
            <FontAwesomeIcon icon={faInfoCircle} className="policy-icon" />
            <div>
              <h4>Leave Encashment</h4>
              <p>Unused leave can be encashed at the time of resignation/retirement.</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default LeaveBalancePage;