
import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

// Construct Neon URL from env vars
const neonUrl = `postgres://${process.env.PGUSER}:${process.env.PGPASSWORD}@${process.env.PGHOST}/${process.env.PGDATABASE}?sslmode=require`;

async function testConnection() {
    console.log("Testing Neon DB Connection...");
    console.log("Constructed URL (masked):", neonUrl.replace(/:([^:@]+)@/, ":****@"));

    const pool = new Pool({
        connectionString: neonUrl,
        ssl: { rejectUnauthorized: false }
    });

    try {
        const client = await pool.connect();
        console.log("Successfully connected to Neon Database!");

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
            const sessionsRes = await client.query("SELECT count(*) FROM \"session\"");
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
