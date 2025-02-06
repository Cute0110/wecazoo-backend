module.exports = (sequelize, Sequelize) => {
    const Game = sequelize.define(
        "game",
        {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            providerCode: {
                type: Sequelize.STRING,
                defaultValue: "",
            },
            gameCode: {
                type: Sequelize.STRING,
                defaultValue: "",
            },
            name: {
                type: Sequelize.STRING,
                defaultValue: "",
            },
            type: {
                type: Sequelize.STRING,
                defaultValue: "",
            },
            imageUrl: {
                type: Sequelize.STRING,
                defaultValue: "images/games/trending-games/default.jpg",
            },
            order: {
                type: Sequelize.INTEGER,
                defaultValue: 1,
            },
            isTrending: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
            },
            isPopular: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
            },
            isProfitable: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
            },
            isFavorite: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
            },
            isLive: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
            },
            isSlot: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
            },
            isEntertaining: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
            },
            isOriginal: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
            },
            isImproved: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
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

    return Game;
};
