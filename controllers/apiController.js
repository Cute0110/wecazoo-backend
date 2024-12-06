const config = require("../config/main");
const axios = require('axios');
const { eot, dot } = require('../utils/cryptoUtils');

// exports.createApiUser = async (userCode) => {
//     try {
//         const nexusURL = config.apiEndPoint;
//         const params = {
//             "method": "user_create",
//             "agent_code": config.agent_code,
//             "agent_token": config.agent_token,
//             "user_code": userCode,
//         }
//         const nexusUser = await axios.post(nexusURL, params);

//         return nexusUser;
//     } catch (error) {
//         return errorHandler(res, error);
//     }
// }

// exports.apiGetUserBalance = async (userCode) => {
//     try {
//         const nexusURL = config.apiEndPoint;
//         const params = {
//             "method": "money_info",
//             "agent_code": config.agent_code,
//             "agent_token": config.agent_token,
//             "user_code": userCode,
//         }
//         const nexusUser = await axios.post(nexusURL, params);

//         return nexusUser;
//     } catch (error) {
//         return errorHandler(res, error);
//     }
// }

exports.apiGetProviderList = async (req, res) => {
    try {
        const nexusURL = config.apiEndPoint;
        const jsonBody = {
            "method": "provider_list",
            "agent_code": config.agent_code,
            "agent_token": config.agent_token,
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
            providers: result.data.providers,
        }))
    } catch (error) {
        return errorHandler(res, error);
    }
}

exports.apiGetGameList = async (req, res) => {
    try {
        const { providerCode } = dot(req.body);
        const nexusURL = config.apiEndPoint;
        const jsonBody = {
            "method": "game_list",
            "agent_code": config.agent_code,
            "agent_token": config.agent_token,
            "provider_code": providerCode
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
            gameList: result.data.games,
        }))
    } catch (error) {
        return errorHandler(res, error);
    }
}

exports.apiSlotGameLaunch = async (req, res) => {
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

        console.log(result.data);

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

exports.apiLiveGameLaunch = async (req, res) => {
    try {
        const { userCode, providerCode } = dot(req.body);

        const nexusURL = config.apiEndPoint;
        const jsonBody = {
            "method": "game_launch",
            "agent_code": config.agent_code,
            "agent_token": config.agent_token,
            "user_code": userCode,
            "provider_code": providerCode,
            "game_code": "",
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

exports.handleApiRequest = async (req, res) => {
    try {
        console.log(111, req.body);
    } catch (error) {
        return errorHandler(res, error);
    }
}