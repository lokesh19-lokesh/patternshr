import React, { useState } from 'react';
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  MonitorUp, 
  MessageSquare, 
  Users, 
  Hand, 
  Smile, 
  FileText, 
  Settings, 
  PhoneOff, 
  Radio, 
  UserCheck, 
  Award, 
  Maximize2, 
  Minimize2, 
  Captions 
} from 'lucide-react';
import type { MeetingType } from '../../../services/meeting.service';

interface MeetingControlsBarProps {
  isAudioMuted: boolean;
  isVideoMuted: boolean;
  isScreenSharing: boolean;
  isHandRaised: boolean;
  isRecording: boolean;
  isCaptionsActive: boolean;
  activeDrawer: 'chat' | 'people' | 'notes' | 'interview' | 'review' | null;
  unreadChatCount: number;
  participantsCount: number;
  meetingType: MeetingType;
  isHost: boolean;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare: () => void;
  onToggleHandRaise: () => void;
  onToggleRecording: () => void;
  onToggleCaptions: () => void;
  onToggleDrawer: (drawer: 'chat' | 'people' | 'notes' | 'interview' | 'review') => void;
  onOpenSettings: () => void;
  onSendReaction: (emoji: string) => void;
  onLeaveMeeting: () => void;
}

export const MeetingControlsBar: React.FC<MeetingControlsBarProps> = ({
  isAudioMuted,
  isVideoMuted,
  isScreenSharing,
  isHandRaised,
  isRecording,
  isCaptionsActive,
  activeDrawer,
  unreadChatCount,
  participantsCount,
  meetingType,
  isHost,
  onToggleAudio,
  onToggleVideo,
  onToggleScreenShare,
  onToggleHandRaise,
  onToggleRecording,
  onToggleCaptions,
  onToggleDrawer,
  onOpenSettings,
  onSendReaction,
  onLeaveMeeting,
}) => {
  const [showReactionsMenu, setShowReactionsMenu] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const reactions = ['👍', '❤️', '👏', '😂', '🎉', '🔥', '✋', '❓'];

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div className="relative py-3 px-4 sm:px-6 bg-[#171A1C]/95 backdrop-blur-md border-t border-gray-800 flex items-center justify-between z-30">
      {/* 1. Left Controls: Captions, Fullscreen, Recording */}
      <div className="hidden md:flex items-center space-x-2">
        <button
          onClick={onToggleCaptions}
          title="Toggle Live Captions"
          className={`p-3 rounded-2xl border transition-all flex items-center space-x-1.5 text-xs font-bold ${
            isCaptionsActive
              ? 'bg-primary-green/20 border-primary-green text-primary-green'
              : 'bg-gray-800/80 border-gray-700 text-gray-300 hover:bg-gray-700'
          }`}
        >
          <Captions className="h-4 w-4" />
          <span className="hidden lg:inline">Captions</span>
        </button>

        {isHost && (
          <button
            onClick={onToggleRecording}
            title={isRecording ? 'Stop Recording' : 'Start Recording'}
            className={`p-3 rounded-2xl border transition-all flex items-center space-x-1.5 text-xs font-bold ${
              isRecording
                ? 'bg-rose-600 border-rose-500 text-white animate-pulse'
                : 'bg-gray-800/80 border-gray-700 text-gray-300 hover:bg-gray-700'
            }`}
          >
            <Radio className="h-4 w-4 text-rose-400" />
            <span className="hidden lg:inline">{isRecording ? 'Recording' : 'Record'}</span>
          </button>
        )}

        <button
          onClick={toggleFullscreen}
          title="Toggle Fullscreen"
          className="p-3 rounded-2xl bg-gray-800/80 hover:bg-gray-700 border border-gray-700 text-gray-300 transition-colors"
        >
          {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </button>
      </div>

      {/* 2. Middle Main Floating Pills: Mic, Cam, Screen, Hand, Reactions */}
      <div className="flex items-center space-x-2.5 mx-auto">
        {/* Mic Toggle */}
        <button
          onClick={onToggleAudio}
          title={isAudioMuted ? 'Unmute (M)' : 'Mute (M)'}
          className={`p-3.5 sm:p-4 rounded-2xl transition-all shadow-md ${
            isAudioMuted
              ? 'bg-rose-600 hover:bg-rose-700 text-white'
              : 'bg-gray-800 hover:bg-gray-700 text-white border border-gray-700'
          }`}
        >
          {isAudioMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5 text-emerald-400" />}
        </button>

        {/* Cam Toggle */}
        <button
          onClick={onToggleVideo}
          title={isVideoMuted ? 'Start Camera (C)' : 'Stop Camera (C)'}
          className={`p-3.5 sm:p-4 rounded-2xl transition-all shadow-md ${
            isVideoMuted
              ? 'bg-rose-600 hover:bg-rose-700 text-white'
              : 'bg-gray-800 hover:bg-gray-700 text-white border border-gray-700'
          }`}
        >
          {isVideoMuted ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5 text-emerald-400" />}
        </button>

        {/* Screen Share */}
        <button
          onClick={onToggleScreenShare}
          title="Share Screen (S)"
          className={`p-3.5 sm:p-4 rounded-2xl transition-all border ${
            isScreenSharing
              ? 'bg-primary-green hover:bg-dark-green text-white border-primary-green'
              : 'bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-700'
          }`}
        >
          <MonitorUp className="h-5 w-5" />
        </button>

        {/* Hand Raise */}
        <button
          onClick={onToggleHandRaise}
          title="Raise Hand (H)"
          className={`p-3.5 sm:p-4 rounded-2xl transition-all border ${
            isHandRaised
              ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-400 animate-bounce'
              : 'bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-700'
          }`}
        >
          <Hand className="h-5 w-5" />
        </button>

        {/* Reactions Picker */}
        <div className="relative">
          <button
            onClick={() => setShowReactionsMenu(!showReactionsMenu)}
            title="Reactions"
            className="p-3.5 sm:p-4 rounded-2xl bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 transition-colors"
          >
            <Smile className="h-5 w-5" />
          </button>

          {showReactionsMenu && (
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 p-2 bg-[#24292D] border border-gray-700 rounded-2xl shadow-2xl flex items-center space-x-1 z-50 animate-fade-in">
              {reactions.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => {
                    onSendReaction(emoji);
                    setShowReactionsMenu(false);
                  }}
                  className="p-2 text-xl hover:scale-125 transition-transform rounded-xl hover:bg-white/10"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* End / Leave Call */}
        <button
          onClick={onLeaveMeeting}
          title="Leave Meeting"
          className="p-3.5 sm:p-4 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition-all shadow-lg shadow-rose-950 flex items-center space-x-2"
        >
          <PhoneOff className="h-5 w-5" />
          <span className="hidden sm:inline text-xs">Leave</span>
        </button>
      </div>

      {/* 3. Right Controls: Drawers (Chat, People, Notes, Special HR) */}
      <div className="flex items-center space-x-2">
        {/* Candidate Interview Mode (HR Only) */}
        {meetingType === 'interview' && (
          <button
            onClick={() => onToggleDrawer('interview')}
            className={`p-3 rounded-2xl border transition-all flex items-center space-x-1.5 text-xs font-bold ${
              activeDrawer === 'interview'
                ? 'bg-purple-600 border-purple-500 text-white'
                : 'bg-purple-950/60 border-purple-800/60 text-purple-300 hover:bg-purple-900/60'
            }`}
            title="Candidate Scorecard"
          >
            <UserCheck className="h-4 w-4" />
            <span className="hidden xl:inline">Scorecard</span>
          </button>
        )}

        {/* Performance Review Mode */}
        {meetingType === 'performance_review' && (
          <button
            onClick={() => onToggleDrawer('review')}
            className={`p-3 rounded-2xl border transition-all flex items-center space-x-1.5 text-xs font-bold ${
              activeDrawer === 'review'
                ? 'bg-blue-600 border-blue-500 text-white'
                : 'bg-blue-950/60 border-blue-800/60 text-blue-300 hover:bg-blue-900/60'
            }`}
            title="Performance Goals"
          >
            <Award className="h-4 w-4" />
            <span className="hidden xl:inline">Review Goals</span>
          </button>
        )}

        {/* Collaborative Notes */}
        <button
          onClick={() => onToggleDrawer('notes')}
          title="Meeting Notes"
          className={`p-3 rounded-2xl border transition-all ${
            activeDrawer === 'notes'
              ? 'bg-primary-green border-primary-green text-white'
              : 'bg-gray-800/80 border-gray-700 text-gray-300 hover:bg-gray-700'
          }`}
        >
          <FileText className="h-4 w-4" />
        </button>

        {/* In-Meeting Chat */}
        <button
          onClick={() => onToggleDrawer('chat')}
          title="In-Meeting Chat"
          className={`relative p-3 rounded-2xl border transition-all ${
            activeDrawer === 'chat'
              ? 'bg-primary-green border-primary-green text-white'
              : 'bg-gray-800/80 border-gray-700 text-gray-300 hover:bg-gray-700'
          }`}
        >
          <MessageSquare className="h-4 w-4" />
          {unreadChatCount > 0 && activeDrawer !== 'chat' && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-bounce">
              {unreadChatCount}
            </span>
          )}
        </button>

        {/* Participants Panel */}
        <button
          onClick={() => onToggleDrawer('people')}
          title="Participants List"
          className={`relative p-3 rounded-2xl border transition-all flex items-center space-x-1 ${
            activeDrawer === 'people'
              ? 'bg-primary-green border-primary-green text-white'
              : 'bg-gray-800/80 border-gray-700 text-gray-300 hover:bg-gray-700'
          }`}
        >
          <Users className="h-4 w-4" />
          <span className="text-xs font-bold ml-1">{participantsCount}</span>
        </button>

        {/* Settings */}
        <button
          onClick={onOpenSettings}
          title="Device Settings"
          className="p-3 rounded-2xl bg-gray-800/80 hover:bg-gray-700 border border-gray-700 text-gray-300 transition-colors"
        >
          <Settings className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
