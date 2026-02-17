# AARA — Weight Loss • Wellness
### The Intelligent Personal Mastery System

AARA is a high-performance, full-stack wellness application designed to simplify the journey toward weight loss and muscle gain. By synthesizing personalized nutrition, structured movement, and intelligent coaching into a unified iOS-style interface, AARA removes the friction of daily health management.

---

## 📖 Table of Contents
- [Project Overview](#-project-overview)
- [Tech Stack](#-tech-stack)
- [Folder Structure](#-folder-structure)
- [System Architecture](#-system-architecture)
- [Database Schema](#-database-schema)
- [Personalization Engine Logic](#-personalization-engine-logic)
- [API Endpoints](#-api-endpoints)
- [Local Development](#-local-development)
- [Premium Feature System](#-premium-feature-system)
- [Future Scope](#-future-scope)

---

## 🚀 Project Overview
*   **App Name**: AARA
*   **Tagline**: "Weight Loss • Wellness"
*   **Purpose**: To provide a deterministic, goal-oriented path to physical transformation through automated planning and precise tracking.
*   **Target Users**: Individuals seeking structured Indian-centric meal plans, guided workouts, and effortless consistency tracking.
*   **Key Features**:
    *   **Personalized Daily Plans**: Automated generation of meals and workouts based on region (North/South Indian), diet (Veg/Non-Veg), and primary goal.
    *   **iOS-Style Interface**: A premium, airy UI designed for focus and clarity.
    *   **Smart Tracking**: Hydration, weight logs, and meal consumption tracker.
    *   **AI Coach (Premium)**: An intelligent assistant that provides context-aware guidance based on user adherence data.
    *   **Gamification**: XP, levels, and streak tracking to drive long-term engagement.

---

## 🛠 Tech Stack

| Tier | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React + Vite | Fast, modern component-based UI. |
| **Styling** | Tailwind CSS | Utility-first design system with custom brand tokens. |
| **Backend** | Node.js + Express | Robust API and orchestration layer. |
| **Database** | PostgreSQL | Relational storage for complex health entities. |
| **ORM** | Drizzle ORM | Type-safe database interactions and schema management. |
| **Auth** | Passport.js | Secure session-based authentication (Local Strategy). |
| **AI Engine** | Google Gemini API | Powers the "Assistant" for context-aware health coaching. |
| **Hosting** | Render | Production-grade deployment for API and assets. |

---

## 📂 Folder Structure

| Directory | Description |
| :--- | :--- |
| `src/` | Frontend React application code (pages, components, hooks, assets). |
| `server/` | Express backend server, API routes, and storage implementations. |
| `shared/` | Shared TypeScript interfaces and Drizzle schema definitions. |
| `data/` | Core dataset for the app (Meals, Workouts, and Indian-centric libraries). |
| `scripts/` | Maintenance, diagnostic, and utility scripts for the development lifecycle. |

---

## 🏛 System Architecture
AARA follows a modern **Client-Server-Storage** architecture optimized for horizontal scalability and data integrity.

*   **Client (React)**: Communicates with the API using TanStack Query for caching and state management.
*   **API Layer (Express)**: Handles routing, authentication middleware, and input validation via Zod.
*   **Personalization Engine**: A logic module that processes user metrics to select deterministic meals and workouts from internal libraries.
*   **Persistence Layer**: Ensures that once a plan is generated for a specific date, it is locked in the database (idempotency).
*   **Data Libraries**: Static JSON repositories of high-quality Indian meals and structured workout routines.

---

## 🗄 Database Schema
Architected for performance and deep relational tracking using Drizzle ORM.

*   `users`: Core authentication identity.
*   `user_profiles`: Health data (Age, Height, Weight, Region, Diet, Primary Goal).
*   `daily_plans`: Root entity for a specific day. Tracks global targets (Calories, Protein, Water).
*   `meals`: Planned macros, ingredients, and "Consumed Alternative" state.
*   `workouts`: Exercises, duration, intensity, and structured sequences.
*   `activity_logs`: Aggregated passive tracking data (Steps, Distance, Calories).
*   `user_gamification`: Progression tracking (XP, Level, Streaks).

---

## 🧠 Personalization Engine Logic
The engine uses a **3-Tier Fallback System** to ensure plan availability:

1.  **Tier 1 (Strict)**: Matches exactly `Goal` AND `Diet Type` AND `Region Preference`.
2.  **Tier 2 (Relaxed)**: If Tier 1 yields no results, it ignores `Region` but prioritizes `Goal/Diet`.
3.  **Tier 3 (Minimum)**: Ultimate fallback providing best-matching options for the `Diet Type`.

**Persistence Rule**: Plans are generated once per day. The engine checks for an existing plan in the database before attempting to build a new one.

---

## 📡 API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/register` | User registration and gamification init. |
| `POST` | `/api/login` | Session-based authentication. |
| `GET` | `/api/user/profile` | Retrieve user health metrics. |
| `GET` | `/api/user/stats` | Weight history and consistency metrics. |
| `POST` | `/api/plans/generate` | Build/Fetch daily meal and workout plan. |
| `GET` | `/api/plans/:date/meals` | List meals for a specific date. |
| `PATCH` | `/api/plans/water` | Update daily hydration log. |

---

## 💻 Local Development

### 1. Prerequisites
- Node.js (v18+)
- PostgreSQL Database

### 2. Environment Setup
Create a `.env` file in the root directory:
```env
DATABASE_URL=postgres://user:password@localhost:5432/aara
SESSION_SECRET=your_random_secret
GEMINI_API_KEY=your_google_gemini_key
NUTRITION_API_KEY=your_api_ninjas_key
```

### 3. Running the App
```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build
```

---

## 🔒 Premium Feature System
AARA is pre-wired for a professional subscription model:
*   **Visual Indicators**: Premium features like "Coach Chat" are visually greyed out with custom lock icons.
*   **Interaction Guard**: Premium tabs trigger branded "Coming Soon" overlays instead of standard error messages.
*   **Role-Based Access**: The `royal_role` field in the database allows for instant unlocking of features upon subscription.

---

## 🗺 Future Scope
- **Macro Optimization v2**: Dynamic caloric adjustment based on active tracking.
- **Expanded Meal Database**: Global cuisines with calorie-matched Indian alternatives.
- **Live AI Coaching**: Real-time voice and text coaching via Gemini.
- **Advanced Analytics**: Interactive charts for trend analysis over weeks/months.

---
*Developed by the AARA Wellness Team © 2026*
