# Book Management System - English Learning Center

A comprehensive platform for managing book inventory, lending/borrowing, and student enrollment at an English learning center.

## Overview

This system consists of two main interfaces:

1. **Admin Dashboard** - For center managers to track and manage book inventory, lending history, and student records
2. **Enrollment Form** - For sales staff to quickly capture student information and assign books

## Features (Planned)

### Dashboard (Manager)
- [ ] Book inventory management (add, update, delete, search)
- [ ] Lending/borrowing transaction tracking
- [ ] Due date management and overdue alerts
- [ ] Student profile management
- [ ] Inventory reports and analytics
- [ ] Dashboard overview (books available, on loan, overdue)
- [ ] User management and access control

### Enrollment Form (Sales)
- [ ] Student information capture form
- [ ] Real-time book availability checking
- [ ] Book assignment/allocation
- [ ] Submission integration with dashboard
- [ ] Mobile-friendly design
- [ ] Print receipt generation

### Backend Features
- [ ] Secure authentication and authorization
- [ ] Book catalog management
- [ ] Student database
- [ ] Lending transaction logging
- [ ] Inventory tracking
- [ ] Audit logs

## Tech Stack

- **Frontend**: Next.js + React + TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Next.js API Routes / Node.js Express
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT / NextAuth.js
- **State Management**: React Query / Redux (TBD)
- **Testing**: Jest + React Testing Library
- **Deployment**: Vercel / AWS / Self-hosted

## Project Structure

```
managing-books-gifts/
├── frontend/              # Next.js frontend application
│   ├── src/
│   │   ├── components/   # Reusable React components
│   │   ├── pages/        # Next.js pages
│   │   ├── styles/       # Global styles
│   │   └── utils/        # Helper functions
│   ├── public/           # Static assets
│   └── package.json
├── backend/              # Backend API (if separate) - TBD
├── database/             # Database schemas and migrations
├── docs/                 # Project documentation
├── README.md            # This file
└── .gitignore
```

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- PostgreSQL (for database)

### Installation

```bash
# Clone repository
git clone <repo-url>
cd managing-books-gifts

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local

# Setup database
npm run db:migrate

# Start development server
npm run dev
```

## User Roles

1. **Manager** - Full access to dashboard, inventory management, reports
2. **Sales Staff** - Access to enrollment form and student submission form
3. **Admin** - System administration, user management, settings

## API Endpoints (Planned)

### Books
- `GET /api/books` - List all books
- `POST /api/books` - Create new book
- `GET /api/books/:id` - Get book details
- `PUT /api/books/:id` - Update book
- `DELETE /api/books/:id` - Delete book

### Students
- `GET /api/students` - List students
- `POST /api/students` - Create new student
- `GET /api/students/:id` - Get student details

### Lending
- `POST /api/lending` - Record book lending
- `PUT /api/lending/:id` - Return book
- `GET /api/lending` - View lending history

### Dashboard
- `GET /api/dashboard` - Dashboard statistics

## Next Steps

1. Define detailed user flows and requirements
2. Design database schema
3. Setup project structure and boilerplate
4. Implement authentication system
5. Build dashboard UI
6. Build enrollment form
7. Connect frontend to backend
8. Testing and deployment

## Contributors

- Peter (Developer)
- Wife (Project Manager / Primary User)

## License

Private / Internal Use Only
