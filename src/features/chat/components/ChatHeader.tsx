import React from 'react';
import { 
  Phone, 
  Video, 
  ScreenShare, 
  Search, 
  Info, 
  ChevronLeft, 
  Hash 
} from 'lucide-react';
import type { Conversation } from '../../../services/chat.service';
import type { UserPresenceStatus } from '../../../services/presence.service';

interface ChatHeaderProps {
  conversation: Conversation;
  presenceStatus?: UserPresenceStatus;
  onToggleInfo: () => void;
  onOpenSearch: () => void;
  onBackMobile: () => void;
  isInfoOpen: boolean;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  conversation,
  presenceStatus = 'offline',
  onToggleInfo,
  onOpenSearch,
  onBackMobile,
  isInfoOpen,
}) => {
  const isDirect = conversation.type === 'direct';

  const title = isDirect
    ? `${conversation.other_member?.first_name || 'Direct'} ${conversation.other_member?.last_name || ''}`.trim()
    : conversation.title || 'Channel';

  const subtitle = isDirect
    ? `${conversation.other_member?.designation?.title || ''} • ${conversation.other_member?.department?.name || 'Department'}`
    : `${conversation.members?.length || 0} members • ${conversation.description || 'Team channel'}`;

  const getPresenceText = (status: UserPresenceStatus) => {
    switch (status) {
      case 'online':
        return <span className="text-emerald-600 font-semibold flex items-center space-x-1"><span className="h-2 w-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span><span>Active now</span></span>;
      case 'away':
        return <span className="text-amber-600 font-medium">Away</span>;
      case 'busy':
        return <span className="text-rose-600 font-medium">Do not disturb</span>;
      default:
        return <span className="text-text-grey font-medium">Offline</span>;
    }
  };

  const handleCallAction = (type: string) => {
    alert(`${type} calling is ready in architecture. Connect your WebRTC/SIP provider in integrations.`);
  };

  return (
    <div className="h-16 px-4 border-b border-gray-200/80 bg-white flex items-center justify-between flex-shrink-0 select-none shadow-2xs z-10">
      {/* Left Avatar & Info */}
      <div className="flex items-center space-x-3 min-w-0">
        {/* Mobile Back Button */}
        <button
          type="button"
          onClick={onBackMobile}
          className="lg:hidden p-1.5 -ml-1 text-text-grey hover:text-charcoal hover:bg-light-grey rounded-xl transition-colors"
          title="Back to conversations"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <div className="relative flex-shrink-0">
          {isDirect ? (
            <div className="h-10 w-10 rounded-xl bg-primary-green/15 text-dark-green flex items-center justify-center font-black text-sm border border-primary-green/20">
              {title
                .split(' ')
                .map((n: string) => n[0])
                .join('')
                .substring(0, 2)
                .toUpperCase()}
            </div>
          ) : (
            <div className="h-10 w-10 rounded-xl bg-gray-100 text-charcoal flex items-center justify-center font-black text-sm border border-gray-200">
              <Hash className="h-5 w-5 text-gray-500" />
            </div>
          )}
        </div>

        <div className="min-w-0">
          <div className="flex items-center space-x-2">
            <h3 className="text-xs sm:text-sm font-bold text-charcoal truncate">{title}</h3>
            {isDirect && <span className="text-[11px] hidden sm:inline-block">{getPresenceText(presenceStatus)}</span>}
          </div>
          <p className="text-[11px] text-text-grey truncate">{subtitle}</p>
        </div>
      </div>

      {/* Right Action Icons */}
      <div className="flex items-center space-x-1 sm:space-x-2">
        {/* Voice Call */}
        <button
          type="button"
          onClick={() => handleCallAction('Voice')}
          className="p-2 text-text-grey hover:text-charcoal hover:bg-light-grey rounded-xl transition-all"
          title="Start voice call"
        >
          <Phone className="h-4 w-4" />
        </button>

        {/* Video Call */}
        <button
          type="button"
          onClick={() => handleCallAction('Video')}
          className="p-2 text-text-grey hover:text-charcoal hover:bg-light-grey rounded-xl transition-all"
          title="Start video call"
        >
          <Video className="h-4 w-4" />
        </button>

        {/* Screen Share */}
        <button
          type="button"
          onClick={() => handleCallAction('Screen Share')}
          className="hidden sm:inline-flex p-2 text-text-grey hover:text-charcoal hover:bg-light-grey rounded-xl transition-all"
          title="Share screen"
        >
          <ScreenShare className="h-4 w-4" />
        </button>

        {/* Search inside chat */}
        <button
          type="button"
          onClick={onOpenSearch}
          className="p-2 text-text-grey hover:text-charcoal hover:bg-light-grey rounded-xl transition-all"
          title="Search conversation"
        >
          <Search className="h-4 w-4" />
        </button>

        {/* Toggle HR Info & Files Sidebar */}
        <button
          type="button"
          onClick={onToggleInfo}
          className={`p-2 rounded-xl transition-all ${
            isInfoOpen
              ? 'bg-soft-green text-dark-green'
              : 'text-text-grey hover:text-charcoal hover:bg-light-grey'
          }`}
          title="Employee Profile & HR Actions"
        >
          <Info className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
