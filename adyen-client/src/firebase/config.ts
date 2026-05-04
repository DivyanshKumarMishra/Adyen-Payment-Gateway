import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyB9CkYZHAseO9J7FsbHGnV3hBmwCiq5LA8",
  authDomain: "auth-and-session-management.firebaseapp.com",
  projectId: "auth-and-session-management",
  storageBucket: "auth-and-session-management.firebasestorage.app",
  messagingSenderId: "372136371797",
  appId: "1:372136371797:web:0f38d52d20b09e127596dc",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
