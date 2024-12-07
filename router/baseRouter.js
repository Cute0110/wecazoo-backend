const express = require("express");
const router = express.Router();
const config = require("../config/main");

// controllers
const userController = require("../controllers/userController");
const apiController = require("../controllers/apiController");
const paymentController = require("../controllers/paymentController");
const { authenticate } = require("../middleware/authMiddleware");

// const checkIp = async (req, res, next) => {
//     if (req.headers["host"].startsWith("localhost")) {
//         return next();
//     }

//     try {
//         const ipAddress = req.headers["x-forwarded-for"].split(",")[0];
//         if (!config.ACCESS_IPS.includes(ipAddress)) {
//             console.log("[Black IP]", ipAddress);
//             return res.status(403).send();
//         }

//         next();
//     } catch (e) {
//         console.log("[Check IP Error]", e.message);
//         return res.status(403).send();
//     }
// }

// routes

router.post("/login", userController.login);
router.post("/register", userController.register);

router.get("/check_session", userController.checkSession);

router.post("/depositPaymentCallback", paymentController.handleDepositCallback);

router.post("/provider_list", apiController.apiGetProviderList);
router.post("/game_list", authenticate, apiController.apiGetGameList);
router.post("/slot_game_launch", authenticate, apiController.apiSlotGameLaunch);
router.post("/live_game_launch", authenticate, apiController.apiLiveGameLaunch);

router.post("/get_all_users", authenticate, userController.getAllUsers);
router.post("/user_transaction", authenticate, userController.userTransaction);
router.post("/user_delete", authenticate, userController.userDelete);
router.post("/user_status_change", authenticate, userController.userStatusChange);

router.post("/createInvoice", authenticate, paymentController.createInvoice);
router.post("/withdraw", authenticate, paymentController.withdraw);

module.exports = router;
