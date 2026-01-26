// src/components/NotificationButton.tsx

import React, { useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { requestNotificationPermission } from '../services/firebase';
import { Bell, Loader2 } from 'lucide-react';

const apiUrl = import.meta.env.VITE_API_BASE_URL;

const NotificationButton: React.FC = () => {
  const [loading, setLoading] = useState(false);

  const permission = useMemo(() => {
    if (!('Notification' in window)) return 'unsupported' as const;
    return Notification.permission; // 'default' | 'granted' | 'denied'
  }, [loading]);

  const isDenied = permission === 'denied';
  const isUnsupported = permission === 'unsupported';

  const registerFCMToken = async (token: string): Promise<void> => {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) throw new Error('No access token found. Please log in again.');
    if (!apiUrl) throw new Error('API base URL is not configured.');

    const response = await fetch(`${apiUrl}/api/notification/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      let msg = 'Failed to register notification token';
      try {
        const errorData = await response.json();
        msg = errorData?.message || msg;
      } catch {}
      throw new Error(msg);
    }
  };

  const handleEnableNotifications = async (): Promise<void> => {
    if (loading) return;

    if (!('Notification' in window)) {
      toast.error('هذا المتصفح لا يدعم الإشعارات.');
      return;
    }

    if (Notification.permission === 'denied') {
      toast.error('تم رفض إذن الإشعارات. فعّله يدوياً من إعدادات المتصفح.');
      return;
    }

    try {
      setLoading(true);

      // لو permission already granted، دي غالبًا هترجع token عادي
      const token = await requestNotificationPermission();

      if (!token) {
        toast.warn('لم يتم الحصول على توكن الإشعارات.');
        return;
      }

      await registerFCMToken(token);
      toast.success('تم تفعيل/تحديث الإشعارات لهذا الجهاز ✅');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'حدث خطأ غير معروف';
      toast.error(`فشل تفعيل الإشعارات: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const mobileTitle = isUnsupported
    ? 'الإشعارات غير مدعومة'
    : isDenied
    ? 'الإشعارات مرفوضة (فعّلها من إعدادات المتصفح)'
    : 'تفعيل/تحديث الإشعارات';

  return (
    <div className="flex items-center">
      {/* Mobile: icon button */}
      <button
        onClick={handleEnableNotifications}
        disabled={loading || isDenied || isUnsupported}
        title={mobileTitle}
        aria-label={mobileTitle}
        className={`
          md:hidden
          relative
          h-11 w-11
          rounded-xl
          border-2 border-[#E5DCC5]
          bg-white
          shadow-sm
          transition-all duration-200
          hover:bg-[#FAF9F6]
          active:scale-95
          disabled:opacity-60 disabled:cursor-not-allowed
        `}
      >
        <span className="absolute inset-0 rounded-xl ring-1 ring-black/5" />
        <span className="flex h-full w-full items-center justify-center">
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin text-[#8B7355]" />
          ) : (
            <Bell className="h-5 w-5 text-[#8B7355]" />
          )}
        </span>
        {/* accent dot (always) */}
        {!loading && !isDenied && !isUnsupported && (
          <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-[#D4AF37] ring-2 ring-white" />
        )}
      </button>

      {/* Desktop: full button */}
      <button
        onClick={handleEnableNotifications}
        disabled={loading || isDenied || isUnsupported}
        className={`
          hidden md:flex
          items-center gap-2
          px-5 py-2.5 rounded-xl
          font-semibold shadow-md
          transition-all duration-200
          active:scale-95
          disabled:opacity-60 disabled:cursor-not-allowed
          bg-gradient-to-r from-emerald-500 to-teal-500
          text-white
          hover:from-emerald-600 hover:to-teal-600
        `}
        style={{ fontFamily: 'Tajawal, sans-serif' }}
      >
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Bell className="w-5 h-5" />}
        تفعيل/تحديث الإشعارات
      </button>
    </div>
  );
};

export default NotificationButton;
