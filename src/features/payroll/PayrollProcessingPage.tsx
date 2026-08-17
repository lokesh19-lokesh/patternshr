import React, { useEffect, useState } from 'react';
import { useTenant } from '../../lib/auth/TenantProvider';
import { payrollService } from '../../services/payroll.service';
import type { PayrollRun, Payslip } from '../../services/payroll.service';

export const PayrollProcessingPage: React.FC = () => {
  const { company } = useTenant();
  const [runs, setRuns] = useState<PayrollRun[]>([]);
  
  const [selectedRun, setSelectedRun] = useState<PayrollRun | null>(null);
  const [payslips, setPayslips] = useState<Payslip[]>([]);

  // Form State
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [processing, setProcessing] = useState(false);

  const loadRuns = async () => {
    if (!company) return;
    try {
      const data = await payrollService.getPayrollRuns(company.id);
      setRuns(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadRuns();
  }, [company]);

  const handleRunPayroll = async () => {
    if (!company) return;
    try {
      setProcessing(true);
      // 1. Create Run
      const run = await payrollService.createPayrollRun(company.id, month, year);
      
      // 2. Generate Payslips
      await payrollService.generateDraftPayslips(company.id, run.id);
      
      // 3. Update Status
      await payrollService.updatePayrollRunStatus(run.id, 'processing');
      
      await loadRuns();
      handleSelectRun({ ...run, status: 'processing' });
    } catch (err) {
      console.error(err);
      alert('Failed to run payroll');
    } finally {
      setProcessing(false);
    }
  };

  const handleSelectRun = async (run: PayrollRun) => {
    setSelectedRun(run);
    try {
      const data = await payrollService.getPayslipsForRun(run.id);
      setPayslips(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleApprove = async () => {
    if (!selectedRun) return;
    try {
      await payrollService.updatePayrollRunStatus(selectedRun.id, 'approved');
      const updatedRun = { ...selectedRun, status: 'approved' } as PayrollRun;
      setSelectedRun(updatedRun);
      setRuns(runs.map(r => r.id === updatedRun.id ? updatedRun : r));
    } catch (err) {
      console.error(err);
      alert('Failed to approve');
    }
  };

  const handleLock = async () => {
    if (!selectedRun) return;
    try {
      await payrollService.updatePayrollRunStatus(selectedRun.id, 'paid');
      const updatedRun = { ...selectedRun, status: 'paid' } as PayrollRun;
      setSelectedRun(updatedRun);
      setRuns(runs.map(r => r.id === updatedRun.id ? updatedRun : r));
    } catch (err) {
      console.error(err);
      alert('Failed to lock');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Payroll Processing</h2>
          <p className="mt-1 text-sm text-gray-500">Run and manage monthly payroll cycles.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Runs & Generator */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Run New Payroll</h3>
            <div className="flex space-x-4 mb-4">
              <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                {Array.from({length: 12}, (_, i) => i + 1).map(m => (
                  <option key={m} value={m}>{new Date(0, m - 1).toLocaleString('default', { month: 'long' })}</option>
                ))}
              </select>
              <input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
            </div>
            <button 
              onClick={handleRunPayroll} 
              disabled={processing}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium text-sm disabled:opacity-50"
            >
              {processing ? 'Processing...' : 'Run Payroll Engine'}
            </button>
          </div>

          <div className="bg-white shadow rounded-lg overflow-hidden h-[450px] flex flex-col">
            <div className="p-4 border-b bg-gray-50 font-medium">Payroll History</div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {runs.map(run => (
                <div 
                  key={run.id}
                  onClick={() => handleSelectRun(run)}
                  className={`p-3 rounded-md cursor-pointer border ${selectedRun?.id === run.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{new Date(0, run.month - 1).toLocaleString('default', { month: 'short' })} {run.year}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                      run.status === 'paid' ? 'bg-green-100 text-green-800' :
                      run.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {run.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Payslip Detail */}
        <div className="lg:col-span-2 bg-white shadow rounded-lg h-[650px] flex flex-col">
          {!selectedRun ? (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              Select a payroll run to view details
            </div>
          ) : (
            <>
              <div className="p-6 border-b flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {new Date(0, selectedRun.month - 1).toLocaleString('default', { month: 'long' })} {selectedRun.year}
                  </h3>
                  <p className="text-sm text-gray-500">Total Payslips: {payslips.length}</p>
                </div>
                <div className="space-x-2">
                  {selectedRun.status === 'processing' && (
                    <button onClick={handleApprove} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-medium">
                      Approve Run
                    </button>
                  )}
                  {selectedRun.status === 'approved' && (
                    <button onClick={handleLock} className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm font-medium">
                      Lock & Publish (Mark Paid)
                    </button>
                  )}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Basic</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase text-green-600">Earnings</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase text-red-600">Deductions</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Net Pay</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {payslips.map(ps => (
                      <tr key={ps.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {ps.employee?.first_name} {ps.employee?.last_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                          ${ps.basic_salary.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 text-right font-medium">
                          ${ps.total_earnings.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 text-right font-medium">
                          ${ps.total_deductions.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-bold">
                          ${ps.net_salary.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                    {payslips.length > 0 && (
                      <tr className="bg-gray-50 font-bold">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">TOTAL</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          ${payslips.reduce((acc, ps) => acc + ps.basic_salary, 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 text-right">
                          ${payslips.reduce((acc, ps) => acc + ps.total_earnings, 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 text-right">
                          ${payslips.reduce((acc, ps) => acc + ps.total_deductions, 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          ${payslips.reduce((acc, ps) => acc + ps.net_salary, 0).toLocaleString()}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
