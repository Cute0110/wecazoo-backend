module.exports = (sequelize, Sequelize) => {
    const UserGameHistory = sequelize.define(
        "user_game_history",
        {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            agent_code: {
                type: Sequelize.STRING,
                defaultValue: "",
            },
            userId: {
                type: Sequelize.INTEGER,
                allowNull: false,
            },
            user_code: {
                type: Sequelize.STRING,
                defaultValue: "",
            },
            game_type: {
                type: Sequelize.STRING,
                defaultValue: "",
            },
            txn_type: {
                type: Sequelize.STRING,
                defaultValue: "",
            },
            userPrevBalance: {
                type: Sequelize.DOUBLE(20, 5),
                defaultValue: 0,
            },
            userAfterBalance: {
                type: Sequelize.DOUBLE(20, 5),
                defaultValue: 0,
            },
            bet_amount: {
                type: Sequelize.DOUBLE(20, 5),
                defaultValue: 0,
            },
            win_amount: {
                type: Sequelize.DOUBLE(20, 5),
                defaultValue: 0,
            },
            provider_code: {
                type: Sequelize.STRING,
                defaultValue: "",
            },
            game_code: {
                type: Sequelize.STRING,
                defaultValue: "",
            },
        },
        {
            timestamps: true,
        }
    );

    UserGameHistory.associate = (db) => {
        UserGameHistory.belongsTo(db.user, { foreignKey: "userId", sourceKey: "id", as: "user" });
    };

    return UserGameHistory;
};
