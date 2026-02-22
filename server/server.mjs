import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server } from "socket.io";
import mongoose from "mongoose";

// Import handlers
import {
  registerChatHandlers,
  registerFriendHandlers,
  registerMessageHandlers,
  registerTypingHandlers,
  registerUserHandlers,
  registerNotificationHandlers,
  registerCallHandlersV2,
} from "./handlers/index.mjs";

// Import utilities
import { authMiddleware } from "./utils/auth.mjs";
import { updateUserPresence } from "./utils/presence.mjs";
import { joinUserToChats } from "./utils/rooms.mjs";
import { cleanupUserTyping } from "./utils/typing.mjs";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

// Initialize Next.js
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable");
}

mongoose.connect(MONGODB_URI, {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  family: 4,
});

let io = null;

// Export function to get IO instance
export function getIO() {
  if (!io) {
    throw new Error("Socket.IO not initialized");
  }
  return io;
}

app.prepare().then(() => {
  // Create HTTP server
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error handling request:", err);
      res.statusCode = 500;
      res.end("Internal server error");
    }
  });

  // Attach Socket.IO to the HTTP server
  io = new Server(httpServer, {
    transports: ["websocket", "polling"],
  });

  // Store user socket mappings
  const userSockets = new Map();
  const userRooms = new Map();

  // Socket authentication middleware
  io.use(authMiddleware);

  // Socket connection handler
  io.on("connection", async (socket) => {
    console.log(` SOCKET SERVER LOG  :  User ${socket.userId} connected`);

    // Store socket mapping
    userSockets.set(socket.userId, socket.id);

    // Update user presence to online
    await updateUserPresence(io, socket.userId, "online");

    // Send current online users to the newly connected user
    const onlineUserIds = Array.from(userSockets.keys());
    socket.emit("presence:online-users", { userIds: onlineUserIds });

    // Join user to their chat rooms
    await joinUserToChats(socket, socket.userId, userRooms);

    // Handle presence requests
    socket.on("presence:get-online", () => {
      const onlineUserIds = Array.from(userSockets.keys());
      // console.log(` SOCKET SERVER LOG  :  Sending online users to ${socket.userId}:`, onlineUserIds);
      socket.emit("presence:online-users", { userIds: onlineUserIds });
    });

    // Register all event handlers
    registerChatHandlers(socket, io, userSockets);
    registerFriendHandlers(socket, io, userSockets);
    registerMessageHandlers(socket, io, userSockets);
    registerTypingHandlers(socket);
    registerUserHandlers(socket, io, userSockets);
    registerNotificationHandlers(socket, io, userSockets);
    // registerCallHandlers(socket, io, userSockets); // Old handler - commented out
    registerCallHandlersV2(socket, io, userSockets); // New room-based handler

    // Handle disconnection
    socket.on("disconnect", async () => {
      console.log(` SOCKET SERVER LOG  :  User ${socket.userId} disconnected`);

      // Remove socket mapping
      userSockets.delete(socket.userId);

      // Clean up typing indicators
      cleanupUserTyping(socket.userId);

      // Update user presence to offline
      await updateUserPresence(io, socket.userId, "offline");
    });
  });

  // Start the server
  httpServer
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`Ready on http://${hostname}:${port}`);
    });
});
