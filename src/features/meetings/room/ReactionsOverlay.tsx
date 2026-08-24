import React from 'react';

export interface FloatingReaction {
  id: string;
  emoji: string;
  senderName?: string;
}

interface ReactionsOverlayProps {
  reactions: FloatingReaction[];
}

export const ReactionsOverlay: React.FC<ReactionsOverlayProps> = ({ reactions }) => {
  if (reactions.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
      {reactions.map((r) => (
        <div
          key={r.id}
          className="absolute bottom-20 left-10 sm:left-24 animate-float-reaction flex items-center space-x-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10"
        >
          <span className="text-2xl sm:text-3xl">{r.emoji}</span>
          {r.senderName && (
            <span className="text-xs font-bold text-white">{r.senderName}</span>
          )}
        </div>
      ))}
    </div>
  );
};
