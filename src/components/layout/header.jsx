"use client";
import React, { useEffect, useState } from "react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import CustomChatIcon from '@/components/icons/CustomChatIcon';
import { useNavigation } from "./NavigationContext";
import NotificationBell from "@/components/notifications/NotificationBell";

const Header = () => {
  const { isCollapsed, setIsCollapsed } = useNavigation();
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll effect for header
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    // Add scroll event listener
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Initial check
    handleScroll();
    
    // Clean up
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [scrolled]);

  return (
    <header className={`flex items-center justify-between px-4 h-16 bg-white border-b border-gray-200 sticky top-0 z-10 transition-all duration-200 ${
      scrolled ? 'shadow-md' : 'shadow-sm'
    }`}>
      <div className="flex items-center space-x-4">
        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="lg:hidden flex items-center justify-center w-8 h-8 rounded-md border border-gray-200 hover:bg-gray-50 transition-colors"
          title={isCollapsed ? "Close Menu" : "Open Menu"}
          aria-expanded={!isCollapsed}
        >
          {/* {isCollapsed ?  */}
            <Bars3Icon className="w-5 h-5 text-gray-600" /> 
          {/* //   <XMarkIcon className="w-5 h-5 text-gray-600" /> */}
          {/* // } */}
        </button>
        
        {/* Desktop Menu Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex items-center justify-center w-8 h-8 rounded-md border border-gray-200 hover:bg-gray-50 transition-colors"
          title={isCollapsed ? "Open Menu" : "Close Menu"}
          aria-expanded={!isCollapsed}
        >
          {/* {isCollapsed ?  */}
            <Bars3Icon className="w-5 h-5 text-gray-600" /> 
            {/* <XMarkIcon className="w-5 h-5 text-gray-600" /> */}
          
        </button>
        
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl  flex items-center justify-center">
            <CustomChatIcon className="w-10 h-10" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">ChatApp</h1>
        </div>
      </div>

      {/* Right Side - Notification Bell */}
      <div className="flex items-center">
        <NotificationBell />
      </div>
    </header>
  );
};

export default Header;
