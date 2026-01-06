const { v4: uuidv4 } = require('uuid');
const { db } = require('../config/firebase');
const { generateQuestions } = require('./geminiService');

const ASSIGNMENTS_COLLECTION = 'assignments';
const SESSIONS_COLLECTION = 'sessions';

/**
 * Create an assignment for a user after session completion
 * Questions are dynamically generated using Gemini AI
 * Falls back to static questions if Gemini fails
 * 
 * @param {string} sessionId - The session this assignment is for
 * @param {string} userId - The user who must complete the assignment
 * @param {string} skillId - The skill being practiced
 * @param {string} skillName - The skill name for display
 * @param {string} mode - 'single' or 'mutual' learning mode
 */
const createAssignment = async (sessionId, userId, skillId, skillName, mode = 'single') => {
    // Check if assignment already exists for this session/user
    const existingQuery = await db.collection(ASSIGNMENTS_COLLECTION)
        .where('sessionId', '==', sessionId)
        .where('userId', '==', userId)
        .limit(1)
        .get();

    if (!existingQuery.empty) {
        // Return existing assignment (idempotent)
        return existingQuery.docs[0].data();
    }

    const assignmentId = uuidv4();
    const now = new Date().toISOString();

    // Generate questions using Gemini AI (falls back to static if unavailable)
    let questions;
    try {
        questions = await generateQuestions(skillName, mode);
        console.log(`[AssignmentService] Generated ${questions.length} questions for ${skillName}`);
    } catch (error) {
        console.error('[AssignmentService] Error generating questions:', error.message);
        // Fallback already handled in geminiService, but extra safety
        questions = [
            { id: uuidv4(), text: `What was the most important concept you learned about ${skillName}?`, type: 'text' },
            { id: uuidv4(), text: `Describe one practical application of ${skillName} you discovered.`, type: 'text' },
            { id: uuidv4(), text: `What would you like to learn more about in ${skillName}?`, type: 'text' },
        ];
    }

    const assignment = {
        id: assignmentId,
        sessionId,
        userId,
        skillId,
        skillName,
        questions,
        answers: {},        // Will be populated on submission
        submitted: false,
        submittedAt: null,
        createdAt: now,
    };

    await db.collection(ASSIGNMENTS_COLLECTION).doc(assignmentId).set(assignment);

    return assignment;
};


/**
 * Create assignments when a session is completed
 * - Single learning: learner only
 * - Mutual learning: both users
 */
const createAssignmentsForSession = async (session) => {
    const assignments = [];
    const mode = session.mode || 'single';

    // Always create assignment for learner
    const learnerAssignment = await createAssignment(
        session.id,
        session.learnerId,
        session.skillId,
        session.skillName,
        mode
    );
    assignments.push(learnerAssignment);

    // For mutual learning, also create assignment for teacher (learning reverse skill)
    if (mode === 'mutual' && session.learnerSkill) {
        const teacherAssignment = await createAssignment(
            session.id,
            session.teacherId,
            session.skillId,
            session.learnerSkill,
            mode
        );
        assignments.push(teacherAssignment);
    }

    return assignments;
};


/**
 * Get all assignments for a user
 */
const getAssignmentsForUser = async (userId) => {
    const snapshot = await db.collection(ASSIGNMENTS_COLLECTION)
        .where('userId', '==', userId)
        .get();

    const assignments = snapshot.docs.map(doc => doc.data());

    // Sort by createdAt DESC in JavaScript
    return assignments.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
};

/**
 * Get assignments for a specific session
 */
const getAssignmentsForSession = async (sessionId, userId) => {
    // Get session to verify access
    const sessionDoc = await db.collection(SESSIONS_COLLECTION).doc(sessionId).get();
    if (!sessionDoc.exists) {
        const error = new Error('Session not found');
        error.statusCode = 404;
        throw error;
    }

    const session = sessionDoc.data();

    // Check user is participant
    if (session.teacherId !== userId && session.learnerId !== userId) {
        const error = new Error('You are not a participant of this session');
        error.statusCode = 403;
        throw error;
    }

    const snapshot = await db.collection(ASSIGNMENTS_COLLECTION)
        .where('sessionId', '==', sessionId)
        .get();

    return snapshot.docs.map(doc => doc.data());
};

/**
 * Get a single assignment by ID
 */
const getAssignmentById = async (assignmentId) => {
    const doc = await db.collection(ASSIGNMENTS_COLLECTION).doc(assignmentId).get();

    if (!doc.exists) {
        const error = new Error('Assignment not found');
        error.statusCode = 404;
        throw error;
    }

    return doc.data();
};

/**
 * Submit answers for an assignment
 * 
 * Rules:
 * - User must own the assignment
 * - Assignment must not already be submitted
 */
