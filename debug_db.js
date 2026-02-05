import "dotenv/config";
import pg from "pg";
const { Pool } = pg;

async function checkDb() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    try {
        const res = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public';
    `);
        console.log("Tables in DB:", res.rows.map(r => r.table_name));

        if (res.rows.find(r => r.table_name === 'users')) {
            const columns = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'users';
        `);
            console.log("Columns in 'users':", columns.rows);
        }

        if (res.rows.find(r => r.table_name === 'user_profiles')) {
            const columns = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'user_profiles';
        `);
            console.log("Columns in 'user_profiles':", columns.rows);
        }

    } catch (err) {
        console.error("DB Error:", err);
    } finally {
        await pool.end();
    }
}

checkDb();
