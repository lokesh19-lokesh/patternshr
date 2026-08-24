import React from 'react';
import { X, Mic, MicOff, Video, VideoOff, Crown, Hand, UserMinus, Check, UserX } from 'lucide-react';
import type { MeetingPeer } from './VideoGrid';

interface WaitingParticipant {
  id: string;
  name: string;
}

interface InMeetingPeopleDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  localUser: MeetingPeer;
  remotePeers: MeetingPeer[];
  waitingList?: WaitingParticipant[];
  isHost: boolean;
  onMuteParticipant?: (peerId: string) => void;
  onMuteAll?: () => void;
  onRemoveParticipant?: (peerId: string) => void;
  onAdmitWaiting?: (participantId: string) => void;
  onRejectWaiting?: (participantId: string) => void;
}

export const InMeetingPeopleDrawer: React.FC<InMeetingPeopleDrawerProps> = ({
  isOpen,
  onClose,
  localUser,
  remotePeers,
  waitingList = [],
  isHost,
  onMuteParticipant,
  onMuteAll,
  onRemoveParticipant,
  onAdmitWaiting,
  onRejectWaiting,
}) => {
  if (!isOpen) return null;

  const allInMeeting = [localUser, ...remotePeers];

  return (
    <div className="fixed sm:absolute top-0 right-0 w-full sm:w-80 md:w-96 h-full bg-[#1F2327] border-l border-gray-800 flex flex-col z-40 animate-slide-left shadow-2xl">
      {/* Header */}
      <div className="p-4 border-b border-gray-800 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white">Participants ({allInMeeting.length})</h3>
          <p className="text-[11px] text-gray-400">People in this call</p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-xl hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Host Action Bar */}
      {isHost && onMuteAll && (
        <div className="p-3 bg-[#171A1C] border-b border-gray-800 flex items-center justify-between">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Host Controls</span>
          <button
            onClick={onMuteAll}
            className="px-3 py-1 bg-rose-600/80 hover:bg-rose-600 text-white rounded-xl text-xs font-bold transition-colors"
          >
            Mute Everyone
          </button>
        </div>
      )}

      {/* Body: Waiting Room & Active List */}
      <div className="flex-1 p-4 overflow-y-auto space-y-5 text-xs">
        {/* Waiting Room Queue */}
        {isHost && waitingList.length > 0 && (
          <div className="p-3 bg-amber-950/40 border border-amber-800/60 rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-amber-400 font-bold text-xs">
              <span>Waiting Room ({waitingList.length})</span>
            </div>
            <div className="divide-y divide-amber-900/40">
              {waitingList.map((w) => (
                <div key={w.id} className="py-2 flex items-center justify-between">
                  <span className="text-white font-medium truncate max-w-[120px]">{w.name}</span>
                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => onAdmitWaiting?.(w.id)}
                      className="p-1.5 bg-primary-green hover:bg-dark-green text-white rounded-lg transition-colors"
                      title="Admit"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => onRejectWaiting?.(w.id)}
                      className="p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors"
                      title="Reject"
                    >
                      <UserX className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* In-Call Participants List */}
        <div className="space-y-2">
          {allInMeeting.map((p) => {
            const isMe = p.id === localUser.id;
            return (
              <div
                key={p.id}
                className="p-2.5 rounded-2xl bg-[#24292D] border border-gray-800 flex items-center justify-between group hover:border-gray-700 transition-colors"
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <div className="h-8 w-8 rounded-xl bg-soft-green text-dark-green flex items-center justify-center font-bold text-xs flex-shrink-0">
                    {p.name[0]}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center space-x-1.5">
                      <span className="font-bold text-white truncate max-w-[130px]">
                        {p.name} {isMe ? '(You)' : ''}
                      </span>
                      {p.isHost && (
                        <Crown className="h-3.5 w-3.5 text-amber-400 flex-shrink-0" />
                      )}
                    </div>
                    {p.isHandRaised && (
                      <span className="text-[10px] text-amber-400 flex items-center space-x-0.5 font-bold">
                        <Hand className="h-3 w-3" />
                        <span>Hand Raised</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Status Icons & Host Controls */}
                <div className="flex items-center space-x-1.5">
                  <div className={`p-1.5 rounded-lg ${p.isAudioMuted ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {p.isAudioMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </div>

                  <div className={`p-1.5 rounded-lg ${p.isVideoMuted ? 'text-rose-400' : 'text-gray-400'}`}>
                    {p.isVideoMuted ? <VideoOff className="h-4 w-4" /> : <Video className="h-4 w-4" />}
                  </div>

                  {isHost && !isMe && (
                    <div className="flex items-center space-x-1 pl-1 border-l border-gray-700">
                      {onMuteParticipant && !p.isAudioMuted && (
                        <button
                          onClick={() => onMuteParticipant(p.id)}
                          title="Mute Participant"
                          className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white"
                        >
                          <MicOff className="h-3.5 w-3.5" />
                        </button>
                      )}

                      {onRemoveParticipant && (
                        <button
                          onClick={() => {
                            if (confirm(`Remove ${p.name} from the meeting?`)) {
                              onRemoveParticipant(p.id);
                            }
                          }}
                          title="Remove from call"
                          className="p-1.5 rounded-lg hover:bg-rose-950 text-gray-400 hover:text-rose-400"
                        >
                          <UserMinus className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
