const Joi = require("joi");
const db = require("../models");
const User = db.user;
const UserBetInfo = db.userBetInfo;
const Influencer = db.influencer;
const { errorHandler, validateSchema } = require("../utils/helper");
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
const config = require("../config/main");
const apiController = require("./apiController");
const { eot, dot } = require('../utils/cryptoUtils');
const { Op } = require("sequelize");

exports.getAllInfluencers = async (req, res) => {
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

        const data = await Influencer.findAndCountAll({
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

exports.onStatusChange = async (req, res) => {
    try {
        const { id, status } = dot(req.body);

        const influencer = await Influencer.update({ status }, { where: { id } })

        return res.json(eot({
            status: 1,
            msg: "success"
        }));
    } catch (error) {
        return errorHandler(res, error);
    }
};

exports.onCreate = async (req, res) => {
    try {
        const { name, promoCode, percent } = dot(req.body);

        const influencer = await Influencer.findOne({
            where: {
                [Op.or]: [
                    { name },
                    { promoCode }
                ]
            }
        });

        if (influencer) {
            return res.json(eot({
                status: 0,
                msg: "Name or promoCode already exist!",
            }));
        }

        await Influencer.create({ name, promoCode, percent })

        return res.json(eot({
            status: 1,
            msg: "success"
        }));
    } catch (error) {
        return errorHandler(res, error);
    }
};

exports.onTransaction = async (req, res) => {
    try {
        const { id, payoutAmount } = dot(req.body);

        const influencer = await Influencer.findOne({where: {id}});

        if (!influencer) {
            return res.json(eot({
                status: 0,
                msg: "No influencer"
            }));
        }

        newProfit = influencer.profit - payoutAmount;

        await Influencer.update({profit: newProfit}, {where: {id}});

        return res.json(eot({
            status: 1,
            msg: "success"
        }));
    } catch (error) {
        return errorHandler(res, error);
    }
};


exports.onDelete = async (req, res) => {
    try {
        const { id } = dot(req.body);

        const user = await Influencer.destroy({ where: { id } })

        return res.json(eot({
            status: 1,
            msg: "success"
        }));
    } catch (error) {
        return errorHandler(res, error);
    }
};

