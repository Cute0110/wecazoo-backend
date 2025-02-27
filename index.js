const express = require("express");
const cors = require("cors");
const http = require('http');
const bodyParser = require("body-parser");
const helmet = require("helmet");
const crypto = require("crypto");
require('dotenv').config();
const { initializeSocket } = require('./socketServer');

const app = express();
const server = http.createServer(app);
const database = require("./models");
const baseRouter = require("./router/baseRouter");
const apiRouter = require("./router/apiRouter");
const config = require("./config/main");

// CORS configuration
app.use(cors({
    origin: "https://wecazoo.com",
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const generateNonce = () => {
    return crypto.randomBytes(16).toString('base64');
};

app.use((req, res, next) => {
    const nonce = generateNonce();

    app.use(
        helmet.contentSecurityPolicy({
            directives: {
                defaultSrc: ["'self'"],
                frameSrc: ["'self'", "https://*.your-payment-domain.com"],
                scriptSrc: [
                    "'self'",
                    `'nonce-${nonce}'`,
                ],
                styleSrc: ["'self'", "'unsafe-inline'"],
                connectSrc: ["'self'",
                    "http://localhost:3000",
                    "ws://localhost:5000",
                    "wss://localhost:5000",
                    "https://*.your-payment-domain.com"
                ],
                imgSrc: ["'self'", "data:", "https:"],
                fontSrc: ["'self'"],
                objectSrc: ["'none'"],
                mediaSrc: ["'self'"],
                frameAncestors: ["'self'"],
            },
            reportOnly: process.env.NODE_ENV === 'development'
        })
    );

    res.locals.cspNonce = nonce;
    next();
});

// Initialize Socket.IO after middleware setup
initializeSocket(server);

// Routes
app.use("/api", baseRouter);
app.use("/gold_api", apiRouter);

// Start server using the HTTP server instance
server.listen(config.port, () => {
    console.log(`Server is running on port ${config.port}`);
    database.sync();
});

// Handle server errors
server.on('error', (error) => {
    console.error('Server error:', error);
});

// Handle process termination
process.on('SIGTERM', () => {
    server.close(() => {
        console.log('Server terminated');
        process.exit(0);
    });
});