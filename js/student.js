import { auth, db } from './firebase-config.js';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, orderBy, getDoc, doc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

onAuthStateChanged(auth, async (user) => {
    if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) document.getElementById('nav-user-name').innerText = userDoc.data().name;
        loadTimeline(user.uid);
    } else { window.location.href = "index.html"; }
});

function loadTimeline(uid) {
    const q = query(collection(db, "issues"), where("reportedBy", "==", uid), orderBy("timestamp", "desc"));
    onSnapshot(q, (snapshot) => {
        const container = document.getElementById('student-timeline');
        container.innerHTML = "";
        snapshot.forEach(d => {
            const issue = d.data();
            const date = issue.timestamp?.toDate().toLocaleDateString() || "Recently";
            container.innerHTML += `
                <div class="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex gap-4">
                    <div class="w-12 h-12 rounded-2xl ${issue.status === 'resolved' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'} flex items-center justify-center font-bold">
                        ${issue.status === 'resolved' ? '✓' : '!'}
                    </div>
                    <div class="flex-1">
                        <div class="flex justify-between items-center mb-1">
                            <h4 class="font-bold text-slate-800">${issue.category}</h4>
                            <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">${date}</span>
                        </div>
                        <p class="text-sm text-slate-500">${issue.description}</p>
                    </div>
                </div>`;
        });
    });
}

// Form Submission with Toast
document.getElementById('issue-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
        await addDoc(collection(db, "issues"), {
            category: document.getElementById('category').value,
            location: document.getElementById('location').value,
            description: document.getElementById('description').value,
            status: "reported",
            reportedBy: auth.currentUser.uid,
            timestamp: serverTimestamp()
        });
        showToast("Success!", "Reported to management.");
        e.target.reset();
    } catch (err) { showToast("Error", err.message); }
});

function showToast(title, msg) {
    const toast = document.getElementById('toast');
    document.getElementById('toast-msg').innerText = msg;
    toast.classList.remove('translate-y-20', 'opacity-0');
    setTimeout(() => toast.classList.add('translate-y-20', 'opacity-0'), 3000);
}

document.getElementById('logout-btn').addEventListener('click', () => signOut(auth));