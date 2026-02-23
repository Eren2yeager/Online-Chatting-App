'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useSession } from 'next-auth/react';

/**
 * Hook to calculate call durations:
 * - Room call duration: from connectedAt or startedAt
 * - User presence time: from user's joinedAt to now (or leftAt if left)
 */
export function useCallDuration(currentCall, callState) {
  const { data: session } = useSession();
  const [now, setNow] = useState(() => Date.now());
  const activeSinceRef = useRef(null);

  useEffect(() => {
    if (callState !== 'active' || !currentCall) {
      activeSinceRef.current = null;
      setNow(Date.now());
      return;
    }
    if (!activeSinceRef.current) {
      activeSinceRef.current = Date.now();
    }
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [callState, currentCall]);

  const roomDuration = useMemo(() => {
    if (callState !== 'active' || !currentCall) return 0;
    const startTime = currentCall.connectedAt || currentCall.startedAt;
    const start = startTime ? new Date(startTime).getTime() : (activeSinceRef.current || now);
    return Math.max(0, Math.floor((now - start) / 1000));
  }, [currentCall?.connectedAt, currentCall?.startedAt, callState, now, currentCall]);

  const userPresenceTime = useMemo(() => {
    if (!currentCall?.participants || !session?.user?.id || callState !== 'active') return 0;
    const userId = String(session.user.id);
    const participant = currentCall.participants.find(
      (p) => String(p.userId?._id || p.userId) === userId
    );
    if (!participant) return 0;

    let start = participant.joinedAt ? new Date(participant.joinedAt).getTime() : null;
    if (!start && ['calling', 'joined'].includes(participant.status)) {
      start = currentCall.connectedAt
        ? new Date(currentCall.connectedAt).getTime()
        : currentCall.startedAt
          ? new Date(currentCall.startedAt).getTime()
          : activeSinceRef.current || now;
    }
    if (!start) return 0;
    const end = participant.leftAt ? new Date(participant.leftAt).getTime() : null;
    if (end) return Math.floor((end - start) / 1000);
    return Math.floor((now - start) / 1000);
  }, [currentCall?.participants, currentCall?.connectedAt, currentCall?.startedAt, session?.user?.id, now, callState]);

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
