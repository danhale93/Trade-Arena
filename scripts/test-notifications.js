/**
 * Test script for Discord and Telegram notifications
 * Verifies that webhooks and bot tokens are correctly configured.
 */

import axios from 'axios';
import 'dotenv/config';

const config = {
    discordUrl: process.env.DISCORD_WEBHOOK_URL,
    tgToken: process.env.TELEGRAM_BOT_TOKEN,
    tgChatId: process.env.TELEGRAM_CHAT_ID
};

async function testDiscord() {
    if (!config.discordUrl) {
        console.log('⚪ Discord URL not set, skipping...');
        return;
    }
    try {
        await axios.post(config.discordUrl, {
            embeds: [{
                title: "🔔 Notification Test",
                description: "This is a test message from your Trade-Arena Arbitrage Bot.",
                color: 3447003,
                timestamp: new Date().toISOString()
            }]
        });
        console.log('✅ Discord test sent!');
    } catch (err) {
        console.error('❌ Discord test failed:', err.message);
    }
}

async function testTelegram() {
    if (!config.tgToken || !config.tgChatId) {
        console.log('⚪ Telegram credentials not set, skipping...');
        return;
    }
    try {
        const url = `https://api.telegram.org/bot${config.tgToken}/sendMessage`;
        await axios.post(url, {
            chat_id: config.tgChatId,
            text: "🔔 *Notification Test*\nThis is a test message from your Trade-Arena Arbitrage Bot.",
            parse_mode: 'Markdown'
        });
        console.log('✅ Telegram test sent!');
    } catch (err) {
        console.error('❌ Telegram test failed:', err.message);
    }
}

async function run() {
    console.log('🧪 Starting notification tests...');
    await testDiscord();
    await testTelegram();
    console.log('🏁 Tests complete.');
}

run();
