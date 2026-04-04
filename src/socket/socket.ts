import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import User from "../models/user.model";

interface UserSocketMap {
  [userId: string]: string;
}

const userSocketMap: Record<string, string> = {};

interface CustomSocket extends Socket {
  userId?: string;
  username?: string;
  profilePicture?: string;
}
interface JwtPayload {
  _id: string;
}


export const setupSocket = (io: Server) => {
  io.use(async (socket: CustomSocket, next) => {
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

      //  Fetch user details to store on socket for signaling
      const user = await User.findById(decoded._id).select("username profilePicture");
      if (user) {
        socket.username = user.username;
        socket.profilePicture = user.profilePicture;
      }

      next();
    } catch (error) {
      return next(new Error("Authentication error: Invalid token"));
    }
  });

  //  CONNECTION
  io.on("connection", (socket: CustomSocket) => {
    console.log("User connected:", socket.userId);

    if (socket.userId) {
      userSocketMap[socket.userId] = socket.id;
      socket.join(socket.userId); // Join a unique room for this user
      console.log(`User ${socket.userId} joined their own room`);
    }

    //  Emit online users
    io.emit("online_users", Object.keys(userSocketMap));

    //  Room management
    socket.on("join_chat", (chatId: string) => {
      socket.join(chatId);
      console.log(`User ${socket.userId} joined room: ${chatId}`);
      // Send confirmation back to the client
      socket.emit("room_joined", { chatId, success: true });
    });

    socket.on("leave_chat", (chatId: string) => {
      socket.leave(chatId);
      console.log(`User ${socket.userId} left room: ${chatId}`);
    });

    // --- Video Call Signaling ---

    // 1. Initial Call Request
    socket.on("call_user", ({ userToCall, chatId }) => {
      const callerId = socket.userId;
      if (!callerId) return;

      console.log(`Incoming call from ${callerId} to ${userToCall}`);
      io.to(userToCall).emit("incoming_call", {
        from: {
          _id: callerId,
          username: socket.username,
          profilePicture: socket.profilePicture
        },
        chatId
      });
    });

    // 2. Accept/Reject Logic
    socket.on("accept_call", ({ to, chatId }) => {
      console.log(`Call accepted by ${socket.userId} for ${to}`);
      io.to(to).emit("call_accepted", { signal: null });
    });

    socket.on("reject_call", ({ to, chatId }) => {
      console.log(`Call rejected by ${socket.userId} for ${to}`);
      io.to(to).emit("call_rejected");
    });

    // 3. The Signaling relay (SDP & ICE)
    socket.on("webrtc_signal", ({ to, signal }) => {
      // console.log(`Relaying WebRTC signal from ${socket.userId} to ${to}`);
      io.to(to).emit("webrtc_signal", {
        from: socket.userId,
        signal
      });
    });

    // 4. Hang up
    socket.on("end_call", ({ to, chatId }) => {
      console.log(`Call ended by ${socket.userId} with ${to}`);
      io.to(to).emit("call_ended");
    });

    //  Disconnect
    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.userId);

      if (socket.userId) {
        delete userSocketMap[socket.userId];
      }

      io.emit("online_users", Object.keys(userSocketMap));
    });
  });
};

//  helper
export const getReceiverSocketId = (userId: string) => {
  return userSocketMap[userId];
};