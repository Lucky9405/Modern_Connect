import { auth, db } from './firebase-config.js';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

let myChart = null;
let currentFilter = 'all';
let allIssues = [];

onAuthStateChanged(auth, (user) => { if (!user) window.location.href = "index.html"; });

// --- 1. LIVE LISTENERS ---
onSnapshot(query(collection(db, "issues"), orderBy("timestamp", "desc")), (snapshot) => {
    allIssues = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    processAndRender();
});

onSnapshot(query(collection(db, "feedback"), orderBy("timestamp", "desc")), (snapshot) => {
    const list = document.getElementById('feedback-list');
    if (snapshot.empty) { list.innerHTML = '<p class="p-10 text-center text-slate-400 font-bold italic text-xs">No feedback received.</p>'; return; }
    list.innerHTML = snapshot.docs.map(d => {
        const data = d.data();
        return `<div class="p-6 flex justify-between items-center group hover:bg-slate-50">
            <div>
                <p class="text-sm font-medium text-slate-700 leading-relaxed mb-1">"${data.text}"</p>
                <p class="text-[10px] font-black text-indigo-500 uppercase">${data.senderName} • ${data.senderInfo}</p>
            </div>
            <button onclick="deleteData('feedback', '${d.id}')" class="text-slate-300 hover:text-red-500 p-2">✕</button>
        </div>`;
    }).join("");
});

// --- 2. PROCESSING & FILTERING ---
window.setFilter = (filter) => {
    currentFilter = filter;
    ['all', 'reported', 'resolved'].forEach(f => {
        const btn = document.getElementById(`filter-${f}`);
        btn.className = f === filter ? 'px-6 py-2 rounded-xl font-bold text-xs bg-white shadow-sm text-indigo-600 transition-all' : 'px-6 py-2 rounded-xl font-bold text-xs text-slate-500 hover:text-indigo-600 transition-all';
    });
    processAndRender();
};

function processAndRender() {
    const data = currentFilter === 'all' ? allIssues : allIssues.filter(i => i.status === currentFilter);
    
    // Update Stats
    const totalV = allIssues.reduce((acc, i) => acc + (i.upvotes?.length || 0), 0);
    const resolved = allIssues.filter(i => i.status === 'resolved').length;
    document.getElementById('total-upvotes').innerText = totalV;
    document.getElementById('resolution-rate').innerText = allIssues.length ? Math.round((resolved / allIssues.length) * 100) + '%' : '0%';

    updateChart(allIssues);
    renderTable(data);
}

// --- 3. UI RENDERING ---
function renderTable(data) {
    const list = document.getElementById('admin-issues-list');
    list.innerHTML = data.map(i => {
        const votes = i.upvotes ? i.upvotes.length : 0;
        const reporterInitial = i.reporterName ? i.reporterName[0].toUpperCase() : 'S';
        const isUrgent = votes >= 5 && i.status === 'reported';

        return `
        <tr class="group transition-all ${isUrgent ? 'bg-amber-50/40' : 'hover:bg-slate-50/80'}">
            <td class="px-8 py-5">
                <span class="text-[9px] font-black uppercase px-2 py-1 rounded bg-white border border-slate-100 shadow-sm">${i.category}</span>
                ${isUrgent ? '<div class="text-[8px] text-amber-600 font-black mt-2 animate-pulse">🔥 HIGH SUPPORT</div>' : ''}
            </td>
            <td class="px-8 py-5">
                <p class="font-black text-slate-800 text-sm leading-tight">${i.location}</p>
                <p class="text-xs text-slate-400 line-clamp-1 italic mt-1">${i.description}</p>
            </td>
            <td class="px-8 py-5 text-center">
                <span class="text-sm font-black text-slate-700 bg-slate-100 px-3 py-1 rounded-lg">${votes}</span>
            </td>
            <td class="px-8 py-5">
                <div class="flex flex-col">
                    <span class="text-[11px] font-bold text-slate-600">${i.reporterName || 'Student'}</span>
                    <span class="text-[9px] text-slate-400 font-black uppercase tracking-tighter">${i.course || ''} ${i.year || ''}</span>
                </div>
            </td>
            <td class="px-8 py-5 text-right flex justify-end gap-2">
                ${i.status === 'reported' ? `<button onclick="updateStatus('${i.id}', 'resolved')" class="bg-indigo-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase shadow-lg shadow-indigo-100">Fix</button>` : `<span class="text-emerald-500 font-black text-[10px] uppercase">Fixed ✅</span>`}
                <button onclick="deleteData('issues', '${i.id}')" class="text-slate-300 hover:text-red-500 p-2">✕</button>
            </td>
        </tr>`;
    }).join("");
}

function updateChart(issues) {
    const counts = issues.reduce((acc, i) => { acc[i.category] = (acc[i.category] || 0) + 1; return acc; }, {});
    const ctx = document.getElementById('issueChart');
    if (myChart) myChart.destroy();
    myChart = new Chart(ctx, {
        type: 'doughnut',
        data: { labels: Object.keys(counts), datasets: [{ data: Object.values(counts), backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#64748b'] }] },
        options: { cutout: '70%', plugins: { legend: { display: false } }, maintainAspectRatio: false }
    });
}

// --- 4. GLOBAL ACTIONS ---
window.updateStatus = async (id, s) => { if(confirm("Confirm fix?")) await updateDoc(doc(db, "issues", id), { status: s }); };
window.deleteData = async (col, id) => { if(confirm("Permanently delete?")) await deleteDoc(doc(db, col, id)); };

document.getElementById('send-broadcast').onclick = async () => {
    const msg = document.getElementById('broadcast-msg');
    if (!msg.value.trim()) return;
    await addDoc(collection(db, "broadcasts"), { message: msg.value, timestamp: serverTimestamp() });
    msg.value = ""; alert("Announcement posted!");
};

document.getElementById('logout-btn').onclick = () => signOut(auth).then(() => window.location.href = "index.html");