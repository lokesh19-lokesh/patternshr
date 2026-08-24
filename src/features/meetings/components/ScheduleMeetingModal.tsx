import React, { useState } from 'react';
import { X, Calendar, UserCheck, Award } from 'lucide-react';
import type { Employee } from '../../../services/employee.service';
import type { MeetingType } from '../../../services/meeting.service';

interface ScheduleMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: any) => Promise<void>;
  employees: Employee[];
  loading: boolean;
}

export const ScheduleMeetingModal: React.FC<ScheduleMeetingModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  employees,
  loading,
}) => {
  const [title, setTitle] = useState('');
  const [description] = useState('');
  const [meetingType, setMeetingType] = useState<MeetingType>('general');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('10:00');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [agenda, setAgenda] = useState('');
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [waitingRoomEnabled, setWaitingRoomEnabled] = useState(false);
  const [recordingEnabled, setRecordingEnabled] = useState(true);

  // Candidate Interview Special Fields
  const [candidateName, setCandidateName] = useState('');
  const [candidatePosition, setCandidatePosition] = useState('');
  const [interviewStage, setInterviewStage] = useState('Technical Round 1');

  // Performance Review Special Fields
  const [reviewGoals, setReviewGoals] = useState('');

  if (!isOpen) return null;

  const handleToggleEmployee = (id: string) => {
    if (selectedEmployees.includes(id)) {
      setSelectedEmployees(selectedEmployees.filter((e) => e !== id));
    } else {
      setSelectedEmployees([...selectedEmployees, id]);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const startDateTime = new Date(`${startDate}T${startTime}:00`).toISOString();
    const endDateTime = new Date(new Date(startDateTime).getTime() + durationMinutes * 60000).toISOString();

    const payload: any = {
      title,
      description,
      meeting_type: meetingType,
      scheduled_start: startDateTime,
      scheduled_end: endDateTime,
      duration_minutes: durationMinutes,
      agenda,
      participant_ids: selectedEmployees,
      waiting_room_enabled: waitingRoomEnabled,
      recording_enabled: recordingEnabled,
    };

    if (meetingType === 'interview') {
      payload.interview_details = {
        candidate_name: candidateName,
        position: candidatePosition,
        stage: interviewStage,
        rating: 0,
        recommendation: 'Next Round',
      };
    } else if (meetingType === 'performance_review') {
      payload.review_details = {
        goals: reviewGoals,
        score: 0,
        strengths: '',
        improvements: '',
        action_plan: '',
      };
    }

    await onSubmit(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-light-grey/40">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-soft-green text-dark-green border border-primary-green/20">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-charcoal">Schedule Workplace Meeting</h3>
              <p className="text-xs text-text-grey">Plan interviews, 1-on-1s, or company video conferences</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-200/60 text-gray-400 hover:text-charcoal transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleFormSubmit} className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
          {/* Title & Type */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block font-bold text-charcoal uppercase tracking-wider mb-1.5">
                Meeting Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Q3 Performance Review or Frontend Candidate Interview"
                className="w-full px-3.5 py-2.5 bg-light-grey/50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-green/30 focus:border-primary-green"
              />
            </div>

            <div>
              <label className="block font-bold text-charcoal uppercase tracking-wider mb-1.5">
                Meeting Type
              </label>
              <select
                value={meetingType}
                onChange={(e) => setMeetingType(e.target.value as MeetingType)}
                className="w-full px-3.5 py-2.5 bg-light-grey/50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-green/30 focus:border-primary-green"
              >
                <option value="general">General Meeting</option>
                <option value="hr">HR Sync</option>
                <option value="interview">Candidate Interview</option>
                <option value="performance_review">Performance Review</option>
                <option value="team">Team Standup</option>
                <option value="training">Training Workshop</option>
                <option value="management">Management Sync</option>
              </select>
            </div>
          </div>

          {/* Conditional Interview Fields */}
          {meetingType === 'interview' && (
            <div className="p-4 bg-purple-50/60 border border-purple-200/80 rounded-2xl space-y-3">
              <div className="flex items-center space-x-2 text-purple-900 font-bold text-xs">
                <UserCheck className="h-4 w-4 text-purple-700" />
                <span>HR Candidate Interview Setup</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-purple-900 mb-1">Candidate Name</label>
                  <input
                    type="text"
                    value={candidateName}
                    onChange={(e) => setCandidateName(e.target.value)}
                    placeholder="e.g. Sarah Jenkins"
                    className="w-full px-3 py-2 bg-white border border-purple-200 rounded-xl text-xs font-medium focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-purple-900 mb-1">Job Role / Position</label>
                  <input
                    type="text"
                    value={candidatePosition}
                    onChange={(e) => setCandidatePosition(e.target.value)}
                    placeholder="e.g. Senior Frontend Dev"
                    className="w-full px-3 py-2 bg-white border border-purple-200 rounded-xl text-xs font-medium focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-purple-900 mb-1">Interview Stage</label>
                  <select
                    value={interviewStage}
                    onChange={(e) => setInterviewStage(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-purple-200 rounded-xl text-xs font-medium focus:outline-none"
                  >
                    <option value="Initial Screening">Initial Screening</option>
                    <option value="Technical Round 1">Technical Round 1</option>
                    <option value="Technical Round 2">Technical Round 2</option>
                    <option value="Managerial Round">Managerial Round</option>
                    <option value="HR & Cultural Fit">HR & Cultural Fit</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Conditional Performance Review Fields */}
          {meetingType === 'performance_review' && (
            <div className="p-4 bg-blue-50/60 border border-blue-200/80 rounded-2xl space-y-3">
              <div className="flex items-center space-x-2 text-blue-900 font-bold text-xs">
                <Award className="h-4 w-4 text-blue-700" />
                <span>Performance Review Goals</span>
              </div>
              <textarea
                rows={2}
                value={reviewGoals}
                onChange={(e) => setReviewGoals(e.target.value)}
                placeholder="Key goals, deliverables, and review period objectives..."
                className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl text-xs font-medium focus:outline-none"
              />
            </div>
          )}

          {/* Date, Time, Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-charcoal uppercase tracking-wider mb-1.5">Date</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-light-grey/50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-charcoal uppercase tracking-wider mb-1.5">Start Time</label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-light-grey/50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-charcoal uppercase tracking-wider mb-1.5">Duration</label>
              <select
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-light-grey/50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none"
              >
                <option value={15}>15 Minutes</option>
                <option value={30}>30 Minutes</option>
                <option value={45}>45 Minutes</option>
                <option value={60}>1 Hour</option>
                <option value={90}>1.5 Hours</option>
                <option value={120}>2 Hours</option>
              </select>
            </div>
          </div>

          {/* Agenda & Notes */}
          <div>
            <label className="block font-bold text-charcoal uppercase tracking-wider mb-1.5">
              Meeting Agenda / Topics
            </label>
            <textarea
              rows={2}
              value={agenda}
              onChange={(e) => setAgenda(e.target.value)}
              placeholder="Outline discussion points, questions, or presentation topics..."
              className="w-full px-3.5 py-2 bg-light-grey/50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary-green/30"
            />
          </div>

          {/* Invite Employees */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-bold text-charcoal uppercase tracking-wider">
                Invite Team Members ({selectedEmployees.length} selected)
              </label>
              <button
                type="button"
                onClick={() => setSelectedEmployees(selectedEmployees.length === employees.length ? [] : employees.map((e) => e.id))}
                className="text-[11px] text-dark-green hover:underline font-bold"
              >
                {selectedEmployees.length === employees.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto p-2 bg-light-grey/30 border border-gray-200 rounded-xl">
              {employees.map((emp) => {
                const isChecked = selectedEmployees.includes(emp.id);
                return (
                  <div
                    key={emp.id}
                    onClick={() => handleToggleEmployee(emp.id)}
                    className={`flex items-center space-x-2.5 p-2 rounded-xl border cursor-pointer transition-all ${
                      isChecked
                        ? 'bg-soft-green/80 border-primary-green text-charcoal'
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      className="rounded text-primary-green focus:ring-primary-green"
                    />
                    <div className="truncate">
                      <div className="font-bold text-xs truncate">
                        {emp.first_name} {emp.last_name || ''}
                      </div>
                      <div className="text-[10px] text-text-grey truncate">
                        {emp.designation?.name || (emp.designation as any)?.title || emp.department?.name || 'Employee'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Security & Room Controls */}
          <div className="p-3 bg-light-grey/40 border border-gray-200 rounded-xl flex items-center justify-between text-xs">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={waitingRoomEnabled}
                onChange={(e) => setWaitingRoomEnabled(e.target.checked)}
                className="rounded text-primary-green focus:ring-primary-green"
              />
              <span className="font-medium text-charcoal">Enable Waiting Room</span>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={recordingEnabled}
                onChange={(e) => setRecordingEnabled(e.target.checked)}
                className="rounded text-primary-green focus:ring-primary-green"
              />
              <span className="font-medium text-charcoal">Allow Cloud Recording</span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-charcoal hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !title.trim()}
              className="px-5 py-2.5 rounded-xl bg-primary-green hover:bg-dark-green text-white text-xs font-bold shadow-md shadow-emerald-200 transition-all flex items-center space-x-1.5 disabled:opacity-50"
            >
              <Calendar className="h-4 w-4" />
              <span>{loading ? 'Scheduling...' : 'Confirm Schedule'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
