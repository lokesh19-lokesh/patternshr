import React, { useEffect, useState, useRef, useCallback } from 'react';
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
  MeetingReviewDetails,
  MeetingAISummary 
} from '../../../services/meeting.service';
import { WebRTCMeetingManager } from '../../../services/webrtc.service';
import { LiveCaptionService } from '../../../services/captions.service';
import { supabase } from '../../../lib/supabase/client';

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
import { MeetingRecapModal } from './MeetingRecapModal';

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
  const [isLocalBlurred, setIsLocalBlurred] = useState(false);

  const [remotePeers, setRemotePeers] = useState<MeetingPeer[]>([]);
  const [waitingParticipants, setWaitingParticipants] = useState<{ id: string; name: string }[]>([]);

  // Drawers & Modals
  const [activeDrawer, setActiveDrawer] = useState<'chat' | 'people' | 'notes' | 'interview' | 'review' | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showHostModal, setShowHostModal] = useState(false);
  const [showRecapModal, setShowRecapModal] = useState(false);

  // In-Meeting Chat & Reactions
  const [messages, setMessages] = useState<MeetingMessage[]>([]);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [floatingReactions, setFloatingReactions] = useState<FloatingReaction[]>([]);

  // Captions & Recording
  const [isCaptionsActive, setIsCaptionsActive] = useState(false);
  const [captionText, setCaptionText] = useState('');
  const [captionSpeaker, setCaptionSpeaker] = useState('');
  const [isRecording, setIsRecording] = useState(false);

  // Notes & AI Summary
  const [notes, setNotes] = useState('');
  const [aiSummary, setAiSummary] = useState<MeetingAISummary | undefined>(undefined);
  const [callDurationSeconds, setCallDurationSeconds] = useState(0);

  // Host Controls & Permissions
  const [isLocked, setIsLocked] = useState(false);
  const [allowChat, setAllowChat] = useState(true);
  const [allowScreenShare, setAllowScreenShare] = useState(true);
  const [allowReactions, setAllowReactions] = useState(true);

  // Managers & Channel Refs
  const webrtcManagerRef = useRef<WebRTCMeetingManager | null>(null);
  const captionServiceRef = useRef<LiveCaptionService | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const waitingChannelRef = useRef<any>(null);

  // Duration Timer in Call
  useEffect(() => {
    if (stage !== 'in_call') return;
    const interval = setInterval(() => {
      setCallDurationSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [stage]);

  // Initial Load: Meeting details, workspace employees and local media preview
  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      if (!company || !user || !meetingCode) return;
      try {
        setLoading(true);
        const [emp, meet, emps] = await Promise.all([
          employeeService.getCurrentEmployee(company.id, user.id),
          meetingService.getMeetingByCode(company.id, meetingCode),
          employeeService.getEmployees(company.id),
        ]);

        if (!isMounted) return;

        setCurrentEmployee(emp);
        setMeeting(meet);
        setAllEmployees(emps || []);

        if (meet) {
          setNotes(meet.notes || '');
          setIsLocked(meet.is_locked || false);
          if (meet.ai_summary) setAiSummary(meet.ai_summary);
          if (meet.settings) {
            setAllowChat(meet.settings.allow_chat !== false);
            setAllowScreenShare(meet.settings.allow_screen_share !== false);
            setAllowReactions(meet.settings.allow_reactions !== false);
          }
        }

        // Initialize local camera preview for pre-join screen
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
            video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
          });
          if (isMounted) setLocalStream(stream);
        } catch (mediaErr) {
          console.warn('Could not get full media for preview', mediaErr);
          try {
            const audioOnly = await navigator.mediaDevices.getUserMedia({
              audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
              video: false,
            });
            if (isMounted) {
              setLocalStream(audioOnly);
              setIsVideoMuted(true);
            }
          } catch (audioErr) {
            if (isMounted) {
              setIsAudioMuted(true);
              setIsVideoMuted(true);
            }
          }
        }
      } catch (err) {
        console.error('Error initializing meeting room', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    init();

    return () => {
      isMounted = false;
      if (localStream) {
        localStream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [company, user, meetingCode]);

  const isHost = meeting?.host_employee_id === currentEmployee?.id || role?.name?.toLowerCase().includes('admin');

  // Multi-tier Name Resolver
  const resolvePeerName = useCallback(
    (peerId: string, fallbackName?: string): string => {
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
    },
    [meeting, allEmployees]
  );

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
  }, [allEmployees, meeting, resolvePeerName, remotePeers.length]);

  // Start In-Call WebRTC and Signaling Session
  const startInCallSession = useCallback(async () => {
    if (!company || !currentEmployee || !meetingCode || !meeting) return;

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
      onNotesUpdated: (syncedNotes) => {
        setNotes(syncedNotes);
      },
      onRoomCommand: (cmd, payload) => {
        if (cmd === 'mute_all' && !isHost) {
          manager.toggleAudio();
          setIsAudioMuted(true);
        } else if (cmd === 'mute_user' && payload.targetId === currentEmployee.id) {
          if (!isAudioMuted) {
            manager.toggleAudio();
            setIsAudioMuted(true);
          }
        } else if (cmd === 'remove_user' && payload.targetId === currentEmployee.id) {
          alert('You have been removed from the meeting by the host.');
          handleLeaveMeeting();
        } else if (cmd === 'update_permissions') {
          if (!isHost) {
            if (payload.allowChat !== undefined) setAllowChat(payload.allowChat);
            if (payload.allowScreenShare !== undefined) setAllowScreenShare(payload.allowScreenShare);
            if (payload.allowReactions !== undefined) setAllowReactions(payload.allowReactions);
            if (payload.isLocked !== undefined) setIsLocked(payload.isLocked);
          }
        } else if (cmd === 'end_meeting') {
          handleLeaveMeeting();
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
  }, [company, currentEmployee, meetingCode, meeting, isHost, resolvePeerName, remotePeers, isAudioMuted]);

  // Waiting Room Listener
  useEffect(() => {
    if (stage !== 'waiting' || !company || !currentEmployee || !meetingCode) return;

    const channelName = `meeting_room_${meetingCode}`;
    const ch = supabase.channel(channelName);
    waitingChannelRef.current = ch;

    const empName = `${currentEmployee.first_name} ${currentEmployee.last_name || ''}`.trim();

    ch.on('broadcast', { event: 'room_command' }, ({ payload }: any) => {
      if (payload.command === 'admit_user' && payload.targetId === currentEmployee.id) {
        if (waitingChannelRef.current) {
          supabase.removeChannel(waitingChannelRef.current);
          waitingChannelRef.current = null;
        }
        setStage('in_call');
        startInCallSession();
      } else if (payload.command === 'reject_user' && payload.targetId === currentEmployee.id) {
        if (waitingChannelRef.current) {
          supabase.removeChannel(waitingChannelRef.current);
          waitingChannelRef.current = null;
        }
        alert('The host has declined your request to join the meeting.');
        navigate('/dashboard/meetings');
      }
    });

    ch.subscribe((status: string) => {
      if (status === 'SUBSCRIBED') {
        ch.send({
          type: 'broadcast',
          event: 'room_command',
          payload: {
            command: 'user_waiting',
            senderId: currentEmployee.id,
            senderName: empName,
            name: empName,
          },
        });
      }
    });

    return () => {
      if (waitingChannelRef.current) {
        supabase.removeChannel(waitingChannelRef.current);
        waitingChannelRef.current = null;
      }
    };
  }, [stage, company, currentEmployee, meetingCode, navigate, startInCallSession]);

  // Join Call Trigger
  const handleJoinCall = async () => {
    if (!company || !currentEmployee || !meetingCode || !meeting) return;

    if (meeting.is_locked && !isHost) {
      alert('This meeting is currently locked by the host.');
      return;
    }

    if (meeting.waiting_room_enabled && !isHost) {
      setStage('waiting');
      return;
    }

    setStage('in_call');
    await startInCallSession();
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
    if (!allowScreenShare && !isHost) {
      alert('Screen sharing is currently disabled by the host.');
      return;
    }
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
    if (!allowReactions && !isHost) {
      alert('Reactions are currently disabled by the host.');
      return;
    }
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
      const started = captionServiceRef.current?.start();
      if (started) {
        setIsCaptionsActive(true);
      } else {
        alert('Live Captions (Web Speech API) is not supported or permission was denied in this browser.');
      }
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

  // Hot Device Switcher
  const handleSelectDevices = async (audioId: string, videoId: string) => {
    if (webrtcManagerRef.current) {
      const newStream = await webrtcManagerRef.current.switchDevices(audioId, videoId);
      if (newStream) {
        setLocalStream(newStream);
      }
    }
  };

  const handleSendMessage = async (text: string, attachments: any[] = []) => {
    if (!allowChat && !isHost) {
      alert('In-meeting chat is currently disabled by the host.');
      return;
    }
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
    webrtcManagerRef.current?.sendBroadcastNotes(newNotes);
    await meetingService.saveMeetingNotes(company.id, meeting.id, newNotes);
  };

  const handleGenerateAISummary = async (currentNotes: string): Promise<MeetingAISummary | null> => {
    if (!company || !meeting) return null;
    const transcripts = captionServiceRef.current?.getTranscripts() || [];
    const generated = await meetingService.generateMeetingSummary(currentNotes, transcripts);
    setAiSummary(generated);
    await meetingService.saveMeetingAISummary(company.id, meeting.id, generated);
    return generated;
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

    // Show session recap modal before exit
    setShowRecapModal(true);
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

  const handleMuteParticipant = (peerId: string) => {
    webrtcManagerRef.current?.sendRoomCommand('mute_user', { targetId: peerId });
  };

  const handleRemoveParticipant = (peerId: string) => {
    webrtcManagerRef.current?.sendRoomCommand('remove_user', { targetId: peerId });
    setRemotePeers((prev) => prev.filter((p) => p.id !== peerId));
  };

  const handleAdmitWaiting = (participantId: string) => {
    webrtcManagerRef.current?.sendRoomCommand('admit_user', { targetId: participantId });
    setWaitingParticipants((prev) => prev.filter((p) => p.id !== participantId));
  };

  const handleRejectWaiting = (participantId: string) => {
    webrtcManagerRef.current?.sendRoomCommand('reject_user', { targetId: participantId });
    setWaitingParticipants((prev) => prev.filter((p) => p.id !== participantId));
  };

  const handleToggleLock = async () => {
    if (!company || !meeting) return;
    const nextLocked = !isLocked;
    setIsLocked(nextLocked);
    webrtcManagerRef.current?.sendRoomCommand('update_permissions', { isLocked: nextLocked });
    await meetingService.toggleMeetingLock(company.id, meeting.id, nextLocked);
  };

  const handleToggleAllowChat = () => {
    const nextVal = !allowChat;
    setAllowChat(nextVal);
    webrtcManagerRef.current?.sendRoomCommand('update_permissions', { allowChat: nextVal });
  };

  const handleToggleAllowScreenShare = () => {
    const nextVal = !allowScreenShare;
    setAllowScreenShare(nextVal);
    webrtcManagerRef.current?.sendRoomCommand('update_permissions', { allowScreenShare: nextVal });
  };

  const handleToggleAllowReactions = () => {
    const nextVal = !allowReactions;
    setAllowReactions(nextVal);
    webrtcManagerRef.current?.sendRoomCommand('update_permissions', { allowReactions: nextVal });
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
        isBlurred={isLocalBlurred}
        onToggleAudio={handleToggleAudio}
        onToggleVideo={handleToggleVideo}
        onToggleBlur={() => setIsLocalBlurred(!isLocalBlurred)}
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
          isLocalBlurred={isLocalBlurred}
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
          onMuteParticipant={handleMuteParticipant}
          onMuteAll={handleMuteAll}
          onRemoveParticipant={handleRemoveParticipant}
          onAdmitWaiting={handleAdmitWaiting}
          onRejectWaiting={handleRejectWaiting}
        />

        <InMeetingNotesDrawer
          isOpen={activeDrawer === 'notes'}
          onClose={() => setActiveDrawer(null)}
          initialNotes={notes}
          initialAISummary={aiSummary}
          onSaveNotes={handleSaveNotes}
          onGenerateSummary={handleGenerateAISummary}
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
        onSelectDevices={handleSelectDevices}
      />

      {/* Host Controls Security Modal */}
      <HostControlsModal
        isOpen={showHostModal}
        onClose={() => setShowHostModal(false)}
        isLocked={isLocked}
        allowChat={allowChat}
        allowScreenShare={allowScreenShare}
        allowReactions={allowReactions}
        onToggleLock={handleToggleLock}
        onToggleAllowChat={handleToggleAllowChat}
        onToggleAllowScreenShare={handleToggleAllowScreenShare}
        onToggleAllowReactions={handleToggleAllowReactions}
        onEndMeetingForAll={handleEndMeetingForAll}
      />

      {/* Post-Meeting Session Recap Modal */}
      <MeetingRecapModal
        isOpen={showRecapModal}
        meeting={meeting}
        durationSeconds={callDurationSeconds}
        participants={[localUserPeer, ...remotePeers]}
        notes={notes}
        aiSummary={aiSummary}
        onClose={() => navigate('/dashboard/meetings')}
      />
    </div>
  );
};
