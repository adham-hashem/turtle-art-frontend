import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit, Trash2, Plus, AlertCircle, RefreshCw, Tag, Sparkles, Calendar, DollarSign, TrendingUp, X, Check } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

// Interface for DiscountCode based on backend DTOs
interface DiscountCode {
  id: string;
  code: string;
  type: 'Percentage' | 'Fixed';
  percentageValue: number | null;
  fixedValue: number | null;
  minOrderAmount: number | null;
  maxDiscountAmount: number | null;
  usageLimit: number | null;
  startDate: string;
  endDate: string;
  isActive: boolean;
  usageCount: number;
  createdAt: string;
}

interface PaginatedDiscountCodesResponse {
  items: DiscountCode[];
  totalItems: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

const DiscountCodesManagement: React.FC = () => {
  const { isAuthenticated, userRole } = useAuth();
  const navigate = useNavigate();
  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([]);
  const [newDiscountCode, setNewDiscountCode] = useState({
    code: '',
    type: 'Percentage' as 'Percentage' | 'Fixed',
    percentageValue: '',
    fixedValue: '',
    minOrderAmount: '',
    maxDiscountAmount: '',
    usageLimit: '',
    startDate: '',
    endDate: '',
    isActive: true,
  });
  const [editingDiscountCode, setEditingDiscountCode] = useState<DiscountCode | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const pageSize = 10;

  const apiUrl = import.meta.env.VITE_API_BASE_URL;

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

    fetchDiscountCodes(currentPage);
  }, [isAuthenticated, userRole, navigate, currentPage]);

  // Fetch discount codes from backend
  const fetchDiscountCodes = async (page: number = 1) => {
    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        navigate('/login');
        throw new Error('لا يوجد رمز مصادقة. يرجى تسجيل الدخول مرة أخرى.');
      }

      const response = await fetch(
        `${apiUrl}/api/discount-codes?pageNumber=${page}&pageSize=${pageSize}`,
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
        throw new Error(`فشل في جلب أكواد الخصم: ${response.status} ${responseText}`);
      }

      const data: PaginatedDiscountCodesResponse = JSON.parse(responseText);
      setDiscountCodes(data.items);
      setTotalPages(data.totalPages);
      setTotalItems(data.totalItems);
      setCurrentPage(data.pageNumber);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل في جلب أكواد الخصم');
    } finally {
      setIsLoading(false);
    }
  };

  // Validate discount code inputs
  const validateDiscountCode = () => {
    if (!newDiscountCode.code) return 'كود الخصم مطلوب';
    if (!newDiscountCode.startDate) return 'تاريخ البدء مطلوب';
    if (!newDiscountCode.endDate) return 'تاريخ الانتهاء مطلوب';
    if (newDiscountCode.type === 'Percentage' && !newDiscountCode.percentageValue) {
      return 'نسبة الخصم مطلوبة لنوع الخصم المئوي';
    }
    if (newDiscountCode.type === 'Fixed' && !newDiscountCode.fixedValue) {
      return 'القيمة الثابتة مطلوبة لنوع الخصم الثابت';
    }
    if (newDiscountCode.percentageValue && isNaN(parseFloat(newDiscountCode.percentageValue))) {
      return 'نسبة الخصم يجب أن تكون رقمًا صحيحًا';
    }
    if (newDiscountCode.fixedValue && isNaN(parseFloat(newDiscountCode.fixedValue))) {
      return 'القيمة الثابتة يجب أن تكون رقمًا صحيحًا';
    }
    if (newDiscountCode.minOrderAmount && isNaN(parseFloat(newDiscountCode.minOrderAmount))) {
      return 'الحد الأدنى للطلب يجب أن يكون رقمًا صحيحًا';
    }
    if (newDiscountCode.maxDiscountAmount && isNaN(parseFloat(newDiscountCode.maxDiscountAmount))) {
      return 'الحد الأقصى للخصم يجب أن تكون رقمًا صحيحًا';
    }
    if (newDiscountCode.usageLimit && isNaN(parseInt(newDiscountCode.usageLimit))) {
      return 'حد الاستخدام يجب أن يكون رقمًا صحيحًا';
    }
    const startDate = new Date(newDiscountCode.startDate);
    const endDate = new Date(newDiscountCode.endDate);
    if (startDate >= endDate) {
      return 'تاريخ البدء يجب أن يكون قبل تاريخ الانتهاء';
    }
    return null;
  };

  // Add discount code
  const handleAddDiscountCode = async () => {
    if (isLoading) return;

    const validationError = validateDiscountCode();
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
        code: newDiscountCode.code,
        type: newDiscountCode.type,
        percentageValue: newDiscountCode.percentageValue ? parseFloat(newDiscountCode.percentageValue) : null,
        fixedValue: newDiscountCode.fixedValue ? parseFloat(newDiscountCode.fixedValue) : null,
        minOrderAmount: newDiscountCode.minOrderAmount ? parseFloat(newDiscountCode.minOrderAmount) : null,
        maxDiscountAmount: newDiscountCode.maxDiscountAmount ? parseFloat(newDiscountCode.maxDiscountAmount) : null,
        usageLimit: newDiscountCode.usageLimit ? parseInt(newDiscountCode.usageLimit) : null,
        startDate: new Date(newDiscountCode.startDate).toISOString(),
        endDate: new Date(newDiscountCode.endDate).toISOString(),
        isActive: newDiscountCode.isActive,
      };

      const response = await fetch(`${apiUrl}/api/discount-codes`, {
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
          throw new Error('كود الخصم مستخدم بالفعل. يرجى استخدام كود مختلف.');
        }
        throw new Error(`فشل في إضافة كود الخصم: ${response.status} ${errorText}`);
      }

      await fetchDiscountCodes(currentPage);
      setNewDiscountCode({
        code: '',
        type: 'Percentage',
        percentageValue: '',
        fixedValue: '',
        minOrderAmount: '',
        maxDiscountAmount: '',
        usageLimit: '',
        startDate: '',
        endDate: '',
        isActive: true,
      });
      alert('تم إضافة كود الخصم بنجاح!');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'حدث خطأ أثناء إضافة كود الخصم');
    } finally {
      setIsLoading(false);
    }
  };

  // Update discount code
  const handleUpdateDiscountCode = async () => {
    if (isLoading || !editingDiscountCode) return;

    const validationError = validateDiscountCode();
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
        code: newDiscountCode.code,
        type: newDiscountCode.type,
        percentageValue: newDiscountCode.percentageValue ? parseFloat(newDiscountCode.percentageValue) : null,
        fixedValue: newDiscountCode.fixedValue ? parseFloat(newDiscountCode.fixedValue) : null,
        minOrderAmount: newDiscountCode.minOrderAmount ? parseFloat(newDiscountCode.minOrderAmount) : null,
        maxDiscountAmount: newDiscountCode.maxDiscountAmount ? parseFloat(newDiscountCode.maxDiscountAmount) : null,
        usageLimit: newDiscountCode.usageLimit ? parseInt(newDiscountCode.usageLimit) : null,
        startDate: new Date(newDiscountCode.startDate).toISOString(),
        endDate: new Date(newDiscountCode.endDate).toISOString(),
        isActive: newDiscountCode.isActive,
      };

      const response = await fetch(`${apiUrl}/api/discount-codes/${editingDiscountCode.id}`, {
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
          throw new Error('كود الخصم غير موجود.');
        } else if (response.status === 400 && errorText.includes('already exists')) {
          throw new Error('كود الخصم مستخدم بالفعل. يرجى استخدام كود مختلف.');
        }
        throw new Error(`فشل في تحديث كود الخصم: ${response.status} ${errorText}`);
      }

      await fetchDiscountCodes(currentPage);
      setEditingDiscountCode(null);
      setNewDiscountCode({
        code: '',
        type: 'Percentage',
        percentageValue: '',
        fixedValue: '',
        minOrderAmount: '',
        maxDiscountAmount: '',
        usageLimit: '',
        startDate: '',
        endDate: '',
        isActive: true,
      });
      alert('تم تحديث كود الخصم بنجاح!');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'حدث خطأ أثناء تحديث كود الخصم');
    } finally {
      setIsLoading(false);
    }
  };

  // Delete discount code
  const handleDeleteDiscountCode = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف كود الخصم هذا؟')) {
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
      const response = await fetch(`${apiUrl}/api/discount-codes/${id}`, {
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
          throw new Error('كود الخصم غير موجود.');
        }
        throw new Error(`فشل في حذف كود الخصم: ${response.status} ${errorText}`);
      }

      await fetchDiscountCodes(currentPage);
      alert('تم حذف كود الخصم بنجاح!');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'حدث خطأ أثناء حذف كود الخصم');
    } finally {
      setIsLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      setCurrentPage(page);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-[#F5F5DC] to-[#E5DCC5] p-3 rounded-xl border-2 border-[#E5DCC5]">
            <Tag className="h-6 w-6 text-[#8B7355]" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[#8B7355]" style={{ fontFamily: 'Tajawal, sans-serif' }}>إدارة أكواد الخصم</h2>
            <p className="text-sm text-[#C4A57B]" style={{ fontFamily: 'Tajawal, sans-serif' }}>إجمالي الأكواد: {totalItems}</p>
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
            onClick={() => fetchDiscountCodes(currentPage)}
            className="mr-auto bg-red-100 hover:bg-red-200 px-4 py-2 rounded-xl text-sm text-red-800 flex items-center font-semibold transition-all"
            style={{ fontFamily: 'Tajawal, sans-serif' }}
            disabled={isLoading}
          >
            <RefreshCw className="h-4 w-4 ml-1" />
            إعادة المحاولة
          </button>
        </div>
      )}

      {/* Add/Edit Discount Code Form */}
      <div className="mb-8 p-6 bg-gradient-to-br from-white to-[#FAF9F6] rounded-2xl shadow-xl border-2 border-[#E5DCC5]">
        <div className="flex items-center gap-2 mb-6">
          <div className="bg-[#F5F5DC] p-2 rounded-lg border border-[#E5DCC5]">
            {editingDiscountCode ? <Edit className="h-5 w-5 text-[#8B7355]" /> : <Plus className="h-5 w-5 text-[#8B7355]" />}
          </div>
          <h3 className="text-xl font-bold text-[#8B7355]" style={{ fontFamily: 'Tajawal, sans-serif' }}>
            {editingDiscountCode ? 'تعديل كود الخصم' : 'إضافة كود خصم جديد'}
          </h3>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-[#8B7355] mb-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
              <Tag className="h-4 w-4 inline ml-1" />
              كود الخصم <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newDiscountCode.code}
              onChange={(e) => setNewDiscountCode((prev) => ({ ...prev, code: e.target.value }))}
              className="w-full px-4 py-3 border-2 border-[#E5DCC5] rounded-xl focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] text-right transition-all text-[#8B7355]"
              style={{ fontFamily: 'Tajawal, sans-serif' }}
              dir="rtl"
              disabled={isLoading}
              placeholder="مثال: SUMMER25"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#8B7355] mb-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
              نوع الخصم <span className="text-red-500">*</span>
            </label>
            <select
              value={newDiscountCode.type}
              onChange={(e) => setNewDiscountCode((prev) => ({ ...prev, type: e.target.value as 'Percentage' | 'Fixed' }))}
              className="w-full px-4 py-3 border-2 border-[#E5DCC5] rounded-xl focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] text-right transition-all text-[#8B7355]"
              style={{ fontFamily: 'Tajawal, sans-serif' }}
              dir="rtl"
              disabled={isLoading}
            >
              <option value="Percentage">مئوي (%)</option>
              <option value="Fixed">ثابت (جنيه)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#8B7355] mb-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
              <DollarSign className="h-4 w-4 inline ml-1" />
              {newDiscountCode.type === 'Percentage' ? 'نسبة الخصم (%) *' : 'القيمة الثابتة (جنيه) *'}
            </label>
            <input
              type="number"
              value={newDiscountCode.type === 'Percentage' ? newDiscountCode.percentageValue : newDiscountCode.fixedValue}
              onChange={(e) =>
                setNewDiscountCode((prev) => ({
                  ...prev,
                  [newDiscountCode.type === 'Percentage' ? 'percentageValue' : 'fixedValue']: e.target.value,
                }))
              }
              className="w-full px-4 py-3 border-2 border-[#E5DCC5] rounded-xl focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] text-right transition-all text-[#8B7355]"
              style={{ fontFamily: 'Tajawal, sans-serif' }}
              dir="rtl"
              disabled={isLoading}
              placeholder={newDiscountCode.type === 'Percentage' ? 'مثال: 25' : 'مثال: 50'}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#8B7355] mb-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
              الحد الأدنى للطلب (جنيه)
            </label>
            <input
              type="number"
              value={newDiscountCode.minOrderAmount}
              onChange={(e) => setNewDiscountCode((prev) => ({ ...prev, minOrderAmount: e.target.value }))}
              className="w-full px-4 py-3 border-2 border-[#E5DCC5] rounded-xl focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] text-right transition-all text-[#8B7355]"
              style={{ fontFamily: 'Tajawal, sans-serif' }}
              dir="rtl"
              disabled={isLoading}
              placeholder="مثال: 100"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#8B7355] mb-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
              الحد الأقصى للخصم (جنيه)
            </label>
            <input
              type="number"
              value={newDiscountCode.maxDiscountAmount}
              onChange={(e) => setNewDiscountCode((prev) => ({ ...prev, maxDiscountAmount: e.target.value }))}
              className="w-full px-4 py-3 border-2 border-[#E5DCC5] rounded-xl focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] text-right transition-all text-[#8B7355]"
              style={{ fontFamily: 'Tajawal, sans-serif' }}
              dir="rtl"
              disabled={isLoading}
              placeholder="مثال: 200"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#8B7355] mb-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
              <TrendingUp className="h-4 w-4 inline ml-1" />
              حد الاستخدام
            </label>
            <input
              type="number"
              value={newDiscountCode.usageLimit}
              onChange={(e) => setNewDiscountCode((prev) => ({ ...prev, usageLimit: e.target.value }))}
              className="w-full px-4 py-3 border-2 border-[#E5DCC5] rounded-xl focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] text-right transition-all text-[#8B7355]"
              style={{ fontFamily: 'Tajawal, sans-serif' }}
              dir="rtl"
              disabled={isLoading}
              placeholder="مثال: 100"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#8B7355] mb-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
              <Calendar className="h-4 w-4 inline ml-1" />
              تاريخ البدء <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={newDiscountCode.startDate}
              onChange={(e) => setNewDiscountCode((prev) => ({ ...prev, startDate: e.target.value }))}
              className="w-full px-4 py-3 border-2 border-[#E5DCC5] rounded-xl focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-all text-[#8B7355]"
              style={{ fontFamily: 'Tajawal, sans-serif' }}
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#8B7355] mb-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
              <Calendar className="h-4 w-4 inline ml-1" />
              تاريخ الانتهاء <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={newDiscountCode.endDate}
              onChange={(e) => setNewDiscountCode((prev) => ({ ...prev, endDate: e.target.value }))}
              className="w-full px-4 py-3 border-2 border-[#E5DCC5] rounded-xl focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-all text-[#8B7355]"
              style={{ fontFamily: 'Tajawal, sans-serif' }}
              disabled={isLoading}
            />
          </div>

          <div className="flex items-center md:col-span-2">
            <label className="flex items-center space-x-reverse space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={newDiscountCode.isActive}
                onChange={(e) => setNewDiscountCode((prev) => ({ ...prev, isActive: e.target.checked }))}
                className="w-5 h-5 text-[#8B7355] rounded focus:ring-[#D4AF37] border-2 border-[#E5DCC5]"
                disabled={isLoading}
              />
              <span className="text-sm font-semibold text-[#8B7355]" style={{ fontFamily: 'Tajawal, sans-serif' }}>مفعّل ✓</span>
            </label>
          </div>
        </div>

        <div className="flex space-x-reverse space-x-4 mt-6">
          <button
            onClick={editingDiscountCode ? handleUpdateDiscountCode : handleAddDiscountCode}
            className="bg-gradient-to-r from-[#8B7355] to-[#A67C52] text-white px-8 py-3 rounded-xl hover:from-[#6B5644] hover:to-[#8B6644] transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg"
            style={{ fontFamily: 'Tajawal, sans-serif' }}
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center">
                <RefreshCw className="animate-spin h-4 w-4 ml-2" />
                جاري المعالجة...
              </div>
            ) : editingDiscountCode ? (
              <div className="flex items-center">
                <Check className="h-4 w-4 ml-2" />
                تحديث كود الخصم
              </div>
            ) : (
              <div className="flex items-center">
                <Plus className="h-4 w-4 ml-2" />
                إضافة كود الخصم
              </div>
            )}
          </button>
          {(editingDiscountCode || newDiscountCode.code || newDiscountCode.percentageValue || newDiscountCode.fixedValue || newDiscountCode.startDate || newDiscountCode.endDate) && (
            <button
              onClick={() => {
                setEditingDiscountCode(null);
                setNewDiscountCode({
                  code: '',
                  type: 'Percentage',
                  percentageValue: '',
                  fixedValue: '',
                  minOrderAmount: '',
                  maxDiscountAmount: '',
                  usageLimit: '',
                  startDate: '',
                  endDate: '',
                  isActive: true,
                });
              }}
              className="bg-gray-300 text-gray-700 px-8 py-3 rounded-xl hover:bg-gray-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              style={{ fontFamily: 'Tajawal, sans-serif' }}
              disabled={isLoading}
            >
              <X className="h-4 w-4 inline ml-2" />
              إلغاء
            </button>
          )}
        </div>
      </div>

      {/* Discount Codes List */}
      {isLoading && discountCodes.length === 0 ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B7355]"></div>
          <span className="mr-3 text-[#8B7355] font-medium" style={{ fontFamily: 'Tajawal, sans-serif' }}>جاري تحميل أكواد الخصم...</span>
        </div>
      ) : discountCodes.length === 0 ? (
        <div className="text-center py-16 bg-gradient-to-br from-white to-[#FAF9F6] rounded-2xl shadow-xl border-2 border-[#E5DCC5]">
          <div className="text-7xl mb-4">🎫</div>
          <p className="text-xl font-bold text-[#8B7355] mb-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>لا توجد أكواد خصم</p>
          <p className="text-[#8B7355]/70 mb-6" style={{ fontFamily: 'Tajawal, sans-serif' }}>ابدأ بإضافة أول كود خصم لعملائك</p>
          <button
            onClick={() => fetchDiscountCodes(currentPage)}
            className="bg-gradient-to-r from-[#8B7355] to-[#A67C52] text-white px-6 py-3 rounded-xl hover:from-[#6B5644] hover:to-[#8B6644] transition-all flex items-center mx-auto font-semibold shadow-lg"
            style={{ fontFamily: 'Tajawal, sans-serif' }}
            disabled={isLoading}
          >
            <RefreshCw className="h-4 w-4 ml-2" />
            إعادة التحميل
          </button>
        </div>
      ) : (
        <div className="bg-gradient-to-br from-white to-[#FAF9F6] rounded-2xl shadow-xl p-6 border-2 border-[#E5DCC5]">
          <div className="flex items-center gap-2 mb-6">
            <Tag className="h-5 w-5 text-[#8B7355]" />
            <h4 className="text-lg font-bold text-[#8B7355]" style={{ fontFamily: 'Tajawal, sans-serif' }}>أكواد الخصم المتاحة</h4>
          </div>

          <div className="space-y-4">
            {discountCodes.map((discountCode) => (
              <div
                key={discountCode.id}
                className="flex flex-col md:flex-row md:items-center justify-between p-5 border-2 border-[#E5DCC5] rounded-2xl bg-white hover:bg-[#FAF9F6] transition-all shadow-md hover:shadow-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-gradient-to-br from-[#F5F5DC] to-[#E5DCC5] px-4 py-2 rounded-xl border border-[#E5DCC5]">
                      <p className="font-bold text-[#8B7355] text-lg" style={{ fontFamily: 'Tajawal, sans-serif' }}>{discountCode.code}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      discountCode.isActive 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`} style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      {discountCode.isActive ? '✓ مفعّل' : '✗ غير مفعّل'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-[#8B7355]/70" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    <p className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4 text-[#D4AF37]" />
                      <span className="font-medium">النوع:</span> {discountCode.type === 'Percentage' ? 'مئوي' : 'ثابت'} |{' '}
                      {discountCode.type === 'Percentage'
                        ? `${discountCode.percentageValue}%`
                        : `${discountCode.fixedValue} جنيه`}
                    </p>
                    <p className="flex items-center gap-1">
                      <TrendingUp className="h-4 w-4 text-[#D4AF37]" />
                      <span className="font-medium">الاستخدامات:</span> {discountCode.usageCount} / {discountCode.usageLimit || '∞'}
                    </p>
                    <p className="flex items-center gap-1">
                      <span className="font-medium">الحد الأدنى:</span> {discountCode.minOrderAmount ? `${discountCode.minOrderAmount} جنيه` : 'غير محدد'}
                    </p>
                    <p className="flex items-center gap-1">
                      <span className="font-medium">الحد الأقصى:</span> {discountCode.maxDiscountAmount ? `${discountCode.maxDiscountAmount} جنيه` : 'غير محدد'}
                    </p>
                    <p className="flex items-center gap-1 md:col-span-2">
                      <Calendar className="h-4 w-4 text-[#D4AF37]" />
                      <span className="font-medium">الفترة:</span> {formatDate(discountCode.startDate)} → {formatDate(discountCode.endDate)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-reverse space-x-2 mt-4 md:mt-0 md:mr-4">
                  <button
                    onClick={() => {
                      setEditingDiscountCode(discountCode);
                      setNewDiscountCode({
                        code: discountCode.code,
                        type: discountCode.type,
                        percentageValue: discountCode.percentageValue?.toString() || '',
                        fixedValue: discountCode.fixedValue?.toString() || '',
                        minOrderAmount: discountCode.minOrderAmount?.toString() || '',
                        maxDiscountAmount: discountCode.maxDiscountAmount?.toString() || '',
                        usageLimit: discountCode.usageLimit?.toString() || '',
                        startDate: discountCode.startDate.split('T')[0],
                        endDate: discountCode.endDate.split('T')[0],
                        isActive: discountCode.isActive,
                      });
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="text-blue-600 hover:text-blue-700 p-3 disabled:opacity-50 hover:bg-blue-50 rounded-xl transition-all"
                    title="تعديل كود الخصم"
                    disabled={isLoading}
                  >
                    <Edit size={20} />
                  </button>
                  <button
                    onClick={() => handleDeleteDiscountCode(discountCode.id)}
                    className="text-red-600 hover:text-red-700 p-3 disabled:opacity-50 hover:bg-red-50 rounded-xl transition-all"
                    title="حذف كود الخصم"
                    disabled={isLoading}
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center mt-8 space-x-reverse space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1 || isLoading}
                className="px-5 py-3 bg-gradient-to-r from-[#8B7355] to-[#A67C52] text-white rounded-xl hover:from-[#6B5644] hover:to-[#8B6644] disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all shadow-md"
                style={{ fontFamily: 'Tajawal, sans-serif' }}
              >
                السابق
              </button>
              <div className="flex items-center space-x-reverse space-x-1">
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
                      className={`px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                        currentPage === pageNum
                          ? 'bg-gradient-to-r from-[#8B7355] to-[#A67C52] text-white shadow-lg'
                          : 'bg-white text-[#8B7355] border-2 border-[#E5DCC5] hover:bg-[#FAF9F6]'
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
          )}
          <div className="text-center text-sm text-[#8B7355] font-medium mt-4" style={{ fontFamily: 'Tajawal, sans-serif' }}>
            عرض {((currentPage - 1) * pageSize) + 1} إلى {Math.min(currentPage * pageSize, totalItems)} من {totalItems} كود خصم
          </div>
        </div>
      )}
    </div>
  );
};

export default DiscountCodesManagement;
