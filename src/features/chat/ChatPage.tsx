import React, { useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth/AuthProvider';
import { useTenant } from '../../lib/auth/TenantProvider';
import { employeeService } from '../../services/employee.service';
import type { Employee } from '../../services/employee.service';
import { chatService } from '../../services/chat.service';
import type { Conversation, ChatMessage, ChatAttachment } from '../../services/chat.service';
import { presenceService } from '../../services/presence.service';
import type { UserPresenceStatus } from '../../services/presence.service';

import { ChatSidebar } from './components/ChatSidebar';
import { ChatHeader } from './components/ChatHeader';
import { MessageList } from './components/MessageList';
import { MessageComposer } from './components/MessageComposer';
import { HRInfoSidebar } from './components/HRInfoSidebar';
import { CreateGroupModal } from './components/CreateGroupModal';
import { MessageSearchModal } from './components/MessageSearchModal';
import { HRQuickActionModal } from './components/HRQuickActionModal';
import { AnnouncementView } from './components/AnnouncementView';
import { MessageSquare, AlertCircle } from 'lucide-react';

export const ChatPage: React.FC = () => {
  const { user } = useAuth();
  const { company, role } = useTenant();
  const normalizedRole = role?.name?.toLowerCase() || '';
  const isAdminOrHr =
    normalizedRole.includes('admin') ||
    normalizedRole.includes('hr') ||
    normalizedRole.includes('owner') ||
    normalizedRole.includes('manager');

  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [isAnnouncementView, setIsAnnouncementView] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);

  // Presence & Typing State
  const [presenceMap, setPresenceMap] = useState<Record<string, UserPresenceStatus>>({});
  const [myPresence, setMyPresence] = useState<UserPresenceStatus>('online');
  const [typingUser, setTypingUser] = useState<string | null>(null);

  // Layout & Drawers State
  const [showInfoSidebar, setShowInfoSidebar] = useState(false);
  const [mobileView, setMobileView] = useState<'sidebar' | 'chat'>('sidebar');
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);

  // Composer State
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);

  // HR Quick Action Modal State
  const [quickActionType, setQuickActionType] = useState<'profile' | 'attendance' | 'leave' | 'payroll' | null>(null);

  // Helper to enrich conversations with employee directory
  const enrichConversations = (list: Conversation[], employeeList: Employee[], currentEmpId: string): Conversation[] => {
    const empMap = new Map(employeeList.map((e) => [e.id, e]));
    const mapped = list.map((c) => {
      if (c.type === 'direct') {
        const otherMem = (c.members || []).find((m) => m.employee_id !== currentEmpId);
        const otherEmp = (otherMem?.employee_id ? empMap.get(otherMem.employee_id) : null) || c.other_member || (c.members?.[0]?.employee_id ? empMap.get(c.members[0].employee_id) : null);
        const resolvedName = otherEmp ? `${otherEmp.first_name} ${otherEmp.last_name || ''}`.trim() : c.title;
        return {
          ...c,
          title: (resolvedName && resolvedName !== 'Direct' && resolvedName !== 'Direct Message' && resolvedName !== 'Team Member' ? resolvedName : null) || (otherEmp ? `${otherEmp.first_name} ${otherEmp.last_name || ''}`.trim() : c.title) || 'Team Member',
          other_member: otherEmp || c.other_member,
        };
      }
      return c;
    });

    // Deduplicate direct conversations by other employee ID so each person appears once
    const seenDirect = new Set<string>();
    const deduplicated: Conversation[] = [];

    for (const c of mapped) {
      if (c.type === 'direct') {
        const key = c.other_member?.id || c.title || c.id;
        if (!seenDirect.has(key)) {
          seenDirect.add(key);
          deduplicated.push(c);
        }
      } else {
        deduplicated.push(c);
      }
    }

    return deduplicated;
  };

  // Load Initial Data
  const loadInitialData = async () => {
    if (!company || !user) return;
    try {
      setLoading(true);
      const [emp, employees] = await Promise.all([
        employeeService.getCurrentEmployee(company.id, user.id),
        employeeService.getEmployees(company.id),
      ]);

      setCurrentEmployee(emp);
      const empList = employees || [];
      setAllEmployees(empList);

      if (emp) {
        // Set presence in DB
        await presenceService.setPresence(company.id, emp.id, 'online');

        // Fetch conversations
        let convList = await chatService.getConversations(company.id, emp.id);

        // If no conversations exist in company yet, auto-create a General channel with all employees
        if (convList.length === 0 && empList.length > 0) {
          try {
            const allEmpIds = empList.map((e) => e.id);
            const defaultGeneral = await chatService.createGroupConversation(
              company.id,
              emp.id,
              'General',
              'Company-wide general discussions and team communication',
              allEmpIds
            );
            convList = [defaultGeneral];
          } catch (e) {
            console.warn('Auto create general channel', e);
          }
        }

        // Enrich conversations with full employee profiles
        convList = enrichConversations(convList, empList, emp.id);
        setConversations(convList);

        if (convList.length > 0 && !selectedConversation && !isAnnouncementView) {
          setSelectedConversation(convList[0]);
        }
      }
    } catch (err) {
      console.error('Error loading chat initial data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, [company, user]);

  // Load Messages when Active Conversation Changes
  const loadMessages = async (convId: string) => {
    try {
      const msgs = await chatService.getMessages(convId);
      setMessages(msgs);
      if (currentEmployee) {
        chatService.markConversationAsRead(convId, currentEmployee.id);
      }
    } catch (e) {
      console.error('Error loading messages', e);
    }
  };

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
      setReplyingTo(null);
      setEditingMessage(null);
    }
  }, [selectedConversation?.id]);

  // Realtime Subscriptions for Active Conversation
  useEffect(() => {
    if (!selectedConversation) return;

    const unsubscribeConv = chatService.subscribeToConversation(selectedConversation.id, () => {
      loadMessages(selectedConversation.id);
    });

    const unsubscribeTyping = presenceService.subscribeToTyping(
      selectedConversation.id,
      ({ employeeId, employeeName, isTyping }) => {
        if (employeeId !== currentEmployee?.id) {
          setTypingUser(isTyping ? employeeName : null);
        }
      }
    );

    return () => {
      unsubscribeConv();
      unsubscribeTyping();
    };
  }, [selectedConversation?.id, currentEmployee?.id]);

  // Global Chat & Presence Subscriptions
  useEffect(() => {
    if (!company || !currentEmployee) return;

    const unsubAll = chatService.subscribeToAllChats(company.id, async () => {
      let convList = await chatService.getConversations(company.id, currentEmployee.id);
      convList = enrichConversations(convList, allEmployees, currentEmployee.id);
      setConversations(convList);
    });

    const unsubPresence = presenceService.subscribeToPresence(
      company.id,
      currentEmployee.id,
      (newPresence) => {
        setPresenceMap((prev) => ({ ...prev, ...newPresence }));
      }
    );

    return () => {
      unsubAll();
      unsubPresence();
    };
  }, [company, currentEmployee, allEmployees]);

  // Handlers
  const handleSelectConversation = (conv: Conversation) => {
    setIsAnnouncementView(false);
    setSelectedConversation(conv);
    setMobileView('chat');
  };

  const handleSelectAnnouncement = () => {
    setIsAnnouncementView(true);
    setSelectedConversation(null);
    setMobileView('chat');
  };

  const handleStartDirectChat = async (targetEmpId: string) => {
    if (!company || !currentEmployee) return;
    try {
      const conv = await chatService.getOrCreateDirectConversation(company.id, currentEmployee.id, targetEmpId);
      let convList = await chatService.getConversations(company.id, currentEmployee.id);
      convList = enrichConversations(convList, allEmployees, currentEmployee.id);
      setConversations(convList);
      const targetSelected = convList.find((c) => c.id === conv.id) || conv;
      handleSelectConversation(targetSelected);
    } catch (e) {
      alert('Failed to start chat');
    }
  };

  const handleCreateGroup = async (title: string, description: string, memberIds: string[]) => {
    if (!company || !currentEmployee) return;
    const newConv = await chatService.createGroupConversation(company.id, currentEmployee.id, title, description, memberIds);
    const convList = await chatService.getConversations(company.id, currentEmployee.id);
    setConversations(convList);
    handleSelectConversation(newConv);
  };

  const handleSendMessage = async (text: string, attachments: ChatAttachment[], mentions: string[]) => {
    if (!company || !currentEmployee || !selectedConversation) return;

    try {
      if (editingMessage) {
        await chatService.editMessage(editingMessage.id, selectedConversation.id, text);
        setEditingMessage(null);
      } else {
        await chatService.sendMessage({
          company_id: company.id,
          conversation_id: selectedConversation.id,
          sender_id: currentEmployee.id,
          message_text: text,
          parent_message_id: replyingTo?.id || null,
          attachments,
          mentions,
        });
        setReplyingTo(null);
      }
      loadMessages(selectedConversation.id);
    } catch (err) {
      alert('Failed to send message');
    }
  };

  const handleUploadFile = async (file: File) => {
    if (!company) throw new Error('No company');
    return chatService.uploadChatAttachment(company.id, file);
  };

  const handleTyping = (isTyping: boolean) => {
    if (!selectedConversation || !currentEmployee) return;
    presenceService.broadcastTyping(
      selectedConversation.id,
      currentEmployee.id,
      currentEmployee.first_name,
      isTyping
    );
  };

  const handleChangePresence = async (status: UserPresenceStatus) => {
    setMyPresence(status);
    if (company && currentEmployee) {
      await presenceService.setPresence(company.id, currentEmployee.id, status);
    }
  };

  const handleToggleReaction = async (messageId: string, emoji: string) => {
    if (!selectedConversation || !currentEmployee) return;
    await chatService.toggleReaction(messageId, selectedConversation.id, currentEmployee.id, emoji);
    loadMessages(selectedConversation.id);
  };

  const handlePinMessage = async (messageId: string, isPinned: boolean) => {
    if (!selectedConversation) return;
    await chatService.pinMessage(messageId, selectedConversation.id, isPinned);
    loadMessages(selectedConversation.id);
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!selectedConversation) return;
    if (confirm('Are you sure you want to delete this message?')) {
      await chatService.deleteMessage(messageId, selectedConversation.id);
      loadMessages(selectedConversation.id);
    }
  };

  const handleSelectSearchMessage = (convId: string) => {
    const targetConv = conversations.find((c) => c.id === convId);
    if (targetConv) {
      handleSelectConversation(targetConv);
    }
  };

  // Collect all shared files from messages in active conversation
  const sharedFiles: ChatAttachment[] = messages
    .flatMap((m) => m.attachments || [])
    .filter(Boolean);

  if (loading) {
    return <div className="p-12 text-center text-xs sm:text-sm text-text-grey">Loading Workplace Chat...</div>;
  }

  if (!currentEmployee) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex flex-col items-center max-w-lg mx-auto mt-10">
        <AlertCircle className="h-10 w-10 text-amber-500 mb-2" />
        <h3 className="text-base font-bold text-charcoal">Employee Profile Required</h3>
        <p className="text-xs sm:text-sm text-text-grey mt-1 text-center">
          You must have a linked employee profile to access Workplace Chat and team channels.
        </p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-5rem)] bg-white rounded-2xl shadow-sm border border-gray-200/80 overflow-hidden flex flex-row relative">
      {/* LEFT COLUMN: Sidebar (Channels, DMs, Announcements) */}
      <div
        className={`${
          mobileView === 'sidebar' ? 'flex' : 'hidden lg:flex'
        } w-full lg:w-80 flex-shrink-0 h-full`}
      >
        <ChatSidebar
          conversations={conversations}
          allEmployees={allEmployees}
          selectedConvId={selectedConversation?.id || null}
          currentEmployee={currentEmployee}
          presenceMap={presenceMap}
          myPresence={myPresence}
          onSelectConversation={handleSelectConversation}
          onSelectAnnouncement={handleSelectAnnouncement}
          isAnnouncementSelected={isAnnouncementView}
          onStartDirectChat={handleStartDirectChat}
          onCreateGroup={() => setShowCreateGroup(true)}
          onOpenSearch={() => setShowSearchModal(true)}
          onChangePresence={handleChangePresence}
          isAdminOrHr={isAdminOrHr}
        />
      </div>

      {/* MIDDLE COLUMN: Message Stream or Announcement View */}
      <div
        className={`${
          mobileView === 'chat' ? 'flex' : 'hidden lg:flex'
        } flex-1 flex-col h-full overflow-hidden bg-white min-w-0`}
      >
        {isAnnouncementView ? (
          <AnnouncementView
            companyId={company!.id}
            currentEmployeeId={currentEmployee.id}
            isAdminOrHr={isAdminOrHr}
            onBackMobile={() => setMobileView('sidebar')}
          />
        ) : selectedConversation ? (
          <>
            <ChatHeader
              conversation={selectedConversation}
              presenceStatus={
                selectedConversation.other_member?.id
                  ? presenceMap[selectedConversation.other_member.id] || 'offline'
                  : 'offline'
              }
              onToggleInfo={() => setShowInfoSidebar(!showInfoSidebar)}
              onOpenSearch={() => setShowSearchModal(true)}
              onBackMobile={() => setMobileView('sidebar')}
              isInfoOpen={showInfoSidebar}
            />

            <MessageList
              messages={messages}
              currentEmployeeId={currentEmployee.id}
              typingUser={typingUser}
              onReply={(msg) => setReplyingTo(msg)}
              onEdit={(msg) => setEditingMessage(msg)}
              onDelete={handleDeleteMessage}
              onToggleReaction={handleToggleReaction}
              onPinMessage={handlePinMessage}
            />

            <MessageComposer
              onSendMessage={handleSendMessage}
              onTyping={handleTyping}
              onUploadFile={handleUploadFile}
              replyingTo={replyingTo}
              editingMessage={editingMessage}
              onCancelReply={() => setReplyingTo(null)}
              onCancelEdit={() => setEditingMessage(null)}
              allEmployees={allEmployees}
            />
          </>
        ) : (
          /* Empty State */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-light-grey/30">
            <div className="h-16 w-16 rounded-3xl bg-soft-green text-dark-green flex items-center justify-center font-bold mb-4 shadow-sm">
              <MessageSquare className="h-8 w-8" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-charcoal">The Patterns HR Workplace Chat</h3>
            <p className="text-xs sm:text-sm text-text-grey mt-1 max-w-sm leading-relaxed">
              Select a team channel, employee direct message, or company announcement from the left menu to begin.
            </p>
          </div>
        )}
      </div>

      {/* RIGHT COLUMN: HR Info & Shared Media Sidebar */}
      {selectedConversation && showInfoSidebar && (
        <div className="hidden lg:flex w-80 flex-shrink-0 h-full">
          <HRInfoSidebar
            conversation={selectedConversation}
            sharedFiles={sharedFiles}
            onClose={() => setShowInfoSidebar(false)}
            onOpenQuickAction={(type) => setQuickActionType(type)}
            isAdminOrHr={isAdminOrHr}
          />
        </div>
      )}

      {/* Modals */}
      {showCreateGroup && (
        <CreateGroupModal
          allEmployees={allEmployees}
          currentEmployeeId={currentEmployee.id}
          onClose={() => setShowCreateGroup(false)}
          onCreateGroup={handleCreateGroup}
        />
      )}

      {showSearchModal && (
        <MessageSearchModal
          companyId={company!.id}
          currentEmployeeId={currentEmployee.id}
          onClose={() => setShowSearchModal(false)}
          onSelectMessageResult={handleSelectSearchMessage}
        />
      )}

      {quickActionType && selectedConversation?.other_member && (
        <HRQuickActionModal
          actionType={quickActionType}
          employee={selectedConversation.other_member as Employee}
          companyId={company!.id}
          onClose={() => setQuickActionType(null)}
        />
      )}
    </div>
  );
};
