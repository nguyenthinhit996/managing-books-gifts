# Project Development Plan - Book Management System

**Project**: Managing Books & Gifts (English Learning Center)  
**Date Created**: February 8, 2026  
**Status**: Planning Phase

---

## 📋 Phase 1: Setup & Infrastructure (Week 1)

### 1.1 Create Supabase Project
- [ ] Go to supabase.com and sign up
- [ ] Create new project (Region: closest to your location)
- [ ] Get Project URL and API Keys
- [ ] Save credentials in secure location
- **Deliverable**: Supabase project active with credentials

### 1.2 Create GitHub Repository
- [ ] Initialize git (already done)
- [ ] Create GitHub repo
- [ ] Push initial code to GitHub
- **Deliverable**: GitHub repo with clean initial commit

### 1.3 Create Vercel Account & Connect
- [ ] Sign up at vercel.com
- [ ] Connect GitHub account
- [ ] Import the managing-books-gifts repository
- [ ] Don't deploy yet (we'll do after setup)
- **Deliverable**: Vercel project created, ready for deployment

---

## 🗄️ Phase 2: Database Design (Week 1)

### 2.1 Design Database Schema
Create these tables in Supabase:

#### Table: `users`
```sql
- id (UUID, primary key)
- email (VARCHAR, unique)
- password_hash (VARCHAR)
- full_name (VARCHAR)
- role (ENUM: 'manager', 'sales', 'admin')
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### Table: `books`
```sql
- id (UUID, primary key)
- isbn (VARCHAR, unique, nullable)
- title (VARCHAR)
- author (VARCHAR)
- level (ENUM: 'beginner', 'elementary', 'pre-intermediate', 'intermediate', 'upper-intermediate', 'advanced')
- quantity_total (INTEGER)
- quantity_available (INTEGER)
- condition (ENUM: 'excellent', 'good', 'fair', 'poor')
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### Table: `students`
```sql
- id (UUID, primary key)
- name (VARCHAR)
- email (VARCHAR)
- phone (VARCHAR, nullable)
- level (ENUM: same as books)
- student_type (ENUM: 'new', 'trial', 'returning')
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### Table: `lending_records`
```sql
- id (UUID, primary key)
- book_id (UUID, foreign key -> books)
- student_id (UUID, foreign key -> students)
- sales_staff_id (UUID, foreign key -> users)
- issued_date (DATE)
- due_date (DATE)
- return_date (DATE, nullable)
- status (ENUM: 'borrowed', 'returned', 'overdue', 'lost', 'damaged')
- notes (TEXT, nullable)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### 2.2 Create Tables in Supabase
- [ ] Go to Supabase SQL Editor
- [ ] Execute SQL scripts to create tables
- [ ] Set up relationships and indexes
- [ ] Enable Row Level Security (RLS) for security
- **Deliverable**: All tables created and tested in Supabase

### 2.3 Insert Sample Data
- [ ] Add 5-10 sample books
- [ ] Add test users (manager, sales, admin)
- [ ] Add 5 sample students
- **Deliverable**: Sample data ready for development testing

---

## 🎨 Phase 3: Frontend Setup (Week 2)

### 3.1 Initialize Next.js Project
- [ ] Navigate to frontend folder
- [ ] Run `npm install` (dependencies from package.json)
- [ ] Install additional packages:
  ```bash
  npm install @supabase/supabase-js
  npm install @supabase/auth-helpers-nextjs
  npm install react-query axios
  npm install date-fns
  ```
- **Deliverable**: Frontend ready with all dependencies

### 3.2 Setup Supabase Client
- [ ] Create `src/utils/supabase.ts` - Supabase client initialization
- [ ] Create `src/utils/auth.ts` - Authentication helpers
- [ ] Add Supabase environment variables to `.env.local`
- [ ] Test connection with simple query
- **Deliverable**: Supabase client working and tested

### 3.3 Create Layout & Navigation Components
- [ ] Create `src/components/Layout.tsx` - Main layout wrapper
- [ ] Create `src/components/Navbar.tsx` - Navigation bar
- [ ] Create `src/components/Sidebar.tsx` - Dashboard sidebar
- [ ] Add global styles in `src/styles/globals.css`
- **Deliverable**: Basic layout structure ready

### 3.4 Create Authentication Pages
- [ ] Create `src/pages/login.tsx` - Login page
- [ ] Create `src/pages/signup.tsx` - Registration page (admin only)
- [ ] Create authentication context for state management
- [ ] Create protected route wrapper
- **Deliverable**: Auth flow ready (login/logout working)

---

## 🔧 Phase 4: Backend API Setup (Week 2-3)

