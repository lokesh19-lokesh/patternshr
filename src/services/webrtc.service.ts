import { supabase } from '../lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface PeerConnectionInfo {
  peerId: string;
  employeeId: string;
  name: string;
  pc: RTCPeerConnection;
  stream?: MediaStream;
  isAudioMuted: boolean;
  isVideoMuted: boolean;
  isScreenSharing: boolean;
  isHandRaised: boolean;
  audioLevel: number;
}

export interface WebRTCEventCallbacks {
  onRemoteStreamAdded: (peerId: string, stream: MediaStream, peerName?: string) => void;
  onRemoteStreamRemoved: (peerId: string) => void;
  onPeerLeft: (peerId: string) => void;
  onPeerMuteChanged: (peerId: string, isAudioMuted: boolean, isVideoMuted: boolean) => void;
  onPeerScreenShareChanged: (peerId: string, isSharing: boolean) => void;
  onPeerHandRaised: (peerId: string, isRaised: boolean) => void;
  onPeerReaction: (peerId: string, emoji: string) => void;
  onChatMessage: (message: any) => void;
  onRoomCommand: (command: string, payload: any) => void;
  onAudioLevelChanged: (peerId: string, level: number) => void;
  onPeerNameResolved?: (peerId: string, name: string) => void;
  onNotesUpdated?: (notes: string) => void;
}

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

export class WebRTCMeetingManager {
  private meetingCode: string;
  private currentEmployeeId: string;
  private currentEmployeeName: string;
  private channel: RealtimeChannel | null = null;
  private localStream: MediaStream | null = null;
  private localScreenStream: MediaStream | null = null;
  private peers: Map<string, RTCPeerConnection> = new Map();
  private peerNames: Map<string, string> = new Map();
  private iceCandidatesQueue: Map<string, RTCIceCandidateInit[]> = new Map();
  private makingOffer: Map<string, boolean> = new Map();
  private isSettingRemoteAnswerPending: Map<string, boolean> = new Map();
  private callbacks: WebRTCEventCallbacks;
  private audioContext: AudioContext | null = null;
  private localAudioAnalyser: AnalyserNode | null = null;
  private audioLevelInterval: any = null;

  public isAudioMuted: boolean = false;
  public isVideoMuted: boolean = false;
  public isScreenSharing: boolean = false;
  public isHandRaised: boolean = false;

  constructor(
    meetingCode: string,
    currentEmployeeId: string,
    currentEmployeeName: string,
    callbacks: WebRTCEventCallbacks
  ) {
    this.meetingCode = meetingCode;
    this.currentEmployeeId = currentEmployeeId;
    this.currentEmployeeName = currentEmployeeName;
    this.callbacks = callbacks;
  }

