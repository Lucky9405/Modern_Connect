// js/firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAGzeZxDE-qESvQj1tCdGfbLY2CAVAVMfY",
  authDomain: "modern-connect-bf8b1.firebaseapp.com",
  projectId: "modern-connect-bf8b1",
  storageBucket: "modern-connect-bf8b1.firebasestorage.app",
  messagingSenderId: "528038674982",
  appId: "1:528038674982:web:7967c5f3f0608bcf809ce7",
  measurementId: "G-TCP1XFLXYZ"
};

// Start the engine
const app = initializeApp(firebaseConfig);

// Export the tools so we can use them in other files
export const auth = getAuth(app);
export const db = getFirestore(app);