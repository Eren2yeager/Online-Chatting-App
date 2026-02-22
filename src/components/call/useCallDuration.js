'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';

/**
 * Hook to calculate call durations:
 * - Room call duration: from connectedAt
 * - User presence time: from user's joinedAt to now (or leftAt if left)
 */
export function useCallDuration(currentCall, callState) {
  const { data: session } = useSession();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (callState !== 'active' || !currentCall) {
      setNow(Date.now());
      return;
    }
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [callState, currentCall]);

  const roomDuration = useMemo(() => {
    if (!currentCall?.connectedAt || callState !== 'active') return 0;
    const start = new Date(currentCall.connectedAt).getTime();
    return Math.floor((now - start) / 1000);
  }, [currentCall?.connectedAt, callState, now]);

  const userPresenceTime = useMemo(() => {
    if (!currentCall?.participants || !session?.user?.id) return 0;
    const userId = String(session.user.id);
    const participant = currentCall.participants.find(
      (p) => String(p.userId?._id || p.userId) === userId
    );
    if (!participant) return 0;

    const start = participant.joinedAt ? new Date(participant.joinedAt).getTime() : null;
    const end = participant.leftAt ? new Date(participant.leftAt).getTime() : null;

    if (!start) return 0;
    if (end) return Math.floor((end - start) / 1000);
    if (participant.status === 'joined') {
      return Math.floor((now - start) / 1000);
    }
    return 0;
  }, [currentCall?.participants, session?.user?.id, now]);

  const formatDuration = (seconds) => {
    if (seconds <= 0) return '0:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return {
    roomDuration,
    userPresenceTime,
    roomDurationFormatted: formatDuration(roomDuration),
    userPresenceTimeFormatted: formatDuration(userPresenceTime),
  };
}
