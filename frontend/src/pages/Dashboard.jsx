import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
    const [tasks, setTasks] = useState([]);
    const navigate = useNavigate();
    const username = localStorage.getItem('username');
    const role = localStorage.getItem('role');

    useEffect(() => {
        const fetchTasks = async () => {
            const token = localStorage.getItem('token');
            if (!token) return navigate('/login');

            try {
                const res = await axios.get('http://localhost:5000/api/tasks', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setTasks(res.data);
            } catch (err) {
                console.error(err);
                if(err.response?.status === 401 || err.response?.status === 403) {
                     localStorage.clear();
                     navigate('/login');
                }
            }
        };
        fetchTasks();
    }, [navigate]);

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    return (
        <div style={{ padding: '30px', fontFamily: 'sans-serif' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2>Welcome, {username} ({role})</h2>
                <button onClick={handleLogout} style={{ padding: '8px 15px', background: 'red', color: 'white', border: 'none', cursor: 'pointer' }}>
                    Logout
                </button>
            </div>

            <h3>Your Tasks</h3>
            {tasks.length === 0 ? (
                <p>No tasks assigned yet.</p>
            ) : (
                <table border="1" width="100%" style={{ textAlign: 'left', borderCollapse: 'collapse' }}>
                    <thead style={{ background: '#f4f4f4' }}>
                        <tr>
                            <th style={{ padding: '10px' }}>Task ID</th>
                            <th style={{ padding: '10px' }}>Title</th>
                            <th style={{ padding: '10px' }}>Status</th>
                            <th style={{ padding: '10px' }}>Due Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tasks.map(task => (
                            <tr key={task.id}>
                                <td style={{ padding: '10px' }}>{task.id}</td>
                                <td style={{ padding: '10px' }}>{task.title}</td>
                                <td style={{ padding: '10px' }}>
                                    <span style={{ 
                                        padding: '4px 8px', 
                                        borderRadius: '4px',
                                        background: task.status === 'Completed' ? 'lightgreen' : task.status === 'In Progress' ? 'lightyellow' : 'lightcoral' 
                                    }}>
                                        {task.status}
                                    </span>
                                </td>
                                <td style={{ padding: '10px' }}>{new Date(task.due_date).toLocaleDateString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default Dashboard;