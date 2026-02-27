# PHASE 6.4 — Bug Fix Plan

## Phase 1 — Environment & Config Sanity

| # | Check | How |
|---|-------|-----|
| 1.1 | `.env.local` has `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_API_URL` | `cat frontend/.env.local` |
| 1.2 | `supabase.ts` throws at startup if keys are missing — confirm no blank-string silent failure | `src/utils/supabase.ts` — ✅ throws, but only at import time (SSR crash if missing) |
| 1.3 | `next.config.js` has no blocking rewrites or missing env exposure | `cat frontend/next.config.js` |

---

## Phase 2 — API Route Logic Bugs

| # | File | Risk |
|---|------|------|
| 2.1 | `src/pages/api/enrollment.ts` | Reads **both** `material_id` and `material_ids` from body, but the frontend only sends `material_ids` — verify the merge logic never produces an empty array silently |
| 2.2 | `src/pages/api/enrollment.ts` | After inserting the enrollment, `quantity_available` decrement uses a read-then-write pattern — **race condition** if two requests arrive simultaneously; must use a DB RPC/transaction |
| 2.3 | `src/pages/api/enrollment.ts` | Existing student update path calls `supabase.update(name, email, level)` even when values are blank — can overwrite real data with empty strings |
| 2.4 | `src/pages/api/students/check-phone.ts` | Returns `borrowed_materials` but frontend reads `response.data.data.borrowed_materials` — verify nesting matches the `apiResponse` wrapper shape |
| 2.5 | `src/pages/api/material-records/index.ts` | `date_from`/`date_to` filters are applied on a **nested joined column** (`enrollments.issued_date`) — PostgREST does not filter on nested joins this way; date filter silently does nothing |
| 2.6 | `src/pages/api/enrollments/[id].ts` | `PATCH` accepts any arbitrary `fields` from request body with **no whitelist** — a client can overwrite sensitive fields like `student_phone` or `sales_staff_id` |

### Fixes

#### 2.2 — Race condition on quantity decrement
Replace the read-then-decrement pattern with a Supabase RPC call:
```sql
-- Create this function in Supabase SQL editor
CREATE OR REPLACE FUNCTION decrement_material_quantity(p_material_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE materials
  SET quantity_available = quantity_available - 1
  WHERE id = p_material_id AND quantity_available > 0;
END;
$$ LANGUAGE plpgsql;
```
Then call it from the API:
```ts
await supabase.rpc('decrement_material_quantity', { p_material_id: id })
```

#### 2.3 — Overwrite existing student with blank values
Only update fields that are actually provided:
```ts
const updates: Record<string, string> = {}
if (student_name) updates.name = student_name
if (email) updates.email = email
if (level) updates.level = level

if (Object.keys(updates).length > 0) {
  await supabase.from('students').update(updates).eq('phone', phone)
}
```

#### 2.5 — Broken date filter on nested join
Move the date filter to a subquery or a separate `enrollments` query, then filter `material_records` by the resulting `enrollment_id` list.

#### 2.6 — Unrestricted PATCH fields
Whitelist allowed update fields:
```ts
const ALLOWED_FIELDS = ['notes', 'due_date', 'erp_updated']
const safeFields = Object.fromEntries(
  Object.entries(req.body).filter(([key]) => ALLOWED_FIELDS.includes(key))
)
if (Object.keys(safeFields).length === 0) {
  return apiError(res, 'No valid fields to update', 400)
}
```

---

## Phase 3 — Frontend Logic Bugs

| # | File | Risk |
|---|------|------|
| 3.1 | `src/pages/enrollment.tsx` | `checkPhone` is in `useCallback([])` with empty deps — the `setSelectedMaterials` closure inside captures the **initial** state value; stale closure bug |
| 3.2 | `src/pages/enrollment.tsx` | `phoneTimerRef` debounce timeout is never cleared on component **unmount** — can call `setState` on an unmounted component |
| 3.3 | `src/pages/enrollment.tsx` | On successful submit, `imagePreviews` object URLs are never revoked before the array is cleared — **memory leak** |
| 3.4 | `src/pages/enrollment.tsx` | `handleTypeToggle` clears selected materials for the removed type but does **not** reset `materialSearch` when the last type is deselected — stale search text lingers |
| 3.5 | `src/pages/enrollment.tsx` | Submit sends `student_name: formData.student_name \|\| phoneExists?.name` — if both exist, the frontend value silently overwrites the existing student's DB name (see 2.3) |
| 3.6 | `src/pages/enrollment.tsx` | `checkingPhone` spinner uses `transform -translate-y-1/2` but the input has `mt-2` offset — spinner position misaligns visually |

