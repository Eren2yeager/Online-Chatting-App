"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { motion } from "framer-motion";
import SignInButton from "../auth/SignInButton";

export default function SecureLayout({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100"
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading...</p>
        </div>
      </motion.div>
    );
  }

  if (!session) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100"
      >
        <div className="text-center flex flex-col justify-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-8">
            Welcome to ChatApp
          </h1>
          <p className="text-gray-600 text-lg mb-8">
            Please get session to continue
          </p>
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={()=>{router.push("/signin")}}
            className="bg-blue-600 w-fit hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors self-center gap-2"
          >
            Get Session
          </motion.button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-full bg-gray-50"
    >
      {children}
    </motion.div>
  );
}
