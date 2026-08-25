import React, { useRef, useEffect, useState } from 'react';
import { MicOff, Hand, Pin, Crown, PictureInPicture2, Wifi } from 'lucide-react';

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
  isBlurred?: boolean;
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
  isBlurred,
  onPin,
  isPinned,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPipActive, setIsPipActive] = useState(false);

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

  const handleTogglePiP = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setIsPipActive(false);
      } else if (videoRef.current && document.pictureInPictureEnabled) {
        await videoRef.current.requestPictureInPicture();
        setIsPipActive(true);
      }
    } catch (err) {
      console.warn('PiP not available or failed:', err);
    }
  };

  return (
    <div
      className={`relative w-full h-full min-h-[160px] bg-[#24292D] rounded-3xl overflow-hidden border transition-all duration-300 flex items-center justify-center group ${
        isSpeaking
          ? 'border-primary-green ring-4 ring-primary-green/30 shadow-2xl shadow-emerald-950'
          : 'border-gray-800 hover:border-gray-700'
      }`}
    >
      {/* Video Element */}
      {!isVideoMuted && stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className={`w-full h-full object-cover transition-all duration-300 ${
            isLocal && !isScreenSharing ? 'scale-x-[-1]' : ''
          } ${isBlurred ? 'filter blur-sm scale-105' : ''}`}
        />
      ) : (
        /* Avatar Placeholder when video is OFF */
        <div className="flex flex-col items-center justify-center space-y-3 p-4">
          <div className="relative">
            <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-3xl bg-gradient-to-br from-soft-green to-emerald-200 text-dark-green flex items-center justify-center font-black text-2xl sm:text-3xl border-2 border-primary-green/40 shadow-inner">
              {initials}
            </div>
            {isSpeaking && (
              <div className="absolute -inset-1.5 rounded-3xl border-2 border-primary-green animate-ping pointer-events-none opacity-60"></div>
            )}
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
          <div className="flex items-center space-x-1 px-2 py-0.5 bg-primary-green/20 text-primary-green border border-primary-green/30 rounded-full text-[10px] font-bold backdrop-blur-md">
            <Crown className="h-3 w-3" />
            <span>Host</span>
          </div>
        )}

        {/* Network Strength Indicator */}
        <div
          className="hidden sm:flex items-center space-x-1 px-2 py-0.5 bg-black/50 backdrop-blur-md border border-white/10 rounded-full text-[10px] text-emerald-400 font-mono"
          title="Connection Quality: Good"
        >
          <Wifi className="h-2.5 w-2.5" />
          <span>HD</span>
        </div>
      </div>

      {/* Top Right: Pin & PiP Controls Overlay */}
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1.5 z-10">
        {!isVideoMuted && stream && (
          <button
            onClick={handleTogglePiP}
            title={isPipActive ? 'Exit Picture-in-Picture' : 'Picture-in-Picture (PiP)'}
            className={`p-2 rounded-xl backdrop-blur-md text-white transition-colors ${
              isPipActive ? 'bg-primary-green text-white' : 'bg-black/60 hover:bg-black/80'
            }`}
          >
            <PictureInPicture2 className="h-3.5 w-3.5" />
          </button>
        )}

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

        {/* Muted Mic / Voice Activity Indicator */}
        <div
          className={`p-1.5 rounded-xl backdrop-blur-md border ${
            isAudioMuted
              ? 'bg-rose-600/80 border-rose-500 text-white'
              : 'bg-black/60 border-white/10 text-emerald-400'
          }`}
        >
          {isAudioMuted ? (
            <MicOff className="h-3.5 w-3.5" />
          ) : (
            <div className="flex items-center space-x-0.5">
              <span className={`h-2.5 w-0.5 rounded-full ${isSpeaking ? 'bg-primary-green animate-pulse' : 'bg-emerald-500/60'}`}></span>
              <span className={`h-3.5 w-0.5 rounded-full ${isSpeaking ? 'bg-primary-green animate-pulse' : 'bg-emerald-500/60'}`}></span>
              <span className={`h-2 w-0.5 rounded-full ${isSpeaking ? 'bg-primary-green animate-pulse' : 'bg-emerald-500/60'}`}></span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
