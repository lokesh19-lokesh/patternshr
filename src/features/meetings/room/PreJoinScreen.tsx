import React, { useRef, useEffect } from 'react';
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Settings, 
  ArrowRight, 
  ShieldCheck, 
  Video as VideoIcon
} from 'lucide-react';
import type { Meeting } from '../../../services/meeting.service';
import type { Employee } from '../../../services/employee.service';

interface PreJoinScreenProps {
  meeting: Meeting | null;
  meetingCode: string;
  currentEmployee: Employee | null;
  localStream: MediaStream | null;
  isAudioMuted: boolean;
  isVideoMuted: boolean;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onOpenSettings: () => void;
  onJoin: () => void;
  onCancel: () => void;
}

export const PreJoinScreen: React.FC<PreJoinScreenProps> = ({
  meeting,
  meetingCode,
  currentEmployee,
  localStream,
  isAudioMuted,
  isVideoMuted,
  onToggleAudio,
  onToggleVideo,
  onOpenSettings,
  onJoin,
  onCancel,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && localStream) {
      videoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  const empName = currentEmployee
    ? `${currentEmployee.first_name} ${currentEmployee.last_name || ''}`.trim()
    : 'Guest Participant';

  const initials = empName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-[#171A1C] flex items-center justify-center p-4 sm:p-8 animate-fade-in text-white">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
        {/* Left 7 Columns: Camera Preview Tile & Device Toggles */}
        <div className="md:col-span-7 flex flex-col space-y-4">
          <div className="relative aspect-video w-full bg-[#24292D] rounded-3xl overflow-hidden border border-gray-800 shadow-2xl flex items-center justify-center">
            {!isVideoMuted && localStream ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover scale-x-[-1]"
              />
            ) : (
              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="h-24 w-24 rounded-3xl bg-soft-green text-dark-green flex items-center justify-center font-black text-3xl border-2 border-primary-green/30">
                  {initials}
                </div>
                <span className="text-xs text-gray-400 font-bold">Camera is turned off</span>
              </div>
            )}

            {/* Quick Floating Toggles over Preview */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center space-x-3 bg-black/60 backdrop-blur-md p-2 rounded-2xl border border-white/10">
              <button
                type="button"
                onClick={onToggleAudio}
                className={`p-3 rounded-xl transition-colors ${
                  isAudioMuted ? 'bg-rose-600 text-white' : 'bg-gray-800 hover:bg-gray-700 text-emerald-400'
                }`}
                title={isAudioMuted ? 'Unmute' : 'Mute'}
              >
                {isAudioMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </button>

              <button
                type="button"
                onClick={onToggleVideo}
                className={`p-3 rounded-xl transition-colors ${
                  isVideoMuted ? 'bg-rose-600 text-white' : 'bg-gray-800 hover:bg-gray-700 text-emerald-400'
                }`}
                title={isVideoMuted ? 'Start Video' : 'Stop Video'}
              >
                {isVideoMuted ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
              </button>

              <button
                type="button"
                onClick={onOpenSettings}
                className="p-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
                title="Audio & Video Settings"
              >
                <Settings className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-400 px-2">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="h-4 w-4 text-primary-green" />
              <span>WebRTC Encrypted Session</span>
            </div>
            <span>Room: {meetingCode}</span>
          </div>
        </div>

        {/* Right 5 Columns: Meeting Details & Join Action */}
        <div className="md:col-span-5 flex flex-col justify-center space-y-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-soft-green/10 text-primary-green border border-primary-green/20 text-xs font-bold">
              <VideoIcon className="h-3.5 w-3.5" />
              <span>Ready to Join?</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {meeting?.title || 'Patterns Video Meeting'}
            </h1>

            {meeting?.description && (
              <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                {meeting.description}
              </p>
            )}
          </div>

          {/* Profile Card */}
          <div className="p-4 bg-[#24292D] border border-gray-800 rounded-2xl flex items-center space-x-3.5">
            <div className="h-11 w-11 rounded-2xl bg-primary-green/20 text-primary-green flex items-center justify-center font-bold text-sm border border-primary-green/30">
              {initials}
            </div>
            <div>
              <div className="font-bold text-sm text-white">{empName}</div>
              <div className="text-xs text-gray-400">
                {currentEmployee?.designation?.name || (currentEmployee?.designation as any)?.title || 'Team Member'}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={onJoin}
              className="w-full py-4 px-6 bg-primary-green hover:bg-dark-green text-white font-bold text-sm rounded-2xl shadow-xl shadow-emerald-950/60 flex items-center justify-center space-x-2 transition-all hover:scale-[1.02]"
            >
              <span>Join Now</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <button
              onClick={onCancel}
              className="w-full py-3 px-6 bg-transparent hover:bg-gray-800 text-gray-400 hover:text-white font-bold text-xs rounded-2xl transition-colors border border-gray-800"
            >
              Cancel & Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
