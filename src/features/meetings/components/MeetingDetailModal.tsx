import React, { useState } from 'react';
import { 
  X, 
  Video, 
  Clock, 
  Users, 
  FileText, 
  Sparkles, 
  Download, 
  CheckCircle2, 
  UserCheck, 
  Trash2
} from 'lucide-react';
import type { Meeting } from '../../../services/meeting.service';

interface MeetingDetailModalProps {
  meeting: Meeting | null;
  isOpen: boolean;
  onClose: () => void;
  onJoin: (code: string) => void;
  onDelete?: (meetingId: string) => void;
  isAdminOrHr?: boolean;
}

export const MeetingDetailModal: React.FC<MeetingDetailModalProps> = ({
  meeting,
  isOpen,
  onClose,
  onJoin,
  onDelete,
  isAdminOrHr,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'notes' | 'summary' | 'attendance'>('overview');

  if (!isOpen || !meeting) return null;

  const formattedDate = meeting.scheduled_start
    ? new Date(meeting.scheduled_start).toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    : 'Instant Session';

  const formattedTime = meeting.scheduled_start
    ? `${new Date(meeting.scheduled_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (${meeting.duration_minutes || 30} mins)`
    : 'N/A';

  const isLive = meeting.status === 'active';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-light-grey/40">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-soft-green text-dark-green border border-primary-green/20">
              <Video className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-charcoal">{meeting.title}</h3>
                {isLive && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200 animate-pulse">
                    LIVE
                  </span>
                )}
              </div>
              <p className="text-xs text-text-grey font-mono">Code: {meeting.meeting_code}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {onDelete && isAdminOrHr && (
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to delete this meeting?')) {
                    onDelete(meeting.id);
                    onClose();
                  }
                }}
                className="p-2 rounded-xl hover:bg-rose-50 text-gray-400 hover:text-rose-600 transition-colors"
                title="Delete Meeting"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-gray-200/60 text-gray-400 hover:text-charcoal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-100 px-6 bg-white space-x-6 text-xs font-bold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 border-b-2 transition-all ${
              activeTab === 'overview'
                ? 'border-primary-green text-dark-green'
                : 'border-transparent text-text-grey hover:text-charcoal'
            }`}
          >
            Overview & Recording
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`py-3 border-b-2 transition-all flex items-center space-x-1.5 ${
              activeTab === 'notes'
                ? 'border-primary-green text-dark-green'
                : 'border-transparent text-text-grey hover:text-charcoal'
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Meeting Notes</span>
          </button>
          <button
            onClick={() => setActiveTab('summary')}
            className={`py-3 border-b-2 transition-all flex items-center space-x-1.5 ${
              activeTab === 'summary'
                ? 'border-primary-green text-dark-green'
                : 'border-transparent text-text-grey hover:text-charcoal'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span>AI Summary & Actions</span>
          </button>
          <button
            onClick={() => setActiveTab('attendance')}
            className={`py-3 border-b-2 transition-all flex items-center space-x-1.5 ${
              activeTab === 'attendance'
                ? 'border-primary-green text-dark-green'
                : 'border-transparent text-text-grey hover:text-charcoal'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Attendance ({meeting.participants?.length || 0})</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 text-xs space-y-5">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* Meta Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-light-grey/50 border border-gray-100 rounded-2xl">
                <div>
                  <span className="text-[10px] font-bold text-text-grey uppercase tracking-wider block">Date</span>
                  <span className="font-semibold text-charcoal">{formattedDate}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-text-grey uppercase tracking-wider block">Time</span>
                  <span className="font-semibold text-charcoal">{formattedTime}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-text-grey uppercase tracking-wider block">Type</span>
                  <span className="font-semibold text-dark-green capitalize">{meeting.meeting_type.replace('_', ' ')}</span>
                </div>
              </div>

              {/* Description & Agenda */}
              {meeting.description && (
                <div>
                  <h4 className="font-bold text-charcoal uppercase tracking-wider mb-1">Description</h4>
                  <p className="p-3 bg-white border border-gray-100 rounded-xl text-gray-700 leading-relaxed">
                    {meeting.description}
                  </p>
                </div>
              )}

              {meeting.agenda && (
                <div>
                  <h4 className="font-bold text-charcoal uppercase tracking-wider mb-1">Agenda & Discussion Points</h4>
                  <p className="p-3 bg-white border border-gray-100 rounded-xl text-gray-700 whitespace-pre-line leading-relaxed">
                    {meeting.agenda}
                  </p>
                </div>
              )}

              {/* Interview Scorecard Summary if applicable */}
              {meeting.meeting_type === 'interview' && meeting.interview_details && (
                <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-2xl space-y-2">
                  <div className="flex items-center space-x-2 text-purple-900 font-bold">
                    <UserCheck className="h-4 w-4" />
                    <span>Candidate Evaluation Card</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-purple-600 block">Candidate</span>
                      <strong className="text-purple-950">{meeting.interview_details.candidate_name || 'N/A'}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-purple-600 block">Position</span>
                      <strong className="text-purple-950">{meeting.interview_details.position || 'N/A'}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-purple-600 block">Rating</span>
                      <strong className="text-purple-950">⭐ {meeting.interview_details.rating || 0} / 5</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-purple-600 block">Decision</span>
                      <span className="px-2 py-0.5 rounded-full font-bold bg-purple-200 text-purple-800 text-[11px]">
                        {meeting.interview_details.recommendation || 'Pending'}
                      </span>
                    </div>
                  </div>
                  {meeting.interview_details.feedback && (
                    <div className="pt-2 border-t border-purple-100 text-purple-900">
                      <span className="font-bold">Interviewer Feedback:</span> {meeting.interview_details.feedback}
                    </div>
                  )}
                </div>
              )}

              {/* Recording Player / Download */}
              {meeting.recording_url ? (
                <div className="p-4 bg-charcoal text-white rounded-2xl border border-gray-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse"></span>
                      <span className="font-bold text-xs">Meeting Recording Available</span>
                    </div>
                    <a
                      href={meeting.recording_url}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Download</span>
                    </a>
                  </div>
                  <video
                    src={meeting.recording_url}
                    controls
                    className="w-full rounded-xl max-h-60 bg-black"
                  />
                </div>
              ) : (
                <div className="p-3 bg-light-grey/60 rounded-xl text-text-grey flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span>No video recording is stored for this meeting session.</span>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: NOTES */}
          {activeTab === 'notes' && (
            <div className="space-y-3">
              <h4 className="font-bold text-charcoal uppercase tracking-wider">Collaborative Meeting Notes</h4>
              {meeting.notes ? (
                <div className="p-4 bg-light-grey/40 border border-gray-100 rounded-2xl whitespace-pre-wrap leading-relaxed text-charcoal font-sans">
                  {meeting.notes}
                </div>
              ) : (
                <div className="p-8 text-center bg-light-grey/30 border border-dashed border-gray-200 rounded-2xl text-text-grey">
                  No notes were taken during this meeting.
                </div>
              )}
            </div>
          )}

          {/* TAB 3: AI SUMMARY & ACTION ITEMS */}
          {activeTab === 'summary' && (
            <div className="space-y-4">
              {meeting.ai_summary && (meeting.ai_summary.topics?.length || meeting.ai_summary.decisions?.length || meeting.ai_summary.action_items?.length) ? (
                <div className="space-y-4">
                  {/* Topics */}
                  {meeting.ai_summary.topics && meeting.ai_summary.topics.length > 0 && (
                    <div className="p-4 bg-soft-green/40 border border-primary-green/20 rounded-2xl">
                      <h4 className="font-bold text-dark-green uppercase tracking-wider mb-2">📌 Topics Discussed</h4>
                      <ul className="list-disc list-inside space-y-1 text-charcoal">
                        {meeting.ai_summary.topics.map((t, idx) => (
                          <li key={idx}>{t}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Decisions */}
                  {meeting.ai_summary.decisions && meeting.ai_summary.decisions.length > 0 && (
                    <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl">
                      <h4 className="font-bold text-blue-900 uppercase tracking-wider mb-2">🎯 Key Decisions</h4>
                      <ul className="list-disc list-inside space-y-1 text-charcoal">
                        {meeting.ai_summary.decisions.map((d, idx) => (
                          <li key={idx}>{d}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Action Items */}
                  {meeting.ai_summary.action_items && meeting.ai_summary.action_items.length > 0 && (
                    <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-2xl">
                      <h4 className="font-bold text-amber-900 uppercase tracking-wider mb-2">⚡ Action Items & Assignees</h4>
                      <div className="space-y-2">
                        {meeting.ai_summary.action_items.map((item, idx) => (
                          <div key={idx} className="flex items-center space-x-2 bg-white p-2 rounded-xl border border-amber-100">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                            <span className="font-medium text-charcoal flex-1">{item.task}</span>
                            {item.assignee && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                                @{item.assignee}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-8 text-center bg-light-grey/30 border border-dashed border-gray-200 rounded-2xl text-text-grey">
                  AI Summary has not been generated for this session yet.
                </div>
              )}
            </div>
          )}

          {/* TAB 4: ATTENDANCE */}
          {activeTab === 'attendance' && (
            <div className="space-y-3">
              <h4 className="font-bold text-charcoal uppercase tracking-wider">Attendance & Participation Log</h4>
              <div className="divide-y divide-gray-100 border border-gray-100 rounded-2xl overflow-hidden bg-white">
                {meeting.participants && meeting.participants.length > 0 ? (
                  meeting.participants.map((p) => {
                    const empName = p.employee
                      ? `${p.employee.first_name} ${p.employee.last_name || ''}`
                      : 'Team Member';
                    const isPresent = p.attendance_status === 'present';
                    return (
                      <div key={p.id} className="p-3.5 flex items-center justify-between hover:bg-gray-50/50">
                        <div className="flex items-center space-x-3">
                          <div className="h-8 w-8 rounded-full bg-soft-green text-dark-green flex items-center justify-center font-bold text-xs">
                            {empName[0]}
                          </div>
                          <div>
                            <div className="font-bold text-charcoal">{empName}</div>
                            <div className="text-[11px] text-text-grey">
                              Role: <span className="capitalize">{p.role}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3 text-right">
                          <div>
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                isPresent
                                  ? 'bg-soft-green text-dark-green'
                                  : 'bg-gray-100 text-gray-500'
                              }`}
                            >
                              {isPresent ? 'Present' : 'Invited / Absent'}
                            </span>
                            {p.duration_minutes ? (
                              <div className="text-[10px] text-text-grey">{p.duration_minutes} mins in call</div>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-6 text-center text-text-grey">No participant records recorded.</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50">
          <div className="text-xs text-text-grey font-mono">
            Room Code: <strong>{meeting.meeting_code}</strong>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-bold text-charcoal hover:bg-gray-100"
            >
              Close
            </button>
            <button
              onClick={() => {
                onClose();
                onJoin(meeting.meeting_code);
              }}
              className="px-5 py-2 rounded-xl bg-primary-green hover:bg-dark-green text-white text-xs font-bold shadow-md shadow-emerald-200 flex items-center space-x-1.5"
            >
              <Video className="h-4 w-4" />
              <span>Enter Meeting</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
