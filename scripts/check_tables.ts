
import "dotenv/config";
import { pool } from "../server/db";

async function main() {
    console.log("Checking DB Tables...");
    const client = await pool.connect();
    try {
        const res = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name;
        `);
        console.log("Tables found:");
        res.rows.forEach(row => console.log(`- ${row.table_name}`));
    } finally {
        client.release();
        await pool.end();
    }
}
main();
