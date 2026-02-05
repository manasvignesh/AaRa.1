import "dotenv/config";
import pg from "pg";
const { Pool } = pg;

async function checkDb() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    try {
        const columns = await pool.query(`
        SELECT column_name
        FROM information_schema.columns 
        WHERE table_name = 'users';
    `);
        console.log("Columns:", columns.rows.map(r => r.column_name).join(", "));
    } catch (err) {
        console.error("DB Error:", err);
    } finally {
        await pool.end();
    }
}

checkDb();
