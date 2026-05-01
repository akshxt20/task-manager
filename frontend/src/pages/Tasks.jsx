import React, { useEffect, useState, useContext } from 'react';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';

const SUBMISSION_TYPES = [
  { key: 'text', label: 'Text Input', icon: '📝' },
  { key: 'file', label: 'File Upload', icon: '📎' },
  { key: 'custom', label: 'Custom Input', icon: '✏️' }
];

const Tasks = () => {
  const { user } = useContext(AuthContext);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [tasks, setTasks] = useState([]);

  // Create task form
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [assignedTo, setAssignedTo] = useState('');
  const [projectMembers, setProjectMembers] = useState([]);
  const [submissionTypes, setSubmissionTypes] = useState([]);
  const [submissionInstructions, setSubmissionInstructions] = useState('');

  // Submission modal
  const [submitTaskId, setSubmitTaskId] = useState(null);
  const [submitTaskData, setSubmitTaskData] = useState(null);
  const [textContent, setTextContent] = useState('');
  const [customContent, setCustomContent] = useState('');
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // View submissions
  const [viewSubsTaskId, setViewSubsTaskId] = useState(null);
  const [submissions, setSubmissions] = useState([]);

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    fetchProjects();
    fetchAllMembers();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchTasks(selectedProject);
    } else {
      setTasks([]);
    }
  }, [selectedProject]);

  const fetchProjects = async () => {
    try {
      const res = await api.get('/projects');
      setProjects(res.data);
      if (res.data.length > 0) setSelectedProject(res.data[0].id);
    } catch (err) { console.error(err); }
  };

  const fetchTasks = async (projectId) => {
    try {
      const res = await api.get(`/tasks?project_id=${projectId}`);
      setTasks(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchAllMembers = async () => {
    try {
      const res = await api.get('/auth/all-members');
      setProjectMembers(res.data);
    } catch (err) { console.error(err); }
  };

  const toggleSubmissionType = (key) => {
    setSubmissionTypes(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      await api.post('/tasks', {
        project_id: selectedProject,
        title,
        description,
        priority,
        assigned_to: assignedTo || null,
        submission_type: submissionTypes.length > 0 ? submissionTypes.join(',') : null,
        submission_instructions: submissionInstructions || null
      });
      setTitle(''); setDescription(''); setPriority('medium'); setAssignedTo('');
      setSubmissionTypes([]); setSubmissionInstructions('');
      setShowForm(false);
      fetchTasks(selectedProject);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create task');
    }
  };

  const handleUpdateStatus = async (taskId, newStatus) => {
    try {
      await api.put(`/tasks/${taskId}`, { status: newStatus });
      fetchTasks(selectedProject);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update status');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      fetchTasks(selectedProject);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete task');
    }
  };

  const openSubmitModal = (task) => {
    setSubmitTaskId(task.id);
    setSubmitTaskData(task);
    setTextContent('');
    setCustomContent('');
    setFile(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const formData = new FormData();
      if (textContent) formData.append('text_content', textContent);
      if (customContent) formData.append('custom_content', customContent);
      if (file) formData.append('file', file);

      await api.post(`/tasks/${submitTaskId}/submit`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setSubmitTaskId(null);
      setSubmitTaskData(null);
      fetchTasks(selectedProject);
    } catch (err) {
      alert(err.response?.data?.error || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const viewSubmissions = async (taskId) => {
    try {
      const res = await api.get(`/tasks/${taskId}/submissions`);
      setSubmissions(res.data);
      setViewSubsTaskId(taskId);
    } catch (err) { console.error(err); }
  };

  const currentProjectRole = projects.find(p => p.id === Number(selectedProject))?.user_role;
  const canCreate = isAdmin || currentProjectRole === 'admin';

  const statusOptions = ['todo', 'inprogress', 'done'];

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Tasks</h1>
        {canCreate && (
          <button className="glass-button" style={{ width: 'auto' }} onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : '+ New Task'}
          </button>
        )}
      </div>

      {/* Project Selector */}
      <div style={{ marginBottom: '1.5rem' }}>
        <select className="glass-input" style={{ width: 'auto', minWidth: '280px' }}
          value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)}>
          <option value="">Select a project...</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {/* ====== CREATE TASK FORM (Admin) ====== */}
      {showForm && canCreate && (
        <div className="glass-panel no-hover" style={{ marginBottom: '1.5rem' }}>
          <div className="section-title">Create New Task</div>
          <form onSubmit={handleCreateTask}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Task Title</label>
                <input type="text" className="glass-input" placeholder="e.g. Design homepage wireframe"
                  value={title} onChange={e => setTitle(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Assign To</label>
                <select className="glass-input" value={assignedTo} onChange={e => setAssignedTo(e.target.value)}>
                  <option value="">Unassigned</option>
                  {projectMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="glass-input" rows="2" placeholder="Optional details..."
                value={description} onChange={e => setDescription(e.target.value)} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select className="glass-input" value={priority} onChange={e => setPriority(e.target.value)}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            {/* Submission Type Section */}
            <div style={{ marginTop: '0.5rem', marginBottom: '1.25rem', padding: '1.25rem', background: 'rgba(0,0,0,0.15)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
              <label className="form-label" style={{ marginBottom: '0.75rem' }}>How should the member submit this task?</label>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                {SUBMISSION_TYPES.map(st => (
                  <div key={st.key}
                    onClick={() => toggleSubmissionType(st.key)}
                    style={{
                      padding: '0.7rem 1.2rem',
                      borderRadius: '10px',
                      border: `1px solid ${submissionTypes.includes(st.key) ? 'var(--accent-color)' : 'var(--glass-border)'}`,
                      background: submissionTypes.includes(st.key) ? 'var(--accent-glow)' : 'rgba(0,0,0,0.2)',
                      color: submissionTypes.includes(st.key) ? 'var(--accent-color)' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      transition: 'all 0.25s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontWeight: 500,
                      fontSize: '0.9rem'
                    }}
                  >
                    <span>{st.icon}</span> {st.label}
                  </div>
                ))}
              </div>
              {submissionTypes.length > 0 && (
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Submission Instructions (optional)</label>
                  <textarea className="glass-input" rows="2" placeholder="e.g. Submit a PDF report with your findings..."
                    value={submissionInstructions} onChange={e => setSubmissionInstructions(e.target.value)} />
                </div>
              )}
            </div>

            <button type="submit" className="glass-button" style={{ width: 'auto' }}>Create Task</button>
          </form>
        </div>
      )}

      {/* ====== TASK CARDS ====== */}
      {selectedProject ? (
        <div className="grid-cards">
          {tasks.length === 0 ? (
            <div className="glass-panel empty-state">
              <div className="empty-icon">✅</div>
              <p>No tasks in this project yet.</p>
            </div>
          ) : (
            tasks.map(t => {
              const reqTypes = t.submission_type ? t.submission_type.split(',') : [];
              const hasSubmissionReq = reqTypes.length > 0;
              const isMemberView = !isAdmin && user?.role === 'member';

              return (
                <div key={t.id} className="glass-panel" style={{ opacity: t.status === 'done' ? 0.65 : 1 }}>
                  {/* Header badges */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <span className={`badge ${t.priority}`}>{t.priority}</span>
                    <span className={`badge ${t.status}`}>{t.status}</span>
                  </div>

                  {/* Title */}
                  <h3 style={{ textDecoration: t.status === 'done' ? 'line-through' : 'none', marginBottom: '0.5rem', fontSize: '1rem' }}>
                    {t.title}
                  </h3>

                  {/* Description */}
                  {t.description && (
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.75rem', lineHeight: 1.5 }}>
                      {t.description}
                    </p>
                  )}

                  {/* Assigned to */}
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                    👤 {t.assigned_to_name || 'Unassigned'}
                  </div>

                  {/* Submission requirements */}
                  {hasSubmissionReq && (
                    <div style={{
                      marginBottom: '0.75rem', padding: '0.6rem 0.8rem',
                      background: 'rgba(56, 189, 248, 0.06)', borderRadius: '8px',
                      border: '1px solid rgba(56, 189, 248, 0.15)', fontSize: '0.8rem'
                    }}>
                      <div style={{ color: 'var(--accent-color)', fontWeight: 600, marginBottom: '0.3rem' }}>
                        📋 Required Submission:
                      </div>
                      <div style={{ color: 'var(--text-secondary)', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {reqTypes.map(rt => {
                          const st = SUBMISSION_TYPES.find(s => s.key === rt);
                          return st ? <span key={rt}>{st.icon} {st.label}</span> : null;
                        })}
                      </div>
                      {t.submission_instructions && (
                        <div style={{ color: 'var(--text-muted)', marginTop: '0.3rem', fontStyle: 'italic' }}>
                          "{t.submission_instructions}"
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    {/* Member: Submit button (if task has submission reqs and not done) */}
                    {isMemberView && hasSubmissionReq && t.status !== 'done' && (
                      <button onClick={() => openSubmitModal(t)}
                        className="glass-button" style={{ width: 'auto', padding: '0.35rem 0.8rem', fontSize: '0.75rem' }}>
                        📤 Submit Work
                      </button>
                    )}

                    {/* Admin: status change buttons */}
                    {canCreate && t.status !== 'done' && (
                      statusOptions.filter(s => s !== t.status).map(s => (
                        <button key={s} onClick={() => handleUpdateStatus(t.id, s)}
                          className="glass-button secondary" style={{ width: 'auto', padding: '0.3rem 0.65rem', fontSize: '0.7rem' }}>
                          → {s}
                        </button>
                      ))
                    )}

                    {/* Admin: View submissions */}
                    {canCreate && hasSubmissionReq && (
                      <button onClick={() => viewSubmissions(t.id)}
                        className="glass-button secondary" style={{ width: 'auto', padding: '0.3rem 0.65rem', fontSize: '0.7rem' }}>
                        📥 Submissions
                      </button>
                    )}

                    {/* Admin: Delete */}
                    {canCreate && (
                      <button onClick={() => handleDeleteTask(t.id)}
                        className="glass-button danger" style={{ width: 'auto', padding: '0.3rem 0.65rem', fontSize: '0.7rem' }}>
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        <div className="glass-panel empty-state">
          <div className="empty-icon">📋</div>
          <p>Select a project to view tasks.</p>
        </div>
      )}

      {/* ====== SUBMIT MODAL (Member) ====== */}
      {submitTaskId && submitTaskData && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, backdropFilter: 'blur(4px)'
        }} onClick={() => setSubmitTaskId(null)}>
          <div className="glass-panel no-hover" onClick={e => e.stopPropagation()} style={{
            width: '100%', maxWidth: '500px', maxHeight: '80vh', overflowY: 'auto',
            background: 'rgba(15, 23, 42, 0.95)', border: '1px solid var(--glass-border-strong)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div className="section-title" style={{ marginBottom: 0 }}>📤 Submit: {submitTaskData.title}</div>
              <button onClick={() => setSubmitTaskId(null)} style={{
                background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer'
              }}>✕</button>
            </div>

            {submitTaskData.submission_instructions && (
              <div style={{
                marginBottom: '1rem', padding: '0.75rem', background: 'rgba(56, 189, 248, 0.06)',
                borderRadius: '8px', border: '1px solid rgba(56, 189, 248, 0.15)',
                color: 'var(--text-secondary)', fontSize: '0.85rem', fontStyle: 'italic'
              }}>
                💡 {submitTaskData.submission_instructions}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {submitTaskData.submission_type?.split(',').includes('text') && (
                <div className="form-group">
                  <label className="form-label">Text Submission *</label>
                  <textarea className="glass-input" rows="4" placeholder="Type your submission..."
                    value={textContent} onChange={e => setTextContent(e.target.value)} required />
                </div>
              )}

              {submitTaskData.submission_type?.split(',').includes('file') && (
                <div className="form-group">
                  <label className="form-label">File Upload *</label>
                  <input type="file" className="glass-input" style={{ padding: '0.5rem' }}
                    onChange={e => setFile(e.target.files[0])} required />
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Max 10MB</div>
                </div>
              )}

              {submitTaskData.submission_type?.split(',').includes('custom') && (
                <div className="form-group">
                  <label className="form-label">Custom Input *</label>
                  <textarea className="glass-input" rows="3" placeholder="Enter your custom response..."
                    value={customContent} onChange={e => setCustomContent(e.target.value)} required />
                </div>
              )}

              <button type="submit" className="glass-button" disabled={submitting}>
                {submitting ? 'Submitting...' : '✅ Submit & Complete Task'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ====== VIEW SUBMISSIONS MODAL (Admin) ====== */}
      {viewSubsTaskId && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, backdropFilter: 'blur(4px)'
        }} onClick={() => setViewSubsTaskId(null)}>
          <div className="glass-panel no-hover" onClick={e => e.stopPropagation()} style={{
            width: '100%', maxWidth: '550px', maxHeight: '80vh', overflowY: 'auto',
            background: 'rgba(15, 23, 42, 0.95)', border: '1px solid var(--glass-border-strong)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div className="section-title" style={{ marginBottom: 0 }}>📥 Submissions</div>
              <button onClick={() => setViewSubsTaskId(null)} style={{
                background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer'
              }}>✕</button>
            </div>

            {submissions.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>No submissions yet.</p>
            ) : (
              <div className="activity-list">
                {submissions.map(s => (
                  <div key={s.id} style={{
                    padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '10px',
                    border: '1px solid rgba(255,255,255,0.05)', marginBottom: '0.75rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>👤 {s.submitted_by_name}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                        {new Date(s.submitted_at).toLocaleString()}
                      </span>
                    </div>
                    {s.text_content && (
                      <div style={{ marginBottom: '0.5rem' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Text</div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.5 }}>{s.text_content}</div>
                      </div>
                    )}
                    {s.file_name && (
                      <div style={{ marginBottom: '0.5rem' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.2rem' }}>File</div>
                        <a href={`http://localhost:5000/uploads/${s.file_path}`} target="_blank" rel="noreferrer"
                          style={{ color: 'var(--accent-color)', fontSize: '0.85rem', textDecoration: 'none' }}>
                          📎 {s.file_name}
                        </a>
                      </div>
                    )}
                    {s.custom_content && (
                      <div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Custom</div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.5 }}>{s.custom_content}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
