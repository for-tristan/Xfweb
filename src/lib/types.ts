/**
 * Shared types used across the app — eliminates duplicate interface
 * declarations in page.tsx, dashboard, admin, etc.
 */

export type UserRole = 'student' | 'instructor' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  role: UserRole;
  emailVerified?: string | null;
  phone: string | null;
  company: string | null;
  avatar: string | null;
  bio?: string | null;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  username: string;
  role: UserRole;
  emailVerified: Date | null;
  phone: string | null;
  company: string | null;
  avatar: string | null;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  type?: string;
}

export interface Enrollment {
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
}

export interface QuoteRequest {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string | null;
  serviceType: string;
  budget: string | null;
  description: string;
  status: string;
  createdAt: string;
}

export interface Course {
  id: string;
  name: string;
  category: string;
  description: string;
  level: string;
  duration: string;
  price: string;
  icon: string;
  features: string[];
  enrollmentCount?: number;
  moduleCount?: number;
}

export interface Service {
  id: string;
  title: string;
  slug: string;
  description: string;
  icon: string;
  status: string;
  features: ServiceFeature[];
}

export interface ServiceFeature {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export interface TeamMember {
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

export interface Project {
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

export interface Certificate {
  id: string;
  userId: string;
  courseId: string;
  courseName: string;
  certificateId: string;
  completionDate: string;
  issuedAt: string;
}

export interface Friendship {
  id: string;
  senderId: string;
  receiverId: string;
  status: 'pending' | 'accepted' | 'blocked';
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  read: boolean;
  createdAt: string;
}

export interface GameScore {
  id: string;
  userId: string;
  game: 'bug-hunter' | 'whats-output' | 'code-completion';
  language: string;
  difficulty: 'easy' | 'medium' | 'hard';
  score: number;
  correct: number;
  total: number;
  timeSpent: number;
  createdAt: string;
}
