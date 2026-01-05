import { auth, db } from './firebase-config.js';
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const signupForm = document.getElementById('signup-form');

signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // 1. Grab the information from the "Handles" (IDs) in your HTML
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const fullName = document.getElementById('fullName').value;
    const role = document.getElementById('role').value;

    try {
        // 2. Create the login account (The Security Guard part)
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // 3. Save the Role and Name to the Database (The Filing Cabinet part)
        // We use user.uid to make sure the folder name matches the user ID
        await setDoc(doc(db, "users", user.uid), {
            name: fullName,
            email: email,
            role: role,
            createdAt: new Date()
        });

        alert("Account Created Successfully! Redirecting to Login...");
        window.location.href = "index.html"; 

    } catch (error) {
        console.error("Signup Error:", error);
        alert("Signup Failed: " + error.message);
    }
});