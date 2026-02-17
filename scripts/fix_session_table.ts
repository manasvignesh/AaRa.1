
import "dotenv/config";
import { pool } from "../server/db";

async function main() {
    console.log("Renaming 'session' table to 'sessions'...");
    const client = await pool.connect();
    try {
        await client.query('ALTER TABLE "session" RENAME TO "sessions";');
        console.log("   [SUCCESS] Table renamed.");
    } catch (err: any) {
        if (err.message.includes('does not exist')) {
            console.log("   [INFO] Table 'session' does not exist. Checking if 'sessions' exists...");
            const res = await client.query(`SELECT to_regclass('public.sessions');`);
            if (res.rows[0].to_regclass) {
                console.log("   [SUCCESS] 'sessions' table already exists.");
            } else {
                console.error("   [FAILURE] Neither 'session' nor 'sessions' table found!");
                process.exit(1);
            }
        } else {
            console.error("   [FAILURE] Error renaming table:", err.message);
            process.exit(1);
        }
    } finally {
        client.release();
        await pool.end();
    }
}
main();
