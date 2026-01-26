console.log('firebase-messaging-sw.js loaded');

try {
  // Use compat versions for Service Worker compatibility
  importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
  importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');
  console.log('Firebase compat scripts loaded successfully');

  const firebaseConfig = {
    apiKey: "AIzaSyCELNS_whlCqQlKNtQRQgxyMTfO4v40NN8",
    authDomain: "elshalnotifications.firebaseapp.com",
    projectId: "elshalnotifications",
    storageBucket: "elshalnotifications.firebasestorage.app",
    messagingSenderId: "571620272995",
    appId: "1:571620272995:web:b5ea00e24337493d8c8156",
    measurementId: "G-9CFQZYFZRZ",
  };

  console.log('Initializing Firebase');
  const app = firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();
  console.log('Firebase messaging initialized');

  messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message:', payload);
    const notificationTitle = payload.notification?.title || 'إشعار جديد';
    const notificationOptions = {
      body: payload.notification?.body || '',
      icon: '/اللجو.jpg',
      badge: '/اللجو.jpg',
      tag: 'elshal-notification',
      requireInteraction: false,
      vibrate: [200, 100, 200]
    };
    
    return self.registration.showNotification(notificationTitle, notificationOptions);
  });
} catch (error) {
  console.error('Error in firebase-messaging-sw.js:', error);
}