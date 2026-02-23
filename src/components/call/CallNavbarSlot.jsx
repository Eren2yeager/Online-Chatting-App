'use client';

import { createPortal } from 'react-dom';

/**
 * Renders children into the call-navbar-slot element (above app navbar)
 * Used when call is minimized to show solid navbar in layout flow
 */
export default function CallNavbarSlot({ children }) {
  if (typeof document === 'undefined') return null;
  const slot = document.getElementById('call-navbar-slot');
  if (!slot) return null;
  return createPortal(children, slot);
}
