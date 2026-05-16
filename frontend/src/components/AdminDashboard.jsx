import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [adminData, setAdminData] = useState({ fullName: 'Admin Center', username: 'admin@tasktrack.com' });
  const [allTasks, setAllTasks] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  
  // ✅ Dynamic Projects List (Pulled Live from Database)
  const [projectsList, setProjectsList] = useState([]);
  
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [expandedProjectId, setExpandedProjectId] = useState(null);

  useEffect(() => {
    fetchAdminDetails();
    fetchSystemMetrics();
    fetchLeaveRequests();
    fetchRealProjects(); // ✅ Sync with the database projects configuration
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  const fetchAdminDetails = async () => {
    try {
      const res = await axios.get('https://team-task-manager-production-fb15.up.railway.app/api/auth/me', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.data) setAdminData(res.data);
    } catch (err) { console.error("Admin check failed", err); }
  };

  // ✅ Loads the Dynamic 3 Core Engineering Track IDs from Database
  const fetchRealProjects = async () => {
    try {
      const res = await axios.get('https://team-task-manager-production-fb15.up.railway.app/api/projects', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.data && res.data.length > 0) {
        setProjectsList(res.data);
      } else {
        // Safe fallbacks matching database schema descriptors
        setProjectsList([
          { id: 1, name: 'GEO Sentiment Analyzer', category: 'Cloud Native AWS App', status: 'LIVE' }, 
          { id: 2, name: 'Face Recognition Attendance System', category: 'OpenCV / Deep Learning', status: 'LIVE' },
          { id: 3, name: 'Portfolio Website Showcase', category: 'React Framework', status: 'LIVE' }
        ]);
      }
    } catch (err) {
      setProjectsList([
        { id: 1, name: 'GEO Sentiment Analyzer', category: 'Cloud Native AWS App', status: 'LIVE' }, 
        { id: 2, name: 'Face Recognition Attendance System', category: 'OpenCV / Deep Learning', status: 'LIVE' },
        { id: 3, name: 'Portfolio Website Showcase', category: 'React Framework', status: 'LIVE' }
      ]);
    }
  };

  const fetchLeaveRequests = async () => {
    try {
      const res = await axios.get('https://team-task-manager-production-fb15.up.railway.app/api/auth/leaves', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.data && Array.isArray(res.data)) setLeaveRequests(res.data);
    } catch (err) { console.error("Leaves pulling failed", err); }
  };

  const fetchSystemMetrics = async () => {
    try {
      const token = localStorage.getItem('token');
      const taskRes = await axios.get('https://team-task-manager-production-fb15.up.railway.app/api/tasks', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (taskRes.data && Array.isArray(taskRes.data)) setAllTasks(taskRes.data);
    } catch (err) { console.error("Metrics pulling error", err); }
  };

  const handleLeaveAction = async (leaveId, actionStatus) => {
    try {
      await axios.put(`https://team-task-manager-production-fb15.up.railway.app/api/auth/leaves/${leaveId}`, {
        status: actionStatus
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      alert(`Leave request ${actionStatus}! 📄`);
      fetchLeaveRequests();
    } catch (err) { alert("Action processing failed."); }
  };

  const totalCompleted = allTasks.filter(t => t.status === 'Completed').length;
  const completionRate = allTasks.length > 0 ? Math.round((totalCompleted / allTasks.length) * 100) : 0;

  const totalLeavesReceived = leaveRequests.length;
  const totalLeavesApproved = leaveRequests.filter(l => l.status === 'Approved').length;
  const totalLeavesRejected = leaveRequests.filter(l => l.status === 'Rejected').length;
  const pendingLeavesArray = leaveRequests.filter(l => l.status === 'Pending' || l.status === 'pending');

  const toggleProjectExpand = (projectId) => {
    if (expandedProjectId === projectId) {
      setExpandedProjectId(null);
    } else {
      setExpandedProjectId(projectId);
    }
  };

  return (
    <div style={styles.appContainer}>
      {/* 📊 LEFT NAVIGATION SIDEBAR BAR */}
      <div style={styles.sidebar}>
        <div style={styles.logoSection}><div style={styles.logoIcon}>TT</div><span style={styles.logoText}>Task Track</span></div>
        <div style={{...styles.userProfileSide, position: 'relative', cursor: 'pointer'}} onClick={() => setShowProfileDropdown(!showProfileDropdown)}>
          <div style={styles.avatarLarge}>AD</div>
          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
            <div style={styles.userNameSide}>{adminData.username || 'admin@gmail.com'}</div>
            <div style={styles.userRoleBadge}>QUALITY REVIEWER</div>
          </div>
          {showProfileDropdown && (
            <div style={styles.profileAbsoluteBox}><div style={styles.dropdownOptionRow} onClick={handleLogout}>↪ Sign Out Admin</div></div>
          )}
        </div>
        <nav style={styles.navLinks}>
          <div style={{...styles.navItem, ...(activeTab === 'dashboard' ? styles.navActive : {})}} onClick={() => setActiveTab('dashboard')}>📋 Dashboard</div>
          <div style={{...styles.navItem, ...(activeTab === 'reviews' ? styles.navActive : {})}} onClick={() => setActiveTab('reviews')}>☑ Task Review</div>
          <div style={{...styles.navItem, ...(activeTab === 'leaves' ? styles.navActive : {})}} onClick={() => setActiveTab('leaves')}>📂 Leave Management</div>
          <div style={{...styles.navItem, ...(activeTab === 'allocations' ? styles.navActive : {})}} onClick={() => setActiveTab('allocations')}>🏗 Projects and Allocations</div>
        </nav>
        <div style={styles.signOutPos} onClick={handleLogout}><div style={{...styles.navItem, color: '#ef4444'}}>↪ Sign Out</div></div>
      </div>

      {/* 🖥️ MAIN PANEL CONTAINER */}
      <div style={styles.mainWrapper}>
        <header style={styles.topHeader}>
          <div style={styles.headerRight}>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <span style={{ fontSize: '22px', cursor: 'pointer', color: '#ffb300' }} onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}>🔔</span>
              {showNotificationDropdown && (
                <div style={styles.notificationFloatPanel}>
                  <div style={styles.notificationHeaderFlex}><span style={{ fontWeight: 'bold' }}>Notifications</span><span>0 alerts</span></div>
                  <div style={styles.notificationBodyEmpty}><p>No new alerts available</p></div>
                </div>
              )}
            </div>
            <div style={styles.headerUser}><div style={styles.avatarSmall}>A</div><span style={{ fontSize: '16px', fontWeight: '500' }}>{adminData.username?.split('@')[0]} ⌵</span></div>
          </div>
        </header>

        <div style={styles.contentArea}>
          {activeTab === 'dashboard' && (
            <>
              <h1 style={styles.pageTitle}>Quality Reviewer Dashboard</h1>
              <p style={styles.subText}>Managing platform tasks and leaves dynamically</p>
              
              <div style={styles.statsRow}>
                <div style={styles.statCard}><div style={styles.statLabel}>TASKS REVIEWED</div><div style={styles.statValue}>{totalCompleted}</div></div>
                <div style={{...styles.statCard, cursor: 'pointer', border: '1px solid #00bcd4'}} onClick={() => setActiveTab('leaves')}>
                  <div style={styles.statLabel}>PENDING LEAVES ↗</div>
                  <div style={styles.statValue}>{pendingLeavesArray.length}</div>
                </div>
                <div style={styles.statCard}><div style={styles.statLabel}>ACTIVE PROJECTS</div><div style={styles.statValue}>{projectsList.length}</div></div>
              </div>

              <div style={styles.bottomGrid}>
                <div style={styles.taskFormCard}>
                  <h3 style={styles.cardBlockTitle}>My Taskers</h3>
                  <div style={styles.emptyContainerCentering}>
                    <div style={{fontSize:'32px', marginBottom:'10px'}}>👥</div>
                    <div style={{fontWeight:'600', fontSize:'15px', color:'#fff'}}>No taskers assigned</div>
                    <div style={{color:'#64748b', fontSize:'13px', marginTop:'4px'}}>No taskers are currently assigned to you</div>
                  </div>
                </div>

                <div style={styles.taskFormCard}>
                  <h3 style={styles.cardBlockTitle}>Leave Requests Pending</h3>
                  {pendingLeavesArray.length === 0 ? (
                    <div style={styles.emptyContainerCentering}>
                      <div style={{fontSize:'32px', marginBottom:'10px'}}>📄</div>
                      <div style={{fontWeight:'600', fontSize:'15px', color:'#fff'}}>No pending requests</div>
                      <div style={{color:'#64748b', fontSize:'13px', marginTop:'4px'}}>All leave requests have been processed</div>
                    </div>
                  ) : (
                    <div style={styles.scrollableMiniQueue}>
                      {pendingLeavesArray.map(req => (
                        <div key={req.id} style={styles.miniLeaveCardRow}>
                          <div style={{maxWidth: '60%'}}>
                            <div style={{fontWeight:'bold', fontSize:'13px', color:'#00bcd4', overflow:'hidden', textOverflow:'ellipsis'}}>{req.username}</div>
                            <div style={{fontSize:'12px', color:'#64748b', marginTop:'3px'}}>{req.fromDate} to {req.toDate}</div>
                          </div>
                          <div style={{display:'flex', gap:'6px'}}>
                            <button onClick={() => handleLeaveAction(req.id, 'Approved')} style={styles.miniAcceptBtn}>✓</button>
                            <button onClick={() => handleLeaveAction(req.id, 'Rejected')} style={styles.miniRejectBtn}>✕</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div style={{...styles.taskFormCard, marginTop: '30px'}}>
                <h3 style={{...styles.cardBlockTitle, fontSize:'15px', color:'#8a94a6'}}>🛡️ MASTER ADMIN PLATFORM TELEMETRY</h3>
                <div style={styles.telemetryGrid}>
                  <div style={styles.telemetryBox}><span style={{color:'#64748b'}}>System Health</span><strong style={{color:'#00e676'}}> Online</strong></div>
                  <div style={styles.telemetryBox}><span style={{color:'#64748b'}}>DB Node Pools</span><strong style={{color:'#00bcd4'}}> Connected</strong></div>
                  <div style={styles.telemetryBox}><span style={{color:'#64748b'}}>Deployment Environment</span><strong> Railway Production</strong></div>
                </div>
              </div>
            </>
          )}

          {/* ✅ TAB: TASK REVIEW COMPONENT WITH COLLAPSIBLE MATCHING LOGIC */}
          {activeTab === 'reviews' && (
            <div style={styles.viewPanel}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'25px'}}>
                <div>
                  <h1 style={styles.pageTitle}>All Tasks Auditing Panel</h1>
                  <span style={{color:'#64748b', fontSize:'14px'}}>Total Live Network Entries: {allTasks.length} tasks</span>
                </div>
                <div style={styles.pillBadgeMeta}>Avg Completion Rate: {completionRate}%</div>
              </div>

              <div style={{display:'flex', flexDirection:'column', gap:'15px'}}>
                {projectsList.map((proj) => {
                  const projectTasks = allTasks.filter(t => parseInt(t.project_id) === parseInt(proj.id));
                  const completedCount = projectTasks.filter(t => t.status === 'Completed').length;
                  const activeCount = projectTasks.filter(t => t.status !== 'Completed').length;
                  const isExpanded = expandedProjectId === proj.id;
                  const activeMembersCount = [...new Set(projectTasks.map(t => t.username || 'Tasker'))].length;

                  return (
                    <div key={proj.id} style={styles.accordionWrapperHeaderCard}>
                      <div style={styles.accordionClickableTriggerRow} onClick={() => toggleProjectExpand(proj.id)}>
                        <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
                          <span style={{
                            transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)', 
                            transition:'0.2s', display:'inline-block', fontSize:'14px', color:'#00bcd4', fontWeight:'bold'
                          }}>▶</span>
                          <span style={{fontWeight:'700', fontSize:'15px', color:'#fff'}}>{proj.name}</span>
                          <span style={styles.miniLabelCountBadge}>{projectTasks.length} Tasks</span>
                        </div>
                        <div style={{display:'flex', gap:'25px', fontSize:'13px', fontWeight:'500'}}>
                          <span style={{color:'#64748b'}}>👥 {activeMembersCount} Members Active</span>
                          <span style={{color:'#00e676'}}>{completedCount} Completed</span>
                          <span style={{color:'#eb9b00'}}>{activeCount} In Progress</span>
                        </div>
                      </div>

                      {isExpanded && (
                        <div style={styles.accordionInnerContentBox}>
                          {projectTasks.length === 0 ? (
                            <div style={{padding:'20px', color:'#64748b', textAlign:'center', fontSize:'14px'}}>No taskers have created tasks for this project yet.</div>
                          ) : (
                            <table style={styles.customTableStructure}>
                              <thead>
                                <tr>
                                  <th style={styles.thCell}>TASK ID</th>
                                  <th style={styles.thCell}>TASK DETAILS / RECENT ACTIVITY</th>
                                  <th style={styles.thCell}>STATUS STATE</th>
                                </tr>
                              </thead>
                              <tbody>
                                {projectTasks.map(task => (
                                  <tr key={task.id} style={styles.trRowTable}>
                                    <td style={{...styles.tdCell, color:'#8a94a6', fontWeight:'600', fontSize:'13px'}}>#{891360 + task.id}</td>
                                    <td style={styles.tdCell}>
                                      <div style={{fontWeight:'bold', color:'#fff'}}>{task.title}</div>
                                      <div style={{fontSize:'12px', color:'#64748b', marginTop:'4px'}}>{task.description || 'No context attached'}</div>
                                    </td>
                                    <td style={styles.tdCell}>
                                      <span style={{
                                        fontWeight:'bold', fontSize:'12px', padding:'4px 8px', borderRadius:'6px',
                                        color: task.status === 'Completed' ? '#00e676' : '#eb9b00',
                                        background: task.status === 'Completed' ? 'rgba(0, 230, 118, 0.05)' : 'rgba(235, 155, 0, 0.05)'
                                      }}>
                                        {task.status ? task.status.toUpperCase() : 'IN PROGRESS'}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB: LEAVE MANAGEMENT COMPONENT */}
          {activeTab === 'leaves' && (
            <div style={styles.taskFormCard}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px', borderBottom:'1px solid #162235', paddingBottom:'15px'}}>
                <h3 style={styles.cardSectionTitle}>Taskers Leave Requests Management</h3>
                <div style={{fontSize:'14px', color:'#8a94a6'}}>
                  Total Received: <strong style={{color:'#fff'}}>{totalLeavesReceived}</strong> | 
                  Approved: <strong style={{color:'#00e676'}}>{totalLeavesApproved}</strong> | 
                  Rejected: <strong style={{color:'#ef4444'}}>{totalLeavesRejected}</strong>
                </div>
              </div>

              {leaveRequests.length === 0 ? <p style={{color:'#64748b', textAlign:'center', padding:'20px'}}>No leave requests recorded inside the system database.</p> : (
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
                        <tr key={req.id} style={styles.trRowTable}>
                          <td style={{...styles.tdCell, color:'#00bcd4', fontWeight:'600'}}>{req.username}</td>
                          <td style={{...styles.tdCell, color:'#daffde'}}>{req.fromDate} <span style={{color:'#64748b'}}>to</span> {req.toDate}</td>
                          <td style={styles.tdCell}>{req.reason}</td>
                          <td style={{...styles.tdCell, textAlign: 'center'}}>
                            {req.status === 'Pending' || req.status === 'pending' ? (
                              <div style={{display:'flex', gap:'10px', justifyContent:'center'}}>
                                <button onClick={() => handleLeaveAction(req.id, 'Approved')} style={styles.acceptBtn}>✓ Approve</button>
                                <button onClick={() => handleLeaveAction(req.id, 'Rejected')} style={styles.rejectBtn}>✕ Reject</button>
                              </div>
                            ) : (
                              <span style={{
                                fontWeight:'bold', 
                                color: req.status === 'Approved' ? '#00e676' : '#ef4444',
                                background: 'rgba(255,255,255,0.02)',
                                padding: '6px 12px',
                                borderRadius: '6px',
                                fontSize: '12px'
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

          {/* TAB: PROJECTS SHOWCASE */}
          {activeTab === 'allocations' && (
            <>
              <h2 style={{fontSize:'22px', marginBottom:'20px'}}>Allocated Tech Projects</h2>
              <div style={styles.projectLayoutResponsiveGrid}>
                {projectsList.map((proj) => (
                  <div key={proj.id} style={styles.projectLayoutDashboardCard}>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                      <span style={{fontWeight:'bold', fontSize:'15px', color:'#fff'}}>{proj.name}</span>
                      <span style={styles.liveProjectStatusBadge}>{proj.status || 'LIVE'}</span>
                    </div>
                    <div style={{color:'#64748b', fontSize:'13px', margin:'12px 0 20px'}}><span style={styles.allocGreenBadge}>ACTIVE</span> {proj.category || 'General'}</div>
                    <button style={styles.flagToPlButton}>🏳 Flag to PL</button>
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
  appContainer: { display: 'flex', height: '100vh', background: '#090d16', color: 'white', fontFamily: "'Inter', sans-serif", overflow: 'hidden' },
  sidebar: { width: '280px', background: '#0b111e', display: 'flex', flexDirection: 'column', padding: '25px', borderRight: '1px solid #162235' },
  logoSection: { display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '40px' },
  logoIcon: { background: '#00bcd4', padding: '10px', borderRadius: '10px', fontWeight: 'bold', color: 'black' },
  logoText: { fontSize: '22px', fontWeight: 'bold', color: '#fff' },
  userProfileSide: { display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '35px', background: 'rgba(255,255,255,0.02)', padding:'12px', borderRadius:'12px' },
  avatarLarge: { minWidth: '45px', height: '45px', borderRadius: '50%', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00bcd4', fontWeight: 'bold' },
  userNameSide: { fontWeight: '600', fontSize: '13px', color:'#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  userRoleBadge: { background: '#eb9b00', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', color: 'black', fontWeight:'bold', marginTop:'4px' },
  navLinks: { flex: 1 },
  navItem: { padding: '12px 16px', borderRadius: '8px', color: '#8a94a6', cursor: 'pointer', marginBottom: '6px', fontSize: '15px' },
  navActive: { background: 'rgba(0, 188, 212, 0.08)', color: '#00bcd4' },
  signOutPos: { borderTop: '1px solid #162235', paddingTop: '15px' },
  mainWrapper: { flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', background: '#090d16' },
  topHeader: { height: '70px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', borderBottom: '1px solid #162235', paddingRight:'40px' },
  headerRight: { display: 'flex', gap: '25px', alignItems: 'center' },
  headerUser: { display: 'flex', alignItems: 'center', gap: '10px' },
  avatarSmall: { width: '32px', height: '32px', borderRadius: '50%', background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' },
  contentArea: { padding: '35px 40px' },
  pageTitle: { fontSize: '26px', fontWeight: 'bold', margin: 0 },
  subText: { color: '#64748b', fontSize: '14px', marginTop: '6px' },
  statsRow: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '35px' },
  statCard: { background: '#0b111e', padding: '24px', borderRadius: '14px', border: '1px solid #162235' },
  statLabel: { color: '#64748b', fontSize: '12px', fontWeight: '600' },
  statValue: { fontSize: '32px', fontWeight: 'bold', marginTop: '14px' },
  taskFormCard: { background: '#0b111e', padding: '25px', borderRadius: '16px', border: '1px solid #162235' },
  cardSectionTitle: { fontSize: '18px', fontWeight: 'bold', margin: 0 },
  profileAbsoluteBox: { position: 'absolute', top: '75px', left: '10px', width: '230px', background: '#0b111e', borderRadius: '8px', border: '1px solid #162235', zIndex: 9999 },
  dropdownOptionRow: { padding: '12px 16px', color: '#ef4444', fontWeight: 'bold', cursor: 'pointer' },
  notificationFloatPanel: { position: 'absolute', top: '45px', right: '-10px', width: '300px', background: '#0b111e', borderRadius: '12px', border: '1px solid #162235', zIndex: 10000 },
  notificationHeaderFlex: { display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: '#121b2c' },
  notificationBodyEmpty: { padding: '25px 16px', textAlign: 'center', color: '#64748b' },
  projectLayoutResponsiveGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' },
  projectLayoutDashboardCard: { background: '#0b111e', border: '1px solid #162235', borderRadius: '14px', padding: '20px' },
  liveProjectStatusBadge: { background: 'rgba(0, 230, 118, 0.1)', color: '#00e676', padding: '3px 8px', borderRadius: '6px', fontSize: '11px' },
  allocGreenBadge: { background: 'rgba(0, 230, 118, 0.08)', color: '#00e676', padding: '2px 6px', borderRadius: '4px', fontSize: '11px' },
  flagToPlButton: { width: '100%', background: 'transparent', border: '1px solid #162235', color: '#8a94a6', padding: '10px', borderRadius: '8px', cursor: 'pointer' },
  customTableStructure: { width: '100%', borderCollapse: 'collapse', marginTop: '15px' },
  thCell: { padding: '12px 15px', background: '#121b2c', color: '#8a94a6', textAlign: 'left', fontSize: '13px', borderBottom: '2px solid #162235' },
  tdCell: { padding: '14px 15px', borderBottom: '1px solid #162235', fontSize: '14px', color: '#fff' },
  trRowTable: { background: 'transparent', transition: '0.2s' },
  acceptBtn: { background:'#00e676', color:'black', border:'none', padding:'6px 12px', borderRadius:'6px', fontWeight:'bold', cursor:'pointer', fontSize:'13px' },
  rejectBtn: { background:'#ef4444', color:'white', border:'none', padding:'6px 12px', borderRadius:'6px', fontWeight:'bold', cursor:'pointer', fontSize:'13px' },
  bottomGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '5px' },
  cardBlockTitle: { fontSize: '16px', fontWeight: 'bold', color: '#fff', marginBottom: '15px' },
  emptyContainerCentering: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '35px 0', color: '#64748b' },
  scrollableMiniQueue: { maxHeight: '160px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' },
  miniLeaveCardRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#060a12', padding: '10px 14px', borderRadius: '8px', border: '1px solid #162235' },
  miniAcceptBtn: { background: '#00e676', color: 'black', border: 'none', borderRadius: '4px', padding: '4px 10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' },
  miniRejectBtn: { background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' },
  telemetryGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginTop: '10px' },
  telemetryBox: { background: '#060a12', padding: '12px', borderRadius: '8px', border: '1px solid #162235', fontSize: '13px', display: 'flex', justifyContent: 'space-between' },
  accordionWrapperHeaderCard: { background: '#0b111e', border: '1px solid #162235', borderRadius: '12px', overflow: 'hidden' },
  accordionClickableTriggerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', cursor: 'pointer', background: '#0e1626', transition: '0.2s' },
  accordionInnerContentBox: { background: '#060a12', padding: '10px 24px 20px', borderTop: '1px solid #162235' },
  miniLabelCountBadge: { background: 'rgba(0, 188, 212, 0.15)', color: '#00bcd4', fontSize: '12px', padding: '2px 8px', borderRadius: '20px', fontWeight: 'bold' },
  pillBadgeMeta: { background: 'rgba(255,255,255,0.02)', padding: '6px 14px', borderRadius: '30px', fontSize: '13px', border: '1px solid #162235', color: '#8a94a6' }
};

export default AdminDashboard;