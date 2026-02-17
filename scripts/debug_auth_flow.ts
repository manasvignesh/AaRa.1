
import "dotenv/config";
import { pool, db } from "../server/db";
import { users } from "@shared/models/auth";
import { sql } from "drizzle-orm";

async function main() {
    console.log("=== Starting Auth Flow Debug ===");
    console.log("1. Testing Database Connection using server/db.ts config...");

    try {
        // Test simple query using the exported pool
        const client = await pool.connect();
        console.log("   [SUCCESS] Pool connected successfully.");
        const res = await client.query('SELECT NOW()');
        console.log("   [SUCCESS] Query result:", res.rows[0]);
        client.release();
    } catch (err: any) {
        console.error("   [FAILURE] Pool connection failed:", err.message);
        if (err.message.includes("SSL") || err.code === '28000') {
            console.error("   --> POTENTIAL ROOT CAUSE: Database requires SSL but server/db.ts might not be configuring it correctly for this environment.");
        }
        process.exit(1);
    }

    console.log("2. Testing Drizzle ORM connection...");
    try {
        const result = await db.select({ count: sql<number>`count(*)` }).from(users);
        console.log("   [SUCCESS] Drizzle query successful. User count:", result[0].count);
    } catch (err: any) {
        console.error("   [FAILURE] Drizzle query failed:", err.message);
        process.exit(1);
    }

    console.log("3. Setup complete. DB connection logic seems fine.");

    console.log("4. Testing storage.createUser...");
    const { storage } = await import("../server/storage");
    const testEmail = `test_${Date.now()}@example.com`;
    try {
        const newUser = await storage.createUser({
            email: testEmail,
            password: "hashed_password_test",
            firstName: "Test",
            lastName: "User",
            profileImageUrl: null
        });
        console.log("   [SUCCESS] User created:", newUser);
    } catch (err: any) {
        console.error("   [FAILURE] storage.createUser failed:", err);
        process.exit(1);
    }


    console.log("5. Testing Session Store (connect-pg-simple)...");
    const session = await import("express-session");
    const connectPg = await import("connect-pg-simple");
    const PostgresSessionStore = connectPg.default(session.default);

    const sessionStore = new PostgresSessionStore({
        pool,
        tableName: "sessions", // Force explicitly to be sure
        createTableIfMissing: false
    });

    // Mock a session object
    const mockSessionId = "test-sid-" + Date.now();
    const mockSessionData = { cookie: { originalMaxAge: 1000, expires: new Date(Date.now() + 1000), secure: false, httpOnly: true, path: '/' }, user: 'test-user' };

    try {
        await new Promise<void>((resolve, reject) => {
            sessionStore.set(mockSessionId, mockSessionData as any, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
        console.log("   [SUCCESS] Session stored successfully in DB.");

        // Verify readability
        await new Promise<void>((resolve, reject) => {
            sessionStore.get(mockSessionId, (err, session) => {
                if (err) reject(err);
                else if (!session) reject(new Error("Session not found after set"));
                else {
                    console.log("   [SUCCESS] Session retrieved from DB:", session);
                    resolve();
                }
            });
        });

    } catch (err: any) {
        console.error("   [FAILURE] Session Store test failed:", err);
        process.exit(1);
    }

    console.log("=== Debug Complete ===");
    process.exit(0);
}

main().catch(console.error);
