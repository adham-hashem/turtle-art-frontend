// src/pages/admin/CustomOrdersManagement.tsx

import React, { useEffect, useMemo, useRef, useState } from 'react';
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
    Image as ImageIcon,
    Palette,
    Type,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

// ===============================
// Enums (✅ FIXED - matching backend exactly)
// ===============================
enum CustomOrderStatus {
    Pending = 0,
    Reviewed = 1,
    Confirmed = 2,
    InProgress = 3,
    Ready = 4,
    Completed = 5,
    Cancelled = 6,
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
    additionalPhone?: string | null;
    address?: string | null;
    userId?: string | null;
    requiredText: string;
    preferredColors: string;
    designImagePath?: string | null;
    designImageUrl?: string | null;
    designImageThumbnailUrl?: string | null;
    notes?: string | null;
    adminNotes?: string | null;
    paymentMethod?: PaymentMethod | null;
    paymentMethodLabel?: string | null;
    status: CustomOrderStatus;
    statusLabel?: string | null;
    statusColor?: string | null;
    estimatedPrice?: number | null;
    finalPrice?: number | null;
    createdAt: string;
    createdAtFormatted?: string | null;
    updatedAt?: string | null;
    confirmedAt?: string | null;
    completedAt?: string | null;
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

    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const pageSize = 10;

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<CustomOrderStatus | ''>('');
    const [dateFilter, setDateFilter] = useState('');

    const [newStatus, setNewStatus] = useState<CustomOrderStatus>(CustomOrderStatus.Pending);
    const [finalPrice, setFinalPrice] = useState('');
    const [adminNotes, setAdminNotes] = useState('');

