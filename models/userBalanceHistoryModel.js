module.exports = (sequelize, Sequelize) => {
    const UserBalanceHistory = sequelize.define(
        "user_balance_history",
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
            type: {
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
            amount: {
                type: Sequelize.DOUBLE(20, 5),
                defaultValue: 0,
            },
            address: {
                type: Sequelize.STRING,
                defaultValue: "",
            },
            status: {
                type: Sequelize.STRING,
                defaultValue: "",
            },
        },
        {
            timestamps: true,
        }
    );

    UserBalanceHistory.associate = (db) => {
        UserBalanceHistory.belongsTo(db.User, { foreignKey: "userId", sourceKey: "id", as: "user" });
    };

    return UserBalanceHistory;
};
