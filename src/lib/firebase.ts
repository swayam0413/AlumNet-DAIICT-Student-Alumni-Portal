import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase config from firebase-applet-config.json
const firebaseConfig = {
  apiKey: "AIzaSyCL6eB6KyzJEKN4-fxWMO2ZFDFJvScI5gI",
  authDomain: "ai-studio-applet-webapp-e411e.firebaseapp.com",
  projectId: "ai-studio-applet-webapp-e411e",
  storageBucket: "ai-studio-applet-webapp-e411e.firebasestorage.app",
  messagingSenderId: "1009545976125",
  appId: "1:1009545976125:web:c1a0848de63fcbcd83cd54",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app, 'ai-studio-2ecdea86-e0d5-4ce5-9b99-0b199d5a3c73');
export default app;