### 4.1 Create API Route Structure
- [ ] Create `src/pages/api/` folder structure:
  ```
  api/
  ├── auth/
  │   ├── login.ts
  │   ├── logout.ts
  │   └── register.ts
  ├── books/
  │   ├── index.ts (GET - list, POST - create)
  │   └── [id].ts (GET, PUT, DELETE)
  ├── students/
  │   ├── index.ts (GET, POST)
  │   └── [id].ts (GET, PUT, DELETE)
  └── lending/
      ├── index.ts (GET, POST)
      └── [id].ts (PUT - update status)
  ```
- **Deliverable**: Folder structure created

### 4.2 Create API Endpoints (Books)
- [ ] `GET /api/books` - List all books with filters
- [ ] `POST /api/books` - Add new book (manager only)
- [ ] `GET /api/books/[id]` - Get book details
- [ ] `PUT /api/books/[id]` - Update book (manager only)
- [ ] `DELETE /api/books/[id]` - Delete book (admin only)
- **Deliverable**: Books API fully functional

### 4.3 Create API Endpoints (Students)
- [ ] `GET /api/students` - List all students
- [ ] `POST /api/students` - Create new student (from form)
- [ ] `GET /api/students/[id]` - Get student details
- [ ] `PUT /api/students/[id]` - Update student
- **Deliverable**: Students API fully functional

### 4.4 Create API Endpoints (Lending)
- [ ] `GET /api/lending` - List all lending records with filters
- [ ] `POST /api/lending` - Create lending record
- [ ] `PUT /api/lending/[id]` - Update lending status (return/damage/lost)
- [ ] Create overdue calculation logic
- **Deliverable**: Lending API fully functional

### 4.5 Create API Endpoints (Dashboard Stats)
- [ ] `GET /api/dashboard/stats` - Get overview data
- [ ] Calculate: books available, borrowed, overdue
- **Deliverable**: Dashboard stats API ready

---

## 💻 Phase 5: Dashboard UI (Week 3-4)

### 5.1 Dashboard Overview Page
- [ ] Create `src/pages/dashboard/index.tsx`
- [ ] Component: Stats cards (available, borrowed, overdue books)
- [ ] Component: Recent activity table
- [ ] Component: Quick filters
- **Deliverable**: Dashboard home working

### 5.2 Books Management Page
- [ ] Create `src/pages/dashboard/books.tsx`
- [ ] Display books table with pagination
- [ ] Add: Filter by level, search by title
- [ ] Add: Create book modal/form
- [ ] Add: Edit book modal
- [ ] Add: Delete book confirmation
- **Deliverable**: Full books management UI

### 5.3 Students Management Page
- [ ] Create `src/pages/dashboard/students.tsx`
- [ ] Display students table with pagination
- [ ] Add: Search/filter functionality
- [ ] Add: Student detail view
- [ ] Display: Borrowing history per student
- **Deliverable**: Full students management UI

### 5.4 Lending Management Page
- [ ] Create `src/pages/dashboard/lending.tsx`
- [ ] Display lending records table
- [ ] Add: Filter by status (borrowed, returned, overdue)
- [ ] Add: Return book functionality
- [ ] Add: Mark as lost/damaged functionality
- [ ] Add: Overdue indicator
- **Deliverable**: Full lending management UI

### 5.5 Reports Page (Optional Phase 1)
- [ ] Create `src/pages/dashboard/reports.tsx`
- [ ] Book usage statistics
- [ ] Most borrowed books
- [ ] Student borrowing patterns
- **Deliverable**: Reports page ready

---

## 📝 Phase 6: Enrollment Form (Week 4)

### 6.1 Create Student Enrollment Form Page
- [ ] Create `src/pages/enrollment/index.tsx`
- [ ] Mobile-responsive design
- [ ] Form fields:
  - Student name
  - Email
  - Phone
  - Student level (dropdown)
  - Student type (new/trial/returning)
  - Sales staff name (dropdown or textbox)
  - Book selection (dropdown/search)
  - Notes (optional)
- **Deliverable**: Form renders and submits

### 6.2 Form Validation & Submission
- [ ] Add client-side validation (react-hook-form)
- [ ] Submit to `/api/enrollment` endpoint
- [ ] Create API endpoint that:
  - Creates student record
  - Creates lending record
  - Decrements book availability
  - Returns confirmation
- [ ] Show success/error message
- **Deliverable**: Full form flow working

### 6.3 Enrollment Confirmation
- [ ] Create `src/pages/enrollment/confirmation.tsx`
- [ ] Display submitted data summary
- [ ] Show printable receipt
- [ ] Option to submit another
- **Deliverable**: Confirmation page ready

