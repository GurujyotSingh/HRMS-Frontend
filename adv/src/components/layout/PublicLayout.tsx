import React from 'react';
import { Outlet } from 'react-router-dom';

const PublicLayout: React.FC = () => {
  return (
    <div className="public-layout">
      <main className="public-main">
        <Outlet />
      </main>
    </div>
  );
};

export default PublicLayout;