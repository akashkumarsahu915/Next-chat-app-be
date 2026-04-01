import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";

interface UserSocketMap {
  [userId: string]: string;
}

const userSocketMap: Record<string, string> = {};

interface CustomSocket extends Socket {
  userId?: string;
}
interface JwtPayload {
  _id: string;
}


export const setupSocket = (io: Server) => {

  // 🔥 AUTH MIDDLEWARE
  io.use((socket: CustomSocket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error("Authentication error: No token"));
      }

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET as string
      ) as JwtPayload;

      socket.userId = decoded._id;

      next();
    } catch (error) {
      return next(new Error("Authentication error: Invalid token"));
    }
  });

  // 🔌 CONNECTION
  io.on("connection", (socket: CustomSocket) => {
    console.log("User connected:", socket.userId);

    if (socket.userId) {
      userSocketMap[socket.userId] = socket.id;
    }

    // 📡 Emit online users
    io.emit("online_users", Object.keys(userSocketMap));

    // 🚪 Room management
    socket.on("join_chat", (chatId: string) => {
      socket.join(chatId);
      console.log(`User ${socket.userId} joined room: ${chatId}`);
    });

    socket.on("leave_chat", (chatId: string) => {
      socket.leave(chatId);
      console.log(`User ${socket.userId} left room: ${chatId}`);
    });

    // ❌ Disconnect
    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.userId);

      if (socket.userId) {
        delete userSocketMap[socket.userId];
      }

      io.emit("online_users", Object.keys(userSocketMap));
    });
  });
};

// 🔥 helper
export const getReceiverSocketId = (userId: string) => {
  return userSocketMap[userId];
};