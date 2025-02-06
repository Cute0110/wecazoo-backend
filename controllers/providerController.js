const db = require("../models");
const Provider = db.provider;
const { errorHandler } = require("../utils/helper");
const { eot, dot } = require('../utils/cryptoUtils');

exports.getAllProviders = async (req, res) => {
    try {
        const data = await Provider.findAndCountAll({
            where: { "status": true },
        });

        return res.json(eot({
            status: 1,
            data: data.rows,
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