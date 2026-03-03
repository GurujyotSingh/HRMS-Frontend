// src/components/UserLayout.tsx
import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHome,
  faCalendarAlt,
  faClock,
  faUser,
  faBell,
  faBars,
  faTimes,
  faSignOutAlt,
  faChevronDown,
  faFileAlt,
  faUsers,
  faBriefcase,
} from '@fortawesome/free-solid-svg-icons';
import { Link, Outlet, useNavigate } from 'react-router-dom';

const UserLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, message: 'Leave request approved', read: false },
    { id: 2, message: 'Payslip for March generated', read: false },
    { id: 3, message: 'Team meeting at 3 PM', read: true },
  ]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      if (window.innerWidth > 768) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleLogout = () => {
    // Clear session/storage
    localStorage.removeItem('user');
    sessionStorage.clear();
    navigate('/');
  };

  const markAsRead = (id: number) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const isMobile = windowWidth <= 768;

  return (
    <div className="user-layout">
      {/* Sidebar Overlay for Mobile */}
      {isMobile && sidebarOpen && (
        <div className="sidebar-overlay active" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`user-sidebar ${sidebarOpen ? 'active' : ''}`}>
        <div className="user-sidebar-header">
          <div className="logo-container">
            <h2>HRMS Portal</h2>
            {isMobile && (
              <button className="close-sidebar" onClick={() => setSidebarOpen(false)}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            )}
          </div>
          <div className="user-profile-mini">
            <div className="user-avatar-small">
              <FontAwesomeIcon icon={faUser} />
            </div>
            <div className="user-info-small">
              <h4>John Doe</h4>
              <p>Software Engineer</p>
            </div>
          </div>
        </div>

        <nav className="user-sidebar-nav">
          <Link to="/user/dashboard" onClick={() => isMobile && setSidebarOpen(false)}>
            <FontAwesomeIcon icon={faHome} />
            <span>Dashboard</span>
          </Link>
          <Link to="/user/leave" onClick={() => isMobile && setSidebarOpen(false)}>
            <FontAwesomeIcon icon={faCalendarAlt} />
            <span>Leave Management</span>
          </Link>
          <Link to="/user/attendance" onClick={() => isMobile && setSidebarOpen(false)}>
            <FontAwesomeIcon icon={faClock} />
            <span>Attendance</span>
          </Link>
          <Link to="/user/payslips" onClick={() => isMobile && setSidebarOpen(false)}>
            <FontAwesomeIcon icon={faFileAlt} />
            <span>Payslips</span>
          </Link>
          <Link to="/user/profile" onClick={() => isMobile && setSidebarOpen(false)}>
            <FontAwesomeIcon icon={faUser} />
            <span>My Profile</span>
          </Link>
          <Link to="/user/team" onClick={() => isMobile && setSidebarOpen(false)}>
            <FontAwesomeIcon icon={faUsers} />
            <span>My Team</span>
          </Link>
          <Link to="/user/documents" onClick={() => isMobile && setSidebarOpen(false)}>
            <FontAwesomeIcon icon={faBriefcase} />
            <span>Documents</span>
          </Link>
        </nav>

        <div className="user-sidebar-footer">
          <button onClick={handleLogout} className="logout-btn">
            <FontAwesomeIcon icon={faSignOutAlt} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`user-main ${sidebarOpen ? 'sidebar-open' : ''}`}>
        {/* Header */}
        <header className="user-header">
          <div className="header-left">
            {isMobile && (
              <button className="menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
                <FontAwesomeIcon icon={faBars} />
              </button>
            )}
            <div className="page-title">
              <h1>Welcome back, John!</h1>
              <p>{new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</p>
            </div>
          </div>

          <div className="header-right">
            {/* Notifications */}
            <div className="notifications-container">
              <button 
                className="notification-icon"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <FontAwesomeIcon icon={faBell} />
                {unreadCount > 0 && (
                  <span className="notification-badge">{unreadCount}</span>
                )}
              </button>

              {showNotifications && (
                <div className="notifications-dropdown">
                  <div className="notifications-header">
                    <h3>Notifications</h3>
                    <button onClick={() => setShowNotifications(false)}>
                      <FontAwesomeIcon icon={faTimes} />
                    </button>
                  </div>
                  <div className="notifications-list">
                    {notifications.length > 0 ? (
                      notifications.map(notif => (
                        <div 
                          key={notif.id} 
                          className={`notification-item ${notif.read ? 'read' : 'unread'}`}
                          onClick={() => markAsRead(notif.id)}
                        >
                          <p>{notif.message}</p>
                          <small>2 hours ago</small>
                        </div>
                      ))
                    ) : (
                      <div className="no-notifications">
                        <p>No notifications</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Menu */}
            <div className="profile-menu-container">
              <button 
                className="profile-menu-btn"
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              >
                <div className="profile-avatar">
                  <FontAwesomeIcon icon={faUser} />
                </div>
                <div className="profile-info">
                  <span className="profile-name">John Doe</span>
                  <span className="profile-role">Software Engineer</span>
                </div>
                <FontAwesomeIcon icon={faChevronDown} className={`arrow ${profileMenuOpen ? 'open' : ''}`} />
              </button>

              {profileMenuOpen && (
                <div className="profile-dropdown">
                  <Link to="/user/profile" onClick={() => setProfileMenuOpen(false)}>
                    <FontAwesomeIcon icon={faUser} />
                    My Profile
                  </Link>
                  <Link to="/user/settings" onClick={() => setProfileMenuOpen(false)}>
                    <FontAwesomeIcon icon={faBriefcase} />
                    Settings
                  </Link>
                  <hr />
                  <button onClick={handleLogout}>
                    <FontAwesomeIcon icon={faSignOutAlt} />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="user-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default UserLayout;