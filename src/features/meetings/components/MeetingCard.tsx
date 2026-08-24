import React from 'react';
import { 
  Calendar, 
  Clock, 
  Users, 
  Video, 
  UserCheck, 
  Briefcase, 
  Award, 
  Lock,
  Copy,
  Check,
  ArrowRight
} from 'lucide-react';
import type { Meeting } from '../../../services/meeting.service';

interface MeetingCardProps {
  meeting: Meeting;
  onJoin: (code: string) => void;
  onViewDetails?: (meeting: Meeting) => void;
}

export const MeetingCard: React.FC<MeetingCardProps> = ({
  meeting,
  onJoin,
  onViewDetails,
}) => {
  const [copied, setCopied] = React.useState(false);

  const getMeetingTypeBadge = (type: string) => {
    switch (type) {
      case 'interview':
        return { label: 'HR Interview', bg: 'bg-purple-50 text-purple-700 border-purple-200', icon: UserCheck };
      case 'performance_review':
        return { label: 'Performance Review', bg: 'bg-blue-50 text-blue-700 border-blue-200', icon: Award };
      case 'hr':
        return { label: 'HR Sync', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: Briefcase };
      case 'team':
        return { label: 'Team Standup', bg: 'bg-amber-50 text-amber-700 border-amber-200', icon: Users };
      case 'management':
        return { label: 'Management', bg: 'bg-rose-50 text-rose-700 border-rose-200', icon: Lock };
      default:
        return { label: 'General Meeting', bg: 'bg-gray-100 text-charcoal border-gray-200', icon: Video };
    }
  };

  const typeConfig = getMeetingTypeBadge(meeting.meeting_type);
  const TypeIcon = typeConfig.icon;

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/dashboard/meetings/room/${meeting.meeting_code}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formattedDate = meeting.scheduled_start
    ? new Date(meeting.scheduled_start).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Today';

  const formattedTime = meeting.scheduled_start
    ? new Date(meeting.scheduled_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'Instant';

  const isLive = meeting.status === 'active';

  return (
    <div 
      onClick={() => onViewDetails?.(meeting)}
      className="group relative bg-white border border-gray-200 hover:border-primary-green/50 rounded-2xl p-5 transition-all duration-200 hover:shadow-md cursor-pointer flex flex-col justify-between"
    >
      <div>
        {/* Top Header: Badge & Status */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${typeConfig.bg}`}>
            <TypeIcon className="h-3.5 w-3.5" />
            <span>{typeConfig.label}</span>
          </span>

          {isLive ? (
            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-600 border border-rose-200 animate-pulse">
              <span className="h-2 w-2 rounded-full bg-rose-500 inline-block"></span>
              <span>LIVE NOW</span>
            </span>
          ) : (
            <span className="text-xs font-medium text-text-grey">
              {meeting.duration_minutes || 30} mins
            </span>
          )}
        </div>

        {/* Title & Description */}
        <h3 className="text-base font-bold text-charcoal group-hover:text-dark-green transition-colors line-clamp-1 mb-1">
          {meeting.title}
        </h3>
        {meeting.description && (
          <p className="text-xs text-text-grey line-clamp-2 mb-4">
            {meeting.description}
          </p>
        )}

        {/* Candidate or Review details banner if applicable */}
        {meeting.meeting_type === 'interview' && meeting.interview_details?.candidate_name && (
          <div className="mb-3 p-2 bg-purple-50/70 border border-purple-100 rounded-xl text-xs flex items-center justify-between">
            <span className="text-purple-800 font-medium truncate">
              👤 Candidate: <strong>{meeting.interview_details.candidate_name}</strong>
            </span>
            {meeting.interview_details.position && (
              <span className="text-purple-600 text-[11px] truncate ml-2">
                ({meeting.interview_details.position})
              </span>
            )}
          </div>
        )}

        {/* Meta Info: Time, Host, Participants */}
        <div className="space-y-2 text-xs text-text-grey pt-2 border-t border-gray-100 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <Calendar className="h-3.5 w-3.5 text-gray-400" />
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center space-x-1.5 font-semibold text-charcoal">
              <Clock className="h-3.5 w-3.5 text-gray-400" />
              <span>{formattedTime}</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5 truncate max-w-[60%]">
              <span className="text-gray-400">Host:</span>
              <span className="font-medium text-charcoal truncate">
                {meeting.host ? `${meeting.host.first_name} ${meeting.host.last_name || ''}` : 'Team Host'}
              </span>
            </div>
            <div className="flex items-center space-x-1 text-gray-500 font-medium">
              <Users className="h-3.5 w-3.5" />
              <span>{meeting.participants?.length || 1} invited</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-2 pt-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onJoin(meeting.meeting_code);
          }}
          className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 transition-all shadow-sm ${
            isLive
              ? 'bg-primary-green hover:bg-dark-green text-white shadow-emerald-200 animate-bounce-subtle'
              : 'bg-dark-green hover:bg-primary-green text-white'
          }`}
        >
          <Video className="h-4 w-4" />
          <span>{isLive ? 'Join Meeting Now' : 'Start / Join'}</span>
          <ArrowRight className="h-3.5 w-3.5 ml-1 opacity-80" />
        </button>

        <button
          onClick={handleCopyLink}
          title="Copy meeting invite link"
          className="p-2.5 rounded-xl border border-gray-200 hover:border-primary-green hover:bg-soft-green text-charcoal hover:text-dark-green transition-colors"
        >
          {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4 text-gray-500" />}
        </button>
      </div>
    </div>
  );
};
