import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import User from "../../src/models/User.js";

/**
 * Authenticate socket connection using JWT token or direct userId
 * @param {string} token - JWT token or userId
 * @returns {Promise<Object|null>} User object or null if authentication fails
 */
export async function authenticateSocket(token) {
  try {
    // Accept direct userId token (simple fallback for development)
    if (token && mongoose.isValidObjectId(token)) {
      const user = await User.findById(token);
      if (user) return user;
    }

    // Try JWT authentication
    if (token) {
      const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET);
      if (decoded?.userId) {
        const user = await User.findById(decoded.userId);
        if (user) return user;
      }
    }

    return null;
  } catch (error) {
    console.error("Socket authentication error:", error);
    return null;
  }
}

/**
 * Socket authentication middleware
 * Attaches user info to socket object
 */
export async function authMiddleware(socket, next) {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error("Authentication error: No token provided"));
    }

    const user = await authenticateSocket(token);
    if (!user) {
      return next(new Error("Authentication error: Invalid token"));
    }

    socket.userId = user._id.toString();
    socket.user = user;
    next();
  } catch (error) {
    console.error("Socket authentication error:", error);
    next(new Error("Authentication error: " + (error.message || "Unknown error")));
  }
}
