import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Edit, 
  Trash2, 
  Plus, 
  AlertCircle, 
  RefreshCw, 
  Sparkles, 
  Truck, 
  MapPin, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  XCircle 
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

// Interface for ShippingFee based on backend DTOs
interface ShippingFee {
  id: string;
  governorate: string;
  fee: number;
  deliveryTime: string;
  status: 0 | 1;
  createdAt: string;
}

interface PaginatedShippingFeesResponse {
  items: ShippingFee[];
  totalItems: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

const ShippingManagement: React.FC = () => {
  const { isAuthenticated, userRole } = useAuth();
  const navigate = useNavigate();
  const [shippingFees, setShippingFees] = useState<ShippingFee[]>([]);
  const [newShippingFee, setNewShippingFee] = useState({
    governorate: '',
    fee: '',
    deliveryTime: '',
    status: 0 as 0 | 1,
  });
  const [editingShippingFee, setEditingShippingFee] = useState<ShippingFee | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const pageSize = 10;

  const apiUrl = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (userRole !== 'admin') {
      navigate('/');
      return;
    }

    fetchShippingFees(currentPage);
  }, [isAuthenticated, userRole, navigate, currentPage]);

  const fetchShippingFees = async (page: number = 1) => {
    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        navigate('/login');
        throw new Error('لا يوجد رمز مصادقة. يرجى تسجيل الدخول مرة أخرى.');
      }

      const response = await fetch(
        `${apiUrl}/api/shipping-fees?pageNumber=${page}&pageSize=${pageSize}`,
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
          throw new Error('غير مصرح: يرجى تسجيل الدخول مرة أخرى.');
        } else if (response.status === 403) {
          navigate('/');
          throw new Error('ممنوع: يتطلب صلاحيات إدارية.');
        }
        throw new Error(`فشل في جلب رسوم الشحن: ${response.status} ${responseText}`);
      }

      const data: PaginatedShippingFeesResponse = JSON.parse(responseText);
      setShippingFees(data.items);
      setTotalPages(data.totalPages);
      setTotalItems(data.totalItems);
      setCurrentPage(data.pageNumber);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل في جلب رسوم الشحن');
    } finally {
      setIsLoading(false);
    }
  };

  const validateShippingFee = () => {
    if (!newShippingFee.governorate) return 'اسم المحافظة مطلوب';
    if (!newShippingFee.fee) return 'رسوم التوصيل مطلوبة';
    if (isNaN(parseFloat(newShippingFee.fee)) || parseFloat(newShippingFee.fee) < 0) {
      return 'رسوم التوصيل يجب أن تكون رقمًا صحيحًا وغير سالب';
    }
    if (!newShippingFee.deliveryTime) return 'مدة التوصيل مطلوبة';
    return null;
  };

  const handleAddShippingFee = async () => {
    if (isLoading) return;

    const validationError = validateShippingFee();
    if (validationError) {
      alert(validationError);
      return;
    }

    const token = localStorage.getItem('accessToken');
    if (!token) {
      navigate('/login');
      alert('لا يوجد رمز مصادقة. يرجى تسجيل الدخول مرة أخرى.');
      return;
    }

    setIsLoading(true);
    try {
      const request = {
        governorate: newShippingFee.governorate,
        fee: parseFloat(newShippingFee.fee),
        deliveryTime: newShippingFee.deliveryTime,
        status: newShippingFee.status,
      };

      const response = await fetch(`${apiUrl}/api/shipping-fees`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 401) {
          localStorage.removeItem('accessToken');
          navigate('/login');
          throw new Error('غير مصرح: يرجى تسجيل الدخول مرة أخرى.');
        } else if (response.status === 403) {
          navigate('/');
          throw new Error('ممنوع: يتطلب صلاحيات إدارية.');
        } else if (response.status === 400 && errorText.includes('already exists')) {
          throw new Error('المحافظة موجودة بالفعل. يرجى استخدام اسم محافظة مختلف.');
        }
        throw new Error(`فشل في إضافة رسوم الشحن: ${response.status} ${errorText}`);
      }

      await fetchShippingFees(currentPage);
      setNewShippingFee({
        governorate: '',
        fee: '',
        deliveryTime: '',
        status: 0,
      });
      alert('تم إضافة رسوم الشحن بنجاح!');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'حدث خطأ أثناء إضافة رسوم الشحن');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateShippingFee = async () => {
    if (isLoading || !editingShippingFee) return;

    const validationError = validateShippingFee();
    if (validationError) {
      alert(validationError);
      return;
    }

    const token = localStorage.getItem('accessToken');
    if (!token) {
      navigate('/login');
      alert('لا يوجد رمز مصادقة. يرجى تسجيل الدخول مرة أخرى.');
      return;
    }

    setIsLoading(true);
    try {
      const request = {
        governorate: newShippingFee.governorate,
        fee: parseFloat(newShippingFee.fee),
        deliveryTime: newShippingFee.deliveryTime,
        status: newShippingFee.status,
      };

      const response = await fetch(`${apiUrl}/api/shipping-fees/${editingShippingFee.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 401) {
          localStorage.removeItem('accessToken');
          navigate('/login');
          throw new Error('غير مصرح: يرجى تسجيل الدخول مرة أخرى.');
        } else if (response.status === 403) {
          navigate('/');
          throw new Error('ممنوع: يتطلب صلاحيات إدارية.');
        } else if (response.status === 404) {
          throw new Error('رسوم الشحن غير موجودة.');
        } else if (response.status === 400 && errorText.includes('already exists')) {
          throw new Error('المحافظة موجودة بالفعل. يرجى استخدام اسم محافظة مختلف.');
        }
        throw new Error(`فشل في تحديث رسوم الشحن: ${response.status} ${errorText}`);
      }

      await fetchShippingFees(currentPage);
      setEditingShippingFee(null);
      setNewShippingFee({
        governorate: '',
        fee: '',
        deliveryTime: '',
        status: 0,
      });
      alert('تم تحديث رسوم الشحن بنجاح!');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'حدث خطأ أثناء تحديث رسوم الشحن');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteShippingFee = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف رسوم الشحن لهذه المحافظة؟')) {
      return;
    }

    const token = localStorage.getItem('accessToken');
    if (!token) {
      navigate('/login');
      alert('لا يوجد رمز مصادقة. يرجى تسجيل الدخول مرة أخرى.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${apiUrl}/api/shipping-fees/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 401) {
          localStorage.removeItem('accessToken');
          navigate('/login');
          throw new Error('غير مصرح: يرجى تسجيل الدخول مرة أخرى.');
        } else if (response.status === 403) {
          navigate('/');
          throw new Error('ممنوع: يتطلب صلاحيات إدارية.');
        } else if (response.status === 404) {
          throw new Error('رسوم الشحن غير موجودة.');
        }
        throw new Error(`فشل في حذف رسوم الشحن: ${response.status} ${errorText}`);
      }

      await fetchShippingFees(currentPage);
      alert('تم حذف رسوم الشحن بنجاح!');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'حدث خطأ أثناء حذف رسوم الشحن');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      setCurrentPage(page);
    }
  };

  if (isLoading && shippingFees.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B7355]"></div>
        <span className="mr-3 text-[#8B7355] font-medium" style={{ fontFamily: 'Tajawal, sans-serif' }}>جاري تحميل رسوم الشحن...</span>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-[#F5F5DC] to-[#E5DCC5] p-3 rounded-xl border-2 border-[#E5DCC5]">
            <Truck className="h-6 w-6 text-[#8B7355]" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[#8B7355]" style={{ fontFamily: 'Tajawal, sans-serif' }}>إدارة رسوم الشحن</h2>
            <p className="text-sm text-[#C4A57B]" style={{ fontFamily: 'Tajawal, sans-serif' }}>إجمالي المحافظات: {totalItems}</p>
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
            onClick={() => fetchShippingFees(currentPage)}
            className="mr-auto bg-red-100 hover:bg-red-200 px-4 py-2 rounded-xl text-sm text-red-800 flex items-center font-semibold transition-all"
            style={{ fontFamily: 'Tajawal, sans-serif' }}
            disabled={isLoading}
          >
            <RefreshCw className="h-4 w-4 ml-1" />
            إعادة المحاولة
          </button>
        </div>
      )}

      {/* Add/Edit Form */}
      <div className="mb-8 p-6 bg-gradient-to-br from-white to-[#FAF9F6] rounded-2xl shadow-xl border-2 border-[#E5DCC5]">
        <h3 className="text-xl font-bold text-[#8B7355] mb-6 flex items-center gap-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
          {editingShippingFee ? (
            <>
              <Edit className="h-5 w-5" />
              تعديل رسوم الشحن
            </>
          ) : (
            <>
              <Plus className="h-5 w-5" />
              إضافة رسوم شحن جديدة
            </>
          )}
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-[#8B7355] mb-2 flex items-center gap-1" style={{ fontFamily: 'Tajawal, sans-serif' }}>
              <MapPin className="h-4 w-4" />
              اسم المحافظة <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newShippingFee.governorate}
              onChange={(e) => setNewShippingFee((prev) => ({ ...prev, governorate: e.target.value }))}
              className="w-full px-4 py-3 border-2 border-[#E5DCC5] rounded-xl focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] text-right text-[#8B7355]"
              style={{ fontFamily: 'Tajawal, sans-serif' }}
              dir="rtl"
              disabled={isLoading}
              placeholder="مثال: القاهرة"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-[#8B7355] mb-2 flex items-center gap-1" style={{ fontFamily: 'Tajawal, sans-serif' }}>
              <DollarSign className="h-4 w-4" />
              رسوم التوصيل (جنيه) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={newShippingFee.fee}
              onChange={(e) => setNewShippingFee((prev) => ({ ...prev, fee: e.target.value }))}
              className="w-full px-4 py-3 border-2 border-[#E5DCC5] rounded-xl focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] text-right text-[#8B7355]"
              style={{ fontFamily: 'Tajawal, sans-serif' }}
              dir="rtl"
              disabled={isLoading}
              placeholder="مثال: 30"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-[#8B7355] mb-2 flex items-center gap-1" style={{ fontFamily: 'Tajawal, sans-serif' }}>
              <Clock className="h-4 w-4" />
              مدة التوصيل <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newShippingFee.deliveryTime}
              onChange={(e) => setNewShippingFee((prev) => ({ ...prev, deliveryTime: e.target.value }))}
              className="w-full px-4 py-3 border-2 border-[#E5DCC5] rounded-xl focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] text-right text-[#8B7355]"
              style={{ fontFamily: 'Tajawal, sans-serif' }}
              dir="rtl"
              disabled={isLoading}
              placeholder="مثال: 1-2 أيام"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-[#8B7355] mb-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>الحالة</label>
            <select
              value={newShippingFee.status}
              onChange={(e) => setNewShippingFee((prev) => ({ ...prev, status: parseInt(e.target.value) as 0 | 1 }))}
              className="w-full px-4 py-3 border-2 border-[#E5DCC5] rounded-xl focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] text-right font-medium text-[#8B7355]"
              style={{ fontFamily: 'Tajawal, sans-serif' }}
              dir="rtl"
              disabled={isLoading}
            >
              <option value={0}>مفعّل</option>
              <option value={1}>غير مفعّل</option>
            </select>
          </div>
        </div>
        <div className="flex gap-4 mt-6">
          <button
            onClick={editingShippingFee ? handleUpdateShippingFee : handleAddShippingFee}
            className="bg-gradient-to-r from-[#8B7355] to-[#A67C52] text-white px-6 py-3 rounded-xl hover:from-[#6B5644] hover:to-[#8B6644] transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-md flex items-center gap-2"
            style={{ fontFamily: 'Tajawal, sans-serif' }}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <RefreshCw className="animate-spin h-4 w-4" />
                جاري المعالجة...
              </>
            ) : editingShippingFee ? (
              <>
                <Edit className="h-4 w-4" />
                تحديث رسوم الشحن
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                إضافة رسوم الشحن
              </>
            )}
          </button>
          {(editingShippingFee || newShippingFee.governorate || newShippingFee.fee || newShippingFee.deliveryTime) && (
            <button
              onClick={() => {
                setEditingShippingFee(null);
                setNewShippingFee({
                  governorate: '',
                  fee: '',
                  deliveryTime: '',
                  status: 0,
                });
              }}
              className="bg-gradient-to-r from-gray-400 to-gray-500 text-white px-6 py-3 rounded-xl hover:from-gray-500 hover:to-gray-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-md"
              style={{ fontFamily: 'Tajawal, sans-serif' }}
              disabled={isLoading}
            >
              إلغاء
            </button>
          )}
        </div>
      </div>

      {/* Shipping Fees List */}
      {shippingFees.length === 0 ? (
        <div className="text-center py-16 bg-gradient-to-br from-white to-[#FAF9F6] rounded-2xl shadow-xl border-2 border-[#E5DCC5]">
          <div className="text-7xl mb-4">🚚</div>
          <h3 className="text-xl font-bold text-[#8B7355] mb-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>لا توجد رسوم شحن</h3>
          <p className="text-[#8B7355]/70 mb-6" style={{ fontFamily: 'Tajawal, sans-serif' }}>ابدأ بإضافة رسوم شحن للمحافظات</p>
          <button
            onClick={() => fetchShippingFees(currentPage)}
            className="bg-gradient-to-r from-[#8B7355] to-[#A67C52] text-white px-6 py-3 rounded-xl hover:from-[#6B5644] hover:to-[#8B6644] transition-all flex items-center mx-auto font-semibold shadow-lg gap-2"
            style={{ fontFamily: 'Tajawal, sans-serif' }}
            disabled={isLoading}
          >
            <RefreshCw className="h-4 w-4" />
            إعادة التحميل
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-[#E5DCC5]">
          <h4 className="text-lg font-bold text-[#8B7355] mb-4 flex items-center gap-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
            <Truck className="h-5 w-5" />
            رسوم الشحن المتاحة ({shippingFees.length})
          </h4>
          <div className="space-y-3">
            {shippingFees.map((shippingFee) => (
              <div
                key={shippingFee.id}
                className="flex items-center justify-between p-4 border-2 border-[#E5DCC5] rounded-xl bg-gradient-to-r from-white to-[#FAF9F6] hover:shadow-md transition-all"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="h-5 w-5 text-[#D4AF37]" />
                    <p className="font-bold text-[#8B7355] text-lg" style={{ fontFamily: 'Tajawal, sans-serif' }}>{shippingFee.governorate}</p>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-[#8B7355]/70">
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span className="font-semibold" style={{ fontFamily: 'Tajawal, sans-serif' }}>{shippingFee.fee.toFixed(2)} جنيه</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4 text-[#C4A57B]" />
                      <span style={{ fontFamily: 'Tajawal, sans-serif' }}>{shippingFee.deliveryTime}</span>
                    </span>
                    <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                      shippingFee.status === 0 
                        ? 'bg-green-100 text-green-800 border border-green-200' 
                        : 'bg-red-100 text-red-800 border border-red-200'
                    }`} style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      {shippingFee.status === 0 ? (
                        <>
                          <CheckCircle className="h-3 w-3" />
                          مفعّل
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3 w-3" />
                          غير مفعّل
                        </>
                      )}
                    </span>
                  </div>
                  <p className="text-xs text-[#8B7355]/70 mt-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>تاريخ الإنشاء: {formatDate(shippingFee.createdAt)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditingShippingFee(shippingFee);
                      setNewShippingFee({
                        governorate: shippingFee.governorate,
                        fee: shippingFee.fee.toString(),
                        deliveryTime: shippingFee.deliveryTime,
                        status: shippingFee.status,
                      });
                    }}
                    className="text-blue-600 hover:text-blue-700 p-2 disabled:opacity-50 hover:bg-blue-50 rounded-lg transition-all"
                    title="تعديل رسوم الشحن"
                    disabled={isLoading}
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDeleteShippingFee(shippingFee.id)}
                    className="text-red-600 hover:text-red-700 p-2 disabled:opacity-50 hover:bg-red-50 rounded-lg transition-all"
                    title="حذف رسوم الشحن"
                    disabled={isLoading}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8">
              <div className="flex justify-center items-center space-x-4 space-x-reverse">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1 || isLoading}
                  className="px-5 py-3 bg-gradient-to-r from-[#8B7355] to-[#A67C52] text-white rounded-xl hover:from-[#6B5644] hover:to-[#8B6644] disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all shadow-md"
                  style={{ fontFamily: 'Tajawal, sans-serif' }}
                >
                  السابق
                </button>
                <div className="flex items-center gap-2">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        disabled={isLoading}
                        className={`px-4 py-3 rounded-xl text-sm font-bold transition-all shadow-md ${
                          currentPage === pageNum
                            ? 'bg-gradient-to-r from-[#8B7355] to-[#A67C52] text-white'
                            : 'bg-white border-2 border-[#E5DCC5] hover:border-[#C4A57B] text-[#8B7355]'
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
                  className="px-5 py-3 bg-gradient-to-r from-[#8B7355] to-[#A67C52] text-white rounded-xl hover:from-[#6B5644] hover:to-[#8B6644] disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all shadow-md"
                  style={{ fontFamily: 'Tajawal, sans-serif' }}
                >
                  التالي
                </button>
              </div>
              <div className="text-center text-sm text-[#8B7355]/70 mt-4 font-medium" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                عرض {((currentPage - 1) * pageSize) + 1} إلى {Math.min(currentPage * pageSize, totalItems)} من {totalItems} محافظة
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ShippingManagement;
