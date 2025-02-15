const Joi = require("joi");
const db = require("../models");
const User = db.user;
const UserBetInfo = db.userBetInfo;
const Influencer = db.influencer;
const UserBalanceHistory = db.userBalanceHistory;
const { errorHandler, validateSchema } = require("../utils/helper");
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
const config = require("../config/main");
const apiController = require("./apiController");
const { eot, dot } = require('../utils/cryptoUtils');
const Sequelize = require("sequelize");
const { Op } = require("sequelize");

exports.register = async (req, res) => {
    try {
        const { emailAddress, password, promoCode } = dot(req.body);
        let ipAddress = "127.0.0.1";
        const schema = Joi.object().keys({
            emailAddress: Joi.string().required(),
            password: Joi.string().required(),
        });

        if (req.headers["host"].startsWith("localhost")) {
            ipAddress = "localhost";
        } else {
            ipAddress = req.headers["x-forwarded-for"].split(",")[0];
        }

        // if (!validateSchema(res, dot(req.body), schema)) {
        //     return;
        // }

        const user = await User.findOne({ where: { emailAddress } });
        if (user) {
            return res.json(eot({
                status: 0,
                msg: "Email already exist!",
            }));
        }
        const influencer = await Influencer.findOne({ where: { promoCode } });

        let influencerId = 0;
        if (influencer) {
            influencerId = influencer.id;
            await Influencer.update({ usersCount: influencer.usersCount + 1 }, { where: { id: influencer.id } });
        }

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const newUser = await User.create({ emailAddress, password: hashedPassword, ipAddress, influencerId });

        const userCode = "wecazoo_" + newUser.id + emailAddress.split("")[0] + password.split("")[0] + Math.floor(Math.random() * 1000);
        await User.update({ userCode, userName: userCode }, { where: { id: newUser.id } })

        await UserBetInfo.create({ userId: newUser.id });

        // const nexusUser = await apiController.createApiUser(userCode);

        // if (nexusUser.data.status == 0) {
        //     return res.json(eot({
        //         status: 0,
        //         msg: "Can't register!",
        //     }));
        // }

        return res.json(eot({
            status: 1,
            msg: "Register success!",
            result: newUser,
        }));
    } catch (error) {
        return errorHandler(res, error);
    }
};

exports.login = async (req, res) => {
    try {
        const { emailAddress, password } = dot(req.body);
        const user = await User.findOne({ where: { emailAddress } });

        if (!user) {
            return res.json(eot({
                status: 0,
                msg: "Email does not exist!",
            }))
        }

        if (user.status == 0) {
            return res.json(eot({
                status: 0,
                msg: "You were blocked by admin!",
            }))
        }

        const result = await bcrypt.compare(password, user.password);
        if (!result) {
            return res.json(eot({
                status: 0,
                msg: "Password is incorrect!",
            }));
        }

        const betInfo = await UserBetInfo.findOne({ where: { userId: user.id } });

        let totalBet = 0;
        let totalWin = 0;
        let unlockedBalance = 0;

        if (betInfo) {
            totalBet = betInfo.totalBet;
            totalWin = betInfo.totalWin;
            unlockedBalance = betInfo.unlockedBalance;
        }
        const userData = {
            id: user.id,
            emailAddress: user.emailAddress,
            userCode: user.userCode,
            userName: user.userName,
            balance: user.balance,
            lockedBalance: user.lockedBalance,
            totalBet,
            totalWin,
            unlockedBalance,
            avatarURL: user.avatarURL
        };

        const token = jwt.sign({ userId: user.id, username: user.username }, config.SECRET_KEY, { expiresIn: '1d' });
        return res.json(eot({ status: 1, msg: "Login success!", token, userData }));
    } catch (error) {
        return errorHandler(res, error);
    }
};

exports.changeUserPassword = async (req, res) => {
    try {
        const { userId, currentPassword, newPassword } = dot(req.body);

        // Find user
        const user = await User.findOne({ where: { id: userId } });
        if (!user) {
            return res.json(eot({
                status: 0,
                msg: "User not found"
            }));
        }

        // Verify current password
        const isValid = await bcrypt.compare(currentPassword, user.password);
        if (!isValid) {
            return res.json(eot({
                status: 0,
                msg: "Current password is incorrect"
            }));
        }

        // Hash and update new password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

        await User.update(
            { password: hashedPassword },
            { where: { id: userId } }
        );

        return res.json(eot({
            status: 1,
            msg: "Password updated successfully"
        }));
    } catch (error) {
        return errorHandler(res, error);
    }
};

exports.resetUserPassword = async (req, res) => {
    try {
        const { userId } = dot(req.body);

        // Find user
        const user = await User.findOne({ where: { id: userId } });
        if (!user) {
            return res.json(eot({
                status: 0,
                msg: "User not found"
            }));
        }

        // Hash and update new password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash("123456", saltRounds);

        await User.update(
            { password: hashedPassword },
            { where: { id: userId } }
        );

        return res.json(eot({
            status: 1,
            msg: "Password updated successfully"
        }));
    } catch (error) {
        return errorHandler(res, error);
    }
};

