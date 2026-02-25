import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, RefreshCw, Plus, Minus, Trash2 } from 'lucide-react';

interface OrderItem {
    productId: string;
    productName: string;
    quantity: number;
    priceAtPurchase: number;
    size: string;
    color: string;
}

interface OrderCreateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
}

const OrderCreateModal: React.FC<OrderCreateModalProps> = ({ isOpen, onClose, onSave }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form State
    const [fullName, setFullName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [address, setAddress] = useState('');
    const [governorate, setGovernorate] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<number>(0); // 0: InstaPay, 1: VodafoneCash, 2: Online
    const [initialDeposit, setInitialDeposit] = useState<number>(0);
    const [items, setItems] = useState<OrderItem[]>([]);

    // Product Search State
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
    const [newItemQty, setNewItemQty] = useState(1);
    const [newItemSize, setNewItemSize] = useState('');
    const [newItemColor, setNewItemColor] = useState('');
    const [showSearch, setShowSearch] = useState(false);

    const apiUrl = import.meta.env.VITE_API_BASE_URL;
    const [shippingFees, setShippingFees] = useState<any[]>([]);

    useEffect(() => {
        const fetchShippingFees = async () => {
            try {
                const response = await fetch(`${apiUrl}/api/shipping-fees?pageNumber=1&pageSize=100`);
                if (response.ok) {
                    const data = await response.json();
                    setShippingFees(data.items || []);
                }
            } catch (err) {
                console.error("Failed to fetch shipping fees", err);
            }
        };
        fetchShippingFees();
    }, [apiUrl]);

    const handleSearch = async (val: string) => {
        setSearchTerm(val);
        if (val.length < 2) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const response = await fetch(`${apiUrl}/api/products?pageNumber=1&pageSize=10&searchTerm=${encodeURIComponent(val)}`);
            if (response.ok) {
                const data = await response.json();
                setSearchResults(data.items || []);
            }
        } catch (err) {
            console.error("Search failed", err);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSelectProduct = (product: any) => {
        setSelectedProduct(product);
        setNewItemQty(1);
        setNewItemSize(product.sizes?.[0] || '');
        setNewItemColor(product.colors?.[0] || '');
        setSearchResults([]);
        setSearchTerm('');
    };

    const handleAddProduct = () => {
        if (!selectedProduct) return;

        const newItem: OrderItem = {
            productId: selectedProduct.id,
            productName: selectedProduct.name,
            quantity: newItemQty,
            priceAtPurchase: selectedProduct.price,
            size: newItemSize,
            color: newItemColor,
        };

        setItems(prev => [...prev, newItem]);
        setSelectedProduct(null);
        setShowSearch(false);
    };

    const handleRemoveItem = (index: number) => {
        setItems(prev => prev.filter((_, i) => i !== index));
    };

    const handleUpdateQuantity = (index: number, newQuantity: number) => {
        if (newQuantity < 1) return;
        setItems(prev => prev.map((item, i) =>
            i === index ? { ...item, quantity: newQuantity } : item
        ));
    };

    const handleSave = async () => {
        if (!fullName || !phoneNumber || !address || !governorate || items.length === 0) {
            setError('يرجى ملء جميع البيانات وإضافة منتج واحد على الأقل');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const payload = {
                fullName,
                phoneNumber,
                address,
                governorate,
                paymentMethod,
                initialDeposit,
                items: items.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity,
                    size: item.size,
                    color: item.color
                }))
            };

            const response = await fetch(`${apiUrl}/api/orders`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(errorData || 'Failed to create order');
            }

            onSave();
            onClose();
            // Reset form
            setFullName('');
            setPhoneNumber('');
            setAddress('');
            setGovernorate('');
            setItems([]);
            setInitialDeposit(0);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
                    <h2 className="text-xl font-bold text-gray-800" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                        إنشاء طلب جديد (يدوي)
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="h-5 w-5 text-gray-500" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center mb-4">
                            <AlertCircle className="h-5 w-5 ml-2" />
                            {error}
                        </div>
                    )}

                    {/* Customer Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 text-right" style={{ fontFamily: 'Tajawal, sans-serif' }}>الاسم الكامل</label>
                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-right"
                                style={{ fontFamily: 'Tajawal, sans-serif' }}
                                placeholder="اسم العميل"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 text-right" style={{ fontFamily: 'Tajawal, sans-serif' }}>رقم الهاتف</label>
                            <input
                                type="text"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-right"
                                style={{ fontFamily: 'Tajawal, sans-serif' }}
                                placeholder="01XXXXXXXXX"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1 text-right" style={{ fontFamily: 'Tajawal, sans-serif' }}>العنوان بالتفصيل</label>
                            <input
                                type="text"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-right"
                                style={{ fontFamily: 'Tajawal, sans-serif' }}
                                placeholder="الشارع، الدور، العلامة المميزة"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 text-right" style={{ fontFamily: 'Tajawal, sans-serif' }}>المحافظة</label>
                            <select
                                value={governorate}
                                onChange={(e) => setGovernorate(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-right"
                                style={{ fontFamily: 'Tajawal, sans-serif' }}
                            >
                                <option value="">اختر المحافظة</option>
                                {shippingFees.map((fee: any) => (
                                    <option key={fee.id} value={fee.governorate}>
                                        {fee.governorate} ({fee.fee} ج.م)
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 text-right" style={{ fontFamily: 'Tajawal, sans-serif' }}>طريقة الدفع</label>
                            <select
                                value={paymentMethod}
                                onChange={(e) => setPaymentMethod(Number(e.target.value))}
                                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-right"
                                style={{ fontFamily: 'Tajawal, sans-serif' }}
                            >
                                <option value={0}>InstaPay</option>
                                <option value={1}>Vodafone Cash</option>
                                <option value={2}>Online Payment</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 text-right" style={{ fontFamily: 'Tajawal, sans-serif' }}>الإيداع المبدئي (اختياري)</label>
                            <input
                                type="number"
                                value={initialDeposit}
                                onChange={(e) => setInitialDeposit(Number(e.target.value))}
                                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-right font-bold text-green-600"
                                style={{ fontFamily: 'Tajawal, sans-serif' }}
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    <div className="border-t border-gray-100 pt-6"></div>

                    {/* Order Items */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <button
                                onClick={() => setShowSearch(!showSearch)}
                                className="text-sm bg-green-50 text-green-600 px-3 py-1.5 rounded-lg border border-green-100 hover:bg-green-100 transition-colors flex items-center"
                                style={{ fontFamily: 'Tajawal, sans-serif' }}
                            >
                                <Plus size={16} className="ml-1" />
                                إضافة منتج
                            </button>
                            <h3 className="text-lg font-semibold text-right" style={{ fontFamily: 'Tajawal, sans-serif' }}>المنتجات المختارة</h3>
                        </div>

                        {/* Search & Add UI */}
                        {showSearch && (
                            <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                                {!selectedProduct ? (
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="ابحث عن منتج بالاسم أو الكود..."
                                            value={searchTerm}
                                            onChange={(e) => handleSearch(e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 text-right"
                                            dir="rtl"
                                            style={{ fontFamily: 'Tajawal, sans-serif' }}
                                        />
                                        {isSearching && (
                                            <div className="absolute left-3 top-2.5">
                                                <RefreshCw className="h-5 w-5 text-gray-400 animate-spin" />
                                            </div>
                                        )}
                                        {searchResults.length > 0 && (
                                            <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                                                {searchResults.map((p) => (
                                                    <button
                                                        key={p.id}
                                                        onClick={() => handleSelectProduct(p)}
                                                        className="w-full p-3 text-right hover:bg-gray-50 border-b border-gray-50 last:border-0 flex items-center justify-between"
                                                    >
                                                        <span className="text-green-600 font-bold">{p.price} ج.م</span>
                                                        <span className="text-gray-800">{p.name}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-100">
                                            <button onClick={() => setSelectedProduct(null)} className="text-red-500 hover:text-red-600 text-xs">تغيير المنتج</button>
                                            <span className="font-bold text-gray-800">{selectedProduct.name}</span>
                                        </div>

                                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                            <div>
                                                <label className="block text-[10px] text-gray-500 mb-1 text-right">الكمية</label>
                                                <input
                                                    type="number"
                                                    value={newItemQty}
                                                    onChange={(e) => setNewItemQty(Math.max(1, parseInt(e.target.value) || 1))}
                                                    className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-center"
                                                />
                                            </div>
                                            {selectedProduct.sizes?.length > 0 && (
                                                <div>
                                                    <label className="block text-[10px] text-gray-500 mb-1 text-right">المقاس</label>
                                                    <select
                                                        value={newItemSize}
                                                        onChange={(e) => setNewItemSize(e.target.value)}
                                                        className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-right text-sm"
                                                        dir="rtl"
                                                    >
                                                        {selectedProduct.sizes.map((s: string) => <option key={s} value={s}>{s}</option>)}
                                                    </select>
                                                </div>
                                            )}
                                            {selectedProduct.colors?.length > 0 && (
                                                <div>
                                                    <label className="block text-[10px] text-gray-500 mb-1 text-right">اللون</label>
                                                    <select
                                                        value={newItemColor}
                                                        onChange={(e) => setNewItemColor(e.target.value)}
                                                        className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-right text-sm"
                                                        dir="rtl"
                                                    >
                                                        {selectedProduct.colors.map((c: string) => <option key={c} value={c}>{c}</option>)}
                                                    </select>
                                                </div>
                                            )}
                                            <div className="flex items-end">
                                                <button
                                                    onClick={handleAddProduct}
                                                    className="w-full bg-green-500 text-white px-3 py-1.5 rounded-lg hover:bg-green-600 transition-colors text-sm font-bold"
                                                    style={{ fontFamily: 'Tajawal, sans-serif' }}
                                                >
                                                    إضافة للطلب
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="space-y-3">
                            {items.length === 0 && (
                                <p className="text-center text-gray-400 py-4" style={{ fontFamily: 'Tajawal, sans-serif' }}>لم يتم إضافة منتجات بعد</p>
                            )}
                            {items.map((item, index) => (
                                <div
                                    key={`item-${index}`}
                                    className="flex items-center justify-between p-4 rounded-xl border bg-white border-gray-200"
                                >
                                    <div className="flex-1 text-right">
                                        <p className="font-medium text-gray-900" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                                            {item.productName}
                                        </p>
                                        <div className="flex items-center gap-3 mt-1">
                                            <div className="text-sm text-gray-500">
                                                {item.priceAtPurchase.toLocaleString()} ج.م
                                                {item.size && ` | المقاس: ${item.size}`}
                                                {item.color && ` | اللون: ${item.color}`}
                                            </div>
                                            <div className="flex items-center bg-gray-50 rounded-lg border border-gray-200">
                                                <button
                                                    onClick={() => handleUpdateQuantity(index, item.quantity + 1)}
                                                    className="p-1 hover:bg-white hover:shadow-sm rounded transition-all text-green-600"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                </button>
                                                <span className="w-8 text-center font-medium text-gray-700">{item.quantity}</span>
                                                <button
                                                    onClick={() => handleUpdateQuantity(index, item.quantity - 1)}
                                                    disabled={item.quantity <= 1}
                                                    className="p-1 hover:bg-white hover:shadow-sm rounded transition-all text-red-600 disabled:opacity-30"
                                                >
                                                    <Minus className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleRemoveItem(index)}
                                        className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-gray-100 transition-colors"
                                    >
                                        <Trash2 className="h-5 w-5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-3 sticky bottom-0 rounded-b-2xl">
                    <button
                        onClick={onClose}
                        className="flex-1 px-6 py-3 bg-white text-gray-700 font-semibold rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
                        style={{ fontFamily: 'Tajawal, sans-serif' }}
                    >
                        إلغاء
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="flex-1 px-6 py-3 bg-primary-green text-white font-semibold rounded-xl hover:bg-primary-green-dark transition-colors flex items-center justify-center shadow-sm"
                        style={{ fontFamily: 'Tajawal, sans-serif' }}
                    >
                        {loading ? (
                            <span className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin ml-2"></span>
                        ) : (
                            <Save className="h-5 w-5 ml-2" />
                        )}
                        إنشاء الطلب
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OrderCreateModal;
