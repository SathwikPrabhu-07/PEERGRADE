/**
 * GEMINI SERVICE
 * Generates dynamic questions for assignments using Google Gemini API
 * 
 * Uses gemini-1.5-flash model (free-tier compatible)
 */

const { GoogleGenerativeAI } = require("@google/generative-ai");
const { v4: uuidv4 } = require('uuid');

// Initialize Gemini client and model at module load
const genAI = process.env.GEMINI_API_KEY
    ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    : null;

const model = genAI
    ? genAI.getGenerativeModel({ model: "gemini-1.5-flash" })
    : null;

// In-memory cache to prevent repeated API calls
const questionCache = new Map();

/**
 * Static fallback questions used when Gemini is unavailable
 */
const getFallbackQuestions = (skillName) => {
    return [
        { id: "q1", text: `What was the most important concept you learned about ${skillName}?`, type: "text" },
        { id: "q2", text: `Describe one practical application of ${skillName} you discovered.`, type: "text" },
        { id: "q3", text: `What would you like to learn more about in ${skillName}?`, type: "text" },
    ];
};

/**
 * Generate dynamic questions using Gemini AI
 * 
 * @param {string} skillName - The skill to generate questions for
 * @returns {Promise<Array>} Array of 3 question objects
 */
async function generateQuestions(skillName) {
    // Normalize skill name for cache
    const cacheKey = skillName.toLowerCase().trim();

    // Check cache first
    if (questionCache.has(cacheKey)) {
        console.log(`[GeminiService] 📦 Cache HIT for "${skillName}"`);
        return questionCache.get(cacheKey).map(q => ({
            id: uuidv4(),
            text: q.text,
            type: "text"
        }));
    }

    // Fallback if no API key
    if (!model) {
        console.warn('[GeminiService] ⚠️ No API key configured - using fallback');
        return getFallbackQuestions(skillName);
    }

    console.log(`[GeminiService] 🔄 Generating questions for skill: "${skillName}"`);

    const prompt = `
Generate exactly 3 practical, skill-specific interview questions for:
"${skillName}"

Rules:
- Questions must be applied/practical
- Avoid generic aptitude unless skill demands it
- One question per line
- No numbering or explanations
`;

    try {
        const result = await model.generateContent(prompt);
        const text = result.response.text();

        const questions = text
            .split("\n")
            .map(q => q.trim())
            .filter(Boolean)
            .filter(q => q.length > 10)
            .slice(0, 3)
            .map((q, i) => ({
                id: `q${i + 1}`,
                text: q.replace(/^\d+[\.\)\-\s]+/, ''), // Remove numbering
                type: "text"
            }));

        // Ensure we have 3 questions
        while (questions.length < 3) {
            questions.push({
                id: `q${questions.length + 1}`,
                text: `What is an important aspect of ${skillName} you would like to explore?`,
                type: "text"
            });
        }

        // Cache the questions
        questionCache.set(cacheKey, questions);

        console.log(`[GeminiService] ✅ Gemini generated questions for ${skillName}`);
        return questions;

    } catch (err) {
        console.warn("[GeminiService] ❌ Gemini failed:", err.message);
        return getFallbackQuestions(skillName);
    }
}

/**
 * Clear the question cache
 */
const clearCache = () => {
    questionCache.clear();
    console.log('[GeminiService] Cache cleared');
};

module.exports = {
    generateQuestions,
    getFallbackQuestions,
    clearCache
};
