/**
 * Site-wide constants — single source of truth for contact info, social
 * links, and other hardcoded values that were previously scattered across
 * page.tsx, admin, footer, etc.
 */

export const SITE = {
  name: 'XFoundry',
  tagline: 'The best way to predict the future is to create it.',
  description:
    'Comprehensive technology solutions designed to accelerate your digital transformation.',
  url: 'https://xfoundryy.vercel.app',
} as const;

export const CONTACT = {
  email: 'xfoundationcom@gmail.com',
  phone: '+201040394896',
  businessHours: 'Sun - Thu: 9:00 AM - 6:00 PM EET',
} as const;

export const SOCIAL = {
  linkedin: 'https://www.linkedin.com/company/126753897/?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base%3BjRSUxcNJRbuVe74c5IsdTA%3D%3D',
  github: 'https://github.com/for-tristan',
  discord: 'https://discord.gg/TVRxJg3rcN',
} as const;

export const ROLES = {
  STUDENT: 'student',
  INSTRUCTOR: 'instructor',
  ADMIN: 'admin',
} as const;

export const ROLE_VALUES = [ROLES.STUDENT, ROLES.INSTRUCTOR, ROLES.ADMIN] as const;

export const ENROLLMENT_STATUS = {
  PENDING: 'pending',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export const COURSE_LEVELS = ['Beginner', 'Intermediate', 'Advanced'] as const;
export const COURSE_STATUSES = ['active', 'draft', 'archived'] as const;

export const GAME_DIFFICULTIES = ['easy', 'medium', 'hard'] as const;
export const GAME_TYPES = ['bug-hunter', 'whats-output', 'code-completion'] as const;

export const LANGUAGES = ['python', 'javascript', 'java', 'cpp', 'css', 'html'] as const;

/** Rate limits (per IP) — must match middleware.ts */
export const RATE_LIMITS = {
  LOGIN: { windowMs: 15 * 60 * 1000, maxRequests: 10 },
  SIGNUP: { windowMs: 60 * 60 * 1000, maxRequests: 5 },
  FORGOT_PASSWORD: { windowMs: 60 * 60 * 1000, maxRequests: 3 },
  RESET_PASSWORD: { windowMs: 15 * 60 * 1000, maxRequests: 5 },
  CHAT: { windowMs: 60 * 1000, maxRequests: 30 },
  QUOTES: { windowMs: 60 * 60 * 1000, maxRequests: 10 },
  AI_CHAT: { windowMs: 60 * 1000, maxRequests: 15 },
  AI_UPLOAD: { windowMs: 60 * 1000, maxRequests: 10 },
  GAMES_SUBMIT: { windowMs: 60 * 1000, maxRequests: 10 },
  FRIENDS: { windowMs: 60 * 1000, maxRequests: 10 },
  RESEND_VERIFICATION: { windowMs: 60 * 60 * 1000, maxRequests: 5 },
} as const;
