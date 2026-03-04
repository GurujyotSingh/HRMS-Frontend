import React from 'react';
import { NavLink } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHome,
  faUsers,
  faCalendarAlt,
  faClock,
  faUserPlus,
  faStar,
  faLaptop,
  faMoneyBill,
  faCalendar,
  faChartBar,
  faCog,
  faChevronLeft,
  faChevronRight,
  faSignOutAlt,
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../hooks/useAuth';
import { hasPermission } from '../../utils/permissions';
import { useNavigate } from 'react-router-dom';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const userRole = user?.role || 'Employee';

  // Determine the base path based on user role
  const getBasePath = () => {
    switch(userRole) {
      case 'HRAdmin':
      case 'Director':
        return '/admin';
      case 'HOD':
        return '/hod';
      default:
        return '/user';
    }
  };

  const basePath = getBasePath();

  const menuItems = [
    { path: `${basePath}/dashboard`, icon: faHome, label: 'Dashboard', roles: ['Employee', 'HOD', 'HRAdmin', 'Director'] },
    { path: `${basePath}/employees`, icon: faUsers, label: 'Employees', roles: ['HRAdmin', 'Director'] },
    { path: `${basePath}/leave`, icon: faCalendarAlt, label: 'Leave Management', roles: ['Employee', 'HOD', 'HRAdmin', 'Director'] },
    { path: `${basePath}/attendance`, icon: faClock, label: 'Attendance', roles: ['Employee', 'HOD', 'HRAdmin'] },
    { path: `${basePath}/onboarding`, icon: faUserPlus, label: 'Onboarding', roles: ['HRAdmin'] },
    { path: `${basePath}/performance`, icon: faStar, label: 'Performance', roles: ['HOD', 'HRAdmin', 'Director'] },
    { path: `${basePath}/resources`, icon: faLaptop, label: 'Resources', roles: ['Employee', 'HRAdmin'] },
    { path: `${basePath}/payroll`, icon: faMoneyBill, label: 'Payroll', roles: ['HRAdmin', 'Director'] },
    { path: `${basePath}/calendar`, icon: faCalendar, label: 'Calendar', roles: ['Employee', 'HOD', 'HRAdmin', 'Director'] },
    { path: `${basePath}/reports`, icon: faChartBar, label: 'Reports', roles: ['HRAdmin', 'Director'] },
    { path: `${basePath}/settings`, icon: faCog, label: 'Settings', roles: ['HRAdmin'] },
  ];

  const filteredMenu = menuItems.filter(item => 
    item.roles.includes(userRole) || hasPermission(user, item.label.toLowerCase())
  );

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-header">
        <div className="logo">
          <h2>HRMS</h2>
          {isOpen && <span>University</span>}
        </div>
        <button className="toggle-btn" onClick={toggleSidebar}>
          <FontAwesomeIcon icon={isOpen ? faChevronLeft : faChevronRight} />
        </button>
      </div>

      <nav className="sidebar-nav">
        {filteredMenu.map((item, index) => (
          <NavLink
            key={index}
            to={item.path}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            end={item.path.endsWith('dashboard')}
          >
            <FontAwesomeIcon icon={item.icon} />
            {isOpen && <span className="nav-label">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">
            {user?.profilePicture ? (
              <img src={user.profilePicture} alt={user.name} />
            ) : (
              <span>{user?.name?.charAt(0) || 'U'}</span>
            )}
          </div>
          {isOpen && (
            <div className="user-details">
              <span className="user-name">{user?.name || 'User'}</span>
              <span className="user-role">{user?.role || 'Employee'}</span>
            </div>
          )}
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          <FontAwesomeIcon icon={faSignOutAlt} />
          {isOpen && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;