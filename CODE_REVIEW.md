<!-- Copyright (c) Soundscape Community Contributors. -->
# Code Review — AI Coding Issues & Technical Debt

_Generated 2026-02-09_

---

## Critical / High Severity

### 1. SSRF vulnerability in GPX import
**File:** `backend/api/gpx_utils.py` (lines 246–247, 355–357)
**Category:** Security

`requests.get(link)` fetches arbitrary URLs embedded in uploaded GPX files. An attacker can craft a GPX with `href` pointing to internal services (`http://169.254.169.254/...`, `http://localhost/admin/`, etc.). There is no URL validation, no allow-list, no timeout, and no response size limit.

### 2. Docker entrypoint crashes on container restart
**File:** `docker-entrypoint.sh` (lines 5–6)
**Category:** Deployment bug

With `set -e` active, `groupadd`/`useradd` fail when the user already exists on container restart, killing the container. Needs `|| true` guards or `getent` pre-checks.

### 3. Dockerfile defaults to local settings
**File:** `Dockerfile` (line 33)
**Category:** Configuration / Security

`ENV DJANGO_SETTINGS_MODULE=backend.settings.local` bakes dev settings (SQLite, `DEBUG=True`, `ALLOWED_HOSTS=['*']`) into the production image. Running the container without overriding this env var silently exposes debug mode.

### 4. `DEBUG = True` and insecure secret key in base settings
**File:** `backend/backend/settings/base.py` (lines 31, 35)
**Category:** Security

All environments inherit `DEBUG = True` unless explicitly overridden. A hardcoded fallback `SECRET_KEY` is committed to the repo and activates silently if the env var is unset.

### 5. Bare `except:` swallows all errors
**Files:** `backend/api/views.py` (line 175), `backend/api/models.py` (line 183), `backend/api/gpx_utils.py` (lines 23–28)
**Category:** Error handling

GPX import catches **all** exceptions (including `SystemExit`, `KeyboardInterrupt`) and replaces them with a generic message. The XML import fallback uses bare `except:` instead of `except ImportError:`.

### 6. Frontend: `.concat()` result discarded — POIs missing from map bounds
**File:** `frontend/src/components/ActivitySecondary/MapView.jsx` (line 163)
**Category:** Bug

`coordinates.concat(...)` returns a new array but the result is never assigned, silently dropping all POI coordinates from the map bounds calculation.

### 7. Frontend: Login continues executing after failure
**File:** `frontend/src/components/auth/Login.jsx` (lines 18–28)
**Category:** Bug

The `catch` block doesn't `return`, so `fetchAuthInfo()` runs after a failed login, causing an unhandled promise rejection.

### 8. Missing `perform_create` on `WaypointMediaViewSet`
**File:** `backend/api/views.py` (line 321)
**Category:** Security / Permissions

Unlike every other viewset, media uploads have no write-permission check, allowing any authenticated user with read access to upload media.

---

## Medium Severity

### 9. Duplicated permission-check pattern (9× copy-paste)
**File:** `backend/api/views.py` (lines 184–335)
**Category:** Duplication

The same 3-line `can_write_activity` guard is copy-pasted across **9 methods** in `WaypointGroupViewSet`, `WaypointViewSet`, and `WaypointMediaViewSet`. Should be a mixin.

### 10. Triplicated folder-permission check in `FolderPermissionViewSet`
**File:** `backend/api/views.py` (lines 421–440)
**Category:** Duplication

`if not access.can_write and folder.owner_id != self.request.user.id` is repeated verbatim in `perform_create`, `perform_update`, and `perform_destroy`. The `owner_id` check is also redundant since `resolve_folder_access` already returns `can_write=True` for the owner.

### 11. Global signal receivers fire on every model save
**File:** `backend/api/models.py` (lines 112, 171, 206, 241)
**Category:** Performance

Four `@receiver(pre_save)` handlers lack `sender=` specification, so they fire and run `isinstance` checks on **every model save** in the entire Django project (User, Session, migration records, etc.).

### 12. `get_accessible_folder_ids` loads ALL folders into memory
**File:** `backend/api/permissions.py` (lines 97–98)
**Category:** Scalability

`Folder.objects.all()` fetches every folder in the database on every request. Also reimplements ancestor-walking logic that `_iter_folder_ancestors()` already provides.

### 13. Duplicated ancestor-walking logic
**File:** `backend/api/permissions.py` (lines 17–25 vs 103–115)
**Category:** Duplication

`_iter_folder_ancestors()` is a clean helper, but `get_accessible_folder_ids()` reimplements the same ancestor walk inline instead of reusing it.

### 14. N+1 query in `FolderPermissionViewSet.get_queryset`
**File:** `backend/api/views.py` (lines 410–419)
**Category:** Performance

