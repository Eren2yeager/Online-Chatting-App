"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useSocket, useSocketEmitter } from "@/lib/socket";

const UnreadCountContext = createContext(null);

export function UnreadCountProvider({ children }) {
  const { data: session } = useSession();
  const { socket, isConnected } = useSocket();
  const { emitAck } = useSocketEmitter();

  // Map of chatId -> unread count
  const [chatUnreadCounts, setChatUnreadCounts] = useState(new Map());
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch all unread counts
  const fetchUnreadCounts = useCallback(async () => {
    if (!socket || !isConnected) return;

    try {
      setLoading(true);
      const response = await emitAck("unread:fetch", {});
      
      if (response?.success) {
        const { unreadCounts, totalUnread } = response;
        
        // Convert object to Map
        const countsMap = new Map(Object.entries(unreadCounts));
        setChatUnreadCounts(countsMap);
        setTotalUnreadCount(totalUnread);
      }
    } catch (error) {
      console.error("Error fetching unread counts:", error);
    } finally {
      setLoading(false);
    }
  }, [socket, isConnected, emitAck]);

  // Update unread count for a specific chat
  const updateChatUnread = useCallback((chatId, count) => {
    setChatUnreadCounts((prev) => {
      const newMap = new Map(prev);
      const oldCount = newMap.get(chatId) || 0;
      newMap.set(chatId, count);
      
      // Update total
      setTotalUnreadCount((prevTotal) => prevTotal - oldCount + count);
      
      return newMap;
    });
  }, []);

  // Reset unread count for a specific chat
  const resetChatUnread = useCallback((chatId) => {
    setChatUnreadCounts((prev) => {
      const newMap = new Map(prev);
      const oldCount = newMap.get(chatId) || 0;
      newMap.set(chatId, 0);
      
      // Update total
      setTotalUnreadCount((prevTotal) => Math.max(0, prevTotal - oldCount));
      
      return newMap;
    });
  }, []);

  // Get unread count for a specific chat
  const getChatUnread = useCallback((chatId) => {
    return chatUnreadCounts.get(chatId) || 0;
  }, [chatUnreadCounts]);

  // Mark chat as read
  const markChatAsRead = useCallback(async (chatId) => {
    if (!socket || !isConnected) return;

    try {
      const response = await emitAck("chat:mark-read", { chatId });
      
      if (response?.success) {
        resetChatUnread(chatId);
      }
    } catch (error) {
      console.error("Error marking chat as read:", error);
    }
  }, [socket, isConnected, emitAck, resetChatUnread]);

  // Socket listener: Unread count update
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleUnreadUpdate = (data) => {
      const { chatId, count } = data;
      console.log("🔔 Unread count update:", { chatId, count });
      updateChatUnread(chatId, count);
    };

    socket.on("unread:update", handleUnreadUpdate);

    return () => {
      socket.off("unread:update", handleUnreadUpdate);
    };
  }, [socket, isConnected, updateChatUnread]);

  // Socket listener: Chat read
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleChatRead = (data) => {
      const { chatId } = data;
      resetChatUnread(chatId);
    };

    socket.on("chat:read", handleChatRead);

    return () => {
      socket.off("chat:read", handleChatRead);
    };
  }, [socket, isConnected, resetChatUnread]);

  // Initial fetch
  useEffect(() => {
    if (session?.user && isConnected && socket) {
      fetchUnreadCounts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id, isConnected]);

  // Update document title with unread count
  useEffect(() => {
    if (typeof window !== "undefined") {
      const baseTitle = "ChatApp";
      if (totalUnreadCount > 0) {
        document.title = `(${totalUnreadCount}) ${baseTitle}`;
      } else {
        document.title = baseTitle;
      }
    }
  }, [totalUnreadCount]);

  const value = {
    chatUnreadCounts,
    totalUnreadCount,
    loading,
    fetchUnreadCounts,
    updateChatUnread,
    resetChatUnread,
    getChatUnread,
    markChatAsRead,
  };

  return (
    <UnreadCountContext.Provider value={value}>
      {children}
    </UnreadCountContext.Provider>
  );
}

export function useUnreadCount() {
  const context = useContext(UnreadCountContext);
  if (!context) {
    throw new Error("useUnreadCount must be used within UnreadCountProvider");
  }
  return context;
}
