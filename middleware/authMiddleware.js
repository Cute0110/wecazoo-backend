const db = require("../models");
const User = db.user;
const jwt = require('jsonwebtoken');
const config = require("../config/main");

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
            return next();
        } catch (err) {
            return res.status(401).json(eot({ status: 0, msg: 'Invalid or expired token' }));
        }
    } catch (error) {
        return errorHandler(res, error);
    }
};

// var adminAuthenticate = (req, res, next) => {
//   var token = req.header("x-admin-auth");
//   getAdminByToken(token)
//     .then((result) => {
//       if (result) {
//         next();
//       } else {
//         return res.status(HttpStatusCodes.SESSION_EXPIRED).send({
//           result: false,
//           message: "Session expired. Please login again!",
//         });
//       }
//     })
//     .catch((e) => {
//       return res.status(HttpStatusCodes.UNAUTHORIZED).send({
//         result: false,
//         message: "Unauthorized. Please provide x-auth key in request header!",
//       });
//     });
// };

module.exports = { authenticate };