const Joi = require("joi");
const db = require("../models");
const Game = db.game;
const Provider = db.provider;
const { errorHandler } = require("../utils/helper");
const { eot, dot } = require('../utils/cryptoUtils');
const { Op } = require("sequelize");
const config = require("../config/main");
const axios = require('axios');

exports.getAllGames = async (req, res) => {
    try {
        const { start, length, search, order, dir } = dot(req.body);

        let query = {};

        if (search && search.trim() !== "") {
            query = {
                [Op.or]: [
                    { name: { [Op.substring]: search } },
                    { gameCode: { [Op.substring]: search } }
                ],
            };
        }

        const data = await Game.findAndCountAll({
            where: query,
            offset: Number(start),
            limit: length == 0 ? null : Number(length),
            order: [
                [order, dir],
            ],
        });

        const providerData = await Provider.findAndCountAll({
            where: { status: true },
        });

        return res.json(eot({
            status: 1,
            data: data.rows,
            providerData: providerData.rows,
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

        const game = await Game.update({ status }, { where: { id } })

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

        const game = await Game.update({ isOriginal }, { where: { id } })

        return res.json(eot({
            status: 1,
            msg: "success"
        }));
    } catch (error) {
        return errorHandler(res, error);
    }
};

exports.onGameLaunch = async (req, res) => {
    try {
        const { userCode, providerCode, gameCode } = dot(req.body);

        const nexusURL = config.apiEndPoint;
        const jsonBody = {
            "method": "game_launch",
            "agent_code": config.agent_code,
            "agent_token": config.agent_token,
            "user_code": userCode,
            "provider_code": providerCode,
            "game_code": gameCode,
            "lang": "en"
        };
        const result = await axios.post(nexusURL, jsonBody);

        if (result.data.status == 0) {
            return res.json(eot({
                status: 0,
                msg: result.data.msg,
            }));
        }

        return res.json(eot({
            status: result.data.status,
            launch_url: result.data.launch_url,
        }))
    } catch (error) {
        return errorHandler(res, error);
    }
}