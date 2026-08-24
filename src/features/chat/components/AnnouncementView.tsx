import React, { useState, useEffect } from 'react';
import { 
  Megaphone, 
  Plus, 
  CheckCircle, 
  ExternalLink, 
  AlertTriangle, 
  Users, 
  X, 
  Paperclip 
} from 'lucide-react';
import { announcementService } from '../../../services/announcement.service';
import type { CompanyAnnouncement } from '../../../services/announcement.service';
import { workService } from '../../../services/work.service';

interface AnnouncementViewProps {
  companyId: string;
  currentEmployeeId: string;
  isAdminOrHr: boolean;
  onBackMobile: () => void;
}

export const AnnouncementView: React.FC<AnnouncementViewProps> = ({
  companyId,
  currentEmployeeId,
  isAdminOrHr,
  onBackMobile,
}) => {
  const [announcements, setAnnouncements] = useState<CompanyAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showReceiptsModal, setShowReceiptsModal] = useState<string | null>(null);
  const [receipts, setReceipts] = useState<any[]>([]);

  // Create Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'normal' | 'important' | 'urgent'>('normal');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      const data = await announcementService.getAnnouncements(companyId, currentEmployeeId);
      setAnnouncements(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const unsubscribe = announcementService.subscribeToAnnouncements(companyId, () => {
      loadData();
    });
    return () => unsubscribe();
  }, [companyId, currentEmployeeId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    try {
      setSubmitting(true);
      let attachmentUrl: string | null = null;
      if (selectedFile) {
        const uploadRes = await workService.uploadAttachment(companyId, selectedFile);
        attachmentUrl = uploadRes.url;
      }

      await announcementService.createAnnouncement(companyId, currentEmployeeId, {
        title: title.trim(),
        description: description.trim(),
        attachment_url: attachmentUrl,
        priority,
      });

      setTitle('');
      setDescription('');
      setSelectedFile(null);
      setShowCreateModal(false);
      loadData();
    } catch (err) {
      alert('Failed to publish announcement');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcknowledge = async (announcementId: string) => {
    try {
      await announcementService.markAsRead(announcementId, currentEmployeeId);
      setAnnouncements((prev) =>
        prev.map((a) => (a.id === announcementId ? { ...a, is_read: true } : a))
      );
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenReceipts = async (announcementId: string) => {
    try {
      setShowReceiptsModal(announcementId);
      const data = await announcementService.getReadReceipts(announcementId);
      setReceipts(data);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-light-grey/40 overflow-hidden">
      {/* Header */}
      <div className="h-16 px-4 sm:px-6 border-b border-gray-200/80 bg-white flex items-center justify-between flex-shrink-0 shadow-2xs">
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={onBackMobile}
            className="lg:hidden p-1.5 -ml-1 text-text-grey hover:text-charcoal hover:bg-light-grey rounded-xl"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
            <Megaphone className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-charcoal">📢 HR Announcements Channel</h3>
            <p className="text-xs text-text-grey">Company-wide policies, holidays, and official updates</p>
          </div>
        </div>

        {isAdminOrHr && (
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center space-x-1.5 bg-primary-green hover:bg-deep-green text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New Announcement</span>
          </button>
        )}
      </div>

      {/* Feed List */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 max-w-4xl mx-auto w-full">
        {loading ? (
          <div className="p-12 text-center text-xs sm:text-sm text-text-grey">Loading announcements...</div>
        ) : announcements.length === 0 ? (
          <div className="p-12 text-center text-text-grey bg-white rounded-2xl border border-gray-200">
            <Megaphone className="h-10 w-10 text-gray-300 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-charcoal">No announcements published yet</h4>
            <p className="text-xs text-text-grey mt-1">Official HR updates and bulletins will appear here.</p>
          </div>
        ) : (
          announcements.map((ann) => (
            <div
              key={ann.id}
              className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-gray-200/90 space-y-3.5 transition-all hover:shadow-md"
            >
              {/* Top Banner */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="text-base sm:text-lg font-bold text-charcoal">{ann.title}</h4>
                    {ann.priority === 'urgent' && (
                      <span className="bg-red-100 text-red-700 text-[10px] font-black uppercase px-2 py-0.5 rounded-md flex items-center space-x-1">
                        <AlertTriangle className="h-3 w-3" />
                        <span>Urgent</span>
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-text-grey mt-0.5">
                    Posted by <span className="font-semibold text-charcoal">{ann.creator?.first_name || 'HR Admin'}</span> &bull; {new Date(ann.created_at).toLocaleString()}
                  </p>
                </div>

                {isAdminOrHr && (
                  <button
                    type="button"
                    onClick={() => handleOpenReceipts(ann.id)}
                    className="inline-flex items-center space-x-1 text-xs font-semibold text-text-grey hover:text-charcoal bg-light-grey hover:bg-gray-200/80 px-2.5 py-1 rounded-lg transition-colors"
                  >
                    <Users className="h-3.5 w-3.5" />
                    <span>Read Receipts</span>
                  </button>
                )}
              </div>

              {/* Description Body */}
              <div className="text-xs sm:text-sm text-charcoal leading-relaxed whitespace-pre-wrap bg-light-grey/40 p-4 rounded-xl border border-gray-100">
                {ann.description}
              </div>

              {/* Attachment if present */}
              {ann.attachment_url && (
                <div>
                  <button
                    type="button"
                    onClick={() => workService.openDocument(ann.attachment_url!, 'Announcement_Document')}
                    className="inline-flex items-center space-x-2 bg-soft-green text-dark-green border border-primary-green/30 px-3.5 py-2 rounded-xl text-xs font-bold hover:bg-primary-green hover:text-white transition-all shadow-xs"
                  >
                    <Paperclip className="h-4 w-4" />
                    <span>Download / View Official Document</span>
                    <ExternalLink className="h-3.5 w-3.5 ml-1" />
                  </button>
                </div>
              )}

              {/* Acknowledgment Action */}
              <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                {ann.is_read ? (
                  <span className="inline-flex items-center space-x-1.5 text-xs font-bold text-dark-green bg-soft-green px-3 py-1.5 rounded-xl border border-primary-green/30">
                    <CheckCircle className="h-4 w-4 text-primary-green" />
                    <span>You acknowledged this announcement</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleAcknowledge(ann.id)}
                    className="inline-flex items-center space-x-1.5 bg-charcoal hover:bg-black text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs"
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    <span>Acknowledge & Mark as Read</span>
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Announcement Modal (HR/Admin) */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 border border-gray-100 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-base font-bold text-charcoal">Publish HR Announcement</h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-text-grey hover:text-charcoal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 pt-4 overflow-y-auto pr-1">
              <div>
                <label className="block text-xs font-bold text-charcoal uppercase tracking-wider mb-1">
                  Announcement Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Office Holiday Notice, Salary Disbursement Update"
                  className="w-full rounded-xl border border-gray-300 px-3.5 py-2 text-xs sm:text-sm text-charcoal focus:border-primary-green focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-charcoal uppercase tracking-wider mb-1">
                  Priority Level
                </label>
                <select
                  value={priority}
                  onChange={(e: any) => setPriority(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-3.5 py-2 text-xs sm:text-sm text-charcoal focus:border-primary-green focus:outline-none bg-white"
                >
                  <option value="normal">Normal Announcement</option>
                  <option value="important">Important (Highlighted)</option>
                  <option value="urgent">Urgent Notice (Red Alert)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-charcoal uppercase tracking-wider mb-1">
                  Detailed Notice / Message *
                </label>
                <textarea
                  required
                  rows={5}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Write the full announcement message for all employees..."
                  className="w-full rounded-xl border border-gray-300 px-3.5 py-2 text-xs sm:text-sm text-charcoal focus:border-primary-green focus:outline-none leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-charcoal uppercase tracking-wider mb-1">
                  Attach Official Document (Optional)
                </label>
                {selectedFile ? (
                  <div className="flex items-center justify-between p-2 rounded-xl bg-soft-green border border-primary-green/30 text-xs">
                    <span className="font-bold text-dark-green truncate">{selectedFile.name}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedFile(null)}
                      className="p-1 text-red-600 hover:bg-white rounded-md"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <input
                    type="file"
                    onChange={(e) => e.target.files && setSelectedFile(e.target.files[0])}
                    className="w-full text-xs text-text-grey"
                  />
                )}
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-text-grey hover:bg-light-grey"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !title.trim() || !description.trim()}
                  className="px-5 py-2 bg-primary-green hover:bg-deep-green disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
                >
                  {submitting ? 'Publishing...' : 'Publish Announcement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Read Receipts Modal */}
      {showReceiptsModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-gray-100 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-base font-bold text-charcoal">Read Receipts ({receipts.length})</h3>
              <button
                type="button"
                onClick={() => setShowReceiptsModal(null)}
                className="p-1 rounded-lg text-text-grey hover:text-charcoal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-gray-100 py-3 max-h-64 pr-1">
              {receipts.length === 0 ? (
                <div className="p-8 text-center text-xs text-text-grey">No employees have acknowledged yet.</div>
              ) : (
                receipts.map((r) => (
                  <div key={r.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-charcoal">
                        {r.employee?.first_name} {r.employee?.last_name || ''}
                      </p>
                      <p className="text-[10px] text-text-grey">{r.employee?.designation?.title || r.employee?.email}</p>
                    </div>
                    <span className="text-[10px] text-text-grey">
                      {new Date(r.read_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
