module.exports = (sequelize, Sequelize) => {
    const Provider = sequelize.define(
        "provider",
        {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            code: {
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
            order: {
                type: Sequelize.INTEGER,
                defaultValue: 1,
            },
            isOriginal: {
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

    return Provider;
};
