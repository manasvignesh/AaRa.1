import { pool } from "./db";

/**
 * Run safe, idempotent migrations on startup.
 * Each ALTER TABLE uses IF NOT EXISTS to prevent crashes on re-runs.
 */
export async function runStartupMigrations(): Promise<void> {
    // === Phase 1: Ensure required tables exist ===
    const tableMigrations: { name: string; sql: string }[] = [
        {
            name: "activity_logs",
            sql: `CREATE TABLE IF NOT EXISTS activity_logs (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                date DATE NOT NULL,
                steps INTEGER DEFAULT 0,
                distance INTEGER DEFAULT 0,
                calories INTEGER DEFAULT 0,
                active_time INTEGER DEFAULT 0,
                last_synced_at TIMESTAMP DEFAULT NOW()
            )`,
        },
        {
            name: "user_gamification",
            sql: `CREATE TABLE IF NOT EXISTS user_gamification (
                id SERIAL PRIMARY KEY,
                user_id INTEGER UNIQUE NOT NULL,
                xp INTEGER DEFAULT 0,
                level INTEGER DEFAULT 1,
                current_streak INTEGER DEFAULT 0,
                longest_streak INTEGER DEFAULT 0,
                last_active_date DATE,
                badges JSONB DEFAULT '[]',
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )`,
        },
        {
            name: "conversations",
            sql: `CREATE TABLE IF NOT EXISTS conversations (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
            )`,
        },
        {
            name: "messages",
            sql: `CREATE TABLE IF NOT EXISTS messages (
                id SERIAL PRIMARY KEY,
                conversation_id INTEGER NOT NULL,
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
            )`,
        },
        {
            name: "gps_routes",
            sql: `CREATE TABLE IF NOT EXISTS gps_routes (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                start_time TIMESTAMP NOT NULL,
                end_time TIMESTAMP,
                distance INTEGER DEFAULT 0,
                duration INTEGER DEFAULT 0,
                route_points JSONB,
                created_at TIMESTAMP DEFAULT NOW()
            )`,
        },
    ];

    console.log("[MIGRATION] Phase 1: Ensuring required tables exist...");

    for (const table of tableMigrations) {
        try {
            await pool.query(table.sql);
            console.log(`[MIGRATION] ✓ Table '${table.name}' ensured`);
        } catch (error: any) {
            console.error(`[MIGRATION] ✗ Failed to create table '${table.name}':`, error.message);
        }
    }

    // === Phase 2: Ensure required columns exist ===
    const migrations: { column: string; sql: string }[] = [
        // Align tables with Drizzle schema even if older tables were created previously
        {
            column: "activity_logs.distance",
            sql: `ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS distance INTEGER DEFAULT 0`,
        },
        {
            column: "activity_logs.calories",
            sql: `ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS calories INTEGER DEFAULT 0`,
        },
        {
            column: "activity_logs.active_time",
            sql: `ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS active_time INTEGER DEFAULT 0`,
        },
        {
            column: "activity_logs.last_synced_at",
            sql: `ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMP DEFAULT NOW()`,
        },
        {
            column: "user_gamification.current_streak",
            sql: `ALTER TABLE user_gamification ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0`,
        },
        {
            column: "user_gamification.longest_streak",
            sql: `ALTER TABLE user_gamification ADD COLUMN IF NOT EXISTS longest_streak INTEGER DEFAULT 0`,
        },
        {
            column: "user_gamification.last_active_date",
            sql: `ALTER TABLE user_gamification ADD COLUMN IF NOT EXISTS last_active_date DATE`,
        },
        {
            column: "user_gamification.updated_at",
            sql: `ALTER TABLE user_gamification ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()`,
        },
        {
            column: "conversations.created_at",
            sql: `ALTER TABLE conversations ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`,
        },
        {
            column: "conversations.user_id",
            sql: `ALTER TABLE conversations ADD COLUMN IF NOT EXISTS user_id INTEGER`,
        },
        {
            column: "messages.created_at",
            sql: `ALTER TABLE messages ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`,
        },
        {
            column: "region_preference",
            sql: `ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS region_preference TEXT DEFAULT 'north_indian'`,
        },
        {
            column: "primary_goal",
            sql: `ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS primary_goal TEXT DEFAULT 'fat_loss'`,
        },
        {
            column: "weekly_goal_pace",
            sql: `ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS weekly_goal_pace TEXT DEFAULT 'balanced'`,
        },
        {
            column: "sleep_duration",
            sql: `ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS sleep_duration INTEGER DEFAULT 8`,
        },
        {
            column: "stress_level",
            sql: `ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS stress_level TEXT DEFAULT 'moderate'`,
        },
        {
            column: "coaching_tone",
            sql: `ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS coaching_tone TEXT DEFAULT 'supportive'`,
        },
        {
            column: "reminder_frequency",
            sql: `ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS reminder_frequency TEXT DEFAULT 'normal'`,
        },
        {
            column: "units",
            sql: `ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS units TEXT DEFAULT 'kg'`,
        },
        {
            column: "theme",
            sql: `ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'system'`,
        },
        {
            column: "display_name",
            sql: `ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS display_name TEXT`,
        },
        {
            column: "royal_role",
            sql: `ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS royal_role TEXT`,
        },
        {
            column: "daily_meal_count",
            sql: `ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS daily_meal_count INTEGER DEFAULT 3`,
        },
        // Meals metadata (weight-category aware meal library tags)
        {
            column: "meals.library_meal_id",
            sql: `ALTER TABLE meals ADD COLUMN IF NOT EXISTS library_meal_id TEXT`,
        },
        {
            column: "meals.fiber",
            sql: `ALTER TABLE meals ADD COLUMN IF NOT EXISTS fiber INTEGER`,
        },
        {
            column: "meals.cooking_method",
            sql: `ALTER TABLE meals ADD COLUMN IF NOT EXISTS cooking_method TEXT`,
        },
        {
            column: "meals.suitable_for_categories",
            sql: `ALTER TABLE meals ADD COLUMN IF NOT EXISTS suitable_for_categories JSONB`,
        },
        {
            column: "meals.calorie_density",
            sql: `ALTER TABLE meals ADD COLUMN IF NOT EXISTS calorie_density TEXT`,
        },
        {
            column: "meals.glycemic_load",
            sql: `ALTER TABLE meals ADD COLUMN IF NOT EXISTS glycemic_load TEXT`,
        },
        {
            column: "meals.protein_priority",
            sql: `ALTER TABLE meals ADD COLUMN IF NOT EXISTS protein_priority BOOLEAN DEFAULT FALSE`,
        },
        {
            column: "meals.is_weight_loss_friendly",
            sql: `ALTER TABLE meals ADD COLUMN IF NOT EXISTS is_weight_loss_friendly BOOLEAN DEFAULT FALSE`,
        },
        {
            column: "meals.is_muscle_gain_friendly",
            sql: `ALTER TABLE meals ADD COLUMN IF NOT EXISTS is_muscle_gain_friendly BOOLEAN DEFAULT FALSE`,
        },
        {
            column: "meals.is_low_calorie",
            sql: `ALTER TABLE meals ADD COLUMN IF NOT EXISTS is_low_calorie BOOLEAN DEFAULT FALSE`,
        },
        {
            column: "meals.is_high_fiber",
            sql: `ALTER TABLE meals ADD COLUMN IF NOT EXISTS is_high_fiber BOOLEAN DEFAULT FALSE`,
        },
        {
            column: "bmi",
            sql: `ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS bmi numeric(4,1)`,
        },
        {
            column: "weight_category",
            sql: `ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS weight_category TEXT`,
        },
        {
            column: "bmi_last_calculated",
            sql: `ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS bmi_last_calculated TIMESTAMP`,
        },
    ];

    console.log("[MIGRATION] Phase 2: Ensuring required columns exist...");

    for (const migration of migrations) {
        try {
            await pool.query(migration.sql);
            console.log(`[MIGRATION] ✓ Column '${migration.column}' ensured`);
        } catch (error: any) {
            // Column already exists (error code 42701) is safe to ignore
            if (error.code === "42701") {
                console.log(`[MIGRATION] ✓ Column '${migration.column}' already exists`);
            } else {
                console.error(`[MIGRATION] ✗ Failed to add '${migration.column}':`, error.message);
            }
        }
    }

    console.log("[MIGRATION] Startup migrations complete.");
}
