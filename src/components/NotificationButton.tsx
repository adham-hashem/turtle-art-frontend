// src/components/NotificationButton.tsx

import React from 'react';
import { toast } from 'react-toastify';
import { requestNotificationPermission } from '../services/firebase';
import { Bell } from 'lucide-react';

const apiUrl = import.meta.env.VITE_API_BASE_URL;

const NotificationButton: React.FC = () => {
  const registerFCMToken = async (token: string): Promise<void> => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        throw new Error('No access token found. Please log in again.');
      }

      const response = await fetch(`${apiUrl}/api/notification/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to register notification token');
      }

      toast.success('تم تفعيل الإشعارات بنجاح لهذا الجهاز!');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'An unknown error occurred';
      toast.error(`فشل تفعيل الإشعارات: ${errorMessage}`);
    }
  };

  const handleEnableNotifications = async (): Promise<void> => {
    if (!('Notification' in window)) {
      toast.error('هذا المتصفح لا يدعم الإشعارات.');
      return;
    }

    if (Notification.permission === 'granted') {
      toast.info('الإشعارات مفعلة بالفعل على هذا الجهاز.');
      return;
    }

    if (Notification.permission === 'denied') {
      toast.error('تم رفض إذن الإشعارات. يرجى تفعيله يدوياً من إعدادات المتصفح.');
      return;
    }

    try {
      const token = await requestNotificationPermission();
      if (token) {
        await registerFCMToken(token);
      } else {
        toast.warn('لم يتم منح إذن الإشعارات.');
      }
    } catch {
      toast.error('حدث خطأ أثناء طلب إذن الإشعارات.');
    }
  };

  return (
    <button
      onClick={handleEnableNotifications}
      className="
        flex items-center gap-2
        bg-gradient-to-r from-emerald-500 to-teal-500
        text-white px-5 py-2.5 rounded-xl
        font-semibold shadow-md
        hover:from-emerald-600 hover:to-teal-600
        active:scale-95 transition-all duration-200
      "
    >
      <Bell className="w-5 h-5" />
      تفعيل الإشعارات
    </button>
  );
};

export default NotificationButton;
