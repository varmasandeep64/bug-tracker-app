const Comment = require('../models/Comment');
const Ticket = require('../models/Ticket');
const Project = require('../models/Project');

const isProjectMember = (project, userId) => {
  const idStr = userId.toString();
  return (
    project.owner.toString() === idStr ||
    project.teamMembers.some((memberId) => memberId.toString() === idStr)
  );
};

// @desc    Get all comments for a ticket
// @route   GET /api/comments/:ticketId
const getCommentsByTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.ticketId);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    const project = await Project.findById(ticket.projectId);
    if (!project || !isProjectMember(project, req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to view comments on this ticket' });
    }

    const comments = await Comment.find({ ticketId: req.params.ticketId })
      .populate('userId', 'name email role')
      .sort({ createdAt: 1 }); // Oldest first so conversation reads top-to-bottom

    res.status(200).json(comments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add a comment to a ticket
// @route   POST /api/comments/:ticketId
const addComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Comment text cannot be empty' });
    }

    const ticket = await Ticket.findById(req.params.ticketId);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    const project = await Project.findById(ticket.projectId);
    if (!project || !isProjectMember(project, req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to comment on this ticket' });
    }

    const comment = await Comment.create({
      ticketId: req.params.ticketId,
      userId: req.user._id,
      text: text.trim(),
    });

    const populatedComment = await Comment.findById(comment._id).populate(
      'userId',
      'name email role'
    );

    res.status(201).json(populatedComment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getCommentsByTicket, addComment };