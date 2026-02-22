'use client';

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from "framer-motion";

/**
 * Smart Context Portal Component
 * Automatically adjusts position to avoid overflow
 * Mobile: Bottom sheet with swipe to close
 * Desktop: Smart positioned popup
 */
export default function ContextPortal({
  isOpen,
  onClose,
  position = { x: 0, y: 0 },
  children,
  className = "",
}) {
  const portalRef = useRef(null);
  const [adjustedPosition, setAdjustedPosition] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);
  const y = useMotionValue(0);
  const opacity = useTransform(y, [0, 100], [1, 0.5]);

  // Check if mobile on mount
  useEffect(() => {
    setMounted(true);
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Calculate smart position to avoid overflow
  useEffect(() => {
    if (!isOpen || !portalRef.current || isMobile) return;

    const calculatePosition = () => {
      const portal = portalRef.current;
      const rect = portal.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      const padding = 10; // Padding from viewport edges
      let x = position.x;
      let y = position.y;

      // Adjust horizontal position
      if (x + rect.width > viewportWidth - padding) {
        // Would overflow right, position to the left
        x = viewportWidth - rect.width - padding;
      }
      if (x < padding) {
        // Would overflow left
        x = padding;
      }

      // Adjust vertical position
      if (y + rect.height > viewportHeight - padding) {
        // Would overflow bottom, position above
        y = Math.max(padding, viewportHeight - rect.height - padding);
      }
      if (y < padding) {
        // Would overflow top
        y = padding;
      }

      setAdjustedPosition({ x, y });
    };

    // Calculate after render
    const timer = setTimeout(calculatePosition, 0);
    return () => clearTimeout(timer);
  }, [isOpen, position, isMobile]);

  // Handle click outside and keyboard
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      if (portalRef.current && !portalRef.current.contains(event.target)) {
        onClose();
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    // Prevent body scroll on mobile when portal is open
    if (isMobile) {
      document.body.style.overflow = "hidden";
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose, isMobile]);

  // Handle drag to close on mobile
  const handleDragEnd = (event, info) => {
    if (!isMobile) return;
    
    // If dragged down more than 100px or velocity is high, close
    if (info.offset.y > 100 || info.velocity.y > 500) {
      onClose();
    }
  };

  // Don't render on server
  if (!mounted) return null;

  const content = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop for mobile */}
          {isMobile && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 z-[9998]"
              onClick={onClose}
            />
          )}

          {/* Portal Content */}
          <motion.div
            ref={portalRef}
            drag={isMobile ? "y" : false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={handleDragEnd}
            // style={isMobile ? { y, opacity } : undefined}
            initial={{
              opacity: isMobile ? 1 : 0,
              scale: isMobile ? 1 : 0.95,
              y: isMobile ? "100%" : 0,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
            }}
            exit={{
              opacity: isMobile ? 1 : 0,
              scale: isMobile ? 1 : 0.95,
              y: isMobile ? "100%" : 0,
            }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 35,
            }}
            className={`fixed z-[9999] ${
              isMobile
                ? "inset-x-0 bottom-0 rounded-t-3xl w-full  max-h-[85vh] overflow-hidden"
                : "rounded-2xl shadow-2xl"
            } ${className}`}
            style={
              !isMobile
                ? {
                    left: adjustedPosition.x,
                    top: adjustedPosition.y,
                  }
                : undefined
            }
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile Handle */}
            {isMobile && (
              <div className="flex justify-center py-3 bg-gradient-to-b from-gray-50 to-white rounded-t-3xl cursor-grab active:cursor-grabbing">
                <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
              </div>
            )}

            {/* Content */}
            <div className={isMobile ? "overflow-y-auto  max-h-[calc(85vh-3rem)] overscroll-contain" : ""}>
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  // Render in portal
  return createPortal(content, document.body);
}
