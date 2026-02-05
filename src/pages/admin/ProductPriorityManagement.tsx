
import { useState, useEffect } from 'react';
import { Search, Loader2, ChevronDown, ChevronRight, Edit2, AlertCircle, Save } from 'lucide-react';
import { Product } from '../../types';

interface PriorityGroup {
    priority: number;
    products: Product[];
    isOpen: boolean;
}

const ProductPriorityManagement = () => {
    const [loading, setLoading] = useState(true);
    // Removed unused 'priorities' state
    const [priorityGroups, setPriorityGroups] = useState<PriorityGroup[]>([]);
    const [stats, setStats] = useState<{ min: number; max: number }>({ min: 0, max: 0 });
    const [searchTerm, setSearchTerm] = useState('');

    // Edit state
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState<number>(0);
    const [updating, setUpdating] = useState(false);

    const apiUrl = import.meta.env.VITE_API_BASE_URL;

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('accessToken');

            // 1. Fetch priority values
            const prioritiesRes = await fetch(`${apiUrl}/api/products/priorities`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // 2. Fetch stats
            const statsRes = await fetch(`${apiUrl}/api/products/priorities/range`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!prioritiesRes.ok || !statsRes.ok) throw new Error('Failed to fetch priority data');

            const prioritiesData = await prioritiesRes.json();
            const statsData = await statsRes.json();

            // setPriorities(prioritiesData); // Removed unused state update
            setStats(statsData);

            // 3. Fetch products for each priority (initial load could be optimized to load on demand, 
            // but for management overview usually we want to see everything or at least the structure)
            // For a better UX, we'll initialize groups and fetch content when expanded or fetch all if not too many.
            // Let's fetch all relevant products for visible priorities to allow searching across them.

            // Actually, fetching *all* products might be heavy. Let's fetch just the list of priorities 
            // and maybe the top ones. Or, let's fetch products for each priority value found.

            // Fetch products for each priority group in parallel
            const groupPromises = prioritiesData.map(async (p: number) => {
                const pRes = await fetch(`${apiUrl}/api/products/priorities/${p}/products`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (pRes.ok) {
                    const products = await pRes.json();
                    return {
                        priority: p,
                        products: products,
                        isOpen: true // Default open to see everything
                    };
                }
                return null;
            });

            const groups = (await Promise.all(groupPromises)).filter(g => g !== null) as PriorityGroup[];
            setPriorityGroups(groups.sort((a, b) => b.priority - a.priority));

        } catch (err: any) {
            console.error(err.message || 'Error loading data');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePriority = async (productId: string, newPriority: number) => {
        try {
            setUpdating(true);
            const token = localStorage.getItem('accessToken');

            const res = await fetch(`${apiUrl}/api/products/${productId}/priority`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(newPriority)
            });

            if (!res.ok) throw new Error('Failed to update priority');

            // Refresh data
            await fetchData();
            setEditingId(null);
        } catch (err: any) {
            alert(err.message);
        } finally {
            setUpdating(false);
        }
    };

    const toggleGroup = (priority: number) => {
        setPriorityGroups(groups =>
            groups.map(g => g.priority === priority ? { ...g, isOpen: !g.isOpen } : g)
        );
    };

    const filteredGroups = priorityGroups.map(group => ({
        ...group,
        products: group.products.filter(p =>
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.code.toLowerCase().includes(searchTerm.toLowerCase())
        )
    })).filter(g => g.products.length > 0 || searchTerm === '');

    if (loading) return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin w-8 h-8 text-primary-green" /></div>;

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">إدارة أولويات المنتجات</h1>
                    <p className="text-gray-500 mt-1">ترتيب ظهور المنتجات: القيم الأعلى تظهر أولاً</p>
                </div>
                <div className="flex gap-4">
                    <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 flex gap-4">
                        <div className="text-center px-4 border-l border-gray-100">
                            <span className="block text-xs text-gray-400">أعلى أولوية</span>
                            <span className="font-bold text-green-600 text-lg">{stats.max}</span>
                        </div>
                        <div className="text-center px-4">
                            <span className="block text-xs text-gray-400">أقل أولوية</span>
                            <span className="font-bold text-red-500 text-lg">{stats.min}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                    type="text"
                    placeholder="بحث باسم المنتج أو الكود..."
                    className="w-full pr-10 pl-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-green/20 focus:border-primary-green transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Priority Groups */}
            <div className="space-y-4">
                {filteredGroups.map(group => (
                    <div key={group.priority} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                        <div
                            className={`p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors ${group.priority > 0 ? 'bg-green-50/50' : group.priority < 0 ? 'bg-red-50/50' : 'bg-gray-50'}`}
                            onClick={() => toggleGroup(group.priority)}
                        >
                            <div className="flex items-center gap-3">
                                {group.isOpen ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}

                                <div className={`flex items-center justify-center w-10 h-10 rounded-lg font-bold text-lg ${group.priority > 0 ? 'bg-green-100 text-green-700' :
                                    group.priority < 0 ? 'bg-red-100 text-red-700' :
                                        'bg-gray-200 text-gray-700'
                                    }`}>
                                    {group.priority}
                                </div>

                                <div>
                                    <span className="font-medium text-gray-900 block">
                                        {group.priority > 0 ? 'أولوية مرتفعة' : group.priority < 0 ? 'أولوية منخفضة' : 'أولوية عادية'}
                                    </span>
                                    <span className="text-sm text-gray-500">{group.products.length} منتج</span>
                                </div>
                            </div>
                        </div>

                        {group.isOpen && (
                            <div className="divide-y divide-gray-100">
                                {group.products.map(product => (
                                    <div key={product.id} className="p-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-lg bg-gray-100 overflow-hidden border border-gray-200">
                                                {product.images?.[0] ? (
                                                    <img src={product.images[0].imagePath} alt={product.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                        <AlertCircle className="w-6 h-6" />
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="font-medium text-gray-900">{product.name}</h3>
                                                <p className="text-xs text-gray-500 font-mono">{product.code}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3" dir="ltr">
                                            {editingId === product.id ? (
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="number"
                                                        value={editValue}
                                                        onChange={(e) => setEditValue(parseInt(e.target.value) || 0)}
                                                        className="w-20 px-2 py-1 border border-gray-300 rounded-md text-center font-mono text-sm focus:ring-2 focus:ring-primary-green focus:border-primary-green outline-none"
                                                        autoFocus
                                                    />
                                                    <button
                                                        onClick={() => handleUpdatePriority(product.id, editValue)}
                                                        disabled={updating}
                                                        className="p-1.5 bg-green-100 text-green-700 rounded-md hover:bg-green-200 disabled:opacity-50"
                                                    >
                                                        {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingId(null)}
                                                        className="p-1.5 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-4">
                                                    <span className={`font-mono font-medium ${product.priority && product.priority > 0 ? 'text-green-600' :
                                                        product.priority && product.priority < 0 ? 'text-red-500' :
                                                            'text-gray-400'
                                                        }`}>
                                                        {product.priority || 0}
                                                    </span>
                                                    <button
                                                        onClick={() => {
                                                            setEditingId(product.id);
                                                            setEditValue(product.priority || 0);
                                                        }}
                                                        className="p-1.5 text-gray-400 hover:text-primary-green hover:bg-primary-green/5 rounded-lg transition-colors"
                                                        title="تعديل الأولوية"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}

                {filteredGroups.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        لا توجد منتجات مطابقة للبحث
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductPriorityManagement;
