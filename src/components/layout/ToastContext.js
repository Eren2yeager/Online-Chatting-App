"use client";
import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { nanoid } from "nanoid";
import { createPortal } from "react-dom"; // <-- Import createPortal at the top

/* ------------------------------
  Context & Hook
------------------------------ */
const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

/* ------------------------------
  Toast Portal Helper
------------------------------ */
function ToastPortal({ children }) {
  const portalRef = useRef(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Create a div for the portal if it doesn't exist
    let portalDiv = document.getElementById("toast-portal-root");
    if (!portalDiv) {
      portalDiv = document.createElement("div");
      portalDiv.id = "toast-portal-root";
      document.body.appendChild(portalDiv);
    }
    portalRef.current = portalDiv;
    setMounted(true);

    return () => {
      // Optionally clean up the portal div if you want
      // document.body.removeChild(portalDiv);
    };
  }, []);

  if (!mounted || !portalRef.current) return null;

  // Use createPortal only on the client after mount
  return createPortal(children, portalRef.current);
}

/* ------------------------------
  Provider Component
------------------------------ */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback(({ text, image = null, duration = 3000 }) => {
    // Check if toasts should be disabled in production
    
    if (process.env.NODE_ENV === 'production') {
      // Log to console instead in production (if disabled)
      console.log('Toast:', text);
      return;
    }

    const id = nanoid();
    setToasts((prev) => [...prev, { id, text, image }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}

      <ToastPortal>
        <div className="fixed bottom-[20px] left-1/2 -translate-x-1/2 z-[1100000] space-y-2 pointer-events-none max-w-[95vw] sm:max-w-2xl">
          <AnimatePresence>
            {toasts.map(({ id, text, image }) => (
              <motion.div 
                key={id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.3 }}
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium rounded-lg shadow-lg px-4 py-3 flex items-start gap-3 w-full mx-auto pointer-events-auto"
              >
                {image && (
                  <img
                    src={image}
                    alt="toast"
                    className="w-8 h-8 object-cover rounded flex-shrink-0"
                  />
                )}
                <span className="flex-1 break-words leading-relaxed">{text}</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </ToastPortal>
    </ToastContext.Provider>
  );
}