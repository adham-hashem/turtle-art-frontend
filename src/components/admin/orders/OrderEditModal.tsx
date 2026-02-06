import React, { useState, useEffect } from 'react';
import { X, Save, Trash2, AlertCircle, RefreshCw, Plus, Minus } from 'lucide-react';


interface OrderItem {
    id: string;
    productName: string;
    quantity: number;
    priceAtPurchase: number;
    size: string;
    color: string;
    selectedExtensions?: string;
    shouldDelete?: boolean;
}

interface OrderEditModalProps {
    order: any; // Using any for now to match parent's loose type or define interface properly
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
}

const OrderEditModal: React.FC<OrderEditModalProps> = ({ order, isOpen, onClose, onSave }) => {
    // const { token } = useAuth(); // Unused, using localStorage directly
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form State
    const [fullName, setFullName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [address, setAddress] = useState('');
    const [governorate, setGovernorate] = useState('');
    const [items, setItems] = useState<OrderItem[]>([]);
    // const [status, setStatus] = useState<number>(0); // Unused

    const apiUrl = import.meta.env.VITE_API_BASE_URL;

    useEffect(() => {
        if (order) {
            setFullName(order.fullName || '');
            setPhoneNumber(order.phoneNumber || '');
            setAddress(order.address || '');
            setGovernorate(order.governorate || '');
            // setStatus(order.status);

            // Map items
            if (order.items) {
                setItems(order.items.map((item: any) => ({
                    id: item.id,
                    productName: item.productName,
                    quantity: item.quantity,
                    priceAtPurchase: item.priceAtPurchase,
                    size: item.size,
                    color: item.color,
                    selectedExtensions: item.selectedExtensions,
                    shouldDelete: false
                })));
            }
        }
    }, [order]);

    const handleRemoveItem = (itemId: string) => {
        setItems(prev => prev.map(item =>
            item.id === itemId ? { ...item, shouldDelete: !item.shouldDelete } : item
        ));
    };

    const handleUpdateQuantity = (itemId: string, newQuantity: number) => {
        if (newQuantity < 1) return; // Prevent quantity less than 1
        setItems(prev => prev.map(item =>
            item.id === itemId ? { ...item, quantity: newQuantity } : item
        ));
    };

    const handleSave = async () => {
        setLoading(true);
        setError(null);

        try {
            const payload = {
                orderId: order.id,
                fullName,
                phoneNumber,
                address,
                governorate,
                // Send all items so backend can detect changes (quantity updates) and deletions
                items: items
            };

            const response = await fetch(`${apiUrl}/api/orders/${order.id}/edit`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error('Failed to update order');
            }

            onSave(); // Refresh parent
            onClose();
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
                        تعديل الطلب #{order?.orderNumber}
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
                            <label className="block text-sm font-medium text-gray-700 mb-1 text-right" style={{ fontFamily: 'Tajawal, sans-serif' }}>الاسم</label>
                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-right"
                                style={{ fontFamily: 'Tajawal, sans-serif' }}
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
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1 text-right" style={{ fontFamily: 'Tajawal, sans-serif' }}>العنوان</label>
                            <input
                                type="text"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-right"
                                style={{ fontFamily: 'Tajawal, sans-serif' }}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 text-right" style={{ fontFamily: 'Tajawal, sans-serif' }}>المحافظة</label>
                            <input
                                type="text"
                                value={governorate}
                                onChange={(e) => setGovernorate(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-right"
                                style={{ fontFamily: 'Tajawal, sans-serif' }}
                            />
                        </div>
                    </div>

                    <div className="border-t border-gray-100 pt-6"></div>

                    {/* Order Items */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4 text-right" style={{ fontFamily: 'Tajawal, sans-serif' }}>المنتجات</h3>
                        <div className="space-y-3">
                            {items.map((item) => (
                                <div
                                    key={item.id}
                                    className={`flex items-center justify-between p-4 rounded-xl border ${item.shouldDelete ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'
                                        }`}
                                >
                                    <div className="flex-1 text-right">
                                        <p className={`font-medium ${item.shouldDelete ? 'text-red-700 line-through' : 'text-gray-900'}`} style={{ fontFamily: 'Tajawal, sans-serif' }}>
                                            {item.productName}
                                        </p>

                                        <div className="flex items-center gap-3 mt-1">
                                            <div className="text-sm text-gray-500">
                                                {item.priceAtPurchase.toLocaleString()} EGP
                                                {item.size && ` | الحجم: ${item.size}`}
                                            </div>

                                            {/* Quantity Controls */}
                                            <div className={`flex items-center bg-gray-50 rounded-lg border border-gray-200 ${item.shouldDelete ? 'opacity-50 pointer-events-none' : ''}`}>
                                                <button
                                                    onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                                                    className="p-1 hover:bg-white hover:shadow-sm rounded transition-all text-green-600"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                </button>
                                                <span className="w-8 text-center font-medium text-gray-700">{item.quantity}</span>
                                                <button
                                                    onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                                                    className="p-1 hover:bg-white hover:shadow-sm rounded transition-all text-red-600 disabled:opacity-50"
                                                    disabled={item.quantity <= 1}
                                                >
                                                    <Minus className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleRemoveItem(item.id)}
                                        className={`p-2 rounded-lg transition-colors ${item.shouldDelete
                                            ? 'text-red-600 bg-red-100 hover:bg-red-200'
                                            : 'text-gray-400 hover:text-red-500 hover:bg-gray-100'
                                            }`}
                                        title={item.shouldDelete ? "تراجع عن الحذف" : "حذف المنتج"}
                                    >
                                        {item.shouldDelete ? <RefreshCw className="h-5 w-5" /> : <Trash2 className="h-5 w-5" />}
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
                        className="flex-1 px-6 py-3 bg-primary-green text-black font-semibold rounded-xl hover:bg-primary-green-dark transition-colors flex items-center justify-center shadow-sm"
                        style={{ fontFamily: 'Tajawal, sans-serif' }}
                    >
                        {loading ? (
                            <span className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin ml-2"></span>
                        ) : (
                            <Save className="h-5 w-5 ml-2" />
                        )}
                        حفظ التعديلات
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OrderEditModal;
