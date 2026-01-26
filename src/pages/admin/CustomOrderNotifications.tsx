import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Bell, X, Check, Sparkles, Calendar, AlertCircle } from 'lucide-react';

// CustomOrderNotification interface matching your backend response
interface CustomOrderNotification {
  id: string;
  customOrderId: string;
  title: string;
  body: string;
  sentAt: string;
  success: boolean;
  errorMessage: string | null;
  isRead: boolean;
}

interface PaginatedNotificationsResponse {
  items: CustomOrderNotification[];
  totalItems: number;
  pageNumber: number;
  pageSize: number;
  totalPages?: number; // some backends don't return it
}

const apiUrl = import.meta.env.VITE_API_BASE_URL;

const CustomOrderNotifications: React.FC = () => {
  const { isAuthenticated } = useAuth();

  const [notifications, setNotifications] = useState<CustomOrderNotification[]>([]);
  const [selectedNotification, setSelectedNotification] = useState<CustomOrderNotification | null>(null);

  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [pageNumber, setPageNumber] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const pageSize = 10;

  const formatNotificationBody = (body: string) => {
    // keep your style - optional
    return body.replace(/\$/g, 'جنية مصري ');
  };

  const getTokenOrThrow = () => {
    const token = localStorage.getItem('accessToken');
    if (!token) throw new Error('No access token found. Please log in again.');
    return token;
  };

  const calcTotalPages = (data: PaginatedNotificationsResponse) => {
    if (typeof data.totalPages === 'number' && data.totalPages >= 1) return data.totalPages;
    // fallback (like your original component): compute from totalItems
    return Math.max(1, Math.ceil((data.totalItems || 0) / pageSize));
  };

  const fetchNotifications = async (page: number, firstLoad = false) => {
    try {
      if (!apiUrl) throw new Error('API base URL is not configured.');
      const token = getTokenOrThrow();

      if (firstLoad) setLoading(true);
      else setFetching(true);

      setError(null);

      const res = await fetch(
        `${apiUrl}/api/custom-order-notifications?pageNumber=${page}&pageSize=${pageSize}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          throw new Error('Unauthorized: Please log in again.');
        }
        const t = await res.text();
        throw new Error(`Failed to fetch notifications: ${res.status} ${t}`);
      }

      const data: PaginatedNotificationsResponse = await res.json();

      if (!Array.isArray(data.items)) {
        setNotifications([]);
        throw new Error('Invalid response format: Expected an array of notifications.');
      }

      const mapped = data.items.map((item) => ({
        ...item,
        isRead: item.isRead ?? false,
        errorMessage: item.errorMessage ?? null,
      }));

      setNotifications(mapped);
      setTotalPages(calcTotalPages(data));
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching notifications.');
      setNotifications([]);
    } finally {
      setLoading(false);
      setFetching(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications(pageNumber, true);
    } else {
      setError('You must be logged in to view notifications.');
      setLoading(false);
      setNotifications([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications(pageNumber, pageNumber === 1 && notifications.length === 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageNumber]);

  const handleViewNotification = (notification: CustomOrderNotification) => {
    setSelectedNotification(notification);
  };

  const handleCloseDetails = () => {
    setSelectedNotification(null);
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      if (!apiUrl) throw new Error('API base URL is not configured.');
      const token = getTokenOrThrow();

      // optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
      );
      if (selectedNotification?.id === notificationId) {
        setSelectedNotification({ ...selectedNotification, isRead: true });
      }

      const res = await fetch(`${apiUrl}/api/custom-order-notifications/${notificationId}/mark-read`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        const t = await res.text();
        throw new Error(`Failed to mark notification as read: ${res.status} ${t}`);
      }
    } catch (err: any) {
      // rollback by refetch (safe)
      setError(
        err.message ||
          'An error occurred while marking notification as read. Please try again or contact support.'
      );
      fetchNotifications(pageNumber, false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ar-EG', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B7355]"></div>
        <span className="mr-3 text-[#8B7355] font-medium" style={{ fontFamily: 'Tajawal, sans-serif' }}>
          جاري تحميل الإشعارات...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10 text-red-600 bg-red-50 border-2 border-red-200 rounded-2xl">
        <div className="text-5xl mb-4">⚠️</div>
        <p className="font-semibold" style={{ fontFamily: 'Tajawal, sans-serif' }}>
          {error}
        </p>
      </div>
    );
  }

  return (
    <div dir="rtl">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-[#F5F5DC] to-[#E5DCC5] p-3 rounded-xl relative border-2 border-[#E5DCC5]">
            <Bell className="h-6 w-6 text-[#8B7355]" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[#8B7355]" style={{ fontFamily: 'Tajawal, sans-serif' }}>
              إشعارات الطلبات الخاصة
            </h2>
            <p className="text-sm text-[#C4A57B]" style={{ fontFamily: 'Tajawal, sans-serif' }}>
              {unreadCount > 0 ? `${unreadCount} إشعار غير مقروء` : 'جميع الإشعارات مقروءة'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchNotifications(pageNumber, false)}
            disabled={fetching}
            className="px-4 py-2 rounded-xl border-2 border-[#E5DCC5] bg-white text-[#8B7355] font-semibold hover:bg-[#FAF9F6] transition-all disabled:opacity-60"
            style={{ fontFamily: 'Tajawal, sans-serif' }}
            title="تحديث"
          >
            {fetching ? '...جاري التحديث' : 'تحديث'}
          </button>
          <Sparkles className="h-8 w-8 text-[#D4AF37] animate-pulse" />
        </div>
      </div>

      {selectedNotification ? (
        // Details View
        <div className="mb-6 p-6 bg-gradient-to-br from-white to-[#FAF9F6] rounded-2xl shadow-xl border-2 border-[#E5DCC5]">
          <div className="flex items-center justify-between mb-6">
            <h3
              className="text-xl font-bold text-[#8B7355] flex items-center gap-2"
              style={{ fontFamily: 'Tajawal, sans-serif' }}
            >
              <Bell className="h-5 w-5 text-[#D4AF37]" />
              تفاصيل الإشعار
            </h3>
            <button
              onClick={handleCloseDetails}
              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-white rounded-xl border-2 border-[#E5DCC5]">
              <span className="text-sm text-[#8B7355]/70 block mb-1" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                العنوان
              </span>
              <p className="font-semibold text-[#8B7355] text-lg" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                {selectedNotification.title}
              </p>
            </div>

            <div className="p-4 bg-white rounded-xl border-2 border-[#E5DCC5]">
              <span className="text-sm text-[#8B7355]/70 block mb-1" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                الرسالة
              </span>
              <p className="text-[#8B7355]" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                {formatNotificationBody(selectedNotification.body)}
              </p>
            </div>

            <div className="flex items-center gap-3 p-4 bg-white rounded-xl border-2 border-[#E5DCC5]">
              <Calendar className="h-5 w-5 text-[#D4AF37]" />
              <div className="flex-1">
                <span className="text-sm text-[#8B7355]/70 block" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                  تاريخ الإرسال
                </span>
                <p className="font-semibold text-[#8B7355]" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                  {formatDate(selectedNotification.sentAt)}
                </p>
              </div>
            </div>

            <div className="p-4 bg-white rounded-xl border-2 border-[#E5DCC5]">
              <span className="text-sm text-[#8B7355]/70 block mb-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                الحالة
              </span>

              <div className="flex flex-wrap gap-2">
                <span
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${
                    selectedNotification.isRead ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                  }`}
                  style={{ fontFamily: 'Tajawal, sans-serif' }}
                >
                  {selectedNotification.isRead ? <Check className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
                  {selectedNotification.isRead ? 'مقروء' : 'غير مقروء'}
                </span>

                <span
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${
                    selectedNotification.success ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                  }`}
                  style={{ fontFamily: 'Tajawal, sans-serif' }}
                >
                  {selectedNotification.success ? '✓ تم الإرسال' : '✗ فشل الإرسال'}
                </span>

                <span
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold bg-[#F5F5DC] text-[#8B7355] border border-[#E5DCC5]"
                  style={{ fontFamily: 'Tajawal, sans-serif' }}
                  title={selectedNotification.customOrderId}
                >
                  رقم الطلب: {selectedNotification.customOrderId.slice(0, 8)}...
                </span>
              </div>
            </div>

            {selectedNotification.errorMessage && (
              <div className="flex items-start gap-3 p-4 bg-red-50 rounded-xl border-2 border-red-200">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="text-sm text-red-600 font-semibold block mb-1" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    رسالة الخطأ
                  </span>
                  <p className="text-red-700" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    {selectedNotification.errorMessage}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 flex space-x-4 space-x-reverse">
            {!selectedNotification.isRead && (
              <button
                onClick={() => handleMarkAsRead(selectedNotification.id)}
                className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-xl hover:from-green-600 hover:to-green-700 transition-all flex items-center justify-center font-semibold shadow-md"
                style={{ fontFamily: 'Tajawal, sans-serif' }}
              >
                <Check className="h-4 w-4 ml-2" />
                تحديد كمقروء
              </button>
            )}

            <button
              onClick={handleCloseDetails}
              className={`${selectedNotification.isRead ? 'flex-1' : ''} bg-gradient-to-r from-gray-400 to-gray-500 text-white px-6 py-3 rounded-xl hover:from-gray-500 hover:to-gray-600 transition-all flex items-center justify-center font-semibold shadow-md`}
              style={{ fontFamily: 'Tajawal, sans-serif' }}
            >
              <X className="h-4 w-4 ml-2" />
              إغلاق
            </button>
          </div>
        </div>
      ) : notifications.length > 0 ? (
        <>
          {/* Desktop Table View */}
          <div className="hidden sm:block bg-white rounded-2xl shadow-xl border-2 border-[#E5DCC5] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gradient-to-r from-[#F5F5DC] to-[#E5DCC5]">
                  <tr>
                    <th className="px-6 py-4 text-right text-xs font-bold text-[#8B7355] uppercase tracking-wider" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      العنوان
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-[#8B7355] uppercase tracking-wider" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      الرسالة
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-[#8B7355] uppercase tracking-wider" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      التاريخ
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-[#8B7355] uppercase tracking-wider" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      الحالة
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-[#8B7355] uppercase tracking-wider" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      الإجراءات
                    </th>
                  </tr>
                </thead>

                <tbody className="bg-white divide-y-2 divide-[#F5F5DC]">
                  {notifications.map((notification) => (
                    <tr key={notification.id} className="hover:bg-[#FAF9F6] transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {!notification.isRead && (
                            <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                          )}
                          <span
                            className={`text-sm ${
                              notification.isRead ? 'text-[#8B7355]/70' : 'font-bold text-[#8B7355]'
                            }`}
                            style={{ fontFamily: 'Tajawal, sans-serif' }}
                          >
                            {notification.title}
                          </span>
                        </div>
                      </td>

                      <td
                        className={`px-6 py-4 text-sm ${
                          notification.isRead ? 'text-[#8B7355]/70' : 'font-semibold text-[#8B7355]'
                        }`}
                        style={{ fontFamily: 'Tajawal, sans-serif' }}
                      >
                        {formatNotificationBody(notification.body).substring(0, 50)}...
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#8B7355]/70" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-[#C4A57B]" />
                          {formatDate(notification.sentAt)}
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-wrap gap-2">
                          <span
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                              notification.isRead ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                            }`}
                            style={{ fontFamily: 'Tajawal, sans-serif' }}
                          >
                            {notification.isRead ? <Check className="h-3 w-3" /> : <Bell className="h-3 w-3" />}
                            {notification.isRead ? 'مقروء' : 'غير مقروء'}
                          </span>

                          <span
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                              notification.success ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                            }`}
                            style={{ fontFamily: 'Tajawal, sans-serif' }}
                          >
                            {notification.success ? '✓ تم الإرسال' : '✗ فشل'}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleViewNotification(notification)}
                          className="flex items-center gap-1 text-[#8B7355] hover:text-[#D4AF37] font-semibold transition-colors"
                          style={{ fontFamily: 'Tajawal, sans-serif' }}
                        >
                          <Bell className="h-4 w-4" />
                          عرض
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="block sm:hidden space-y-4">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className="bg-white rounded-2xl shadow-lg border-2 border-[#E5DCC5] p-4 transition-all duration-200 hover:shadow-xl hover:border-[#D4AF37]"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-start gap-2 flex-1">
                    {!notification.isRead && (
                      <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse mt-1.5 flex-shrink-0"></span>
                    )}
                    <div>
                      <p
                        className={`text-sm ${notification.isRead ? 'text-[#8B7355]/70' : 'font-bold text-[#8B7355]'}`}
                        style={{ fontFamily: 'Tajawal, sans-serif' }}
                      >
                        {notification.title}
                      </p>
                      <p className="text-xs text-[#8B7355]/70 mt-1" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                        {formatNotificationBody(notification.body).substring(0, 60)}...
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleViewNotification(notification)}
                    className="flex items-center gap-1 text-xs text-[#8B7355] bg-[#F5F5DC] px-3 py-2 rounded-lg hover:bg-[#E5DCC5] font-semibold transition-all flex-shrink-0 ml-2 border border-[#E5DCC5]"
                    style={{ fontFamily: 'Tajawal, sans-serif' }}
                  >
                    <Bell className="h-3 w-3" />
                    التفاصيل
                  </button>
                </div>

                <div className="space-y-2 border-t-2 border-[#F5F5DC] pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-[#8B7355]/70 flex items-center gap-1" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      <Calendar className="h-3 w-3" />
                      التاريخ:
                    </span>
                    <span className="text-xs text-[#8B7355] font-medium" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      {formatDate(notification.sentAt)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-xs text-[#8B7355]/70" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      الحالة:
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                        notification.isRead ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                      }`}
                      style={{ fontFamily: 'Tajawal, sans-serif' }}
                    >
                      {notification.isRead ? <Check className="h-3 w-3" /> : <Bell className="h-3 w-3" />}
                      {notification.isRead ? 'مقروء' : 'غير مقروء'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-xs text-[#8B7355]/70" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      الإرسال:
                    </span>
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                        notification.success ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                      }`}
                      style={{ fontFamily: 'Tajawal, sans-serif' }}
                    >
                      {notification.success ? '✓ تم' : '✗ فشل'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="mt-8 flex justify-center items-center space-x-4 space-x-reverse">
              <button
                onClick={() => setPageNumber((prev) => Math.max(prev - 1, 1))}
                disabled={pageNumber === 1}
                className="px-5 py-3 bg-gradient-to-r from-[#8B7355] to-[#A67C52] text-white rounded-xl hover:from-[#6B5644] hover:to-[#8B6644] disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all shadow-md"
                style={{ fontFamily: 'Tajawal, sans-serif' }}
              >
                السابق
              </button>

              <div className="bg-white px-6 py-3 rounded-xl border-2 border-[#E5DCC5] shadow-md">
                <span className="text-[#8B7355] font-bold" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                  {pageNumber} / {totalPages}
                </span>
              </div>

              <button
                onClick={() => setPageNumber((prev) => Math.min(prev + 1, totalPages))}
                disabled={pageNumber === totalPages}
                className="px-5 py-3 bg-gradient-to-r from-[#8B7355] to-[#A67C52] text-white rounded-xl hover:from-[#6B5644] hover:to-[#8B6644] disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all shadow-md"
                style={{ fontFamily: 'Tajawal, sans-serif' }}
              >
                التالي
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-16 bg-gradient-to-br from-white to-[#FAF9F6] rounded-2xl shadow-xl border-2 border-[#E5DCC5]">
          <div className="text-7xl mb-4">🔔</div>
          <p className="text-xl font-bold text-[#8B7355] mb-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
            لا توجد إشعارات
          </p>
          <p className="text-[#8B7355]/70" style={{ fontFamily: 'Tajawal, sans-serif' }}>
            لم يتم العثور على أي إشعارات حالياً
          </p>
        </div>
      )}
    </div>
  );
};

export default CustomOrderNotifications;
