# Deployment Configuration
# For hosting Trade Arena on Vercel, Heroku, or custom server

# Vercel Configuration (vercel.json)
{
  "version": 2,
  "buildCommand": "npm install",
  "outputDirectory": ".",
  "env": {
    "RPC_URL": "@rpc_url",
    "NETWORK": "base",
    "PORT": 3001
  },
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/server.js"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}

# --- OR --- 

# Heroku Configuration (Procfile)
web: node server.js

# ---

# Docker Configuration (Dockerfile)
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3001

CMD ["node", "server.js"]

# Docker Compose (docker-compose.yml)
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3001:3001"
    environment:
      - RPC_URL=https://mainnet.base.org
      - NODE_ENV=production
      - PORT=3001
    restart: unless-stopped

# GitHub Pages Configuration (for frontend only)
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: .
          cname: tradearena.com  # Your domain

# Nginx Configuration (for serving)
server {
    listen 80;
    server_name tradearena.com www.tradearena.com;
    
    location / {
        root /var/www/tradearena;
        try_files $uri $uri/ /index.html;
        index index.html index.htm;
    }
    
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    # SSL certificate
    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/tradearena.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tradearena.com/privkey.pem;
}

# Environment Variables for Production
PRODUCTION_ENV=true
RPC_URL=https://mainnet.base.org
NETWORK=base
NODE_ENV=production
PORT=3001
LOG_LEVEL=info
MAX_BOTS=100
MAX_LEVERAGE=50
ENABLE_REAL_TRADING=true
RATE_LIMIT=100

# API Rate Limiting Middleware
function rateLimit(req, res, next) {
    const limit = 100; // requests per minute
    const ip = req.ip;
    const now = Date.now();
    
    if (!rateLimitStore[ip]) {
        rateLimitStore[ip] = { count: 0, resetTime: now + 60000 };
    }
    
    const store = rateLimitStore[ip];
    if (now > store.resetTime) {
        store.count = 0;
        store.resetTime = now + 60000;
    }
    
    store.count++;
    res.set('X-RateLimit-Limit', limit);
    res.set('X-RateLimit-Remaining', Math.max(0, limit - store.count));
    
    if (store.count > limit) {
        return res.status(429).json({ error: 'Rate limit exceeded' });
    }
    
    next();
}

# CORS Configuration for Production
const corsOptions = {
    origin: [
        'https://tradearena.com',
        'https://www.tradearena.com',
        'https://app.tradearena.com'
    ],
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

# SSL/TLS Configuration
const https = require('https');
const fs = require('fs');

const options = {
    key: fs.readFileSync('./ssl/private-key.pem'),
    cert: fs.readFileSync('./ssl/certificate.pem')
};

https.createServer(options, app).listen(3001, () => {
    console.log('🔒 HTTPS Server running on port 3001');
});
