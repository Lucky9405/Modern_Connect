import { auth, db } from './firebase-config.js';
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const loginForm = document.getElementById('login-form');

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // 1. Get what the user typed
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        // 2. Ask Firebase to verify the user
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // 3. Fetch the user's role from the Database
        const userDoc = await getDoc(doc(db, "users", user.uid));

        if (userDoc.exists()) {
            const userData = userDoc.data();
            
            // 4. Check the role and send them to the right page
            if (userData.role === 'admin') {
                window.location.href = "admin.html";
            } else {
                window.location.href = "student.html";
            }
        } else {
            alert("We found your account, but your role (Student/Admin) isn't set up in the database.");
        }

    } catch (error) {
        // This will tell us EXACTLY what went wrong (e.g., wrong password)
        console.error(error);
        alert("Login Error: " + error.message);
    }
});