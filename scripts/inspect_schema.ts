import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

async function inspect() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        const report: Record<string, any[]> = {};
        const tables = ['user_profiles', 'daily_plans', 'meals', 'workouts'];
        for (const table of tables) {
            const res = await pool.query(`
        SELECT column_name, data_type, is_nullable, column_default 
        FROM information_schema.columns 
        WHERE table_name = $1
        ORDER BY ordinal_position
      `, [table]);
            report[table] = res.rows;
        }
        console.log(JSON.stringify(report, null, 2));
    } catch (err) {
        console.error('Inspection failed:', err);
    } finally {
        await pool.end();
    }
}

inspect();
