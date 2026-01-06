const { v4: uuidv4 } = require('uuid');
const { db } = require('../config/firebase');

const MESSAGES_COLLECTION = 'messages';
const REQUESTS_COLLECTION = 'requests';

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
 * Get messages for a request
 * 
 * INDEX-SAFE: Uses single where() clause only, sorts in JavaScript
 * No composite indexes required.
 */
const getMessages = async (requestId, userId) => {
    // Verify user has access to this request
    const requestDoc = await db.collection(REQUESTS_COLLECTION).doc(requestId).get();

    if (!requestDoc.exists) {
        const error = new Error('Request not found');
        error.statusCode = 404;
        throw error;
    }

    const request = requestDoc.data();

    // Only participants can view messages
    if (request.fromUserId !== userId && request.toUserId !== userId) {
        const error = new Error('Unauthorized to view messages');
        error.statusCode = 403;
        throw error;
    }

    // Get messages for this request - SINGLE WHERE ONLY, sort in JS
    try {
        const snapshot = await db.collection(MESSAGES_COLLECTION)
            .where('requestId', '==', requestId)
            .get();

        // Sort by createdAt in JavaScript (no Firestore index needed)
        const messages = snapshot.docs
            .map(doc => doc.data())
            .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

        return messages;
    } catch (error) {
        console.error('[MessageService] Error fetching messages:', error);
        if (error.code === 9 || error.code === 'failed-precondition') {
            throw createIndexError('messages');
        }
        throw error;
    }
};

/**
 * Send a message in a request negotiation
 */
const sendMessage = async (requestId, userId, text) => {
    // Verify user has access to this request
    const requestDoc = await db.collection(REQUESTS_COLLECTION).doc(requestId).get();

    if (!requestDoc.exists) {
        const error = new Error('Request not found');
        error.statusCode = 404;
        throw error;
    }

    const request = requestDoc.data();

    // Only participants can send messages
    if (request.fromUserId !== userId && request.toUserId !== userId) {
        const error = new Error('Unauthorized to send messages');
        error.statusCode = 403;
        throw error;
    }

    // Determine recipient
    const toUserId = request.fromUserId === userId ? request.toUserId : request.fromUserId;

    const messageId = uuidv4();
    const now = new Date().toISOString();

    const message = {
        id: messageId,
        requestId,
        fromUserId: userId,
        toUserId,
        text,
        createdAt: now,
    };

    await db.collection(MESSAGES_COLLECTION).doc(messageId).set(message);

    return message;
};

module.exports = {
    getMessages,
    sendMessage,
};
