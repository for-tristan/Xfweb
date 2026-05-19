# Worklog - Task 6+7+8

## Completed Features

### Part 1: GitHub & Google OAuth Login
- Created `/src/app/api/auth/github/route.ts` — GET redirects to GitHub OAuth authorize URL
- Created `/src/app/api/auth/github/callback/route.ts` — Exchanges code for token, fetches GitHub user, creates/links account, sets session cookies
- Created `/src/app/api/auth/google/route.ts` — GET redirects to Google OAuth authorize URL
- Created `/src/app/api/auth/google/callback/route.ts` — Exchanges code for token, fetches Google user, creates/links account, sets session cookies
- Updated `src/lib/PageModals.tsx` — Changed social login buttons from "Coming Soon" toast to actual redirects (`/api/auth/google` and `/api/auth/github`)
- Updated `src/app/page.tsx` — Same social button redirect update for the inline auth modal on the homepage
- OAuth errors are handled gracefully with URL redirect + error parameter
- If GITHUB_ID/GOOGLE_SECRET not in .env, returns proper error

### Part 2: Unique Username Feature
- Updated `src/app/api/auth/signup/route.ts` — Now generates unique username from name (lowercase, alphanumeric, random 4-digit suffix), ensures uniqueness via retry loop, includes username in response
- Updated `src/app/api/auth/login/route.ts` — Now includes `username` in login response user object
- Updated `src/lib/auth.ts` — `getCurrentUser()` now returns `username` field
- Created `/src/app/api/user/username/route.ts` — GET checks availability (validates 3-20 chars, alphanumeric + underscore), PUT changes username for authenticated user
- Updated `src/lib/usePageFeatures.ts` — Added `username` to `User` interface

### Part 3: Friends List
- Created `/src/app/api/friends/route.ts`:
  - GET: Returns friends (accepted), pending requests (received), sent requests
  - POST: Send friend request by username (validates user exists, checks duplicate)
  - PUT: Accept/reject friend request (validates ownership)
  - DELETE: Remove friend (validates ownership)
- Added Friends tab to dashboard in `src/app/page.tsx`:
  - Add friend form (by username)
  - Pending requests section with Accept/Decline buttons
  - Sent requests section with Pending indicator
  - Friends list with Message and Unfriend buttons
  - Styled consistently with existing dashboard design

### Part 4: Chat System
- Created `/src/app/api/chat/route.ts`:
  - GET: Get messages between current user and another user (marks unread as read), ordered by createdAt
  - POST: Send message (validates receiver exists, max 2000 chars)
- Created `/src/app/api/chat/unread/route.ts`:
  - GET: Get unread message count per conversation, with total count
