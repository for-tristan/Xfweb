'use client';

/**
 * EnrollButton — course enrollment button with status-aware rendering.
 * Shows different states: Enroll Now, Pending, Enrolled, Re-apply.
 */

interface EnrollButtonProps {
  courseId: string;
  courseName: string;
  onEnroll: () => void;
  status?: string;
}

export function EnrollButton({
  courseId,
  courseName,
  onEnroll,
  status,
}: EnrollButtonProps) {
  if (status === 'approved') {
    return (
      <button className="v-course-enroll-btn enrolled" disabled>
        <i className="fa-solid fa-check" /> Enrolled
      </button>
    );
  }

  if (status === 'pending') {
    return (
      <button className="v-course-enroll-btn pending" disabled>
        <i className="fa-solid fa-hourglass-half" /> Pending...
      </button>
    );
  }

  if (status === 'declined') {
    return (
      <button className="v-course-enroll-btn" onClick={onEnroll}>
        Re-apply →
      </button>
    );
  }

  return (
    <button className="v-course-enroll-btn" onClick={onEnroll}>
      Enroll Now →
    </button>
  );
}

export default EnrollButton;
