const express = require("express");
const router = express.Router();
const config = require("../config/main");

// controllers
const userController = require("../controllers/userController");
const influencerController = require("../controllers/influencerController");
const gameController = require("../controllers/gameController");
const providerController = require("../controllers/providerController");
const apiController = require("../controllers/apiController");
const paymentController = require("../controllers/paymentController");
const vipController = require("../controllers/vipController");
const { authenticate, adminAuthenticate } = require("../middleware/authMiddleware");

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
router.get("/admin_check_session", adminAuthenticate, userController.checkSession);

router.post("/depositPaymentCallback", paymentController.handleDepositCallback);

// router.post("/slot_game_launch", authenticate, apiController.apiSlotGameLaunch);
// router.post("/live_game_launch", authenticate, apiController.apiLiveGameLaunch);

router.post("/createInvoice", authenticate, paymentController.createInvoice);
router.post("/withdraw", authenticate, paymentController.withdraw);
router.post("/get_bonus", authenticate, userController.onGetBonus);

//Admin actions
//influencers
router.post("/get_all_influencers", adminAuthenticate, influencerController.getAllInfluencers);
router.post("/influencer_create", adminAuthenticate, influencerController.onCreate);
router.post("/influencer_delete", adminAuthenticate, influencerController.onDelete);
router.post("/influencer_status_change", adminAuthenticate, influencerController.onStatusChange);
router.post("/influencer_transaction", adminAuthenticate, influencerController.onTransaction);

router.post("/provider_list", providerController.getAllProviders);

//Games
router.post("/game_list", gameController.getAllGames);
router.post("/game_launch", authenticate, gameController.onGameLaunch)
router.post("/provider_status_change", adminAuthenticate, gameController.onStatusChange);
router.post("/provider_original_status_change", adminAuthenticate, gameController.onOriginalStatusChange);

//users
router.post("/get_all_users", adminAuthenticate, userController.getAllUsers);
router.post("/user_transaction", adminAuthenticate, userController.userTransaction);
router.post("/user_delete", adminAuthenticate, userController.userDelete);
router.post("/user_status_change", adminAuthenticate, userController.userStatusChange);
router.post("/reset_password", adminAuthenticate, userController.resetUserPassword);
router.post("/user_name_change", authenticate, userController.userNameChange);
router.post("/change_password", authenticate, userController.changeUserPassword);

//vip
router.get("/vip/status", authenticate, vipController.getUserVipStatus);

// Get all VIP levels
router.get("/vip/levels", authenticate, vipController.getAllVipLevels);

// Get users by VIP level
router.post("/vip/users-by-level", authenticate, vipController.getUsersByVipLevel);

// Update user's VIP status (when they place a bet)
router.post("/vip/update-status", authenticate, vipController.updateUserVipStatus);

//transactions

router.post("/get_deposit_histories", adminAuthenticate, paymentController.getAllDepositHistory);
router.post("/get_withdraw_histories", adminAuthenticate, paymentController.getAllWithdrawHistory);
router.post("/withdraw_confirm", adminAuthenticate, paymentController.onWithdrawConfirm);

module.exports = router;
