/**
 * CREDIBILITY SERVICE
 * Calculates and persists the overall User Credibility Score
 * 
 * Formula (0-100):
 * - Average of Top 3 Skill Scores
 * - Average Teaching Feedback Rating (Normalized 0-100)
 * - Session Consistency Bonus
 * 
 * Consistency Bonus:
 * - >= 5 sessions: +2
 * - >= 15 sessions: +5
 * - >= 30 sessions: +10
 */

const { db } = require('../config/firebase');

const USERS_COLLECTION = 'users';
const SKILL_SCORES_COLLECTION = 'skillScores';
const FEEDBACK_COLLECTION = 'feedback';
const SESSIONS_COLLECTION = 'sessions';

/**
 * Recompute Credibility Score for a user
 * Triggered by:
 * - Feedback submission
 * - Assignment grading
 * - Session completion
 */
const recomputeCredibilityScore = async (userId) => {
    console.log(`[CredibilityService] Recomputing credibility for user=${userId}`);

    // 1. Fetch Skill Scores (Top 3)
    const skillsSnapshot = await db.collection(SKILL_SCORES_COLLECTION)
        .where('userId', '==', userId)
        .orderBy('finalScore', 'desc')
        .limit(3)
        .get();

    let avgSkillScore = 0;
    if (!skillsSnapshot.empty) {
        let totalSkillScore = 0;
        skillsSnapshot.forEach(doc => {
            totalSkillScore += doc.data().finalScore;
        });
        avgSkillScore = totalSkillScore / skillsSnapshot.size;
    }

    // 2. Fetch Teaching Feedback (Average Rating)
    // We want feedback WHERE this user was the TEACHER (role='teacher' is sender role? No.)
    // In feedback schema:
    // fromUserId: giver
    // toUserId: receiver
    // role: role of the GIVER (teacher/learner)
    // If I am the teacher, I receive feedback from the LEARNER.
    // So we assume feedback where toUserId == userId AND fromUserId was learner?
    // Actually, "Teaching Feedback" implies feedback received when I was teaching.
    // The previous feedbackService implementation didn't store "context role" explicitly for receiving.
    // However, if I received feedback, and the sender (fromUserId) was 'learner', then I was 'teacher'.
    const feedbackSnapshot = await db.collection(FEEDBACK_COLLECTION)
        .where('toUserId', '==', userId)
        .where('role', '==', 'learner') // Feedback FROM learner => I was TEACHER
        .get();

    let avgTeachingRating = 0;
    if (!feedbackSnapshot.empty) {
        let totalRating = 0;
        feedbackSnapshot.forEach(doc => {
            totalRating += doc.data().rating;
        });
        // Normalize 1-5 rating to 0-100
        // (Avg / 5) * 100 
        avgTeachingRating = (totalRating / feedbackSnapshot.size) / 5 * 100;
    }

    // 3. Consistency Bonus (Total Completed Sessions)
    // We count sessions where user was EITHER teacher OR learner??
    // "Consistency bonus based on completed sessions". Usually implies general activity.
    // I will count all completed sessions where user participated.
    // We can't easily query "learnerId == uid OR teacherId == uid" in one query usually.
    // But we can do two queries.
    const learnerSessions = await db.collection(SESSIONS_COLLECTION)
        .where('learnerId', '==', userId)
        .where('status', '==', 'completed')
        .get();

    const teacherSessions = await db.collection(SESSIONS_COLLECTION)
        .where('teacherId', '==', userId)
        .where('status', '==', 'completed')
        .get();

    // De-duplicate? IDs are unique. If I am both? sessions usually have distinct roles.
    // A user can't be both teacher and learner in same session (usually).
    const sessionCount = learnerSessions.size + teacherSessions.size;

    let consistencyBonus = 0;
    if (sessionCount >= 30) consistencyBonus = 10;
    else if (sessionCount >= 15) consistencyBonus = 5;
    else if (sessionCount >= 5) consistencyBonus = 2;

    // Final Calculation
    // What are the weights?
    // Prompt says: "Average of Top 3 Skill Scores... Average Teaching Feedback... Consistency Bonus"
    // Does it mean straight average of (SkillAvg + TeachingAvg) + Bonus?
    // Or weighted?
    // "Compute Credibility Score per user using: Average of top N skill scores... Average teaching feedback rating... Consistency bonus..."
    // Usually implies a formula combining them.
    // Let's assume a balanced weight if not specified, OR simple average of the main components + bonus.
    // Formula from similar systems: (SkillAvg + TeachingAvg) / 2 + Bonus
    // Let's use this reasonable interpretation.

    const baseScore = (avgSkillScore + avgTeachingRating) / 2;
    // Handle edge case: If no teaching feedback yet?
    // If no feedback, maybe just skill score?
    // If no skills, maybe just 0?

    let finalScore = 0;
    if (skillsSnapshot.empty && feedbackSnapshot.empty) {
        finalScore = 0;
    } else if (feedbackSnapshot.empty) {
        finalScore = avgSkillScore; // Only skills
    } else if (skillsSnapshot.empty) {
        finalScore = avgTeachingRating; // Only feedback?
    } else {
        finalScore = baseScore;
    }

    finalScore += consistencyBonus;

    // Clamp to 0-100
    finalScore = Math.min(Math.max(finalScore, 0), 100);
    finalScore = Math.round(finalScore);

    // Save to User Profile
    await db.collection(USERS_COLLECTION).doc(userId).update({
        credibilityScore: finalScore,
        credibilityStats: {
            avgSkillScore: Math.round(avgSkillScore),
            avgTeachingRating: Math.round(avgTeachingRating),
            sessionCount,
            consistencyBonus,
            updatedAt: new Date().toISOString()
        }
    });

    console.log(`[CredibilityService] Updated score for user ${userId}: ${finalScore}`);

    return {
        credibilityScore: finalScore,
        stats: {
            avgSkillScore,
            avgTeachingRating,
            sessionCount,
            consistencyBonus
        }
    };
};

