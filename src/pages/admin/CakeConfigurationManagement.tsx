import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Edit,
  Trash2,
  Plus,
  AlertCircle,
  RefreshCw,
  Cake,
  Sparkles,
  Calendar,
  Ruler,
  Cookie,
  DollarSign,
  Save,
  X,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

// Interfaces
interface CakeOccasion {
  id: string;
  nameAr: string;
  name: string;
  icon: string;
  isActive: boolean;
  createdAt: string;
}

interface CakeSize {
  id: string;
  nameAr: string;
  name: string;
  personsCount: string;
  personsCountAr: string;
  isActive: boolean;
  createdAt: string;
}

interface CakeFlavor {
  id: string;
  nameAr: string;
  name: string;
  color: string;
  additionalPrice: number;
  isActive: boolean;
  createdAt: string;
}

interface OccasionSize {
  occasionId: string;
  sizeId: string;
  sizeName: string;
  price: number;
  isActive: boolean;
}

type TabType = 'occasions' | 'sizes' | 'flavors' | 'pricing';

type PricingFormState = Record<string, { price: string; isActive: boolean }>;

function normalizeArrayResponse<T>(
  payload: unknown,
  keysToTry: string[] = ['data', 'items', 'result']
): T[] {
  if (Array.isArray(payload)) return payload as T[];

  if (payload && typeof payload === 'object') {
    const obj = payload as Record<string, unknown>;

    for (const k of keysToTry) {
      const v = obj[k];
      if (Array.isArray(v)) return v as T[];
    }

    // Sometimes API returns { data: { items: [...] } } etc.
    const data = obj['data'];
    if (data && typeof data === 'object') {
      const dataObj = data as Record<string, unknown>;
      for (const k of keysToTry) {
        const v = dataObj[k];
        if (Array.isArray(v)) return v as T[];
      }
    }
  }

  return [];
}

