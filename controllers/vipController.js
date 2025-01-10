
const { eot, dot } = require('../utils/cryptoUtils');
const db = require("../models");
const { errorHandler } = require("../utils/helper");

exports.getUserVipStatus = async (req, res) => {
  try {
    const { id } = req.user;

    let vipStatus = await db.vipStatus.findOne({
      where: { user_id: id },
      include: [{
        model: db.vipLevel,
        as: 'vip_level',
        attributes: ['level_name', 'wager_requirement', 'level_up_bonus_percentage']
      }]
    });

    if (!vipStatus) {
      // Create new VIP status with default values
      vipStatus = await db.vipStatus.create({
        user_id: id,
        total_wager: 0,
        weekly_wager: 0,
        monthly_wager: 0,
        current_vip_level_id: null,
        last_weekly_reset: null,
        last_monthly_reset: null
      });

      // Fetch the newly created status with VIP level info
      vipStatus = await db.vipStatus.findOne({
        where: { user_id: id },
        include: [{
          model: db.vipLevel,
          as: 'vip_level',
          attributes: ['level_name', 'wager_requirement', 'level_up_bonus_percentage']
        }]
      });
    }

    // Prepare response data with formatted VIP information
    const responseData = {
      ...vipStatus.toJSON(),
      vip_name: vipStatus.vip_level ? vipStatus.vip_level.level_name : 'No VIP Rank Yet',
      total_wager: parseFloat(vipStatus.total_wager || 0).toFixed(2),
      weekly_wager: parseFloat(vipStatus.weekly_wager || 0).toFixed(2),
      monthly_wager: parseFloat(vipStatus.monthly_wager || 0).toFixed(2)
    };

    return res.json(eot({
      status: 1,
      msg: "Success",
      data: responseData
    }));
  } catch (error) {
    return errorHandler(res, error);
  }
};

exports.getAllVipLevels = async (req, res) => {
  try {
    const levels = await db.vipLevel.findAll({
      order: [['level_order', 'ASC']]
    });

    return res.json(eot({
      status: 1,
      msg: "Success",
      data: levels
    }));
  } catch (error) {
    return errorHandler(res, error);
  }
};

exports.getUsersByVipLevel = async (req, res) => {
  try {
    const { levelId } = dot(req.body);

    const users = await db.vipStatus.findAll({
      where: { current_vip_level_id: levelId },
      include: [
        {
          model: db.user,
          as: 'user',
          attributes: ['userName', 'emailAddress']
        },
        {
          model: db.vipLevel,
          as: 'vip_level',
          attributes: ['level_name']
        }
      ]
    });

    if (!users.length) {
      return res.json(eot({
        status: 0,
        msg: "No users found for this VIP level!",
        data: []
      }));
    }

    return res.json(eot({
      status: 1,
      msg: "Success",
      data: users
    }));
  } catch (error) {
    return errorHandler(res, error);
  }
};

// Update user's VIP status when they place a bet
exports.updateUserVipStatus = async (req, res) => {
  try {
    const { userId, wagerAmount } = dot(req.body);

    let vipStatus = await db.vipStatus.findOne({
      where: { user_id: userId }
    });

    if (!vipStatus) {
      // Create new VIP status if doesn't exist
      vipStatus = await db.vipStatus.create({
        user_id: userId,
        total_wager: wagerAmount,
        weekly_wager: wagerAmount,
        monthly_wager: wagerAmount
      });
    } else {
      // Update existing wagers
      const newTotalWager = Number(vipStatus.total_wager) + Number(wagerAmount);

      // Find appropriate VIP level based on new total wager
      const newVipLevel = await db.vipLevel.findOne({
        where: {
          wager_requirement: {
            [db.Sequelize.Op.lte]: newTotalWager
          }
        },
        order: [['wager_requirement', 'DESC']],
        limit: 1
      });

      // Update VIP status
      await vipStatus.update({
        total_wager: newTotalWager,
        weekly_wager: Number(vipStatus.weekly_wager) + Number(wagerAmount),
        monthly_wager: Number(vipStatus.monthly_wager) + Number(wagerAmount),
        current_vip_level_id: newVipLevel ? newVipLevel.id : null
      });
    }

    // Get updated status with level info
    const updatedStatus = await db.vipStatus.findOne({
      where: { user_id: userId },
      include: [{
        model: db.vipLevel,
        as: 'vipLevel',
        attributes: ['level_name', 'wager_requirement', 'level_up_bonus_percentage']
      }]
    });

    return res.json(eot({
      status: 1,
      msg: "VIP status updated successfully",
      data: updatedStatus
    }));
  } catch (error) {
    return errorHandler(res, error);
  }
};