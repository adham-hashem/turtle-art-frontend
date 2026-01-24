// src/pages/MyCustomOrders.tsx

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingBag,
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
  ArrowRight,
  Palette,
  MessageSquareText,
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

  requiredText: string;
  preferredColors: string;
  designImageUrl?: string;

  notes?: string;

  paymentMethod: PaymentMethod;
  status: CustomOrderStatus;

  estimatedPrice?: number;
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
    color: 'text-[#8B7355]',
    bgColor: 'bg-[#FAF9F6]',
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

  const resolveImageUrl = (path?: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    if (path.startsWith('/')) return `${apiUrl}${path}`;
    return `${apiUrl}/${path}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#FAF9F6] to-[#F5F5DC] flex items-center justify-center pt-24" dir="rtl">
        <div className="text-center">
          <Sparkles className="h-12 w-12 text-[#D4AF37] animate-spin mx-auto mb-4" />
          <p className="text-[#8B7355] font-medium" style={{ fontFamily: 'Tajawal, sans-serif' }}>
            جاري تحميل طلباتك...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#FAF9F6] to-[#F5F5DC] flex items-center justify-center p-4 pt-24" dir="rtl">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center border-2 border-[#E5DCC5]">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-[#8B7355] mb-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
            خطأ
          </h2>
          <p className="text-red-600 mb-6" style={{ fontFamily: 'Tajawal, sans-serif' }}>
            {error}
          </p>
          <button
            onClick={fetchOrders}
            className="bg-gradient-to-r from-[#8B7355] to-[#A67C52] text-white px-6 py-3 rounded-xl font-bold hover:from-[#6B5644] hover:to-[#8B6644] transition-all shadow-lg"
            style={{ fontFamily: 'Tajawal, sans-serif' }}
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  const inProgressCount = orders.filter(
    (o) => o.status === CustomOrderStatus.Confirmed || o.status === CustomOrderStatus.InProgress
  ).length;
  const completedCount = orders.filter((o) => o.status === CustomOrderStatus.Completed).length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FAF9F6] to-[#F5F5DC] pt-24 pb-8" dir="rtl">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Back Button */}
        <Link
          to="/"
          className="inline-flex items-center space-x-reverse space-x-2 text-[#8B7355] hover:text-[#D4AF37] mb-6 transition-colors"
          style={{ fontFamily: 'Tajawal, sans-serif' }}
        >
          <ArrowRight size={20} />
          <span>العودة للرئيسية</span>
        </Link>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-[#8B7355] to-[#A67C52] rounded-full mb-4 shadow-xl">
            <ShoppingBag className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-[#8B7355] mb-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
            طلباتي الخاصة
          </h1>
          <p className="text-[#8B7355]/70" style={{ fontFamily: 'Tajawal, sans-serif' }}>
            تتبع طلبات التصاميم المخصصة الخاصة بك
          </p>
        </div>

        {/* Stats */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border-2 border-[#E5DCC5]">
          <div className="flex items-center justify-between">
            <div className="text-center flex-1">
              <p className="text-3xl font-bold text-[#D4AF37]" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                {totalItems}
              </p>
              <p className="text-sm text-[#8B7355]/70" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                إجمالي الطلبات
              </p>
            </div>
            <div className="w-px h-12 bg-[#E5DCC5]"></div>
            <div className="text-center flex-1">
              <p className="text-3xl font-bold text-blue-600" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                {inProgressCount}
              </p>
              <p className="text-sm text-[#8B7355]/70" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                قيد التنفيذ
              </p>
            </div>
            <div className="w-px h-12 bg-[#E5DCC5]"></div>
            <div className="text-center flex-1">
              <p className="text-3xl font-bold text-green-600" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                {completedCount}
              </p>
              <p className="text-sm text-[#8B7355]/70" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                مكتملة
              </p>
            </div>
          </div>
        </div>

        {/* Orders List */}
        {orders.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-xl p-12 text-center border-2 border-[#E5DCC5]">
            <ShoppingBag className="h-24 w-24 text-[#E5DCC5] mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-[#8B7355] mb-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
              لا توجد طلبات بعد
            </h3>
            <p className="text-[#8B7355]/70 mb-6" style={{ fontFamily: 'Tajawal, sans-serif' }}>
              ابدأ بطلب تصميم مخصص مميز!
            </p>
            <Link
              to="/custom"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[#8B7355] to-[#A67C52] text-white px-6 py-3 rounded-xl font-bold hover:from-[#6B5644] hover:to-[#8B6644] transition-all shadow-lg"
              style={{ fontFamily: 'Tajawal, sans-serif' }}
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
                  className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all overflow-hidden border-2 border-[#E5DCC5]"
                >
                  <div className="p-6">
                    {/* Header row */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-[#8B7355]" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                          طلب تصميم مخصص
                        </h3>
                        <p className="text-sm text-[#8B7355]/60" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                          رقم الطلب: {order.orderNumber}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${status.bgColor} border-2 border-[#E5DCC5]`}>
                          <span className={status.color}>{status.icon}</span>
                          <span className={`font-bold text-sm ${status.color}`} style={{ fontFamily: 'Tajawal, sans-serif' }}>
                            {status.label}
                          </span>
                        </div>

                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="p-2 rounded-xl bg-[#FAF9F6] hover:bg-[#F5F5DC] border-2 border-[#E5DCC5] transition-colors"
                          title="عرض التفاصيل"
                        >
                          <Eye className="h-5 w-5 text-[#8B7355]" />
                        </button>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="flex items-start gap-2 text-[#8B7355]">
                        <MessageSquareText className="h-5 w-5 text-[#D4AF37] flex-shrink-0 mt-0.5" />
                        <span className="text-sm" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                          <strong>النص المطلوب:</strong> {order.requiredText}
                        </span>
                      </div>

                      <div className="flex items-start gap-2 text-[#8B7355]">
                        <Palette className="h-5 w-5 text-[#A67C52] flex-shrink-0 mt-0.5" />
                        <span className="text-sm" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                          <strong>الألوان:</strong> {order.preferredColors}
                        </span>
                      </div>

                      {order.address && (
                        <div className="flex items-start gap-2 text-[#8B7355] md:col-span-2">
                          <MapPin className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                          <span className="text-sm" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                            <strong>العنوان:</strong> {order.address}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Notes */}
                    {order.notes && (
                      <div className="bg-[#FAF9F6] rounded-xl p-3 mb-4 border border-[#E5DCC5]">
                        <p className="text-sm text-[#8B7355]" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                          <strong className="text-[#8B7355]">ملاحظاتك:</strong> "{order.notes}"
                        </p>
                      </div>
                    )}

                    {/* Image */}
                    {order.designImageUrl && (
                      <div className="mb-4">
                        <img
                          src={resolveImageUrl(order.designImageUrl)}
                          alt="Design"
                          className="w-32 h-32 object-cover rounded-xl border-2 border-[#E5DCC5] shadow-md"
                        />
                      </div>
                    )}

                    {/* Payment + Price */}
                    <div className="flex items-center justify-between pt-4 border-t-2 border-[#E5DCC5]">
                      <div>
                        <p className="text-sm text-[#8B7355]/70" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                          طريقة الدفع
                        </p>
                        <p className="font-bold text-[#8B7355]" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                          {paymentMethodLabels[order.paymentMethod] || 'غير محدد'}
                        </p>
                      </div>

                      {(order.finalPrice || order.estimatedPrice) && (
                        <div className="text-left">
                          <p className="text-sm text-[#8B7355]/70" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                            {order.finalPrice ? 'السعر النهائي' : 'السعر التقديري'}
                          </p>
                          <p className="text-2xl font-bold text-[#D4AF37]" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                            {Number(order.finalPrice ?? order.estimatedPrice).toFixed(2)} جنيه
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Admin notes */}
                    {order.adminNotes && (
                      <div className="mt-4 bg-blue-50 rounded-xl p-3 border-2 border-blue-200">
                        <p className="text-sm text-blue-900" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                          <strong>ملاحظات الإدارة:</strong> {order.adminNotes}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="bg-[#FAF9F6] px-6 py-3 text-sm text-[#8B7355]/70 flex items-center justify-between border-t-2 border-[#E5DCC5]" style={{ fontFamily: 'Tajawal, sans-serif' }}>
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
              className="p-2 rounded-lg bg-white shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all border-2 border-[#E5DCC5]"
            >
              <ChevronRight className="h-5 w-5 text-[#8B7355]" />
            </button>

            <div className="flex gap-2">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setPageNumber(page)}
                  className={`w-10 h-10 rounded-lg font-bold transition-all border-2 ${
                    pageNumber === page
                      ? 'bg-gradient-to-r from-[#8B7355] to-[#A67C52] text-white border-[#8B7355] shadow-lg'
                      : 'bg-white text-[#8B7355] border-[#E5DCC5] hover:bg-[#FAF9F6]'
                  }`}
                  style={{ fontFamily: 'Tajawal, sans-serif' }}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              onClick={() => setPageNumber((prev) => Math.min(prev + 1, totalPages))}
              disabled={pageNumber === totalPages}
              className="p-2 rounded-lg bg-white shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all border-2 border-[#E5DCC5]"
            >
              <ChevronLeft className="h-5 w-5 text-[#8B7355]" />
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
              className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border-2 border-[#E5DCC5]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-gradient-to-r from-[#8B7355] to-[#A67C52] text-white p-6 rounded-t-3xl">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    تفاصيل الطلب
                  </h2>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all"
                  >
                    <XCircle className="h-6 w-6" />
                  </button>
                </div>
                <p className="text-white/80 mt-1" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                  رقم الطلب: {selectedOrder.orderNumber}
                </p>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-[#8B7355]/70 mb-1" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      الاسم
                    </p>
                    <p className="font-bold text-[#8B7355]" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      {selectedOrder.customerName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-[#8B7355]/70 mb-1" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      رقم الهاتف
                    </p>
                    <p className="font-bold text-[#8B7355] flex items-center gap-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      <Phone className="h-4 w-4" />
                      {selectedOrder.customerPhone}
                    </p>
                  </div>
                </div>

                {selectedOrder.additionalPhone && (
                  <div>
                    <p className="text-sm text-[#8B7355]/70 mb-1" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      رقم إضافي
                    </p>
                    <p className="font-bold text-[#8B7355] flex items-center gap-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      <Phone className="h-4 w-4" />
                      {selectedOrder.additionalPhone}
                    </p>
                  </div>
                )}

                {selectedOrder.address && (
                  <div>
                    <p className="text-sm text-[#8B7355]/70 mb-1" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      العنوان
                    </p>
                    <p className="font-bold text-[#8B7355] flex items-start gap-2 bg-[#FAF9F6] rounded-xl p-3 border-2 border-[#E5DCC5]" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>{selectedOrder.address}</span>
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-[#8B7355]/70 mb-1" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      النص المطلوب
                    </p>
                    <p className="font-bold text-[#8B7355]" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      {selectedOrder.requiredText}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-[#8B7355]/70 mb-1" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      الألوان المفضلة
                    </p>
                    <p className="font-bold text-[#8B7355]" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      {selectedOrder.preferredColors}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-[#8B7355]/70 mb-1" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    الحالة
                  </p>
                  <p className="font-bold text-[#8B7355]" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    {(statusConfig[selectedOrder.status] || statusConfig[0]).label}
                  </p>
                </div>

                {selectedOrder.designImageUrl && (
                  <div>
                    <p className="text-sm text-[#8B7355]/70 mb-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      التصميم المطلوب
                    </p>
                    <img
                      src={resolveImageUrl(selectedOrder.designImageUrl)}
                      alt="Design"
                      className="w-full max-w-md rounded-xl border-2 border-[#E5DCC5] shadow-md"
                    />
                  </div>
                )}

                {selectedOrder.notes && (
                  <div>
                    <p className="text-sm text-[#8B7355]/70 mb-1" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      ملاحظاتك
                    </p>
                    <p className="text-[#8B7355] bg-[#FAF9F6] rounded-xl p-3 border-2 border-[#E5DCC5]" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      {selectedOrder.notes}
                    </p>
                  </div>
                )}

                {selectedOrder.adminNotes && (
                  <div>
                    <p className="text-sm text-[#8B7355]/70 mb-1" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      ملاحظات الإدارة
                    </p>
                    <p className="text-blue-900 bg-blue-50 rounded-xl p-3 border-2 border-blue-200" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      {selectedOrder.adminNotes}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-[#8B7355]/70 mb-1" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      طريقة الدفع
                    </p>
                    <p className="font-bold text-[#8B7355]" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      {paymentMethodLabels[selectedOrder.paymentMethod] || 'غير محدد'}
                    </p>
                  </div>
                  {(selectedOrder.finalPrice || selectedOrder.estimatedPrice) && (
                    <div>
                      <p className="text-sm text-[#8B7355]/70 mb-1" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                        {selectedOrder.finalPrice ? 'السعر النهائي' : 'السعر التقديري'}
                      </p>
                      <p className="text-2xl font-bold text-[#D4AF37]" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                        {Number(selectedOrder.finalPrice ?? selectedOrder.estimatedPrice).toFixed(2)} جنيه
                      </p>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t-2 border-[#E5DCC5]">
                  <p className="text-xs text-[#8B7355]/70" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    تاريخ الطلب: {formatDate(selectedOrder.createdAt)}
                  </p>
                  {selectedOrder.updatedAt && selectedOrder.updatedAt !== selectedOrder.createdAt && (
                    <p className="text-xs text-[#8B7355]/70 mt-1" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      آخر تحديث: {formatDate(selectedOrder.updatedAt)}
                    </p>
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