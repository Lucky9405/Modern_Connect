import { auth, db } from './firebase-config.js';
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const loginForm = document.getElementById('admin-login-form');

loginForm.onsubmit = async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('admin-email').value;
    const password = document.getElementById('admin-password').value;
    const loginBtn = loginForm.querySelector('button');

    // UI Feedback
    loginBtn.disabled = true;
    loginBtn.innerText = "Authenticating...";

    try {
        // 1. Sign in with Firebase Auth
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // 2. Fetch User Document from Firestore to verify Role
        const userDoc = await getDoc(doc(db, "users", user.uid));
        
        if (userDoc.exists() && userDoc.data().role === 'admin') {
            // Success: Redirect to Admin Dashboard
            window.location.href = "admin.html";
        } else {
            // Failure: Not an Admin
            alert("ACCESS DENIED: You do not have administrative privileges.");
            await auth.signOut(); // Log them out immediately
            loginBtn.disabled = false;
            loginBtn.innerText = "Authenticate";
        }
    } catch (error) {
        console.error("Login Error:", error);
        alert("Authentication failed. Please check your credentials.");
        loginBtn.disabled = false;
        loginBtn.innerText = "Authenticate";
    }
};