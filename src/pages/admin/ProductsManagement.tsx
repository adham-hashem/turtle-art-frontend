import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Edit,
  Trash2,
  Upload,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  EyeOff,
  Eye,
  Package,
  Zap,
  Coffee,
  ShoppingBag,
  Gift,
  Users,
  Moon
} from 'lucide-react';

import { useAuth } from '../../contexts/AuthContext';

interface ProductImage {
  id: string;
  imagePath: string;
  isMain: boolean;
}

interface ProductExtension {
  id: string;
  productId: string;
  name: string;
  additionalPrice: number;
  isActive: boolean;
}

/**
 * UPDATED: Product now has Category + supports new category types
 * - Category is now a string union (matches API enum string names)
 */
type CategoryType =
  | 'KidsBags'
  | 'GirlsBags'
  | 'MomAndDaughterSet'
  | 'RamadanSet'
  | 'Giveaways';

interface Product {
  id: string;
  code: string;
  name: string;
  price: number;
  originalPrice?: number;
  description: string;
  createdAt: string;
  images: ProductImage[];
  extensions?: ProductExtension[];
  category?: CategoryType | null;

  isHidden: boolean;
  isAvailable: boolean;
  isInstant?: boolean;
  isBreakfast?: boolean;
  isFeatured?: boolean;
  rating?: number;
  salesCount?: number;
}

interface PaginatedResponse {
  items: Product[];
  totalItems: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

type TabKey =
  | 'all'
  | 'kidsBags'
  | 'girlsBags'
  | 'girlsBagsEvening'
  | 'girlsBagsCasual'
  | 'motherDaughterSet'
  | 'ramadanCollection'
  | 'giveaways'
  | 'instant'
  | 'breakfast';

const ProductsManagement: React.FC = () => {
  const { isAuthenticated, userRole, logout } = useAuth();
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>('all');

  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showEditProduct, setShowEditProduct] = useState(false);

  const [showSidebar, setShowSidebar] = useState(false);

  /**
   * UPDATED newProduct:
   * - category uses CategoryType union (string)
   */
  const [newProduct, setNewProduct] = useState<{
    code: string;
    name: string;
    price: string;
    originalPrice: string;
    description: string;
    sizes: string[];
    colors: string[];
    category: CategoryType | '';
    girlsBagType: 'Evening' | 'Casual' | '';
    images: string[];
    isHidden: boolean;
    isAvailable: boolean;
    season: string;
    type: number;
    isInstant: boolean;
    isBreakfast: boolean;
    isFeatured: boolean;
  }>({
    code: '',
    name: '',
    price: '',
    originalPrice: '',
    description: '',
    sizes: [''],
    colors: [''],
    category: '',
    girlsBagType: '',
    images: [''],
    isHidden: false,
    isAvailable: true,
    season: '',
    type: 0,
    isInstant: false,
    isBreakfast: false,
    isFeatured: false
  });

