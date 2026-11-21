import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api';

export default function TicketModal({
  ticket,
  project,
  onClose,
  onTicketUpdated,
  onTicketDeleted,
}) {
  const { user } = useAuth();

  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [loadingComments, setLoadingComments] = useState(true);
  const [posting, setPosting] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(ticket?.title || '');
  const [description, setDescription] = useState(ticket?.description || '');
  const [type, setType] = useState(ticket?.type || 'bug');
  const [priority, setPriority] = useState(ticket?.priority || 'medium');
  const [status, setStatus] = useState(ticket?.status || 'To Do');
  const [assignee, setAssignee] = useState(ticket?.assignee?._id || '');
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState('');

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${user?.token}`,
  };

  const canDelete =
    ticket?.createdBy?._id === user?._id ||
    project?.owner?._id === user?._id;

  useEffect(() => {
    if (!ticket?._id) return;

    setTitle(ticket.title);
    setDescription(ticket.description || '');
    setType(ticket.type);
    setPriority(ticket.priority);
    setStatus(ticket.status);
    setAssignee(ticket.assignee?._id || '');
    setIsEditing(false);

    const fetchComments = async () => {
      setLoadingComments(true);
      try {
        const res = await fetch(`${API_URL}/api/comments/${ticket._id}`, {
          headers: authHeaders,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to load comments');
        setComments(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoadingComments(false);
      }
    };

    fetchComments();
  }, [ticket?._id]);

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    setError('');

    try {
      const res = await fetch(`${API_URL}/api/tickets/${ticket._id}`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({
          title,
          description,
          type,
          priority,
          status,
          assignee: assignee || null,
        }),
      });
      const updated = await res.json();
      if (!res.ok) throw new Error(updated.message || 'Failed to update ticket');

      onTicketUpdated(updated);
      setIsEditing(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to permanently delete this ticket?')) return;
    setError('');

    try {
      const res = await fetch(`${API_URL}/api/tickets/${ticket._id}`, {
        method: 'DELETE',
        headers: authHeaders,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to delete ticket');

      onTicketDeleted(ticket._id);
      onClose();
    } catch (err) {
      setError(err.message);
    }
  };

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setPosting(true);
    setError('');

    try {
      const res = await fetch(`${API_URL}/api/comments/${ticket._id}`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to post comment');

      setComments([...comments, data]);
      setText('');
    } catch (err) {
      setError(err.message);
    } finally {
      setPosting(false);
    }
  };

  if (!ticket) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-slate-100 text-slate-700">
                {ticket.type}
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-amber-50 text-amber-700">
                {ticket.priority}
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-700">
                {ticket.status}
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 break-words">{ticket.title}</h2>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {!isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
              >
                ✏️ Edit
              </button>
            )}
            {canDelete && (
              <button
                type="button"
                onClick={handleDelete}
                className="px-3 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition"
              >
                🗑️ Delete
              </button>
            )}
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 text-xl font-bold px-2"
              aria-label="Close modal"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 text-xs">
              {error}
            </div>
          )}

          {isEditing ? (
            <form onSubmit={handleSaveEdit} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
              <h3 className="text-sm font-bold text-slate-800">Edit Ticket Details</h3>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg"
                  >
                    <option value="bug">Bug</option>
                    <option value="feature">Feature Request</option>
                    <option value="task">Task</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg"
                  >
                    <option value="To Do">To Do</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Done">Done</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Assignee</label>
                  <select
                    value={assignee}
                    onChange={(e) => setAssignee(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg"
                  >
                    <option value="">Unassigned</option>
                    {project?.teamMembers?.map((member) => (
                      <option key={member._id} value={member._id}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-slate-700 whitespace-pre-line">
                {ticket.description || 'No detailed description provided.'}
              </p>
              <div className="flex flex-wrap gap-4 text-xs text-slate-500 pt-2 border-t border-slate-100">
                <span>
                  Assignee:{' '}
                  <strong className="text-slate-800">
                    {ticket.assignee ? ticket.assignee.name : 'Unassigned'}
                  </strong>
                </span>
                <span>
                  Reporter: <strong className="text-slate-800">{ticket.createdBy?.name}</strong>
                </span>
                <span>Created: {new Date(ticket.createdAt).toLocaleString()}</span>
              </div>
            </div>
          )}

          <div className="border-t border-slate-200 pt-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">
              Activity & Comments ({comments.length})
            </h3>

            {loadingComments ? (
              <p className="text-xs text-slate-400">Loading comments...</p>
            ) : comments.length === 0 ? (
              <p className="text-xs text-slate-400 italic bg-slate-50 p-4 rounded-lg border border-dashed border-slate-200 text-center">
                No comments yet. Start the discussion below!
              </p>
            ) : (
              <div className="space-y-3">
                {comments.map((comment) => (
                  <div
                    key={comment._id}
                    className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80 space-y-1"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800">
                        {comment.userId?.name || 'Team Member'}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {new Date(comment.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 whitespace-pre-line">{comment.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <form
          onSubmit={handlePostComment}
          className="p-4 border-t border-slate-200 bg-slate-50 flex gap-2"
        >
          <input
            type="text"
            required
            placeholder="Write a comment or status update..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="flex-1 px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={posting}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition disabled:opacity-50"
          >
            {posting ? 'Posting...' : 'Comment'}
          </button>
        </form>
      </div>
    </div>
  );
}