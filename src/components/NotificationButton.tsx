// src/components/NotificationButton.tsx

import React from 'react';
import { toast } from 'react-toastify';
import { requestNotificationPermission } from '../services/firebase';

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

      // console.log('FCM token registered successfully');
      toast.success('تم تفعيل الإشعارات بنجاح لهذا الجهاز!');
    } catch (error) {
      // console.error('Error registering FCM token:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      toast.error(`فشل تفعيل الإشعارات: ${errorMessage}`);
    }
  };

  const handleEnableNotifications = async (): Promise<void> => {
    // Check for browser support
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
        toast.warn('لم يتم منح إذن الإشعارات. لن تتلقى إشعارات الطلبات.');
      }
    } catch (error) {
      // console.error('Error during notification permission request:', error);
      toast.error('حدث خطأ أثناء طلب إذن الإشعارات.');
    }
  };

  return (
    <></>
    // <button
    //   onClick={handleEnableNotifications}
    //   className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition-colors font-semibold shadow-sm"
    // >
    //   تفعيل الإشعارات
    // </button>
  );
};

export default NotificationButton;