Iterates all folders and calls `resolve_folder_access()` per folder, each of which executes its own queries.

### 15. Mixed exception types for errors
**File:** `backend/api/views.py` (lines 259–260)
**Category:** Inconsistency

Permission errors use `ValidationError` (400) but business-logic errors two lines later use `APIException` (500). All client errors should use 400-level exceptions.

### 16. Frontend: Formik state mutated in-place with `.splice()`
**File:** `frontend/src/components/Forms/WaypointForm.jsx` (lines 442, 459, 536, 553)
**Category:** Bug / State management

`.splice()` mutates Formik's internal array before calling `setFieldValue`, breaking reference equality change detection. Appears in 4+ places.

### 17. Frontend: Broken cursor feature in MapView
**File:** `frontend/src/components/ActivitySecondary/MapView.jsx` (lines 335–339)
**Category:** Bug / Dead code

References `MapView.CURSOR_TYPE` which is never defined on the function component. The entire cursor-change feature is dead/broken.

### 18. Frontend: Move-up boundary check references wrong array
**File:** `frontend/src/components/ActivityPrimary/ActivityTable.jsx` (line 134)
**Category:** Bug

POI move-up uses `waypoints.length` instead of `pois.length` for the boundary check.

### 19. Frontend: Icons and labels swapped on waypoint move buttons
**File:** `frontend/src/components/ActivityPrimary/WaypointRow.jsx` (lines 60–73)
**Category:** Bug / UX

ArrowUp icon has "Move Down" label and vice versa. Combined with the index increment/decrement logic, the direction semantics are inverted.

### 20. Frontend: Reload-activity pattern duplicated 4×
**File:** `frontend/src/App.jsx` (~lines 540, 558, 578, 601)
**Category:** Duplication

`waypointCreated`, `waypointUpdated`, `waypointDeleted`, and `waypointMoved` all contain the identical API call + setState + toast pattern. Should be one `reloadSelectedActivity()` method.

### 21. Frontend: `ActivityImportForm` and `MapOverlayForm` are near-clones
**Files:** `frontend/src/components/Forms/ActivityImportForm.jsx`, `MapOverlayForm.jsx`
**Category:** Duplication

Identical Yup schema, initial values, `fileToGPX` logic, and GPXCard preview. Only differences are the submit label and the optional "remove overlay" section.

### 22. Frontend: `ImageDropzoneContent` and `AudioDropzoneContent` are identical
**File:** `frontend/src/components/Forms/WaypointForm.jsx` (lines 130–185)
**Category:** Duplication

Same conditional rendering logic; only the disable-check function differs. Should be a single parameterized component.

### 23. Frontend: Module-level mutable flag `locatingUser`
**File:** `frontend/src/components/ActivitySecondary/MapView.jsx` (line 72)
**Category:** Anti-pattern

Module-level mutable state persists across component mounts/unmounts. Should use `useRef`.

### 24. Frontend: `useEffect` with incorrect dependency arrays
**File:** `frontend/src/components/ActivitySecondary/MapView.jsx` (lines 144–154)
**Category:** React anti-pattern

`mapRef` is a ref (never changes identity) and `bounds()` depends on props/state not listed in the dependency array.

### 25. Frontend: Inconsistent error display (toast vs inline vs both)
**Category:** Inconsistency

Some operations show errors via toast only, some inline only, and `WaypointUpdateModal.createWaypoint` does **both**, producing duplicate error messages.

### 26. Frontend: Inconsistent class vs. functional components
**Category:** Inconsistency

Components performing equivalent tasks (e.g., confirmation modals) use different paradigms with no clear pattern.

### 27. Test: False-positive test passes for wrong reason
**File:** `backend/api/tests/test_folder_api_additional.py` (lines 322–345)
**Category:** Logic bug

`test_membership_requires_owner` gets 400 from a **duplicate membership constraint**, not an authorization check. The test claims to verify permissions but actually tests uniqueness.

### 28. Test: Massive duplicated setUp across 7+ test classes
**Files:** All 6 test files
**Category:** Duplication

Identical user/group/folder creation boilerplate (~100 lines total) repeated across 7 test classes. Should be a shared `FolderTestMixin` base class with a `_grant_access()` helper.

### 29. Test: `test_folder_api.py` is a stub superseded by `test_folder_api_additional.py`
**File:** `backend/api/tests/test_folder_api.py`
**Category:** Dead code / Redundancy

Only 82 lines, 4 tests. Most concerns are tested more thoroughly in `test_folder_api_additional.py`.

### 30. Test: `test_folder_api_additional.py` is an overly large catch-all
**File:** `backend/api/tests/test_folder_api_additional.py` (445 lines, 5 classes)
**Category:** Organization

