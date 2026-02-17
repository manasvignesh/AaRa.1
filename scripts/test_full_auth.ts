
async function testLogin() {
    // I need to use the email from the previous registration or a known one
    // Let's use the one I just created if I had saved it, but I'll just create a new one AND then login
    const email = `test_login_${Date.now()}@example.com`;
    const password = "password123";

    console.log(`Step 1: Registering ${email}`);
    let response = await fetch("http://localhost:5000/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            email,
            password,
            firstName: "Login",
            lastName: "Test"
        })
    });

    if (response.status !== 201) {
        console.error("Registration failed", await response.text());
        return;
    }
    console.log("Registration success");

    console.log(`Step 2: Attempting login for ${email}`);
    response = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            email,
            password
        })
    });

    console.log(`Login Response Status: ${response.status}`);
    const text = await response.text();
    console.log(`Login Response Body: ${text}`);

    if (response.status === 200) {
        console.log("Step 3: Checking authenticated user");
        const cookie = response.headers.get("set-cookie");
        const userRes = await fetch("http://localhost:5000/api/auth/user", {
            headers: { "Cookie": cookie || "" }
        });
        console.log(`User Info Status: ${userRes.status}`);
        console.log(`User Info Body: ${await userRes.text()}`);
    }
}

testLogin();