### Fixes

#### 3.1 — Stale closure in `useCallback`
Remove `useCallback` or add proper deps. The safest approach:
```ts
// Remove useCallback wrapper — checkPhone is only called inside a ref timeout,
// so recreating it on each render is harmless and avoids stale closures.
const checkPhone = async (phone: string) => { ... }
```

#### 3.2 — Missing cleanup on unmount
```ts
useEffect(() => {
  return () => {
    if (phoneTimerRef.current) clearTimeout(phoneTimerRef.current)
  }
}, [])
```

#### 3.3 — Memory leak from unreleased object URLs
In the submit success block, revoke all preview URLs before clearing:
```ts
setImagePreviews((prev) => {
  prev.forEach((url) => URL.revokeObjectURL(url))
  return []
})
```

#### 3.4 — Stale `materialSearch` after type deselected
In `handleTypeToggle`, also clear search when the result leaves no types selected:
```ts
const handleTypeToggle = (type: string) => {
  const isRemoving = selectedTypes.includes(type)
  const next = isRemoving ? selectedTypes.filter((t) => t !== type) : [...selectedTypes, type]
  setSelectedTypes(next)
  if (isRemoving) {
    setSelectedMaterials((prev) => prev.filter((m) => m.type !== type))
    if (next.length === 0) setMaterialSearch('')
  }
}
```

---

## Phase 4 — Database / Supabase

| # | Check |
|---|-------|
| 4.1 | `materials.quantity_available` is decremented in app code — verify DB has `CHECK (quantity_available >= 0)` to prevent negative stock |
| 4.2 | `enrollment-images` bucket RLS: anon users can **upload** but must not be able to **list** or **delete** others' files |
| 4.3 | `material_records.status` — confirm only `'borrowed'` and `'returned'` are valid (DB check constraint or enum) |
| 4.4 | No soft-delete pattern — deleting a `material` will orphan existing `material_records` unless a FK `ON DELETE RESTRICT` or `SET NULL` is configured |

---

## Phase 5 — Auth & Security

| # | Check |
|---|-------|
| 5.1 | `api/enrollment.ts` (public form endpoint) has **no auth check** — confirm this is intentional for the public-facing form |
| 5.2 | Dashboard API routes (`/api/users`, `/api/materials`, etc.) — verify they call `supabase.auth.getUser()` or validate the JWT before returning data |
| 5.3 | `apiClient` in `utils/api.ts` attaches the bearer token, but Next.js API routes use the server-side **anon key** — confirm Supabase RLS policies enforce role-based access correctly |

---

## Phase 6 — Execution Order

```
Step 1:  cd frontend && npm run build
         → Catches all TypeScript / import errors before runtime

Step 2:  npm run dev
         → Check browser console for runtime errors on page load

Step 3:  Test enrollment form end-to-end:
           a. New student (no phone match) — verify student created in DB
           b. Existing student (phone match) — verify name NOT overwritten (Bug 2.3 / 3.5)
           c. Gift selected + image uploaded — verify image appears in Supabase Storage
           d. Gift selected WITHOUT image → submit should be blocked (validation check)
           e. Submit two identical enrollments simultaneously → verify quantity never goes negative (Bug 2.2)

Step 4:  Check materials.quantity_available in Supabase dashboard after each borrow

Step 5:  Check /dashboard/material-records with date filter → verify rows actually filter (Bug 2.5)

Step 6:  Send PATCH /api/enrollments/[id] with { student_phone: "0000000000" } → should be rejected (Bug 2.6)

Step 7:  Check browser memory profile: submit form multiple times with images → confirm no URL object leak (Bug 3.3)
```

---

## Priority Summary

| Priority | Bug | Impact |
|----------|-----|--------|
| 🔴 Critical | 2.2 Race condition on stock decrement | Data corruption (negative stock) |
| 🔴 Critical | 2.3 + 3.5 Overwrite existing student data | Silent data loss |
| 🟠 High | 2.5 Broken date filter | Feature completely non-functional |
| 🟠 High | 2.6 Unrestricted PATCH fields | Security vulnerability |
| 🟡 Medium | 3.1 Stale closure in `checkPhone` | Incorrect UI state |
| 🟡 Medium | 3.3 Memory leak on image URLs | Memory leak on repeated use |
| 🟢 Low | 3.2 Missing unmount cleanup | Minor — only affects HMR in dev |
| 🟢 Low | 3.4 Stale `materialSearch` text | Minor UX issue |
| 🟢 Low | 3.6 Spinner misalignment | Cosmetic |