Contains 5 unrelated test classes. The "Additional" suffix is a red flag for iterative dump. Membership and staff tests have nothing to do with "folder API additional" functionality.

### 31. Test: `test_folder_permissions.py` only has 3 tests for core permission logic
**File:** `backend/api/tests/test_folder_permissions.py` (60 lines)
**Category:** Missing coverage

Missing: owner always has access, staff override, multiple groups with different access levels, deeply nested folders, etc.

### 32. Test: `test_waypoint_access.py` only tests create
**File:** `backend/api/tests/test_waypoint_access.py` (76 lines)
**Category:** Missing coverage

No tests for waypoint update, delete, or list/detail with read access. No tests for WaypointGroup or WaypointMedia permissions.

### 33. Test: Missing edge cases across the suite
**Category:** Missing coverage

No tests for: unauthenticated access, deleting a folder containing activities, removing an activity from a folder, deeply nested permission inheritance (3+ levels), revoking group membership effects, or concurrent permission changes.

### 34. Migration churn: 3 migrations to stabilize one feature's constraints
**Files:** Migrations 0002, 0003, 0004
**Category:** Migration issue

Folder constraints are created, removed, and re-created across three migrations. Should be squashed before wider adoption.

### 35. `autopep8` listed as a production dependency
**File:** `backend/pyproject.toml` (line 9)
**Category:** Dependency misclassification

Dev-only tool inflates the production Docker image. Should be under `[dependency-groups]` dev group.

---

## Low Severity

### 36. Dead `backend/backend/views.py` crashes on import
**File:** `backend/backend/views.py`

Entire module is unused. `AUTH_ME_JSON = auth_me_file()` executes at import time and crashes if `.auth/me.json` is missing.

### 37. Shadowed import in `views.py`
**File:** `backend/api/views.py` (line 8 vs 17)

Django `ValidationError` imported then overwritten by DRF `ValidationError`. Also `import os` on line 5 is unused.

### 38. `== None` / `== False` instead of `is None` / `not`
**Files:** `backend/api/models.py` (~7 places), `backend/api/views.py` (~2 places)

PEP 8 mandates identity checks for `None`/`False`.

### 39. `saveMedia` uses camelCase
**File:** `backend/api/views.py` (line 219)

Violates Python's snake_case convention. Every other method uses snake_case.

### 40. `child_entity_did_update` uses Apple/Swift naming style
**File:** `backend/api/models.py` (lines 155–160)

Has a trailing `pass` after `self.save()` that does nothing.

### 41. Unreachable `None` check
**File:** `backend/api/views.py` (lines 269–271)

`Waypoint.objects.get(…)` raises `DoesNotExist`, never returns `None`. The `if other_waypoint == None:` branch is dead code.

### 42. `UserPermissions` model is unused
**File:** `backend/api/models.py` (lines 310–316)

Only referenced by disabled middleware. Still creates a database table.

### 43. Duplicated validation in serializer and model
**Files:** `backend/api/serializers.py` (lines 97–121), `backend/api/models.py` (lines 413–421)

`FolderPermissionSerializer.validate()` re-implements the same user/group principal validation that `FolderPermission.clean()` already enforces.

### 44. Misspelled copyright in `admin.py`
**File:** `backend/api/admin.py` (lines 1–2)

Line 1 says "Contributors" (typo), line 2 says "Contributors" (correct). Two separate copyright lines.

### 45. Frontend: `updateWaypointIndex()` API method is never called
**File:** `frontend/src/api/API.js` (lines 206–212)

Dead code.

### 46. Frontend: `AlertModal` component is never imported
**File:** `frontend/src/components/Modals/AlertModal.jsx`

Entire component is unused.

### 47. Frontend: `Auth.idToken = 'fixme'`
**File:** `frontend/src/api/Auth.js` (line 59)

Hardcoded placeholder set on login but never read.

### 48. Frontend: Hardcoded share domain
**File:** `frontend/src/components/Modals/ActivityLinkModal.jsx` (line 12)

`https://share.soundscape.services` should come from an environment variable.

### 49. Frontend: Placeholder footer links
**File:** `frontend/src/components/Main/Footer.jsx` (lines 10–28)

All links point to `https://www.yourcompany.com/…` and display "Your Company".

### 50. Frontend: `InvalidWindowSizeAlert` reports wrong minimum width
**File:** `frontend/src/components/Main/InvalidWindowSizeAlert.jsx` (line 12)

Says "100x500" but actual check in `App.jsx` is `window.innerWidth > 1000`. Should say "1000x500".

### 51. Frontend: `var` keyword in `objectToFormData`
**File:** `frontend/src/api/API.js` (line 38)

Lone `var` in a `const`/`let` codebase.

