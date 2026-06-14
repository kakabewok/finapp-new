# SiBoros 💸

> **SiBoros — Track your spending, take control of your finances.**

![Next.js](https://img.shields.io/badge/Next.js-16.2-black?logo=next.js)
![React](https://img.shields.io/badge/React-19.2-blue?logo=react)
![Supabase](https://img.shields.io/badge/Supabase-Database-3ecf8e?logo=supabase)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?logo=tailwind-css)
![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue?logo=typescript)
![PWA](https://img.shields.io/badge/PWA-Supported-purple?logo=pwa)

SiBoros is a modern, comprehensive personal finance tracking web application. Built to help individuals manage their budgets, understand their spending habits, and plan their financial future, SiBoros offers an intuitive interface and powerful features wrapped in a robust, mobile-ready Progressive Web App (PWA).

The primary problem SiBoros solves is financial blind spots: it makes tracking both manual and receipt-based expenses frictionless, helping users stay within budget limits through visual feedback, AI insights, and organized tracking.

## 🚀 Features

- **Transaction Tracking:** Log incomes, expenses, and transfers effortlessly with intelligent IDR (Rupiah) input formatting.
- **AI Receipt Scanning:** Powered by Google Gemini and Cloudinary, automatically extract data from receipt images to create transactions in seconds.
- **Budget Planner:** Set monthly budgets per category with rollover support.
- **Copy Last Month:** Quickly bootstrap your monthly budget by copying over the previous month's structure.
- **Dynamic Category Management:** Create custom categories on-the-fly with smart auto-suggested icons and colors (over 30+ custom icons available).
- **Bulk Delete Operations:** Quickly clean up transactions and budgets using bulk selection mode and `.in()` optimized database deletions.
- **Developer Monitoring Dashboard:** A hidden, secure developer panel that only the specified developer account can access.
- **PWA Ready:** Install SiBoros directly on your mobile device for a native app-like experience.
- **Data Insights:** Visualize spending patterns, savings rates, and category breakdowns with interactive charts.

## 🛠 Tech Stack

| Domain | Technology |
|---|---|
| **Frontend** | [Next.js (App Router)](https://nextjs.org/), React 19, TypeScript |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/), Radix UI, shadcn/ui |
| **Backend / Auth** | [Supabase](https://supabase.com/) (PostgreSQL & Auth) |
| **Storage / OCR** | [Cloudinary](https://cloudinary.com/) (Images), Google Gemini (AI Scanning) |
| **Forms & Validation**| React Hook Form, Zod |
| **Deployment** | Designed for [Vercel](https://vercel.com/) |

## 📁 Project Structure

```text
finapp/
├── app/                  # Next.js App Router (Pages, Layouts, API Routes)
│   ├── (dashboard)/      # Protected dashboard views
│   └── api/              # Backend endpoints (Supabase SSR interactions)
├── components/           # Reusable UI components
│   ├── budget/           # Budget planning components
│   ├── layout/           # App shell (Sidebar, Header, MobileNav)
│   ├── transactions/     # Transaction forms and lists
│   └── ui/               # Generic UI components (Buttons, Inputs, etc.)
├── hooks/                # Custom React hooks (e.g. useIsDeveloper, useSelection)
├── lib/                  # Utilities (Formatters, Supabase clients, Icons)
├── types/                # TypeScript interfaces representing the DB schema
└── public/               # Static assets and PWA manifest
```

## 🚦 Getting Started

### Prerequisites
- **Node.js**: v18+ or v20+ recommended.
- **Package Manager**: npm (or pnpm/yarn).

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/siboros.git
   cd siboros/finapp
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Setup:**
   Duplicate the `.env.example` file and rename it to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
   Fill in your actual Supabase, Cloudinary, and Gemini keys.

4. **Run the Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🗄 Database Schema (Supabase)

The core relational structure centers around these main tables:

- **`users`**: Managed natively by Supabase Auth.
- **`categories`**: Defines expense/income categories (stores `icon`, `color`, and `type`). Linked to a specific `user_id`.
- **`transactions`**: The central ledger for incomes, expenses, and transfers. Contains foreign keys to `categories`.
- **`budgets`**: Monthly limits set per `category_id`, supporting `rollover_amount` functionality.

> Note: Row Level Security (RLS) policies ensure users can only access their own data.

## 📜 Scripts

Available `npm` scripts in `package.json`:

- `npm run dev`: Starts the Next.js development server with Turbopack.
- `npm run build`: Creates an optimized production build and static pages.
- `npm run start`: Starts a Node.js server using the production build.
- `npm run lint`: Runs ESLint to check for code quality and style issues.

## ☁️ Deployment

SiBoros is optimized for deployment on **Vercel**. 
1. Push your repository to GitHub.
2. Import the project in Vercel.
3. Add the environment variables found in your `.env.local` to the Vercel project settings.
4. Deploy!

## 🤝 Contributing

Contributions are welcome! Please ensure you:
1. Follow the existing ESLint and TypeScript rules.
2. When creating new UI components, use the established `shadcn/ui` patterns and Tailwind CSS.
3. Test mobile responsiveness for any UI changes.

## 📄 License

This project is licensed under the MIT License.
