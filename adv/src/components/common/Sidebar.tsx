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
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../hooks/useAuth';
import { hasPermission } from '../../utils/permissions';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar }) => {
  const { user } = useAuth();
  const userRole = user?.role || 'Employee';

  const menuItems = [
    { path: '/dashboard', icon: faHome, label: 'Dashboard', roles: ['Employee', 'HOD', 'HRAdmin', 'Director'] },
    { path: '/employees', icon: faUsers, label: 'Employees', roles: ['HRAdmin', 'Director'] },
    { path: '/leave', icon: faCalendarAlt, label: 'Leave Management', roles: ['Employee', 'HOD', 'HRAdmin', 'Director'] },
    { path: '/attendance', icon: faClock, label: 'Attendance', roles: ['Employee', 'HOD', 'HRAdmin'] },
    { path: '/onboarding', icon: faUserPlus, label: 'Onboarding', roles: ['HRAdmin'] },
    { path: '/performance', icon: faStar, label: 'Performance', roles: ['HOD', 'HRAdmin', 'Director'] },
    { path: '/resources', icon: faLaptop, label: 'Resources', roles: ['Employee', 'HRAdmin'] },
    { path: '/payroll', icon: faMoneyBill, label: 'Payroll', roles: ['HRAdmin', 'Director'] },
    { path: '/calendar', icon: faCalendar, label: 'Calendar', roles: ['Employee', 'HOD', 'HRAdmin', 'Director'] },
    { path: '/reports', icon: faChartBar, label: 'Reports', roles: ['HRAdmin', 'Director'] },
    { path: '/settings', icon: faCog, label: 'Settings', roles: ['HRAdmin'] },
  ];

  const filteredMenu = menuItems.filter(item => 
    item.roles.includes(userRole) || hasPermission(user, item.label.toLowerCase())
  );

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
      </div>
    </aside>
  );
};

export default Sidebar;