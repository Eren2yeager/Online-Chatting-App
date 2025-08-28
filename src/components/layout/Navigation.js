'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigation } from './NavigationContext';
import { 
  HomeIcon,
  PlusIcon,
  UserGroupIcon,
  QrCodeIcon,
  UserIcon,
  ChatBubbleLeftRightIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import CreateGroupModal from '../chat/CreateGroupModal';

export default function Navigation() {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isDesktop, setIsDesktop] = useState(false);
  const { isCollapsed, setIsCollapsed } = useNavigation();
  const [showCreateGroup, setShowCreateGroup] = useState(false);

  // Track screen size to determine desktop/mobile
  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 1024);
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  // Close mobile sidebar when route changes
  useEffect(() => {
    if (!isDesktop) {
      setIsCollapsed(false);
    }
  }, [pathname, isDesktop, setIsCollapsed]);

  if (!session) return null;

  const navigationItems = [
    { name: 'Chats', href: '/chats', icon: ChatBubbleLeftRightIcon },
    { name: 'Friends', href: '/friends', icon: UserGroupIcon },
    { name: 'Invite', href: '/invite', icon: QrCodeIcon },
    { name: 'Profile', href: '/profile', icon: UserIcon },
  ];

  const isActive = (href) => pathname === href;

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  return (
    <>
      {/* Desktop Sidebar Overlay */}
      <AnimatePresence>
        {isCollapsed && isDesktop && (
          <div className="fixed inset-0 z-40 flex lg:flex">
            {/* Overlay */}
            <div
              className="fixed inset-0 bg-opacity-50 lg:bg-opacity-0"
              onClick={() => setIsCollapsed(false)}
            />
            {/* Sidebar */}
            <motion.nav
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.2 }}
              className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-white shadow-xl z-50 flex flex-col"
            >
              <div className="flex flex-col h-full">
                {/* Logo and Collapse/Expand Button */}
                <div className="w-full flex items-center px-3 py-3 rounded-lg text-left transition-colors space-x-3">
                  <button
                    onClick={() => setIsCollapsed(false)}
                    className="flex items-center justify-center w-8 h-8 rounded-md border border-gray-200 hover:bg-gray-50 transition-colors"
                    title="Close"
                  >
                    <span className="text-lg font-bold text-gray-500">×</span>
                  </button>
                </div>

                {/* Navigation Links */}
                <div className="space-y-2 flex-1 px-2">
                  {navigationItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <motion.button
                        key={item.name}
                        onClick={() => router.push(item.href)}
                        className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-left transition-colors ${
                          isActive(item.href)
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Icon className={`w-5 h-5 ${
                          isActive(item.href) ? 'text-blue-600' : 'text-gray-500'
                        }`} />
                        <span className="font-medium">{item.name}</span>
                      </motion.button>
                    );
                  })}
                  <button
                    onClick={() => setShowCreateGroup(true)}
                    className="w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-left text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <PlusIcon className="w-5 h-5 text-gray-500" />
                    <span className="font-medium">Create Group</span>
                  </button>
                </div>

                {/* Settings & Sign Out */}
                <div className="mt-auto pt-6 space-y-2 px-2 pb-4">
                  <button
                    onClick={() => router.push('/settings')}
                    className="w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-left text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Cog6ToothIcon className="w-5 h-5 text-gray-500" />
                    <span className="font-medium">Settings</span>
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-left text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <span className="font-medium">Sign Out</span>
                  </button>
                </div>
              </div>
            </motion.nav>
          </div>
        )}
      </AnimatePresence>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {(!isDesktop && isCollapsed) && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            {/* Overlay */}
            <div
              className="fixed inset-0  bg-opacity-50 backdrop-blur-xs"
              onClick={() => setIsCollapsed(false)}
            />
            {/* Sidebar */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.2 }}
              className="fixed left-0 top-0 h-full w-80 bg-white shadow-xl z-50 flex flex-col"
            >
              <div className="p-6 flex flex-col h-full">
                {/* Close Button */}
                <div className="flex justify-end mb-6">
                  <button
                    onClick={() => setIsCollapsed(false)}
                    className="p-2 text-gray-500 hover:text-gray-700"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>

                {/* Logo */}
                <div className="flex items-center space-x-3 mb-8">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <ChatBubbleLeftRightIcon className="w-6 h-6 text-white" />
                  </div>
                  <h1 className="text-xl font-bold text-gray-900">ChatApp</h1>
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
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                          isActive(item.href)
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <Icon className={`w-5 h-5 ${
                          isActive(item.href) ? 'text-blue-600' : 'text-gray-500'
                        }`} />
                        <span className="font-medium">{item.name}</span>
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setShowCreateGroup(true)}
                    className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <PlusIcon className="w-5 h-5 text-gray-500" />
                    <span className="font-medium">Create Group</span>
                  </button>
                </div>

                {/* Settings & Sign Out */}
                <div className="mt-auto pt-8 space-y-2">
                  <button
                    onClick={() => {
                      router.push('/settings');
                      setIsCollapsed(false);
                    }}
                    className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Cog6ToothIcon className="w-5 h-5 text-gray-500" />
                    <span className="font-medium">Settings</span>
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <span className="font-medium">Sign Out</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <CreateGroupModal
        isOpen={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
        onGroupCreated={() => {
          setShowCreateGroup(false);
          // Refresh the chat list
          router.refresh();
        }}
      />
    </>
  );
}