import { auth, db } from './firebase-config.js';
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

let allIssues = [];
let myChart = null;

// Skeletons on Start
const list = document.getElementById('admin-issues-list');
list.innerHTML = `<tr class="animate-pulse"><td class="px-8 py-5"><div class="h-4 bg-slate-200 rounded w-full"></div></td></tr>`.repeat(5);

onSnapshot(query(collection(db, "issues"), orderBy("timestamp", "desc")), (snapshot) => {
    allIssues = [];
    snapshot.forEach(d => allIssues.push({id: d.id, ...d.data()}));
    renderTable(allIssues);
    updateStats(allIssues);
    initChart(allIssues);
});

function renderTable(data) {
    list.innerHTML = "";
    data.forEach(issue => {
        const statusHTML = issue.status === 'reported' 
            ? `<span class="flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-1 rounded-full text-[10px] font-bold uppercase"><span class="w-2 h-2 bg-amber-500 rounded-full animate-ping"></span> Pending</span>`
            : `<span class="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full text-[10px] font-bold uppercase"><span class="w-2 h-2 bg-emerald-500 rounded-full"></span> Resolved</span>`;

        list.innerHTML += `
            <tr class="hover:bg-slate-50 transition border-l-4 ${issue.category === 'Electrical' ? 'border-red-500' : 'border-transparent'}">
                <td class="px-8 py-5 font-bold text-slate-700">${issue.category}</td>
                <td class="px-8 py-5 text-slate-500 text-sm">${issue.location}</td>
                <td class="px-8 py-5">${statusHTML}</td>
                <td class="px-8 py-5 text-right flex justify-end gap-2">
                    <button onclick="updateStatus('${issue.id}', 'resolved')" class="bg-slate-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-700">Resolve</button>
                    <button onclick="deleteDoc('${issue.id}')" class="text-red-400 hover:text-red-600 p-1">🗑️</button>
                </td>
            </tr>`;
    });
}

function initChart(data) {
    const ctx = document.getElementById('issueChart');
    const counts = data.reduce((acc, i) => { acc[i.category] = (acc[i.category] || 0) + 1; return acc; }, {});
    if(myChart) myChart.destroy();
    myChart = new Chart(ctx, {
        type: 'doughnut',
        data: { labels: Object.keys(counts), datasets: [{ data: Object.values(counts), backgroundColor: ['#6366f1', '#f59e0b', '#ef4444', '#10b981'] }]},
        options: { maintainAspectRatio: false, plugins: { legend: { position: 'right' } } }
    });
}

// Search & Filter
document.getElementById('admin-search').addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    renderTable(allIssues.filter(i => i.location.toLowerCase().includes(term) || i.description.toLowerCase().includes(term)));
});

// CSV Export
document.getElementById('export-csv').addEventListener('click', () => {
    let csv = "Category,Location,Status\n" + allIssues.map(i => `${i.category},${i.location},${i.status}`).join("\n");
    const link = document.createElement("a");
    link.href = 'data:text/csv;charset=utf-8,' + encodeURI(csv);
    link.download = "Campus_Reports.csv";
    link.click();
});

window.updateStatus = async (id, status) => { await updateDoc(doc(db, "issues", id), { status }); };
window.deleteDoc = async (id) => { if(confirm("Delete?")) await deleteDoc(doc(db, "issues", id)); };
document.getElementById('logout-btn').addEventListener('click', () => signOut(auth));