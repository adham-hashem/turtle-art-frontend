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
      <div className="w-full">
        <div className="grid grid-cols-6 gap-0 md:flex md:justify-center md:gap-12 py-2 px-0 sm:px-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex flex-col items-center justify-center min-w-0 p-1 md:px-3 md:py-2 rounded-xl transition-all duration-300 relative ${isActive
                  ? 'text-primary-green font-bold transform scale-105 md:scale-110'
                  : 'text-black hover:text-primary-green hover:bg-primary-green/10'
                  }`}
              >
                <div className="relative mb-1">
                  <Icon className={`w-5 h-5 md:w-6 md:h-6 ${isActive ? 'animate-pulse' : ''}`} strokeWidth={isActive ? 2.5 : 2} />
                  {item.id === 'cart' && itemCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-primary-green text-white text-[10px] font-bold rounded-full w-4 h-4 md:w-5 md:h-5 flex items-center justify-center">
                      {itemCount}
                    </span>
                  )}
                </div>
                <span
                  className={`text-[9px] md:text-xs font-medium text-center leading-tight ${isActive ? 'font-bold' : ''}`}
                  style={{ fontFamily: 'Tajawal, sans-serif' }}
                >
                  {item.label.split(' ').length > 1 ? (
                    <>
                      {item.label.split(' ').map((word, i) => (
                        <span key={i} className="block">{word}</span>
                      ))}
                    </>
                  ) : (
                    item.label
                  )}
                </span>
                {isActive && (
                  <div className="absolute top-0 right-0 w-full h-full bg-primary-green/5 rounded-xl -z-10" />
                )}
                {isActive && (
                  <div className="absolute -bottom-1 md:-bottom-2 w-1 h-1 bg-primary-green rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
