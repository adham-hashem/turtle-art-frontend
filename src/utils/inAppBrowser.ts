// src/utils/inAppBrowser.ts
export function isFacebookOrInstagramInAppBrowser(uaRaw?: string) {
  const ua = (uaRaw ?? navigator.userAgent ?? '').toLowerCase();

  // Facebook / Instagram / Messenger in-app browsers add these tokens to UA
  const isFB = ua.includes('fban') || ua.includes('fbav') || ua.includes('fb_iab') || ua.includes('fbios');
  const isIG = ua.includes('instagram');
  const isMessenger = ua.includes('messenger');

  return isFB || isIG || isMessenger;
}

export function isAndroid() {
  return /android/i.test(navigator.userAgent);
}

export function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

/**
 * Attempt to open current URL in an external browser on Android using an intent.
 * This will NOT work universally, but it's the best available web-only approach.
 */
export function openExternalBrowserAndroid(url: string) {
  // Avoid infinite loops
  const u = new URL(url);
  if (!u.searchParams.has('ext')) u.searchParams.set('ext', '1');

  const hostAndPath = `${u.host}${u.pathname}${u.search}${u.hash}`.replace(/^\/+/, '');
  const intentUrl = `intent://${hostAndPath}#Intent;scheme=${u.protocol.replace(':', '')};package=com.android.chrome;end`;

  // Try chrome intent
  window.location.href = intentUrl;

  // Fallback: if intent fails, keep user on the same page (or show UI)
  // You can't reliably detect failure, but you can provide a "Copy Link" UI anyway.
}
