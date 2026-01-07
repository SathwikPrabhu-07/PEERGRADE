// ===============================
// API BASE URL (PRODUCTION SAFE)
// ===============================
// IMPORTANT:
// - Never hardcode localhost in this file
// - Backend URL must come from environment variables

export const API_BASE_URL = import.meta.env.VITE_API_URL;

if (!API_BASE_URL) {
    console.error(
        "VITE_API_URL is not defined. API calls will fail."
    );
}

// API utility functions for backend communication

export async function signup(data: any) {
    const res = await fetch(`${API_BASE_URL}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });

    if (!res.ok) {
        throw new Error("Signup failed");
    }

    return res.json();
}


// Storage keys
export const USER_ID_KEY = 'peergrade_user_id';

/**
 * Get stored user ID
 * Uses sessionStorage for tab isolation - each tab maintains independent auth
 */
export function getUserId(): string | null {
    return sessionStorage.getItem(USER_ID_KEY);
}

/**
 * Store user ID
 * Uses sessionStorage for tab isolation
 */
export function setUserId(userId: string): void {
    sessionStorage.setItem(USER_ID_KEY, userId);
}

/**
 * Remove user ID and clear all cached state
 */
export function removeUserId(): void {
    sessionStorage.removeItem(USER_ID_KEY);
    // Clear any other session-specific data
    sessionStorage.clear();
}

/**
 * Base fetch wrapper with JSON handling
 * - Explicitly sets POST/GET method
 * - Always includes Content-Type header
 * - Throws meaningful errors
 */
async function baseFetch<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    console.log(`[API] ${options.method || 'GET'} ${url}`);

    const response = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...options.headers,
        },
    });

    // Handle non-JSON error responses
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
        if (!response.ok) {
            throw new Error(`Request failed with status ${response.status}`);
        }
    }

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || data.message || 'Request failed');
    }

    return data;
}

// ============ AUTH API ============

export interface User {
    id: string;
    email: string;
    name: string;
    role: 'teach' | 'learn' | 'both';
    avatar?: string;
    bio?: string;
    credibilityScore?: number;
    createdAt?: string;
}

export interface AuthResponse {
    success: boolean;
    user: User;
}

export interface LoginPayload {
    email: string;
    password: string;
}

export interface RegisterPayload {
    name: string;
    email: string;
    password: string;
    role: 'teach' | 'learn' | 'both';
}

/**
 * Register a new user
 * POST /auth/register
 */
export async function registerUser(payload: RegisterPayload): Promise<AuthResponse> {
    return baseFetch<AuthResponse>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

/**
 * Login user
 * POST /auth/login
 */
export async function loginUser(payload: LoginPayload): Promise<AuthResponse> {
    return baseFetch<AuthResponse>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

/**
 * Get current authenticated user
 * GET /auth/me (requires x-user-id header)
 */
export async function getCurrentUser(userId: string): Promise<{ user: User }> {
    return baseFetch<{ user: User }>('/api/auth/me', {
        method: 'GET',
        headers: {
            'x-user-id': userId,
        },
    });
}

// ============ SKILLS API ============

export interface Skill {
    id: string;
    userId: string;
    name: string;
    skillName?: string;
    category: string;
    level: 'Beginner' | 'Intermediate' | 'Advanced';
    type: 'teach' | 'learn';
    description?: string;
    verificationStatus?: 'verified' | 'pending' | 'unverified';
    rating?: number;
    reviewCount?: number;
    createdAt: string;
}

export interface SkillsResponse {
    success: boolean;
    data: {
        teachingSkills: Skill[];
        learningSkills: Skill[];
    };
}

export interface AddSkillPayload {
    name: string;
    category: string;
    level: 'Beginner' | 'Intermediate' | 'Advanced';
    type: 'teach' | 'learn';
    description?: string;
}

/**
 * Get all skills for the current user
 * GET /skills
 */
export async function getSkills(userId: string): Promise<SkillsResponse> {
    return baseFetch<SkillsResponse>('/skills', {
        method: 'GET',
        headers: {
            'x-user-id': userId,
        },
    });
}

/**
 * Add a new skill
 * POST /skills
 */
export async function addSkill(userId: string, payload: AddSkillPayload): Promise<{ success: boolean; data: Skill }> {
    return baseFetch<{ success: boolean; data: Skill }>('/skills', {
        method: 'POST',
        headers: {
            'x-user-id': userId,
        },
        body: JSON.stringify(payload),
    });
}

/**
 * Delete a skill
 * DELETE /skills/:id
 */
export async function deleteSkill(userId: string, skillId: string): Promise<{ success: boolean; message: string }> {
    return baseFetch<{ success: boolean; message: string }>(`/skills/${skillId}`, {
        method: 'DELETE',
        headers: {
            'x-user-id': userId,
        },
    });
}

/**
 * Teaching skill returned by getAllTeachingSkills
 */
export interface AllTeachingSkill {
    id: string;
    userId: string;
    name: string;
    category: string;
    level: 'Beginner' | 'Intermediate' | 'Advanced';
    rating: number;
    verificationStatus: string;
}

/**
 * Get ALL teaching skills from ALL users
 * GET /skills/all-teaching
 * Used by Discover page to join with teachers at render time
 */
export async function getAllTeachingSkills(userId: string): Promise<{ success: boolean; data: AllTeachingSkill[]; count: number }> {
    return baseFetch<{ success: boolean; data: AllTeachingSkill[]; count: number }>('/skills/all-teaching', {
        method: 'GET',
        headers: {
            'x-user-id': userId,
        },
    });
}

// ============ TEACHERS API ============

export interface TeacherSkill {
    id: string;
    name: string;
    level: 'Beginner' | 'Intermediate' | 'Advanced';
    category: string;
    rating: number;
    verificationStatus?: string;
}

export interface Teacher {
    id: string;
    name: string;
    avatar: string;
    skill: string;
    skillId: string;
    level: 'Beginner' | 'Intermediate' | 'Advanced';
    rating: number;
    credibilityScore: number;
    category: string;
    allSkills: TeacherSkill[];
}

export interface TeachersResponse {
    success: boolean;
    data: Teacher[];
    count: number;
}

export interface TeachersFilters {
    category?: string;
    level?: string;
    search?: string;
}

/**
 * Get teachers with optional filters
 * GET /teachers
 */
export async function getTeachers(filters?: TeachersFilters): Promise<TeachersResponse> {
    const params = new URLSearchParams();

    if (filters?.category && filters.category !== 'All') {
        params.append('category', filters.category);
    }
    if (filters?.level && filters.level !== 'All') {
        params.append('level', filters.level);
    }
    if (filters?.search) {
        params.append('search', filters.search);
    }

    const queryString = params.toString();
    const endpoint = queryString ? `/teachers?${queryString}` : '/teachers';

    return baseFetch<TeachersResponse>(endpoint, {
        method: 'GET',
    });
}

// ============ SESSION REQUESTS API ============

export interface OtherUserSkill {
    id: string;
    name: string;
    category: string;
    level: string;
}

export interface SessionRequest {
    id: string;
    fromUserId: string;
    fromUserName: string;
    toUserId: string;
    toUserName: string;
    skillId: string;
    skillName: string;
    message: string;
    status: 'pending' | 'accepted' | 'rejected';
    // Negotiation state
    mode: 'single' | 'mutual' | null;
    teacherSkill: string;
    learnerSkill: string | null;
    confirmed: boolean;
    // Computed
    createdAt: string;
    user: { name: string; avatar: string };
    skill: string;
    timestamp: string;
    otherUserSkills?: OtherUserSkill[];
}

export interface RequestsResponse {
    success: boolean;
    data: {
        incoming: SessionRequest[];
        outgoing: SessionRequest[];
    };
}

export interface SendRequestPayload {
    teacherId: string;
    skillId: string;
    message?: string;
}

export interface Message {
    id: string;
    requestId: string;
    fromUserId: string;
    toUserId: string;
    text: string;
    createdAt: string;
}

export interface ConfirmPayload {
    mode: 'single' | 'mutual';
    teacherSkill: string;
    learnerSkill?: string;
}

/**
 * Get all requests for the current user
 * GET /requests
 */
export async function getRequests(userId: string): Promise<RequestsResponse> {
    return baseFetch<RequestsResponse>('/requests', {
        method: 'GET',
        headers: {
            'x-user-id': userId,
        },
    });
}

/**
 * Get a single request with details
 * GET /requests/:id
 */
export async function getRequestDetail(userId: string, requestId: string): Promise<{ success: boolean; data: SessionRequest }> {
    return baseFetch<{ success: boolean; data: SessionRequest }>(`/requests/${requestId}`, {
        method: 'GET',
        headers: {
            'x-user-id': userId,
        },
    });
}

/**
 * Send a session request
 * POST /requests
 */
export async function sendRequest(userId: string, payload: SendRequestPayload): Promise<{ success: boolean; data: SessionRequest }> {
    return baseFetch<{ success: boolean; data: SessionRequest }>('/requests', {
        method: 'POST',
        headers: {
            'x-user-id': userId,
        },
        body: JSON.stringify(payload),
    });
}

/**
 * Accept a request
 * PUT /requests/:id/accept
 */
export async function acceptRequest(userId: string, requestId: string): Promise<{ success: boolean }> {
    return baseFetch<{ success: boolean }>(`/requests/${requestId}/accept`, {
        method: 'PUT',
        headers: {
            'x-user-id': userId,
        },
    });
}

/**
 * Confirm a request with mode selection (creates session)
 * POST /requests/:id/confirm
 */
export async function confirmRequest(
    userId: string,
    requestId: string,
    payload: ConfirmPayload
): Promise<{ success: boolean; data: { request: SessionRequest; session: Session } }> {
    return baseFetch<{ success: boolean; data: { request: SessionRequest; session: Session } }>(`/requests/${requestId}/confirm`, {
        method: 'POST',
        headers: {
            'x-user-id': userId,
        },
        body: JSON.stringify(payload),
    });
}

/**
 * Reject a request
 * PUT /requests/:id/reject
 */
export async function rejectRequest(userId: string, requestId: string): Promise<{ success: boolean }> {
    return baseFetch<{ success: boolean }>(`/requests/${requestId}/reject`, {
        method: 'PUT',
        headers: {
            'x-user-id': userId,
        },
    });
}

/**
 * Cancel a request
 * DELETE /requests/:id
 */
export async function cancelRequest(userId: string, requestId: string): Promise<{ success: boolean }> {
    return baseFetch<{ success: boolean }>(`/requests/${requestId}`, {
        method: 'DELETE',
        headers: {
            'x-user-id': userId,
        },
    });
}

/**
 * Get messages for a request
 * GET /requests/:id/messages
 */
export async function getMessages(userId: string, requestId: string): Promise<{ success: boolean; data: Message[] }> {
    return baseFetch<{ success: boolean; data: Message[] }>(`/requests/${requestId}/messages`, {
        method: 'GET',
        headers: {
            'x-user-id': userId,
        },
    });
}

/**
 * Send a message in a request
 * POST /requests/:id/messages
 */
export async function sendMessage(userId: string, requestId: string, text: string): Promise<{ success: boolean; data: Message }> {
    return baseFetch<{ success: boolean; data: Message }>(`/requests/${requestId}/messages`, {
        method: 'POST',
        headers: {
            'x-user-id': userId,
        },
        body: JSON.stringify({ text }),
    });
}


// ============ SESSIONS API ============

export interface Session {
    id: string;
    teacherId: string;
    teacherName: string;
    learnerId: string;
    learnerName: string;
    skillId: string;
    skillName: string;
    scheduledAt: string | null;
    status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
    startedAt?: string | null;
    endedAt?: string | null;
    completedAt: string | null;
    createdAt: string;
    // Jitsi meeting info
    meetingProvider?: string;
    meetingRoom?: string;
    meetingUrl?: string;
    // Frontend computed properties
    teacher?: { name: string; avatar: string };
    learner?: { name: string; avatar: string };
    skill?: string;
    dateTime?: string;
}

export interface SessionsResponse {
    success: boolean;
    data: {
        all: Session[];
        scheduled: Session[];
        completed: Session[];
    };
}

/**
 * Get all sessions for the current user
 * GET /sessions
 */
export async function getSessions(userId: string): Promise<SessionsResponse> {
    return baseFetch<SessionsResponse>('/sessions', {
        method: 'GET',
        headers: {
            'x-user-id': userId,
        },
    });
}

/**
 * Schedule a session (set time)
 * PUT /sessions/:id/schedule
 */
export async function scheduleSession(
    userId: string,
    sessionId: string,
    scheduledAt: string
): Promise<{ success: boolean; data: Session }> {
    return baseFetch<{ success: boolean; data: Session }>(`/sessions/${sessionId}/schedule`, {
        method: 'PUT',
        headers: {
            'x-user-id': userId,
        },
        body: JSON.stringify({ scheduledAt }),
    });
}

/**
 * Join a session
 * GET /sessions/:id/join
 */
export async function joinSession(
    userId: string,
    sessionId: string
): Promise<{ success: boolean; data: { session: Session; meetingUrl: string } }> {
    return baseFetch<{ success: boolean; data: { session: Session; meetingUrl: string } }>(`/sessions/${sessionId}/join`, {
        method: 'GET',
        headers: {
            'x-user-id': userId,
        },
    });
}

/**
 * Complete a session (end the meeting)
 * POST /sessions/:id/complete
 */
export async function completeSession(
    userId: string,
    sessionId: string
): Promise<{ success: boolean; message: string; data: Session }> {
    return baseFetch<{ success: boolean; message: string; data: Session }>(`/sessions/${sessionId}/complete`, {
        method: 'POST',
        headers: {
            'x-user-id': userId,
        },
    });
}

// ============================================================================
// FEEDBACK API
// ============================================================================

export interface Feedback {
    id: string;
    sessionId: string;
    fromUserId: string;
    toUserId: string;
    role: 'teacher' | 'learner';
    rating: number;
    comment: string;
    createdAt: string;
}

export interface FeedbackResponse {
    success: boolean;
    data: {
        feedback: Feedback[];
        hasSubmitted: boolean;
    };
}

/**
 * Get feedback for a session
 * GET /sessions/:id/feedback
 */
export async function getSessionFeedback(
    userId: string,
    sessionId: string
): Promise<FeedbackResponse> {
    return baseFetch<FeedbackResponse>(`/sessions/${sessionId}/feedback`, {
        method: 'GET',
        headers: {
            'x-user-id': userId,
        },
    });
}

/**
 * Submit feedback for a completed session
 * POST /sessions/:id/feedback
 */
export async function submitSessionFeedback(
    userId: string,
    sessionId: string,
    rating: number,
    comment?: string
): Promise<{ success: boolean; message: string; data: Feedback }> {
    return baseFetch<{ success: boolean; message: string; data: Feedback }>(`/sessions/${sessionId}/feedback`, {
        method: 'POST',
        headers: {
            'x-user-id': userId,
        },
        body: JSON.stringify({ rating, comment }),
    });
}

// ============================================================================
// ASSIGNMENTS API
// ============================================================================

export interface AssignmentQuestion {
    id: string;
    text: string;
    type: 'text' | 'multiple_choice';
}

export interface Assignment {
    id: string;
    sessionId: string;
    userId: string;
    skillId: string;
    skillName: string;
    questions: AssignmentQuestion[];
    answers: Record<string, string>;
    submitted: boolean;
    submittedAt: string | null;
    createdAt: string;
    // Grading fields
    graded?: boolean;
    gradedBy?: string;
    gradedAt?: string | null;
    scores?: Record<string, number>;
    finalScore?: number;
    graderComment?: string;
}

export interface AssignmentsResponse {
    success: boolean;
    data: {
        all: Assignment[];
        pending: Assignment[];
        completed: Assignment[];
    };
}

/**
 * Get all assignments for current user
 * GET /assignments
 */
export async function getAssignments(userId: string): Promise<AssignmentsResponse> {
    return baseFetch<AssignmentsResponse>('/assignments', {
        method: 'GET',
        headers: {
            'x-user-id': userId,
        },
    });
}

/**
 * Get a single assignment
 * GET /assignments/:id
 */
export async function getAssignment(
    userId: string,
    assignmentId: string
): Promise<{ success: boolean; data: Assignment }> {
    return baseFetch<{ success: boolean; data: Assignment }>(`/assignments/${assignmentId}`, {
        method: 'GET',
        headers: {
            'x-user-id': userId,
        },
    });
}

/**
 * Get assignments for a session
 * GET /assignments/session/:sessionId
 */
export async function getSessionAssignments(
    userId: string,
    sessionId: string
): Promise<{ success: boolean; data: Assignment[] }> {
    return baseFetch<{ success: boolean; data: Assignment[] }>(`/assignments/session/${sessionId}`, {
        method: 'GET',
        headers: {
            'x-user-id': userId,
        },
    });
}

/**
 * Submit an assignment
 * POST /assignments/:id/submit
 */
export async function submitAssignment(
    userId: string,
    assignmentId: string,
    answers: Record<string, string>
): Promise<{ success: boolean; message: string; data: Assignment }> {
    return baseFetch<{ success: boolean; message: string; data: Assignment }>(`/assignments/${assignmentId}/submit`, {
        method: 'POST',
        headers: {
            'x-user-id': userId,
        },
        body: JSON.stringify({ answers }),
    });
}

/**
 * Grade an assignment (teacher only)
 * POST /assignments/:id/grade
 */
export async function gradeAssignment(
    userId: string,
    assignmentId: string,
    scores: Record<string, number>,
    comment?: string
): Promise<{ success: boolean; message: string; data: Assignment }> {
    return baseFetch<{ success: boolean; message: string; data: Assignment }>(`/assignments/${assignmentId}/grade`, {
        method: 'POST',
        headers: {
            'x-user-id': userId,
        },
        body: JSON.stringify({ scores, comment }),
    });
}

export interface SkillScore {
    id: string;
    userId: string;
    skillId: string;
    skillName: string;
    assignmentAvg: number;
    feedbackAvg: number;
    sessionCount: number;
    finalScore: number;
    updatedAt: string;
}

/**
 * Get skill scores for current user
 * GET /skill-scores
 */
export async function getSkillScores(userId: string): Promise<{ success: boolean; data: SkillScore[] }> {
    return baseFetch<{ success: boolean; data: SkillScore[] }>('/skill-scores', {
        method: 'GET',
        headers: {
            'x-user-id': userId,
        },
    });
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

/**
 * CredibilityStats - EXACT match to backend response
 * All fields are guaranteed to exist (never undefined)
 */
export interface CredibilityStats {
    // Primary stats
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

    // Upcoming sessions
    upcomingSessions: UpcomingSession[];

    // Legacy stats for backward compatibility
    stats: {
        avgSkillScore: number;
        avgTeachingRating: number;
        sessionCount: number;
        consistencyBonus: number;
    };
}

/**
 * Get credibility score and stats for current user
 * GET /users/me/credibility
 * REQUIRES x-user-id header for authentication
 */
export async function getCredibilityScore(): Promise<{ success: boolean; data: CredibilityStats }> {
    const userId = getUserId();
    if (!userId) {
        throw new Error('Not authenticated - no user ID');
    }

    return baseFetch<{ success: boolean; data: CredibilityStats }>('/users/me/credibility', {
        method: 'GET',
        headers: {
            'x-user-id': userId,
        },
    });
}

