const { spawn } = require('child_process');

console.log('[Start] Booting Trade Arena Production Services...');

const proxy = spawn('node', ['proxy.js'], { stdio: 'inherit' });
const server = spawn('node', ['server.js'], { stdio: 'inherit' });

proxy.on('error', (err) => console.error('[Start] Proxy failed:', err));
server.on('error', (err) => console.error('[Start] Server failed:', err));

process.on('SIGINT', () => {
  proxy.kill();
  server.kill();
  process.exit();
});
