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
            sentAmount: {
                type: Sequelize.DOUBLE(20, 5),
                defaultValue: 0,
            },
            receivedAmount: {
                type: Sequelize.DOUBLE(20, 5),
                defaultValue: 0,
            },
            address: {
                type: Sequelize.STRING,
                defaultValue: "",
            },
            asset: {
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
        UserBalanceHistory.belongsTo(db.user, { foreignKey: "userId", sourceKey: "id", as: "user" });
    };

    return UserBalanceHistory;
};
