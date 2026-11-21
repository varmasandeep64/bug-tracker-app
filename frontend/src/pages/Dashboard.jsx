import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';

export default function Dashboard() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);

  const [memberEmails, setMemberEmails] = useState({});

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${user?.token}`,
  };

  const fetchProjects = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/projects', {
        headers: authHeaders,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load projects');
      setProjects(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setCreating(true);
    setError('');

    try {
      const res = await fetch('http://localhost:5000/api/projects', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ title, description }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Could not create project');

      setProjects([data, ...projects]);
      setTitle('');
      setDescription('');
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm('Delete this project?')) return;
    try {
      const res = await fetch(`http://localhost:5000/api/projects/${projectId}`, {
        method: 'DELETE',
        headers: authHeaders,
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to delete');
      }
      setProjects(projects.filter((p) => p._id !== projectId));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAddMember = async (e, projectId) => {
    e.preventDefault();
    const email = memberEmails[projectId];
    if (!email?.trim()) return;
    setError('');

    try {
      const res = await fetch(`http://localhost:5000/api/projects/${projectId}/members`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Could not add member');

      setProjects(projects.map((p) => (p._id === projectId ? data : p)));
      setMemberEmails({ ...memberEmails, [projectId]: '' });
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRemoveMember = async (projectId, userId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/projects/${projectId}/members/${userId}`, {
        method: 'DELETE',
        headers: authHeaders,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Could not remove member');

      setProjects(projects.map((p) => (p._id === projectId ? data : p)));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Layout>
      <div className="space-y-8">
        {error && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 text-sm flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError('')} className="font-bold text-rose-800">✕</button>
          </div>
        )}

        {/* Create Project Section */}
        <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Create New Project</h2>
          <form onSubmit={handleCreateProject} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              required
              placeholder="Project Title (e.g. Web Portal v2)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="Short description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={creating}
              className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition disabled:opacity-50"
            >
              {creating ? 'Creating...' : '+ Create Project'}
            </button>
          </form>
        </section>

        {/* Projects Grid */}
        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-4">Your Projects ({projects.length})</h2>

          {loading ? (
            <p className="text-sm text-slate-500">Loading projects...</p>
          ) : projects.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-slate-300 p-10 text-center">
              <p className="text-slate-500 text-sm">No projects yet. Create your first project above!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {projects.map((project) => {
                const isOwner = project.owner?._id === user?._id;
                return (
                  <div
                    key={project._id}
                    className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between space-y-4 hover:border-blue-300 transition"
                  >
                    <div>
                      <div className="flex justify-between items-start">
                        <div>
                          <Link
                            to={`/projects/${project._id}`}
                            className="text-lg font-bold text-blue-600 hover:underline"
                          >
                            {project.title} →
                          </Link>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Owner: {project.owner?.name}
                          </p>
                        </div>
                        {isOwner && (
                          <button
                            onClick={() => handleDeleteProject(project._id)}
                            className="text-xs text-rose-600 hover:underline font-medium"
                          >
                            Delete
                          </button>
                        )}
                      </div>

                      <p className="text-sm text-slate-600 mt-3">
                        {project.description || 'No description provided.'}
                      </p>

                      {/* Team Members */}
                      <div className="mt-4 pt-4 border-t border-slate-100">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                          Team Members ({project.teamMembers?.length || 0})
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {project.teamMembers?.map((member) => (
                            <span
                              key={member._id}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700"
                            >
                              {member.name}
                              {isOwner && member._id !== project.owner?._id && (
                                <button
                                  onClick={() => handleRemoveMember(project._id, member._id)}
                                  className="text-slate-400 hover:text-rose-600 font-bold"
                                  title="Remove member"
                                >
                                  ×
                                </button>
                              )}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {isOwner && (
                      <form
                        onSubmit={(e) => handleAddMember(e, project._id)}
                        className="pt-3 border-t border-slate-100 flex gap-2"
                      >
                        <input
                          type="email"
                          required
                          placeholder="Add teammate by email..."
                          value={memberEmails[project._id] || ''}
                          onChange={(e) =>
                            setMemberEmails({ ...memberEmails, [project._id]: e.target.value })
                          }
                          className="flex-1 text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          type="submit"
                          className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg transition"
                        >
                          Invite
                        </button>
                      </form>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
}