import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../common/Header';
import Footer from '../common/Footer';

const UserLayout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="user-layout">
      <Header />
      
      <main className="user-main-content">
        <div className="user-container">
          <Outlet />
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default UserLayout;