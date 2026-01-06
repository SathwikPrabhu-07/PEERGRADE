const { v4: uuidv4 } = require('uuid');
const { db } = require('../config/firebase');
const credibilityService = require('./credibilityService');
const skillService = require('./skillService');

const SESSIONS_COLLECTION = 'sessions';
const FEEDBACK_COLLECTION = 'feedback';
const USERS_COLLECTION = 'users';

/**
 * Get sessions for a user by status
 */
const getUserSessions = async (userId, status) => {
    // Get sessions where user is teacher
    const teacherQuery = db.collection(SESSIONS_COLLECTION)
        .where('teacherId', '==', userId);



    // Get sessions where user is learner
    const learnerQuery = db.collection(SESSIONS_COLLECTION)
        .where('learnerId', '==', userId);


    const [teacherSnapshot, learnerSnapshot] = await Promise.all([
        status ? teacherQuery.where('status', '==', status).get() : teacherQuery.get(),
        status ? learnerQuery.where('status', '==', status).get() : learnerQuery.get(),
    ]);

    const sessions = [];
    const sessionIds = new Set();

    teacherSnapshot.forEach((doc) => {
        const session = doc.data();
        if (!sessionIds.has(session.id)) {
            sessionIds.add(session.id);
            sessions.push({
                ...session,
                teacher: { name: session.teacherName, avatar: '' },
                learner: { name: session.learnerName, avatar: '' },
                skill: session.skillName,
                dateTime: session.scheduledAt,
            });
        }
    });

    learnerSnapshot.forEach((doc) => {
        const session = doc.data();
        if (!sessionIds.has(session.id)) {
            sessionIds.add(session.id);
            sessions.push({
                ...session,
                teacher: { name: session.teacherName, avatar: '' },
                learner: { name: session.learnerName, avatar: '' },
                skill: session.skillName,
                dateTime: session.scheduledAt,
            });
        }
    });

    // Sort by scheduled date
    sessions.sort((a, b) => new Date(b.scheduledAt) - new Date(a.scheduledAt));

    return sessions;
};

/**
 * Create a session from a confirmed request
 * Supports both single and mutual learning modes
 * 
 * Session schema:
 * - mode: 'single' | 'mutual'
 * - teacherId, learnerId: User IDs
 * - teacherSkill: Skill the teacher teaches
 * - learnerSkill: For mutual mode, skill learner teaches back (null for single)
 * - scheduledAt: null until teacher sets time
 * - status: 'scheduled' | 'completed' | 'cancelled'
/**
 * Sanitize a string for use in Jitsi room name
 * - Lowercase
 * - Replace spaces with hyphens
 * - Remove special characters
 * - Limit length
 */
const sanitizeForRoomName = (str) => {
    if (!str) return '';
    return str
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')           // Replace spaces with hyphens
        .replace(/[^a-z0-9-]/g, '')     // Remove special characters
        .replace(/-+/g, '-')            // Replace multiple hyphens with single
        .replace(/^-|-$/g, '')          // Remove leading/trailing hyphens
        .substring(0, 30);               // Limit length
};

/**
 * Migrate legacy sessions that have UUID-based room names to readable format
 * Only affects sessions that are NOT completed and have a meetingRoom containing a UUID pattern
 * This is a one-time migration function
 */
const migrateSessionRoomNames = async () => {
    const snapshot = await db.collection(SESSIONS_COLLECTION)
        .where('status', 'in', ['scheduled', 'ongoing'])
        .get();

    let migratedCount = 0;
    const batch = db.batch();

    snapshot.forEach((doc) => {
        const session = doc.data();

        // Check if meetingRoom looks like it contains a UUID (legacy format)
        // UUID pattern: contains long alphanumeric segments separated by hyphens
        if (session.meetingRoom && session.meetingRoom.match(/[a-f0-9]{8}-[a-f0-9]{4}/)) {
            // Generate new readable room name
            const skillName = sanitizeForRoomName(session.skillName || 'session');
            const learnerName = sanitizeForRoomName(session.learnerName || 'learner');
            const teacherName = sanitizeForRoomName(session.teacherName || 'teacher');

            const newMeetingRoom = `peergrade-${skillName}-${learnerName}-${teacherName}`;
            const newMeetingUrl = `https://meet.jit.si/${newMeetingRoom}`;

            batch.update(doc.ref, {
                meetingRoom: newMeetingRoom,
                meetingUrl: newMeetingUrl,
            });
            migratedCount++;
        }
    });

    if (migratedCount > 0) {
        await batch.commit();
    }

    return { migratedCount, totalChecked: snapshot.size };
};

