const Joi = require("joi");
const db = require("../models");
const User = db.user;
const UserBalanceHistory = db.userBalanceHistory;
const Influencer = db.influencer;
const { errorHandler, validateSchema } = require("../utils/helper");
const { createInvoice } = require("../utils/cryptoPayment");
const { eot, dot } = require('../utils/cryptoUtils');
const config = require('../config/main');
const jwt = require('jsonwebtoken');
const { Op } = require("sequelize");
const crypto = require('crypto');

exports.createInvoice = async (req, res) => {
    try {
        const schema = Joi.object({
            price: Joi.number().required(),
            currency: Joi.string().required(),
        });

        if (!validateSchema(res, dot(req.body), schema)) {
            return;
        }

        const { price, currency } = dot(req.body);

        const authHeader = req.headers.authorization;
        if (!authHeader) return res.json(eot({ status: 0, msg: 'No token provided' }));

        const token = authHeader;
        const decoded = jwt.verify(token, config.SECRET_KEY);

        const user = await User.findOne({ where: { id: decoded.userId } });

        if (!user) {
            return res.json(eot({ status: 0, msg: 'Invalid user!' }));
        }

        const newUserBalanceHistory = await UserBalanceHistory.create({ userId: decoded.userId, userPrevBalance: user.balance, userAfterBalance: user.balance, sentAmount: price, type: "Deposit", status: "Waiting" });

        const invoiceData = {
            price,
            currency,
            id: newUserBalanceHistory.id,
        };

        const invoice = await createInvoice(invoiceData);
        if (invoice.status == 0) {
            UserBalanceHistory.update({ amount: price, status: "Failed" }, { where: { id: newUserBalanceHistory.id } });
            return res.json(eot({ status: 0, msg: "Deposit failed!" }));
        }
        return res.json(eot({ status: 1, url: invoice.data?.invoice_url }));
    } catch (error) {
        return errorHandler(res, error);
    }
};

exports.withdraw = async (req, res) => {
    try {
        const schema = Joi.object({
            amount: Joi.number().required(),
            address: Joi.string().required(),
            asset: Joi.string().required(),
        });

        if (!validateSchema(res, dot(req.body), schema)) {
            return;
        }
        const { amount, address, asset } = dot(req.body);

        const authHeader = req.headers.authorization;
        if (!authHeader) return res.json(eot({ status: 0, msg: 'No token provided' }));

        const token = authHeader;
        const decoded = jwt.verify(token, config.SECRET_KEY);
        const user = await User.findOne({ where: { id: decoded.userId } });

        if (!user) {
            return res.json(eot({ status: 0, msg: 'Invalid user!' }));
        }

        if (user.balance < amount) {
            return res.json(eot({
                status: 0,
                msg: "Balance is not enough!",
            }));
        }

        const newBalance = user.balance - amount;

        await UserBalanceHistory.create({ userId: decoded.userId, userPrevBalance: user.balance, userAfterBalance: newBalance, sentAmount: amount, type: "Withdraw", address, asset, status: "Waiting" });
        await User.update({ balance: newBalance }, { where: { id: user.id } });
        return res.json(eot({
            status: 1,
            balance: newBalance,
            msg: "Withdraw success!",
        }));
    } catch (error) {
        return errorHandler(res, error);
    }
}

