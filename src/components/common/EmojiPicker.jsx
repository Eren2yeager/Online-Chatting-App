'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Lightweight, dependency-free emoji picker
// Emits { native: '😀' } on selection for compatibility with callers
export default function EmojiPicker({ isOpen, onClose, onSelect, theme = 'light', emojiList }) {
  const ref = useRef(null);
  const [query, setQuery] = useState('');

  const DEFAULT_EMOJIS = useMemo(() => (
    emojiList || [
      '😀','😃','😄','😁','😆','🥹','😂','🤣','😊','😇','🙂','🙃','😉','😌','😍','🥰','😘','😗','😙','😚','😋','😛','😝','😜','🤪','🤨','🧐','🤓','😎','🥸','🤩','🥳','😏','😒','😞','😔','😟','😕','🙁','☹️','😣','😖','😫','😩','🥺','😢','😭','😤','😠','😡','🤬','🤯','😳','🥵','🥶','😱','😨','😰','😥','😓','🤗','🤔','🫡','🤭','🤫','🤥','😶','🫥','😐','🫤','😑','😬','🙄','😯','😦','😧','😮','😲','🥱','😴','🤤','😪','😵','🤐','🥴','🤮','🤢','🤧','😷','🤒','🤕','🤑','🤠','😈','👿','💀','☠️','👻','👽','🤖','💩',
      '👍','👎','👊','✊','🤛','🤜','👏','🙌','👐','🤲','🙏','✍️','💪','🦾','🖕','✌️','🤞','🫰','🤟','🤘','👌','🤌','🤏','👈','👉','👆','👇','☝️','✋','🤚','🖐️','🖖','👋','🤙','🫵','💅',
      '❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❣️','💕','💞','💓','💗','💖','💘','💝','💟','💌','💤','💢','💥','💫','💦','💨','🕳️',
      '🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🐔','🐧','🐦','🐤','🐣',
      '🍏','🍎','🍐','🍊','🍋','🍌','🍉','🍇','🍓','🫐','🍈','🍒','🍑','🥭','🍍','🥥','🥝','🍅','🍆','🥑',
      '⚽','🏀','🏈','⚾','🎾','🏐','🏉','🎱','🏓','🏸','🥅','🥊','🥋','🎽','⛸️','🥌'
    ]
  ), [emojiList]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return DEFAULT_EMOJIS;
    // Basic filter by unicode name is not available; filter by common aliases we embed
    // For simplicity, filter by removing non-matching when query is in shortcode-style patterns
    // or just include all since we lack names. Implement simple numeric filter for now.
    return DEFAULT_EMOJIS.filter(e => e);
  }, [query, DEFAULT_EMOJIS]);

  useEffect(() => {
    const handleOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose?.();
    };
    if (isOpen) document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed inset-x-0 bottom-0 z-50 bg-white border-t border-gray-200 rounded-t-2xl shadow-2xl"
        >
          <div ref={ref} className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search emoji"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button onClick={onClose} className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900">Close</button>
            </div>
            <div className="grid grid-cols-8 gap-2 max-h-72 overflow-y-auto">
              {filtered.map((emoji, idx) => (
                <button
                  key={`${emoji}-${idx}`}
                  className={`text-2xl hover:scale-110 transition ${theme === 'dark' ? 'text-white' : ''}`}
                  onClick={() => onSelect?.({ native: emoji })}
                  title={emoji}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}


