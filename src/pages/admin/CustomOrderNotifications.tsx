import { useState, useEffect } from 'react';
import axios from 'axios';

interface CustomOrderNotification {
    id: string;
    customOrderId: string;
    title: string;
    body: string;
    sentAt: string;
    success: boolean;
    errorMessage: string;
    isRead: boolean;
}

interface PaginatedResult {
    items: CustomOrderNotification[];
    totalItems: number;
    pageNumber: number;
    pageSize: number;
}

const CustomOrderNotifications = () => {
    const [notifications, setNotifications] = useState<CustomOrderNotification[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const pageSize = 20;

    const fetchNotifications = async (page: number) => {
        setLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem('token');
            const response = await axios.get<PaginatedResult>(
                `http://localhost:5024/api/custom-order-notifications?pageNumber=${page}&pageSize=${pageSize}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            setNotifications(response.data.items);
            setTotalPages(Math.ceil(response.data.totalItems / pageSize));
            setLoading(false);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load notifications');
            setLoading(false);
        }
    };

    const markAsRead = async (notificationId: string) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(
                `http://localhost:5024/api/custom-order-notifications/${notificationId}/mark-read`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            // Update local state
            setNotifications(prev =>
                prev.map(n => (n.id === notificationId ? { ...n, isRead: true } : n))
            );
        } catch (err) {
            console.error('Failed to mark notification as read:', err);
        }
    };

    useEffect(() => {
        fetchNotifications(pageNumber);
    }, [pageNumber]);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(date);
    };

    if (loading && notifications.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Custom Order Notifications
                </h1>
                <p className="text-gray-600">
                    View all notifications sent for custom design orders
                </p>
            </div>

            {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
                    <p className="text-red-700">{error}</p>
                </div>
            )}

            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                {notifications.length === 0 ? (
                    <div className="text-center py-12">
                        <svg
                            className="mx-auto h-12 w-12 text-gray-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                            />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">
                            No notifications
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                            No custom order notifications have been sent yet.
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-200">
                        {notifications.map((notification) => (
                            <div
                                key={notification.id}
                                className={`p-6 hover:bg-gray-50 transition-colors ${!notification.isRead ? 'bg-blue-50' : ''
                                    }`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-lg font-semibold text-gray-900">
                                                {notification.title}
                                            </h3>
                                            {!notification.isRead && (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                    New
                                                </span>
                                            )}
                                            {notification.success ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    ✓ Sent
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                    ✗ Failed
                                                </span>
                                            )}
                                        </div>

                                        <p className="text-gray-700 mb-2">{notification.body}</p>

                                        {!notification.success && notification.errorMessage && (
                                            <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
                                                <p className="text-sm text-red-700">
                                                    <span className="font-medium">Error:</span>{' '}
                                                    {notification.errorMessage}
                                                </p>
                                            </div>
                                        )}

                                        <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                                            <span className="flex items-center gap-1">
                                                <svg
                                                    className="h-4 w-4"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                                    />
                                                </svg>
                                                {formatDate(notification.sentAt)}
                                            </span>
                                            <span className="text-gray-400">•</span>
                                            <span className="text-gray-600">
                                                Order ID: {notification.customOrderId.slice(0, 8)}...
                                            </span>
                                        </div>
                                    </div>

                                    {!notification.isRead && (
                                        <button
                                            onClick={() => markAsRead(notification.id)}
                                            className="ml-4 text-sm text-blue-600 hover:text-blue-800 font-medium"
                                        >
                                            Mark as read
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between">
                    <button
                        onClick={() => setPageNumber(prev => Math.max(1, prev - 1))}
                        disabled={pageNumber === 1}
                        className="px-4 py-2 border border-gray-300 rounded-md bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Previous
                    </button>

                    <span className="text-sm text-gray-700">
                        Page {pageNumber} of {totalPages}
                    </span>

                    <button
                        onClick={() => setPageNumber(prev => Math.min(totalPages, prev + 1))}
                        disabled={pageNumber === totalPages}
                        className="px-4 py-2 border border-gray-300 rounded-md bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
};

export default CustomOrderNotifications;
