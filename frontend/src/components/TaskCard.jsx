const TaskCard = ({ task, userRole, onStatusChange, onEdit, onDelete }) => {
  const priorityColors = {
    low: 'bg-green-100 text-green-700',
    medium: 'bg-yellow-100 text-yellow-700',
    high: 'bg-red-100 text-red-700'
  };

  const isOverdue =
    task.due_date &&
    new Date(task.due_date) < new Date() &&
    task.status !== 'done';

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-3 border border-gray-200">

      {/* Title */}
      <h3 className="font-semibold text-gray-800 mb-1">{task.title}</h3>

      {/* Description */}
      {task.description && (
        <p className="text-sm text-gray-500 mb-2">{task.description}</p>
      )}

      {/* Priority badge */}
      <span className={`text-xs px-2 py-1 rounded-full font-medium ${priorityColors[task.priority]}`}>
        {task.priority?.toUpperCase()}
      </span>

      {/* Assigned to */}
      {task.assigned_to_name && (
        <p className="text-xs text-gray-400 mt-2">
          Assigned to: {task.assigned_to_name}
        </p>
      )}

      {/* Due date */}
      {task.due_date && (
        <p className={`text-xs mt-1 ${isOverdue ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>
          Due: {new Date(task.due_date).toLocaleDateString()}
          {isOverdue && ' — OVERDUE'}
        </p>
      )}

      {/* Status dropdown — visible to everyone */}
      <select
        value={task.status}
        onChange={(e) => onStatusChange(task.id, e.target.value)}
        className="mt-3 w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
      >
        <option value="todo">To Do</option>
        <option value="inprogress">In Progress</option>
        <option value="done">Done</option>
      </select>

      {/* Admin only buttons */}
      {userRole === 'admin' && (
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => onEdit(task)}
            className="flex-1 bg-yellow-400 text-white text-sm py-1 rounded hover:bg-yellow-500 transition"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(task.id)}
            className="flex-1 bg-red-500 text-white text-sm py-1 rounded hover:bg-red-600 transition"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
};

export default TaskCard;