  const [isLoading, setIsLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [deletedImageIds, setDeletedImageIds] = useState<string[]>([]); // Track images to delete

  // Extensions state
  const [productExtensions, setProductExtensions] = useState<ProductExtension[]>([]);
  const [newExtension, setNewExtension] = useState({ name: '', price: '' });

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const apiUrl = import.meta.env.VITE_API_BASE_URL;

  // ==============================
  // Category Labels (Arabic + English enum name)
  // ==============================
  const CATEGORY_OPTIONS: Array<{ value: CategoryType; label: string; icon: React.ReactNode }> = [
    { value: 'KidsBags', label: 'شنط أطفال', icon: <ShoppingBag size={16} /> },
    { value: 'GirlsBags', label: 'شنط الفتيات', icon: <ShoppingBag size={16} /> },
    { value: 'MomAndDaughterSet', label: 'مجموعة الأم والابنة', icon: <Users size={16} /> },
    { value: 'RamadanSet', label: 'مجموعة رمضان', icon: <Moon size={16} /> },
    { value: 'Giveaways', label: 'التوزيعات', icon: <Gift size={16} /> }
  ];

  const getCategoryLabel = (category?: CategoryType | null) => {
    if (!category) return '';
    const found = CATEGORY_OPTIONS.find(o => o.value === category);
    return found?.label ?? String(category);
  };

  const normalizeCategory = (category?: CategoryType | number | null) => {
    if (category === null || category === undefined || category === '') return null;
    if (typeof category === 'number') {
      const byIndex: CategoryType[] = [
        'KidsBags',
        'GirlsBags',
        'MomAndDaughterSet',
        'RamadanSet',
        'Giveaways'
      ];
      return byIndex[category] ?? null;
    }
    return category;
  };

  const getTabTitle = (tab: TabKey) => {
    switch (tab) {
      case 'all':
        return 'كل المنتجات';
      case 'kidsBags':
        return 'شنط أطفال';
      case 'girlsBags':
        return 'شنط الفتيات';
      case 'girlsBagsEvening':
        return 'شنط سهرة';
      case 'girlsBagsCasual':
        return 'شنط كاجوال';
      case 'motherDaughterSet':
        return 'مجموعة الأم والابنة';
      case 'ramadanCollection':
        return 'مجموعة رمضان';
      case 'giveaways':
        return 'التوزيعات';
      case 'instant':
        return 'المنتجات الفورية';
      // case 'breakfast':
      //   return 'بوكس فطار';
      default:
        return 'المنتجات';
    }
  };

  // ==============================
  // Tabs -> API endpoints mapping
  // ==============================
  const buildListEndpoint = (tab: TabKey, page: number) => {
    const base = `${apiUrl}/api/products`;

    const withPaging = (url: string) =>
      `${url}${url.includes('?') ? '&' : '?'}pageNumber=${page}&pageSize=${pageSize}`;

    switch (tab) {
      case 'all':
        return withPaging(base);

      // Category endpoints - FIXED: removed /category/ prefix
      case 'kidsBags':
        return withPaging(`${base}/kids-bags`);
      case 'girlsBags':
        return withPaging(`${base}/girls-bags`);
      case 'girlsBagsEvening':
        return withPaging(`${base}/girls-bags/evening`);
      case 'girlsBagsCasual':
        return withPaging(`${base}/girls-bags/casual`);
      case 'motherDaughterSet':
        return withPaging(`${base}/mom-daughter-set`);
      case 'ramadanCollection':
        return withPaging(`${base}/ramadan-set`);
      case 'giveaways':
        return withPaging(`${base}/giveaways`);

      // Existing ones
      case 'instant':
        return withPaging(`${base}/instant`);
      case 'breakfast':
        return withPaging(`${base}/breakfast`);

      default:
        return withPaging(base);
    }
  };

  // ==============================
  // Auth & Init
  // ==============================
  useEffect(() => {
    const getAuthToken = () => {
      const authToken = localStorage.getItem('accessToken');
      setToken(authToken);
      return authToken;
    };

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (String(userRole).toLowerCase() !== 'admin') {
      navigate('/');
      return;
    }

    getAuthToken();
  }, [isAuthenticated, userRole, navigate]);

  useEffect(() => {
    if (token) {
      refreshProductsList(activeTab, currentPage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, currentPage, activeTab]);

  const handleLogout = () => {
    logout();
    navigate('/');
    alert('تم تسجيل خروج المدير بنجاح');
  };

  const validateToken = () => {
    if (!token) {
      alert('لم يتم العثور على رمز المصادقة. يرجى تسجيل الدخول مرة أخرى.');
      navigate('/login');
      return false;
    }
    return true;
  };

  // ==============================
  // Fetch products (by tab)
  // ==============================
  const refreshProductsList = async (tab: TabKey, page: number) => {
    if (!token) return;

    setIsLoading(true);
    try {
      const url = buildListEndpoint(tab, page);

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const responseText = await response.text();

      if (!response.ok) {
        alert('فشل في جلب المنتجات');
        return;
      }

      const data: PaginatedResponse = JSON.parse(responseText);

      if (!data || !Array.isArray(data.items)) {
        alert('تنسيق البيانات غير صحيح');
        return;
      }

      const mappedProducts: Product[] = data.items.map(item => ({
        ...item,
        category: normalizeCategory((item as any).category),
        isHidden: item.isHidden ?? false,
        isAvailable: item.isAvailable ?? false,
        isInstant: item.isInstant ?? false,
        isBreakfast: item.isBreakfast ?? false,
        isFeatured: item.isFeatured ?? false,
        rating: item.rating ?? 0,
        salesCount: item.salesCount ?? 0,
        images: (item.images ?? []).map(img => ({
          id: img.id,
          imagePath:
            img.imagePath && img.imagePath.startsWith('/') && !img.imagePath.startsWith('http')
              ? `${apiUrl}${img.imagePath}`
              : img.imagePath,
          isMain: img.isMain
        }))
      }));

      setProducts(mappedProducts);
      setTotalPages(data.totalPages ?? 1);
    } catch (error) {
      alert('حدث خطأ أثناء جلب المنتجات');
    } finally {
      setIsLoading(false);
    }
  };

  const checkProductCodeExists = (code: string, excludeId?: string): boolean => {
    return products.some(
      product => product.code.toLowerCase() === code.toLowerCase() && product.id !== excludeId
    );
  };

  // ==============================
  // ADD PRODUCT
  // ==============================
  const handleAddProduct = async () => {
    if (isLoading) return;
    if (!validateToken()) return;

    if (!newProduct.code || !newProduct.name || !newProduct.price) {
      alert('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    if (checkProductCodeExists(newProduct.code)) {
      alert('كود المنتج مُستخدم بالفعل. يرجى استخدام كود مختلف.');
      return;
    }

    // Require category for normal products (optional for Instant/Breakfast if you want)
    if (!newProduct.isInstant && !newProduct.isBreakfast && !newProduct.category) {
      alert('يرجى اختيار التصنيف');
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();

      formData.append('name', newProduct.name);
      formData.append('code', newProduct.code);
      formData.append('price', newProduct.price);
      formData.append('description', newProduct.description || '');

      formData.append('isHidden', newProduct.isHidden.toString());
      formData.append('isAvailable', newProduct.isAvailable.toString());
      formData.append('isInstant', newProduct.isInstant.toString());
      formData.append('isBreakfast', newProduct.isBreakfast.toString());
      formData.append('isFeatured', newProduct.isFeatured.toString());
      formData.append('type', newProduct.type.toString());

      // IMPORTANT: category is now string enum name, send empty if not chosen
      formData.append('category', newProduct.category || '');

      // In both functions, add this line when building formData:
      formData.append('girlsBagType', newProduct.girlsBagType || '');  // ✅ ADD THIS

      // season might still exist server-side; send empty if not chosen
      formData.append('season', newProduct.season || '');

      // sizes
      const validSizes = newProduct.sizes.filter(size => size.trim() !== '');
      if (validSizes.length > 0) {
        validSizes.forEach(size => formData.append('sizes[]', size));
      } else {
        formData.append('sizes', '');
      }

      // colors
      const validColors = newProduct.colors.filter(color => color.trim() !== '');
      if (validColors.length > 0) {
        validColors.forEach(color => formData.append('colors[]', color));
      } else {
        formData.append('colors', '');
      }

      if (newProduct.originalPrice) formData.append('originalPrice', newProduct.originalPrice);

      formData.append('mainImageIndex', '0');

      // Images: data URLs -> File
      const imageFiles = await Promise.all(
        newProduct.images
          .filter(img => img.trim() !== '')
          .map(async (img, index) => {
            if (img.startsWith('data:image')) {
              const resp = await fetch(img);
              const blob = await resp.blob();
              return new File([blob], `image-${index}.jpg`, { type: blob.type });
            }
            return null;
          })
      );

      imageFiles
        .filter((file): file is File => file !== null)
        .forEach(file => formData.append('imageFiles', file));

      const response = await fetch(`${apiUrl}/api/products`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        if (errorText.includes('already exists')) {
          const codeMatch = errorText.match(/code '([^']+)'/);
          const duplicateCode = codeMatch ? codeMatch[1] : newProduct.code;
          throw new Error(`كود المنتج '${duplicateCode}' مُستخدم بالفعل. يرجى استخدام كود مختلف.`);
        } else if (response.status === 500 && errorText.includes('duplicate key')) {
          throw new Error('كود المنتج مُستخدم بالفعل. يرجى استخدام كود مختلف.');
        } else if (response.status === 400) {
          throw new Error(errorText || 'بيانات المنتج غير صحيحة');
        } else if (response.status === 500) {
          throw new Error(`خطأ في الخادم: ${errorText}`);
        } else {
          throw new Error(`فشل في إضافة المنتج: ${response.status} ${response.statusText}`);
        }
      }

      const createdProduct = await response.json();

      // reset to page 1 of active tab
      setCurrentPage(1);
      await refreshProductsList(activeTab, 1);

      // Close add dialog
      setShowAddProduct(false);
      resetProductForm();

      // Auto-open edit mode with the newly created product to add extensions
      if (createdProduct && createdProduct.id) {
        setEditingProduct(createdProduct);
        setShowEditProduct(true);
        setNewProduct({
          ...createdProduct,
          images: createdProduct.imageUrls || [],
          sizes: createdProduct.sizes || [],
          colors: createdProduct.colors || [],
        });
        // Load extensions for the new product
        await fetchProductExtensions(createdProduct.id);
        alert('تم إضافة المنتج بنجاح! يمكنك الآن إضافة الإضافات (Extensions)');
      } else {
        alert('تم إضافة المنتج بنجاح!');
      }
    } catch (error: any) {
      console.error('Error adding product:', error);
      alert(error.message || 'حدث خطأ أثناء إضافة المنتج');
    } finally {
      setIsLoading(false);
    }
  };

  // ==============================
  // UPDATE PRODUCT
  // ==============================
  const handleUpdateProduct = async () => {
    if (isLoading || !editingProduct) return;
    if (!validateToken()) return;

    if (!newProduct.code || !newProduct.name || !newProduct.price) {
      alert('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    // Require category for normal products (optional for Instant/Breakfast if you want)
    if (!newProduct.isInstant && !newProduct.isBreakfast && !newProduct.category) {
      alert('يرجى اختيار التصنيف');
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();

      formData.append('name', newProduct.name.trim());
      formData.append('code', newProduct.code.trim());
      formData.append('price', newProduct.price.toString());
      formData.append('description', newProduct.description?.trim() || '');

      formData.append('isHidden', newProduct.isHidden.toString());
      formData.append('isAvailable', newProduct.isAvailable.toString());
      formData.append('isInstant', newProduct.isInstant.toString());
      formData.append('isBreakfast', newProduct.isBreakfast.toString());
      formData.append('isFeatured', newProduct.isFeatured.toString());
      formData.append('type', newProduct.type.toString());

      // UPDATED
      formData.append('category', newProduct.category || '');
      formData.append('girlsBagType', newProduct.girlsBagType || '');
      formData.append('season', newProduct.season || '');

      if (newProduct.originalPrice && newProduct.originalPrice.trim() !== '') {
        formData.append('originalPrice', newProduct.originalPrice.toString());
      }

      // sizes
      const validSizes = newProduct.sizes.filter(size => size.trim() !== '');
      if (validSizes.length > 0) {
        validSizes.forEach((size, index) => {
          formData.append(`sizes[${index}]`, size.trim());
        });
      } else {
        formData.append('sizes', '');
      }

      // colors
      const validColors = newProduct.colors.filter(color => color.trim() !== '');
      if (validColors.length > 0) {
        validColors.forEach((color, index) => {
          formData.append(`colors[${index}]`, color.trim());
        });
      } else {
        formData.append('colors', '');
      }

      // new images only (data URLs)
      const newImages: File[] = [];
      for (let i = 0; i < newProduct.images.length; i++) {
        const img = newProduct.images[i];
        if (img && img.trim() !== '' && img.startsWith('data:image')) {
          try {
            const resp = await fetch(img);
            const blob = await resp.blob();
            newImages.push(new File([blob], `image-${i}.jpg`, { type: blob.type }));
          } catch (error) {
            console.error('Error processing image:', error);
          }
        }
      }

      if (newImages.length > 0) {
        formData.append('mainImageIndex', '0');
        newImages.forEach(file => formData.append('imageFiles', file));
      }

      // Send deleted image IDs
      if (deletedImageIds.length > 0) {
        deletedImageIds.forEach(id => formData.append('imageIdsToDelete[]', id));
      }

      const response = await fetch(`${apiUrl}/api/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        if (errorText.includes('already exists') || errorText.includes('duplicate')) {
          const codeMatch = errorText.match(/code '([^']+)'/);
          const duplicateCode = codeMatch ? codeMatch[1] : newProduct.code;
          throw new Error(`كود المنتج '${duplicateCode}' مُستخدم بالفعل. يرجى استخدام كود مختلف.`);
        } else if (response.status === 400) {
          throw new Error(`خطأ في البيانات المرسلة: ${errorText}`);
        } else if (response.status === 401) {
          throw new Error('انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.');
        } else if (response.status === 404) {
          throw new Error('المنتج غير موجود أو تم حذفه.');
        } else {
          throw new Error(`فشل في تحديث المنتج (${response.status}): ${errorText || response.statusText}`);
        }
      }

      await refreshProductsList(activeTab, currentPage);

      setShowEditProduct(false);
      setEditingProduct(null);
      setDeletedImageIds([]); // Reset deleted image IDs
      resetProductForm();
      alert('تم تحديث المنتج بنجاح!');
    } catch (error: any) {
      console.error('Error updating product:', error);
      alert(error.message || 'حدث خطأ أثناء تحديث المنتج');
    } finally {
      setIsLoading(false);
    }
  };

  // ==============================
  // RESET FORM
  // ==============================
  const resetProductForm = () => {
    setNewProduct({
      code: '',
      name: '',
      price: '',
      originalPrice: '',
      description: '',
      sizes: [''],
      colors: [''],
      category: '',
      girlsBagType: '',
      images: [''],
      isHidden: false,
      isAvailable: true,
      season: '',
      type: 0,
      isInstant: false,
      isBreakfast: false,
      isFeatured: false
    });
  };

  // ==============================
  // EDIT
  // ==============================
  const handleEditProduct = async (product: Product) => {
    setEditingProduct(product);
    setDeletedImageIds([]); // Reset deleted image IDs when starting edit

    setNewProduct({
      code: product.code,
      name: product.name,
      price: product.price.toString(),
      originalPrice: product.originalPrice?.toString() || '',
      description: product.description,
      images: (product.images ?? []).map(img => img.imagePath),
      sizes: [''],
      colors: [''],
      category: normalizeCategory(product.category) ?? '',
      girlsBagType: (product as any).girlsBagType || '',
      isHidden: product.isHidden,
      isAvailable: product.isAvailable,
      season: '',
      type: 0,
      isInstant: product.isInstant || false,
      isBreakfast: product.isBreakfast || false,
      isFeatured: product.isFeatured || false
    });

    // Fetch extensions for this product
    await fetchProductExtensions(product.id);

    setShowEditProduct(true);
    setShowAddProduct(false);
    setShowSidebar(false);
  };

  // ==============================
  // DELETE
  // ==============================
  const handleDeleteProduct = async (productId: string) => {
    const productToDelete = products.find(p => p.id === productId);
    if (
      !confirm(
        `هل أنت متأكد من حذف المنتج "${productToDelete?.name}"?

تحذير: إذا كان المنتج موجود في عربات التسوق أو الطلبات، فلن يمكن حذفه.`
      )
    ) {
      return;
    }

    if (!validateToken()) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${apiUrl}/api/products/${productId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 500) {
          if (
            errorText.includes('REFERENCE constraint') ||
            errorText.includes('FK_CartItems_Products') ||
            errorText.includes('CartItems')
          ) {
            throw new Error(
              'لا يمكن حذف هذا المنتج لأنه موجود في عربات التسوق أو الطلبات الحالية. يرجى إزالته من جميع العربات أولاً أو انتظار حتى يتم إتمام الطلبات المرتبطة به.'
            );
          } else if (errorText.includes('Orders') || errorText.includes('OrderItems')) {
            throw new Error(
              'لا يمكن حذف هذا المنتج لأنه مرتبط بطلبات موجودة. يرجى انتظار حتى يتم معالجة جميع الطلبات المرتبطة به.'
            );
          } else {
            throw new Error(`خطأ في الخادم: ${errorText}`);
          }
        } else if (response.status === 404) {
          throw new Error('المنتج غير موجود أو تم حذفه بالفعل.');
        } else {
          throw new Error(`فشل في حذف المنتج: ${response.status} ${response.statusText}`);
        }
      }

      setProducts(prev => prev.filter(p => p.id !== productId));
      await refreshProductsList(activeTab, currentPage);
      alert('تم حذف المنتج بنجاح!');
    } catch (error: any) {
      if (error.message.includes('عربات التسوق') || error.message.includes('CartItems')) {
        alert(`❌ ${error.message}

💡 نصيحة: يمكنك إخفاء المنتج بدلاً من حذفه عن طريق تعديله وإلغاء تفعيله.`);
      } else {
        alert(`حدث خطأ أثناء حذف المنتج: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ==============================
  // PRODUCT EXTENSIONS
  // ==============================
  const fetchProductExtensions = async (productId: string) => {
    try {
      const response = await fetch(`${apiUrl}/api/products/${productId}/extensions`);
      if (response.ok) {
        const data = await response.json();
        setProductExtensions(data);
      } else {
        setProductExtensions([]);
      }
    } catch (error) {
      console.error('Error fetching extensions:', error);
      setProductExtensions([]);
    }
  };

  const handleAddExtension = async () => {
    if (!editingProduct || !newExtension.name || !newExtension.price) {
      alert('الرجاء إدخال اسم الإضافة والسعر');
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/api/products/${editingProduct.id}/extensions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          productId: editingProduct.id,
          name: newExtension.name,
          additionalPrice: parseFloat(newExtension.price),
          isActive: true
        })
      });

      if (response.ok) {
        await fetchProductExtensions(editingProduct.id);
        setNewExtension({ name: '', price: '' });
        alert('تم إضافة الإضافة بنجاح');
      } else {
        alert('فشل إضافة الإضافة');
      }
    } catch (error) {
      console.error('Error adding extension:', error);
      alert('حدث خطأ أثناء إضافة الإضافة');
    }
  };

  const handleDeleteExtension = async (extensionId: string) => {
    if (!editingProduct || !confirm('هل أنت متأكد من حذف هذه الإضافة؟')) {
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/api/products/${editingProduct.id}/extensions/${extensionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        await fetchProductExtensions(editingProduct.id);
        alert('تم حذف الإضافة بنجاح');
      } else {
        alert('فشل حذف الإضافة');
      }
    } catch (error) {
      console.error('Error deleting extension:', error);
      alert('حدث خطأ أثناء حذف الإضافة');
    }
  };

  // ==============================
  // Images / Sizes / Colors helpers
  // ==============================
  const handleImageUpload = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = e => {
      const result = e.target?.result as string;
      updateImageField(index, result);
    };
    reader.readAsDataURL(file);
  };

  const addImageField = () => {
    setNewProduct(prev => ({ ...prev, images: [...prev.images, ''] }));
  };

  const removeImageField = (index: number) => {
    setNewProduct(prev => {
      const imageToRemove = prev.images[index];

      // If it's an existing image (not a data URL), track its ID for deletion
      if (imageToRemove && !imageToRemove.startsWith('data:image') && editingProduct) {
        // Extract image ID from the original product
        const originalImage = editingProduct.images?.[index];
        if (originalImage?.id) {
          setDeletedImageIds(prev => [...prev, originalImage.id]);
        }
      }

      const next = prev.images.filter((_, i) => i !== index);
      return { ...prev, images: next.length ? next : [''] };
    });
  };

  const updateImageField = (index: number, value: string) => {
    setNewProduct(prev => ({
      ...prev,
      images: prev.images.map((img, i) => (i === index ? value : img))
    }));
  };

  const addSizeField = () => setNewProduct(prev => ({ ...prev, sizes: [...prev.sizes, ''] }));
  const updateSizeField = (index: number, value: string) =>
    setNewProduct(prev => ({ ...prev, sizes: prev.sizes.map((s, i) => (i === index ? value : s)) }));

  const addColorField = () => setNewProduct(prev => ({ ...prev, colors: [...prev.colors, ''] }));
  const updateColorField = (index: number, value: string) =>
    setNewProduct(prev => ({ ...prev, colors: prev.colors.map((c, i) => (i === index ? value : c)) }));

  // ==============================
  // Pagination
  // ==============================
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) setCurrentPage(page);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const getPageNumbers = () => {
    const pages: (number | '...')[] = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      let start = Math.max(1, currentPage - 2);
      let end = Math.min(totalPages, currentPage + 2);

      if (end - start < maxPagesToShow - 1) {
        if (start === 1) end = Math.min(totalPages, start + maxPagesToShow - 1);
        else start = Math.max(1, end - maxPagesToShow + 1);
      }

      if (start > 1) {
        pages.push(1);
        if (start > 2) pages.push('...');
      }

      for (let i = start; i <= end; i++) pages.push(i);

      if (end < totalPages) {
        if (end < totalPages - 1) pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  // ==============================
  // Tab switch
  // ==============================
  const switchTab = (tab: TabKey) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  // ==============================
  // UI Guards
  // ==============================
  if (!isAuthenticated) {
    return (
      <div className="p-4 text-center" style={{ fontFamily: 'Tajawal, sans-serif' }}>
        جاري التحقق من المصادقة...
      </div>
    );
  }

  if (!token) {
    return (
      <div className="p-4 text-center" style={{ fontFamily: 'Tajawal, sans-serif' }}>
        جاري تحميل رمز المصادقة...
      </div>
    );
  }

  // ==============================
  // Render
  // ==============================
  return (
    <div className="min-h-screen bg-[#FAF9F6]" dir="rtl">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white shadow-sm border-b-2 border-[#E5DCC5]">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-lg font-bold text-[#8B7355]" style={{ fontFamily: 'Tajawal, sans-serif' }}>
            إدارة المنتجات
          </h1>
          {/* <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="p-2 text-[#8B7355] hover:bg-[#F5F5DC] rounded-lg"
          >
            {showSidebar ? <X size={24} /> : <Menu size={24} />}
          </button> */}
        </div>
      </div>

      <div className="flex">
        {/* Mobile Sidebar */}
        {showSidebar && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 lg:hidden" onClick={() => setShowSidebar(false)}>
            <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-xl" onClick={e => e.stopPropagation()}>
              <div className="p-4">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-[#8B7355]" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    إحصائيات سريعة
                  </h3>
                  <button onClick={() => setShowSidebar(false)} className="p-2 text-[#8B7355] hover:bg-[#F5F5DC] rounded-lg">
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-[#F5F5DC] to-[#E5DCC5] p-4 rounded-lg border-2 border-[#E5DCC5]">
                    <p className="text-sm text-[#8B7355]/70" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      إجمالي المنتجات (هذه الصفحة)
                    </p>
                    <p className="text-2xl font-bold text-[#8B7355]" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      {products.length}
                    </p>
                    <p className="text-xs text-[#8B7355]/60 mt-1" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      التبويب: {getTabTitle(activeTab)}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-[#8B7355]" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      التبويبات
                    </p>
                    {([
                      ['all', 'كل المنتجات'],
                      ['kidsBags', 'شنط أطفال'],
                      ['girlsBags', 'شنط الفتيات'],
                      ['girlsBagsEvening', 'شنط سهرة'],
                      ['girlsBagsCasual', 'شنط كاجوال'],
                      ['motherDaughterSet', 'مجموعة الأم ولابنة'],
                      ['ramadanCollection', 'مجموعة رمضان'],
                      ['giveaways', 'التوزيعات'],
                      ['instant', 'المنتجات الفورية'],
                      // ['breakfast', 'بوكس فطار']
                    ] as Array<[TabKey, string]>).map(([key, label]) => (
                      <button
                        key={key}
                        onClick={() => {
                          switchTab(key);
                          setShowSidebar(false);
                        }}
                        className={`w-full text-right px-3 py-2 rounded-lg border-2 transition-colors ${activeTab === key
                          ? 'bg-[#8B7355] text-white border-[#8B7355]'
                          : 'bg-white text-[#8B7355] border-[#E5DCC5] hover:bg-[#F5F5DC]'
                          }`}
                        style={{ fontFamily: 'Tajawal, sans-serif' }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1">
          <div className="container mx-auto px-4 py-4 lg:py-8">
            <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
              {/* Main Content */}
              <div className="flex-1">
                <div className="bg-white rounded-lg lg:rounded-2xl shadow-lg border-2 border-[#E5DCC5] p-4 lg:p-6">
                  {/* Desktop Header */}
                  <div className="hidden lg:flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-[#8B7355]" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                        إدارة المنتجات
                      </h2>
                      <p className="text-sm text-[#8B7355]/70 mt-1" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                        التبويب الحالي: {getTabTitle(activeTab)} | الصفحة: {currentPage}/{totalPages}
                      </p>
                    </div>

                    <div className="flex items-center space-x-reverse space-x-4">
                      <div className="text-sm text-[#8B7355]/70" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                        الرمز: {token ? '✅ متوفر' : '❌ غير متوفر'}
                      </div>

                      <button
                        onClick={() => {
                          setShowAddProduct(true);
                          setShowEditProduct(false);
                          setEditingProduct(null);
                        }}
                        disabled={isLoading}
                        className="bg-gradient-to-r from-[#8B7355] to-[#A67C52] text-white px-4 py-2 rounded-lg hover:from-[#6B5644] hover:to-[#8B6644] transition-colors flex items-center space-x-reverse space-x-2 disabled:opacity-50 shadow-md"
                        style={{ fontFamily: 'Tajawal, sans-serif' }}
                      >
                        <Plus size={20} />
                        <span>إضافة منتج</span>
                      </button>
                    </div>
                  </div>

                  {/* Desktop Tabs */}
                  <div className="hidden lg:flex flex-wrap gap-2 mb-6">
                    {([
                      ['all', 'كل المنتجات'],
                      // ['kidsBags', 'شنط أطفال'],
                      // ['girlsBags', 'شنط الفتيات'],
                      // ['girlsBagsEvening', 'سهرة'],
                      // ['girlsBagsCasual', 'كاجوال'],
                      // ['motherDaughterSet', 'مجموعة الأم والابنة'],
                      // ['ramadanCollection', 'مجموعة رمضان'],
                      // ['giveaways', 'التوزيعات'],
                      // ['instant', 'المنتجات الفورية'],
                      // ['breakfast', 'بوكس فطار']
                    ] as Array<[TabKey, string]>).map(([key, label]) => (
                      <button
                        key={key}
                        onClick={() => switchTab(key)}
                        className={`px-3 py-2 rounded-lg border-2 text-sm transition-colors ${activeTab === key
                          ? 'bg-[#8B7355] text-white border-[#8B7355]'
                          : 'bg-white text-[#8B7355] border-[#E5DCC5] hover:bg-[#F5F5DC]'
                          }`}
                        style={{ fontFamily: 'Tajawal, sans-serif' }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  {/* Mobile Add Button */}
                  <div className="lg:hidden mb-4">
                    <div className="flex justify-between items-center gap-2">
                      <button
                        onClick={() => {
                          setShowAddProduct(true);
                          setShowEditProduct(false);
                          setEditingProduct(null);
                        }}
                        disabled={isLoading}
                        className="flex-1 bg-gradient-to-r from-[#8B7355] to-[#A67C52] text-white px-4 py-3 rounded-lg hover:from-[#6B5644] hover:to-[#8B6644] transition-colors flex items-center justify-center space-x-reverse space-x-2 disabled:opacity-50 shadow-md"
                        style={{ fontFamily: 'Tajawal, sans-serif' }}
                      >
                        <Plus size={20} />
                        <span>إضافة منتج</span>
                      </button>

                      {/* <button
                        onClick={handleLogout}
                        className="bg-[#F5F5DC] border-2 border-[#E5DCC5] text-[#8B7355] px-4 py-3 rounded-lg hover:bg-[#E5DCC5] transition-colors shadow-md"
                        style={{ fontFamily: 'Tajawal, sans-serif' }}
                      >
                        خروج
                      </button> */}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {([
                        ['all', 'الكل'],
                        ['kidsBags', 'أطفال'],
                        ['girlsBags', 'فتيات'],
                        ['motherDaughterSet', 'أم/ابنة'],
                        ['ramadanCollection', 'رمضان'],
                        ['giveaways', 'توزيعات'],
                        ['instant', 'فوري'],
                        // ['breakfast', 'فطار']
                      ] as Array<[TabKey, string]>).map(([key, label]) => (
                        <button
                          key={key}
                          onClick={() => switchTab(key)}
                          className={`px-3 py-2 rounded-lg border-2 text-sm transition-colors ${activeTab === key
                            ? 'bg-[#8B7355] text-white border-[#8B7355]'
                            : 'bg-white text-[#8B7355] border-[#E5DCC5] hover:bg-[#F5F5DC]'
                            }`}
                          style={{ fontFamily: 'Tajawal, sans-serif' }}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Product Form */}
                  {(showAddProduct || showEditProduct) && (
                    <div className="mb-6 lg:mb-8 p-4 lg:p-6 bg-gradient-to-br from-[#FAF9F6] to-[#F5F5DC] rounded-lg border-2 border-[#E5DCC5]">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-[#8B7355]" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                          {showAddProduct ? 'إضافة منتج جديد' : 'تعديل المنتج'}
                        </h3>
                        <button
                          onClick={() => {
                            setShowAddProduct(false);
                            setShowEditProduct(false);
                            setEditingProduct(null);
                            resetProductForm();
                          }}
                          className="p-2 text-[#8B7355] hover:bg-[#E5DCC5] rounded-lg"
                        >
                          <X size={20} />
                        </button>
                      </div>

                      {/* Info message for adding extensions - only show when adding new product */}
                      {showAddProduct && (
                        <div className="mb-4 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                          <div className="flex items-start gap-3">
                            <div className="text-blue-600 mt-0.5">
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-blue-800" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                                📌 ملحوظة هامة
                              </p>
                              <p className="text-sm text-blue-700 mt-1" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                                يمكنك إضافة الإضافات (Extensions) للمنتج بعد حفظه من خلال تعديله. بعد إضافة المنتج، ستفتح نافذة التعديل تلقائياً لإضافة الإضافات.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="space-y-4">
                        {/* Basic Info */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-[#8B7355] mb-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                              كود المنتج *
                            </label>
                            <input
                              type="text"
                              value={newProduct.code}
                              onChange={e => setNewProduct(prev => ({ ...prev, code: e.target.value }))}
                              className={`w-full px-3 py-3 border-2 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] text-right text-[#8B7355] ${newProduct.code && checkProductCodeExists(newProduct.code, editingProduct?.id)
                                ? 'border-red-500 bg-red-50'
                                : 'border-[#E5DCC5]'
                                }`}
                              style={{ fontFamily: 'Tajawal, sans-serif' }}
                              dir="rtl"
                            />
                            {newProduct.code && checkProductCodeExists(newProduct.code, editingProduct?.id) && (
                              <p className="text-red-500 text-sm mt-1" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                                كود المنتج مُستخدم بالفعل
                              </p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-[#8B7355] mb-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                              اسم المنتج *
                            </label>
                            <input
                              type="text"
                              value={newProduct.name}
                              onChange={e => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                              className="w-full px-3 py-3 border-2 border-[#E5DCC5] rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] text-right text-[#8B7355]"
                              style={{ fontFamily: 'Tajawal, sans-serif' }}
                              dir="rtl"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-[#8B7355] mb-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                              السعر *
                            </label>
                            <input
                              type="number"
                              value={newProduct.price}
                              onChange={e => setNewProduct(prev => ({ ...prev, price: e.target.value }))}
                              className="w-full px-3 py-3 border-2 border-[#E5DCC5] rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] text-right text-[#8B7355]"
                              style={{ fontFamily: 'Tajawal, sans-serif' }}
                              dir="rtl"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[#8B7355] mb-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                              السعر الأصلي
                            </label>
                            <input
                              type="number"
                              value={newProduct.originalPrice}
                              onChange={e => setNewProduct(prev => ({ ...prev, originalPrice: e.target.value }))}
                              className="w-full px-3 py-3 border-2 border-[#E5DCC5] rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] text-right text-[#8B7355]"
                              style={{ fontFamily: 'Tajawal, sans-serif' }}
                              dir="rtl"
                            />
                          </div>
                        </div>

                        {/* Category (NEW) */}
                        {/* Category */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-[#8B7355] mb-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                              التصنيف {!newProduct.isInstant && !newProduct.isBreakfast ? '*' : ''}
                            </label>
                            <select
                              value={newProduct.category}
                              onChange={e => setNewProduct(prev => ({ ...prev, category: e.target.value as any }))}
                              className="w-full px-3 py-3 border-2 border-[#E5DCC5] rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] text-right text-[#8B7355] bg-white"
                              style={{ fontFamily: 'Tajawal, sans-serif' }}
                              dir="rtl"
                            >
                              <option value="">— اختر التصنيف —</option>
                              {CATEGORY_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* ✅ ADD THIS: GirlsBagType dropdown - only show when category is GirlsBags */}
                          {newProduct.category === 'GirlsBags' && (
                            <div>
                              <label className="block text-sm font-medium text-[#8B7355] mb-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                                نوع الشنطة (اختياري)
                              </label>
                              <select
                                value={newProduct.girlsBagType}
                                onChange={e => setNewProduct(prev => ({ ...prev, girlsBagType: e.target.value as any }))}
                                className="w-full px-3 py-3 border-2 border-[#E5DCC5] rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] text-right text-[#8B7355] bg-white"
                                style={{ fontFamily: 'Tajawal, sans-serif' }}
                                dir="rtl"
                              >
                                <option value="">— اختر النوع —</option>
                                <option value="Evening">سهرة</option>
                                <option value="Casual">كاجوال</option>
                              </select>
                            </div>
                          )}
                        </div>
                        {/* 
                          <div>
                            <label className="block text-sm font-medium text-[#8B7355] mb-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                              النوع (Type)
                            </label>
                            <input
                              type="number"
                              value={newProduct.type}
                              onChange={e => setNewProduct(prev => ({ ...prev, type: Number(e.target.value || 0) }))}
                              className="w-full px-3 py-3 border-2 border-[#E5DCC5] rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] text-right text-[#8B7355]"
                              style={{ fontFamily: 'Tajawal, sans-serif' }}
                              dir="rtl"
                            />
                          </div> */}
                        {/* </div> */}

                        {/* Toggles */}
                        <div className="flex flex-wrap gap-6 pt-2">
                          <label className="flex items-center space-x-reverse space-x-3">
                            <input
                              type="checkbox"
                              checked={newProduct.isHidden}
                              onChange={e => setNewProduct(prev => ({ ...prev, isHidden: e.target.checked }))}
                              className="w-5 h-5 rounded"
                            />
                            <span className="text-sm font-medium text-[#8B7355]" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                              مخفي عن العملاء
                            </span>
                          </label>

                          <label className="flex items-center space-x-reverse space-x-3">
                            <input
                              type="checkbox"
                              checked={newProduct.isAvailable}
                              onChange={e => setNewProduct(prev => ({ ...prev, isAvailable: e.target.checked }))}
                              className="w-5 h-5 rounded"
                            />
                            <span className="text-sm font-medium text-[#8B7355]" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                              متاح / متوفر
                            </span>
                          </label>

                          <label className="flex items-center space-x-reverse space-x-3">
                            <input
                              type="checkbox"
                              checked={newProduct.isInstant}
                              onChange={e => setNewProduct(prev => ({ ...prev, isInstant: e.target.checked }))}
                              className="w-5 h-5 rounded"
                            />
                            <span className="text-sm font-medium text-[#8B7355]" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                              منتج فوري
                            </span>
                          </label>

                          {/* <label className="flex items-center space-x-reverse space-x-3">
                            <input
                              type="checkbox"
                              checked={newProduct.isBreakfast}
                              onChange={e => setNewProduct(prev => ({ ...prev, isBreakfast: e.target.checked }))}
                              className="w-5 h-5 rounded"
                            />
                            <span className="text-sm font-medium text-[#8B7355]" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                              بوكس فطار
                            </span>
                          </label> */}

                          {/* <label className="flex items-center space-x-reverse space-x-3">
                            <input
                              type="checkbox"
                              checked={newProduct.isFeatured}
                              onChange={e => setNewProduct(prev => ({ ...prev, isFeatured: e.target.checked }))}
                              className="w-5 h-5 rounded"
                            />
                            <span className="text-sm font-medium text-[#8B7355]" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                              منتج مميز
                            </span>
                          </label> */}
                        </div>

                        {/* Description */}
                        <div>
                          <label className="block text-sm font-medium text-[#8B7355] mb-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                            الوصف
                          </label>
                          <textarea
                            value={newProduct.description}
                            onChange={e => setNewProduct(prev => ({ ...prev, description: e.target.value }))}
                            rows={3}
                            className="w-full px-3 py-3 border-2 border-[#E5DCC5] rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] text-right text-[#8B7355]"
                            style={{ fontFamily: 'Tajawal, sans-serif' }}
                            dir="rtl"
                          />
                        </div>

                        {/* Images */}
                        <div>
                          <label className="block text-sm font-medium text-[#8B7355] mb-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                            صور المنتج
                          </label>
                          <div className="space-y-3">
                            {newProduct.images.map((image, index) => (
                              <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 bg-white rounded-lg border-2 border-[#E5DCC5]">
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={e => handleImageUpload(index, e)}
                                  className="hidden"
                                  id={`image-upload-${index}`}
                                />
                                <label
                                  htmlFor={`image-upload-${index}`}
                                  className="bg-[#F5F5DC] hover:bg-[#E5DCC5] px-4 py-2 rounded-lg cursor-pointer flex items-center space-x-reverse space-x-2 transition-colors text-[#8B7355]"
                                  style={{ fontFamily: 'Tajawal, sans-serif' }}
                                >
                                  <Upload size={16} />
                                  <span className="text-sm">اختر صورة</span>
                                </label>

                                {image && (
                                  <div className="flex items-center space-x-reverse space-x-2">
                                    <img src={image} alt="" className="w-12 h-12 object-cover rounded" />
                                    <span className="text-sm text-green-600" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                                      {image.startsWith('data:image') ? 'تم الرفع' : 'موجودة'}
                                    </span>
                                  </div>
                                )}

                                <button
                                  type="button"
                                  onClick={() => removeImageField(index)}
                                  className="sm:mr-auto text-red-600 hover:text-red-700 text-sm"
                                  style={{ fontFamily: 'Tajawal, sans-serif' }}
                                >
                                  حذف
                                </button>
                              </div>
                            ))}

                            <button
                              type="button"
                              onClick={addImageField}
                              className="text-[#8B7355] hover:text-[#D4AF37] text-sm font-medium"
                              style={{ fontFamily: 'Tajawal, sans-serif' }}
                            >
                              + إضافة صورة أخرى
                            </button>
                          </div>
                        </div>

                        {/* Product Extensions - Only show when EDITING */}
                        {showEditProduct && editingProduct && (
                          <div>
                            <label className="block text-sm font-medium text-[#8B7355] mb-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                              الإضافات المتاحة (Extensions)
                            </label>

                            {/* List of existing extensions */}
                            {productExtensions.length > 0 && (
                              <div className="space-y-2 mb-4">
                                {productExtensions.map((ext) => (
                                  <div
                                    key={ext.id}
                                    className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
                                  >
                                    <div>
                                      <span className="text-sm font-medium text-[#8B7355]" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                                        {ext.name}
                                      </span>
                                      <span className="text-sm text-[#8B7355]/70 mr-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                                        (+{ext.additionalPrice} جنيه)
                                      </span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteExtension(ext.id)}
                                      className="text-red-600 hover:text-red-700 text-sm px-3 py-1"
                                      style={{ fontFamily: 'Tajawal, sans-serif' }}
                                    >
                                      حذف
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Add new extension form */}
                            <div className="p-4 bg-[#F5F5DC] rounded-lg border-2 border-[#E5DCC5]">
                              <h4 className="text-sm font-medium text-[#8B7355] mb-3" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                                إضافة إضافة جديدة
                              </h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                  <input
                                    type="text"
                                    placeholder="اسم الإضافة (مثل: سلسلة ذهبية)"
                                    value={newExtension.name}
                                    onChange={(e) => setNewExtension(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full px-3 py-2 border border-[#E5DCC5] rounded-lg focus:ring-2 focus:ring-[#D4AF37] text-right text-[#8B7355]"
                                    style={{ fontFamily: 'Tajawal, sans-serif' }}
                                    dir="rtl"
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <input
                                    type="number"
                                    placeholder="السعر الإضافي"
                                    value={newExtension.price}
                                    onChange={(e) => setNewExtension(prev => ({ ...prev, price: e.target.value }))}
                                    className="flex-1 px-3 py-2 border border-[#E5DCC5] rounded-lg focus:ring-2 focus:ring-[#D4AF37] text-right text-[#8B7355]"
                                    style={{ fontFamily: 'Tajawal, sans-serif' }}
                                    dir="rtl"
                                    step="0.01"
                                    min="0"
                                  />
                                  <button
                                    type="button"
                                    onClick={handleAddExtension}
                                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors"
                                    style={{ fontFamily: 'Tajawal, sans-serif' }}
                                  >
                                    + إضافة
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Submit Buttons */}
                        <div className="flex justify-end space-x-reverse space-x-3 pt-4">
                          <button
                            type="button"
                            onClick={() => {
                              setShowAddProduct(false);
                              setShowEditProduct(false);
                              setEditingProduct(null);
                              resetProductForm();
                            }}
                            className="px-6 py-2 border-2 border-[#E5DCC5] rounded-lg text-[#8B7355] hover:bg-[#F5F5DC] transition-colors"
                            style={{ fontFamily: 'Tajawal, sans-serif' }}
                          >
                            إلغاء
                          </button>

                          <button
                            type="button"
                            onClick={showAddProduct ? handleAddProduct : handleUpdateProduct}
                            disabled={isLoading || (newProduct.code && checkProductCodeExists(newProduct.code, editingProduct?.id))}
                            className="px-6 py-2 bg-gradient-to-r from-[#8B7355] to-[#A67C52] text-white rounded-lg hover:from-[#6B5644] hover:to-[#8B6644] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                            style={{ fontFamily: 'Tajawal, sans-serif' }}
                          >
                            {isLoading ? 'جار المعالجة...' : showAddProduct ? 'إضافة المنتج' : 'تحديث المنتج'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Products List */}
                  {isLoading && products.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B7355] mx-auto"></div>
                      <p className="mt-4 text-[#8B7355]" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                        جار تحميل المنتجات...
                      </p>
                    </div>
                  ) : products.length === 0 ? (
                    <div className="text-center py-12">
                      <Package size={48} className="mx-auto text-[#C4A57B] mb-4" />
                      <h3 className="text-xl font-semibold text-[#8B7355] mb-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                        لا توجد منتجات
                      </h3>
                      <p className="text-[#8B7355]/70" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                        لا يوجد منتجات في هذا التبويب
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 gap-4">
                        {products.map(product => (
                          <div
                            key={product.id}
                            className="bg-white border-2 border-[#E5DCC5] rounded-lg p-4 hover:shadow-md transition-shadow"
                          >
                            <div className="flex flex-col sm:flex-row gap-4">
                              {/* Product Image */}
                              <div className="w-full sm:w-24 h-24 flex-shrink-0">
                                {product.images && product.images.length > 0 ? (
                                  <img
                                    src={product.images.find(img => img.isMain)?.imagePath || product.images[0]?.imagePath}
                                    alt={product.name}
                                    className="w-full h-full object-cover rounded-lg"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-[#F5F5DC] rounded-lg flex items-center justify-center">
                                    <Package size={32} className="text-[#C4A57B]" />
                                  </div>
                                )}
                              </div>

                              {/* Product Info */}
                              <div className="flex-1">
                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                                  <div>
                                    <h3 className="font-semibold text-lg text-[#8B7355]" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                                      {product.name}
                                    </h3>
                                    <p className="text-sm text-[#8B7355]/70" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                                      الكود: {product.code}
                                    </p>

                                    {!!product.category && (
                                      <p className="text-xs text-[#8B7355]/70 mt-1" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                                        التصنيف: {getCategoryLabel(product.category)}
                                      </p>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-2 flex-wrap">
                                    {!product.isAvailable && (
                                      <span
                                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800"
                                        style={{ fontFamily: 'Tajawal, sans-serif' }}
                                      >
                                        <EyeOff size={12} className="ml-1" />
                                        غير متاح
                                      </span>
                                    )}

                                    {product.isHidden && (
                                      <span
                                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                                        style={{ fontFamily: 'Tajawal, sans-serif' }}
                                      >
                                        <Eye size={12} className="ml-1" />
                                        مخفي
                                      </span>
                                    )}

                                    {product.isInstant && (
                                      <span
                                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800"
                                        style={{ fontFamily: 'Tajawal, sans-serif' }}
                                      >
                                        <Zap size={12} className="ml-1" />
                                        فوري
                                      </span>
                                    )}
                                    {/* 
                                    {product.isBreakfast && (
                                      <span
                                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800"
                                        style={{ fontFamily: 'Tajawal, sans-serif' }}
                                      >
                                        <Coffee size={12} className="ml-1" />
                                        فطار
                                      </span>
                                    )} */}

                                    {product.isFeatured && (
                                      <span
                                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"
                                        style={{ fontFamily: 'Tajawal, sans-serif' }}
                                      >
                                        ⭐ مميز
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-3 text-sm">
                                  <div className="flex items-center gap-1">
                                    <span className="font-semibold text-[#8B7355]" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                                      {product.price} ج.م
                                    </span>
                                    {product.originalPrice && product.originalPrice > product.price && (
                                      <span className="line-through text-[#8B7355]/50" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                                        {product.originalPrice} ج.م
                                      </span>
                                    )}
                                  </div>

                                  {product.rating !== undefined && product.rating > 0 && (
                                    <span className="text-[#8B7355]/70" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                                      ⭐ {product.rating.toFixed(1)}
                                    </span>
                                  )}

                                  {product.salesCount !== undefined && (
                                    <span className="text-[#8B7355]/70" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                                      📦 {product.salesCount} مبيعات
                                    </span>
                                  )}
                                </div>

                                {product.description && (
                                  <p
                                    className="text-sm text-[#8B7355]/70 mt-2 line-clamp-2"
                                    style={{ fontFamily: 'Tajawal, sans-serif' }}
                                  >
                                    {product.description}
                                  </p>
                                )}

                                {/* Action Buttons */}
                                <div className="flex gap-2 mt-3">
                                  <button
                                    onClick={() => handleEditProduct(product)}
                                    disabled={isLoading}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm disabled:opacity-50"
                                    style={{ fontFamily: 'Tajawal, sans-serif' }}
                                  >
                                    <Edit size={16} />
                                    <span>تعديل</span>
                                  </button>

                                  <button
                                    onClick={() => handleDeleteProduct(product.id)}
                                    disabled={isLoading}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm disabled:opacity-50"
                                    style={{ fontFamily: 'Tajawal, sans-serif' }}
                                  >
                                    <Trash2 size={16} />
                                    <span>حذف</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Pagination */}
                      {totalPages > 1 && (
                        <div className="flex justify-center items-center space-x-2 mt-8 space-x-reverse">
                          <button
                            onClick={handlePrevPage}
                            disabled={currentPage === 1 || isLoading}
                            className="flex items-center px-3 py-2 bg-white border-2 border-[#E5DCC5] rounded-lg hover:bg-[#F5F5DC] disabled:bg-[#FAF9F6] disabled:text-[#8B7355]/40 disabled:cursor-not-allowed transition-colors text-[#8B7355]"
                            style={{ fontFamily: 'Tajawal, sans-serif' }}
                          >
                            <ChevronRight size={20} />
                            <span className="mr-1">السابق</span>
                          </button>

                          <div className="flex space-x-1 space-x-reverse">
                            {getPageNumbers().map((page, index) =>
                              page === '...' ? (
                                <span
                                  key={index}
                                  className="px-3 py-2 text-[#8B7355]/50"
                                  style={{ fontFamily: 'Tajawal, sans-serif' }}
                                >
                                  ...
                                </span>
                              ) : (
                                <button
                                  key={index}
                                  onClick={() => handlePageChange(page as number)}
                                  disabled={isLoading}
                                  className={`px-3 py-2 rounded-lg transition-colors ${currentPage === page
                                    ? 'bg-gradient-to-r from-[#8B7355] to-[#A67C52] text-white shadow-md'
                                    : 'bg-white border-2 border-[#E5DCC5] hover:bg-[#F5F5DC] text-[#8B7355]'
                                    } ${isLoading ? 'cursor-not-allowed opacity-50' : ''}`}
                                  style={{ fontFamily: 'Tajawal, sans-serif' }}
                                >
                                  {page}
                                </button>
                              )
                            )}
                          </div>

                          <button
                            onClick={handleNextPage}
                            disabled={currentPage === totalPages || isLoading}
                            className="flex items-center px-3 py-2 bg-white border-2 border-[#E5DCC5] rounded-lg hover:bg-[#F5F5DC] disabled:bg-[#FAF9F6] disabled:text-[#8B7355]/40 disabled:cursor-not-allowed transition-colors text-[#8B7355]"
                            style={{ fontFamily: 'Tajawal, sans-serif' }}
                          >
                            <span className="ml-1">التالي</span>
                            <ChevronLeft size={20} />
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductsManagement;
