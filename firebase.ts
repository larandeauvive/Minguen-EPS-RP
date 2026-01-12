
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  // Fix: use process.env instead of import.meta.env for environment variables
  apiKey: process.env.VITE_FIREBASE_API_KEY || "DEMO_KEY",
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "minguen-eps.firebaseapp.com",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || "minguen-eps",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "minguen-eps.appspot.com",
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.VITE_FIREBASE_APP_ID || "1:123456789:web:abcdef"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
