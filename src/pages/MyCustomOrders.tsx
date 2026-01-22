// src/pages/MyCustomOrders.tsx
// ✅ Updated to match the NEW backend you showed (design-based CustomOrder):
// - flavorNames: string[] (instead of flavorName / flavorNameAr single string)
// - occasionName + sizeName already returned (no occasionIcon/nameAr fields assumed)
// - designImageUrl (not designImagePath) and image url is usually "/..." => prefix with apiUrl
// - additionalPhone + address exist
// - paymentMethod + status are enums (same numbers) but we render via local maps
// - uses /api/CustomOrders/my-orders (kept) with accessToken
// - removes unused fields, fixes modal open (you had selectedOrder but no click to set it)

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Cake,
  Calendar,
  Clock,
  Phone,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Package,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
} from 'lucide-react';

enum CustomOrderStatus {
  Pending = 0,
  Confirmed = 1,
  InProgress = 2,
  Ready = 3,
  Completed = 4,
  Cancelled = 5,
}

enum PaymentMethod {
  Cash = 0,
  VodafoneCash = 1,
  Instapay = 2,
}

interface CustomOrder {
  id: string;
  orderNumber: string;

  customerName: string;
  customerPhone: string;
  additionalPhone?: string;
  address?: string;

  occasionName: string;
  sizeName: string;
  flavorNames: string[];

  customText?: string;
  designImageUrl?: string;

  pickupDate: string; // ISO date or string
  pickupTime: string; // "HH:mm:ss" or "HH:mm"

  notes?: string;

  paymentMethod: PaymentMethod;
  status: CustomOrderStatus;

  estimatedPrice: number;
  finalPrice?: number;
  adminNotes?: string;

  createdAt: string;
  updatedAt?: string;
}

interface PaginatedResult {
  items: CustomOrder[];
  totalItems: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

const statusConfig: Record<
  number,
  { label: string; color: string; bgColor: string; icon: JSX.Element }
> = {
  [CustomOrderStatus.Pending]: {
    label: 'قيد الانتظار',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    icon: <Clock className="h-5 w-5" />,
  },
  [CustomOrderStatus.Confirmed]: {
    label: 'تم التأكيد',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    icon: <CheckCircle className="h-5 w-5" />,
  },
  [CustomOrderStatus.InProgress]: {
    label: 'قيد التحضير',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    icon: <Package className="h-5 w-5" />,
  },
  [CustomOrderStatus.Ready]: {
    label: 'جاهز للاستلام',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    icon: <CheckCircle className="h-5 w-5" />,
  },
  [CustomOrderStatus.Completed]: {
    label: 'مكتمل',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    icon: <CheckCircle className="h-5 w-5" />,
  },
  [CustomOrderStatus.Cancelled]: {
    label: 'ملغي',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    icon: <XCircle className="h-5 w-5" />,
  },
};

const paymentMethodLabels: Record<number, string> = {
  [PaymentMethod.Cash]: 'كاش',
  [PaymentMethod.VodafoneCash]: 'فودافون كاش',
  [PaymentMethod.Instapay]: 'إنستا باي',
};

export default function MyCustomOrders() {
  const [orders, setOrders] = useState<CustomOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [pageNumber, setPageNumber] = useState(1);
  const pageSize = 10;

  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [selectedOrder, setSelectedOrder] = useState<CustomOrder | null>(null);

  const apiUrl = import.meta.env.VITE_API_BASE_URL;

  const getAuthToken = () => localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageNumber]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = getAuthToken();
      if (!token) {
        setError('يجب تسجيل الدخول لعرض طلباتك');
        return;
      }

