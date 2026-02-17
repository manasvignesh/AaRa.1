
async function testRegister() {
    const email = `test_${Date.now()}@example.com`;
    const password = "password123";

    console.log(`Attempting to register: ${email}`);

    try {
        const response = await fetch("http://localhost:5000/api/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email,
                password,
                firstName: "Test",
                lastName: "User"
            })
        });

        const status = response.status;
        const text = await response.text();
        console.log(`Response Status: ${status}`);
        console.log(`Response Body: ${text}`);
    } catch (err) {
        console.error("Fetch failed:", err);
    }
}

testRegister();
