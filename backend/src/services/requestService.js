const { v4: uuidv4 } = require('uuid');
const { db } = require('../config/firebase');

const REQUESTS_COLLECTION = 'requests';
const USERS_COLLECTION = 'users';
const USER_SKILLS_COLLECTION = 'userSkills';

/**
 * Create a 503 error for Firestore index issues
 */
const createIndexError = (queryName) => {
    const error = new Error(`Firestore index still building for ${queryName}. Please retry in a moment.`);
    error.statusCode = 503;
    error.code = 'INDEX_BUILDING';
    return error;
};

/**
 * Get all requests for a user (incoming and outgoing)
 * 
 * INDEX-SAFE: Uses single where() clause only, sorts in JavaScript
 * No composite indexes required.
 */
const getUserRequests = async (userId) => {
    let incoming = [];
    let outgoing = [];

    // Get incoming requests (where user is the teacher) - SINGLE WHERE ONLY
    try {
        const incomingSnapshot = await db.collection(REQUESTS_COLLECTION)
            .where('toUserId', '==', userId)
            .get();

        // Filter and sort in JavaScript (no Firestore index needed)
        incoming = incomingSnapshot.docs
            .map((doc) => ({
                ...doc.data(),
                user: { name: doc.data().fromUserName, avatar: '' },
                skill: doc.data().skillName,
                timestamp: doc.data().createdAt,
            }))
            .filter(r => r.status === 'pending') // Filter in JS
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); // Sort in JS
    } catch (error) {
        console.error('[RequestService] Error fetching incoming requests:', error);
        if (error.code === 9 || error.code === 'failed-precondition') {
            throw createIndexError('incoming requests');
        }
        throw error;
    }

    // Get outgoing requests (where user sent the request) - SINGLE WHERE ONLY
    try {
        const outgoingSnapshot = await db.collection(REQUESTS_COLLECTION)
            .where('fromUserId', '==', userId)
            .get();

        // Filter and sort in JavaScript (no Firestore index needed)
        outgoing = outgoingSnapshot.docs
            .map((doc) => ({
                ...doc.data(),
                user: { name: doc.data().toUserName, avatar: '' },
                skill: doc.data().skillName,
                timestamp: doc.data().createdAt,
            }))
            .filter(r => r.status === 'pending') // Filter in JS
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); // Sort in JS
    } catch (error) {
        console.error('[RequestService] Error fetching outgoing requests:', error);
        if (error.code === 9 || error.code === 'failed-precondition') {
            throw createIndexError('outgoing requests');
        }
        throw error;
    }

    return { incoming, outgoing };
};

/**
 * Get a single request by ID with additional details
 */
const getRequestById = async (requestId, userId) => {
    const requestDoc = await db.collection(REQUESTS_COLLECTION).doc(requestId).get();

    if (!requestDoc.exists) {
        const error = new Error('Request not found');
        error.statusCode = 404;
        throw error;
    }

    const request = requestDoc.data();

    // Only participants can view request details
    if (request.fromUserId !== userId && request.toUserId !== userId) {
        const error = new Error('Unauthorized to view this request');
        error.statusCode = 403;
        throw error;
    }

    // Get other user's skills (for mutual learning selection)
    const otherUserId = request.fromUserId === userId ? request.toUserId : request.fromUserId;

    const otherUserSkillsSnapshot = await db.collection(USER_SKILLS_COLLECTION)
        .where('userId', '==', otherUserId)
        .where('type', '==', 'teach')
        .get();

    const otherUserSkills = otherUserSkillsSnapshot.docs.map(doc => ({
        id: doc.data().id,
        name: doc.data().skillName || doc.data().name,
        category: doc.data().category,
        level: doc.data().level,
    }));

    return {
        ...request,
        otherUserSkills,
    };
};

/**
 * Send a session request
 * Extended schema includes mode, teacherSkill, learnerSkill, confirmed
 */
