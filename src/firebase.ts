import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Configuration from /firebase-applet-config.json
const firebaseConfig = {
  apiKey: "AIzaSyCAFujz_QcwMFLKDW6xvSAO06Pi03L2sqo",
  authDomain: "scrap-a2ab8.firebaseapp.com",
  projectId: "scrap-a2ab8",
  storageBucket: "scrap-a2ab8.firebasestorage.app",
  messagingSenderId: "482397552834",
  appId: "1:482397552834:web:c8be818f35aba8d1fd7b5b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Firestore
// We specify the correct custom database ID as in config: "ai-studio-d76ad817-3deb-42e3-8381-19085c895adb"
export const db = getFirestore(app, "ai-studio-d76ad817-3deb-42e3-8381-19085c895adb");