const createSession = async (request) => {
    const sessionId = uuidv4();
    const now = new Date();

    // Note: meetingRoom and meetingUrl are NOT generated here
    // They will be generated once when the session is scheduled
    // This ensures stable, readable room names that are never regenerated

    const session = {
        id: sessionId,
        // Mode determines if both users teach/learn
        mode: request.mode || 'single',
        // User roles
        teacherId: request.toUserId,
        teacherName: request.toUserName,
        learnerId: request.fromUserId,
        learnerName: request.fromUserName,
        // Skills being exchanged
        teacherSkill: request.teacherSkill || request.skillName,
        learnerSkill: request.learnerSkill || null, // Only for mutual mode
        skillId: request.skillId,
        skillName: request.skillName,
        // Scheduling
        scheduledAt: null, // Teacher must set time
        status: 'scheduled',
        completedAt: null,
        createdAt: now.toISOString(),
        // Jitsi meeting info - will be set when scheduled
        meetingProvider: null,
        meetingRoom: null,
        meetingUrl: null,
    };

    await db.collection(SESSIONS_COLLECTION).doc(sessionId).set(session);

    return session;
};




/**
 * Schedule a session (set scheduledAt time)
 * Only the teacher can schedule the session
 * Also generates the Jitsi meeting room name at scheduling time (once only)
 */
const scheduleSession = async (sessionId, userId, scheduledAt) => {
    const sessionRef = db.collection(SESSIONS_COLLECTION).doc(sessionId);
    const sessionDoc = await sessionRef.get();

    if (!sessionDoc.exists) {
        const error = new Error('Session not found');
        error.statusCode = 404;
        throw error;
    }

    const session = sessionDoc.data();

    // Only teacher can schedule
    if (session.teacherId !== userId) {
        const error = new Error('Only the teacher can schedule this session');
        error.statusCode = 403;
        throw error;
    }

    if (session.status !== 'scheduled') {
        const error = new Error('Session cannot be rescheduled');
        error.statusCode = 400;
        throw error;
    }

    // Prepare update object
    const updates = {
        scheduledAt,
        updatedAt: new Date().toISOString(),
    };

    // Generate meeting room name ONLY if not already set (one-time generation)
    if (!session.meetingRoom) {
        const skillName = sanitizeForRoomName(session.skillName || 'session');
        const learnerName = sanitizeForRoomName(session.learnerName || 'learner');
        const teacherName = sanitizeForRoomName(session.teacherName || 'teacher');

        // Format: peergrade-{skill}-{learner}-{teacher}
        const meetingRoom = `peergrade-${skillName}-${learnerName}-${teacherName}`;
        const meetingUrl = `https://meet.jit.si/${meetingRoom}`;

        updates.meetingProvider = 'jitsi';
        updates.meetingRoom = meetingRoom;
        updates.meetingUrl = meetingUrl;
    }

    await sessionRef.update(updates);

    const updatedDoc = await sessionRef.get();
    return updatedDoc.data();
};


/**
 * Mark a session as completed
 * Only allows completion if status is 'scheduled' or 'ongoing'
 * Sets status to 'completed' and endedAt timestamp
 */
