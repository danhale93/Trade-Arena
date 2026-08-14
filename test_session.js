const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

async function test() {
    try {
        const mmPath = './node_modules/.bin/mm';
        const mmToken = process.env.MM_CLI_TOKEN;
        
        console.log('Logging out...');
        await execPromise(`${mmPath} logout --yes`);
        console.log('Logging in with token...');
        await execPromise(`${mmPath} login --token "${mmToken}"`);
        console.log('Fetching balance...');
        const { stdout } = await execPromise(`${mmPath} wallet balance --chain base --json`);
        console.log('SUCCESS:', JSON.parse(stdout));
    } catch (e) {
        console.error('ERROR:', e.message, e.stdout || e.stderr);
    }
}
test();
