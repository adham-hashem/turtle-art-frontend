import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Package, ArrowRight, ShoppingBag, User, MapPin, Phone, Home, Calendar, CreditCard, Tag } from 'lucide-react';

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

const apiUrl = import.meta.env.VITE_API_BASE_URL;

const OrderDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        if (!apiUrl) {
          throw new Error('API base URL is not configured.');
        }

        if (!id) {
          throw new Error('Order ID is missing.');
        }

        const token = localStorage.getItem('accessToken');
        if (!token) {
          throw new Error('No access token found. Please log in again.');
        }

        const response = await fetch(`${apiUrl}/api/orders/${id}`, {
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
            throw new Error('Unauthorized: Please log in again.');
          }
          const errorText = await response.text();
          throw new Error(`Failed to fetch order: ${response.status} ${errorText}`);
        }

        const data: Order = await response.json();
        
        // Map numeric status and paymentMethod to string values
        const mappedOrder = {
          ...data,
          status: mapStatus(data.status),
          paymentMethod: mapPaymentMethod(data.paymentMethod),
        };

        setOrder(mappedOrder);
      } catch (err: any) {
        setError(err.message || 'An error occurred while fetching order details.');
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
      fetchOrder();
    } else {
      setError('You must be logged in to view order details.');
      setLoading(false);
    }
  }, [isAuthenticated, id]);

  // Helper functions
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

  const getPaymentMethodText = (method: string) => {
    switch (method.toLowerCase()) {
      case 'cash': return 'الدفع عند الاستلام';
      case 'card': return 'بطاقة ائتمانية';
      case 'onlinepayment': return 'دفع إلكتروني';
      default: return method;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'underreview': return 'bg-amber-100 text-amber-800 border-2 border-amber-200';
      case 'confirmed': return 'bg-blue-100 text-blue-800 border-2 border-blue-200';
      case 'shipped': return 'bg-[#C4A57B]/20 text-[#8B7355] border-2 border-[#C4A57B]';
      case 'delivered': return 'bg-green-100 text-green-800 border-2 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-2 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-2 border-gray-200';
    }
  };

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
      <div className="min-h-screen bg-gradient-to-b from-[#FAF9F6] to-[#F5F5DC] flex justify-center items-center py-12 pt-24" dir="rtl">
        <div className="text-center">
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-[#C4A57B] rounded-full blur-xl opacity-30 animate-pulse"></div>
            <div className="relative bg-gradient-to-r from-[#8B7355] to-[#A67C52] rounded-full p-4">
              <Package className="h-12 w-12 text-white animate-bounce" />
            </div>
          </div>
          <p className="text-[#8B7355] font-bold text-lg" style={{ fontFamily: 'Tajawal, sans-serif' }}>
            جاري تحميل تفاصيل الطلب...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#FAF9F6] to-[#F5F5DC] py-10 pt-24 px-4" dir="rtl">
        <div className="container mx-auto max-w-md">
          <div className="text-center py-10 bg-red-50 border-2 border-red-200 rounded-2xl shadow-lg">
            <p className="text-red-600 font-semibold" style={{ fontFamily: 'Tajawal, sans-serif' }}>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#FAF9F6] to-[#F5F5DC] py-12 pt-24 px-4" dir="rtl">
        <div className="container mx-auto max-w-md">
          <div className="text-center py-12 bg-white rounded-2xl shadow-lg border-2 border-[#E5DCC5]">
            <Package className="h-12 w-12 text-[#8B7355]/50 mx-auto mb-4" />
            <p className="text-[#8B7355]/70 font-semibold" style={{ fontFamily: 'Tajawal, sans-serif' }}>
              لم يتم العثور على الطلب.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FAF9F6] to-[#F5F5DC] py-8 pt-24 px-4" dir="rtl">
      <div className="container mx-auto max-w-6xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#8B7355] flex items-center gap-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
            <Package className="h-6 w-6 sm:h-7 sm:w-7 text-[#D4AF37]" />
            <span>تفاصيل الطلب #{order.orderNumber}</span>
          </h1>
          <Link
            to="/my-orders"
            className="flex items-center text-[#8B7355] hover:text-[#D4AF37] font-semibold transition-colors"
            style={{ fontFamily: 'Tajawal, sans-serif' }}
          >
            <ArrowRight className="h-4 w-4 ml-1" />
            <span className="hidden sm:inline">العودة إلى الطلبات</span>
            <span className="sm:hidden">رجوع</span>
          </Link>
        </div>

        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl border-2 border-[#E5DCC5] p-4 sm:p-6 md:p-8">
          {/* Order Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Order Info */}
            <div className="bg-gradient-to-br from-[#FAF9F6] to-[#F5F5DC] rounded-xl p-5 border-2 border-[#E5DCC5]">
              <h2 className="text-lg font-bold text-[#8B7355] mb-4 flex items-center gap-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                <ShoppingBag className="h-5 w-5 text-[#D4AF37]" />
                <span>معلومات الطلب</span>
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[#8B7355]/70 text-sm flex items-center gap-1" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    <Calendar className="h-4 w-4" />
                    التاريخ:
                  </span>
                  <span className="text-[#8B7355] font-medium text-sm" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    {formatDate(order.date)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#8B7355]/70 text-sm" style={{ fontFamily: 'Tajawal, sans-serif' }}>الحالة:</span>
                  <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold ${getStatusColor(order.status)}`} style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    {getStatusText(order.status)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#8B7355]/70 text-sm flex items-center gap-1" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    <CreditCard className="h-4 w-4" />
                    طريقة الدفع:
                  </span>
                  <span className="text-[#8B7355] font-medium text-sm" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    {getPaymentMethodText(order.paymentMethod)}
                  </span>
                </div>
                {order.paymentTransactionId && (
                  <div className="flex justify-between items-center">
                    <span className="text-[#8B7355]/70 text-sm" style={{ fontFamily: 'Tajawal, sans-serif' }}>رقم المعاملة:</span>
                    <span className="text-[#8B7355] font-medium text-sm" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      {order.paymentTransactionId}
                    </span>
                  </div>
                )}
                {order.discountCodeUsed && (
                  <div className="flex justify-between items-center bg-green-50 p-2 rounded-lg border border-green-200">
                    <span className="text-green-700 text-sm flex items-center gap-1" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      <Tag className="h-4 w-4" />
                      كود الخصم:
                    </span>
                    <span className="text-green-800 font-bold text-sm" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      {order.discountCodeUsed}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-3 border-t-2 border-[#E5DCC5]">
                  <span className="text-[#8B7355] font-bold text-base" style={{ fontFamily: 'Tajawal, sans-serif' }}>الإجمالي:</span>
                  <span className="text-[#D4AF37] font-black text-xl" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    {order.total.toFixed(2)} جنيه
                  </span>
                </div>
              </div>
            </div>

            {/* Shipping Info */}
            <div className="bg-gradient-to-br from-[#FAF9F6] to-[#F5F5DC] rounded-xl p-5 border-2 border-[#E5DCC5]">
              <h2 className="text-lg font-bold text-[#8B7355] mb-4 flex items-center gap-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                <MapPin className="h-5 w-5 text-[#D4AF37]" />
                <span>معلومات الشحن</span>
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <span className="text-[#8B7355]/70 text-sm flex items-center gap-1" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    <User className="h-4 w-4" />
                    الاسم:
                  </span>
                  <span className="text-[#8B7355] font-medium text-sm text-left" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    {order.fullName || 'غير متوفر'}
                  </span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-[#8B7355]/70 text-sm flex items-center gap-1" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    <Phone className="h-4 w-4" />
                    رقم الهاتف:
                  </span>
                  <span className="text-[#8B7355] font-medium text-sm" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    {order.phoneNumber || 'غير متوفر'}
                  </span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-[#8B7355]/70 text-sm flex items-center gap-1" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    <Home className="h-4 w-4" />
                    العنوان:
                  </span>
                  <span className="text-[#8B7355] font-medium text-sm text-left max-w-[60%]" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    {order.address || 'غير متوفر'}
                  </span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-[#8B7355]/70 text-sm flex items-center gap-1" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    <MapPin className="h-4 w-4" />
                    المحافظة:
                  </span>
                  <span className="text-[#8B7355] font-medium text-sm" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    {order.governorate || 'غير متوفر'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div>
            <h2 className="text-lg font-bold text-[#8B7355] mb-4 flex items-center gap-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
              <Package className="h-5 w-5 text-[#D4AF37]" />
              <span>المنتجات ({order.items.length})</span>
            </h2>

            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto rounded-xl border-2 border-[#E5DCC5]">
              <table className="min-w-full bg-white">
                <thead className="bg-gradient-to-r from-[#F5F5DC] to-[#E5DCC5]">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-bold text-[#8B7355] uppercase tracking-wider" style={{ fontFamily: 'Tajawal, sans-serif' }}>المنتج</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-[#8B7355] uppercase tracking-wider" style={{ fontFamily: 'Tajawal, sans-serif' }}>كود المنتج</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-[#8B7355] uppercase tracking-wider" style={{ fontFamily: 'Tajawal, sans-serif' }}>الكمية</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-[#8B7355] uppercase tracking-wider" style={{ fontFamily: 'Tajawal, sans-serif' }}>السعر</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-[#8B7355] uppercase tracking-wider" style={{ fontFamily: 'Tajawal, sans-serif' }}>المقاس</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-[#8B7355] uppercase tracking-wider" style={{ fontFamily: 'Tajawal, sans-serif' }}>اللون</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-[#F5F5DC]">
                  {order.items.map((item) => (
                    <tr key={item.id} className="hover:bg-[#FAF9F6] transition-colors">
                      <td className="px-6 py-4 text-sm text-[#8B7355] font-medium" style={{ fontFamily: 'Tajawal, sans-serif' }}>{item.productName}</td>
                      <td className="px-6 py-4 text-sm text-[#8B7355]/70" style={{ fontFamily: 'Tajawal, sans-serif' }}>{item.productCode}</td>
                      <td className="px-6 py-4 text-sm text-[#8B7355]/70 font-bold" style={{ fontFamily: 'Tajawal, sans-serif' }}>{item.quantity}</td>
                      <td className="px-6 py-4 text-sm text-[#D4AF37] font-bold" style={{ fontFamily: 'Tajawal, sans-serif' }}>{item.priceAtPurchase.toFixed(2)} جنيه</td>
                      <td className="px-6 py-4 text-sm text-[#8B7355]/70" style={{ fontFamily: 'Tajawal, sans-serif' }}>{item.size || '-'}</td>
                      <td className="px-6 py-4 text-sm text-[#8B7355]/70" style={{ fontFamily: 'Tajawal, sans-serif' }}>{item.color || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden space-y-3">
              {order.items.map((item) => (
                <div key={item.id} className="bg-gradient-to-br from-[#FAF9F6] to-[#F5F5DC] rounded-xl p-4 border-2 border-[#E5DCC5]">
                  <h3 className="font-bold text-[#8B7355] mb-2 text-sm" style={{ fontFamily: 'Tajawal, sans-serif' }}>{item.productName}</h3>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-[#8B7355]/70" style={{ fontFamily: 'Tajawal, sans-serif' }}>كود المنتج:</span>
                      <span className="text-[#8B7355]" style={{ fontFamily: 'Tajawal, sans-serif' }}>{item.productCode}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#8B7355]/70" style={{ fontFamily: 'Tajawal, sans-serif' }}>الكمية:</span>
                      <span className="text-[#8B7355] font-bold" style={{ fontFamily: 'Tajawal, sans-serif' }}>{item.quantity}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#8B7355]/70" style={{ fontFamily: 'Tajawal, sans-serif' }}>السعر:</span>
                      <span className="text-[#D4AF37] font-bold" style={{ fontFamily: 'Tajawal, sans-serif' }}>{item.priceAtPurchase.toFixed(2)} جنيه</span>
                    </div>
                    {item.size && (
                      <div className="flex justify-between">
                        <span className="text-[#8B7355]/70" style={{ fontFamily: 'Tajawal, sans-serif' }}>المقاس:</span>
                        <span className="text-[#8B7355]" style={{ fontFamily: 'Tajawal, sans-serif' }}>{item.size}</span>
                      </div>
                    )}
                    {item.color && (
                      <div className="flex justify-between">
                        <span className="text-[#8B7355]/70" style={{ fontFamily: 'Tajawal, sans-serif' }}>اللون:</span>
                        <span className="text-[#8B7355]" style={{ fontFamily: 'Tajawal, sans-serif' }}>{item.color}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
