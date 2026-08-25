import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../lib/auth/AuthProvider';
import { useTenant } from '../../../lib/auth/TenantProvider';
import { employeeService } from '../../../services/employee.service';
import type { Employee } from '../../../services/employee.service';
import { meetingService } from '../../../services/meeting.service';
import type { 
  Meeting, 
  MeetingMessage, 
  MeetingInterviewDetails, 
  MeetingReviewDetails 
} from '../../../services/meeting.service';
import { WebRTCMeetingManager } from '../../../services/webrtc.service';
import { LiveCaptionService } from '../../../services/captions.service';

import { PreJoinScreen } from './PreJoinScreen';
import { WaitingRoomScreen } from './WaitingRoomScreen';
import { MeetingTopBar } from './MeetingTopBar';
import { VideoGrid } from './VideoGrid';
import type { MeetingPeer } from './VideoGrid';
import { MeetingControlsBar } from './MeetingControlsBar';
import { InMeetingChatDrawer } from './InMeetingChatDrawer';
import { InMeetingPeopleDrawer } from './InMeetingPeopleDrawer';
import { InMeetingNotesDrawer } from './InMeetingNotesDrawer';
import { HRInterviewDrawer } from './HRInterviewDrawer';
import { HRPerformanceReviewDrawer } from './HRPerformanceReviewDrawer';
import { LiveCaptionsOverlay } from './LiveCaptionsOverlay';
import { ReactionsOverlay } from './ReactionsOverlay';
import type { FloatingReaction } from './ReactionsOverlay';
import { DeviceSettingsModal } from './DeviceSettingsModal';
import { HostControlsModal } from './HostControlsModal';

