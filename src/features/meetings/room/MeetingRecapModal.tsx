import React, { useState } from 'react';
import { 
  CheckCircle, 
  Clock, 
  Users, 
  FileText, 
  Sparkles, 
  Copy, 
  Check, 
  ArrowRight,
  Download
} from 'lucide-react';
import type { Meeting, MeetingAISummary } from '../../../services/meeting.service';
import type { MeetingPeer } from './VideoGrid';

interface MeetingRecapModalProps {
  isOpen: boolean;
  meeting: Meeting | null;
  durationSeconds: number;
  participants: MeetingPeer[];
  notes: string;
  aiSummary?: MeetingAISummary;
  onClose: () => void;
}

export const MeetingRecapModal: React.FC<MeetingRecapModalProps> = ({
  isOpen,
  meeting,
  durationSeconds,
  participants,
  notes,
  aiSummary,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s}s`;
  };

  const handleCopyNotes = () => {
    const recapContent = `
Meeting: ${meeting?.title || 'PatternsHR Video Meeting'}
Date: ${new Date().toLocaleDateString()}
Duration: ${formatDuration(durationSeconds)}
Participants: ${participants.map((p) => p.name).join(', ')}

--- NOTES & MINUTES ---
${notes || 'No notes recorded.'}

${
  aiSummary
    ? `--- KEY DECISIONS ---
${aiSummary.decisions?.join('\n') || 'None'}

--- ACTION ITEMS ---
${aiSummary.action_items?.map((a) => `- [ ] ${a.task} ${a.assignee ? `@${a.assignee}` : ''}`).join('\n') || 'None'}
`
    : ''
}
`.trim();

    navigator.clipboard.writeText(recapContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadMinutes = () => {
    const blob = new Blob(
      [
        `MEETING MINUTES - ${meeting?.title || 'Meeting'}\nDate: ${new Date().toLocaleString()}\nDuration: ${formatDuration(durationSeconds)}\n\nParticipants:\n${participants.map((p) => `- ${p.name}`).join('\n')}\n\nNotes:\n${notes}\n`,
      ],
      { type: 'text/plain;charset=utf-8' }
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${meeting?.meeting_code || 'meeting'}-recap.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in text-white">
      <div className="relative w-full max-w-lg bg-[#1F2327] rounded-3xl shadow-2xl border border-gray-800 overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-gradient-to-br from-emerald-950/60 to-[#1F2327] border-b border-gray-800 text-center space-y-2">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-primary-green/20 text-primary-green border border-primary-green/30 flex items-center justify-center">
            <CheckCircle className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-bold text-white">You left the meeting</h2>
          <p className="text-xs text-gray-400">
            Session summary for &quot;{meeting?.title || 'Video Sync'}&quot;
          </p>
        </div>

        {/* Stats Grid */}
        <div className="p-6 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-[#24292D] border border-gray-800 rounded-2xl flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-gray-800 text-primary-green">
                <Clock className="h-4 w-4" />
              </div>
              <div>
                <div className="text-[10px] text-gray-400 font-bold uppercase">Call Duration</div>
                <div className="font-bold text-white">{formatDuration(durationSeconds)}</div>
              </div>
            </div>

            <div className="p-3 bg-[#24292D] border border-gray-800 rounded-2xl flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-gray-800 text-blue-400">
                <Users className="h-4 w-4" />
              </div>
              <div>
                <div className="text-[10px] text-gray-400 font-bold uppercase">Participants</div>
                <div className="font-bold text-white">{participants.length} Attendees</div>
              </div>
            </div>
          </div>

          {/* Notes Preview */}
          {notes && (
            <div className="p-3.5 bg-[#24292D] border border-gray-800 rounded-2xl space-y-1.5">
              <div className="flex items-center space-x-1.5 text-gray-300 font-bold text-[11px]">
                <FileText className="h-3.5 w-3.5 text-primary-green" />
                <span>Minutes Captured</span>
              </div>
              <p className="text-gray-400 line-clamp-3 text-[11px] leading-relaxed">
                {notes}
              </p>
            </div>
          )}

          {/* AI Action Items if present */}
          {aiSummary && aiSummary.action_items && aiSummary.action_items.length > 0 && (
            <div className="p-3.5 bg-emerald-950/30 border border-emerald-800/40 rounded-2xl space-y-1.5">
              <div className="flex items-center space-x-1.5 text-emerald-400 font-bold text-[11px]">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                <span>{aiSummary.action_items.length} Action Items Generated</span>
              </div>
              <ul className="space-y-1 text-gray-300 text-[11px]">
                {aiSummary.action_items.slice(0, 3).map((a, i) => (
                  <li key={i} className="truncate">
                    • {a.task} {a.assignee ? `(@${a.assignee})` : ''}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Quick Actions */}
          <div className="flex items-center space-x-2 pt-2">
            <button
              onClick={handleCopyNotes}
              className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-200 font-bold rounded-xl flex items-center justify-center space-x-1.5 transition-colors border border-gray-700"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-primary-green" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? 'Copied Recap' : 'Copy Minutes'}</span>
            </button>

            <button
              onClick={handleDownloadMinutes}
              className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-200 font-bold rounded-xl flex items-center justify-center space-x-1.5 transition-colors border border-gray-700"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download File</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#171A1C] border-t border-gray-800 flex items-center justify-end">
          <button
            onClick={onClose}
            className="w-full py-3 bg-primary-green hover:bg-dark-green text-white font-bold rounded-xl shadow-lg shadow-emerald-950/60 flex items-center justify-center space-x-2 transition-all"
          >
            <span>Return to Meetings Hub</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
