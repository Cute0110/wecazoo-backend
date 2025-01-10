const db = require("../models");
const User = db.user;
const jwt = require('jsonwebtoken');
const config = require("../config/main");
const { errorHandler } = require("../utils/helper");
const { eot, dot } = require('../utils/cryptoUtils');

// First we call the model using the above code.
// We pass in the token from the request header and see if we can get the
// User or not, if not then we return a 401 and if it works we pass next()
var authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) return res.status(401).json(eot({ status: 0, msg: 'No token provided' }));

        const token = authHeader;

        try {
            const decoded = jwt.verify(token, config.SECRET_KEY);

            const user = await User.findOne({ where: { id: decoded.userId } });

            if (!user) {
                return res.status(401).json(eot({ status: 0, msg: 'Invalid or expired token' }));
            }

            if (user.status == 0) {
                return res.json(eot({
                    status: 0,
                    msg: "You were blocked by admin!",
                }))
            }
            req.user = user;
            return next();
        } catch (err) {
            return res.status(401).json(eot({ status: 0, msg: 'Invalid or expired token' }));
        }
    } catch (error) {
        return errorHandler(res, error);
    }
};

var adminAuthenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) return res.status(401).json(eot({ status: 0, msg: 'No token provided' }));

        const token = authHeader;
        const decoded = jwt.verify(token, config.SECRET_KEY);

        const user = await User.findOne({ where: { id: decoded.userId } });

        if (!user) {
            return res.status(401).json(eot({ status: 0, msg: 'Invalid or expired token' }));
        }

        if (user.userCode != config.admin1 && user.userCode != config.admin2) {
            return res.status(401).json(eot({ status: 0, msg: 'Invalid admin' }));
        }
        return next();
    } catch (error) {
        return errorHandler(res, error);
    }
};

module.exports = { authenticate, adminAuthenticate };