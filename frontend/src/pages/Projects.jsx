import React, { useEffect, useState, useContext } from 'react';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';

const Projects = () => {
  const { user } = useContext(AuthContext);
  const [projects, setProjects] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [allTasks, setAllTasks] = useState([]);

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await api.get('/projects');
      setProjects(res.data);

      const taskPromises = res.data.map(p => api.get(`/tasks?project_id=${p.id}`));
      const taskResults = await Promise.all(taskPromises);
      setAllTasks(taskResults.flatMap(r => r.data));
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/projects', { name, description });
      setName('');
      setDescription('');
      setShowForm(false);
      fetchProjects();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (projectId) => {
    if (!window.confirm('Are you sure you want to delete this project and all its tasks?')) return;
    try {
      await api.delete(`/projects/${projectId}`);
      fetchProjects();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete project');
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Projects</h1>
        {isAdmin && (
          <button className="glass-button" style={{ width: 'auto' }} onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : '+ New Project'}
          </button>
        )}
      </div>

      {showForm && isAdmin && (
        <div className="glass-panel no-hover" style={{ marginBottom: '1.5rem' }}>
          <div className="section-title">Create New Project</div>
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label className="form-label">Project Name</label>
              <input
                type="text"
                className="glass-input"
                placeholder="e.g. Website Redesign"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                className="glass-input"
                rows="3"
                placeholder="What is this project about?"
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>
            <button type="submit" className="glass-button" style={{ width: 'auto' }}>Create Project</button>
          </form>
        </div>
      )}

      <div className="grid-cards">
        {projects.length === 0 ? (
          <div className="glass-panel empty-state">
            <div className="empty-icon">📁</div>
            <p>{isAdmin ? 'No projects yet. Create your first project!' : 'No projects assigned to you yet.'}</p>
          </div>
        ) : (
          projects.map(p => {
            const pTasks = allTasks.filter(t => t.project_id === p.id);
            const pDone = pTasks.filter(t => t.status === 'done').length;
            const pct = pTasks.length > 0 ? Math.round((pDone / pTasks.length) * 100) : 0;

            return (
              <div key={p.id} className="glass-panel">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <h3 style={{ fontSize: '1.1rem' }}>{p.name}</h3>
                  <span className={`badge ${p.user_role === 'admin' ? 'admin' : 'member'}`}>{p.user_role}</span>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem', lineHeight: 1.5 }}>
                  {p.description || 'No description'}
                </p>

                <div className="progress-bar-container" style={{ marginBottom: '0.5rem' }}>
                  <div className="progress-label">
                    <span className="name">{pDone}/{pTasks.length} tasks done</span>
                    <span className="value">{pct}%</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill blue" style={{ width: `${pct}%` }}></div>
                  </div>
                </div>

                {isAdmin && p.user_role === 'admin' && (
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="glass-button danger"
                    style={{ width: 'auto', padding: '0.35rem 0.75rem', fontSize: '0.75rem', marginTop: '0.5rem' }}
                  >
                    Delete
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Projects;