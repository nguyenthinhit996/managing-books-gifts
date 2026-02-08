# Phase 4: Backend API Setup

## Overview

In this phase, we'll create a complete REST API with Next.js API routes that:
- Query and manage books, students, lending records
- Handle data validation
- Connect to Supabase database
- Implement proper error handling

---

## API Routes Structure

```
src/pages/api/
├── books/
│   ├── index.ts         (GET all, POST create)
│   └── [id].ts          (GET, PUT, DELETE)
├── students/
│   ├── index.ts         (GET all, POST create)
│   └── [id].ts          (GET, PUT)
├── lending/
│   ├── index.ts         (GET all, POST create)
│   └── [id].ts          (PUT - update status)
└── dashboard/
    └── stats.ts         (GET overview stats)
```

---

## Step 1: Create API Utilities

### 1.1 Request Validation Helper

Create `src/utils/api-helpers.ts`:

```typescript
import { NextApiRequest, NextApiResponse } from 'next'

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export function apiResponse<T>(
  res: NextApiResponse,
  success: boolean,
  data?: T,
  error?: string,
  statusCode: number = success ? 200 : 400
) {
  res.status(statusCode).json({
    success,
    data,
    error,
  })
}

export function apiError(
  res: NextApiResponse,
  error: string,
  statusCode: number = 400
) {
  res.status(statusCode).json({
    success: false,
    error,
  })
}

export function validateRequest(
  req: NextApiRequest,
  method: string | string[]
): boolean {
  const methods = Array.isArray(method) ? method : [method]
  return methods.includes(req.method || '')
}
```

---

## Step 2: Create Books API Routes

### 2.1 GET & POST Books

Create `src/pages/api/books/index.ts`:

```typescript
import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/utils/supabase'
import { apiResponse, apiError, validateRequest } from '@/utils/api-helpers'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // GET: Fetch all books with optional filters
  if (req.method === 'GET') {
    try {
      const { level, search, limit = 50, offset = 0 } = req.query

      let query = supabase
        .from('books')
        .select('*')
        .order('created_at', { ascending: false })
        .range(Number(offset), Number(offset) + Number(limit) - 1)

      if (level && level !== 'all') {
        query = query.eq('level', level)
      }

      if (search) {
        query = query.or(
          `title.ilike.%${search}%,author.ilike.%${search}%`
        )
      }

      const { data, error, count } = await query

      if (error) {
        return apiError(res, error.message, 500)
      }

      return apiResponse(res, true, { books: data, total: count })
    } catch (error: any) {
      return apiError(res, error.message, 500)
    }
  }

  // POST: Create new book
  if (req.method === 'POST') {
    try {
      const { isbn, title, author, level, quantity_total } = req.body

      if (!title || !author || !level) {
        return apiError(res, 'Missing required fields', 400)
      }

      const { data, error } = await supabase
        .from('books')
        .insert([
          {
            isbn,
            title,
            author,
            level,
            quantity_total: quantity_total || 1,
            quantity_available: quantity_total || 1,
          },
        ])
        .select()

      if (error) {
        return apiError(res, error.message, 500)
      }

      return apiResponse(res, true, data?.[0], undefined, 201)
    } catch (error: any) {
      return apiError(res, error.message, 500)
    }
  }

  return apiError(res, 'Method not allowed', 405)
}
```

### 2.2 GET, PUT, DELETE Single Book

Create `src/pages/api/books/[id].ts`:

```typescript
import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/utils/supabase'
import { apiResponse, apiError } from '@/utils/api-helpers'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query

  if (!id) {
    return apiError(res, 'Book ID is required', 400)
  }

  // GET: Fetch single book
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        return apiError(res, error.message, 404)
      }

      return apiResponse(res, true, data)
    } catch (error: any) {
      return apiError(res, error.message, 500)
    }
  }

  // PUT: Update book
  if (req.method === 'PUT') {
    try {
      const { title, author, level, quantity_total, quantity_available, condition } = req.body

      const { data, error } = await supabase
        .from('books')
        .update({
          title,
          author,
          level,
          quantity_total,
          quantity_available,
          condition,
          updated_at: new Date(),
        })
        .eq('id', id)
        .select()

      if (error) {
        return apiError(res, error.message, 500)
      }

      return apiResponse(res, true, data?.[0])
    } catch (error: any) {
      return apiError(res, error.message, 500)
    }
  }

  // DELETE: Delete book
  if (req.method === 'DELETE') {
    try {
      const { error } = await supabase
        .from('books')
        .delete()
        .eq('id', id)

      if (error) {
        return apiError(res, error.message, 500)
      }

      return apiResponse(res, true, { id })
    } catch (error: any) {
      return apiError(res, error.message, 500)
    }
  }

  return apiError(res, 'Method not allowed', 405)
}
```

---

## Step 3: Create Students API Routes

### 3.1 GET & POST Students

Create `src/pages/api/students/index.ts`:

