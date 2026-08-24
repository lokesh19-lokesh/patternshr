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
  onRemoteStreamAdded: (peerId: string, stream: MediaStream) => void;
  onRemoteStreamRemoved: (peerId: string) => void;
  onPeerLeft: (peerId: string) => void;
  onPeerMuteChanged: (peerId: string, isAudioMuted: boolean, isVideoMuted: boolean) => void;
  onPeerScreenShareChanged: (peerId: string, isSharing: boolean) => void;
  onPeerHandRaised: (peerId: string, isRaised: boolean) => void;
  onPeerReaction: (peerId: string, emoji: string) => void;
  onChatMessage: (message: any) => void;
  onRoomCommand: (command: string, payload: any) => void;
  onAudioLevelChanged: (peerId: string, level: number) => void;
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
        // Return dummy empty stream if permissions blocked
        this.localStream = new MediaStream();
        return this.localStream;
      }
    }
  }

  // Setup Voice Activity Detection (AnalyserNode)
  private setupAudioLevelMeter(stream: MediaStream) {
    try {
      const audioTrack = stream.getAudioTracks()[0];
      if (!audioTrack) return;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

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
      // Notify of all active peers
      Object.keys(state).forEach((peerKey) => {
        if (peerKey !== this.currentEmployeeId) {
          this.ensurePeerConnection(peerKey, true);
        }
      });
    })
      .on('presence', { event: 'join' }, ({ key }: any) => {
        if (key !== this.currentEmployeeId) {
          this.ensurePeerConnection(key, true);
        }
      })
      .on('presence', { event: 'leave' }, ({ key }: any) => {
        if (key !== this.currentEmployeeId) {
          this.removePeer(key);
        }
      });

    // Handle WebRTC Signaling Broadcasts
    ch.on('broadcast', { event: 'signal' }, async ({ payload }: any) => {
      const { senderId, targetId, type, data } = payload;
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
        const { senderId, isAudioMuted, isVideoMuted, isScreenSharing, isHandRaised } = payload;
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

  // Ensure PeerConnection exists and initiate offer if polite
  private ensurePeerConnection(peerId: string, shouldOffer: boolean): RTCPeerConnection {
    if (this.peers.has(peerId)) {
      return this.peers.get(peerId)!;
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);
    this.peers.set(peerId, pc);

    // Add local media tracks to PC
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        pc.addTrack(track, this.localStream!);
      });
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
        this.callbacks.onRemoteStreamAdded(peerId, event.streams[0]);
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        this.removePeer(peerId);
      }
    };

    if (shouldOffer) {
      pc.onnegotiationneeded = async () => {
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          this.sendSignal(peerId, 'offer', offer);
        } catch (err) {
          console.error('Error creating offer', err);
        }
      };
    }

    return pc;
  }

  private async handleReceiveOffer(senderId: string, offer: RTCSessionDescriptionInit) {
    const pc = this.ensurePeerConnection(senderId, false);
    try {
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      this.sendSignal(senderId, 'answer', answer);
    } catch (e) {
      console.error('Error handling offer', e);
    }
  }

  private async handleReceiveAnswer(senderId: string, answer: RTCSessionDescriptionInit) {
    const pc = this.peers.get(senderId);
    if (pc) {
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      } catch (e) {
        console.error('Error setting remote description', e);
      }
    }
  }

  private async handleReceiveIceCandidate(senderId: string, candidate: RTCIceCandidateInit) {
    const pc = this.peers.get(senderId);
    if (pc) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.error('Error adding ICE candidate', e);
      }
    }
  }

  private sendSignal(targetId: string, type: 'offer' | 'answer' | 'ice_candidate', data: any) {
    this.channel?.send({
      type: 'broadcast',
      event: 'signal',
      payload: {
        senderId: this.currentEmployeeId,
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

  sendRoomCommand(command: string, payload: any = {}) {
    this.channel?.send({
      type: 'broadcast',
      event: 'room_command',
      payload: {
        command,
        senderId: this.currentEmployeeId,
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
    if (this.audioContext) {
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

    if (this.channel) {
      supabase.removeChannel(this.channel);
      this.channel = null;
    }
  }
}
