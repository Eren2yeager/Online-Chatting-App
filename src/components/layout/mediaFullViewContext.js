"use client";
import {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  useCallback,
} from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";

const mediaFullViewContext = createContext();

export const useMediaFullView = () => useContext(mediaFullViewContext);

/* ------------------------------
  Provider Component
------------------------------ */
export function MediaFullViewContextProvider({ children }) {
  const router = useRouter();

  const [mediaToView, setMediaToView] = useState(null);









  return (
    <mediaFullViewContext.Provider
      value={{

        mediaToView,
        setMediaToView,

      }}
    >
      {children}
    </mediaFullViewContext.Provider>
  );
}