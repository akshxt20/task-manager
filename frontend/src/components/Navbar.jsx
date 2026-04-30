import { Link, useNavigate } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <nav className="bg-blue-600 text-white px-6 py-4 flex justify-between items-center shadow-md">
      <div className="flex gap-6 items-center">
        <h1 className="text-xl font-bold">TaskManager</h1>
        <Link
          to="/dashboard"
          className="hover:text-blue-200 transition"
        >
          Dashboard
        </Link>
        <Link
          to="/projects"
          className="hover:text-blue-200 transition"
        >
          Projects
        </Link>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm">
          Hello, {user.name}
        </span>
        <button
          onClick={handleLogout}
          className="bg-white text-blue-600 px-4 py-1 rounded hover:bg-blue-100 transition text-sm font-medium"
        >
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;