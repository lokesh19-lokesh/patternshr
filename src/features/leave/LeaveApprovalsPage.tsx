import React, { useEffect, useState } from 'react';
import { useTenant } from '../../lib/auth/TenantProvider';
import { leaveService } from '../../services/leave.service';
import type { LeaveRequest } from '../../services/leave.service';

export const LeaveApprovalsPage: React.FC = () => {
  const { company } = useTenant();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);

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
      await leaveService.updateRequestStatus(id, status);
      loadRequests();
    } catch (err) {
      console.error(err);
      alert('Failed to update request');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Leave Approvals</h2>
          <p className="mt-1 text-sm text-gray-500">Review and manage employee time off requests.</p>
        </div>
        <button onClick={() => loadRequests()} className="px-4 py-2 border rounded-md text-sm font-medium hover:bg-gray-50">
          Refresh
        </button>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-6 text-center text-gray-500">Loading pending requests...</div>
        ) : requests.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 mb-4">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-gray-900">All Caught Up</h3>
            <p className="mt-1 text-sm text-gray-500">There are no pending leave requests to review.</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leave Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {requests.map((req) => (
                <tr key={req.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {req.employee?.first_name} {req.employee?.last_name}
                    </div>
                    <div className="text-sm text-gray-500">{req.employee?.employee_id}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {req.leave_types?.name}
                    </span>
                    <div className="mt-1 text-xs text-gray-400">{req.number_of_days} days</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(req.start_date).toLocaleDateString()} - <br/>
                    {new Date(req.end_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                    {req.reason}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleStatusUpdate(req.id, 'approved')}
                      className="text-white bg-green-600 hover:bg-green-700 px-3 py-1 rounded-md mr-2"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(req.id, 'rejected')}
                      className="text-white bg-red-600 hover:bg-red-700 px-3 py-1 rounded-md"
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
