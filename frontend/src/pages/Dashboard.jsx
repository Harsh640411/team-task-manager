import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Dashboard = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState({ fullName: 'Loading...', role: 'Member', username: localStorage.getItem('username') || '' });
  const [projects, setProjects] = useState([]);
  const [newTask, setNewTask] = useState({ title: '', description: '', project_id: '' });
  
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [cooldownTime, setCooldownTime] = useState(0);
  const [currentCreatedTaskId, setCurrentCreatedTaskId] = useState(null);

  const [activeTab, setActiveTab] = useState('dashboard'); 
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showHeaderDropdown, setShowHeaderDropdown] = useState(false);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveRequests, setLeaveRequests] = useState([]); 
  const [leaveForm, setLeaveForm] = useState({ fromDate: '', toDate: '', reason: '' });

  const [expandedDates, setExpandedDates] = useState({});
  const [expandedInnerProjects, setExpandedInnerProjects] = useState({});

  // LOCAL SCOPE USER DETERMINATION
  const activeUserSessionEmail = localStorage.getItem('username') || 'global_tasker';

  // ATTENDANCE DRIVER STATES WITH LOCALSTORAGE ISOLATION
  const [isPunchedIn, setIsPunchedIn] = useState(() => localStorage.getItem(`praphool_isPunchedIn_${activeUserSessionEmail}`) === 'true');
  const [seconds, setSeconds] = useState(() => parseInt(localStorage.getItem(`praphool_timer_seconds_${activeUserSessionEmail}`)) || 0);
  const [punchInTime, setPunchInTime] = useState(() => localStorage.getItem(`praphool_punchInTime_${activeUserSessionEmail}`) || "-");
  const [punchOutTime, setPunchOutTime] = useState(() => localStorage.getItem(`praphool_punchOutTime_${activeUserSessionEmail}`) || "-");
  const [punchCount, setPunchCount] = useState(() => parseInt(localStorage.getItem(`praphool_punchCount_${activeUserSessionEmail}`)) || 0);
  const [isShiftOver, setIsShiftOver] = useState(() => localStorage.getItem(`praphool_isShiftOver_${activeUserSessionEmail}`) === 'true');
  const [accumulatedSessionTime, setAccumulatedSessionTime] = useState(() => parseInt(localStorage.getItem(`praphool_accumulatedSessionTime_${activeUserSessionEmail}`)) || 0);

  // MASTER DATA DATA RESERVOIR STATE
  const [tasks, setTasks] = useState(() => {
    const userKey = localStorage.getItem('username') || 'global_tasker';
    const savedLocalTasks = localStorage.getItem(`praphool_tasks_backup_${userKey}`);
    return savedLocalTasks ? JSON.parse(savedLocalTasks) : [];
  });

  // DAILY 8:00 AM AUTO-RESET CHECK LOGIC
  const checkAndResetDailyShift = (userEmail) => {
    if (!userEmail) return;
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const lastResetDate = localStorage.getItem(`praphool_last_reset_date_${userEmail}`);
    const resetTimeToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 0, 0);

    if (lastResetDate !== todayStr && now >= resetTimeToday) {
      localStorage.removeItem(`praphool_isPunchedIn_${userEmail}`);
      localStorage.removeItem(`praphool_punchInTime_${userEmail}`);
      localStorage.removeItem(`praphool_punchOutTime_${userEmail}`);
      localStorage.setItem(`praphool_punchCount_${userEmail}`, '0');
      localStorage.setItem(`praphool_isShiftOver_${userEmail}`, 'false');
      localStorage.setItem(`praphool_accumulatedSessionTime_${userEmail}`, '0');
      localStorage.setItem(`praphool_timer_seconds_${userEmail}`, '0');
      localStorage.setItem(`praphool_last_reset_date_${userEmail}`, todayStr);

      setIsPunchedIn(false);
      setSeconds(0);
      setPunchInTime("-");
      setPunchOutTime("-");
      setPunchCount(0);
      setIsShiftOver(false);
      setAccumulatedSessionTime(0);
    }
  };

  // ATTENDANCE EFFECT WRITER
  useEffect(() => {
    localStorage.setItem(`praphool_isPunchedIn_${activeUserSessionEmail}`, isPunchedIn);
    localStorage.setItem(`praphool_timer_seconds_${activeUserSessionEmail}`, seconds);
    localStorage.setItem(`praphool_punchInTime_${activeUserSessionEmail}`, punchInTime);
    localStorage.setItem(`praphool_punchOutTime_${activeUserSessionEmail}`, punchOutTime);
    localStorage.setItem(`praphool_punchCount_${activeUserSessionEmail}`, punchCount);
    localStorage.setItem(`praphool_isShiftOver_${activeUserSessionEmail}`, isShiftOver);
    localStorage.setItem(`praphool_accumulatedSessionTime_${activeUserSessionEmail}`, accumulatedSessionTime);
  }, [isPunchedIn, seconds, punchInTime, punchOutTime, punchCount, isShiftOver, accumulatedSessionTime, activeUserSessionEmail]);

  // SYNC TASK TO LOCALSTORAGE
  useEffect(() => {
    if (tasks) {
      localStorage.setItem(`praphool_tasks_backup_${activeUserSessionEmail}`, JSON.stringify(tasks));
    }
  }, [tasks, activeUserSessionEmail]);

  // GLOBAL CLICK DISMISSAL
  useEffect(() => {
    const handleGlobalClickDismissal = (event) => {
      if (!event.target.closest('#praphool-header-avatar') && !event.target.closest('#praphool-notification-trigger')) {
        showHeaderDropdown(false);
        setShowNotificationDropdown(false);
      }
      if (!event.target.closest('#praphool_sidebar_settings_trigger')) {
        setShowSettingsMenu(false);
      }
    };
    document.addEventListener('click', handleGlobalClickDismissal);
    return () => document.removeEventListener('click', handleGlobalClickDismissal);
  }, []);

  useEffect(() => {
    document.body.style.backgroundColor = '#000000';
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    
    const styleSheet = document.createElement("style");
    styleSheet.innerText = `
      ::-webkit-scrollbar { width: 8px; height: 8px; }
      ::-webkit-scrollbar-track { background: #000000; }
      ::-webkit-scrollbar-thumb { background: #111111; border-radius: 4px; border: 1px solid #000000; }
      ::-webkit-scrollbar-thumb:hover { background: #1a1a1a; }
      html, body { background-color: #000000 !important; color-scheme: dark; overflow: hidden; }
    `;
    document.head.appendChild(styleSheet);
    
    const token = localStorage.getItem('token');
    if (!token) navigate('/login');
    
    checkAndResetDailyShift(activeUserSessionEmail);
    fetchUserData();
    fetchProjects();
    fetchTasks();
    fetchMyLeaveStatus();

    const resetTimer = setInterval(() => { checkAndResetDailyShift(activeUserSessionEmail); }, 60000); 
    return () => {
      clearInterval(resetTimer);
      document.head.removeChild(styleSheet);
    };
  }, [activeUserSessionEmail, activeTab]);

  useEffect(() => {
    let interval = null;
    if (isPunchedIn) {
      interval = setInterval(() => { setSeconds(prev => prev + 1); }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isPunchedIn]);

  useEffect(() => {
    let timer = null;
    if (isButtonDisabled && cooldownTime > 0) {
      timer = setInterval(() => { setCooldownTime(prev => prev - 1); }, 1000);
    } else if (cooldownTime === 0) setIsButtonDisabled(false);
    return () => clearInterval(timer);
  }, [isButtonDisabled, cooldownTime]);

  const handleLogout = () => {
    localStorage.removeItem('token'); 
    alert("Logged out successfully! 👋");
    navigate('/login');
  };

  const fetchUserData = async () => {
    try {
      const res = await axios.get('https://team-task-manager-production-fb15.up.railway.app/api/auth/me', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.data) {
        setUserData(res.data);
        if (res.data.username) localStorage.setItem('username', res.data.username);
      }
    } catch (err) { if(err.response?.status === 401) handleLogout(); }
  };

  const fetchMyLeaveStatus = async () => {
    try {
      const res = await axios.get('https://team-task-manager-production-fb15.up.railway.app/api/auth/leaves/my-leaves', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.data && Array.isArray(res.data)) setLeaveRequests(res.data);
    } catch (err) { console.error(err); }
  };

  // ✅ ANTIDOTE MERGE LOGIC: Server data and local data combined dynamically to prevent any type of dropouts
  const fetchTasks = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await axios.get('https://team-task-manager-production-fb15.up.railway.app/api/tasks', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data && Array.isArray(res.data)) {
        const serverData = res.data;
        const localTasks = JSON.parse(localStorage.getItem(`praphool_tasks_backup_${activeUserSessionEmail}`) || '[]');
        
        // Filter out items that are present locally but missing or unindexed on backend rows
        const uniqueLocals = localTasks.filter(lt => !serverData.some(st => String(st.id) === String(lt.id)));
        
        // Merge both tracks together securely
        const finalMerged = [...uniqueLocals, ...serverData].sort((a, b) => b.id - a.id);
        
        setTasks(finalMerged);
        localStorage.setItem(`praphool_tasks_backup_${activeUserSessionEmail}`, JSON.stringify(finalMerged));
      }
    } catch (err) { console.error(err); }
  };

  const fetchProjects = async () => {
    try {
      const res = await axios.get('https://team-task-manager-production-fb15.up.railway.app/api/projects', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.data && res.data.length > 0) setProjects(res.data);
      else setDefaultProjects();
    } catch (err) { setDefaultProjects(); }
  };

  const setDefaultProjects = () => {
    setProjects([
      {id: 1, name: 'GEO Sentiment Analyzer'}, 
      {id: 2, name: 'Face Recognition Attendance System'}, 
      {id: 3, name: 'Portfolio Website Showcase'}
    ]);
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!isPunchedIn) return alert("Pehle Punch-In karo! 🚧");
    if (isButtonDisabled) return;

    const today = new Date().toISOString().split('T')[0];
    const selectedProjId = newTask.project_id ? parseInt(newTask.project_id) : parseInt(projects[0]?.id || 1);

    const temporaryId = Date.now();
    const immediateTaskObject = {
      id: temporaryId,
      title: newTask.title,
      description: newTask.description,
      project_id: selectedProjId,
      status: 'In Progress',
      timestamp: Date.now(), 
      created_date: today,
      username: activeUserSessionEmail
    };

    const nextTaskList = [immediateTaskObject, ...tasks];
    setTasks(nextTaskList);
    localStorage.setItem(`praphool_tasks_backup_${activeUserSessionEmail}`, JSON.stringify(nextTaskList));
    
    setCurrentCreatedTaskId(temporaryId);
    setNewTask({ title: '', description: '', project_id: '' });
    
    setIsButtonDisabled(true);
    setCooldownTime(120);

    try {
      const res = await axios.post('https://team-task-manager-production-fb15.up.railway.app/api/tasks', {
        title: immediateTaskObject.title,
        description: immediateTaskObject.description,
        project_id: selectedProjId, 
        status: 'In Progress',
        due_date: today 
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.data && res.data.id) {
        setCurrentCreatedTaskId(res.data.id);
        // Swap IDs locally inside active arrays instantly
        setTasks(prev => prev.map(t => t.id === temporaryId ? { ...t, id: res.data.id } : t));
      }
      fetchTasks(); 
    } catch (error) { console.log(error); }
  };

  // ✅ FOOLPROOF SUBMIT LOGIC: Scans list arrays dynamically, flags status, and commits updates safely
  const handleSubmitTask = async () => {
    let targetTask = tasks.find(t => String(t.id) === String(currentCreatedTaskId));
    if (!targetTask) {
      targetTask = tasks.find(t => t.status === 'In Progress');
    }
    
    if (!targetTask) {
      return alert("Pehle koi active task create kijiye!");
    }
    
    const targetId = targetTask.id;

    try {
      // Direct optimistic update local state to preserve visuals immediately
      markAsComplete(targetId);

      await axios.put(`https://team-task-manager-production-fb15.up.railway.app/api/tasks/${targetId}`, {
        status: 'Completed'
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      alert("Task permanently submitted as Completed! ✅");
      setCurrentCreatedTaskId(null); 
      
      // Delay pull to let remote database indexes compile completely
      setTimeout(() => { fetchTasks(); }, 1500);
    } catch (err) {
      markAsComplete(targetId);
      alert("Task submitted locally! ✅");
      setCurrentCreatedTaskId(null);
      setTimeout(() => { fetchTasks(); }, 1500);
    }
  };

  const markAsComplete = (taskId) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const freshTasks = tasks.map(t => {
      if (String(t.id) === String(taskId) || t.status === 'In Progress') {
        return { 
          ...t, 
          status: 'Completed', 
          created_date: todayStr, 
          timestamp: Date.now() 
        };
      }
      return t;
    });
    setTasks(freshTasks);
    localStorage.setItem(`praphool_tasks_backup_${activeUserSessionEmail}`, JSON.stringify(freshTasks));
  };

  const handlePunchToggle = () => {
    if (isShiftOver) return alert("Shift Ended! Aapko agle din subah 8:00 AM tak ka wait karna padega. ❌");
    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (!isPunchedIn) {
      if (punchCount < 2) {
        setIsPunchedIn(true); setPunchInTime(currentTime); setPunchOutTime("-"); setSeconds(0); 
      } else { setIsShiftOver(true); alert("Shift Ended! Lock active till 8:00 AM next morning. ❌"); }
    } else {
      const currentCount = punchCount + 1;
      setIsPunchedIn(false); setPunchOutTime(currentTime); setPunchCount(currentCount);
      setAccumulatedSessionTime(prev => prev + seconds); 
      setSeconds(0); 
      localStorage.setItem(`praphool_timer_seconds_${activeUserSessionEmail}`, '0');
      if (currentCount >= 2) {
        setIsShiftOver(true); alert("Shift Completed permanently! All options are now locked till tomorrow 8:00 AM. 🔒");
      }
    }
  };

  const handleLeaveSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('https://team-task-manager-production-fb15.up.railway.app/api/auth/leaves/apply', {
        fromDate: leaveForm.fromDate, toDate: leaveForm.toDate, reason: leaveForm.reason
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      alert("Leave request submitted directly to Admin database! 📄");
      setLeaveForm({ fromDate: '', toDate: '', reason: '' });
      setShowLeaveModal(false);
      fetchMyLeaveStatus(); 
    } catch (err) { alert("Leave submission failed."); }
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

  const toggleDateAccordion = (dateStr) => { setExpandedDates(prev => ({ ...prev, [dateStr]: !prev[dateStr] })); };
  const toggleProjectAccordion = (dateStr, projId) => { setExpandedInnerProjects(prev => ({ ...prev, [`${dateStr}_${projId}`]: !prev[`${dateStr}_${projId}`] })); };

  const getDateLabel = (dateStr) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    if (dateStr === todayStr) return "Today";
    if (dateStr === yesterdayStr) return "Yesterday";
    return dateStr; 
  };

  const recentTasksFiltered = tasks.filter(task => {
    if (!task.timestamp) return true; 
    const oneDayInMs = 24 * 60 * 60 * 1000;
    return (Date.now() - task.timestamp) < oneDayInMs;
  });

  const tasksByDate = tasks.reduce((groups, task) => {
    const dStr = task.created_date || new Date().toISOString().split('T')[0];
    if (!groups[dStr]) groups[dStr] = [];
    groups[dStr].push(task);
    return groups;
  }, {});

  const orderedUniqueDates = Object.keys(tasksByDate).sort((a, b) => new Date(b) - new Date(a));
  const triggerNotificationDropdown = (e) => { e.stopPropagation(); setShowNotificationDropdown(!showNotificationDropdown); setShowHeaderDropdown(false); };
  const triggerHeaderDropdown = (e) => { e.stopPropagation(); setShowHeaderDropdown(!showHeaderDropdown); setShowNotificationDropdown(false); };
  const triggerSidebarSettingsMenu = (e) => { e.stopPropagation(); setShowSettingsMenu(!showSettingsMenu); };

  return (
    <div style={styles.appContainer}>
      <div style={styles.sidebar}>
        <div style={styles.logoSection}><div style={styles.logoIcon}>TT</div><span style={styles.logoText}>Task Track</span></div>
        <div style={{...styles.userProfileSide, cursor: 'pointer'}} onClick={() => setActiveTab('dashboard')}>
          <div style={styles.avatarLarge}>{activeUserSessionEmail ? activeUserSessionEmail.charAt(0).toUpperCase() : 'P'}V</div>
          <div>
            <div style={styles.userNameSide}>{activeUserSessionEmail}</div>
            <div style={styles.userRoleBadge}>{userData?.role || 'Member'}</div>
          </div>
        </div>
        <nav style={styles.navLinks}>
          <div style={{...styles.navItem, ...(activeTab === 'dashboard' ? styles.navActive : {})}} onClick={() => setActiveTab('dashboard')}>📊 Dashboard</div>
          <div style={{...styles.navItem, ...(activeTab === 'tasks' ? styles.navActive : {})}} onClick={() => setActiveTab('tasks')}>✅ My Tasks</div>
          <div style={{...styles.navItem, ...(activeTab === 'attendance' ? styles.navActive : {})}} onClick={() => setActiveTab('attendance')}>📅 Attendance</div>
          <div style={{...styles.navItem, ...(activeTab === 'leave' ? styles.navActive : {})}} onClick={() => setActiveTab('leave')}>📄 Apply Leave</div>
        </nav>
        
        <div id="praphool_sidebar_settings_trigger" style={{position: 'relative', marginTop: 'auto', marginBottom: '10px'}} onClick={triggerSidebarSettingsMenu}>
          <div style={styles.settingsTrigger}>⚙️ Setting <span style={{marginLeft: 'auto'}}>{showSettingsMenu ? '▼' : '▲'}</span></div>
          {showSettingsMenu && (
            <div style={styles.dropdownWhite}><div style={styles.dropdownItem} onClick={handleLogout}>Settings → Logout</div></div>
          )}
        </div>
        <div style={styles.signOutPos} onClick={handleLogout}><div style={{...styles.navItem, color: '#ef4444'}}>↪ Sign Out</div></div>
      </div>

      <div style={styles.mainWrapper}>
        <header style={styles.topHeader}>
          <div style={styles.headerRight}>
             <div id="praphool-notification-trigger" style={{position: 'relative'}}>
              <span style={{fontSize: '22px', cursor: 'pointer', display: 'inline-block', padding: '5px'} } onClick={triggerNotificationDropdown}>🔔</span>
              {showNotificationDropdown && (
                <div style={styles.notificationWhite}>
                  <div style={styles.notificationHeaderFlex}><span style={{fontWeight: 'bold'}}>Notifications</span><span>0 alerts</span></div>
                  <div style={styles.notificationBodyEmpty}><p>No new notifications</p></div>
                </div>
              )}
            </div>
            
            <div id="praphool-header-avatar" style={{position: 'relative'}}>
              <div style={styles.professionalAvatarWrapper} onClick={triggerHeaderDropdown}>
                <div style={styles.avatarSmallProfessional}>
                  {activeUserSessionEmail ? activeUserSessionEmail.charAt(0).toUpperCase() : 'P'}
                </div>
                <span style={styles.professionalEmailText}>
                  {activeUserSessionEmail}
                </span>
                <span style={styles.dropdownArrowSymbol}>▼</span>
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
              <p style={styles.subText}>Welcome back, {activeUserSessionEmail}</p>
              
              <div style={styles.timerCard}>
                <div style={styles.timerGrid}>
                  <div style={styles.timerDisplay}>
                    <div style={styles.timerLabel}>{isShiftOver ? '❌ SHIFT LOCKOUT ACTIVE' : 'READY TO START'}</div>
                    <div style={styles.timerValue}>{formatTime(isPunchedIn ? (accumulatedSessionTime + seconds) : accumulatedSessionTime)}</div>
                  </div>
                  <div style={styles.punchInfoBox}><span style={{color: '#00e676'}}>→] SIGN IN</span><div style={styles.punchTimeText}>{punchInTime}</div></div>
                  <div style={styles.punchInfoBox}><span style={{color: '#ef4444'}}>[→ SIGN OUT</span><div style={styles.punchTimeText}>{punchOutTime}</div></div>
                  <div style={styles.punchAction}>
                    <button 
                      onClick={handlePunchToggle} 
                      disabled={isShiftOver} 
                      style={{
                        ...styles.punchBtn, 
                        background: isShiftOver ? '#2d1a1d' : (isPunchedIn ? '#ef4444' : '#00e676'),
                        color: isShiftOver ? '#64748b' : '#fff',
                        cursor: isShiftOver ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {isShiftOver ? '🔒 Locked till 8AM' : (isPunchedIn ? '⏹ SIGN Out' : '▶ SIGN In')}
                    </button>
                  </div>
                </div>
              </div>

              <div style={styles.stylesStatsMetricsRowGrid}>
                <div style={styles.statCard}><div style={styles.statLabel}>TASKS IN PROGRESS</div><div style={styles.statValue}>{tasks.filter(t => t.status !== 'Completed').length}</div></div>
                <div style={styles.statCard}><div style={styles.statLabel}>TASKS COMPLETED</div><div style={styles.statValue}>{tasks.filter(t => t.status === 'Completed').length}</div></div>
                <div style={styles.statCard}><div style={styles.statLabel}>TOTAL TIME</div><div style={styles.statValue}>{Math.floor((isPunchedIn ? (accumulatedSessionTime + seconds) : accumulatedSessionTime) / 60)}m</div></div>
                <div style={styles.statCard}><div style={styles.statLabel}>SIGN COUNT</div><div style={styles.statValue}>{punchCount}/2</div></div>
              </div>

              <div style={styles.bottomGrid}>
                <div style={styles.taskFormCard}>
                  <h3 style={{marginBottom: '20px', fontSize: '20px', color: '#fff'}}>Quick Task Create</h3>
                  <form onSubmit={handleCreateTask} style={styles.formStack}>
                    <input style={styles.inputFieldFixed} placeholder="Task Title *" value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} required />
                    
                    <select 
                      style={styles.dropdownInputFieldStyle} 
                      value={newTask.project_id} 
                      onChange={e => setNewTask({...newTask, project_id: e.target.value})} 
                      required
                    >
                      <option value="" style={styles.dropdownOptionStyle}>Select Project *</option>
                      {projects.map(p => (
                        <option key={p.id} value={p.id} style={styles.dropdownOptionStyle}>{p.name}</option>
                      ))}
                    </select>
                    
                    <textarea style={{...styles.inputFieldFixed, height: '100px', resize: 'none'}} placeholder="Task Description" value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})} />
                    
                    <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                      <button 
                        type="submit" 
                        style={{
                          ...styles.createBtn, 
                          flex: 1, 
                          background: (!isPunchedIn || isButtonDisabled) ? '#1e293b' : '#00bcd4', 
                          color: (!isPunchedIn || isButtonDisabled) ? '#64748b' : 'black',
                          cursor: (!isPunchedIn || isButtonDisabled) ? 'not-allowed' : 'pointer',
                          border: (!isPunchedIn || isButtonDisabled) ? '1px solid #2d3748' : 'none'
                        }} 
                        disabled={!isPunchedIn || isButtonDisabled}
                      >
                        {isButtonDisabled ? `Wait ${Math.floor(cooldownTime / 60)}:${(cooldownTime % 60).toString().padStart(2, '0')}` : 'Create Task'}
                      </button>

                      <button 
                        type="button"
                        onClick={handleSubmitTask}
                        style={{
                          ...styles.createBtn,
                          flex: 1,
                          background: isButtonDisabled ? '#1e293b' : '#00e676',
                          color: isButtonDisabled ? '#64748b' : 'black',
                          cursor: isButtonDisabled ? 'not-allowed' : 'pointer',
                          border: '1px solid #2d3748'
                        }} 
                        disabled={isButtonDisabled}
                      >
                        Submit Task
                      </button>
                    </div>
                  </form>
                </div>

                <div style={styles.recentTasksCard}>
                  <h3 style={{marginBottom: '20px', fontSize: '20px', color: '#fff'}}>Recent Tasks (24h Activity)</h3>
                  <div style={{ ...styles.taskList, maxHeight: '350px', overflowY: 'auto' }}>
                    {recentTasksFiltered.length === 0 ? (
                      <p style={{color: '#888', fontSize: '14px'}}>No task updates inside the last 24 hours.</p>
                    ) : (
                      recentTasksFiltered.map(task => (
                        <div key={task.id} style={styles.taskItem}>
                          <div><div style={{fontWeight: 'bold', color: '#fff'}}>{task.title}</div><div style={{fontSize: '14px', color: '#888'}}>{task.description || 'No description'}</div></div>
                          <div style={{...styles.statusBadge, background: task.status === 'Completed' ? 'rgba(0, 230, 118, 0.2)' : 'rgba(245, 158, 11, 0.2)', color: task.status === 'Completed' ? '#00e676' : '#f59e0b', border: `1px solid ${task.status === 'Completed' ? '#00e676' : '#f59e0b'}`}}>
                            {task.status}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'tasks' && (
            <div style={styles.viewPanel}>
              <h1 style={styles.pageTitle}>All Tracked Tasks History</h1>
              <p style={styles.subText}>Comprehensive date-stratified and project-nested chronological logging clusters</p>
              
              {orderedUniqueDates.length === 0 ? (
                <p style={{color: '#888', marginTop: '20px'}}>No tasks recorded inside the database architecture logs yet.</p>
              ) : (
                orderedUniqueDates.map(dateStr => {
                  const dateTasks = tasksByDate[dateStr];
                  const isDateOpen = !!expandedDates[dateStr];
                  const innerProjectIds = [...new Set(dateTasks.map(t => parseInt(t.project_id)))];

                  return (
                    <div key={dateStr} style={styles.chronologicalWrapperDateCard}>
                      <div style={styles.chronologicalHeaderTriggerRow} onClick={() => toggleDateAccordion(dateStr)}>
                        <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
                          <span style={{
                            transform: isDateOpen ? 'rotate(90deg)' : 'rotate(0deg)', 
                            transition:'0.2s', display:'inline-block', fontSize:'14px', color:'#00bcd4', fontWeight:'bold'
                          }}>▶</span>
                          <span style={{fontWeight:'700', fontSize:'18px', color: '#fff'}}>📅 {getDateLabel(dateStr)}</span>
                          <span style={styles.totalTasksCountBadgeMini}>{dateTasks.length} Tasks ({dateStr})</span>
                        </div>
                        <div style={{color:'#64748b', fontSize:'13px', fontWeight:'500'}}>
                          Completed: <span style={{color:'#00e676'}}>{dateTasks.filter(t=>t.status==='Completed').length}</span> | In Progress: <span style={{color:'#f59e0b'}}>{dateTasks.filter(t=>t.status!=='Completed').length}</span>
                        </div>
                      </div>

                      {isDateOpen && (
                        <div style={styles.chronologicalInnerContentBox}>
                          {innerProjectIds.map(pId => {
                            const projectInnerTasks = dateTasks.filter(t => parseInt(t.project_id) === pId);
                            const combinedProjKey = `${dateStr}_${pId}`;
                            const isProjectOpen = !!expandedInnerProjects[combinedProjKey];

                            return (
                              <div key={pId} style={styles.innerProjectSubWrapperBlock}>
                                <div 
                                  style={{...styles.innerProjectSectionBannerTitle, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}
                                  onClick={() => toggleProjectAccordion(dateStr, pId)}
                                >
                                  <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                                    <span style={{
                                      transform: isProjectOpen ? 'rotate(90deg)' : 'rotate(0deg)', 
                                      transition: '0.2s', display: 'inline-block', color: '#00bcd4', fontWeight: 'bold', fontSize: '11px'
                                    }}>▶</span>
                                    <span>📁 {getProjectNameById(pId)}</span>
                                  </div>
                                  <span style={{background: 'rgba(0,188,212,0.15)', color: '#00bcd4', padding: '1px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 'bold'}}>
                                    {projectInnerTasks.length} Entries
                                  </span>
                                </div>

                                {isProjectOpen && (
                                  <table style={styles.customTableStructure}>
                                    <thead>
                                      <tr>
                                        <th style={styles.thCell}>TASK ID</th>
                                        <th style={styles.thCell}>COMPLETION / CREATED DATE</th>
                                        <th style={styles.thCell}>TASK SUMMARY DESIGNATION</th>
                                        <th style={styles.thCell}>AUDITING STATUS STATE</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {projectInnerTasks.map(t => (
                                        <tr key={t.id} style={styles.trRowTable}>
                                          <td style={{...styles.tdCell, color: '#8a94a6', fontWeight:'600', width:'15%'}}>#{t.id.toString().slice(-6)}</td>
                                          <td style={{...styles.tdCell, color: '#daffde', fontWeight:'500', width:'25%'}}>
                                            {t.created_date ? t.created_date : dateStr}
                                          </td>
                                          <td style={styles.tdCell}>
                                            <div style={{fontWeight:'bold', color:'#fff'}}>{t.title}</div>
                                            <small style={{color:'#64748b'}}>{t.description || 'No meta overview description logging'}</small>
                                          </td>
                                          <td style={{...styles.tdCell, width:'20%'}}>
                                            <span style={{
                                              ...styles.statusBadge,
                                              fontSize: '11px', padding: '4px 8px', borderRadius: '6px',
                                              background: t.status === 'Completed' ? 'rgba(0, 230, 118, 0.08)' : 'rgba(245, 158, 11, 0.08)',
                                              color: t.status === 'Completed' ? '#00e676' : '#f59e0b'
                                            }}>{t.status?.toUpperCase()}</span>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {activeTab === 'attendance' && (
            <div style={styles.viewPanel}>
              <h1 style={styles.pageTitle}>Attendance Records</h1>
              <table style={styles.customTableStructure}>
                <thead>
                  <tr>
                    <th style={styles.thCell}>DATE</th>
                    <th style={styles.thCell}>EMAIL</th>
                    <th style={styles.thCell}>STATUS</th>
                    <th style={styles.thCell}>TIME SPENT</th>
                  </tr>
                </thead>
                <tbody>
                  {(punchCount > 0 || isPunchedIn) ? (
                    <tr style={styles.trRowTable}>
                      <td style={styles.tdCell}>{new Date().toLocaleDateString()}</td>
                      <td style={styles.tdCell}>{activeUserSessionEmail}</td>
                      <td style={styles.tdCell}>
                        <span style={{color: (accumulatedSessionTime + seconds) >= 25200 ? '#00e676' : '#ef4444', fontWeight: 'bold'}}>
                          {(accumulatedSessionTime + seconds) >= 25200 ? 'PRESENT' : 'ABSENT'}
                        </span>
                      </td>
                      <td style={styles.tdCell}>{formatTime(accumulatedSessionTime + seconds)}</td>
                    </tr>
                  ) : (
                    <tr><td colSpan="4" style={{ textAlign: 'center', padding: '30px', color: '#888' }}>No attendance record for today yet. Please Punch In to start.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'leave' && (
            <div style={styles.viewPanel}>
              <div style={styles.headerRowFlex}>
                <h1 style={styles.pageTitle}>Leave Management</h1>
                <button style={styles.applyLeaveTriggerBtn} onClick={() => setShowLeaveModal(true)}>+ Apply Leave</button>
              </div>
              <div style={styles.taskListContainer}>
                {leaveRequests.length === 0 ? <p style={{textAlign:'center', color:'#888'}}>No leave requests found.</p> : 
                  leaveRequests.map(req => (
                    <div key={req.id} style={{ ...styles.taskItem, flexDirection: 'column', alignItems: 'flex-start', padding: '20px', gap: '10px', marginBottom: '15px' }}>
                      <div style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#00bcd4' }}>👤 Username / Email: {req.username}</span>
                        <span style={{ 
                          ...styles.statusBadge, 
                          background: 'rgba(255,255,255,0.02)', 
                          color: req.status === 'Approved' ? '#00e676' : req.status === 'Rejected' ? '#ef4444' : '#f59e0b', 
                          border: `1px solid ${req.status === 'Approved' ? '#00e676' : req.status === 'Rejected' ? '#ef4444' : '#f59e0b'}` 
                        }}>
                          {req.status ? req.status.toUpperCase() : 'PENDING'}
                        </span>
                      </div>
                      <div style={{ fontSize: '15px', color: '#daffde' }}>📅 <strong>Duration (From - To):</strong> {req.fromDate} <span style={{color:'#00bcd4'}}>to</span> {req.toDate}</div>
                      <div style={{ fontSize: '15px', color: '#fff', background: '#050505', padding: '12px', borderRadius: '8px', width: '100%', border: '1px solid #111111' }}>📝 <strong>Reason Details:</strong> {req.reason}</div>
                    </div>
                  ))}
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
              <input type="date" style={styles.inputFieldModal} value={leaveForm.fromDate} onChange={e=>setLeaveForm({...leaveForm, fromDate:e.target.value})} required />
              <input type="date" style={styles.inputFieldModal} value={leaveForm.toDate} onChange={e=>setLeaveForm({...leaveForm, toDate:e.target.value})} required />
              <textarea style={styles.inputFieldModal} placeholder="Enter reason here..." value={leaveForm.reason} onChange={e=>setLeaveForm({...leaveForm, reason:e.target.value})} required />
              <div style={styles.modalActionRowEnd}><button type="button" onClick={()=>setShowLeaveModal(false)}>Cancel</button><button type="submit" style={styles.modalSubmitBtn}>Submit Request</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
    appContainer: { display: 'flex', height: '100vh', background: '#000000', color: 'white', fontFamily: 'sans-serif', overflow: 'hidden' },
    sidebar: { width: '280px', background: '#000000', display: 'flex', flexDirection: 'column', padding: '25px', borderRight: '1px solid #111111' },
    logoSection: { display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '50px' },
    logoIcon: { background: '#00bcd4', padding: '10px', borderRadius: '10px', fontWeight: 'bold', color: 'black' },
    logoText: { fontSize: '24px', fontWeight: 'bold' },
    userProfileSide: { display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '40px' },
    avatarLarge: { width: '60px', height: '60px', borderRadius: '50%', background: '#0d0d0d', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00bcd4', fontWeight: 'bold' },
    userNameSide: { fontWeight: '600', fontSize: '14px', maxWidth:'160px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' },
    userRoleBadge: { background: '#eb9b00', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', color: 'black', fontWeight:'bold', marginTop:'4px', display:'inline-block' },
    navLinks: { flex: 1 },
    navItem: { padding: '15px 20px', borderRadius: '8px', color: '#888888', cursor: 'pointer', marginBottom: '10px', transition: '0.2s', fontSize: '17px' },
    navActive: { background: 'rgba(0, 188, 212, 0.08)', color: '#00bcd4', fontWeight: '600' },
    signOutPos: { borderTop: '1px solid #111111', paddingTop: '15px' },
    dropdownWhite: { position: 'absolute', bottom: '60px', left: '0', width: '100%', background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.5)', zIndex: 1000, color:'#fff' },
    headerDropdownWhite: { position: 'absolute', top: '75px', right: '0', width: '180px', background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.5)', zIndex: 1000, padding: '4px 0' },
    dropdownItem: { padding: '12px 20px', color: '#fff', cursor: 'pointer', '&:hover': { background: '#111' } },
    headerDropdownItem: { padding: '12px 20px', color: '#ef4444', fontWeight: 'bold', cursor: 'pointer' },
    notificationWhite: { position: 'absolute', top: '45px', right: '-10px', width: '320px', background: '#0d0d0d', borderRadius: '12px', border: '1px solid #1a1a1a', boxShadow: '0px 12px 30px rgba(0,0,0,0.6)', zIndex: 2000, overflow: 'hidden', color: '#fff' },
    notificationHeaderFlex: { display: 'flex', justifyContent: 'space-between', padding: '12px 18px', background: '#050505', borderBottom: '1px solid #111' },
    notificationBodyEmpty: { padding: '30px 18px', textAlign: 'center', color: '#666' },
    settingsTrigger: { padding: '15px 20px', background: '#0d0d0d', borderRadius: '8px', cursor: 'pointer', display: 'flex', fontWeight: 'bold', border: '1px solid #111' },
    mainWrapper: { flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', background: '#000000' },
    topHeader: { height: '80px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', padding: '0 50px', borderBottom: '1px solid #111111', background: '#000000' },
    headerRight: { display: 'flex', gap: '30px', alignItems: 'center' },
    professionalAvatarWrapper: { display: 'flex', alignItems: 'center', gap: '10px', background: '#000000', padding: '6px 14px', borderRadius: '30px', border: '1px solid #111111', cursor: 'pointer', transition: '0.2s', '&:hover': { background: '#0d0d0d' } },
    avatarSmallProfessional: { width: '30px', height: '30px', borderRadius: '50%', background: '#00bcd4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 'bold', fontSize: '13px' },
    professionalEmailText: { fontSize: '14px', color: '#fff', fontWeight: '500', maxWidth: '170px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
    dropdownArrowSymbol: { color: '#64748b', fontSize: '12px', marginLeft: '2px' },
    contentArea: { padding: '40px 50px 50px', background: '#000000', minHeight: 'calc(100vh - 80px)' },
    pageTitle: { fontSize: '36px', fontWeight: 'bold', margin: 0 },
    subText: { color: '#64748b', fontSize: '18px', marginBottom: '40px' },
    timerCard: { background: '#050505', borderRadius: '20px', padding: '35px', border: '1px solid #111111', marginBottom: '30px' },
    timerGrid: { display: 'grid', gridTemplateColumns: '1.2fr 0.8fr 0.8fr 1fr', alignItems: 'center' },
    timerValue: { fontSize: '56px', fontWeight: 'bold' },
    timerLabel: { color: '#8a94a6', fontSize: '14px' },
    punchInfoBox: { borderLeft: '1px solid #111111', paddingLeft: '25px' },
    punchAction: { display: 'flex', justifyContent: 'flex-end' },
    punchBtn: { border: 'none', padding: '12px 28px', borderRadius: '8px', color: 'white', fontWeight: 'bold', fontSize: '15px', transition: '0.2s' },
    stylesStatsMetricsRowGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '25px', marginBottom: '30px' },
    statCard: { background: '#050505', padding: '30px', borderRadius: '20px', border: '1px solid #111111' },
    statLabel: { color: '#8a94a6', fontSize: '12px', fontWeight: '600' },
    statValue: { fontSize: '42px', fontWeight: 'bold', marginTop: '12px' },
    bottomGrid: { display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '30px' },
    taskFormCard: { background: '#050505', padding: '30px', borderRadius: '20px', border: '1px solid #111111' },
    recentTasksCard: { background: '#050505', padding: '30px', borderRadius: '20px', border: '1px solid #111111' },
    formStack: { display: 'flex', flexDirection: 'column', gap: '15px' },
    inputFieldFixed: { background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: '10px', color: '#fff', padding: '15px', fontSize: '16px', outline:'none' },
    createBtn: { border: 'none', padding: '15px', borderRadius: '10px', fontWeight: 'bold', color: 'black', fontSize: '16px' },
    taskItem: { background: '#000000', padding: '15px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #111111', marginBottom: '10px' },
    statusBadge: { padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' },
    customTableWrapper: { background: '#050505', border: '1px solid #111111', borderRadius: '12px', overflow: 'hidden', marginBottom: '20px', marginTop:'15px' },
    projectHeaderBanner: { background: '#0a0d14', padding: '12px 20px', fontWeight: 'bold', color:'#00bcd4', fontSize:'14px' },
    customTableStructure: { width: '100%', borderCollapse: 'collapse' },
    thCell: { padding: '15px', background: '#0a0a0a', color: '#888', textAlign: 'left', borderBottom: '1px solid #111' },
    tdCell: { padding: '15px', borderBottom: '1px solid #111111' },
    tableStatusBadge: { fontWeight: 'bold', fontSize: '14px' },
    modalOverlayContext: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000 },
    modalContentCard: { background: '#050505', padding: '30px', borderRadius: '24px', border: '1px solid #111111', width: '500px' },
    applyLeaveTriggerBtn: { background: '#00bcd4', color: 'black', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' },
    headerRowFlex: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom:'20px' },
    viewPanel: { animation: 'fadeIn 0.25s ease-in-out' },
    chronologicalWrapperDateCard: { background: '#050505', border: '1px solid #111111', borderRadius: '12px', overflow: 'hidden', marginBottom: '20px' },
    chronologicalHeaderTriggerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 25px', cursor: 'pointer', background: '#080808', transition: '0.2s' },
    chronologicalInnerContentBox: { background: '#020202', padding: '15px 25px 25px', borderTop: '1px solid #111111', display:'flex', flexDirection:'column', gap:'15px' },
    totalTasksCountBadgeMini: { background: 'rgba(0, 188, 212, 0.12)', color: '#00bcd4', fontSize: '12px', padding: '3px 10px', borderRadius: '20px', fontWeight: 'bold' },
    innerProjectSubWrapperBlock: { border: '1px solid #111111', borderRadius: '8px', overflow:'hidden', background: '#050505' },
    innerProjectSectionBannerTitle: { background: '#0a0d14', padding: '12px 18px', fontWeight: '600', fontSize: '14px', color: '#fff', transition: '0.2s' },
    dropdownInputFieldStyle: { background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: '10px', color: '#ffffff', padding: '15px', fontSize: '16px', outline: 'none', width: '100%', cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none' },
    dropdownOptionStyle: { background: '#0d0d0d', color: '#ffffff', padding: '15px', fontSize: '16px' },
    inputFieldModal: { background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: '10px', color: '#fff', padding: '12px', fontSize: '16px', width: '100%', outline: 'none', marginBottom: '15px' },
    modalHeaderFlex: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#fff', marginBottom: '20px' },
    modalActionRowEnd: { display: 'flex', justifyContent: 'flex-end', gap: '15px', marginTop: '10px' },
    modalSubmitBtn: { background: '#00bcd4', color: '#000', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }
};

export default Dashboard;