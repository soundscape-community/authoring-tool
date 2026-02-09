<!-- Copyright (c) Soundscape Community Contributers. -->
# Fix Plan — Code Review Remediation

_Created 2026-02-09. References issues from `CODE_REVIEW.md`._

This plan addresses the findings from the code review in priority order.
Each phase should be completed, tested, and committed before moving to the next.

---

## Phase 1 — Critical Security & Deployment Fixes

**Goal:** Eliminate vulnerabilities that could be exploited in production today.

### 1A. Fix SSRF in GPX import (Issue #1)
- Add a URL allow-list (http/https only, no private IP ranges).
- Add a `timeout=10` to all `requests.get()` calls.
- Add a `stream=True` download with a max size check (e.g. 10 MB).
- Add unit tests for rejected URLs (localhost, 169.254.x.x, file://).
- **Files:** `backend/api/gpx_utils.py`

### 1B. Fix Docker entrypoint crash on restart (Issue #2)
- Guard `groupadd`/`useradd` with `getent group`/`getent passwd` checks or `|| true`.
- Add defaults: `${PUID:-1000}`, `${PGID:-1000}`.
- **Files:** `docker-entrypoint.sh`

### 1C. Fix Dockerfile settings default (Issue #3)
- Change `ENV DJANGO_SETTINGS_MODULE=backend.settings.production`.
- Update any docs/README that reference the Docker default.
- **Files:** `Dockerfile`

### 1D. Secure base settings (Issue #4)
- Change `DEBUG = False` in `base.py`. Override to `True` only in `local.py`.
- Remove the hardcoded `SECRET_KEY` fallback — raise `ImproperlyConfigured` if env var is missing.
- Remove placeholder `ADMINS` and `SERVER_EMAIL` or replace with real values.
- **Files:** `backend/backend/settings/base.py`, `backend/backend/settings/local.py`

### 1E. Fix bare `except:` clauses (Issue #5)
- `views.py` L175: change to `except Exception as e:` and log the actual error.
- `models.py` L183: change to `except WaypointGroup.DoesNotExist:`.
- `gpx_utils.py` L23: change to `except ImportError:`.
- **Files:** `backend/api/views.py`, `backend/api/models.py`, `backend/api/gpx_utils.py`

### 1F. Add write-permission check on `WaypointMediaViewSet` (Issue #8)
- Add `perform_create` with the same `can_write_activity` guard as other viewsets.
- Add a test: read-only user cannot upload media.
- **Files:** `backend/api/views.py`, `backend/api/tests/test_waypoint_access.py`

**Estimated effort:** 1–2 days
**Validation:** Run full test suite; manually test GPX import with malicious URLs; test Docker restart cycle.

---

## Phase 2 — Frontend Bugs

**Goal:** Fix runtime bugs that affect user-visible behavior.

### 2A. Fix `.concat()` result discarded (Issue #6)
- Change `coordinates.concat(...)` to `coordinates = coordinates.concat(...)`.
- **Files:** `frontend/src/components/ActivitySecondary/MapView.jsx`

### 2B. Fix login crash on failure (Issue #7)
- Add `return` in the `catch` block so `fetchAuthInfo()` and `reload()` are skipped.
- **Files:** `frontend/src/components/auth/Login.jsx`

### 2C. Fix Formik state mutation (Issue #16)
- Replace all `.splice()` calls with `.filter()` or spread to create new arrays.
- **Files:** `frontend/src/components/Forms/WaypointForm.jsx`

### 2D. Fix POI move-up boundary check (Issue #18)
- Change `waypoints.length` to `pois.length` in the POI section.
- **Files:** `frontend/src/components/ActivityPrimary/ActivityTable.jsx`

### 2E. Fix swapped move icons/labels (Issue #19)
- Swap ArrowUp/ArrowDown icons to match their aria-labels. Verify against index manipulation logic.
- **Files:** `frontend/src/components/ActivityPrimary/WaypointRow.jsx`

### 2F. Remove broken cursor feature or fix it (Issue #17)
- Define `CURSOR_TYPE` as a module-level constant or remove the dead `configureMapCursor` code.
- Fix the `useEffect` dependency array to include `editing`.
- **Files:** `frontend/src/components/ActivitySecondary/MapView.jsx`

**Estimated effort:** 1 day
**Validation:** Manual testing of map bounds with POIs, login failure flow, waypoint form media removal, waypoint reordering.

---

## Phase 3 — Backend Code Duplication & Performance

**Goal:** Reduce copy-paste code and fix performance pitfalls.

### 3A. Extract `WritePermissionMixin` for viewsets (Issues #9, #10)
- Create a mixin class with `_check_activity_write_permission(activity_id)`.
- Apply to `WaypointGroupViewSet`, `WaypointViewSet`, `WaypointMediaViewSet`.
- Similarly, extract the folder-permission check in `FolderPermissionViewSet`.
- **Files:** `backend/api/views.py`

### 3B. Add `sender=` to all signal receivers (Issue #11)
- Change `@receiver(pre_save)` to `@receiver(pre_save, sender=Activity)` etc. for all four handlers.
- **Files:** `backend/api/models.py`

### 3C. Fix `get_accessible_folder_ids` scalability (Issues #12, #13)
- Replace `Folder.objects.all()` with a filtered query using the user's folder permissions.
- Reuse `_iter_folder_ancestors()` instead of reimplementing the ancestor walk.
- **Files:** `backend/api/permissions.py`

### 3D. Fix N+1 query in `FolderPermissionViewSet` (Issue #14)
- Prefetch permissions and resolve access in bulk rather than per-folder.
- **Files:** `backend/api/views.py`

### 3E. Standardize exception types (Issue #15)
- Replace `APIException` with `ValidationError` (or a custom 400-level exception) for all client errors.
- **Files:** `backend/api/views.py`

**Estimated effort:** 1–2 days
**Validation:** Run full test suite; profile request latency for folder listing with many folders.

---

## Phase 4 — Test Quality & Coverage

**Goal:** Fix the misleading test, reduce boilerplate, and fill coverage gaps.

### 4A. Fix false-positive test (Issue #27)
- `test_membership_requires_owner`: make the third request add a **different** user so the assertion actually tests authorization, not uniqueness.
- Fix misleading test name `test_group_list_only_owner` → `test_group_list_visible_to_admins` (Issue #70).
- **Files:** `backend/api/tests/test_folder_api_additional.py`

### 4B. Extract shared test base class (Issue #28)
- Create `backend/api/tests/base.py` with `FolderTestMixin` containing common `setUp` (owner, member, group, folder).
- Add a `_grant_access(folder, group, access_type)` helper.
- Refactor all 7+ test classes to inherit from the mixin.
- **Files:** `backend/api/tests/*.py`

### 4C. Reorganize test files (Issues #29, #30)
- Merge `test_folder_api.py` into the appropriate thematic files.
- Split `test_folder_api_additional.py` into logical files: `test_folder_crud.py`, `test_group_membership.py`, `test_staff_access.py`.
- **Files:** `backend/api/tests/`

### 4D. Expand test coverage (Issues #31, #32, #33)
Priority additions:
- Unauthenticated access to all endpoints.
- Waypoint update/delete with read-only access.
- WaypointMedia create with read-only access (validates Phase 1F fix).
- Deleting a folder containing activities.
- 3+ level nested permission inheritance.
- Revoking group membership effects.
- Owner-always-has-access in `resolve_folder_access`.
- Staff override in `resolve_folder_access`.
- **Files:** `backend/api/tests/`

**Estimated effort:** 2–3 days
**Validation:** `python manage.py test` passes; review coverage report.

---

## Phase 5 — Frontend Duplication & Cleanup

**Goal:** Reduce repeated code patterns and remove dead code.

### 5A. Extract `reloadSelectedActivity()` helper (Issue #20)
- Single method replacing the 4 identical reload patterns.
- **Files:** `frontend/src/App.jsx`

### 5B. Unify `ActivityImportForm` and `MapOverlayForm` (Issue #21)
- Create a shared `GPXFileForm` component; each form passes mode-specific props.
- **Files:** `frontend/src/components/Forms/`

### 5C. Unify dropzone content components (Issue #22)
- Parameterize `MediaDropzoneContent` to replace both image and audio variants.
- **Files:** `frontend/src/components/Forms/WaypointForm.jsx`

### 5D. Extract shared folder-tree builder utility (Issue #53)
- Single `buildFolderIndex(folders)` function used by `ActivitiesTable`, `FolderTree`, `App`, `folderOptions`.
- **Files:** `frontend/src/utils/`, multiple consumers

### 5E. Remove dead code (Issues #45, #46, #47, #57, #58, #59, #60)
- Delete `updateWaypointIndex()` from API.js.
- Delete `AlertModal.jsx`.
- Remove `Auth.idToken = 'fixme'`.
- Remove commented-out code blocks.
- Remove `console.log` debug statements.
- Remove unused imports and empty `<span data-feather>` elements.
- **Files:** Multiple frontend files

### 5F. Standardize error display (Issue #25)
- Choose toast-only or inline-only per error context and apply consistently.
- Remove duplicate `showError` + `setError` calls.
- **Files:** Multiple modal components

**Estimated effort:** 2–3 days
**Validation:** `npm test -- --run`; manual smoke test of all modal flows.

---

## Phase 6 — Housekeeping & Configuration

**Goal:** Clean up low-severity items and configuration issues.

### 6A. Squash folder migrations (Issue #34)
- Squash migrations 0002–0004 into a single migration.
- Test the squashed migration on a fresh database.
- **Files:** `backend/api/migrations/`

### 6B. Fix dependency classification (Issues #35, #61)
- Move `autopep8` to dev dependency group.
- Remove `pip` from dependencies.
- **Files:** `backend/pyproject.toml`

### 6C. Clean up settings (Issues #63, #64, #65)
- Add prominent warnings to `sample.env`.
- Remove production URL from `local.py` CSRF origins.
- Remove or replace placeholder `ADMINS`/`SERVER_EMAIL`.

### 6D. Fix PEP 8 violations (Issues #38, #39, #40, #41)
- `== None` → `is None`, `== False` → `not`.
- `saveMedia` → `save_media`.
- Remove trailing `pass` and unreachable code.
- **Files:** `backend/api/models.py`, `backend/api/views.py`

### 6E. Delete dead backend code (Issues #36, #37, #42)
- Delete `backend/backend/views.py` entirely.
- Remove shadowed Django `ValidationError` import and unused `import os`.
- Consider removing `UserPermissions` model (requires migration).

### 6F. Docker-compose improvements (Issue #66)
- Add `restart: unless-stopped` to both services.

### 6G. Frontend config items (Issues #48, #49, #50, #51, #52, #54, #55, #56)
- Move share domain to env variable.
- Update or remove placeholder footer links.
- Fix `InvalidWindowSizeAlert` text to say "1000".
- Replace `var` with `const`.
- Extract shared Axios CSRF config.
- Add `componentWillUnmount` cleanup for resize listener.
- Remove deprecated `reload(true)` parameter.
- Replace `defaultProps` with modern patterns.

### 6H. Backend permissions tightening (Issues #72, #73, #74)
- Add `perform_update`/`perform_destroy` to `GroupViewSet` with owner-only checks.
- Validate `image_alts`/`audio_clip_texts` array lengths in `saveMedia`.
- Catch `DoesNotExist` in waypoint swap and return 400.

**Estimated effort:** 2–3 days
**Validation:** Full test suite; Docker build and restart cycle; frontend smoke test.

---

## Summary Timeline

| Phase | Focus | Est. Effort | Issues |
|-------|-------|-------------|--------|
| 1 | Critical security & deployment | 1–2 days | #1–5, #8 |
| 2 | Frontend bugs | 1 day | #6, #7, #16–19 |
| 3 | Backend duplication & performance | 1–2 days | #9–15 |
| 4 | Test quality & coverage | 2–3 days | #27–33 |
| 5 | Frontend duplication & cleanup | 2–3 days | #20–22, #25, #45–47, #53, #57–60 |
| 6 | Housekeeping & configuration | 2–3 days | Everything else |

**Total estimated effort:** 9–14 days

---

## Notes

- Phase 1 is non-negotiable before any public deployment.
- Phases 2 and 3 can run in parallel (frontend vs backend).
- Phase 4 should follow Phase 3 since the mixin refactor changes the code the tests exercise.
- Phases 5 and 6 are flexible in ordering and can be done incrementally.
