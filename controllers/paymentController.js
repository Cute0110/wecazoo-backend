const Joi = require("joi");
const db = require("../models");
const User = db.user;
const UserBalanceHistory = db.userBalanceHistory;
const { errorHandler } = require("../utils/helper");
const { createInvoice } = require("../utils/cryptoPayment");
const { eot, dot } = require('../utils/cryptoUtils');
const NowPaymentsApi = require('@nowpaymentsio/nowpayments-api-js');
const config = require('../config/main');
const jwt = require('jsonwebtoken');

const nowPaymentsClient = new NowPaymentsApi({
    apiKey: config.nowPayment.apiKey
});

exports.createInvoice = async (req, res) => {
    try {
        const schema = Joi.object({
            price: Joi.number().required(),
            currency: Joi.string().required(),
        });
        const { error } = schema.validate(dot(req.body));
        if (error) {
            return res.json({ error: error.details[0].message });
        }

        const { price, currency } = dot(req.body);

        const authHeader = req.headers.authorization;
        if (!authHeader) return res.json({ message: 'No token provided' });

        const token = authHeader;
        const decoded = jwt.verify(token, config.SECRET_KEY);

        const user = await User.findOne({where : {id: decoded.userId}});

        const newUserBalanceHistory = await UserBalanceHistory.create({ userId: decoded.userId, userPrevBalance: user.balance, userAfterBalance: user.balance , type: "Deposit", status: "Pending" });

        const invoiceData = {
            price,
            currency,
            id: newUserBalanceHistory.id,
        };

        const invoice = await createInvoice(invoiceData);
        if (invoice.status == 0) {
            UserBalanceHistory.update({ amount: price }, { where: { id: newUserBalanceHistory.id } });
            return res.json(eot({ status: 0, url: "" }));
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
        const { error } = schema.validate(dot(req.body));
        if (error) {
            return res.json({ error: error.details[0].message });
        }

        const { amount, address } = dot(req.body);
        const authHeader = req.headers.authorization;
        if (!authHeader) return res.json({ message: 'No token provided' });

        const token = authHeader;
        const decoded = jwt.verify(token, config.SECRET_KEY);
        const user = await User.findOne({ where: { id: decoded.userId } });

        if (user.balance < amount) {
            return res.json(eot({
                status: 0,
                msg: "Balance is not enough!",
            }));
        }

        const newBalance = user.balance - amount;

        await UserBalanceHistory.create({ userId: decoded.userId, userPrevBalance: user.balance, userAfterBalance: newBalance, amount: amount, type: "Withdraw", address: address, status: 0 });
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

        const { payment_status, payment_id, price_amount, outcome_amount, order_id } = req.body;

        const ubh = await UserBalanceHistory.findOne({ where: { id: order_id } });

        if (!ubh) {
            return res.json({
                status: 0,
                msg: "Invalid Call Back"
            })
        }
        const user = await User.findOne({ where: { id: ubh.userId } });
        if (!user) {
            return res.json({
                status: 0,
                msg: "Invalid User Call Back"
            })
        }

        const newBalance = user.balance + outcome_amount;

        // Handle the payment status
        switch (payment_status) {
            case 'finished':
                await User.update({ balance: newBalance }, { where: { id: user.id } });
                await UserBalanceHistory.update({ userAfterBalance: newBalance, amount: outcome_amount, status: "Success" }, { where: { id: ubh.id } })
                break;
            case 'failed':
                await UserBalanceHistory.update({ status: "Failed" }, { where: { id: ubh.id } })
                // Payment failed
                break;
            case 'partially_paid':
                await User.update({ balance: newBalance }, { where: { id: user.id } });
                await UserBalanceHistory.update({ userAfterBalance: newBalance, amount: outcome_amount, status: "Success" }, { where: { id: ubh.id } })
                // Handle partial payment
                break;
        }

        return res.status(200).send('OK');
    } catch (error) {
        console.error('IPN handling error:', error);
        return res.status(400).send('Failed to process IPN');
    }
};