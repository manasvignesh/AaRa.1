async function testLogin() {
    try {
        const res = await fetch("http://localhost:5000/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: "real_test@example.com",
                password: "password123"
            })
        });
        console.log("Status:", res.status);
        const body = await res.text();
        console.log("Body:", body);
    } catch (e) {
        console.error("Fetch error:", e);
    }
}

testLogin();
