"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BellIcon, XMarkIcon } from "@heroicons/react/24/outline";
import {
  shouldShowPermissionPrompt,
  requestNotificationPermission,
  dismissPermissionPrompt,
  isNotificationSupported,
} from "@/lib/browserNotifications";

export default function NotificationPermission() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    // Check if we should show the prompt
    if (isNotificationSupported() && shouldShowPermissionPrompt()) {
      // Show prompt after 5 seconds
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, []);

  const handleEnable = async () => {
    setIsRequesting(true);
    try {
      const permission = await requestNotificationPermission();
      
      if (permission === "granted") {
        // Success! Close the prompt
        setShowPrompt(false);
      } else {
        // Denied or default - close and don't ask again for a while
        setShowPrompt(false);
      }
    } catch (error) {
      console.error("Error requesting permission:", error);
    } finally {
      setIsRequesting(false);
    }
  };

  const handleDismiss = () => {
    dismissPermissionPrompt();
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4"
      >
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 sm:p-6">
          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-5 p-1 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Dismiss"
          >
            <XMarkIcon className="h-5 w-5 text-gray-500" />
          </button>

          {/* Content */}
          <div className="flex gap-4">
            {/* Icon */}
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <BellIcon className="h-6 w-6 text-white" />
              </div>
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1">
                Stay Updated
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 mb-4">
                Enable notifications to get instant updates about new messages, friend requests, and more.
              </p>

              {/* Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={handleEnable}
                  disabled={isRequesting}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-medium rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isRequesting ? "Requesting..." : "Enable"}
                </button>
                <button
                  onClick={handleDismiss}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Maybe Later
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