---

## 🔐 Phase 7: Security & Permissions (Week 4)

### 7.1 Role-Based Access Control
- [ ] Implement middleware to check user role
- [ ] Protect API routes by role
- [ ] Protect frontend pages by role
  - `/dashboard/*` - manager/admin only
  - `/enrollment/*` - sales/admin/manager (all access)
  - `/admin/*` - admin only
- **Deliverable**: Access control working

### 7.2 Row Level Security (RLS) in Supabase
- [ ] Enable RLS on all tables
- [ ] Create RLS policies:
  - Users can only see/modify their own data (students, lending)
  - Managers can see all data
  - Sales can only see lending records they created
- **Deliverable**: Database security policies in place

---

## 🚀 Phase 8: Testing & Optimization (Week 5)

### 8.1 Manual Testing
- [ ] Test all API endpoints (Postman/curl)
- [ ] Test full user flows:
  - Manager: login → view books → edit book → view lending
  - Sales: login → fill form → submit → see confirmation
- [ ] Test on mobile/tablet
- [ ] Test error handling (invalid data, network errors)
- **Deliverable**: All flows tested and working

### 8.2 Performance Optimization
- [ ] Optimize images and assets
- [ ] Add pagination to large tables
- [ ] Optimize database queries
- [ ] Test load times
- **Deliverable**: Application optimized

---

## 📦 Phase 9: Deployment (Week 5)

### 9.1 Prepare for Deployment
- [ ] Review all environment variables
- [ ] Create production `.env` in Vercel
- [ ] Final code review and cleanup
- **Deliverable**: Code ready for production

### 9.2 Deploy to Vercel
- [ ] Push all changes to GitHub
- [ ] Vercel auto-deploys from main branch
- [ ] Verify deployment successful
- [ ] Test live instance
- **Deliverable**: Application live on Vercel

### 9.3 Connect Custom Domain (Route53)
- [ ] Get Vercel DNS records
- [ ] Login to AWS Route53
- [ ] Create/update DNS records pointing to Vercel
- [ ] Wait for DNS propagation (5-30 mins)
- [ ] Verify domain works
- [ ] Enable HTTPS (automatic with Vercel)
- **Deliverable**: Custom domain working with HTTPS

---

## 📊 Summary Timeline

| Phase | Duration | Key Deliverables |
|-------|----------|------------------|
| Phase 1: Setup | 1 day | Supabase, GitHub, Vercel ready |
| Phase 2: Database | 1 day | Database schema created with sample data |
| Phase 3: Frontend | 3 days | Next.js setup, auth, layout components |
| Phase 4: API | 3-4 days | All backend API routes functioning |
| Phase 5: Dashboard UI | 5 days | All dashboard pages with full functionality |
| Phase 6: Enrollment Form | 3 days | Form with validation and submission |
| Phase 7: Security | 2 days | RBAC and RLS policies implemented |
| Phase 8: Testing | 2 days | Full testing, optimization, bug fixes |
| Phase 9: Deployment | 1 day | Live on Vercel with custom domain |
| **Total** | **~3-4 weeks** | **Fully functional production app** |

---

## ✅ Definition of Done

Each phase is complete when:
- [ ] All listed tasks are checked off
- [ ] Code is tested and working
- [ ] Changes are committed to GitHub
- [ ] No blocking issues remain

---

## 📝 Notes & Assumptions

1. **Free tier limits**: 
   - Supabase: 500MB storage, up to 50k queries/month (free tier)
   - Vercel: 100GB bandwidth/month
   - Should be sufficient for initial launch

2. **Scaling later**:
   - Easy to add more databases tables/features
   - Supabase pricing scales gradually
   - Vercel pro can be added if needed

3. **Team**:
   - Peter: Development
   - Wife: Testing and feedback

4. **First version focus**:
   - Core functionality (lending, students, books)
   - Simple, clean UI
   - Mobile-friendly enrollment form
   - Reports can come in v2

---

## 🔄 Progress Tracking

Track completion here:

- [ ] Phase 1 Complete
- [ ] Phase 2 Complete
- [ ] Phase 3 Complete
- [ ] Phase 4 Complete
- [ ] Phase 5 Complete
- [ ] Phase 6 Complete
- [ ] Phase 7 Complete
- [ ] Phase 8 Complete
- [ ] Phase 9 Complete
- [ ] 🎉 **PROJECT LAUNCH**

---

## Questions Before Starting?

Before we begin Phase 1, confirm:
1. Is the tech stack (Next.js, Supabase, Vercel) acceptable?
2. Do you want to start immediately with Phase 1?
3. Any adjustments to the timeline or feature list?
