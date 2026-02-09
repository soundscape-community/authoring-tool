# Activity Folders Plan

## Goals
- Add nested folders for activities with folder-level read/write permissions.
- Keep existing activities unfoldered and private by default.
- Support future sharing across users and groups with inherited folder permissions.
- Provide an accessible, modern file-browser UI (keyboard-first, ARIA-compliant).

## Assumptions & Requirements (Confirmed)
- Folders allow nesting.
- Existing activities remain with no folder and private by default.
- Permissions are **read** or **write** at the folder level.
- Activity permissions inherit from the folder; no per-activity ACLs.
- Folder permissions inherit by default down the folder tree.
- Custom groups are required (do not use Django’s built-in `auth.Group`).
- Root folder is private to the user and not shared.
- Deleting a folder requires confirmation and offers to move activities out and make them private.
- Sharing grants access immediately (no invites).
- Staff users have read/write access to all folders and activities, including unfoldered activities.
- Root folder names are globally unique across all users.

## Data Model (Backend)
### New Models
1. **Group**
   - Fields: `id`, `name`, `owner`, `created`, `updated`
   - Membership table: `GroupMembership` with `user`, `group`, `role` (optional)
2. **Folder**
   - Fields: `id`, `name`, `owner`, `parent` (self FK), `created`, `updated`
   - Root folder: `parent = null`, `owner = user`
3. **FolderPermission**
   - Fields: `id`, `folder`, `principal_type` (`user`|`group`), `user` (nullable), `group` (nullable), `access` (`read`|`write`)
   - `principal_type` indicates which FK is populated (exactly one of `user` or `group`).
   - Inherited permissions: computed by tree traversal on reads (store explicit grants only)

### Activity Changes
- Add nullable `folder` FK on `Activity`.
- Existing records remain `folder = null`.

## API Design
- `folders/`
  - list/create/update/delete
  - nested listing and move endpoints (set `parent`)
- `folders/<id>/permissions/`
  - CRUD for user/group permissions
- `groups/`
  - list/create/update/delete
  - membership endpoints
- Activities
  - support folder filtering (`?folder_id=...`)
  - return folder metadata in list/detail serializers

## Permission Resolution
- Effective permissions for a user:
  1. Explicit folder permissions for the user.
  2. Permissions from any group memberships.
  3. Inherited permissions from parent folders (unless overridden).
- No permission means no access.
- Root folder access is private to its owner only.

## UI/UX (Frontend)
### File Browser
- Left tree for folders (expand/collapse).
- Right pane showing folder contents (activities and subfolders).
- Breadcrumb for navigation.
- Accessible keyboard navigation (arrow keys, Enter to open, Shift+F10 or context menu).
- ARIA roles for tree and list/grid views.

### Sharing & Permissions
- Folder detail panel or modal to manage sharing.
- Read/write toggles for users and groups.

### Deletion Flow
- Confirmation dialog with option:
  - Move activities to unfoldered/private
  - Delete folder and leave activities unfoldered

## Migration Strategy
- Add new tables and nullable `Activity.folder_id`.
- No data changes for existing activities (remain unfoldered/private).
- Provide a management command to backfill default roots (if needed).

## Testing Plan
- Backend: model tests for permission resolution, inheritance, and folder tree operations (highest priority).
- API: permission enforcement for folders/activities.
- Frontend: UI smoke test for navigation and accessibility checks.
- After each implementation phase:
  1. Run relevant tests.
  2. Commit changes.
  3. Update this plan with progress + next steps.
- Make regular commits after each progress item, not just at phase boundaries.

## Testing Emphasis
- Backend tests are the most important signal that the plan is progressing correctly.

## Implementation Phases
1. **Phase 1: Backend models + migrations**
   - Add Group/GroupMembership, Folder, FolderPermission
   - Add `Activity.folder_id`
   - Add permission-resolution utilities
2. **Phase 2: API + serializers**
   - CRUD endpoints for folders, permissions, groups
   - Activity folder field in serializers + filtering
3. **Phase 3: Frontend UI**
   - Accessible folder tree + content list
   - Folder creation/rename/delete
   - Permission UI for sharing
4. **Phase 4: QA + docs**
   - Tests for access rules and folder operations
   - Update AGENTS/README as needed

## Status
- Phase 1: Completed (models, permissions utility, migrations, backend tests)
- Phase 2: Completed (API endpoints, serializers, and API tests)
- Phase 3: Completed (folder-aware UI, sharing, and accessibility improvements)
- Phase 4: Completed (tests and docs updates; performance optimization and role expansion remain optional follow-ups)

## Code Review Issues
- Activities are filtered strictly by `author_id`, which prevents shared folder access from showing activities (fixed).
- Folder updates allow cycles (self/descendant parents), which can corrupt the folder tree (fixed).
- Debug logging remains in backend activity creation and frontend activity API calls (fixed).
- Folder listing loads all folders and walks ancestry in Python; may need a recursive query for large trees (open; consider a recursive CTE when scale demands).
- Group membership roles are stored but not enforced anywhere (fixed).

## Progress Notes
- Phase 1 delivered backend data models, permission resolution utility, migrations, and initial backend tests.
- Phase 2 delivered folder/group/permission APIs, activity folder filtering, and API test coverage.
- Phase 3 started with a folder list panel, activity filtering, and folder selection in activity forms.
- Phase 3 added a nested folder tree with expand/collapse, breadcrumb navigation, and subfolder listings in the activities pane.
- Phase 3 added folder rename/delete flows with confirmation and optional activity moves to Unfoldered.
- Phase 3 added a sharing modal for folder permissions and group management.
- Phase 3 added keyboard navigation (arrow keys + roving tabindex) for the folder tree.
- Phase 3 added high-value frontend tests for folder navigation and sharing validation.
- Phase 4 added frontend test tooling and updated frontend/agent documentation for test commands.
- Phase 4 updated activity authorization to honor folder permissions (with new backend tests).
- Phase 4 added folder cycle validation, removed debug logging in APIs, and added backend tests for cycle prevention.
- Phase 4 hardened activity/waypoint access control (write checks + tests for waypoint creation).
- Phase 4 enforced group admin role for membership management, granted staff global visibility, and made root folder names globally unique.
- Phase 4 granted staff read/write access to all activities (including unfoldered) and documented permission notes.
- Phase 4 concluded with optional follow-ups: folder access query optimization via recursive CTE and any future role expansion.
- Phase 4 added bulk activity selection with move/delete toolbar actions.
- Phase 4 refined the folder tree root to display as "/" (unfoldered) and removed the all-activities entry.
