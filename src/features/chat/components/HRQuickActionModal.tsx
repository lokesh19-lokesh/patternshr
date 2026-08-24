import React, { useState, useEffect } from 'react';
import { 
  X, 
  Clock, 
  Calendar, 
  DollarSign 
} from 'lucide-react';
import { supabase } from '../../../lib/supabase/client';
import type { Employee } from '../../../services/employee.service';

interface HRQuickActionModalProps {
  actionType: 'profile' | 'attendance' | 'leave' | 'payroll';
  employee: Employee;
  companyId?: string;
  onClose: () => void;
}

export const HRQuickActionModal: React.FC<HRQuickActionModalProps> = ({
  actionType,
  employee,
  onClose,
}) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActionData = async () => {
      try {
        setLoading(true);
        if (actionType === 'attendance') {
          // Fetch attendance logs for employee
          const { data: att } = await supabase
            .from('attendance_logs')
            .select('*')
            .eq('employee_id', employee.id)
            .order('created_at', { ascending: false })
            .limit(10);
          setData(att || []);
        } else if (actionType === 'leave') {
          // Fetch leave balances and requests
          const { data: leaves } = await supabase
            .from('leave_requests')
            .select('*, leave_type:leave_types(name)')
            .eq('employee_id', employee.id)
            .order('created_at', { ascending: false })
            .limit(10);
          setData(leaves || []);
        } else if (actionType === 'payroll') {
          // Fetch payslips
          const { data: payslips } = await supabase
            .from('payslips')
            .select('*')
            .eq('employee_id', employee.id)
            .order('created_at', { ascending: false })
            .limit(5);
          setData(payslips || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchActionData();
  }, [actionType, employee.id]);

  const getTitle = () => {
    switch (actionType) {
      case 'attendance':
        return `Attendance Records: ${employee.first_name} ${employee.last_name || ''}`;
      case 'leave':
        return `Leave History & Requests: ${employee.first_name} ${employee.last_name || ''}`;
      case 'payroll':
        return `Salary & Payslips: ${employee.first_name} ${employee.last_name || ''}`;
      default:
        return `Employee Information: ${employee.first_name} ${employee.last_name || ''}`;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 border border-gray-100 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center space-x-2">
            {actionType === 'attendance' && <Clock className="h-5 w-5 text-primary-green" />}
            {actionType === 'leave' && <Calendar className="h-5 w-5 text-primary-green" />}
            {actionType === 'payroll' && <DollarSign className="h-5 w-5 text-primary-green" />}
            <h3 className="text-sm sm:text-base font-bold text-charcoal truncate">{getTitle()}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-text-grey hover:text-charcoal hover:bg-light-grey"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-4">
          {loading ? (
            <div className="p-8 text-center text-xs text-text-grey">Loading records...</div>
          ) : (
            <>
              {/* Attendance View */}
              {actionType === 'attendance' && (
                <div className="space-y-2">
                  {(!data || data.length === 0) ? (
                    <div className="p-8 text-center text-xs text-text-grey">No attendance records found for this employee.</div>
                  ) : (
                    data.map((att: any) => (
                      <div key={att.id} className="p-3 bg-light-grey/60 rounded-xl border border-gray-100 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-bold text-charcoal">{new Date(att.date || att.created_at).toLocaleDateString()}</p>
                          <p className="text-[11px] text-text-grey">In: {att.check_in_time || '—'} &bull; Out: {att.check_out_time || '—'}</p>
                        </div>
                        <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-soft-green text-dark-green uppercase">
                          {att.status || 'Present'}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Leave View */}
              {actionType === 'leave' && (
                <div className="space-y-2">
                  {(!data || data.length === 0) ? (
                    <div className="p-8 text-center text-xs text-text-grey">No leave history found for this employee.</div>
                  ) : (
                    data.map((l: any) => (
                      <div key={l.id} className="p-3 bg-light-grey/60 rounded-xl border border-gray-100 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-bold text-charcoal">{l.leave_type?.name || 'Annual Leave'}</p>
                          <p className="text-[11px] text-text-grey">
                            {new Date(l.start_date).toLocaleDateString()} - {new Date(l.end_date).toLocaleDateString()} ({l.days || 1} days)
                          </p>
                        </div>
                        <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] uppercase ${
                          l.status === 'approved' ? 'bg-soft-green text-dark-green' : l.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {l.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Payroll View */}
              {actionType === 'payroll' && (
                <div className="space-y-2">
                  {(!data || data.length === 0) ? (
                    <div className="p-8 text-center text-xs text-text-grey">No payslips found for this employee.</div>
                  ) : (
                    data.map((p: any) => (
                      <div key={p.id} className="p-3 bg-light-grey/60 rounded-xl border border-gray-100 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-bold text-charcoal">Month: {p.month || p.period || 'Current'}</p>
                          <p className="text-[11px] text-text-grey font-semibold">Net Pay: ${p.net_pay?.toLocaleString() || '—'}</p>
                        </div>
                        <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-soft-green text-dark-green uppercase">
                          {p.status || 'Paid'}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
