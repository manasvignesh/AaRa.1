
import http from 'http';

async function runTest() {
    try {
        const baseUrl = 'http://localhost:5000'; // Assuming default port
        console.log(`Connecting to ${baseUrl}...`);

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
            email: `real_live_${Date.now()}@test.com`,
            password: "password123",
            firstName: "Live",
            lastName: "Tester"
        });
        console.log(`[TEST] Register Status: ${regRes.statusCode}`);
        if (regRes.statusCode !== 201) {
            console.log(`[TEST] Register Body: ${regRes.body}`);
        }

        const cookie = regRes.headers['set-cookie']?.[0];
        console.log(`[TEST] Cookie: ${cookie}`);

        if (!cookie) {
            console.log("No cookie returned! Trying LOGIN...");
            // Maybe user already exists?
            const loginRes = await request('POST', '/api/login', {
                email: `real_live_${Date.now()}@test.com`, // Oops, new user every time
                password: "password123"
            });
            // ... logic to handle
        }

        if (cookie) {
            // 2. CHECK AUTH USER
            console.log("2. Checking /api/auth/user...");
            const authRes = await request('GET', '/api/auth/user', undefined, cookie);
            console.log(`[TEST] Auth Status: ${authRes.statusCode}`);
            console.log(`[TEST] Auth Body: ${authRes.body}`);

            // 3. CHECK PROFILE
            console.log("3. Checking /api/user/profile...");
            const profileRes = await request('GET', '/api/user/profile', undefined, cookie);
            console.log(`[TEST] Profile Status: ${profileRes.statusCode}`);

            if (profileRes.statusCode === 200) {
                const profile = JSON.parse(profileRes.body);
                console.log(`[TEST] Profile ID: ${profile.id}`);
            } else if (profileRes.statusCode === 404) {
                console.log(`[TEST] Profile 404 (Expected for new user)`);
            } else {
                console.log(`[TEST] Profile Body: ${profileRes.body}`);
            }
        }

    } catch (err) {
        console.error("Test execution failed:", err);
    }
}

runTest();
