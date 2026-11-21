const express = require('express');
const router = express.Router();
const {
  createTicket,
  getTicketsByProject,
  updateTicket,
  deleteTicket,
} = require('../controllers/ticketController');
const { protect } = require('../middleware/authMiddleware');

// Protect all ticket routes with JWT middleware
router.use(protect);

router.post('/', createTicket);
router.get('/project/:projectId', getTicketsByProject);
router.route('/:id').put(updateTicket).delete(deleteTicket);

module.exports = router;