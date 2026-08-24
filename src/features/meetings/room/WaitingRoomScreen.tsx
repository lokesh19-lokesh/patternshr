import React from 'react';
import { Clock, ShieldCheck, ArrowLeft } from 'lucide-react';
import type { Meeting } from '../../../services/meeting.service';

interface WaitingRoomScreenProps {
  meeting: Meeting | null;
  onLeave: () => void;
}

export const WaitingRoomScreen: React.FC<WaitingRoomScreenProps> = ({
  meeting,
  onLeave,
}) => {
  return (
    <div className="min-h-screen bg-[#171A1C] flex items-center justify-center p-4 text-white animate-fade-in">
      <div className="w-full max-w-md bg-[#1F2327] border border-gray-800 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
        <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-primary-green/10 border-2 border-primary-green/30 animate-ping"></div>
          <div className="h-16 w-16 rounded-full bg-primary-green/20 text-primary-green border border-primary-green flex items-center justify-center">
            <Clock className="h-8 w-8 animate-pulse" />
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold text-white">Please wait, the host will let you in soon</h2>
          <p className="text-xs text-gray-400">
            {meeting?.title ? `Waiting room for "${meeting.title}"` : 'The host has been notified that you are waiting.'}
          </p>
        </div>

        <div className="p-4 bg-[#24292D] border border-gray-800 rounded-2xl text-xs text-gray-300 flex items-center justify-center space-x-2">
          <ShieldCheck className="h-4 w-4 text-primary-green" />
          <span>Your microphone and video will be enabled once admitted.</span>
        </div>

        <button
          onClick={onLeave}
          className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center space-x-2 mx-auto"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Leave Waiting Room</span>
        </button>
      </div>
    </div>
  );
};