/**
 * Get credibility details for a user with COMPLETE guaranteed stats
 * NEVER returns undefined fields - all have explicit defaults
 */
const getCredibility = async (userId) => {
    // Default response structure - ALWAYS returned with these fields
    const defaultResponse = {
        credibilityScore: 0,
        sessionsCompleted: 0,
        studentsCount: 0,
        teachingHours: 0,
        avgRating: 0,
        ratingBreakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        skillsTaughtCount: 0,
        skillsLearnedCount: 0,
        totalReviews: 0,
        upcomingSessions: [],
        // Legacy stats object for backward compatibility
        stats: {
            avgSkillScore: 0,
            avgTeachingRating: 0,
            sessionCount: 0,
            consistencyBonus: 0
        }
    };

    try {
        const userDoc = await db.collection(USERS_COLLECTION).doc(userId).get();
        if (!userDoc.exists) {
            console.log(`[CredibilityService] User ${userId} not found, returning defaults`);
            return defaultResponse;
        }

        const data = userDoc.data();

        // Get skill counts from userSkills collection
        const teachingSkillsSnapshot = await db.collection('userSkills')
            .where('userId', '==', userId)
            .where('type', '==', 'teach')
            .get();

        const learningSkillsSnapshot = await db.collection('userSkills')
            .where('userId', '==', userId)
            .where('type', '==', 'learn')
            .get();

        // Get ALL feedback for rating breakdown
        const feedbackSnapshot = await db.collection(FEEDBACK_COLLECTION)
            .where('toUserId', '==', userId)
            .get();

        const ratingBreakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        let totalRating = 0;
        feedbackSnapshot.forEach(doc => {
            const rating = doc.data().rating;
            if (rating >= 1 && rating <= 5) {
                ratingBreakdown[rating]++;
                totalRating += rating;
            }
        });

        const totalFeedback = feedbackSnapshot.size;
        const avgRating = totalFeedback > 0 ? totalRating / totalFeedback : 0;

        // Calculate rating percentages
        const ratingPercentages = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        for (let i = 5; i >= 1; i--) {
            ratingPercentages[i] = totalFeedback > 0
                ? Math.round((ratingBreakdown[i] / totalFeedback) * 100)
                : 0;
        }

        // Get completed sessions as teacher (for studentsCount and teachingHours)
        const teacherSessionsSnapshot = await db.collection(SESSIONS_COLLECTION)
            .where('teacherId', '==', userId)
            .where('status', '==', 'completed')
            .get();

        // Get completed sessions as learner
        const learnerSessionsSnapshot = await db.collection(SESSIONS_COLLECTION)
            .where('learnerId', '==', userId)
            .where('status', '==', 'completed')
            .get();

        const sessionsCompleted = teacherSessionsSnapshot.size + learnerSessionsSnapshot.size;

        // Count unique students taught
        const studentsSet = new Set();
        teacherSessionsSnapshot.forEach(doc => {
            studentsSet.add(doc.data().learnerId);
        });
        const studentsCount = studentsSet.size;

        // Estimate teaching hours (1 hour per session as teacher)
        const teachingHours = teacherSessionsSnapshot.size;

        // Get upcoming sessions
        let upcomingSessions = [];
        try {
            // These queries require composite indexes:
            // - sessions: teacherId + status + scheduledAt
            // - sessions: learnerId + status + scheduledAt
            // See firestore.indexes.json for index definitions

            const upcomingAsTeacher = await db.collection(SESSIONS_COLLECTION)
                .where('teacherId', '==', userId)
                .where('status', '==', 'scheduled')
                .orderBy('scheduledAt', 'asc')
                .limit(5)
                .get();

            const upcomingAsLearner = await db.collection(SESSIONS_COLLECTION)
                .where('learnerId', '==', userId)
                .where('status', '==', 'scheduled')
                .orderBy('scheduledAt', 'asc')
                .limit(5)
                .get();

            upcomingAsTeacher.forEach(doc => {
                const s = doc.data();
                upcomingSessions.push({
                    id: s.id || doc.id,
                    skill: s.skillName || 'Session',
                    teacher: { name: 'You', avatar: '' },
                    learner: { name: s.learnerName || 'Learner', avatar: '' },
                    dateTime: s.scheduledAt || null,
                    status: s.status || 'scheduled',
                    role: 'teacher'
                });
            });

            upcomingAsLearner.forEach(doc => {
                const s = doc.data();
                upcomingSessions.push({
                    id: s.id || doc.id,
                    skill: s.skillName || 'Session',
                    teacher: { name: s.teacherName || 'Teacher', avatar: '' },
                    learner: { name: 'You', avatar: '' },
                    dateTime: s.scheduledAt || null,
                    status: s.status || 'scheduled',
                    role: 'learner'
                });
            });

            // Sort by date
            upcomingSessions.sort((a, b) => {
                if (!a.dateTime) return 1;
                if (!b.dateTime) return -1;
                return new Date(a.dateTime) - new Date(b.dateTime);
            });
            upcomingSessions = upcomingSessions.slice(0, 3);

            console.log(`[CredibilityService] Found ${upcomingSessions.length} upcoming sessions for user ${userId}`);

        } catch (err) {
            // Check for FAILED_PRECONDITION (missing index) error
            if (err.code === 9 || err.message?.includes('FAILED_PRECONDITION') || err.message?.includes('index')) {
                console.error('[CredibilityService] FIRESTORE INDEX REQUIRED for upcoming sessions query.');
                console.error('[CredibilityService] Error:', err.message);
                console.error('[CredibilityService] To fix: Deploy indexes using "firebase deploy --only firestore:indexes"');
                console.error('[CredibilityService] Or create indexes manually in Firebase Console.');

                // Fallback: Try simpler query without orderBy (doesn't need composite index)
                try {
                    console.log('[CredibilityService] Attempting fallback query without orderBy...');

                    const fallbackTeacher = await db.collection(SESSIONS_COLLECTION)
                        .where('teacherId', '==', userId)
                        .where('status', '==', 'scheduled')
                        .limit(5)
                        .get();

                    const fallbackLearner = await db.collection(SESSIONS_COLLECTION)
                        .where('learnerId', '==', userId)
                        .where('status', '==', 'scheduled')
                        .limit(5)
                        .get();

                    fallbackTeacher.forEach(doc => {
                        const s = doc.data();
                        upcomingSessions.push({
                            id: s.id || doc.id,
                            skill: s.skillName || 'Session',
                            teacher: { name: 'You', avatar: '' },
                            learner: { name: s.learnerName || 'Learner', avatar: '' },
                            dateTime: s.scheduledAt || null,
                            status: s.status || 'scheduled',
                            role: 'teacher'
                        });
                    });

                    fallbackLearner.forEach(doc => {
                        const s = doc.data();
                        upcomingSessions.push({
                            id: s.id || doc.id,
                            skill: s.skillName || 'Session',
                            teacher: { name: s.teacherName || 'Teacher', avatar: '' },
                            learner: { name: 'You', avatar: '' },
                            dateTime: s.scheduledAt || null,
                            status: s.status || 'scheduled',
                            role: 'learner'
                        });
                    });

                    // Sort in JavaScript since we can't use orderBy
                    upcomingSessions.sort((a, b) => {
                        if (!a.dateTime) return 1;
                        if (!b.dateTime) return -1;
                        return new Date(a.dateTime) - new Date(b.dateTime);
                    });
                    upcomingSessions = upcomingSessions.slice(0, 3);

                    console.log(`[CredibilityService] Fallback query found ${upcomingSessions.length} sessions`);

                } catch (fallbackErr) {
                    console.error('[CredibilityService] Fallback query also failed:', fallbackErr.message);
                    // upcomingSessions stays empty
                }
            } else {
                console.error('[CredibilityService] Error fetching upcoming sessions:', err.message);
            }
            // upcomingSessions array will be empty or contain fallback results
        }

        // Build complete response - NEVER undefined
        const credibilityStats = data.credibilityStats || {};

        return {
            credibilityScore: data.credibilityScore ?? 0,
            sessionsCompleted: sessionsCompleted,
            studentsCount: studentsCount,
            teachingHours: teachingHours,
            avgRating: Math.round(avgRating * 10) / 10, // 1 decimal place
            ratingBreakdown: ratingPercentages,
            skillsTaughtCount: teachingSkillsSnapshot.size,
            skillsLearnedCount: learningSkillsSnapshot.size,
            totalReviews: totalFeedback,
            upcomingSessions: upcomingSessions,
            // Legacy stats for backward compatibility
            stats: {
                avgSkillScore: credibilityStats.avgSkillScore ?? 0,
                avgTeachingRating: credibilityStats.avgTeachingRating ?? 0,
                sessionCount: sessionsCompleted,
                consistencyBonus: credibilityStats.consistencyBonus ?? 0
            }
        };
    } catch (error) {
        console.error('[CredibilityService] Error in getCredibility:', error);
        return defaultResponse;
    }
};

module.exports = {
    recomputeCredibilityScore,
    getCredibility
};
