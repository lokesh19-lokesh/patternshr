import React from 'react';
import { X, Lock, Unlock, MessageSquare, MonitorUp, Smile, PhoneOff } from 'lucide-react';

interface HostControlsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLocked: boolean;
  allowChat: boolean;
  allowScreenShare: boolean;
  allowReactions: boolean;
  onToggleLock: () => void;
  onToggleAllowChat: () => void;
  onToggleAllowScreenShare: () => void;
  onToggleAllowReactions: () => void;
  onEndMeetingForAll: () => void;
}

export const HostControlsModal: React.FC<HostControlsModalProps> = ({
  isOpen,
  onClose,
  isLocked,
  allowChat,
  allowScreenShare,
  allowReactions,
  onToggleLock,
  onToggleAllowChat,
  onToggleAllowScreenShare,
  onToggleAllowReactions,
  onEndMeetingForAll,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-[#1F2327] rounded-3xl shadow-2xl border border-gray-800 overflow-hidden text-white">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-[#171A1C]">
          <h3 className="text-sm font-bold text-white">Host Security & Controls</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-gray-800 text-gray-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs">
          {/* Lock Meeting */}
          <div className="p-3.5 bg-[#24292D] border border-gray-800 rounded-2xl flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-xl ${isLocked ? 'bg-amber-500/20 text-amber-400' : 'bg-gray-800 text-gray-400'}`}>
                {isLocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
              </div>
              <div>
                <div className="font-bold text-white">Lock Meeting Room</div>
                <div className="text-[11px] text-gray-400">Prevent new participants from joining</div>
              </div>
            </div>
            <button
              onClick={onToggleLock}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors ${
                isLocked ? 'bg-amber-500 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {isLocked ? 'Locked' : 'Unlock'}
            </button>
          </div>

          {/* Participant Permissions */}
          <div className="space-y-2 pt-2 border-t border-gray-800">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
              Participant Permissions
            </span>

            <label className="flex items-center justify-between p-3 bg-[#24292D] border border-gray-800 rounded-2xl cursor-pointer">
              <div className="flex items-center space-x-2.5">
                <MessageSquare className="h-4 w-4 text-primary-green" />
                <span className="font-medium text-gray-200">Allow In-Meeting Chat</span>
              </div>
              <input
                type="checkbox"
                checked={allowChat}
                onChange={onToggleAllowChat}
                className="rounded text-primary-green focus:ring-primary-green"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-[#24292D] border border-gray-800 rounded-2xl cursor-pointer">
              <div className="flex items-center space-x-2.5">
                <MonitorUp className="h-4 w-4 text-blue-400" />
                <span className="font-medium text-gray-200">Allow Screen Sharing</span>
              </div>
              <input
                type="checkbox"
                checked={allowScreenShare}
                onChange={onToggleAllowScreenShare}
                className="rounded text-primary-green focus:ring-primary-green"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-[#24292D] border border-gray-800 rounded-2xl cursor-pointer">
              <div className="flex items-center space-x-2.5">
                <Smile className="h-4 w-4 text-amber-400" />
                <span className="font-medium text-gray-200">Allow Reactions & Emojis</span>
              </div>
              <input
                type="checkbox"
                checked={allowReactions}
                onChange={onToggleAllowReactions}
                className="rounded text-primary-green focus:ring-primary-green"
              />
            </label>
          </div>

          {/* End Meeting for All */}
          <div className="pt-2">
            <button
              onClick={() => {
                if (confirm('Are you sure you want to end this meeting for everyone?')) {
                  onEndMeetingForAll();
                  onClose();
                }
              }}
              className="w-full py-3 bg-rose-950/60 hover:bg-rose-900/80 border border-rose-800 text-rose-300 font-bold rounded-2xl text-xs flex items-center justify-center space-x-2 transition-colors"
            >
              <PhoneOff className="h-4 w-4" />
              <span>End Meeting for Everyone</span>
            </button>
          </div>
        </div>

        <div className="flex items-center justify-end px-6 py-3 border-t border-gray-800 bg-[#171A1C]">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-xs font-bold text-white"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
