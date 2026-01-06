const assignmentService = require('../services/assignmentService');

/**
 * Get all assignments for current user
 * GET /api/assignments
 */
const getAssignments = async (req, res, next) => {
    try {
        const assignments = await assignmentService.getAssignmentsForUser(req.user.id);

        // Separate by submitted status
        const pending = assignments.filter(a => !a.submitted);
        const completed = assignments.filter(a => a.submitted);

        res.json({
            success: true,
            data: {
                all: assignments,
                pending,
                completed,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get a single assignment
 * GET /api/assignments/:id
 * Accessible by owner or teacher of the session
 */
const getAssignment = async (req, res, next) => {
    try {
        const { id } = req.params;
        const assignment = await assignmentService.getAssignmentById(id);

        // Allow owner to view
        if (assignment.userId === req.user.id) {
            return res.json({
                success: true,
                data: assignment,
            });
        }

        // Also allow teacher to view for grading
        const { db } = require('../config/firebase');
        const sessionDoc = await db.collection('sessions').doc(assignment.sessionId).get();
        if (sessionDoc.exists && sessionDoc.data().teacherId === req.user.id) {
            return res.json({
                success: true,
                data: assignment,
            });
        }

        return res.status(403).json({
            success: false,
            message: 'You are not authorized to view this assignment',
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get assignments for a session
 * GET /api/assignments/session/:sessionId
 */
const getSessionAssignments = async (req, res, next) => {
    try {
        const { sessionId } = req.params;
        const assignments = await assignmentService.getAssignmentsForSession(sessionId, req.user.id);

        res.json({
            success: true,
            data: assignments,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Submit an assignment
 * POST /api/assignments/:id/submit
 */
const submitAssignment = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { answers } = req.body;

        if (!answers || typeof answers !== 'object') {
            return res.status(400).json({
                success: false,
                message: 'Answers are required',
            });
        }

        const assignment = await assignmentService.submitAssignment(id, req.user.id, answers);

        res.json({
            success: true,
            message: 'Assignment submitted successfully',
            data: assignment,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Grade an assignment (teacher only)
 * POST /api/assignments/:id/grade
 */
const gradeAssignment = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { scores, comment } = req.body;

        // Validate scores
        if (!scores || typeof scores !== 'object') {
            return res.status(400).json({
                success: false,
                message: 'Scores are required as an object with question IDs as keys',
            });
        }

        const assignment = await assignmentService.gradeAssignment(
            id,
            req.user.id,
            scores,
            comment || ''
        );

        res.json({
            success: true,
            message: 'Assignment graded successfully',
            data: assignment,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAssignments,
    getAssignment,
    getSessionAssignments,
    submitAssignment,
    gradeAssignment,
};

