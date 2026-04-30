import React, { useEffect, useState, useContext } from 'react';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [projects, setProjects] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const projRes = await api.get('/projects');
      setProjects(projRes.data);

      // Fetch tasks for all projects
      const taskPromises = projRes.data.map(p => api.get(`/tasks?project_id=${p.id}`));
      const taskResults = await Promise.all(taskPromises);
      const tasks = taskResults.flatMap(r => r.data);
      setAllTasks(tasks);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh', color: 'var(--text-muted)' }}>
        Loading dashboard...
      </div>
    );
  }

  const isAdmin = user?.role === 'admin';

  const todoTasks = allTasks.filter(t => t.status === 'todo');
  const inProgressTasks = allTasks.filter(t => t.status === 'inprogress');
  const doneTasks = allTasks.filter(t => t.status === 'done');
  const highPriorityTasks = allTasks.filter(t => t.priority === 'high' && t.status !== 'done');
  const myTasks = allTasks.filter(t => t.assigned_to === user?.id);
  const myDone = myTasks.filter(t => t.status === 'done');
  const myInProgress = myTasks.filter(t => t.status === 'inprogress');

  const completionRate = allTasks.length > 0 ? Math.round((doneTasks.length / allTasks.length) * 100) : 0;

  // Simulated recent activities from tasks
  const recentActivities = allTasks
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5)
    .map(t => ({
      text: `Task "${t.title}" — ${t.status}`,
      time: new Date(t.created_at).toLocaleDateString(),
      color: t.status === 'done' ? 'green' : t.status === 'inprogress' ? 'blue' : 'orange'
    }));

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            {isAdmin ? 'Admin Dashboard' : 'My Dashboard'}
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Welcome back, {user?.name} 👋
          </p>
        </div>
      </div>

      {/* ============ ADMIN DASHBOARD ============ */}
      {isAdmin && (
        <>
          {/* Stats Row */}
          <div className="grid-stats">
            <div className="stat-card blue animate-fade-in stagger-1">
              <div className="stat-label">Total Projects</div>
              <div className="stat-value blue">{projects.length}</div>
              <div className="stat-footer">Active workspaces</div>
            </div>
            <div className="stat-card green animate-fade-in stagger-2">
              <div className="stat-label">Completed Tasks</div>
              <div className="stat-value green">{doneTasks.length}</div>
              <div className="stat-footer">{completionRate}% completion rate</div>
            </div>
            <div className="stat-card orange animate-fade-in stagger-3">
              <div className="stat-label">In Progress</div>
              <div className="stat-value orange">{inProgressTasks.length}</div>
              <div className="stat-footer">Tasks being worked on</div>
            </div>
            <div className="stat-card red animate-fade-in stagger-4">
              <div className="stat-label">Urgent Tasks</div>
              <div className="stat-value red">{highPriorityTasks.length}</div>
              <div className="stat-footer">High priority, not done</div>
            </div>
            <div className="stat-card purple animate-fade-in stagger-5">
              <div className="stat-label">Todo Backlog</div>
              <div className="stat-value purple">{todoTasks.length}</div>
              <div className="stat-footer">Waiting to start</div>
            </div>
            <div className="stat-card pink animate-fade-in stagger-6">
              <div className="stat-label">Total Tasks</div>
              <div className="stat-value pink">{allTasks.length}</div>
              <div className="stat-footer">Across all projects</div>
            </div>
          </div>

          {/* Two-column: Pipeline + Urgent */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '2rem' }}>
            <div className="glass-panel no-hover animate-fade-in stagger-3">
              <div className="section-title"><span className="icon">📁</span> Projects in Pipeline</div>
              {projects.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No projects yet.</p>
              ) : (
                projects.map(p => (
                  <div key={p.id} className="progress-bar-container">
                    <div className="progress-label">
                      <span className="name">{p.name}</span>
                      <span className="value">
                        {(() => {
                          const pTasks = allTasks.filter(t => t.project_id === p.id);
                          const pDone = pTasks.filter(t => t.status === 'done').length;
                          return pTasks.length > 0 ? `${Math.round((pDone / pTasks.length) * 100)}%` : '0%';
                        })()}
                      </span>
                    </div>
                    <div className="progress-track">
                      <div
                        className="progress-fill blue"
                        style={{
                          width: (() => {
                            const pTasks = allTasks.filter(t => t.project_id === p.id);
                            const pDone = pTasks.filter(t => t.status === 'done').length;
                            return pTasks.length > 0 ? `${Math.round((pDone / pTasks.length) * 100)}%` : '0%';
                          })()
                        }}
                      ></div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="glass-panel no-hover animate-fade-in stagger-4">
              <div className="section-title"><span className="icon">🔴</span> Urgent Tasks</div>
              {highPriorityTasks.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No urgent tasks. Great job! 🎉</p>
              ) : (
                <div className="activity-list">
                  {highPriorityTasks.slice(0, 5).map(t => (
                    <div key={t.id} className="activity-item">
                      <div className="activity-dot red"></div>
                      <div className="activity-text">{t.title}</div>
                      <span className="badge high">High</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Weekly Report / Recent Activity */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <div className="glass-panel no-hover animate-fade-in stagger-5">
              <div className="section-title"><span className="icon">📋</span> Weekly Summary</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(0,0,0,0.15)', borderRadius: '10px' }}>
                  <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--success-color)' }}>{doneTasks.length}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Completed</div>
                </div>
                <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(0,0,0,0.15)', borderRadius: '10px' }}>
                  <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--accent-color)' }}>{inProgressTasks.length}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>In Progress</div>
                </div>
                <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(0,0,0,0.15)', borderRadius: '10px' }}>
                  <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--warning-color)' }}>{todoTasks.length}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Todo</div>
                </div>
                <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(0,0,0,0.15)', borderRadius: '10px' }}>
                  <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--purple-color)' }}>{completionRate}%</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Done Rate</div>
                </div>
              </div>
            </div>

            <div className="glass-panel no-hover animate-fade-in stagger-6">
              <div className="section-title"><span className="icon">🕐</span> Recent Activity</div>
              {recentActivities.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No recent activity.</p>
              ) : (
                <div className="activity-list">
                  {recentActivities.map((a, i) => (
                    <div key={i} className="activity-item">
                      <div className={`activity-dot ${a.color}`}></div>
                      <div className="activity-text">{a.text}</div>
                      <div className="activity-time">{a.time}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ============ MEMBER DASHBOARD ============ */}
      {!isAdmin && (
        <>
          {/* Stats Row */}
          <div className="grid-stats">
            <div className="stat-card blue animate-fade-in stagger-1">
              <div className="stat-label">My Tasks</div>
              <div className="stat-value blue">{myTasks.length}</div>
              <div className="stat-footer">Assigned to you</div>
            </div>
            <div className="stat-card green animate-fade-in stagger-2">
              <div className="stat-label">Completed</div>
              <div className="stat-value green">{myDone.length}</div>
              <div className="stat-footer">{myTasks.length > 0 ? Math.round((myDone.length / myTasks.length) * 100) : 0}% of your tasks</div>
            </div>
            <div className="stat-card orange animate-fade-in stagger-3">
              <div className="stat-label">In Progress</div>
              <div className="stat-value orange">{myInProgress.length}</div>
              <div className="stat-footer">Currently working on</div>
            </div>
            <div className="stat-card purple animate-fade-in stagger-4">
              <div className="stat-label">Projects</div>
              <div className="stat-value purple">{projects.length}</div>
              <div className="stat-footer">You're a member of</div>
            </div>
          </div>

          {/* Progress Trends */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '2rem' }}>
            <div className="glass-panel no-hover animate-fade-in stagger-3">
              <div className="section-title"><span className="icon">📈</span> My Progress</div>
              {projects.map(p => {
                const pTasks = allTasks.filter(t => t.project_id === p.id && t.assigned_to === user?.id);
                const pDone = pTasks.filter(t => t.status === 'done').length;
                const pct = pTasks.length > 0 ? Math.round((pDone / pTasks.length) * 100) : 0;
                return (
                  <div key={p.id} className="progress-bar-container">
                    <div className="progress-label">
                      <span className="name">{p.name}</span>
                      <span className="value">{pDone}/{pTasks.length} done</span>
                    </div>
                    <div className="progress-track">
                      <div className="progress-fill green" style={{ width: `${pct}%` }}></div>
                    </div>
                  </div>
                );
              })}
              {projects.length === 0 && (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No projects assigned yet.</p>
              )}
            </div>

            <div className="glass-panel no-hover animate-fade-in stagger-4">
              <div className="section-title"><span className="icon">🎯</span> Task Breakdown</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(0,0,0,0.15)', borderRadius: '10px' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-secondary)' }}>{myTasks.filter(t => t.status === 'todo').length}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>TODO</div>
                </div>
                <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(0,0,0,0.15)', borderRadius: '10px' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-color)' }}>{myInProgress.length}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>IN PROGRESS</div>
                </div>
                <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(0,0,0,0.15)', borderRadius: '10px' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--success-color)' }}>{myDone.length}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>DONE</div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="glass-panel no-hover animate-fade-in stagger-5">
            <div className="section-title"><span className="icon">🕐</span> Recent Activity</div>
            {recentActivities.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No recent activity.</p>
            ) : (
              <div className="activity-list">
                {recentActivities.map((a, i) => (
                  <div key={i} className="activity-item">
                    <div className={`activity-dot ${a.color}`}></div>
                    <div className="activity-text">{a.text}</div>
                    <div className="activity-time">{a.time}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;