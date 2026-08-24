import React, { useEffect, useRef } from 'react';
import { Pin, MessageSquare } from 'lucide-react';
import { MessageBubble } from './MessageBubble';
import type { ChatMessage } from '../../../services/chat.service';

interface MessageListProps {
  messages: ChatMessage[];
  currentEmployeeId: string;
  typingUser: string | null;
  onReply: (message: ChatMessage) => void;
  onEdit: (message: ChatMessage) => void;
  onDelete: (messageId: string) => void;
  onToggleReaction: (messageId: string, emoji: string) => void;
  onPinMessage: (messageId: string, isPinned: boolean) => void;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  currentEmployeeId,
  typingUser,
  onReply,
  onEdit,
  onDelete,
  onToggleReaction,
  onPinMessage,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto scroll on initial load or new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, typingUser]);

  const pinnedMessages = messages.filter((m) => m.is_pinned);

  // Format date dividers
  const formatDateDivider = (dateString: string) => {
    const d = new Date(dateString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) {
      return 'Today';
    }
    if (d.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    return d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-light-grey/30 relative">
      {/* Pinned Messages Bar */}
      {pinnedMessages.length > 0 && (
        <div className="bg-amber-50/90 border-b border-amber-200/80 px-4 py-2 flex items-center justify-between text-xs text-amber-800 z-10">
          <div className="flex items-center space-x-2 truncate">
            <Pin className="h-3.5 w-3.5 text-amber-600 flex-shrink-0" />
            <span className="font-bold">{pinnedMessages.length} Pinned Message{pinnedMessages.length > 1 ? 's' : ''}:</span>
            <span className="truncate italic">"{pinnedMessages[pinnedMessages.length - 1].message_text}"</span>
          </div>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div ref={containerRef} className="flex-1 overflow-y-auto py-4 space-y-1">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 text-text-grey">
            <div className="h-12 w-12 rounded-2xl bg-soft-green text-dark-green flex items-center justify-center mb-3">
              <MessageSquare className="h-6 w-6" />
            </div>
            <h4 className="text-sm font-bold text-charcoal">No messages yet</h4>
            <p className="text-xs text-text-grey mt-1 max-w-xs">
              Start the conversation by typing your first message or sharing a project document below.
            </p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const prevMsg = messages[index - 1];
            const isDifferentDay =
              !prevMsg ||
              new Date(prevMsg.created_at).toDateString() !== new Date(msg.created_at).toDateString();

            return (
              <React.Fragment key={msg.id}>
                {isDifferentDay && (
                  <div className="flex items-center justify-center my-4">
                    <span className="bg-white border border-gray-200/80 text-text-grey text-[11px] font-bold px-3 py-1 rounded-full shadow-2xs">
                      {formatDateDivider(msg.created_at)}
                    </span>
                  </div>
                )}
                <MessageBubble
                  message={msg}
                  isCurrentUser={msg.sender_id === currentEmployeeId}
                  currentEmployeeId={currentEmployeeId}
                  onReply={onReply}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onToggleReaction={onToggleReaction}
                  onPinMessage={onPinMessage}
                />
              </React.Fragment>
            );
          })
        )}

        {/* Live Typing Indicator */}
        {typingUser && (
          <div className="px-4 py-2 flex items-center space-x-2 text-xs text-text-grey italic bg-soft-green/30 animate-pulse">
            <span className="h-2 w-2 rounded-full bg-primary-green"></span>
            <span>{typingUser} is typing...</span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
};
