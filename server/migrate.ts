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
                calories_burned INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT NOW()
            )`,
        },
        {
            name: "user_gamification",
            sql: `CREATE TABLE IF NOT EXISTS user_gamification (
                id SERIAL PRIMARY KEY,
                user_id INTEGER UNIQUE NOT NULL,
                xp INTEGER DEFAULT 0,
                level INTEGER DEFAULT 1,
                streak INTEGER DEFAULT 0,
                badges JSONB DEFAULT '[]',
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
