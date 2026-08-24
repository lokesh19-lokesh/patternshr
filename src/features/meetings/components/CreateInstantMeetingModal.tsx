import React, { useState } from 'react';
import { X, Video, ShieldCheck, Sparkles, UserCheck, Users, Briefcase } from 'lucide-react';
import type { MeetingType } from '../../../services/meeting.service';

interface CreateInstantMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (title: string, type: MeetingType) => void;
  loading: boolean;
}

export const CreateInstantMeetingModal: React.FC<CreateInstantMeetingModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  loading,
}) => {
  const [title, setTitle] = useState('Instant Team Sync');
  const [meetingType, setMeetingType] = useState<MeetingType>('general');

  if (!isOpen) return null;

  const meetingTypes: { type: MeetingType; label: string; icon: any; desc: string }[] = [
    { type: 'general', label: 'General Meeting', icon: Video, desc: 'Quick face-to-face video call' },
    { type: 'team', label: 'Team Standup', icon: Users, desc: 'Internal sprint or team sync' },
    { type: 'interview', label: 'Candidate Interview', icon: UserCheck, desc: 'Live scorecard & recommendation mode' },
    { type: 'hr', label: 'HR Consultation', icon: Briefcase, desc: 'Confidential 1-on-1 discussion' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-light-grey/40">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-soft-green text-dark-green border border-primary-green/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-charcoal">Start Instant Meeting</h3>
              <p className="text-xs text-text-grey">Generate a secure room and enter immediately</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-200/60 text-gray-400 hover:text-charcoal transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-charcoal uppercase tracking-wider mb-1.5">
              Meeting Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Quick Design Review"
              className="w-full px-4 py-2.5 bg-light-grey/50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-green/30 focus:border-primary-green"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-charcoal uppercase tracking-wider mb-1.5">
              Meeting Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {meetingTypes.map((item) => {
                const Icon = item.icon;
                const isSelected = meetingType === item.type;
                return (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => setMeetingType(item.type)}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-soft-green border-primary-green ring-2 ring-primary-green/20'
                        : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className={`h-4 w-4 mb-2 ${isSelected ? 'text-dark-green' : 'text-gray-500'}`} />
                    <div>
                      <div className={`text-xs font-bold ${isSelected ? 'text-dark-green' : 'text-charcoal'}`}>
                        {item.label}
                      </div>
                      <div className="text-[10px] text-text-grey line-clamp-1 mt-0.5">
                        {item.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-light-grey/60 border border-gray-100 flex items-center space-x-2 text-xs text-text-grey">
            <ShieldCheck className="h-4 w-4 text-dark-green flex-shrink-0" />
            <span>Room comes with WebRTC encryption, recording, live captions & AI summary support.</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-charcoal hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSubmit(title, meetingType)}
            disabled={loading || !title.trim()}
            className="px-5 py-2.5 rounded-xl bg-primary-green hover:bg-dark-green text-white text-xs font-bold shadow-md shadow-emerald-200 transition-all flex items-center space-x-1.5 disabled:opacity-50"
          >
            <Video className="h-4 w-4" />
            <span>{loading ? 'Creating...' : 'Start Meeting Now'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
