/**
 * Admin-specific types — shared across admin tab components.
 *
 * These are the data shapes returned by the admin API routes.
 * They extend the base types in @/lib/types with admin-specific fields
 * (nested user objects, relation counts, etc.).
 */

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  username?: string;
  role: string;
  avatar: string | null;
  createdAt: string;
}

export interface AdminEnrollment {
  id: string;
  courseId: string;
  courseName: string;
  courseLevel: string;
  duration: string;
  status: string;
  experienceLevel: string | null;
  motivation: string | null;
  enrolledAt: string;
  deletedAt: string | null;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    company: string | null;
    role: string;
    avatar: string | null;
  };
}

export interface ProgressEntry {
  id: string;
  userId: string;
  courseId: string;
  courseName: string;
  completedModules: number[];
  totalModules: number;
  completionPercentage: number;
  lastAccessed: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    avatar: string | null;
  };
}

export interface ServiceFeature {
  title: string;
  description: string;
  icon: string;
}

export interface AdminService {
  id: string;
  title: string;
  slug: string;
  description: string;
  icon: string;
  status: string;
  displayOrder: number;
  features: ServiceFeature[];
  createdAt: string;
  updatedAt: string;
}

export interface AdminCourse {
  id: string;
  title: string;
  slug: string;
  description: string;
  level: string;
  duration: string;
  price: string;
  icon: string;
  status: string;
  features: string[];
  prerequisites: string;
  techStack: string;
  isGlobal: boolean;
  moduleCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CourseModuleItem {
  id: string;
  courseId: string;
  title: string;
  description: string;
  content: string;
  moduleOrder: number;
  createdAt: string;
  updatedAt: string;
  unlocks?: {
    id: string;
    userId: string;
    moduleId: string;
    unlockedBy: string;
    createdAt: string;
    user: { id: string; name: string; email: string; avatar: string | null };
  }[];
}

export interface AdminAnalytics {
  totalUsers: number;
  usersThisWeek: number;
  totalEnrollments: number;
  pendingEnrollments: number;
  coursePopularity: Array<{ courseName: string; _count: { id: number } }>;
  recentActivity: Array<{
    user: { name: string };
    courseName: string;
    status: string;
    enrolledAt: string;
  }>;
}

export interface AdminQuote {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  company: string | null;
  serviceType: string;
  budget: string | null;
  description: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  user: { id: string; name: string; email: string; avatar: string | null };
}

export interface AdminProject {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  tags: string[];
  icon: string;
  imageUrl: string;
  projectUrl: string;
  status: string;
  displayOrder: number;
}

export interface AdminTeamMember {
  id: string;
  name: string;
  role: string;
  bio: string;
  avatar: string;
  icon: string;
  linkedinUrl: string;
  githubUrl: string;
  displayOrder: number;
}

export interface AdminTest {
  id: string;
  title: string;
  description: string;
  moduleId: string;
  moduleTitle?: string;
  courseTitle?: string;
  timeLimit: number;
  passingScore: number;
  status: string;
  questions: AdminTestQuestion[];
}

export interface AdminTestQuestion {
  id: string;
  questionText: string;
  questionType: string;
  options: string[];
  correctAnswer: number;
  points: number;
  questionOrder: number;
}

/** All admin tab names — used for tab switching and type safety. */
export type AdminTab =
  | 'enrollments'
  | 'users'
  | 'progress'
  | 'modules'
  | 'quotes'
  | 'team'
  | 'services'
  | 'courses'
  | 'tests'
  | 'projects'
  | 'analytics';
