import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Check, 
  Ship, 
  Package, 
  Eye, 
  Search, 
  Filter, 
  AlertCircle, 
  Trash2, 
  User, 
  Phone,
  MapPin,
  ChevronDown,
  ChevronUp,
  X,
  RefreshCw,
  Sparkles,
  ShoppingCart,
  Calendar,
  DollarSign,
  Tag
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

// Interfaces based on backend DTOs
interface OrderItemResponseDto {
  id: string;
  productId: string;
  productName: string;
  productCode: string;
  quantity: number;
  priceAtPurchase: number;
  size: string;
  color: string;
}

interface OrderResponseDto {
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
  items: OrderItemResponseDto[];
}

interface PaginatedOrdersResponse {
  items: OrderResponseDto[];
  totalItems: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

const OrdersManagement: React.FC = () => {
  const { isAuthenticated, userRole } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<OrderResponseDto | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('all');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [customerOrders, setCustomerOrders] = useState<OrderResponseDto[]>([]);
  const [showCustomerOrders, setShowCustomerOrders] = useState(false);

  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const pageSize = 10;

  const statusSequence = ['UnderReview', 'Confirmed', 'Shipped', 'Delivered'];

  const getPreviousStatus = (currentStatus: string): string | null => {
    if (currentStatus === 'Cancelled') {
      return 'UnderReview';
    }
    const index = statusSequence.findIndex(s => s === currentStatus);
    if (index > 0) {
      return statusSequence[index - 1];
    }
    return null;
  };

  // Check authentication and role on mount
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (userRole !== 'admin') {
      navigate('/');
      return;
    }

    fetchOrders(currentPage);
  }, [isAuthenticated, userRole, navigate, currentPage]);

  // Helper functions to map numeric values to strings
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

  // Fetch orders from backend
  const fetchOrders = async (page: number = 1) => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        navigate('/login');
        throw new Error('No authentication token found. Please log in again.');
      }

      const response = await fetch(
        `${apiUrl}/api/orders?pageNumber=${page}&pageSize=${pageSize}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const responseText = await response.text();

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('accessToken');
          navigate('/login');
          throw new Error('Unauthorized: Please log in again.');
        } else if (response.status === 403) {
          navigate('/');
          throw new Error('Forbidden: Admin access required.');
        }
        throw new Error(`Failed to fetch orders: ${response.status} ${responseText}`);
      }

      const data: PaginatedOrdersResponse = JSON.parse(responseText);
      
      const mappedOrders = data.items.map(order => ({
        ...order,
        status: mapStatus(order.status),
        paymentMethod: mapPaymentMethod(order.paymentMethod),
      }));

      setOrders(mappedOrders);
      setTotalPages(data.totalPages);
      setTotalItems(data.totalItems);
      setCurrentPage(data.pageNumber);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  // Search order by order number
  const searchOrderByNumber = async (orderNumber: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        navigate('/login');
        throw new Error('No authentication token found. Please log in again.');
      }

      setLoading(true);
      const response = await fetch(
        `${apiUrl}/api/orders/number/${orderNumber}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          alert('لم يتم العثور على الطلب');
          return;
        }
        throw new Error(`Failed to search order: ${response.status}`);
      }

      const orderDetails: OrderResponseDto = await response.json();
      const mappedOrderDetails = {
        ...orderDetails,
        status: mapStatus(orderDetails.status),
        paymentMethod: mapPaymentMethod(orderDetails.paymentMethod),
      };
      
      setSelectedOrder(mappedOrderDetails);
      setShowOrderDetails(true);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'فشل في البحث عن الطلب');
    } finally {
      setLoading(false);
    }
  };

  // Get customer orders
  const getCustomerOrders = async (customerId: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        navigate('/login');
        throw new Error('No authentication token found. Please log in again.');
      }

      setLoading(true);
      const response = await fetch(
        `${apiUrl}/api/orders/customer/${customerId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          alert('لا توجد طلبات لهذا العميل');
          return;
        }
        throw new Error(`Failed to fetch customer orders: ${response.status}`);
      }

      const orders: OrderResponseDto[] = await response.json();
      const mappedOrders = orders.map(order => ({
        ...order,
        status: mapStatus(order.status),
        paymentMethod: mapPaymentMethod(order.paymentMethod),
      }));
      
      setCustomerOrders(mappedOrders);
      setShowCustomerOrders(true);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'فشل في جلب طلبات العميل');
    } finally {
      setLoading(false);
    }
  };

  // Update order status
  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        navigate('/login');
        throw new Error('No authentication token found. Please log in again.');
      }

      setLoading(true);
      const response = await fetch(
        `${apiUrl}/api/orders/${orderId}/status`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newStatus),
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('accessToken');
          navigate('/login');
          throw new Error('Unauthorized: Please log in again.');
        } else if (response.status === 403) {
          navigate('/');
          throw new Error('Forbidden: Admin access required.');
        }
        const errorText = await response.text();
        throw new Error(`Failed to update order status: ${response.status} ${errorText}`);
      }

      await fetchOrders(currentPage);
      alert('تم تحديث حالة الطلب بنجاح');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'فشل في تحديث حالة الطلب');
    } finally {
      setLoading(false);
    }
  };

  // Delete order
  const deleteOrder = async (orderId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الطلب؟')) {
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        navigate('/login');
        throw new Error('No authentication token found. Please log in again.');
      }

      setLoading(true);
      const response = await fetch(
        `${apiUrl}/api/orders/${orderId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('accessToken');
          navigate('/login');
          throw new Error('Unauthorized: Please log in again.');
        } else if (response.status === 403) {
          navigate('/');
          throw new Error('Forbidden: Admin access required.');
        }
        const errorText = await response.text();
        throw new Error(`Failed to delete order: ${response.status} ${errorText}`);
      }

      await fetchOrders(currentPage);
      alert('تم حذف الطلب بنجاح');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'فشل في حذف الطلب');
    } finally {
      setLoading(false);
    }
  };

  // Get order details
  const getOrderDetails = async (orderId: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        navigate('/login');
        throw new Error('No authentication token found. Please log in again.');
      }

      const response = await fetch(
        `${apiUrl}/api/orders/${orderId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('accessToken');
          navigate('/login');
          throw new Error('Unauthorized: Please log in again.');
        } else if (response.status === 403) {
          navigate('/');
          throw new Error('Forbidden: Admin access required.');
        }
        const errorText = await response.text();
        throw new Error(`Failed to fetch order details: ${response.status} ${errorText}`);
      }

      const orderDetails: OrderResponseDto = await response.json();
      const mappedOrderDetails = {
        ...orderDetails,
        status: mapStatus(orderDetails.status),
        paymentMethod: mapPaymentMethod(orderDetails.paymentMethod),
      };
      setSelectedOrder(mappedOrderDetails);
      setShowOrderDetails(true);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'فشل في جلب تفاصيل الطلب');
    }
  };

  // Toggle row expansion
  const toggleRowExpansion = (orderId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedRows(newExpanded);
  };

  // Helper functions
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'underreview': return 'bg-amber-100 text-amber-800 border border-amber-200';
      case 'confirmed': return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'shipped': return 'bg-[#C4A57B]/20 text-[#8B7355] border border-[#C4A57B]';
      case 'delivered': return 'bg-green-100 text-green-800 border border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border border-red-200';
      default: return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      if (searchTerm.startsWith('ORD') || searchTerm.includes('-')) {
        searchOrderByNumber(searchTerm.trim());
      } else {
        fetchOrders(1);
      }
    }
  };

  // Filter orders based on search and filters
  const filteredOrders = orders.filter(order => {
    const matchesSearch = searchTerm === '' ||
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.fullName && order.fullName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'all' ||
      order.status.toLowerCase() === statusFilter.toLowerCase();

    const matchesPaymentMethod = paymentMethodFilter === 'all' ||
      order.paymentMethod.toLowerCase() === paymentMethodFilter.toLowerCase();

    return matchesSearch && matchesStatus && matchesPaymentMethod;
  });

  if (loading && orders.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B7355]"></div>
        <span className="mr-3 text-[#8B7355] font-medium" style={{ fontFamily: 'Tajawal, sans-serif' }}>جاري تحميل الطلبات...</span>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-[#F5F5DC] to-[#E5DCC5] p-3 rounded-xl border-2 border-[#E5DCC5]">
            <ShoppingCart className="h-6 w-6 text-[#8B7355]" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[#8B7355]" style={{ fontFamily: 'Tajawal, sans-serif' }}>إدارة الطلبات</h2>
            <p className="text-sm text-[#C4A57B]" style={{ fontFamily: 'Tajawal, sans-serif' }}>إجمالي الطلبات: {totalItems}</p>
          </div>
        </div>
        <Sparkles className="h-8 w-8 text-[#D4AF37] animate-pulse" />
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 mb-6 flex items-center shadow-lg">
          <AlertCircle className="h-5 w-5 text-red-600 ml-2 flex-shrink-0" />
          <span className="text-red-800 font-medium flex-1" style={{ fontFamily: 'Tajawal, sans-serif' }}>{error}</span>
          <button
            onClick={() => fetchOrders(currentPage)}
            className="mr-auto bg-red-100 hover:bg-red-200 px-4 py-2 rounded-xl text-sm text-red-800 flex items-center font-semibold transition-all"
            style={{ fontFamily: 'Tajawal, sans-serif' }}
          >
            <RefreshCw className="h-4 w-4 ml-1" />
            إعادة المحاولة
          </button>
        </div>
      )}

      {/* Mobile Search Bar */}
      <div className="block sm:hidden mb-4">
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#C4A57B] h-4 w-4" />
          <input
            type="text"
            placeholder="البحث برقم الطلب"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-10 pl-3 py-3 border-2 border-[#E5DCC5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] text-[#8B7355]"
            style={{ fontFamily: 'Tajawal, sans-serif' }}
            dir="rtl"
          />
          <button
            type="submit"
            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-[#8B7355] to-[#A67C52] text-white px-3 py-1.5 rounded-lg text-sm font-semibold"
            style={{ fontFamily: 'Tajawal, sans-serif' }}
          >
            بحث
          </button>
        </form>
      </div>

      {/* Mobile Filter Toggle */}
      <div className="block sm:hidden mb-4">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="w-full flex items-center justify-center bg-[#FAF9F6] text-[#8B7355] py-3 px-4 rounded-xl font-semibold border-2 border-[#E5DCC5]"
          style={{ fontFamily: 'Tajawal, sans-serif' }}
        >
          <Filter className="h-4 w-4 ml-2" />
          فلترة الطلبات
          {showFilters ? <ChevronUp className="h-4 w-4 mr-2" /> : <ChevronDown className="h-4 w-4 mr-2" />}
        </button>
      </div>

      {/* Filters */}
      <div className={`bg-gradient-to-br from-white to-[#FAF9F6] rounded-2xl shadow-xl border-2 border-[#E5DCC5] p-6 mb-6 ${showFilters ? 'block' : 'hidden sm:block'}`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="hidden sm:block relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#C4A57B] h-4 w-4" />
            <input
              type="text"
              placeholder="البحث برقم الطلب"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-10 pl-3 py-3 border-2 border-[#E5DCC5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] text-[#8B7355]"
              style={{ fontFamily: 'Tajawal, sans-serif' }}
              dir="rtl"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 border-2 border-[#E5DCC5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] text-right font-medium text-[#8B7355]"
            style={{ fontFamily: 'Tajawal, sans-serif' }}
            dir="rtl"
          >
            <option value="all">جميع الحالات</option>
            <option value="underreview">تحت المراجعة</option>
            <option value="confirmed">مؤكد</option>
            <option value="shipped">تم الشحن</option>
            <option value="delivered">تم التسليم</option>
            <option value="cancelled">ملغي</option>
          </select>

          <select
            value={paymentMethodFilter}
            onChange={(e) => setPaymentMethodFilter(e.target.value)}
            className="px-4 py-3 border-2 border-[#E5DCC5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] text-right font-medium text-[#8B7355]"
            style={{ fontFamily: 'Tajawal, sans-serif' }}
            dir="rtl"
          >
            <option value="all">جميع طرق الدفع</option>
            <option value="cash">الدفع عند الاستلام</option>
            <option value="card">بطاقة ائتمانية</option>
            <option value="onlinepayment">دفع إلكتروني</option>
          </select>

          <button
            onClick={() => fetchOrders(1)}
            className="bg-gradient-to-r from-[#8B7355] to-[#A67C52] text-white px-6 py-3 rounded-xl hover:from-[#6B5644] hover:to-[#8B6644] transition-all flex items-center justify-center font-semibold shadow-md"
            style={{ fontFamily: 'Tajawal, sans-serif' }}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ml-2 ${loading ? 'animate-spin' : ''}`} />
            تحديث
          </button>
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-16 bg-gradient-to-br from-white to-[#FAF9F6] rounded-2xl shadow-xl border-2 border-[#E5DCC5]">
          <div className="text-7xl mb-4">🛒</div>
          <p className="text-xl font-bold text-[#8B7355] mb-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>لا توجد طلبات</p>
          <p className="text-[#8B7355]/70 mb-6" style={{ fontFamily: 'Tajawal, sans-serif' }}>لم يتم العثور على أي طلبات حالياً</p>
          <button
            onClick={() => fetchOrders(currentPage)}
            className="bg-gradient-to-r from-[#8B7355] to-[#A67C52] text-white px-6 py-3 rounded-xl hover:from-[#6B5644] hover:to-[#8B6644] transition-all flex items-center mx-auto font-semibold shadow-lg"
            style={{ fontFamily: 'Tajawal, sans-serif' }}
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4 ml-2" />
            إعادة التحميل
          </button>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-2xl shadow-xl border-2 border-[#E5DCC5] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gradient-to-r from-[#F5F5DC] to-[#E5DCC5]">
                  <tr>
                    <th className="px-4 py-4 text-right text-xs font-bold text-[#8B7355] uppercase tracking-wider" style={{ fontFamily: 'Tajawal, sans-serif' }}>رقم الطلب</th>
                    <th className="px-4 py-4 text-right text-xs font-bold text-[#8B7355] uppercase tracking-wider" style={{ fontFamily: 'Tajawal, sans-serif' }}>العميل</th>
                    <th className="px-4 py-4 text-right text-xs font-bold text-[#8B7355] uppercase tracking-wider" style={{ fontFamily: 'Tajawal, sans-serif' }}>الإجمالي</th>
                    <th className="px-4 py-4 text-right text-xs font-bold text-[#8B7355] uppercase tracking-wider" style={{ fontFamily: 'Tajawal, sans-serif' }}>الحالة</th>
                    <th className="px-4 py-4 text-right text-xs font-bold text-[#8B7355] uppercase tracking-wider" style={{ fontFamily: 'Tajawal, sans-serif' }}>الدفع</th>
                    <th className="px-4 py-4 text-right text-xs font-bold text-[#8B7355] uppercase tracking-wider" style={{ fontFamily: 'Tajawal, sans-serif' }}>التاريخ</th>
                    <th className="px-4 py-4 text-right text-xs font-bold text-[#8B7355] uppercase tracking-wider" style={{ fontFamily: 'Tajawal, sans-serif' }}>الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y-2 divide-[#F5F5DC]">
                  {filteredOrders.map((order) => {
                    const previous = getPreviousStatus(order.status);
                    return (
                      <React.Fragment key={order.id}>
                        <tr className="hover:bg-[#FAF9F6] transition-colors">
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <ShoppingCart className="h-4 w-4 text-[#D4AF37]" />
                              <span className="text-sm font-bold text-[#8B7355]" style={{ fontFamily: 'Tajawal, sans-serif' }}>#{order.orderNumber}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm">
                            <button
                              onClick={() => getCustomerOrders(order.customerId)}
                              className="text-[#8B7355] hover:text-[#D4AF37] underline font-medium"
                              style={{ fontFamily: 'Tajawal, sans-serif' }}
                            >
                              {order.customerId.substring(0, 8)}...
                            </button>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-4 w-4 text-green-600" />
                              <span className="text-sm font-bold text-[#8B7355]" style={{ fontFamily: 'Tajawal, sans-serif' }}>{order.total.toFixed(2)} جنيه</span>
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(order.status)}`} style={{ fontFamily: 'Tajawal, sans-serif' }}>
                              {getStatusText(order.status)}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-[#8B7355]/70" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                            {getPaymentMethodText(order.paymentMethod)}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-1 text-sm text-[#8B7355]/70" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                              <Calendar className="h-4 w-4 text-[#C4A57B]" />
                              {formatDate(order.date)}
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => toggleRowExpansion(order.id)}
                                className="text-[#8B7355] hover:text-[#D4AF37] p-2 hover:bg-[#FAF9F6] rounded-lg transition-all"
                                title={expandedRows.has(order.id) ? 'إخفاء التفاصيل' : 'عرض التفاصيل'}
                              >
                                {expandedRows.has(order.id) ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                              </button>
                              <button
                                onClick={() => getOrderDetails(order.id)}
                                className="text-[#8B7355] hover:text-[#D4AF37] p-2 hover:bg-[#FAF9F6] rounded-lg transition-all"
                                title="عرض التفاصيل الكاملة"
                                disabled={loading}
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              {order.status.toLowerCase() === 'underreview' && (
                                <button
                                  onClick={() => updateOrderStatus(order.id, 'Confirmed')}
                                  className="bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-blue-600 transition-all flex items-center font-semibold shadow-sm"
                                  style={{ fontFamily: 'Tajawal, sans-serif' }}
                                  title="تأكيد الطلب"
                                  disabled={loading}
                                >
                                  <Check className="h-3 w-3 mr-1" />
                                  تأكيد
                                </button>
                              )}
                              {order.status.toLowerCase() === 'confirmed' && (
                                <button
                                  onClick={() => updateOrderStatus(order.id, 'Shipped')}
                                  className="bg-[#8B7355] text-white px-3 py-1.5 rounded-lg text-xs hover:bg-[#6B5644] transition-all flex items-center font-semibold shadow-sm"
                                  style={{ fontFamily: 'Tajawal, sans-serif' }}
                                  title="تم الشحن"
                                  disabled={loading}
                                >
                                  <Ship className="h-3 w-3 mr-1" />
                                  شحن
                                </button>
                              )}
                              {order.status.toLowerCase() === 'shipped' && (
                                <button
                                  onClick={() => updateOrderStatus(order.id, 'Delivered')}
                                  className="bg-green-500 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-green-600 transition-all flex items-center font-semibold shadow-sm"
                                  style={{ fontFamily: 'Tajawal, sans-serif' }}
                                  title="تم التسليم"
                                  disabled={loading}
                                >
                                  <Package className="h-3 w-3 mr-1" />
                                  تسليم
                                </button>
                              )}
                              {previous && (
                                <button
                                  onClick={() => updateOrderStatus(order.id, previous)}
                                  className="bg-amber-500 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-amber-600 transition-all flex items-center font-semibold shadow-sm"
                                  style={{ fontFamily: 'Tajawal, sans-serif' }}
                                  title={`التراجع إلى ${getStatusText(previous)}`}
                                  disabled={loading}
                                >
                                  <RefreshCw className="h-3 w-3 mr-1" />
                                  تراجع
                                </button>
                              )}
                              <button
                                onClick={() => deleteOrder(order.id)}
                                className="text-red-600 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-all"
                                title="حذف الطلب"
                                disabled={loading}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                        {expandedRows.has(order.id) && (
                          <tr>
                            <td colSpan={7} className="px-4 py-4 bg-gradient-to-br from-[#FAF9F6] to-[#F5F5DC]">
                              <div className="space-y-4">
                                {/* Customer Info */}
                                {(order.fullName || order.phoneNumber || order.address) && (
                                  <div className="bg-white rounded-xl p-4 border-2 border-[#E5DCC5]">
                                    <h4 className="text-sm font-bold text-[#8B7355] mb-3 flex items-center gap-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                                      <User className="h-4 w-4" />
                                      معلومات العميل
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                      {order.fullName && (
                                        <div className="flex items-center gap-2">
                                          <User className="h-4 w-4 text-[#C4A57B]" />
                                          <span className="text-[#8B7355]/70" style={{ fontFamily: 'Tajawal, sans-serif' }}>{order.fullName}</span>
                                        </div>
                                      )}
                                      {order.phoneNumber && (
                                        <div className="flex items-center gap-2">
                                          <Phone className="h-4 w-4 text-[#C4A57B]" />
                                          <span className="text-[#8B7355]/70" style={{ fontFamily: 'Tajawal, sans-serif' }}>{order.phoneNumber}</span>
                                        </div>
                                      )}
                                      {order.address && (
                                        <div className="flex items-center gap-2 md:col-span-2">
                                          <MapPin className="h-4 w-4 text-[#C4A57B]" />
                                          <span className="text-[#8B7355]/70" style={{ fontFamily: 'Tajawal, sans-serif' }}>{order.address}, {order.governorate}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* Discount Code */}
                                {order.discountCodeUsed && (
                                  <div className="bg-green-50 rounded-xl p-3 border-2 border-green-200">
                                    <div className="flex items-center gap-2">
                                      <Tag className="h-4 w-4 text-green-600" />
                                      <span className="text-sm font-bold text-green-700" style={{ fontFamily: 'Tajawal, sans-serif' }}>كود الخصم: {order.discountCodeUsed}</span>
                                    </div>
                                  </div>
                                )}

                                {/* Order Items */}
                                <div className="bg-white rounded-xl p-4 border-2 border-[#E5DCC5]">
                                  <h4 className="text-sm font-bold text-[#8B7355] mb-3 flex items-center gap-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                                    <Package className="h-4 w-4" />
                                    عناصر الطلب ({order.items.length})
                                  </h4>
                                  <div className="space-y-3">
                                    {order.items.map((item, index) => (
                                      <div
                                        key={index}
                                        className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 bg-[#FAF9F6] rounded-lg border border-[#E5DCC5]"
                                      >
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2 mb-2">
                                            <Package className="h-4 w-4 text-[#D4AF37]" />
                                            <p className="font-bold text-[#8B7355]" style={{ fontFamily: 'Tajawal, sans-serif' }}>{item.productName}</p>
                                          </div>
                                          <div className="text-sm text-[#8B7355]/70 grid grid-cols-2 gap-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                                            <p><span className="font-semibold">كود:</span> {item.productCode}</p>
                                            <p><span className="font-semibold">الكمية:</span> {item.quantity}</p>
                                            {item.size && <p><span className="font-semibold">المقاس:</span> {item.size}</p>}
                                            {item.color && <p><span className="font-semibold">اللون:</span> {item.color}</p>}
                                          </div>
                                        </div>
                                        <div className="mt-3 sm:mt-0 sm:mr-4">
                                          <p className="font-bold text-[#8B7355] text-lg" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                                            {item.priceAtPurchase.toFixed(2)} جنيه
                                          </p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View - due to length limit, I'll continue this in the response after showing the pattern */}
                    {/* Mobile Card View */}
          <div className="block md:hidden space-y-4">
            {filteredOrders.map((order) => {
              const previous = getPreviousStatus(order.status);
              return (
                <div key={order.id} className="bg-white rounded-2xl shadow-lg border-2 border-[#E5DCC5] p-4 transition-all duration-200 hover:shadow-xl">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="h-5 w-5 text-[#D4AF37]" />
                      <div>
                        <p className="font-bold text-[#8B7355]" style={{ fontFamily: 'Tajawal, sans-serif' }}>#{order.orderNumber}</p>
                        <p className="text-xs text-[#8B7355]/70 flex items-center gap-1 mt-1" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                          <Calendar className="h-3 w-3" />
                          {formatDate(order.date)}
                        </p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(order.status)}`} style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      {getStatusText(order.status)}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4 border-t-2 border-[#F5F5DC] pt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[#8B7355]/70" style={{ fontFamily: 'Tajawal, sans-serif' }}>العميل:</span>
                      <button
                        onClick={() => getCustomerOrders(order.customerId)}
                        className="text-sm text-[#8B7355] hover:text-[#D4AF37] underline font-medium"
                        style={{ fontFamily: 'Tajawal, sans-serif' }}
                      >
                        {order.customerId.substring(0, 8)}...
                      </button>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[#8B7355]/70" style={{ fontFamily: 'Tajawal, sans-serif' }}>المبلغ:</span>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-bold text-[#8B7355]" style={{ fontFamily: 'Tajawal, sans-serif' }}>{order.total.toFixed(2)} جنيه</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[#8B7355]/70" style={{ fontFamily: 'Tajawal, sans-serif' }}>طريقة الدفع:</span>
                      <span className="text-sm text-[#8B7355] font-medium" style={{ fontFamily: 'Tajawal, sans-serif' }}>{getPaymentMethodText(order.paymentMethod)}</span>
                    </div>
                  </div>

                  {expandedRows.has(order.id) && (
                    <div className="border-t-2 border-[#F5F5DC] pt-3 mt-3 space-y-3">
                      {/* Customer Info */}
                      {order.fullName && (
                        <div className="flex items-center gap-2 text-sm">
                          <User className="h-4 w-4 text-[#C4A57B]" />
                          <span className="text-[#8B7355]/70" style={{ fontFamily: 'Tajawal, sans-serif' }}>{order.fullName}</span>
                        </div>
                      )}
                      {order.phoneNumber && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-[#C4A57B]" />
                          <span className="text-[#8B7355]/70" style={{ fontFamily: 'Tajawal, sans-serif' }}>{order.phoneNumber}</span>
                        </div>
                      )}
                      {order.address && (
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-[#C4A57B]" />
                          <span className="text-[#8B7355]/70" style={{ fontFamily: 'Tajawal, sans-serif' }}>{order.address}, {order.governorate}</span>
                        </div>
                      )}

                      {/* Discount Code */}
                      {order.discountCodeUsed && (
                        <div className="bg-green-50 rounded-lg p-2 border border-green-200">
                          <div className="flex items-center gap-2">
                            <Tag className="h-4 w-4 text-green-600" />
                            <span className="text-xs font-bold text-green-700" style={{ fontFamily: 'Tajawal, sans-serif' }}>كود الخصم: {order.discountCodeUsed}</span>
                          </div>
                        </div>
                      )}

                      {/* Order Items */}
                      <div className="bg-[#FAF9F6] rounded-lg p-3 border border-[#E5DCC5]">
                        <h5 className="text-xs font-bold text-[#8B7355] mb-2 flex items-center gap-1" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                          <Package className="h-3 w-3" />
                          عناصر الطلب ({order.items.length})
                        </h5>
                        <div className="space-y-2">
                          {order.items.map((item, index) => (
                            <div key={index} className="bg-white rounded-lg p-2 border border-[#E5DCC5]">
                              <p className="text-xs font-bold text-[#8B7355] mb-1" style={{ fontFamily: 'Tajawal, sans-serif' }}>{item.productName}</p>
                              <div className="text-xs text-[#8B7355]/70 space-y-0.5" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                                <p>كود: {item.productCode} | الكمية: {item.quantity}</p>
                                {item.size && <p>المقاس: {item.size}</p>}
                                {item.color && <p>اللون: {item.color}</p>}
                                <p className="font-bold text-[#8B7355] mt-1">{item.priceAtPurchase.toFixed(2)} جنيه</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2 mt-4 border-t-2 border-[#F5F5DC] pt-3">
                    <button
                      onClick={() => toggleRowExpansion(order.id)}
                      className="flex-1 text-[#8B7355] bg-[#F5F5DC] px-3 py-2 rounded-lg text-xs hover:bg-[#E5DCC5] transition-all flex items-center justify-center font-semibold border border-[#E5DCC5]"
                      style={{ fontFamily: 'Tajawal, sans-serif' }}
                    >
                      {expandedRows.has(order.id) ? <ChevronUp className="h-3 w-3 mr-1" /> : <ChevronDown className="h-3 w-3 mr-1" />}
                      {expandedRows.has(order.id) ? 'إخفاء' : 'التفاصيل'}
                    </button>
                    <button
                      onClick={() => getOrderDetails(order.id)}
                      className="flex-1 text-[#8B7355] bg-[#F5F5DC] px-3 py-2 rounded-lg text-xs hover:bg-[#E5DCC5] transition-all flex items-center justify-center font-semibold border border-[#E5DCC5]"
                      style={{ fontFamily: 'Tajawal, sans-serif' }}
                      disabled={loading}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      عرض
                    </button>
                    {order.status.toLowerCase() === 'underreview' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'Confirmed')}
                        className="flex-1 bg-blue-500 text-white px-3 py-2 rounded-lg text-xs hover:bg-blue-600 transition-all flex items-center justify-center font-semibold"
                        style={{ fontFamily: 'Tajawal, sans-serif' }}
                        disabled={loading}
                      >
                        <Check className="h-3 w-3 mr-1" />
                        تأكيد
                      </button>
                    )}
                    {order.status.toLowerCase() === 'confirmed' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'Shipped')}
                        className="flex-1 bg-[#8B7355] text-white px-3 py-2 rounded-lg text-xs hover:bg-[#6B5644] transition-all flex items-center justify-center font-semibold"
                        style={{ fontFamily: 'Tajawal, sans-serif' }}
                        disabled={loading}
                      >
                        <Ship className="h-3 w-3 mr-1" />
                        شحن
                      </button>
                    )}
                    {order.status.toLowerCase() === 'shipped' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'Delivered')}
                        className="flex-1 bg-green-500 text-white px-3 py-2 rounded-lg text-xs hover:bg-green-600 transition-all flex items-center justify-center font-semibold"
                        style={{ fontFamily: 'Tajawal, sans-serif' }}
                        disabled={loading}
                      >
                        <Package className="h-3 w-3 mr-1" />
                        تسليم
                      </button>
                    )}
                    {previous && (
                      <button
                        onClick={() => updateOrderStatus(order.id, previous)}
                        className="flex-1 bg-amber-500 text-white px-3 py-2 rounded-lg text-xs hover:bg-amber-600 transition-all flex items-center justify-center font-semibold"
                        style={{ fontFamily: 'Tajawal, sans-serif' }}
                        disabled={loading}
                      >
                        <RefreshCw className="h-3 w-3 mr-1" />
                        تراجع
                      </button>
                    )}
                    <button
                      onClick={() => deleteOrder(order.id)}
                      className="text-red-600 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-all"
                      title="حذف الطلب"
                      disabled={loading}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex justify-center items-center space-x-4 space-x-reverse">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1 || loading}
                className="px-5 py-3 bg-gradient-to-r from-[#8B7355] to-[#A67C52] text-white rounded-xl hover:from-[#6B5644] hover:to-[#8B6644] disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all shadow-md"
                style={{ fontFamily: 'Tajawal, sans-serif' }}
              >
                السابق
              </button>
              <div className="bg-white px-6 py-3 rounded-xl border-2 border-[#E5DCC5] shadow-md">
                <span className="text-[#8B7355] font-bold" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                  {currentPage} / {totalPages}
                </span>
              </div>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages || loading}
                className="px-5 py-3 bg-gradient-to-r from-[#8B7355] to-[#A67C52] text-white rounded-xl hover:from-[#6B5644] hover:to-[#8B6644] disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all shadow-md"
                style={{ fontFamily: 'Tajawal, sans-serif' }}
              >
                التالي
              </button>
            </div>
          )}
        </>
      )}

      {/* Order Details Modal */}
      {showOrderDetails && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border-2 border-[#E5DCC5]">
            <div className="sticky top-0 bg-gradient-to-r from-[#F5F5DC] to-[#E5DCC5] p-6 border-b-2 border-[#E5DCC5] flex justify-between items-center">
              <h3 className="text-2xl font-bold text-[#8B7355] flex items-center gap-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                <ShoppingCart className="h-6 w-6" />
                تفاصيل الطلب #{selectedOrder.orderNumber}
              </h3>
              <button
                onClick={() => setShowOrderDetails(false)}
                className="text-gray-500 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition-all"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Order Status */}
              <div className="bg-gradient-to-br from-[#FAF9F6] to-[#F5F5DC] rounded-xl p-4 border-2 border-[#E5DCC5]">
                <div className="flex flex-wrap justify-between items-center gap-4">
                  <div>
                    <p className="text-sm text-[#8B7355]/70 mb-1" style={{ fontFamily: 'Tajawal, sans-serif' }}>حالة الطلب</p>
                    <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold ${getStatusColor(selectedOrder.status)}`} style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      {getStatusText(selectedOrder.status)}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-[#8B7355]/70 mb-1" style={{ fontFamily: 'Tajawal, sans-serif' }}>تاريخ الطلب</p>
                    <div className="flex items-center gap-2 text-[#8B7355]">
                      <Calendar className="h-4 w-4 text-[#D4AF37]" />
                      <span className="font-semibold" style={{ fontFamily: 'Tajawal, sans-serif' }}>{formatDate(selectedOrder.date)}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-[#8B7355]/70 mb-1" style={{ fontFamily: 'Tajawal, sans-serif' }}>إجمالي المبلغ</p>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-5 w-5 text-green-600" />
                      <span className="text-xl font-bold text-[#8B7355]" style={{ fontFamily: 'Tajawal, sans-serif' }}>{selectedOrder.total.toFixed(2)} جنيه</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer Information */}
              <div className="bg-white rounded-xl p-4 border-2 border-[#E5DCC5]">
                <h4 className="text-lg font-bold text-[#8B7355] mb-4 flex items-center gap-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                  <User className="h-5 w-5" />
                  معلومات العميل
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-[#FAF9F6] rounded-lg">
                    <User className="h-5 w-5 text-[#D4AF37]" />
                    <div>
                      <p className="text-xs text-[#8B7355]/70" style={{ fontFamily: 'Tajawal, sans-serif' }}>الاسم الكامل</p>
                      <p className="font-semibold text-[#8B7355]" style={{ fontFamily: 'Tajawal, sans-serif' }}>{selectedOrder.fullName || 'غير متوفر'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-[#FAF9F6] rounded-lg">
                    <Phone className="h-5 w-5 text-[#D4AF37]" />
                    <div>
                      <p className="text-xs text-[#8B7355]/70" style={{ fontFamily: 'Tajawal, sans-serif' }}>رقم الهاتف</p>
                      <p className="font-semibold text-[#8B7355]" style={{ fontFamily: 'Tajawal, sans-serif' }}>{selectedOrder.phoneNumber || 'غير متوفر'}</p>
                    </div>
                  </div>
                  {selectedOrder.address && (
                    <div className="flex items-start gap-3 p-3 bg-[#FAF9F6] rounded-lg md:col-span-2">
                      <MapPin className="h-5 w-5 text-[#D4AF37] mt-0.5" />
                      <div>
                        <p className="text-xs text-[#8B7355]/70" style={{ fontFamily: 'Tajawal, sans-serif' }}>العنوان</p>
                        <p className="font-semibold text-[#8B7355]" style={{ fontFamily: 'Tajawal, sans-serif' }}>{selectedOrder.address}, {selectedOrder.governorate}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Information */}
              <div className="bg-white rounded-xl p-4 border-2 border-[#E5DCC5]">
                <h4 className="text-lg font-bold text-[#8B7355] mb-4 flex items-center gap-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                  <DollarSign className="h-5 w-5" />
                  معلومات الدفع
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-[#FAF9F6] rounded-lg">
                    <span className="text-[#8B7355]/70" style={{ fontFamily: 'Tajawal, sans-serif' }}>طريقة الدفع</span>
                    <span className="font-semibold text-[#8B7355]" style={{ fontFamily: 'Tajawal, sans-serif' }}>{getPaymentMethodText(selectedOrder.paymentMethod)}</span>
                  </div>
                  {selectedOrder.paymentTransactionId && (
                    <div className="flex justify-between items-center p-3 bg-[#FAF9F6] rounded-lg">
                      <span className="text-[#8B7355]/70" style={{ fontFamily: 'Tajawal, sans-serif' }}>معرف المعاملة</span>
                      <span className="font-mono text-sm text-[#8B7355]">{selectedOrder.paymentTransactionId}</span>
                    </div>
                  )}
                  {selectedOrder.discountCodeUsed && (
                    <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border-2 border-green-200">
                      <Tag className="h-5 w-5 text-green-600" />
                      <span className="font-bold text-green-700" style={{ fontFamily: 'Tajawal, sans-serif' }}>كود الخصم المستخدم: {selectedOrder.discountCodeUsed}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Items */}
              <div className="bg-white rounded-xl p-4 border-2 border-[#E5DCC5]">
                <h4 className="text-lg font-bold text-[#8B7355] mb-4 flex items-center gap-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                  <Package className="h-5 w-5" />
                  عناصر الطلب ({selectedOrder.items.length})
                </h4>
                <div className="space-y-3">
                  {selectedOrder.items.map((item, index) => (
                    <div key={index} className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-4 bg-gradient-to-br from-[#FAF9F6] to-[#F5F5DC] rounded-xl border-2 border-[#E5DCC5]">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Package className="h-4 w-4 text-[#D4AF37]" />
                          <p className="font-bold text-[#8B7355]" style={{ fontFamily: 'Tajawal, sans-serif' }}>{item.productName}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm text-[#8B7355]/70" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                          <p><span className="font-semibold">كود المنتج:</span> {item.productCode}</p>
                          <p><span className="font-semibold">الكمية:</span> {item.quantity}</p>
                          {item.size && <p><span className="font-semibold">المقاس:</span> {item.size}</p>}
                          {item.color && <p><span className="font-semibold">اللون:</span> {item.color}</p>}
                        </div>
                      </div>
                      <div className="mt-3 sm:mt-0 sm:mr-4">
                        <p className="font-bold text-[#8B7355] text-xl" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                          {item.priceAtPurchase.toFixed(2)} جنيه
                        </p>
                        <p className="text-xs text-[#8B7355]/70" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                          الإجمالي: {(item.priceAtPurchase * item.quantity).toFixed(2)} جنيه
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gradient-to-r from-[#F5F5DC] to-[#E5DCC5] p-6 border-t-2 border-[#E5DCC5]">
              <button
                onClick={() => setShowOrderDetails(false)}
                className="w-full bg-gradient-to-r from-[#8B7355] to-[#A67C52] text-white py-3 px-6 rounded-xl hover:from-[#6B5644] hover:to-[#8B6644] transition-all font-semibold shadow-lg"
                style={{ fontFamily: 'Tajawal, sans-serif' }}
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Orders Modal */}
      {showCustomerOrders && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto border-2 border-[#E5DCC5]">
            <div className="sticky top-0 bg-gradient-to-r from-[#F5F5DC] to-[#E5DCC5] p-6 border-b-2 border-[#E5DCC5] flex justify-between items-center">
              <h3 className="text-2xl font-bold text-[#8B7355] flex items-center gap-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                <User className="h-6 w-6" />
                طلبات العميل ({customerOrders.length})
              </h3>
              <button
                onClick={() => setShowCustomerOrders(false)}
                className="text-gray-500 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition-all"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6">
              {customerOrders.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📦</div>
                  <p className="text-xl font-bold text-[#8B7355]" style={{ fontFamily: 'Tajawal, sans-serif' }}>لا توجد طلبات لهذا العميل</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {customerOrders.map((order) => (
                    <div key={order.id} className="bg-gradient-to-br from-white to-[#FAF9F6] rounded-xl p-4 border-2 border-[#E5DCC5] hover:shadow-lg transition-all">
                      <div className="flex flex-wrap justify-between items-center gap-4">
                        <div className="flex items-center gap-3">
                          <ShoppingCart className="h-5 w-5 text-[#D4AF37]" />
                          <div>
                            <p className="font-bold text-[#8B7355]" style={{ fontFamily: 'Tajawal, sans-serif' }}>#{order.orderNumber}</p>
                            <p className="text-xs text-[#8B7355]/70 flex items-center gap-1" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                              <Calendar className="h-3 w-3" />
                              {formatDate(order.date)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(order.status)}`} style={{ fontFamily: 'Tajawal, sans-serif' }}>
                            {getStatusText(order.status)}
                          </span>
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4 text-green-600" />
                            <span className="font-bold text-[#8B7355]" style={{ fontFamily: 'Tajawal, sans-serif' }}>{order.total.toFixed(2)} جنيه</span>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowCustomerOrders(false);
                            setShowOrderDetails(true);
                          }}
                          className="text-[#8B7355] hover:text-[#D4AF37] p-2 hover:bg-[#FAF9F6] rounded-lg transition-all"
                        >
                          <Eye className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-gradient-to-r from-[#F5F5DC] to-[#E5DCC5] p-6 border-t-2 border-[#E5DCC5]">
              <button
                onClick={() => setShowCustomerOrders(false)}
                className="w-full bg-gradient-to-r from-[#8B7355] to-[#A67C52] text-white py-3 px-6 rounded-xl hover:from-[#6B5644] hover:to-[#8B6644] transition-all font-semibold shadow-lg"
                style={{ fontFamily: 'Tajawal, sans-serif' }}
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersManagement;
