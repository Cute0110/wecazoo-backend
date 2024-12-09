const Joi = require("joi");
const db = require("../models");
const User = db.user;
const { errorHandler, validateSchema } = require("../utils/helper");
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
const config = require("../config/main");
const apiController = require("./apiController");
const { eot, dot } = require('../utils/cryptoUtils');
const { Op } = require("sequelize");

exports.register = async (req, res) => {
    try {
        const { emailAddress, password } = dot(req.body);
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

        if (!validateSchema(res, dot(req.body), schema)) {
            return;
        }

        const user = await User.findOne({ where: { emailAddress } });
        if (user) {
            return res.json(eot({
                status: 0,
                msg: "Email already exist!",
            }));
        }

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const newUser = await User.create({ emailAddress, password: hashedPassword, ipAddress });

        const userCode = "wecazoo_" + newUser.id + emailAddress.split("")[0] + password.split("")[0] + Math.floor(Math.random() * 1000);
        await User.update({ userCode, userName: userCode }, { where: { id: newUser.id } })

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

        const result = await bcrypt.compare(password, user.password);
        if (!result) {
            return res.json(eot({
                status: 0,
                msg: "Password is incorrect!",
            }));
        }

        // const nexusUser = await apiController.apiGetUserBalance(user.userCode);

        // if (nexusUser.data.status == 0) {
        //     return res.json(eot({
        //         status: 0,
        //         msg: "Login Failed!",
        //     }));
        // }

        const userData = { emailAddress: user.emailAddress, userCode: user.userCode, userName: user.userName, balance: user.balance, avatarURL: user.avatarURL };

        const token = jwt.sign({ userId: user.id, username: user.username }, config.SECRET_KEY, { expiresIn: '1d' });
        return res.json(eot({ status: 1, msg: "Login success!", token, userData }));
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
        // const nexusUser = await apiController.apiGetUserBalance(user.userCode);

        // if (nexusUser.data.status == 0) {
        //     return res.status(401).json({ msg: 'Connection Failed!' });
        // }

        const userData = { emailAddress: user.emailAddress, userCode: user.userCode, userName: user.userName, balance: user.balance, avatarURL: user.avatarURL };

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
        });

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

        const user = await User.update({balance: newBalance}, {where: {id}})

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

        const user = await User.update({status}, {where: {id}})

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

        const user = await User.destroy({where: {id}})

        return res.json(eot({
            status: 1,
            msg: "success"
        }));
    } catch (error) {
        return errorHandler(res, error);
    }
};

