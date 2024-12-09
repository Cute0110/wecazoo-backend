const Joi = require("joi");
const db = require("../models");
const User = db.user;
const UserBalanceHistory = db.userBalanceHistory;
const { errorHandler, validateSchema } = require("../utils/helper");
const { createInvoice } = require("../utils/cryptoPayment");
const { eot, dot } = require('../utils/cryptoUtils');
const config = require('../config/main');
const jwt = require('jsonwebtoken');
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
        if (!authHeader) return res.json(eot({status: 0, msg: 'No token provided' }));

        const token = authHeader;
        const decoded = jwt.verify(token, config.SECRET_KEY);

        const user = await User.findOne({where : {id: decoded.userId}});

        if (!user) {
            return res.json(eot({status: 0, msg: 'Invalid user!' }));
        }

        const newUserBalanceHistory = await UserBalanceHistory.create({ userId: decoded.userId, userPrevBalance: user.balance, userAfterBalance: user.balance , type: "Deposit", status: "Pending" });

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
        });

        if (!validateSchema(res, dot(req.body), schema)) {
            return;
        }

        const { amount, address } = dot(req.body);
        const authHeader = req.headers.authorization;
        if (!authHeader) return res.json(eot({status: 0, msg: 'No token provided' }));

        const token = authHeader;
        const decoded = jwt.verify(token, config.SECRET_KEY);
        const user = await User.findOne({ where: { id: decoded.userId } });

        if (!user) {
            return res.json(eot({status: 0, msg: 'Invalid user!' }));
        }

        if (user.balance < amount) {
            return res.json(eot({
                status: 0,
                msg: "Balance is not enough!",
            }));
        }

        const newBalance = user.balance - amount;

        await UserBalanceHistory.create({ userId: decoded.userId, userPrevBalance: user.balance, userAfterBalance: newBalance, amount: amount, type: "Withdraw", address: address, status: "Pending" });
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

// IPN Handler
exports.handleDepositCallback = async (req, res) => {
    try {

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
            console.error('Invalid signature.');
            return errorHandler(res, "Invalid signature.");
            // Handle the invalid signature case
        }
        const { payment_status, actually_paid, price_amount, outcome_amount, order_id } = req.body;

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

        const newBalance = user.balance + outcome_amount;
        let lockedBalance = 0;

        console.log("Deposit Info : ", req.body);
        // Handle the payment status
        switch (payment_status) {
            case 'finished':
                if (outcome_amount >= 100) {
                    lockedBalance = outcome_amount / 2;
                } else if (outcome_amount >= 50) {
                    lockedBalance = outcome_amount / 3;
                } else if (outcome_amount >= 20) {
                    lockedBalance = outcome_amount / 4;
                } else {
                    lockedBalance = outcome_amount / 5;
                }
                await User.update({ balance: newBalance, lockedBalance }, { where: { id: user.id } });
                await UserBalanceHistory.update({ userAfterBalance: newBalance, sentAmount: actually_paid, receivedAmount: outcome_amount, status: "Success" }, { where: { id: ubh.id } })
                break;
            case 'failed':
                await UserBalanceHistory.update({ amount: price_amount, status: "Failed" }, { where: { id: ubh.id } })
                // Payment failed
                break;
            case 'partially_paid':
                if (outcome_amount >= 100) {
                    lockedBalance = outcome_amount / 2;
                } else if (outcome_amount >= 50) {
                    lockedBalance = outcome_amount / 3;
                } else if (outcome_amount >= 20) {
                    lockedBalance = outcome_amount / 4;
                } else {
                    lockedBalance = outcome_amount / 5;
                }
                await User.update({ balance: newBalance, lockedBalance }, { where: { id: user.id } });
                await UserBalanceHistory.update({ userAfterBalance: newBalance, sentAmount: actually_paid, receivedAmount: outcome_amount, status: "Success" }, { where: { id: ubh.id } })
                // Handle partial payment
                break;
        }

        return res.status(200).send('OK');
    } catch (error) {
        return errorHandler(res, error)
    }
};