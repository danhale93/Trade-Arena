const fs = require('fs');
const path = require('path');

const USERS_FILE = path.join(__dirname, 'users.json');

function loadUsers() {
    try {
        if (fs.existsSync(USERS_FILE)) {
            const data = fs.readFileSync(USERS_FILE, 'utf8');
            const users = JSON.parse(data);
            // Sentinel: Return a prototype-less object to prevent prototype pollution lookups
            return Object.assign(Object.create(null), users);
        }
    } catch (e) {
        console.error('Error loading users:', e);
    }
    return Object.create(null);
}

function saveUsers(users) {
    try {
        fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    } catch (e) {
        console.error('Error saving users:', e);
    }
}

module.exports = {
    loadUsers,
    saveUsers
};
