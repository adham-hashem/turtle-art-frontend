import React from 'react';
import { Instagram, Facebook, MessageCircle } from 'lucide-react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const defaultMessage =
    'مرحبًا، أود الاستفسار عن موقع Turtle Art والمنتجات المتاحة، وهل يمكن تزويدي بالتفاصيل والأسعار؟';

  const openWhatsApp = (phone: string) => {
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(defaultMessage)}`;
    window.open(url, '_blank');
  };

  return (
    <footer className="bg-gradient-to-b from-[#FAF9F6] to-white mt-16 py-12 pb-24 border-t-2 border-[#E5DCC5]">
      <div className="container mx-auto px-4">
        {/* Logo and Brand */}
        <div className="flex flex-col items-center gap-6 mb-10">
          <div className="flex items-center gap-3">
            <img
              src="/turtle_art_logo.jpeg"
              alt="Turtle Art"
              className="h-16 w-16 rounded-full object-cover shadow-lg border-4 border-[#E5DCC5]"
            />
            <div className="text-center">
              <h3 className="text-xl font-bold text-[#8B7355]" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                Turtle Art
              </h3>
              <p className="text-sm text-[#D4AF37] font-medium" style={{ fontFamily: 'Tajawal, sans-serif' }}>
               ✨🐢Dream Bag ? Found it!
              </p>
            </div>
          </div>
        </div>

        {/* Social Media Links */}
        <div className="flex justify-center items-center gap-4 mb-8">
          <a
            href="https://www.instagram.com/turtle.aart"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 bg-gradient-to-br from-[#8B7355] to-[#A67C52] text-white rounded-full hover:scale-110 transition-transform shadow-lg hover:shadow-xl"
            aria-label="Instagram"
          >
            <Instagram className="h-5 w-5" />
          </a>

          <a
            href="https://www.facebook.com/Turtle.aart"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 bg-[#D4AF37] text-white rounded-full hover:scale-110 transition-transform shadow-lg hover:shadow-xl"
            aria-label="Facebook"
          >
            <Facebook className="h-5 w-5" />
          </a>

          <a
            href="https://www.tiktok.com/@turtle_aart"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 bg-[#8B7355] text-white rounded-full hover:scale-110 transition-transform shadow-lg hover:shadow-xl"
            aria-label="TikTok"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
            </svg>
          </a>

          <button
            onClick={() => openWhatsApp('201000070653')}
            className="p-3 bg-green-500 text-white rounded-full hover:scale-110 transition-transform shadow-lg hover:shadow-xl"
            aria-label="WhatsApp Turtle Art"
          >
            <MessageCircle className="h-5 w-5" />
          </button>
        </div>

        {/* Quick Links */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <a
            href="/"
            className="text-sm text-[#8B7355] hover:text-[#D4AF37] font-medium transition-colors"
            style={{ fontFamily: 'Tajawal, sans-serif' }}
          >
            الرئيسية
          </a>
          <span className="text-[#E5DCC5]">•</span>

          <a
            href="/cart"
            className="text-sm text-[#8B7355] hover:text-[#D4AF37] font-medium transition-colors"
            style={{ fontFamily: 'Tajawal, sans-serif' }}
          >
            السلة
          </a>
          <span className="text-[#E5DCC5]">•</span>

          <a
            href="/my-orders"
            className="text-sm text-[#8B7355] hover:text-[#D4AF37] font-medium transition-colors"
            style={{ fontFamily: 'Tajawal, sans-serif' }}
          >
            طلباتي
          </a>
        </div>

        {/* Copyright */}
        <div className="border-t-2 border-[#E5DCC5] pt-6">
          <div className="text-center space-y-3">
            <p className="text-[#8B7355]/70 text-sm font-medium" style={{ fontFamily: 'Tajawal, sans-serif' }}>
              Contact the developers
            </p>

            {/* WhatsApp Icons for Adham's Team */}
            <div className="flex justify-center items-center gap-3">
              <button
                onClick={() => openWhatsApp('201013989517')}
                className="p-2 bg-green-500 text-white rounded-full hover:scale-110 transition-transform shadow-md hover:shadow-lg"
                aria-label="WhatsApp +201013989517"
                title="+201013989517"
              >
                <MessageCircle className="h-4 w-4" />
              </button>

              <button
                onClick={() => openWhatsApp('201027548602')}
                className="p-2 bg-green-500 text-white rounded-full hover:scale-110 transition-transform shadow-md hover:shadow-lg"
                aria-label="WhatsApp +201027548602"
                title="+201027548602"
              >
                <MessageCircle className="h-4 w-4" />
              </button>
            </div>

            <p className="text-[#8B7355]/50 text-xs" style={{ fontFamily: 'Tajawal, sans-serif' }}>
              © {currentYear} Turtle Art. جميع الحقوق محفوظة 🐢
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
