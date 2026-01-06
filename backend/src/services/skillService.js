const { v4: uuidv4 } = require('uuid');
const { db } = require('../config/firebase');

const SKILLS_COLLECTION = 'skills';
const USER_SKILLS_COLLECTION = 'userSkills';

/**
 * Get all skills for a user (both teaching and learning)
 */
const getUserSkills = async (userId) => {
    const snapshot = await db.collection(USER_SKILLS_COLLECTION)
        .where('userId', '==', userId)
        .get();

    const teachingSkills = [];
    const learningSkills = [];

    snapshot.forEach((doc) => {
        const skill = doc.data();
        if (skill.type === 'teach') {
            teachingSkills.push(skill);
        } else {
            learningSkills.push(skill);
        }
    });

    return { teachingSkills, learningSkills };
};

/**
 * Add a skill for a user
 */
const addSkill = async (userId, { name, category, level, type, description }) => {
    const skillId = uuidv4();
    const now = new Date().toISOString();

    const userSkill = {
        id: skillId,
        userId,
        skillName: name,
        name, // Keep both for compatibility
        category,
        level,
        type, // 'teach' or 'learn'
        description: description || '',
        verificationStatus: 'unverified',
        rating: 0,
        reviewCount: 0,
        createdAt: now,
    };

    await db.collection(USER_SKILLS_COLLECTION).doc(skillId).set(userSkill);

    return userSkill;
};

/**
 * Remove a skill from user
 */
const removeSkill = async (skillId, userId) => {
    const skillDoc = await db.collection(USER_SKILLS_COLLECTION).doc(skillId).get();

    if (!skillDoc.exists) {
        const error = new Error('Skill not found');
        error.statusCode = 404;
        throw error;
    }

    const skill = skillDoc.data();

    // Ensure user owns this skill
    if (skill.userId !== userId) {
        const error = new Error('Unauthorized to remove this skill');
        error.statusCode = 403;
        throw error;
    }

    await db.collection(USER_SKILLS_COLLECTION).doc(skillId).delete();

    return { success: true, message: 'Skill removed successfully' };
};

/**
 * Get ALL teaching skills from ALL users
 * Used by frontend to join with teachers at render time
 */
const getAllTeachingSkills = async () => {
    const snapshot = await db.collection(USER_SKILLS_COLLECTION)
        .where('type', '==', 'teach')
        .get();

    return snapshot.docs.map(doc => {
        const skill = doc.data();
        return {
            id: skill.id,
            userId: skill.userId,
            name: skill.skillName || skill.name,
            category: skill.category,
            level: skill.level,
            rating: skill.rating || 0,
            verificationStatus: skill.verificationStatus || 'unverified',
        };
    });
};

/**
 * Get a single skill by ID
 */
const getSkillById = async (skillId) => {
    const skillDoc = await db.collection(USER_SKILLS_COLLECTION).doc(skillId).get();

    if (!skillDoc.exists) {
        const error = new Error('Skill not found');
        error.statusCode = 404;
        throw error;
    }

    return skillDoc.data();
};

/**
 * Update skill verification status
 */
const updateSkillVerification = async (skillId, status) => {
    const skillRef = db.collection(USER_SKILLS_COLLECTION).doc(skillId);

    await skillRef.update({
        verificationStatus: status,
        updatedAt: new Date().toISOString(),
    });

    const updatedDoc = await skillRef.get();
    return updatedDoc.data();
};

/**
 * Update skill rating (called after feedback)
 */
const updateSkillRating = async (skillId, newRating) => {
    const skillRef = db.collection(USER_SKILLS_COLLECTION).doc(skillId);
    const skillDoc = await skillRef.get();

    if (!skillDoc.exists) return;

    const skill = skillDoc.data();
    const currentTotal = skill.rating * skill.reviewCount;
    const newReviewCount = skill.reviewCount + 1;
    const newAvgRating = (currentTotal + newRating) / newReviewCount;

    await skillRef.update({
        rating: parseFloat(newAvgRating.toFixed(2)),
        reviewCount: newReviewCount,
        updatedAt: new Date().toISOString(),
    });
};

/**
 * Get count of verified skills for a user
 */
const getVerifiedSkillsCount = async (userId) => {
    const snapshot = await db.collection(USER_SKILLS_COLLECTION)
        .where('userId', '==', userId)
        .where('type', '==', 'teach')
        .where('verificationStatus', '==', 'verified')
        .get();

    return snapshot.size;
};

module.exports = {
    getUserSkills,
    addSkill,
    removeSkill,
    getSkillById,
    getAllTeachingSkills,
    updateSkillVerification,
    updateSkillRating,
    getVerifiedSkillsCount,
};