exports.checkSession = async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.json(eot({ status: 0, msg: 'No token provided' }));
        }

        const token = authHeader;
        const decoded = jwt.verify(token, config.SECRET_KEY);

        const user = await User.findOne({ where: { id: decoded.userId } });

        if (!user) {
            return res.json(eot({ status: 0, msg: 'Invalid or expired token' }));
        }
        if (user.status == 0) {
            return res.json(eot({
                status: 0,
                msg: "You were blocked by admin!",
            }))
        }
        const betInfo = await UserBetInfo.findOne({ where: { userId: decoded.userId } });

        let totalBet = 0;
        let totalWin = 0;
        let unlockedBalance = 0;

        if (betInfo) {
            totalBet = betInfo.totalBet;
            totalWin = betInfo.totalWin;
            unlockedBalance = betInfo.unlockedBalance;
        }

        const userData = {
            id: user.id,
            emailAddress: user.emailAddress,
            userCode: user.userCode,
            userName: user.userName,
            balance: user.balance,
            lockedBalance: user.lockedBalance,
            totalBet,
            totalWin,
            unlockedBalance,
            avatarURL: user.avatarURL
        };

        return res.json(eot({ status: 1, msg: 'Access granted', userData }));
    } catch (error) {
        return errorHandler(res, error);
    }
};

exports.getAllUsers = async (req, res) => {
    try {
        const { start, length, search, order, dir } = dot(req.body);

        let query = {};

        if (search && search.trim() !== "") {
            query = {
                [Op.or]: [
                    { userCode: { [Op.substring]: search } },
                    { emailAddress: { [Op.substring]: search } }
                ],
            };
        }

        query = {
            [Op.and]: [
                query,
                { userCode: { [Op.notIn]: [config.admin1, config.admin2] } }
            ]
        };

        const data = await User.findAndCountAll({
            where: query,
            offset: Number(start),
            limit: Number(length),
            order: [
                [order, dir],
            ],
            include: [
                {
                    model: db.influencer,
                    as: 'influencer',
                    attributes: [],
                },
            ],
            attributes: {
                include: [
                    [Sequelize.col('influencer.name'), 'influencerName'],
                ],
            },
            raw: true,
            nest: true,
        });

        console.log(data.rows);

        return res.json(eot({
            status: 1,
            data: data.rows,
            length: Number(length),
            start: Number(start),
            totalCount: data.count,
        }));
    } catch (error) {
        return errorHandler(res, error);
    }
};

exports.userTransaction = async (req, res) => {
    try {
        const { id, newBalance, amount, chargeType } = dot(req.body);

        const userPrevBalance = (chargeType == 0 ? newBalance + amount : newBalance - amount);

        const user = await User.update({ balance: newBalance }, { where: { id } })

        await UserBalanceHistory.create({
            userId: id, type: chargeType == 0 ? "Manager | WithDraw" : "Manager | Deposit",
            userPrevBalance,
            userAfterBalance: newBalance,
            sentAmount: amount,
            receivedAmount: amount,
            status: "Finished"
        });

        return res.json(eot({
            status: 1,
            msg: "success"
        }));
    } catch (error) {
        return errorHandler(res, error);
    }
};

exports.userStatusChange = async (req, res) => {
    try {
        const { id, status } = dot(req.body);

        const user = await User.update({ status }, { where: { id } })

        return res.json(eot({
            status: 1,
            msg: "success"
        }));
    } catch (error) {
        return errorHandler(res, error);
    }
};

exports.userNameChange = async (req, res) => {
    try {
        const { id, userName } = dot(req.body);

        const user = await User.update({ userName }, { where: { id } })

        return res.json(eot({
            status: 1,
            msg: "success"
        }));
    } catch (error) {
        return errorHandler(res, error);
    }
};

exports.onGetBonus = async (req, res) => {
    try {
        const { id, amount } = dot(req.body);

        const user = await User.findOne({ where: { id } });
        const betInfo = await UserBetInfo.findOne({ where: { userId: id } });

        if (amount > betInfo.unlockedBalance) {
            return res.json(eot({
                status: 2,
                msg: "You already got bonus!",
            }));
        }

        if (!user || !betInfo) {
            return res.json(eot({
                status: 0,
                msg: "Invalid User"
            }));
        }

        await User.update({ balance: user.balance + amount }, { where: { id } });
        await UserBetInfo.update({ unlockedBalance: 0 }, { where: { id: betInfo.id } });

        return res.json(eot({
            status: 1,
            msg: "success"
        }));
    } catch (error) {
        return errorHandler(res, error);
    }
};

exports.userDelete = async (req, res) => {
    try {
        const { id } = dot(req.body);

        const user = await User.destroy({ where: { id } })

        return res.json(eot({
            status: 1,
            msg: "success"
        }));
    } catch (error) {
        return errorHandler(res, error);
    }
};

