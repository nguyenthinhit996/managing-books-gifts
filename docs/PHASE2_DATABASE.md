# Phase 2: Database Design - Complete Guide

## Overview

In this phase, we'll create the database schema in Supabase with 5 main tables:
1. **users** - Manager, sales, admin accounts
2. **books** - Book inventory
3. **students** - Student information
4. **lending_records** - Borrow/return history

---

## Step 1: Create Tables in Supabase

### 1.1 Go to Supabase SQL Editor

1. Open [Supabase Dashboard](https://supabase.com)
2. Select your `books-management` project
3. Click **SQL Editor** (left sidebar)
4. Click **New Query**

### 1.2 Run SQL Scripts

Copy and paste each SQL script below into the editor and click **Run**.

---

## SQL Scripts

### Script 1: Create ENUMS

```sql
-- Create ENUM types for different fields

-- Role enum
CREATE TYPE user_role AS ENUM ('manager', 'sales', 'admin');

-- Book level enum
CREATE TYPE book_level AS ENUM (
  'beginner',
  'elementary',
  'pre-intermediate',
  'intermediate',
  'upper-intermediate',
  'advanced'
);

-- Student type enum
CREATE TYPE student_type AS ENUM ('new', 'trial', 'returning');

-- Book condition enum
CREATE TYPE book_condition AS ENUM ('excellent', 'good', 'fair', 'poor');

-- Lending status enum
CREATE TYPE lending_status AS ENUM ('borrowed', 'returned', 'overdue', 'lost', 'damaged');
```

**Status**: ✅ Run this first

---

### Script 2: Create Users Table

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'sales',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
```

**Status**: ✅ Run this second

---

### Script 3: Create Books Table

```sql
CREATE TABLE books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  isbn VARCHAR(20) UNIQUE,
  title VARCHAR(255) NOT NULL,
  author VARCHAR(255) NOT NULL,
  level book_level NOT NULL,
  quantity_total INTEGER NOT NULL DEFAULT 1,
  quantity_available INTEGER NOT NULL DEFAULT 1,
  condition book_condition DEFAULT 'excellent',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for faster searches
CREATE INDEX idx_books_title ON books(title);
CREATE INDEX idx_books_level ON books(level);
CREATE INDEX idx_books_isbn ON books(isbn);
```

**Status**: ✅ Run this third

---

### Script 4: Create Students Table

```sql
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  level book_level NOT NULL,
  student_type student_type NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_students_email ON students(email);
CREATE INDEX idx_students_level ON students(level);
CREATE INDEX idx_students_student_type ON students(student_type);
```

**Status**: ✅ Run this fourth

---

### Script 5: Create Lending Records Table

```sql
CREATE TABLE lending_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  sales_staff_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  issued_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  return_date DATE,
  status lending_status NOT NULL DEFAULT 'borrowed',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_lending_book_id ON lending_records(book_id);
CREATE INDEX idx_lending_student_id ON lending_records(student_id);
CREATE INDEX idx_lending_staff_id ON lending_records(sales_staff_id);
CREATE INDEX idx_lending_status ON lending_records(status);
CREATE INDEX idx_lending_issued_date ON lending_records(issued_date);
```

**Status**: ✅ Run this fifth

---

## Step 2: Insert Sample Data

Copy and paste these scripts to add test data.

### Script 6: Sample Users

```sql
-- Insert test users
INSERT INTO users (email, password_hash, full_name, role) VALUES
('manager@englishcenter.com', '$2b$10$example_hash_1', 'Anna Manager', 'manager'),
('sales1@englishcenter.com', '$2b$10$example_hash_2', 'John Sales', 'sales'),
('sales2@englishcenter.com', '$2b$10$example_hash_3', 'Sarah Sales', 'sales'),
('admin@englishcenter.com', '$2b$10$example_hash_4', 'Admin User', 'admin');
```

**Status**: ✅ Run this to add test users

---

### Script 7: Sample Books

```sql
-- Insert sample books
INSERT INTO books (isbn, title, author, level, quantity_total, quantity_available, condition, notes) VALUES
('978-0-19-423984-6', 'Oxford English Grammar Course Beginner', 'Mark Harrison', 'beginner', 10, 8, 'excellent', 'Perfect for beginners'),
('978-0-19-423985-3', 'Oxford English Grammar Course Elementary', 'Mark Harrison', 'elementary', 8, 5, 'good', 'Covers basic grammar'),
('978-0-521-35949-0', 'Cambridge English Intermediate', 'Michael Swan', 'intermediate', 6, 4, 'excellent', 'Standard intermediate level'),
('978-0-521-22222-1', 'Cambridge Advanced Learner', 'Caroline Boyle', 'upper-intermediate', 5, 3, 'good', 'Advanced topics'),
('978-1-4058-7231-0', 'English Pronunciation in Use', 'Mark Hancock', 'pre-intermediate', 7, 6, 'excellent', 'Focus on pronunciation'),
('978-0-14-028329-5', 'English Collocations in Use', 'Claire West', 'intermediate', 5, 4, 'fair', 'Learn collocation patterns'),
('978-0-521-69882-2', 'Advanced Grammar in Use', 'Martin Hewings', 'advanced', 4, 2, 'excellent', 'For advanced learners'),
('978-1-107-51633-3', 'Key to English Vocabulary', 'Jon Marks', 'elementary', 9, 7, 'good', 'Vocabulary building');
```

**Status**: ✅ Run this to add sample books

---

### Script 8: Sample Students

```sql
-- Insert sample students
INSERT INTO students (name, email, phone, level, student_type, notes) VALUES
('Nguyen Van A', 'student1@email.com', '0901234567', 'beginner', 'new', 'Just enrolled'),
('Tran Thi B', 'student2@email.com', '0902345678', 'elementary', 'new', 'Has some experience'),
('Pham Van C', 'student3@email.com', '0903456789', 'pre-intermediate', 'trial', 'Trial student'),
('Le Thi D', 'student4@email.com', '0904567890', 'intermediate', 'returning', 'Returning student'),
('Hoang Van E', 'student5@email.com', '0905678901', 'intermediate', 'new', 'Transferred from other center');
```

**Status**: ✅ Run this to add sample students

---

### Script 9: Sample Lending Records

```sql
-- Insert sample lending records
-- Note: You'll need to replace the UUIDs with actual IDs from your tables
-- Use this as a template after getting real IDs

-- First, get the IDs (run these separately to see the IDs)
-- SELECT id FROM books WHERE title = 'Oxford English Grammar Course Beginner' LIMIT 1;
-- SELECT id FROM students WHERE name = 'Nguyen Van A' LIMIT 1;
-- SELECT id FROM users WHERE full_name = 'John Sales' LIMIT 1;

-- Sample lending (with placeholder - you can manually add through UI first)
INSERT INTO lending_records (book_id, student_id, sales_staff_id, issued_date, due_date, status)
SELECT 
  (SELECT id FROM books WHERE title = 'Oxford English Grammar Course Beginner' LIMIT 1),
  (SELECT id FROM students WHERE name = 'Nguyen Van A' LIMIT 1),
  (SELECT id FROM users WHERE role = 'sales' LIMIT 1),
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '30 days',
  'borrowed'
WHERE EXISTS (SELECT 1 FROM books WHERE title = 'Oxford English Grammar Course Beginner')
  AND EXISTS (SELECT 1 FROM students WHERE name = 'Nguyen Van A')
  AND EXISTS (SELECT 1 FROM users WHERE role = 'sales');

INSERT INTO lending_records (book_id, student_id, sales_staff_id, issued_date, due_date, return_date, status)
SELECT 
  (SELECT id FROM books WHERE title = 'Oxford English Grammar Course Elementary' LIMIT 1),
  (SELECT id FROM students WHERE name = 'Tran Thi B' LIMIT 1),
  (SELECT id FROM users WHERE role = 'sales' LIMIT 1),
  CURRENT_DATE - INTERVAL '15 days',
  CURRENT_DATE,
  CURRENT_DATE,
  'returned'
WHERE EXISTS (SELECT 1 FROM books WHERE title = 'Oxford English Grammar Course Elementary')
  AND EXISTS (SELECT 1 FROM students WHERE name = 'Tran Thi B')
  AND EXISTS (SELECT 1 FROM users WHERE role = 'sales');
```

**Status**: ✅ Run this to add sample lending records

---

## Step 3: Verify Database Setup

### 3.1 Check Tables Created

In Supabase SQL Editor, run:

```sql
-- Check all tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

You should see:
- `users`
- `books`
- `students`
- `lending_records`

### 3.2 Count Data in Each Table

```sql
SELECT 
  'users' as table_name, COUNT(*) as row_count FROM users
UNION ALL
SELECT 'books', COUNT(*) FROM books
UNION ALL
SELECT 'students', COUNT(*) FROM students
UNION ALL
SELECT 'lending_records', COUNT(*) FROM lending_records;
```

**Expected Output:**
```
table_name        | row_count
users             | 4
books             | 8
students          | 5
lending_records   | 2
```

### 3.3 Verify Relationships

```sql
-- Check if relationships work
SELECT 
  lr.id,
  lr.status,
  b.title as book_title,
  s.name as student_name,
  u.full_name as staff_name
FROM lending_records lr
JOIN books b ON lr.book_id = b.id
JOIN students s ON lr.student_id = s.id
JOIN users u ON lr.sales_staff_id = u.id;
```

---

## Step 4: Enable Row Level Security (RLS)

This adds security so users only see data they're allowed to.

### 4.1 Enable RLS on Tables

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE lending_records ENABLE ROW LEVEL SECURITY;
```

### 4.2 Create RLS Policies (For Now - Allow All)

```sql
-- Temporarily allow all access (we'll refine this later)
-- This is for development; we'll add proper policies in Phase 7

CREATE POLICY "Allow all users" ON users FOR ALL USING (true);
CREATE POLICY "Allow all books" ON books FOR ALL USING (true);
CREATE POLICY "Allow all students" ON students FOR ALL USING (true);
CREATE POLICY "Allow all lending" ON lending_records FOR ALL USING (true);
```

---

## ✅ Phase 2 Checklist

- [ ] **Script 1**: Created ENUM types ✓
- [ ] **Script 2**: Created users table ✓
- [ ] **Script 3**: Created books table ✓
- [ ] **Script 4**: Created students table ✓
- [ ] **Script 5**: Created lending_records table ✓
- [ ] **Script 6**: Added sample users ✓
- [ ] **Script 7**: Added sample books ✓
- [ ] **Script 8**: Added sample students ✓
- [ ] **Script 9**: Added sample lending records ✓
- [ ] **Verified**: All tables created with data ✓
- [ ] **Enabled**: Row Level Security ✓

---

## 📊 Database Schema Summary

```
users
├── id (UUID, PK)
├── email (VARCHAR, UNIQUE)
├── password_hash (VARCHAR)
├── full_name (VARCHAR)
├── role (manager | sales | admin)
└── created_at, updated_at

books
├── id (UUID, PK)
├── isbn (VARCHAR, UNIQUE)
├── title (VARCHAR)
├── author (VARCHAR)
├── level (beginner | elementary | ... | advanced)
├── quantity_total (INTEGER)
├── quantity_available (INTEGER)
├── condition (excellent | good | fair | poor)
└── created_at, updated_at

students
├── id (UUID, PK)
├── name (VARCHAR)
├── email (VARCHAR)
├── phone (VARCHAR)
├── level (beginner | ... | advanced)
├── student_type (new | trial | returning)
└── created_at, updated_at

lending_records
├── id (UUID, PK)
├── book_id (UUID, FK → books)
├── student_id (UUID, FK → students)
├── sales_staff_id (UUID, FK → users)
├── issued_date (DATE)
├── due_date (DATE)
├── return_date (DATE, nullable)
├── status (borrowed | returned | overdue | lost | damaged)
└── created_at, updated_at
```

---

## 🔗 What's Next?

After Phase 2 is complete:
1. ✅ Database ready with sample data
2. Database queries documented
3. Move to **Phase 3: Frontend Setup & Authentication**

Ready to proceed with Phase 3?