exports.getAllDepositHistory = async (req, res) => {
    try {
        const { start, length, search, order, dir } = dot(req.body);

        let query = {};

        if (search && search.trim() !== "") {
            query = {
                [Op.or]: [
                    { name: { [Op.substring]: search } },
                    { promoCode: { [Op.substring]: search } }
                ],
            };
        }

        query = {
            ...query,
            type: { [Op.substring]: "Deposit" },
        }

        const data = await UserBalanceHistory.findAndCountAll({
            include: [{
                model: User,
                as: "user",
                attributes: ['id', 'userCode', 'userName', 'emailAddress'],
            }],
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

exports.getAllWithdrawHistory = async (req, res) => {
    try {
        const { start, length, search, order, dir } = dot(req.body);

        let query = {};

        if (search && search.trim() !== "") {
            query = {
                [Op.or]: [
                    { name: { [Op.substring]: search } },
                    { promoCode: { [Op.substring]: search } }
                ],
            };
        }

        query = {
            ...query,
            type: { [Op.substring]: "Withdraw" },
        }

        const data = await UserBalanceHistory.findAndCountAll({
            include: [{
                model: User,
                as: "user",
                attributes: ['id', 'userCode', 'userName', 'emailAddress'],
            }],
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


exports.onWithdrawConfirm = async (req, res) => {
    try {
        const { id } = dot(req.body);

        const ubh = await UserBalanceHistory.update({status: "Finished"}, {where: { id }});

        if (!ubh) {
            return res.json(eot({
                status: 0,
                msg: "Invalid withdraw ID"
            }));
        }

        return res.json(eot({
            status: 1,
            msg: "Success"
        }));
    } catch (error) {
        return errorHandler(res, error);
    }
};

// IPN Handler
exports.handleDepositCallback = async (req, res) => {
    try {

        const { payment_status, actually_paid, price_amount, outcome_amount, order_id, pay_amount } = req.body;
        const rawBody = JSON.stringify(req.body);

        // Generate the HMAC SHA-512 signature
        const computedSignature = crypto
            .createHmac('sha512', config.nowPayment.ipnSecret)
            .update(rawBody)
            .digest('hex');

        // Retrieve the received signature from the headers
        const receivedSignature = req.headers['x-nowpayments-sig'];

        // Compare the computed signature with the received signature
        if (computedSignature === receivedSignature) {
            console.log('Signature is valid.');
            // Process the callback
        } else {
            await UserBalanceHistory.update({ sentAmount: 0, receivedAmount: 0, status: "Failed" }, { where: { id: order_id } })
            console.error('Invalid signature.');
            return errorHandler(res, "Invalid signature.");
            // Handle the invalid signature case
        }

        const ubh = await UserBalanceHistory.findOne({ where: { id: order_id } });

        if (!ubh) {
            return res.json(eot({
                status: 0,
                msg: "Invalid Call Back"
            }))
        }
        const user = await User.findOne({ where: { id: ubh.userId } });
        if (!user) {
            return res.json(eot({
                status: 0,
                msg: "Invalid User Call Back"
            }))
        }

        const influencer = await Influencer.findOne({ where: { id: user.influencerId } });
        let percentBonus = config.noCodeUserBonusPercent;

        if (influencer) {
            percentBonus = config.hasCodeUserBonusPercent;
        }

        const newBalance = user.balance + outcome_amount;
        let newLockedBalance = 0;
        if (outcome_amount >= 15 && user.lockedBalance == 0) {
            newLockedBalance = 200;
        } else {
            newLockedBalance = user.lockedBalance + (outcome_amount * percentBonus / 100);
        }

        console.log("*********", payment_status, "**********");
        console.log("Deposit Info : ", req.body);
        // Handle the payment status
        switch (payment_status) {
            case 'confirmed':
                await UserBalanceHistory.update({ sentAmount: actually_paid, receivedAmount: outcome_amount, status: "Confirmed" }, { where: { id: ubh.id } })
                break;
            case 'expired':
                await UserBalanceHistory.update({ sentAmount: pay_amount, receivedAmount: 0, status: "Expired" }, { where: { id: ubh.id } })
                break;
            case 'finished':
                await User.update({ balance: newBalance, lockedBalance: newLockedBalance }, { where: { id: user.id } });
                await UserBalanceHistory.update({ userAfterBalance: newBalance, sentAmount: actually_paid, receivedAmount: outcome_amount, status: "Finished" }, { where: { id: ubh.id } })
                break;
            case 'failed':
                await UserBalanceHistory.update({ sentAmount: price_amount, status: "Failed" }, { where: { id: ubh.id } })
                // Payment failed
                break;
            case 'partially_paid':
                await User.update({ balance: newBalance, lockedBalance: newLockedBalance }, { where: { id: user.id } });
                await UserBalanceHistory.update({ userAfterBalance: newBalance, sentAmount: actually_paid, receivedAmount: outcome_amount, status: "Finished" }, { where: { id: ubh.id } })
                // Handle partial payment
                break;
        }

        return res.status(200).send('OK');
    } catch (error) {
        return errorHandler(res, error)
    }
};