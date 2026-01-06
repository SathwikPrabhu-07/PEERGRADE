const { db } = require('../config/firebase');

const USER_SKILLS_COLLECTION = 'userSkills';
const USERS_COLLECTION = 'users';

/**
 * Get ALL teachers with their teaching skills
 * 
 * INDEX-SAFE: Uses single where() only
 * Returns deterministic results - ALL users with teaching skills
 */
const getTeachers = async ({ category, level, search }) => {
    // Step 1: Get ALL teaching skills (no orderBy, no composite index needed)
    const skillsSnapshot = await db.collection(USER_SKILLS_COLLECTION)
        .where('type', '==', 'teach')
        .get();

    // Step 2: Group skills by userId
    const skillsByUser = new Map();

    skillsSnapshot.docs.forEach(doc => {
        const skill = doc.data();
        const userId = skill.userId;

        if (!skillsByUser.has(userId)) {
            skillsByUser.set(userId, []);
        }
        skillsByUser.get(userId).push({
            id: skill.id,
            name: skill.skillName || skill.name,
            level: skill.level,
            category: skill.category,
            rating: skill.rating || 0,
            verificationStatus: skill.verificationStatus || 'unverified',
        });
    });

    // Step 3: Fetch user data for each teacher
    const teachers = [];

    for (const [userId, skills] of skillsByUser.entries()) {
        const userDoc = await db.collection(USERS_COLLECTION).doc(userId).get();

        if (userDoc.exists) {
            const user = userDoc.data();

            // Filter skills by category/level if provided (in JavaScript)
            let filteredSkills = skills;

            if (category && category !== 'All') {
                filteredSkills = filteredSkills.filter(s => s.category === category);
            }
            if (level && level !== 'All') {
                filteredSkills = filteredSkills.filter(s => s.level === level);
            }

            // Only include teacher if they have matching skills after filter
            if (filteredSkills.length > 0) {
                // Get the highest rated skill for display
                const topSkill = filteredSkills.reduce((best, current) =>
                    (current.rating > (best?.rating || 0)) ? current : best
                    , filteredSkills[0]);

                teachers.push({
                    id: userId,
                    name: user.name,
                    avatar: user.avatar || '',
                    skill: topSkill?.name || '',
                    skillId: topSkill?.id || '',
                    level: topSkill?.level || 'Beginner',
                    rating: topSkill?.rating || 0,
                    credibilityScore: user.credibilityScore || 0,
                    category: topSkill?.category || '',
                    allSkills: filteredSkills,
                });
            }
        }
    }

    // Step 4: Apply search filter in JavaScript
    let result = teachers;
    if (search) {
        const searchLower = search.toLowerCase();
        result = result.filter((teacher) =>
            teacher.name.toLowerCase().includes(searchLower) ||
            teacher.skill.toLowerCase().includes(searchLower) ||
            teacher.allSkills.some((s) => s.name.toLowerCase().includes(searchLower))
        );
    }

    // Step 5: Sort by credibility score (deterministic)
    result.sort((a, b) => b.credibilityScore - a.credibilityScore || a.name.localeCompare(b.name));

    console.log(`[TeacherService] Returning ${result.length} teachers (${skillsSnapshot.size} total skills)`);

    return result;
};

/**
 * Get a single teacher by ID
 */
const getTeacherById = async (teacherId) => {
    const userDoc = await db.collection(USERS_COLLECTION).doc(teacherId).get();

    if (!userDoc.exists) {
        const error = new Error('Teacher not found');
        error.statusCode = 404;
        throw error;
    }

    const user = userDoc.data();

    // Get teaching skills - single where only
    const skillsSnapshot = await db.collection(USER_SKILLS_COLLECTION)
        .where('userId', '==', teacherId)
        .get();

    const skills = skillsSnapshot.docs
        .map(doc => doc.data())
        .filter(s => s.type === 'teach'); // Filter in JS

    return {
        id: teacherId,
        name: user.name,
        avatar: user.avatar,
        bio: user.bio,
        credibilityScore: user.credibilityScore,
        skills,
    };
};

module.exports = {
    getTeachers,
    getTeacherById,
};
