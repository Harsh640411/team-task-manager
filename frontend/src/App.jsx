import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import ProjectView from './pages/ProjectView';

function App() {
  const isAuthenticated = !!localStorage.getItem('token');

  return (
    <Router>
      <Routes>
        {/* Default route ab Signup par jayega agar user login nahi hai */}
        <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Signup />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />

        {/* Protected Routes */}
        <Route 
          path="/dashboard" 
          element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/projects" 
          element={isAuthenticated ? <ProjectView /> : <Navigate to="/login" />} 
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/"} />} />
      </Routes>
    </Router>
  );
}

export default App;