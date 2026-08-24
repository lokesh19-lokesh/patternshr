import React, { useState, useRef, useEffect } from 'react';
import { 
  Smile, 
  Paperclip, 
  Send, 
  X, 
  FileText 
} from 'lucide-react';
import type { ChatAttachment, ChatMessage } from '../../../services/chat.service';
import type { Employee } from '../../../services/employee.service';

interface MessageComposerProps {
  onSendMessage: (text: string, attachments: ChatAttachment[], mentions: string[]) => void;
  onTyping: (isTyping: boolean) => void;
  onUploadFile: (file: File) => Promise<ChatAttachment>;
  replyingTo: ChatMessage | null;
  editingMessage: ChatMessage | null;
  onCancelReply: () => void;
  onCancelEdit: () => void;
  allEmployees: Employee[];
}

const COMMON_EMOJIS = ['👍', '❤️', '😊', '😂', '🎉', '🔥', '✅', '🚀', '🙌', '🙏', '👀', '👏', '💯', '✨'];

export const MessageComposer: React.FC<MessageComposerProps> = ({
  onSendMessage,
  onTyping,
  onUploadFile,
  replyingTo,
  editingMessage,
  onCancelReply,
  onCancelEdit,
  allEmployees,
}) => {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [selectedMentions, setSelectedMentions] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimerRef = useRef<any>(null);

  // Sync editing text
  useEffect(() => {
    if (editingMessage) {
      setText(editingMessage.message_text);
      textareaRef.current?.focus();
    }
  }, [editingMessage]);

  // Handle Typing Indicator
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setText(val);

    // Check for @mention trigger
    const lastWord = val.split(' ').pop();
    if (lastWord && lastWord.startsWith('@') && lastWord.length > 1) {
      setMentionQuery(lastWord.substring(1));
    } else {
      setMentionQuery(null);
    }

    // Trigger typing event
    onTyping(true);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      onTyping(false);
    }, 2000);
  };

  const handleMentionSelect = (emp: Employee) => {
    const words = text.split(' ');
    words.pop();
    words.push(`@${emp.first_name}`);
    setText(words.join(' ') + ' ');
    setSelectedMentions((prev) => [...prev, emp.id]);
    setMentionQuery(null);
    textareaRef.current?.focus();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        setUploading(true);
        const att = await onUploadFile(file);
        setAttachments((prev) => [...prev, att]);
      } catch (err) {
        alert('Failed to upload file');
      } finally {
        setUploading(false);
      }
    }
  };

  const handleSend = () => {
    if (!text.trim() && attachments.length === 0) return;
    onSendMessage(text.trim(), attachments, selectedMentions);
    setText('');
    setAttachments([]);
    setSelectedMentions([]);
    setShowEmojiPicker(false);
    onTyping(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const matchingEmployees = mentionQuery
    ? allEmployees.filter((e) =>
        `${e.first_name} ${e.last_name || ''}`.toLowerCase().includes(mentionQuery.toLowerCase())
      )
    : [];

  return (
    <div className="p-3 sm:p-4 bg-white border-t border-gray-200/80 select-none relative">
      {/* Replying / Editing Banner */}
      {(replyingTo || editingMessage) && (
        <div className="mb-2 p-2 bg-soft-green/60 rounded-xl border border-primary-green/30 flex items-center justify-between text-xs text-dark-green">
          <div className="flex items-center space-x-2 truncate">
            <span className="font-bold">
              {editingMessage ? 'Editing Message:' : `Replying to ${replyingTo?.sender?.first_name || 'member'}:`}
            </span>
            <span className="truncate italic">
              {editingMessage ? editingMessage.message_text : replyingTo?.message_text}
            </span>
          </div>
          <button
            type="button"
            onClick={editingMessage ? onCancelEdit : onCancelReply}
            className="p-1 hover:bg-white rounded-lg text-text-grey hover:text-charcoal"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Attachments Preview Drawer */}
      {attachments.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {attachments.map((att, idx) => (
            <div
              key={idx}
              className="flex items-center space-x-2 p-2 rounded-xl bg-light-grey border border-gray-200 text-xs font-semibold text-charcoal"
            >
              <FileText className="h-3.5 w-3.5 text-primary-green" />
              <span className="truncate max-w-[150px]">{att.name}</span>
              <button
                type="button"
                onClick={() => setAttachments(attachments.filter((_, i) => i !== idx))}
                className="p-0.5 hover:bg-white rounded-md text-text-grey hover:text-red-600"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* @Mention Autocomplete Popover */}
      {mentionQuery !== null && matchingEmployees.length > 0 && (
        <div className="absolute bottom-full left-4 mb-2 bg-white rounded-2xl shadow-xl border border-gray-200 p-1.5 w-64 max-h-48 overflow-y-auto z-40 divide-y divide-gray-50">
          <div className="px-2 py-1 text-[10px] font-bold text-text-grey uppercase">Mention Team Member</div>
          {matchingEmployees.map((emp) => (
            <button
              key={emp.id}
              type="button"
              onClick={() => handleMentionSelect(emp)}
              className="w-full flex items-center space-x-2 p-2 hover:bg-soft-green rounded-xl text-left transition-colors"
            >
              <div className="h-6 w-6 rounded-lg bg-primary-green/15 text-dark-green flex items-center justify-center font-bold text-[10px]">
                {emp.first_name[0]}
              </div>
              <span className="text-xs font-bold text-charcoal">
                {emp.first_name} {emp.last_name || ''}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Emoji Picker Popover */}
      {showEmojiPicker && (
        <div className="absolute bottom-full left-4 mb-2 bg-white rounded-2xl shadow-xl border border-gray-200 p-2.5 w-64 z-40">
          <div className="grid grid-cols-7 gap-1">
            {COMMON_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => {
                  setText((prev) => prev + emoji);
                  setShowEmojiPicker(false);
                  textareaRef.current?.focus();
                }}
                className="p-1.5 hover:bg-light-grey rounded-lg text-lg text-center transition-transform hover:scale-125"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Composer Box */}
      <div className="flex items-end space-x-2 bg-light-grey/80 border border-gray-200/90 rounded-2xl p-2 focus-within:bg-white focus-within:border-primary-green focus-within:ring-1 focus-within:ring-primary-green transition-all shadow-xs">
        {/* Emoji Button */}
        <button
          type="button"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="p-2 text-text-grey hover:text-charcoal hover:bg-light-grey rounded-xl transition-colors flex-shrink-0"
          title="Add emoji"
        >
          <Smile className="h-5 w-5" />
        </button>

        {/* Attachment Button */}
        <label className="p-2 text-text-grey hover:text-charcoal hover:bg-light-grey rounded-xl transition-colors cursor-pointer flex-shrink-0">
          <Paperclip className="h-5 w-5" />
          <input
            type="file"
            onChange={handleFileChange}
            className="hidden"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.png,.jpg,.jpeg,.zip"
          />
        </label>

        {/* Text Input */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
          className="flex-1 max-h-32 min-h-[38px] py-2 px-1 text-xs sm:text-sm text-charcoal bg-transparent resize-none focus:outline-none leading-relaxed"
        />

        {/* Send Button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={uploading || (!text.trim() && attachments.length === 0)}
          className="p-2 bg-primary-green hover:bg-deep-green disabled:opacity-40 text-white rounded-xl shadow-xs transition-all flex-shrink-0 active:scale-95"
          title="Send message"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
