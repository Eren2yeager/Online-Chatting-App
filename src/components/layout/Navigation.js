"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigation } from "./NavigationContext";
import {
  HomeIcon,
  PlusIcon,
  UserGroupIcon,
  QrCodeIcon,
  UserIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import CustomChatIcon from '@/components/icons/CustomChatIcon';
// import CreateGroupModal from "../chat/CreateGroupModal.jsx";
export default function Navigation() {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isDesktop, setIsDesktop] = useState(false);
  const { isCollapsed, setIsCollapsed } = useNavigation();
  // const [showCreateGroup, setShowCreateGroup] = useState(false);

  // Track screen size to determine desktop/mobile
  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 1024);
    checkDesktop();
    window.addEventListener("resize", checkDesktop);
    return () => window.removeEventListener("resize", checkDesktop);
  }, []);

  // Close mobile sidebar when route changes
  useEffect(() => {
    if (!isDesktop) {
      setIsCollapsed(false);
    }
  }, [pathname, isDesktop, setIsCollapsed]);

  if (!session) return null;

  const navigationItems = [
    { name: "Chats", href: "/chats", icon: CustomChatIcon },
    { name: "Friends", href: "/friends", icon: UserGroupIcon },
    {
      name: "Profile",
      href: `/profile/${session.user.handle}`,
      icon: "profile",
    },
    
  ];

  const isActive = (href) => pathname === href;

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
  };

  return (
    <>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        { isCollapsed && (
          <div className="fixed inset-0 z-50 flex ">
            {/* Overlay */}
            <div
              className="fixed inset-0  bg-opacity-50 backdrop-blur-xs"
              onClick={() => setIsCollapsed(false)}
            />
            {/* Sidebar */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.2 }}
              className="fixed left-0 top-0 h-full w-80 bg-white shadow-xl z-50 flex flex-col"
            >
              <div className="p-6 flex flex-col h-full">
                <div className="flex items-center justify-between mb-2">
                  {/* Logo */}
                  <div className="flex items-center">
                    <div className="w-10 h-10  flex items-center justify-center">
                      <CustomChatIcon className="w-10 h-10" />
                    </div>
                    <h1 className="text-xl ml-2 font-bold text-gray-900">ChatApp</h1>
                  </div>

                <button
                  onClick={() => setIsCollapsed(false)}
                  className="p-2 text-gray-500 hover:text-gray-700"
                  >
                  <XMarkIcon className="w-6 h-6" />
                </button>
                  </div>
                {/* Navigation Links */}
                <div className="space-y-2 flex-1">
                  {navigationItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.name}
                        onClick={() => {
                          router.push(item.href);
                          setIsCollapsed(false);
                        }}
                        className={`w-full flex items-center space-x-3 px-2 py-2 rounded-lg text-left transition-colors ${
                          isActive(item.href)
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {item.icon === "profile" ? (
                          <img
                            src={session.user.image}
                            alt="Profile"
                            className="w-7 h-7 rounded-full object-cover"
                          />
                        ) : (
                          <Icon
                            className={`w-7 h-7 ${
                              isActive(item.href)
                                ? "text-blue-600"
                                : "text-gray-500"
                            }`}
                          />
                        )}
                        <span className="font-medium">{item.name}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Settings & Sign Out */}
                <div className="mt-auto pt-8 space-y-2">
                  <button
                    onClick={() => {
                      router.push("/settings");
                      setIsCollapsed(false);
                    }}
                    className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Cog6ToothIcon className="w-7 h-7 text-gray-500" />
                    <span className="font-medium">Settings</span>
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <ArrowRightOnRectangleIcon className="w-7 h-7 text-red-600" />
                    <span className="font-medium">Sign Out</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </>
  );
}
