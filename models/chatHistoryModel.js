module.exports = (sequelize, Sequelize) => {
  const ChatHistory = sequelize.define(
    "chat_history",
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
      userName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      avatarURL: {
        type: Sequelize.STRING,
        defaultValue: "/images/users/default.jpg",
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      mentions: {
        type: Sequelize.JSON,
        defaultValue: [],
      },
      isRead: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      }
    },
    {
      timestamps: true,
    }
  );

  ChatHistory.associate = (db) => {
    ChatHistory.belongsTo(db.user, { foreignKey: "userId", as: "user" });
  };

  return ChatHistory;
};