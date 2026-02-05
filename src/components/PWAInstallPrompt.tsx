import React, { useEffect, useState } from 'react';
import { X, Download, Share } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const PWAInstallPrompt: React.FC = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [isIOS, setIsIOS] = useState(false);

    useEffect(() => {
        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            return;
        }

        // Check if user dismissed it previously
        const isDismissed = localStorage.getItem('pwaPromptDismissed');
        if (isDismissed) {
            return;
        }

        // Detect iOS
        const userAgent = window.navigator.userAgent.toLowerCase();
        const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
        setIsIOS(isIosDevice);

        if (isIosDevice) {
            // Show for iOS after a small delay if not dismissed
            const timer = setTimeout(() => {
                setShowPrompt(true);
            }, 10000); // 10 seconds delay
            return () => clearTimeout(timer);
        } else {
            // Standard beforeinstallprompt for Android/Desktop
            const handler = (e: Event) => {
                e.preventDefault();
                setDeferredPrompt(e as BeforeInstallPromptEvent);
                setShowPrompt(true);
            };

            window.addEventListener('beforeinstallprompt', handler);

            return () => {
                window.removeEventListener('beforeinstallprompt', handler);
            };
        }
    }, []);

    const handleInstallClick = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                setDeferredPrompt(null);
                setShowPrompt(false);
            }
        }
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        localStorage.setItem('pwaPromptDismissed', 'true');
    };

    if (!showPrompt) return null;

    return (
        <div className="fixed bottom-20 left-4 right-4 z-50 md:bottom-24 md:left-auto md:right-8 md:w-96 animate-fade-in-up" dir="rtl">
            <div className="bg-white rounded-2xl shadow-2xl p-4 border border-primary-green/20 relative overflow-hidden">
                {/* Decorative Background */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-primary-green/5 rounded-bl-full -z-10" />

                <button
                    onClick={handleDismiss}
                    className="absolute top-3 left-3 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label="إغلاق"
                >
                    <X size={20} />
                </button>

                <div className="flex items-start gap-4">
                    <div className="bg-primary-green/10 p-3 rounded-xl shrink-0">
                        <img src="/turtle_art_logo.jpeg" alt="Logo" className="w-8 h-8 rounded-full object-cover" />
                    </div>

                    <div className="flex-1">
                        <h3 className="font-bold text-black text-sm mb-1" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                            ثبت تطبيق Turtle Art 🐢
                        </h3>
                        <p className="text-gray-600 text-xs leading-relaxed mb-3" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                            {isIOS
                                ? "لتجربة أفضل، اضغط على زر المشاركة ثم اختر 'إضافة إلى الشاشة الرئيسية'"
                                : "احصل على تجربة تسوق أسرع وأسهل مع تطبيقنا الرسمي."}
                        </p>

                        {isIOS ? (
                            <div className="flex items-center gap-2 text-primary-green text-xs font-bold bg-primary-green/5 p-2 rounded-lg">
                                <Share size={16} />
                                <span>ثم اختر "إضافة للشاشة الرئيسية"</span>
                            </div>
                        ) : (
                            <button
                                onClick={handleInstallClick}
                                className="bg-primary-green text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-primary-green-dark transition-colors flex items-center gap-2 shadow-lg shadow-primary-green/20"
                                style={{ fontFamily: 'Tajawal, sans-serif' }}
                            >
                                <Download size={16} />
                                <span>تثبيت التطبيق</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PWAInstallPrompt;