      const response = await fetch(
        `${apiUrl}/api/CustomOrders/my-orders?pageNumber=${pageNumber}&pageSize=${pageSize}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى');
        }
        const txt = await response.text().catch(() => '');
        throw new Error(txt || 'فشل في تحميل الطلبات');
      }

      const data: PaginatedResult = await response.json();

      setOrders(Array.isArray(data.items) ? data.items : []);
      setTotalPages(Number(data.totalPages || 1));
      setTotalItems(Number(data.totalItems || 0));
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء تحميل الطلبات');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    return timeString.includes(':') ? timeString.substring(0, 5) : timeString;
  };

  const resolveImageUrl = (path?: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    // backend often returns "/uploads/.."
    if (path.startsWith('/')) return `${apiUrl}${path}`;
    return `${apiUrl}/${path}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 via-pink-50 to-amber-50 flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="h-12 w-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-purple-900 font-medium">جاري تحميل طلباتك...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 via-pink-50 to-amber-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">خطأ</h2>
          <p className="text-red-600 mb-6">{error}</p>
          <button
            onClick={fetchOrders}
            className="bg-gradient-to-r from-purple-600 to-pink-500 text-white px-6 py-3 rounded-xl font-bold hover:from-purple-700 hover:to-pink-600 transition-all"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  const inProgressCount = orders.filter((o) => o.status === CustomOrderStatus.Confirmed || o.status === CustomOrderStatus.InProgress).length;
  const completedCount = orders.filter((o) => o.status === CustomOrderStatus.Completed).length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-pink-50 to-amber-50 py-8" dir="rtl">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mb-4">
            <Cake className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-purple-900 mb-2">طلباتي الخاصة</h1>
          <p className="text-gray-600">تتبع طلبات التورتات المخصصة الخاصة بك</p>
        </div>

        {/* Stats */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="text-center flex-1">
              <p className="text-3xl font-bold text-purple-600">{totalItems}</p>
              <p className="text-sm text-gray-600">إجمالي الطلبات</p>
            </div>
            <div className="w-px h-12 bg-gray-200"></div>
            <div className="text-center flex-1">
              <p className="text-3xl font-bold text-blue-600">{inProgressCount}</p>
              <p className="text-sm text-gray-600">قيد التنفيذ</p>
            </div>
            <div className="w-px h-12 bg-gray-200"></div>
            <div className="text-center flex-1">
              <p className="text-3xl font-bold text-green-600">{completedCount}</p>
              <p className="text-sm text-gray-600">مكتملة</p>
            </div>
          </div>
        </div>

        {/* Orders List */}
        {orders.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-xl p-12 text-center">
            <Cake className="h-24 w-24 text-gray-300 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-700 mb-2">لا توجد طلبات بعد</h3>
            <p className="text-gray-500 mb-6">ابدأ بطلب تورتة خاصة مميزة!</p>
            <Link
              to="/custom"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-500 text-white px-6 py-3 rounded-xl font-bold hover:from-purple-700 hover:to-pink-600 transition-all"
            >
              <Sparkles className="h-5 w-5" />
              <span>اطلب الآن</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const status = statusConfig[order.status] || statusConfig[CustomOrderStatus.Pending];

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all overflow-hidden"
                >
                  <div className="p-6">
                    {/* Header row */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-purple-900">{order.occasionName}</h3>
                        <p className="text-sm text-gray-500">رقم الطلب: {order.orderNumber}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${status.bgColor}`}>
                          <span className={status.color}>{status.icon}</span>
                          <span className={`font-bold text-sm ${status.color}`}>{status.label}</span>
                        </div>

                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="p-2 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-colors"
                          title="عرض التفاصيل"
                        >
                          <Eye className="h-5 w-5 text-gray-700" />
                        </button>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center gap-2 text-gray-700">
                        <Package className="h-5 w-5 text-purple-500" />
                        <span className="text-sm">
                          <strong>الحجم:</strong> {order.sizeName}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-gray-700">
                        <Cake className="h-5 w-5 text-pink-500" />
                        <span className="text-sm">
                          <strong>النكهات:</strong>{' '}
                          {order.flavorNames?.length ? order.flavorNames.join(' + ') : 'غير محدد'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-gray-700">
                        <Calendar className="h-5 w-5 text-blue-500" />
                        <span className="text-sm">
                          <strong>الاستلام:</strong> {formatDate(order.pickupDate)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-gray-700">
                        <Clock className="h-5 w-5 text-amber-500" />
                        <span className="text-sm">
                          <strong>الوقت:</strong> {formatTime(order.pickupTime)}
                        </span>
                      </div>

                      {order.address && (
                        <div className="flex items-start gap-2 text-gray-700 md:col-span-2">
                          <MapPin className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                          <span className="text-sm">
                            <strong>العنوان:</strong> {order.address}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Custom text */}
                    {order.customText && (
                      <div className="bg-purple-50 rounded-xl p-3 mb-4">
                        <p className="text-sm text-gray-700">
                          <strong className="text-purple-900">النص المطلوب:</strong> "{order.customText}"
                        </p>
                      </div>
                    )}

                    {/* Image */}
                    {order.designImageUrl && (
                      <div className="mb-4">
                        <img
                          src={resolveImageUrl(order.designImageUrl)}
                          alt="Design"
                          className="w-32 h-32 object-cover rounded-xl border-2 border-purple-200"
                        />
                      </div>
                    )}

                    {/* Payment + Price */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <div>
                        <p className="text-sm text-gray-600">طريقة الدفع</p>
                        <p className="font-bold text-gray-900">
                          {paymentMethodLabels[order.paymentMethod] || 'غير محدد'}
                        </p>
                      </div>

                      <div className="text-left">
                        <p className="text-sm text-gray-600">
                          {order.finalPrice ? 'السعر النهائي' : 'السعر التقديري'}
                        </p>
                        <p className="text-2xl font-bold text-amber-600">
                          {Number(order.finalPrice ?? order.estimatedPrice).toFixed(2)} جنيه
                        </p>
                      </div>
                    </div>

                    {/* Admin notes */}
                    {order.adminNotes && (
                      <div className="mt-4 bg-blue-50 rounded-xl p-3">
                        <p className="text-sm text-blue-900">
                          <strong>ملاحظات الإدارة:</strong> {order.adminNotes}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="bg-gray-50 px-6 py-3 text-sm text-gray-500 flex items-center justify-between">
                    <span>تاريخ الطلب: {formatDate(order.createdAt)}</span>
                    {order.updatedAt && order.updatedAt !== order.createdAt && (
                      <span>آخر تحديث: {formatDate(order.updatedAt)}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              onClick={() => setPageNumber((prev) => Math.max(prev - 1, 1))}
              disabled={pageNumber === 1}
              className="p-2 rounded-lg bg-white shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="h-5 w-5 text-purple-600" />
            </button>

            <div className="flex gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setPageNumber(page)}
                  className={`w-10 h-10 rounded-lg font-bold transition-all ${
                    pageNumber === page
                      ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-lg'
                      : 'bg-white text-gray-700 hover:bg-purple-50'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              onClick={() => setPageNumber((prev) => Math.min(prev + 1, totalPages))}
              disabled={pageNumber === totalPages}
              className="p-2 rounded-lg bg-white shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="h-5 w-5 text-purple-600" />
            </button>
          </div>
        )}

        {/* Details Modal */}
        {selectedOrder && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedOrder(null)}
          >
            <div
              className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-pink-500 text-white p-6 rounded-t-3xl">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">تفاصيل الطلب</h2>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all"
                  >
                    <XCircle className="h-6 w-6" />
                  </button>
                </div>
                <p className="text-purple-100 mt-1">رقم الطلب: {selectedOrder.orderNumber}</p>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">الاسم</p>
                    <p className="font-bold text-gray-900">{selectedOrder.customerName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">رقم الهاتف</p>
                    <p className="font-bold text-gray-900 flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      {selectedOrder.customerPhone}
                    </p>
                  </div>
                </div>

                {selectedOrder.additionalPhone && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">رقم إضافي</p>
                    <p className="font-bold text-gray-900 flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      {selectedOrder.additionalPhone}
                    </p>
                  </div>
                )}

                {selectedOrder.address && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">العنوان</p>
                    <p className="font-bold text-gray-900 flex items-start gap-2 bg-gray-50 rounded-xl p-3">
                      <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>{selectedOrder.address}</span>
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">المناسبة</p>
                    <p className="font-bold text-gray-900">{selectedOrder.occasionName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">الحالة</p>
                    <p className="font-bold text-gray-900">
                      {(statusConfig[selectedOrder.status] || statusConfig[0]).label}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">الحجم</p>
                    <p className="font-bold text-gray-900">{selectedOrder.sizeName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">النكهات</p>
                    <p className="font-bold text-gray-900">
                      {selectedOrder.flavorNames?.length ? selectedOrder.flavorNames.join(' + ') : 'غير محدد'}
                    </p>
                  </div>
                </div>

                {selectedOrder.customText && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">النص على التورتة</p>
                    <p className="font-bold text-purple-900 bg-purple-50 rounded-xl p-3">
                      "{selectedOrder.customText}"
                    </p>
                  </div>
                )}

                {selectedOrder.designImageUrl && (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">التصميم المطلوب</p>
                    <img
                      src={resolveImageUrl(selectedOrder.designImageUrl)}
                      alt="Design"
                      className="w-full max-w-md rounded-xl border-2 border-purple-200"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">تاريخ الاستلام</p>
                    <p className="font-bold text-gray-900 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {formatDate(selectedOrder.pickupDate)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">وقت الاستلام</p>
                    <p className="font-bold text-gray-900 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {formatTime(selectedOrder.pickupTime)}
                    </p>
                  </div>
                </div>

                {selectedOrder.notes && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">ملاحظاتك</p>
                    <p className="text-gray-700 bg-gray-50 rounded-xl p-3">{selectedOrder.notes}</p>
                  </div>
                )}

                {selectedOrder.adminNotes && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">ملاحظات الإدارة</p>
                    <p className="text-blue-900 bg-blue-50 rounded-xl p-3">{selectedOrder.adminNotes}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">طريقة الدفع</p>
                    <p className="font-bold text-gray-900">
                      {paymentMethodLabels[selectedOrder.paymentMethod] || 'غير محدد'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">
                      {selectedOrder.finalPrice ? 'السعر النهائي' : 'السعر التقديري'}
                    </p>
                    <p className="text-2xl font-bold text-amber-600">
                      {Number(selectedOrder.finalPrice ?? selectedOrder.estimatedPrice).toFixed(2)} جنيه
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500">تاريخ الطلب: {formatDate(selectedOrder.createdAt)}</p>
                  {selectedOrder.updatedAt && selectedOrder.updatedAt !== selectedOrder.createdAt && (
                    <p className="text-xs text-gray-500 mt-1">آخر تحديث: {formatDate(selectedOrder.updatedAt)}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