const CakeConfigurationManagement: React.FC = () => {
  const { isAuthenticated, userRole } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<TabType>('occasions');

  // Lists (must always be arrays)
  const [occasions, setOccasions] = useState<CakeOccasion[]>([]);
  const [sizes, setSizes] = useState<CakeSize[]>([]);
  const [flavors, setFlavors] = useState<CakeFlavor[]>([]);
  const [occasionSizes, setOccasionSizes] = useState<OccasionSize[]>([]);

  // Forms/editing
  const [editingOccasion, setEditingOccasion] = useState<CakeOccasion | null>(null);
  const [occasionForm, setOccasionForm] = useState({
    nameAr: '',
    name: '',
    icon: '',
    isActive: true,
  });

  const [editingSize, setEditingSize] = useState<CakeSize | null>(null);
  const [sizeForm, setSizeForm] = useState({
    nameAr: '',
    name: '',
    personsCount: '',
    personsCountAr: '',
    isActive: true,
  });

  const [editingFlavor, setEditingFlavor] = useState<CakeFlavor | null>(null);
  const [flavorForm, setFlavorForm] = useState({
    nameAr: '',
    name: '',
    color: '#FCD34D',
    additionalPrice: '',
    isActive: true,
  });

  // Pricing
  const [selectedOccasionForPricing, setSelectedOccasionForPricing] = useState('');
  const [pricingForm, setPricingForm] = useState<PricingFormState>({});

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [includeInactive, setIncludeInactive] = useState(false);

  const apiUrl = import.meta.env.VITE_API_BASE_URL as string;

  const iconOptions = useMemo(
    () => ['🎂', '💒', '💍', '🎓', '👶', '🏆', '❤️', '🎉', '🎈', '🎁', '⭐', '✨'],
    []
  );

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (userRole !== 'admin') {
      navigate('/');
      return;
    }
    void fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, userRole, navigate, activeTab, includeInactive]);

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

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const fetchData = async () => {
    switch (activeTab) {
      case 'occasions':
        await fetchOccasions();
        break;
      case 'sizes':
        await fetchSizes();
        break;
      case 'flavors':
        await fetchFlavors();
        break;
      case 'pricing':
        await fetchOccasions();
        await fetchSizes();
        break;
    }
  };

  // ========== OCCASIONS ==========
  const fetchOccasions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${apiUrl}/api/CakeConfiguration/occasions?includeInactive=${includeInactive}`,
        { headers: getAuthHeaders() }
      );
      if (!res.ok) throw new Error('فشل في جلب المناسبات');

      const payload = await res.json();
      const list = normalizeArrayResponse<CakeOccasion>(payload, ['data', 'occasions', 'items', 'result']);
      setOccasions(list);
      if (list.length === 0 && !Array.isArray(payload)) {
        // Keep an error message only if response shape is unexpected
        // (Optional) setError('تنسيق البيانات غير صحيح');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'فشل في جلب المناسبات');
      setOccasions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const resetOccasionForm = () => {
    setEditingOccasion(null);
    setOccasionForm({ nameAr: '', name: '', icon: '', isActive: true });
  };

  const handleSaveOccasion = async () => {
    if (!occasionForm.nameAr || !occasionForm.name || !occasionForm.icon) {
      alert('جميع الحقول مطلوبة');
      return;
    }

    setIsLoading(true);
    try {
      const url = editingOccasion
        ? `${apiUrl}/api/CakeConfiguration/occasions/${editingOccasion.id}`
        : `${apiUrl}/api/CakeConfiguration/occasions`;

      const res = await fetch(url, {
        method: editingOccasion ? 'PUT' : 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          nameAr: occasionForm.nameAr,
          name: occasionForm.name,
          icon: occasionForm.icon,
          isActive: occasionForm.isActive,
        }),
      });

      if (!res.ok) throw new Error('فشل في حفظ المناسبة');
      await fetchOccasions();
      resetOccasionForm();
      alert(editingOccasion ? 'تم تحديث المناسبة بنجاح!' : 'تم إضافة المناسبة بنجاح!');
    } catch (e) {
      alert(e instanceof Error ? e.message : 'حدث خطأ أثناء حفظ المناسبة');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteOccasion = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه المناسبة؟')) return;

    setIsLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/CakeConfiguration/occasions/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('فشل في حذف المناسبة');

      await fetchOccasions();
      alert('تم حذف المناسبة بنجاح!');
    } catch (e) {
      alert(e instanceof Error ? e.message : 'حدث خطأ أثناء حذف المناسبة');
    } finally {
      setIsLoading(false);
    }
  };

  // ========== SIZES ==========
  const fetchSizes = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${apiUrl}/api/CakeConfiguration/sizes?includeInactive=${includeInactive}`,
        { headers: getAuthHeaders() }
      );
      if (!res.ok) throw new Error('فشل في جلب الأحجام');

      const payload = await res.json();
      const list = normalizeArrayResponse<CakeSize>(payload, ['data', 'sizes', 'items', 'result']);
      setSizes(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'فشل في جلب الأحجام');
      setSizes([]);
    } finally {
      setIsLoading(false);
    }
  };

  const resetSizeForm = () => {
    setEditingSize(null);
    setSizeForm({
      nameAr: '',
      name: '',
      personsCount: '',
      personsCountAr: '',
      isActive: true,
    });
  };

  const handleSaveSize = async () => {
    if (!sizeForm.nameAr || !sizeForm.name || !sizeForm.personsCount || !sizeForm.personsCountAr) {
      alert('جميع الحقول مطلوبة');
      return;
    }

    setIsLoading(true);
    try {
      const url = editingSize
        ? `${apiUrl}/api/CakeConfiguration/sizes/${editingSize.id}`
        : `${apiUrl}/api/CakeConfiguration/sizes`;

      const res = await fetch(url, {
        method: editingSize ? 'PUT' : 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          nameAr: sizeForm.nameAr,
          name: sizeForm.name,
          personsCount: sizeForm.personsCount,
          personsCountAr: sizeForm.personsCountAr,
          isActive: sizeForm.isActive,
        }),
      });

      if (!res.ok) throw new Error('فشل في حفظ الحجم');
      await fetchSizes();
      resetSizeForm();
      alert(editingSize ? 'تم تحديث الحجم بنجاح!' : 'تم إضافة الحجم بنجاح!');
    } catch (e) {
      alert(e instanceof Error ? e.message : 'حدث خطأ أثناء حفظ الحجم');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSize = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الحجم؟')) return;

    setIsLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/CakeConfiguration/sizes/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('فشل في حذف الحجم');

      await fetchSizes();
      alert('تم حذف الحجم بنجاح!');
    } catch (e) {
      alert(e instanceof Error ? e.message : 'حدث خطأ أثناء حذف الحجم');
    } finally {
      setIsLoading(false);
    }
  };

  // ========== FLAVORS ==========
  const fetchFlavors = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${apiUrl}/api/CakeConfiguration/flavors?includeInactive=${includeInactive}`,
        { headers: getAuthHeaders() }
      );
      if (!res.ok) throw new Error('فشل في جلب النكهات');

      const payload = await res.json();
      const list = normalizeArrayResponse<CakeFlavor>(payload, ['data', 'flavors', 'items', 'result']);
      setFlavors(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'فشل في جلب النكهات');
      setFlavors([]);
    } finally {
      setIsLoading(false);
    }
  };

  const resetFlavorForm = () => {
    setEditingFlavor(null);
    setFlavorForm({
      nameAr: '',
      name: '',
      color: '#FCD34D',
      additionalPrice: '',
      isActive: true,
    });
  };

  const handleSaveFlavor = async () => {
    if (!flavorForm.nameAr || !flavorForm.name) {
      alert('الاسم بالعربية والإنجليزية مطلوب');
      return;
    }

    setIsLoading(true);
    try {
      const url = editingFlavor
        ? `${apiUrl}/api/CakeConfiguration/flavors/${editingFlavor.id}`
        : `${apiUrl}/api/CakeConfiguration/flavors`;

      const body = {
        nameAr: flavorForm.nameAr,
        name: flavorForm.name,
        color: flavorForm.color,
        additionalPrice: parseFloat(flavorForm.additionalPrice) || 0,
        isActive: flavorForm.isActive,
      };

      const res = await fetch(url, {
        method: editingFlavor ? 'PUT' : 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error('فشل في حفظ النكهة');
      await fetchFlavors();
      resetFlavorForm();
      alert(editingFlavor ? 'تم تحديث النكهة بنجاح!' : 'تم إضافة النكهة بنجاح!');
    } catch (e) {
      alert(e instanceof Error ? e.message : 'حدث خطأ أثناء حفظ النكهة');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteFlavor = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه النكهة؟')) return;

    setIsLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/CakeConfiguration/flavors/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('فشل في حذف النكهة');

      await fetchFlavors();
      alert('تم حذف النكهة بنجاح!');
    } catch (e) {
      alert(e instanceof Error ? e.message : 'حدث خطأ أثناء حذف النكهة');
    } finally {
      setIsLoading(false);
    }
  };

  // ========== PRICING ==========
  const fetchOccasionSizes = async (occasionId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiUrl}/api/CakeConfiguration/occasions/${occasionId}/sizes`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('فشل في جلب الأسعار');

      const payload = await res.json();
      const list = normalizeArrayResponse<OccasionSize>(payload, ['data', 'sizes', 'items', 'result']);
      setOccasionSizes(list);

      // Initialize pricing form from sizes list + existing pricing list
      const initial: PricingFormState = {};
      (Array.isArray(sizes) ? sizes : []).forEach((s) => {
        const existing = list.find((os) => os.sizeId === s.id);
        initial[s.id] = {
          price: existing ? String(existing.price) : '',
          isActive: existing ? existing.isActive : true,
        };
      });
      setPricingForm(initial);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'فشل في جلب الأسعار');
      setOccasionSizes([]);
      setPricingForm({});
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePricing = async () => {
    if (!selectedOccasionForPricing) {
      alert('يرجى اختيار مناسبة');
      return;
    }

    setIsLoading(true);
    try {
      const payload = (Array.isArray(sizes) ? sizes : [])
        .map((s) => ({
          sizeId: s.id,
          price: parseFloat(pricingForm[s.id]?.price || '0'),
          isActive: pricingForm[s.id]?.isActive ?? true,
        }))
        .filter((x) => x.price > 0);

      const res = await fetch(
        `${apiUrl}/api/CakeConfiguration/occasions/${selectedOccasionForPricing}/sizes`,
        {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) throw new Error('فشل في حفظ الأسعار');
      await fetchOccasionSizes(selectedOccasionForPricing);
      alert('تم حفظ الأسعار بنجاح!');
    } catch (e) {
      alert(e instanceof Error ? e.message : 'حدث خطأ أثناء حفظ الأسعار');
    } finally {
      setIsLoading(false);
    }
  };

  // ================= RENDER =================
  return (
    <div className="p-3 sm:p-4 md:p-6 bg-gradient-to-b from-purple-50 via-pink-50 to-amber-50 min-h-screen">
      {/* Header */}
      <div className="mb-4 sm:mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="bg-gradient-to-br from-purple-100 to-pink-100 p-2 sm:p-3 rounded-xl">
            <Cake className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-purple-900">إعدادات التورتات</h2>
            <p className="text-xs sm:text-sm text-purple-600 hidden sm:block">
              إدارة المناسبات والأحجام والنكهات والأسعار
            </p>
          </div>
        </div>
        <Sparkles className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-amber-500 animate-pulse" />
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl sm:rounded-2xl p-3 sm:p-4 mb-4 sm:mb-6 flex items-start sm:items-center shadow-lg">
          <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 ml-2 flex-shrink-0 mt-0.5 sm:mt-0" />
          <span className="text-sm sm:text-base text-red-800 font-medium flex-1">{error}</span>
          <button
            onClick={() => void fetchData()}
            className="mr-auto bg-red-100 hover:bg-red-200 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm text-red-800 flex items-center font-semibold transition-all disabled:opacity-60"
            disabled={isLoading}
          >
            <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
            <span className="hidden sm:inline">إعادة المحاولة</span>
            <span className="sm:hidden">إعادة</span>
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-1 sm:p-2 mb-4 sm:mb-6 border-2 border-purple-100">
        <div className="grid grid-cols-2 sm:flex gap-1 sm:gap-2">
          <button
            onClick={() => setActiveTab('occasions')}
            className={`py-2 sm:py-3 px-2 sm:px-4 rounded-lg sm:rounded-xl font-bold transition-all flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm md:text-base ${
              activeTab === 'occasions'
                ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-md'
                : 'text-purple-700 hover:bg-purple-50'
            }`}
          >
            <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="hidden sm:inline">المناسبات</span>
            <span className="sm:hidden">مناسبات</span>
          </button>

          <button
            onClick={() => setActiveTab('sizes')}
            className={`py-2 sm:py-3 px-2 sm:px-4 rounded-lg sm:rounded-xl font-bold transition-all flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm md:text-base ${
              activeTab === 'sizes'
                ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-md'
                : 'text-purple-700 hover:bg-purple-50'
            }`}
          >
            <Ruler className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="hidden sm:inline">الأحجام</span>
            <span className="sm:hidden">أحجام</span>
          </button>

          <button
            onClick={() => setActiveTab('flavors')}
            className={`py-2 sm:py-3 px-2 sm:px-4 rounded-lg sm:rounded-xl font-bold transition-all flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm md:text-base ${
              activeTab === 'flavors'
                ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-md'
                : 'text-purple-700 hover:bg-purple-50'
            }`}
          >
            <Cookie className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="hidden sm:inline">النكهات</span>
            <span className="sm:hidden">نكهات</span>
          </button>

          <button
            onClick={() => setActiveTab('pricing')}
            className={`py-2 sm:py-3 px-2 sm:px-4 rounded-lg sm:rounded-xl font-bold transition-all flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm md:text-base ${
              activeTab === 'pricing'
                ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-md'
                : 'text-purple-700 hover:bg-purple-50'
            }`}
          >
            <DollarSign className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="hidden sm:inline">الأسعار</span>
            <span className="sm:hidden">أسعار</span>
          </button>
        </div>
      </div>

      {/* Include inactive toggle (not for pricing) */}
      {activeTab !== 'pricing' && (
        <div className="mb-4 sm:mb-6 flex items-center justify-end gap-2">
          <label className="flex items-center gap-1.5 sm:gap-2 cursor-pointer">
            <span className="text-xs sm:text-sm font-medium text-purple-900">عرض المحذوفات</span>
            <button
              type="button"
              onClick={() => setIncludeInactive((v) => !v)}
              className={`relative w-10 h-5 sm:w-12 sm:h-6 rounded-full transition-colors ${
                includeInactive ? 'bg-purple-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-0.5 sm:top-1 left-0.5 sm:left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  includeInactive ? 'translate-x-5 sm:translate-x-6' : ''
                }`}
              />
            </button>
          </label>
        </div>
      )}

      {/* OCCASIONS TAB */}
      {activeTab === 'occasions' && (
        <>
          <div className="mb-6 sm:mb-8 p-4 sm:p-6 bg-gradient-to-br from-white to-purple-50 rounded-xl sm:rounded-2xl shadow-xl border-2 border-purple-100">
            <h3 className="text-base sm:text-lg md:text-xl font-bold text-purple-900 mb-4 sm:mb-6 flex items-center gap-2">
              {editingOccasion ? <Edit className="h-4 w-4 sm:h-5 sm:w-5" /> : <Plus className="h-4 w-4 sm:h-5 sm:w-5" />}
              <span className="text-sm sm:text-base md:text-xl">
                {editingOccasion ? 'تعديل المناسبة' : 'إضافة مناسبة جديدة'}
              </span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-bold text-purple-900 mb-2">
                  الاسم بالعربية <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={occasionForm.nameAr}
                  onChange={(e) => setOccasionForm({ ...occasionForm, nameAr: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-purple-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-right text-sm sm:text-base"
                  dir="rtl"
                  placeholder="مثال: عيد ميلاد"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-purple-900 mb-2">
                  Name in English <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={occasionForm.name}
                  onChange={(e) => setOccasionForm({ ...occasionForm, name: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-purple-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base"
                  placeholder="e.g., Birthday"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs sm:text-sm font-bold text-purple-900 mb-2">
                  الأيقونة <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-6 sm:grid-cols-6 md:grid-cols-12 gap-1.5 sm:gap-2 mb-2">
                  {iconOptions.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setOccasionForm({ ...occasionForm, icon })}
                      className={`text-xl sm:text-2xl p-1.5 sm:p-2 rounded-lg sm:rounded-xl border-2 transition-all ${
                        occasionForm.icon === icon
                          ? 'border-purple-500 bg-purple-50 scale-110'
                          : 'border-purple-200 hover:border-purple-400 hover:bg-purple-50'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={occasionForm.icon}
                  onChange={(e) => setOccasionForm({ ...occasionForm, icon: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-purple-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-center text-xl sm:text-2xl"
                  placeholder="🎂"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-purple-900 mb-2">الحالة</label>
                <select
                  value={occasionForm.isActive ? 'true' : 'false'}
                  onChange={(e) => setOccasionForm({ ...occasionForm, isActive: e.target.value === 'true' })}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-purple-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-right font-medium text-sm sm:text-base"
                  dir="rtl"
                >
                  <option value="true">مفعّل</option>
                  <option value="false">غير مفعّل</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4 sm:mt-6">
              <button
                onClick={() => void handleSaveOccasion()}
                disabled={isLoading}
                className="bg-gradient-to-r from-purple-600 to-pink-500 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl hover:from-purple-700 hover:to-pink-600 transition-all font-semibold shadow-md flex items-center justify-center gap-2 disabled:opacity-50 text-sm sm:text-base"
              >
                <Save className="h-4 w-4" />
                {editingOccasion ? 'تحديث' : 'إضافة'}
              </button>

              {(editingOccasion || occasionForm.nameAr || occasionForm.name || occasionForm.icon) && (
                <button
                  onClick={resetOccasionForm}
                  disabled={isLoading}
                  className="bg-gray-200 text-gray-700 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl hover:bg-gray-300 transition-all font-semibold flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  <X className="h-4 w-4" />
                  إلغاء
                </button>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 border-2 border-purple-100">
            <h4 className="text-base sm:text-lg font-bold text-purple-900 mb-3 sm:mb-4 flex items-center gap-2">
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
              المناسبات المتاحة ({Array.isArray(occasions) ? occasions.length : 0})
            </h4>

            {!Array.isArray(occasions) || occasions.length === 0 ? (
              <p className="text-center text-gray-500 py-6 sm:py-8 text-sm sm:text-base">لا توجد مناسبات</p>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {occasions.map((o) => (
                  <div
                    key={o.id}
                    className="flex items-center justify-between p-3 sm:p-4 border-2 border-purple-100 rounded-lg sm:rounded-xl bg-gradient-to-r from-white to-purple-50 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-2 sm:gap-4 flex-1">
                      <span className="text-2xl sm:text-3xl">{o.icon}</span>
                      <div className="flex-1">
                        <p className="font-bold text-purple-900 text-sm sm:text-base">{o.nameAr}</p>
                        <p className="text-xs sm:text-sm text-gray-600">{o.name}</p>
                        <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-1">
                          <span
                            className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold ${
                              o.isActive
                                ? 'bg-green-100 text-green-800 border border-green-200'
                                : 'bg-gray-100 text-gray-800 border border-gray-200'
                            }`}
                          >
                            {o.isActive ? 'مفعّل' : 'غير مفعّل'}
                          </span>
                          <span className="text-[10px] sm:text-xs text-gray-500 hidden sm:inline">
                            {formatDate(o.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 sm:gap-2">
                      <button
                        onClick={() => {
                          setEditingOccasion(o);
                          setOccasionForm({
                            nameAr: o.nameAr,
                            name: o.name,
                            icon: o.icon,
                            isActive: o.isActive,
                          });
                        }}
                        className="text-blue-600 hover:text-blue-700 p-1.5 sm:p-2 hover:bg-blue-50 rounded-lg sm:rounded-xl transition-colors"
                        title="تعديل"
                        disabled={isLoading}
                      >
                        <Edit size={16} className="sm:hidden" />
                        <Edit size={18} className="hidden sm:block" />
                      </button>
                      <button
                        onClick={() => void handleDeleteOccasion(o.id)}
                        className="text-red-600 hover:text-red-700 p-1.5 sm:p-2 hover:bg-red-50 rounded-lg sm:rounded-xl transition-colors"
                        title="حذف"
                        disabled={isLoading}
                      >
                        <Trash2 size={16} className="sm:hidden" />
                        <Trash2 size={18} className="hidden sm:block" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* SIZES TAB */}
      {activeTab === 'sizes' && (
        <>
          <div className="mb-6 sm:mb-8 p-4 sm:p-6 bg-gradient-to-br from-white to-purple-50 rounded-xl sm:rounded-2xl shadow-xl border-2 border-purple-100">
            <h3 className="text-base sm:text-lg md:text-xl font-bold text-purple-900 mb-4 sm:mb-6 flex items-center gap-2">
              {editingSize ? <Edit className="h-4 w-4 sm:h-5 sm:w-5" /> : <Plus className="h-4 w-4 sm:h-5 sm:w-5" />}
              <span className="text-sm sm:text-base md:text-xl">{editingSize ? 'تعديل الحجم' : 'إضافة حجم جديد'}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-bold text-purple-900 mb-2">
                  الاسم بالعربية <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={sizeForm.nameAr}
                  onChange={(e) => setSizeForm({ ...sizeForm, nameAr: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-purple-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-right text-sm sm:text-base"
                  dir="rtl"
                  placeholder="مثال: صغير"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-purple-900 mb-2">
                  Name in English <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={sizeForm.name}
                  onChange={(e) => setSizeForm({ ...sizeForm, name: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-purple-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base"
                  placeholder="e.g., Small"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-purple-900 mb-2">
                  عدد الأشخاص (عربي) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={sizeForm.personsCountAr}
                  onChange={(e) => setSizeForm({ ...sizeForm, personsCountAr: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-purple-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-right text-sm sm:text-base"
                  dir="rtl"
                  placeholder="مثال: 2-4 أشخاص"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-purple-900 mb-2">
                  Servings (English) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={sizeForm.personsCount}
                  onChange={(e) => setSizeForm({ ...sizeForm, personsCount: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-purple-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base"
                  placeholder="e.g., 2-4 persons"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-purple-900 mb-2">الحالة</label>
                <select
                  value={sizeForm.isActive ? 'true' : 'false'}
                  onChange={(e) => setSizeForm({ ...sizeForm, isActive: e.target.value === 'true' })}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-purple-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-right font-medium text-sm sm:text-base"
                  dir="rtl"
                >
                  <option value="true">مفعّل</option>
                  <option value="false">غير مفعّل</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4 sm:mt-6">
              <button
                onClick={() => void handleSaveSize()}
                disabled={isLoading}
                className="bg-gradient-to-r from-purple-600 to-pink-500 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl hover:from-purple-700 hover:to-pink-600 transition-all font-semibold shadow-md flex items-center justify-center gap-2 disabled:opacity-50 text-sm sm:text-base"
              >
                <Save className="h-4 w-4" />
                {editingSize ? 'تحديث' : 'إضافة'}
              </button>

              {(editingSize ||
                sizeForm.nameAr ||
                sizeForm.name ||
                sizeForm.personsCount ||
                sizeForm.personsCountAr) && (
                <button
                  onClick={resetSizeForm}
                  disabled={isLoading}
                  className="bg-gray-200 text-gray-700 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl hover:bg-gray-300 transition-all font-semibold flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  <X className="h-4 w-4" />
                  إلغاء
                </button>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 border-2 border-purple-100">
            <h4 className="text-base sm:text-lg font-bold text-purple-900 mb-3 sm:mb-4 flex items-center gap-2">
              <Ruler className="h-4 w-4 sm:h-5 sm:w-5" />
              الأحجام المتاحة ({Array.isArray(sizes) ? sizes.length : 0})
            </h4>

            {!Array.isArray(sizes) || sizes.length === 0 ? (
              <p className="text-center text-gray-500 py-6 sm:py-8 text-sm sm:text-base">لا توجد أحجام</p>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {sizes.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between p-3 sm:p-4 border-2 border-purple-100 rounded-lg sm:rounded-xl bg-gradient-to-r from-white to-purple-50 hover:shadow-md transition-all"
                  >
                    <div className="flex-1">
                      <p className="font-bold text-purple-900 text-sm sm:text-base">{s.nameAr}</p>
                      <p className="text-xs sm:text-sm text-gray-600">{s.name}</p>
                      <p className="text-xs sm:text-sm text-purple-600 mt-1">يكفي {s.personsCountAr}</p>
                      <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-1">
                        <span
                          className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold ${
                            s.isActive
                              ? 'bg-green-100 text-green-800 border border-green-200'
                              : 'bg-gray-100 text-gray-800 border border-gray-200'
                          }`}
                        >
                          {s.isActive ? 'مفعّل' : 'غير مفعّل'}
                        </span>
                        <span className="text-[10px] sm:text-xs text-gray-500 hidden sm:inline">
                          {formatDate(s.createdAt)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 sm:gap-2">
                      <button
                        onClick={() => {
                          setEditingSize(s);
                          setSizeForm({
                            nameAr: s.nameAr,
                            name: s.name,
                            personsCount: s.personsCount,
                            personsCountAr: s.personsCountAr,
                            isActive: s.isActive,
                          });
                        }}
                        className="text-blue-600 hover:text-blue-700 p-1.5 sm:p-2 hover:bg-blue-50 rounded-lg sm:rounded-xl transition-colors"
                        title="تعديل"
                        disabled={isLoading}
                      >
                        <Edit size={16} className="sm:hidden" />
                        <Edit size={18} className="hidden sm:block" />
                      </button>
                      <button
                        onClick={() => void handleDeleteSize(s.id)}
                        className="text-red-600 hover:text-red-700 p-1.5 sm:p-2 hover:bg-red-50 rounded-lg sm:rounded-xl transition-colors"
                        title="حذف"
                        disabled={isLoading}
                      >
                        <Trash2 size={16} className="sm:hidden" />
                        <Trash2 size={18} className="hidden sm:block" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* FLAVORS TAB */}
      {activeTab === 'flavors' && (
        <>
          <div className="mb-6 sm:mb-8 p-4 sm:p-6 bg-gradient-to-br from-white to-purple-50 rounded-xl sm:rounded-2xl shadow-xl border-2 border-purple-100">
            <h3 className="text-base sm:text-lg md:text-xl font-bold text-purple-900 mb-4 sm:mb-6 flex items-center gap-2">
              {editingFlavor ? <Edit className="h-4 w-4 sm:h-5 sm:w-5" /> : <Plus className="h-4 w-4 sm:h-5 sm:w-5" />}
              <span className="text-sm sm:text-base md:text-xl">{editingFlavor ? 'تعديل النكهة' : 'إضافة نكهة جديدة'}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-bold text-purple-900 mb-2">
                  الاسم بالعربية <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={flavorForm.nameAr}
                  onChange={(e) => setFlavorForm({ ...flavorForm, nameAr: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-purple-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-right text-sm sm:text-base"
                  dir="rtl"
                  placeholder="مثال: فانيليا"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-purple-900 mb-2">
                  Name in English <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={flavorForm.name}
                  onChange={(e) => setFlavorForm({ ...flavorForm, name: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-purple-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base"
                  placeholder="e.g., Vanilla"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-purple-900 mb-2">اللون</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={flavorForm.color}
                    onChange={(e) => setFlavorForm({ ...flavorForm, color: e.target.value })}
                    className="w-12 sm:w-16 h-10 sm:h-12 border-2 border-purple-200 rounded-lg sm:rounded-xl cursor-pointer"
                  />
                  <input
                    type="text"
                    value={flavorForm.color}
                    onChange={(e) => setFlavorForm({ ...flavorForm, color: e.target.value })}
                    className="flex-1 px-3 sm:px-4 py-2 sm:py-3 border-2 border-purple-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base"
                    placeholder="#FCD34D"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-purple-900 mb-2">السعر الإضافي</label>
                <input
                  type="number"
                  value={flavorForm.additionalPrice}
                  onChange={(e) => setFlavorForm({ ...flavorForm, additionalPrice: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-purple-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-right text-sm sm:text-base"
                  dir="rtl"
                  placeholder="0"
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-purple-900 mb-2">الحالة</label>
                <select
                  value={flavorForm.isActive ? 'true' : 'false'}
                  onChange={(e) => setFlavorForm({ ...flavorForm, isActive: e.target.value === 'true' })}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-purple-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-right font-medium text-sm sm:text-base"
                  dir="rtl"
                >
                  <option value="true">مفعّل</option>
                  <option value="false">غير مفعّل</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4 sm:mt-6">
              <button
                onClick={() => void handleSaveFlavor()}
                disabled={isLoading}
                className="bg-gradient-to-r from-purple-600 to-pink-500 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl hover:from-purple-700 hover:to-pink-600 transition-all font-semibold shadow-md flex items-center justify-center gap-2 disabled:opacity-50 text-sm sm:text-base"
              >
                <Save className="h-4 w-4" />
                {editingFlavor ? 'تحديث' : 'إضافة'}
              </button>

              {(editingFlavor || flavorForm.nameAr || flavorForm.name) && (
                <button
                  onClick={resetFlavorForm}
                  disabled={isLoading}
                  className="bg-gray-200 text-gray-700 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl hover:bg-gray-300 transition-all font-semibold flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  <X className="h-4 w-4" />
                  إلغاء
                </button>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 border-2 border-purple-100">
            <h4 className="text-base sm:text-lg font-bold text-purple-900 mb-3 sm:mb-4 flex items-center gap-2">
              <Cookie className="h-4 w-4 sm:h-5 sm:w-5" />
              النكهات المتاحة ({Array.isArray(flavors) ? flavors.length : 0})
            </h4>

            {!Array.isArray(flavors) || flavors.length === 0 ? (
              <p className="text-center text-gray-500 py-6 sm:py-8 text-sm sm:text-base">لا توجد نكهات</p>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {flavors.map((f) => (
                  <div
                    key={f.id}
                    className="flex items-center justify-between p-3 sm:p-4 border-2 border-purple-100 rounded-lg sm:rounded-xl bg-gradient-to-r from-white to-purple-50 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-2 sm:gap-4 flex-1">
                      <div
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-gray-300"
                        style={{ backgroundColor: f.color }}
                      />
                      <div className="flex-1">
                        <p className="font-bold text-purple-900 text-sm sm:text-base">{f.nameAr}</p>
                        <p className="text-xs sm:text-sm text-gray-600">{f.name}</p>
                        <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-1">
                          <span
                            className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold ${
                              f.isActive
                                ? 'bg-green-100 text-green-800 border border-green-200'
                                : 'bg-gray-100 text-gray-800 border border-gray-200'
                            }`}
                          >
                            {f.isActive ? 'مفعّل' : 'غير مفعّل'}
                          </span>

                          {f.additionalPrice > 0 && (
                            <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-amber-100 text-amber-800 rounded-full text-[10px] sm:text-xs font-bold border border-amber-200">
                              +{f.additionalPrice} جنيه
                            </span>
                          )}

                          <span className="text-[10px] sm:text-xs text-gray-500 hidden sm:inline">
                            {formatDate(f.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 sm:gap-2">
                      <button
                        onClick={() => {
                          setEditingFlavor(f);
                          setFlavorForm({
                            nameAr: f.nameAr,
                            name: f.name,
                            color: f.color,
                            additionalPrice: String(f.additionalPrice ?? 0),
                            isActive: f.isActive,
                          });
                        }}
                        className="text-blue-600 hover:text-blue-700 p-1.5 sm:p-2 hover:bg-blue-50 rounded-lg sm:rounded-xl transition-colors"
                        title="تعديل"
                        disabled={isLoading}
                      >
                        <Edit size={16} className="sm:hidden" />
                        <Edit size={18} className="hidden sm:block" />
                      </button>

                      <button
                        onClick={() => void handleDeleteFlavor(f.id)}
                        className="text-red-600 hover:text-red-700 p-1.5 sm:p-2 hover:bg-red-50 rounded-lg sm:rounded-xl transition-colors"
                        title="حذف"
                        disabled={isLoading}
                      >
                        <Trash2 size={16} className="sm:hidden" />
                        <Trash2 size={18} className="hidden sm:block" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* PRICING TAB */}
      {activeTab === 'pricing' && (
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 border-2 border-purple-100">
          <h3 className="text-base sm:text-lg font-bold text-purple-900 mb-4 sm:mb-6 flex items-center gap-2">
            <DollarSign className="h-4 w-4 sm:h-5 sm:w-5" />
            الأسعار
          </h3>

          <div className="mb-4 sm:mb-6">
            <label className="block text-xs sm:text-sm font-bold text-purple-900 mb-2">
              المناسبة <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedOccasionForPricing}
              onChange={(e) => {
                const id = e.target.value;
                setSelectedOccasionForPricing(id);
                if (id) {
                  void fetchOccasionSizes(id);
                } else {
                  setOccasionSizes([]);
                  setPricingForm({});
                }
              }}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-purple-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-right font-medium text-sm sm:text-base"
              dir="rtl"
            >
              <option value="">-- اختر مناسبة --</option>
              {(Array.isArray(occasions) ? occasions : [])
                .filter((o) => o.isActive)
                .map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.icon} {o.nameAr}
                  </option>
                ))}
            </select>
          </div>

          {selectedOccasionForPricing && (
            <>
              <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
                {(Array.isArray(sizes) ? sizes : [])
                  .filter((s) => s.isActive)
                  .map((s) => (
                    <div
                      key={s.id}
                      className="p-3 sm:p-4 border-2 border-purple-100 rounded-lg sm:rounded-xl bg-gradient-to-r from-white to-purple-50"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-bold text-purple-900 text-sm sm:text-base">{s.nameAr}</p>
                          <p className="text-xs sm:text-sm text-gray-600">
                            {s.name} - {s.personsCountAr}
                          </p>
                        </div>

                        <label className="flex items-center gap-1.5 sm:gap-2">
                          <span className="text-xs sm:text-sm font-medium text-purple-900">مفعّل</span>
                          <input
                            type="checkbox"
                            checked={pricingForm[s.id]?.isActive ?? true}
                            onChange={(e) =>
                              setPricingForm((prev) => ({
                                ...prev,
                                [s.id]: {
                                  price: prev[s.id]?.price ?? '',
                                  isActive: e.target.checked,
                                },
                              }))
                            }
                            className="w-4 h-4 text-purple-600 border-purple-300 rounded focus:ring-purple-500"
                          />
                        </label>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={pricingForm[s.id]?.price ?? ''}
                          onChange={(e) =>
                            setPricingForm((prev) => ({
                              ...prev,
                              [s.id]: {
                                price: e.target.value,
                                isActive: prev[s.id]?.isActive ?? true,
                              },
                            }))
                          }
                          className="flex-1 px-3 sm:px-4 py-2 sm:py-3 border-2 border-purple-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-right text-sm sm:text-base"
                          dir="rtl"
                          placeholder="0"
                          min="0"
                          step="0.01"
                        />
                        <span className="text-purple-900 font-bold text-sm sm:text-base">جنيه</span>
                      </div>
                    </div>
                  ))}
              </div>

              <button
                onClick={() => void handleSavePricing()}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-500 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl hover:from-purple-700 hover:to-pink-600 transition-all font-semibold shadow-md flex items-center justify-center gap-2 disabled:opacity-50 text-sm sm:text-base"
              >
                <Save className="h-4 w-4" />
                حفظ الأسعار
              </button>

              {Array.isArray(occasionSizes) && occasionSizes.length > 0 && (
                <div className="mt-6 bg-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 border-2 border-purple-100">
                  <h4 className="text-base sm:text-lg font-bold text-purple-900 mb-3 sm:mb-4 flex items-center gap-2">
                    <DollarSign className="h-4 w-4 sm:h-5 sm:w-5" />
                    الأسعار الحالية
                  </h4>

                  <div className="space-y-2">
                    {occasionSizes.map((os) => (
                      <div
                        key={os.sizeId}
                        className="flex items-center justify-between p-2.5 sm:p-3 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-lg sm:rounded-xl"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-purple-900 text-sm sm:text-base">{os.sizeName}</span>
                          <span
                            className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold ${
                              os.isActive
                                ? 'bg-green-100 text-green-800 border border-green-200'
                                : 'bg-gray-100 text-gray-800 border border-gray-200'
                            }`}
                          >
                            {os.isActive ? 'مفعّل' : 'غير مفعّل'}
                          </span>
                        </div>
                        <span className="text-base sm:text-xl font-bold text-amber-600">{os.price} جنيه</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default CakeConfigurationManagement;
