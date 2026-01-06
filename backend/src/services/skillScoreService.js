/**
 * SKILL SCORE SERVICE
 * Calculates and persists credibility scores for users' skills
 * 
 * Formula (0-100):
 * - 60% Assignment Performance (Avg score 0-100)
 * - 30% Feedback Rating (Avg rating normalized to 0-100)
 * - 10% Session Consistency (min(sessions * 10, 100))
 */

const { db } = require('../config/firebase');
const { v4: uuidv4 } = require('uuid');

const SKILL_SCORES_COLLECTION = 'skillScores';
const ASSIGNMENTS_COLLECTION = 'assignments';
const FEEDBACK_COLLECTION = 'feedback';
const SESSIONS_COLLECTION = 'sessions';

/**
 * Get skill score for a specific user and skill
 */
const getSkillScore = async (userId, skillId) => {
    const snapshot = await db.collection(SKILL_SCORES_COLLECTION)
        .where('userId', '==', userId)
        .where('skillId', '==', skillId)
        .limit(1)
        .get();

    if (snapshot.empty) return null;
    return snapshot.docs[0].data();
};

/**
 * Get all skill scores for a user
 */
const getSkillScoresForUser = async (userId) => {
    const snapshot = await db.collection(SKILL_SCORES_COLLECTION)
        .where('userId', '==', userId)
        .get();

    return snapshot.docs.map(doc => doc.data());
};

/**
 * Calculate and update the skill score
 * This function is idempotent and recalculates from scratch
 */
const recomputeSkillScore = async (userId, skillId, skillName) => {
    console.log(`[SkillScoreService] Recomputing score for user=${userId} skill=${skillName}`);

    // 1. Calculate Assignment Performance (60%)
    // Fetch all graded assignments for this user and skill
    const assignmentsSnapshot = await db.collection(ASSIGNMENTS_COLLECTION)
        .where('userId', '==', userId)
        .where('skillId', '==', skillId)
        .where('graded', '==', true)
        .get();

    let assignmentAvg = 0;
    if (!assignmentsSnapshot.empty) {
        let totalScore = 0;
        assignmentsSnapshot.forEach(doc => {
            const data = doc.data();
            // normalized to 0-100. stored as finalScore (1-5) or score?
            // User prompt says "assignment.score (0-100)". 
            // My implementation uses `finalScore` (1-5).
            // I will convert finalScore * 20.
            const score = (data.finalScore || 0) * 20;
            totalScore += score;
        });
        assignmentAvg = totalScore / assignmentsSnapshot.size;
    }

    // 2. Calculate Feedback Rating (30%)
    // Fetch all feedback RECEIVED by this user for score contexts
    // Note: Feedback is generic to session. We assume feedback in session with skillId applies.
    const feedbackSnapshot = await db.collection(FEEDBACK_COLLECTION)
        .where('toUserId', '==', userId)
        // We need to filter by skill, but feedback doesn't store skillId directly usually?
        // Wait, prompt says "feedback.skillId (or infer from session)".
        // Current feedback schema in feedbackService doesn't store skillId.
        // It stores `sessionId`. We might need to fetch sessions to filter?
        // OR filtering by sessions found in step 3?
        // To be efficient, let's fetch feedback and filter. 
        // But we can't filter by skillId in query if not indexed/stored.
        // Optimization: Feedback usually comes from the sessions we find in step 3.
        .get();

    // 3. Session Consistency (10%)
    const sessionsSnapshot = await db.collection(SESSIONS_COLLECTION)
        .where('skillId', '==', skillId)
        .where('status', '==', 'completed')
        // Filter where user is learner OR teacher?
        // "assignment performance" implies learner.
        // If I am teacher, assignments are done by others.
        // Let's assume this score is primarily for the role related to the skill.
        // If I list "Python" to Learn, I am learner.
        // If I list "Python" to Teach, I am teacher.
        // It's ambiguous if we merge them.
        // Given "Assignment performance" weight is 60%, this score is heavily biased to Learner.
        // I will filter sessions where user is learner or teacher?
        // Safest: Filter sessions where user is involved.
        .get();

    // Filter sessions where user is a participant
    const relevantSessions = [];
    sessionsSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.learnerId === userId || data.teacherId === userId) {
            relevantSessions.push(data);
        }
    });

    const sessionCount = relevantSessions.length;
    const consistencyScore = Math.min(sessionCount * 10, 100);

    // Filter feedback for these sessions
    const relevantFeedback = [];
    const sessionIds = new Set(relevantSessions.map(s => s.id));

    feedbackSnapshot.forEach(doc => {
        const data = doc.data();
        if (sessionIds.has(data.sessionId)) {
            relevantFeedback.push(data);
        }
    });

    let feedbackAvg = 0;
    if (relevantFeedback.length > 0) {
        let totalRating = 0;
        relevantFeedback.forEach(fb => {
            totalRating += (fb.rating || 0);
        });
        // Normalize 1-5 to 0-100
        // (Avg / 5) * 100 = (Total / Count / 5) * 100 = (Total / Count) * 20
        feedbackAvg = (totalRating / relevantFeedback.length) * 20;
    }

    // Weighted Calculation
    // If no assignments/feedback, those components are 0.
    const weightedScore =
        (assignmentAvg * 0.60) +
        (feedbackAvg * 0.30) +
        (consistencyScore * 0.10);

    const finalScore = Math.round(weightedScore);

    // Save to Firestore
    // specific docId to prevent duplicates: userId_skillId
    const scoreId = `${userId}_${skillId}`;

    const scoreData = {
        id: scoreId,
        userId,
        skillId,
        skillName, // Pass this in or fetch?
        assignmentAvg: Math.round(assignmentAvg),
        feedbackAvg: Math.round(feedbackAvg),
        sessionCount,
        finalScore,
        updatedAt: new Date().toISOString(),
    };

    await db.collection(SKILL_SCORES_COLLECTION).doc(scoreId).set(scoreData);

    console.log(`[SkillScoreService] Updated score for ${skillName}: ${finalScore} (Assgn:${Math.round(assignmentAvg)} FB:${Math.round(feedbackAvg)} Sess:${sessionCount})`);

    return scoreData;
};

module.exports = {
    getSkillScore,
    getSkillScoresForUser,
    recomputeSkillScore,
};
