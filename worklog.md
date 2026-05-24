---
Task ID: 1
Agent: Main Agent
Task: Sprint improvements — bug fixes, bcrypt, student dashboard, markdown support

Work Log:
- Diagnosed test unlock/lock bug: admin page used `t.id` (undefined variable) instead of `selectedTest.id` in button onClick handlers (lines 1772, 1820)
- Fixed test unlock/lock buttons and reset attempt button to use `selectedTest.id`
- Enhanced test duration display to calculate from `startedAt`/`submittedAt` timestamps when `duration` field is 0
- Added `duration` and `startedAt` to AdminTestFull interface TypeScript type
- Installed bcryptjs + @types/bcryptjs
- Rewrote `src/lib/auth.ts` to use bcrypt for hashing/verification with legacy SHA-256 fallback
- Updated all 5 auth routes to use async bcrypt: signup, login, Google OAuth, GitHub OAuth, password reset
- Added auto-upgrade of legacy SHA-256 hashes to bcrypt on successful login
- Created `/dashboard` page (1001 lines) with: overview cards, enrolled courses grid, test results, study stats, certificates
- Created `MarkdownContent` component (569 lines) with: Markdown rendering, syntax highlighting, video embeds (YouTube/Vimeo), styled tables/blockquotes/code
- Integrated MarkdownContent into student course page for module content rendering
- Added Markdown preview toggle to admin module content editor
- Added Dashboard nav link to: homepage, study page, course page (3 nav sections), admin page, dashboard page

Stage Summary:
- 14 files changed, 1681 insertions, 23 deletions
- Commit: d75070c
- All changes committed locally, push pending (GitHub PAT token expired/missing)
- Files modified: package.json, bun.lock, src/lib/auth.ts, src/app/api/auth/*, src/app/admin/page.tsx, src/app/courses/[slug]/page.tsx, src/app/page.tsx, src/app/study/page.tsx
- New files: src/app/dashboard/page.tsx, src/components/MarkdownContent.tsx

---
Task ID: 2
Agent: Main Agent
Task: Repo recovery + Sprint features (test fixes, student dashboard, markdown/video, navbar, admin)

Work Log:
- GitHub repo was corrupted from previous session's force push from broken local git
- Found clean backup at `/home/z/my-project/xfnl-source/` without unwanted features
- Initialized fresh git repo in xfnl-source, pushed clean baseline as commit `0136b21`
- Fixed test unlock/lock bug in `src/app/api/admin/tests/route.ts`: lock now also deletes in-progress attempts; unlock now deletes completed attempts so students can retake
- Enhanced TestModal timer: shows "Duration: X min" and elapsed/total format (MM:SS / MM:SS)
- Created Student Dashboard at `src/app/dashboard/page.tsx` (563 lines): particles, cursor, scroll reveal, stats cards, enrollments, test results, certificates, quick links, full navbar with Study link
- Created ModuleContent component at `src/components/ModuleContent.tsx` (162 lines): Markdown rendering with ReactMarkdown + syntax highlighting + YouTube/Vimeo video embeds
- Integrated ModuleContent into courses/[slug]/page.tsx replacing plain text content
- Added Study link to navbar on courses/[slug] (5 instances) and services/[slug] (5 instances)
- Updated admin page: markdown preview toggle for module content, prominent test duration display, toast notifications for unlock/lock actions
- Installed react-syntax-highlighter + @types/react-syntax-highlighter
- Force pushed commit `2c8211d` to GitHub (replacing corrupted repo)

Stage Summary:
- 9 files changed, 823 insertions, 12 deletions
- Commit: 2c8211d (pushed to GitHub)
- Repo restored from backup, all features implemented and pushed
- New files: src/app/dashboard/page.tsx, src/components/ModuleContent.tsx
- Modified files: src/app/api/admin/tests/route.ts, src/components/TestModal.tsx, src/app/courses/[slug]/page.tsx, src/app/services/[slug]/page.tsx, src/app/admin/page.tsx, package.json, bun.lock
