const WebSocket = require('ws');

const ws = new WebSocket('wss://trade-arena-app.onrender.com');

ws.on('open', () => {
    console.log('Connected to Trade Arena WebSocket');
});

ws.on('message', (data) => {
    const message = JSON.parse(data);
    if (message.type === 'LOG_HISTORY') {
        console.log('--- LOG HISTORY ---');
        message.data.forEach(log => {
            console.log(`[${log.timestamp}] ${log.level}: ${log.message}`);
        });
        ws.close();
    } else if (message.type === 'SERVER_LOG') {
        console.log(`[${message.data.timestamp}] ${message.data.level}: ${message.data.message}`);
    }
});

ws.on('error', (err) => {
    console.error('WS Error:', err.message);
});

setTimeout(() => {
    console.log('Timeout reached, closing.');
    ws.close();
    process.exit(0);
}, 30000);
