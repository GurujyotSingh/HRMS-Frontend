// src/pages/user/Dashboard.tsx
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
  faHourglassHalf,
  faUserFriends,
  faBell,
  faChartLine,
  faBookOpen,
  faLaptop,
  faCoffee,
} from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { useNotification } from '../../hooks/useNotification';

const UserDashboard: React.FC = () => {
  const { showNotification } = useNotification();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [checkedIn, setCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState<string | null>(null);

  // Mock user data
  const userData = {
    name: 'Dr. John Doe',
    department: 'Computer Science',
    rank: 'Professor',
    employeeId: 'EMP001',
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
      percentage: 86,
    },
    upcomingLeaves: [
      { id: 1, type: 'Annual Leave', startDate: '2024-04-10', endDate: '2024-04-15', status: 'approved' },
      { id: 2, type: 'Personal Leave', startDate: '2024-04-20', endDate: '2024-04-21', status: 'pending' },
    ],
    pendingTasks: [
      { id: 1, task: 'Submit Quarterly Report', due: '2024-03-30', priority: 'High' },
      { id: 2, task: 'Complete Onboarding Documents', due: '2024-03-25', priority: 'Medium' },
      { id: 3, task: 'Review Student Applications', due: '2024-04-05', priority: 'Low' },
    ],
    recentPayslips: [
      { id: 1, month: 'March 2024', amount: '₹85,000', downloadUrl: '#' },
      { id: 2, month: 'February 2024', amount: '₹85,000', downloadUrl: '#' },
    ],
    announcements: [
      { id: 1, title: 'University Holiday on Friday', date: '2024-03-25', type: 'Holiday' },
      { id: 2, title: 'Faculty Meeting Scheduled', date: '2024-03-28', type: 'Meeting' },
      { id: 3, title: 'New Research Grant Opportunity', date: '2024-03-20', type: 'Info' },
    ],
    upcomingEvents: [
      { id: 1, title: 'Department Meeting', time: '10:00 AM', location: 'Conference Room A' },
      { id: 2, title: 'Student Advising', time: '2:00 PM', location: 'Office 205' },
      { id: 3, title: 'Research Seminar', time: '4:00 PM', location: 'Auditorium' },
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
      showNotification('Checked in successfully!', 'success');
    } else {
      setCheckedIn(false);
      setCheckInTime(null);
      showNotification('Checked out successfully!', 'success');
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    if (hour < 21) return 'Good Evening';
    return 'Good Night';
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
      case 'High': return 'var(--danger)';
      case 'Medium': return 'var(--warning)';
      case 'Low': return 'var(--success)';
      default: return 'var(--gray-600)';
    }
  };

  return (
    <div className="user-dashboard">
      {/* Welcome Banner */}
      <div className="welcome-banner">
        <div className="welcome-content">
          <h1>{getGreeting()}, {userData.name.split(' ')[0]}! 👋</h1>
          <p className="current-datetime">
            {currentTime.toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })} • {formatTime(currentTime)}
          </p>
          <p className="welcome-message">
            Here's your overview for today. You have {userData.pendingTasks.length} pending tasks.
          </p>
        </div>
        <div className="welcome-stats">
          <div className="stat-bubble">
            <span className="stat-value">{userData.attendance.present}</span>
            <span className="stat-label">Days Present</span>
          </div>
          <div className="stat-bubble">
            <span className="stat-value">{userData.leaveBalance.annual.remaining}</span>
            <span className="stat-label">Leave Left</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="action-grid">
          <Link to="/user/leave/apply" className="action-card">
            <div className="action-icon blue">
              <FontAwesomeIcon icon={faCalendarAlt} />
            </div>
            <span>Apply Leave</span>
          </Link>
          <div className="action-card" onClick={handleCheckInOut}>
            <div className={`action-icon ${checkedIn ? 'orange' : 'green'}`}>
              <FontAwesomeIcon icon={checkedIn ? faTimesCircle : faCheckCircle} />
            </div>
            <span>{checkedIn ? 'Check Out' : 'Check In'}</span>
          </div>
          <Link to="/user/attendance" className="action-card">
            <div className="action-icon purple">
              <FontAwesomeIcon icon={faClock} />
            </div>
            <span>My Attendance</span>
          </Link>
          <Link to="/user/payroll" className="action-card">
            <div className="action-icon coral">
              <FontAwesomeIcon icon={faFileInvoice} />
            </div>
            <span>View Payslip</span>
          </Link>
        </div>
      </div>

      {/* Main Dashboard Grid */}
      <div className="dashboard-grid">
        {/* Left Column */}
        <div className="grid-left">
          {/* Check-in Status Card */}
          <Card className="checkin-card">
            <div className="checkin-header">
              <h3>
                <FontAwesomeIcon icon={faClock} />
                Today's Attendance
              </h3>
              <span className={`status-badge ${checkedIn ? 'checked-in' : 'checked-out'}`}>
                {checkedIn ? 'Checked In' : 'Checked Out'}
              </span>
            </div>
            <div className="checkin-body">
              {checkedIn ? (
                <>
                  <div className="checkin-time">
                    <span className="label">Check-in Time:</span>
                    <span className="value">{checkInTime}</span>
                  </div>
                  <div className="checkin-duration">
                    <span className="label">Duration:</span>
                    <span className="value">4 hours 30 minutes</span>
                  </div>
                </>
              ) : (
                <p className="checkin-message">You haven't checked in today</p>
              )}
              <Button
                variant={checkedIn ? 'danger' : 'success'}
                onClick={handleCheckInOut}
                className="checkin-btn"
              >
                <FontAwesomeIcon icon={checkedIn ? faTimesCircle : faCheckCircle} />
                {checkedIn ? 'Check Out' : 'Check In'}
              </Button>
            </div>
          </Card>

          {/* Leave Balance Card */}
          <Card className="balance-card" title="Leave Balance">
            <div className="balance-list">
              <div className="balance-item">
                <div className="balance-info">
                  <span className="balance-type">Annual Leave</span>
                  <span className="balance-days">
                    {userData.leaveBalance.annual.remaining} / {userData.leaveBalance.annual.total}
                  </span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${(userData.leaveBalance.annual.used / userData.leaveBalance.annual.total) * 100}%` }}
                  ></div>
                </div>
              </div>
              <div className="balance-item">
                <div className="balance-info">
                  <span className="balance-type">Sick Leave</span>
                  <span className="balance-days">
                    {userData.leaveBalance.sick.remaining} / {userData.leaveBalance.sick.total}
                  </span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill sick"
                    style={{ width: `${(userData.leaveBalance.sick.used / userData.leaveBalance.sick.total) * 100}%` }}
                  ></div>
                </div>
              </div>
              <div className="balance-item">
                <div className="balance-info">
                  <span className="balance-type">Personal Leave</span>
                  <span className="balance-days">
                    {userData.leaveBalance.personal.remaining} / {userData.leaveBalance.personal.total}
                  </span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill personal"
                    style={{ width: `${(userData.leaveBalance.personal.used / userData.leaveBalance.personal.total) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
            <Link to="/user/leave/balance" className="view-all-link">
              View Details <FontAwesomeIcon icon={faArrowRight} />
            </Link>
          </Card>

          {/* Upcoming Leaves */}
          <Card className="upcoming-card" title="Upcoming Leaves">
            {userData.upcomingLeaves.length > 0 ? (
              <div className="upcoming-list">
                {userData.upcomingLeaves.map(leave => (
                  <div key={leave.id} className="upcoming-item">
                    <div className="item-icon">
                      <FontAwesomeIcon icon={faCalendarAlt} />
                    </div>
                    <div className="item-details">
                      <h4>{leave.type}</h4>
                      <p>{new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}</p>
                    </div>
                    <span
                      className="status-tag"
                      style={{ backgroundColor: `${getStatusColor(leave.status)}20`, color: getStatusColor(leave.status) }}
                    >
                      {leave.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-message">No upcoming leaves</p>
            )}
            <Link to="/user/leave/my-leaves" className="view-all-link">
              View All Leaves <FontAwesomeIcon icon={faArrowRight} />
            </Link>
          </Card>
        </div>

        {/* Right Column */}
        <div className="grid-right">
          {/* Today's Schedule */}
          <Card className="schedule-card" title="Today's Schedule">
            <div className="schedule-list">
              {userData.upcomingEvents.map((event, index) => (
                <div key={index} className="schedule-item">
                  <div className="schedule-time">
                    <span className="time">{event.time}</span>
                  </div>
                  <div className="schedule-details">
                    <h4>{event.title}</h4>
                    <p>
                      <FontAwesomeIcon icon={faMapMarkerAlt} />
                      {event.location}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Pending Tasks */}
          <Card className="tasks-card" title="Pending Tasks">
            <div className="tasks-list">
              {userData.pendingTasks.map(task => (
                <div key={task.id} className="task-item">
                  <div className="task-info">
                    <h4>{task.task}</h4>
                    <p>Due: {new Date(task.due).toLocaleDateString()}</p>
                  </div>
                  <span className={`priority-tag ${task.priority.toLowerCase()}`}>
                    {task.priority}
                  </span>
                </div>
              ))}
            </div>
            <Link to="/user/tasks" className="view-all-link">
              View All Tasks <FontAwesomeIcon icon={faArrowRight} />
            </Link>
          </Card>

          {/* Recent Payslips */}
          <Card className="payslips-card" title="Recent Payslips">
            <div className="payslips-list">
              {userData.recentPayslips.map(payslip => (
                <div key={payslip.id} className="payslip-item">
                  <div className="payslip-info">
                    <FontAwesomeIcon icon={faFileInvoice} />
                    <span>{payslip.month}</span>
                  </div>
                  <div className="payslip-amount">{payslip.amount}</div>
                  <a href={payslip.downloadUrl} className="download-link">
                    Download
                  </a>
                </div>
              ))}
            </div>
            <Link to="/user/payroll" className="view-all-link">
              View All Payslips <FontAwesomeIcon icon={faArrowRight} />
            </Link>
          </Card>

          {/* Announcements */}
          <Card className="announcements-card" title="Announcements">
            <div className="announcements-list">
              {userData.announcements.map(ann => (
                <div key={ann.id} className="announcement-item">
                  <div className="announcement-content">
                    <h4>{ann.title}</h4>
                    <p>{new Date(ann.date).toLocaleDateString()}</p>
                  </div>
                  <span className={`type-tag ${ann.type.toLowerCase()}`}>
                    {ann.type}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Quick Tips */}
      <div className="quick-tips">
        <div className="tip-card">
          <FontAwesomeIcon icon={faBookOpen} className="tip-icon" />
          <div className="tip-content">
            <h4>Upcoming Deadline</h4>
            <p>Quarterly reports due in 5 days</p>
          </div>
        </div>
        <div className="tip-card">
          <FontAwesomeIcon icon={faLaptop} className="tip-icon" />
          <div className="tip-content">
            <h4>New Training Available</h4>
            <p>Online course on Research Ethics</p>
          </div>
        </div>
        <div className="tip-card">
          <FontAwesomeIcon icon={faCoffee} className="tip-icon" />
          <div className="tip-content">
            <h4>Faculty Lounge</h4>
            <p>Coffee break at 11 AM in common room</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;