export const MeetingRoomPage: React.FC = () => {
  const { meetingCode } = useParams<{ meetingCode: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { company, role } = useTenant();

  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState(true);

  // Stage: 'prejoin' | 'waiting' | 'in_call' | 'ended'
  const [stage, setStage] = useState<'prejoin' | 'waiting' | 'in_call' | 'ended'>('prejoin');

  // Media Streams & WebRTC Manager
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);

  const [remotePeers, setRemotePeers] = useState<MeetingPeer[]>([]);
  const [waitingParticipants, setWaitingParticipants] = useState<{ id: string; name: string }[]>([]);

  // Drawers & Modals
  const [activeDrawer, setActiveDrawer] = useState<'chat' | 'people' | 'notes' | 'interview' | 'review' | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showHostModal, setShowHostModal] = useState(false);

  // In-Meeting Chat & Reactions
  const [messages, setMessages] = useState<MeetingMessage[]>([]);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [floatingReactions, setFloatingReactions] = useState<FloatingReaction[]>([]);

  // Captions & Recording
  const [isCaptionsActive, setIsCaptionsActive] = useState(false);
  const [captionText, setCaptionText] = useState('');
  const [captionSpeaker, setCaptionSpeaker] = useState('');
  const [isRecording, setIsRecording] = useState(false);

  // Notes
  const [notes, setNotes] = useState('');

  // Host Controls
  const [isLocked, setIsLocked] = useState(false);
  const [allowChat, setAllowChat] = useState(true);
  const [allowScreenShare, setAllowScreenShare] = useState(true);
  const [allowReactions, setAllowReactions] = useState(true);

  // Managers Refs
  const webrtcManagerRef = useRef<WebRTCMeetingManager | null>(null);
  const captionServiceRef = useRef<LiveCaptionService | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // Initial Load: Meeting details, workspace employees and local media preview
  useEffect(() => {
    const init = async () => {
      if (!company || !user || !meetingCode) return;
      try {
        setLoading(true);
        const [emp, meet, emps] = await Promise.all([
          employeeService.getCurrentEmployee(company.id, user.id),
          meetingService.getMeetingByCode(company.id, meetingCode),
          employeeService.getEmployees(company.id),
        ]);

        setCurrentEmployee(emp);
        setMeeting(meet);
        setAllEmployees(emps || []);

        if (meet) {
          setNotes(meet.notes || '');
          setIsLocked(meet.is_locked || false);
        }

        // Initialize local camera preview for pre-join screen
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
          setLocalStream(stream);
        } catch (mediaErr) {
          console.warn('Could not get full media for preview', mediaErr);
          try {
            const audioOnly = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            setLocalStream(audioOnly);
            setIsVideoMuted(true);
          } catch (audioErr) {
            setIsAudioMuted(true);
            setIsVideoMuted(true);
          }
        }
      } catch (err) {
        console.error('Error initializing meeting room', err);
      } finally {
        setLoading(false);
      }
    };

    init();

    return () => {
      // Cleanup preview tracks
      if (localStream) {
        localStream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [company, user, meetingCode]);

  const resolvePeerName = (peerId: string, fallbackName?: string): string => {
    if (fallbackName && fallbackName !== 'Team Member' && fallbackName !== 'Participant' && fallbackName.trim().length > 0) {
      return fallbackName.trim();
    }
    // 1. Check in meeting participants
    const meetParticipant = meeting?.participants?.find(
      (p) => p.employee_id === peerId || p.employee?.id === peerId
    );
    if (meetParticipant?.employee) {
      return `${meetParticipant.employee.first_name} ${meetParticipant.employee.last_name || ''}`.trim();
    }
    // 2. Check in meeting host
    if (meeting?.host_employee_id === peerId && meeting.host) {
      return `${meeting.host.first_name} ${meeting.host.last_name || ''}`.trim();
    }
    // 3. Check in workspace employees
    const matchedEmp = allEmployees.find((e) => e.id === peerId);
    if (matchedEmp) {
      return `${matchedEmp.first_name} ${matchedEmp.last_name || ''}`.trim();
    }
    return (fallbackName && fallbackName !== 'Team Member' ? fallbackName : null) || 'Participant';
  };

  // Keep remote peer names up to date when directory or meeting info loads
  useEffect(() => {
    if (remotePeers.length === 0) return;
    setRemotePeers((prev) =>
      prev.map((peer) => {
        if (!peer.name || peer.name === 'Team Member' || peer.name === 'Participant') {
          const resolved = resolvePeerName(peer.id, peer.name);
          if (resolved !== peer.name) {
            return { ...peer, name: resolved };
          }
        }
        return peer;
      })
    );
  }, [allEmployees, meeting]);

  const isHost = meeting?.host_employee_id === currentEmployee?.id || role?.name?.toLowerCase().includes('admin');

  // Join Call & Setup Signaling
  const handleJoinCall = async () => {
    if (!company || !currentEmployee || !meetingCode || !meeting) return;

    // Check waiting room condition if not host
    if (meeting.waiting_room_enabled && !isHost) {
      setStage('waiting');
      // Broadcast to host that participant is waiting
      return;
    }

    setStage('in_call');

    // Initialize WebRTC Manager
    const empName = `${currentEmployee.first_name} ${currentEmployee.last_name || ''}`.trim();

    const manager = new WebRTCMeetingManager(meetingCode, currentEmployee.id, empName, {
      onRemoteStreamAdded: (peerId, stream, peerName) => {
        setRemotePeers((prev) => {
          const resolvedName = resolvePeerName(peerId, peerName);
          const existing = prev.find((p) => p.id === peerId);
          if (existing) {
            return prev.map((p) =>
              p.id === peerId
                ? {
                    ...p,
                    stream,
                    name:
                      existing.name && existing.name !== 'Team Member' && existing.name !== 'Participant'
                        ? existing.name
                        : resolvedName,
                  }
                : p
            );
          }
          return [
            ...prev,
            {
              id: peerId,
              name: resolvedName,
              stream,
              isAudioMuted: false,
              isVideoMuted: false,
            },
          ];
        });
      },
      onPeerNameResolved: (peerId, name) => {
        if (!name || name === 'Team Member') return;
        setRemotePeers((prev) =>
          prev.map((p) => (p.id === peerId ? { ...p, name: resolvePeerName(peerId, name) } : p))
        );
      },
      onRemoteStreamRemoved: (peerId) => {
        setRemotePeers((prev) => prev.filter((p) => p.id !== peerId));
      },
      onPeerLeft: (peerId) => {
        setRemotePeers((prev) => prev.filter((p) => p.id !== peerId));
      },
      onPeerMuteChanged: (peerId, mutedAudio, mutedVideo) => {
        setRemotePeers((prev) =>
          prev.map((p) =>
            p.id === peerId
              ? {
                  ...p,
                  isAudioMuted: mutedAudio,
                  isVideoMuted: mutedVideo,
                  name: resolvePeerName(peerId, p.name),
                }
              : p
          )
        );
      },
      onPeerScreenShareChanged: (peerId, isSharing) => {
        setRemotePeers((prev) =>
          prev.map((p) =>
            p.id === peerId
              ? {
                  ...p,
                  isScreenSharing: isSharing,
                  name: resolvePeerName(peerId, p.name),
                }
              : p
          )
        );
      },
      onPeerHandRaised: (peerId, isRaised) => {
        setRemotePeers((prev) =>
          prev.map((p) =>
            p.id === peerId
              ? {
                  ...p,
                  isHandRaised: isRaised,
                  name: resolvePeerName(peerId, p.name),
                }
              : p
          )
        );
      },
      onPeerReaction: (peerId, emoji) => {
        const id = Math.random().toString();
        const peer = remotePeers.find((p) => p.id === peerId);
        const resolvedName = resolvePeerName(peerId, peer?.name);
        setFloatingReactions((prev) => [...prev, { id, emoji, senderName: resolvedName }]);
        setTimeout(() => {
          setFloatingReactions((prev) => prev.filter((r) => r.id !== id));
        }, 3000);
      },
      onChatMessage: (msg) => {
        setMessages((prev) => [...prev, msg]);
        setUnreadChatCount((prev) => prev + 1);
      },
      onRoomCommand: (cmd, payload) => {
        if (cmd === 'mute_all' && !isHost) {
          manager.toggleAudio();
          setIsAudioMuted(true);
        } else if (cmd === 'end_meeting') {
          handleLeaveMeeting();
        } else if (cmd === 'admit_user' && payload.targetId === currentEmployee.id) {
          setStage('in_call');
        } else if (cmd === 'user_waiting' && isHost) {
          const waitingName = resolvePeerName(payload.senderId, payload.name || payload.senderName);
          setWaitingParticipants((prev) => {
            if (prev.some((p) => p.id === payload.senderId)) return prev;
            return [...prev, { id: payload.senderId, name: waitingName }];
          });
        }
      },
      onAudioLevelChanged: (peerId, level) => {
        setRemotePeers((prev) =>
          prev.map((p) => (p.id === peerId ? { ...p, audioLevel: level } : p))
        );
      },
    });

    webrtcManagerRef.current = manager;
    await manager.initLocalMedia();
    await manager.joinRoom();

    // Record attendance
    await meetingService.recordParticipantJoin(meeting.id, company.id, currentEmployee.id, isHost ? 'host' : 'participant');

    // Load initial chat messages
    const initialMsgs = await meetingService.getMeetingMessages(meeting.id);
    setMessages(initialMsgs);

    // Setup Live Caption Service
    captionServiceRef.current = new LiveCaptionService(empName, (text, isFinal, speaker) => {
      setCaptionText(text);
      setCaptionSpeaker(speaker);
      if (isFinal) {
        setTimeout(() => setCaptionText(''), 4000);
      }
    });
  };

  // Keyboard Shortcuts (M, C, S, H, F, Esc)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (stage !== 'in_call') return;
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      if (e.key === 'm' || e.key === 'M') {
        handleToggleAudio();
      } else if (e.key === 'c' || e.key === 'C') {
        handleToggleVideo();
      } else if (e.key === 's' || e.key === 'S') {
        handleToggleScreenShare();
      } else if (e.key === 'h' || e.key === 'H') {
        handleToggleHandRaise();
      } else if (e.key === 'Escape') {
        setActiveDrawer(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [stage, isAudioMuted, isVideoMuted, isScreenSharing, isHandRaised]);

  // Audio / Video Toggles
  const handleToggleAudio = () => {
    if (webrtcManagerRef.current) {
      const active = webrtcManagerRef.current.toggleAudio();
      setIsAudioMuted(!active);
    } else {
      setIsAudioMuted(!isAudioMuted);
    }
  };

  const handleToggleVideo = () => {
    if (webrtcManagerRef.current) {
      const active = webrtcManagerRef.current.toggleVideo();
      setIsVideoMuted(!active);
    } else {
      setIsVideoMuted(!isVideoMuted);
    }
  };

  const handleToggleScreenShare = async () => {
    if (!webrtcManagerRef.current) return;
    if (isScreenSharing) {
      webrtcManagerRef.current.stopScreenShare();
      setIsScreenSharing(false);
    } else {
      const stream = await webrtcManagerRef.current.startScreenShare();
      if (stream) setIsScreenSharing(true);
    }
  };

  const handleToggleHandRaise = () => {
    if (!webrtcManagerRef.current) return;
    const raised = webrtcManagerRef.current.toggleHandRaise();
    setIsHandRaised(raised);
  };

  const handleSendReaction = (emoji: string) => {
    webrtcManagerRef.current?.sendReaction(emoji);
    const id = Math.random().toString();
    setFloatingReactions((prev) => [...prev, { id, emoji, senderName: 'You' }]);
    setTimeout(() => {
      setFloatingReactions((prev) => prev.filter((r) => r.id !== id));
    }, 3000);
  };

  const handleToggleCaptions = () => {
    if (isCaptionsActive) {
      captionServiceRef.current?.stop();
      setIsCaptionsActive(false);
    } else {
      captionServiceRef.current?.start();
      setIsCaptionsActive(true);
    }
  };

  // Recording Engine via MediaRecorder
  const handleToggleRecording = async () => {
    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        recordedChunksRef.current = [];
        const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            recordedChunksRef.current.push(event.data);
          }
        };

        recorder.onstop = async () => {
          const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
          if (company && meeting) {
            try {
              await meetingService.uploadMeetingRecording(company.id, meeting.id, blob);
              alert('Meeting recording saved and uploaded to workspace cloud storage!');
            } catch (err) {
              console.warn('Could not auto upload recording', err);
            }
          }
        };

        recorder.start();
        mediaRecorderRef.current = recorder;
        setIsRecording(true);
      } catch (err) {
        console.warn('Could not start screen recording', err);
      }
    } else {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    }
  };

  const handleSendMessage = async (text: string, attachments: any[] = []) => {
    if (!company || !currentEmployee || !meeting) return;
    try {
      const msg = await meetingService.sendMeetingMessage(
        company.id,
        meeting.id,
        currentEmployee.id,
        text,
        attachments
      );
      webrtcManagerRef.current?.sendBroadcastChat(msg);
      setMessages((prev) => [...prev, msg]);
    } catch (e) {
      console.error('Failed to send message', e);
    }
  };

  const handleSaveNotes = async (newNotes: string) => {
    if (!company || !meeting) return;
    setNotes(newNotes);
    await meetingService.saveMeetingNotes(company.id, meeting.id, newNotes);
  };

  const handleSaveInterviewDetails = async (details: Partial<MeetingInterviewDetails>) => {
    if (!company || !meeting) return;
    await meetingService.updateInterviewDetails(company.id, meeting.id, details);
  };

  const handleSaveReviewDetails = async (details: Partial<MeetingReviewDetails>) => {
    if (!company || !meeting) return;
    await meetingService.updatePerformanceReview(company.id, meeting.id, details);
  };

  const handleLeaveMeeting = async () => {
    if (company && meeting && currentEmployee) {
      await meetingService.recordParticipantLeave(meeting.id, company.id, currentEmployee.id);
    }

    webrtcManagerRef.current?.leaveRoom();
    captionServiceRef.current?.stop();
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }

    navigate('/dashboard/meetings');
  };

  const handleEndMeetingForAll = async () => {
    if (company && meeting) {
      webrtcManagerRef.current?.sendRoomCommand('end_meeting');
      await meetingService.updateMeetingStatus(company.id, meeting.id, 'ended', currentEmployee?.id);
    }
    handleLeaveMeeting();
  };

  const handleMuteAll = () => {
    webrtcManagerRef.current?.sendRoomCommand('mute_all');
  };

  const handleAdmitWaiting = (participantId: string) => {
    webrtcManagerRef.current?.sendRoomCommand('admit_user', { targetId: participantId });
    setWaitingParticipants((prev) => prev.filter((p) => p.id !== participantId));
  };

  const handleToggleDrawer = (drawer: 'chat' | 'people' | 'notes' | 'interview' | 'review') => {
    if (activeDrawer === drawer) {
      setActiveDrawer(null);
    } else {
      setActiveDrawer(drawer);
      if (drawer === 'chat') {
        setUnreadChatCount(0);
      }
    }
  };

  // Local User Peer Object
  const localUserPeer: MeetingPeer = {
    id: currentEmployee?.id || 'me',
    name: currentEmployee ? `${currentEmployee.first_name} ${currentEmployee.last_name || ''}`.trim() : 'You',
    stream: localStream,
    isAudioMuted,
    isVideoMuted,
    isScreenSharing,
    isHandRaised,
    isHost,
  };

  const screenSharingPeer = localUserPeer.isScreenSharing
    ? localUserPeer
    : remotePeers.find((p) => p.isScreenSharing);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#171A1C] flex items-center justify-center text-white text-xs">
        <div className="flex flex-col items-center space-y-3">
          <div className="h-8 w-8 rounded-full border-2 border-primary-green border-t-transparent animate-spin"></div>
          <span>Connecting to secure video room...</span>
        </div>
      </div>
    );
  }

  // Pre-join Device Screen
  if (stage === 'prejoin') {
    return (
      <PreJoinScreen
        meeting={meeting}
        meetingCode={meetingCode || ''}
        currentEmployee={currentEmployee}
        localStream={localStream}
        isAudioMuted={isAudioMuted}
        isVideoMuted={isVideoMuted}
        onToggleAudio={handleToggleAudio}
        onToggleVideo={handleToggleVideo}
        onOpenSettings={() => setShowSettingsModal(true)}
        onJoin={handleJoinCall}
        onCancel={() => navigate('/dashboard/meetings')}
      />
    );
  }

  // Waiting Room Screen
  if (stage === 'waiting') {
    return (
      <WaitingRoomScreen
        meeting={meeting}
        onLeave={() => navigate('/dashboard/meetings')}
      />
    );
  }

  return (
    <div className="relative w-screen h-screen bg-[#171A1C] flex flex-col overflow-hidden select-none animate-fade-in font-sans">
      {/* 1. Top Bar */}
      <MeetingTopBar
        meeting={meeting}
        meetingCode={meetingCode || ''}
        isRecording={isRecording}
        isLocked={isLocked}
        isHost={!!isHost}
        onOpenHostSettings={() => setShowHostModal(true)}
      />

      {/* 2. Main Center Video Stage */}
      <div className="relative flex-1 flex overflow-hidden">
        <VideoGrid
          localUser={localUserPeer}
          remotePeers={remotePeers}
          screenSharingPeer={screenSharingPeer}
        />

        {/* Live Captions Subtitle Overlay */}
        <LiveCaptionsOverlay
          captionText={captionText}
          speaker={captionSpeaker}
          isActive={isCaptionsActive}
        />

        {/* Floating Emoji Reactions Overlay */}
        <ReactionsOverlay reactions={floatingReactions} />

        {/* Drawers: Chat, People, Notes, Interview, Performance Review */}
        <InMeetingChatDrawer
          isOpen={activeDrawer === 'chat'}
          onClose={() => setActiveDrawer(null)}
          messages={messages}
          onSendMessage={handleSendMessage}
          currentEmployeeId={currentEmployee?.id || ''}
          companyId={company?.id || ''}
        />

        <InMeetingPeopleDrawer
          isOpen={activeDrawer === 'people'}
          onClose={() => setActiveDrawer(null)}
          localUser={localUserPeer}
          remotePeers={remotePeers}
          waitingList={waitingParticipants}
          isHost={!!isHost}
          onMuteAll={handleMuteAll}
          onAdmitWaiting={handleAdmitWaiting}
        />

        <InMeetingNotesDrawer
          isOpen={activeDrawer === 'notes'}
          onClose={() => setActiveDrawer(null)}
          initialNotes={notes}
          onSaveNotes={handleSaveNotes}
          isHostOrHr={!!isHost}
        />

        <HRInterviewDrawer
          isOpen={activeDrawer === 'interview'}
          onClose={() => setActiveDrawer(null)}
          initialDetails={meeting?.interview_details}
          onSaveDetails={handleSaveInterviewDetails}
        />

        <HRPerformanceReviewDrawer
          isOpen={activeDrawer === 'review'}
          onClose={() => setActiveDrawer(null)}
          initialDetails={meeting?.review_details}
          onSaveDetails={handleSaveReviewDetails}
        />
      </div>

      {/* 3. Bottom Controls Bar */}
      <MeetingControlsBar
        isAudioMuted={isAudioMuted}
        isVideoMuted={isVideoMuted}
        isScreenSharing={isScreenSharing}
        isHandRaised={isHandRaised}
        isRecording={isRecording}
        isCaptionsActive={isCaptionsActive}
        activeDrawer={activeDrawer}
        unreadChatCount={unreadChatCount}
        participantsCount={remotePeers.length + 1}
        meetingType={meeting?.meeting_type || 'general'}
        isHost={!!isHost}
        onToggleAudio={handleToggleAudio}
        onToggleVideo={handleToggleVideo}
        onToggleScreenShare={handleToggleScreenShare}
        onToggleHandRaise={handleToggleHandRaise}
        onToggleRecording={handleToggleRecording}
        onToggleCaptions={handleToggleCaptions}
        onToggleDrawer={handleToggleDrawer}
        onOpenSettings={() => setShowSettingsModal(true)}
        onSendReaction={handleSendReaction}
        onLeaveMeeting={handleLeaveMeeting}
      />

      {/* Device Settings Modal */}
      <DeviceSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />

      {/* Host Controls Security Modal */}
      <HostControlsModal
        isOpen={showHostModal}
        onClose={() => setShowHostModal(false)}
        isLocked={isLocked}
        allowChat={allowChat}
        allowScreenShare={allowScreenShare}
        allowReactions={allowReactions}
        onToggleLock={() => setIsLocked(!isLocked)}
        onToggleAllowChat={() => setAllowChat(!allowChat)}
        onToggleAllowScreenShare={() => setAllowScreenShare(!allowScreenShare)}
        onToggleAllowReactions={() => setAllowReactions(!allowReactions)}
        onEndMeetingForAll={handleEndMeetingForAll}
      />
    </div>
  );
};
