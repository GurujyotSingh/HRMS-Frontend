import React from 'react';
import Sidebar from './Sidebar';

export default function AppLayout({ children }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      <Sidebar />
      <main
        style={{
          flex: 1,
          padding: '28px 32px',
          overflow: 'auto',
          minWidth: 0,
        }}
      >
        {children}
      </main>
    </div>
  );
}
