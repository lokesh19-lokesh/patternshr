import React, { useState } from 'react';
import { 
  Search, 
  Sparkles, 
  Play, 
  ChevronRight, 
  Video 
} from 'lucide-react';
import type { Meeting } from '../../../services/meeting.service';

interface MeetingHistoryTableProps {
  meetings: Meeting[];
  onViewDetails: (meeting: Meeting) => void;
}

export const MeetingHistoryTable: React.FC<MeetingHistoryTableProps> = ({
  meetings,
  onViewDetails,
}) => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const filtered = meetings.filter((m) => {
    const matchesSearch = 
      m.title.toLowerCase().includes(search.toLowerCase()) ||
      m.meeting_code.toLowerCase().includes(search.toLowerCase()) ||
      (m.host?.first_name && m.host.first_name.toLowerCase().includes(search.toLowerCase()));

    const matchesType = typeFilter === 'all' || m.meeting_type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-4">
      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-4 border-b border-gray-100">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search past meetings or hosts..."
            className="w-full pl-9 pr-4 py-2 bg-light-grey/50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary-green/30"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 bg-light-grey/50 border border-gray-200 rounded-xl text-xs font-semibold text-charcoal focus:outline-none"
          >
            <option value="all">All Meeting Types</option>
            <option value="interview">HR Interviews</option>
            <option value="performance_review">Performance Reviews</option>
            <option value="team">Team Standups</option>
            <option value="hr">HR Consultations</option>
            <option value="general">General Meetings</option>
          </select>
        </div>
      </div>

      {/* History Rows */}
      <div className="divide-y divide-gray-100">
        {filtered.length > 0 ? (
          filtered.map((m) => {
            const formattedDate = m.actual_end || m.scheduled_start
              ? new Date(m.actual_end || m.scheduled_start!).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
              : 'Past';

            const hostName = m.host ? `${m.host.first_name} ${m.host.last_name || ''}` : 'Team Host';
            const hasRecording = !!m.recording_url;
            const hasSummary = !!(m.ai_summary && (m.ai_summary.topics?.length || m.ai_summary.decisions?.length));

            return (
              <div
                key={m.id}
                onClick={() => onViewDetails(m)}
                className="py-4 px-2 hover:bg-light-grey/40 rounded-2xl cursor-pointer transition-colors flex items-center justify-between gap-4 group"
              >
                <div className="flex items-center space-x-3.5 min-w-0">
                  <div className="p-2.5 rounded-2xl bg-light-grey group-hover:bg-soft-green text-charcoal group-hover:text-dark-green transition-colors border border-gray-100 flex-shrink-0">
                    <Video className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-bold text-xs text-charcoal group-hover:text-dark-green transition-colors truncate">
                        {m.title}
                      </h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-charcoal uppercase tracking-wider">
                        {m.meeting_type.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex items-center space-x-3 text-[11px] text-text-grey mt-1">
                      <span>{formattedDate}</span>
                      <span>•</span>
                      <span>Host: {hostName}</span>
                      <span>•</span>
                      <span>{m.participants?.length || 1} attendees</span>
                    </div>
                  </div>
                </div>

                {/* Badges: Recording / AI Summary / Action */}
                <div className="flex items-center space-x-2 flex-shrink-0">
                  {hasRecording && (
                    <span className="hidden sm:inline-flex items-center space-x-1 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                      <Play className="h-3 w-3" />
                      <span>Recording</span>
                    </span>
                  )}
                  {hasSummary && (
                    <span className="hidden sm:inline-flex items-center space-x-1 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                      <Sparkles className="h-3 w-3" />
                      <span>AI Summary</span>
                    </span>
                  )}
                  <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-dark-green group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-8 text-center text-text-grey text-xs">
            No meeting history found matching your filters.
          </div>
        )}
      </div>
    </div>
  );
};
