import "dotenv/config";
import { db } from "../server/db";
import { sql } from "drizzle-orm";
import { pool } from "../server/db";

async function main() {
    console.log("Starting schema fix...");
    try {
        // Fix for missing 'display_name'
        console.log("Adding display_name column if missing...");
        await db.execute(sql`
            ALTER TABLE user_profiles 
            ADD COLUMN IF NOT EXISTS display_name text;
        `);
        console.log("display_name added/verified.");

        // Fix for potentially missing 'royal_role' (saw it in schema next to display_name)
        console.log("Adding royal_role column if missing...");
        await db.execute(sql`
            ALTER TABLE user_profiles 
            ADD COLUMN IF NOT EXISTS royal_role text;
        `);
        // Fix for missing 'sessions' table
        console.log("Creating sessions table if missing...");
        await db.execute(sql`
            CREATE TABLE IF NOT EXISTS "sessions" (
                "sid" varchar NOT NULL COLLATE "default",
                "sess" json NOT NULL,
                "expire" timestamp(6) NOT NULL,
                CONSTRAINT "sessions_pkey" PRIMARY KEY ("sid")
            );
        `);
        await db.execute(sql`
            CREATE INDEX IF NOT EXISTS "IDX_sessions_expire" ON "sessions" ("expire");
        `);
        console.log("sessions table created/verified.");

    } catch (e) {
        console.error("Schema fix failed:", e);
    } finally {
        await pool.end();
    }
}

main();