const submitAssignment = async (assignmentId, userId, answers) => {
    const assignmentRef = db.collection(ASSIGNMENTS_COLLECTION).doc(assignmentId);
    const assignmentDoc = await assignmentRef.get();

    if (!assignmentDoc.exists) {
        const error = new Error('Assignment not found');
        error.statusCode = 404;
        throw error;
    }

    const assignment = assignmentDoc.data();

    // Check ownership
    if (assignment.userId !== userId) {
        const error = new Error('You are not authorized to submit this assignment');
        error.statusCode = 403;
        throw error;
    }

    // Check if already submitted
    if (assignment.submitted) {
        const error = new Error('Assignment has already been submitted');
        error.statusCode = 400;
        throw error;
    }

    // Update with answers
    const now = new Date().toISOString();
    await assignmentRef.update({
        answers,
        submitted: true,
        submittedAt: now,
    });

    const updatedDoc = await assignmentRef.get();
    return updatedDoc.data();
};

/**
 * Grade an assignment (teacher only)
 * 
 * Rules:
 * - Only teacher of the session can grade
 * - Assignment must be submitted
 * - Assignment must not already be graded
 * - All questions must have scores 1-5
 * 
 * @param {string} assignmentId - The assignment to grade
 * @param {string} graderId - The user grading (must be teacher)
 * @param {Object} scores - Question scores { questionId: score (1-5) }
 * @param {string} comment - Optional grader comment
 */
const gradeAssignment = async (assignmentId, graderId, scores, comment = '') => {
    const userSkillsService = require('./userSkillsService');

    const assignmentRef = db.collection(ASSIGNMENTS_COLLECTION).doc(assignmentId);
    const assignmentDoc = await assignmentRef.get();

    if (!assignmentDoc.exists) {
        const error = new Error('Assignment not found');
        error.statusCode = 404;
        throw error;
    }

    const assignment = assignmentDoc.data();

    // Get session to verify teacher
    const sessionDoc = await db.collection(SESSIONS_COLLECTION).doc(assignment.sessionId).get();
    if (!sessionDoc.exists) {
        const error = new Error('Session not found');
        error.statusCode = 404;
        throw error;
    }

    const session = sessionDoc.data();

    // Only teacher can grade
    if (session.teacherId !== graderId) {
        const error = new Error('Only the teacher can grade this assignment');
        error.statusCode = 403;
        throw error;
    }

    // Assignment must be submitted
    if (!assignment.submitted) {
        const error = new Error('Assignment must be submitted before grading');
        error.statusCode = 400;
        throw error;
    }

    // Check if already graded
    if (assignment.graded) {
        const error = new Error('Assignment has already been graded');
        error.statusCode = 400;
        throw error;
    }

    // Validate scores
    const questionIds = assignment.questions.map(q => q.id);
    for (const qId of questionIds) {
        if (scores[qId] === undefined) {
            const error = new Error(`Missing score for question ${qId}`);
            error.statusCode = 400;
            throw error;
        }
        const score = scores[qId];
        if (typeof score !== 'number' || score < 1 || score > 5) {
            const error = new Error(`Score for question ${qId} must be between 1 and 5`);
            error.statusCode = 400;
            throw error;
        }
    }

    // Calculate final score (average of all question scores)
    const scoreValues = Object.values(scores);
    const finalScore = scoreValues.reduce((sum, s) => sum + s, 0) / scoreValues.length;
    const roundedFinalScore = Math.round(finalScore * 100) / 100;

    const now = new Date().toISOString();

    // Update assignment with grades
    await assignmentRef.update({
        graded: true,
        gradedBy: graderId,
        gradedAt: now,
        scores,
        finalScore: roundedFinalScore,
        graderComment: comment,
    });

    // Update legacy user skill score (keeping for backward compatibility)
    await userSkillsService.updateSkillScore(
        assignment.userId,
        assignment.skillId,
        assignment.skillName,
        roundedFinalScore
    );

    // Update NEW Skill Score (0-100)
    const { recomputeSkillScore } = require('./skillScoreService');
    await recomputeSkillScore(assignment.userId, assignment.skillId, assignment.skillName);

    // Update Overall Credibility Score (triggered by skill score change)
    const { recomputeCredibilityScore } = require('./credibilityService');
    await recomputeCredibilityScore(assignment.userId);

    console.log(`[AssignmentService] Graded assignment ${assignmentId} with score ${roundedFinalScore}`);

    const updatedDoc = await assignmentRef.get();
    return updatedDoc.data();
};

module.exports = {
    createAssignment,
    createAssignmentsForSession,
    getAssignmentsForUser,
    getAssignmentsForSession,
    getAssignmentById,
    submitAssignment,
    gradeAssignment,
};

