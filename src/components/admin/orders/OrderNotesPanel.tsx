import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, User, Lock, Eye } from 'lucide-react';

interface Note {
    id: string;
    noteText: string;
    isCustomerVisible: boolean;
    createdAt: string;
    adminName?: string;
}

interface OrderNotesPanelProps {
    orderId: string;
}

const OrderNotesPanel: React.FC<OrderNotesPanelProps> = ({ orderId }) => {
    const [notes, setNotes] = useState<Note[]>([]);
    const [newNote, setNewNote] = useState('');
    const [isPublic, setIsPublic] = useState(false);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const apiUrl = import.meta.env.VITE_API_BASE_URL;

    const fetchNotes = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(`${apiUrl}/api/orders/${orderId}/notes`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setNotes(data);
            }
        } catch (err) {
            console.error('Failed to fetch notes', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (orderId) fetchNotes();
    }, [orderId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newNote.trim()) return;

        setSubmitting(true);
        try {
            const token = localStorage.getItem('accessToken');
            const payload = {
                orderId,
                noteText: newNote,
                isCustomerVisible: isPublic
            };

            const response = await fetch(`${apiUrl}/api/orders/${orderId}/notes`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                setNewNote('');
                fetchNotes();
            }
        } catch (err) {
            console.error('Failed to add note', err);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden h-full flex flex-col">
            <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                <h3 className="font-bold text-lg flex items-center" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    <MessageSquare className="w-5 h-5 ml-2 text-blue-500" />
                    الملاحظات
                </h3>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">{notes.length}</span>
            </div>

            <div className="flex-1 p-4 overflow-y-auto max-h-[400px] space-y-4">
                {loading ? (
                    <div className="text-center text-gray-400 py-4">جاري التحميل...</div>
                ) : notes.length === 0 ? (
                    <div className="text-center text-gray-400 py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        لا توجد ملاحظات بعد
                    </div>
                ) : (
                    notes.map((note) => (
                        <div key={note.id} className={`p-3 rounded-xl border ${note.isCustomerVisible ? 'bg-blue-50 border-blue-100' : 'bg-yellow-50 border-yellow-100'}`}>
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center text-xs text-gray-500">
                                    <User className="w-3 h-3 ml-1" />
                                    {/* Assuming admin name might be returned or just generic */}
                                    Admin
                                    <span className="mx-2">•</span>
                                    {new Date(note.createdAt).toLocaleString()}
                                </div>
                                {note.isCustomerVisible ? (
                                    <span className="flex items-center text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full" title="مرئي للعميل">
                                        <Eye className="w-3 h-3 ml-1" /> مرئي
                                    </span>
                                ) : (
                                    <span className="flex items-center text-xs text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded-full" title="ملاحظة داخلية">
                                        <Lock className="w-3 h-3 ml-1" /> خاص
                                    </span>
                                )}
                            </div>
                            <p className="text-gray-800 text-sm whitespace-pre-wrap">{note.noteText}</p>
                        </div>
                    ))
                )}
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50">
                <form onSubmit={handleSubmit}>
                    <textarea
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        placeholder="اكتب ملاحظة..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-right min-h-[80px] mb-2 resize-none"
                        dir="rtl"
                    />
                    <div className="flex justify-between items-center">
                        <button
                            type="button"
                            onClick={() => setIsPublic(!isPublic)}
                            className={`text-sm flex items-center px-3 py-1.5 rounded-lg transition-colors ${isPublic ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-600'
                                }`}
                        >
                            {isPublic ? (
                                <><Eye className="w-4 h-4 ml-1" /> مرئي للعميل</>
                            ) : (
                                <><Lock className="w-4 h-4 ml-1" /> ملاحظة داخلية</>
                            )}
                        </button>

                        <button
                            type="submit"
                            disabled={submitting || !newNote.trim()}
                            className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Send className="w-4 h-4 ml-2" />
                            إضافة
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default OrderNotesPanel;
