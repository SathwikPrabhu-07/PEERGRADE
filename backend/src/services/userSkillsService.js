/**
 * USER SKILLS SERVICE
 * Manages skill credibility scores per user
 * 
 * Collection: userSkills
 * Schema:
 * - userId: string
 * - skillId: string
 * - skillName: string
 * - score: number (0-100)
 * - sessions: number (count of graded sessions)
 * - lastUpdated: string (ISO timestamp)
 */

const { db } = require('../config/firebase');

const USER_SKILLS_COLLECTION = 'userSkills';

/**
 * Get or create a user skill record
 * 
 * @param {string} userId - The user ID
 * @param {string} skillId - The skill ID
 * @param {string} skillName - The skill name for display
 */
const getOrCreateUserSkill = async (userId, skillId, skillName) => {
    const docId = `${userId}_${skillId}`;
    const docRef = db.collection(USER_SKILLS_COLLECTION).doc(docId);
    const doc = await docRef.get();

    if (doc.exists) {
        return doc.data();
    }

    // Create new skill record
    const newSkill = {
        id: docId,
        userId,
        skillId,
        skillName,
        score: 0,
        sessions: 0,
        lastUpdated: new Date().toISOString(),
    };

    await docRef.set(newSkill);
    return newSkill;
};

/**
 * Update user skill score based on assignment grade
 * 
 * Formula:
 * assignmentScore = finalScore * 20 (converts 1-5 to 0-100 scale)
 * newScore = (oldScore * sessions + assignmentScore) / (sessions + 1)
 * 
 * @param {string} userId - The user ID
 * @param {string} skillId - The skill ID
 * @param {string} skillName - The skill name
 * @param {number} finalScore - The assignment final score (1-5 average)
 */
const updateSkillScore = async (userId, skillId, skillName, finalScore) => {
    const userSkill = await getOrCreateUserSkill(userId, skillId, skillName);

    // Convert 1-5 scale to 0-100
    const assignmentScore = finalScore * 20;

    // Calculate weighted average
    const oldScore = userSkill.score || 0;
    const sessions = userSkill.sessions || 0;
    const newScore = (oldScore * sessions + assignmentScore) / (sessions + 1);

    // Round to 2 decimal places
    const roundedScore = Math.round(newScore * 100) / 100;

    const docId = `${userId}_${skillId}`;
    await db.collection(USER_SKILLS_COLLECTION).doc(docId).update({
        score: roundedScore,
        sessions: sessions + 1,
        lastUpdated: new Date().toISOString(),
    });

    console.log(`[UserSkillsService] Updated ${skillName} score for user ${userId}: ${roundedScore} (${sessions + 1} sessions)`);

    return {
        ...userSkill,
        score: roundedScore,
        sessions: sessions + 1,
        lastUpdated: new Date().toISOString(),
    };
};

/**
 * Get all skills for a user
 */
const getUserSkills = async (userId) => {
    const snapshot = await db.collection(USER_SKILLS_COLLECTION)
        .where('userId', '==', userId)
        .get();

    return snapshot.docs.map(doc => doc.data());
};

/**
 * Get a specific user skill
 */
const getUserSkill = async (userId, skillId) => {
    const docId = `${userId}_${skillId}`;
    const doc = await db.collection(USER_SKILLS_COLLECTION).doc(docId).get();

    if (!doc.exists) {
        return null;
    }

    return doc.data();
};

module.exports = {
    getOrCreateUserSkill,
    updateSkillScore,
    getUserSkills,
    getUserSkill,
};
