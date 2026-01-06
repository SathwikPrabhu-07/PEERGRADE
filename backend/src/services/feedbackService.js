const { v4: uuidv4 } = require('uuid');
const { db } = require('../config/firebase');

const FEEDBACK_COLLECTION = 'feedback';
const SESSIONS_COLLECTION = 'sessions';

/**
 * Submit feedback for a completed session
 * 
 * Rules:
 * - Session must exist and be completed
 * - User must be participant (teacher or learner)
 * - One feedback per user per session
 */
const submitFeedback = async (sessionId, userId, { rating, comment }) => {
    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
        const error = new Error('Rating must be between 1 and 5');
        error.statusCode = 400;
        throw error;
    }

    // Get session
    const sessionDoc = await db.collection(SESSIONS_COLLECTION).doc(sessionId).get();
    if (!sessionDoc.exists) {
        const error = new Error('Session not found');
        error.statusCode = 404;
        throw error;
    }

    const session = sessionDoc.data();

    // Check session is completed
    if (session.status !== 'completed') {
        const error = new Error('Feedback can only be submitted for completed sessions');
        error.statusCode = 400;
        throw error;
    }

    // Check user is participant
    const isTeacher = session.teacherId === userId;
    const isLearner = session.learnerId === userId;

    if (!isTeacher && !isLearner) {
        const error = new Error('You are not a participant of this session');
        error.statusCode = 403;
        throw error;
    }

    // Check for existing feedback from this user
    const existingFeedback = await db.collection(FEEDBACK_COLLECTION)
        .where('sessionId', '==', sessionId)
        .where('fromUserId', '==', userId)
        .limit(1)
        .get();

    if (!existingFeedback.empty) {
        const error = new Error('You have already submitted feedback for this session');
        error.statusCode = 409;
        throw error;
    }

    // Determine role and recipient
    const role = isTeacher ? 'teacher' : 'learner';
    const toUserId = isTeacher ? session.learnerId : session.teacherId;

    // Create feedback
    const feedbackId = uuidv4();
    const now = new Date().toISOString();

    const feedback = {
        id: feedbackId,
        sessionId,
        fromUserId: userId,
        toUserId,
        role,
        rating,
        comment: comment || '',
        createdAt: now,
    };

    await db.collection(FEEDBACK_COLLECTION).doc(feedbackId).set(feedback);

    // Update Skill Score for the recipient
    const { recomputeSkillScore } = require('./skillScoreService');
    // Using session info derived earlier
    if (session.skillId && session.skillName) {
        await recomputeSkillScore(toUserId, session.skillId, session.skillName);
    }

    // Update Overall Credibility Score (triggered by feedback rating)
    const { recomputeCredibilityScore } = require('./credibilityService');
    await recomputeCredibilityScore(toUserId);

    return feedback;
};

/**
 * Get all feedback for a session
 */
const getFeedbackForSession = async (sessionId, userId) => {
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

    const feedbackSnapshot = await db.collection(FEEDBACK_COLLECTION)
        .where('sessionId', '==', sessionId)
        .get();

    return feedbackSnapshot.docs.map(doc => doc.data());
};

/**
 * Check if user has submitted feedback for a session
 */
const hasUserSubmittedFeedback = async (sessionId, userId) => {
    const feedbackSnapshot = await db.collection(FEEDBACK_COLLECTION)
        .where('sessionId', '==', sessionId)
        .where('fromUserId', '==', userId)
        .limit(1)
        .get();

    return !feedbackSnapshot.empty;
};

/**
 * Get average rating received by a user
 */
const getUserAverageRating = async (userId) => {
    const feedbackSnapshot = await db.collection(FEEDBACK_COLLECTION)
        .where('toUserId', '==', userId)
        .get();

    if (feedbackSnapshot.empty) {
        return { average: 0, count: 0 };
    }

    let total = 0;
    feedbackSnapshot.forEach(doc => {
        total += doc.data().rating;
    });

    return {
        average: total / feedbackSnapshot.size,
        count: feedbackSnapshot.size,
    };
};

module.exports = {
    submitFeedback,
    getFeedbackForSession,
    hasUserSubmittedFeedback,
    getUserAverageRating,
};
