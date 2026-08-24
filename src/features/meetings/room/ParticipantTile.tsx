import React, { useRef, useEffect } from 'react';
import { MicOff, Hand, Pin, Crown } from 'lucide-react';

interface ParticipantTileProps {
  id?: string;
  name: string;
  stream?: MediaStream | null;
  isAudioMuted: boolean;
  isVideoMuted: boolean;
  isScreenSharing?: boolean;
  isHandRaised?: boolean;
  isHost?: boolean;
  isSpeaking?: boolean;
  isLocal?: boolean;
  onPin?: () => void;
  isPinned?: boolean;
}

export const ParticipantTile: React.FC<ParticipantTileProps> = ({
  name,
  stream,
  isAudioMuted,
  isVideoMuted,
  isScreenSharing,
  isHandRaised,
  isHost,
  isSpeaking,
  isLocal,
  onPin,
  isPinned,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <div
      className={`relative w-full h-full min-h-[160px] bg-[#24292D] rounded-3xl overflow-hidden border transition-all duration-200 flex items-center justify-center group ${
        isSpeaking
          ? 'border-primary-green ring-4 ring-primary-green/30 shadow-lg shadow-emerald-950'
          : 'border-gray-800 hover:border-gray-700'
      }`}
    >
      {/* Video Element (Rendered if camera is active and stream exists) */}
      {!isVideoMuted && stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal} // Mute local audio feedback
          className={`w-full h-full object-cover ${isLocal && !isScreenSharing ? 'scale-x-[-1]' : ''}`}
        />
      ) : (
        /* Avatar Placeholder when video is OFF */
        <div className="flex flex-col items-center justify-center space-y-3 p-4">
          <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-3xl bg-soft-green text-dark-green flex items-center justify-center font-black text-2xl sm:text-3xl border-2 border-primary-green/30 shadow-inner">
            {initials}
          </div>
          <span className="text-sm font-bold text-gray-200 truncate max-w-[150px]">
            {name}
          </span>
        </div>
      )}

      {/* Top Left: Hand Raised & Host Badges */}
      <div className="absolute top-3 left-3 flex items-center space-x-2 z-10">
        {isHandRaised && (
          <div className="flex items-center space-x-1 px-2.5 py-1 bg-amber-500 text-white rounded-full text-xs font-bold shadow-md animate-bounce">
            <Hand className="h-3.5 w-3.5" />
            <span>Hand Raised</span>
          </div>
        )}

        {isHost && (
          <div className="flex items-center space-x-1 px-2 py-0.5 bg-primary-green/20 text-primary-green border border-primary-green/30 rounded-full text-[10px] font-bold">
            <Crown className="h-3 w-3" />
            <span>Host</span>
          </div>
        )}
      </div>

      {/* Top Right: Pin & Controls Hover Overlay */}
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1.5 z-10">
        {onPin && (
          <button
            onClick={onPin}
            title={isPinned ? 'Unpin tile' : 'Pin tile'}
            className={`p-2 rounded-xl backdrop-blur-md text-white transition-colors ${
              isPinned ? 'bg-primary-green text-white' : 'bg-black/60 hover:bg-black/80'
            }`}
          >
            <Pin className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Bottom Name & Mic Pill Bar */}
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
        <div className="px-3 py-1 bg-black/60 backdrop-blur-md rounded-xl text-xs font-bold text-white flex items-center space-x-2 border border-white/10 max-w-[80%] truncate">
          <span className="truncate">{name} {isLocal ? '(You)' : ''}</span>
          {isScreenSharing && (
            <span className="text-[10px] text-primary-green font-normal">(Presenting)</span>
          )}
        </div>

        {/* Muted Mic Indicator */}
        <div
          className={`p-1.5 rounded-xl backdrop-blur-md border ${
            isAudioMuted
              ? 'bg-rose-600/80 border-rose-500 text-white'
              : 'bg-black/60 border-white/10 text-emerald-400'
          }`}
        >
          {isAudioMuted ? <MicOff className="h-3.5 w-3.5" /> : <div className="h-2 w-2 rounded-full bg-primary-green animate-pulse"></div>}
        </div>
      </div>
    </div>
  );
};
