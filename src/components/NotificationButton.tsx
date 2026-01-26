// src/components/NotificationButton.tsx

import React from 'react';
import { toast } from 'react-toastify';
import { requestNotificationPermission } from '../services/firebase';
import { Bell } from 'lucide-react';

const apiUrl = import.meta.env.VITE_API_BASE_URL;

const NotificationButton: React.FC = () => {
  const registerFCMToken = async (token: string): Promise<void> => {
    try {
      console.log('🔐 Registering FCM token with backend...');
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        throw new Error('No access token found. Please log in again.');
      }

      console.log('📡 Sending token to:', `${apiUrl}/api/notification/register`);
      const response = await fetch(`${apiUrl}/api/notification/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ token }),
      });

      console.log('📥 Backend response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Backend error response:', errorData);
        throw new Error(errorData.message || 'Failed to register notification token');
      }

      const successData = await response.json();
      console.log('✅ Token registered successfully:', successData);
      toast.success('تم تفعيل الإشعارات بنجاح لهذا الجهاز!');
    } catch (error) {
      console.error('❌ Error in registerFCMToken:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'An unknown error occurred';
      toast.error(`فشل تفعيل الإشعارات: ${errorMessage}`);
    }
  };

  const handleEnableNotifications = async (): Promise<void> => {
    console.log('🔔 Enable notifications button clicked');

    if (!('Notification' in window)) {
      console.error('❌ Browser does not support notifications');
      toast.error('هذا المتصفح لا يدعم الإشعارات.');
      return;
    }

    console.log('📋 Current notification permission:', Notification.permission);

    // If permission is denied, user must manually change browser settings
    if (Notification.permission === 'denied') {
      console.warn('⚠️ Notification permission denied');
      toast.error('تم رفض إذن الإشعارات. يرجى تفعيله يدوياً من إعدادات المتصفح.');
      return;
    }

    try {
      // Request permission and get token (works for both 'default' and 'granted' states)
      const token = await requestNotificationPermission();

      if (token) {
        console.log('✅ Token generated, attempting to register with backend...');
        await registerFCMToken(token);
      } else {
        console.warn('⚠️ No token generated - permission may have been denied');
        toast.warn('لم يتم منح إذن الإشعارات.');
      }
    } catch (error) {
      console.error('❌ Error in handleEnableNotifications:', error);
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
