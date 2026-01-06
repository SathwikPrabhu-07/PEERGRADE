const express = require('express');
const router = express.Router();
const requestController = require('../controllers/requestController');
const { authMiddleware } = require('../middleware/auth');

// All request routes require authentication
router.use(authMiddleware);

// Request CRUD
router.get('/', requestController.getRequests);
router.post('/', requestController.sendRequest);
router.get('/:id', requestController.getRequest);
router.put('/:id/accept', requestController.acceptRequest);
router.post('/:id/confirm', requestController.confirmRequest);
router.put('/:id/reject', requestController.rejectRequest);
router.delete('/:id', requestController.cancelRequest);

// Messages (negotiation chat)
router.get('/:id/messages', requestController.getMessages);
router.post('/:id/messages', requestController.sendMessage);

module.exports = router;
