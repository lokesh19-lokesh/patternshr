import React, { useEffect, useState } from 'react';
import { useTenant } from '../../lib/auth/TenantProvider';
import { useAuth } from '../../lib/auth/AuthProvider';
import { workService } from '../../services/work.service';
import type { WorkReport, WorkReportComment } from '../../services/work.service';

export const ReportReviewPage: React.FC = () => {
  const { company } = useTenant();
  const { user } = useAuth();
  
  const [reports, setReports] = useState<WorkReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeReport, setActiveReport] = useState<WorkReport | null>(null);
  const [comments, setComments] = useState<WorkReportComment[]>([]);
  const [newComment, setNewComment] = useState('');

  const loadData = async () => {
    if (!company) return;
    try {
      setLoading(true);
      const data = await workService.getPendingReports(company.id);
      setReports(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [company]);

  const handleSelectReport = async (report: WorkReport) => {
    setActiveReport(report);
    try {
      const reportComments = await workService.getReportComments(report.id);
      setComments(reportComments);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddComment = async () => {
    if (!activeReport || !user || !newComment.trim()) return;
    try {
      const comment = await workService.addReportComment(activeReport.id, user.id, newComment);
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
      setActiveReport(null);
      loadData();
    } catch (err) {
      console.error(err);
      alert('Failed to update status');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Report Reviews</h2>
          <p className="mt-1 text-sm text-gray-500">Review and approve daily work reports.</p>
        </div>
        <button onClick={loadData} className="px-4 py-2 border rounded-md text-sm font-medium hover:bg-gray-50">
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Queue List */}
        <div className="lg:col-span-1 bg-white shadow rounded-lg overflow-hidden flex flex-col h-[600px]">
          <div className="p-4 border-b bg-gray-50">
            <h3 className="font-medium">Pending Queue ({reports.length})</h3>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">Loading...</div>
            ) : reports.length === 0 ? (
              <div className="p-4 text-center text-gray-500">All caught up!</div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {reports.map((report) => (
                  <li 
                    key={report.id} 
                    className={`p-4 hover:bg-gray-50 cursor-pointer ${activeReport?.id === report.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}
                    onClick={() => handleSelectReport(report)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {report.employee?.first_name} {report.employee?.last_name}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{report.project?.name}</p>
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(report.report_date).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="mt-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                        {report.hours_worked} hrs
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Detail View */}
        <div className="lg:col-span-2 bg-white shadow rounded-lg h-[600px] flex flex-col">
          {!activeReport ? (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              Select a report from the queue to review
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="p-6 border-b">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {activeReport.employee?.first_name} {activeReport.employee?.last_name}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {activeReport.project?.name} &bull; {new Date(activeReport.report_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-blue-600">{activeReport.hours_worked}</span>
                    <span className="text-sm text-gray-500 ml-1">hours</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="p-6 border-b">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Task Description</h4>
                <div className="text-gray-700 whitespace-pre-wrap">
                  {activeReport.description}
                </div>
              </div>

              {/* Comments Section */}
              <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
                <div className="flex-1 p-6 overflow-y-auto space-y-4">
                  {comments.length === 0 ? (
                    <p className="text-sm text-gray-500 italic text-center">No comments yet</p>
                  ) : (
                    comments.map(c => (
                      <div key={c.id} className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 text-sm">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-semibold text-gray-800">Reviewer (You)</span>
                          <span className="text-xs text-gray-400">{new Date(c.created_at).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-gray-700">{c.comment_text}</p>
                      </div>
                    ))
                  )}
                </div>
                
                {/* Comment Input */}
                <div className="p-4 bg-white border-t flex gap-2">
                  <input 
                    type="text" 
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment or feedback..."
                    className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                  <button 
                    onClick={handleAddComment}
                    disabled={!newComment.trim()}
                    className="px-4 py-2 bg-gray-800 text-white rounded-md text-sm font-medium hover:bg-gray-900 disabled:opacity-50"
                  >
                    Post
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 bg-gray-100 border-t flex justify-end gap-3 rounded-b-lg">
                <button
                  onClick={() => handleStatusUpdate('needs_revision')}
                  className="px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 shadow-sm"
                >
                  Request Revision
                </button>
                <button
                  onClick={() => handleStatusUpdate('approved')}
                  className="px-4 py-2 border border-transparent bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 shadow-sm"
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
