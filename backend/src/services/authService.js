const { db, auth } = require('../config/firebase');

const USERS_COLLECTION = 'users';

/**
 * Register a new user
 */
const register = async ({ name, email, password, role }) => {
    // 1. Create user in Firebase Auth
    const firebaseUser = await auth.createUser({
        email,
        password,
        displayName: name,
    });

    // 2. Create user profile in Firestore
    const userId = firebaseUser.uid;
    const now = new Date().toISOString();

    const userProfile = {
        id: userId,
        name,
        email,
        role,
        bio: '',
        avatar: '',
        credibilityScore: 50,
        createdAt: now,
        updatedAt: now,
    };

    await db.collection(USERS_COLLECTION).doc(userId).set(userProfile);

    // 3. Return user (NO JWT)
    return {
        user: userProfile
    };
};

/**
 * Login user
 */
const login = async ({ email, password }) => {
    // 1. Get user from Firestore
    const usersSnapshot = await db.collection(USERS_COLLECTION)
        .where('email', '==', email)
        .limit(1)
        .get();

    if (usersSnapshot.empty) {
        const error = new Error('Invalid email or password');
        error.statusCode = 401;
        throw error;
    }

    const user = usersSnapshot.docs[0].data();

    // 2. Verify existence in Firebase Auth
    try {
        await auth.getUserByEmail(email);
    } catch (error) {
        const err = new Error('Invalid email or password');
        err.statusCode = 401;
        throw err;
    }

    // 3. Return user (NO JWT)
    return {
        user
    };
};

/**
 * Get current user
 */
const getCurrentUser = async (userId) => {
    const userDoc = await db.collection(USERS_COLLECTION).doc(userId).get();

    if (!userDoc.exists) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
    }

    return {
        user: userDoc.data()
    };
};

module.exports = {
    register,
    login,
    getCurrentUser,
};
