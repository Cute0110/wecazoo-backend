const Sequelize = require("sequelize");
const config = require("../config/main");

const sequelize = new Sequelize(config.db.name, config.db.user, config.db.pass, {
    host: config.db.host,
    dialect: config.db.type,
    logging: config.db.logging,
    port: config.db.port,
    pool: {
        max: 1000,
        min: 0,
        acquire: 60000,
        idle: 30000,
    },
});

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

// model
db.user = require("./userModel")(sequelize, Sequelize);
db.userBalanceHistory = require("./userBalanceHistoryModel")(sequelize, Sequelize);

db.sync = async () => {
    await db.sequelize.sync();

    console.log(`Database connected.`);
};

module.exports = db;