import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBell,
  faUser,
  faSignOutAlt,
  faCog,
  faChevronDown,
  faSearch,
  faMoon,
  faSun,
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../hooks/useAuth';
import { useNotification } from '../../hooks/useNotification';
import { useTheme } from '../../hooks/useTheme';

interface HeaderProps {
  toggleSidebar?: () => void;
  showMobileMenu?: boolean;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar, showMobileMenu }) => {
  const { user, logout } = useAuth();
  const { showNotification } = useNotification();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = React.useState(false);
  const [showNotifications, setShowNotifications] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');

  const notifications = [
    { id: 1, message: 'Leave request approved', time: '5 min ago', read: false },
    { id: 2, message: 'New task assigned', time: '1 hour ago', read: false },
    { id: 3, message: 'Meeting at 3 PM', time: '2 hours ago', read: true },
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleLogout = async () => {
    try {
      await logout();
      showNotification('Logged out successfully', 'success');
      navigate('/login');
    } catch (error) {
      showNotification('Error logging out', 'error');
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };

  return (
    <header className="app-header">
      <div className="header-left">
        {toggleSidebar && (
          <button className="mobile-menu-toggle" onClick={toggleSidebar}>
            <span></span>
            <span></span>
            <span></span>
          </button>
        )}
        
        <form className="search-bar" onSubmit={handleSearch}>
          <FontAwesomeIcon icon={faSearch} className="search-icon" />
          <input
            type="text"
            placeholder="Search employees, leaves, reports..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>
      </div>

      <div className="header-right">
        {/* Theme Toggle */}
        <button className="icon-btn theme-toggle" onClick={toggleTheme}>
          <FontAwesomeIcon icon={theme === 'dark' ? faSun : faMoon} />
        </button>

        {/* Notifications */}
        <div className="notifications-dropdown">
          <button 
            className="icon-btn"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <FontAwesomeIcon icon={faBell} />
            {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
          </button>
          
          {showNotifications && (
            <div className="dropdown-menu notifications-menu">
              <div className="menu-header">
                <h3>Notifications</h3>
                <button onClick={() => setShowNotifications(false)}>×</button>
              </div>
              <div className="menu-body">
                {notifications.length > 0 ? (
                  notifications.map(notif => (
                    <div key={notif.id} className={`notification-item ${notif.read ? '' : 'unread'}`}>
                      <p>{notif.message}</p>
                      <small>{notif.time}</small>
                    </div>
                  ))
                ) : (
                  <p className="empty-message">No notifications</p>
                )}
              </div>
              <div className="menu-footer">
                <button className="view-all">View All</button>
              </div>
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className="user-dropdown">
          <button 
            className="user-menu-btn"
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <div className="user-avatar">
              {user?.profilePicture ? (
                <img src={user.profilePicture} alt={user.name} />
              ) : (
                <FontAwesomeIcon icon={faUser} />
              )}
            </div>
            <div className="user-info">
              <span className="user-name">{user?.name || 'User'}</span>
              <span className="user-role">{user?.role || 'Employee'}</span>
            </div>
            <FontAwesomeIcon icon={faChevronDown} className={`arrow ${showUserMenu ? 'open' : ''}`} />
          </button>

          {showUserMenu && (
            <div className="dropdown-menu user-menu">
              <Link to="/profile" onClick={() => setShowUserMenu(false)}>
                <FontAwesomeIcon icon={faUser} /> My Profile
              </Link>
              <Link to="/settings" onClick={() => setShowUserMenu(false)}>
                <FontAwesomeIcon icon={faCog} /> Settings
              </Link>
              <div className="divider"></div>
              <button onClick={handleLogout}>
                <FontAwesomeIcon icon={faSignOutAlt} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;