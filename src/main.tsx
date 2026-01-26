// In src/main.tsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App';
import './index.css'; // Assuming you have a main css file

// Make sure your .env file is configured correctly
const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

if (!googleClientId) {
  console.error("VITE_GOOGLE_CLIENT_ID is not set in your environment variables. Google Login will not work.");
}

// Register Firebase service worker for push notifications
if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('/firebase-messaging-sw.js')
    .then((registration) => {
      console.log('✅ Firebase Service Worker registered successfully:', registration);
    })
    .catch((error) => {
      console.error('❌ Firebase Service Worker registration failed:', error);
    });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* This Provider loads the Google script once for your whole app */}
    <GoogleOAuthProvider clientId={googleClientId}>
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>
);
