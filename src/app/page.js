'use client';

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import Loader from "@/components/ui/Loader";

// WebGL aurora — load only on client (uses window/canvas)
const Aurora = dynamic(() => import("@/components/Aurora"), { ssr: false });

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (session) {
      router.push("/chats");
    }
  }, [session, router]);

  if (!mounted || status === "loading") {
    return <Loader />;
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 12,
      },
    },
  };

  const features = [
    {
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      ),
      title: "Real-time Messaging",
      description: "Instant message delivery with WebSocket technology",
      gradient: "from-blue-400 to-cyan-400",
      iconColor: "text-blue-300",
      borderHover: "hover:border-blue-400/50",
    },
    {
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
      ),
      title: "Secure & Private",
      description: "Google OAuth authentication with encrypted data",
      gradient: "from-purple-400 to-pink-400",
      iconColor: "text-purple-300",
      borderHover: "hover:border-purple-400/50",
    },
    {
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      ),
      title: "Media Sharing",
      description: "Share images and audio files seamlessly",
      gradient: "from-emerald-400 to-teal-400",
      iconColor: "text-emerald-300",
      borderHover: "hover:border-emerald-400/50",
    },
  ];

  return (
    <div
      suppressHydrationWarning
      className="relative min-h-screen overflow-hidden bg-slate-950"
    >
      {/* Aurora WebGL background — vibrant neon palette on near-black base.
          Color stops chosen to harmonize with the heading + CTA gradient
          (purple → pink → cyan) and the per-feature icon tints. */}
      <div
        suppressHydrationWarning
        className="absolute inset-0 overflow-hidden pointer-events-none"
      >
        <Aurora
          colorStops={["#7C3AED", "#EC4899", "#22D3EE"]}
          amplitude={1.8}
          blend={1.2}
          speed={1.0}
        />
        {/* Vignette + dark gradient overlay so foreground text stays legible
            regardless of where the aurora peaks */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-slate-950/10 to-slate-950/60" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(2,6,23,0.25)_100%)]" />
      </div>

      {/* Content */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="relative z-10 min-h-screen flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8"
      >
        <div className="max-w-7xl w-full">
          {/* Hero Section */}
          <div className="text-center mb-16 lg:mb-20">
            <motion.div
              variants={itemVariants}
              className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-sm text-white/80"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Live with v3.0 — Audio & Video Calling
            </motion.div>

            <img 
              src="/transparent.png"
              alt="Hero Image"
              className="mx-auto mb-8 rounded-3xl size-25 shadow-2xl"
            />

            <motion.h1
              variants={itemVariants}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl  font-extrabold mb-6 leading-tight"
            >
              <span className="text-white">Connect Instantly,</span>
              <br />
              <span className="bg-clip-text text-transparent font-extrabold bg-gradient-to-r from-violet-400 via-pink-400 to-cyan-400">
                Chat Effortlessly
              </span>
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="text-base sm:text-md  text-white/70 max-w-3xl mx-auto mb-10 leading-relaxed px-4"
            >
              Connect with friends, share media, and enjoy
              seamless conversations powered by cutting-edge technology.
            </motion.p>

            <motion.div
              variants={itemVariants}
              className="flex flex-row gap-4 justify-center items-center"
            >
              <motion.button
                whileHover={{
                  scale: 1.05,
                  boxShadow: "0 0 40px rgba(236, 72, 153, 0.5)",
                }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push("/signin")}
                className="group relative px-4 sm:px-6 py-4 bg-gradient-to-r from-violet-500 via-pink-500 to-cyan-500 text-white rounded-xl font-semibold text-sm sm:text-lg shadow-2xl shadow-pink-500/30 transition-all duration-300 overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Get Started
                  <svg
                    className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-4 bg-white/5 backdrop-blur-md border border-white/20 text-white rounded-xl font-semibold text-sm sm:text-lg hover:bg-white/10 hover:border-white/30 transition-all duration-300"
              >
                Learn More
              </motion.button>
            </motion.div>
          </div>

          {/* Features Grid */}
          <motion.div
            variants={itemVariants}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto"
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ y: -8, scale: 1.02 }}
                className="group relative"
              >
                <div
                  className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-30 transition-opacity duration-500 blur-xl -z-10"
                  style={{
                    background: `linear-gradient(to right, ${feature.gradient})`,
                  }}
                />

                <div
                  className={`relative h-full bg-white/5 backdrop-blur-xl rounded-2xl p-6 lg:p-8 border border-white/10 ${feature.borderHover} transition-all duration-300`}
                >
                  <div
                    className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-5 text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}
                  >
                    {feature.icon}
                  </div>

                  <h3 className="text-lg font-bold text-white mb-3 group-hover:bg-clip-text   group-hover:from-white group-hover:to-white/80 transition-all duration-300">
                    {feature.title}
                  </h3>

                  <p className="text-white/60 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
