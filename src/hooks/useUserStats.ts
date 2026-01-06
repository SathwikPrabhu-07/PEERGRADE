import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getCredibilityScore, getSkills, Skill, CredibilityStats } from '@/lib/api';

/**
 * User Stats - Complete data structure with NO undefined fields
 * All fields have explicit defaults
 */
export interface UserStats {
    // Core stats
    credibilityScore: number;
    sessionsCompleted: number;
    studentsCount: number;
    teachingHours: number;
    avgRating: number;

    // Rating breakdown (percentages)
    ratingBreakdown: { [key: number]: number };
    totalReviews: number;

    // Skill counts
    skillsTaughtCount: number;
    skillsLearnedCount: number;

    // Skills arrays
    teachingSkills: Skill[];
    learningSkills: Skill[];

    // Upcoming sessions
    upcomingSessions: UpcomingSession[];

    // Legacy stats for backward compat
    stats: {
        avgSkillScore: number;
        avgTeachingRating: number;
        sessionCount: number;
        consistencyBonus: number;
    };
}

export interface UpcomingSession {
    id: string;
    skill: string;
    teacher: { name: string; avatar: string };
    learner: { name: string; avatar: string };
    dateTime: string | null;
    status: string;
    role: 'teacher' | 'learner';
}

// Default empty state - NEVER show mock/fake values
const DEFAULT_STATS: UserStats = {
    credibilityScore: 0,
    sessionsCompleted: 0,
    studentsCount: 0,
    teachingHours: 0,
    avgRating: 0,
    ratingBreakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    totalReviews: 0,
    skillsTaughtCount: 0,
    skillsLearnedCount: 0,
    teachingSkills: [],
    learningSkills: [],
    upcomingSessions: [],
    stats: {
        avgSkillScore: 0,
        avgTeachingRating: 0,
        sessionCount: 0,
        consistencyBonus: 0,
    },
};

/**
 * Unified hook for user statistics
 * Used by Dashboard, Profile, and Skills pages
 * Ensures consistent data across all pages
 */
export function useUserStats() {
    const { user } = useAuth();
    const [stats, setStats] = useState<UserStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchStats = useCallback(async () => {
        if (!user?.id) {
            console.log('[useUserStats] No user ID, skipping fetch');
            setLoading(false);
            setStats(DEFAULT_STATS);
            return;
        }

        console.log('[useUserStats] Fetching stats for user:', user.id);
        setLoading(true);
        setError(null);

        try {
            // Fetch both credibility and skills in parallel
            const [credibilityRes, skillsRes] = await Promise.all([
                getCredibilityScore(),
                getSkills(user.id),
            ]);

            console.log('[useUserStats] Credibility response:', credibilityRes);
            console.log('[useUserStats] Skills response:', skillsRes);

            // Validate responses
            if (!credibilityRes.success) {
                throw new Error('Credibility fetch failed');
            }

            const cred = credibilityRes.data as CredibilityStats;
            const skills = skillsRes.data;

            // Build complete stats object with EXPLICIT field mapping
            // Each field is mapped exactly from backend response
            const newStats: UserStats = {
                credibilityScore: cred.credibilityScore ?? 0,
                sessionsCompleted: cred.sessionsCompleted ?? 0,
                studentsCount: cred.studentsCount ?? 0,
                teachingHours: cred.teachingHours ?? 0,
                avgRating: cred.avgRating ?? 0,
                ratingBreakdown: cred.ratingBreakdown ?? { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
                totalReviews: cred.totalReviews ?? 0,
                skillsTaughtCount: cred.skillsTaughtCount ?? 0,
                skillsLearnedCount: cred.skillsLearnedCount ?? 0,
                upcomingSessions: cred.upcomingSessions ?? [],
                stats: cred.stats ?? DEFAULT_STATS.stats,
                teachingSkills: skills?.teachingSkills ?? [],
                learningSkills: skills?.learningSkills ?? [],
            };

            console.log('[useUserStats] Final stats object:', {
                credibilityScore: newStats.credibilityScore,
                sessionsCompleted: newStats.sessionsCompleted,
                skillsTaughtCount: newStats.skillsTaughtCount,
                teachingSkillsCount: newStats.teachingSkills.length,
            });

            setStats(newStats);
        } catch (err) {
            console.error('[useUserStats] Error fetching stats:', err);
            setError('Failed to load stats');
            // Set default stats on error - show 0s, not mock data
            setStats(DEFAULT_STATS);
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    // Return stats with guaranteed defaults
    return {
        stats: stats ?? DEFAULT_STATS,
        loading,
        error,
        refetch: fetchStats,
    };
}
