const { updateUserProfile, getUserProfile, getPublicProfile, getUserStats } = require('../services/userService');
const { getCredibility } = require('../services/credibilityService');
const { db } = require('../config/firebase');

// Required by task: Implement minimal getUser
const getUser = async (req, res, next) => {
    try {
        // Reads req.userId (assuming req.user.id from auth middleware)
        const userId = req.user ? req.user.id : null;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const user = await getUserProfile(userId);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({ success: true, user });
    } catch (error) {
        next(error);
    }
};

// Update user profile
const updateProfile = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const updates = req.body;

        const updatedUser = await updateUserProfile(userId, updates);

        res.json({
            success: true,
            data: updatedUser
        });
    } catch (error) {
        next(error);
    }
};

// Get current user profile
const getProfile = async (req, res, next) => {
    try {
        const userId = req.user.id;
        console.log(`[UserController] getProfile for user: ${userId}`);

        const user = await getUserProfile(userId);

        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        next(error);
    }
};

// Get public profile of another user
const getPublicUserProfile = async (req, res, next) => {
    try {
        const { id } = req.params;
        const profile = await getPublicProfile(id);

        res.json({
            success: true,
            data: profile
        });
    } catch (error) {
        next(error);
    }
};

// Get credibility score - MAIN DASHBOARD DATA
const getCredibilityScore = async (req, res, next) => {
    try {
        const userId = req.user.id;
        console.log(`[UserController] getCredibilityScore for user: ${userId}`);

        const data = await getCredibility(userId);

        console.log(`[UserController] Returning credibility data:`, {
            credibilityScore: data.credibilityScore,
            sessionsCompleted: data.sessionsCompleted,
            skillsTaughtCount: data.skillsTaughtCount,
            skillsLearnedCount: data.skillsLearnedCount
        });

        res.json({
            success: true,
            data
        });
    } catch (error) {
        console.error('[UserController] Error in getCredibilityScore:', error);
        next(error);
    }
};

// Get user stats (alternate endpoint)
const getStats = async (req, res, next) => {
    try {
        const userId = req.user.id;
        console.log(`[UserController] getStats for user: ${userId}`);

        const stats = await getUserStats(userId);

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        next(error);
    }
};

// Get user skills
const getUserSkills = async (req, res, next) => {
    try {
        const userId = req.user.id;
        console.log(`[UserController] getUserSkills for user: ${userId}`);

        const teachingSnapshot = await db.collection('userSkills')
            .where('userId', '==', userId)
            .where('type', '==', 'teach')
            .get();

        const learningSnapshot = await db.collection('userSkills')
            .where('userId', '==', userId)
            .where('type', '==', 'learn')
            .get();

        const teachingSkills = teachingSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        const learningSkills = learningSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        res.json({
            success: true,
            data: {
                teachingSkills,
                learningSkills
            }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getUser,
    updateProfile,
    getProfile,
    getPublicUserProfile,
    getCredibilityScore,
    getStats,
    getUserSkills
};

