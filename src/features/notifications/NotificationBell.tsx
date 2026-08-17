import React, { useEffect, useState, useRef } from 'react';
import { Bell } from 'lucide-react';
import { useAuth } from '../../lib/auth/AuthProvider';
import { notificationService } from '../../services/notification.service';
import type { AppNotification } from '../../services/notification.service';

export const NotificationBell: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;

    // Load initial notifications
    const loadNotifications = async () => {
      try {
        const data = await notificationService.getNotifications(user.id);
        setNotifications(data);
      } catch (err) {
        console.error(err);
      }
    };
    loadNotifications();

    // Subscribe to new notifications
    const unsubscribe = notificationService.subscribe(user.id, (newNotification: AppNotification) => {
      setNotifications((prev) => [newNotification, ...prev]);
    });

    return () => {
      unsubscribe();
    };
  }, [user]);

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user) return;
    try {
      await notificationService.markAllAsRead(user.id);
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-400 hover:text-gray-600 focus:outline-none"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform bg-red-600 rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 z-50">
          <div className="px-4 py-2 border-b flex justify-between items-center bg-gray-50 rounded-t-md">
            <h3 className="text-sm font-semibold text-gray-800">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAllAsRead}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Mark all as read
              </button>
            )}
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-gray-500">
                You have no notifications.
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <li 
                    key={notification.id} 
                    className={`px-4 py-3 hover:bg-gray-50 cursor-pointer transition duration-150 ease-in-out ${!notification.is_read ? 'bg-blue-50/50' : ''}`}
                    onClick={() => {
                      if (!notification.is_read) {
                        handleMarkAsRead(notification.id);
                      }
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <p className={`text-sm ${!notification.is_read ? 'font-semibold text-gray-900' : 'text-gray-800'}`}>
                        {notification.title}
                      </p>
                      {!notification.is_read && <span className="w-2 h-2 bg-blue-600 rounded-full mt-1.5 flex-shrink-0"></span>}
                    </div>
                    <p className={`text-sm mt-1 line-clamp-2 ${!notification.is_read ? 'text-gray-700' : 'text-gray-500'}`}>
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(notification.created_at).toLocaleString()}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
