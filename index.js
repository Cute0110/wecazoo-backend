const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
require('dotenv').config();

const app = express();
const database = require("./models");
const baseRouter = require("./router/baseRouter");
const apiRouter = require("./router/apiRouter");
const config = require("./config/main");

app.use(cors({ origin: "https://wecazoo.com", credentials: true }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use("/api", baseRouter);
app.use("/gold_api", apiRouter);

app.listen(config.port, () => {
    console.log(`Server is running on port ${config.port}`);

    database.sync();
});
