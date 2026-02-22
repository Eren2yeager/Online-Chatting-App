'use client';

import { motion, AnimatePresence } from "framer-motion";

export default function UnreadBadge({ count, className = "" }) {
  if (!count || count === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0 }}
        className={`min-w-[20px] h-5 px-1.5 flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs font-bold rounded-full shadow-lg ${className}`}
      >
        {count > 99 ? "99+" : count}
      </motion.div>
    </AnimatePresence>
  );
}
