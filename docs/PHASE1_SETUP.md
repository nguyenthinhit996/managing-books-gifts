# Phase 1: Setup & Infrastructure - Detailed Guide

## Step 1: Create Supabase Project

### 1.1 Create New Project in Supabase
1. Go to [supabase.com](https://supabase.com)
2. You should be logged in already
3. Click **"New Project"** button
4. Fill in the form:
   - **Project Name**: `books-management`
   - **Database Password**: Create a strong password (save it!)
   - **Region**: `Asia-Southeast1 (Singapore)`
5. Click **"Create new project"** and wait (2-3 mins)

### 1.2 Get Your Credentials
Once created, you'll see the dashboard. Find and copy these credentials:

1. Click **Settings** (bottom left) → **API**
2. Copy these values:
   - **Project URL** (e.g., `https://xxxxxxxxxxxx.supabase.co`)
   - **Anon Key** (public key for client-side)
   - **Service Role Key** (keep secret, for server-side only)

Save to a secure place (password manager or text file).

---

## Step 2: Set Up Next.js Locally

### 2.1 Navigate to Project and Install Dependencies

Open terminal in your project folder:

```bash
# Go to the project directory
cd /Users/peter/Desktop/Project/managing-books-gifts

# Go to frontend folder
cd frontend

# Install dependencies
npm install
```

### 2.2 Create Next.js Configuration

Create `frontend/next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
}

module.exports = nextConfig
```

### 2.3 Setup Tailwind CSS & PostCSS

Create `frontend/tailwind.config.js`:

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

Create `frontend/postcss.config.js`:

```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

### 2.4 Create Global Styles

Create `frontend/src/styles/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

### 2.5 Create TypeScript Configuration

Create `frontend/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "esnext"],
    "jsx": "preserve",
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "allowJs": true,
    "checkJs": false,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "incremental": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
```

---

## Step 3: Connect Supabase to Next.js

### 3.1 Install Supabase Client Library

```bash
# In the frontend folder
npm install @supabase/supabase-js
npm install @supabase/auth-helpers-nextjs
npm install react-query axios date-fns
```

### 3.2 Create Environment Variables

Create `frontend/.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY

# API
NEXT_PUBLIC_API_URL=http://localhost:3000
```

**⚠️ Important**: Replace `YOUR_PROJECT_ID` and `YOUR_ANON_KEY` with your actual Supabase credentials from Step 1.2

### 3.3 Create Supabase Client

Create `frontend/src/utils/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default supabase
```

### 3.4 Create Auth Utilities

Create `frontend/src/utils/auth.ts`:

```typescript
import { supabase } from './supabase'

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })
  return { data, error }
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  return { data, error }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export async function getCurrentUser() {
  const { data } = await supabase.auth.getSession()
  return data?.session?.user
}
```

---

## Step 4: Create Initial Pages

### 4.1 Create Home Page

Create `frontend/src/pages/index.tsx`:

```typescript
import type { NextPage } from 'next'

const Home: NextPage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-500 to-purple-600">
      <div className="text-center text-white">
        <h1 className="text-5xl font-bold mb-4">Book Management System</h1>
        <p className="text-xl mb-8">English Learning Center</p>
        <div className="space-x-4">
          <a
            href="/login"
            className="bg-white text-blue-600 px-6 py-3 rounded-lg font-bold hover:bg-gray-100 transition"
          >
            Login
          </a>
          <a
            href="/enrollment"
            className="bg-transparent border-2 border-white text-white px-6 py-3 rounded-lg font-bold hover:bg-white hover:text-blue-600 transition"
          >
            Student Enrollment
          </a>
        </div>
      </div>
    </div>
  )
}

export default Home
```

### 4.2 Create _app.tsx

Create `frontend/src/pages/_app.tsx`:

```typescript
import '@/styles/globals.css'
import type { AppProps } from 'next/app'

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />
}
```

### 4.3 Create _document.tsx

Create `frontend/src/pages/_document.tsx`:

```typescript
import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head />
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
```

---

## Step 5: Test Connection

### 5.1 Start Development Server

```bash
# In frontend folder
npm run dev
```

You should see:
```
> ready - started server on 0.0.0.0:3000, url: http://localhost:3000
```

### 5.2 Open in Browser

Go to `http://localhost:3000` and you should see the home page with blue gradient background.

✅ If you see it - **Supabase is connected!**

---

## Step 6: GitHub Setup & Push Code

### 6.1 Create GitHub Repository

1. Go to [github.com](https://github.com)
2. Click **New repository**
3. Name it: `managing-books-gifts`
4. Description: `Book Management System for English Learning Center`
5. Choose **Private** (if you want)
6. Click **Create repository**

### 6.2 Push Code to GitHub

```bash
# In the project root (/Users/peter/Desktop/Project/managing-books-gifts)

# Configure git (if not done)
git config user.name "Your Name"
git config user.email "your.email@gmail.com"

# Add all files
git add .

# Commit
git commit -m "Initial project setup: Next.js, Supabase, Tailwind"

# Add remote (replace USERNAME with your GitHub username)
git remote add origin https://github.com/USERNAME/managing-books-gifts.git

# Push to main branch
git branch -M main
git push -u origin main
```

---

## Step 7: Set Up Vercel (Preparation)

### 7.1 Sign Up at Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **Sign Up**
3. Choose **Continue with GitHub**
4. Authorize Vercel to access your GitHub

### 7.2 Connect Repository (Don't Deploy Yet)

1. In Vercel dashboard, click **Add New** → **Project**
2. Select the `managing-books-gifts` repository
3. Click **Import**
4. On the configuration page:
   - **Framework**: Next.js (auto-detected)
   - **Root Directory**: `./frontend`
   - Don't click Deploy yet! (we'll do that after database setup)
5. Click **Save and Continue**

---

## ✅ Phase 1 Checklist

- [ ] **Supabase Project Created** (Singapore region)
- [ ] **Credentials Saved** (Project URL, Anon Key, Service Role Key)
- [ ] **Dependencies Installed** (`npm install` in frontend)
- [ ] **Configuration Files Created** (tsconfig.json, tailwind, postcss)
- [ ] **Supabase Client Setup** (src/utils/supabase.ts)
- [ ] **Environment Variables Configured** (.env.local)
- [ ] **Initial Pages Created** (index, _app, _document)
- [ ] **Dev Server Running** (`npm run dev` working at localhost:3000)
- [ ] **GitHub Repository Created** and code pushed
- [ ] **Vercel Project Connected** (ready for deployment)

---

## 💾 Credentials to Save

Create a file somewhere safe (password manager, encrypted note, etc.):

```
Project: books-management

Supabase:
- Project URL: [PASTE YOUR URL]
- Anon Key: [PASTE YOUR KEY]
- Service Role Key: [PASTE YOUR KEY]
- Database Password: [PASTE YOUR PASSWORD]

GitHub:
- Repository: https://github.com/[USERNAME]/managing-books-gifts

Vercel:
- Project URL: (will get after deployment)
```

---

## Next Steps

Once Phase 1 is complete:
1. ✅ Move to **Phase 2: Database Design**
2. Create SQL tables in Supabase
3. Add sample data for testing

Ready to proceed?

