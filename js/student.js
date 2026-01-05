import { auth, db } from './firebase-config.js';
import { collection, query, where, onSnapshot, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

onAuthStateChanged(auth, (user) => {
    if (user) {
        // 5. FIXED TIMELINE QUERY
        const q = query(
            collection(db, "issues"), 
            where("uid", "==", user.uid), // Ensure this matches the field in your "issues" doc
            orderBy("timestamp", "desc")
        );

        onSnapshot(q, (snapshot) => {
            const timeline = document.getElementById('activity-timeline');
            if (snapshot.empty) {
                timeline.innerHTML = `<p class="text-slate-400 text-sm text-center py-10">No issues reported yet.</p>`;
                return;
            }

            timeline.innerHTML = snapshot.docs.map(doc => {
                const data = doc.data();
                const date = data.timestamp ? new Date(data.timestamp.seconds * 1000).toLocaleDateString() : 'Just now';
                
                return `
                <div class="relative pl-8 pb-6 border-l-2 border-slate-100 last:border-0">
                    <div class="absolute -left-[9px] top-0 w-4 h-4 rounded-full ${data.status === 'reported' ? 'bg-amber-400' : 'bg-green-500'} border-4 border-white"></div>
                    <div class="text-xs font-bold text-slate-400 uppercase tracking-wider">${date}</div>
                    <div class="text-sm font-bold text-slate-800">${data.category} - ${data.location}</div>
                    <div class="text-xs text-slate-500 mt-1">Status: <span class="capitalize font-semibold">${data.status}</span></div>
                </div>`;
            }).join("");
        });
    }
});