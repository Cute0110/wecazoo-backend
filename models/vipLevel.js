module.exports = (sequelize, Sequelize) => {
    const VipLevel = sequelize.define(
        "vip_level",
        {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            level_name: {
                type: Sequelize.STRING(50),
                defaultValue: "",
            },
            level_order: {
                type: Sequelize.INTEGER,
                defaultValue: 0,
            },
            wager_requirement: {
                type: Sequelize.DECIMAL(15, 2),
                defaultValue: 0,
            },
            level_up_bonus_percentage: {
                type: Sequelize.DECIMAL(5, 3),
                defaultValue: 0,
            }
        },
        {
            timestamps: true,
        }
    );

    VipLevel.associate = function(models) {
        VipLevel.hasMany(models.vipStatus, {  // Changed to match the model name in index.js
            foreignKey: "current_vip_level_id",
            as: "users",
            onDelete: "SET NULL",
            onUpdate: "CASCADE"
        });
    };

    return VipLevel;
};