import React, { useState, useEffect } from 'react';
import { useTenant } from '../../lib/auth/TenantProvider';
import { reportService } from '../../services/report.service';
import { Download, FileText, Calendar, Users, Briefcase, DollarSign, BarChart3, Filter } from 'lucide-react';

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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-charcoal tracking-tight flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary-green" />
            <span>Reports Dashboard</span>
          </h2>
          <p className="text-xs sm:text-sm text-text-grey mt-0.5">
            Export and analyze workforce, attendance, leave, and payroll metrics.
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          disabled={data.length === 0 || loading}
          className="inline-flex items-center justify-center space-x-2 bg-primary-green hover:bg-deep-green active:scale-98 text-white px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all disabled:opacity-50 self-start sm:self-auto"
        >
          <Download className="h-4 w-4" />
          <span>Export CSV</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 overflow-hidden">
        {/* Responsive Tab Bar (Scrollable on mobile) */}
        <div className="p-3 bg-light-grey/60 border-b border-gray-200">
          <div className="flex space-x-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as ReportType)}
                  className={`
                    inline-flex items-center px-3.5 py-2 rounded-xl font-semibold text-xs sm:text-sm whitespace-nowrap transition-all flex-shrink-0
                    ${isActive
                      ? 'bg-white text-dark-green shadow-xs border border-gray-200'
                      : 'text-text-grey hover:text-charcoal hover:bg-white/50'
                    }
                  `}
                >
                  <Icon className={`
                    mr-2 h-4 w-4
                    ${isActive ? 'text-primary-green' : 'text-text-grey'}
                  `} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-gray-100 bg-white">
          {activeTab === 'attendance' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg">
              <div>
                <label className="block text-xs font-semibold text-charcoal mb-1">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="block w-full rounded-xl border border-gray-300 px-3 py-2 text-charcoal text-xs sm:text-sm focus:border-primary-green focus:outline-none focus:ring-1 focus:ring-primary-green shadow-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-charcoal mb-1">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="block w-full rounded-xl border border-gray-300 px-3 py-2 text-charcoal text-xs sm:text-sm focus:border-primary-green focus:outline-none focus:ring-1 focus:ring-primary-green shadow-xs"
                />
              </div>
            </div>
          )}

          {activeTab === 'leave' && (
            <div className="max-w-xs">
              <label className="block text-xs font-semibold text-charcoal mb-1">Year</label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value))}
                className="block w-full rounded-xl border border-gray-300 px-3 py-2 text-charcoal text-xs sm:text-sm focus:border-primary-green focus:outline-none focus:ring-1 focus:ring-primary-green shadow-xs"
              />
            </div>
          )}

          {['employee', 'work', 'payroll'].includes(activeTab) && (
            <div className="flex items-center space-x-2 text-xs sm:text-sm text-text-grey bg-light-grey/60 p-3 rounded-xl border border-gray-100">
              <Filter className="h-4 w-4 text-primary-green flex-shrink-0" />
              <span>
                Showing complete historical records for <strong className="text-charcoal font-semibold">{tabs.find(t => t.id === activeTab)?.label}</strong>. Use CSV export for customized filtering.
              </span>
            </div>
          )}
        </div>

        {/* Data Display */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-10 text-center text-text-grey text-sm">Loading report data...</div>
          ) : data.length === 0 ? (
            <div className="p-10 text-center text-text-grey text-sm">
              No data records found for this report.
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-light-grey">
                <tr>
                  {Object.keys(data[0]).map((header) => (
                    <th
                      key={header}
                      className="px-6 py-3.5 text-left text-xs font-bold text-text-grey uppercase tracking-wider whitespace-nowrap"
                    >
                      {header.replace(/_/g, ' ')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {data.map((row, idx) => (
                  <tr key={idx} className="hover:bg-light-grey/50 transition-colors">
                    {Object.values(row).map((val: any, colIdx) => (
                      <td key={colIdx} className="px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-charcoal font-medium">
                        {val?.toString() || '—'}
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

