import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';

/**
 * Firebase Configuration
 * 
 * IMPORTANT: Replace these values in your .env file with actual credentials 
 * from the Firebase Console (Project Settings > General > Your apps).
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

let app: FirebaseApp;
let db: Firestore;
let auth: Auth;

try {
  // Check if we have valid config (at least apiKey and projectId)
  if (!firebaseConfig.apiKey || firebaseConfig.apiKey === "YOUR_API_KEY") {
    console.warn("Firebase: Using placeholder configuration. Database features will not work until you update your .env file.");
  }
  
  // Initialize Firebase (singleton pattern for hot-reloads)
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }
  
  db = getFirestore(app);
  auth = getAuth(app);
} catch (error) {
  console.error("Firebase initialization failed:", error);
  // Provide a minimal fake app if it crashes to prevent the whole app from going blank
  // though real database calls will still fail.
  app = {} as FirebaseApp;
  db = {} as Firestore;
  auth = {} as Auth;
}

export { db, auth };
export default app;
