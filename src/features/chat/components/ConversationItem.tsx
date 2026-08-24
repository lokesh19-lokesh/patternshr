import React from 'react';
import { Hash, Megaphone, Pin } from 'lucide-react';
import type { Conversation } from '../../../services/chat.service';
import type { UserPresenceStatus } from '../../../services/presence.service';

interface ConversationItemProps {
  conversation: Conversation;
  isSelected: boolean;
  onSelect: () => void;
  presenceStatus?: UserPresenceStatus;
}

export const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  isSelected,
  onSelect,
  presenceStatus = 'offline',
}) => {
  const isDirect = conversation.type === 'direct';
  const isAnnouncement = conversation.type === 'announcement';
  
  const title = isDirect
    ? `${conversation.other_member?.first_name || 'Direct'} ${conversation.other_member?.last_name || ''}`.trim()
    : conversation.title || 'Channel';

  const subtitle = conversation.last_message_preview || (isDirect ? (conversation.other_member?.designation?.title || (conversation.other_member?.designation as any)?.name) : conversation.description) || 'No messages yet';

  const getPresenceColor = (status: UserPresenceStatus) => {
    switch (status) {
      case 'online':
        return 'bg-emerald-500 ring-white';
      case 'away':
        return 'bg-amber-400 ring-white';
      case 'busy':
        return 'bg-rose-500 ring-white';
      default:
        return 'bg-gray-300 ring-white';
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full text-left p-2.5 rounded-xl transition-all flex items-center space-x-3 group relative cursor-pointer ${
        isSelected
          ? 'bg-soft-green text-charcoal font-semibold shadow-xs'
          : 'hover:bg-light-grey/80 text-charcoal'
      }`}
    >
      {/* Left Icon / Avatar */}
      <div className="relative flex-shrink-0">
        {isAnnouncement ? (
          <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold shadow-xs">
            <Megaphone className="h-5 w-5" />
          </div>
        ) : isDirect ? (
          <div className="h-10 w-10 rounded-xl bg-primary-green/15 text-dark-green flex items-center justify-center font-black text-sm shadow-xs border border-primary-green/20">
            {getInitials(title || 'DM')}
          </div>
        ) : (
          <div className="h-10 w-10 rounded-xl bg-gray-100 text-charcoal flex items-center justify-center font-black text-sm shadow-xs border border-gray-200/80">
            <Hash className="h-5 w-5 text-gray-500" />
          </div>
        )}

        {/* Presence Indicator */}
        {isDirect && (
          <span
            className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full ring-2 ${getPresenceColor(
              presenceStatus
            )}`}
            title={`Status: ${presenceStatus}`}
          />
        )}
      </div>

      {/* Info Middle */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="text-xs sm:text-sm font-bold truncate text-charcoal flex items-center space-x-1">
            <span>{title}</span>
            {conversation.is_pinned && <Pin className="h-3 w-3 text-amber-500 flex-shrink-0" />}
          </p>
          {conversation.last_message_at && (
            <span className="text-[10px] text-text-grey font-medium flex-shrink-0 ml-1">
              {new Date(conversation.last_message_at).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          )}
        </div>
        <p className="text-xs text-text-grey truncate mt-0.5 leading-snug">{subtitle}</p>
      </div>

      {/* Unread Pill */}
      {Boolean(conversation.unread_count && conversation.unread_count > 0) && (
        <span className="bg-primary-green text-white text-[10px] font-black px-1.5 py-0.5 rounded-full shadow-xs flex-shrink-0">
          {conversation.unread_count}
        </span>
      )}
    </button>
  );
};
