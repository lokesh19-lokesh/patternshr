import React, { useEffect, useState, useRef } from 'react';
import { Bell, MessageSquare, FileText, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/auth/AuthProvider';
import { notificationService } from '../../services/notification.service';
import type { AppNotification } from '../../services/notification.service';

export const NotificationBell: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
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

  const handleNotificationClick = async (notification: AppNotification) => {
    if (!notification.is_read) {
      handleMarkAsRead(notification.id);
    }
    setIsOpen(false);

    // Route depending on notification type
    if (notification.type === 'chat_message' || notification.type === 'announcement') {
      navigate('/dashboard/chat');
    } else if (notification.type === 'report_reply' || notification.type === 'report_submitted') {
      navigate('/dashboard/work/reviews');
    } else if (notification.type === 'report_feedback' || notification.type === 'report_status') {
      navigate('/dashboard/work');
    } else if (notification.type === 'leave_update') {
      navigate('/dashboard/leaves');
    } else if (notification.type === 'leave_request') {
      navigate('/dashboard/leaves/approvals');
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-500 hover:text-charcoal hover:bg-light-grey rounded-xl transition-all focus:outline-none"
        title="Notifications"
      >
        <Bell className="h-5 w-5 sm:h-6 sm:w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-black leading-none text-white transform bg-red-500 rounded-full shadow-xs animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl py-1 ring-1 ring-black/5 z-50 border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-light-grey/60">
            <h3 className="text-xs sm:text-sm font-bold text-charcoal flex items-center space-x-1.5">
              <span>Notifications</span>
              {unreadCount > 0 && (
                <span className="bg-primary-green/10 text-primary-green px-1.5 py-0.5 rounded-full text-[11px] font-semibold">
                  {unreadCount} new
                </span>
              )}
            </h3>
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAllAsRead}
                className="text-xs font-bold text-primary-green hover:text-deep-green transition-colors"
              >
                Mark all as read
              </button>
            )}
          </div>
          
          <div className="max-h-96 overflow-y-auto divide-y divide-gray-100">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-xs sm:text-sm text-text-grey">
                You have no notifications.
              </div>
            ) : (
              notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={`px-4 py-3.5 hover:bg-light-grey/60 cursor-pointer transition-all flex items-start space-x-3 ${!notification.is_read ? 'bg-soft-green/30' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="mt-0.5 p-1.5 rounded-lg bg-light-grey text-charcoal flex-shrink-0">
                    {notification.type.includes('feedback') || notification.type.includes('reply') ? (
                      <MessageSquare className="h-4 w-4 text-primary-green" />
                    ) : notification.type.includes('report') ? (
                      <FileText className="h-4 w-4 text-blue-600" />
                    ) : (
                      <Clock className="h-4 w-4 text-amber-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <p className={`text-xs sm:text-sm truncate ${!notification.is_read ? 'font-bold text-charcoal' : 'font-medium text-text-grey'}`}>
                        {notification.title}
                      </p>
                      {!notification.is_read && <span className="w-2 h-2 bg-primary-green rounded-full mt-1.5 ml-2 flex-shrink-0"></span>}
                    </div>
                    <p className={`text-xs mt-0.5 line-clamp-2 leading-relaxed ${!notification.is_read ? 'text-charcoal font-medium' : 'text-text-grey'}`}>
                      {notification.message}
                    </p>
                    <p className="text-[10px] text-text-grey mt-1 font-semibold">
                      {new Date(notification.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
