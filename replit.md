# AaRa - Wellness Fitness App

## Overview

AaRa is a health-focused weight loss coaching application that provides personalized daily meal and workout plans. The application emphasizes safety-first principles, prioritizing fat loss over scale weight and muscle preservation over aggressive calorie cutting. Users complete an onboarding wizard to capture health data, then receive AI-generated daily plans with macro tracking, meal logging, workout tracking, and weight progress visualization.

**Critical Note**: This is a health-critical application. Logic accuracy takes priority over speed. Never guess missing health-related logic or simplify by removing safety steps.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript, built using Vite
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state caching and synchronization
- **UI Components**: shadcn/ui component library with Radix UI primitives
- **Styling**: Tailwind CSS with custom health-focused theme (emerald/teal tones)
- **Animations**: Framer Motion for page transitions and wizard animations
- **Charts**: Recharts for weight progress visualization

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **API Design**: RESTful endpoints defined in `shared/routes.ts` with Zod validation
- **Authentication**: Replit Auth integration with session-based authentication using `connect-pg-simple`
- **Database ORM**: Drizzle ORM with PostgreSQL
- **Build System**: Custom build script using esbuild for server bundling and Vite for client

### Data Layer
- **Database**: PostgreSQL (provisioned via Replit)
- **Schema Location**: `shared/schema.ts` with separate models in `shared/models/`
- **Migrations**: Drizzle Kit with `drizzle-kit push` for schema synchronization
- **Key Tables**:
  - `user_profiles`: Health data linked to auth users
  - `daily_plans`: Generated daily nutrition and workout plans (includes adaptation fields)
  - `meals` and `workouts`: Individual plan items with completion tracking
  - `manual_meals`: User-logged meals outside the plan (with AI-estimated calorie ranges)
  - `workout_sessions`: Tracks workout execution progress
  - `weight_logs`: Historical weight entries for progress charts
  - `sessions` and `users`: Authentication tables (required for Replit Auth)

### Application Flow
1. User authenticates via Replit Auth
2. First-time users complete onboarding wizard (4-step health data collection)
3. Dashboard auto-generates daily plans based on user profile
4. Users track meals, workouts, water intake, and weight
5. Profile updates trigger target recalculation for existing plans
6. Manual meal logging triggers gentle 3-day adaptation period (slightly extended workouts)
7. Timer-based workout execution with structured warmup/main/cooldown phases (18/62/20 split)

### Key Design Patterns
- **Protected Routes**: Authentication and profile checks before dashboard access
- **Shared Types**: Zod schemas in `shared/` used by both client and server
- **API Contract**: Centralized route definitions with input/output schemas in `shared/routes.ts`
- **Storage Interface**: `IStorage` interface in `server/storage.ts` for data access abstraction

## External Dependencies

### Database
- **PostgreSQL**: Primary data store, connection via `DATABASE_URL` environment variable

### Authentication
- **Replit Auth**: OpenID Connect integration for user authentication
- **Required Environment Variables**: `ISSUER_URL`, `REPL_ID`, `SESSION_SECRET`, `DATABASE_URL`

### AI Integrations (via Replit AI)
- **OpenAI API**: Used for meal/workout generation and voice features
- **Environment Variables**: `AI_INTEGRATIONS_OPENAI_API_KEY`, `AI_INTEGRATIONS_OPENAI_BASE_URL`

### Third-Party Libraries
- **Form Handling**: react-hook-form with @hookform/resolvers for Zod integration
- **Date Utilities**: date-fns for date manipulation and formatting
- **Rate Limiting**: p-limit and p-retry for batch processing operations