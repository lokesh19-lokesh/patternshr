import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Paperclip, Download, FileText } from 'lucide-react';
import type { MeetingMessage } from '../../../services/meeting.service';
import { supabase } from '../../../lib/supabase/client';

interface InMeetingChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  messages: MeetingMessage[];
  onSendMessage: (text: string, attachments?: any[]) => void;
  currentEmployeeId: string;
  companyId: string;
}

export const InMeetingChatDrawer: React.FC<InMeetingChatDrawerProps> = ({
  isOpen,
  onClose,
  messages,
  onSendMessage,
  currentEmployeeId,
  companyId,
}) => {
  const [text, setText] = useState('');
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSendMessage(text.trim());
    setText('');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const fileName = `meeting-attachments/${companyId}/${Date.now()}_${file.name}`;
      const { error } = await supabase.storage
        .from('workreport')
        .upload(fileName, file, { upsert: true });

      if (error) throw error;

      const { data: pubData } = supabase.storage.from('workreport').getPublicUrl(fileName);
      const attachment = {
        name: file.name,
        url: pubData.publicUrl,
        size: file.size,
        type: file.type,
      };

      onSendMessage(`Shared a file: ${file.name}`, [attachment]);
    } catch (err) {
      alert('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed sm:absolute top-0 right-0 w-full sm:w-80 md:w-96 h-full bg-[#1F2327] border-l border-gray-800 flex flex-col z-40 animate-slide-left shadow-2xl">
      {/* Header */}
      <div className="p-4 border-b border-gray-800 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white">In-Meeting Chat</h3>
          <p className="text-[11px] text-gray-400">Messages are visible to participants</p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-xl hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
        {messages.length > 0 ? (
          messages.map((m) => {
            const isMine = m.sender_id === currentEmployeeId;
            const senderName = isMine
              ? 'You'
              : m.sender
              ? `${m.sender.first_name} ${m.sender.last_name || ''}`
              : 'Participant';

            const timeStr = m.created_at
              ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : '';

            return (
              <div
                key={m.id}
                className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} space-y-1`}
              >
                <div className="flex items-center space-x-2 text-[10px] text-gray-400">
                  <span className="font-bold text-gray-300">{senderName}</span>
                  <span>{timeStr}</span>
                </div>

                <div
                  className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${
                    isMine
                      ? 'bg-primary-green text-white rounded-tr-none'
                      : 'bg-[#2B3035] text-gray-200 rounded-tl-none border border-gray-700/60'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.message_text}</p>

                  {/* Attachments */}
                  {m.attachments && m.attachments.length > 0 && (
                    <div className="mt-2 space-y-1.5 pt-2 border-t border-white/20">
                      {m.attachments.map((att, i) => (
                        <a
                          key={i}
                          href={att.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center space-x-2 p-1.5 rounded-xl bg-black/20 hover:bg-black/40 text-[11px] text-white transition-colors"
                        >
                          <FileText className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate flex-1">{att.name}</span>
                          <Download className="h-3.5 w-3.5" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-8 text-center text-gray-400 text-xs">
            No messages yet. Send a message to everyone in the room.
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Composer */}
      <form onSubmit={handleSend} className="p-3 border-t border-gray-800 bg-[#171A1C]">
        <div className="flex items-center space-x-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            title="Attach File"
            className="p-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors disabled:opacity-50"
          >
            <Paperclip className="h-4 w-4" />
          </button>

          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type message to everyone..."
            className="flex-1 px-3.5 py-2.5 bg-[#24292D] border border-gray-700 rounded-xl text-xs text-white placeholder-gray-400 focus:outline-none focus:border-primary-green"
          />

          <button
            type="submit"
            disabled={!text.trim()}
            className="p-2.5 rounded-xl bg-primary-green hover:bg-dark-green text-white font-bold transition-all disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
