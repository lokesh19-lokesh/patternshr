import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Video, 
  Calendar, 
  KeyRound, 
  Plus, 
  Search, 
  RefreshCw 
} from 'lucide-react';
import { useAuth } from '../../lib/auth/AuthProvider';
import { useTenant } from '../../lib/auth/TenantProvider';
import { employeeService } from '../../services/employee.service';
import type { Employee } from '../../services/employee.service';
import { meetingService } from '../../services/meeting.service';
import type { Meeting, MeetingType } from '../../services/meeting.service';
import { MeetingCard } from './components/MeetingCard';
import { CreateInstantMeetingModal } from './components/CreateInstantMeetingModal';
import { ScheduleMeetingModal } from './components/ScheduleMeetingModal';
import { JoinWithCodeModal } from './components/JoinWithCodeModal';
import { MeetingHistoryTable } from './components/MeetingHistoryTable';
import { MeetingDetailModal } from './components/MeetingDetailModal';

export const VideoMeetingsDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { company, role } = useTenant();
  const normalizedRole = role?.name?.toLowerCase() || '';
  const isAdminOrHr = normalizedRole.includes('admin') || normalizedRole.includes('hr') || normalizedRole.includes('owner');

  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [upcomingMeetings, setUpcomingMeetings] = useState<Meeting[]>([]);
  const [recentMeetings, setRecentMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showInstantModal, setShowInstantModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showJoinCodeModal, setShowJoinCodeModal] = useState(false);
  const [selectedMeetingDetail, setSelectedMeetingDetail] = useState<Meeting | null>(null);
  const [instantLoading, setInstantLoading] = useState(false);
  const [scheduleLoading, setScheduleLoading] = useState(false);

  // Quick Search
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = async () => {
    if (!company || !user) return;
    try {
      setLoading(true);
      const [emp, allEmps, upcoming, recent] = await Promise.all([
        employeeService.getCurrentEmployee(company.id, user.id),
        employeeService.getEmployees(company.id),
        meetingService.getUpcomingMeetings(company.id),
        meetingService.getRecentMeetings(company.id),
      ]);

      setCurrentEmployee(emp);
      setEmployees(allEmps || []);
      setUpcomingMeetings(upcoming || []);
      setRecentMeetings(recent || []);
    } catch (e) {
      console.error('Error loading video meetings data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [company, user]);

  // Handlers
  const handleJoinMeeting = (meetingCode: string) => {
    // If user passed a full URL, extract the code
    const cleanCode = meetingCode.includes('/')
      ? meetingCode.substring(meetingCode.lastIndexOf('/') + 1).trim()
      : meetingCode.trim();

    navigate(`/dashboard/meetings/room/${cleanCode}`);
  };

  const handleCreateInstantMeeting = async (title: string, type: MeetingType) => {
    if (!company || !currentEmployee) return;
    try {
      setInstantLoading(true);
      const meeting = await meetingService.createInstantMeeting(company.id, currentEmployee.id, title, type);
      setShowInstantModal(false);
      navigate(`/dashboard/meetings/room/${meeting.meeting_code}`);
    } catch (e) {
      alert('Could not start instant meeting');
    } finally {
      setInstantLoading(false);
    }
  };

  const handleScheduleMeeting = async (payload: any) => {
    if (!company || !currentEmployee) return;
    try {
      setScheduleLoading(true);
      const meeting = await meetingService.scheduleMeeting(company.id, currentEmployee.id, payload);
      setShowScheduleModal(false);
      await loadData();
      alert(`Meeting "${meeting.title}" scheduled successfully! Room code: ${meeting.meeting_code}`);
    } catch (e) {
      alert('Could not schedule meeting');
    } finally {
      setScheduleLoading(false);
    }
  };

  const handleDeleteMeeting = async (meetingId: string) => {
    if (!company) return;
    try {
      await meetingService.deleteMeeting(company.id, meetingId);
      await loadData();
    } catch (e) {
      alert('Could not delete meeting');
    }
  };

  const filteredUpcoming = upcomingMeetings.filter((m) =>
    m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.meeting_code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-light-grey/40 p-4 sm:p-8 space-y-8 animate-fade-in">
      {/* 1. Header Banner with Quick Actions */}
      <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 z-10 max-w-xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-soft-green text-dark-green text-xs font-bold border border-primary-green/20">
            <Video className="h-3.5 w-3.5" />
            <span>Patterns Workplace Conferencing</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-charcoal tracking-tight">
            Video Meetings & Interviews
          </h1>
          <p className="text-xs sm:text-sm text-text-grey font-medium leading-relaxed">
            Encrypted HD video calls, candidate hiring scorecards, team standups, live captions, and AI meeting summaries.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 z-10 w-full md:w-auto">
          <button
            onClick={() => setShowJoinCodeModal(true)}
            className="flex-1 sm:flex-initial px-4 py-3 bg-light-grey hover:bg-gray-200/70 text-charcoal text-xs font-bold rounded-2xl border border-gray-200 flex items-center justify-center space-x-2 transition-all hover:scale-[1.02]"
          >
            <KeyRound className="h-4 w-4 text-gray-500" />
            <span>Join with Code</span>
          </button>

          <button
            onClick={() => setShowScheduleModal(true)}
            className="flex-1 sm:flex-initial px-4 py-3 bg-soft-green hover:bg-emerald-100 text-dark-green text-xs font-bold rounded-2xl border border-primary-green/30 flex items-center justify-center space-x-2 transition-all hover:scale-[1.02]"
          >
            <Calendar className="h-4 w-4" />
            <span>Schedule Meeting</span>
          </button>

          <button
            onClick={() => setShowInstantModal(true)}
            className="w-full sm:w-auto px-5 py-3 bg-primary-green hover:bg-dark-green text-white text-xs font-bold rounded-2xl shadow-lg shadow-emerald-200/60 flex items-center justify-center space-x-2 transition-all hover:scale-[1.02]"
          >
            <Plus className="h-4 w-4" />
            <span>Start New Meeting</span>
          </button>
        </div>

        {/* Ambient background decoration */}
        <div className="absolute right-0 top-0 w-96 h-96 bg-primary-green/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
      </div>

      {/* 2. Upcoming Meetings Grid */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-bold text-charcoal">Upcoming Meetings</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-soft-green text-dark-green">
              {filteredUpcoming.length}
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search upcoming..."
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary-green/30"
              />
            </div>
            <button
              onClick={loadData}
              title="Refresh"
              className="p-2 bg-white border border-gray-200 rounded-xl text-gray-500 hover:text-dark-green hover:border-primary-green transition-colors"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {filteredUpcoming.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredUpcoming.map((meeting) => (
              <MeetingCard
                key={meeting.id}
                meeting={meeting}
                onJoin={handleJoinMeeting}
                onViewDetails={(m) => setSelectedMeetingDetail(m)}
              />
            ))}
          </div>
        ) : (
          <div className="p-12 text-center bg-white border border-dashed border-gray-200 rounded-3xl space-y-3">
            <div className="h-12 w-12 rounded-2xl bg-light-grey text-gray-400 flex items-center justify-center mx-auto">
              <Calendar className="h-6 w-6" />
            </div>
            <div className="font-bold text-charcoal text-sm">No upcoming meetings scheduled</div>
            <p className="text-xs text-text-grey max-w-sm mx-auto">
              Ready to collaborate? Start an instant video call or schedule an interview with candidates.
            </p>
            <button
              onClick={() => setShowInstantModal(true)}
              className="px-4 py-2 bg-primary-green hover:bg-dark-green text-white text-xs font-bold rounded-xl shadow-sm transition-all"
            >
              Start Instant Meeting
            </button>
          </div>
        )}
      </div>

      {/* 3. Past Meetings & Recordings History */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-charcoal">Meeting History & Recordings</h2>
        </div>

        <MeetingHistoryTable
          meetings={recentMeetings}
          onViewDetails={(m) => setSelectedMeetingDetail(m)}
        />
      </div>

      {/* Modals */}
      <CreateInstantMeetingModal
        isOpen={showInstantModal}
        onClose={() => setShowInstantModal(false)}
        onSubmit={handleCreateInstantMeeting}
        loading={instantLoading}
      />

      <ScheduleMeetingModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        onSubmit={handleScheduleMeeting}
        employees={employees}
        loading={scheduleLoading}
      />

      <JoinWithCodeModal
        isOpen={showJoinCodeModal}
        onClose={() => setShowJoinCodeModal(false)}
        onJoin={handleJoinMeeting}
      />

      <MeetingDetailModal
        meeting={selectedMeetingDetail}
        isOpen={!!selectedMeetingDetail}
        onClose={() => setSelectedMeetingDetail(null)}
        onJoin={handleJoinMeeting}
        onDelete={handleDeleteMeeting}
        isAdminOrHr={isAdminOrHr}
      />
    </div>
  );
};