### 52. Frontend: Duplicate Axios CSRF configuration
**Files:** `frontend/src/api/API.js`, `frontend/src/api/Auth.js`

Both independently configure `xsrfCookieName` and `xsrfHeaderName`.

### 53. Frontend: Folder tree building logic duplicated 4×
**Files:** `ActivitiesTable.jsx`, `FolderTree.jsx`, `App.jsx`, `folderOptions.js`

Each independently builds a `Map` of folders-by-parent from the flat array.

### 54. Frontend: Missing `componentWillUnmount` for resize listener
**File:** `frontend/src/App.jsx` (line 127)

Adds `window.addEventListener('resize', ...)` but never removes it.

### 55. Frontend: `window.location.reload(true)` deprecated parameter
**Files:** `Login.jsx`, `NavigationBar.jsx`

Forced-reload parameter is deprecated and ignored by modern browsers.

### 56. Frontend: `defaultProps` used on one component
**File:** `frontend/src/components/Modals/AlertModal.jsx` (lines 37–40)

`defaultProps` is deprecated in React; every other component uses `??` or default params.

### 57. Frontend: Commented-out code throughout
**Files:** `Auth.js` (lines 56–58), `ActivityDetailHeader.jsx` (lines 17–18), `App.jsx` (line 211)

### 58. Frontend: Debug `console.log` left in production code
**Files:** `App.jsx` (lines 178–180), `Login.jsx` (line 22)

### 59. Frontend: Unused `Row` import
**File:** `frontend/src/components/ActivitySecondary/ActivityDetail.jsx` (line 4)

### 60. Frontend: Empty `<span data-feather>` remnants
**File:** `frontend/src/components/ActivitySecondary/ActivityDetailHeader.jsx` (lines 37, 51)

Vestiges of feather-icons integration that was replaced by `react-feather`.

### 61. `pip` listed as a project dependency
**File:** `backend/pyproject.toml` (line 19)

Unnecessary since `uv` manages the environment.

### 62. Git-pinned gpxpy fork may be stale
**File:** `backend/pyproject.toml` (lines 27–32)

Comment says upstream PR was merged but not released. Should be periodically checked.

### 63. `sample.env` insecure defaults
**File:** `sample.env`

`DJANGO_SECRET_KEY='change-me'` and `PSQL_DB_PASS=postgres` with no prominent warning.

### 64. Production URL in local settings
**File:** `backend/backend/settings/local.py` (line 32)

`'https://authoring.mur.org.uk'` in local `CSRF_TRUSTED_ORIGINS`.

### 65. Placeholder `ADMINS` and disposable `SERVER_EMAIL`
**File:** `backend/backend/settings/base.py` (lines 48–50)

`ADMINS = [('NAME', 'EMAIL')]` and a disposable email address.

### 66. No `restart:` policy in docker-compose.yml
**File:** `docker-compose.yml`

Neither service has a restart policy; crashed containers stay down.

### 67. `seed_activities.py`: `_folder_name_exists` doesn't filter by owner for child folders
**File:** `backend/api/management/commands/seed_activities.py` (lines 222–225)

Makes the seed command overly conservative but doesn't cause errors.

### 68. `seed_activities.py`: No waypoints created in seeded activities
**File:** `backend/api/management/commands/seed_activities.py` (lines 207–219)

Seeded activities have `WaypointGroup` objects but zero actual `Waypoint` records.

### 69. Test: `self.User = get_user_model()` repeated in every setUp
**Files:** All 6 test files

Should be a module-level constant.

### 70. Test: Misleading test name `test_group_list_only_owner`
**File:** `backend/api/tests/test_folder_api_additional.py` (lines 306–316)

Actually verifies admin-role visibility, not owner-only visibility.

### 71. Test: Staff tests scattered across multiple files
**Files:** `test_activity_sharing.py`, `test_folder_api_additional.py`

Same conceptual concern split across files with no cross-references.

### 72. `GroupViewSet` has no `perform_update` or `perform_destroy`
**File:** `backend/api/views.py` (lines 449–459)

A group admin member (not just the owner) can update the group name or delete the group entirely via default DRF behavior.

### 73. No length validation in `saveMedia`
**File:** `backend/api/views.py` (lines 222–237)

`image_alts[i]` / `audio_clip_texts[i]` will `IndexError` if fewer alt texts are submitted than files.

### 74. Unhandled `DoesNotExist` during waypoint swap
**File:** `backend/api/views.py` (lines 264–265)

`Waypoint.objects.get(group=group, index=updated_index)` produces a raw 500 error if the target index doesn't exist.

### 75. Near-identical image/audio export loops in GPX utils
**File:** `backend/api/gpx_utils.py` (lines 166–183)

Two loops differ only in the source queryset. Could iterate `waypoint.media_items` once.
