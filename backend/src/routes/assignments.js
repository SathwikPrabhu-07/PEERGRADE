const express = require('express');
const router = express.Router();
const assignmentController = require('../controllers/assignmentController');
const { authMiddleware } = require('../middleware/auth');

// Debug: confirm routes are loaded
console.log('[Assignments Routes] Registering assignment routes...');

// All assignment routes require authentication
router.use(authMiddleware);

// Get all assignments for current user
router.get('/', (req, res, next) => {
    console.log('[Assignments] GET /api/assignments hit - user:', req.user?.id);
    next();
}, assignmentController.getAssignments);

// Get assignments for a specific session (must come before :id route)
router.get('/session/:sessionId', assignmentController.getSessionAssignments);

// Get a single assignment
router.get('/:id', assignmentController.getAssignment);

// Submit an assignment
router.post('/:id/submit', assignmentController.submitAssignment);

// Grade an assignment (teacher only)
router.post('/:id/grade', assignmentController.gradeAssignment);

console.log('[Assignments Routes] Assignment routes registered successfully');

module.exports = router;

