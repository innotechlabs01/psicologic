
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:4321';

async function testEndpoint(name, path, method = 'POST', body = {}) {
    try {
        const response = await fetch(`${BASE_URL}${path}`, {
            method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        console.log(`[${name}] ${path} -> Status: ${response.status}`);

        if (response.status === 403 || response.status === 401) {
            console.log(`✅ Passed: Access denied as expected.`);
        } else if (response.status === 200) {
            console.log(`❌ FAILED: Access granted without auth!`);
        } else {
            console.log(`⚠️ Warning: Unexpected status ${response.status}`);
            const text = await response.text();
            console.log(`   Response: ${text.substring(0, 100)}...`);
        }

    } catch (error) {
        console.error(`[${name}] Error: ${error.message}`);
    }
}

async function runTests() {
    console.log("🔒 Starting Security Verification...");

    // Test sensitive user management endpoints
    await testEndpoint('Suspend User', '/api/users/suspend', 'POST', { userId: 'test-user' });
    await testEndpoint('Approve User', '/api/users/approve', 'POST', { userId: 'test-user' });
    await testEndpoint('Reject User', '/api/users/reject', 'POST', { userId: 'test-user' });
    await testEndpoint('Change Role', '/api/users/change-role', 'POST', { userId: 'test-user', newRole: 'org:admin' });

    console.log("🏁 Verification Complete.");
}

runTests();