const sendRequest = async (fromUserId, { teacherId, skillId, message }) => {
    // Get sender info
    const fromUserDoc = await db.collection(USERS_COLLECTION).doc(fromUserId).get();
    if (!fromUserDoc.exists) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
    }
    const fromUser = fromUserDoc.data();

    // Get teacher info
    const toUserDoc = await db.collection(USERS_COLLECTION).doc(teacherId).get();
    if (!toUserDoc.exists) {
        const error = new Error('Teacher not found');
        error.statusCode = 404;
        throw error;
    }
    const toUser = toUserDoc.data();

    // Get skill info
    const skillDoc = await db.collection(USER_SKILLS_COLLECTION).doc(skillId).get();
    if (!skillDoc.exists) {
        const error = new Error('Skill not found');
        error.statusCode = 404;
        throw error;
    }
    const skill = skillDoc.data();

    // Prevent self-request
    if (fromUserId === teacherId) {
        const error = new Error('Cannot send request to yourself');
        error.statusCode = 400;
        throw error;
    }

    // Check for existing pending request
    const existingSnapshot = await db.collection(REQUESTS_COLLECTION)
        .where('fromUserId', '==', fromUserId)
        .where('toUserId', '==', teacherId)
        .where('skillId', '==', skillId)
        .where('status', '==', 'pending')
        .get();

    if (!existingSnapshot.empty) {
        const error = new Error('You already have a pending request for this skill');
        error.statusCode = 400;
        throw error;
    }

    const requestId = uuidv4();
    const now = new Date().toISOString();

    const request = {
        id: requestId,
        fromUserId,
        fromUserName: fromUser.name,
        toUserId: teacherId,
        toUserName: toUser.name,
        skillId,
        skillName: skill.skillName || skill.name,
        message: message || '',
        status: 'pending',
        // Negotiation state - null until confirmed
        mode: null,              // 'single' | 'mutual' | null
        teacherSkill: skill.skillName || skill.name, // The skill being taught
        learnerSkill: null,      // For mutual learning mode
        confirmed: false,
        createdAt: now,
    };

    await db.collection(REQUESTS_COLLECTION).doc(requestId).set(request);

    return request;
};

/**
 * Accept a request and atomically create a session
 * Uses Firestore transaction to ensure both operations succeed together
 */
const acceptRequest = async (requestId, userId) => {
    const { v4: uuidv4 } = require('uuid');

    const requestRef = db.collection(REQUESTS_COLLECTION).doc(requestId);
    const sessionsCollection = db.collection('sessions');

    // Run in a transaction to ensure atomicity
    const result = await db.runTransaction(async (transaction) => {
        const requestDoc = await transaction.get(requestRef);

        if (!requestDoc.exists) {
            const error = new Error('Request not found');
            error.statusCode = 404;
            throw error;
        }

        const request = requestDoc.data();

        // Ensure user is the recipient (teacher)
        if (request.toUserId !== userId) {
            const error = new Error('Unauthorized to accept this request');
            error.statusCode = 403;
            throw error;
        }

        if (request.status !== 'pending') {
            const error = new Error('Request is no longer pending');
            error.statusCode = 400;
            throw error;
        }

        // Check for existing session for this request (idempotency)
        const existingSessionQuery = await sessionsCollection
            .where('requestId', '==', requestId)
            .limit(1)
            .get();

        if (!existingSessionQuery.empty) {
            // Session already exists - return existing data (idempotent)
            const existingSession = existingSessionQuery.docs[0].data();
            return {
                request: { ...request, status: 'accepted' },
                session: existingSession,
                alreadyExists: true,
            };
        }

        // Create new session
        const sessionId = uuidv4();
        const now = new Date().toISOString();

        const session = {
            id: sessionId,
            requestId: requestId,
            // Skill info
            skillId: request.skillId,
            skillName: request.skillName,
            // Teacher = recipient of request (toUser)
            teacherId: request.toUserId,
            teacherName: request.toUserName,
            // Learner = sender of request (fromUser)
            learnerId: request.fromUserId,
            learnerName: request.fromUserName,
            // Status - pending scheduling until teacher sets time
            status: 'scheduled', // Using 'scheduled' to match existing UI expectations
            scheduledAt: null,   // Will be set when teacher schedules
            startedAt: null,
            endedAt: null,
            completedAt: null,
            createdAt: now,
            // Mode - will be set during confirmation if needed
            mode: 'single',
            teacherSkill: request.skillName,
            learnerSkill: null,
            // Meeting info - will be set when scheduled
            meetingProvider: null,
            meetingRoom: null,
            meetingUrl: null,
        };

        const sessionRef = sessionsCollection.doc(sessionId);

        // Update request status
        transaction.update(requestRef, {
            status: 'accepted',
            acceptedAt: now,
            sessionId: sessionId, // Link to created session
            updatedAt: now,
        });

        // Create session document
        transaction.set(sessionRef, session);

        return {
            request: { ...request, status: 'accepted', acceptedAt: now, sessionId },
            session: session,
            alreadyExists: false,
        };
    });

    return result;
};