- Created `/src/components/ChatModal.tsx`:
  - Full chat interface with friend sidebar + message thread
  - Real-time polling every 3 seconds
  - Auto-scroll to bottom on new messages
  - Message timestamps (today shows time, older shows date + time)
  - Unread badge on conversation sidebar items
  - Styled with X.Foundry dark theme (#dc143c accent)
- Added Messages tab to dashboard with friend list → chat navigation
- "Open Chat" button opens the full ChatModal

## Files Created
- `/src/app/api/auth/github/route.ts`
- `/src/app/api/auth/github/callback/route.ts`
- `/src/app/api/auth/google/route.ts`
- `/src/app/api/auth/google/callback/route.ts`
- `/src/app/api/user/username/route.ts`
- `/src/app/api/friends/route.ts`
- `/src/app/api/chat/route.ts`
- `/src/app/api/chat/unread/route.ts`
- `/src/components/ChatModal.tsx`

## Files Modified
- `/src/app/page.tsx` — User type, friends/chat state, dashboard tabs, ChatModal integration, social button redirects
- `/src/lib/PageModals.tsx` — Social button redirects (removed "Coming Soon" toast)
- `/src/lib/auth.ts` — Added username to getCurrentUser return type
- `/src/lib/usePageFeatures.ts` — Added username to User interface
- `/src/app/api/auth/signup/route.ts` — Username generation, included in response
- `/src/app/api/auth/login/route.ts` — Included username in response

## Notes
- All new API routes follow existing patterns (cookie-based auth via getCurrentUser)
- DB schema already had all required models (Friendship, ChatMessage, AccountLink)
- Existing users in DB already have username field (populated during migration)
- No new npm packages required

---

# Worklog - Bug Fixes (Issues 1-6)

## Issue 1: Remove student self-progress tracking (admin-only)
**Files modified:** `src/app/page.tsx`
- Removed `courseProgress` and `progressLoading` state variables
- Removed `loadProgress` callback function and `toggleModule` async function
- Removed `loadProgress()` call from the init useEffect and its dependency array entry
- Removed the "Progress" tab button from the dashboard modal tab bar
- Removed the entire `dashTab === 'progress'` rendering section (module checkboxes with toggle)
- Removed `loadProgress()` call from the "My Enrollments" tab button onClick
- Admin progress tracking in `/src/app/admin/page.tsx` was left untouched

## Issue 2: Auto-unlock first module when enrollment is accepted
**Files modified:** `src/app/api/admin/enrollments/route.ts`
- Changed `const { error } = await requireAdmin()` to `const { error, user: adminUser } = await requireAdmin()` in the PUT handler
- Added auto-unlock logic after `status === 'approved'`: queries the first CourseModule by `moduleOrder` for the course, then upserts a `ModuleUnlock` record for the student

## Issue 3: Add Study link to navbar
**Files modified:** `src/app/page.tsx`
- Added `<li><a href="/study">Study</a></li>` between Courses and Team links in the main navigation bar
- Uses `router.push('/study')` for client-side navigation

## Issue 4: Fix Featured Projects & Meet The Team grid background visual bug
**Files modified:** `src/app/globals.css`
- `.section` already had `position: relative; overflow: hidden;` — confirmed no change needed
- Removed `background: var(--border-color)` from `.projects-grid` (was causing grey bleed)
- Removed `background: var(--border-color)` from `.team-grid` (was causing grey bleed)
- Changed `gap: 1px` to `gap: 24px` in `.projects-grid`
- Changed `gap: 1px` to `gap: 24px` in `.team-grid`

## Issue 5: Add username field to profile dashboard
**Files modified:** `src/app/page.tsx`, `src/app/api/user/profile/route.ts`
- Added `profileUsername` state variable
- Added username input field in the profile form (between Full Name and Phone), with sanitization (lowercase, alphanumeric + underscore only)
- Set `profileUsername` from user data in the `loadProfileData` function and dashboard open effect
- Included username in `handleProfileSave` API call body
- Updated `setUser` after save to include the new username
- Added username display (`@username`) below email in the profile info area
- Updated `/src/app/api/user/profile/route.ts` PUT handler: accepts `username` field, validates format (3+ chars, alphanumeric+underscore), checks uniqueness, updates via `db.user.update`
- `/src/app/api/user/username/route.ts` already existed with GET (availability check) and PUT (set username) — no changes needed

## Issue 6: Fix chat option in dashboard - too cramped
**Files modified:** `src/app/globals.css`, `src/app/page.tsx`
- Changed `.dashboard-modal` max-width from `920px` to `1100px`
- Increased `.dashboard-modal-body` padding from `28px 32px 32px` to `32px 40px 40px`
- Added `minHeight: 400` to the Friends tab container div
- Added `minHeight: 400` to the Messages tab container div

## Build Result
- `npx next build` completed successfully — all 47 pages generated, no errors

---

# Worklog - Bug Fixes (Issues 1-6, Round 2)

## Issue 1: Messages tab - can't select friend to text
**Files modified:** `src/app/page.tsx`, `src/components/ChatModal.tsx`
- Added `selectedChatFriend` state variable in `page.tsx` (line ~279) to track which friend was selected from the Messages tab
- When clicking a friend in the Messages tab (line ~1968), now sets `selectedChatFriend=f`, `setDashboardOpen(false)`, and `setChatOpen(true)` — all three together
- When clicking "Open Chat" button (line ~1954), now also calls `setDashboardOpen(false)` before `setChatOpen(true)`
- Added `initialFriend?: Friend | null` prop to `ChatModalProps` interface in `ChatModal.tsx`
- Added `initialFriendAppliedRef` and a `useEffect` in ChatModal that auto-selects the `initialFriend` when the modal opens (using `setTimeout(0)` to avoid cascading render lint warnings)
- When closing ChatModal, `selectedChatFriend` is reset to `null`

## Issue 2: ChatModal opens behind dashboard modal
**Files modified:** `src/components/ChatModal.tsx`, `src/app/page.tsx`
- Changed ChatModal's inline `zIndex` from `9999` to `10002` — this is now higher than both `.dashboard-modal-overlay` (z-index: 10001) and `.auth-modal-overlay` (z-index: 10001) in `globals.css`
- Dashboard modal is now explicitly closed (`setDashboardOpen(false)`) when opening the ChatModal from the Messages tab or "Open Chat" button
- This ensures ChatModal always renders above the dashboard modal

## Issue 3: Removing student resets course modules to locked
**Files modified:** None (verified no issue)
- Verified the Prisma schema: `ModuleUnlock` has `onDelete: Cascade` only on the `user` relation, NOT on any `enrollment` relation
- `ModuleUnlock` references `userId` and `moduleId` directly — it does NOT reference `Enrollment` at all
- The DELETE handler in `/src/app/api/admin/enrollments/route.ts` only calls `db.enrollment.delete()`, which only deletes the enrollment record
- Deleting an enrollment does NOT cascade to `ModuleUnlock` records — no code changes needed

## Issue 4: Admin can lock AND unlock modules
**Files modified:** `src/app/api/admin/modules/route.ts`, `src/app/admin/page.tsx`
- Added `DELETE` method handler to `/src/app/api/admin/modules/route.ts`:
  - Accepts `{ userId, moduleId }` in the request body
  - Deletes the `ModuleUnlock` record via `db.moduleUnlock.deleteMany()`
  - Sends a "Module Locked" notification to the user
  - Returns `{ message: 'Module locked successfully', deleted: count }`
- Added `handleLock` async function in admin page that calls `DELETE /api/admin/modules` with `{ userId, moduleId }`
- Updated `UnlockStudentPanel` component props to accept `handleLock` callback
- Changed button behavior in `UnlockStudentPanel`:
  - If module is UNLOCKED: shows red "Lock" button (lock icon, `#ef4444` color) — clicking calls `handleLock`
  - If module is LOCKED: shows red "Unlock" button (lock-open icon, `var(--primary-red)` color) — clicking calls `handleUnlock`
  - Both buttons only disabled during loading, never permanently disabled

## Issue 5: Admin can control student progress bar
**Files modified:** `src/app/api/admin/progress/route.ts`, `src/app/admin/page.tsx`
- Added `PUT` method handler to `/src/app/api/admin/progress/route.ts`:
  - Accepts `{ userId, courseId, courseName, completedModules }` (array of module numbers)
  - Upserts `CourseProgress` record via `db.courseProgress.upsert()`
  - Returns updated progress with `completionPercentage` calculated
  - Uses same `COURSE_TOTAL_MODULES` map (`ml-bootcamp: 8`, `linux-basics: 6`)
- Added state variables in admin page: `editingProgress`, `editModules`, `progressSaving`
- Added `COURSE_TOTAL_MODULES` constant in admin page component
- Added `handleEditProgress(p)` — opens editing mode, pre-fills checkboxes from existing completed modules
- Added `handleSaveProgress(p)` — calls PUT endpoint, updates local state on success, closes editing mode
- Added `handleToggleModule(modNum)` — toggles a module number in/out of `editModules` array
- Added `loadNotifications()` to the initial admin data loading `useEffect`
- Updated progress bar display to show live preview percentage during editing
- Added "Edit" button next to percentage for each progress entry
- Added module checkbox UI (M01, M02, etc.) in editing mode with Save/Cancel buttons
- Progress bar updates in real-time as modules are toggled

## Issue 6: Make main page navbar global across all pages
**Files modified:** `src/app/admin/page.tsx`
- Admin page navbar now includes all links: Home, Services, Projects, Courses, **Study** (was missing), Team, Contact, Admin (active/highlighted)
- Added notifications bell with unread count badge to admin page nav
- Added notification dropdown with "Mark all read" and click-to-read functionality
- Added search button (links to home page search) to admin page nav
- Added notification state (`notifOpen`, `notifications`, `unreadCount`, `loadNotifications`) to admin page
- Study page (`/src/app/study/page.tsx`) already had a complete matching nav via `usePageFeatures` + `NavActions` — no changes needed
- No dedicated `/services/*/page.tsx` or `/courses/*/page.tsx` routes exist — service/course pages already link to hash anchors on the main page
- The admin page nav now visually matches the main page nav structure with all features

## Summary of All Files Modified
- `/src/app/page.tsx` — Added `selectedChatFriend` state, updated chat open handlers
- `/src/components/ChatModal.tsx` — Added `initialFriend` prop, auto-select effect, increased zIndex
- `/src/app/api/admin/modules/route.ts` — Added DELETE handler for locking modules
- `/src/app/api/admin/progress/route.ts` — Added PUT handler for updating student progress
- `/src/app/admin/page.tsx` — Module lock/unlock UI, progress editing UI, enhanced navbar with notifications
