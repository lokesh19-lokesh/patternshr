import React, { useState } from 'react';
import { 
  Smile, 
  Reply, 
  MoreHorizontal, 
  Edit3, 
  Trash2, 
  Copy, 
  Pin, 
  Check, 
  FileText, 
  ExternalLink 
} from 'lucide-react';
import type { ChatMessage, ChatReaction, ChatAttachment } from '../../../services/chat.service';
import { workService } from '../../../services/work.service';

interface MessageBubbleProps {
  message: ChatMessage;
  isCurrentUser: boolean;
  currentEmployeeId: string;
  onReply: (message: ChatMessage) => void;
  onEdit: (message: ChatMessage) => void;
  onDelete: (messageId: string) => void;
  onToggleReaction: (messageId: string, emoji: string) => void;
  onPinMessage: (messageId: string, isPinned: boolean) => void;
}

const QUICK_EMOJIS = ['👍', '❤️', '😂', '👏', '🎉', '✅', '❗'];

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isCurrentUser,
  currentEmployeeId,
  onReply,
  onEdit,
  onDelete,
  onToggleReaction,
  onPinMessage,
}) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  const senderName = isCurrentUser
    ? 'You'
    : `${message.sender?.first_name || 'Team member'} ${message.sender?.last_name || ''}`.trim();

  const handleCopy = () => {
    navigator.clipboard.writeText(message.message_text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    setShowMenu(false);
  };

  // Group reactions by emoji
  const reactionsMap: Record<string, { count: number; userReacted: boolean }> = {};
  (message.reactions || []).forEach((r: ChatReaction) => {
    if (!reactionsMap[r.emoji]) {
      reactionsMap[r.emoji] = { count: 0, userReacted: false };
    }
    reactionsMap[r.emoji].count += 1;
    if (r.employee_id === currentEmployeeId) {
      reactionsMap[r.emoji].userReacted = true;
    }
  });

  return (
    <div
      className={`group relative flex items-start space-x-3 px-4 py-2 hover:bg-light-grey/60 transition-colors ${
        message.is_pinned ? 'bg-amber-50/40 border-l-3 border-amber-500' : ''
      }`}
    >
      {/* Sender Avatar */}
      <div className="h-8 w-8 rounded-xl bg-primary-green/15 text-dark-green flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5 border border-primary-green/20">
        {senderName
          .split(' ')
          .map((n) => n[0])
          .join('')
          .substring(0, 2)
          .toUpperCase()}
      </div>

      {/* Message Content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-charcoal">{senderName}</span>
          {message.sender?.designation?.title && (
            <span className="text-[10px] text-text-grey bg-gray-100 px-1.5 py-0.5 rounded-md hidden sm:inline-block">
              {message.sender.designation.title}
            </span>
          )}
          <span className="text-[10px] text-text-grey font-medium">
            {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          {message.is_edited && <span className="text-[10px] text-text-grey italic">(edited)</span>}
          {message.is_pinned && (
            <span className="inline-flex items-center space-x-0.5 text-[10px] font-bold text-amber-600 bg-amber-100/60 px-1.5 py-0.5 rounded-md">
              <Pin className="h-2.5 w-2.5" />
              <span>Pinned</span>
            </span>
          )}
        </div>

        {/* Parent Reply Quote */}
        {message.parent_message && (
          <div className="mt-1 mb-1.5 pl-2.5 border-l-2 border-primary-green/60 bg-soft-green/30 py-1 pr-2 rounded-r-lg text-xs text-text-grey flex items-center space-x-1.5">
            <span className="font-bold text-charcoal">
              {message.parent_message.sender?.first_name || 'Member'}:
            </span>
            <span className="truncate italic">{message.parent_message.message_text}</span>
          </div>
        )}

        {/* Message Text */}
        <div className="text-xs sm:text-sm text-charcoal leading-relaxed whitespace-pre-wrap mt-0.5 break-words">
          {message.message_text}
        </div>

        {/* Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-2 space-y-1.5 max-w-sm">
            {message.attachments.map((file: ChatAttachment, idx: number) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 rounded-xl border border-gray-200 bg-white shadow-2xs hover:border-primary-green/50 transition-all"
              >
                <div className="flex items-center space-x-2 truncate">
                  <FileText className="h-4 w-4 text-primary-green flex-shrink-0" />
                  <div className="truncate">
                    <p className="text-xs font-bold text-charcoal truncate">{file.name}</p>
                    <p className="text-[10px] text-text-grey">
                      {(file.size / 1024).toFixed(0)} KB
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => workService.openDocument(file.url, file.name)}
                  className="p-1.5 text-dark-green hover:bg-soft-green rounded-lg transition-colors ml-2 flex-shrink-0"
                  title="Download / View file"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Reactions Counter Bar */}
        {Object.keys(reactionsMap).length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {Object.entries(reactionsMap).map(([emoji, data]) => (
              <button
                key={emoji}
                type="button"
                onClick={() => onToggleReaction(message.id, emoji)}
                className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                  data.userReacted
                    ? 'bg-soft-green border-primary-green text-dark-green shadow-xs'
                    : 'bg-white border-gray-200 text-charcoal hover:bg-light-grey'
                }`}
              >
                <span>{emoji}</span>
                <span className="text-[11px]">{data.count}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Floating Action Menu on Hover */}
      <div className="absolute right-4 top-2 hidden group-hover:flex items-center space-x-0.5 bg-white border border-gray-200/90 rounded-xl shadow-md px-1 py-0.5 z-20">
        {/* Quick Emoji Reaction */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-1.5 text-text-grey hover:text-charcoal hover:bg-light-grey rounded-lg transition-colors"
            title="Add reaction"
          >
            <Smile className="h-3.5 w-3.5" />
          </button>

          {showEmojiPicker && (
            <div className="absolute right-0 bottom-full mb-1 flex items-center space-x-1 bg-white p-1.5 rounded-xl shadow-lg border border-gray-200 z-30">
              {QUICK_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    onToggleReaction(message.id, emoji);
                    setShowEmojiPicker(false);
                  }}
                  className="p-1.5 hover:bg-light-grey rounded-lg text-base transition-transform hover:scale-125"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Reply */}
        <button
          type="button"
          onClick={() => onReply(message)}
          className="p-1.5 text-text-grey hover:text-charcoal hover:bg-light-grey rounded-lg transition-colors"
          title="Reply to message"
        >
          <Reply className="h-3.5 w-3.5" />
        </button>

        {/* More Actions Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowMenu(!showMenu)}
            className="p-1.5 text-text-grey hover:text-charcoal hover:bg-light-grey rounded-lg transition-colors"
            title="More actions"
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-30 divide-y divide-gray-50 text-xs">
              <button
                type="button"
                onClick={handleCopy}
                className="w-full flex items-center space-x-2 px-3 py-2 text-charcoal hover:bg-light-grey transition-colors text-left"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-primary-green" /> : <Copy className="h-3.5 w-3.5 text-text-grey" />}
                <span>{copied ? 'Copied!' : 'Copy Text'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onPinMessage(message.id, !message.is_pinned);
                  setShowMenu(false);
                }}
                className="w-full flex items-center space-x-2 px-3 py-2 text-charcoal hover:bg-light-grey transition-colors text-left"
              >
                <Pin className="h-3.5 w-3.5 text-text-grey" />
                <span>{message.is_pinned ? 'Unpin' : 'Pin Message'}</span>
              </button>

              {isCurrentUser && (
                <button
                  type="button"
                  onClick={() => {
                    onEdit(message);
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center space-x-2 px-3 py-2 text-charcoal hover:bg-light-grey transition-colors text-left"
                >
                  <Edit3 className="h-3.5 w-3.5 text-text-grey" />
                  <span>Edit Message</span>
                </button>
              )}

              {isCurrentUser && (
                <button
                  type="button"
                  onClick={() => {
                    onDelete(message.id);
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center space-x-2 px-3 py-2 text-red-600 hover:bg-red-50 transition-colors text-left"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
