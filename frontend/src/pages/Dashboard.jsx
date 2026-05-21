import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Dashboard = () => {
  const navigate = useNavigate();

  // ✅ CRITICAL REFRESH FIX: Read strictly from sessionStorage first to freeze tab identity across soft/hard refreshes
  const activeUserSessionEmail = sessionStorage.getItem('username') || '';

  const [userData, setUserData] = useState({ 
    fullName: 'Loading...', 
    role: 'Member', 
    username: activeUserSessionEmail 
  });
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

  // Scoped backup identifier allocation key
  const userKey = activeUserSessionEmail || 'global_tasker';

  // ATTENDANCE DRIVER STATES WITH LOCALSTORAGE USER ISOLATION
  const [isPunchedIn, setIsPunchedIn] = useState(() => localStorage.getItem(`praphool_isPunchedIn_${userKey}`) === 'true');
  const [seconds, setSeconds] = useState(() => parseInt(localStorage.getItem(`praphool_timer_seconds_${userKey}`)) || 0);
  const [punchInTime, setPunchInTime] = useState(() => localStorage.getItem(`praphool_punchInTime_${userKey}`) || "-");
  const [punchOutTime, setPunchOutTime] = useState(() => localStorage.getItem(`praphool_punchOutTime_${userKey}`) || "-");
  const [punchCount, setPunchCount] = useState(() => parseInt(localStorage.getItem(`praphool_punchCount_${userKey}`)) || 0);
  const [isShiftOver, setIsShiftOver] = useState(() => localStorage.getItem(`praphool_isShiftOver_${userKey}`) === 'true');
  const [accumulatedSessionTime, setAccumulatedSessionTime] = useState(() => parseInt(localStorage.getItem(`praphool_accumulatedSessionTime_${userKey}`)) || 0);

  // MASTER DATA DATA RESERVOIR STATE
  const [tasks, setTasks] = useState(() => {
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

  // FORCE USER ISOLATION HOOK ON RENDER PIPELINES
  useEffect(() => {
    const tabIsolatedToken = sessionStorage.getItem('token') || localStorage.getItem('token');
    if (!tabIsolatedToken) {
      navigate('/login');
      return;
    }

    if (activeUserSessionEmail) {
      checkAndResetDailyShift(activeUserSessionEmail);

      setIsPunchedIn(localStorage.getItem(`praphool_isPunchedIn_${activeUserSessionEmail}`) === 'true');
      setSeconds(parseInt(localStorage.getItem(`praphool_timer_seconds_${activeUserSessionEmail}`)) || 0);
      setPunchInTime(localStorage.getItem(`praphool_punchInTime_${activeUserSessionEmail}`) || "-");
      setPunchOutTime(localStorage.getItem(`praphool_punchOutTime_${activeUserSessionEmail}`) || "-");
      setPunchCount(parseInt(localStorage.getItem(`praphool_punchCount_${activeUserSessionEmail}`)) || 0);
      setIsShiftOver(localStorage.getItem(`praphool_isShiftOver_${activeUserSessionEmail}`) === 'true');
      setAccumulatedSessionTime(parseInt(localStorage.getItem(`praphool_accumulatedSessionTime_${activeUserSessionEmail}`)) || 0);

      const savedLocalTasks = localStorage.getItem(`praphool_tasks_backup_${activeUserSessionEmail}`);
      setTasks(savedLocalTasks ? JSON.parse(savedLocalTasks) : []);
    }
  }, [activeUserSessionEmail]);

  // ATTENDANCE EFFECT WRITER
  useEffect(() => {
    if (activeUserSessionEmail) {
      localStorage.setItem(`praphool_isPunchedIn_${activeUserSessionEmail}`, isPunchedIn);
      localStorage.setItem(`praphool_timer_seconds_${activeUserSessionEmail}`, seconds);
      localStorage.setItem(`praphool_punchInTime_${activeUserSessionEmail}`, punchInTime);
      localStorage.setItem(`praphool_punchOutTime_${activeUserSessionEmail}`, punchOutTime);
      localStorage.setItem(`praphool_punchCount_${activeUserSessionEmail}`, punchCount);
      localStorage.setItem(`praphool_isShiftOver_${activeUserSessionEmail}`, isShiftOver);
      localStorage.setItem(`praphool_accumulatedSessionTime_${activeUserSessionEmail}`, accumulatedSessionTime);
    }
  }, [isPunchedIn, seconds, punchInTime, punchOutTime, punchCount, isShiftOver, accumulatedSessionTime, activeUserSessionEmail]);

  // SYNC TASK TO LOCALSTORAGE
  useEffect(() => {
    if (tasks && tasks.length > 0 && activeUserSessionEmail) {
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
    document.body.style.backgroundColor = '#0d0e12';
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    
    const styleSheet = document.createElement("style");
    styleSheet.innerText = `
      ::-webkit-scrollbar { width: 8px; height: 8px; }
      ::-webkit-scrollbar-track { background: #0d0e12; }
      ::-webkit-scrollbar-thumb { background: #222530; border-radius: 10px; }
      ::-webkit-scrollbar-thumb:hover { background: #2d313f; }
      html, body { background-color: #0d0e12 !important; color-scheme: dark; overflow: hidden; font-family: 'Inter', system-ui, sans-serif; }
      
      .nav-item-hover { transition: all 0.2s ease !important; }
      .nav-item-hover:hover { background: rgba(252, 253, 255, 0.05) !important; color: #f2f4f8 !important; transform: translateX(4px); }
      .nav-item-active-hover:hover { background: rgba(0, 245, 212, 0.08) !important; color: #00f5d4 !important; }
      .card-glow-hover { transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease !important; }
      .card-glow-hover:hover { transform: translateY(-4px); border-color: #373c4d !important; box-shadow: 0 16px 36px -10px rgba(0,0,0,0.85); }
      .input-focus-glow:focus { border-color: rgba(0, 245, 212, 0.6) !important; box-shadow: 0 0 0 3px rgba(0, 245, 212, 0.08); }
      .btn-scale-hover { transition: all 0.2s ease !important; cursor: pointer; }
      .btn-scale-hover:hover:not(:disabled) { filter: brightness(1.18); transform: translateY(-1.5px); box-shadow: 0 6px 16px rgba(0,0,0,0.35); }
      .btn-scale-hover:active:not(:disabled) { transform: translateY(0); }
      .tr-row-hover { transition: background-color 0.15s ease !important; }
      .tr-row-hover:hover { background-color: #161822 !important; }
    `;
    document.head.appendChild(styleSheet);
    
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
    localStorage.removeItem('username');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('username'); 
    setUserData({ fullName: 'Loading...', role: 'Member', username: '' });
    setTasks([]);
    setIsPunchedIn(false);
    setSeconds(0);
    setPunchInTime("-");
    setPunchOutTime("-");
    setPunchCount(0);
    setIsShiftOver(false);
    setAccumulatedSessionTime(0);
    alert("Logged out successfully! 👋");
    navigate('/login');
  };

  const fetchUserData = async () => {
    const activeTabToken = sessionStorage.getItem('token') || localStorage.getItem('token');
    if (!activeTabToken) return;
    try {
      const res = await axios.get('https://team-task-manager-production-fb15.up.railway.app/api/auth/me', {
        headers: { Authorization: `Bearer ${activeTabToken}` }
      });
      if (res.data && res.data.username) {
        if (!sessionStorage.getItem('username') || sessionStorage.getItem('username') !== res.data.username) {
          sessionStorage.setItem('username', res.data.username);
          sessionStorage.setItem('token', activeTabToken);
        }
        setUserData(res.data);
      }
    } catch (err) { if(err.response?.status === 401) handleLogout(); }
  };

  const fetchMyLeaveStatus = async () => {
    try {
      const activeTabToken = sessionStorage.getItem('token') || localStorage.getItem('token');
      const res = await axios.get('https://team-task-manager-production-fb15.up.railway.app/api/auth/leaves/my-leaves', {
        headers: { Authorization: `Bearer ${activeTabToken}` }
      });
      if (res.data && Array.isArray(res.data)) setLeaveRequests(res.data);
    } catch (err) { console.error(err); }
  };

const fetchTasks = async () => {
    const activeTabToken = sessionStorage.getItem('token') || localStorage.getItem('token');
    if (!activeTabToken) return;

    try {
      const res = await axios.get('https://team-task-manager-production-fb15.up.railway.app/api/tasks', {
        headers: { Authorization: `Bearer ${activeTabToken}` }
      });

      if (res.data && Array.isArray(res.data)) {
        // ✅ ADMIN BYPASS LOGIC:
        // Agar user 'Quality Reviewer' ya 'Admin' hai, toh filtering mat lagao
        const isAdmin = userData.role === 'Quality Reviewer' || userData.role === 'Admin';
        
        const myTasks = isAdmin 
            ? res.data 
            : res.data.filter(t => t.username === activeUserSessionEmail || (t.title && t.title.includes(`(By: ${activeUserSessionEmail.split('@')[0]})`)));

        setTasks(myTasks);
        localStorage.setItem(`praphool_tasks_backup_${userKey}`, JSON.stringify(myTasks));
      }
    } catch (err) { console.error("Fetch Tasks Error:", err); }
  };
  const fetchProjects = async () => {
    try {
      const activeTabToken = sessionStorage.getItem('token') || localStorage.getItem('token');
      const res = await axios.get('https://team-task-manager-production-fb15.up.railway.app/api/projects', {
        headers: { Authorization: `Bearer ${activeTabToken}` }
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

    const currentActiveProjectObject = projects.find(p => parseInt(p.id) === parseInt(selectedProjId)) || projects[0];
    const extractedProjectName = currentActiveProjectObject ? currentActiveProjectObject.name : 'GEO Sentiment Analyzer';

    const temporaryId = Date.now();
    // ✅ HARD STICK INTEGRATION: Inject wrapper brackets format strictly in local object too
    const structuredFormTitle = `[${extractedProjectName}] ${newTask.title || 'Untitled Task'}`;

    const immediateTaskObject = {
      id: temporaryId,
      title: structuredFormTitle,
      description: newTask.description,
      project_id: selectedProjId,
      project_name: extractedProjectName, 
      status: 'In Progress',
      timestamp: Date.now(), 
      created_date: today,
      username: userKey
    };

    const nextTaskList = [immediateTaskObject, ...tasks];
    setTasks(nextTaskList);
    localStorage.setItem(`praphool_tasks_backup_${userKey}`, JSON.stringify(nextTaskList));
    
    setCurrentCreatedTaskId(temporaryId);
    setNewTask({ title: '', description: '', project_id: '' });
    
    setIsButtonDisabled(true);
    setCooldownTime(120);

    try {
      const activeTabToken = sessionStorage.getItem('token') || localStorage.getItem('token');
      const res = await axios.post('https://team-task-manager-production-fb15.up.railway.app/api/tasks', {
        title: immediateTaskObject.title, // [Project Name] Title passed directly to prevent leak
        description: immediateTaskObject.description,
        project_id: selectedProjId, 
        project_name: extractedProjectName, 
        status: 'In Progress'
      }, {
        headers: { Authorization: `Bearer ${activeTabToken}` }
      });
      if (res.data && res.data.id) {
        setCurrentCreatedTaskId(res.data.id);
        setTasks(prev => prev.map(t => t.id === temporaryId ? { ...t, id: res.data.id } : t));
      }
      fetchTasks(); 
    } catch (error) { console.log(error); }
  };

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
      markAsComplete(targetId);
      const activeTabToken = sessionStorage.getItem('token') || localStorage.getItem('token');
      await axios.put(`https://team-task-manager-production-fb15.up.railway.app/api/tasks/${targetId}`, {
        status: 'Completed'
      }, {
        headers: { Authorization: `Bearer ${activeTabToken}` }
      });

      alert("Task permanently submitted as Completed! ✅");
      setCurrentCreatedTaskId(null); 
      setTimeout(() => { fetchTasks(); }, 1500);
    } catch (err) {
      markAsComplete(targetId);
      alert("Task permanently submitted as Completed! ✅");
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
    localStorage.setItem(`praphool_tasks_backup_${userKey}`, JSON.stringify(freshTasks));
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
      localStorage.setItem(`praphool_timer_seconds_${userKey}`, '0');
      if (currentCount >= 2) {
        setIsShiftOver(true); alert("Shift Completed permanently! All options are now locked till tomorrow 8:00 AM. 🔒");
      }
    }
  };

  const handleLeaveSubmit = async (e) => {
    e.preventDefault();
    try {
      const activeTabToken = sessionStorage.getItem('token') || localStorage.getItem('token');
      await axios.post('https://team-task-manager-production-fb15.up.railway.app/api/auth/leaves/apply', {
        fromDate: leaveForm.fromDate, toDate: leaveForm.toDate, reason: leaveForm.reason
      }, {
        headers: { Authorization: `Bearer ${activeTabToken}` }
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

  const getDateLabel = (dateStr) => {
    const todayStr = new Date().toISOString().split('T')[0];
    if (dateStr === todayStr) return "Today's Log Activity";
    return dateStr;
  };

  return (
    <div style={styles.appContainer}>
      <div style={styles.sidebar}>
        <div style={styles.logoSection}>
          <div style={styles.logoIcon}>TT</div>
          <span style={styles.logoText}>Task Track</span>
        </div>
        <div className="nav-item-hover" style={styles.userProfileSide} onClick={() => setActiveTab('dashboard')}>
          <div style={styles.avatarLarge}>{userKey.charAt(0).toUpperCase()}</div>
          <div>
            <div style={styles.userNameSide}>{userKey}</div>
            <div style={styles.userRoleBadge}>{userData?.role || 'Member'}</div>
          </div>
        </div>
        <nav style={styles.navLinks}>
          <div className={`nav-item-hover ${activeTab === 'dashboard' ? 'nav-item-active-hover' : ''}`} style={{...styles.navItem, ...(activeTab === 'dashboard' ? styles.navActive : {})}} onClick={() => setActiveTab('dashboard')}>
            <span style={styles.navIcon}>📊</span> Dashboard
          </div>
          <div className={`nav-item-hover ${activeTab === 'tasks' ? 'nav-item-active-hover' : ''}`} style={{...styles.navItem, ...(activeTab === 'tasks' ? styles.navActive : {})}} onClick={() => setActiveTab('tasks')}>
            <span style={styles.navIcon}>✅</span> My Tasks
          </div>
          <div className={`nav-item-hover ${activeTab === 'attendance' ? 'nav-item-active-hover' : ''}`} style={{...styles.navItem, ...(activeTab === 'attendance' ? styles.navActive : {})}} onClick={() => setActiveTab('attendance')}>
            <span style={styles.navIcon}>📅</span> Attendance
          </div>
          <div className={`nav-item-hover ${activeTab === 'leave' ? 'nav-item-active-hover' : ''}`} style={{...styles.navItem, ...(activeTab === 'leave' ? styles.navActive : {})}} onClick={() => setActiveTab('leave')}>
            <span style={styles.navIcon}>📄</span> Apply Leave
          </div>
        </nav>
        
        <div id="praphool_sidebar_settings_trigger" style={{position: 'relative', marginTop: 'auto', marginBottom: '10px'}} onClick={triggerSidebarSettingsMenu}>
          <div className="nav-item-hover" style={styles.settingsTrigger}>
            <span>⚙️ Settings</span> <span style={{marginLeft: 'auto', fontSize: '11px'}}>{showSettingsMenu ? '▼' : '▲'}</span>
          </div>
          {showSettingsMenu && (
            <div style={styles.dropdownWhite}>
              <div className="tr-row-hover" style={styles.dropdownItem} onClick={handleLogout}>Logout →</div>
            </div>
          )}
        </div>
        <div style={styles.signOutPos} onClick={handleLogout}>
          <div className="nav-item-hover" style={{...styles.navItem, color: '#ff5c5c', margin: 0}}>↪ Sign Out</div>
        </div>
      </div>

      <div style={styles.mainWrapper}>
        <header style={styles.topHeader}>
          <div style={styles.headerRight}>
             <div id="praphool-notification-trigger" style={{position: 'relative'}}>
              <span className="btn-scale-hover" style={styles.iconBell} onClick={triggerNotificationDropdown}>🔔</span>
              {showNotificationDropdown && (
                <div style={styles.notificationWhite}>
                  <div style={styles.notificationHeaderFlex}><span style={{fontWeight: '600'}}>Notifications</span><span>0 alerts</span></div>
                  <div style={styles.notificationBodyEmpty}><p>No new notifications</p></div>
                </div>
              )}
            </div>
            
            <div id="praphool-header-avatar" style={{position: 'relative'}}>
              <div className="btn-scale-hover" style={styles.professionalAvatarWrapper} onClick={triggerHeaderDropdown}>
                <div style={styles.avatarSmallProfessional}>
                  {userKey.charAt(0).toUpperCase()}
                </div>
                <span style={styles.professionalEmailText}>
                  {userKey}
                </span>
                <span style={styles.dropdownArrowSymbol}>▼</span>
              </div>
              {showHeaderDropdown && (
                <div style={styles.headerDropdownWhite}>
                  <div className="tr-row-hover" style={styles.headerDropdownItem} onClick={handleLogout}>↪ Log Out</div>
                </div>
              )}
            </div>
          </div>
        </header>

        <div style={styles.contentArea}>
          {activeTab === 'dashboard' && (
            <>
              <h1 style={styles.pageTitle}>My Dashboard</h1>
              <p style={styles.subText}>Welcome back, <span style={{color: '#00f5d4'}}>{userKey}</span></p>
              
              <div className="card-glow-hover" style={styles.timerCard}>
                <div style={styles.timerGrid}>
                  <div style={styles.timerDisplay}>
                    <div style={styles.timerLabel}>{isShiftOver ? '❌ SHIFT LOCKOUT ACTIVE' : 'READY TO START'}</div>
                    <div style={styles.timerValue}>{formatTime(isPunchedIn ? (accumulatedSessionTime + seconds) : accumulatedSessionTime)}</div>
                  </div>
                  <div style={styles.punchInfoBox}>
                    <span style={{color: '#00f5d4', fontSize: '13px', fontWeight: '600', letterSpacing: '0.5px'}}>→] SIGN IN</span>
                    <div style={styles.punchTimeText}>{punchInTime}</div>
                  </div>
                  <div style={styles.punchInfoBox}>
                    <span style={{color: '#ff5c5c', fontSize: '13px', fontWeight: '600', letterSpacing: '0.5px'}}>[→ SIGN OUT</span>
                    <div style={styles.punchTimeText}>{punchOutTime}</div>
                  </div>
                  <div style={styles.punchAction}>
                    <button 
                      className="btn-scale-hover"
                      onClick={handlePunchToggle} 
                      disabled={isShiftOver} 
                      style={{
                        ...styles.punchBtn, 
                        background: isShiftOver ? '#222530' : (isPunchedIn ? '#ff5c5c' : '#00f5d4'),
                        color: isShiftOver ? '#525866' : '#0d0e12',
                        cursor: isShiftOver ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {isShiftOver ? '🔒 Locked' : (isPunchedIn ? '⏹ SIGN Out' : '▶ SIGN In')}
                    </button>
                  </div>
                </div>
              </div>

              <div style={styles.stylesStatsMetricsRowGrid}>
                <div className="card-glow-hover" style={styles.statCard}>
                  <div style={styles.statLabel}>TASKS IN PROGRESS</div>
                  <div style={{...styles.statValue, color: '#ffb703'}}>{tasks.filter(t => t.status !== 'Completed').length}</div>
                </div>
                <div className="card-glow-hover" style={styles.statCard}>
                  <div style={styles.statLabel}>TASKS COMPLETED</div>
                  <div style={{...styles.statValue, color: '#00f5d4'}}>{tasks.filter(t => t.status === 'Completed').length}</div>
                </div>
                <div className="card-glow-hover" style={styles.statCard}>
                  <div style={styles.statLabel}>TOTAL TIME</div>
                  <div style={{...styles.statValue, color: '#9d4edd'}}>{Math.floor((isPunchedIn ? (accumulatedSessionTime + seconds) : accumulatedSessionTime) / 60)}m</div>
                </div>
                <div className="card-glow-hover" style={styles.statCard}>
                  <div style={styles.statLabel}>SIGN COUNT</div>
                  <div style={{...styles.statValue, color: '#e0aaff'}}>{punchCount}/2</div>
                </div>
              </div>

              <div style={styles.bottomGrid}>
                <div className="card-glow-hover" style={styles.taskFormCard}>
                  <h3 style={styles.cardHeading}>Quick Task Create</h3>
                  <form onSubmit={handleCreateTask} style={styles.formStack}>
                    <input className="input-focus-glow" style={styles.inputFieldFixed} placeholder="Task Title *" value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} required />
                    
                    <select 
                      className="input-focus-glow"
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
                    
                    <textarea className="input-focus-glow" style={{...styles.inputFieldFixed, height: '130px', resize: 'none'}} placeholder="Task Description" value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})} />
                    
                    <div style={{ display: 'flex', gap: '15px', marginTop: '5px' }}>
                      <button 
                        type="submit" 
                        className="btn-scale-hover"
                        style={{
                          ...styles.createBtn, 
                          flex: 1, 
                          background: (!isPunchedIn || isButtonDisabled) ? '#222530' : '#00f5d4', 
                          color: (!isPunchedIn || isButtonDisabled) ? '#525866' : '#0d0e12',
                          cursor: (!isPunchedIn || isButtonDisabled) ? 'not-allowed' : 'pointer',
                        }} 
                        disabled={!isPunchedIn || isButtonDisabled}
                      >
                        {isButtonDisabled ? `Wait ${Math.floor(cooldownTime / 60)}:${(cooldownTime % 60).toString().padStart(2, '0')}` : 'Create Task'}
                      </button>

                      <button 
                        type="button"
                        onClick={handleSubmitTask}
                        className="btn-scale-hover"
                        style={{
                          ...styles.createBtn,
                          flex: 1,
                          background: isButtonDisabled ? '#222530' : 'transparent',
                          color: isButtonDisabled ? '#525866' : '#00f5d4',
                          border: isButtonDisabled ? 'none' : '1px solid #00f5d4',
                          cursor: isButtonDisabled ? 'not-allowed' : 'pointer',
                        }} 
                        disabled={isButtonDisabled}
                      >
                        Submit Task
                      </button>
                    </div>
                  </form>
                </div>

                <div className="card-glow-hover" style={styles.recentTasksCard}>
                  <h3 style={styles.cardHeading}>Recent Tasks (24h Activity)</h3>
                  <div style={{ ...styles.taskList, maxHeight: '390px', overflowY: 'auto' }}>
                    {recentTasksFiltered.length === 0 ? (
                      <p style={{color: '#525866', fontSize: '14px', textAlign: 'center', padding: '40px 0'}}>No task updates inside the last 24 hours.</p>
                    ) : (
                      recentTasksFiltered.map(task => {
                        // Cleanup brackets from UI display strings for professional look
                        const cleanTitle = String(task.title || '').replace(/^\[.*?\]\s*/, '').split('(By:')[0].trim();
                        return (
                          <div key={task.id} className="card-glow-hover" style={styles.taskItem}>
                            <div style={{flex: 1, paddingRight: '15px'}}>
                              <div style={{fontWeight: '600', color: '#f2f4f8', fontSize: '15px'}}>{cleanTitle}</div>
                              <div style={{fontSize: '13px', color: '#7e869c', marginTop: '4px'}}>{task.description || 'No description'}</div>
                            </div>
                            <div style={{
                              ...styles.statusBadge, 
                              background: task.status === 'Completed' ? 'rgba(0, 245, 212, 0.06)' : 'rgba(255, 183, 3, 0.06)', 
                              color: task.status === 'Completed' ? '#00f5d4' : '#ffb703', 
                              border: `1px solid ${task.status === 'Completed' ? 'rgba(0, 245, 212, 0.15)' : 'rgba(255, 183, 3, 0.15)'}`
                            }}>{task.status}</div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ✅ TAB: MY TASKS HISTORY - COMPACT 3-PROJECT FORCE RENDER (NO PROJECT HIDING) */}
          {activeTab === 'tasks' && (
            <div style={styles.viewPanel}>
              <h1 style={styles.pageTitle}>All Tracked Tasks History</h1>
              <p style={styles.subText}>Comprehensive date-stratified and project-nested chronological logging clusters</p>
              
              {orderedUniqueDates.length === 0 ? (
                <p style={{color: '#525866', marginTop: '20px', textAlign: 'center'}}>No tasks recorded inside the database architecture logs yet.</p>
              ) : (
                orderedUniqueDates.map(dateStr => {
                  const dateTasks = tasksByDate[dateStr];
                  const isDateOpen = !!expandedDates[dateStr];

                  // Safe master dynamic projects array track (Ensures 1, 2, 3 are ALWAYS rendered)
                  const fallbackMasterProjectsList = projects.length > 0 ? projects : [
                    { id: 1, name: 'GEO Sentiment Analyzer' },
                    { id: 2, name: 'Face Recognition Attendance System' },
                    { id: 3, name: 'Portfolio Website Showcase' }
                  ];

                  return (
                    <div key={dateStr} style={styles.chronologicalWrapperDateCard}>
                      <div className="tr-row-hover" style={styles.chronologicalHeaderTriggerRow} onClick={() => toggleDateAccordion(dateStr)}>
                        <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
                          <span style={{
                            transform: isDateOpen ? 'rotate(90deg)' : 'rotate(0deg)', 
                            transition:'0.2s', display:'inline-block', fontSize:'11px', color:'#00f5d4'
                          }}>▶</span>
                          <span style={{fontWeight:'600', fontSize:'16px', color: '#f2f4f8'}}>📅 {getDateLabel(dateStr)}</span>
                          <span style={styles.totalTasksCountBadgeMini}>{dateTasks.length} Tasks</span>
                        </div>
                        <div style={{color:'#7e869c', fontSize:'12px'}}>
                          Completed: <span style={{color:'#00f5d4', fontWeight: '500'}}>{dateTasks.filter(t=>t.status==='Completed').length}</span> | In Progress: <span style={{color:'#ffb703', fontWeight: '500'}}>{dateTasks.filter(t=>t.status!=='Completed').length}</span>
                        </div>
                      </div>

                      {isDateOpen && (
                        <div style={styles.chronologicalInnerContentBox}>
                          {fallbackMasterProjectsList.map(pObject => {
                            const pId = parseInt(pObject.id);
                            
                            // 🔥 ABSOLUTE ANTI-OVERLAP FILTERING LOOP WITH NO SPILLOVER LEAKS
                            const projectInnerTasks = dateTasks.filter(t => {
                              const taskTitleLower = String(t.title || '').toLowerCase();
                              const taskDescLower = String(t.description || '').toLowerCase();
                              const taskProjectId = parseInt(t.project_id);

                              if (pId === 2) {
                                return taskTitleLower.includes('face') || taskTitleLower.includes('attendance') || taskDescLower.includes('face') || taskProjectId === 2;
                              }

                              if (pId === 3) {
                                return taskTitleLower.includes('portfolio') || taskTitleLower.includes('website') || taskDescLower.includes('portfolio') || taskProjectId === 3;
                              }

                              if (pId === 1) {
                                const isFace = taskTitleLower.includes('face') || taskTitleLower.includes('attendance') || taskDescLower.includes('face');
                                const isPortfolio = taskTitleLower.includes('portfolio') || taskTitleLower.includes('website') || taskDescLower.includes('portfolio');
                                if (isFace || isPortfolio || taskProjectId === 2 || taskProjectId === 3) return false;
                                return true;
                              }

                              return false;
                            });

                            const combinedProjKey = `${dateStr}_${pId}`;
                            const isProjectOpen = !!expandedInnerProjects[combinedProjKey];

                            return (
                              <div key={pId} style={styles.innerProjectSubWrapperBlock}>
                                <div 
                                  className="tr-row-hover"
                                  style={{...styles.innerProjectSectionBannerTitle, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}
                                  onClick={() => toggleProjectAccordion(dateStr, pId)}
                                >
                                  <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                                    <span style={{
                                      transform: isProjectOpen ? 'rotate(90deg)' : 'rotate(0deg)', 
                                      transition: '0.2s', display: 'inline-block', color: '#525866', fontSize: '10px'
                                    }}>▶</span>
                                    <span>📁 {pObject.name}</span>
                                  </div>
                                  <span style={{
                                    background: projectInnerTasks.length > 0 ? 'rgba(157, 78, 221, 0.08)' : 'rgba(255,255,255,0.02)', 
                                    color: projectInnerTasks.length > 0 ? '#9d4edd' : '#525866', 
                                    padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '500'
                                  }}>
                                    {projectInnerTasks.length} Entries
                                  </span>
                                </div>

                                {isProjectOpen && (
                                  <div style={{overflowX: 'auto'}}>
                                    {projectInnerTasks.length === 0 ? (
                                      <p style={{color: '#525866', fontSize: '14px', textAlign: 'center', padding: '20px 0', background: '#14161d', margin: 0}}>No tasks recorded for this project on this date.</p>
                                    ) : (
                                      <table style={styles.customTableStructure}>
                                        <thead>
                                          <tr>
                                            <th style={styles.thCell}>TASK ID</th>
                                            <th style={styles.thCell}>TASK SUMMARY</th>
                                            <th style={styles.thCell}>STATUS</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {projectInnerTasks.map(t => {
                                            const rowCleanTitle = String(t.title || '').replace(/^\[.*?\]\s*/, '').split('(By:')[0].trim();
                                            return (
                                              <tr key={t.id} className="tr-row-hover" style={styles.trRowTable}>
                                                <td style={{...styles.tdCell, color: '#525866', fontWeight:'500', width:'15%', fontSize: '14px'}}>#{t.id ? t.id.toString().slice(-6) : 'Auto'}</td>
                                                <td style={styles.tdCell}>
                                                  <div style={{fontWeight:'500', color:'#f2f4f8', fontSize: '15px'}}>{rowCleanTitle}</div>
                                                  <div style={{color:'#7e869c', fontSize: '13px', marginTop: '3px'}}>{t.description || 'No description provided.'}</div>
                                                </td>
                                                <td style={{...styles.tdCell, width:'15%'}}>
                                                  <span style={{
                                                    ...styles.statusBadge,
                                                    fontSize: '11px', padding: '3px 10px',
                                                    background: t.status === 'Completed' ? 'rgba(0, 245, 212, 0.06)' : 'rgba(255, 183, 3, 0.06)',
                                                    color: t.status === 'Completed' ? '#00f5d4' : '#ffb703',
                                                    border: `1px solid ${t.status === 'Completed' ? 'rgba(0, 245, 212, 0.12)' : 'rgba(255, 183, 3, 0.12)'}`
                                                  }}>{t.status?.toUpperCase()}</span>
                                                </td>
                                              </tr>
                                            );
                                          })}
                                        </tbody>
                                      </table>
                                    )}
                                  </div>
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
              <p style={styles.subText}>Track your working hours and session updates</p>
              <div style={styles.tableWrapper}>
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
                      <tr className="tr-row-hover" style={styles.trRowTable}>
                        <td style={styles.tdCell}>{new Date().toLocaleDateString()}</td>
                        <td style={styles.tdCell}>{userKey}</td>
                        <td style={styles.tdCell}>
                          <span style={{
                            ...styles.statusBadge,
                            padding: '4px 12px',
                            background: (accumulatedSessionTime + seconds) >= 25200 ? 'rgba(0, 245, 212, 0.06)' : 'rgba(255, 92, 92, 0.06)',
                            color: (accumulatedSessionTime + seconds) >= 25200 ? '#00f5d4' : '#ff5c5c',
                            border: `1px solid ${(accumulatedSessionTime + seconds) >= 25200 ? 'rgba(0, 245, 212, 0.15)' : 'rgba(255, 92, 92, 0.15)'}`
                          }}>
                            {(accumulatedSessionTime + seconds) >= 25200 ? 'PRESENT' : 'ABSENT'}
                          </span>
                        </td>
                        <td style={{...styles.tdCell, fontWeight: '500', color: '#f2f4f8', fontSize: '15px'}}>{formatTime(accumulatedSessionTime + seconds)}</td>
                      </tr>
                    ) : (
                      <tr><td colSpan="4" style={{ textAlign: 'center', padding: '50px', color: '#525866', backgroundColor: '#14161d', fontSize: '15px' }}>No attendance record for today yet. Please Punch In to start.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'leave' && (
            <div style={styles.viewPanel}>
              <div style={styles.headerRowFlex}>
                <div>
                  <h1 style={styles.pageTitle}>Leave Management</h1>
                  <p style={{ ...styles.subText, color: '#7e869c', margin: '5px 0 0' }}>Manage and submit your leave requests</p>
                </div>
                <button className="btn-scale-hover" style={styles.applyLeaveTriggerBtn} onClick={() => setShowLeaveModal(true)}>+ Apply Leave</button>
              </div>
              <div style={{ marginTop: '25px' }}>
                {leaveRequests.length === 0 ? (
                  <p style={{textAlign:'center', color:'#525866', padding: '50px', fontSize: '15px'}}>No leave requests found.</p>
                ) : (
                  leaveRequests.map(req => (
                    <div key={req.id} className="card-glow-hover" style={{ ...styles.taskItem, flexDirection: 'column', alignItems: 'flex-start', padding: '24px', gap: '14px', marginBottom: '20px' }}>
                      <div style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '15px', fontWeight: '500', color: '#f2f4f8' }}>👤 {req.username}</span>
                        <span style={{ 
                          ...styles.statusBadge, 
                          padding: '4px 12px',
                          background: req.status === 'Approved' ? 'rgba(0, 245, 212, 0.06)' : req.status === 'Rejected' ? 'rgba(255, 92, 92, 0.06)' : 'rgba(255, 183, 3, 0.06)', 
                          color: req.status === 'Approved' ? '#00f5d4' : req.status === 'Rejected' ? '#ff5c5c' : '#ffb703', 
                          border: `1px solid ${req.status === 'Approved' ? 'rgba(0, 245, 212, 0.15)' : req.status === 'Rejected' ? 'rgba(255, 92, 92, 0.15)' : 'rgba(255, 183, 3, 0.15)'}` 
                        }}>
                          {req.status ? req.status.toUpperCase() : 'PENDING'}
                        </span>
                      </div>
                      <div style={{ fontSize: '14px', color: '#7e869c' }}>📅 <strong>Duration:</strong> {req.fromDate} <span style={{ color: '#00f5d4' }}>to</span> {req.toDate}</div>
                      <div style={{ fontSize: '14px', color: '#f2f4f8', background: '#0d0e12', padding: '14px 18px', borderRadius: '8px', width: '100%', boxSizing: 'border-box', border: '1px solid #222530', lineHeight: '1.5' }}>📝 <strong>Reason:</strong> {req.reason}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {showLeaveModal && (
        <div style={styles.modalOverlayContext}>
          <div style={styles.modalContentCard}>
            <div style={styles.modalHeaderFlex}><h3>Apply for Leave</h3><span style={{cursor:'pointer', color: '#525866', fontSize: '18pxxb'}} onClick={()=>setShowLeaveModal(false)}>✕</span></div>
            <form onSubmit={handleLeaveSubmit} style={styles.formStack}>
              <div style={{display: 'flex', gap: '15px'}}>
                <div style={{flex: 1}}>
                  <label style={{fontSize: '12px', color: '#7e869c', display: 'block', marginBottom: '6px', fontWeight: '500'}}>From Date</label>
                  <input className="input-focus-glow" type="date" style={styles.inputFieldModal} value={leaveForm.fromDate} onChange={e=>setLeaveForm({...leaveForm, fromDate:e.target.value})} required />
                </div>
                <div style={{flex: 1}}>
                  <label style={{fontSize: '12px', color: '#7e869c', display: 'block', marginBottom: '6px', fontWeight: '500'}}>To Date</label>
                  <input className="input-focus-glow" type="date" style={styles.inputFieldModal} value={leaveForm.toDate} onChange={e=>setLeaveForm({...leaveForm, toDate:e.target.value})} required />
                </div>
              </div>
              <div>
                <label style={{fontSize: '12px', color: '#7e869c', display: 'block', marginBottom: '6px', fontWeight: '500'}}>Reason Details</label>
                <textarea className="input-focus-glow" style={{...styles.inputFieldModal, height: '110px', resize: 'none'}} placeholder="Enter reason here..." value={leaveForm.reason} onChange={e=>setLeaveForm({...leaveForm, reason:e.target.value})} required />
              </div>
              <div style={styles.modalActionRowEnd}>
                <button type="button" style={styles.modalCancelBtn} onClick={()=>setShowLeaveModal(false)}>Cancel</button>
                <button type="submit" className="btn-scale-hover" style={styles.modalSubmitBtn}>Submit Request</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
    appContainer: { display: 'flex', height: '100vh', background: '#0d0e12', color: '#f2f4f8', fontFamily: "'Inter', sans-serif", overflow: 'hidden' },
    sidebar: { width: '270px', background: '#14161d', display: 'flex', flexDirection: 'column', padding: '26px', borderRight: '1px solid #1f222c' },
    logoSection: { display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '40px' },
    logoIcon: { background: '#00f5d4', padding: '8px 12px', borderRadius: '8px', fontWeight: 'bold', color: '#0d0e12', fontSize: '17px' },
    logoText: { fontSize: '20px', fontWeight: '700', letterSpacing: '-0.3px', color: '#f2f4f8' },
    userProfileSide: { display: 'flex', gap: '14px', alignItems: 'center', marginBottom: '35px', padding: '14px', background: '#1f222c', borderRadius: '12px', border: '1px solid #2d313f', cursor: 'pointer', transition: 'background-color 0.2s ease' },
    avatarLarge: { width: '40px', height: '40px', borderRadius: '50%', background: '#00f5d4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0d0e12', fontWeight: 'bold', fontSize: '16px' },
    userNameSide: { fontWeight: '600', fontSize: '14px', maxWidth:'140px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', color: '#f2f4f8' },
    userRoleBadge: { background: 'rgba(255, 183, 3, 0.1)', fontSize: '11px', padding: '3px 8px', borderRadius: '5px', color: '#ffb703', fontWeight:'600', marginTop:'4px', display:'inline-block', border: '1px solid rgba(255, 183, 3, 0.15)' },
    navLinks: { flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' },
    navIcon: { marginRight: '10px', fontSize: '17px' },
    navItem: { padding: '12px 16px', borderRadius: '8px', color: '#7e869c', cursor: 'pointer', transition: 'all 0.2s ease', fontSize: '15px', fontWeight: '500', display: 'flex', alignItems: 'center' },
    navActive: { background: 'rgba(0, 245, 212, 0.05)', color: '#00f5d4', fontWeight: '600' },
    signOutPos: { borderTop: '1px solid #1f222c', paddingTop: '18px' },
    dropdownWhite: { position: 'absolute', bottom: '50px', left: '0', width: '100%', background: '#1f222c', border: '1px solid #2d313f', borderRadius: '8px', boxShadow: '0 12px 28px -5px rgba(0,0,0,0.6)', zIndex: 1000, overflow: 'hidden' },
    headerDropdownWhite: { position: 'absolute', top: '55px', right: '0', width: '160px', background: '#1f222c', border: '1px solid #2d313f', borderRadius: '8px', boxShadow: '0 12px 28px -5px rgba(0,0,0,0.6)', zIndex: 1000, padding: '5px 0', overflow: 'hidden' },
    dropdownItem: { padding: '12px 16px', color: '#f2f4f8', cursor: 'pointer', fontSize: '14px' },
    headerDropdownItem: { padding: '12px 16px', color: '#ff5c5c', fontWeight: '600', cursor: 'pointer', fontSize: '14px' },
    notificationWhite: { position: 'absolute', top: '40px', right: '-10px', width: '300px', background: '#1f222c', borderRadius: '12px', border: '1px solid #2d313f', boxShadow: '0 12px 28px -5px rgba(0,0,0,0.6)', zIndex: 2000, overflow: 'hidden' },
    notificationHeaderFlex: { display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: '#14161d', borderBottom: '1px solid #2d313f', fontSize: '13px' },
    notificationBodyEmpty: { padding: '24px 16px', textAlign: 'center', color: '#7e869c', fontSize: '13px' },
    settingsTrigger: { padding: '12px 16px', background: '#1f222c', borderRadius: '8px', cursor: 'pointer', display: 'flex', fontSize: '14px', fontWeight: '500', color: '#7e869c', border: '1px solid #2d313f', transition: 'all 0.2s ease' },
    mainWrapper: { flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', background: '#0d0e12' },
    topHeader: { height: '70px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', padding: '0 45px', borderBottom: '1px solid #1f222c', background: '#14161d' },
    headerRight: { display: 'flex', gap: '24px', alignItems: 'center' },
    iconBell: { fontSize: '20px', cursor: 'pointer', display: 'inline-block', padding: '6px', color: '#7e869c', borderRadius: '50%' },
    professionalAvatarWrapper: { display: 'flex', alignItems: 'center', gap: '12px', background: '#1f222c', padding: '8px 16px', borderRadius: '20px', border: '1px solid #2d313f', cursor: 'pointer' },
    avatarSmallProfessional: { width: '28px', height: '28px', borderRadius: '50%', background: '#00f5d4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0d0e12', fontWeight: 'bold', fontSize: '13px' },
    professionalEmailText: { fontSize: '14px', color: '#f2f4f8', fontWeight: '500', maxWidth: '160px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
    dropdownArrowSymbol: { color: '#525866', fontSize: '11px', marginLeft: '2px' },
    contentArea: { padding: '35px 45px 45px', background: '#0d0e12', minHeight: 'calc(100vh - 70px)', boxSizing: 'border-box' },
    pageTitle: { fontSize: '28px', fontWeight: '700', margin: 0, color: '#f2f4f8', letterSpacing: '-0.4px' },
    subText: { color: '#7e869c', fontSize: '14px', margin: '6px 0 30px' },
    timerCard: { background: '#14161d', borderRadius: '16px', padding: '28px 32px', border: '1px solid #1f222c', marginBottom: '25px' },
    timerGrid: { display: 'grid', gridTemplateColumns: '1.4fr 0.8fr 0.8fr 1fr', alignItems: 'center', gap: '24px' },
    timerValue: { fontSize: '44px', fontWeight: '700', color: '#f2f4f8', fontVariantNumeric: 'tabular-nums', letterSpacing: '0.5px' },
    timerLabel: { color: '#525866', fontSize: '12px', fontWeight: '600', letterSpacing: '0.6px' },
    punchInfoBox: { borderLeft: '1px solid #1f222c', paddingLeft: '24px' },
    punchTimeText: { fontSize: '20px', fontWeight: '600', color: '#f2f4f8', marginTop: '6px' },
    punchAction: { display: 'flex', justifyContent: 'flex-end' },
    punchBtn: { border: 'none', padding: '12px 26px', borderRadius: '8px', fontWeight: '600', fontSize: '14px' },
    stylesStatsMetricsRowGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '20px', marginBottom: '25px' },
    statCard: { background: '#14161d', padding: '22px 26px', borderRadius: '16px', border: '1px solid #1f222c' },
    statLabel: { color: '#525866', fontSize: '12px', fontWeight: '600', letterSpacing: '0.6px' },
    statValue: { fontSize: '32px', fontWeight: '700', marginTop: '8px' },
    bottomGrid: { display: 'grid', gridTemplateColumns: '1.15fr 1fr', gap: '25px' },
    taskFormCard: { background: '#14161d', padding: '28px', borderRadius: '16px', border: '1px solid #1f222c' },
    recentTasksCard: { background: '#14161d', padding: '28px', borderRadius: '16px', border: '1px solid #1f222c', display: 'flex', flexDirection: 'column' },
    cardHeading: { margin: '0 0 20px', fontSize: '17px', fontWeight: '600', color: '#f2f4f8' },
    formStack: { display: 'flex', flexDirection: 'column', gap: '14px' },
    inputFieldFixed: { background: '#0d0e12', border: '1px solid #1f222c', borderRadius: '8px', color: '#fff', padding: '12px 14px', fontSize: '15px', outline:'none' },
    createBtn: { border: 'none', padding: '13px', borderRadius: '8px', fontWeight: '600', fontSize: '14px', cursor: 'pointer' },
    taskList: { display: 'flex', flexDirection: 'column', gap: '12px' },
    taskItem: { background: '#0d0e12', padding: '14px 16px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #1f222c' },
    statusBadge: { padding: '3px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '600' },
    tableWrapper: { background: '#14161d', borderRadius: '16px', border: '1px solid #1f222c', overflow: 'hidden' },
    customTableStructure: { width: '100%', borderCollapse: 'collapse' },
    thCell: { padding: '14px 18px', background: '#0d0e12', color: '#525866', textAlign: 'left', borderBottom: '1px solid #1f222c', fontSize: '12px', fontWeight: '600', letterSpacing: '0.6px' },
    tdCell: { padding: '14px 18px', borderBottom: '1px solid #1f222c', fontSize: '14px', color: '#7e869c' },
    trRowTable: { borderBottom: '1px solid #1f222c' },
    modalOverlayContext: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(13, 14, 18, 0.75)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000 },
    modalContentCard: { background: '#14161d', padding: '28px', borderRadius: '16px', border: '1px solid #1f222c', width: '450px', boxShadow: '0 24px 48px rgba(0,0,0,0.6)' },
    applyLeaveTriggerBtn: { background: 'transparent', color: '#00f5d4', border: '1px solid #00f5d4', padding: '10px 20px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '14px' },
    headerRowFlex: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
    viewPanel: { animation: 'fadeIn 0.25s ease-in-out' },
    chronologicalWrapperDateCard: { background: '#14161d', border: '1px solid #1f222c', borderRadius: '12px', overflow: 'hidden', marginBottom: '15px' },
    chronologicalHeaderTriggerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', cursor: 'pointer', background: '#0d0e12', transition: 'background-color 0.2s ease' },
    chronologicalInnerContentBox: { background: '#14161d', padding: '12px', borderTop: '1px solid #1f222c', display:'flex', flexDirection:'column', gap: '12px' },
    totalTasksCountBadgeMini: { background: 'rgba(0, 245, 212, 0.06)', color: '#00f5d4', fontSize: '12px', padding: '2px 8px', borderRadius: '5px', fontWeight: '600' },
    innerProjectSubWrapperBlock: { border: '1px solid #1f222c', borderRadius: '10px', overflow:'hidden', background: '#14161d' },
    innerProjectSectionBannerTitle: { background: '#0d0e12', padding: '12px 16px', fontWeight: '500', fontSize: '14px', color: '#f2f4f8', borderBottom: '1px solid #1f222c', transition: 'background-color 0.2s ease' },
    dropdownInputFieldStyle: { background: '#0d0e12', border: '1px solid #1f222c', borderRadius: '8px', color: '#ffffff', padding: '12px 14px', fontSize: '15px', outline: 'none', width: '100%', cursor: 'pointer', transition: 'all 0.15s ease' },
    dropdownOptionStyle: { background: '#14161d', color: '#ffffff' },
    inputFieldModal: { background: '#0d0e12', border: '1px solid #1f222c', borderRadius: '8px', color: '#fff', padding: '12px', fontSize: '14px', width: '100%', outline: 'none', boxSizing: 'border-box', transition: 'all 0.15s ease' },
    modalHeaderFlex: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#f2f4f8', marginBottom: '20px' },
    modalActionRowEnd: { display: 'flex', justifyContent: 'flex-end', gap: '14px', marginTop: '12px' },
    modalCancelBtn: { background: 'transparent', border: '1px solid #2d313f', color: '#7e869c', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', transition: 'all 0.15s ease' },
    modalSubmitBtn: { background: '#00f5d4', color: '#0d0e12', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '14px' }
};

export default Dashboard; 