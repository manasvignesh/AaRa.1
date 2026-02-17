
import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

async function testConnection() {
    console.log("Testing DB Connection...");
    console.log("DATABASE_URL:", process.env.DATABASE_URL ? "Set" : "Not Set");
    if (process.env.DATABASE_URL) {
        // Mask the password for safety in logs
        const masked = process.env.DATABASE_URL.replace(/:([^:@]+)@/, ":****@");
        console.log("URL Value (masked):", masked);
    }

    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false } // Try with SSL as it's likely needed for Supabase/Neon
    });

    try {
        const client = await pool.connect();
        console.log("Successfully connected to Database!");

        const res = await client.query('SELECT NOW()');
        console.log("Query 'SELECT NOW()' success:", res.rows[0]);

        // Check for users table
        try {
            const usersRes = await client.query("SELECT count(*) FROM users");
            console.log("Users table check - count:", usersRes.rows[0].count);
        } catch (e: any) {
            console.error("Users table check failed (Table might be missing):", e.message);
        }

        // Check for sessions table
        try {
            const sessionsRes = await client.query("SELECT count(*) FROM \"session\""); // connect-pg-simple usually uses "session" or "sessions"
            console.log("Session table check (session) - count:", sessionsRes.rows[0].count);
        } catch (e: any) {
            console.log("Session table (session) not found, trying 'sessions'...");
            try {
                const sessionsRes2 = await client.query("SELECT count(*) FROM sessions");
                console.log("Session table check (sessions) - count:", sessionsRes2.rows[0].count);
            } catch (e2: any) {
                console.error("Sessions table check failed (Both 'session' and 'sessions' missing):", e2.message);
            }
        }

        client.release();
    } catch (err) {
        console.error("Connection Failed:", err);
    } finally {
        await pool.end();
    }
}

testConnection();
