"use client";
import React from "react";
import { ChatBubbleLeftRightIcon, Bars3Icon } from "@heroicons/react/24/outline";
import { useNavigation } from "./NavigationContext";

const Header = () => {
  const { isCollapsed, setIsCollapsed } = useNavigation();

  return (
    <header className="flex items-center justify-between px-4 h-16 bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center space-x-4">
        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsCollapsed(true)}
          className="lg:hidden flex items-center justify-center w-8 h-8 rounded-md border border-gray-200 hover:bg-gray-50 transition-colors"
          title="Open Menu"
        >
          <Bars3Icon className="w-5 h-5 text-gray-600" />
        </button>
        
        {/* Desktop Menu Button */}
        <button
          onClick={() => setIsCollapsed(true)}
          className="hidden lg:flex items-center justify-center w-8 h-8 rounded-md border border-gray-200 hover:bg-gray-50 transition-colors"
          title="Open Menu"
        >
          <Bars3Icon className="w-5 h-5 text-gray-600" />
        </button>
        
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <ChatBubbleLeftRightIcon className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">ChatApp</h1>
        </div>
      </div>
    </header>
  );
};

export default Header;
