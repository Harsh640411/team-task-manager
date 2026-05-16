import React from 'react';

const AdminDashboard = () => {
  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  return (
    <div style={{
      background: '#121212',
      color: 'white',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'sans-serif'
    }}>
      <h1 style={{ color: '#00bcd4', fontSize: '3rem' }}>👑 Admin Control Center</h1>
      <p style={{ color: '#888', fontSize: '1.2rem' }}>Welcome to the master management panel.</p>
      
      <button 
        onClick={handleLogout}
        style={{
          marginTop: '20px',
          background: '#ef4444',
          color: 'white',
          border: 'none',
          padding: '12px 24px',
          borderRadius: '8px',
          fontWeight: 'bold',
          cursor: 'pointer'
        }}
      >
        ↪ Sign Out Admin
      </button>
    </div>
  );
};

export default AdminDashboard;