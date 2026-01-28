// src/components/ExternalBrowserGuard.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  isAndroid,
  isIOS,
  isFacebookOrInstagramInAppBrowser,
  openExternalBrowserAndroid,
} from '../utils/inAppBrowser';

export default function ExternalBrowserGuard() {
  const [show, setShow] = useState(false);

  const currentUrl = useMemo(() => window.location.href, []);

  useEffect(() => {
    if (!isFacebookOrInstagramInAppBrowser()) return;

    // If we've already attempted external open, don't keep trying
    const u = new URL(window.location.href);
    const alreadyTried = u.searchParams.get('ext') === '1';

    // Android: try auto-open once
    if (isAndroid() && !alreadyTried) {
      openExternalBrowserAndroid(window.location.href);
      return;
    }

    // iOS (and Android if already tried): show instructions banner/modal
    setShow(true);
  }, []);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      alert('✅ تم نسخ الرابط. افتحه في المتصفح الخارجي (Safari/Chrome).');
    } catch {
      // Fallback if clipboard blocked
      const textarea = document.createElement('textarea');
      textarea.value = currentUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      alert('✅ تم نسخ الرابط.');
    }
  };

  if (!show) return null;

  const isIos = isIOS();

  return (
    <div className="fixed inset-0 z-[99999] bg-black/50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-200 p-5" dir="rtl">
        <h2 className="text-xl font-extrabold text-[#8B7355]" style={{ fontFamily: 'Tajawal, sans-serif' }}>
          افتح الموقع في المتصفح الخارجي
        </h2>

        <p className="text-sm text-gray-700 mt-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
          أنت تفتح الموقع داخل متصفح {isIos ? 'Facebook/Instagram' : 'Facebook/Instagram'} الداخلي.
          بعض الميزات (مثل الدفع، الإشعارات، تسجيل الدخول) قد لا تعمل بشكل صحيح.
        </p>

        {isIos ? (
          <div className="mt-3 text-sm text-gray-700" style={{ fontFamily: 'Tajawal, sans-serif' }}>
            <div className="font-bold mb-1">على iPhone:</div>
            اضغط على زر <b>…</b> أو <b>Share</b> ثم اختر <b>Open in Safari</b>.
          </div>
        ) : (
          <div className="mt-3 text-sm text-gray-700" style={{ fontFamily: 'Tajawal, sans-serif' }}>
            <div className="font-bold mb-1">على Android:</div>
            لو ما اتفتحش تلقائيًا، اضغط <b>…</b> ثم <b>Open in browser</b>.
          </div>
        )}

        <div className="mt-4 flex gap-2">
          <button
            onClick={copyLink}
            className="flex-1 px-4 py-3 rounded-xl bg-[#D4AF37] text-white font-extrabold"
            style={{ fontFamily: 'Tajawal, sans-serif' }}
          >
            نسخ الرابط
          </button>

          <button
            onClick={() => setShow(false)}
            className="px-4 py-3 rounded-xl border-2 border-[#E5DCC5] text-[#8B7355] font-extrabold"
            style={{ fontFamily: 'Tajawal, sans-serif' }}
          >
            متابعة هنا
          </button>
        </div>
      </div>
    </div>
  );
}
