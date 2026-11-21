const express = require('express');
const router = express.Router();
const { getCommentsByTicket, addComment } = require('../controllers/commentController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/:ticketId').get(getCommentsByTicket).post(addComment);

module.exports = router;    