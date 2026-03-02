// src/components/Layout.tsx
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useState, useEffect } from 'react';
import { Link, Outlet } from 'react-router-dom';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 1024);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1024) {
        setSidebarOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="layout-container">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'active' : ''}`}>
        <div className="sidebar-header">
          <h2>University HRMS</h2>
        </div>
        <nav className="sidebar-nav">
          <Link to="/admin/dashboard" onClick={() => window.innerWidth <= 1024 && setSidebarOpen(false)}>
            <FontAwesomeIcon icon={["fas", "tachometer-alt"]} /> Dashboard
          </Link>
          <Link to="/admin/employees" onClick={() => window.innerWidth <= 1024 && setSidebarOpen(false)}>
            <FontAwesomeIcon icon={["fas", "users"]} /> Employees
          </Link>
          <Link to="/admin/leave" onClick={() => window.innerWidth <= 1024 && setSidebarOpen(false)}>
            <FontAwesomeIcon icon={["fas", "calendar-alt"]} /> Leave Requests
          </Link>
          <Link to="/admin/payroll" onClick={() => window.innerWidth <= 1024 && setSidebarOpen(false)}>
            <FontAwesomeIcon icon={["fas", "money-bill-wave"]} /> Payroll
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="main-layout">
        {/* Header */}
        <header className="header">
          <div className="header-left">
            <div
              className="menu-toggle"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <FontAwesomeIcon icon={["fas", "bars"]} />
            </div>
            
          </div>

          <div className="header-actions">
            <div className="search-bar">
              <FontAwesomeIcon icon={["fas", "search"]} className="search-icon" />
              <input type="text" className="search-input" placeholder="Search..." />
            </div>
            <div className="header-icon">
              <FontAwesomeIcon icon={["fas", "bell"]} />
            </div>
            <div className="header-icon">
              <FontAwesomeIcon icon={["fas", "user-circle"]} />
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="dashboard">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;