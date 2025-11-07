"use server";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createServer } from "http";
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
} from "./handlers/index.js";

// Import utilities
import { authMiddleware } from "./utils/auth.js";
import { updateUserPresence } from "./utils/presence.js";
import { joinUserToChats } from "./utils/rooms.js";
import { cleanupUserTyping } from "./utils/typing.js";

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

// Parse command line arguments for port
const args = process.argv.slice(2);
let portArg;
for (let i = 0; i < args.length; i++) {
  if (args[i] === "-p" || args[i] === "--port") {
    portArg = args[i + 1];
    break;
  }
}

const port = parseInt(portArg || process.env.PORT || "3000", 10);
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

let io = null;

// Export function to get IO instance
export function getIO() {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
}

// Bootstrap server
async function start() {
  await app.prepare();

  // Create HTTP server and attach Next handler
  const httpServer = createServer((req, res) => {
    handle(req, res);
  });

  // Create Socket.IO server
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
    console.log(`User ${socket.userId} connected`);

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
      console.log(`Sending online users to ${socket.userId}:`, onlineUserIds);
      socket.emit("presence:online-users", { userIds: onlineUserIds });
    });

    // Register all event handlers
    registerChatHandlers(socket, io, userSockets);
    registerFriendHandlers(socket, io, userSockets);
    registerMessageHandlers(socket, io, userSockets);
    registerTypingHandlers(socket);
    registerUserHandlers(socket, io, userSockets);

    // Handle disconnection
    socket.on("disconnect", async () => {
      console.log(`User ${socket.userId} disconnected`);

      // Remove socket mapping
      userSockets.delete(socket.userId);

      // Clean up typing indicators
      cleanupUserTyping(socket.userId);

      // Update user presence to offline
      await updateUserPresence(io, socket.userId, "offline");
    });
  });

  // Start server
  httpServer.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${port}`);
  });
}

start().catch((err) => {
  console.error("Error starting server:", err);
  process.exit(1);
});
