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

  const loadRequests = async (isBackground = false) => {
    if (!company) return;
    try {
      if (!isBackground) setLoading(true);
      const data = await leaveService.getAllPendingRequests(company.id);
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

    const unsubscribe = leaveService.subscribeToLeaveRequests(company.id, () => {
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-charcoal tracking-tight">Leave Approvals</h2>
          <p className="mt-0.5 text-xs sm:text-sm text-text-grey">
            Review and manage pending employee time off applications.
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

      <div className="bg-white shadow-sm border border-gray-200/80 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-text-grey text-sm">Loading pending leave requests...</div>
        ) : requests.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-soft-green mb-3 border border-primary-green/20">
              <CheckCircle2 className="h-7 w-7 text-primary-green" />
            </div>
            <h3 className="text-base font-bold text-charcoal">All Caught Up</h3>
            <p className="mt-1 text-xs sm:text-sm text-text-grey">
              There are no pending leave requests to review at this time.
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
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-text-grey uppercase tracking-wider">Reason</th>
                    <th className="px-6 py-3.5 text-right text-xs font-bold text-text-grey uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {requests.map((req) => (
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
                      <td className="px-6 py-4 text-xs text-text-grey max-w-xs truncate">
                        {req.reason}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
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
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-gray-100">
              {requests.map((req) => (
                <div key={req.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-charcoal">
                        {req.employee?.first_name} {req.employee?.last_name || ''}
                      </h4>
                      <p className="text-xs text-text-grey">{req.employee?.employee_id || 'Staff'}</p>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-soft-green text-dark-green border border-primary-green/30">
                      {req.leave_types?.name || 'Leave'}
                    </span>
                  </div>

                  <div className="bg-light-grey/80 rounded-xl p-3 text-xs space-y-1">
                    <div className="flex items-center space-x-1.5 text-charcoal font-semibold">
                      <Calendar className="h-3.5 w-3.5 text-primary-green" />
                      <span>{new Date(req.start_date).toLocaleDateString()} - {new Date(req.end_date).toLocaleDateString()}</span>
                      <span className="text-text-grey font-normal">({req.number_of_days} days)</span>
                    </div>
                    {req.reason && (
                      <p className="text-text-grey pt-1 italic">"{req.reason}"</p>
                    )}
                  </div>

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
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
