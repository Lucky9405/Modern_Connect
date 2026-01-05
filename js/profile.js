import { auth, db } from './firebase-config.js';
import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

let isEditing = false;
const editBtn = document.getElementById('edit-btn');

onAuthStateChanged(auth, async (user) => {
    if (user) {
        loadProfileData(user.uid);
    } else {
        window.location.href = "index.html";
    }
});

async function loadProfileData(uid) {
    const userDoc = await getDoc(doc(db, "users", uid));
    if (userDoc.exists()) {
        const data = userDoc.data();
        document.getElementById('display-name').innerText = data.name;
        document.getElementById('prof-name').innerText = data.name;
        document.getElementById('prof-course').innerText = data.course || "Not Set";
        document.getElementById('prof-year').innerText = data.year || "Not Set";
        document.getElementById('prof-address').innerText = data.address || "Not Set";
        document.getElementById('display-role').innerText = data.role;
        document.getElementById('initials').innerText = data.name.charAt(0).toUpperCase();
    }
}

// Toggle between Edit and Save
editBtn.addEventListener('click', async () => {
    const fields = ['prof-name', 'prof-course', 'prof-year', 'prof-address'];
    
    if (!isEditing) {
        // Switch to Edit Mode
        fields.forEach(id => {
            const el = document.getElementById(id);
            const val = el.innerText === "Not Set" ? "" : el.innerText;
            el.innerHTML = `<input type="text" id="input-${id}" class="w-full bg-indigo-50 p-1 border-b-2 border-indigo-500 outline-none text-slate-800" value="${val}">`;
        });
        editBtn.innerText = "Save Changes";
        editBtn.classList.replace('bg-indigo-100', 'bg-green-600');
        editBtn.classList.replace('text-indigo-700', 'text-white');
        isEditing = true;
    } else {
        // Save to Firebase
        const user = auth.currentUser;
        const updatedData = {
            name: document.getElementById('input-prof-name').value,
            course: document.getElementById('input-prof-course').value,
            year: document.getElementById('input-prof-year').value,
            address: document.getElementById('input-prof-address').value
        };

        try {
            await updateDoc(doc(db, "users", user.uid), updatedData);
            showToast("Profile Updated!");
            isEditing = false;
            editBtn.innerText = "Edit Profile";
            editBtn.classList.replace('bg-green-600', 'bg-indigo-100');
            editBtn.classList.replace('text-white', 'text-indigo-700');
            loadProfileData(user.uid); // Reload display
        } catch (err) {
            alert("Error updating: " + err.message);
        }
    }
});

function showToast(msg) {
    const toast = document.getElementById('toast');
    document.getElementById('toast-msg').innerText = msg;
    toast.classList.remove('translate-y-20', 'opacity-0');
    setTimeout(() => toast.classList.add('translate-y-20', 'opacity-0'), 3000);
}

document.getElementById('logout-btn').addEventListener('click', () => signOut(auth));