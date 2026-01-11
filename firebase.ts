
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Use environment variables or placeholders if not provided. 
// For this demo, we assume the environment is set up.
const firebaseConfig = {
  apiKey: "DEMO_KEY",
  authDomain: "minguen-eps.firebaseapp.com",
  projectId: "minguen-eps",
  storageBucket: "minguen-eps.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
