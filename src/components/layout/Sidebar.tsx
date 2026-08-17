import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  Briefcase,
  FileText,
  Clock,
  Calendar
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Attendance', href: '/dashboard/attendance', icon: Clock },
  { name: 'Time Off', href: '/dashboard/leave', icon: Calendar },
  { name: 'Employees', href: '/dashboard/employees', icon: Users },
  { name: 'Departments', href: '/dashboard/departments', icon: Building2 },
  { name: 'Designations', href: '/dashboard/designations', icon: Briefcase },
  { name: 'Documents', href: '/dashboard/documents', icon: FileText },
];

export const Sidebar: React.FC = () => {
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
