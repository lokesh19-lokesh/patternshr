import React, { useEffect, useState } from 'react';
import { useTenant } from '../../lib/auth/TenantProvider';
import { useAuth } from '../../lib/auth/AuthProvider';
import { workService } from '../../services/work.service';
import type { WorkReport, WorkReportComment } from '../../services/work.service';
import { Paperclip, ExternalLink, RefreshCw, FileText, User } from 'lucide-react';

export const ReportReviewPage: React.FC = () => {
  const { company } = useTenant();
  const { user } = useAuth();
  
  const [reports, setReports] = useState<WorkReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeReport, setActiveReport] = useState<WorkReport | null>(null);
  const [comments, setComments] = useState<WorkReportComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'needs_revision'>('all');

  const activeReportRef = React.useRef<WorkReport | null>(null);
  activeReportRef.current = activeReport;

  const loadComments = async (reportId: string) => {
    try {
      const reportComments = await workService.getReportComments(reportId);
      setComments(reportComments);
    } catch (err) {
      console.error(err);
    }
  };

  const loadData = async (isBackground = false) => {
    if (!company) return;
    try {
      if (!isBackground) setLoading(true);
      const data = await workService.getAllCompanyReports(company.id, 'all');
      setReports(data);
      if (data.length > 0 && !activeReportRef.current) {
        handleSelectReport(data[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    if (!company) return;

    const unsubscribe = workService.subscribeToWorkReports(company.id, () => {
      loadData(true);
      if (activeReportRef.current) {
        loadComments(activeReportRef.current.id);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [company]);

  // Dedicated realtime listener for active report comments
  useEffect(() => {
    if (!activeReport?.id) return;
    const unsubComments = workService.subscribeToReportComments(activeReport.id, () => {
      loadComments(activeReport.id);
    });
    return () => unsubComments();
  }, [activeReport?.id]);

  const handleSelectReport = async (report: WorkReport) => {
    setActiveReport(report);
    loadComments(report.id);
  };

  const handleAddComment = async () => {
    if (!company || !activeReport || !user || !newComment.trim()) return;
    try {
      const comment = await workService.addReportComment(company.id, activeReport.id, user.id, newComment);
      setComments([...comments, comment]);
      setNewComment('');
    } catch (err) {
      console.error(err);
      alert('Failed to add comment');
    }
  };

  const handleStatusUpdate = async (status: 'approved' | 'needs_revision') => {
    if (!activeReport) return;
    try {
      await workService.updateReportStatus(activeReport.id, status);
      await loadData();
      setActiveReport((prev: WorkReport | null) => (prev ? { ...prev, status } : null));
    } catch (err) {
      console.error(err);
      alert('Failed to update status');
    }
  };

  const pendingCount = reports.filter((r) => r.status === 'pending' || r.status === 'submitted').length;
  const approvedCount = reports.filter((r) => r.status === 'approved').length;
  const revisionCount = reports.filter((r) => r.status === 'needs_revision').length;

  const filteredReports = reports.filter((r) => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'pending') return r.status === 'pending' || r.status === 'submitted';
    return r.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-charcoal tracking-tight">Work Report Reviews</h2>
          <p className="mt-0.5 text-xs sm:text-sm text-text-grey">
            Review, evaluate, and approve employee daily work reports and documents.
          </p>
        </div>
        <button
          onClick={() => loadData()}
          className="inline-flex items-center justify-center space-x-1.5 bg-white hover:bg-light-grey text-charcoal border border-gray-200/80 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-xs self-start sm:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 text-text-grey ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center space-x-1.5 whitespace-nowrap ${
            statusFilter === 'all'
              ? 'bg-charcoal text-white shadow-xs'
              : 'bg-white text-text-grey hover:text-charcoal border border-gray-200/80 hover:bg-light-grey'
          }`}
        >
          <span>All Reports</span>
          <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-gray-200/50 text-inherit font-semibold">
            {reports.length}
          </span>
        </button>
        <button
          onClick={() => setStatusFilter('pending')}
          className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center space-x-1.5 whitespace-nowrap ${
            statusFilter === 'pending'
              ? 'bg-amber-500 text-white shadow-xs'
              : 'bg-white text-text-grey hover:text-charcoal border border-gray-200/80 hover:bg-light-grey'
          }`}
        >
          <span>Pending Review</span>
          <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold">
            {pendingCount}
          </span>
        </button>
        <button
          onClick={() => setStatusFilter('approved')}
          className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center space-x-1.5 whitespace-nowrap ${
            statusFilter === 'approved'
              ? 'bg-primary-green text-white shadow-xs'
              : 'bg-white text-text-grey hover:text-charcoal border border-gray-200/80 hover:bg-light-grey'
          }`}
        >
          <span>Approved</span>
          <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-soft-green text-dark-green font-semibold">
            {approvedCount}
          </span>
        </button>
        <button
          onClick={() => setStatusFilter('needs_revision')}
          className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center space-x-1.5 whitespace-nowrap ${
            statusFilter === 'needs_revision'
              ? 'bg-red-600 text-white shadow-xs'
              : 'bg-white text-text-grey hover:text-charcoal border border-gray-200/80 hover:bg-light-grey'
          }`}
        >
          <span>Needs Revision</span>
          <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-800 font-semibold">
            {revisionCount}
          </span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Queue List */}
        <div className="lg:col-span-1 bg-white shadow-sm border border-gray-200/80 rounded-2xl overflow-hidden flex flex-col h-[650px]">
          <div className="p-4 border-b border-gray-100 bg-light-grey/60 flex items-center justify-between">
            <h3 className="text-sm font-bold text-charcoal">Reports List ({filteredReports.length})</h3>
            <span className="text-xs text-text-grey">Click to review</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-text-grey text-sm">Loading reports...</div>
            ) : filteredReports.length === 0 ? (
              <div className="p-8 text-center text-text-grey text-sm">No {statusFilter !== 'all' ? statusFilter : ''} reports found</div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {filteredReports.map((report) => (
                  <li 
                    key={report.id} 
                    className={`p-4 hover:bg-light-grey/60 cursor-pointer transition-all ${
                      activeReport?.id === report.id ? 'bg-soft-green/60 border-l-4 border-primary-green' : ''
                    }`}
                    onClick={() => handleSelectReport(report)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-bold text-charcoal flex items-center space-x-1.5">
                          <User className="h-3.5 w-3.5 text-primary-green" />
                          <span>{report.employee?.first_name} {report.employee?.last_name || ''}</span>
                        </p>
                        <p className="text-xs text-dark-green font-medium mt-0.5">{report.project?.name || 'General Project'}</p>
                      </div>
                      <span className="text-[11px] text-text-grey font-medium">
                        {new Date(report.report_date).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-gray-100 text-charcoal">
                        {report.hours_worked} hrs
                      </span>
                      {report.attachment_url && (
                        <span className="inline-flex items-center space-x-1 text-[11px] text-primary-green font-bold bg-soft-green px-1.5 py-0.5 rounded-md">
                          <Paperclip className="h-3 w-3" />
                          <span>Doc</span>
                        </span>
                      )}
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          report.status === 'approved'
                            ? 'bg-soft-green text-dark-green'
                            : report.status === 'needs_revision'
                            ? 'bg-red-50 text-red-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {report.status === 'pending' || report.status === 'submitted'
                          ? 'Pending'
                          : report.status === 'needs_revision'
                          ? 'Revision'
                          : 'Approved'}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Detail View */}
        <div className="lg:col-span-2 bg-white shadow-sm border border-gray-200/80 rounded-2xl h-[650px] flex flex-col overflow-hidden">
          {!activeReport ? (
            <div className="flex-1 flex flex-col items-center justify-center text-text-grey p-8 text-center">
              <FileText className="h-10 w-10 text-gray-300 mb-2" />
              <p className="text-sm font-semibold">Select a report from the list to review</p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="p-6 border-b border-gray-100 bg-light-grey/30">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-charcoal">
                      {activeReport.employee?.first_name} {activeReport.employee?.last_name || ''}
                    </h3>
                    <p className="text-xs sm:text-sm text-text-grey mt-0.5 font-medium">
                      Project: <span className="text-dark-green font-semibold">{activeReport.project?.name || 'General'}</span> &bull; {new Date(activeReport.report_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xl sm:text-2xl font-black text-primary-green">{activeReport.hours_worked}</span>
                    <span className="text-xs text-text-grey ml-1 font-semibold">hours</span>
                  </div>
                </div>
              </div>

              {/* Description & Document */}
              <div className="p-6 border-b space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-charcoal uppercase tracking-wider mb-1.5">Task Description</h4>
                  <div className="text-sm text-text-grey whitespace-pre-wrap leading-relaxed bg-light-grey/60 p-3.5 rounded-xl border border-gray-100">
                    {activeReport.description}
                  </div>
                </div>

                {activeReport.attachment_url && (
                  <div>
                    <h4 className="text-xs font-bold text-charcoal uppercase tracking-wider mb-1.5">Attached Work Document</h4>
                    <button
                      type="button"
                      onClick={() => workService.openDocument(activeReport.attachment_url!, activeReport.attachment_name || 'work-document')}
                      className="inline-flex items-center space-x-2 bg-soft-green text-dark-green border border-primary-green/30 px-4 py-2.5 rounded-xl font-bold text-xs hover:bg-primary-green hover:text-white transition-all shadow-xs"
                    >
                      <Paperclip className="h-4 w-4" />
                      <span>{activeReport.attachment_name || 'Download / View Attached Document'}</span>
                      <ExternalLink className="h-3.5 w-3.5 ml-1" />
                    </button>
                  </div>
                )}
              </div>

              {/* Comments Section */}
              <div className="flex-1 flex flex-col overflow-hidden bg-light-grey/40">
                <div className="flex-1 p-6 overflow-y-auto space-y-3">
                  {comments.length === 0 ? (
                    <p className="text-xs text-text-grey italic text-center py-4">No comments or feedback yet</p>
                  ) : (
                    comments.map((c) => (
                      <div key={c.id} className="bg-white p-3.5 rounded-xl shadow-xs border border-gray-100 text-xs sm:text-sm">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-charcoal">
                            {c.author ? `${c.author.first_name} ${c.author.last_name || ''}` : 'Reviewer / Admin'}
                          </span>
                          <span className="text-[11px] text-text-grey">{new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-text-grey leading-relaxed">{c.comment_text}</p>
                      </div>
                    ))
                  )}
                </div>
                
                {/* Comment Input */}
                <div className="p-4 bg-white border-t border-gray-100 flex gap-2">
                  <input 
                    type="text" 
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment or feedback for the employee..."
                    className="flex-1 rounded-xl border border-gray-300 px-3.5 py-2 text-xs sm:text-sm text-charcoal focus:border-primary-green focus:outline-none"
                  />
                  <button 
                    onClick={handleAddComment}
                    disabled={!newComment.trim()}
                    className="px-4 py-2 bg-charcoal text-white rounded-xl text-xs sm:text-sm font-bold hover:bg-black disabled:opacity-50 transition-colors"
                  >
                    Post
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 bg-white border-t border-gray-100 flex justify-end gap-2.5 rounded-b-2xl">
                <button
                  onClick={() => handleStatusUpdate('needs_revision')}
                  className="px-4 py-2.5 border border-red-200 bg-red-50 text-red-700 rounded-xl text-xs sm:text-sm font-bold hover:bg-red-100 transition-colors"
                >
                  Request Revision
                </button>
                <button
                  onClick={() => handleStatusUpdate('approved')}
                  className="px-5 py-2.5 bg-primary-green hover:bg-deep-green text-white rounded-xl text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all"
                >
                  Approve Report
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
