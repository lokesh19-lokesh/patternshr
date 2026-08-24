import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '../../lib/auth/AuthProvider';
import { useTenant } from '../../lib/auth/TenantProvider';
import { employeeService } from '../../services/employee.service';
import type { Employee } from '../../services/employee.service';
import { workService } from '../../services/work.service';
import type { Project, WorkReport, WorkReportComment } from '../../services/work.service';
import { Link } from 'react-router-dom';
import { AlertCircle, UploadCloud, FileText, Paperclip, X, ExternalLink, CheckSquare, MessageSquare, Send } from 'lucide-react';

const reportSchema = z.object({
  project_name: z.string().min(1, 'Please enter a project or task name'),
  report_date: z.string().min(1, 'Date is required'),
  hours_worked: z.coerce.number().min(0.5, 'Minimum 0.5 hours').max(24, 'Maximum 24 hours'),
  description: z.string().min(5, 'Please provide a task description (min 5 chars)'),
});

type ReportForm = z.infer<typeof reportSchema>;

export const MyReportsPage: React.FC = () => {
  const { user } = useAuth();
  const { company, role } = useTenant();
  const normalizedRole = role?.name?.toLowerCase() || '';
  const isManager = normalizedRole.includes('manager') || normalizedRole.includes('admin') || normalizedRole.includes('hr') || normalizedRole.includes('owner');
  
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [reports, setReports] = useState<WorkReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Document attachment state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);

  // Report details & feedback modal state
  const [selectedReport, setSelectedReport] = useState<WorkReport | null>(null);
  const [comments, setComments] = useState<WorkReportComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ReportForm>({
    resolver: zodResolver(reportSchema) as any,
    defaultValues: {
      report_date: new Date().toISOString().split('T')[0],
      hours_worked: 8,
    }
  });

  const loadData = async (isBackground = false) => {
    if (!company || !user) return;
    try {
      if (!isBackground) setLoading(true);
      const emp = await employeeService.getCurrentEmployee(company.id, user.id);
      setEmployee(emp);

      if (emp) {
        const [fetchedProjects, fetchedReports] = await Promise.all([
          workService.getProjects(company.id),
          workService.getMyReports(emp.id)
        ]);
        setProjects(fetchedProjects.filter(p => p.status === 'active'));
        setReports(fetchedReports);
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
      if (selectedReport) {
        loadComments(selectedReport.id);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [company, user, selectedReport]);

  const loadComments = async (reportId: string) => {
    try {
      const fetchedComments = await workService.getReportComments(reportId);
      setComments(fetchedComments);
    } catch (e) {
      console.error('Error loading report comments', e);
    }
  };

  const handleOpenReportModal = (report: WorkReport) => {
    setSelectedReport(report);
    loadComments(report.id);
  };

  const handleCloseReportModal = () => {
    setSelectedReport(null);
    setComments([]);
    setNewComment('');
  };

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company || !selectedReport || !user || !newComment.trim()) return;

    try {
      setSubmittingComment(true);
      const authorId = employee?.id || user.id;
      const createdComment = await workService.addReportComment(company.id, selectedReport.id, authorId, newComment.trim());
      setComments((prev) => [...prev, createdComment]);
      setNewComment('');
    } catch (err) {
      console.error('Failed to post comment', err);
      alert('Failed to send comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const onSubmit = async (data: ReportForm) => {
    if (!company || !employee) return;
    try {
      setUploadingFile(true);

      // 1. Upload attachment if present
      let attachmentUrl: string | null = null;
      let attachmentName: string | null = null;
      if (selectedFile) {
        const uploadRes = await workService.uploadAttachment(company.id, selectedFile);
        attachmentUrl = uploadRes.url;
        attachmentName = uploadRes.name;
      }

      // 2. Find or auto-create project from typed name
      const projectId = await workService.findOrCreateProject(company.id, data.project_name);

      // 3. Submit report
      await workService.submitReport(company.id, employee.id, {
        project_id: projectId,
        report_date: data.report_date,
        hours_worked: data.hours_worked,
        description: data.description,
        attachment_url: attachmentUrl,
        attachment_name: attachmentName,
      });

      reset();
      setSelectedFile(null);
      setShowForm(false);
      loadData();
    } catch (err) {
      console.error(err);
      alert('Failed to submit work report');
    } finally {
      setUploadingFile(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-text-grey text-sm">Loading your work reports...</div>;
  }

  if (!employee) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex flex-col items-center">
        <AlertCircle className="h-10 w-10 text-amber-500 mb-2" />
        <h3 className="text-base font-bold text-charcoal">No Employee Profile Found</h3>
        <p className="text-xs sm:text-sm text-text-grey mt-1">Your account is not linked to an employee profile. You cannot log work.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-charcoal tracking-tight">My Work Reports</h2>
          <p className="mt-0.5 text-xs sm:text-sm text-text-grey">Log your daily tasks, hours worked, and work documents.</p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {isManager && (
            <Link
              to="/dashboard/work/reviews"
              className="inline-flex items-center justify-center space-x-1.5 bg-white hover:bg-light-grey text-charcoal border border-gray-200/80 px-3.5 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-xs transition-all"
            >
              <CheckSquare className="h-4 w-4 text-primary-green" />
              <span>Review Employee Reports</span>
            </Link>
          )}
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center justify-center bg-primary-green hover:bg-deep-green active:scale-98 text-white px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all"
          >
            {showForm ? 'Cancel' : 'Log Work'}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white p-5 sm:p-7 rounded-2xl shadow-sm border border-gray-200/80">
          <h3 className="text-base sm:text-lg font-bold text-charcoal mb-4">Submit Daily Work Report</h3>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-charcoal uppercase tracking-wider mb-1.5">
                  Project / Task Name
                </label>
                <input
                  type="text"
                  list="project-suggestions"
                  {...register('project_name')}
                  placeholder="e.g. Website Redesign, Client Marketing, Sprint 4"
                  className="block w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-charcoal text-sm focus:border-primary-green focus:outline-none focus:ring-1 focus:ring-primary-green shadow-xs bg-white"
                />
                <datalist id="project-suggestions">
                  {projects.map((p) => (
                    <option key={p.id} value={p.name} />
                  ))}
                </datalist>
                {errors.project_name && <p className="mt-1 text-xs text-red-600">{errors.project_name.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal uppercase tracking-wider mb-1.5">
                  Date
                </label>
                <input
                  type="date"
                  {...register('report_date')}
                  className="block w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-charcoal text-sm focus:border-primary-green focus:outline-none focus:ring-1 focus:ring-primary-green shadow-xs"
                />
                {errors.report_date && <p className="mt-1 text-xs text-red-600">{errors.report_date.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal uppercase tracking-wider mb-1.5">
                  Hours Worked
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="24"
                  {...register('hours_worked')}
                  className="block w-full sm:w-44 rounded-xl border border-gray-300 px-3.5 py-2.5 text-charcoal text-sm focus:border-primary-green focus:outline-none focus:ring-1 focus:ring-primary-green shadow-xs"
                />
                {errors.hours_worked && <p className="mt-1 text-xs text-red-600">{errors.hours_worked.message}</p>}
              </div>

              {/* Upload Document / Attachment */}
              <div>
                <label className="block text-xs font-semibold text-charcoal uppercase tracking-wider mb-1.5">
                  Attach Work Document (Optional)
                </label>
                {selectedFile ? (
                  <div className="flex items-center justify-between p-2.5 rounded-xl border border-primary-green/30 bg-soft-green/50 text-xs text-charcoal">
                    <div className="flex items-center space-x-2 truncate">
                      <FileText className="h-4 w-4 text-primary-green flex-shrink-0" />
                      <span className="font-semibold truncate">{selectedFile.name}</span>
                      <span className="text-text-grey text-[11px]">({(selectedFile.size / 1024).toFixed(0)} KB)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedFile(null)}
                      className="p-1 hover:bg-white rounded-lg text-text-grey hover:text-red-600 transition-colors ml-2"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center space-x-2 border-2 border-dashed border-gray-200 hover:border-primary-green/60 rounded-xl p-2.5 cursor-pointer bg-light-grey/60 hover:bg-soft-green/30 transition-colors">
                    <UploadCloud className="h-4 w-4 text-primary-green" />
                    <span className="text-xs font-semibold text-charcoal">Upload Document (PDF, DOCX, XLSX, Image)</span>
                    <input
                      type="file"
                      onChange={handleFileChange}
                      className="hidden"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.png,.jpg,.jpeg,.zip"
                    />
                  </label>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-charcoal uppercase tracking-wider mb-1.5">
                  Task Description / Summary
                </label>
                <textarea
                  {...register('description')}
                  rows={4}
                  className="block w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-charcoal text-sm focus:border-primary-green focus:outline-none focus:ring-1 focus:ring-primary-green shadow-xs"
                  placeholder="Summarize the tasks and progress achieved today..."
                />
                {errors.description && <p className="mt-1 text-xs text-red-600">{errors.description.message}</p>}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSubmitting || uploadingFile}
                className="bg-primary-green hover:bg-deep-green active:scale-98 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50 inline-flex items-center space-x-1.5"
              >
                <span>{uploadingFile || isSubmitting ? 'Submitting...' : 'Submit Report'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Reports History */}
      <div className="bg-white shadow-sm border border-gray-200/80 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-base font-bold text-charcoal">My Submitted Reports</h3>
          <span className="text-xs text-text-grey">{reports.length} reports logged</span>
        </div>

        {reports.length === 0 ? (
          <div className="p-8 text-center text-text-grey text-sm">
            You haven't submitted any work reports yet.
          </div>
        ) : (
          <>
            {/* Desktop View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-light-grey">
                  <tr>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-text-grey uppercase tracking-wider">Date & Project</th>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-text-grey uppercase tracking-wider">Hours</th>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-text-grey uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-text-grey uppercase tracking-wider">Document</th>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-text-grey uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3.5 text-right text-xs font-bold text-text-grey uppercase tracking-wider">Reviewer Feedback</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {reports.map((report) => (
                    <tr key={report.id} className="hover:bg-light-grey/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-charcoal">
                          {report.project?.name || 'General Work'}
                        </div>
                        <div className="text-xs text-text-grey">{new Date(report.report_date).toLocaleDateString()}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-charcoal">
                        {report.hours_worked} hrs
                      </td>
                      <td className="px-6 py-4 text-xs sm:text-sm text-text-grey max-w-sm">
                        <p className="line-clamp-2">{report.description}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {report.attachment_url ? (
                          <button
                            type="button"
                            onClick={() => workService.openDocument(report.attachment_url!, report.attachment_name || 'work-document')}
                            className="inline-flex items-center space-x-1 text-xs font-bold text-primary-green hover:text-deep-green bg-soft-green border border-primary-green/20 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                          >
                            <Paperclip className="h-3 w-3" />
                            <span>{report.attachment_name || 'View Doc'}</span>
                            <ExternalLink className="h-3 w-3 ml-0.5" />
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            report.status === 'approved'
                              ? 'bg-soft-green text-dark-green border border-primary-green/30'
                              : report.status === 'needs_revision'
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {report.status === 'pending' || report.status === 'submitted'
                            ? 'Pending Review'
                            : report.status === 'needs_revision'
                            ? 'Needs Revision'
                            : 'Approved'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenReportModal(report)}
                          className="inline-flex items-center space-x-1 text-xs font-bold text-charcoal bg-white hover:bg-soft-green hover:text-dark-green px-3 py-1.5 rounded-xl border border-gray-200/80 shadow-xs transition-all cursor-pointer"
                        >
                          <MessageSquare className="h-3.5 w-3.5 text-primary-green" />
                          <span>View Feedback</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile View */}
            <div className="md:hidden divide-y divide-gray-100">
              {reports.map((report) => (
                <div key={report.id} className="p-4 space-y-2.5">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-charcoal">{report.project?.name || 'General Work'}</h4>
                      <p className="text-xs text-text-grey">{new Date(report.report_date).toLocaleDateString()}</p>
                    </div>
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        report.status === 'approved'
                          ? 'bg-soft-green text-dark-green border border-primary-green/30'
                          : report.status === 'needs_revision'
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {report.status === 'pending' || report.status === 'submitted'
                        ? 'Pending'
                        : report.status === 'needs_revision'
                        ? 'Revision'
                        : 'Approved'}
                    </span>
                  </div>

                  <p className="text-xs text-text-grey leading-relaxed bg-light-grey/80 p-2.5 rounded-xl">
                    {report.description}
                  </p>

                  <div className="flex items-center justify-between pt-1 text-xs gap-2 flex-wrap">
                    <span className="font-bold text-charcoal">{report.hours_worked} Hours Logged</span>
                    <div className="flex items-center gap-1.5">
                      {report.attachment_url && (
                        <button
                          type="button"
                          onClick={() => workService.openDocument(report.attachment_url!, report.attachment_name || 'work-document')}
                          className="inline-flex items-center space-x-1 font-bold text-primary-green bg-soft-green px-2 py-1 rounded-md cursor-pointer"
                        >
                          <Paperclip className="h-3 w-3" />
                          <span>Doc</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleOpenReportModal(report)}
                        className="inline-flex items-center space-x-1 text-xs font-bold text-charcoal bg-white border border-gray-200 px-2.5 py-1 rounded-lg shadow-xs"
                      >
                        <MessageSquare className="h-3.5 w-3.5 text-primary-green" />
                        <span>Feedback</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Report Feedback & Details Modal for Employee */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden border border-gray-100">
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-100 flex items-start justify-between bg-light-grey/40">
              <div>
                <h3 className="text-lg font-bold text-charcoal">{selectedReport.project?.name || 'Work Report Details'}</h3>
                <p className="text-xs text-text-grey mt-0.5">
                  {new Date(selectedReport.report_date).toLocaleDateString()} &bull; {selectedReport.hours_worked} hours
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseReportModal}
                className="p-1.5 rounded-xl hover:bg-gray-100 text-text-grey hover:text-charcoal transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              {/* Status Banner */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-light-grey/80 border border-gray-200/60">
                <span className="text-xs font-bold text-charcoal">Status</span>
                <span
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    selectedReport.status === 'approved'
                      ? 'bg-soft-green text-dark-green border border-primary-green/30'
                      : selectedReport.status === 'needs_revision'
                      ? 'bg-red-50 text-red-700 border border-red-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  {selectedReport.status.charAt(0).toUpperCase() + selectedReport.status.slice(1)}
                </span>
              </div>

              {/* Task Description */}
              <div>
                <h4 className="text-xs font-bold text-charcoal uppercase tracking-wider mb-1">My Submitted Task</h4>
                <p className="text-xs sm:text-sm text-text-grey bg-light-grey/40 p-3 rounded-xl border border-gray-100 leading-relaxed whitespace-pre-wrap">
                  {selectedReport.description}
                </p>
              </div>

              {/* Attached Document */}
              {selectedReport.attachment_url && (
                <div>
                  <h4 className="text-xs font-bold text-charcoal uppercase tracking-wider mb-1">Attached Work Document</h4>
                  <button
                    type="button"
                    onClick={() => workService.openDocument(selectedReport.attachment_url!, selectedReport.attachment_name || 'work-document')}
                    className="inline-flex items-center space-x-1.5 bg-soft-green text-dark-green border border-primary-green/30 px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-primary-green hover:text-white transition-all"
                  >
                    <Paperclip className="h-3.5 w-3.5" />
                    <span>{selectedReport.attachment_name || 'View Attached File'}</span>
                    <ExternalLink className="h-3 w-3" />
                  </button>
                </div>
              )}

              {/* Reviewer Comments Thread */}
              <div className="pt-2 border-t border-gray-100">
                <h4 className="text-xs font-bold text-charcoal uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                  <MessageSquare className="h-3.5 w-3.5 text-primary-green" />
                  <span>Reviewer Feedback & Conversation</span>
                </h4>

                <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1">
                  {comments.length === 0 ? (
                    <div className="p-4 text-center text-xs text-text-grey italic bg-light-grey/30 rounded-xl">
                      No reviewer feedback or comments on this report yet.
                    </div>
                  ) : (
                    comments.map((c) => (
                      <div key={c.id} className="bg-light-grey/80 p-3 rounded-xl border border-gray-100 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-charcoal">
                            {c.author ? `${c.author.first_name} ${c.author.last_name || ''}` : 'Reviewer / Admin'}
                          </span>
                          <span className="text-[10px] text-text-grey">
                            {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-charcoal leading-relaxed">{c.comment_text}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer / Reply Box */}
            <form onSubmit={handleSendComment} className="p-3.5 border-t border-gray-100 bg-light-grey/40 flex items-center gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Reply to reviewer feedback..."
                className="flex-1 rounded-xl border border-gray-300 px-3.5 py-2 text-xs sm:text-sm text-charcoal focus:border-primary-green focus:outline-none bg-white"
              />
              <button
                type="submit"
                disabled={submittingComment || !newComment.trim()}
                className="bg-primary-green hover:bg-deep-green text-white p-2 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold inline-flex items-center space-x-1 disabled:opacity-50 transition-all shadow-xs"
              >
                <Send className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Reply</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
