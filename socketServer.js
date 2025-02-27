const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const config = require('./config/main');
const db = require("./models");
const Sequelize = require("sequelize");
const User = db.user;
const ChatHistory = db.chat_history;

let io;
const onlineUsers = new Map(); // Track online users

const initializeSocket = (server) => {
  io = socketIO(server, {
    cors: {
      origin: ["http://localhost:3000", "https://wecazoo.com"],
      credentials: true,
    },
    transports: ['websocket', 'polling']
  });

  io.engine.on("connection_error", (err) => {
    console.log(err.req);
    console.log(err.code);
    console.log(err.message);
    console.log(err.context);
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, config.SECRET_KEY);
      socket.userId = decoded.userId;
      socket.userName = decoded.username;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', async (socket) => {
    console.log('User connected:', socket.userId);

    // Get user info from your database
    const user = await User.findOne({ where: { id: socket.userId } });

    // Add user to online users
    onlineUsers.set(socket.userId, {
      id: user.id,
      userName: user.userName,
      avatarURL: user.avatarURL,
      socketId: socket.id
    });

    socket.join('groupChat');

    // Send list of online users to the newly connected user
    socket.emit('onlineUsers', Array.from(onlineUsers.values()));

    // Broadcast new user online status to others
    socket.broadcast.to('groupChat').emit('userOnline', {
      id: user.id,
      userName: user.userName,
      avatarURL: user.avatarURL
    });

    // Send chat history
    const chatHistory = await ChatHistory.findAll({
      order: [['createdAt', 'ASC']],
      limit: 100,
      raw: true,
      attributes: [
        'id',
        'userId',
        'userName',
        'avatarURL',
        ['message', 'text'],
        'mentions',
        [Sequelize.fn('date_format', Sequelize.col('createdAt'), '%Y-%m-%d %H:%i:%s'), 'timestamp'],
        'isRead'
      ]
    });

    socket.emit('chatHistory', chatHistory);

    socket.on('groupMessage', async (message) => {
      const mentions = message.text.match(/@(\w+)/g) || [];
      const messageData = {
        id: Date.now(),
        userId: socket.userId,
        userName: user.userName,
        avatarURL: user.avatarURL,
        text: message.text,
        mentions: mentions.map(m => m.substring(1)),
        timestamp: new Date()
      };

      // Save message to database
      await ChatHistory.create({
        userId: socket.userId,
        userName: user.userName,
        avatarURL: user.avatarURL,
        message: message.text,
        mentions: mentions.map(m => m.substring(1))
      });

      // Send to all clients in group
      io.to('groupChat').emit('newGroupMessage', messageData);

      // Send notifications for mentions
      mentions.forEach(mention => {
        const mentionedUser = Array.from(onlineUsers.values())
          .find(u => u.userName === mention.substring(1));

        if (mentionedUser) {
          io.to(mentionedUser.socketId).emit('mentioned', {
            from: user.userName,
            message: message.text
          });
        }
      });
    });

    // Handle read status
    socket.on('markAsRead', async (messageIds) => {
      await ChatHistory.update(
        { isRead: true },
        { where: { id: messageIds } }
      );
    });

    socket.on('disconnect', () => {
      onlineUsers.delete(socket.userId);
      io.to('groupChat').emit('userOffline', socket.userId);
      console.log('User disconnected:', socket.userId);
    });
  });
};

module.exports = {
  initializeSocket,
  getIO: () => io,
  getOnlineUsers: () => Array.from(onlineUsers.values())
};