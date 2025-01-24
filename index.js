const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const helmet = require("helmet");
const crypto = require("crypto");
require('dotenv').config();

const app = express();
const database = require("./models");
const baseRouter = require("./router/baseRouter");
const apiRouter = require("./router/apiRouter");
const config = require("./config/main");

app.use(cors({ origin: "https://wecazoo.com", credentials: true }));
// app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const generateNonce = () => {
    return crypto.randomBytes(16).toString('base64');
};

app.use((req, res, next) => {
    // Generate unique nonce for each request
    const nonce = generateNonce();

    // Apply CSP using helmet
    app.use(
        helmet.contentSecurityPolicy({
            directives: {
                defaultSrc: ["'self'"],
                frameSrc: ["'self'", "https://*.your-payment-domain.com"],
                scriptSrc: [
                    "'self'",
                    `'nonce-${nonce}'`,
                    // Add any other trusted script sources
                ],
                styleSrc: ["'self'", "'unsafe-inline'"],
                connectSrc: ["'self'", "https://*.your-payment-domain.com"],
                imgSrc: ["'self'", "data:", "https:"],
                fontSrc: ["'self'"],
                objectSrc: ["'none'"],
                mediaSrc: ["'self'"],
                // Add frame-ancestors if needed
                frameAncestors: ["'self'"],
                // Add report-uri if you want to collect violation reports
                // reportUri: '/report-violation',
            },
            // Set to true in development to see errors in console
            reportOnly: process.env.NODE_ENV === 'development'
        })
    );

    // Make nonce available to your views
    res.locals.cspNonce = nonce;
    next();
});

app.use("/api", baseRouter);
app.use("/gold_api", apiRouter);

app.listen(config.port, () => {
    console.log(`Server is running on port ${config.port}`);

    database.sync();
});
