import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useEffect, useState } from 'react';
import { Package, Eye, Calendar, CreditCard, Loader2, ShoppingBag, AlertCircle } from 'lucide-react';

const apiUrl = import.meta.env.VITE_API_BASE_URL;

interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productCode: string;
  quantity: number;
  priceAtPurchase: number;
  size: string;
  color: string;
}

interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  total: number;
  paymentMethod: 'Cash' | 'Card' | 'OnlinePayment';
  status: 'UnderReview' | 'Confirmed' | 'Shipped' | 'Delivered' | 'Cancelled';
  date: string;
  discountCodeUsed: string | null;
  paymentTransactionId: string | null;
  fullName?: string;
  phoneNumber?: string;
  address?: string;
  governorate?: string;
  items: OrderItem[];
}

interface PaginatedOrdersResponse {
  items: Order[];
  totalItems: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

const MyOrders: React.FC = () => {
  const { isAuthenticated, userRole } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        if (!apiUrl) {
          throw new Error('عنوان URL الخاص بالـ API غير مكوّن.');
        }

        const token = localStorage.getItem('accessToken');
        if (!token) {
          throw new Error('لم يتم العثور على رمز الوصول. الرجاء تسجيل الدخول مرة أخرى.');
        }

        const response = await fetch(`${apiUrl}/api/orders/my-orders`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            throw new Error('غير مصرح: الرجاء تسجيل الدخول مرة أخرى.');
          }
          const errorText = await response.text();
          throw new Error(`فشل في جلب الطلبات: ${response.status} ${errorText}`);
        }

        const data: PaginatedOrdersResponse = await response.json();

        if (!Array.isArray(data.items)) {
          setOrders([]);
          throw new Error('تنسيق الاستجابة غير صالح: متوقع مصفوفة من الطلبات في data.items.');
        }

        const mappedOrders = data.items.map((order: any) => ({
          ...order,
          status: mapStatus(order.status),
          paymentMethod: mapPaymentMethod(order.paymentMethod),
        }));

