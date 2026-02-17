
import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

async function checkPasswords() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        const client = await pool.connect();
        const res = await client.query('SELECT id, email, password FROM users');
        for (const row of res.rows) {
            if (!row.password.includes('.')) {
                console.warn(`User ${row.id} (${row.email}) has invalid password format: no dot found.`);
            }
        }
        console.log("Password check complete.");
        client.release();
    } catch (err) {
        console.error("Failed to check passwords:", err);
    } finally {
        await pool.end();
    }
}

checkPasswords();
