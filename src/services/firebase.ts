// src/services/firebase.ts

import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, MessagePayload } from 'firebase/messaging';
import { Unsubscribe } from '@firebase/util';

// Firebase configuration using environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const messaging = getMessaging(app);

// Request notification permission and get FCM token
export async function requestNotificationPermission(): Promise<string | null> {
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      // console.log('Notification permission granted.');
      const token = await getToken(messaging, {
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
      });
      // console.log('FCM Token:', token);
      return token;
    } else {
      // console.log('Notification permission denied.');
      return null;
    }
  } catch (error) {
    // console.error('Error retrieving FCM token:', error);
    return null;
  }
}

// Handle foreground messages
export function onForegroundMessage(cb: (payload: MessagePayload) => void): Unsubscribe {
  return onMessage(messaging, (payload: MessagePayload) => {
    // console.log('Foreground message received:', payload);
    cb(payload);
  });
}