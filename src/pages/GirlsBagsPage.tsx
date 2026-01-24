import React from 'react';
import { useNavigate } from 'react-router-dom';
import ProductsByTypePage from './ProductsByTypePage';

export default function GirlsBagsPage() {
  const navigate = useNavigate();

  return (
    <div className="relative">
      {/* Sub-category Buttons */}
      <div className="sticky top-20 z-10 bg-gradient-to-b from-[#FAF9F6] to-transparent pt-4 pb-2">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-3 justify-center mb-4">
            <button
              onClick={() => navigate('/girls-bags/evening')}
              className="flex-1 max-w-xs bg-white/90 backdrop-blur-sm border-2 border-[#E5DCC5] hover:border-[#D4AF37] hover:bg-[#D4AF37] hover:text-white text-[#8B7355] font-bold py-3 px-6 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105"
              style={{ fontFamily: 'Tajawal, sans-serif' }}
            >
              <span className="text-xl mr-2">✨</span>
              شنط سهرة
            </button>
            
            <button
              onClick={() => navigate('/girls-bags/casual')}
              className="flex-1 max-w-xs bg-white/90 backdrop-blur-sm border-2 border-[#E5DCC5] hover:border-[#D4AF37] hover:bg-[#D4AF37] hover:text-white text-[#8B7355] font-bold py-3 px-6 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105"
              style={{ fontFamily: 'Tajawal, sans-serif' }}
            >
              <span className="text-xl mr-2">👜</span>
              شنط كاجوال
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <ProductsByTypePage
        config={{
          titleAr: 'شنط بنات',
          subtitleAr: 'شنط بنات أنيقة — اختاري المفضل لكِ.',
          theme: 'default',
          legacySegment: 'girls-bags',
          restoreStateKey: 'fromGirlsBagsPage',
          bottomNavKey: 'women-bags',
        }}
      />
    </div>
  );
}