const { db } = require('../config/firebase');

const USERS_COLLECTION = 'users';
const SESSIONS_COLLECTION = 'sessions';
const FEEDBACK_COLLECTION = 'feedback';

/**
 * Get user by ID (internal use)
 */
const getUserById = async (userId) => {
    const userDoc = await db.collection(USERS_COLLECTION).doc(userId).get();

    if (!userDoc.exists) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
    }

    return { id: userId, ...userDoc.data() };
};

/**
 * Get user profile (for /me endpoint)
 * Returns user data with guaranteed fields
 */
const getUserProfile = async (userId) => {
    console.log(`[UserService] getUserProfile for: ${userId}`);

    const userDoc = await db.collection(USERS_COLLECTION).doc(userId).get();

    if (!userDoc.exists) {
        console.log(`[UserService] User ${userId} not found`);
        return null;
    }

    const data = userDoc.data();

    // Return with guaranteed fields
    return {
        id: userId,
        name: data.name || 'User',
        email: data.email || '',
        role: data.role || 'both',
        bio: data.bio || '',
        avatar: data.avatar || '',
        credibilityScore: data.credibilityScore || 0,
        createdAt: data.createdAt || null,
    };
};

/**
 * Get public profile (for viewing other users)
 */
const getPublicProfile = async (userId) => {
    console.log(`[UserService] getPublicProfile for: ${userId}`);

    const userDoc = await db.collection(USERS_COLLECTION).doc(userId).get();

    if (!userDoc.exists) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
    }

    const data = userDoc.data();

    // Return public-safe fields only
    return {
        id: userId,
        name: data.name || 'User',
        bio: data.bio || '',
        avatar: data.avatar || '',
        credibilityScore: data.credibilityScore || 0,
    };
};

/**
 * Update user profile
 */
const updateUserProfile = async (userId, updates) => {
    const userRef = db.collection(USERS_COLLECTION).doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
    }

    // Only allow certain fields to be updated
    const allowedUpdates = ['name', 'bio', 'avatar'];
    const filteredUpdates = {};

    for (const key of allowedUpdates) {
        if (updates[key] !== undefined) {
            filteredUpdates[key] = updates[key];
        }
    }

    filteredUpdates.updatedAt = new Date().toISOString();

    await userRef.update(filteredUpdates);

    // Return updated user
    const updatedDoc = await userRef.get();
    return { id: userId, ...updatedDoc.data() };
};

/**
 * Get user statistics
 */
const getUserStats = async (userId) => {
    console.log(`[UserService] getUserStats for: ${userId}`);

    // Get completed sessions where user was teacher
    const teacherSessionsSnapshot = await db.collection(SESSIONS_COLLECTION)
        .where('teacherId', '==', userId)
        .where('status', '==', 'completed')
        .get();

    // Get completed sessions where user was learner
    const learnerSessionsSnapshot = await db.collection(SESSIONS_COLLECTION)
        .where('learnerId', '==', userId)
        .where('status', '==', 'completed')
        .get();

    // Get feedback received
    const feedbackSnapshot = await db.collection(FEEDBACK_COLLECTION)
        .where('toUserId', '==', userId)
        .get();

    // Calculate average rating
    let totalRating = 0;
    let ratingCount = 0;

    feedbackSnapshot.forEach((doc) => {
        const feedback = doc.data();
        totalRating += feedback.rating;
        ratingCount++;
    });

    const avgRating = ratingCount > 0 ? (totalRating / ratingCount).toFixed(1) : 0;

    // Count unique students helped
    const studentsHelped = new Set();
    teacherSessionsSnapshot.forEach((doc) => {
        studentsHelped.add(doc.data().learnerId);
    });

    // Estimate teaching hours (1 hour per session)
    const hoursTeaching = teacherSessionsSnapshot.size;

    return {
        sessionsCompleted: teacherSessionsSnapshot.size + learnerSessionsSnapshot.size,
        sessionsAsTeacher: teacherSessionsSnapshot.size,
        sessionsAsLearner: learnerSessionsSnapshot.size,
        studentsHelped: studentsHelped.size,
        hoursTeaching,
        avgRating: parseFloat(avgRating),
        totalReviews: ratingCount,
    };
};

/**
 * Get all users (for admin/debugging)
 */
const getAllUsers = async () => {
    const snapshot = await db.collection(USERS_COLLECTION).get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

module.exports = {
    getUserById,
    getUserProfile,
    getPublicProfile,
    updateUserProfile,
    getUserStats,
    getAllUsers,
};