  // 1. Get Local Camera and Mic Stream
  async initLocalMedia(videoDeviceId?: string, audioDeviceId?: string): Promise<MediaStream> {
    const constraints: MediaStreamConstraints = {
      audio: audioDeviceId ? { deviceId: { exact: audioDeviceId } } : true,
      video: videoDeviceId
        ? { deviceId: { exact: videoDeviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
        : { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
    };

    try {
      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      this.setupAudioLevelMeter(this.localStream);
      return this.localStream;
    } catch (e: any) {
      console.warn('Could not get video+audio, trying audio only...', e);
      try {
        this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        this.isVideoMuted = true;
        this.setupAudioLevelMeter(this.localStream);
        return this.localStream;
      } catch (audioErr) {
        console.error('Permission denied for audio/video', audioErr);
        this.localStream = new MediaStream();
        return this.localStream;
      }
    }
  }

  // Hot switch devices during an active call
  async switchDevices(audioDeviceId?: string, videoDeviceId?: string): Promise<MediaStream | null> {
    try {
      const constraints: MediaStreamConstraints = {
        audio: audioDeviceId ? { deviceId: { exact: audioDeviceId } } : true,
        video: videoDeviceId
          ? { deviceId: { exact: videoDeviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
          : { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
      };

      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      const newAudioTrack = newStream.getAudioTracks()[0];
      const newVideoTrack = newStream.getVideoTracks()[0];

      if (this.isAudioMuted && newAudioTrack) {
        newAudioTrack.enabled = false;
      }
      if (this.isVideoMuted && newVideoTrack) {
        newVideoTrack.enabled = false;
      }

      // Replace tracks in all RTCPeerConnections
      this.peers.forEach((pc) => {
        pc.getSenders().forEach((sender) => {
          if (sender.track?.kind === 'audio' && newAudioTrack) {
            sender.replaceTrack(newAudioTrack);
          } else if (sender.track?.kind === 'video' && !this.isScreenSharing && newVideoTrack) {
            sender.replaceTrack(newVideoTrack);
          }
        });
      });

      // Stop old tracks
      if (this.localStream) {
        this.localStream.getTracks().forEach((t) => t.stop());
      }

      this.localStream = newStream;
      this.setupAudioLevelMeter(this.localStream);
      return this.localStream;
    } catch (err) {
      console.warn('Could not switch audio/video devices:', err);
      return null;
    }
  }

  // Setup Voice Activity Detection (AnalyserNode)
  private setupAudioLevelMeter(stream: MediaStream) {
    try {
      const audioTrack = stream.getAudioTracks()[0];
      if (!audioTrack) return;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      if (this.audioContext && this.audioContext.state !== 'closed') {
        this.audioContext.close().catch(() => {});
      }

      this.audioContext = new AudioCtx();
      const source = this.audioContext.createMediaStreamSource(stream);
      this.localAudioAnalyser = this.audioContext.createAnalyser();
      this.localAudioAnalyser.fftSize = 256;
      source.connect(this.localAudioAnalyser);

      const bufferLength = this.localAudioAnalyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      clearInterval(this.audioLevelInterval);
      this.audioLevelInterval = setInterval(() => {
        if (!this.localAudioAnalyser || this.isAudioMuted) {
          this.callbacks.onAudioLevelChanged(this.currentEmployeeId, 0);
          return;
        }
        this.localAudioAnalyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / bufferLength;
        const normalized = Math.min(100, Math.round((avg / 128) * 100));
        this.callbacks.onAudioLevelChanged(this.currentEmployeeId, normalized > 10 ? normalized : 0);
      }, 200);
    } catch (e) {
      console.warn('Could not start audio level analyser', e);
    }
  }

  // 2. Join Realtime Signaling Room
  async joinRoom(): Promise<void> {
    const channelName = `meeting_room_${this.meetingCode}`;
    const ch = supabase.channel(channelName, {
      config: {
        presence: {
          key: this.currentEmployeeId,
        },
      },
    });
    this.channel = ch;

    // Handle Presence state
    ch.on('presence', { event: 'sync' }, () => {
      const state = ch.presenceState() || {};
      Object.entries(state).forEach(([peerKey, presences]) => {
        const pres = (presences as any[])?.[0];
        const peerName = pres?.name;
        if (peerKey !== this.currentEmployeeId) {
          if (peerName) {
            this.peerNames.set(peerKey, peerName);
            this.callbacks.onPeerNameResolved?.(peerKey, peerName);
          }
          this.ensurePeerConnection(peerKey);
        }
      });
    })
      .on('presence', { event: 'join' }, ({ key, newPresences }: any) => {
        const peerName = newPresences?.[0]?.name;
        if (key !== this.currentEmployeeId) {
          if (peerName) {
            this.peerNames.set(key, peerName);
            this.callbacks.onPeerNameResolved?.(key, peerName);
          }
          this.ensurePeerConnection(key);
        }
      })
      .on('presence', { event: 'leave' }, ({ key }: any) => {
        if (key !== this.currentEmployeeId) {
          this.removePeer(key);
        }
      });

    // Handle WebRTC Signaling Broadcasts
    ch.on('broadcast', { event: 'signal' }, async ({ payload }: any) => {
      const { senderId, senderName, targetId, type, data } = payload;
      if (senderName) {
        this.peerNames.set(senderId, senderName);
        this.callbacks.onPeerNameResolved?.(senderId, senderName);
      }
      if (targetId && targetId !== this.currentEmployeeId) return;

      if (type === 'offer') {
        await this.handleReceiveOffer(senderId, data);
      } else if (type === 'answer') {
        await this.handleReceiveAnswer(senderId, data);
      } else if (type === 'ice_candidate') {
        await this.handleReceiveIceCandidate(senderId, data);
      }
    })
      .on('broadcast', { event: 'peer_state' }, ({ payload }: any) => {
        const { senderId, senderName, isAudioMuted, isVideoMuted, isScreenSharing, isHandRaised } = payload;
        if (senderName) {
          this.peerNames.set(senderId, senderName);
          this.callbacks.onPeerNameResolved?.(senderId, senderName);
        }
        if (senderId !== this.currentEmployeeId) {
          this.callbacks.onPeerMuteChanged(senderId, isAudioMuted, isVideoMuted);
          this.callbacks.onPeerScreenShareChanged(senderId, isScreenSharing);
          this.callbacks.onPeerHandRaised(senderId, isHandRaised);
        }
      })
      .on('broadcast', { event: 'reaction' }, ({ payload }: any) => {
        this.callbacks.onPeerReaction(payload.senderId, payload.emoji);
      })
      .on('broadcast', { event: 'chat' }, ({ payload }: any) => {
        this.callbacks.onChatMessage(payload);
      })
      .on('broadcast', { event: 'room_command' }, ({ payload }: any) => {
        this.callbacks.onRoomCommand(payload.command, payload);
      })
      .on('broadcast', { event: 'notes_sync' }, ({ payload }: any) => {
        if (payload.senderId !== this.currentEmployeeId && payload.notes !== undefined) {
          this.callbacks.onNotesUpdated?.(payload.notes);
        }
      });

    // Subscribe and track presence
    await ch.subscribe(async (status: string) => {
      if (status === 'SUBSCRIBED') {
        await ch.track({
          employee_id: this.currentEmployeeId,
          name: this.currentEmployeeName,
          is_audio_muted: this.isAudioMuted,
          is_video_muted: this.isVideoMuted,
          is_screen_sharing: this.isScreenSharing,
          is_hand_raised: this.isHandRaised,
          joined_at: new Date().toISOString(),
        });
      }
    });
  }

  // Determine if this peer is the polite peer in polite-peer pattern
  private isPolitePeer(peerId: string): boolean {
    return this.currentEmployeeId.localeCompare(peerId) < 0;
  }

  // Ensure PeerConnection exists with robust negotiation and track management
  private ensurePeerConnection(peerId: string): RTCPeerConnection {
    if (this.peers.has(peerId)) {
      return this.peers.get(peerId)!;
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);
    this.peers.set(peerId, pc);
    this.makingOffer.set(peerId, false);
    this.isSettingRemoteAnswerPending.set(peerId, false);

    // Add local tracks (or screen share track if currently sharing)
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      const videoTrack = this.isScreenSharing && this.localScreenStream
        ? this.localScreenStream.getVideoTracks()[0]
        : this.localStream.getVideoTracks()[0];

      if (audioTrack) pc.addTrack(audioTrack, this.localStream);
      if (videoTrack) pc.addTrack(videoTrack, this.localStream);
    }

    // ICE Candidate handler
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignal(peerId, 'ice_candidate', event.candidate);
      }
    };

    // Remote Track handler
    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        const peerName = this.peerNames.get(peerId);
        this.callbacks.onRemoteStreamAdded(peerId, event.streams[0], peerName);
      }
    };

    // Connection state change
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        this.removePeer(peerId);
      }
    };

