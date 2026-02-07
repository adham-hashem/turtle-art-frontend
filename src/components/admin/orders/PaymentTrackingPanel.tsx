import React, { useState, useEffect } from 'react';
import { Plus, CreditCard, DollarSign, Calendar, FileText, AlertCircle, CheckCircle } from 'lucide-react';

interface Payment {
    id: string;
    amount: number;
    paymentType: string;
    paymentDate: string;
    paymentMethod: string;
    reference?: string;
    notes?: string;
    recordedBy?: string;
}

interface Item {
    id: string;
    // other properties if needed
}

interface PaymentTrackingPanelProps {
    orderId: string;
    onPaymentRecorded: () => void; // Callback to refresh order details
}

const PaymentTrackingPanel: React.FC<PaymentTrackingPanelProps> = ({ orderId, onPaymentRecorded }) => {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalPaid, setTotalPaid] = useState(0);
    const [showAddModal, setShowAddModal] = useState(false);

    // New Payment Form State
    const [amount, setAmount] = useState('');
    const [paymentType, setPaymentType] = useState('Payment');
    const [paymentMethod, setPaymentMethod] = useState('Cash');
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
    const [reference, setReference] = useState('');
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const apiUrl = import.meta.env.VITE_API_BASE_URL;

    const fetchPayments = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(`${apiUrl}/api/orders/${orderId}/payments`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setPayments(data.payments);
                setTotalPaid(data.totalPaid);
            }
        } catch (err) {
            console.error('Failed to fetch payments', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (orderId) {
            fetchPayments();
        }
    }, [orderId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const token = localStorage.getItem('accessToken');
            const payload = {
                orderId,
                amount: parseFloat(amount),
                paymentType,
                paymentDate,
                paymentMethod,
                reference,
                notes
            };

            const response = await fetch(`${apiUrl}/api/orders/${orderId}/payments`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                setShowAddModal(false);
                setAmount('');
                setNotes('');
                setReference('');
                fetchPayments(); // Refresh local list
                onPaymentRecorded(); // Refresh parent order status
            }
        } catch (err) {
            console.error('Failed to record payment', err);
        } finally {
            setSubmitting(false);
        }
    };

    const getPaymentTypeColor = (type: string) => {
        switch (type) {
            case 'Payment': return 'text-green-600 bg-green-50';
            case 'Refund': return 'text-red-600 bg-red-50';
            case 'Deposit': return 'text-blue-600 bg-blue-50';
            default: return 'text-gray-600 bg-gray-50';
        }
    };

    if (loading) return <div className="p-4 text-center">جاري تحميل المدفوعات...</div>;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h3 className="font-bold text-lg flex items-center" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    <CreditCard className="w-5 h-5 ml-2 text-primary-green" />
                    تتبع المدفوعات
                </h3>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="bg-primary-green text-white px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-primary-green-dark transition-colors flex items-center"
                    style={{ fontFamily: 'Tajawal, sans-serif' }}
                >
                    <Plus className="w-4 h-4 ml-1" />
                    تسجيل دفعة
                </button>
            </div>

            <div className="p-4">
                {/* Summary Cards */}
                <div className="bg-green-50 rounded-xl p-4 mb-6 border border-green-100">
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="text-sm text-green-600 mb-1" style={{ fontFamily: 'Tajawal, sans-serif' }}>إجمالي المدفوع</p>
                            <p className="text-2xl font-bold text-green-800">{totalPaid.toLocaleString()} EGP</p>
                        </div>
                        <div className="h-10 w-10 bg-green-200 rounded-full flex items-center justify-center text-green-700">
                            <DollarSign className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                {/* Payments List */}
                {payments.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        <p style={{ fontFamily: 'Tajawal, sans-serif' }}>لا توجد مدفوعات مسجلة</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {payments.map((payment) => (
                            <div key={payment.id} className="border border-gray-100 rounded-xl p-3 hover:shadow-sm transition-shadow">
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`px-2 py-1 rounded-md text-xs font-semibold ${getPaymentTypeColor(payment.paymentType)}`}>
                                        {payment.paymentType}
                                    </span>
                                    <span className="font-bold text-lg">{payment.amount.toLocaleString()} EGP</span>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                                    <div className="flex items-center">
                                        <Calendar className="w-3 h-3 ml-1" />
                                        {new Date(payment.paymentDate).toLocaleDateString()}
                                    </div>
                                    <div className="flex items-center">
                                        <CreditCard className="w-3 h-3 ml-1" />
                                        {payment.paymentMethod}
                                    </div>
                                    {payment.reference && (
                                        <div className="col-span-2 flex items-center text-gray-500 text-xs">
                                            <FileText className="w-3 h-3 ml-1" />
                                            مرجع: {payment.reference}
                                        </div>
                                    )}
                                </div>
                                {payment.notes && (
                                    <p className="text-xs text-gray-500 mt-2 p-2 bg-gray-50 rounded-lg">
                                        {payment.notes}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add Payment Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
                        <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                            <h3 className="font-bold text-lg" style={{ fontFamily: 'Tajawal, sans-serif' }}>تسجيل دفعة جديدة</h3>
                            <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">×</button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1 text-right" style={{ fontFamily: 'Tajawal, sans-serif' }}>المبلغ</label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    step="0.01"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 text-right"
                                    dir="rtl"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1 text-right" style={{ fontFamily: 'Tajawal, sans-serif' }}>نوع العملية</label>
                                    <select
                                        value={paymentType}
                                        onChange={(e) => setPaymentType(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 text-right"
                                        dir="rtl"
                                    >
                                        <option value="Payment">دفع</option>
                                        <option value="Deposit">عربون</option>
                                        <option value="Refund">استرجاع</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1 text-right" style={{ fontFamily: 'Tajawal, sans-serif' }}>طريقة الدفع</label>
                                    <select
                                        value={paymentMethod}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 text-right"
                                        dir="rtl"
                                    >
                                        <option value="Cash">كاش</option>
                                        <option value="Visa">فيزا</option>
                                        <option value="InstaPay">إنستا باي</option>
                                        <option value="VodafoneCash">فودافون كاش</option>
                                        <option value="BankTransfer">تحويل بنكي</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1 text-right" style={{ fontFamily: 'Tajawal, sans-serif' }}>تاريخ الدفع</label>
                                <input
                                    type="date"
                                    required
                                    value={paymentDate}
                                    onChange={(e) => setPaymentDate(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 text-right"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1 text-right" style={{ fontFamily: 'Tajawal, sans-serif' }}>رقم مرجعي (اختياري)</label>
                                <input
                                    type="text"
                                    value={reference}
                                    onChange={(e) => setReference(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 text-right"
                                    dir="rtl"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1 text-right" style={{ fontFamily: 'Tajawal, sans-serif' }}>ملاحظات</label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 text-right h-20"
                                    dir="rtl"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full bg-primary-green text-black font-bold py-3 rounded-xl hover:bg-primary-green-dark transition-colors shadow-md disabled:opacity-50"
                                style={{ fontFamily: 'Tajawal, sans-serif' }}
                            >
                                {submitting ? 'جاري الحفظ...' : 'حفظ العملية'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PaymentTrackingPanel;
