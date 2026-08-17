import React, { useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth/AuthProvider';
import { useTenant } from '../../lib/auth/TenantProvider';
import { employeeService } from '../../services/employee.service';
import type { Employee } from '../../services/employee.service';
import { payrollService } from '../../services/payroll.service';
import { AlertCircle, Download } from 'lucide-react';
import { generatePayslipPDF } from '../../lib/pdf';

export const MyPayslipsPage: React.FC = () => {
  const { user } = useAuth();
  const { company } = useTenant();
  
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [payslips, setPayslips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!company || !user) return;
      try {
        setLoading(true);
        const emp = await employeeService.getCurrentEmployee(company.id, user.id);
        setEmployee(emp);

        if (emp) {
          // Fetch all payslips for this employee
          const data = await payrollService.getMyPayslips(emp.id);
          // Filter to only show payslips from 'paid' runs
          setPayslips(data.filter(ps => ps.run?.status === 'paid'));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [company, user]);

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading payslips...</div>;
  }

  if (!employee) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 flex flex-col items-center">
        <AlertCircle className="h-10 w-10 text-yellow-500 mb-2" />
        <h3 className="text-lg font-medium text-yellow-800">No Employee Profile Found</h3>
        <p className="text-yellow-700 mt-1">Your account is not linked to an employee profile.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Payslips</h2>
          <p className="mt-1 text-sm text-gray-500">View and download your official salary slips.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {payslips.length === 0 ? (
          <div className="col-span-full p-8 text-center bg-white rounded-lg shadow border border-gray-100 text-gray-500">
            No published payslips available yet.
          </div>
        ) : (
          payslips.map(ps => (
            <div key={ps.id} className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {new Date(0, ps.run.month - 1).toLocaleString('default', { month: 'long' })} {ps.run.year}
                  </h3>
                  <p className="text-xs text-gray-500">Issued by {company?.name}</p>
                </div>
                <button 
                  onClick={() => generatePayslipPDF(ps, company?.name || 'Company')}
                  className="p-2 text-gray-400 hover:text-blue-600 rounded-full hover:bg-blue-50 transition-colors" 
                  title="Download PDF"
                >
                  <Download className="w-5 h-5" />
                </button>
              </div>
              <div className="px-6 py-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Basic Salary</span>
                  <span className="font-medium text-gray-900">${ps.basic_salary.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Gross Earnings</span>
                  <span className="font-medium text-green-600">${ps.total_earnings.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Total Deductions</span>
                  <span className="font-medium text-red-600">-${ps.total_deductions.toLocaleString()}</span>
                </div>
                <div className="pt-3 mt-3 border-t border-gray-100 flex justify-between items-center">
                  <span className="font-bold text-gray-900">Net Pay</span>
                  <span className="text-xl font-bold text-blue-600">${ps.net_salary.toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
