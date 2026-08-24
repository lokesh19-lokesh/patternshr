import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Copy, 
  Check, 
  Clock
} from 'lucide-react';
import type { Meeting } from '../../../services/meeting.service';

interface MeetingTopBarProps {
  meeting: Meeting | null;
  meetingCode: string;
  isRecording: boolean;
  isLocked: boolean;
  onOpenHostSettings?: () => void;
  isHost: boolean;
}

export const MeetingTopBar: React.FC<MeetingTopBarProps> = ({
  meeting,
  meetingCode,
  isRecording,
  isLocked,
  onOpenHostSettings,
  isHost,
}) => {
  const [copied, setCopied] = useState(false);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-16 px-4 sm:px-6 bg-[#171A1C]/90 backdrop-blur-md border-b border-gray-800 flex items-center justify-between text-white z-20">
      {/* Left: Meeting Info */}
      <div className="flex items-center space-x-3 min-w-0">
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-xl bg-primary-green/20 text-primary-green flex items-center justify-center font-bold text-xs border border-primary-green/30 flex-shrink-0">
            TPC
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-white truncate max-w-[180px] sm:max-w-xs">
              {meeting?.title || 'Patterns Video Meeting'}
            </h2>
            <div className="flex items-center space-x-2 text-[11px] text-gray-400 font-mono">
              <span>{meetingCode}</span>
              <button
                onClick={handleCopyLink}
                title="Copy Meeting Link"
                className="hover:text-primary-green transition-colors"
              >
                {copied ? <Check className="h-3 w-3 text-primary-green" /> : <Copy className="h-3 w-3" />}
              </button>
            </div>
          </div>
        </div>

        {/* Meeting Type Badge */}
        {meeting?.meeting_type && (
          <span className="hidden md:inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-800 text-gray-300 border border-gray-700 capitalize">
            {meeting.meeting_type.replace('_', ' ')}
          </span>
        )}
      </div>

      {/* Middle: Timer & Indicators */}
      <div className="flex items-center space-x-3">
        {/* Live Duration */}
        <div className="flex items-center space-x-1.5 px-3 py-1 bg-gray-800/80 rounded-full border border-gray-700 text-xs font-mono text-gray-300">
          <Clock className="h-3 w-3 text-primary-green" />
          <span>{formatDuration(seconds)}</span>
        </div>

        {/* Recording Active Indicator */}
        {isRecording && (
          <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-rose-950/80 text-rose-400 border border-rose-800/80 rounded-full text-[11px] font-bold animate-pulse">
            <span className="h-2 w-2 rounded-full bg-rose-500"></span>
            <span className="hidden sm:inline">REC</span>
          </div>
        )}

        {/* Locked Room Indicator */}
        {isLocked && (
          <div className="flex items-center space-x-1 px-2.5 py-1 bg-amber-950/80 text-amber-400 border border-amber-800/80 rounded-full text-[11px] font-bold">
            <Lock className="h-3 w-3" />
            <span className="hidden sm:inline">Locked</span>
          </div>
        )}
      </div>

      {/* Right: Host / Security Badge */}
      <div className="flex items-center space-x-2">
        <div className="hidden sm:flex items-center space-x-1 px-2.5 py-1 rounded-full bg-primary-green/10 text-primary-green border border-primary-green/20 text-[11px] font-bold">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Encrypted</span>
        </div>

        {isHost && onOpenHostSettings && (
          <button
            onClick={onOpenHostSettings}
            className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-xs font-bold transition-colors border border-gray-700 flex items-center space-x-1.5"
          >
            <span>Host Tools</span>
          </button>
        )}
      </div>
    </div>
  );
};
