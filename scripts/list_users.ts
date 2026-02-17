
import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

async function listUsers() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        const client = await pool.connect();
        const res = await client.query('SELECT id, email, first_name, last_name FROM users');
        console.log("Users in DB:", JSON.stringify(res.rows, null, 2));
        client.release();
    } catch (err) {
        console.error("Failed to list users:", err);
    } finally {
        await pool.end();
    }
}

listUsers();
