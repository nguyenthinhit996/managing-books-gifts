# Phase 6: Enrollment Form

## Overview

External-facing enrollment form for sales staff to register new students and assign books. Unlike the dashboard (manager-only), this form is used by sales staff to quickly register students.

---

## Step 1: Database Changes

### SQL Migration: Make phone unique

Run this in Supabase SQL Editor:

```sql
-- Add unique constraint to phone
ALTER TABLE students 
ADD CONSTRAINT unique_phone UNIQUE (phone);

-- Update lending_records to reference students by phone instead of student_id
-- Step 1: Add phone column to lending_records
ALTER TABLE lending_records 
ADD COLUMN student_phone VARCHAR(20) REFERENCES students(phone) ON DELETE CASCADE;

-- Step 2: Migrate data from student_id to student_phone
UPDATE lending_records lr
SET student_phone = (SELECT phone FROM students WHERE id = lr.student_id)
WHERE lr.student_phone IS NULL;

-- Step 3: Drop old foreign key constraint
ALTER TABLE lending_records
DROP CONSTRAINT lending_records_student_id_fkey;

-- Step 4: Drop student_id column
ALTER TABLE lending_records
DROP COLUMN student_id;

-- Step 5: Rename student_phone to student_phone and make it NOT NULL
ALTER TABLE lending_records
MODIFY COLUMN student_phone VARCHAR(20) NOT NULL;
```

**Recommended - PostgreSQL syntax (Supabase):**

```sql
-- Step 1: Add unique constraint to phone in students table
ALTER TABLE students 
ADD CONSTRAINT unique_phone UNIQUE (phone);

-- Step 2: Add phone column to lending_records
ALTER TABLE lending_records 
ADD COLUMN student_phone VARCHAR(20);

-- Step 3: Copy data from student_id to student_phone
UPDATE lending_records lr
SET student_phone = (SELECT phone FROM students WHERE id = lr.student_id)
WHERE lr.student_phone IS NULL;

-- Step 4: Drop old foreign key constraint
ALTER TABLE lending_records
DROP CONSTRAINT lending_records_student_id_fkey;

-- Step 5: Drop student_id column
ALTER TABLE lending_records
DROP COLUMN student_id;

-- Step 6: Make student_phone NOT NULL (only if all rows have values)
ALTER TABLE lending_records
ALTER COLUMN student_phone SET NOT NULL;

-- Step 7: Add foreign key constraint to phone
ALTER TABLE lending_records
ADD CONSTRAINT lending_records_student_phone_fkey 
FOREIGN KEY (student_phone) REFERENCES students(phone) ON DELETE CASCADE;
```

**Run each SQL statement one by one in Supabase SQL Editor** (don't run them all at once)

---

## Step 2: Create Enrollment Form Page

Create: `src/pages/enrollment.tsx`

**Features:**
- Public page (no authentication required)
- Form with all required fields
- Search dropdowns for sales staff and books
- Submit creates student and lending record

---

## Step 3: Create Enrollment API

Create: `src/pages/api/enrollment.ts`

**Features:**
- Creates student (or updates if phone exists)
- Creates lending record
- Validates phone is unique
- Returns confirmation

---

## Form Fields Specification

```
1. Student Name (text input, required)
2. Email (email input, required)
3. Phone (tel input, required, unique)
4. Student Level (dropdown: beginner, elementary, pre-intermediate, intermediate, upper-intermediate, advanced)
5. Purpose (dropdown: new-class, trial, returning, other)
6. Sales Staff Name (searchable dropdown - queries /api/users/sales)
7. Book Selection (searchable dropdown - queries /api/books with filter)
8. Notes (textarea, optional)
```

---

## Endpoint Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/enrollment` | POST | Submit enrollment form |
| `/api/users/sales` | GET | Get all sales staff (name, id) |
| `/api/books` | GET | Get available books (already exists) |

---

## Response Format

**Success:**
```json
{
  "success": true,
  "data": {
    "student_id": "uuid",
    "student_phone": "0912345678",
    "lending_record_id": "uuid",
    "message": "Enrollment successful!"
  }
}
```

**Error:**
```json
{
  "success": false,
  "error": "Phone number already exists"
}
```

---

## Next Steps

After Phase 6:
- Phase 7: Security & RLS Policies
- Phase 8: Reports & Analytics
- Phase 9: Deployment to Vercel
