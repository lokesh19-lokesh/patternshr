import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  Briefcase,
  FileText,
  Clock,
  Calendar,
  ClipboardList,
  DollarSign,
  BarChart,
  CreditCard
} from 'lucide-react';
import { useTenant } from '../../lib/auth/TenantProvider';

export const Sidebar: React.FC = () => {
  const { role } = useTenant();
  const normalizedRole = role?.name?.toLowerCase() || '';
  const isAdminOrHr = normalizedRole.includes('admin') || normalizedRole.includes('hr') || normalizedRole.includes('owner');
  const isManager = normalizedRole.includes('manager') || isAdminOrHr;

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, visible: true },
    { name: 'Attendance', href: '/dashboard/attendance', icon: Clock, visible: true },
    { name: 'Time Off', href: '/dashboard/leave', icon: Calendar, visible: true },
    { name: 'Work Reports', href: '/dashboard/work', icon: ClipboardList, visible: true },
    { name: 'Payroll', href: '/dashboard/payroll', icon: DollarSign, visible: true },
    { name: 'Employees', href: '/dashboard/employees', icon: Users, visible: isManager },
    { name: 'Departments', href: '/dashboard/departments', icon: Building2, visible: isAdminOrHr },
    { name: 'Designations', href: '/dashboard/designations', icon: Briefcase, visible: isAdminOrHr },
    { name: 'Documents', href: '/dashboard/documents', icon: FileText, visible: isAdminOrHr },
    { name: 'Reports', href: '/dashboard/reports', icon: BarChart, visible: isAdminOrHr },
    { name: 'Billing', href: '/dashboard/billing', icon: CreditCard, visible: isAdminOrHr },
  ].filter(item => item.visible);

  return (
    <div className="flex h-full w-64 flex-col bg-white border-r border-gray-200">
      <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
        <nav className="mt-5 flex-1 space-y-1 bg-white px-2">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              end={item.href === '/dashboard'}
              className={({ isActive }) =>
                `group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                  isActive
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              <item.icon
                className="mr-3 h-5 w-5 flex-shrink-0"
                aria-hidden="true"
              />
              {item.name}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
};
