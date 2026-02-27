# Phase 6.2: Change Request - Rename `books` → `materials` & `lending_records` → `material_records`

## Overview

Two table renames to better reflect the system's purpose:

1. **`books` → `materials`** — support multiple item types: books, gifts, and other learning materials
2. **`lending_records` → `material_records`** — records are no longer just "lending", they track all material transactions

---

## Step 1: Database Migration

Run these SQL statements **one by one** in Supabase SQL Editor:

```sql
-- 1. Add 'type' column to books table (before renaming)
ALTER TABLE books
ADD COLUMN type VARCHAR(20) NOT NULL DEFAULT 'book';

-- 2. Rename table: books → materials
ALTER TABLE books RENAME TO materials;

-- 3. Rename table: lending_records → material_records
ALTER TABLE lending_records RENAME TO material_records;

-- 4. Rename column in material_records: book_id → material_id
ALTER TABLE material_records
RENAME COLUMN book_id TO material_id;

-- 5. Drop old foreign key and add new one with correct names
ALTER TABLE material_records
DROP CONSTRAINT lending_records_book_id_fkey;

ALTER TABLE material_records
ADD CONSTRAINT material_records_material_id_fkey
FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE CASCADE;

-- 6. Rename the student_phone foreign key constraint (if it exists)
ALTER TABLE material_records
DROP CONSTRAINT IF EXISTS lending_records_student_phone_fkey;

ALTER TABLE material_records
ADD CONSTRAINT material_records_student_phone_fkey
FOREIGN KEY (student_phone) REFERENCES students(phone) ON DELETE CASCADE;

-- 7. Add index on the new type column for filtering
CREATE INDEX idx_materials_type ON materials(type);
```

### Updated table schemas

```
materials (was: books)
├── id (UUID, primary key)
├── isbn (VARCHAR, unique, nullable)
├── title (VARCHAR)
├── author (VARCHAR, nullable)
├── type (VARCHAR: 'book', 'gift', 'other')   ← NEW
├── level (ENUM)
├── quantity_total (INTEGER)
├── quantity_available (INTEGER)
├── condition (ENUM)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

material_records (was: lending_records)
├── id (UUID, primary key)
├── material_id (UUID, FK → materials)         ← was book_id
├── student_phone (VARCHAR, FK → students)
├── sales_staff_id (UUID, FK → users)
├── issued_date (DATE)
├── due_date (DATE)
├── return_date (DATE, nullable)
├── status (ENUM: borrowed, returned, overdue, lost, damaged)
├── notes (TEXT, nullable)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

### Material `type` values

| Value   | Description                        |
|---------|------------------------------------|
| `book`  | Textbooks, workbooks, readers      |
| `gift`  | Promotional gifts for students     |
| `other` | Any other learning material        |

---

## Step 2: API Route Changes

### Rename route folders/files

| Old Path                          | New Path                                  |
|-----------------------------------|-------------------------------------------|
| `src/pages/api/books/index.ts`    | `src/pages/api/materials/index.ts`        |
| `src/pages/api/books/[id].ts`     | `src/pages/api/materials/[id].ts`         |
| `src/pages/api/lending/index.ts`  | `src/pages/api/material-records/index.ts` |
| `src/pages/api/lending/[id].ts`   | `src/pages/api/material-records/[id].ts`  |

### Update inside API files (8 files)

| File                                            | Changes                                                              |
|-------------------------------------------------|----------------------------------------------------------------------|
| `api/materials/index.ts` (was books)            | `.from('books')` → `.from('materials')`, add `type` filter           |
| `api/materials/[id].ts` (was books)             | `.from('books')` → `.from('materials')`                              |
| `api/material-records/index.ts` (was lending)   | `.from('lending_records')` → `.from('material_records')`, `book_id` → `material_id`, `books` → `materials` |
| `api/material-records/[id].ts` (was lending)    | `.from('lending_records')` → `.from('material_records')`, `book_id` → `material_id`, `books` → `materials` |
| `api/enrollment.ts`                             | `book_id` → `material_id`, `.from('books')` → `.from('materials')`, `.from('lending_records')` → `.from('material_records')` |
| `api/students/check-phone.ts`                   | `book_id` → `material_id`, `lending_records` → `material_records`, `books` → `materials` |
| `api/students/[id].ts`                          | `lending_records` → `material_records`, `books` → `materials`        |
| `api/dashboard/stats.ts`                        | `.from('books')` → `.from('materials')`, `.from('lending_records')` → `.from('material_records')` |
| `api/users/[id].ts`                             | Any `lending_records` / `books` references → new names               |

---

## Step 3: Frontend Page Changes

### Rename files

| Old Path                              | New Path                                    |
|---------------------------------------|---------------------------------------------|
| `src/pages/dashboard/books.tsx`       | `src/pages/dashboard/materials.tsx`         |
| `src/pages/dashboard/lending.tsx`     | `src/pages/dashboard/material-records.tsx`  |

### Update inside frontend files (7 files)

| File                                                 | Changes                                                         |
|------------------------------------------------------|-----------------------------------------------------------------|
| `dashboard/materials.tsx` (was books)                | Rename interfaces, API calls `/api/books` → `/api/materials`, add type column + filter |
| `dashboard/material-records.tsx` (was lending)       | API calls `/api/lending` → `/api/material-records`, `book_id` → `material_id`, UI labels |
| `dashboard/index.tsx`                                | Stats labels & API references: books → materials, lending → material records |
| `dashboard/students.tsx`                             | Borrowing history references → material records                 |
| `dashboard/sales.tsx`                                | Any book/lending references → materials/material records        |
| `enrollment.tsx`                                     | `book_id` → `material_id`, `/api/books` → `/api/materials`, interface `Book` → `Material` |
| `components/Sidebar.tsx`                             | Menu items: "Books" → "Materials", "Lending" → "Material Records", update links |

---

## Step 4: Type/Interface Renames

Across all files:

```
books            → materials
Book             → Material
book             → material
book_id          → material_id
book_title       → material_title
bookSearch       → materialSearch
bookError        → materialError

