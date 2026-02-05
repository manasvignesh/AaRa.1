
import pg from 'pg';
import "dotenv/config";

const { Pool } = pg;

// Use process.env.DATABASE_URL or fallback
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    console.error("No DATABASE_URL found in environment variables.");
    process.exit(1);
}

const pool = new Pool({
    connectionString: databaseUrl,
});

async function clearToday() {
    const client = await pool.connect();
    try {
        const today = new Date().toISOString().split('T')[0];
        console.log(`Clearing plans for today: ${today}`);

        // Find plans for today
        const res = await client.query(`SELECT id, user_id FROM daily_plans WHERE date = $1`, [today]);

        if (res.rows.length === 0) {
            console.log("No plans found for today.");
            return;
        }

        for (const row of res.rows) {
            console.log(`Deleting details for Plan ID ${row.id} (User ${row.user_id})...`);

            // Delete dependent records
            await client.query(`DELETE FROM workouts WHERE plan_id = $1`, [row.id]);
            await client.query(`DELETE FROM meals WHERE plan_id = $1`, [row.id]);
            await client.query(`DELETE FROM manual_meals WHERE plan_id = $1`, [row.id]); // Just in case

            // Delete the plan itself
            await client.query(`DELETE FROM daily_plans WHERE id = $1`, [row.id]);
        }

        console.log("Successfully cleared today's plans. Please refresh the app to generate a new one.");

    } catch (err) {
        console.error("Error clearing plans:", err);
    } finally {
        client.release();
        await pool.end();
    }
}

clearToday();
