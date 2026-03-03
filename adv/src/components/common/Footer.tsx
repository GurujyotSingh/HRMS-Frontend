import React from 'react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="app-footer">
      <div className="footer-content">
        <div className="footer-left">
          <p>&copy; {currentYear} University HRMS. All rights reserved.</p>
        </div>
        <div className="footer-right">
          <a href="/privacy">Privacy Policy</a>
          <a href="/terms">Terms of Service</a>
          <a href="/contact">Contact Support</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;