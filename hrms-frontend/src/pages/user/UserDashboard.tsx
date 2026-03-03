// src/pages/user/UserDashboard.tsx
import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCalendarCheck,
  faClock,
  faCalendarAlt,
  faFileInvoice,
  faArrowRight,
  faCheckCircle,
  faTimesCircle,
  faUserFriends,
  faBell,
} from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';

const UserDashboard: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [checkedIn, setCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState<string | null>(null);

  // Mock data
  const stats = {
    leaveBalance: {
      annual: { total: 20, used: 5, remaining: 15 },
      sick: { total: 12, used: 2, remaining: 10 },
      personal: { total: 5, used: 1, remaining: 4 },
    },
    attendance: {
      present: 18,
      absent: 2,
      late: 1,
      total: 21,
    },
    upcomingLeaves: [
      { id: 1, type: 'Annual Leave', startDate: '2024-04-10', endDate: '2024-04-15', status: 'approved' },
      { id: 2, type: 'Personal Leave', startDate: '2024-04-20', endDate: '2024-04-21', status: 'pending' },
    ],
    recentPayslips: [
      { id: 1, month: 'March 2024', amount: '₹85,000', status: 'generated' },
      { id: 2, month: 'February 2024', amount: '₹85,000', status: 'generated' },
    ],
    announcements: [
      { id: 1, title: 'Office Closed on Friday', date: '2024-03-25', priority: 'high' },
      { id: 2, title: 'Team Outing Next Week', date: '2024-03-20', priority: 'medium' },
      { id: 3, title: 'New HR Policy Update', date: '2024-03-18', priority: 'low' },
    ],
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleCheckInOut = () => {
    if (!checkedIn) {
      setCheckedIn(true);
      setCheckInTime(new Date().toLocaleTimeString());
    } else {
      setCheckedIn(false);
      setCheckInTime(null);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'approved': return 'var(--success)';
      case 'pending': return 'var(--warning)';
      case 'rejected': return 'var(--danger)';
      default: return 'var(--gray-600)';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'high': return 'var(--danger)';
      case 'medium': return 'var(--warning)';
      case 'low': return 'var(--success)';
      default: return 'var(--gray-600)';
    }
  };

  return (
    <div className="user-dashboard">
      {/* Welcome Section */}
      <div className="welcome-section">
        <div className="welcome-card">
          <div className="welcome-content">
            <h2>Good {currentTime.getHours() < 12 ? 'Morning' : currentTime.getHours() < 17 ? 'Afternoon' : 'Evening'}!</h2>
            <p className="current-time">{formatTime(currentTime)}</p>
          </div>
          <div className="check-in-card">
            <div className={`check-in-status ${checkedIn ? 'checked-in' : 'checked-out'}`}>
              <div className="status-indicator"></div>
              <span>{checkedIn ? 'Checked In' : 'Checked Out'}</span>
            </div>
            {checkedIn && <p className="check-in-time">Since {checkInTime}</p>}
            <button 
              className={`check-in-btn ${checkedIn ? 'check-out' : 'check-in'}`}
              onClick={handleCheckInOut}
            >
              <FontAwesomeIcon icon={checkedIn ? faTimesCircle : faCheckCircle} />
              {checkedIn ? 'Check Out' : 'Check In'}
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="quick-stats-grid">
        <div className="quick-stat-card">
          <div className="stat-icon blue">
            <FontAwesomeIcon icon={faCalendarAlt} />
          </div>
          <div className="stat-details">
            <h3>{stats.leaveBalance.annual.remaining}</h3>
            <p>Annual Leave Remaining</p>
            <small>Total: {stats.leaveBalance.annual.total} days</small>
          </div>
        </div>

        <div className="quick-stat-card">
          <div className="stat-icon green">
            <FontAwesomeIcon icon={faCalendarCheck} />
          </div>
          <div className="stat-details">
            <h3>{stats.attendance.present}</h3>
            <p>Days Present</p>
            <small>This month: {stats.attendance.total} days</small>
          </div>
        </div>

        <div className="quick-stat-card">
          <div className="stat-icon orange">
            <FontAwesomeIcon icon={faClock} />
          </div>
          <div className="stat-details">
            <h3>{stats.attendance.late}</h3>
            <p>Late Arrivals</p>
            <small>This month</small>
          </div>
        </div>

        <div className="quick-stat-card">
          <div className="stat-icon purple">
            <FontAwesomeIcon icon={faFileInvoice} />
          </div>
          <div className="stat-details">
            <h3>₹85,000</h3>
            <p>Current Month Salary</p>
            <small>March 2024</small>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="dashboard-grid-two-column">
        {/* Left Column */}
        <div className="dashboard-left">
          {/* Leave Balance Card */}
          <div className="dashboard-card">
            <div className="card-header">
              <h3>Leave Balance</h3>
              <Link to="/user/leave" className="view-all-link">
                View All <FontAwesomeIcon icon={faArrowRight} />
              </Link>
            </div>
            <div className="leave-balance-list">
              <div className="balance-item">
                <div className="balance-info">
                  <span className="balance-type">Annual Leave</span>
                  <span className="balance-days">{stats.leaveBalance.annual.remaining} / {stats.leaveBalance.annual.total} days</span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${(stats.leaveBalance.annual.used / stats.leaveBalance.annual.total) * 100}%` }}
                  ></div>
                </div>
              </div>
              <div className="balance-item">
                <div className="balance-info">
                  <span className="balance-type">Sick Leave</span>
                  <span className="balance-days">{stats.leaveBalance.sick.remaining} / {stats.leaveBalance.sick.total} days</span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill sick" 
                    style={{ width: `${(stats.leaveBalance.sick.used / stats.leaveBalance.sick.total) * 100}%` }}
                  ></div>
                </div>
              </div>
              <div className="balance-item">
                <div className="balance-info">
                  <span className="balance-type">Personal Leave</span>
                  <span className="balance-days">{stats.leaveBalance.personal.remaining} / {stats.leaveBalance.personal.total} days</span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill personal" 
                    style={{ width: `${(stats.leaveBalance.personal.used / stats.leaveBalance.personal.total) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Upcoming Leaves */}
          <div className="dashboard-card">
            <div className="card-header">
              <h3>Upcoming Leaves</h3>
              <Link to="/user/leave" className="view-all-link">
                Apply Leave <FontAwesomeIcon icon={faArrowRight} />
              </Link>
            </div>
            <div className="upcoming-leaves-list">
              {stats.upcomingLeaves.map(leave => (
                <div key={leave.id} className="upcoming-leave-item">
                  <div className="leave-type-icon">
                    <FontAwesomeIcon icon={faCalendarAlt} />
                  </div>
                  <div className="leave-details">
                    <h4>{leave.type}</h4>
                    <p>{new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}</p>
                  </div>
                  <span 
                    className="leave-status"
                    style={{ 
                      backgroundColor: `${getStatusColor(leave.status)}20`,
                      color: getStatusColor(leave.status)
                    }}
                  >
                    {leave.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Payslips */}
          <div className="dashboard-card">
            <div className="card-header">
              <h3>Recent Payslips</h3>
              <Link to="/user/payslips" className="view-all-link">
                View All <FontAwesomeIcon icon={faArrowRight} />
              </Link>
            </div>
            <div className="payslips-list">
              {stats.recentPayslips.map(payslip => (
                <div key={payslip.id} className="payslip-item">
                  <div className="payslip-month">
                    <FontAwesomeIcon icon={faFileInvoice} />
                    <span>{payslip.month}</span>
                  </div>
                  <div className="payslip-amount">{payslip.amount}</div>
                  <button className="download-btn">Download</button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="dashboard-right">
          {/* Attendance Overview */}
          <div className="dashboard-card">
            <div className="card-header">
              <h3>Attendance Overview</h3>
              <Link to="/user/attendance" className="view-all-link">
                View Details <FontAwesomeIcon icon={faArrowRight} />
              </Link>
            </div>
            <div className="attendance-chart">
              <div className="attendance-stats">
                <div className="attendance-stat-item">
                  <span className="stat-value">{stats.attendance.present}</span>
                  <span className="stat-label">Present</span>
                </div>
                <div className="attendance-stat-item">
                  <span className="stat-value">{stats.attendance.absent}</span>
                  <span className="stat-label">Absent</span>
                </div>
                <div className="attendance-stat-item">
                  <span className="stat-value">{stats.attendance.late}</span>
                  <span className="stat-label">Late</span>
                </div>
              </div>
              <div className="attendance-progress">
                <div className="progress-circle">
                  <svg viewBox="0 0 36 36" className="circular-chart">
                    <path
                      className="circle-bg"
                      d="M18 2.0845
                        a 15.9155 15.9155 0 0 1 0 31.831
                        a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="circle"
                      strokeDasharray={`${(stats.attendance.present / stats.attendance.total) * 100}, 100`}
                      d="M18 2.0845
                        a 15.9155 15.9155 0 0 1 0 31.831
                        a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <text x="18" y="20.35" className="percentage">
                      {Math.round((stats.attendance.present / stats.attendance.total) * 100)}%
                    </text>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Team Members */}
          <div className="dashboard-card">
            <div className="card-header">
              <h3>Team Members</h3>
              <Link to="/user/team" className="view-all-link">
                View All <FontAwesomeIcon icon={faArrowRight} />
              </Link>
            </div>
            <div className="team-members-list">
              <div className="team-member-item">
                <div className="member-avatar">
                  <FontAwesomeIcon icon={faUserFriends} />
                </div>
                <div className="member-info">
                  <h4>Jane Smith</h4>
                  <p>Senior Developer</p>
                </div>
                <span className="member-status online"></span>
              </div>
              <div className="team-member-item">
                <div className="member-avatar">
                  <FontAwesomeIcon icon={faUserFriends} />
                </div>
                <div className="member-info">
                  <h4>Mike Johnson</h4>
                  <p>UI/UX Designer</p>
                </div>
                <span className="member-status offline"></span>
              </div>
              <div className="team-member-item">
                <div className="member-avatar">
                  <FontAwesomeIcon icon={faUserFriends} />
                </div>
                <div className="member-info">
                  <h4>Sarah Williams</h4>
                  <p>Project Manager</p>
                </div>
                <span className="member-status online"></span>
              </div>
            </div>
          </div>

          {/* Announcements */}
          <div className="dashboard-card">
            <div className="card-header">
              <h3>Announcements</h3>
              <FontAwesomeIcon icon={faBell} className="announcement-icon" />
            </div>
            <div className="announcements-list">
              {stats.announcements.map(announcement => (
                <div key={announcement.id} className="announcement-item">
                  <div className="announcement-content">
                    <h4>{announcement.title}</h4>
                    <p>{new Date(announcement.date).toLocaleDateString()}</p>
                  </div>
                  <span 
                    className="priority-badge"
                    style={{ backgroundColor: `${getPriorityColor(announcement.priority)}20`, color: getPriorityColor(announcement.priority) }}
                  >
                    {announcement.priority}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;