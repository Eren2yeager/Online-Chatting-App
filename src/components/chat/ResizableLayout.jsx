'use client';

import { useState, useRef, useEffect } from 'react';

/**
 * Resizable layout component for chat sidebar and window
 * Similar to WhatsApp's desktop interface
 */
export default function ResizableLayout({ sidebar, main }) {
  const [sidebarWidth, setSidebarWidth] = useState(320); // Default 320px (w-80)
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef(null);

  const minWidth = 260; // Minimum sidebar width
  const maxWidth = 550; // Maximum sidebar width

  useEffect(() => {
    // Load saved width from localStorage
    const savedWidth = localStorage.getItem('chatSidebarWidth');
    if (savedWidth) {
      const width = parseInt(savedWidth, 10);
      if (width >= minWidth && width <= maxWidth) {
        setSidebarWidth(width);
      }
    }
  }, []);

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;

      const container = containerRef.current;
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      const newWidth = e.clientX - containerRect.left;

      if (newWidth >= minWidth && newWidth <= maxWidth) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      if (isResizing) {
        setIsResizing(false);
        // Save to localStorage
        localStorage.setItem('chatSidebarWidth', sidebarWidth.toString());
      }
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, sidebarWidth]);

  return (
    <div ref={containerRef} className="flex h-full w-full overflow-hidden">
      {/* Sidebar */}
      <div
        style={{ width: `${sidebarWidth}px` }}
        className="bg-white border-r border-gray-200 shrink-0 flex flex-col overflow-hidden"
      >
        {sidebar}
      </div>

      {/* Resize Handle */}
      <div
        onMouseDown={handleMouseDown}
        className={`w-1 bg-gray-200 hover:bg-blue-500 cursor-col-resize shrink-0 transition-colors relative group ${
          isResizing ? 'bg-blue-500' : ''
        }`}
      >
        {/* Visual indicator on hover */}
        <div className="absolute inset-y-0 -left-1 -right-1 group-hover:bg-blue-500/10" />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {main}
      </div>
    </div>
  );
}
