module.exports = (sequelize, Sequelize) => {
    const UserBetInfo = sequelize.define(
        "user_bet_info",
        {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            userId: {
                type: Sequelize.INTEGER,
                allowNull: false,
            },
            totalBet: {
                type: Sequelize.DOUBLE(20, 5),
                defaultValue: 0,
            },
            totalWin: {
                type: Sequelize.DOUBLE(20, 5),
                defaultValue: 0,
            },
            unlockedBalance: {
                type: Sequelize.DOUBLE(20, 5),
                defaultValue: 0,
            },
        },
        {
            timestamps: true,
        }
    );

    UserBetInfo.associate = (db) => {
        UserBetInfo.belongsTo(db.user, { foreignKey: "userId", sourceKey: "id", as: "user" });
    };

    return UserBetInfo;
};
