/**
 * SMOKE TEST SCRIPT
 * Tests /api/exit/execute endpoint without requiring SERVER_PRIVATE_KEY.
 *
 * Run:  node smoke-test.js
 *
 * For manual curl testing, see the CURL COMMANDS section below.
 */

const axios = require('axios');

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';

// ── Health Check ────────────────────────────────────────────────────────────

async function testHealth() {
    console.log('\n🔍 Testing /api/health...');
    try {
        const res = await axios.get(`${BASE_URL}/api/health`);
        console.log(`   ✅  Status: ${res.status}`);
        console.log(`   Data: ${JSON.stringify(res.data)}`);
        return true;
    } catch (err) {
        const status = err.response?.status;
        const data = err.response?.data;
        if (status) {
            console.log(`   ⚠️  HTTP ${status}: ${JSON.stringify(data)}`);
        } else {
            console.error(`   ❌  Connection failed: ${err.message}`);
            console.log('      Is the server running?  (node server.js)');
        }
        return false;
    }
}

// ── Smoke Test: /api/exit/execute (validates input parsing, no wallet needed) ──

async function testExitValidation() {
    console.log('\n🔍 Testing /api/exit/execute input validation (no wallet required)...');

    const testCases = [
        {
            label: 'missing tokenIn',
            body: { tokenOut: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', amountIn: '1000' },
            expectHttp: 400,
            expectError: true
        },
        {
            label: 'invalid tokenIn address',
            body: { tokenIn: 'bad', tokenOut: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', amountIn: '1000' },
            expectHttp: 400,
            expectError: true
        },
        {
            label: 'negative amountIn',
            body: {
                tokenIn: '0x4200000000000000000000000000000000000006',
                tokenOut: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
                amountIn: -100
            },
            expectError: true
        },
        {
            label: 'SERVER_PRIVATE_KEY missing (expected 503)',
            body: {
                tokenIn: '0x4200000000000000000000000000000000000006',
                tokenOut: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
                amountIn: '1000'
            },
            expectError: true
        }
    ];

    let passed = 0;

    for (const tc of testCases) {
        try {
            const res = await axios.post(`${BASE_URL}/api/exit/execute`, tc.body);
            const gotError = !res.data.success;
            if (tc.expectError && gotError) {
                console.log(`   ✅  [${tc.label}] correctly rejected: ${res.data.error?.code || res.data.error?.message}`);
                passed++;
            } else if (!tc.expectError && !gotError) {
                console.log(`   ✅  [${tc.label}] accepted`);
                passed++;
            } else {
                console.log(`   ⚠️  [${tc.label}] unexpected outcome — HTTP ${res.status}, success=${res.data.success}`);
            }
        } catch (err) {
            const status = err.response?.status;
            const data = err.response?.data;
            if (status && data) {
                const gotError = !data.success;
                if (tc.expectError && gotError) {
                    console.log(`   ✅  [${tc.label}] correctly rejected (HTTP ${status}): ${data.error?.code || data.error?.message}`);
                    passed++;
                } else {
                    console.log(`   ⚠️  [${tc.label}] HTTP ${status}: ${JSON.stringify(data)}`);
                }
            } else {
                console.error(`   ❌  [${tc.label}] Connection failed: ${err.message}`);
            }
        }
    }

    console.log(`\n   Validation tests: ${passed}/${testCases.length} passed`);
    return passed === testCases.length;
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
    console.log('═══════════════════════════════════════════════════════');
    console.log('  TRADE ARENA — SMOKE TEST');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`  Base URL: ${BASE_URL}`);

    const healthOk = await testHealth();
    const validationOk = await testExitValidation();

    console.log('\n═══════════════════════════════════════════════════════');
    if (healthOk && validationOk) {
        console.log('  ✅  ALL CHECKS PASSED');
    } else {
        console.log('  ⚠️  SOME CHECKS FAILED — see above for details');
    }
    console.log('═══════════════════════════════════════════════════════');

    /* ── CURL COMMANDS (manual testing) ──────────────────────────────────
       These work with a live server at http://localhost:3001

       Health check:
         curl http://localhost:3001/api/health

       Exit execute (no wallet → 503, validates input):
         curl -X POST http://localhost:3001/api/exit/execute \
           -H "Content-Type: application/json" \
           -d '{"tokenIn":"0x4200000000000000000000000000000000000006","tokenOut":"0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913","amountIn":"1000"}'

       Invalid tokenIn (400):
         curl -X POST http://localhost:3001/api/exit/execute \
           -H "Content-Type: application/json" \
           -d '{"tokenIn":"bad","tokenOut":"0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913","amountIn":"1000"}'

       Missing amountIn (400):
         curl -X POST http://localhost:3001/api/exit/execute \
           -H "Content-Type: application/json" \
           -d '{"tokenIn":"0x4200000000000000000000000000000000000006","tokenOut":"0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"}'
    ─────────────────────────────────────────────────────────────────── */

    process.exit(healthOk && validationOk ? 0 : 1);
}

main().catch(err => {
    console.error('Smoke test crashed:', err.message);
    process.exit(1);
});