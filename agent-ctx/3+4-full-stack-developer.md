---
Task ID: 3+4
Agent: full-stack-developer
Task: Remove Study Section from Homepage, Create Standalone Study Page, Admin-only Progress Tracking

Work Log:

**Task A: Remove Study Focus Section from Homepage**
- Removed all study-related state variables from `page.tsx`: studyCourseId, studyCourseName, studyTimerRunning, studyTimerSeconds, studyTodaySeconds, studyWeekSeconds, leaderboard, leaderboardLoading, studyTimerStartRef, studyTimerIntervalRef
- Removed all study-related functions: formatTimer, formatHours, loadLeaderboard, loadStudyStats, handleStudyStart, handleStudyStop, handleStudyReset
- Removed 3 useEffects: leaderboard load, stats load, and timer cleanup
- Removed "Study" nav link from the main navbar
- Removed 'study-focus' from scroll detection active nav IDs array
- Removed entire Study Focus section JSX (timer card, course selector, leaderboard card)
- Replaced footer "Study" link from anchor (#study-focus) to proper link (/study)
- Kept all other homepage sections intact

**Task B: Create Standalone Study Focus Page**
- Created `/src/app/study/page.tsx` as a full standalone page
- Timer: large Orbitron font display (MM:SS), Start/Stop/Reset buttons, pulsing animation when running, radial glow effect
- Stats: Today study time and weekly study time displayed below timer
- Leaderboard: top 10 students by study time (last 30 days), gold/silver/bronze styling for top 3
- AuthGate: leaderboard is public, timer requires sign-in (shows lock message)
- Uses shared components: usePageFeatures, PageModals
- Updated study session API: POST defaults courseId to 'general', GET filters for 'general' only
- Updated leaderboard API: filters for courseId 'general', returns sessionsCount

**Task C: Admin-only Progress Tracking**
- Removed from ml-bootcamp/page.tsx: CertificateModal import, certificate state, handleGetCertificate, progress display, certificate button
- Removed from linux-basics/page.tsx: same certificate/progress removals
- Kept enrollment status display and module list with admin-controlled unlock status

Stage Summary:
- Study Focus is now a standalone page at /study
- Homepage is cleaner without the Study Focus section
- Students can no longer self-track progress or generate certificates
- Only admins can control module access and track student progress
- Study API uses 'general' as default courseId
