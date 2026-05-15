import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Dashboard = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState({ fullName: 'Loading...', role: 'Member', username: '' });
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [newTask, setNewTask] = useState({ title: '', description: '', project_id: '' });
  
  const [activeTab, setActiveTab] = useState('dashboard'); 
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showThemeSubMenu, setShowThemeSubMenu] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('Dark');
  const [showHeaderDropdown, setShowHeaderDropdown] = useState(false);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [leaveForm, setLeaveForm] = useState({ fromDate: '', toDate: '', reason: '' });

  const [isPunchedIn, setIsPunchedIn] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [punchInTime, setPunchInTime] = useState("-");
  const [punchOutTime, setPunchOutTime] = useState("-");
  
  const [punchCount, setPunchCount] = useState(0); 
  const [isShiftOver, setIsShiftOver] = useState(false);
  const [accumulatedSessionTime, setAccumulatedSessionTime] = useState(0); 

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) navigate('/login');
    fetchUserData();
    fetchTasks();
    fetchProjects();
  }, []);

  useEffect(() => {
    let interval = null;
    if (isPunchedIn) {
      interval = setInterval(() => { setSeconds(prev => prev + 1); }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isPunchedIn]);

  const handleLogout = () => {
    localStorage.clear();
    alert("Logged out successfully! 👋");
    navigate('/login');
  };

  const fetchUserData = async () => {
    try {
      const res = await axios.get('https://team-task-manager-production-fb15.up.railway.app/api/auth/me', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.data) setUserData(res.data);
    } catch (err) { if(err.response?.status === 401) handleLogout(); }
  };

  const fetchTasks = async () => {
    try {
      const res = await axios.get('https://team-task-manager-production-fb15.up.railway.app/api/tasks', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.data && Array.isArray(res.data)) setTasks(res.data);
    } catch (err) { console.error("Tasks fetch error", err); }
  };

  const fetchProjects = async () => {
    try {
      const res = await axios.get('https://team-task-manager-production-fb15.up.railway.app/api/projects', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.data && Array.isArray(res.data)) setProjects(res.data);
    } catch (err) { setProjects([{id: 1, name: 'Web Dev'}, {id: 2, name: 'Cloud App'}]); }
  };

  // ✅ ERROR FIX: Fixed date format to bypass 'due_date' error
  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!isPunchedIn) return alert("Pehle Punch-In karo! 🚧");
    
    // Using simple YYYY-MM-DD format which MySQL usually expects for Date fields
    const today = new Date().toISOString().split('T')[0]; 

    try {
      await axios.post('https://team-task-manager-production-fb15.up.railway.app/api/tasks', {
        title: newTask.title,
        description: newTask.description,
        project_id: newTask.project_id ? parseInt(newTask.project_id) : null,
        status: 'In Progress',
        // ✅ Mandatory fields required by your backend
        due_date: today,
        deadline: today 
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      setNewTask({ title: '', description: '', project_id: '' });
      alert("Task Created Successfully! 🚀");
      fetchTasks();
    } catch (err) { 
      console.error("Creation Error:", err.response?.data);
      alert("Error: " + (err.response?.data?.error || "Server Error")); 
    }
  };

  const toggleTaskStatus = (taskId) => {
    setTasks(prevTasks => prevTasks.map(t => t.id === taskId ? { ...t, status: t.status === 'In Progress' ? 'Completed' : 'In Progress' } : t));
  };

  const handlePunchToggle = () => {
    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (!isPunchedIn) {
      if (punchCount < 2) {
        setIsPunchedIn(true);
        setPunchInTime(currentTime);
        setPunchOutTime("-");
      } else {
        alert("Shift Ended! ❌");
      }
    } else {
      setIsPunchedIn(false);
      setPunchOutTime(currentTime);
      setPunchCount(prev => prev + 1);
      setAccumulatedSessionTime(prev => prev + seconds); 
      if (punchCount + 1 >= 2) setIsShiftOver(true);
    }
  };

  const handleLeaveSubmit = (e) => {
    e.preventDefault();
    const newRequest = { id: Date.now(), fromDate: leaveForm.fromDate, toDate: leaveForm.toDate, reason: leaveForm.reason, status: 'Pending' };
    setLeaveRequests([newRequest, ...leaveRequests]);
    setLeaveForm({ fromDate: '', toDate: '', reason: '' });
    setShowLeaveModal(false);
    alert("Leave request submitted! 📄");
  };

  const formatTime = (sec) => {
    const hrs = Math.floor(sec / 3600).toString().padStart(2, '0');
    const mins = Math.floor((sec % 3600) / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${hrs}:${mins}:${s}`;
  };

  const getProjectNameById = (projectId) => {
    if (!projectId) return "Independent Tasks / General";
    const project = projects.find(p => parseInt(p.id) === parseInt(projectId));
    return project ? project.name : "Independent Tasks / General";
  };

  const uniqueProjectIds = Array.isArray(tasks) ? [...new Set(tasks.map(t => t.project_id))] : [];

  return (
    <div style={styles.appContainer}>
      <div style={styles.sidebar}>
        <div style={styles.logoSection}><div style={styles.logoIcon}>TT</div><span style={styles.logoText}>Task Track</span></div>
        <div style={{...styles.userProfileSide, cursor: 'pointer'}} onClick={() => setActiveTab('dashboard')}>
          <div style={styles.avatarLarge}>{userData.fullName ? userData.fullName.charAt(0).toUpperCase() : 'P'}V</div>
          <div>
            <div style={styles.userNameSide}>{userData.fullName || userData.username}</div>
            <div style={styles.userRoleBadge}>{userData.role || 'Member'}</div>
          </div>
        </div>
        <nav style={styles.navLinks}>
          <div style={{...styles.navItem, ...(activeTab === 'dashboard' ? styles.navActive : {})}} onClick={() => setActiveTab('dashboard')}>📊 Dashboard</div>
          <div style={{...styles.navItem, ...(activeTab === 'tasks' ? styles.navActive : {})}} onClick={() => setActiveTab('tasks')}>✅ My Tasks</div>
          <div style={{...styles.navItem, ...(activeTab === 'projects' ? styles.navActive : {})}} onClick={() => setActiveTab('projects')}>📂 My Projects</div>
          <div style={{...styles.navItem, ...(activeTab === 'attendance' ? styles.navActive : {})}} onClick={() => setActiveTab('attendance')}>📅 Attendance</div>
          <div style={{...styles.navItem, ...(activeTab === 'leave' ? styles.navActive : {})}} onClick={() => setActiveTab('leave')}>📄 Apply Leave</div>
        </nav>
        <div style={{position: 'relative', marginTop: 'auto', marginBottom: '10px'}}>
          <div style={styles.settingsTrigger} onClick={() => setShowSettingsMenu(!showSettingsMenu)}>⚙️ Setting <span style={{marginLeft: 'auto'}}>{showSettingsMenu ? '▼' : '▲'}</span></div>
          {showSettingsMenu && (
            <div style={styles.dropdownWhite}>
              <div style={styles.dropdownItem} onClick={handleLogout}>Settings → Logout</div>
              <div style={styles.dropdownItem}>Theme → {currentTheme}</div>
            </div>
          )}
        </div>
        <div style={styles.signOutPos} onClick={handleLogout}><div style={{...styles.navItem, color: '#ef4444'}}>↪ Sign Out</div></div>
      </div>

      <div style={styles.mainWrapper}>
        <header style={styles.topHeader}>
          <div style={styles.headerRight}>
            <div style={{position: 'relative'}}>
              <span style={{fontSize: '22px', cursor: 'pointer', display: 'inline-block', padding: '5px'}} onClick={() => { setShowNotificationDropdown(!showNotificationDropdown); setShowHeaderDropdown(false); }}>🔔</span>
              {showNotificationDropdown && (
                <div style={styles.notificationWhite}>
                  <div style={styles.notificationHeaderFlex}><span style={{fontWeight: 'bold'}}>Notifications</span><span>0 alerts</span></div>
                  <div style={styles.notificationBodyEmpty}><p>No new notifications</p></div>
                </div>
              )}
            </div>
            <div style={{position: 'relative'}}>
              <div style={{...styles.headerUser, cursor: 'pointer'}} onClick={() => { setShowHeaderDropdown(!showHeaderDropdown); setShowNotificationDropdown(false); }}>
                <div style={styles.avatarSmall}>{userData.username ? userData.username.charAt(0).toUpperCase() : 'P'}</div>
                <span style={{fontSize: '18px'}}>{userData.fullName || userData.username} ⌵</span>
              </div>
              {showHeaderDropdown && (
                <div style={styles.headerDropdownWhite}>
                  <div style={styles.headerDropdownItem} onClick={handleLogout}>↪ Log Out</div>
                </div>
              )}
            </div>
          </div>
        </header>

        <div style={styles.contentArea}>
          {activeTab === 'dashboard' && (
            <>
              <h1 style={styles.pageTitle}>My Dashboard</h1>
              <p style={styles.subText}>Welcome back, {userData.fullName || userData.username}</p>
              
              <div style={styles.timerCard}>
                <div style={styles.timerGrid}>
                  <div style={styles.timerDisplay}><div style={styles.timerLabel}>READY TO START</div><div style={styles.timerValue}>{formatTime(seconds)}</div></div>
                  <div style={styles.punchInfoBox}><span style={{color: '#00e676'}}>→] PUNCH IN</span><div style={styles.punchTimeText}>{punchInTime}</div></div>
                  <div style={styles.punchInfoBox}><span style={{color: '#ef4444'}}>[→ PUNCH OUT</span><div style={styles.punchTimeText}>{punchOutTime}</div></div>
                  <div style={styles.punchAction}>
                    <button onClick={handlePunchToggle} disabled={isShiftOver} style={{...styles.punchBtn, background: isShiftOver ? '#333' : (isPunchedIn ? '#ef4444' : '#00e676')}}>{isPunchedIn ? '⏹ Punch Out' : '▶ Punch In'}</button>
                  </div>
                </div>
              </div>

              <div style={styles.statsRow}>
                <div style={styles.statCard}><div style={styles.statLabel}>TASKS COMPLETED</div><div style={styles.statValue}>{tasks.filter(t => t.status === 'Completed').length}</div></div>
                <div style={styles.statCard}><div style={styles.statLabel}>TOTAL TIME</div><div style={styles.statValue}>{Math.floor(accumulatedSessionTime / 60)}m</div></div>
                <div style={styles.statCard}><div style={styles.statLabel}>PUNCH COUNT</div><div style={styles.statValue}>{punchCount}/2</div></div>
              </div>

              <div style={styles.bottomGrid}>
                <div style={styles.taskFormCard}>
                  <h3 style={{marginBottom: '20px', fontSize: '20px', color: '#fff'}}>Quick Task Create</h3>
                  <form onSubmit={handleCreateTask} style={styles.formStack}>
                    <input style={styles.inputFieldFixed} placeholder="Task Title *" value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} required />
                    <select style={styles.inputFieldFixed} value={newTask.project_id} onChange={e => setNewTask({...newTask, project_id: e.target.value})}>
                      <option value="" style={{color:'#000'}}>Select Project</option>
                      {projects.map(p => <option key={p.id} value={p.id} style={{color:'#000'}}>{p.name}</option>)}
                    </select>
                    <textarea style={{...styles.inputFieldFixed, height: '100px', resize: 'none'}} placeholder="Task Description" value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})} />
                    <button type="submit" style={styles.createBtn} disabled={!isPunchedIn}>Create Task</button>
                  </form>
                </div>
                <div style={styles.recentTasksCard}>
                  <h3 style={{marginBottom: '20px', fontSize: '20px', color: '#fff'}}>Recent Tasks</h3>
                  <div style={styles.taskList}>
                    {tasks.slice(0, 4).map(task => (
                        <div key={task.id} style={styles.taskItem}>
                          <div><div style={{fontWeight: 'bold', color: '#fff'}}>{task.title}</div><div style={{fontSize: '14px', color: '#888'}}>{task.description || 'No description'}</div></div>
                          <div onClick={() => toggleTaskStatus(task.id)} style={{...styles.statusBadge, background: task.status === 'Completed' ? '#00e676' : '#f59e0b'}}>{task.status}</div>
                        </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'tasks' && (
            <div style={styles.viewPanel}>
              <h1 style={styles.pageTitle}>All Tasks</h1>
              {uniqueProjectIds.map(projId => {
                const filtered = tasks.filter(t => t.project_id === projId);
                return (
                  <div key={projId} style={styles.customTableWrapper}>
                    <div style={styles.projectHeaderBanner}>📁 {getProjectNameById(projId)} ({filtered.length})</div>
                    <table style={styles.customTableStructure}>
                      <thead><tr><th style={styles.thCell}>TASK ID</th><th style={styles.thCell}>DATE</th><th style={styles.thCell}>STATUS</th></tr></thead>
                      <tbody>
                        {filtered.map(t => (
                          <tr key={t.id} style={styles.trRowTable}>
                            <td style={styles.tdCell}>{891360 + t.id}</td>
                            <td style={styles.tdCell}>{new Date().toLocaleDateString()}</td>
                            <td style={styles.tdCell}><span style={{...styles.tableStatusBadge, color: t.status === 'Completed' ? '#00e676' : '#f59e0b'}}>{t.status}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'attendance' && (
            <div style={styles.viewPanel}>
              <h1 style={styles.pageTitle}>Attendance Records</h1>
              <table style={styles.customTableStructure}>
                <thead><tr><th style={styles.thCell}>DATE</th><th style={styles.thCell}>STATUS</th><th style={styles.thCell}>TIME SPENT</th></tr></thead>
                <tbody>
                  <tr style={styles.trRowTable}>
                    <td style={styles.tdCell}>{new Date().toLocaleDateString()}</td>
                    <td style={styles.tdCell}>
                      <span style={{...styles.tableStatusBadge, color: accumulatedSessionTime >= 25200 ? '#00e676' : '#ef4444'}}>
                        {accumulatedSessionTime >= 25200 ? 'PRESENT' : 'ABSENT'}
                      </span>
                    </td>
                    <td style={styles.tdCell}>{formatTime(accumulatedSessionTime)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'leave' && (
            <div style={styles.viewPanel}>
              <div style={styles.headerRowFlex}><h1 style={styles.pageTitle}>Leave Management</h1><button style={styles.applyLeaveTriggerBtn} onClick={() => setShowLeaveModal(true)}>+ Apply Leave</button></div>
              <div style={styles.taskListContainer}>
                {leaveRequests.length === 0 ? <p style={{textAlign:'center', color:'#888'}}>No leave requests found.</p> : 
                  leaveRequests.map(req => (<div key={req.id} style={styles.taskItemLarge}><div><strong>{req.reason}</strong><p>{req.fromDate} to {req.toDate}</p></div><span>{req.status}</span></div>))}
              </div>
            </div>
          )}
        </div>
      </div>

      {showLeaveModal && (
        <div style={styles.modalOverlayContext}>
          <div style={styles.modalContentCard}>
            <div style={styles.modalHeaderFlex}><h3>Apply for Leave</h3><span style={{cursor:'pointer'}} onClick={()=>setShowLeaveModal(false)}>✕</span></div>
            <form onSubmit={handleLeaveSubmit} style={styles.formStack}>
              <div style={styles.inputStackField}><label style={styles.modalLabelText}>From Date</label><input type="date" style={styles.inputFieldModal} value={leaveForm.fromDate} onChange={e=>setLeaveForm({...leaveForm, fromDate:e.target.value})} required /></div>
              <div style={styles.inputStackField}><label style={styles.modalLabelText}>To Date</label><input type="date" style={styles.inputFieldModal} value={leaveForm.toDate} onChange={e=>setLeaveForm({...leaveForm, toDate:e.target.value})} required /></div>
              <div style={styles.inputStackField}><label style={styles.modalLabelText}>Reason</label><textarea style={{...styles.inputFieldModal, height:'100px'}} value={leaveForm.reason} onChange={e=>setLeaveForm({...leaveForm, reason:e.target.value})} required /></div>
              <div style={styles.modalActionRowEnd}><button type="button" onClick={()=>setShowLeaveModal(false)}>Cancel</button><button type="submit" style={styles.modalSubmitBtn}>Submit Request</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
    appContainer: { display: 'flex', height: '100vh', background: '#000', color: 'white', fontFamily: 'sans-serif', overflow: 'hidden' },
    sidebar: { width: '280px', background: '#0a0a0a', display: 'flex', flexDirection: 'column', padding: '25px', borderRight: '1px solid #1a1a1a' },
    logoSection: { display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '50px' },
    logoIcon: { background: '#00bcd4', padding: '10px', borderRadius: '10px', fontWeight: 'bold', color: 'black' },
    logoText: { fontSize: '24px', fontWeight: 'bold' },
    userProfileSide: { display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '40px' },
    avatarLarge: { width: '60px', height: '60px', borderRadius: '50%', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00bcd4', fontWeight: 'bold' },
    userNameSide: { fontWeight: '600', fontSize: '18px' },
    userRoleBadge: { background: '#1e293b', fontSize: '12px', padding: '4px 8px', borderRadius: '4px', color: '#888' },
    navLinks: { flex: 1 },
    navItem: { padding: '15px 20px', borderRadius: '8px', color: '#94a3b8', cursor: 'pointer', marginBottom: '10px', transition: '0.2s', fontSize: '17px' },
    navActive: { background: 'rgba(0, 188, 212, 0.1)', color: '#00bcd4' },
    signOutPos: { borderTop: '1px solid #1e293b', paddingTop: '15px' },
    
    dropdownWhite: { position: 'absolute', bottom: '60px', left: '0', width: '100%', background: '#FFFFFF', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.5)', zIndex: 1000 },
    headerDropdownWhite: { position: 'absolute', top: '55px', right: '0', width: '160px', background: '#FFFFFF', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.5)', zIndex: 1000, padding: '4px 0' },
    notificationWhite: { position: 'absolute', top: '40px', right: '-20px', width: '320px', background: '#FFFFFF', borderRadius: '16px', boxShadow: '0px 12px 30px rgba(0,0,0,0.6)', zIndex: 2000, overflow: 'hidden', color: '#333' },
    dropdownItem: { padding: '12px 20px', color: '#333', cursor: 'pointer', borderBottom: '1px solid #eee' },
    headerDropdownItem: { padding: '12px 20px', color: '#ef4444', fontWeight: 'bold', cursor: 'pointer' },
    notificationHeaderFlex: { display: 'flex', justifyContent: 'space-between', padding: '15px 20px', background: '#F8F9FA', borderBottom: '1px solid #EEE' },
    notificationBodyEmpty: { padding: '35px 20px', textAlign: 'center', color: '#666' },

    settingsTrigger: { padding: '15px 20px', background: '#1e293b', borderRadius: '8px', cursor: 'pointer', display: 'flex', fontWeight: 'bold' },
    mainWrapper: { flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', background: '#000' },
    topHeader: { height: '80px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', padding: '0 50px', borderBottom: '1px solid #1a1a1a' },
    headerRight: { display: 'flex', gap: '30px', alignItems: 'center' },
    headerUser: { display: 'flex', alignItems: 'center', gap: '12px' },
    avatarSmall: { width: '40px', height: '40px', borderRadius: '50%', background: '#00bcd4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'black', fontWeight: 'bold' },
    
    contentArea: { padding: '40px 50px 50px' },
    pageTitle: { fontSize: '36px', fontWeight: 'bold', margin: 0 },
    subText: { color: '#64748b', fontSize: '18px', marginBottom: '40px' },
    punchAlert: { background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.3)', color: '#f59e0b', padding: '15px 25px', borderRadius: '12px', marginBottom: '30px', fontSize: '17px' },
    timerCard: { background: '#0a0a0a', borderRadius: '20px', padding: '35px', border: '1px solid #1a1a1a', marginBottom: '30px' },
    timerGrid: { display: 'grid', gridTemplateColumns: '1.2fr 0.8fr 0.8fr 1fr', alignItems: 'center' },
    timerValue: { fontSize: '56px', fontWeight: 'bold' },
    timerLabel: { color: '#8a94a6', fontSize: '14px' },
    punchInfoBox: { borderLeft: '1px solid #1a1a1a', paddingLeft: '25px' },
    punchTimeText: { fontSize: '28px', fontWeight: 'bold' },
    punchBtn: { border: 'none', padding: '15px 35px', borderRadius: '10px', color: 'white', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px' },
    timerFooter: { display: 'flex', gap: '60px', paddingTop: '25px', color:'#888' },
    
    statsRow: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '25px', marginBottom: '30px' },
    statCard: { background: '#0a0a0a', padding: '30px', borderRadius: '20px', border: '1px solid #1a1a1a' },
    statLabel: { color: '#8a94a6', fontSize: '14px' },
    statValue: { fontSize: '42px', fontWeight: 'bold', marginTop: '12px' },
    
    bottomGrid: { display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '30px' },
    taskFormCard: { background: '#0a0a0a', padding: '30px', borderRadius: '20px', border: '1px solid #1a1a1a' },
    recentTasksCard: { background: '#0a0a0a', padding: '30px', borderRadius: '20px', border: '1px solid #1a1a1a' },
    formStack: { display: 'flex', flexDirection: 'column', gap: '15px' },
    inputFieldFixed: { background: '#151921', border: '1px solid #2d3748', borderRadius: '10px', color: '#fff', padding: '15px', fontSize: '16px', outline:'none' },
    createBtn: { background: '#00bcd4', border: 'none', padding: '15px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', color: 'black', fontSize: '17px' },
    taskItem: { background: '#000', padding: '15px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #1a1a1a' },
    statusBadge: { padding: '6px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', color: 'black' },

    customTableWrapper: { background: '#0a0a0a', borderRadius: '16px', border: '1px solid #1a1a1a', overflow: 'hidden', marginBottom: '30px' },
    projectHeaderBanner: { background: '#1e293b', padding: '15px 25px', fontWeight: 'bold' },
    customTableStructure: { width: '100%', borderCollapse: 'collapse' },
    thCell: { padding: '15px', background: '#0f172a', color: '#888', textAlign: 'left' },
    tdCell: { padding: '15px', borderBottom: '1px solid #1a1a1a' },
    modalOverlayContext: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000 },
    modalContentCard: { background: '#0a0a0a', padding: '30px', borderRadius: '24px', border: '1px solid #1a1a1a', width: '500px' },
    modalHeaderFlex: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom:'20px' },
    inputStackField: { display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '15px' },
    modalLabelText: { fontSize: '12px', color: '#888', fontWeight:'bold' },
    inputFieldModal: { background: '#151921', border: '1px solid #2d3748', borderRadius: '8px', color: '#fff', padding: '12px' },
    modalSubmitBtn: { background: '#00bcd4', color:'black', padding: '12px', borderRadius: '8px', border:'none', fontWeight:'bold', cursor:'pointer' },
    modalActionRowEnd: { display: 'flex', justifyContent: 'flex-end', gap: '15px' },
    applyLeaveTriggerBtn: { background: '#00bcd4', color: 'black', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', cursor:'pointer' },
    headerRowFlex: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom:'20px' },
    viewPanel: { animation: 'fadeIn 0.25s ease-in-out' }
};

export default Dashboard;