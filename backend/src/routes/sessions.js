const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');
const { authMiddleware } = require('../middleware/auth');

// All session routes require authentication
router.use(authMiddleware);

router.get('/', sessionController.getSessions);
// Migration route - must come before :id routes
router.post('/migrate-room-names', sessionController.migrateRoomNames);
router.get('/:id', sessionController.getSession);
router.put('/:id/schedule', sessionController.scheduleSession);
router.post('/:id/complete', sessionController.completeSession);
router.get('/:id/join', sessionController.joinSession);
router.get('/:id/feedback', sessionController.getFeedback);
router.post('/:id/feedback', sessionController.submitFeedback);

module.exports = router;
