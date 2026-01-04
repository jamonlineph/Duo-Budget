
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy,
  setDoc,
  getDoc
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

// IMPORTANT: User should provide their own Firebase config here to enable cloud sync.
// For now, we use a try-catch pattern so the app works locally without credentials.
const firebaseConfig = {
  apiKey: "AIzaSyA_LOCAL_DEVELOPMENT_MOCK", 
  authDomain: "duobudget-app.firebaseapp.com",
  projectId: "duobudget-app",
  storageBucket: "duobudget-app.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

let app;
let auth: any = null;
let db: any = null;
let googleProvider: any = null;
let isFirebaseEnabled = false;

try {
  // Check if we have a real-looking key (Firebase keys usually start with AIza)
  if (firebaseConfig.apiKey && firebaseConfig.apiKey.startsWith("AIzaS") && !firebaseConfig.apiKey.includes("MOCK")) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    googleProvider = new GoogleAuthProvider();
    isFirebaseEnabled = true;
  }
} catch (error) {
  console.warn("Firebase not configured. Using Local Storage mode.");
}

export const loginWithGoogle = async () => {
  if (isFirebaseEnabled) {
    try {
      return await signInWithPopup(auth, googleProvider);
    } catch (e) {
      console.error(e);
      alert("Google Sign-in failed. Ensure your Firebase project is configured.");
    }
  } else {
    // Local Mock Login
    const mockUser = { uid: 'local_user', displayName: 'Duo User', email: 'demo@example.com' };
    localStorage.setItem('duo_local_user', JSON.stringify(mockUser));
    window.location.reload();
  }
};

export const logoutUser = async () => {
  if (isFirebaseEnabled) {
    await signOut(auth);
  } else {
    localStorage.removeItem('duo_local_user');
    window.location.reload();
  }
};

export { auth, db, isFirebaseEnabled };
