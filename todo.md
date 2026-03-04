# Bucket List App TODO

## Phase 1: Setup
- [x] Database schema (bucket_items, global_goals, user_settings tables)
- [x] Install dnd-kit for drag-and-drop
- [x] Push DB migrations

## Phase 2: Theme & Shell Components
- [x] Global CSS: cream paper background, charcoal lines, hand-drawn aesthetic
- [x] Google Fonts: Caveat (marker script) + JetBrains Mono (typewriter)
- [x] PublicShell component (header, nav, card frame)
- [x] AppShell component (header, profile menu, progress badge, nav)
- [x] PrimaryNav component with active highlights
- [x] ProfileMenu popover (logout, settings)
- [x] ProgressBadge component (completion %, rank)
- [x] Hand-drawn SVG decorations and dashed borders

## Phase 3: Public Pages
- [x] Public Leaderboard page (top 100 users by completed goals)
- [x] Public New Goals discovery page
- [x] Public About page
- [x] Login page (Manus OAuth)
- [x] Signup page

## Phase 4: Authenticated Pages
- [x] My Bucket List page (CRUD + drag-and-drop reorder)
- [x] Drag-and-drop with dnd-kit and visual feedback
- [x] Star toggle for achieved/unachieved goals
- [x] Add/Edit/Delete goal modals
- [x] Authenticated Leaderboard page
- [x] Authenticated New Goals discovery page
- [x] Authenticated About page
- [x] Settings page (profile management, preferences)

## Phase 5: Backend (tRPC)
- [x] Bucket list CRUD procedures (list, add, update, delete, reorder)
- [x] Toggle achieved procedure
- [x] Leaderboard query (top 100 by completed goals)
- [x] Global goals/new goals query
- [x] User settings get/update procedures
- [x] Progress stats procedure (completion %, rank)

## Phase 6: Auth & Routing
- [x] Route protection (redirect unauthenticated users)
- [x] App.tsx routing with public and authenticated routes
- [x] Smooth page transitions (framer-motion)
- [x] Active nav highlights

## Phase 7: Tests & Delivery
- [x] Vitest tests for bucket list procedures
- [x] Vitest tests for leaderboard procedure
- [x] Save checkpoint
- [x] Deliver to user

## Phase 8: Font Update
- [x] Replace Caveat with retro computer/terminal font
- [x] Update all headers to use computer aesthetic
- [x] Update CSS theme with new fonts
- [x] Test all pages with new fonts

## Phase 9: User Feedback Updates
- [x] Update toast notification font to terminal style
- [x] Restructure leaderboards: Users leaderboard → Goals leaderboard
- [x] Create two leaderboards: Goals (popularity) and Users (achievements)
- [x] Make New Goals filters always visible (greyed out when unavailable)
- [x] Toggle add/remove goal by clicking + button again

## Phase 10: Cleanup & Polish
- [x] Remove ✏ symbol from toasts and UI
- [x] Remove unnecessary $ symbols from headers and text
- [x] Remove pencil icons from UI
- [x] Rename app to "My Bucket List"
- [x] Update New Goals description to clarify user-added goals
