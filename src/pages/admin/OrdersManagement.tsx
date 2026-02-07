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
  Tag,
  Edit,
  Wallet,
  MessageSquare,
  History as HistoryIcon,
  CreditCard,
  Download
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import OrderEditModal from '../../components/admin/orders/OrderEditModal';
import PaymentTrackingPanel from '../../components/admin/orders/PaymentTrackingPanel';
import OrderNotesPanel from '../../components/admin/orders/OrderNotesPanel';
import OrderHistoryPanel from '../../components/admin/orders/OrderHistoryPanel';

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
  selectedExtensions?: string;
  extensionsDetails?: { id: string; name: string; additionalPrice: number }[];
  productUrl?: string;
  productImageUrl?: string;
}

interface OrderResponseDto {
  id: string;
  orderNumber: string;
  customerId: string;
  total: number;
  paymentMethod: 'InstaPay' | 'VodafoneCash' | 'OnlinePayment';
  status: 'UnderReview' | 'Confirmed' | 'Shipped' | 'Delivered' | 'Cancelled';
  date: string;
  discountCodeUsed: string | null;
  paymentTransactionId: string | null;
  fullName?: string;
  phoneNumber?: string;
  address?: string;
  governorate?: string;
  senderDetails?: string;
  paymentProofImage?: string;
  paymentNotes?: string;
  subtotal?: number;
  discountAmount?: number;
  shippingFee?: number;
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

  // Advanced Filter States
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [minTotal, setMinTotal] = useState<string>('');
  const [maxTotal, setMaxTotal] = useState<string>('');
  const [useAdvancedFilters, setUseAdvancedFilters] = useState(false);

  // Order Details Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [orderDetailsTab, setOrderDetailsTab] = useState<'details' | 'payments' | 'notes' | 'history'>('details');

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

