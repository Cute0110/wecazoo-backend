// vipStatus.js
module.exports = (sequelize, Sequelize) => {
    const VipStatus = sequelize.define(
        "vip_status",  // Changed to match model name in index.js
        {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            user_id: {
                type: Sequelize.INTEGER,
                defaultValue: 0,
            },
            current_vip_level_id: {
                type: Sequelize.INTEGER,
                defaultValue: null,
            },
            total_wager: {
                type: Sequelize.DECIMAL(15, 2),
                defaultValue: 0,
            },
            weekly_wager: {
                type: Sequelize.DECIMAL(15, 2),
                defaultValue: 0,
            },
            monthly_wager: {
                type: Sequelize.DECIMAL(15, 2),
                defaultValue: 0,
            },
            last_weekly_reset: {
                type: Sequelize.DATE,
                defaultValue: null,
            },
            last_monthly_reset: {
                type: Sequelize.DATE,
                defaultValue: null,
            }
        },
        {
            timestamps: true,
        }
    );

    VipStatus.associate = function(models) {
        VipStatus.belongsTo(models.vipLevel, {  // Changed to match the model name in index.js
            foreignKey: "current_vip_level_id",
            as: "vip_level"
        });
        VipStatus.belongsTo(models.user, {
            foreignKey: "user_id",
            as: "user"
        });
    };

    return VipStatus;
};