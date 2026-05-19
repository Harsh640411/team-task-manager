import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post('https://team-task-manager-production-fb15.up.railway.app/api/auth/login', {
        username: email,
        password: password
      });

      // ✅ FIXED: Token mapped to both scopes to strictly isolate tab contexts on hard/soft refreshes
      localStorage.setItem('token', res.data.token);
      sessionStorage.setItem('token', res.data.token);

      // Ab backend se user details fetch karenge role janne ke liye
      const userRes = await axios.get('https://team-task-manager-production-fb15.up.railway.app/api/auth/me', {
        headers: { Authorization: `Bearer ${res.data.token}` }
      });

      const userRole = userRes.data?.role ? userRes.data.role.toLowerCase() : 'tasker';
      const actualUsername = userRes.data?.username || email;
      
      // ✅ FIXED: Save identity payload inside sessionStorage to completely freeze cross-tab leakage
      localStorage.setItem('userRole', userRole);
      localStorage.setItem('username', actualUsername);
      
      sessionStorage.setItem('userRole', userRole);
      sessionStorage.setItem('username', actualUsername);

      alert('Logged In successfully! 🚀');

      // Proper redirection matching roles
      if (userRole === 'admin') {
        navigate('/admin-dashboard');
      } else {
        navigate('/dashboard');
      }

      // Force a soft page refresh to lock state accurately inside specific windows boundaries
      window.location.reload();

    } catch (error) {
      alert('Login failed: ' + (error.response?.data?.error || 'Invalid username or password'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <style>{`
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
        }
        .auth-card {
          background: #1e1e1e; 
          padding: 40px;
          border-radius: 24px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.4);
          width: 400px;
          text-align: center;
          border: 1px solid rgba(255,255,255,0.05);
        }
        .header-section { margin-bottom: 30px; }
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
        .tab-group { display: flex; background: #2a2a2a; padding: 5px; border-radius: 12px; margin-bottom: 30px; }
        .tab-item { flex: 1; padding: 10px; border-radius: 8px; color: #888; text-decoration: none; font-size: 14px; }
        .tab-item.active { background: #333; color: #fff; }
        .input-box { margin-bottom: 20px; text-align: left; }
        label { color: #888; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px; }
        input { width: 100%; padding: 14px; background: #2a2a2a; border: 1px solid #333; border-radius: 12px; color: #fff; outline: none; box-sizing: border-box; }
        input:focus { border-color: #00bcd4; }
        .submit-btn { width: 100%; padding: 14px; background: #00bcd4; color: white; border: none; border-radius: 12px; font-weight: 600; font-size: 16px; cursor: pointer; }
        .switch-text { color: #666; margin-top: 25px; font-size: 13px; }
        .link-blue { color: #00bcd4; text-decoration: none; }
      `}</style>

      <div className="auth-card">
        <div className="header-section">
          <div className="logo-box">TT</div>
          <h2>Task Track</h2>
        </div>

        <div className="tab-group">
          <div className="tab-item active">Sign In</div>
          <Link to="/signup" className="tab-item">Register</Link>
        </div>

        <form onSubmit={handleLogin}>
          <div className="input-box">
            <label>Email Address</label>
            <input type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>

          <div className="input-box">
            <label>Password</label>
            <input type="password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <p className="switch-text">
          Don't have an account? <Link to="/signup" className="link-blue">Register instead</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;