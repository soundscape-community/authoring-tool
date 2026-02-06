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
- Phase 3: In progress (initial folder-aware UI and activity assignment)
- Phase 4: Not started

## Progress Notes
- Phase 1 delivered backend data models, permission resolution utility, migrations, and initial backend tests.
- Phase 2 delivered folder/group/permission APIs, activity folder filtering, and API test coverage.
- Phase 3 started with a folder list panel, activity filtering, and folder selection in activity forms.
