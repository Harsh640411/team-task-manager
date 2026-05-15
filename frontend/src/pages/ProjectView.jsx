import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const ProjectView = () => {
    const [projects, setProjects] = useState([]);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProjects = async () => {
            const token = localStorage.getItem('token');
            if (!token) return navigate('/login');

            try {
                const res = await axios.get('https://team-task-manager-production-fb15.up.railway.app/api/projects', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setProjects(res.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchProjects();
    }, [navigate]);

    const handleCreateProject = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.post('http://team-task-manager-production-fb15.up.railway.app/api/projects', 
                { name, description }, 
                { headers: { Authorization: `Bearer ${token}` }}
            );
            alert('Project Created!');
            window.location.reload(); // Quick refresh to show the new project
        } catch (err) {
            alert('Failed to create project');
        }
    };

    return (
        <div style={{ padding: '30px', fontFamily: 'sans-serif' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <h2>Projects</h2>
                <Link to="/dashboard" style={{ padding: '10px', background: '#007bff', color: 'white', textDecoration: 'none', borderRadius: '5px' }}>Back to Dashboard</Link>
            </div>

            <div style={{ marginBottom: '30px', padding: '20px', background: '#f8f9fa', borderRadius: '8px' }}>
                <h3>Create New Project</h3>
                <form onSubmit={handleCreateProject} style={{ display: 'flex', gap: '10px' }}>
                    <input type="text" placeholder="Project Name" value={name} onChange={e => setName(e.target.value)} required style={{ padding: '8px' }} />
                    <input type="text" placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} style={{ padding: '8px', flex: 1 }} />
                    <button type="submit" style={{ padding: '8px 15px', background: '#28a745', color: 'white', border: 'none', cursor: 'pointer' }}>Create</button>
                </form>
            </div>

            <table border="1" width="100%" style={{ textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead style={{ background: '#f4f4f4' }}>
                    <tr>
                        <th style={{ padding: '10px' }}>ID</th>
                        <th style={{ padding: '10px' }}>Project Name</th>
                        <th style={{ padding: '10px' }}>Description</th>
                    </tr>
                </thead>
                <tbody>
                    {projects.map(p => (
                        <tr key={p.id}>
                            <td style={{ padding: '10px' }}>{p.id}</td>
                            <td style={{ padding: '10px' }}>{p.name}</td>
                            <td style={{ padding: '10px' }}>{p.description}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ProjectView;