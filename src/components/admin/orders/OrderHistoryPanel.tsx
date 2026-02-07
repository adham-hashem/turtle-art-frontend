import React, { useState, useEffect } from 'react';
import { History, Clock, ArrowLeft, Activity } from 'lucide-react';

interface HistoryItem {
    id: string;
    orderId: string;
    changedBy: string;
    changeType: string;
    oldValue?: string;
    newValue?: string;
    description?: string;
    timestamp: string;
}

interface OrderHistoryPanelProps {
    orderId: string;
}

const OrderHistoryPanel: React.FC<OrderHistoryPanelProps> = ({ orderId }) => {
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [loading, setLoading] = useState(true);

    const apiUrl = import.meta.env.VITE_API_BASE_URL;

    const fetchHistory = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(`${apiUrl}/api/orders/${orderId}/history`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setHistory(data);
            }
        } catch (err) {
            console.error('Failed to fetch history', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (orderId) fetchHistory();
    }, [orderId]);

    const getChangeIcon = (type: string) => {
        // You can map change types to specific icons here if desired
        return <Activity className="w-4 h-4 text-purple-500" />;
    };

    const formatChangeType = (type: string) => {
        if (!type) return 'Unknown Change';
        return String(type).replace(/([A-Z])/g, ' $1').trim();
    };

    if (loading) return <div className="p-4 text-center text-gray-400">جاري تحميل السجل...</div>;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden h-full">
            <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                <h3 className="font-bold text-lg flex items-center" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    <History className="w-5 h-5 ml-2 text-purple-600" />
                    سجل التغييرات
                </h3>
            </div>

            <div className="p-4 overflow-y-auto max-h-[400px]">
                {history.length === 0 ? (
                    <div className="text-center text-gray-400 py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        لا يوجد سجل تغييرات
                    </div>
                ) : (
                    <div className="relative border-r border-gray-200 mr-2 space-y-6">
                        {history.map((item, index) => (
                            <div key={item.id} className="relative pr-6">
                                {/* Timeline Dot */}
                                <div className="absolute top-1 -right-1.5 w-3 h-3 bg-purple-500 rounded-full border-2 border-white ring-2 ring-purple-100"></div>

                                <div className="flex flex-col space-y-1">
                                    <div className="flex justify-between items-start">
                                        <span className="text-sm font-semibold text-gray-800">{formatChangeType(item.changeType)}</span>
                                        <span className="text-xs text-gray-400 flex items-center dir-ltr">
                                            {new Date(item.timestamp).toLocaleString()}
                                            <Clock className="w-3 h-3 ml-1" />
                                        </span>
                                    </div>

                                    <p className="text-xs text-gray-400">بواسطة: {item.changedBy || 'Admin'}</p>

                                    {item.description && (
                                        <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded-lg mt-1 border border-gray-100">
                                            {item.description}
                                        </p>
                                    )}

                                    {(item.oldValue || item.newValue) && (
                                        <div className="flex items-center gap-2 mt-2 text-xs bg-purple-50 p-2 rounded-lg text-purple-900 border border-purple-100">
                                            {item.oldValue && (
                                                <span className="line-through opacity-70 bg-white px-1 rounded border border-purple-100">{item.oldValue}</span>
                                            )}
                                            {item.oldValue && item.newValue && <ArrowLeft className="w-3 h-3 mx-1" />}
                                            {item.newValue && (
                                                <span className="font-bold bg-white px-1 rounded border border-purple-100">{item.newValue}</span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrderHistoryPanel;
