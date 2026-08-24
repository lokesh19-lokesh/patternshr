import React, { useState } from 'react';
import { ParticipantTile } from './ParticipantTile';

export interface MeetingPeer {
  id: string;
  name: string;
  stream?: MediaStream | null;
  isAudioMuted: boolean;
  isVideoMuted: boolean;
  isScreenSharing?: boolean;
  isHandRaised?: boolean;
  isHost?: boolean;
  audioLevel?: number;
}

interface VideoGridProps {
  localUser: MeetingPeer;
  remotePeers: MeetingPeer[];
  screenSharingPeer?: MeetingPeer | null;
}

export const VideoGrid: React.FC<VideoGridProps> = ({
  localUser,
  remotePeers,
  screenSharingPeer,
}) => {
  const [pinnedId, setPinnedId] = useState<string | null>(null);

  const allParticipants = [localUser, ...remotePeers];
  const totalCount = allParticipants.length;

  // Active speaker detection (threshold > 25)
  const isSpeaking = (p: MeetingPeer) => (p.audioLevel || 0) > 25 && !p.isAudioMuted;

  // If a screen is being shared or pinned, render Spotlight Layout
  const spotlightUser = screenSharingPeer || allParticipants.find((p) => p.id === pinnedId);

  if (spotlightUser) {
    const sidebarPeers = allParticipants.filter((p) => p.id !== spotlightUser.id);
    return (
      <div className="flex-1 w-full h-full p-4 flex flex-col lg:flex-row gap-4 overflow-hidden">
        {/* Main Spotlighted Stage */}
        <div className="flex-1 h-full min-h-[300px]">
          <ParticipantTile
            id={spotlightUser.id}
            name={spotlightUser.name}
            stream={spotlightUser.stream}
            isAudioMuted={spotlightUser.isAudioMuted}
            isVideoMuted={spotlightUser.isVideoMuted}
            isScreenSharing={spotlightUser.isScreenSharing}
            isHandRaised={spotlightUser.isHandRaised}
            isHost={spotlightUser.isHost}
            isSpeaking={isSpeaking(spotlightUser)}
            isLocal={spotlightUser.id === localUser.id}
            isPinned={pinnedId === spotlightUser.id}
            onPin={() => setPinnedId(pinnedId === spotlightUser.id ? null : spotlightUser.id)}
          />
        </div>

        {/* Sidebar participant list */}
        {sidebarPeers.length > 0 && (
          <div className="lg:w-72 flex lg:flex-col gap-3 overflow-x-auto lg:overflow-y-auto max-h-48 lg:max-h-full">
            {sidebarPeers.map((peer) => (
              <div key={peer.id} className="w-48 lg:w-full h-36 flex-shrink-0">
                <ParticipantTile
                  id={peer.id}
                  name={peer.name}
                  stream={peer.stream}
                  isAudioMuted={peer.isAudioMuted}
                  isVideoMuted={peer.isVideoMuted}
                  isScreenSharing={peer.isScreenSharing}
                  isHandRaised={peer.isHandRaised}
                  isHost={peer.isHost}
                  isSpeaking={isSpeaking(peer)}
                  isLocal={peer.id === localUser.id}
                  isPinned={pinnedId === peer.id}
                  onPin={() => setPinnedId(pinnedId === peer.id ? null : peer.id)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Regular Adaptive Grid depending on participant count
  const getGridClasses = (count: number) => {
    if (count === 1) return 'grid-cols-1 max-w-4xl max-h-[85vh] mx-auto';
    if (count === 2) return 'grid-cols-1 md:grid-cols-2 max-w-6xl max-h-[85vh] mx-auto';
    if (count <= 4) return 'grid-cols-1 sm:grid-cols-2 max-w-6xl';
    if (count <= 6) return 'grid-cols-2 sm:grid-cols-3 max-w-7xl';
    return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 max-w-7xl';
  };

  return (
    <div className="flex-1 w-full h-full p-4 flex items-center justify-center overflow-y-auto">
      <div className={`grid gap-4 w-full h-full ${getGridClasses(totalCount)}`}>
        {allParticipants.map((peer) => (
          <ParticipantTile
            key={peer.id}
            id={peer.id}
            name={peer.name}
            stream={peer.stream}
            isAudioMuted={peer.isAudioMuted}
            isVideoMuted={peer.isVideoMuted}
            isScreenSharing={peer.isScreenSharing}
            isHandRaised={peer.isHandRaised}
            isHost={peer.isHost}
            isSpeaking={isSpeaking(peer)}
            isLocal={peer.id === localUser.id}
            isPinned={pinnedId === peer.id}
            onPin={() => setPinnedId(pinnedId === peer.id ? null : peer.id)}
          />
        ))}
      </div>
    </div>
  );
};
