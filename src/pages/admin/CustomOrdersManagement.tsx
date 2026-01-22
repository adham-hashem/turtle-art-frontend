// src/pages/admin/CustomOrdersManagement.tsx

import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Eye,
  Edit,
  Trash2,
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  ShoppingBag,
  Calendar,
  User,
  Phone,
  CheckCircle,
  Clock3,
  Package,
  DollarSign,
  MapPin,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

// ===============================
// Enums (keep matching backend ints)
// ===============================
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

/**
 * ✅ UPDATED for new backend:
 * - Backend moved toward "design-based" custom orders (occasion/size/flavors/pickup may be removed)
 * - We keep old fields OPTIONAL so UI works with both old/new payloads without crashing
 */
interface CustomOrder {
  id: string;
  orderNumber?: string | null;

  customerName?: string | null;
  customerPhone?: string | null;
  additionalPhone?: string | null;
  address?: string | null;

  // OLD cake-style fields (optional)
  occasionName?: string | null;
  sizeName?: string | null;
  flavorNames?: string[] | null;
  customText?: string | null;
  pickupDate?: string | null;
  pickupTime?: string | null;

  // NEW design-based fields (optional, depending on your DTO)
  designImageUrl?: string | null;
  designNotes?: string | null; // sometimes backend renamed notes
  referenceImageUrl?: string | null; // if exists
  // keep notes/adminNotes
  notes?: string | null;
  adminNotes?: string | null;

  paymentMethod?: PaymentMethod | null;
  status: CustomOrderStatus;

  estimatedPrice?: number | null;
  finalPrice?: number | null;

  createdAt: string;

  userId?: string | null;
}

interface PaginatedResponse {
  items: CustomOrder[];
  totalItems: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

interface OrderStats {
  totalOrders: number;
  pendingOrders: number;
  inProgressOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  todayOrders: number;
  thisMonthOrders: number;
  totalRevenue: number;
  thisMonthRevenue: number;

