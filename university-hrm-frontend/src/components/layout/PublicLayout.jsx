import React from 'react';
import { Link } from 'react-router-dom';
import '../../pages/public-careers.css';

export default function PublicLayout({ children }) {
  return (
    <div className="public-layout">
      {/* Navbar */}
      <nav className="public-nav">
        <div className="public-nav-container">
          <div className="public-nav-brand">
            <Link to="/careers" className="public-nav-brand">
              <div className="public-nav-logo">
                U
              </div>
              <span className="public-nav-title">
                University<span>HRM</span> Careers
              </span>
            </Link>
          </div>
          <div className="public-nav-links">
            <Link to="/careers" className="public-nav-link">
              Open Positions
            </Link>
            <Link to="/login" className="public-login-btn">
              Employee Login
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main>
        {children}
      </main>

      {/* Footer */}
      <footer className="public-footer">
        <div>
          &copy; {new Date().getFullYear()} University HRM. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
