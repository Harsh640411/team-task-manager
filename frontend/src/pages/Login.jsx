import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
  // ✅ Changed from username to email state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      // ✅ Payload sends email into the backend expected username field mapping
      const response = await axios.post('https://team-task-manager-production-fb15.up.railway.app/api/auth/login', {
        username: email, 
        password
      });
      localStorage.setItem('token', response.data.token);
      // Direct redirect with hard refresh to clear state
      window.location.href = '/dashboard';
    } catch (error) {
      // ✅ Dynamically updated alert messaging context
      alert('Login Failed! Check email or password.');
    }
  };

  return (
    <div className="auth-container">
      {/* Purane UI styles and properties strictly preserved without change */}
      <style>{`
        .auth-container {
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #232526 0%, #414345 100%);
          font-family: 'Poppins', sans-serif;
        }
        .auth-card {
          background: rgba(255, 255, 255, 0.07);
          backdrop-filter: blur(15px);
          padding: 40px;
          border-radius: 20px;
          width: 380px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          text-align: center;
          box-shadow: 0 20px 40px rgba(0,0,0,0.4);
          animation: slideUp 0.8s ease-out;
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        h2 { color: #fff; margin-bottom: 10px; }
        .input-group { margin-bottom: 20px; }
        input {
          width: 100%;
          padding: 12px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 10px;
          color: #fff;
          outline: none;
          box-sizing: border-box;
        }
        input:focus { border-color: #00d2ff; }
        .btn {
          width: 100%;
          padding: 12px;
          background: linear-gradient(to right, #00d2ff, #3a7bd5);
          color: white;
          border: none;
          border-radius: 10px;
          font-weight: bold;
          cursor: pointer;
          transition: 0.3s;
        }
        .btn:hover { transform: scale(1.03); box-shadow: 0 0 15px #00d2ff; }
        .footer-text { color: #ccc; margin-top: 20px; font-size: 14px; }
        .link { color: #00d2ff; text-decoration: none; font-weight: bold; }
      `}</style>

      <div className="auth-card">
        <h2>Welcome Back</h2>
        <p style={{color: '#aaa', marginBottom: '30px'}}>Please login to your account</p>
        <form onSubmit={handleLogin}>
          {/* ✅ UPDATED ELEMENT: USERNAME CONVERTED TO EMAIL */}
          <div className="input-group">
            <input 
              type="email" 
              placeholder="Email Address" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
          </div>
          <div className="input-group">
            <input 
              type="password" 
              placeholder="Password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>
          <button type="submit" className="btn">Login</button>
        </form>
        <p className="footer-text">
          New user? <Link to="/signup" className="link">Create Account</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;