import React, { useState } from 'react';
import { 
  Search, 
  Plus, 
  Megaphone, 
  MessageSquarePlus, 
  Check, 
  ChevronDown
} from 'lucide-react';
import { ConversationItem } from './ConversationItem';
import type { Conversation } from '../../../services/chat.service';
import type { Employee } from '../../../services/employee.service';
import type { UserPresenceStatus } from '../../../services/presence.service';

interface ChatSidebarProps {
  conversations: Conversation[];
  allEmployees: Employee[];
  selectedConvId: string | null;
  currentEmployee: Employee | null;
  presenceMap: Record<string, UserPresenceStatus>;
  myPresence: UserPresenceStatus;
  onSelectConversation: (conv: Conversation) => void;
  onSelectAnnouncement: () => void;
  isAnnouncementSelected: boolean;
  onStartDirectChat: (employeeId: string) => void;
  onCreateGroup: () => void;
  onOpenSearch: () => void;
  onChangePresence: (status: UserPresenceStatus) => void;
  isAdminOrHr: boolean;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  conversations,
  allEmployees,
  selectedConvId,
  currentEmployee,
  presenceMap,
  myPresence,
  onSelectConversation,
  onSelectAnnouncement,
  isAnnouncementSelected,
  onStartDirectChat,
  onCreateGroup,
  onOpenSearch,
  onChangePresence,
  isAdminOrHr,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showPresenceMenu, setShowPresenceMenu] = useState(false);
  const [showNewDirectModal, setShowNewDirectModal] = useState(false);
  const [employeeFilter, setEmployeeFilter] = useState('');

  // Filter conversations
  const filteredConvs = conversations.filter((c) => {
    const title = c.type === 'direct'
      ? `${c.other_member?.first_name || ''} ${c.other_member?.last_name || ''}`
      : c.title || '';
    return title.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const groupChannels = filteredConvs.filter((c) => c.type === 'group');
  const directChats = filteredConvs.filter((c) => c.type === 'direct');

  // Filter available employees for new DM
  const availableEmployees = allEmployees.filter(
    (e) =>
      e.id !== currentEmployee?.id &&
      `${e.first_name} ${e.last_name || ''} ${e.email || ''}`
        .toLowerCase()
        .includes(employeeFilter.toLowerCase())
  );

  const getPresenceLabel = (status: UserPresenceStatus) => {
    switch (status) {
      case 'online': return 'Online';
      case 'away': return 'Away';
      case 'busy': return 'Do Not Disturb';
      default: return 'Offline';
    }
  };

  const getPresenceDot = (status: UserPresenceStatus) => {
    switch (status) {
      case 'online': return 'bg-emerald-500';
      case 'away': return 'bg-amber-400';
      case 'busy': return 'bg-rose-500';
      default: return 'bg-gray-400';
    }
  };

  return (
    <div className="w-full lg:w-80 bg-white border-r border-gray-200/80 flex flex-col h-full overflow-hidden select-none">
      {/* Header & User Presence Card */}
      <div className="p-3.5 border-b border-gray-100 bg-light-grey/40">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-charcoal tracking-tight">Workplace Chat</h2>
          <button
            type="button"
            onClick={onOpenSearch}
            className="p-1.5 rounded-xl hover:bg-white text-text-grey hover:text-charcoal transition-all shadow-2xs border border-transparent hover:border-gray-200"
            title="Search messages & files (Ctrl+F)"
          >
            <Search className="h-4 w-4" />
          </button>
        </div>

        {/* Current User Status Pill */}
        {currentEmployee && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowPresenceMenu(!showPresenceMenu)}
              className="w-full flex items-center justify-between p-2 rounded-xl bg-white border border-gray-200/70 hover:border-primary-green/40 shadow-xs transition-all text-left"
            >
              <div className="flex items-center space-x-2 truncate">
                <span className={`h-2.5 w-2.5 rounded-full ${getPresenceDot(myPresence)} flex-shrink-0`} />
                <span className="text-xs font-bold text-charcoal truncate">
                  {currentEmployee.first_name} {currentEmployee.last_name || ''}
                </span>
                <span className="text-[11px] text-text-grey">({getPresenceLabel(myPresence)})</span>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-text-grey" />
            </button>

            {showPresenceMenu && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-30 divide-y divide-gray-50">
                {(['online', 'away', 'busy', 'offline'] as UserPresenceStatus[]).map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => {
                      onChangePresence(status);
                      setShowPresenceMenu(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium hover:bg-light-grey text-charcoal transition-colors"
                  >
                    <div className="flex items-center space-x-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${getPresenceDot(status)}`} />
                      <span>{getPresenceLabel(status)}</span>
                    </div>
                    {myPresence === status && <Check className="h-3.5 w-3.5 text-primary-green" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick Search */}
      <div className="p-3 border-b border-gray-100">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-text-grey" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter channels & direct chats..."
            className="w-full pl-8.5 pr-3 py-1.5 text-xs rounded-xl border border-gray-200/80 bg-light-grey/60 text-charcoal focus:bg-white focus:outline-none focus:border-primary-green transition-all"
          />
        </div>
      </div>

      {/* Conversations Sections */}
      <div className="flex-1 overflow-y-auto p-2 space-y-4">
        {/* 1. HR Announcements Section */}
        <div>
          <button
            type="button"
            onClick={onSelectAnnouncement}
            className={`w-full flex items-center space-x-3 p-2.5 rounded-xl transition-all text-left cursor-pointer ${
              isAnnouncementSelected
                ? 'bg-amber-500 text-white font-bold shadow-xs'
                : 'hover:bg-amber-50/70 text-charcoal'
            }`}
          >
            <div className={`h-9 w-9 rounded-xl flex items-center justify-center font-bold flex-shrink-0 ${
              isAnnouncementSelected ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'
            }`}>
              <Megaphone className="h-4.5 w-4.5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-bold truncate">📢 HR Announcements</p>
              <p className={`text-[11px] truncate mt-0.5 ${isAnnouncementSelected ? 'text-amber-100' : 'text-text-grey'}`}>
                Company-wide updates
              </p>
            </div>
          </button>
        </div>

        {/* 2. Group Channels */}
        <div>
          <div className="flex items-center justify-between px-2.5 py-1 mb-1">
            <span className="text-[11px] font-bold text-text-grey uppercase tracking-wider">
              Channels ({groupChannels.length})
            </span>
            {isAdminOrHr && (
              <button
                type="button"
                onClick={onCreateGroup}
                className="p-1 text-text-grey hover:text-dark-green hover:bg-soft-green rounded-lg transition-colors"
                title="Create new channel"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <div className="space-y-0.5">
            {groupChannels.length === 0 ? (
              <div className="px-3 py-2 text-xs text-text-grey italic">No channels yet</div>
            ) : (
              groupChannels.map((conv) => (
                <ConversationItem
                  key={conv.id}
                  conversation={conv}
                  isSelected={!isAnnouncementSelected && selectedConvId === conv.id}
                  onSelect={() => onSelectConversation(conv)}
                />
              ))
            )}
          </div>
        </div>

        {/* 3. Direct Messages */}
        <div>
          <div className="flex items-center justify-between px-2.5 py-1 mb-1">
            <span className="text-[11px] font-bold text-text-grey uppercase tracking-wider">
              Direct Messages ({directChats.length})
            </span>
            <button
              type="button"
              onClick={() => setShowNewDirectModal(true)}
              className="p-1 text-text-grey hover:text-dark-green hover:bg-soft-green rounded-lg transition-colors"
              title="Start a new message"
            >
              <MessageSquarePlus className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="space-y-0.5">
            {directChats.length === 0 ? (
              <div className="px-3 py-2 text-xs text-text-grey italic">No direct chats yet</div>
            ) : (
              directChats.map((conv) => (
                <ConversationItem
                  key={conv.id}
                  conversation={conv}
                  isSelected={!isAnnouncementSelected && selectedConvId === conv.id}
                  onSelect={() => onSelectConversation(conv)}
                  presenceStatus={
                    conv.other_member?.id ? presenceMap[conv.other_member.id] || 'offline' : 'offline'
                  }
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* New Direct Message Modal */}
      {showNewDirectModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-5 border border-gray-100 flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center pb-3 border-b border-gray-100">
              <h3 className="text-sm sm:text-base font-bold text-charcoal">Start Private Chat</h3>
              <button
                type="button"
                onClick={() => setShowNewDirectModal(false)}
                className="text-text-grey hover:text-charcoal p-1 rounded-lg"
              >
                &times;
              </button>
            </div>

            <div className="py-3">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-text-grey" />
                <input
                  type="text"
                  value={employeeFilter}
                  onChange={(e) => setEmployeeFilter(e.target.value)}
                  placeholder="Search employee by name, email..."
                  className="w-full pl-8.5 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-gray-200 text-charcoal focus:outline-none focus:border-primary-green"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-gray-100 max-h-64 pr-1">
              {availableEmployees.length === 0 ? (
                <div className="p-6 text-center text-xs text-text-grey">No matching employees found</div>
              ) : (
                availableEmployees.map((emp) => (
                  <button
                    key={emp.id}
                    type="button"
                    onClick={() => {
                      onStartDirectChat(emp.id);
                      setShowNewDirectModal(false);
                    }}
                    className="w-full flex items-center justify-between p-2.5 hover:bg-soft-green/40 rounded-xl transition-all text-left"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="h-9 w-9 rounded-xl bg-primary-green/15 text-dark-green flex items-center justify-center font-bold text-xs">
                        {emp.first_name[0]}
                        {emp.last_name?.[0] || ''}
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-bold text-charcoal">
                          {emp.first_name} {emp.last_name || ''}
                        </p>
                        <p className="text-[11px] text-text-grey">
                          {emp.designation?.name || (emp.designation as any)?.title || emp.department?.name || emp.email}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-primary-green bg-soft-green px-2 py-1 rounded-lg">
                      Chat
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