  const mapPaymentMethod = (method: number | string): 'InstaPay' | 'VodafoneCash' | 'OnlinePayment' => {
    switch (Number(method)) {
      case 0: return 'InstaPay';
      case 1: return 'VodafoneCash';
      case 2: return 'OnlinePayment';
      default: return 'InstaPay';
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

  // Fetch orders with advanced filters
  const fetchFilteredOrders = async (page: number = 1) => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        navigate('/login');
        throw new Error('No authentication token found. Please log in again.');
      }

      // Build filter payload
      const filterPayload: any = {
        pageNumber: page,
        pageSize: pageSize,
      };

      // Add status filter
      if (statusFilter !== 'all') {
        const statusMap: { [key: string]: number } = {
          'UnderReview': 0,
          'Confirmed': 1,
          'Shipped': 2,
          'Delivered': 3,
          'Cancelled': 4
        };
        filterPayload.status = statusMap[statusFilter];
      }

      // Add payment method filter
      if (paymentMethodFilter !== 'all') {
        const paymentMap: { [key: string]: number } = {
          'InstaPay': 0,
          'VodafoneCash': 1,
          'OnlinePayment': 2
        };
        filterPayload.paymentMethod = paymentMap[paymentMethodFilter];
      }

      // Add date filters
      if (dateFrom) {
        filterPayload.dateFrom = dateFrom;
      }
      if (dateTo) {
        filterPayload.dateTo = dateTo;
      }

      // Add order value filters
      if (minTotal) {
        filterPayload.minTotal = parseFloat(minTotal);
      }
      if (maxTotal) {
        filterPayload.maxTotal = parseFloat(maxTotal);
      }

      // Add search term
      if (searchTerm.trim()) {
        filterPayload.searchTerm = searchTerm.trim();
      }

      const response = await fetch(`${apiUrl}/api/orders/filter`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(filterPayload),
      });

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
        throw new Error(`Failed to fetch filtered orders: ${response.status} ${errorText}`);
      }

      const data: PaginatedOrdersResponse = await response.json();

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
      setError(err instanceof Error ? err.message : 'Failed to fetch filtered orders');
    } finally {
      setLoading(false);
    }
  };

  // Export to CSV
  const handleExportCSV = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');

      let ordersToExport: any[] = [];

      // Check if any filters are applied
      const hasFilters = statusFilter !== 'all' ||
        paymentMethodFilter !== 'all' ||
        searchTerm.trim() !== '' ||
        (useAdvancedFilters && (dateFrom || dateTo || minTotal || maxTotal));

      if (hasFilters) {
        // Build filter payload for POST /api/orders/filter endpoint
        const filterPayload: any = {
          pageNumber: 1,
          pageSize: 10000
        };

        // Add status filter
        if (statusFilter !== 'all') {
          const statusMap: { [key: string]: number } = {
            'UnderReview': 0,
            'Confirmed': 1,
            'Shipped': 2,
            'Delivered': 3,
            'Cancelled': 4
          };
          filterPayload.status = statusMap[statusFilter];
        }

        // Add payment method filter
        if (paymentMethodFilter !== 'all') {
          const paymentMap: { [key: string]: number } = {
            'InstaPay': 0,
            'VodafoneCash': 1,
            'OnlinePayment': 2
          };
          filterPayload.paymentMethod = paymentMap[paymentMethodFilter];
        }

        // Add advanced filters if enabled
        if (useAdvancedFilters) {
          if (dateFrom) filterPayload.dateFrom = dateFrom;
          if (dateTo) filterPayload.dateTo = dateTo;
          if (minTotal) filterPayload.minTotal = parseFloat(minTotal);
          if (maxTotal) filterPayload.maxTotal = parseFloat(maxTotal);
        }

        // Add search term
        if (searchTerm.trim()) {
          filterPayload.searchTerm = searchTerm.trim();
        }

        // Use POST filtered endpoint
        const response = await fetch(`${apiUrl}/api/orders/filter`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(filterPayload)
        });

        if (!response.ok) {
          throw new Error('Failed to fetch filtered orders for export');
        }

        const data = await response.json();
        ordersToExport = data.items;
      } else {
        // Use GET all orders endpoint
        const response = await fetch(`${apiUrl}/api/orders?pageNumber=1&pageSize=10000`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch orders for export');
        }

        const data = await response.json();
        ordersToExport = data.items;
      }

      // Generate CSV
      const headers = ['Order #', 'Customer', 'Phone', 'Governorate', 'Address', 'Status', 'Total', 'Date', 'Payment', 'Items'];
      const csvRows = [headers.join(',')];

      for (const order of ordersToExport) {
        const itemsStr = order.items?.map((i: any) => `${i.productName} (${i.quantity})`).join('; ') || '';
        const row = [
          order.orderNumber,
          `"${order.fullName || ''}"`,
          `"${order.phoneNumber || ''}"`,
          `"${order.governorate || ''}"`,
          `"${order.address || ''}"`,
          order.status,
          order.total,
          new Date(order.date).toLocaleDateString(),
          order.paymentMethod,
          `"${itemsStr}"`
        ];
        csvRows.push(row.join(','));
      }

      const csvContent = '\uFEFF' + csvRows.join('\n'); // Add BOM for Excel
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `orders_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (err) {
      alert('Failed to export orders');
      console.error(err);
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
      case 'underreview': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'confirmed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'shipped': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'delivered': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
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
      case 'instapay': return 'InstaPay';
      case 'vodafonecash': return 'فودافون كاش';
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

  const resolveImageUrl = (path?: string) => {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    if (path.startsWith('data:image')) return path;
    if (path.startsWith('/')) return `${apiUrl}${path}`;
    return `${apiUrl}/${path}`;
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-400"></div>
        <span className="mr-3 text-gray-500 font-medium" style={{ fontFamily: 'Tajawal, sans-serif' }}>جاري تحميل الطلبات...</span>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-gray-100 p-3 rounded-xl border border-gray-200">
            <ShoppingCart className="h-6 w-6 text-black" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-black" style={{ fontFamily: 'Tajawal, sans-serif' }}>إدارة الطلبات</h2>
            <p className="text-sm text-gray-500" style={{ fontFamily: 'Tajawal, sans-serif' }}>إجمالي الطلبات: {totalItems}</p>
          </div>
        </div>
        <Sparkles className="h-8 w-8 text-yellow-500 animate-pulse" />
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
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="البحث برقم الطلب"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-10 pl-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-black"
            style={{ fontFamily: 'Tajawal, sans-serif' }}
            dir="rtl"
          />
          <button
            type="submit"
            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-primary-green text-black px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-primary-green-dark transition-colors"
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
      <div className={`bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6 ${showFilters ? 'block' : 'hidden sm:block'}`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="hidden sm:block relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="البحث برقم الطلب"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-10 pl-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-black"
              style={{ fontFamily: 'Tajawal, sans-serif' }}
              dir="rtl"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-right font-medium text-black"
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
            className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-right font-medium text-black"
            style={{ fontFamily: 'Tajawal, sans-serif' }}
            dir="rtl"
          >
            <option value="all">جميع طرق الدفع</option>
            <option value="instapay">InstaPay</option>
            <option value="vodafonecash">فودافون كاش</option>
            <option value="onlinepayment">دفع إلكتروني</option>
          </select>

          <button
            onClick={() => {
              setUseAdvancedFilters(!useAdvancedFilters);
            }}
            className={`px-6 py-3 rounded-xl transition-all flex items-center justify-center font-semibold shadow-md ${useAdvancedFilters
              ? 'bg-blue-500 text-white hover:bg-blue-600'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            style={{ fontFamily: 'Tajawal, sans-serif' }}
          >
            <Filter className="h-4 w-4 ml-2" />
            فلاتر متقدمة
          </button>

          <button
            onClick={handleExportCSV}
            className="px-6 py-3 rounded-xl transition-all flex items-center justify-center font-bold shadow-md bg-green-600 text-white hover:bg-green-700 hover:shadow-lg"
            style={{ fontFamily: 'Tajawal, sans-serif' }}
            disabled={loading}
            title="تصدير إلى Excel/CSV"
          >
            <Download className="h-4 w-4 ml-2" />
            تصدير
          </button>
        </div>

        {/* Advanced Filters Row */}
        {useAdvancedFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 text-right" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                <Calendar className="inline h-4 w-4 ml-1" />
                من تاريخ
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-black"
                style={{ fontFamily: 'Tajawal, sans-serif' }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 text-right" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                <Calendar className="inline h-4 w-4 ml-1" />
                إلى تاريخ
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-black"
                style={{ fontFamily: 'Tajawal, sans-serif' }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 text-right" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                <DollarSign className="inline h-4 w-4 ml-1" />
                قيمة الطلب من
              </label>
              <input
                type="number"
                value={minTotal}
                onChange={(e) => setMinTotal(e.target.value)}
                placeholder="0"
                min="0"
                step="0.01"
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-black"
                style={{ fontFamily: 'Tajawal, sans-serif' }}
                dir="rtl"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 text-right" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                <DollarSign className="inline h-4 w-4 ml-1" />
                قيمة الطلب إلى
              </label>
              <input
                type="number"
                value={maxTotal}
                onChange={(e) => setMaxTotal(e.target.value)}
                placeholder="9999"
                min="0"
                step="0.01"
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-black"
                style={{ fontFamily: 'Tajawal, sans-serif' }}
                dir="rtl"
              />
            </div>
          </div>
        )}

        {/* Apply Filters Button */}
        <div className="mt-4 flex gap-3">
          <button
            onClick={() => {
              if (useAdvancedFilters || statusFilter !== 'all' || paymentMethodFilter !== 'all' || searchTerm) {
                fetchFilteredOrders(1);
              } else {
                fetchOrders(1);
              }
            }}
            className="flex-1 bg-primary-green text-white px-6 py-3 rounded-xl hover:bg-primary-green-dark transition-all flex items-center justify-center font-semibold shadow-md"
            style={{ fontFamily: 'Tajawal, sans-serif' }}
            disabled={loading}
          >
            <Search className={`h-4 w-4 ml-2 ${loading ? 'animate-spin' : ''}`} />
            تطبيق الفلاتر
          </button>

          <button
            onClick={() => {
              setStatusFilter('all');
              setPaymentMethodFilter('all');
              setSearchTerm('');
              setDateFrom('');
              setDateTo('');
              setMinTotal('');
              setMaxTotal('');
              setUseAdvancedFilters(false);
              fetchOrders(1);
            }}
            className="bg-gray-200 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-300 transition-all flex items-center justify-center font-semibold"
            style={{ fontFamily: 'Tajawal, sans-serif' }}
          >
            <X className="h-4 w-4 ml-2" />
          </button>
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-200">
          <div className="text-7xl mb-4">🛒</div>
          <p className="text-xl font-bold text-black mb-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>لا توجد طلبات</p>
          <p className="text-gray-500 mb-6" style={{ fontFamily: 'Tajawal, sans-serif' }}>لم يتم العثور على أي طلبات حالياً</p>
          <button
            onClick={() => fetchOrders(currentPage)}
            className="bg-primary-green text-black px-6 py-3 rounded-xl hover:bg-primary-green-dark transition-all flex items-center mx-auto font-semibold shadow-lg"
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
          <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider" style={{ fontFamily: 'Tajawal, sans-serif' }}>رقم الطلب</th>
                    <th className="px-4 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider" style={{ fontFamily: 'Tajawal, sans-serif' }}>العميل</th>
                    <th className="px-4 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider" style={{ fontFamily: 'Tajawal, sans-serif' }}>الإجمالي</th>
                    <th className="px-4 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider" style={{ fontFamily: 'Tajawal, sans-serif' }}>الحالة</th>
                    <th className="px-4 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider" style={{ fontFamily: 'Tajawal, sans-serif' }}>الدفع</th>
                    <th className="px-4 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider" style={{ fontFamily: 'Tajawal, sans-serif' }}>التاريخ</th>
                    <th className="px-4 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider" style={{ fontFamily: 'Tajawal, sans-serif' }}>الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {filteredOrders.map((order) => {
                    const previous = getPreviousStatus(order.status);
                    return (
                      <React.Fragment key={order.id}>
                        <tr className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <ShoppingCart className="h-4 w-4 text-gray-400" />
                              <span className="text-sm font-bold text-black" style={{ fontFamily: 'Tajawal, sans-serif' }}>#{order.orderNumber}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm">
                            {order.customerId ? (
                              <button
                                onClick={() => getCustomerOrders(order.customerId)}
                                className="text-gray-600 hover:text-green-600 underline font-medium"
                                style={{ fontFamily: 'Tajawal, sans-serif' }}
                              >
                                {order.customerId.substring(0, 8)}...
                              </button>
                            ) : (
                              <span className="text-gray-500 text-sm" style={{ fontFamily: 'Tajawal, sans-serif' }}>زائر</span>
                            )}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-4 w-4 text-green-600" />
                              <span className="text-sm font-bold text-black" style={{ fontFamily: 'Tajawal, sans-serif' }}>{order.total.toFixed(2)} جنيه</span>
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(order.status)}`} style={{ fontFamily: 'Tajawal, sans-serif' }}>
                              {getStatusText(order.status)}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                            {getPaymentMethodText(order.paymentMethod)}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-1 text-sm text-gray-500" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                              <Calendar className="h-4 w-4 text-gray-400" />
                              {formatDate(order.date)}
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => toggleRowExpansion(order.id)}
                                className="text-gray-500 hover:text-green-600 p-2 hover:bg-gray-100 rounded-lg transition-all"
                                title={expandedRows.has(order.id) ? 'إخفاء التفاصيل' : 'عرض التفاصيل'}
                              >
                                {expandedRows.has(order.id) ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                              </button>
                              <button
                                onClick={() => getOrderDetails(order.id)}
                                className="text-gray-500 hover:text-green-600 p-2 hover:bg-gray-100 rounded-lg transition-all"
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
                                  className="bg-primary-green text-black px-3 py-1.5 rounded-lg text-xs hover:bg-primary-green-dark transition-all flex items-center font-semibold shadow-sm"
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
                            <td colSpan={7} className="px-4 py-4 bg-gray-50">
                              <div className="space-y-4">
                                {/* Customer Info */}
                                {(order.fullName || order.phoneNumber || order.address) && (
                                  <div className="bg-white rounded-xl p-4 border border-gray-200">
                                    <h4 className="text-sm font-bold text-black mb-3 flex items-center gap-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                                      <User className="h-4 w-4" />
                                      معلومات العميل
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                      {order.fullName && (
                                        <div className="flex items-center gap-2">
                                          <User className="h-4 w-4 text-gray-400" />
                                          <span className="text-gray-600" style={{ fontFamily: 'Tajawal, sans-serif' }}>{order.fullName}</span>
                                        </div>
                                      )}
                                      {order.phoneNumber && (
                                        <div className="flex items-center gap-2">
                                          <Phone className="h-4 w-4 text-gray-400" />
                                          <span className="text-gray-600" style={{ fontFamily: 'Tajawal, sans-serif' }}>{order.phoneNumber}</span>
                                        </div>
                                      )}
                                      {order.address && (
                                        <div className="flex items-center gap-2 md:col-span-2">
                                          <MapPin className="h-4 w-4 text-gray-400" />
                                          <span className="text-gray-600" style={{ fontFamily: 'Tajawal, sans-serif' }}>{order.address}, {order.governorate}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* Discount Code */}
                                {order.discountCodeUsed && (
                                  <div className="bg-green-50 rounded-xl p-3 border border-green-200">
                                    <div className="flex items-center gap-2">
                                      <Tag className="h-4 w-4 text-green-600" />
                                      <span className="text-sm font-bold text-green-700" style={{ fontFamily: 'Tajawal, sans-serif' }}>كود الخصم: {order.discountCodeUsed}</span>
                                    </div>
                                  </div>
                                )}

                                {/* Payment Details Section */}
                                {(order.senderDetails || order.paymentProofImage || order.paymentNotes) && (
                                  <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                                    <h5 className="text-sm font-bold text-black mb-3 flex items-center gap-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                                      <DollarSign className="h-4 w-4" />
                                      تفاصيل الدفع
                                    </h5>
                                    <div className="space-y-2">
                                      {order.senderDetails && (
                                        <div className="flex items-center justify-between p-2 bg-white rounded-lg">
                                          <span className="text-xs text-gray-500" style={{ fontFamily: 'Tajawal, sans-serif' }}>بيانات المُحوِّل:</span>
                                          <span className="text-sm font-semibold text-black" style={{ fontFamily: 'Tajawal, sans-serif' }}>{order.senderDetails}</span>
                                        </div>
                                      )}
                                      {order.paymentProofImage && (
                                        <div className="p-2 bg-white rounded-lg">
                                          <p className="text-xs text-gray-500 mb-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>صورة إثبات الدفع:</p>
                                          <img
                                            src={order.paymentProofImage}
                                            alt="Payment Proof"
                                            className="w-32 h-32 object-cover rounded-lg border border-gray-300 cursor-pointer hover:opacity-90 transition-opacity"
                                            onClick={() => window.open(order.paymentProofImage, '_blank')}
                                          />
                                        </div>
                                      )}
                                      {order.paymentNotes && (
                                        <div className="p-2 bg-white rounded-lg">
                                          <p className="text-xs text-gray-500 mb-1" style={{ fontFamily: 'Tajawal, sans-serif' }}>ملاحظات الدفع:</p>
                                          <p className="text-sm text-gray-700" style={{ fontFamily: 'Tajawal, sans-serif' }}>{order.paymentNotes}</p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* Order Items */}
                                <div className="bg-white rounded-xl p-4 border border-gray-200">
                                  <h4 className="text-sm font-bold text-black mb-3 flex items-center gap-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                                    <Package className="h-4 w-4" />
                                    عناصر الطلب ({order.items.length})
                                  </h4>
                                  <div className="space-y-3">
                                    {order.items.map((item, index) => (
                                      <div
                                        key={index}
                                        className="flex flex-col sm:flex-row sm:justify-between sm:items-start p-3 bg-gray-50 rounded-lg border border-gray-200"
                                      >
                                        {/* Product Image */}
                                        {item.productImageUrl && (
                                          <div className="mb-3 sm:mb-0 sm:ml-3">
                                            <a
                                              href={item.productUrl || `/product/${item.productId}`}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="block"
                                            >
                                              <img
                                                src={resolveImageUrl(item.productImageUrl)}
                                                alt={item.productName}
                                                className="w-16 h-16 object-cover rounded-lg border border-gray-300 hover:opacity-80 transition-opacity"
                                              />
                                            </a>
                                          </div>
                                        )}
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2 mb-2">
                                            <Package className="h-4 w-4 text-gray-400" />
                                            {item.productUrl ? (
                                              <a
                                                href={item.productUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="font-bold text-black hover:text-green-600 underline transition-colors"
                                                style={{ fontFamily: 'Tajawal, sans-serif' }}
                                              >
                                                {item.productName}
                                              </a>
                                            ) : (
                                              <p className="font-bold text-black" style={{ fontFamily: 'Tajawal, sans-serif' }}>{item.productName}</p>
                                            )}
                                          </div>
                                          <div className="text-sm text-gray-500 grid grid-cols-2 gap-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                                            <p><span className="font-semibold">كود:</span> {item.productCode}</p>
                                            <p><span className="font-semibold">الكمية:</span> {item.quantity}</p>
                                            {item.size && <p><span className="font-semibold">المقاس:</span> {item.size}</p>}
                                            {item.color && <p><span className="font-semibold">اللون:</span> {item.color}</p>}
                                            {item.extensionsDetails && item.extensionsDetails.length > 0 && (
                                              <div className="col-span-2">
                                                <p className="font-semibold text-green-600 mb-1">إضافات:</p>
                                                <ul className="list-disc list-inside text-xs text-gray-600">
                                                  {item.extensionsDetails.map((ext) => (
                                                    <li key={ext.id}>
                                                      {ext.name} (+{ext.additionalPrice} ج.م)
                                                    </li>
                                                  ))}
                                                </ul>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                        <div className="mt-3 sm:mt-0 sm:mr-4">
                                          <p className="font-bold text-black text-lg" style={{ fontFamily: 'Tajawal, sans-serif' }}>
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
                <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 transition-all duration-200 hover:shadow-md">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="font-bold text-black" style={{ fontFamily: 'Tajawal, sans-serif' }}>#{order.orderNumber}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-1" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                          <Calendar className="h-3 w-3" />
                          {formatDate(order.date)}
                        </p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(order.status)}`} style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      {getStatusText(order.status)}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4 border-t border-gray-100 pt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500" style={{ fontFamily: 'Tajawal, sans-serif' }}>العميل:</span>
                      {order.customerId ? (
                        <button
                          onClick={() => getCustomerOrders(order.customerId)}
                          className="text-sm text-gray-600 hover:text-green-600 underline font-medium"
                          style={{ fontFamily: 'Tajawal, sans-serif' }}
                        >
                          {order.customerId.substring(0, 8)}...
                        </button>
                      ) : (
                        <span className="text-sm text-gray-500" style={{ fontFamily: 'Tajawal, sans-serif' }}>زائر</span>
                      )}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500" style={{ fontFamily: 'Tajawal, sans-serif' }}>المبلغ:</span>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-bold text-black" style={{ fontFamily: 'Tajawal, sans-serif' }}>{order.total.toFixed(2)} جنيه</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500" style={{ fontFamily: 'Tajawal, sans-serif' }}>طريقة الدفع:</span>
                      <span className="text-sm text-black font-medium" style={{ fontFamily: 'Tajawal, sans-serif' }}>{getPaymentMethodText(order.paymentMethod)}</span>
                    </div>
                  </div>

                  {expandedRows.has(order.id) && (
                    <div className="border-t border-gray-100 pt-3 mt-3 space-y-3">
                      {/* Customer Info */}
                      {order.fullName && (
                        <div className="flex items-center gap-2 text-sm">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600" style={{ fontFamily: 'Tajawal, sans-serif' }}>{order.fullName}</span>
                        </div>
                      )}
                      {order.phoneNumber && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600" style={{ fontFamily: 'Tajawal, sans-serif' }}>{order.phoneNumber}</span>
                        </div>
                      )}
                      {order.address && (
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600" style={{ fontFamily: 'Tajawal, sans-serif' }}>{order.address}, {order.governorate}</span>
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

                      {/* Payment Details Section */}
                      {(order.senderDetails || order.paymentProofImage || order.paymentNotes) && (
                        <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                          <h5 className="text-xs font-bold text-black mb-2 flex items-center gap-1" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                            <DollarSign className="h-3 w-3" />
                            تفاصيل الدفع
                          </h5>
                          <div className="space-y-2">
                            {order.senderDetails && (
                              <div className="flex items-center justify-between p-2 bg-white rounded">
                                <span className="text-xs text-gray-500" style={{ fontFamily: 'Tajawal, sans-serif' }}>بيانات المُحوِّل:</span>
                                <span className="text-xs font-semibold text-black" style={{ fontFamily: 'Tajawal, sans-serif' }}>{order.senderDetails}</span>
                              </div>
                            )}
                            {order.paymentProofImage && (
                              <div className="p-2 bg-white rounded">
                                <p className="text-xs text-gray-500 mb-1" style={{ fontFamily: 'Tajawal, sans-serif' }}>صورة إثبات الدفع:</p>
                                <img
                                  src={order.paymentProofImage}
                                  alt="Payment Proof"
                                  className="w-24 h-24 object-cover rounded border border-gray-300 cursor-pointer"
                                  onClick={() => window.open(order.paymentProofImage, '_blank')}
                                />
                              </div>
                            )}
                            {order.paymentNotes && (
                              <div className="p-2 bg-white rounded">
                                <p className="text-xs text-gray-500 mb-1" style={{ fontFamily: 'Tajawal, sans-serif' }}>ملاحظات الدفع:</p>
                                <p className="text-xs text-gray-700" style={{ fontFamily: 'Tajawal, sans-serif' }}>{order.paymentNotes}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Order Items */}
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <h5 className="text-xs font-bold text-black mb-2 flex items-center gap-1" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                          <Package className="h-3 w-3" />
                          عناصر الطلب ({order.items.length})
                        </h5>
                        <div className="space-y-2">
                          {order.items.map((item, index) => (
                            <div key={index} className="bg-white rounded-lg p-2 border border-gray-200">
                              {item.productImageUrl && (
                                <a
                                  href={item.productUrl || `/product/${item.productId}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block mb-2"
                                >
                                  <img
                                    src={resolveImageUrl(item.productImageUrl)}
                                    alt={item.productName}
                                    className="w-16 h-16 object-cover rounded border border-gray-300 hover:opacity-80 transition-opacity"
                                  />
                                </a>
                              )}
                              <p className="text-xs font-bold text-black mb-1" style={{ fontFamily: 'Tajawal, sans-serif' }}>{item.productName}</p>
                              <div className="text-xs text-gray-500 space-y-0.5" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                                <p>كود: {item.productCode} | الكمية: {item.quantity}</p>
                                {item.size && <p>المقاس: {item.size}</p>}
                                {item.color && <p>اللون: {item.color}</p>}
                                {item.extensionsDetails && item.extensionsDetails.length > 0 && (
                                  <div>
                                    <p className="font-semibold text-green-600 mt-1">إضافات:</p>
                                    <ul className="list-disc list-inside text-[11px] text-gray-600">
                                      {item.extensionsDetails.map((ext) => (
                                        <li key={ext.id}>
                                          {ext.name} (+{ext.additionalPrice} ج.م)
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                <p className="font-bold text-black mt-1">{item.priceAtPurchase.toFixed(2)} جنيه</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2 mt-4 border-t border-gray-100 pt-3">
                    <button
                      onClick={() => toggleRowExpansion(order.id)}
                      className="flex-1 text-gray-700 bg-gray-100 px-3 py-2 rounded-lg text-xs hover:bg-gray-200 transition-all flex items-center justify-center font-semibold border border-gray-200"
                      style={{ fontFamily: 'Tajawal, sans-serif' }}
                    >
                      {expandedRows.has(order.id) ? <ChevronUp className="h-3 w-3 mr-1" /> : <ChevronDown className="h-3 w-3 mr-1" />}
                      {expandedRows.has(order.id) ? 'إخفاء' : 'التفاصيل'}
                    </button>
                    <button
                      onClick={() => getOrderDetails(order.id)}
                      className="flex-1 text-gray-700 bg-gray-100 px-3 py-2 rounded-lg text-xs hover:bg-gray-200 transition-all flex items-center justify-center font-semibold border border-gray-200"
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
                        className="flex-1 bg-primary-green text-black px-3 py-2 rounded-lg text-xs hover:bg-primary-green-dark transition-all flex items-center justify-center font-semibold"
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
                className="px-5 py-3 bg-primary-green text-black rounded-xl hover:bg-primary-green-dark disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all shadow-md"
                style={{ fontFamily: 'Tajawal, sans-serif' }}
              >
                السابق
              </button>
              <div className="bg-white px-6 py-3 rounded-xl border border-gray-200 shadow-md">
                <span className="text-black font-bold" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                  {currentPage} / {totalPages}
                </span>
              </div>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages || loading}
                className="px-5 py-3 bg-primary-green text-black rounded-xl hover:bg-primary-green-dark disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all shadow-md"
                style={{ fontFamily: 'Tajawal, sans-serif' }}
              >
                التالي
              </button>
            </div>
          )}
        </>
      )
      }

      {/* Order Details Modal */}
      {
        showOrderDetails && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-200">
              <div className="sticky top-0 bg-gray-50 z-10">
                <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                  <h3 className="text-2xl font-bold text-black flex items-center gap-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    <ShoppingCart className="h-6 w-6" />
                    تفاصيل الطلب #{selectedOrder.orderNumber}
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowEditModal(true)}
                      className="bg-white text-gray-700 hover:text-blue-600 px-4 py-2 border border-gray-200 rounded-lg transition-all flex items-center gap-2 hover:bg-blue-50 hover:border-blue-200"
                      style={{ fontFamily: 'Tajawal, sans-serif' }}
                    >
                      <Edit className="h-4 w-4" />
                      <span className="font-bold text-sm">تعديل الطلب</span>
                    </button>
                    <button
                      onClick={() => setShowOrderDetails(false)}
                      className="text-gray-500 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex border-b border-gray-200 bg-white px-2">
                  <button
                    className={`flex-1 py-4 text-sm font-bold text-center border-b-2 transition-colors ${orderDetailsTab === 'details' ? 'border-primary-green text-primary-green' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    onClick={() => setOrderDetailsTab('details')}
                    style={{ fontFamily: 'Tajawal, sans-serif' }}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Package className="w-4 h-4" />
                      التفاصيل
                    </div>
                  </button>
                  <button
                    className={`flex-1 py-4 text-sm font-bold text-center border-b-2 transition-colors ${orderDetailsTab === 'payments' ? 'border-primary-green text-primary-green' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    onClick={() => setOrderDetailsTab('payments')}
                    style={{ fontFamily: 'Tajawal, sans-serif' }}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      المدفوعات
                    </div>
                  </button>
                  <button
                    className={`flex-1 py-4 text-sm font-bold text-center border-b-2 transition-colors ${orderDetailsTab === 'notes' ? 'border-primary-green text-primary-green' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    onClick={() => setOrderDetailsTab('notes')}
                    style={{ fontFamily: 'Tajawal, sans-serif' }}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      الملاحظات
                    </div>
                  </button>
                  <button
                    className={`flex-1 py-4 text-sm font-bold text-center border-b-2 transition-colors ${orderDetailsTab === 'history' ? 'border-primary-green text-primary-green' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    onClick={() => setOrderDetailsTab('history')}
                    style={{ fontFamily: 'Tajawal, sans-serif' }}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <HistoryIcon className="w-4 h-4" />
                      السجل
                    </div>
                  </button>
                </div>
              </div>

              <div className="p-6 bg-gray-50 min-h-[500px]">
                {orderDetailsTab === 'details' && (
                  <div className="space-y-6">
                    {/* Order Status */}
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                      <div className="flex flex-wrap justify-between items-center gap-4">
                        <div>
                          <p className="text-sm text-gray-500 mb-1" style={{ fontFamily: 'Tajawal, sans-serif' }}>حالة الطلب</p>
                          <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold ${getStatusColor(selectedOrder.status)}`} style={{ fontFamily: 'Tajawal, sans-serif' }}>
                            {getStatusText(selectedOrder.status)}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 mb-1" style={{ fontFamily: 'Tajawal, sans-serif' }}>تاريخ الطلب</p>
                          <div className="flex items-center gap-2 text-black">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span className="font-semibold" style={{ fontFamily: 'Tajawal, sans-serif' }}>{formatDate(selectedOrder.date)}</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 mb-1" style={{ fontFamily: 'Tajawal, sans-serif' }}>إجمالي المبلغ</p>
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-5 w-5 text-green-600" />
                            <span className="text-xl font-bold text-black" style={{ fontFamily: 'Tajawal, sans-serif' }}>{selectedOrder.total.toFixed(2)} جنيه</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Customer Information */}
                    <div className="bg-white rounded-xl p-4 border border-gray-200">
                      <h4 className="text-lg font-bold text-black mb-4 flex items-center gap-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                        <User className="h-5 w-5" />
                        معلومات العميل
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <User className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-xs text-gray-500" style={{ fontFamily: 'Tajawal, sans-serif' }}>الاسم الكامل</p>
                            <p className="font-semibold text-black" style={{ fontFamily: 'Tajawal, sans-serif' }}>{selectedOrder.fullName || 'غير متوفر'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <Phone className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-xs text-gray-500" style={{ fontFamily: 'Tajawal, sans-serif' }}>رقم الهاتف</p>
                            <p className="font-semibold text-black" style={{ fontFamily: 'Tajawal, sans-serif' }}>{selectedOrder.phoneNumber || 'غير متوفر'}</p>
                          </div>
                        </div>
                        {selectedOrder.address && (
                          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg md:col-span-2">
                            <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                            <div>
                              <p className="text-xs text-gray-500" style={{ fontFamily: 'Tajawal, sans-serif' }}>العنوان</p>
                              <p className="font-semibold text-black" style={{ fontFamily: 'Tajawal, sans-serif' }}>{selectedOrder.address}, {selectedOrder.governorate}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Payment Information */}
                    <div className="bg-white rounded-xl p-4 border border-gray-200">
                      <h4 className="text-lg font-bold text-black mb-4 flex items-center gap-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                        <DollarSign className="h-5 w-5" />
                        معلومات الدفع
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <span className="text-gray-500" style={{ fontFamily: 'Tajawal, sans-serif' }}>طريقة الدفع</span>
                          <span className="font-semibold text-black" style={{ fontFamily: 'Tajawal, sans-serif' }}>{getPaymentMethodText(selectedOrder.paymentMethod)}</span>
                        </div>
                        {selectedOrder.paymentTransactionId && (
                          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <span className="text-gray-500" style={{ fontFamily: 'Tajawal, sans-serif' }}>معرف المعاملة</span>
                            <span className="font-mono text-sm text-black">{selectedOrder.paymentTransactionId}</span>
                          </div>
                        )}
                        {selectedOrder.discountCodeUsed && (
                          <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border-2 border-green-200">
                            <Tag className="h-5 w-5 text-green-600" />
                            <span className="font-bold text-green-700" style={{ fontFamily: 'Tajawal, sans-serif' }}>كود الخصم المستخدم: {selectedOrder.discountCodeUsed}</span>
                          </div>
                        )}
                        {selectedOrder.senderDetails && (
                          <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <span className="text-gray-700 font-semibold" style={{ fontFamily: 'Tajawal, sans-serif' }}>بيانات المُحوِّل</span>
                            <span className="font-semibold text-black" style={{ fontFamily: 'Tajawal, sans-serif' }}>{selectedOrder.senderDetails}</span>
                          </div>
                        )}
                        {selectedOrder.paymentProofImage && (
                          <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                            <p className="text-gray-700 font-semibold mb-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>صورة إثبات الدفع</p>
                            <img
                              src={selectedOrder.paymentProofImage}
                              alt="Payment Proof"
                              className="w-full max-w-md mx-auto rounded-lg border-2 border-purple-300 cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => window.open(selectedOrder.paymentProofImage, '_blank')}
                            />
                            <p className="text-xs text-gray-500 mt-2 text-center" style={{ fontFamily: 'Tajawal, sans-serif' }}>اضغط على الصورة لعرضها بحجم كامل</p>
                          </div>
                        )}
                        {selectedOrder.paymentNotes && (
                          <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                            <p className="text-gray-700 font-semibold mb-1" style={{ fontFamily: 'Tajawal, sans-serif' }}>ملاحظات الدفع</p>
                            <p className="text-gray-600" style={{ fontFamily: 'Tajawal, sans-serif' }}>{selectedOrder.paymentNotes}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Price Breakdown Section */}
                    <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl p-4 border-2 border-green-200">
                      <h4 className="text-lg font-bold text-black mb-4 flex items-center gap-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                        <Tag className="h-5 w-5" />
                        تفاصيل الأسعار
                      </h4>
                      <div className="space-y-3">
                        {/* Subtotal */}
                        <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm">
                          <span className="text-gray-600 font-semibold" style={{ fontFamily: 'Tajawal, sans-serif' }}>المجموع الفرعي (المنتجات)</span>
                          <span className="font-bold text-black text-lg" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                            {selectedOrder.subtotal?.toFixed(2) ?? '0.00'} جنيه
                          </span>
                        </div>

                        {/* Shipping Fee */}
                        <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <span className="text-gray-700 font-semibold" style={{ fontFamily: 'Tajawal, sans-serif' }}>رسوم التوصيل</span>
                          <span className="font-bold text-blue-700 text-lg" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                            +{selectedOrder.shippingFee?.toFixed(2) ?? '0.00'} جنيه
                          </span>
                        </div>

                        {/* Discount */}
                        {selectedOrder.discountAmount && selectedOrder.discountAmount > 0 && (
                          <div className="flex justify-between items-center p-3 bg-green-100 rounded-lg border-2 border-green-300">
                            <div className="flex items-center gap-2">
                              <Tag className="h-5 w-5 text-green-600" />
                              <div>
                                <span className="text-green-700 font-semibold block" style={{ fontFamily: 'Tajawal, sans-serif' }}>الخصم</span>
                                {selectedOrder.discountCodeUsed && (
                                  <span className="text-xs text-green-600" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                                    ({selectedOrder.discountCodeUsed})
                                  </span>
                                )}
                              </div>
                            </div>
                            <span className="font-bold text-green-700 text-lg" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                              -{selectedOrder.discountAmount.toFixed(2)} جنيه
                            </span>
                          </div>
                        )}

                        {/* Divider */}
                        <div className="border-t-2 border-gray-300 my-2"></div>

                        {/* Final Total */}
                        <div className="flex justify-between items-center p-4 bg-gradient-to-r from-green-600 to-primary-green rounded-lg shadow-lg">
                          <span className="text-white font-bold text-xl" style={{ fontFamily: 'Tajawal, sans-serif' }}>الإجمالي النهائي</span>
                          <span className="font-bold text-white text-2xl" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                            {selectedOrder.total.toFixed(2)} جنيه
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="bg-white rounded-xl p-4 border border-gray-200">
                      <h4 className="text-lg font-bold text-black mb-4 flex items-center gap-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                        <Package className="h-5 w-5" />
                        عناصر الطلب ({selectedOrder.items.length})
                      </h4>
                      <div className="space-y-3">
                        {selectedOrder.items.map((item, index) => (
                          <div key={index} className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-4 bg-gray-50 rounded-xl border border-gray-200">
                            <div className="flex-1">
                              {item.productImageUrl && (
                                <a
                                  href={item.productUrl || `/product/${item.productId}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block mb-2"
                                >
                                  <img
                                    src={resolveImageUrl(item.productImageUrl)}
                                    alt={item.productName}
                                    className="w-20 h-20 object-cover rounded-lg border border-gray-300 hover:opacity-80 transition-opacity"
                                  />
                                </a>
                              )}
                              <div className="flex items-center gap-2 mb-2">
                                <Package className="h-4 w-4 text-gray-400" />
                                {item.productUrl ? (
                                  <a
                                    href={item.productUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-bold text-black hover:text-green-600 underline transition-colors"
                                    style={{ fontFamily: 'Tajawal, sans-serif' }}
                                  >
                                    {item.productName}
                                  </a>
                                ) : (
                                  <p className="font-bold text-black" style={{ fontFamily: 'Tajawal, sans-serif' }}>{item.productName}</p>
                                )}
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-sm text-gray-500" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                                <p><span className="font-semibold">كود المنتج:</span> {item.productCode}</p>
                                <p><span className="font-semibold">الكمية:</span> {item.quantity}</p>
                                {item.size && <p><span className="font-semibold">المقاس:</span> {item.size}</p>}
                                {item.color && <p><span className="font-semibold">اللون:</span> {item.color}</p>}
                                {item.extensionsDetails && item.extensionsDetails.length > 0 && (
                                  <div className="col-span-2">
                                    <p className="font-semibold text-green-600 mb-1">إضافات:</p>
                                    <ul className="list-disc list-inside text-xs text-gray-600">
                                      {item.extensionsDetails.map((ext) => (
                                        <li key={ext.id}>
                                          {ext.name} (+{ext.additionalPrice} ج.م)
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="mt-3 sm:mt-0 sm:mr-4">
                              <p className="font-bold text-black text-xl" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                                {item.priceAtPurchase.toFixed(2)} جنيه
                              </p>
                              <p className="text-xs text-gray-500" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                                الإجمالي: {(item.priceAtPurchase * item.quantity).toFixed(2)} جنيه
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {orderDetailsTab === 'payments' && (
                  <PaymentTrackingPanel
                    orderId={selectedOrder.id}
                    onPaymentRecorded={() => getOrderDetails(selectedOrder.id)}
                  />
                )}

                {orderDetailsTab === 'notes' && (
                  <OrderNotesPanel orderId={selectedOrder.id} />
                )}

                {orderDetailsTab === 'history' && (
                  <OrderHistoryPanel orderId={selectedOrder.id} />
                )}
              </div>

              {showEditModal && (
                <OrderEditModal
                  order={selectedOrder}
                  isOpen={showEditModal}
                  onClose={() => setShowEditModal(false)}
                  onSave={() => {
                    getOrderDetails(selectedOrder.id);
                  }}
                />
              )}

              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-gray-50 p-6 border-t border-gray-200">
                <button
                  onClick={() => setShowOrderDetails(false)}
                  className="w-full bg-primary-green text-white py-3 px-6 rounded-xl hover:bg-primary-green-dark transition-all font-semibold shadow-lg"
                  style={{ fontFamily: 'Tajawal, sans-serif' }}
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* Customer Orders Modal */}
      {
        showCustomerOrders && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto border border-gray-200">
              <div className="sticky top-0 bg-gray-50 p-6 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-2xl font-bold text-black flex items-center gap-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
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
                    <p className="text-xl font-bold text-black" style={{ fontFamily: 'Tajawal, sans-serif' }}>لا توجد طلبات لهذا العميل</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {customerOrders.map((order) => (
                      <div key={order.id} className="bg-white rounded-xl p-4 border border-gray-200 hover:shadow-lg transition-all">
                        <div className="flex flex-wrap justify-between items-center gap-4">
                          <div className="flex items-center gap-3">
                            <ShoppingCart className="h-5 w-5 text-gray-400" />
                            <div>
                              <p className="font-bold text-black" style={{ fontFamily: 'Tajawal, sans-serif' }}>#{order.orderNumber}</p>
                              <p className="text-xs text-gray-500 flex items-center gap-1" style={{ fontFamily: 'Tajawal, sans-serif' }}>
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
                              <span className="font-bold text-black" style={{ fontFamily: 'Tajawal, sans-serif' }}>{order.total.toFixed(2)} جنيه</span>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setShowCustomerOrders(false);
                              setShowOrderDetails(true);
                            }}
                            className="text-gray-500 hover:text-green-600 p-2 hover:bg-gray-100 rounded-lg transition-all"
                          >
                            <Eye className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="sticky bottom-0 bg-gray-50 p-6 border-t border-gray-200">
                <button
                  onClick={() => setShowCustomerOrders(false)}
                  className="w-full bg-primary-green text-black py-3 px-6 rounded-xl hover:bg-primary-green-dark transition-all font-semibold shadow-lg"
                  style={{ fontFamily: 'Tajawal, sans-serif' }}
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
};

export default OrdersManagement;