    const [debouncedSearch, setDebouncedSearch] = useState('');
    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 350);
        return () => clearTimeout(t);
    }, [searchTerm]);

    const apiUrl = import.meta.env.VITE_API_BASE_URL || 'https://turtle-art.runasp.net';

    const ordersAbortRef = useRef<AbortController | null>(null);
    const statsAbortRef = useRef<AbortController | null>(null);

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
        if (Number.isNaN(d.getTime())) return '—';
        return d.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    const formatShortDate = (dateString?: string | null) => {
        if (!dateString) return '—';
        const d = new Date(dateString);
        if (Number.isNaN(d.getTime())) return '—';
        return d.toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' });
    };

    const getStatusText = (status: CustomOrderStatus) => {
        const statusMap: Record<number, string> = {
            [CustomOrderStatus.Pending]: 'قيد الانتظار',
            [CustomOrderStatus.Reviewed]: 'تمت المراجعة',
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
            [CustomOrderStatus.Reviewed]: 'bg-indigo-100 text-indigo-800 border-indigo-200',
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

    const normalizeOrder = (x: any): CustomOrder => {
        console.log('🔄 Order:', x.orderNumber || x.id, 'Status:', x.status, 'Type:', typeof x.status);

        // ✅ Map string status to enum number
        const statusStringToEnum: Record<string, CustomOrderStatus> = {
            'Pending': CustomOrderStatus.Pending,
            'Reviewed': CustomOrderStatus.Reviewed,
            'Confirmed': CustomOrderStatus.Confirmed,
            'InProgress': CustomOrderStatus.InProgress,
            'Ready': CustomOrderStatus.Ready,
            'Completed': CustomOrderStatus.Completed,
            'Cancelled': CustomOrderStatus.Cancelled,
        };

        let parsedStatus: CustomOrderStatus = CustomOrderStatus.Pending;
        if (typeof x.status === 'number') {
            parsedStatus = x.status;
        } else if (typeof x.status === 'string') {
            // Try mapping string name first
            if (statusStringToEnum[x.status] !== undefined) {
                parsedStatus = statusStringToEnum[x.status];
            } else {
                // Fallback: try parsing as number
                const statusNum = parseInt(x.status, 10);
                if (!isNaN(statusNum)) {
                    parsedStatus = statusNum as CustomOrderStatus;
                }
            }
        }

        return {
            id: String(x.id),
            orderNumber: x.orderNumber || `#${String(x.id).slice(0, 8)}`,
            customerName: x.customerName || '—',
            customerPhone: x.customerPhone || '—',
            additionalPhone: x.additionalPhone ?? null,
            address: x.address ?? null,
            userId: x.userId ?? null,
            requiredText: x.requiredText || '—',
            preferredColors: x.preferredColors || '—',
            designImagePath: x.designImagePath ?? null,
            designImageUrl: x.designImageUrl ?? null,
            designImageThumbnailUrl: x.designImageThumbnailUrl ?? null,
            notes: x.notes ?? null,
            adminNotes: x.adminNotes ?? null,
            paymentMethod: typeof x.paymentMethod === 'number' ? x.paymentMethod : null,
            paymentMethodLabel: x.paymentMethodLabel ?? null,
            status: parsedStatus,
            statusLabel: x.statusLabel ?? null,
            statusColor: x.statusColor ?? null,
            estimatedPrice: typeof x.estimatedPrice === 'number' ? x.estimatedPrice : null,
            finalPrice: typeof x.finalPrice === 'number' ? x.finalPrice : null,
            createdAt: x.createdAt ?? new Date().toISOString(),
            createdAtFormatted: x.createdAtFormatted ?? null,
            updatedAt: x.updatedAt ?? null,
            confirmedAt: x.confirmedAt ?? null,
            completedAt: x.completedAt ?? null,
        };
    };

    const fetchOrders = async () => {
        ordersAbortRef.current?.abort();
        const ac = new AbortController();
        ordersAbortRef.current = ac;

        setIsLoading(true);
        setError(null);

        try {
            let url = `${apiUrl}/api/CustomOrders?Page=${currentPage}&PageSize=${pageSize}`;
            if (statusFilter !== '') url += `&Status=${statusFilter}`;
            if (debouncedSearch) url += `&SearchTerm=${encodeURIComponent(debouncedSearch)}`;
            if (dateFilter) url += `&FromDate=${dateFilter}`;

            const response = await fetch(url, {
                headers: getAuthHeaders(),
                signal: ac.signal,
                cache: 'no-store',
            });

            if (!response.ok) {
                if (response.status === 401) {
                    localStorage.removeItem('accessToken');
                    navigate('/login');
                    throw new Error('غير مصرح: يرجى تسجيل الدخول مرة أخرى.');
                } else if (response.status === 403) {
                    navigate('/');
                    throw new Error('ممنوع: يتطلب صلاحيات إدارية.');
                }
                throw new Error('فشل في جلب الطلبات');
            }

            const data: PaginatedResponse = await response.json();
            console.log('📦 Fetched:', data.items?.length || 0, 'orders');

            const safeItems = (data.items ?? []).map(normalizeOrder);

            setOrders(safeItems);
            setTotalPages(data.totalPages ?? 1);
            setTotalItems(data.totalItems ?? safeItems.length);
            setCurrentPage(data.pageNumber ?? currentPage);
        } catch (err) {
            if (err instanceof DOMException && err.name === 'AbortError') return;
            setError(err instanceof Error ? err.message : 'فشل في جلب الطلبات');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchStats = async () => {
        statsAbortRef.current?.abort();
        const ac = new AbortController();
        statsAbortRef.current = ac;

        try {
            const response = await fetch(`${apiUrl}/api/CustomOrders/stats`, {
                headers: getAuthHeaders(),
                signal: ac.signal,
                cache: 'no-store',
            });

            if (response.ok) {
                const data: OrderStats = await response.json();
                setStats(data);
            }
        } catch (err) {
            if (err instanceof DOMException && err.name === 'AbortError') return;
            console.warn('Stats failed (non-critical):', err);
        }
    };

    useEffect(() => {
        if (!isAuthenticated || String(userRole).toLowerCase() !== 'admin') return;
        fetchOrders();
        fetchStats();
    }, [isAuthenticated, userRole, currentPage, statusFilter, debouncedSearch, dateFilter]);

    const handleUpdateStatus = async () => {
        if (!selectedOrder || isLoading) return;

        setIsLoading(true);
        try {
            const updateData: any = { status: newStatus };

            if (finalPrice && finalPrice.trim()) {
                updateData.finalPrice = parseFloat(finalPrice);
            }

            if (adminNotes && adminNotes.trim()) {
                updateData.adminNotes = adminNotes;
            }

            console.log('📤 Update:', updateData);

            const response = await fetch(`${apiUrl}/api/CustomOrders/${selectedOrder.id}/status`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(updateData),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`فشل في تحديث حالة الطلب: ${errorText}`);
            }

            const responseData = await response.json();
            console.log('✅ Response:', responseData);

            await new Promise(resolve => setTimeout(resolve, 500));

            await fetchOrders();
            await fetchStats();

            setShowStatusModal(false);
            setSelectedOrder(null);
            alert('تم تحديث حالة الطلب بنجاح!');
        } catch (error) {
            console.error('❌ Error:', error);
            alert(error instanceof Error ? error.message : 'حدث خطأ أثناء تحديث الطلب');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteOrder = async (id: string) => {
        if (!confirm('هل أنت متأكد من حذف هذا الطلب؟')) return;

        setIsLoading(true);
        try {
            const response = await fetch(`${apiUrl}/api/CustomOrders/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders(),
            });

            if (!response.ok) {
                throw new Error('فشل في حذف الطلب');
            }

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

    const handleResetFilters = () => {
        setSearchTerm('');
        setStatusFilter('');
        setDateFilter('');
        setCurrentPage(1);
    };

    const handleRefresh = () => {
        fetchOrders();
        fetchStats();
    };

    const pageRangeText = useMemo(() => {
        const from = (currentPage - 1) * pageSize + 1;
        const to = Math.min(currentPage * pageSize, totalItems);
        if (!totalItems) return '—';
        return `عرض ${from} إلى ${to} من ${totalItems}`;
    }, [currentPage, pageSize, totalItems]);

return (
    <div className="p-3 sm:p-4 md:p-6 bg-gradient-to-b from-[#FAF9F6] via-[#F5F5DC] to-[#E5DCC5] min-h-screen pb-24" dir="rtl">
      {/* Header */}
      <div className="mb-4 sm:mb-6 flex items-center justify-between gap-2">
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

        <button
          onClick={handleRefresh}
          className="bg-white border-2 border-[#E5DCC5] hover:bg-[#FAF9F6] px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm text-[#8B7355] flex items-center gap-2 font-semibold transition-all shadow-sm"
          style={{ fontFamily: 'Tajawal, sans-serif' }}
          disabled={isLoading}
          title="تحديث"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">تحديث</span>
        </button>
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
            onClick={handleRefresh}
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
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
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
              onChange={(e) => {
                setStatusFilter(e.target.value === '' ? '' : (parseInt(e.target.value, 10) as CustomOrderStatus));
                setCurrentPage(1);
              }}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-[#E5DCC5] rounded-lg sm:rounded-xl focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent text-right font-medium text-sm sm:text-base text-[#8B7355]"
              style={{ fontFamily: 'Tajawal, sans-serif' }}
              dir="rtl"
            >
              <option value="">الكل</option>
              <option value={CustomOrderStatus.Pending}>قيد الانتظار</option>
              <option value={CustomOrderStatus.Reviewed}>تمت المراجعة</option>
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
              تاريخ الإنشاء من
            </label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-[#E5DCC5] rounded-lg sm:rounded-xl focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent text-right text-sm sm:text-base text-[#8B7355]"
              style={{ fontFamily: 'Tajawal, sans-serif' }}
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-3 sm:mt-4">
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
            onClick={handleRefresh}
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
                      {order.orderNumber}
                    </span>

                    <span
                      className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold border ${getStatusColor(order.status)}`}
                      style={{ fontFamily: 'Tajawal, sans-serif' }}
                    >
                      {getStatusText(order.status)}
                    </span>

                    {(order.designImageUrl || order.designImagePath) && (
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold border bg-purple-50 text-purple-700 border-purple-200"
                        style={{ fontFamily: 'Tajawal, sans-serif' }}
                        title="يوجد صورة تصميم"
                      >
                        <ImageIcon className="h-3 w-3" />
                        تصميم
                      </span>
                    )}
                  </div>

                  <div
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-1.5 sm:gap-2 text-xs sm:text-sm text-[#8B7355]/70"
                    style={{ fontFamily: 'Tajawal, sans-serif' }}
                  >
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3 sm:h-4 sm:w-4 text-[#D4AF37] flex-shrink-0" />
                      <span className="truncate">{order.customerName}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <Phone className="h-3 w-3 sm:h-4 sm:w-4 text-[#D4AF37] flex-shrink-0" />
                      <span className="truncate">{order.customerPhone}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <Type className="h-3 w-3 sm:h-4 sm:w-4 text-[#D4AF37] flex-shrink-0" />
                      <span className="truncate">{order.requiredText}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-[#D4AF37] flex-shrink-0" />
                      <span className="hidden sm:inline">{formatDate(order.createdAt)}</span>
                      <span className="sm:hidden">{formatShortDate(order.createdAt)}</span>
                    </div>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-2 sm:gap-3 text-xs sm:text-sm" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    <span className="font-semibold text-[#D4AF37]">{(order.finalPrice ?? order.estimatedPrice ?? 0)} ج</span>
                    <span className="text-[#8B7355]/70">{getPaymentMethodText(order.paymentMethod)}</span>
                    <div className="flex items-center gap-1 text-[#C4A57B]">
                      <Palette className="h-3 w-3" />
                      <span className="text-xs">{order.preferredColors}</span>
                    </div>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 sm:p-4 z-50" style={{ paddingBottom: '120px' }}>
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
                  {selectedOrder.orderNumber}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <p className="text-xs sm:text-sm text-[#8B7355]/70 mb-1" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    اسم العميل
                  </p>
                  <p className="font-bold text-[#8B7355] text-sm sm:text-base" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    {selectedOrder.customerName}
                  </p>
                </div>

                <div>
                  <p className="text-xs sm:text-sm text-[#8B7355]/70 mb-1" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    رقم الهاتف
                  </p>
                  <p className="font-bold text-[#8B7355] text-sm sm:text-base" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    {selectedOrder.customerPhone}
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <p className="text-xs sm:text-sm text-[#8B7355]/70 mb-1" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    النص المطلوب
                  </p>
                  <p className="font-bold text-[#8B7355] bg-amber-50 p-3 rounded-xl text-sm sm:text-base" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    "{selectedOrder.requiredText}"
                  </p>
                </div>

                <div>
                  <p className="text-xs sm:text-sm text-[#8B7355]/70 mb-1" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    الألوان المفضلة
                  </p>
                  <p className="font-bold text-[#8B7355] bg-purple-50 p-3 rounded-xl text-sm sm:text-base flex items-center gap-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    <Palette className="h-4 w-4 text-purple-600" />
                    {selectedOrder.preferredColors}
                  </p>
                </div>
              </div>

              {(selectedOrder.designImageUrl || selectedOrder.designImagePath) && (
                <div>
                  <p className="text-xs sm:text-sm text-[#8B7355]/70 mb-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    صورة التصميم
                  </p>
                  <img
                    src={normalizeImageUrl(selectedOrder.designImageUrl || selectedOrder.designImagePath)}
                    alt="Design"
                    className="w-full max-w-md rounded-xl border-2 border-[#E5DCC5]"
                  />
                </div>
              )}

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
                  <span
                    className={`inline-block px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-bold border ${getStatusColor(selectedOrder.status)}`}
                    style={{ fontFamily: 'Tajawal, sans-serif' }}
                  >
                    {getStatusText(selectedOrder.status)}
                  </span>
                </div>
              </div>

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

              {selectedOrder.notes && (
                <div>
                  <p className="text-xs sm:text-sm text-[#8B7355]/70 mb-1" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    ملاحظات العميل
                  </p>
                  <p className="text-[#8B7355] bg-gray-50 p-3 rounded-xl text-sm sm:text-base" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    {selectedOrder.notes}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 sm:p-4 z-50" style={{ paddingBottom: '120px' }}>
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
                  <option value={CustomOrderStatus.Reviewed}>تمت المراجعة</option>
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
