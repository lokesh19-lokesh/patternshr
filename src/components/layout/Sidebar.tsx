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
  CreditCard,
  X,
  ShieldCheck
} from 'lucide-react';
import { useTenant } from '../../lib/auth/TenantProvider';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose = () => {} }) => {
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

  const NavContent = () => (
    <div className="flex h-full flex-col bg-white border-r border-gray-200">
      {/* Brand Header */}
      <div className="flex items-center justify-between h-20 px-5 border-b border-gray-100 bg-white">
        <NavLink to="/dashboard" className="flex items-center py-1">
          <img
            src="/logo.png"
            alt="Patterns HR"
            className="h-12 max-h-14 w-auto object-contain transition-transform hover:scale-105"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        </NavLink>
        <button
          onClick={onClose}
          className="lg:hidden text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Close sidebar"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            end={item.href === '/dashboard'}
            onClick={() => {
              if (window.innerWidth < 1024) onClose();
            }}
            className={({ isActive }) =>
              `group flex items-center px-3 py-2.5 text-sm font-semibold rounded-xl transition-all ${
                isActive
                  ? 'bg-blue-50 text-blue-600 shadow-xs'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <item.icon
              className="mr-3 h-4 w-4 flex-shrink-0 transition-transform group-hover:scale-110"
              aria-hidden="true"
            />
            <span>{item.name}</span>
          </NavLink>
        ))}
      </div>

      {/* Footer Role Badge */}
      <div className="p-4 border-t border-gray-100 bg-gray-50/50">
        <div className="flex items-center space-x-2 text-xs text-gray-600 font-medium">
          <ShieldCheck className="h-4 w-4 text-blue-600 flex-shrink-0" />
          <span className="truncate">{role?.name || 'Authorized User'}</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:flex-shrink-0">
        <NavContent />
      </aside>

      {/* Mobile & Tablet Slide-over Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop Blur Overlay */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-300"
            onClick={onClose}
          />

          {/* Drawer Panel */}
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white shadow-2xl z-10 transform transition duration-300 ease-in-out">
            <NavContent />
          </div>
        </div>
      )}
    </>
  );
};
