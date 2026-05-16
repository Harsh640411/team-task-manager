import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const Signup = () => {
  const [fullName, setFullName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('admin'); // ✅ Default role set to 'admin' first
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('https://team-task-manager-production-fb15.up.railway.app/api/auth/signup', {
        username: email, 
        password: password,
        fullName: fullName,
        jobTitle: jobTitle,
        role: role // Sends admin or tasker
      });
      alert('Account Created Successfully! 🚀');
      navigate('/login');
    } catch (error) {
      alert('Signup failed: ' + (error.response?.data?.error || 'Server Configuration Error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      {/* Global CSS Reset injected to fix html and body white spaces */}
      <style>{`
        /* ✅ Root resets to force absolute page-wide darkness */
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          background-color: #121212 !important;
          width: 100% !important;
          height: 100% !important;
          overflow: hidden;
        }

        .auth-wrapper {
          height: 100vh;
          width: 100vw;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #121212; 
          font-family: 'Inter', sans-serif;
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        .auth-card {
          background: #1e1e1e; 
          padding: 40px;
          border-radius: 24px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.4);
          width: 400px;
          text-align: center;
          border: 1px solid rgba(255,255,255,0.05);
          animation: fadeIn 0.8s ease;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .header-section { margin-bottom: 25px; }
        .logo-box {
          width: 50px;
          height: 50px;
          background: #00bcd4;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 20px;
          margin: 0 auto 15px;
        }
        h2 { color: #ffffff; margin: 0; font-size: 24px; }
        p.brand-sub { color: #666; font-size: 12px; margin-top: 5px; }
        
        .tab-group {
          display: flex;
          background: #2a2a2a;
          padding: 5px;
          border-radius: 12px;
          margin-bottom: 15px;
        }
        .tab-item {
          flex: 1;
          padding: 10px;
          border-radius: 8px;
          color: #888;
          text-decoration: none;
          font-size: 14px;
          transition: 0.3s;
          cursor: pointer;
        }
        .tab-item.active {
          background: #333;
          color: #fff;
          box-shadow: 0 4px 10px rgba(0,0,0,0.2);
        }

        /* Role Switch Styles */
        .role-group {
          display: flex;
          background: #181818;
          padding: 4px;
          border-radius: 10px;
          margin-bottom: 25px;
          border: 1px solid #2a2a2a;
        }
        .role-item {
          flex: 1;
          padding: 8px;
          border-radius: 6px;
          color: #666;
          font-size: 13px;
          font-weight: 500;
          transition: 0.2s;
          cursor: pointer;
        }
        .role-item.active {
          background: #00bcd4;
          color: black;
          font-weight: 600;
        }

        .input-box { margin-bottom: 18px; text-align: left; }
        label { color: #888; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px; }
        input {
          width: 100%;
          padding: 14px;
          background: #2a2a2a;
          border: 1px solid #333;
          border-radius: 12px;
          color: #fff;
          outline: none;
          box-sizing: border-box;
        }
        input:focus { border-color: #00bcd4; background: #2f2f2f; }
        
        .submit-btn {
          width: 100%;
          padding: 14px;
          background: #00bcd4; 
          color: white;
          border: none;
          border-radius: 12px;
          font-weight: 600;
          font-size: 16px;
          cursor: pointer;
          transition: 0.3s;
          margin-top: 5px;
        }
        .submit-btn:hover { background: #00acc1; transform: translateY(-2px); box-shadow: 0 5px 15px rgba(0,188,212,0.3); }
        
        .switch-text { color: #666; margin-top: 20px; font-size: 13px; }
        .link-blue { color: #00bcd4; text-decoration: none; font-weight: 500; }
      `}</style>

      <div className="auth-card">
        <div className="header-section">
          <div className="logo-box">TT</div>
          <h2>Task Track</h2>
          <p className="brand-sub">Advanced Task Management Platform</p>
        </div>

        {/* Auth Navigation Tabs */}
        <div className="tab-group">
          <Link to="/login" className="tab-item">Sign In</Link>
          <div className="tab-item active">Register</div>
        </div>

        {/* ✅ UPDATED: Admin First (Left) and Tasker Second (Right) */}
        <div className="role-group">
          <div 
            className={`role-item ${role === 'admin' ? 'active' : ''}`} 
            onClick={() => setRole('admin')}
          >
            Admin
          </div>
          <div 
            className={`role-item ${role === 'tasker' ? 'active' : ''}`} 
            onClick={() => setRole('tasker')}
          >
            Tasker
          </div>
        </div>

        <form onSubmit={handleSignup}>
          <div className="input-box">
            <label>Full Name</label>
            <input 
              type="text" 
              placeholder="Enter your full name" 
              value={fullName} 
              onChange={(e) => setFullName(e.target.value)} 
              required 
            />
          </div>

          <div className="input-box">
            <label>Job Title</label>
            <input 
              type="text" 
              placeholder="e.g. Full Stack Developer / Tasker" 
              value={jobTitle} 
              onChange={(e) => setJobTitle(e.target.value)} 
              required 
            />
          </div>

          <div className="input-box">
            <label>Email Address</label>
            <input 
              type="email" 
              placeholder="Enter your email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
          </div>

          <div className="input-box">
            <label>Password</label>
            <input 
              type="password" 
              placeholder="Create a strong password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Creating...' : 'Register'}
          </button>
        </form>

        <p className="switch-text">
          Already have an account? <Link to="/login" className="link-blue">Sign in instead</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;