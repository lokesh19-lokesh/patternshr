import React, { useState, useEffect } from 'react';
import { X, Mic, Video, Volume2 } from 'lucide-react';
import { WebRTCMeetingManager } from '../../../services/webrtc.service';

interface DeviceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDevices?: (audioId: string, videoId: string) => void;
}

export const DeviceSettingsModal: React.FC<DeviceSettingsModalProps> = ({
  isOpen,
  onClose,
  onSelectDevices,
}) => {
  const [audioInputs, setAudioInputs] = useState<MediaDeviceInfo[]>([]);
  const [videoInputs, setVideoInputs] = useState<MediaDeviceInfo[]>([]);
  const [audioOutputs, setAudioOutputs] = useState<MediaDeviceInfo[]>([]);

  const [selectedAudio, setSelectedAudio] = useState('');
  const [selectedVideo, setSelectedVideo] = useState('');
  const [selectedSpeaker, setSelectedSpeaker] = useState('');

  const [testAudioPlaying, setTestAudioPlaying] = useState(false);

  useEffect(() => {
    if (isOpen) {
      WebRTCMeetingManager.getAvailableDevices().then((devices) => {
        setAudioInputs(devices.audioInputs);
        setVideoInputs(devices.videoInputs);
        setAudioOutputs(devices.audioOutputs);

        if (devices.audioInputs[0]) setSelectedAudio(devices.audioInputs[0].deviceId);
        if (devices.videoInputs[0]) setSelectedVideo(devices.videoInputs[0].deviceId);
        if (devices.audioOutputs[0]) setSelectedSpeaker(devices.audioOutputs[0].deviceId);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestSpeaker = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 440;
        gain.gain.value = 0.1;
        osc.start();
        setTestAudioPlaying(true);
        setTimeout(() => {
          osc.stop();
          ctx.close();
          setTestAudioPlaying(false);
        }, 1000);
      }
    } catch (e) {}
  };

  const handleSave = () => {
    onSelectDevices?.(selectedAudio, selectedVideo);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-[#1F2327] rounded-3xl shadow-2xl border border-gray-800 overflow-hidden text-white">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-[#171A1C]">
          <h3 className="text-sm font-bold text-white">Audio & Video Settings</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-gray-800 text-gray-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 text-xs">
          {/* Microphone */}
          <div>
            <label className="flex items-center space-x-2 font-bold text-gray-300 uppercase tracking-wider mb-2">
              <Mic className="h-4 w-4 text-emerald-400" />
              <span>Microphone Input</span>
            </label>
            <select
              value={selectedAudio}
              onChange={(e) => setSelectedAudio(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#24292D] border border-gray-700 rounded-xl text-xs text-white focus:outline-none focus:border-primary-green"
            >
              {audioInputs.map((d, i) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label || `Microphone ${i + 1}`}
                </option>
              ))}
            </select>
          </div>

          {/* Camera */}
          <div>
            <label className="flex items-center space-x-2 font-bold text-gray-300 uppercase tracking-wider mb-2">
              <Video className="h-4 w-4 text-emerald-400" />
              <span>Camera Video</span>
            </label>
            <select
              value={selectedVideo}
              onChange={(e) => setSelectedVideo(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#24292D] border border-gray-700 rounded-xl text-xs text-white focus:outline-none focus:border-primary-green"
            >
              {videoInputs.map((d, i) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label || `Camera ${i + 1}`}
                </option>
              ))}
            </select>
          </div>

          {/* Speaker */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center space-x-2 font-bold text-gray-300 uppercase tracking-wider">
                <Volume2 className="h-4 w-4 text-blue-400" />
                <span>Audio Output / Speaker</span>
              </label>
              <button
                type="button"
                onClick={handleTestSpeaker}
                className="text-[11px] font-bold text-primary-green hover:underline"
              >
                {testAudioPlaying ? 'Playing Tone...' : 'Test Speaker'}
              </button>
            </div>
            <select
              value={selectedSpeaker}
              onChange={(e) => setSelectedSpeaker(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#24292D] border border-gray-700 rounded-xl text-xs text-white focus:outline-none focus:border-primary-green"
            >
              {audioOutputs.length > 0 ? (
                audioOutputs.map((d, i) => (
                  <option key={d.deviceId} value={d.deviceId}>
                    {d.label || `Speaker ${i + 1}`}
                  </option>
                ))
              ) : (
                <option value="default">Default System Audio Output</option>
              )}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 px-6 py-4 border-t border-gray-800 bg-[#171A1C]">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-gray-700 text-xs font-bold text-gray-300 hover:bg-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-primary-green hover:bg-dark-green text-white text-xs font-bold shadow-md shadow-emerald-950"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};
