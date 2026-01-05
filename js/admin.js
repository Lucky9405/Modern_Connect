import { auth, db } from './firebase-config.js';
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc, orderBy, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// --- SECURITY GUARD ---
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists() && userDoc.data().role !== 'admin') {
            alert("Unauthorized access denied!");
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
        <tr class="hover:bg-slate-50 border-l-4 ${i.category === 'Electrical' ? 'border-red-500' : 'border-transparent'}">
            <td class="px-8 py-5 font-bold text-slate-700">${i.category}</td>
            <td class="px-8 py-5 text-slate-500 text-sm">${i.location}</td>
            <td class="px-8 py-5">
                <span class="px-3 py-1 rounded-full text-[10px] font-bold uppercase ${i.status==='reported'?'bg-amber-50 text-amber-600':'bg-green-50 text-green-600'}">
                    ${i.status}
                </span>
            </td>
            <td class="px-8 py-5 text-right">
                <button onclick="updateStatus('${i.id}', 'resolved')" class="bg-slate-900 text-white px-3 py-1.5 rounded-lg text-xs font-bold">Resolve</button>
            </td>
        </tr>`).join("");
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
    let csv = "Category,Location,Status\n" + allIssues.map(i => `${i.category},${i.location},${i.status}`).join("\n");
    const link = document.createElement("a");
    link.href = 'data:text/csv;charset=utf-8,' + encodeURI(csv);
    link.download = "Reports.csv";
    link.click();
});

window.updateStatus = async (id, status) => { await updateDoc(doc(db, "issues", id), { status }); };
document.getElementById('logout-btn').addEventListener('click', () => signOut(auth));