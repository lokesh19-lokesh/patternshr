import React, { useState, useEffect } from 'react';
import { useTenant } from '../../lib/auth/TenantProvider';
import { reportService } from '../../services/report.service';
import { Download, FileText, Calendar, Users, Briefcase, DollarSign } from 'lucide-react';

type ReportType = 'employee' | 'attendance' | 'leave' | 'payroll' | 'work';

export const ReportsDashboard: React.FC = () => {
  const { company } = useTenant();
  const [activeTab, setActiveTab] = useState<ReportType>('employee');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [startDate, setStartDate] = useState(new Date(new Date().setDate(1)).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    if (company) {
      loadReport();
    }
  }, [activeTab, company, startDate, endDate, year]);

  const loadReport = async () => {
    if (!company) return;
    setLoading(true);
    try {
      let result = [];
      switch (activeTab) {
        case 'employee':
          result = await reportService.getEmployeeReport(company.id);
          break;
        case 'attendance':
          result = await reportService.getAttendanceReport(company.id, startDate, endDate);
          break;
        case 'leave':
          result = await reportService.getLeaveReport(company.id, year);
          break;
        case 'work':
          result = await reportService.getWorkReportSummary(company.id);
          break;
        case 'payroll':
          result = await reportService.getPayrollReport(company.id);
          break;
      }
      setData(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (data.length === 0) return;
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => {
        const val = row[header];
        return typeof val === 'string' && val.includes(',') ? `"${val}"` : val;
      }).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${activeTab}_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const tabs = [
    { id: 'employee', label: 'Employees', icon: Users },
    { id: 'attendance', label: 'Attendance', icon: Calendar },
    { id: 'leave', label: 'Leave', icon: FileText },
    { id: 'work', label: 'Work Reports', icon: Briefcase },
    { id: 'payroll', label: 'Payroll', icon: DollarSign },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Reports Dashboard</h2>
        <button
          onClick={handleExportCSV}
          disabled={data.length === 0 || loading}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
        >
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as ReportType)}
                  className={`
                    group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm
                    ${activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className={`
                    -ml-0.5 mr-2 h-5 w-5
                    ${activeTab === tab.id ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'}
                  `} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center space-x-4">
          {activeTab === 'attendance' && (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-700">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </>
          )}
          {activeTab === 'leave' && (
            <div>
              <label className="block text-xs font-medium text-gray-700">Year</label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value))}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          )}
          {['employee', 'work', 'payroll'].includes(activeTab) && (
            <div className="text-sm text-gray-500">
              Showing complete historical data for {tabs.find(t => t.id === activeTab)?.label}. Use CSV export for advanced filtering.
            </div>
          )}
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading data...</div>
          ) : data.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No data found for this report.</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {Object.keys(data[0]).map((header) => (
                    <th
                      key={header}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    {Object.values(row).map((val: any, colIdx) => (
                      <td key={colIdx} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {val?.toString() || '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
