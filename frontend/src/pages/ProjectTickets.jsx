import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api';
import Layout from '../components/Layout';
import KanbanBoard from '../components/KanbanBoard';
import TicketModal from '../components/TicketModal';

export default function ProjectTickets() {
  const { projectId } = useParams();
  const { user } = useAuth();

  const [project, setProject] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('board');
  const [selectedTicket, setSelectedTicket] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');

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
    const fetchProject = async () => {
      try {
        const res = await fetch(`${API_URL}/api/projects/${projectId}`, {
          headers: authHeaders,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to load project');
        setProject(data);
      } catch (err) {
        setError(err.message);
      }
    };

    fetchProject();
  }, [projectId]);

  useEffect(() => {
    const fetchFilteredTickets = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (searchQuery.trim()) params.append('search', searchQuery.trim());
        if (statusFilter) params.append('status', statusFilter);
        if (priorityFilter) params.append('priority', priorityFilter);
        if (assigneeFilter) params.append('assignee', assigneeFilter);

        const queryString = params.toString() ? `?${params.toString()}` : '';
        const res = await fetch(
          `${API_URL}/api/tickets/project/${projectId}${queryString}`,
          { headers: authHeaders }
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to load tickets');

        setTickets(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchFilteredTickets();
  }, [projectId, searchQuery, statusFilter, priorityFilter, assigneeFilter]);

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch(`${API_URL}/api/tickets`, {
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
    const previousTickets = [...tickets];

    setTickets((prev) =>
      prev.map((t) => (t._id === ticketId ? { ...t, status: newStatus } : t))
    );

    try {
      const res = await fetch(`${API_URL}/api/tickets/${ticketId}`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({ status: newStatus }),
      });
      const updated = await res.json();
      if (!res.ok) throw new Error(updated.message || 'Failed to update status');

      setTickets((prev) => prev.map((t) => (t._id === ticketId ? updated : t)));
    } catch (err) {
      setTickets(previousTickets);
      setError(err.message);
    }
  };

  const handleTicketUpdated = (updatedTicket) => {
    setTickets((prev) =>
      prev.map((t) => (t._id === updatedTicket._id ? updatedTicket : t))
    );
    setSelectedTicket(updatedTicket);
  };

  const handleTicketDeleted = (deletedId) => {
    setTickets((prev) => prev.filter((t) => t._id !== deletedId));
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('');
    setPriorityFilter('');
    setAssigneeFilter('');
  };

  const hasActiveFilters = searchQuery || statusFilter || priorityFilter || assigneeFilter;

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
      <div className="space-y-6">
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

        <section className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <input
              type="text"
              placeholder="🔍 Search title or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="lg:col-span-2 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="To Do">To Do</option>
              <option value="In Progress">In Progress</option>
              <option value="Done">Done</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>

            <select
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Assignees</option>
              {project?.teamMembers?.map((member) => (
                <option key={member._id} value={member._id}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>

          {hasActiveFilters && (
            <div className="mt-3 pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
              <span className="text-slate-500">Showing filtered results ({tickets.length})</span>
              <button
                type="button"
                onClick={clearFilters}
                className="text-blue-600 font-semibold hover:underline"
              >
                Reset All Filters
              </button>
            </div>
          )}
        </section>

        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-slate-900">
              Sprint Board ({tickets.length})
            </h2>

            <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 self-start">
              <button
                type="button"
                onClick={() => setViewMode('board')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                  viewMode === 'board'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Kanban Board
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                  viewMode === 'list'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                List View
              </button>
            </div>
          </div>

          {loading ? (
            <p className="text-sm text-slate-500">Loading issues...</p>
          ) : viewMode === 'board' ? (
            <KanbanBoard
              tickets={tickets}
              onStatusChange={handleStatusChange}
              onSelectTicket={(ticket) => setSelectedTicket(ticket)}
            />
          ) : tickets.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-slate-300 p-10 text-center">
              <p className="text-slate-500 text-sm">No issues match your current filters.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tickets.map((ticket) => (
                <div
                  key={ticket._id}
                  className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-blue-300 transition"
                >
                  <div
                    onClick={() => setSelectedTicket(ticket)}
                    className="space-y-1.5 cursor-pointer flex-1"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold uppercase ${typeBadge(ticket.type)}`}>
                        {ticket.type}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold uppercase ${priorityBadge(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                      <h3 className="font-bold text-slate-900 text-base hover:text-blue-600">
                        {ticket.title}
                      </h3>
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
                      <span className="text-blue-600 font-medium">💬 Open / Edit</span>
                    </div>
                  </div>

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

      {selectedTicket && (
        <TicketModal
          ticket={selectedTicket}
          project={project}
          onClose={() => setSelectedTicket(null)}
          onTicketUpdated={handleTicketUpdated}
          onTicketDeleted={handleTicketDeleted}
        />
      )}
    </Layout>
  );
}