const completeSession = async (sessionId, userId) => {
    const sessionRef = db.collection(SESSIONS_COLLECTION).doc(sessionId);
    const sessionDoc = await sessionRef.get();

    if (!sessionDoc.exists) {
        const error = new Error('Session not found');
        error.statusCode = 404;
        throw error;
    }

    const session = sessionDoc.data();

    // Ensure user is part of the session
    if (session.teacherId !== userId && session.learnerId !== userId) {
        const error = new Error('Unauthorized to complete this session');
        error.statusCode = 403;
        throw error;
    }

    // Prevent duplicate completion - return early if already completed (idempotent)
    if (session.status === 'completed') {
        return session; // Already completed, just return current state
    }

    // Only allow completion from 'scheduled' or 'ongoing' status
    if (session.status !== 'scheduled' && session.status !== 'ongoing') {
        const error = new Error('Session cannot be completed from current status');
        error.statusCode = 400;
        throw error;
    }

    const endedAt = new Date().toISOString();

    await sessionRef.update({
        status: 'completed',
        endedAt: endedAt,
        completedAt: endedAt, // Keep for backwards compatibility
    });

    const updatedSession = (await sessionRef.get()).data();

    // Auto-create assignments for the completed session
    try {
        const assignmentService = require('./assignmentService');
        await assignmentService.createAssignmentsForSession(updatedSession);
        console.log(`[SessionService] Created assignments for completed session ${sessionId}`);

        // Update Skill Score for both learner and teacher (consistency score update)
        const { recomputeSkillScore } = require('./skillScoreService');
        if (updatedSession.skillId && updatedSession.skillName) {
            // Update for Learner
            await recomputeSkillScore(updatedSession.learnerId, updatedSession.skillId, updatedSession.skillName);

            // Update for Teacher (if they teach the same skill, otherwise consistency applies to their teaching skill?)
            await recomputeSkillScore(updatedSession.teacherId, updatedSession.skillId, updatedSession.skillName);
        }

        // Update Overall Credibility Score (triggered by consistency/session count)
        const { recomputeCredibilityScore } = require('./credibilityService');
        await recomputeCredibilityScore(updatedSession.learnerId);
        await recomputeCredibilityScore(updatedSession.teacherId);

    } catch (assignmentError) {
        // Log but don't fail the session completion
        console.error('[SessionService] Error creating assignments or updating scores:', assignmentError);
    }

    return updatedSession;
};



/**
 * Get session by ID
 */
const getSessionById = async (sessionId) => {
    const sessionDoc = await db.collection(SESSIONS_COLLECTION).doc(sessionId).get();

    if (!sessionDoc.exists) {
        const error = new Error('Session not found');
        error.statusCode = 404;
        throw error;
    }

    return sessionDoc.data();
};

/**
 * Submit feedback for a session
 */
const submitFeedback = async (sessionId, userId, { rating, comment }) => {
    const sessionDoc = await db.collection(SESSIONS_COLLECTION).doc(sessionId).get();

    if (!sessionDoc.exists) {
        const error = new Error('Session not found');
        error.statusCode = 404;
        throw error;
    }

    const session = sessionDoc.data();

    // Ensure user is part of the session
    if (session.teacherId !== userId && session.learnerId !== userId) {
        const error = new Error('Unauthorized to submit feedback for this session');
        error.statusCode = 403;
        throw error;
    }

    // Determine who receives the feedback
    const toUserId = session.teacherId === userId ? session.learnerId : session.teacherId;

    // Check for existing feedback from this user for this session
    const existingSnapshot = await db.collection(FEEDBACK_COLLECTION)
        .where('sessionId', '==', sessionId)
        .where('fromUserId', '==', userId)
        .get();

    if (!existingSnapshot.empty) {
        const error = new Error('You have already submitted feedback for this session');
        error.statusCode = 400;
        throw error;
    }

    const feedbackId = uuidv4();
    const now = new Date().toISOString();

    const feedback = {
        id: feedbackId,
        sessionId,
        fromUserId: userId,
        toUserId,
        rating,
        comment: comment || '',
        createdAt: now,
    };

    await db.collection(FEEDBACK_COLLECTION).doc(feedbackId).set(feedback);

    // Update skill rating if feedback is for teacher
    if (toUserId === session.teacherId) {
        await skillService.updateSkillRating(session.skillId, rating);
    }

    // Recalculate credibility score for the recipient
    await credibilityService.recalculateScore(toUserId);

    return feedback;
};

/**
 * Get completed sessions count for a user
 */
const getCompletedSessionsCount = async (userId) => {
    const teacherSnapshot = await db.collection(SESSIONS_COLLECTION)
        .where('teacherId', '==', userId)
        .where('status', '==', 'completed')
        .get();

    const learnerSnapshot = await db.collection(SESSIONS_COLLECTION)
        .where('learnerId', '==', userId)
        .where('status', '==', 'completed')
        .get();

    return teacherSnapshot.size + learnerSnapshot.size;
};

/**
 * Get average rating for a user
 */
const getAverageRating = async (userId) => {
    const feedbackSnapshot = await db.collection(FEEDBACK_COLLECTION)
        .where('toUserId', '==', userId)
        .get();

    if (feedbackSnapshot.empty) {
        return 0;
    }

    let total = 0;
    feedbackSnapshot.forEach((doc) => {
        total += doc.data().rating;
    });

    return total / feedbackSnapshot.size;
};

module.exports = {
    getUserSessions,
    createSession,
    scheduleSession,
    completeSession,
    getSessionById,
    submitFeedback,
    getCompletedSessionsCount,
    getAverageRating,
    migrateSessionRoomNames,
};

