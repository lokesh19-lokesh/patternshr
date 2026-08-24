import React from 'react';

interface LiveCaptionsOverlayProps {
  captionText: string;
  speaker: string;
  isActive: boolean;
}

export const LiveCaptionsOverlay: React.FC<LiveCaptionsOverlayProps> = ({
  captionText,
  speaker,
  isActive,
}) => {
  if (!isActive || !captionText) return null;

  return (
    <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20 pointer-events-none max-w-2xl w-[90%] text-center animate-fade-in">
      <div className="inline-block px-5 py-2.5 bg-black/80 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl text-white">
        <span className="font-bold text-primary-green mr-2 text-xs sm:text-sm">
          {speaker}:
        </span>
        <span className="text-xs sm:text-sm font-medium tracking-wide leading-relaxed">
          {captionText}
        </span>
      </div>
    </div>
  );
};