        setOrders(mappedOrders);
      } catch (err: any) {
        setError(err.message || 'حدث خطأ أثناء جلب الطلبات.');
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    const mapStatus = (status: number | string): 'UnderReview' | 'Confirmed' | 'Shipped' | 'Delivered' | 'Cancelled' => {
      switch (Number(status)) {
        case 0: return 'UnderReview';
        case 1: return 'Confirmed';
        case 2: return 'Shipped';
        case 3: return 'Delivered';
        case 4: return 'Cancelled';
        default: return 'UnderReview';
      }
    };

    const mapPaymentMethod = (method: number | string): 'Cash' | 'Card' | 'OnlinePayment' => {
      switch (Number(method)) {
        case 0: return 'Cash';
        case 1: return 'Card';
        case 2: return 'OnlinePayment';
        default: return 'Cash';
      }
    };

    if (isAuthenticated) {
      fetchOrders();
    } else {
      navigate('/login');
    }
  }, [isAuthenticated, navigate, userRole]);


  // Helper function to get status text
  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'underreview': return 'تحت المراجعة';
      case 'confirmed': return 'مؤكد';
      case 'shipped': return 'تم الشحن';
      case 'delivered': return 'تم التسليم';
      case 'cancelled': return 'ملغي';
      default: return status;
    }
  };

  // Helper function to get payment method text
  const getPaymentMethodText = (method: string) => {
    switch (method.toLowerCase()) {
      case 'cash': return 'الدفع عند الاستلام';
      case 'card': return 'بطاقة ائتمانية';
      case 'onlinepayment': return 'دفع إلكتروني';
      default: return method;
    }
  };

  // Helper function to get status color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'underreview': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'confirmed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'shipped': return 'bg-[#C4A57B]/20 text-[#8B7355] border-[#C4A57B]';
      case 'delivered': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Helper function to format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#FAF9F6] to-[#F5F5DC] flex items-center justify-center px-4 pt-20" dir="rtl">
        <div className="text-center py-12">
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-[#C4A57B] rounded-full blur-xl opacity-30 animate-pulse"></div>
            <div className="relative bg-gradient-to-r from-[#8B7355] to-[#A67C52] rounded-full p-4">
              <Package className="h-12 w-12 text-white animate-bounce" />
            </div>
          </div>
          <p className="text-[#8B7355] font-bold text-lg" style={{ fontFamily: 'Tajawal, sans-serif' }}>جاري تحميل الطلبات...</p>
          <p className="text-[#8B7355]/70 text-sm mt-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>انتظر لحظة 📦</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#FAF9F6] to-[#F5F5DC] py-6 sm:py-8 pt-24" dir="rtl">
        <div className="container mx-auto px-3 sm:px-4 max-w-md">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-8 text-center border-2 border-red-200">
            <AlertCircle className="h-12 w-12 sm:h-16 sm:w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg sm:text-xl font-bold text-red-600 mb-3" style={{ fontFamily: 'Tajawal, sans-serif' }}>حدث خطأ</h2>
            <p className="text-sm sm:text-base text-[#8B7355]/70 mb-6" style={{ fontFamily: 'Tajawal, sans-serif' }}>{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-gradient-to-r from-[#8B7355] to-[#A67C52] text-white px-6 py-3 rounded-xl hover:from-[#6B5644] hover:to-[#8B6644] transition-all font-semibold shadow-lg text-sm sm:text-base"
              style={{ fontFamily: 'Tajawal, sans-serif' }}
            >
              إعادة المحاولة
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FAF9F6] to-[#F5F5DC] py-4 sm:py-6 md:py-8 pt-24" dir="rtl">
      <div className="container mx-auto px-3 sm:px-4 lg:px-6 max-w-7xl">
        <div className="mb-4 sm:mb-6 md:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#8B7355] flex items-center gap-2 sm:gap-3" style={{ fontFamily: 'Tajawal, sans-serif' }}>
            <ShoppingBag className="h-6 w-6 sm:h-7 sm:w-7 text-[#D4AF37]" />
            <span>طلباتي</span>
          </h1>
          <p className="text-sm sm:text-base text-[#8B7355]/70 mt-1 sm:mt-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
            تتبع جميع طلباتك من مكان واحد
          </p>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl p-8 sm:p-12 text-center border-2 border-[#E5DCC5]">
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-[#F5F5DC] to-[#E5DCC5] rounded-full mb-4">
              <Package className="h-8 w-8 sm:h-10 sm:w-10 text-[#8B7355]" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-[#8B7355] mb-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>لا توجد طلبات بعد</h2>
            <p className="text-sm sm:text-base text-[#8B7355]/70 mb-6" style={{ fontFamily: 'Tajawal, sans-serif' }}>لم تقم بإنشاء أي طلبات حتى الآن</p>
            <Link
              to="/"
              className="inline-block bg-gradient-to-r from-[#8B7355] to-[#A67C52] text-white px-6 py-3 rounded-xl hover:from-[#6B5644] hover:to-[#8B6644] transition-all font-semibold shadow-lg text-sm sm:text-base"
              style={{ fontFamily: 'Tajawal, sans-serif' }}
            >
              تصفح المنتجات
            </Link>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block bg-white rounded-2xl shadow-xl border-2 border-[#E5DCC5] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gradient-to-r from-[#F5F5DC] to-[#E5DCC5]">
                    <tr>
                      <th className="px-6 py-4 text-right text-xs font-bold text-[#8B7355] uppercase tracking-wider" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                        رقم الطلب
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-[#8B7355] uppercase tracking-wider" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                        <Calendar className="inline h-4 w-4 ml-1" />
                        التاريخ
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-[#8B7355] uppercase tracking-wider" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                        الإجمالي
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-[#8B7355] uppercase tracking-wider" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                        <CreditCard className="inline h-4 w-4 ml-1" />
                        طريقة الدفع
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
                    {orders.map((order) => (
                      <tr key={order.id} className="hover:bg-[#FAF9F6] transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-[#8B7355]" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                          #{order.orderNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#8B7355]/70" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                          {formatDate(order.date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#D4AF37] font-black" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                          {order.total.toFixed(2)} جنيه
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#8B7355]" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                          {getPaymentMethodText(order.paymentMethod)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold border-2 ${getStatusColor(order.status)}`} style={{ fontFamily: 'Tajawal, sans-serif' }}>
                            {getStatusText(order.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Link
                            to={`/order/${order.id}`}
                            className="flex items-center gap-1 text-[#8B7355] hover:text-[#D4AF37] font-semibold transition-colors"
                            style={{ fontFamily: 'Tajawal, sans-serif' }}
                            title="عرض التفاصيل"
                          >
                            <Eye className="h-4 w-4" />
                            <span>عرض التفاصيل</span>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile/Tablet Card View */}
            <div className="block lg:hidden space-y-3 sm:space-y-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white rounded-xl sm:rounded-2xl shadow-lg border-2 border-[#E5DCC5] p-4 sm:p-5 transition-all duration-200 hover:shadow-xl"
                >
                  <div className="flex justify-between items-start mb-3 sm:mb-4">
                    <div>
                      <p className="font-black text-[#8B7355] text-base sm:text-lg" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                        #{order.orderNumber}
                      </p>
                      <p className="text-xs sm:text-sm text-[#8B7355]/70 flex items-center gap-1 mt-1" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                        <Calendar className="h-3 w-3" />
                        {formatDate(order.date)}
                      </p>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border-2 ${getStatusColor(order.status)}`} style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      {getStatusText(order.status)}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4 pb-4 border-b-2 border-[#E5DCC5]">
                    <div className="flex justify-between items-center">
                      <span className="text-xs sm:text-sm text-[#8B7355]/70" style={{ fontFamily: 'Tajawal, sans-serif' }}>المبلغ:</span>
                      <span className="text-sm sm:text-base font-black text-[#D4AF37]" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                        {order.total.toFixed(2)} جنيه
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs sm:text-sm text-[#8B7355]/70 flex items-center gap-1" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                        <CreditCard className="h-3 w-3" />
                        طريقة الدفع:
                      </span>
                      <span className="text-xs sm:text-sm text-[#8B7355] font-medium" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                        {getPaymentMethodText(order.paymentMethod)}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Link
                      to={`/order/${order.id}`}
                      className="flex items-center gap-1 text-xs sm:text-sm text-white bg-gradient-to-r from-[#8B7355] to-[#A67C52] px-3 sm:px-4 py-2 rounded-lg hover:from-[#6B5644] hover:to-[#8B6644] transition-all font-semibold shadow-md"
                      style={{ fontFamily: 'Tajawal, sans-serif' }}
                    >
                      <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span>عرض التفاصيل</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MyOrders;
