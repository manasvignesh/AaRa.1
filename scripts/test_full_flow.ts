import 'dotenv/config';

const BASE_URL = 'http://localhost:5001';

async function test() {
    console.log('=== Testing Login + Profile + Plan Generation ===\n');

    // 1. Login
    console.log('1. Logging in...');
    const loginRes = await fetch(`${BASE_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'real_test@example.com', password: 'test123' }),
        credentials: 'include'
    });

    const cookies = loginRes.headers.get('set-cookie');
    console.log('   Login status:', loginRes.status);
    console.log('   Cookies:', cookies ? 'Received' : 'NONE');

    if (!loginRes.ok) {
        console.log('   Body:', await loginRes.text());
        return;
    }

    const loginData = await loginRes.json();
    console.log('   User ID:', loginData.id);

    // 2. Profile fetch
    console.log('\n2. Fetching profile...');
    const profileRes = await fetch(`${BASE_URL}/api/user/profile`, {
        headers: { Cookie: cookies || '' }
    });
    console.log('   Profile status:', profileRes.status);

    if (profileRes.status === 404) {
        console.log('   No profile exists - this is expected for new users');
    } else if (!profileRes.ok) {
        console.log('   Error:', await profileRes.text());
    } else {
        const profile = await profileRes.json();
        console.log('   Profile age:', profile.age, 'diet:', profile.dietaryPreferences);
    }

    // 3. Plan generation
    console.log('\n3. Generating plan...');
    const today = new Date().toISOString().split('T')[0];
    const planRes = await fetch(`${BASE_URL}/api/plans/generate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Cookie: cookies || ''
        },
        body: JSON.stringify({ date: today })
    });
    console.log('   Plan status:', planRes.status);

    const planBody = await planRes.text();
    console.log('   Response:', planBody.substring(0, 500));

    if (!planRes.ok) {
        console.log('\n   === FULL ERROR ===');
        console.log(planBody);
    }
}

test().catch(err => {
    console.error('Test failed with exception:', err);
});
