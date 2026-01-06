import { auth, db } from './firebase-config.js';
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const loginForm = document.getElementById('main-login-form');

loginForm.onsubmit = async (e) => {
    e.preventDefault();
    const email = loginForm.querySelectorAll('input')[0].value;
    const pass = loginForm.querySelectorAll('input')[1].value;
    const btn = loginForm.querySelector('button');

    btn.disabled = true; btn.innerText = "...";

    try {
        const creds = await signInWithEmailAndPassword(auth, email, pass);
        const userDoc = await getDoc(doc(db, "users", creds.user.uid));
        const data = userDoc.data();

        if (data.role === 'student') {
            window.location.href = "student.html";
        } else {
            alert("Please use the Admin Portal.");
            await auth.signOut();
            btn.disabled = false; btn.innerText = "Sign In";
        }
    } catch (e) { alert("Error: " + e.message); btn.disabled = false; btn.innerText = "Sign In"; }
};