  // Optional in case backend removed these
  mostPopularOccasion?: string | null;
  mostPopularSize?: string | null;
  mostPopularFlavor?: string | null;
}

const CustomOrdersManagement: React.FC = () => {
  const { isAuthenticated, userRole } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState<CustomOrder[]>([]);
  const [stats, setStats] = useState<OrderStats | null>(null);

  const [selectedOrder, setSelectedOrder] = useState<CustomOrder | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const pageSize = 10;

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<CustomOrderStatus | ''>('');
  const [dateFilter, setDateFilter] = useState(''); // used for pickupDate OR createdAt filter depending backend

  // Status update
  const [newStatus, setNewStatus] = useState<CustomOrderStatus>(CustomOrderStatus.Pending);
  const [finalPrice, setFinalPrice] = useState('');
  const [adminNotes, setAdminNotes] = useState('');

  const apiUrl = import.meta.env.VITE_API_BASE_URL;

  // ===============================
  // Auth guard + load data
  // ===============================
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (String(userRole).toLowerCase() !== 'admin') {
      navigate('/');
      return;
    }
  }, [isAuthenticated, userRole, navigate]);

  useEffect(() => {
    if (!isAuthenticated || String(userRole).toLowerCase() !== 'admin') return;
    fetchOrders();
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, statusFilter]);

  // ===============================
  // Helpers
  // ===============================
  const getAuthHeaders = () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      navigate('/login');
      throw new Error('لا يوجد رمز مصادقة. يرجى تسجيل الدخول مرة أخرى.');
    }
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  };

  const normalizeImageUrl = (url?: string | null) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    if (url.startsWith('/')) return `${apiUrl}${url}`;
    return `${apiUrl}/${url}`;
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '—';
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return String(dateString);
    return d.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formatTime = (timeString?: string | null) => {
    if (!timeString) return '—';
    if (timeString.includes(':')) return timeString.substring(0, 5);
    return timeString;
  };

  const getStatusText = (status: CustomOrderStatus) => {
    const statusMap: Record<number, string> = {
      [CustomOrderStatus.Pending]: 'قيد الانتظار',
      [CustomOrderStatus.Confirmed]: 'مؤكد',
      [CustomOrderStatus.InProgress]: 'قيد التنفيذ',
      [CustomOrderStatus.Ready]: 'جاهز',
      [CustomOrderStatus.Completed]: 'مكتمل',
      [CustomOrderStatus.Cancelled]: 'ملغي',
    };
    return statusMap[status] ?? 'غير معروف';
  };

  const getStatusColor = (status: CustomOrderStatus) => {
    const colorMap: Record<number, string> = {
      [CustomOrderStatus.Pending]: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      [CustomOrderStatus.Confirmed]: 'bg-blue-100 text-blue-800 border-blue-200',
      [CustomOrderStatus.InProgress]: 'bg-[#C4A57B]/20 text-[#8B7355] border-[#C4A57B]',
      [CustomOrderStatus.Ready]: 'bg-green-100 text-green-800 border-green-200',
      [CustomOrderStatus.Completed]: 'bg-gray-100 text-gray-800 border-gray-200',
      [CustomOrderStatus.Cancelled]: 'bg-red-100 text-red-800 border-red-200',
    };
    return colorMap[status] ?? 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getPaymentMethodText = (method?: PaymentMethod | null) => {
    if (method === null || method === undefined) return '—';
    const methodMap: Record<number, string> = {
      [PaymentMethod.Cash]: 'نقدي',
      [PaymentMethod.VodafoneCash]: 'فودافون كاش',
      [PaymentMethod.Instapay]: 'إنستاباي',
    };
    return methodMap[method] ?? '—';
  };

  const orderDisplayNumber = (o: CustomOrder) => o.orderNumber || `#${o.id.slice(0, 8)}`;

  const mainDateForOrder = (o: CustomOrder) => {
    // NEW backend may remove pickup date; fallback to createdAt
    return o.pickupDate || o.createdAt;
  };

  const mainTitleForOrder = (o: CustomOrder) => {
    // If old cake fields exist show them; else fallback to "طلب تصميم"
    const occasion = o.occasionName?.trim();
    const size = o.sizeName?.trim();
    if (occasion && size) return `${occasion} - ${size}`;
    if (occasion) return occasion;
    return 'طلب تصميم مخصص';
  };

  // ===============================
  // API (updated to be resilient)
  // ===============================
  const fetchOrders = async () => {
    setIsLoading(true);
    setError(null);

    try {
      /**
       * ✅ Backend endpoint might be:
       * - /api/CustomOrders (old)
       * - /api/custom-orders (new)
       *
       * We'll try old first; if 404 then try new.
       */
      const buildUrl = (basePath: string) => {
        let url = `${apiUrl}${basePath}?pageNumber=${currentPage}&pageSize=${pageSize}`;

        if (statusFilter !== '') url += `&status=${statusFilter}`;

        if (searchTerm) url += `&searchTerm=${encodeURIComponent(searchTerm)}`;

        if (dateFilter) {
          // old query param
          url += `&pickupFromDate=${dateFilter}`;
          // new/fallback param (if backend changed)
          url += `&fromDate=${dateFilter}`;
          url += `&createdFromDate=${dateFilter}`;
        }

        return url;
      };

      const candidates = [buildUrl('/api/CustomOrders'), buildUrl('/api/custom-orders')];

      let response: Response | null = null;
      let lastErrorText = '';

      for (const url of candidates) {
        // eslint-disable-next-line no-await-in-loop
        const r = await fetch(url, { headers: getAuthHeaders() });
        if (r.ok) {
          response = r;
          break;
        }
        if (r.status === 404) {
          // try next candidate
          // eslint-disable-next-line no-await-in-loop
          lastErrorText = await r.text().catch(() => '');
          continue;
        }
        // Other errors: stop
        lastErrorText = await r.text().catch(() => '');
        response = r;
        break;
      }

      if (!response) throw new Error('فشل في جلب الطلبات');

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('accessToken');
          navigate('/login');
          throw new Error('غير مصرح: يرجى تسجيل الدخول مرة أخرى.');
        } else if (response.status === 403) {
          navigate('/');
          throw new Error('ممنوع: يتطلب صلاحيات إدارية.');
        }
        throw new Error(lastErrorText || 'فشل في جلب الطلبات');
      }

      const data: PaginatedResponse = await response.json();

      // Normalize a bit to avoid UI crashes
      const safeItems = (data.items ?? []).map((x: any) => ({
        id: String(x.id),
        orderNumber: x.orderNumber ?? null,
        customerName: x.customerName ?? null,
        customerPhone: x.customerPhone ?? null,
        additionalPhone: x.additionalPhone ?? null,
        address: x.address ?? null,

        occasionName: x.occasionName ?? x.occasion ?? null,
        sizeName: x.sizeName ?? x.size ?? null,
        flavorNames: Array.isArray(x.flavorNames) ? x.flavorNames : (Array.isArray(x.flavors) ? x.flavors : null),
        customText: x.customText ?? null,

        designImageUrl: x.designImageUrl ?? x.designImagePath ?? x.imageUrl ?? null,
        referenceImageUrl: x.referenceImageUrl ?? null,

        pickupDate: x.pickupDate ?? null,
        pickupTime: x.pickupTime ?? null,

        notes: x.notes ?? null,
        adminNotes: x.adminNotes ?? null,
        paymentMethod: x.paymentMethod ?? null,

        status: typeof x.status === 'number' ? x.status : CustomOrderStatus.Pending,

        estimatedPrice: typeof x.estimatedPrice === 'number' ? x.estimatedPrice : (x.priceEstimate ?? null),
        finalPrice: typeof x.finalPrice === 'number' ? x.finalPrice : null,

        createdAt: x.createdAt ?? x.created_at ?? new Date().toISOString(),
        userId: x.userId ?? null,
      })) as CustomOrder[];

      setOrders(safeItems);
      setTotalPages(data.totalPages ?? 1);
      setTotalItems(data.totalItems ?? safeItems.length);
      setCurrentPage(data.pageNumber ?? currentPage);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل في جلب الطلبات');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // try both endpoints
      const candidates = [`${apiUrl}/api/CustomOrders/stats`, `${apiUrl}/api/custom-orders/stats`];

      let response: Response | null = null;
      for (const url of candidates) {
        // eslint-disable-next-line no-await-in-loop
        const r = await fetch(url, { headers: getAuthHeaders() });
        if (r.ok) {
          response = r;
          break;
        }
        if (r.status === 404) continue;
        response = r;
        break;
      }

      if (response && response.ok) {
        const data: OrderStats = await response.json();
        setStats(data);
      }
    } catch (err) {
      // stats is optional
      console.error('Error fetching stats:', err);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedOrder || isLoading) return;

    setIsLoading(true);
    try {
      const updateData = {
        status: newStatus,
        finalPrice: finalPrice ? parseFloat(finalPrice) : undefined,
        adminNotes: adminNotes || undefined,
      };

      /**
       * ✅ Endpoint might be:
       * - PUT /api/CustomOrders/{id}/status
       * - PUT /api/custom-orders/{id}/status
       */
      const candidates = [
        `${apiUrl}/api/CustomOrders/${selectedOrder.id}/status`,
        `${apiUrl}/api/custom-orders/${selectedOrder.id}/status`,
      ];

      let response: Response | null = null;
      let lastErrorText = '';

      for (const url of candidates) {
        // eslint-disable-next-line no-await-in-loop
        const r = await fetch(url, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(updateData),
        });

        if (r.ok) {
          response = r;
          break;
        }
        lastErrorText = await r.text().catch(() => '');
        if (r.status === 404) continue;
        response = r;
        break;
      }

      if (!response || !response.ok) {
        throw new Error(`فشل في تحديث حالة الطلب: ${lastErrorText || ''}`);
      }

      await fetchOrders();
      await fetchStats();
      setShowStatusModal(false);
      setSelectedOrder(null);
      alert('تم تحديث حالة الطلب بنجاح!');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'حدث خطأ أثناء تحديث الطلب');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteOrder = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الطلب؟')) return;

    setIsLoading(true);
    try {
      const candidates = [`${apiUrl}/api/CustomOrders/${id}`, `${apiUrl}/api/custom-orders/${id}`];

      let response: Response | null = null;
      let lastText = '';

      for (const url of candidates) {
        // eslint-disable-next-line no-await-in-loop
        const r = await fetch(url, { method: 'DELETE', headers: getAuthHeaders() });
        if (r.ok) {
          response = r;
          break;
        }
        lastText = await r.text().catch(() => '');
        if (r.status === 404) continue;
        response = r;
        break;
      }

      if (!response || !response.ok) throw new Error(lastText || 'فشل في حذف الطلب');

      await fetchOrders();
      await fetchStats();
      alert('تم حذف الطلب بنجاح!');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'حدث خطأ أثناء حذف الطلب');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) setCurrentPage(page);
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchOrders();
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setDateFilter('');
    setCurrentPage(1);
  };

  // for footer range text
  const pageRangeText = useMemo(() => {
    const from = (currentPage - 1) * pageSize + 1;
    const to = Math.min(currentPage * pageSize, totalItems);
    if (!totalItems) return '—';
    return `عرض ${from} إلى ${to} من ${totalItems}`;
  }, [currentPage, pageSize, totalItems]);

  // ===============================
  // Render
  // ===============================
  return (
    <div className="p-3 sm:p-4 md:p-6 bg-gradient-to-b from-[#FAF9F6] via-[#F5F5DC] to-[#E5DCC5] min-h-screen" dir="rtl">
      {/* Header */}
      <div className="mb-4 sm:mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="bg-gradient-to-br from-[#F5F5DC] to-[#E5DCC5] p-2 sm:p-3 rounded-xl border-2 border-[#E5DCC5]">
            <ShoppingBag className="h-5 w-5 sm:h-6 sm:w-6 text-[#8B7355]" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-[#8B7355]" style={{ fontFamily: 'Tajawal, sans-serif' }}>
              إدارة الطلبات الخاصة
            </h2>
            <p className="text-xs sm:text-sm text-[#C4A57B]" style={{ fontFamily: 'Tajawal, sans-serif' }}>
              إجمالي: {totalItems}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6">
          <div className="bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-200 rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-md">
            <div className="flex items-center justify-between mb-1 sm:mb-2">
              <Clock3 className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-yellow-600" />
              <span className="text-xl sm:text-2xl md:text-3xl font-bold text-yellow-900" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                {stats.pendingOrders}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-700 font-medium" style={{ fontFamily: 'Tajawal, sans-serif' }}>
              قيد الانتظار
            </p>
          </div>

          <div className="bg-gradient-to-br from-[#F5F5DC] to-[#E5DCC5] border-2 border-[#E5DCC5] rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-md">
            <div className="flex items-center justify-between mb-1 sm:mb-2">
              <Package className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-[#8B7355]" />
              <span className="text-xl sm:text-2xl md:text-3xl font-bold text-[#8B7355]" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                {stats.inProgressOrders}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#8B7355] font-medium" style={{ fontFamily: 'Tajawal, sans-serif' }}>
              قيد التنفيذ
            </p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-md">
            <div className="flex items-center justify-between mb-1 sm:mb-2">
              <CheckCircle className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-green-600" />
              <span className="text-xl sm:text-2xl md:text-3xl font-bold text-green-900" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                {stats.completedOrders}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-700 font-medium" style={{ fontFamily: 'Tajawal, sans-serif' }}>
              مكتمل
            </p>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-md">
            <div className="flex items-center justify-between mb-1 sm:mb-2">
              <DollarSign className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-amber-600" />
              <span className="text-xl sm:text-2xl md:text-3xl font-bold text-amber-900" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                {(stats.totalRevenue ?? 0).toFixed(0)}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-700 font-medium" style={{ fontFamily: 'Tajawal, sans-serif' }}>
              الإيرادات (ج)
            </p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl sm:rounded-2xl p-3 sm:p-4 mb-4 sm:mb-6 flex items-start sm:items-center shadow-lg">
          <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 ml-2 flex-shrink-0 mt-0.5 sm:mt-0" />
          <span className="text-sm sm:text-base text-red-800 font-medium flex-1" style={{ fontFamily: 'Tajawal, sans-serif' }}>
            {error}
          </span>
          <button
            onClick={fetchOrders}
            className="mr-auto bg-red-100 hover:bg-red-200 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm text-red-800 flex items-center font-semibold transition-all"
            style={{ fontFamily: 'Tajawal, sans-serif' }}
            disabled={isLoading}
          >
            <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
            <span className="hidden sm:inline">إعادة المحاولة</span>
            <span className="sm:hidden">إعادة</span>
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-3 sm:p-4 md:p-6 mb-4 sm:mb-6 border-2 border-[#E5DCC5]">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
          <div>
            <label className="block text-xs sm:text-sm font-bold text-[#8B7355] mb-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
              <Search className="inline h-3 w-3 sm:h-4 sm:w-4 ml-1" />
              بحث
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-[#E5DCC5] rounded-lg sm:rounded-xl focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent text-right text-sm sm:text-base text-[#8B7355]"
              style={{ fontFamily: 'Tajawal, sans-serif' }}
              placeholder="رقم الطلب، اسم العميل، رقم الهاتف..."
              dir="rtl"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-bold text-[#8B7355] mb-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
              <Filter className="inline h-3 w-3 sm:h-4 sm:w-4 ml-1" />
              الحالة
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value === '' ? '' : (parseInt(e.target.value, 10) as CustomOrderStatus))}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-[#E5DCC5] rounded-lg sm:rounded-xl focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent text-right font-medium text-sm sm:text-base text-[#8B7355]"
              style={{ fontFamily: 'Tajawal, sans-serif' }}
              dir="rtl"
            >
              <option value="">الكل</option>
              <option value={CustomOrderStatus.Pending}>قيد الانتظار</option>
              <option value={CustomOrderStatus.Confirmed}>مؤكد</option>
              <option value={CustomOrderStatus.InProgress}>قيد التنفيذ</option>
              <option value={CustomOrderStatus.Ready}>جاهز</option>
              <option value={CustomOrderStatus.Completed}>مكتمل</option>
              <option value={CustomOrderStatus.Cancelled}>ملغي</option>
            </select>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-bold text-[#8B7355] mb-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
              <Calendar className="inline h-3 w-3 sm:h-4 sm:w-4 ml-1" />
              تاريخ (استلام / إنشاء)
            </label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-[#E5DCC5] rounded-lg sm:rounded-xl focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent text-right text-sm sm:text-base text-[#8B7355]"
              style={{ fontFamily: 'Tajawal, sans-serif' }}
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-3 sm:mt-4">
          <button
            onClick={handleSearch}
            className="bg-gradient-to-r from-[#8B7355] to-[#A67C52] text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl hover:from-[#6B5644] hover:to-[#8B6644] transition-all font-semibold shadow-md flex items-center justify-center gap-2 text-sm sm:text-base"
            style={{ fontFamily: 'Tajawal, sans-serif' }}
            disabled={isLoading}
          >
            <Search className="h-4 w-4" />
            بحث
          </button>
          <button
            onClick={handleResetFilters}
            className="bg-gray-200 text-gray-700 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl hover:bg-gray-300 transition-all font-semibold text-sm sm:text-base"
            style={{ fontFamily: 'Tajawal, sans-serif' }}
          >
            إعادة تعيين
          </button>
        </div>
      </div>

      {/* Orders List */}
      {isLoading && orders.length === 0 ? (
        <div className="flex flex-col sm:flex-row justify-center items-center py-8 sm:py-12">
          <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-[#8B7355]"></div>
          <span className="mt-3 sm:mt-0 sm:mr-3 text-[#8B7355] font-medium text-sm sm:text-base" style={{ fontFamily: 'Tajawal, sans-serif' }}>
            جاري تحميل الطلبات...
          </span>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12 sm:py-16 bg-white rounded-xl sm:rounded-2xl shadow-lg border-2 border-[#E5DCC5]">
          <div className="text-5xl sm:text-6xl md:text-7xl mb-3 sm:mb-4">🧾</div>
          <h3 className="text-lg sm:text-xl font-bold text-[#8B7355] mb-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
            لا توجد طلبات
          </h3>
          <p className="text-sm sm:text-base text-[#8B7355]/70 mb-4 sm:mb-6 px-4" style={{ fontFamily: 'Tajawal, sans-serif' }}>
            لم يتم العثور على طلبات بهذه المعايير
          </p>
          <button
            onClick={fetchOrders}
            className="bg-gradient-to-r from-[#8B7355] to-[#A67C52] text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl hover:from-[#6B5644] hover:to-[#8B6644] transition-all flex items-center mx-auto font-semibold shadow-lg gap-2 text-sm sm:text-base"
            style={{ fontFamily: 'Tajawal, sans-serif' }}
            disabled={isLoading}
          >
            <RefreshCw className="h-4 w-4" />
            إعادة التحميل
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-3 sm:p-4 md:p-6 border-2 border-[#E5DCC5]">
          <div className="space-y-3 sm:space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border-2 border-[#E5DCC5] rounded-lg sm:rounded-xl bg-gradient-to-r from-white to-[#FAF9F6] hover:shadow-md transition-all"
              >
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                    <span className="text-base sm:text-lg font-bold text-[#8B7355]" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      {orderDisplayNumber(order)}
                    </span>
                    <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold border ${getStatusColor(order.status)}`} style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      {getStatusText(order.status)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-1.5 sm:gap-2 text-xs sm:text-sm text-[#8B7355]/70" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3 sm:h-4 sm:w-4 text-[#D4AF37] flex-shrink-0" />
                      <span className="truncate">{order.customerName || '—'}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <Phone className="h-3 w-3 sm:h-4 sm:w-4 text-[#D4AF37] flex-shrink-0" />
                      <span className="truncate">{order.customerPhone || '—'}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <ShoppingBag className="h-3 w-3 sm:h-4 sm:w-4 text-[#D4AF37] flex-shrink-0" />
                      <span className="truncate">{mainTitleForOrder(order)}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-[#D4AF37] flex-shrink-0" />
                      <span className="hidden sm:inline">{formatDate(mainDateForOrder(order))}</span>
                      <span className="sm:hidden">
                        {new Date(mainDateForOrder(order)).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-2 sm:gap-3 text-xs sm:text-sm" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    <span className="font-semibold text-[#D4AF37]">
                      {(order.finalPrice ?? order.estimatedPrice ?? 0)} ج
                    </span>

                    <span className="text-[#8B7355]/70">{getPaymentMethodText(order.paymentMethod)}</span>

                    {order.flavorNames && order.flavorNames.length > 0 && (
                      <span className="text-[#C4A57B] text-xs">{order.flavorNames.join(' + ')}</span>
                    )}

                    {order.pickupTime && (
                      <span className="text-[#8B7355]/70 text-xs">
                        وقت: {formatTime(order.pickupTime)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2 mt-3 sm:mt-0 sm:mr-3">
                  <button
                    onClick={() => {
                      setSelectedOrder(order);
                      setShowDetailsModal(true);
                    }}
                    className="flex-1 sm:flex-none text-blue-600 hover:text-blue-700 p-2 hover:bg-blue-50 rounded-lg sm:rounded-xl transition-colors"
                    title="عرض التفاصيل"
                  >
                    <Eye size={18} className="sm:hidden mx-auto" />
                    <Eye size={20} className="hidden sm:block" />
                  </button>

                  <button
                    onClick={() => {
                      setSelectedOrder(order);
                      setNewStatus(order.status);
                      setFinalPrice(String(order.finalPrice ?? order.estimatedPrice ?? ''));
                      setAdminNotes(order.adminNotes || '');
                      setShowStatusModal(true);
                    }}
                    className="flex-1 sm:flex-none text-[#8B7355] hover:text-[#D4AF37] p-2 hover:bg-[#FAF9F6] rounded-lg sm:rounded-xl transition-colors"
                    title="تحديث الحالة"
                    disabled={isLoading}
                  >
                    <Edit size={18} className="sm:hidden mx-auto" />
                    <Edit size={20} className="hidden sm:block" />
                  </button>

                  <button
                    onClick={() => handleDeleteOrder(order.id)}
                    className="flex-1 sm:flex-none text-red-600 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg sm:rounded-xl transition-colors"
                    title="حذف الطلب"
                    disabled={isLoading}
                  >
                    <Trash2 size={18} className="sm:hidden mx-auto" />
                    <Trash2 size={20} className="hidden sm:block" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row justify-center items-center mt-6 sm:mt-8 gap-3 sm:gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1 || isLoading}
                className="w-full sm:w-auto px-4 py-2 bg-[#F5F5DC] text-[#8B7355] rounded-lg sm:rounded-xl hover:bg-[#E5DCC5] disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm sm:text-base border-2 border-[#E5DCC5]"
                style={{ fontFamily: 'Tajawal, sans-serif' }}
              >
                السابق
              </button>

              <div className="flex items-center gap-1 overflow-x-auto pb-2 sm:pb-0">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) pageNum = i + 1;
                  else if (currentPage <= 3) pageNum = i + 1;
                  else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                  else pageNum = currentPage - 2 + i;

                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      disabled={isLoading}
                      className={`px-3 py-2 rounded-lg sm:rounded-xl text-sm font-semibold ${
                        currentPage === pageNum
                          ? 'bg-gradient-to-r from-[#8B7355] to-[#A67C52] text-white'
                          : 'bg-[#F5F5DC] text-[#8B7355] hover:bg-[#E5DCC5] border border-[#E5DCC5]'
                      } disabled:opacity-50`}
                      style={{ fontFamily: 'Tajawal, sans-serif' }}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages || isLoading}
                className="w-full sm:w-auto px-4 py-2 bg-[#F5F5DC] text-[#8B7355] rounded-lg sm:rounded-xl hover:bg-[#E5DCC5] disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm sm:text-base border-2 border-[#E5DCC5]"
                style={{ fontFamily: 'Tajawal, sans-serif' }}
              >
                التالي
              </button>
            </div>
          )}

          <div className="text-center text-xs sm:text-sm text-[#8B7355]/70 mt-3 sm:mt-4" style={{ fontFamily: 'Tajawal, sans-serif' }}>
            {pageRangeText}
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 border-2 border-[#E5DCC5]">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-[#8B7355]" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                تفاصيل الطلب
              </h3>
              <button onClick={() => setShowDetailsModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl sm:text-3xl">
                ×
              </button>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <div className="bg-gradient-to-br from-[#F5F5DC] to-[#E5DCC5] rounded-xl sm:rounded-2xl p-3 sm:p-4 border-2 border-[#E5DCC5]">
                <p className="text-xs sm:text-sm text-[#8B7355]/70 mb-1" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                  رقم الطلب
                </p>
                <p className="text-lg sm:text-xl font-bold text-[#8B7355]" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                  {orderDisplayNumber(selectedOrder)}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <p className="text-xs sm:text-sm text-[#8B7355]/70 mb-1" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    اسم العميل
                  </p>
                  <p className="font-bold text-[#8B7355] text-sm sm:text-base" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    {selectedOrder.customerName || '—'}
                  </p>
                </div>

                <div>
                  <p className="text-xs sm:text-sm text-[#8B7355]/70 mb-1" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    رقم الهاتف
                  </p>
                  <p className="font-bold text-[#8B7355] text-sm sm:text-base" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    {selectedOrder.customerPhone || '—'}
                  </p>
                </div>
              </div>

              {selectedOrder.additionalPhone && (
                <div>
                  <p className="text-xs sm:text-sm text-[#8B7355]/70 mb-1" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    رقم هاتف إضافي
                  </p>
                  <p className="font-bold text-[#8B7355] text-sm sm:text-base flex items-center gap-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    <Phone className="h-4 w-4 text-[#D4AF37]" />
                    {selectedOrder.additionalPhone}
                  </p>
                </div>
              )}

              {selectedOrder.address && (
                <div>
                  <p className="text-xs sm:text-sm text-[#8B7355]/70 mb-1" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    العنوان
                  </p>
                  <p className="font-bold text-[#8B7355] text-sm sm:text-base flex items-start gap-2 bg-blue-50 p-3 rounded-xl" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    <MapPin className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span>{selectedOrder.address}</span>
                  </p>
                </div>
              )}

              {/* Old cake fields (only show if exist) */}
              {(selectedOrder.occasionName || selectedOrder.sizeName || (selectedOrder.flavorNames && selectedOrder.flavorNames.length > 0)) && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  <div>
                    <p className="text-xs sm:text-sm text-[#8B7355]/70 mb-1" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      المناسبة
                    </p>
                    <p className="font-bold text-[#8B7355] text-sm sm:text-base" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      {selectedOrder.occasionName || '—'}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs sm:text-sm text-[#8B7355]/70 mb-1" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      الحجم
                    </p>
                    <p className="font-bold text-[#8B7355] text-sm sm:text-base" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      {selectedOrder.sizeName || '—'}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs sm:text-sm text-[#8B7355]/70 mb-1" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      النكهات
                    </p>
                    <p className="font-bold text-[#8B7355] text-sm sm:text-base" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      {selectedOrder.flavorNames && selectedOrder.flavorNames.length > 0 ? selectedOrder.flavorNames.join(' + ') : '—'}
                    </p>
                  </div>
                </div>
              )}

              {selectedOrder.customText && (
                <div>
                  <p className="text-xs sm:text-sm text-[#8B7355]/70 mb-1" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    النص المخصص
                  </p>
                  <p className="font-bold text-[#8B7355] bg-amber-50 p-3 rounded-xl text-sm sm:text-base" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    "{selectedOrder.customText}"
                  </p>
                </div>
              )}

              {/* Design image (new backend) */}
              {(selectedOrder.designImageUrl || selectedOrder.referenceImageUrl) && (
                <div className="space-y-3">
                  {selectedOrder.designImageUrl && (
                    <div>
                      <p className="text-xs sm:text-sm text-[#8B7355]/70 mb-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                        صورة التصميم
                      </p>
                      <img
                        src={normalizeImageUrl(selectedOrder.designImageUrl)}
                        alt="Design"
                        className="w-full max-w-md rounded-xl border-2 border-[#E5DCC5]"
                      />
                    </div>
                  )}

                  {selectedOrder.referenceImageUrl && (
                    <div>
                      <p className="text-xs sm:text-sm text-[#8B7355]/70 mb-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                        صورة مرجعية
                      </p>
                      <img
                        src={normalizeImageUrl(selectedOrder.referenceImageUrl)}
                        alt="Reference"
                        className="w-full max-w-md rounded-xl border-2 border-[#E5DCC5]"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <p className="text-xs sm:text-sm text-[#8B7355]/70 mb-1" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    تاريخ (استلام / إنشاء)
                  </p>
                  <p className="font-bold text-[#8B7355] text-sm sm:text-base" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    {formatDate(mainDateForOrder(selectedOrder))}
                  </p>
                </div>

                {selectedOrder.pickupTime && (
                  <div>
                    <p className="text-xs sm:text-sm text-[#8B7355]/70 mb-1" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      وقت الاستلام
                    </p>
                    <p className="font-bold text-[#8B7355] text-sm sm:text-base" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      {formatTime(selectedOrder.pickupTime)}
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <p className="text-xs sm:text-sm text-[#8B7355]/70 mb-1" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    طريقة الدفع
                  </p>
                  <p className="font-bold text-[#8B7355] text-sm sm:text-base" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    {getPaymentMethodText(selectedOrder.paymentMethod)}
                  </p>
                </div>

                <div>
                  <p className="text-xs sm:text-sm text-[#8B7355]/70 mb-1" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    الحالة
                  </p>
                  <span className={`inline-block px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-bold border ${getStatusColor(selectedOrder.status)}`} style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    {getStatusText(selectedOrder.status)}
                  </span>
                </div>
              </div>

              {/* Prices */}
              <div className="bg-amber-50 rounded-xl sm:rounded-2xl p-3 sm:p-4 border-2 border-amber-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[#8B7355]/70 text-xs sm:text-sm" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    السعر التقديري
                  </span>
                  <span className="font-bold text-[#8B7355] text-sm sm:text-base" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    {(selectedOrder.estimatedPrice ?? 0)} جنيه
                  </span>
                </div>

                {selectedOrder.finalPrice !== null && selectedOrder.finalPrice !== undefined && (
                  <div className="flex justify-between items-center pt-2 border-t border-amber-200">
                    <span className="text-[#8B7355]/70 text-xs sm:text-sm" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      السعر النهائي
                    </span>
                    <span className="text-lg sm:text-xl font-bold text-amber-600" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      {selectedOrder.finalPrice} جنيه
                    </span>
                  </div>
                )}
              </div>

              {/* Notes */}
              {(selectedOrder.notes || selectedOrder.designNotes) && (
                <div>
                  <p className="text-xs sm:text-sm text-[#8B7355]/70 mb-1" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    ملاحظات العميل
                  </p>
                  <p className="text-[#8B7355] bg-gray-50 p-3 rounded-xl text-sm sm:text-base" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    {selectedOrder.notes || selectedOrder.designNotes}
                  </p>
                </div>
              )}

              {selectedOrder.adminNotes && (
                <div>
                  <p className="text-xs sm:text-sm text-[#8B7355]/70 mb-1" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    ملاحظات الإدارة
                  </p>
                  <p className="text-[#8B7355] bg-[#F5F5DC] p-3 rounded-xl text-sm sm:text-base" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    {selectedOrder.adminNotes}
                  </p>
                </div>
              )}

              <div>
                <p className="text-xs sm:text-sm text-[#8B7355]/70 mb-1" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                  تاريخ الإنشاء
                </p>
                <p className="text-[#8B7355] text-sm sm:text-base" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                  {formatDate(selectedOrder.createdAt)}
                </p>
              </div>
            </div>

            <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setNewStatus(selectedOrder.status);
                  setFinalPrice(String(selectedOrder.finalPrice ?? selectedOrder.estimatedPrice ?? ''));
                  setAdminNotes(selectedOrder.adminNotes || '');
                  setShowStatusModal(true);
                }}
                className="flex-1 bg-gradient-to-r from-[#8B7355] to-[#A67C52] text-white py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-bold hover:from-[#6B5644] hover:to-[#8B6644] transition-all shadow-md text-sm sm:text-base"
                style={{ fontFamily: 'Tajawal, sans-serif' }}
              >
                تحديث الحالة
              </button>

              <button
                onClick={() => setShowDetailsModal(false)}
                className="flex-1 bg-gray-200 text-gray-700 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-bold hover:bg-gray-300 transition-all text-sm sm:text-base"
                style={{ fontFamily: 'Tajawal, sans-serif' }}
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Update Modal */}
      {showStatusModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-md w-full p-4 sm:p-6 border-2 border-[#E5DCC5]">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-[#8B7355]" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                تحديث حالة الطلب
              </h3>
              <button onClick={() => setShowStatusModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl sm:text-3xl">
                ×
              </button>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-bold text-[#8B7355] mb-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                  الحالة الجديدة *
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(parseInt(e.target.value, 10) as CustomOrderStatus)}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-[#E5DCC5] rounded-lg sm:rounded-xl focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent text-right font-medium text-sm sm:text-base text-[#8B7355]"
                  style={{ fontFamily: 'Tajawal, sans-serif' }}
                  dir="rtl"
                >
                  <option value={CustomOrderStatus.Pending}>قيد الانتظار</option>
                  <option value={CustomOrderStatus.Confirmed}>مؤكد</option>
                  <option value={CustomOrderStatus.InProgress}>قيد التنفيذ</option>
                  <option value={CustomOrderStatus.Ready}>جاهز</option>
                  <option value={CustomOrderStatus.Completed}>مكتمل</option>
                  <option value={CustomOrderStatus.Cancelled}>ملغي</option>
                </select>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-[#8B7355] mb-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                  السعر النهائي (جنيه)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={finalPrice}
                  onChange={(e) => setFinalPrice(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-[#E5DCC5] rounded-lg sm:rounded-xl focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent text-right text-sm sm:text-base text-[#8B7355]"
                  style={{ fontFamily: 'Tajawal, sans-serif' }}
                  dir="rtl"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-[#8B7355] mb-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                  ملاحظات الإدارة
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-[#E5DCC5] rounded-lg sm:rounded-xl focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent text-right resize-none text-sm sm:text-base text-[#8B7355]"
                  style={{ fontFamily: 'Tajawal, sans-serif' }}
                  dir="rtl"
                  placeholder="أي ملاحظات إضافية..."
                />
              </div>
            </div>

            <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                onClick={handleUpdateStatus}
                disabled={isLoading}
                className="flex-1 bg-gradient-to-r from-[#8B7355] to-[#A67C52] text-white py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-bold hover:from-[#6B5644] hover:to-[#8B6644] transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                style={{ fontFamily: 'Tajawal, sans-serif' }}
              >
                {isLoading ? 'جاري التحديث...' : 'تحديث'}
              </button>

              <button
                onClick={() => setShowStatusModal(false)}
                disabled={isLoading}
                className="flex-1 bg-gray-200 text-gray-700 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-bold hover:bg-gray-300 transition-all disabled:opacity-50 text-sm sm:text-base"
                style={{ fontFamily: 'Tajawal, sans-serif' }}
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomOrdersManagement;
