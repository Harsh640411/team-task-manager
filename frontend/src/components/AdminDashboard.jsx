import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [adminData, setAdminData] = useState({ fullName: 'Admin Center', username: 'admin@tasktrack.com' });
  const [allTasks, setAllTasks] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [projectsList, setProjectsList] = useState([]);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [expandedProjectId, setExpandedProjectId] = useState(null);

  const getActiveToken = () => sessionStorage.getItem('token') || localStorage.getItem('token') || '';

  useEffect(() => {
    const activeToken = getActiveToken();
    if (activeToken) {
      fetchAdminDetails();
      fetchSystemMetrics();
      fetchLeaveRequests();
      fetchRealProjects(); 
    }
  }, [activeTab]); 

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = '/login';
  };

  const fetchAdminDetails = async () => {
    const token = getActiveToken();
    if (!token) return;
    try {
      const res = await axios.get('https://team-task-manager-production-fb15.up.railway.app/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data) setAdminData(res.data);
    } catch (err) { console.error("Admin check failed", err); }
  };

  const fetchRealProjects = async () => {
    const token = getActiveToken();
    if (!token) return;
    try {
      const res = await axios.get('https://team-task-manager-production-fb15.up.railway.app/api/projects', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const repoMapping = {
        1: 'https://github.com/Harsh64041/Geo-Sentiment-Analyzer',
        2: 'https://github.com/Harsh64041/face_recognition_system',
        3: 'https://github.com/Harsh64041/Portfolio_Website'
      };

      if (res.data && res.data.length > 0) {
        const structuralData = res.data.map(p => ({
          ...p,
          github_url: repoMapping[p.id] || 'https://github.com/Harsh64041'
        }));
        setProjectsList(structuralData);
      } else {
        setDefaultProjectsWithLinks();
      }
    } catch (err) {
      setDefaultProjectsWithLinks();
    }
  };

  const setDefaultProjectsWithLinks = () => {
    setProjectsList([
      { id: 1, name: 'GEO Sentiment Analyzer', category: 'Cloud Native AWS App', status: 'LIVE', github_url: 'https://github.com/Harsh64041/Geo-Sentiment-Analyzer' }, 
      { id: 2, name: 'Face Recognition Attendance System', category: 'OpenCV / Deep Learning', status: 'LIVE', github_url: 'https://github.com/Harsh64041/face_recognition_system' },
      { id: 3, name: 'Portfolio Website Showcase', category: 'React Framework', status: 'LIVE', github_url: 'https://github.com/Harsh64041/Portfolio_Website' }
    ]);
  };

  const fetchLeaveRequests = async () => {
    const token = getActiveToken();
    if (!token) return;
    try {
      const res = await axios.get('https://team-task-manager-production-fb15.up.railway.app/api/auth/leaves', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data && Array.isArray(res.data)) setLeaveRequests(res.data);
    } catch (err) { console.error("Leaves pulling failed", err); }
  };

  const fetchSystemMetrics = async () => {
    const token = getActiveToken();
    if (!token) return;
    try {
      const taskRes = await axios.get('https://team-task-manager-production-fb15.up.railway.app/api/tasks', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (taskRes.data && Array.isArray(taskRes.data)) {
        setAllTasks(taskRes.data);
      }
    } catch (err) { console.error("Metrics pulling error", err); }
  };

  const handleLeaveAction = async (leaveId, actionStatus) => {
    const token = getActiveToken();
    if (!token) return;
    try {
      await axios.put(`https://team-task-manager-production-fb15.up.railway.app/api/auth/leaves/${leaveId}`, {
        status: actionStatus
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(`Leave request ${actionStatus}! 📄`);
      fetchLeaveRequests();
    } catch (err) { alert("Action processing failed."); }
  };

  const totalCompleted = allTasks.filter(t => String(t.status).toLowerCase() === 'completed').length;
  const completionRate = allTasks.length > 0 ? Math.round((totalCompleted / allTasks.length) * 100) : 0;

  const totalLeavesReceived = leaveRequests.length;
  const totalLeavesApproved = leaveRequests.filter(l => l.status === 'Approved' || l.status === 'approved').length;
  const totalLeavesRejected = leaveRequests.filter(l => l.status === 'Rejected' || l.status === 'rejected').length;
  const pendingLeavesArray = leaveRequests.filter(l => String(l.status).toLowerCase() === 'pending');

  // ⚡ DYNAMIC UNIQUE TEAM DISCOVERY: Extract list of actual system taskers from dynamic data payloads safely
  const uniquePlatformUsersList = [...new Set(allTasks.map(t => {
    if (t.username && t.username !== 'tasker@gmail.com') return t.username;
    if (t.title && String(t.title).includes('(By:')) {
      return `User ID: ${String(t.title).split('(By:')[1].replace(')', '').trim()}`;
    }
    return '';
  }))].filter(userStr => userStr !== '');

  const getLeaderboardData = () => {
    return uniquePlatformUsersList.map(user => {
      const userTasks = allTasks.filter(t => t.username === user || String(t.title).includes(`(By: ${user.replace('User ID: ', '')})`));
      const completed = userTasks.filter(t => String(t.status).toLowerCase() === 'completed').length;
      return { username: user, completed: completed, total: userTasks.length };
    }).sort((a, b) => b.completed - a.completed);
  };

  // ✅ DYNAMIC MATH ENGINE: 100% Correct Calculation Without Matrix Collapses
  const totalLiveDatabaseEngineers = uniquePlatformUsersList.length; // Active Members count (3)

  // Strictly check how many unique bando ki leave approve ho chuki hai
  const activeStaffOnApprovedLeave = uniquePlatformUsersList.filter(user => {
    return leaveRequests.some(l => {
      if (String(l.status).toLowerCase() !== 'approved') return false;
      
      const leaveUser = String(l.username || '').toLowerCase().trim();
      const platformUser = String(user || '').toLowerCase().trim();
      const leaveHandle = leaveUser.split('@')[0];

      return leaveUser === platformUser || platformUser.includes(leaveHandle) || leaveUser.includes(platformUser);
    });
  }).length;

  // Final Output Filters Variables Locked Safely
  const calculatedOfflineCount = activeStaffOnApprovedLeave; // Jitne approved hain utne 'On Leave' (1)
  const calculatedOnlineCount = Math.max(0, totalLiveDatabaseEngineers - calculatedOfflineCount); // Baki bache saare 'Online' (2)

  const toggleProjectExpand = (projectId) => {
    if (expandedProjectId === projectId) {
      setExpandedProjectId(null);
    } else {
      setExpandedProjectId(projectId);
    }
  };

  return (
    <div style={styles.appContainer}>
      {/* 📊 SIDEBAR */}
      <div style={styles.sidebar}>
        <div style={styles.logoSection}>
          <div style={styles.logoIcon}>TT</div>
          <span style={styles.logoText}>Task Track</span>
        </div>
        <div className="nav-item-hover" style={styles.userProfileSide} onClick={() => setShowProfileDropdown(!showProfileDropdown)}>
          <div style={styles.avatarLarge}>AD</div>
          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
            <div style={styles.userNameSide}>{adminData.username || 'admin@tasktrack.com'}</div>
            <div style={styles.userRoleBadge}>QUALITY REVIEWER</div>
          </div>
          {showProfileDropdown && (
            <div style={styles.profileAbsoluteBox}>
              <div className="tr-row-hover" style={styles.dropdownOptionRow} onClick={handleLogout}>Logout Admin →</div>
            </div>
          )}
        </div>
        <nav style={styles.navLinks}>
          <div className={`nav-item-hover ${activeTab === 'dashboard' ? 'nav-item-active-hover' : ''}`} style={{...styles.navItem, ...(activeTab === 'dashboard' ? styles.navActive : {})}} onClick={() => setActiveTab('dashboard')}>
            <span style={styles.navIcon}>📋</span> Dashboard
          </div>
          <div className={`nav-item-hover ${activeTab === 'reviews' ? 'nav-item-active-hover' : ''}`} style={{...styles.navItem, ...(activeTab === 'reviews' ? styles.navActive : {})}} onClick={() => setActiveTab('reviews')}>
            <span style={styles.navIcon}>☑</span> Task Review
          </div>
          <div className={`nav-item-hover ${activeTab === 'leaves' ? 'nav-item-active-hover' : ''}`} style={{...styles.navItem, ...(activeTab === 'leaves' ? styles.navActive : {})}} onClick={() => setActiveTab('leaves')}>
            <span style={styles.navIcon}>📂</span> Leave Management
          </div>
          <div className={`nav-item-hover ${activeTab === 'allocations' ? 'nav-item-active-hover' : ''}`} style={{...styles.navItem, ...(activeTab === 'allocations' ? styles.navActive : {})}} onClick={() => setActiveTab('allocations')}>
            <span style={styles.navIcon}>🏗</span> Projects & Allocations
          </div>
        </nav>
        <div style={styles.signOutPos} onClick={handleLogout}>
          <div className="nav-item-hover" style={{...styles.navItem, color: '#ff5c5c', margin: 0}}>↪ Sign Out</div>
        </div>
      </div>

      {/* 🖥️ MAIN CONTENT AREA CONTAINER */}
      <div style={styles.mainWrapper}>
        <header style={styles.topHeader}>
          <div style={styles.headerRight}>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <span className="btn-scale-hover" style={styles.iconBell} onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}>🔔</span>
              {showNotificationDropdown && (
                <div style={styles.notificationFloatPanel}>
                  <div style={styles.notificationHeaderFlex}><span style={{ fontWeight: '600' }}>Notifications</span><span>0 alerts</span></div>
                  <div style={styles.notificationBodyEmpty}><p>No new alerts available</p></div>
                </div>
              )}
            </div>
            <div style={styles.headerUser}>
              <div style={styles.avatarSmall}>A</div>
              <span style={{ fontSize: '14px', fontWeight: '500', color: '#f2f4f8' }}>{adminData.username?.split('@')[0]} ⌵</span>
            </div>
          </div>
        </header>

        <div style={styles.contentArea}>
          {activeTab === 'dashboard' && (
            <>
              <h1 style={styles.pageTitle}>Quality Reviewer Dashboard</h1>
              <p style={styles.subText}>Managing platform tasks and leaves dynamically</p>
              
              <div style={styles.statsRow}>
                <div className="card-glow-hover" style={styles.statCard}>
                  <div style={styles.statLabel}>TASKS REVIEWED</div>
                  <div style={{...styles.statValue, color: '#ffb703'}}>{totalCompleted}</div>
                </div>
                <div className="card-glow-hover" style={{...styles.statCard, cursor: 'pointer', border: '1px solid #1f222c'}} onClick={() => setActiveTab('leaves')}>
                  <div style={styles.statLabel}>PENDING LEAVES ↗</div>
                  <div style={{...styles.statValue, color: '#ff5c5c'}}>{pendingLeavesArray.length}</div>
                </div>
                <div className="card-glow-hover" style={styles.statCard}>
                  <div style={styles.statLabel}>ACTIVE PROJECTS</div>
                  <div style={{...styles.statValue, color: '#00f5d4'}}>{projectsList.length}</div>
                </div>
              </div>

              <div style={styles.bottomGrid}>
                
                {/* 🏆 FEATURE 3: TASKER PRODUCTIVITY LEADERBOARD */}
                <div className="card-glow-hover" style={styles.taskFormCard}>
                  <h3 style={styles.cardBlockTitle}>🏆 Tasker Productivity Leaderboard ({getLeaderboardData().length} Members)</h3>
                  {getLeaderboardData().length === 0 ? (
                    <div style={styles.emptyContainerCentering}>
                      <div style={{color:'#525866', fontSize:'14px'}}>No task history compiled inside the grid.</div>
                    </div>
                  ) : (
                    <div style={{maxHeight: '220px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px'}}>
                      {getLeaderboardData().map((user, index) => (
                        <div key={index} className="tr-row-hover" style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          background: '#0d0e12', padding: '12px 16px', borderRadius: '10px', border: '1px solid #1f222c'
                        }}>
                          <div style={{display: 'flex', alignItems: 'center', gap: '12px', maxWidth: '65%'}}>
                            <span style={{
                              fontWeight: '700', fontSize: '14px', 
                              color: index === 0 ? '#ffb703' : index === 1 ? '#e2e2e2' : index === 2 ? '#cd7f32' : '#7e869c',
                              width: '20px'
                            }}>
                              #{index + 1}
                            </span>
                            <div style={{fontWeight: '600', fontSize: '14px', color: '#f2f4f8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{user.username}</div>
                          </div>
                          <div style={{textAlign: 'right', minWidth: '35%'}}>
                            <span style={{color: '#00f5d4', fontWeight: '700', fontSize: '14px'}}>{user.completed} </span>
                            <span style={{color: '#7e869c', fontSize: '12px'}}> / {user.total} Done</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 📊 FEATURE 4: TEAM PUNCH-IN METRICS ANALYTICS */}
                <div className="card-glow-hover" style={styles.taskFormCard}>
                  <h3 style={styles.cardBlockTitle}>📊 Team Shift Metrics Summary</h3>
                  <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', height: '80%'}}>
                    <div style={{background: '#0d0e12', padding: '16px', borderRadius: '12px', border: '1px solid #1f222c', display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
                      <span style={{color: '#7e869c', fontSize: '12px', fontWeight: '600', letterSpacing: '0.5px'}}>LIVE SHIFTS ACTIVE</span>
                      <strong style={{color: '#00f5d4', fontSize: '26px', marginTop: '8px'}}>
                        🟢 {calculatedOnlineCount} Online
                      </strong>
                    </div>
                    <div style={{background: '#0d0e12', padding: '16px', borderRadius: '12px', border: '1px solid #1f222c', display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
                      <span style={{color: '#7e869c', fontSize: '12px', fontWeight: '600', letterSpacing: '0.5px'}}>OFFLINE / LEAVE</span>
                      <strong style={{color: '#ffb703', fontSize: '26px', marginTop: '8px'}}>
                        ⚫ {calculatedOfflineCount} On Leave
                      </strong>
                    </div>
                    <div style={{background: '#0d0e12', padding: '16px', borderRadius: '12px', border: '1px solid #1f222c', display: 'flex', flexDirection: 'column', justifyContent: 'center', gridColumn: 'span 2'}}>
                      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                        <span style={{color: '#7e869c', fontSize: '13px', fontWeight: '500'}}>Total Tracked Network Team Members:</span>
                        <strong style={{color: '#9d4edd', fontSize: '18px'}}>{totalLiveDatabaseEngineers} Members</strong>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Leave Requests Pending Review Queue Section */}
              <div className="card-glow-hover" style={{...styles.taskFormCard, marginTop: '25px'}}>
                <h3 style={styles.cardBlockTitle}>Leave Requests Pending Review</h3>
                {pendingLeavesArray.length === 0 ? (
                  <div style={styles.emptyContainerCentering}>
                    <div style={{fontSize:'32px', marginBottom:'10px'}}>📄</div>
                    <div style={{fontWeight:'600', fontSize:'15px', color:'#f2f4f8'}}>No pending requests</div>
                    <div style={{color:'#7e869c', fontSize:'13px', marginTop:'4px'}}>All leave requests have been processed</div>
                  </div>
                ) : (
                  <div style={styles.scrollableMiniQueue}>
                    {pendingLeavesArray.map(req => (
                      <div key={req.id} className="card-glow-hover" style={styles.miniLeaveCardRow}>
                        <div style={{maxWidth: '60%'}}>
                          <div style={{fontWeight:'600', fontSize:'14px', color:'#00f5d4', overflow:'hidden', textOverflow:'ellipsis'}}>{req.username}</div>
                          <div style={{fontSize:'12px', color:'#7e869c', marginTop:'4px'}}>{req.fromDate} to {req.toDate}</div>
                        </div>
                        <div style={{display:'flex', gap:'8px'}}>
                          <button className="btn-scale-hover" onClick={() => handleLeaveAction(req.id, 'Approved')} style={styles.miniAcceptBtn}>✓</button>
                          <button className="btn-scale-hover" onClick={() => handleLeaveAction(req.id, 'Rejected')} style={styles.miniRejectBtn}>✕</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="card-glow-hover" style={{...styles.taskFormCard, marginTop: '25px'}}>
                <h3 style={{...styles.cardBlockTitle, fontSize:'12px', color:'#7e869c', letterSpacing: '0.6px'}}>🛡️ MASTER ADMIN PLATFORM TELEMETRY</h3>
                <div style={styles.telemetryGrid}>
                  <div style={styles.telemetryBox}><span style={{color:'#7e869c'}}>System Health</span><strong style={{color:'#00f5d4'}}> Online</strong></div>
                  <div style={styles.telemetryBox}><span style={{color:'#7e869c'}}>DB Node Pools</span><strong style={{color:'#9d4edd'}}> Connected</strong></div>
                  <div style={styles.telemetryBox}><span style={{color:'#7e869c'}}>Deployment Environment</span><strong style={{color: '#f2f4f8'}}> Railway Production</strong></div>
                </div>
              </div>
            </>
          )}

          {/* ✅ TAB: TASK REVIEW PANEL WITH STRICT ANTI-OVERLAP FILTER & NO SQUARE BRACKETS DISPLAY */}
          {activeTab === 'reviews' && (
            <div style={styles.viewPanel}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'25px'}}>
                <div>
                  <h1 style={styles.pageTitle}>All Tasks Auditing Panel</h1>
                  <span style={{color:'#7e869c', fontSize:'14px'}}>Total Live Network Entries: {allTasks.length} tasks</span>
                </div>
                <div style={styles.pillBadgeMeta}>Avg Completion Rate: {completionRate}%</div>
              </div>

              <div style={{display:'flex', flexDirection:'column', gap:'15px'}}>
                {projectsList.map((proj) => {
                  
                  const projectTasks = allTasks.filter(t => {
                    const taskTitleRaw = String(t.title || '').toLowerCase();
                    const taskDescRaw = String(t.description || '').toLowerCase();
                    const currentProjNameRaw = String(proj.name || '').toLowerCase().trim();
                    const taskProjectId = parseInt(t.project_id);
                    const currentProjId = parseInt(proj.id);

                    if (currentProjId === 2 || currentProjNameRaw.includes('face')) {
                      return taskTitleRaw.includes('face') || taskTitleRaw.includes('attendance') || taskDescRaw.includes('face') || taskProjectId === 2;
                    }

                    if (currentProjId === 3 || currentProjNameRaw.includes('portfolio')) {
                      return taskTitleRaw.includes('portfolio') || taskTitleRaw.includes('website') || taskDescRaw.includes('portfolio') || taskProjectId === 3;
                    }

                    if (currentProjId === 1 || currentProjNameRaw.includes('geo')) {
                      const belongsToFace = taskTitleRaw.includes('face') || taskTitleRaw.includes('attendance') || taskDescRaw.includes('face');
                      const belongsToPortfolio = taskTitleRaw.includes('portfolio') || taskTitleRaw.includes('website') || taskDescRaw.includes('portfolio');
                      
                      if (belongsToFace || belongsToPortfolio || taskProjectId === 2 || taskProjectId === 3) {
                        return false;
                      }
                      return true;
                    }

                    return false;
                  });

                  const completedCount = projectTasks.filter(t => String(t.status).toLowerCase() === 'completed').length;
                  const activeCount = projectTasks.filter(t => String(t.status).toLowerCase() !== 'completed').length;
                  const isExpanded = expandedProjectId === proj.id;
                  const activeMembersCount = [...new Set(projectTasks.map(t => t.username || t.user_id || 'Tasker'))].length;

                  return (
                    <div key={proj.id} style={styles.accordionWrapperHeaderCard}>
                      <div className="tr-row-hover" style={styles.accordionClickableTriggerRow} onClick={() => toggleProjectExpand(proj.id)}>
                        <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
                          <span style={{
                            transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)', 
                            transition:'0.2s', display:'inline-block', fontSize:'11px', color:'#00f5d4'
                          }}>▶</span>
                          <span style={{fontWeight:'600', fontSize:'15px', color:'#f2f4f8'}}>{proj.name}</span>
                          <span style={styles.miniLabelCountBadge}>{projectTasks.length} Tasks</span>
                        </div>
                        <div style={{display:'flex', gap:'25px', fontSize:'13px', fontWeight:'500'}}>
                          <span style={{color:'#7e869c'}}>👥 {activeMembersCount} Users</span>
                          <span style={{color:'#00f5d4'}}>{completedCount} Completed</span>
                          <span style={{color:'#ffb703'}}>{activeCount} Pending</span>
                        </div>
                      </div>

                      {isExpanded && (
                        <div style={styles.accordionInnerContentBox}>
                          {projectTasks.length === 0 ? (
                            <div style={{padding:'25px', color:'#7e869c', textAlign:'center', fontSize:'14px'}}>No taskers have created tasks for this project yet.</div>
                          ) : (
                            <div style={{overflowX: 'auto'}}>
                              <table style={styles.customTableStructure}>
                                <thead>
                                  <tr>
                                    <th style={styles.thCell}>USER / EMAIL</th>
                                    <th style={styles.thCell}>TASK ID</th>
                                    <th style={styles.thCell}>TASK DETAILS</th>
                                    <th style={styles.thCell}>DATE</th>
                                    <th style={styles.thCell}>STATUS STATE</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {projectTasks.map(task => {
                                    let finalUserDisplay = "Tasker";
                                    
                                    if (task.username && task.username !== 'tasker@gmail.com') {
                                      finalUserDisplay = task.username;
                                    } else if (task.user_id) {
                                      finalUserDisplay = `User ID: ${task.user_id}`;
                                    } else if (String(task.title).includes('(By:')) {
                                      finalUserDisplay = `User ID: ${String(task.title).split('(By:')[1].replace(')', '').trim()}`;
                                    }

                                    const cleanTitleDisplay = String(task.title || '').replace(/^\[.*?\]\s*/, '').split('(By:')[0].trim();

                                    return (
                                      <tr key={task.id} className="tr-row-hover" style={styles.trRowTable}>
                                        <td style={{...styles.tdCell, color:'#00f5d4', fontWeight:'600', fontSize:'14px', width: '22%'}}>
                                          👤 {finalUserDisplay}
                                        </td>
                                        <td style={{...styles.tdCell, color:'#525866', fontWeight:'500', fontSize:'14px', width: '12%'}}>
                                          #{task.id ? task.id : 'Auto'}
                                        </td>
                                        <td style={styles.tdCell}>
                                          <div style={{fontWeight:'600', color:'#f2f4f8', fontSize: '15px'}}>{cleanTitleDisplay}</div>
                                          <div style={{fontSize:'13px', color:'#7e869c', marginTop:'4px'}}>{task.description || 'No context attached'}</div>
                                        </td>
                                        <td style={{...styles.tdCell, color:'#7e869c', width: '15%', fontSize: '14px'}}>
                                          {task.created_at ? String(task.created_at).split('T')[0] : new Date().toISOString().split('T')[0]}
                                        </td>
                                        <td style={{...styles.tdCell, width: '15%'}}>
                                          <span style={{
                                            fontWeight:'600', fontSize:'11px', padding:'3px 10px', borderRadius:'5px',
                                            color: String(task.status).toLowerCase() === 'completed' ? '#00f5d4' : '#ffb703',
                                            background: String(task.status).toLowerCase() === 'completed' ? 'rgba(0, 245, 212, 0.06)' : 'rgba(255, 183, 3, 0.06)',
                                            border: `1px solid ${String(task.status).toLowerCase() === 'completed' ? 'rgba(0, 245, 212, 0.12)' : 'rgba(255, 183, 3, 0.12)'}`
                                          }}>{task.status ? task.status.toUpperCase() : 'IN PROGRESS'}</span>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ✅ TAB: LEAVE MANAGEMENT */}
          {activeTab === 'leaves' && (
            <div className="card-glow-hover" style={styles.taskFormCard}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px', borderBottom:'1px solid #1f222c', paddingBottom:'15px'}}>
                <h3 style={styles.cardSectionTitle}>Taskers Leave Requests Management</h3>
                <div style={{fontSize:'14px', color:'#7e869c'}}>
                  Total Received: <strong style={{color:'#f2f4f8'}}>{totalLeavesReceived}</strong> | 
                  Approved: <strong style={{color:'#00f5d4'}}>{totalLeavesApproved}</strong> | 
                  Rejected: <strong style={{color:'#ff5c5c'}}>{totalLeavesRejected}</strong>
                </div>
              </div>

              {leaveRequests.length === 0 ? <p style={{color:'#7e869c', textAlign:'center', padding:'40px', fontSize: '14px'}}>No leave requests recorded inside the system database.</p> : (
                <div style={{overflowX: 'auto'}}>
                  <table style={styles.customTableStructure}>
                    <thead>
                      <tr>
                        <th style={styles.thCell}>USERNAME / EMAIL</th>
                        <th style={styles.thCell}>DURATION (FROM - TO)</th>
                        <th style={styles.thCell}>REASON DETAILS</th>
                        <th style={{...styles.thCell, textAlign: 'center'}}>MANAGEMENT ACTION</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaveRequests.map(req => (
                        <tr key={req.id} className="tr-row-hover" style={styles.trRowTable}>
                          <td style={{...styles.tdCell, color:'#00f5d4', fontWeight:'600'}}>{req.username}</td>
                          <td style={{...styles.tdCell, color:'#f2f4f8'}}>{req.fromDate} <span style={{color:'#7e869c'}}>to</span> {req.toDate}</td>
                          <td style={styles.tdCell}>{req.reason}</td>
                          <td style={{...styles.tdCell, textAlign: 'center', width: '25%'}}>
                            {String(req.status).toLowerCase() === 'pending' ? (
                              <div style={{display:'flex', gap:'12px', justifyContent:'center'}}>
                                <button className="btn-scale-hover" onClick={() => handleLeaveAction(req.id, 'Approved')} style={styles.acceptBtn}>✓ Approve</button>
                                <button className="btn-scale-hover" onClick={() => handleLeaveAction(req.id, 'Rejected')} style={styles.rejectBtn}>✕ Reject</button>
                              </div>
                            ) : (
                              <span style={{
                                fontWeight:'600', 
                                color: req.status === 'Approved' ? '#00f5d4' : '#ff5c5c',
                                background: 'rgba(255,255,255,0.02)',
                                padding: '4px 12px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                border: `1px solid ${req.status === 'Approved' ? 'rgba(0, 245, 212, 0.15)' : 'rgba(255, 92, 92, 0.15)'}`
                              }}>{req.status.toUpperCase()}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ✅ TAB: PROJECTS SHOWCASE */}
          {activeTab === 'allocations' && (
            <>
              <h2 style={{fontSize:'22px', fontWeight: '700', marginBottom:'20px', color: '#f2f4f8', letterSpacing: '-0.3px'}}>Allocated Tech Projects</h2>
              <div style={styles.projectLayoutResponsiveGrid}>
                {projectsList.map((proj) => (
                  <div 
                    key={proj.id} 
                    className="card-glow-hover btn-scale-hover" 
                    style={{...styles.projectLayoutDashboardCard, cursor: 'pointer'}}
                    onClick={() => {
                      if (proj.github_url) {
                        window.open(proj.github_url, '_blank', 'noopener,noreferrer');
                      }
                    }}
                    title="Click to open GitHub Repository 🚀"
                  >
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                      <span style={{fontWeight:'600', fontSize:'15px', color:'#f2f4f8'}}>📂 {proj.name}</span>
                      <span style={styles.liveProjectStatusBadge}>{proj.status || 'LIVE'}</span>
                    </div>
                    <div style={{color:'#7e869c', fontSize:'13px', margin:'12px 0 20px'}}><span style={styles.allocGreenBadge}>ACTIVE</span> {proj.category || 'General'}</div>
                    <button 
                      className="btn-scale-hover" 
                      style={styles.flagToPlButton}
                      onClick={(e) => {
                        e.stopPropagation(); 
                        alert(`Flagged [${proj.name}] to Project Leader context successfully!`);
                      }}
                    >
                      🏳 Flag to PL
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Styles Matrix Registry Definition
const styles = {
  appContainer: { display: 'flex', height: '100vh', background: '#0d0e12', color: '#f2f4f8', fontFamily: "'Inter', sans-serif", overflow: 'hidden' },
  sidebar: { width: '270px', background: '#14161d', display: 'flex', flexDirection: 'column', padding: '26px', borderRight: '1px solid #1f222c' },
  logoSection: { display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '40px' },
  logoIcon: { background: '#00f5d4', padding: '6px 10px', borderRadius: '6px', fontWeight: 'bold', color: '#0d0e12', fontSize: '17px' },
  logoText: { fontSize: '20px', fontWeight: '700', letterSpacing: '-0.3px', color: '#f2f4f8' },
  userProfileSide: { display: 'flex', gap: '14px', alignItems: 'center', marginBottom: '35px', padding: '14px', background: '#1f222c', borderRadius: '12px', border: '1px solid #2d313f', cursor: 'pointer', transition: 'background-color 0.2s ease' },
  avatarLarge: { minWidth: '40px', height: '40px', borderRadius: '50%', background: '#00f5d4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0d0e12', fontWeight: 'bold', fontSize: '15px' },
  userNameSide: { fontWeight: '600', fontSize: '14px', color:'#f2f4f8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  userRoleBadge: { background: 'rgba(255, 183, 3, 0.1)', fontSize: '10px', padding: '3px 8px', borderRadius: '5px', color: '#ffb703', fontWeight:'600', marginTop:'4px', display:'inline-block', border: '1px solid rgba(255, 183, 3, 0.15)' },
  navLinks: { flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' },
  navIcon: { marginRight: '10px', fontSize: '17px' },
  navItem: { padding: '12px 16px', borderRadius: '8px', color: '#7e869c', cursor: 'pointer', transition: 'all 0.2s ease', fontSize: '15px', fontWeight: '500', display: 'flex', alignItems: 'center' },
  navActive: { background: 'rgba(0, 245, 212, 0.05)', color: '#00f5d4', fontWeight: '600' },
  signOutPos: { borderTop: '1px solid #1f222c', paddingTop: '18px' },
  mainWrapper: { flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', background: '#0d0e12' },
  topHeader: { height: '70px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', borderBottom: '1px solid #1f222c', paddingRight:'45px', background: '#14161d' },
  headerRight: { display: 'flex', gap: '24px', alignItems: 'center' },
  headerUser: { display: 'flex', alignItems: 'center', gap: '12px' },
  iconBell: { fontSize: '20px', cursor: 'pointer', display: 'inline-block', padding: '6px', color: '#7e869c', borderRadius: '50%' },
  avatarSmall: { width: '28px', height: '28px', borderRadius: '50%', background: '#00f5d4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0d0e12', fontWeight: 'bold', fontSize: '13px' },
  contentArea: { padding: '35px 45px 45px', boxSizing: 'border-box' },
  pageTitle: { fontSize: '28px', fontWeight: '700', margin: 0, color: '#f2f4f8', letterSpacing: '-0.4px' },
  subText: { color: '#7e869c', fontSize: '14px', margin: '6px 0 30px' },
  statsRow: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '25px' },
  statCard: { background: '#14161d', padding: '22px 26px', borderRadius: '16px', border: '1px solid #1f222c' },
  statLabel: { color: '#525866', fontSize: '12px', fontWeight: '600', letterSpacing: '0.6px' },
  statValue: { fontSize: '32px', fontWeight: '700', marginTop: '8px' },
  taskFormCard: { background: '#14161d', padding: '28px', borderRadius: '16px', border: '1px solid #1f222c' },
  cardSectionTitle: { fontSize: '17px', fontWeight: '600', margin: 0, color: '#f2f4f8' },
  profileAbsoluteBox: { position: 'absolute', top: '75px', left: '0', width: '100%', background: '#1f222c', borderRadius: '8px', border: '1px solid #2d313f', zIndex: 9999, overflow: 'hidden', boxShadow: '0 12px 28px -5 rgba(0,0,0,0.6)' },
  dropdownOptionRow: { padding: '12px 16px', color: '#ff5c5c', fontWeight: '600', cursor: 'pointer', fontSize: '14px' },
  notificationFloatPanel: { position: 'absolute', top: '40px', right: '-10px', width: '300px', background: '#1f222c', borderRadius: '12px', border: '1px solid #2d313f', zIndex: 10000, boxShadow: '0 12px 28px -5 rgba(0,0,0,0.6)', overflow: 'hidden' },
  notificationHeaderFlex: { display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: '#14161d', fontSize: '13px' },
  notificationBodyEmpty: { padding: '24px 16px', textAlign: 'center', color: '#7e869c', fontSize: '13px' },
  projectLayoutResponsiveGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '25px' },
  projectLayoutDashboardCard: { background: '#14161d', border: '1px solid #1f222c', borderRadius: '16px', padding: '24px', transition: 'all 0.2s ease-in-out' },
  liveProjectStatusBadge: { background: 'rgba(0, 245, 212, 0.06)', color: '#00f5d4', padding: '3px 10px', borderRadius: '5px', fontSize: '11px', fontWeight: '600' },
  allocGreenBadge: { background: 'rgba(0, 245, 212, 0.06)', color: '#00f5d4', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: '600' },
  flagToPlButton: { width: '100%', background: 'transparent', border: '1px solid #2d313f', color: '#7e869c', padding: '11px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' },
  customTableStructure: { width: '100%', borderCollapse: 'collapse', marginTop: '15px' },
  thCell: { padding: '14px 18px', background: '#0d0e12', color: '#525866', textAlign: 'left', fontSize: '12px', borderBottom: '1px solid #1f222c', fontWeight: '600', letterSpacing: '0.6px' },
  tdCell: { padding: '14px 18px', borderBottom: '1px solid #1f222c', fontSize: '14px', color: '#7e869c' },
  trRowTable: { borderBottom: '1px solid #1f222c' },
  acceptBtn: { background:'#00f5d4', color:'#0d0e12', border:'none', padding:'8px 16px', borderRadius:'6px', fontWeight:'600', cursor:'pointer', fontSize:'13px' },
  rejectBtn: { background:'#ff5c5c', color:'white', border:'none', padding:'8px 16px', borderRadius:'6px', fontWeight:'600', cursor:'pointer', fontSize:'13px' },
  bottomGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px' },
  cardBlockTitle: { fontSize: '17px', fontWeight: '600', color: '#f2f4f8', marginBottom: '20px' },
  emptyContainerCentering: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '50px 0', color: '#525866' },
  scrollableMiniQueue: { maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' },
  miniLeaveCardRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0d0e12', padding: '14px 16px', borderRadius: '10px', border: '1px solid #1f222c' },
  miniAcceptBtn: { background: '#00f5d4', color: '#0d0e12', border: 'none', borderRadius: '6px', padding: '6px 12px', fontWeight: '600', cursor: 'pointer', fontSize: '13px' },
  miniRejectBtn: { background: '#ff5c5c', color: 'white', border: 'none', borderRadius: '6px', padding: '6px 12px', fontWeight: '600', cursor: 'pointer', fontSize: '13px' },
  telemetryGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginTop: '10px' },
  telemetryBox: { background: '#0d0e12', padding: '14px 18px', borderRadius: '8px', border: '1px solid #1f222c', fontSize: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  accordionWrapperHeaderCard: { background: '#14161d', border: '1px solid #1f222c', borderRadius: '12px', overflow: 'hidden', marginBottom: '15px' },
  accordionClickableTriggerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', cursor: 'pointer', background: '#0d0e12' },
  accordionInnerContentBox: { background: '#14161d', padding: '14px', borderTop: '1px solid #1f222c', display:'flex', flexDirection:'column', gap: '12px' },
  miniLabelCountBadge: { background: 'rgba(0, 245, 212, 0.06)', color: '#00f5d4', fontSize: '12px', padding: '2px 8px', borderRadius: '5px', fontWeight: '600' },
  pillBadgeMeta: { background: 'rgba(255,255,255,0.02)', padding: '6px 14px', borderRadius: '30px', fontSize: '13px', border: '1px solid #1f222c', color: '#7e869c', fontWeight: '500' }
};

export default AdminDashboard;