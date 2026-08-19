# 🚀 Contribution Tracker

A modern web application built with **Next.js 15 (App Router)**, **Auth.js (v5)**, and **PostgreSQL** for tracking team project contributions, work logs, project management, and automated GitHub contribution insights.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Authentication**: [Auth.js v5 (NextAuth)](https://authjs.dev/) with GitHub OAuth provider
- **Database**: [PostgreSQL](https://www.postgresql.org/) (Neon / Supabase / Local PostgreSQL) via `pg`
- **Styling**: Tailwind CSS v4 & Lucide Icons
- **Language**: JavaScript / Node.js 18+

---

## 📋 Prerequisites

Before you start, make sure you have:
1. **Node.js**: v18.18 or higher (v20+ recommended)
2. **Git**: Installed and configured
3. **PostgreSQL Database**: A hosted PostgreSQL instance (e.g. [Neon](https://neon.tech), [Supabase](https://supabase.com)) or a local PostgreSQL server.
4. **GitHub Account**: To create an OAuth Application.

---

## ⚡ Quickstart Guide

### 1. Clone the repository
```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd contribution-tracker
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to create your local `.env.local` file:
```bash
# On Windows (PowerShell)
Copy-Item .env.example .env.local

# On macOS / Linux
cp .env.example .env.local
```

Open `.env.local` and fill in the required credentials:
```env
# PostgreSQL Database URL
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require

# Auth.js secret (Generate with `npx auth secret` or any 32+ random characters)
AUTH_SECRET=your_auth_secret_here
NEXTAUTH_URL=http://localhost:3000

# GitHub OAuth App Credentials
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
```

---

## 🔑 GitHub OAuth Setup

To enable GitHub login for team members:
1. Go to **[GitHub Developer Settings > OAuth Apps](https://github.com/settings/developers)**.
2. Click **"New OAuth App"**.
3. Fill in the details:
   - **Application name**: `Contribution Tracker (Dev)`
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`
4. Click **"Register application"**.
5. Copy the **Client ID** into `GITHUB_CLIENT_ID` in `.env.local`.
6. Click **"Generate a new client secret"** and copy it into `GITHUB_CLIENT_SECRET` in `.env.local`.

---

## 🗄️ Database Setup

Initialize the database schema using [schema.sql](file:///c:/Users/shive/OneDrive/Desktop/contributionTracker/contribution-tracker/schema.sql):

1. Open your database dashboard (e.g., Neon SQL Editor, Supabase SQL Editor, or `psql`).
2. Run the queries inside `schema.sql` to create the tables:
   - `projects`: Stores project spaces and invite codes
   - `users`: Stores user profiles, roles (`leader` / `member`), and linked projects
   - `contributions`: Stores tracked contribution logs, categories, time estimates, and status

---

## 💻 Running the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

---

## 📂 Project Structure

```
├── app/
│   ├── (app)/                 # Authenticated application pages
│   │   ├── dashboard/         # User contribution dashboard
│   │   ├── team/              # Team overview and leaderboard
│   │   └── project-setup/     # Create or join a project
│   ├── (marketing)/           # Public landing and authentication pages
│   │   ├── login/             # GitHub sign-in page
│   │   └── page.js            # Landing page
│   ├── api/                   # REST API routes
│   │   ├── auth/              # Auth.js route handler
│   │   ├── contributions/     # Contributions CRUD & stats
│   │   ├── projects/          # Project creation & join by invite
│   │   └── team/              # Team member listings & metrics
│   ├── globals.css            # Global CSS and Tailwind directives
│   └── layout.js              # Root HTML & font layout
├── components/                # Reusable UI components
├── lib/
│   ├── db.js                  # PostgreSQL client pool & query helpers
│   └── auth.js                # Auth helper utilities
├── auth.config.js             # Edge-compatible Auth.js configuration
├── auth.js                    # Auth.js initialization with GitHub provider
├── middleware.js              # Route protection middleware
├── schema.sql                 # PostgreSQL DDL schema definition
├── .env.example               # Template for environment variables
└── README.md                  # Project documentation
```

---

## 🌿 Git Workflow & Best Practices

1. **Pull latest changes before starting work**:
   ```bash
   git checkout main
   git pull origin main
   ```
2. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Commit with descriptive messages**:
   ```bash
   git commit -m "feat: add project filtering to team dashboard"
   ```
4. **Push and open a Pull Request (PR)**:
   ```bash
   git push origin feature/your-feature-name
   ```
