
import "dotenv/config";
import { setupAuth } from "../server/auth";
import express from "express";
import { storage } from "../server/storage";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "../server/db";
import passport from "passport";

// Create a minimal version of the server app to test Auth specifically
// preventing Vite from starting which takes time/resources
async function startTestServer() {
    const app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));

    // Setup Auth (this uses the modified auth.ts)
    setupAuth(app);

    // Mock route/middleware that usually sits in index.ts
    app.use((req, res, next) => {
        console.log(`[TEST-SERVER] ${req.method} ${req.url}`);
        next();
    });

    const port = 5001;
    const server = app.listen(port, () => {
        console.log(`[TEST-SERVER] Listening on ${port}`);
        runClientTests(port, server);
    });
}

import http from 'http';

async function runClientTests(port: number, server: any) {
    const baseUrl = `http://localhost:${port}`;
    console.log("=== Starting Client Tests ===");

    // 1. Create User (Direct DB)
    const testEmail = `integration_${Date.now()}@test.com`;
    const testPass = "password123";

    // We need to create a user first because we can't fully mock the registration flow 
    // easily without mocking the hash function or implementing a full register request.
    // Actually, let's use the register endpoint!

    // Helper for requests
    const request = (path: string, options: any) => {
        return new Promise<{ statusCode: number, headers: any, body: string }>((resolve, reject) => {
            const req = http.request(`${baseUrl}${path}`, options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => resolve({
                    statusCode: res.statusCode || 0,
                    headers: res.headers,
                    body: data
                }));
            });
            req.on('error', reject);
            if (options.body) {
                req.write(options.body);
            }
            req.end();
        });
    };

    try {
        console.log("1. Testing Registration...");
        const regData = JSON.stringify({
            email: testEmail,
            password: testPass,
            firstName: "Integration",
            lastName: "Test"
        });

        const regRes = await request('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': regData.length
            },
            body: regData
        });

        console.log(`   [REGISTER] Status: ${regRes.statusCode}`);
        console.log(`   [REGISTER] Cookie:`, regRes.headers['set-cookie']);

        if (regRes.statusCode !== 201) {
            console.error("   [FAILURE] Registration failed:", regRes.body);
            process.exit(1);
        }

        const cookie = regRes.headers['set-cookie']?.[0]; // Get the session cookie
        if (!cookie) {
            console.error("   [FAILURE] No cookie received!");
            process.exit(1);
        }

        console.log("2. Testing /api/auth/user with cookie...");
        const userRes = await request('/api/auth/user', {
            method: 'GET',
            headers: {
                'Cookie': cookie
            }
        });

        console.log(`   [AUTH-CHECK] Status: ${userRes.statusCode}`);
        console.log(`   [AUTH-CHECK] Body:`, userRes.body);

        if (userRes.statusCode !== 200) {
            console.error("   [FAILURE] Auth check failed.");
            process.exit(1);
        }


        console.log("3. Testing /api/user/profile with cookie...");
        const profileRes = await request('/api/user/profile', {
            method: 'GET',
            headers: {
                'Cookie': cookie
            }
        });

        console.log(`   [PROFILE-CHECK] Status: ${profileRes.statusCode}`);
        // 404 is expected if profile not created yet, 200 if it exists. 
        // We just want to ensure it RETURNS and DOES NOT HANG.
        if (profileRes.statusCode !== 200 && profileRes.statusCode !== 404) {
            console.error("   [FAILURE] Profile check failed:", profileRes.statusCode);
            process.exit(1);
        }

        console.log("=== SUCCESS: Full Auth Flow works on Server ===");

    } catch (err) {
        console.error("Test failed:", err);
    } finally {
        server.close();
        pool.end(); // close db connection
        process.exit(0);
    }
}

startTestServer();
