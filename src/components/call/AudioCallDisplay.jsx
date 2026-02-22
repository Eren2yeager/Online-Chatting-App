'use client';

import { useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Avatar } from '@/components/ui';
import { Mic, MicOff } from 'lucide-react';

export default function AudioCallDisplay({
  localStream,
  remoteStreams,
  participantsInfo = new Map(),
  isMuted,
}) {
  const { data: session } = useSession();
  const remoteAudiosRef = useRef(new Map());

  useEffect(() => {
    remoteStreams.forEach((stream, userId) => {
      const el = remoteAudiosRef.current.get(userId);
      if (el && el.srcObject !== stream) {
        el.srcObject = stream;
        el.play().catch(() => {});
      }
    });
  }, [remoteStreams]);

  const selfInfo = session?.user
    ? { name: session.user.name || 'You', image: session.user.image }
    : { name: 'You', image: null };

  const getParticipantInfo = (userId) => {
    const info = participantsInfo.get(String(userId));
    return info || { name: 'User', image: null, isMuted: false };
  };

  const remoteEntries = Array.from(remoteStreams.entries());

  return (
    <div className="max-w-md mx-auto w-full" role="region" aria-label="Audio call participants">
      <div className="rounded-xl border border-gray-200 bg-white p-6 sm:p-8 text-center space-y-6 shadow-sm">
        <div className="text-6xl sm:text-7xl">🎙️</div>
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">Audio Call</h2>

        {/* Local status */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 flex-wrap">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50">
            <Avatar src={selfInfo.image} alt={selfInfo.name} size="lg" fallback={selfInfo.name} />
            <div className="text-left">
              <p className="font-medium text-gray-800">{selfInfo.name}</p>
              <p className="text-sm text-gray-500 flex items-center gap-1">
                {isMuted ? (
                  <>
                    <MicOff className="h-4 w-4 text-red-500" strokeWidth={2.5} />
                    Muted
                  </>
                ) : (
                  <>
                    <Mic className="h-4 w-4 text-green-500" strokeWidth={2.5} />
                    Unmuted
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Remote participants */}
          {remoteEntries.map(([userId, stream]) => {
            const info = getParticipantInfo(userId);
            const isMutedRemote = info.isMuted ?? false;
            return (
              <div
                key={userId}
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50"
              >
                <Avatar src={info.image} alt={info.name} size="lg" fallback={info.name} />
                <div className="text-left">
                  <p className="font-medium text-gray-800 truncate max-w-[120px]">{info.name}</p>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    {isMutedRemote ? (
                      <>
                        <MicOff className="h-4 w-4 text-red-500" strokeWidth={2.5} />
                        Muted
                      </>
                    ) : (
                      <>
                        <Mic className="h-4 w-4 text-green-500" strokeWidth={2.5} />
                        Unmuted
                      </>
                    )}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-sm text-gray-500">
          {remoteEntries.length} participant{remoteEntries.length !== 1 ? 's' : ''} connected
        </p>

        {/* Hidden audio elements for remote streams */}
        <div className="sr-only" aria-hidden>
          {remoteEntries.map(([userId, stream]) => (
            <audio
              key={userId}
              ref={(el) => {
                if (el) {
                  remoteAudiosRef.current.set(userId, el);
                  if (stream && el.srcObject !== stream) {
                    el.srcObject = stream;
                    el.play().catch(() => {});
                  }
                }
              }}
              autoPlay
              playsInline
              aria-hidden
            />
          ))}
        </div>
      </div>
    </div>
  );
}
