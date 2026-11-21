import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api';

export default function Layout({ children, currentProjectTitle }) {
  const { user, logout } = useAuth();
  const { projectId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await fetch(`${API_URL}/api/projects`, {
          headers: { Authorization: `Bearer ${user?.token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setProjects(data);
        }
      } catch (err) {
        console.error('Failed to load sidebar projects', err);
      }
    };

    if (user?.token) fetchProjects();
  }, [user?.token, location.pathname]);

  const handleProjectSwitch = (e) => {
    const selectedId = e.target.value;
    if (selectedId) {
      navigate(`/projects/${selectedId}`);
    } else {
      navigate('/dashboard');
    }
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/40 z-20 lg:hidden"
        />
      )}

      {/* Left Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 text-slate-200 flex flex-col justify-between transform transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          <div className="h-16 px-6 flex items-center justify-between border-b border-slate-800">
            <Link
              to="/dashboard"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center space-x-2.5"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center shadow-sm">
                B
              </div>
              <span className="font-bold text-white tracking-tight text-lg">Issue Tracker</span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-slate-400 hover:text-white text-xl"
            >
              ✕
            </button>
          </div>

          <div className="p-4 space-y-6">
            <div>
              <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Workspace
              </p>
              <Link
                to="/dashboard"
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
                  location.pathname === '/dashboard'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span>📁</span> All Projects
              </Link>
            </div>

            <div>
              <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Your Projects ({projects.length})
              </p>
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {projects.length === 0 ? (
                  <p className="px-3 text-xs text-slate-500 italic">No projects yet</p>
                ) : (
                  projects.map((proj) => {
                    const isActive = projectId === proj._id;
                    return (
                      <Link
                        key={proj._id}
                        to={`/projects/${proj._id}`}
                        onClick={() => setSidebarOpen(false)}
                        className={`block px-3 py-2 rounded-lg text-sm truncate transition ${
                          isActive
                            ? 'bg-slate-800 text-white font-semibold border-l-2 border-blue-500'
                            : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                        }`}
                      >
                        # {proj.title}
                      </Link>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-950/40">
          <div className="flex items-center justify-between">
            <div className="truncate pr-2">
              <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
              <p className="text-xs text-slate-400 capitalize">{user?.role}</p>
            </div>
            <button
              onClick={logout}
              className="px-2.5 py-1.5 text-xs font-medium text-rose-400 hover:bg-rose-950/60 rounded border border-rose-800/60 transition shrink-0"
            >
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-10">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
              aria-label="Open menu"
            >
              ☰
            </button>

            <nav className="flex items-center space-x-2 text-sm truncate">
              <Link to="/dashboard" className="text-slate-500 hover:text-blue-600 font-medium">
                Projects
              </Link>
              {projectId && (
                <>
                  <span className="text-slate-300">/</span>
                  <span className="font-semibold text-slate-900 truncate">
                    {currentProjectTitle || 'Board'}
                  </span>
                </>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <label htmlFor="project-switcher" className="hidden sm:inline text-xs font-medium text-slate-500">
              Switch Project:
            </label>
            <select
              id="project-switcher"
              value={projectId || ''}
              onChange={handleProjectSwitch}
              className="text-xs sm:text-sm font-medium px-3 py-1.5 border border-slate-300 rounded-lg bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-[180px] sm:max-w-xs"
            >
              <option value="">All Projects Overview</option>
              {projects.map((proj) => (
                <option key={proj._id} value={proj._id}>
                  {proj.title}
                </option>
              ))}
            </select>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 max-w-6xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}