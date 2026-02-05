import "dotenv/config";
import pg from "pg";
const { Pool } = pg;

async function checkUsers() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    try {
        const res = await pool.query("SELECT id, email, first_name FROM users");
        console.log("Users in DB:", res.rows);
    } catch (err) {
        console.error("DB Error:", err);
    } finally {
        await pool.end();
    }
}

checkUsers();
