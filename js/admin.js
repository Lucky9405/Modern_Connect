import { auth, db } from './firebase-config.js';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

let myChart = null;

// Admin Guard
onAuthStateChanged(auth, (user) => {
    if (!user) window.location.href = "index.html";
});

// Real-time Data Listener
onSnapshot(query(collection(db, "issues"), orderBy("timestamp", "desc")), (snapshot) => {
    const issues = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    updateStats(issues);
    renderTable(issues);
    updateChart(issues);
});

function updateStats(issues) {
    const totalUpvotes = issues.reduce((acc, i) => acc + (i.upvotes?.length || 0), 0);
    const resolved = issues.filter(i => i.status === 'resolved').length;
    const rate = issues.length ? Math.round((resolved / issues.length) * 100) : 0;

    document.getElementById('total-upvotes').innerText = totalUpvotes.toLocaleString();
    document.getElementById('resolution-rate').innerText = `${rate}%`;
}

function updateChart(issues) {
    const counts = issues.reduce((acc, i) => {
        acc[i.category] = (acc[i.category] || 0) + 1;
        return acc;
    }, {});

    const ctx = document.getElementById('issueChart').getContext('2d');
    if (myChart) myChart.destroy();
    myChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(counts),
            datasets: [{
                data: Object.values(counts),
                backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#64748b'],
                borderWidth: 5,
                borderColor: '#ffffff'
            }]
        },
        options: {
            cutout: '75%',
            plugins: { legend: { display: false } },
            maintainAspectRatio: false
        }
    });
}

function renderTable(data) {
    const list = document.getElementById('admin-issues-list');
    
    // Priority Sort: Pending Issues with high upvotes first
    const sorted = [...data].sort((a, b) => {
        if (a.status === b.status) return (b.upvotes?.length || 0) - (a.upvotes?.length || 0);
        return a.status === 'reported' ? -1 : 1;
    });

    list.innerHTML = sorted.map(i => {
        const votes = i.upvotes ? i.upvotes.length : 0;
        const isUrgent = votes >= 5 && i.status === 'reported';
        const reporterInitial = i.reporterName ? i.reporterName[0].toUpperCase() : 'S';

        return `
        <tr class="group hover:bg-slate-50 transition-all ${isUrgent ? 'bg-amber-50/40' : ''}">
            <td class="px-8 py-5">
                <span class="text-[9px] font-black uppercase px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-500 shadow-sm">${i.category}</span>
                ${isUrgent ? '<div class="text-[8px] text-amber-600 font-black mt-2 tracking-widest animate-pulse">🔥 TRENDING ISSUE</div>' : ''}
            </td>
            <td class="px-8 py-5">
                <p class="font-black text-slate-800 text-sm leading-tight mb-0.5">${i.location}</p>
                <p class="text-[11px] text-slate-400 line-clamp-1 italic font-medium">${i.description}</p>
            </td>
            <td class="px-8 py-5 text-center">
                <span class="text-sm font-black text-slate-700 bg-slate-100 px-3 py-1 rounded-lg">${votes}</span>
            </td>
            <td class="px-8 py-5">
                <div class="flex items-center gap-2">
                    <div class="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-[9px] font-black">${reporterInitial}</div>
                    <span class="text-[11px] font-bold text-slate-600">${i.reporterName || 'Student'}</span>
                </div>
            </td>
            <td class="px-8 py-5">
                <div class="flex justify-end items-center gap-3">
                    ${i.status === 'reported' ? 
                        `<button onclick="updateStatus('${i.id}', 'resolved')" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-md active:scale-95">Resolve</button>` : 
                        `<span class="text-emerald-500 font-black text-[10px] uppercase tracking-widest flex items-center gap-1">✅ Fixed</span>`
                    }
                    
                    <button onclick="deleteIssue('${i.id}')" class="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Delete Spam">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                </div>
            </td>
        </tr>`;
    }).join("");
}

// --- GLOBAL ACTIONS ---

window.updateStatus = async (id, status) => {
    if(confirm("Mark this issue as fixed? This will update the community feed.")) {
        await updateDoc(doc(db, "issues", id), { status: status });
    }
};

window.deleteIssue = async (id) => {
    if(confirm("⚠️ PERMANENT ACTION: Delete this report? Use this only for spam or duplicate content.")) {
        try {
            await deleteDoc(doc(db, "issues", id));
            // Note: In a professional app, you'd also delete sub-collection 'comments' here
        } catch (error) {
            console.error("Delete failed:", error);
            alert("Error: You might not have permission to delete.");
        }
    }
};

document.getElementById('logout-btn').onclick = () => signOut(auth).then(() => window.location.href = "index.html");