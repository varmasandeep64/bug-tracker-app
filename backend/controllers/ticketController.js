const Ticket = require('../models/Ticket');
const Project = require('../models/Project');

// Helper: verify user is owner or teamMember of the project
const isProjectMember = (project, userId) => {
  const idStr = userId.toString();
  return (
    project.owner.toString() === idStr ||
    project.teamMembers.some((memberId) => memberId.toString() === idStr)
  );
};

// @desc    Create a new ticket inside a project
// @route   POST /api/tickets
const createTicket = async (req, res) => {
  try {
    const { title, description, type, priority, status, projectId, assignee } = req.body;

    if (!title || !projectId) {
      return res.status(400).json({ message: 'Title and projectId are required' });
    }

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    if (!isProjectMember(project, req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to add tickets to this project' });
    }

    // Ensure assignee is a valid member of the same project if provided
    if (assignee && !isProjectMember(project, assignee)) {
      return res.status(400).json({ message: 'Assignee must be a member of this project' });
    }

    const ticket = await Ticket.create({
      title,
      description,
      type: type || 'bug',
      priority: priority || 'medium',
      status: status || 'To Do',
      projectId,
      assignee: assignee || null,
      createdBy: req.user._id,
    });

    const populatedTicket = await Ticket.findById(ticket._id)
      .populate('assignee', 'name email')
      .populate('createdBy', 'name email');

    res.status(201).json(populatedTicket);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all tickets for a specific project (supports optional filters)
// @route   GET /api/tickets/project/:projectId
const getTicketsByProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { status, priority, assignee, search } = req.query;

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    if (!isProjectMember(project, req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to view tickets for this project' });
    }

    // Build dynamic filter query (prepares us for Day 10 Search & Filter!)
    const query = { projectId };
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (assignee) query.assignee = assignee;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const tickets = await Ticket.find(query)
      .populate('assignee', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json(tickets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a ticket (status, priority, title, description, or assignee)
// @route   PUT /api/tickets/:id
const updateTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    const project = await Project.findById(ticket.projectId);
    if (!project || !isProjectMember(project, req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to update this ticket' });
    }

    const { title, description, type, priority, status, assignee } = req.body;

    if (assignee !== undefined) {
      if (assignee && !isProjectMember(project, assignee)) {
        return res.status(400).json({ message: 'Assignee must be a member of this project' });
      }
      ticket.assignee = assignee || null;
    }

    if (title !== undefined) ticket.title = title;
    if (description !== undefined) ticket.description = description;
    if (type !== undefined) ticket.type = type;
    if (priority !== undefined) ticket.priority = priority;
    if (status !== undefined) ticket.status = status;

    await ticket.save();

    const updatedTicket = await Ticket.findById(ticket._id)
      .populate('assignee', 'name email')
      .populate('createdBy', 'name email');

    res.status(200).json(updatedTicket);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a ticket
// @route   DELETE /api/tickets/:id
const deleteTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    const project = await Project.findById(ticket.projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    // Only ticket creator or project owner can delete
    const isCreator = ticket.createdBy.toString() === req.user._id.toString();
    const isOwner = project.owner.toString() === req.user._id.toString();

    if (!isCreator && !isOwner) {
      return res.status(403).json({ message: 'Only the ticket creator or project owner can delete this ticket' });
    }

    await ticket.deleteOne();
    res.status(200).json({ message: 'Ticket deleted', id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createTicket,
  getTicketsByProject,
  updateTicket,
  deleteTicket,
};