lending_records  → material_records
lending          → materialRecords (in variables/routes)
LendingRecord    → MaterialRecord
lendingRecord    → materialRecord
lendingError     → materialRecordError
```

---

## Summary of All Affected Files (18 total)

### API Routes — rename (4 files)
1. `src/pages/api/books/index.ts` → `api/materials/index.ts`
2. `src/pages/api/books/[id].ts` → `api/materials/[id].ts`
3. `src/pages/api/lending/index.ts` → `api/material-records/index.ts`
4. `src/pages/api/lending/[id].ts` → `api/material-records/[id].ts`

### API Routes — update in place (5 files)
5. `src/pages/api/enrollment.ts`
6. `src/pages/api/students/check-phone.ts`
7. `src/pages/api/students/[id].ts`
8. `src/pages/api/users/[id].ts`
9. `src/pages/api/dashboard/stats.ts`

### Frontend Pages — rename (2 files)
10. `src/pages/dashboard/books.tsx` → `dashboard/materials.tsx`
11. `src/pages/dashboard/lending.tsx` → `dashboard/material-records.tsx`

### Frontend Pages — update in place (4 files)
12. `src/pages/dashboard/index.tsx`
13. `src/pages/dashboard/students.tsx`
14. `src/pages/dashboard/sales.tsx`
15. `src/pages/enrollment.tsx`

### Components (1 file)
16. `src/components/Sidebar.tsx`

### Docs (2 files)
17. `docs/PLAN.md` — update schema & page references
18. `docs/PHASE6_ENROLLMENT.md` — update references

---

## Execution Order

1. **Database first** — Run SQL migration (Step 1)
2. **API routes** — Rename folders & update all API files (Step 2)
3. **Frontend** — Rename pages & update all frontend files (Step 3)
4. **Test** — Verify all pages and API endpoints work
5. **Commit**

---

## Notes

- All existing book records get `type = 'book'` automatically (DEFAULT value)
- The enrollment form should add a "Material Type" dropdown when borrowing
- The dashboard materials page should add a type filter and type column
- No data loss — these are renames + one new column, all existing data is preserved
- Old API URLs (`/api/books`, `/api/lending`) will stop working after the rename — no backward compatibility needed since this is pre-launch
