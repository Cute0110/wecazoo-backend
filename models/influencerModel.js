module.exports = (sequelize, Sequelize) => {
    const Influencer = sequelize.define(
        "influencer",
        {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            name: {
                type: Sequelize.STRING,
                defaultValue: "",
            },
            promoCode: {
                type: Sequelize.STRING,
                defaultValue: "",
            },
            usersCount: {
                type: Sequelize.INTEGER,
                defaultValue: 0,
            },
            usersTotalBet: {
                type: Sequelize.DOUBLE(20, 5),
                defaultValue: 0,
            },
            profit: {
                type: Sequelize.DOUBLE(20, 5),
                defaultValue: 0,
            },
            status: {
                type: Sequelize.BOOLEAN,
                defaultValue: true,
            },
        },
        {
            timestamps: true,
        }
    );

    return Influencer;
};
