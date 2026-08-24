import React, { useEffect, useState } from 'react';
import { useTenant } from '../../lib/auth/TenantProvider';
import { leaveService } from '../../services/leave.service';
import type { LeaveRequest } from '../../services/leave.service';
import { CheckCircle2, XCircle, RefreshCw, Calendar } from 'lucide-react';

export const LeaveApprovalsPage: React.FC = () => {
  const { company } = useTenant();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const loadRequests = async (isBackground = false) => {
    if (!company) return;
    try {
      if (!isBackground) setLoading(true);
      const data = await leaveService.getAllCompanyLeaveRequests(company.id, 'all');
      setRequests(data);
    } catch (err) {
      console.error(err);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();

    if (!company) return;

    const unsubscribe = leaveService.subscribeToLeaveUpdates(company.id, () => {
      loadRequests(true);
    });

    return () => {
      unsubscribe();
    };
  }, [company]);

  const handleStatusUpdate = async (id: string, status: 'approved' | 'rejected') => {
    try {
      setProcessingId(id);
      await leaveService.updateRequestStatus(id, status);
      await loadRequests();
    } catch (err) {
      console.error(err);
      alert('Failed to update request');
    } finally {
      setProcessingId(null);
    }
  };

  const pendingCount = requests.filter((r) => r.status === 'pending').length;
  const approvedCount = requests.filter((r) => r.status === 'approved').length;
  const rejectedCount = requests.filter((r) => r.status === 'rejected').length;

  const filteredRequests = requests.filter((r) => {
    if (statusFilter === 'all') return true;
    return r.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-charcoal tracking-tight">Leave Approvals & History</h2>
          <p className="mt-0.5 text-xs sm:text-sm text-text-grey">
            Review pending requests and monitor company-wide leave history.
          </p>
        </div>
        <button
          onClick={() => loadRequests()}
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
          <span>All History</span>
          <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-gray-200/50 text-inherit font-semibold">
            {requests.length}
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
          <span>Pending Approvals</span>
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
          onClick={() => setStatusFilter('rejected')}
          className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center space-x-1.5 whitespace-nowrap ${
            statusFilter === 'rejected'
              ? 'bg-red-600 text-white shadow-xs'
              : 'bg-white text-text-grey hover:text-charcoal border border-gray-200/80 hover:bg-light-grey'
          }`}
        >
          <span>Rejected</span>
          <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-800 font-semibold">
            {rejectedCount}
          </span>
        </button>
      </div>

      <div className="bg-white shadow-sm border border-gray-200/80 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-text-grey text-sm">Loading leave history...</div>
        ) : filteredRequests.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-soft-green mb-3 border border-primary-green/20">
              <CheckCircle2 className="h-7 w-7 text-primary-green" />
            </div>
            <h3 className="text-base font-bold text-charcoal">No {statusFilter !== 'all' ? statusFilter : ''} leave records found</h3>
            <p className="mt-1 text-xs sm:text-sm text-text-grey">
              {statusFilter === 'pending'
                ? 'There are no pending requests to approve right now.'
                : 'No records matching this category.'}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-light-grey">
                  <tr>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-text-grey uppercase tracking-wider">Employee</th>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-text-grey uppercase tracking-wider">Leave Type</th>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-text-grey uppercase tracking-wider">Dates</th>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-text-grey uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-text-grey uppercase tracking-wider">Reason</th>
                    <th className="px-6 py-3.5 text-right text-xs font-bold text-text-grey uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {filteredRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-light-grey/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-charcoal">
                          {req.employee?.first_name} {req.employee?.last_name || ''}
                        </div>
                        <div className="text-xs text-text-grey">{req.employee?.employee_id || 'Staff'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-soft-green text-dark-green border border-primary-green/30">
                          {req.leave_types?.name || 'Leave'}
                        </span>
                        <div className="mt-1 text-xs text-text-grey font-medium">{req.number_of_days} days</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-charcoal font-medium">
                        {new Date(req.start_date).toLocaleDateString()} - {new Date(req.end_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            req.status === 'approved'
                              ? 'bg-soft-green text-dark-green border border-primary-green/30'
                              : req.status === 'rejected'
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-text-grey max-w-xs truncate">
                        {req.reason || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                        {req.status === 'pending' ? (
                          <>
                            <button
                              onClick={() => handleStatusUpdate(req.id, 'approved')}
                              disabled={processingId === req.id}
                              className="inline-flex items-center space-x-1 text-white bg-primary-green hover:bg-deep-green active:scale-95 px-3 py-1.5 rounded-xl text-xs font-bold shadow-xs transition-all disabled:opacity-50"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>Approve</span>
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(req.id, 'rejected')}
                              disabled={processingId === req.id}
                              className="inline-flex items-center space-x-1 text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 active:scale-95 px-3 py-1.5 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                              <span>Reject</span>
                            </button>
                          </>
                        ) : (
                          <span className="text-xs text-text-grey font-medium">Decided</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-gray-100">
              {filteredRequests.map((req) => (
                <div key={req.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-charcoal">
                        {req.employee?.first_name} {req.employee?.last_name || ''}
                      </h4>
                      <p className="text-xs text-text-grey">{req.employee?.employee_id || 'Staff'}</p>
                    </div>
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        req.status === 'approved'
                          ? 'bg-soft-green text-dark-green border border-primary-green/30'
                          : req.status === 'rejected'
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                    </span>
                  </div>

                  <div className="bg-light-grey/80 rounded-xl p-3 text-xs space-y-1">
                    <div className="flex items-center space-x-1.5 text-charcoal font-semibold">
                      <Calendar className="h-3.5 w-3.5 text-primary-green" />
                      <span>{new Date(req.start_date).toLocaleDateString()} - {new Date(req.end_date).toLocaleDateString()}</span>
                      <span className="text-text-grey font-normal">({req.number_of_days} days)</span>
                    </div>
                    <p className="text-xs text-dark-green font-medium">Type: {req.leave_types?.name}</p>
                    {req.reason && (
                      <p className="text-text-grey pt-1 italic">"{req.reason}"</p>
                    )}
                  </div>

                  {req.status === 'pending' && (
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => handleStatusUpdate(req.id, 'approved')}
                        disabled={processingId === req.id}
                        className="flex-1 inline-flex items-center justify-center space-x-1 text-white bg-primary-green hover:bg-deep-green active:scale-98 py-2 rounded-xl text-xs font-bold shadow-xs transition-all disabled:opacity-50"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(req.id, 'rejected')}
                        disabled={processingId === req.id}
                        className="flex-1 inline-flex items-center justify-center space-x-1 text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 active:scale-98 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                      >
                        <XCircle className="h-4 w-4" />
                        <span>Reject</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
