const config = require("../config/main");
const axios = require('axios');
const { eot, dot } = require('../utils/cryptoUtils');
const db = require("../models");
const User = db.user;
const UserBetInfo = db.userBetInfo;
const Influencer = db.influencer;
const UserGameHistory = db.userGameHistory;

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
        const { method, user_code, agent_code }= req.body;
        const user = await User.findOne({ where: { userCode: user_code } });
        const betInfo = await UserBetInfo.findOne( { where: {userId: user.id}});
        const influencer = await Influencer.findOne({ where: {id: user.influencerId}});

        switch (method) {
            case 'user_balance':
                if (!user) {
                    return res.json({        
                        "status": 0,
                        "user_balance": 0,
                        "msg": "INTERNAL_ERROR"
                    })
                }

                return res.json({
                    "status": 1,
                    "user_balance": user.balance,
                })
                break;
            case 'transaction':
                const { game_type } = req.body;
                if (game_type == "slot") {
                    const { slot } = req.body;
                    const { bet_money, win_money, txn_type, game_code, provider_code} = slot;

                    const newBalance = user.balance - bet_money + win_money;

                    await User.update({ balance: newBalance}, {where : {userCode: user_code}});
                    await UserBetInfo.update({ totalBet: betInfo.totalBet + bet_money, totalWin: betInfo.totalWin + win_money, unlockedBalance: betInfo.unlockedBalance + bet_money / 100}, {where : {id: betInfo.id}});
                    await UserGameHistory.create({ 
                        agent_code, 
                        userId: user.id, 
                        user_code, 
                        game_type, 
                        txn_type, 
                        userPrevBalance: user.balance, 
                        userAfterBalance: newBalance, 
                        bet_amount: bet_money, 
                        win_amount: win_money, 
                        provider_code, 
                        game_code 
                    });

                    if (influencer) {
                        await Influencer.update({usersTotalBet: (influencer.usersTotalBet + bet_money), profit: (influencer.profit + bet_money * config.influencerBonusPercent / 100)}, {where: {id: influencer.id}})
                    }

                    return res.json({
                        "status": 1,
                        "user_balance": newBalance,
                    })
                } else if (game_type == "live") {
                    const { live } = req.body;
                    const { bet_money, win_money, txn_type, game_code, provider_code} = live;

                    const newBalance = user.balance - bet_money + win_money;

                    await User.update({ balance: newBalance}, {where : {userCode: user_code}});
                    await UserBetInfo.update({ totalBet: betInfo.totalBet + bet_money, totalWin: betInfo.totalWin + win_money, unlockedBalance: betInfo.unlockedBalance + bet_money / 100}, {where : {id: betInfo.id}});
                    await UserGameHistory.create({ 
                        agent_code,
                        userId: user.id, 
                        user_code, 
                        game_type, 
                        txn_type, 
                        userPrevBalance: user.balance, 
                        userAfterBalance: newBalance, 
                        bet_amount: bet_money, 
                        win_amount: win_money, 
                        provider_code, 
                        game_code 
                    });

                    if (influencer) {
                        await Influencer.update({usersTotalBet: (influencer.usersTotalBet + bet_money), profit: (influencer.profit + bet_money * config.influencerBonusPercent / 100)}, {where: {id: influencer.id}})
                    }

                    return res.json({
                        "status": 1,
                        "user_balance": newBalance,
                    })
                }
                
                // Payment failed
                break;
        }
    } catch (error) {
        console.log(error);
        return res.json({        
            "status": 0,
            "user_balance": 0,
            "msg": "INTERNAL_ERROR"
        })
    }
}