/**
 * Confirm a request with mode selection (creates session)
 * mode: 'single' | 'mutual'
 * teacherSkill: The skill the teacher will teach
 * learnerSkill: For mutual mode, the skill the learner will teach back (from their skills)
 */
const confirmRequest = async (requestId, userId, { mode, teacherSkill, learnerSkill }) => {
    const requestRef = db.collection(REQUESTS_COLLECTION).doc(requestId);
    const requestDoc = await requestRef.get();

    if (!requestDoc.exists) {
        const error = new Error('Request not found');
        error.statusCode = 404;
        throw error;
    }

    const request = requestDoc.data();

    // Only participants can confirm
    if (request.fromUserId !== userId && request.toUserId !== userId) {
        const error = new Error('Unauthorized to confirm this request');
        error.statusCode = 403;
        throw error;
    }

    if (request.status !== 'accepted') {
        const error = new Error('Request must be accepted before confirmation');
        error.statusCode = 400;
        throw error;
    }

    if (request.confirmed) {
        const error = new Error('Request is already confirmed');
        error.statusCode = 400;
        throw error;
    }

    // Validate mode
    if (!['single', 'mutual'].includes(mode)) {
        const error = new Error('Mode must be "single" or "mutual"');
        error.statusCode = 400;
        throw error;
    }

    // For mutual mode, validate learnerSkill is from the other user's skills
    if (mode === 'mutual') {
        if (!learnerSkill) {
            const error = new Error('Learner skill is required for mutual learning');
            error.statusCode = 400;
            throw error;
        }

        // Get the other user's skills to validate
        const otherUserId = request.fromUserId === userId ? request.toUserId : request.fromUserId;
        const otherUserSkillsSnapshot = await db.collection(USER_SKILLS_COLLECTION)
            .where('userId', '==', otherUserId)
            .where('type', '==', 'teach')
            .get();

        const validSkills = otherUserSkillsSnapshot.docs.map(doc =>
            doc.data().skillName || doc.data().name
        );

        if (!validSkills.includes(learnerSkill)) {
            const error = new Error('Selected skill is not available from the other user');
            error.statusCode = 400;
            throw error;
        }
    }

    await requestRef.update({
        mode,
        teacherSkill,
        learnerSkill: mode === 'mutual' ? learnerSkill : null,
        confirmed: true,
        confirmedBy: userId,
        confirmedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    });

    const updatedDoc = await requestRef.get();
    return updatedDoc.data();
};

/**
 * Reject a request
 */
const rejectRequest = async (requestId, userId) => {
    const requestRef = db.collection(REQUESTS_COLLECTION).doc(requestId);
    const requestDoc = await requestRef.get();

    if (!requestDoc.exists) {
        const error = new Error('Request not found');
        error.statusCode = 404;
        throw error;
    }

    const request = requestDoc.data();

    if (request.toUserId !== userId) {
        const error = new Error('Unauthorized to reject this request');
        error.statusCode = 403;
        throw error;
    }

    if (request.status !== 'pending') {
        const error = new Error('Request is no longer pending');
        error.statusCode = 400;
        throw error;
    }

    await requestRef.update({
        status: 'rejected',
        updatedAt: new Date().toISOString(),
    });

    return { success: true, message: 'Request rejected' };
};

/**
 * Cancel a request (by sender)
 */
const cancelRequest = async (requestId, userId) => {
    const requestRef = db.collection(REQUESTS_COLLECTION).doc(requestId);
    const requestDoc = await requestRef.get();

    if (!requestDoc.exists) {
        const error = new Error('Request not found');
        error.statusCode = 404;
        throw error;
    }

    const request = requestDoc.data();

    if (request.fromUserId !== userId) {
        const error = new Error('Unauthorized to cancel this request');
        error.statusCode = 403;
        throw error;
    }

    if (request.status !== 'pending') {
        const error = new Error('Request is no longer pending');
        error.statusCode = 400;
        throw error;
    }

    await requestRef.delete();

    return { success: true, message: 'Request cancelled' };
};

/**
 * Get count of rejected requests for a user
 */
const getRejectedRequestsCount = async (userId) => {
    const snapshot = await db.collection(REQUESTS_COLLECTION)
        .where('fromUserId', '==', userId)
        .where('status', '==', 'rejected')
        .get();

    return snapshot.size;
};

module.exports = {
    getUserRequests,
    getRequestById,
    sendRequest,
    acceptRequest,
    confirmRequest,
    rejectRequest,
    cancelRequest,
    getRejectedRequestsCount,
};
