module.exports = (sequelize, Sequelize) => {
    const User = sequelize.define(
        "user",
        {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            userCode: {
                type: Sequelize.STRING,
                defaultValue: "",
            },
            userName: {
                type: Sequelize.STRING,
                defaultValue: "",
            },
            emailAddress: {
                type: Sequelize.STRING,
                defaultValue: "",
            },
            avatarURL: {
                type: Sequelize.STRING,
                defaultValue: "/images/users/default.jpg",
            },
            phoneNumber: {
                type: Sequelize.STRING,
                defaultValue: "",
            },
            location: {
                type: Sequelize.STRING,
                defaultValue: "",
            },
            ipAddress: {
                type: Sequelize.STRING,
                defaultValue: "",
            },
            password: {
                type: Sequelize.STRING,
                defaultValue: "",
            },
            balance: {
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

    return User;
};
