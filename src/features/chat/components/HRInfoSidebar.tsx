import React, { useState } from 'react';
import { 
  Mail, 
  Phone, 
  Calendar, 
  FileText, 
  Shield, 
  ExternalLink, 
  Clock, 
  DollarSign, 
  X 
} from 'lucide-react';
import type { Conversation, ChatAttachment, ConversationMember } from '../../../services/chat.service';
import { workService } from '../../../services/work.service';

interface HRInfoSidebarProps {
  conversation: Conversation;
  sharedFiles: ChatAttachment[];
  onClose: () => void;
  onOpenQuickAction: (actionType: 'profile' | 'attendance' | 'leave' | 'payroll') => void;
  isAdminOrHr: boolean;
}

export const HRInfoSidebar: React.FC<HRInfoSidebarProps> = ({
  conversation,
  sharedFiles,
  onClose,
  onOpenQuickAction,
  isAdminOrHr,
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'files' | 'members'>('info');
  const isDirect = conversation.type === 'direct';
  const otherEmployee = conversation.other_member;

  return (
    <div className="w-full lg:w-80 bg-white border-l border-gray-200/80 flex flex-col h-full overflow-hidden select-none">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-light-grey/40">
        <h3 className="text-sm font-bold text-charcoal">
          {isDirect ? 'Employee Information' : 'Channel Details'}
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg text-text-grey hover:text-charcoal hover:bg-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100 px-4 bg-white text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveTab('info')}
          className={`py-2.5 mr-4 border-b-2 transition-colors ${
            activeTab === 'info'
              ? 'border-primary-green text-dark-green'
              : 'border-transparent text-text-grey hover:text-charcoal'
          }`}
        >
          Overview
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('files')}
          className={`py-2.5 mr-4 border-b-2 transition-colors ${
            activeTab === 'files'
              ? 'border-primary-green text-dark-green'
              : 'border-transparent text-text-grey hover:text-charcoal'
          }`}
        >
          Files ({sharedFiles.length})
        </button>
        {!isDirect && (
          <button
            type="button"
            onClick={() => setActiveTab('members')}
            className={`py-2.5 border-b-2 transition-colors ${
              activeTab === 'members'
                ? 'border-primary-green text-dark-green'
                : 'border-transparent text-text-grey hover:text-charcoal'
            }`}
          >
            Members ({conversation.members?.length || 0})
          </button>
        )}
      </div>

      {/* Tab Contents */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {activeTab === 'info' && (
          <>
            {/* Direct Member Profile Card */}
            {isDirect && otherEmployee ? (
              <div className="space-y-4">
                <div className="flex flex-col items-center text-center p-4 bg-light-grey/60 rounded-2xl border border-gray-100">
                  <div className="h-16 w-16 rounded-2xl bg-primary-green/15 text-dark-green flex items-center justify-center font-black text-xl mb-2 border border-primary-green/20">
                    {otherEmployee.first_name[0]}
                    {otherEmployee.last_name?.[0] || ''}
                  </div>
                  <h4 className="text-sm font-bold text-charcoal">
                    {otherEmployee.first_name} {otherEmployee.last_name || ''}
                  </h4>
                  <p className="text-xs text-text-grey font-medium mt-0.5">
                    {otherEmployee.designation?.title || (otherEmployee.designation as any)?.name || 'Team Member'}
                  </p>
                  <span className="mt-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-soft-green text-dark-green">
                    {otherEmployee.department?.name || 'General Staff'}
                  </span>
                </div>

                {/* Contact & Company Details */}
                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center space-x-2.5 text-charcoal p-2 rounded-xl bg-white border border-gray-100">
                    <Mail className="h-4 w-4 text-primary-green flex-shrink-0" />
                    <span className="truncate">{otherEmployee.email || 'No email registered'}</span>
                  </div>

                  {otherEmployee.phone && (
                    <div className="flex items-center space-x-2.5 text-charcoal p-2 rounded-xl bg-white border border-gray-100">
                      <Phone className="h-4 w-4 text-primary-green flex-shrink-0" />
                      <span>{otherEmployee.phone}</span>
                    </div>
                  )}

                  {otherEmployee.hire_date && (
                    <div className="flex items-center space-x-2.5 text-charcoal p-2 rounded-xl bg-white border border-gray-100">
                      <Calendar className="h-4 w-4 text-primary-green flex-shrink-0" />
                      <span>Joined {new Date(otherEmployee.hire_date).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                {/* HR Quick Actions for Managers / HRs / Admins */}
                {isAdminOrHr && (
                  <div className="pt-2 border-t border-gray-100 space-y-2">
                    <h5 className="text-[11px] font-bold text-text-grey uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                      <Shield className="h-3.5 w-3.5 text-primary-green" />
                      <span>HR Quick Actions</span>
                    </h5>

                    <button
                      type="button"
                      onClick={() => onOpenQuickAction('attendance')}
                      className="w-full flex items-center justify-between p-2.5 bg-light-grey/80 hover:bg-soft-green text-charcoal rounded-xl text-xs font-bold transition-colors border border-gray-100"
                    >
                      <span className="flex items-center space-x-2">
                        <Clock className="h-3.5 w-3.5 text-primary-green" />
                        <span>View Attendance</span>
                      </span>
                      <ExternalLink className="h-3 w-3 text-text-grey" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onOpenQuickAction('leave')}
                      className="w-full flex items-center justify-between p-2.5 bg-light-grey/80 hover:bg-soft-green text-charcoal rounded-xl text-xs font-bold transition-colors border border-gray-100"
                    >
                      <span className="flex items-center space-x-2">
                        <Calendar className="h-3.5 w-3.5 text-primary-green" />
                        <span>View Leave Balance</span>
                      </span>
                      <ExternalLink className="h-3 w-3 text-text-grey" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onOpenQuickAction('payroll')}
                      className="w-full flex items-center justify-between p-2.5 bg-light-grey/80 hover:bg-soft-green text-charcoal rounded-xl text-xs font-bold transition-colors border border-gray-100"
                    >
                      <span className="flex items-center space-x-2">
                        <DollarSign className="h-3.5 w-3.5 text-primary-green" />
                        <span>Salary & Payslips</span>
                      </span>
                      <ExternalLink className="h-3 w-3 text-text-grey" />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Channel Info */
              <div className="space-y-4">
                <div className="p-4 bg-light-grey/60 rounded-2xl border border-gray-100 text-center">
                  <h4 className="text-base font-bold text-charcoal">{conversation.title || 'Channel'}</h4>
                  <p className="text-xs text-text-grey mt-1">{conversation.description || 'Team workplace channel'}</p>
                </div>
              </div>
            )}
          </>
        )}

        {/* Shared Files Tab */}
        {activeTab === 'files' && (
          <div className="space-y-2">
            {sharedFiles.length === 0 ? (
              <div className="p-8 text-center text-xs text-text-grey italic">
                No files shared in this chat yet.
              </div>
            ) : (
              sharedFiles.map((file, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-gray-100 bg-white hover:bg-light-grey/60 transition-colors shadow-2xs"
                >
                  <div className="flex items-center space-x-2 truncate">
                    <FileText className="h-4 w-4 text-primary-green flex-shrink-0" />
                    <div className="truncate">
                      <p className="text-xs font-bold text-charcoal truncate">{file.name}</p>
                      <p className="text-[10px] text-text-grey">{(file.size / 1024).toFixed(0)} KB</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => workService.openDocument(file.url, file.name)}
                    className="p-1.5 text-dark-green hover:bg-soft-green rounded-lg transition-colors ml-2"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* Group Members Tab */}
        {activeTab === 'members' && !isDirect && (
          <div className="space-y-2">
            {(conversation.members || []).map((m: ConversationMember) => (
              <div
                key={m.id}
                className="flex items-center justify-between p-2 rounded-xl hover:bg-light-grey transition-colors text-xs"
              >
                <div className="flex items-center space-x-2.5 truncate">
                  <div className="h-7 w-7 rounded-lg bg-primary-green/15 text-dark-green flex items-center justify-center font-bold text-xs">
                    {m.employee?.first_name?.[0] || 'M'}
                  </div>
                  <div className="truncate">
                    <p className="font-bold text-charcoal truncate">
                      {m.employee?.first_name} {m.employee?.last_name || ''}
                    </p>
                    <p className="text-[10px] text-text-grey">{m.employee?.designation?.title || (m.employee?.designation as any)?.name || 'Member'}</p>
                  </div>
                </div>
                {m.role === 'admin' && (
                  <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-md">
                    Admin
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
