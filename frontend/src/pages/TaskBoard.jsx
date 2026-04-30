import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from '../api/axios';
import Navbar from '../components/Navbar';
import TaskCard from '../components/TaskCard';

const TaskBoard = () => {
  const { id } = useParams();
  const [userRole, setUserRole] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);

  // Forms
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    due_date: '',
    priority: 'medium',
    assigned_to: ''
  });
  const [editTask, setEditTask] = useState(null);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [error, setError] = useState('');

  // Fetch everything on load
  useEffect(() => {
    fetchAll();
  }, [id]);

  const fetchAll = async () => {
    try {
      const [roleRes, tasksRes, membersRes] = await Promise.all([
        axios.get(`/api/projects/${id}/my-role`),
        axios.get(`/api/tasks?project_id=${id}`),
        axios.get(`/api/projects/${id}/members`)
      ]);
      setUserRole(roleRes.data.role);
      setTasks(tasksRes.data);
      setMembers(membersRes.data);
    } catch (err) {
      console.error('Failed to load task board', err);
    } finally {
      setLoading(false);
    }
  };

  // Create task
  const handleCreateTask = async () => {
    if (!taskForm.title) {
      setError('Task title is required');
      return;
    }
    try {
      await axios.post('/api/tasks', { ...taskForm, project_id: id });
      setTaskForm({
        title: '', description: '',
        due_date: '', priority: 'medium', assigned_to: ''
      });
      setShowCreateModal(false);
      setError('');
      fetchAll();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create task');
    }
  };

  // Update task status (member & admin)
  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await axios.put(`/api/tasks/${taskId}`, { status: newStatus });
      fetchAll();
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  // Edit task (admin)
  const handleEditOpen = (task) => {
    setEditTask(task);
    setShowEditModal(true);
  };

  const handleEditSave = async () => {
    try {
      await axios.put(`/api/tasks/${editTask.id}`, editTask);
      setShowEditModal(false);
      setEditTask(null);
      fetchAll();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update task');
    }
  };

  // Delete task (admin)
  const handleDelete = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await axios.delete(`/api/tasks/${taskId}`);
      fetchAll();
    } catch (err) {
      console.error('Failed to delete task', err);
    }
  };

  // Add member by email (admin)
  const handleAddMember = async () => {
    try {
      // First find user by email
      const res = await axios.get(`/api/auth/user-by-email?email=${newMemberEmail}`);
      await axios.post(`/api/projects/${id}/members`, {
        user_id: res.data.id
      });
      setNewMemberEmail('');
      setError('');
      fetchAll();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add member');
    }
  };

  // Remove member (admin)
  const handleRemoveMember = async (userId) => {
    try {
      await axios.delete(`/api/projects/${id}/members/${userId}`);
      fetchAll();
    } catch (err) {
      console.error('Failed to remove member', err);
    }
  };

  const columns = [
    { key: 'todo', label: '📋 To Do', color: 'bg-gray-50 border-gray-200' },
    { key: 'inprogress', label: '🔄 In Progress', color: 'bg-blue-50 border-blue-200' },
    { key: 'done', label: '✅ Done', color: 'bg-green-50 border-green-200' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading task board...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Task Board</h2>
          <div className="flex gap-3">
            {userRole === 'admin' && (
              <>
                <button
                  onClick={() => setShowMembersModal(true)}
                  className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition text-sm"
                >
                  👥 Manage Members
                </button>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm"
                >
                  + Create Task
                </button>
              </>
            )}
          </div>
        </div>

        {/* Task Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {columns.map((col) => (
            <div
              key={col.key}
              className={`rounded-xl border p-4 ${col.color}`}
            >
              <h3 className="font-semibold text-gray-700 mb-4 text-center">
                {col.label} ({tasks.filter(t => t.status === col.key).length})
              </h3>
              {tasks
                .filter((t) => t.status === col.key)
                .map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    userRole={userRole}
                    onStatusChange={handleStatusChange}
                    onEdit={handleEditOpen}
                    onDelete={handleDelete}
                  />
                ))}
              {tasks.filter(t => t.status === col.key).length === 0 && (
                <p className="text-center text-gray-300 text-sm py-8">
                  No tasks here
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* CREATE TASK MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Create Task</h3>

            {error && (
              <div className="bg-red-100 text-red-600 px-3 py-2 rounded mb-3 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-3">
              <input
                type="text"
                placeholder="Task Title *"
                value={taskForm.title}
                onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <textarea
                placeholder="Description"
                value={taskForm.description}
                onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 h-20 resize-none"
              />
              <input
                type="date"
                value={taskForm.due_date}
                onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <select
                value={taskForm.priority}
                onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
              <select
                value={taskForm.assigned_to}
                onChange={(e) => setTaskForm({ ...taskForm, assigned_to: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="">Assign to...</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-3 mt-4">
              <button
                onClick={handleCreateTask}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
              >
                Create
              </button>
              <button
                onClick={() => { setShowCreateModal(false); setError(''); }}
                className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT TASK MODAL */}
      {showEditModal && editTask && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Edit Task</h3>

            <div className="space-y-3">
              <input
                type="text"
                value={editTask.title}
                onChange={(e) => setEditTask({ ...editTask, title: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <textarea
                value={editTask.description || ''}
                onChange={(e) => setEditTask({ ...editTask, description: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 h-20 resize-none"
              />
              <input
                type="date"
                value={editTask.due_date?.split('T')[0] || ''}
                onChange={(e) => setEditTask({ ...editTask, due_date: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <select
                value={editTask.priority}
                onChange={(e) => setEditTask({ ...editTask, priority: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
              <select
                value={editTask.assigned_to || ''}
                onChange={(e) => setEditTask({ ...editTask, assigned_to: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="">Assign to...</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-3 mt-4">
              <button
                onClick={handleEditSave}
                className="flex-1 bg-yellow-500 text-white py-2 rounded-lg hover:bg-yellow-600 transition"
              >
                Save Changes
              </button>
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MANAGE MEMBERS MODAL */}
      {showMembersModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Manage Members</h3>

            {error && (
              <div className="bg-red-100 text-red-600 px-3 py-2 rounded mb-3 text-sm">
                {error}
              </div>
            )}

            {/* Current members list */}
            <div className="mb-4 max-h-48 overflow-y-auto">
              {members.map((m) => (
                <div
                  key={m.id}
                  className="flex justify-between items-center py-2 border-b"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-700">{m.name}</p>
                    <p className="text-xs text-gray-400">{m.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      m.role === 'admin'
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {m.role}
                    </span>
                    {m.role !== 'admin' && (
                      <button
                        onClick={() => handleRemoveMember(m.id)}
                        className="text-red-500 hover:text-red-700 text-xs"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Add member by email */}
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Member email"
                value={newMemberEmail}
                onChange={(e) => setNewMemberEmail(e.target.value)}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <button
                onClick={handleAddMember}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm"
              >
                Add
              </button>
            </div>

            <button
              onClick={() => { setShowMembersModal(false); setError(''); }}
              className="w-full mt-4 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskBoard;