import React, { useState } from 'react';
import { ParticipantTile } from './ParticipantTile';
import { LayoutGrid, Maximize, Columns } from 'lucide-react';

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

export type VideoLayoutMode = 'auto' | 'grid' | 'spotlight' | 'sidebar';

interface VideoGridProps {
  localUser: MeetingPeer;
  remotePeers: MeetingPeer[];
  screenSharingPeer?: MeetingPeer | null;
  isLocalBlurred?: boolean;
}

export const VideoGrid: React.FC<VideoGridProps> = ({
  localUser,
  remotePeers,
  screenSharingPeer,
  isLocalBlurred = false,
}) => {
  const [pinnedId, setPinnedId] = useState<string | null>(null);
  const [layoutMode, setLayoutMode] = useState<VideoLayoutMode>('auto');

  const allParticipants = [localUser, ...remotePeers];
  const totalCount = allParticipants.length;

  // Active speaker detection (threshold > 25)
  const isSpeaking = (p: MeetingPeer) => (p.audioLevel || 0) > 25 && !p.isAudioMuted;

  // Most active remote speaker
  const activeSpeaker = allParticipants.find((p) => isSpeaking(p)) || allParticipants[1] || allParticipants[0];

  // Determine which user gets the main stage if in spotlight / sidebar mode
  const spotlightUser = screenSharingPeer || (pinnedId ? allParticipants.find((p) => p.id === pinnedId) : null) || (layoutMode === 'spotlight' || layoutMode === 'sidebar' ? activeSpeaker : null);

  const renderLayoutControls = () => (
    <div className="absolute top-4 right-4 z-20 flex items-center space-x-1 bg-[#171A1C]/80 backdrop-blur-md p-1 rounded-2xl border border-white/10 shadow-lg">
      <button
        onClick={() => setLayoutMode('auto')}
        title="Auto Layout"
        className={`p-2 rounded-xl text-xs font-bold transition-all ${
          layoutMode === 'auto'
            ? 'bg-primary-green text-white shadow-sm'
            : 'text-gray-400 hover:text-white hover:bg-white/10'
        }`}
      >
        <LayoutGrid className="h-3.5 w-3.5" />
      </button>

      <button
        onClick={() => setLayoutMode('spotlight')}
        title="Spotlight Focus"
        className={`p-2 rounded-xl text-xs font-bold transition-all ${
          layoutMode === 'spotlight'
            ? 'bg-primary-green text-white shadow-sm'
            : 'text-gray-400 hover:text-white hover:bg-white/10'
        }`}
      >
        <Maximize className="h-3.5 w-3.5" />
      </button>

      <button
        onClick={() => setLayoutMode('sidebar')}
        title="Sidebar Filmstrip"
        className={`p-2 rounded-xl text-xs font-bold transition-all ${
          layoutMode === 'sidebar'
            ? 'bg-primary-green text-white shadow-sm'
            : 'text-gray-400 hover:text-white hover:bg-white/10'
        }`}
      >
        <Columns className="h-3.5 w-3.5" />
      </button>
    </div>
  );

  // If a screen is being shared, pinned, or layout is spotlight/sidebar
  if (spotlightUser && (layoutMode !== 'grid' || screenSharingPeer || pinnedId)) {
    const sidebarPeers = allParticipants.filter((p) => p.id !== spotlightUser.id);
    return (
      <div className="relative flex-1 w-full h-full p-4 flex flex-col lg:flex-row gap-4 overflow-hidden animate-fade-in">
        {renderLayoutControls()}

        {/* Main Spotlighted Stage */}
        <div className="flex-1 h-full min-h-[320px]">
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
            isBlurred={spotlightUser.id === localUser.id && isLocalBlurred}
            isPinned={pinnedId === spotlightUser.id}
            onPin={() => setPinnedId(pinnedId === spotlightUser.id ? null : spotlightUser.id)}
          />
        </div>

        {/* Sidebar participant list */}
        {sidebarPeers.length > 0 && (
          <div className="lg:w-80 flex lg:flex-col gap-3 overflow-x-auto lg:overflow-y-auto max-h-48 lg:max-h-full flex-shrink-0">
            {sidebarPeers.map((peer) => (
              <div key={peer.id} className="w-52 lg:w-full h-40 flex-shrink-0">
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
                  isBlurred={peer.id === localUser.id && isLocalBlurred}
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
    <div className="relative flex-1 w-full h-full p-4 flex items-center justify-center overflow-y-auto animate-fade-in">
      {renderLayoutControls()}
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
            isBlurred={peer.id === localUser.id && isLocalBlurred}
            isPinned={pinnedId === peer.id}
            onPin={() => setPinnedId(pinnedId === peer.id ? null : peer.id)}
          />
        ))}
      </div>
    </div>
  );
};
