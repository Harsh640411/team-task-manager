import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            // Backend port 5000 par request
            const res = await axios.post('http://localhost:5000/api/auth/login', { 
                username, 
                password 
            });
            
            // Token aur Role save karo
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('role', res.data.role);
            localStorage.setItem('username', res.data.username);
            
            // Dashboard par jao
            navigate('/dashboard');
        } catch (err) {
            alert('Login Failed: ' + (err.response?.data?.error || 'Server error'));
        }
    };

    return (
        <div style={{ maxWidth: '400px', margin: '100px auto', textAlign: 'center', fontFamily: 'sans-serif' }}>
            <h2>Task Manager Login</h2>
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <input 
                    type="text" 
                    placeholder="Username" 
                    value={username} 
                    onChange={e => setUsername(e.target.value)} 
                    required 
                    style={{ padding: '10px' }}
                />
                <input 
                    type="password" 
                    placeholder="Password" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    required 
                    style={{ padding: '10px' }}
                />
                <button type="submit" style={{ padding: '10px', background: '#007bff', color: 'white', border: 'none', cursor: 'pointer' }}>
                    Login
                </button>
            </form>
        </div>
    );
};

export default Login;