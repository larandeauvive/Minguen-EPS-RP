
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Use process.env to access environment variables and resolve TypeScript errors on import.meta.env
const firebaseConfig = {
  apiKey: (process.env as any).VITE_FIREBASE_API_KEY || "DEMO_KEY",
  authDomain: (process.env as any).VITE_FIREBASE_AUTH_DOMAIN || "minguen-eps.firebaseapp.com",
  projectId: (process.env as any).VITE_FIREBASE_PROJECT_ID || "minguen-eps",
  storageBucket: (process.env as any).VITE_FIREBASE_STORAGE_BUCKET || "minguen-eps.appspot.com",
  messagingSenderId: (process.env as any).VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: (process.env as any).VITE_FIREBASE_APP_ID || "1:123456789:web:abcdef"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
