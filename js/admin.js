import { auth, db } from './firebase-config.js';
import { collection, query, onSnapshot, doc, updateDoc, orderBy, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// SECURITY GUARD
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists() && userDoc.data().role !== 'admin') {
            window.location.href = "student.html";
        }
    } else { window.location.href = "index.html"; }
});

let allIssues = [];
let myChart = null;

onSnapshot(query(collection(db, "issues"), orderBy("timestamp", "desc")), (snapshot) => {
    allIssues = snapshot.docs.map(d => ({id: d.id, ...d.data()}));
    renderTable(allIssues);
    updateStats(allIssues);
    initChart(allIssues);
});

function renderTable(data) {
    const list = document.getElementById('admin-issues-list');
    list.innerHTML = data.map(i => `
        <tr class="hover:bg-slate-50 transition border-l-4 ${i.status==='reported'?'border-amber-400':'border-emerald-400'}">
            <td class="px-6 py-4 font-bold text-slate-700">${i.category}</td>
            <td class="px-6 py-4">
                <div class="text-sm font-medium text-slate-800">${i.location}</div>
                <div class="text-[10px] text-slate-400 italic">${i.description || 'No description'}</div>
            </td>
            <td class="px-6 py-4">
                <span class="px-2 py-1 rounded-md text-[9px] font-black uppercase ${i.status==='reported'?'bg-amber-100 text-amber-700':'bg-emerald-100 text-emerald-700'}">${i.status}</span>
            </td>
            <td class="px-6 py-4 text-right">
                ${i.status==='reported' ? `<button onclick="updateStatus('${i.id}', 'resolved')" class="bg-slate-900 text-white px-3 py-1.5 rounded-lg text-xs font-bold">Resolve</button>` : `<span class="text-emerald-500 font-bold text-xs">Fixed</span>`}
            </td>
        </tr>`).join("");
}

document.getElementById('admin-search').addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    renderTable(allIssues.filter(i => i.location.toLowerCase().includes(term) || i.category.toLowerCase().includes(term)));
});

function updateStats(data) {
    document.getElementById('total-count').innerText = data.length;
    document.getElementById('pending-count').innerText = data.filter(i => i.status === 'reported').length;
    document.getElementById('resolved-count').innerText = data.filter(i => i.status === 'resolved').length;
}

function initChart(data) {
    const ctx = document.getElementById('issueChart');
    const counts = data.reduce((acc, i) => { acc[i.category] = (acc[i.category] || 0) + 1; return acc; }, {});
    if(myChart) myChart.destroy();
    myChart = new Chart(ctx, {
        type: 'doughnut',
        data: { labels: Object.keys(counts), datasets: [{ data: Object.values(counts), backgroundColor: ['#6366f1', '#f59e0b', '#ef4444', '#10b981'] }]},
        options: { maintainAspectRatio: false }
    });
}

document.getElementById('export-csv').addEventListener('click', () => {
    let csv = "Category,Location,Status,Description\n" + allIssues.map(i => `${i.category},${i.location},${i.status},"${i.description || ''}"`).join("\n");
    const link = document.createElement("a");
    link.href = 'data:text/csv;charset=utf-8,' + encodeURI(csv);
    link.download = "Campus_Reports.csv";
    link.click();
});

window.updateStatus = async (id, status) => { await updateDoc(doc(db, "issues", id), { status }); };
document.getElementById('logout-btn').addEventListener('click', () => signOut(auth));