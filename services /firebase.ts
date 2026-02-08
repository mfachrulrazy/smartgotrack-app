import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Helper to safely access process.env without crashing in browser environments
const getEnv = (key: string) => {
  try {
    return (typeof process !== 'undefined' && process.env) ? process.env[key] : undefined;
  } catch (e) {
    return undefined;
  }
};

// TODO: To fix "auth/api-key-not-valid", you must replace the values below 
// with the config from your Firebase Console (Project Settings > General).
const firebaseConfig = {
  apiKey: "FIREBASE_PROJECT_API_KEY",
  authDomain: "YOURDOMAIN.COM",
  projectId: "PROJECT_ID",
  storageBucket: "FIREBASE_STORAGE_BUCKET",
  messagingSenderId: "MESSAGE_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
