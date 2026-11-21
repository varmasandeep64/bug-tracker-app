import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';

export default function ProjectTickets() {
  const { projectId } = useParams();
  const { user } = useAuth();

  const [project, setProject] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // New Ticket Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('bug');
  const [priority, setPriority] = useState('medium');
  const [assignee, setAssignee] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${user?.token}`,
  };

  useEffect(() => {
    setLoading(true);
    const fetchProjectAndTickets = async () => {
      try {
        const [projRes, ticketsRes] = await Promise.all([
          fetch(`http://localhost:5000/api/projects/${projectId}`, { headers: authHeaders }),
          fetch(`http://localhost:5000/api/tickets/project/${projectId}`, { headers: authHeaders }),
        ]);

        const projData = await projRes.json();
        const ticketsData = await ticketsRes.json();

        if (!projRes.ok) throw new Error(projData.message || 'Failed to load project');
        if (!ticketsRes.ok) throw new Error(ticketsData.message || 'Failed to load tickets');

        setProject(projData);
        setTickets(ticketsData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProjectAndTickets();
  }, [projectId]);

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('http://localhost:5000/api/tickets', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          title,
          description,
          type,
          priority,
          projectId,
          assignee: assignee || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create ticket');

      setTickets([data, ...tickets]);
      setTitle('');
      setDescription('');
      setType('bug');
      setPriority('medium');
      setAssignee('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (ticketId, newStatus) => {
    try {
      const res = await fetch(`http://localhost:5000/api/tickets/${ticketId}`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({ status: newStatus }),
      });
      const updated = await res.json();
      if (!res.ok) throw new Error(updated.message || 'Failed to update status');

      setTickets(tickets.map((t) => (t._id === ticketId ? updated : t)));
    } catch (err) {
      setError(err.message);
    }
  };

  const priorityBadge = (level) => {
    const styles = {
      low: 'bg-slate-100 text-slate-700',
      medium: 'bg-blue-50 text-blue-700',
      high: 'bg-amber-50 text-amber-700',
      critical: 'bg-rose-50 text-rose-700',
    };
    return styles[level] || styles.medium;
  };

  const typeBadge = (t) => {
    const styles = {
      bug: 'bg-rose-100 text-rose-800',
      feature: 'bg-purple-100 text-purple-800',
      task: 'bg-emerald-100 text-emerald-800',
    };
    return styles[t] || styles.bug;
  };

  return (
    <Layout currentProjectTitle={project?.title}>
      <div className="space-y-8">
        {/* Project Header Summary */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{project?.title || 'Loading...'}</h1>
            <p className="text-sm text-slate-500 mt-1">
              {project?.description || 'Manage issues, assign team members, and track sprint progress.'}
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 shrink-0">
            <span className="px-2.5 py-1 rounded-full bg-slate-100 font-medium text-slate-700">
              {project?.teamMembers?.length || 0} Members
            </span>
            <span className="px-2.5 py-1 rounded-full bg-blue-50 font-medium text-blue-700">
              {tickets.length} Issues
            </span>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 text-sm flex justify-between">
            <span>{error}</span>
            <button onClick={() => setError('')} className="font-bold">✕</button>
          </div>
        )}

        {/* Create Ticket Form */}
        <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Report New Issue / Ticket</h2>
          <form onSubmit={handleCreateTicket} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <input
                type="text"
                required
                placeholder="Ticket title (e.g. Cart button unresponsive on mobile)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="md:col-span-2 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="bug">Bug</option>
                <option value="feature">Feature Request</option>
                <option value="task">Task</option>
              </select>

              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <input
                type="text"
                placeholder="Steps to reproduce or detailed description..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="md:col-span-2 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <select
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Unassigned</option>
                {project?.teamMembers?.map((member) => (
                  <option key={member._id} value={member._id}>
                    Assign: {member.name}
                  </option>
                ))}
              </select>

              <button
                type="submit"
                disabled={submitting}
                className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition disabled:opacity-50"
              >
                {submitting ? 'Creating...' : '+ Create Ticket'}
              </button>
            </div>
          </form>
        </section>

        {/* Ticket List */}
        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-4">
            Project Issues ({tickets.length})
          </h2>

          {loading ? (
            <p className="text-sm text-slate-500">Loading issues...</p>
          ) : tickets.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-slate-300 p-10 text-center">
              <p className="text-slate-500 text-sm">No issues reported in this project yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tickets.map((ticket) => (
                <div
                  key={ticket._id}
                  className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold uppercase ${typeBadge(ticket.type)}`}>
                        {ticket.type}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold uppercase ${priorityBadge(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                      <h3 className="font-bold text-slate-900 text-base">{ticket.title}</h3>
                    </div>

                    {ticket.description && (
                      <p className="text-sm text-slate-600">{ticket.description}</p>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                      <span>
                        Assignee:{' '}
                        <strong className="text-slate-700">
                          {ticket.assignee ? ticket.assignee.name : 'Unassigned'}
                        </strong>
                      </span>
                      <span>
                        Reported by: <strong className="text-slate-600">{ticket.createdBy?.name}</strong>
                      </span>
                      <span>
                        Created: {new Date(ticket.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Quick Status Selector */}
                  <div className="flex items-center gap-2 shrink-0">
                    <label className="text-xs font-medium text-slate-500">Status:</label>
                    <select
                      value={ticket.status}
                      onChange={(e) => handleStatusChange(ticket._id, e.target.value)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-300 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="To Do">To Do</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Done">Done</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
}