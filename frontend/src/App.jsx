import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import ProjectView from './pages/ProjectView';
import AdminDashboard from './components/AdminDashboard'; 

function App() {
  const isAuthenticated = !!localStorage.getItem('token');
  // LocalStorage se saved role read karenge (admin / tasker)
  const userRole = localStorage.getItem('userRole') || 'tasker';

  return (
    <Router>
      <Routes>
        {/* Default Route handling */}
        <Route 
          path="/" 
          element={
            isAuthenticated ? (
              userRole === 'admin' ? <Navigate to="/admin-dashboard" /> : <Navigate to="/dashboard" />
            ) : (
              <Signup />
            )
          } 
        />
        
        {/* Auth Paths */}
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />

        {/* Tasker Dashboard protected */}
        <Route 
          path="/dashboard" 
          element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} 
        />

        {/* Admin Dashboard protected */}
        <Route 
          path="/admin-dashboard" 
          element={isAuthenticated && userRole === 'admin' ? <AdminDashboard /> : <Navigate to="/login" />} 
        />

        {/* Projects View */}
        <Route 
          path="/projects" 
          element={isAuthenticated ? <ProjectView /> : <Navigate to="/login" />} 
        />

        {/* Global Fallback Redirect */}
        <Route 
          path="*" 
          element={
            <Navigate to={
              isAuthenticated ? (userRole === 'admin' ? "/admin-dashboard" : "/dashboard") : "/"
            } />
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;