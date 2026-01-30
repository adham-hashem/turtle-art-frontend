import { Home, Baby, Sparkles, Gift, ShoppingBag, Palette } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

interface BottomNavProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function BottomNav({ currentPage, onNavigate }: BottomNavProps) {
  const { getItemCount } = useApp();
  const itemCount = getItemCount();

  const navItems = [
    { id: 'home', label: 'الرئيسية', icon: Home },
    { id: 'kids-bags', label: 'شنط أطفال', icon: Baby },
    { id: 'girls-bags', label: 'شنط بناتي', icon: Sparkles },
    { id: 'giveaways', label: 'التوزيعات', icon: Gift },
    { id: 'custom-designs', label: 'التصميمات الخاصة', icon: Palette },
    { id: 'cart', label: 'السلة', icon: ShoppingBag },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-300 relative ${isActive
                    ? 'text-black font-bold transform scale-110'
                    : 'text-black hover:text-gray-600 hover:bg-gray-100'
                  }`}
              >
                <div className="relative">
                  <Icon className={`w-6 h-6 ${isActive ? 'animate-pulse' : ''}`} strokeWidth={isActive ? 2.5 : 2} />
                  {item.id === 'cart' && itemCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-black text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {itemCount}
                    </span>
                  )}
                </div>
                <span
                  className={`text-xs font-medium ${isActive ? 'font-bold' : ''}`}
                  style={{ fontFamily: 'Tajawal, sans-serif' }}
                >
                  {item.label}
                </span>
                {isActive && (
                  <div className="absolute -bottom-2 w-1 h-1 bg-black rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
