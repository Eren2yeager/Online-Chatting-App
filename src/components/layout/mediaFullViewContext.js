'use client';

import { createContext, useContext, useState } from "react";
import MediaFullViewer from "../common/mediaFullViewer";

const MediaFullViewContext = createContext();

export function MediaFullViewProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mediaData, setMediaData] = useState(null);

  const openMediaFullView = (data) => {
    setMediaData(data);
    setIsOpen(true);
  };

  const closeMediaFullView = () => {
    setIsOpen(false);
    setMediaData(null);
  };

  return (
    <MediaFullViewContext.Provider
      value={{
        openMediaFullView,
        closeMediaFullView,
        isOpen,
        mediaData,
      }}
    >
      {children}
      {isOpen && mediaData && (
        <MediaFullViewer
          isOpen={isOpen}
          onClose={closeMediaFullView}
          media={mediaData}
        />
      )}
    </MediaFullViewContext.Provider>
  );
}

export function useMediaFullView() {
  const context = useContext(MediaFullViewContext);
  if (context === undefined) {
    throw new Error('useMediaFullView must be used within a MediaFullViewProvider');
  }
  return context;
}