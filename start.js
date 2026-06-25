const { spawn } = require('child_process');

console.log('[Start] Booting Trade Arena server...');

const server = spawn('node', ['server.js'], { stdio: 'inherit' });

server.on('error', (err) => console.error('[Start] Server failed:', err));

process.on('SIGINT', () => {
  server.kill();
  process.exit();
});
