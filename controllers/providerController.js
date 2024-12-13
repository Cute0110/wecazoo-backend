const Joi = require("joi");
const db = require("../models");
const Provider = db.provider;
const { errorHandler } = require("../utils/helper");
const { eot, dot } = require('../utils/cryptoUtils');
const { Op } = require("sequelize");

exports.getAllProviders = async (req, res) => {
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

        const data = await Provider.findAndCountAll({
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

        const provider = await Provider.update({ status }, { where: { id } })

        return res.json(eot({
            status: 1,
            msg: "success"
        }));
    } catch (error) {
        return errorHandler(res, error);
    }
};

exports.onOriginalStatusChange = async (req, res) => {
    try {
        const { id, isOriginal } = dot(req.body);

        const provider = await Provider.update({ isOriginal }, { where: { id } })

        return res.json(eot({
            status: 1,
            msg: "success"
        }));
    } catch (error) {
        return errorHandler(res, error);
    }
};