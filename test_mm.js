const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

async function test() {
    try {
        const mmScript = './node_modules/@metamask/agent-wallet/dist/index.js';
        const mmToken = process.env.MM_CLI_TOKEN || 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjZiMjgwZGQzLTQ0ZjUtNDJmYi1hM2ZjLTA3YTI4MzBiZjJiZCIsInR5cCI6IkpXVCJ9.eyJhdWQiOlsiY2xpIl0sImNsaWVudF9pZCI6ImNsaS1hZ2VudC1jbGllbnQiLCJjdWJlc2lnbmVyX3Njb3BlX2NlaWxpbmciOlsibWFuYWdlOmtleTpnZXQiLCJtYW5hZ2U6a2V5Omxpc3QiLCJtYW5hZ2U6a2V5OnVwZGF0ZTptZXRhZGF0YSIsIm1hbmFnZTprZXk6dXBkYXRlOnBvbGljeSIsInNpZ246KiJdLCJleHAiOjE3ODY2NDQxNjUsImV4dCI6eyJhbXIiOiJxci1tb2JpbGUiLCJjdWJlc2lnbmVyX3Njb3BlX2NlaWxpbmciOlsibWFuYWdlOmtleTpnZXQiLCJtYW5hZ2U6a2V5Omxpc3QiLCJtYW5hZ2U6a2V5OnVwZGF0ZTptZXRhZGF0YSIsIm1hbmFnZTprZXk6dXBkYXRlOnBvbGljeSIsInNpZ246KiJdLCJlbWFpbCI6ImRhbmhhbGU5M0BnbWFpbC5jb20iLCJ3M2Ffc3ViIjoidGtleS1nb29nbGU6ZGFuaGFsZTkzQGdtYWlsLmNvbSJ9LCJpYXQiOjE3ODY2NDA1NjQsImlzcyI6Imh0dHBzOi8vb2lkYy5hcGkuY3gubWV0YW1hc2suaW8iLCJqdGkiOiIyMDBmZGU5YS03YThiLTRkM2MtOTAxNy04NmI4MzY3MjBhMmYiLCJuYmYiOjE3ODY2NDA1NjQsInNjcCI6WyJvcGVuaWQiLCJvZmZsaW5lX2FjY2VzcyJdLCJzdWIiOiJCSG9uaXdPN25iYUlQVHpBYzM0UmN1UnhZNDF0LUFBby1qcHhSbWdfRVN4MGNOajJaTnhnX29PRnk3dGlacnZZeVZENENPZWFORFNuVTdKMUpPc2RrNmsifQ.YcHsSZZSe7NKamxux8cB0k2UYajK0elH6LP80BJwT2FjURwHD8_E-jP2zGRxGeQ21m0Zyh_xi_dSraCWx0ZyklmOvhkTHdlRpNm_d5HabsoCU58dUZoyR7nwDGk7BLReE2FogJpRWKW18ysMshGWk6dRXygAXzCguXRpcDu0FvaRL2yevmVA-xtO7CDP4mMdJ3RBomP3cskfx2v1VSRPCBlHxGWoUtrQHBGHxj-aKGXVit_JR5hPehjgalhjx4o-I6Lv27HT8QvtrSC9B_zbF5SSC_gXs7eMKmvT4NkbkO1WLcJC457iYRMuGIEdWbhZdskuHEdAhmMUw994LtwHwjkozbUFFaV0jvqUjzp1iTqPNr_5H2xNyguvxoReKFkqWCEP2sTH-3zLC9ZbocBql-hg_K2rOiIevJtRxeS7W1EZzk4_DMeulIljJ29CWWTrT7yl7Y1m5W18hrFV83C1sgYAE7Pze9T3JDrYkykg1KFKI-H83BkzWd9IsGvfmTkg4hZghrXrilQ29WRoyxT-w03dc3xId18U-0BZyIZmCcJtXFbGIWsVdCageC1yQ2tVlE3aUvEfJXMiJJGhci8n0mFlbw9JdzfOq-dolKcHGgqfzl6GVAIZjJGszJfTGNZ4P7oCM9vB1r1YlsD54sw8qCE2qCVVoP5dU-LKo2rqB0o:ory_rt_y4Jb9oOKCzczek6DdnmpWSkGEVbUT4PJe_8y7k3_FYU.aexl5LLGFj91ex9-jftnMsuPvf_8fbWkQradS2pRbUY:0';
        
        const fullCmd = `node ${mmScript} wallet balance --chain base --json --token "${mmToken}"`;
        const { stdout } = await execPromise(fullCmd);
        console.log('SUCCESS:', JSON.parse(stdout));
    } catch (e) {
        console.error('ERROR:', e.message, e.stdout || e.stderr);
    }
}
test();
