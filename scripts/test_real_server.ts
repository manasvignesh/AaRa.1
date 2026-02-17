
import "dotenv/config";
import { spawn } from "child_process";
import fs from "fs";
import http from 'http';

// 1. Spawn the Real Server
console.log("=== Spawning Real Server using 'tsx server/index.ts' ===");
const serverProcess = spawn("npx", ["tsx", "server/index.ts"], {
    cwd: process.cwd(),
    env: { ...process.env, PORT: "5002", NODE_ENV: "development" }, // Use diff port to avoid conflict
    stdio: 'pipe' // Pipe output so we can see it
});

const serverOutput: string[] = [];

serverProcess.stdout.on('data', (data) => {
    const msg = data.toString();
    process.stdout.write(`[SERVER] ${msg}`);
    serverOutput.push(msg);
});

serverProcess.stderr.on('data', (data) => {
    const msg = data.toString();
    process.stderr.write(`[SERVER-ERR] ${msg}`);
    serverOutput.push(msg);
});

// Helper to wait for server
async function waitForServer(port: number): Promise<void> {
    let retries = 20;
    while (retries > 0) {
        try {
            await new Promise<void>((resolve, reject) => {
                const req = http.get(`http://localhost:${port}/api/health`, (res) => { // Try a basic URL
                    resolve(); // Typically 404 is fine as long as connection accepts
                });
                req.on('error', reject);
                req.end();
            });
            console.log("Server is up!");
            return;
        } catch {
            await new Promise(r => setTimeout(r, 1000));
            retries--;
        }
    }
    throw new Error("Server failed to start");
}

async function runTest() {
    try {
        await waitForServer(5002);

        const baseUrl = 'http://localhost:5002';

        // Helper: Generic Request
        const request = (method: string, path: string, body?: any, cookie?: string) => {
            return new Promise<{ statusCode: number, headers: any, body: string }>((resolve, reject) => {
                const options: any = { method, headers: { 'Content-Type': 'application/json' } };
                if (cookie) options.headers['Cookie'] = cookie;

                const req = http.request(`${baseUrl}${path}`, options, (res) => {
                    let data = '';
                    res.on('data', c => data += c);
                    res.on('end', () => resolve({ statusCode: res.statusCode || 500, headers: res.headers, body: data }));
                });
                req.on('error', reject);
                if (body) req.write(JSON.stringify(body));
                req.end();
            });
        };

        // 1. REGISTER
        console.log("1. Sending Register Request...");
        const regRes = await request('POST', '/api/register', {
            email: `real_test_${Date.now()}@test.com`,
            password: "password123",
            firstName: "Real",
            lastName: "Tester"
        });
        console.log(`[TEST] Register Status: ${regRes.statusCode}`);

        const cookie = regRes.headers['set-cookie']?.[0];
        console.log(`[TEST] Cookie: ${cookie}`);

        if (!cookie) throw new Error("No cookie returned!");

        // 2. CHECK AUTH USER
        console.log("2. Checking /api/auth/user...");
        const authRes = await request('GET', '/api/auth/user', undefined, cookie);
        console.log(`[TEST] Auth Status: ${authRes.statusCode}`);
        console.log(`[TEST] Auth Body: ${authRes.body}`);

        // 3. CHECK PROFILE
        console.log("3. Checking /api/user/profile...");
        const profileRes = await request('GET', '/api/user/profile', undefined, cookie);
        console.log(`[TEST] Profile Status: ${profileRes.statusCode}`);
        console.log(`[TEST] Profile Body: ${profileRes.body}`);

        if (profileRes.statusCode === 200 || profileRes.statusCode === 404) {
            console.log("SUCCESS! Request completed.");
        } else {
            console.log("FAILURE! Request didn't return expected status (200/404).");
        }

    } catch (err) {
        console.error("Test execution failed:", err);
    } finally {
        serverProcess.kill();
        process.exit(0);
    }
}

runTest();
