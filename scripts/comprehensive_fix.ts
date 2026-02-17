import "dotenv/config";
import { db, pool } from "../server/db";
import { sql } from "drizzle-orm";

async function main() {
    console.log("Starting comprehensive schema fix...");
    try {
        const columnsToAdd = [
            { table: 'user_profiles', column: 'display_name', type: 'text' },
            { table: 'user_profiles', column: 'royal_role', type: 'text' },
            { table: 'user_profiles', column: 'sleep_duration', type: 'integer DEFAULT 8' },
            { table: 'user_profiles', column: 'stress_level', type: 'text DEFAULT \'moderate\'' },
            { table: 'user_profiles', column: 'primary_goal', type: 'text DEFAULT \'fat_loss\'' },
            { table: 'user_profiles', column: 'weekly_goal_pace', type: 'text DEFAULT \'balanced\'' },
            { table: 'user_profiles', column: 'coaching_tone', type: 'text DEFAULT \'supportive\'' },
            { table: 'user_profiles', column: 'reminder_frequency', type: 'text DEFAULT \'normal\'' },
            { table: 'user_profiles', column: 'units', type: 'text DEFAULT \'kg\'' },
            { table: 'user_profiles', column: 'theme', type: 'text DEFAULT \'system\'' },
            { table: 'user_profiles', column: 'daily_meal_count', type: 'integer DEFAULT 3' },
            // Add any other missing columns for user_profiles or other tables here
        ];

        for (const item of columnsToAdd) {
            console.log(`Checking ${item.table}.${item.column}...`);
            try {
                await db.execute(sql.raw(`ALTER TABLE ${item.table} ADD COLUMN IF NOT EXISTS ${item.column} ${item.type};`));
                console.log(`  Done or already exists.`);
            } catch (err) {
                console.error(`  Error adding ${item.column}:`, err.message);
            }
        }

        console.log("Schema fix completed.");
    } catch (e) {
        console.error("Schema fix failed:", e);
    } finally {
        await pool.end();
    }
}

main();