```typescript
import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/utils/supabase'
import { apiResponse, apiError } from '@/utils/api-helpers'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // GET: Fetch all students
  if (req.method === 'GET') {
    try {
      const { level, student_type, search, limit = 50, offset = 0 } = req.query

      let query = supabase
        .from('students')
        .select('*')
        .order('created_at', { ascending: false })
        .range(Number(offset), Number(offset) + Number(limit) - 1)

      if (level && level !== 'all') {
        query = query.eq('level', level)
      }

      if (student_type && student_type !== 'all') {
        query = query.eq('student_type', student_type)
      }

      if (search) {
        query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`)
      }

      const { data, error, count } = await query

      if (error) {
        return apiError(res, error.message, 500)
      }

      return apiResponse(res, true, { students: data, total: count })
    } catch (error: any) {
      return apiError(res, error.message, 500)
    }
  }

  // POST: Create new student
  if (req.method === 'POST') {
    try {
      const { name, email, phone, level, student_type } = req.body

      if (!name || !email || !level || !student_type) {
        return apiError(res, 'Missing required fields', 400)
      }

      const { data, error } = await supabase
        .from('students')
        .insert([
          {
            name,
            email,
            phone,
            level,
            student_type,
          },
        ])
        .select()

      if (error) {
        return apiError(res, error.message, 500)
      }

      return apiResponse(res, true, data?.[0], undefined, 201)
    } catch (error: any) {
      return apiError(res, error.message, 500)
    }
  }

  return apiError(res, 'Method not allowed', 405)
}
```

### 3.2 GET & PUT Single Student

Create `src/pages/api/students/[id].ts`:

```typescript
import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/utils/supabase'
import { apiResponse, apiError } from '@/utils/api-helpers'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query

  if (!id) {
    return apiError(res, 'Student ID is required', 400)
  }

  // GET: Fetch single student with borrowing history
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('students')
        .select(
          `
          *,
          lending_records:lending_records(
            id,
            book_id,
            issued_date,
            due_date,
            return_date,
            status,
            books(title, author, level)
          )
        `
        )
        .eq('id', id)
        .single()

      if (error) {
        return apiError(res, error.message, 404)
      }

      return apiResponse(res, true, data)
    } catch (error: any) {
      return apiError(res, error.message, 500)
    }
  }

  // PUT: Update student
  if (req.method === 'PUT') {
    try {
      const { name, email, phone, level } = req.body

      const { data, error } = await supabase
        .from('students')
        .update({
          name,
          email,
          phone,
          level,
          updated_at: new Date(),
        })
        .eq('id', id)
        .select()

      if (error) {
        return apiError(res, error.message, 500)
      }

      return apiResponse(res, true, data?.[0])
    } catch (error: any) {
      return apiError(res, error.message, 500)
    }
  }

  return apiError(res, 'Method not allowed', 405)
}
```

---

## Step 4: Create Lending API Routes

### 4.1 GET & POST Lending Records

Create `src/pages/api/lending/index.ts`:

```typescript
import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/utils/supabase'
import { apiResponse, apiError } from '@/utils/api-helpers'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // GET: Fetch all lending records
  if (req.method === 'GET') {
    try {
      const { status, limit = 50, offset = 0 } = req.query

      let query = supabase
        .from('lending_records')
        .select(
          `
          *,
          books(id, title, author, level),
          students(id, name, email),
          users:sales_staff_id(id, full_name)
        `
        )
        .order('issued_date', { ascending: false })
        .range(Number(offset), Number(offset) + Number(limit) - 1)

      if (status && status !== 'all') {
        query = query.eq('status', status)
      }

      const { data, error, count } = await query

      if (error) {
        return apiError(res, error.message, 500)
      }

      return apiResponse(res, true, { records: data, total: count })
    } catch (error: any) {
      return apiError(res, error.message, 500)
    }
  }

  // POST: Create new lending record
  if (req.method === 'POST') {
    try {
      const { book_id, student_id, sales_staff_id, due_date } = req.body

      if (!book_id || !student_id || !sales_staff_id || !due_date) {
        return apiError(res, 'Missing required fields', 400)
      }

      // Start transaction: create lending & update book quantity
      const { data: lending, error: lendingError } = await supabase
        .from('lending_records')
        .insert([
          {
            book_id,
            student_id,
            sales_staff_id,
            issued_date: new Date().toISOString().split('T')[0],
            due_date,
            status: 'borrowed',
          },
        ])
        .select()

      if (lendingError) {
        return apiError(res, lendingError.message, 500)
      }

      // Decrement book availability
      const { data: book, error: bookError } = await supabase
        .from('books')
        .select('quantity_available')
        .eq('id', book_id)
        .single()

      if (!bookError && book) {
        await supabase
          .from('books')
          .update({
            quantity_available: Math.max(0, book.quantity_available - 1),
          })
          .eq('id', book_id)
      }

      return apiResponse(res, true, lending?.[0], undefined, 201)
    } catch (error: any) {
      return apiError(res, error.message, 500)
    }
  }

  return apiError(res, 'Method not allowed', 405)
}
```

### 4.2 PUT Lending Record Status

Create `src/pages/api/lending/[id].ts`:

```typescript
import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/utils/supabase'
import { apiResponse, apiError } from '@/utils/api-helpers'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query

  if (!id) {
    return apiError(res, 'Lending record ID is required', 400)
  }

  // PUT: Update lending record status (return/lost/damaged)
  if (req.method === 'PUT') {
    try {
      const { status, return_date } = req.body

      if (!status || !['returned', 'lost', 'damaged', 'overdue'].includes(status)) {
        return apiError(res, 'Invalid status', 400)
      }

      // Get current lending record
      const { data: currentRecord, error: fetchError } = await supabase
        .from('lending_records')
        .select('*')
        .eq('id', id)
        .single()

      if (fetchError) {
        return apiError(res, fetchError.message, 404)
      }

      // Update lending record
      const { data, error } = await supabase
        .from('lending_records')
        .update({
          status,
          return_date: return_date || new Date().toISOString().split('T')[0],
          updated_at: new Date(),
        })
        .eq('id', id)
        .select()

      if (error) {
        return apiError(res, error.message, 500)
      }

      // If returning, increment book availability
      if (status === 'returned' && currentRecord.status === 'borrowed') {
        const { data: book } = await supabase
          .from('books')
          .select('quantity_available')
          .eq('id', currentRecord.book_id)
          .single()

        if (book) {
          await supabase
            .from('books')
            .update({
              quantity_available: book.quantity_available + 1,
            })
            .eq('id', currentRecord.book_id)
        }
      }

      return apiResponse(res, true, data?.[0])
    } catch (error: any) {
      return apiError(res, error.message, 500)
    }
  }

  return apiError(res, 'Method not allowed', 405)
}
```

---

## Step 5: Create Dashboard Stats Route

Create `src/pages/api/dashboard/stats.ts`:

```typescript
import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/utils/supabase'
import { apiResponse, apiError } from '@/utils/api-helpers'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return apiError(res, 'Method not allowed', 405)
  }

  try {
    // Get total books and available
    const { count: totalBooks } = await supabase
      .from('books')
      .select('*', { count: 'exact', head: true })

    const { data: availableBooks } = await supabase
      .from('books')
      .select('quantity_available')

    const totalAvailable = availableBooks?.reduce(
      (sum, b) => sum + (b.quantity_available || 0),
      0
    ) || 0

    // Get borrowed books count
    const { count: borrowedCount } = await supabase
      .from('lending_records')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'borrowed')

    // Get overdue books count
    const { count: overdueCount } = await supabase
      .from('lending_records')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'overdue')
      .lt('due_date', new Date().toISOString().split('T')[0])

    // Get total students
    const { count: totalStudents } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true })

    // Recent lending records
    const { data: recentRecords } = await supabase
      .from('lending_records')
      .select(
        `
        *,
        books(title),
        students(name)
      `
      )
      .order('issued_date', { ascending: false })
      .limit(5)

    return apiResponse(res, true, {
      stats: {
        totalBooks: totalBooks || 0,
        availableBooks: totalAvailable,
        borrowedBooks: borrowedCount || 0,
        overdueBooks: overdueCount || 0,
        totalStudents: totalStudents || 0,
      },
      recentRecords,
    })
  } catch (error: any) {
    return apiError(res, error.message, 500)
  }
}
```

---

## ✅ Phase 4 Checklist

- [ ] Created API helpers (`src/utils/api-helpers.ts`)
- [ ] Created Books routes (GET/POST/PUT/DELETE)
- [ ] Created Students routes (GET/POST/PUT)
- [ ] Created Lending routes (GET/POST/PUT)
- [ ] Created Dashboard stats route
- [ ] All routes connect to Supabase
- [ ] Proper error handling implemented

---

## 🧪 Testing Phase 4

### Test Books API

```bash
# Create book
curl -X POST http://localhost:3000/api/books \
  -H "Content-Type: application/json" \
  -d '{
    "isbn": "978-1234567890",
    "title": "Test Book",
    "author": "Test Author",
    "level": "beginner",
    "quantity_total": 5
  }'

# Get all books
curl http://localhost:3000/api/books

# Get with filter
curl http://localhost:3000/api/books?level=beginner
```

### Test Students API

```bash
# Create student
curl -X POST http://localhost:3000/api/students \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "level": "intermediate",
    "student_type": "new"
  }'

# Get all students
curl http://localhost:3000/api/students
```

### Test Dashboard Stats

```bash
curl http://localhost:3000/api/dashboard/stats
```

---

## Next Steps

After Phase 4:
1. ✅ API routes fully functional
2. Move to **Phase 5: Dashboard UI**
3. Create dashboard pages that call these API routes
4. Display data from APIs in UI

Ready for Phase 4 implementation?