    // Polite Peer Perfect Negotiation
    pc.onnegotiationneeded = async () => {
      try {
        this.makingOffer.set(peerId, true);
        await pc.setLocalDescription();
        this.sendSignal(peerId, 'offer', pc.localDescription);
      } catch (err) {
        console.error(`Error in onnegotiationneeded for peer ${peerId}:`, err);
      } finally {
        this.makingOffer.set(peerId, false);
      }
    };

    return pc;
  }

  private async handleReceiveOffer(senderId: string, offer: RTCSessionDescriptionInit) {
    const pc = this.ensurePeerConnection(senderId);
    const isPolite = this.isPolitePeer(senderId);
    const offerCollision = this.makingOffer.get(senderId) || pc.signalingState !== 'stable';

    if (offerCollision && !isPolite) {
      // Impolite peer ignores colliding offer
      return;
    }

    try {
      if (offerCollision && isPolite) {
        await pc.setLocalDescription({ type: 'rollback' });
      }

      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      await pc.setLocalDescription();
      this.sendSignal(senderId, 'answer', pc.localDescription);

      // Process any queued ICE candidates for this peer
      await this.drainIceCandidates(senderId, pc);
    } catch (e) {
      console.error(`Error handling offer from ${senderId}:`, e);
    }
  }

  private async handleReceiveAnswer(senderId: string, answer: RTCSessionDescriptionInit) {
    const pc = this.peers.get(senderId);
    if (!pc) return;

    try {
      this.isSettingRemoteAnswerPending.set(senderId, true);
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
      await this.drainIceCandidates(senderId, pc);
    } catch (e) {
      console.error(`Error setting remote answer for ${senderId}:`, e);
    } finally {
      this.isSettingRemoteAnswerPending.set(senderId, false);
    }
  }

  private async handleReceiveIceCandidate(senderId: string, candidate: RTCIceCandidateInit) {
    const pc = this.peers.get(senderId);
    if (!pc || !pc.remoteDescription) {
      const queue = this.iceCandidatesQueue.get(senderId) || [];
      queue.push(candidate);
      this.iceCandidatesQueue.set(senderId, queue);
      return;
    }

    try {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (e) {
      console.warn(`Error adding ICE candidate from ${senderId}:`, e);
    }
  }

  private async drainIceCandidates(peerId: string, pc: RTCPeerConnection) {
    const candidates = this.iceCandidatesQueue.get(peerId);
    if (candidates && candidates.length > 0) {
      for (const cand of candidates) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(cand));
        } catch (err) {
          console.warn(`Error draining queued ICE candidate for ${peerId}:`, err);
        }
      }
      this.iceCandidatesQueue.delete(peerId);
    }
  }

  private sendSignal(targetId: string, type: 'offer' | 'answer' | 'ice_candidate', data: any) {
    this.channel?.send({
      type: 'broadcast',
      event: 'signal',
      payload: {
        senderId: this.currentEmployeeId,
        senderName: this.currentEmployeeName,
        targetId,
        type,
        data,
      },
    });
  }

  // 3. Audio / Video / Screen Sharing Toggles
  toggleAudio(): boolean {
    if (!this.localStream) return false;
    const audioTrack = this.localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      this.isAudioMuted = !audioTrack.enabled;
      this.broadcastState();
      return !this.isAudioMuted;
    }
    return false;
  }

  toggleVideo(): boolean {
    if (!this.localStream) return false;
    const videoTrack = this.localStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      this.isVideoMuted = !videoTrack.enabled;
      this.broadcastState();
      return !this.isVideoMuted;
    }
    return false;
  }

  async startScreenShare(): Promise<MediaStream | null> {
    try {
      this.localScreenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      const screenTrack = this.localScreenStream.getVideoTracks()[0];

      // Replace video track in all active peer connections
      this.peers.forEach((pc) => {
        const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
        if (sender) {
          sender.replaceTrack(screenTrack);
        }
      });

      screenTrack.onended = () => {
        this.stopScreenShare();
      };

      this.isScreenSharing = true;
      this.broadcastState();
      return this.localScreenStream;
    } catch (e) {
      console.warn('Screen share cancelled or failed', e);
      return null;
    }
  }

  stopScreenShare(): void {
    if (this.localScreenStream) {
      this.localScreenStream.getTracks().forEach((t) => t.stop());
      this.localScreenStream = null;
    }

    // Revert back to local camera video track
    const camTrack = this.localStream?.getVideoTracks()[0] || null;
    this.peers.forEach((pc) => {
      const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
      if (sender && camTrack) {
        sender.replaceTrack(camTrack);
      }
    });

    this.isScreenSharing = false;
    this.broadcastState();
  }

  toggleHandRaise(): boolean {
    this.isHandRaised = !this.isHandRaised;
    this.broadcastState();
    return this.isHandRaised;
  }

  sendReaction(emoji: string) {
    this.channel?.send({
      type: 'broadcast',
      event: 'reaction',
      payload: {
        senderId: this.currentEmployeeId,
        senderName: this.currentEmployeeName,
        emoji,
      },
    });
  }

  sendBroadcastChat(message: any) {
    this.channel?.send({
      type: 'broadcast',
      event: 'chat',
      payload: message,
    });
  }

  sendBroadcastNotes(notes: string) {
    this.channel?.send({
      type: 'broadcast',
      event: 'notes_sync',
      payload: {
        senderId: this.currentEmployeeId,
        notes,
      },
    });
  }

  sendRoomCommand(command: string, payload: any = {}) {
    this.channel?.send({
      type: 'broadcast',
      event: 'room_command',
      payload: {
        command,
        senderId: this.currentEmployeeId,
        senderName: this.currentEmployeeName,
        ...payload,
      },
    });
  }

  private broadcastState() {
    this.channel?.send({
      type: 'broadcast',
      event: 'peer_state',
      payload: {
        senderId: this.currentEmployeeId,
        senderName: this.currentEmployeeName,
        isAudioMuted: this.isAudioMuted,
        isVideoMuted: this.isVideoMuted,
        isScreenSharing: this.isScreenSharing,
        isHandRaised: this.isHandRaised,
      },
    });

    this.channel?.track({
      employee_id: this.currentEmployeeId,
      name: this.currentEmployeeName,
      is_audio_muted: this.isAudioMuted,
      is_video_muted: this.isVideoMuted,
      is_screen_sharing: this.isScreenSharing,
      is_hand_raised: this.isHandRaised,
    });
  }

  private removePeer(peerId: string) {
    const pc = this.peers.get(peerId);
    if (pc) {
      pc.close();
      this.peers.delete(peerId);
    }
    this.iceCandidatesQueue.delete(peerId);
    this.makingOffer.delete(peerId);
    this.isSettingRemoteAnswerPending.delete(peerId);
    this.callbacks.onRemoteStreamRemoved(peerId);
    this.callbacks.onPeerLeft(peerId);
  }

  // 4. Device Management
  static async getAvailableDevices() {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return {
      audioInputs: devices.filter((d) => d.kind === 'audioinput'),
      audioOutputs: devices.filter((d) => d.kind === 'audiooutput'),
      videoInputs: devices.filter((d) => d.kind === 'videoinput'),
    };
  }

  // Cleanup
  leaveRoom() {
    clearInterval(this.audioLevelInterval);
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(() => {});
    }

    if (this.localStream) {
      this.localStream.getTracks().forEach((t) => t.stop());
    }

    if (this.localScreenStream) {
      this.localScreenStream.getTracks().forEach((t) => t.stop());
    }

    this.peers.forEach((pc) => pc.close());
    this.peers.clear();
    this.iceCandidatesQueue.clear();
    this.makingOffer.clear();
    this.isSettingRemoteAnswerPending.clear();

    if (this.channel) {
      supabase.removeChannel(this.channel);
      this.channel = null;
    }
  }
}
