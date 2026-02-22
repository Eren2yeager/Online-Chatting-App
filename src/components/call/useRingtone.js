'use client';

import { useEffect, useRef } from 'react';

/**
 * Hook to play ringtones for incoming/outgoing calls
 * @param {string} type - 'incoming' | 'dialing' | null
 * @param {boolean} enabled - Whether to play the ringtone
 */
export function useRingtone(type, enabled) {
  const audioRef = useRef(null);

  useEffect(() => {
    if (!enabled || !type) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      return;
    }

    const audio = new Audio();
    audioRef.current = audio;

    if (type === 'incoming') {
      audio.src = '/sounds/call_ringtone.mp3';
    } else if (type === 'dialing') {
      audio.src = '/sounds/dialing_ringtone.mp3';
    }

    audio.loop = true;
    audio.volume = 0.7;

    const playPromise = audio.play();
    if (playPromise) {
      playPromise.catch((err) => {
        console.warn('Ringtone play failed:', err);
      });
    }

    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, [type, enabled]);

  return audioRef;
}
