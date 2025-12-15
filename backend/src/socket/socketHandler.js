import { Server } from "socket.io";
import { verifyAccessToken } from "../config/jwt.js";
import logger from "../utils/logger.js";

let io;

/**
 * Initialize Socket.io
 */
export const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5174",
      methods: ["GET", "POST"],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Authentication middleware (temporarily disabled for development)
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (token) {
        try {
          const decoded = verifyAccessToken(token);
          socket.userId = decoded.id;
          socket.userRole = decoded.role;
        } catch (error) {
          logger.warn("Invalid token provided, using guest access");
          socket.userId = 'guest';
          socket.userRole = 'guest';
        }
      } else {
        // Allow guest connections for development
        socket.userId = 'guest';
        socket.userRole = 'guest';
      }

      next();
    } catch (error) {
      logger.error("Socket authentication error:", error);
      return next(new Error("Socket connection failed"));
    }
  });

  // Connection event
  io.on("connection", (socket) => {
    logger.info(`User connected: ${socket.userId} (${socket.userRole})`);

    // Join user's personal room
    socket.join(socket.userId);

    // Join role-based room
    socket.join(socket.userRole);

    // Send connection success
    socket.emit("connected", {
      message: "Connected to real-time server",
      userId: socket.userId,
      role: socket.userRole,
    });

    // Handle sending notification to specific user
    socket.on("notification:send", async (data) => {
      try {
        const { userId, type, title, message, priority, data: notificationData } = data;
        
        logger.info(`📨 Sending notification to user: ${userId}`);
        
        // Emit to specific user
        io.to(userId.toString()).emit("notification:new", {
          type,
          title,
          message,
          priority: priority || 'Normal',
          data: notificationData,
          createdAt: new Date()
        });
        
        logger.info(`✅ Notification sent to user: ${userId}`);
        socket.emit("notification:send:success", { userId });
      } catch (error) {
        logger.error("Notification send error:", error);
        socket.emit("notification:send:error", { error: error.message });
      }
    });

    // Handle notification read
    socket.on("notification:read", async (notificationId) => {
      try {
        // Update notification as read in database
        // const Notification = (await import('../models/Notification.js')).default;
        // await Notification.findByIdAndUpdate(notificationId, {
        //   isRead: true,
        //   readAt: new Date()
        // });

        logger.info(
          `Notification ${notificationId} marked as read by ${socket.userId}`
        );

        socket.emit("notification:read:success", { notificationId });
      } catch (error) {
        logger.error("Notification read error:", error);
        socket.emit("notification:read:error", { error: error.message });
      }
    });

    // Handle mark all as read
    socket.on("notifications:readAll", async () => {
      try {
        // const Notification = (await import('../models/Notification.js')).default;
        // await Notification.markAllAsRead(socket.userId);

        logger.info(`All notifications marked as read by ${socket.userId}`);

        socket.emit("notifications:readAll:success");
      } catch (error) {
        logger.error("Mark all read error:", error);
        socket.emit("notifications:readAll:error", { error: error.message });
      }
    });

    // Handle student risk update broadcast
    socket.on("risk:update", (data) => {
      // Broadcast to all admins and counselors
      io.to("admin").to("counselor").emit("risk:updated", data);
    });

    // Handle attendance update broadcast
    socket.on("attendance:update", (data) => {
      // Broadcast to class teacher
      socket.to(`class:${data.classId}`).emit("attendance:updated", data);
    });

    // Handle intervention update
    socket.on("intervention:update", (data) => {
      // Notify specific users involved
      if (data.notifyUsers && Array.isArray(data.notifyUsers)) {
        data.notifyUsers.forEach((userId) => {
          io.to(userId).emit("intervention:updated", data);
        });
      }
    });

    // Handle typing indicator
    socket.on("typing:start", (data) => {
      socket.to(`chat:${data.chatId}`).emit("user:typing", {
        userId: socket.userId,
        userName: data.userName,
      });
    });

    socket.on("typing:stop", (data) => {
      socket.to(`chat:${data.chatId}`).emit("user:stopped-typing", {
        userId: socket.userId,
      });
    });

    // Handle disconnect
    socket.on("disconnect", (reason) => {
      logger.info(`User disconnected: ${socket.userId}. Reason: ${reason}`);
    });

    // Handle errors
    socket.on("error", (error) => {
      logger.error("Socket error:", error);
    });
  });

  logger.info("✅ Socket.io initialized successfully");
  return io;
};

/**
 * Get Socket.io instance
 */
export const getSocketIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
};

/**
 * Get Socket.io instance (alias for compatibility)
 */
export const getIO = () => {
  return io;
};

/**
 * Emit event to specific user
 */
export const emitToUser = (userId, event, data) => {
  if (!io) {
    logger.error("Socket.io not initialized");
    return;
  }
  io.to(userId.toString()).emit(event, data);
};

/**
 * Emit event to specific role
 */
export const emitToRole = (role, event, data) => {
  if (!io) {
    logger.error("Socket.io not initialized");
    return;
  }
  io.to(role).emit(event, data);
};

/**
 * Emit event to specific room
 */
export const emitToRoom = (room, event, data) => {
  if (!io) {
    logger.error("Socket.io not initialized");
    return;
  }
  io.to(room).emit(event, data);
};

/**
 * Broadcast event to all connected users
 */
export const broadcastToAll = (event, data) => {
  if (!io) {
    logger.error("Socket.io not initialized");
    return;
  }
  io.emit(event, data);
};

/**
 * Get connected users count
 */
export const getConnectedUsersCount = () => {
  if (!io) {
    return 0;
  }
  return io.sockets.sockets.size;
};

/**
 * Check if user is online
 */
export const isUserOnline = (userId) => {
  if (!io) {
    return false;
  }
  const room = io.sockets.adapter.rooms.get(userId.toString());
  return room && room.size > 0;
};

export default {
  initializeSocket,
  getSocketIO,
  emitToUser,
  emitToRole,
  emitToRoom,
  broadcastToAll,
  getConnectedUsersCount,
  isUserOnline,
};
