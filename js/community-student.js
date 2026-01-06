import { auth, db } from './firebase-config.js';
import { collection, addDoc, onSnapshot, query, orderBy, doc, updateDoc, arrayUnion, arrayRemove, getDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const feedContainer = document.getElementById('community-feed');
const searchInput = document.getElementById('search-feed');
const categorySelect = document.getElementById('category');
const otherContainer = document.getElementById('other-category-container');
const otherInput = document.getElementById('other-category-input');
let activeIssueId = null;
let allIssues = [];
let currentView = 'feed';

// --- 1. AUTH & PROFILE SYNC ---
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
            const d = userDoc.data();
            const init = d.name[0].toUpperCase();
            document.getElementById('nav-user-initial').innerText = init;
            document.getElementById('nav-user-name').innerText = d.name;
            document.getElementById('modal-user-initial').innerText = init;
            document.getElementById('modal-user-name').innerText = d.name;
            document.getElementById('modal-user-email').innerText = d.email;
            
            // Sync Profile Form
            document.getElementById('edit-course').value = d.course || '';
            document.getElementById('edit-year').value = d.year || '';
            document.getElementById('edit-div').value = d.division || '';
            document.getElementById('edit-roll').value = d.rollNo || '';
        }
    } else { window.location.href = "index.html"; }
});

// --- 2. PROFILE EDIT LOGIC ---
document.getElementById('profile-edit-form').onsubmit = async (e) => {
    e.preventDefault();
    const btn = document.getElementById('save-profile-btn');
    btn.disabled = true; btn.innerText = "Saving...";
    
    await updateDoc(doc(db, "users", auth.currentUser.uid), {
        course: document.getElementById('edit-course').value,
        year: document.getElementById('edit-year').value,
        division: document.getElementById('edit-div').value,
        rollNo: document.getElementById('edit-roll').value
    });
    
    btn.innerText = "Updated!";
    setTimeout(() => { 
        btn.disabled = false; btn.innerText = "Update Profile";
        toggleModal('profile-modal', false);
    }, 1500);
};

// --- 3. UI CONTROLS ---
window.toggleModal = (id, show) => document.getElementById(id).classList.toggle('hidden', !show);
categorySelect.onchange = (e) => otherContainer.classList.toggle('hidden', e.target.value !== 'Other');

const switchTab = (tab) => {
    currentView = tab;
    document.getElementById('feed-section').classList.toggle('hidden', tab === 'report');
    document.getElementById('stats-bar').classList.toggle('hidden', tab === 'report');
    document.getElementById('report-section').classList.toggle('hidden', tab !== 'report');
    ['tab-feed', 'tab-my-activity', 'tab-report'].forEach(t => {
        document.getElementById(t).className = t === `tab-${tab}` ? 'px-5 py-2 rounded-xl font-bold text-xs bg-white shadow-sm text-indigo-600' : 'px-5 py-2 rounded-xl font-bold text-xs text-slate-500';
    });
    processAndRender();
};
document.getElementById('tab-feed').onclick = () => switchTab('feed');
document.getElementById('tab-my-activity').onclick = () => switchTab('my-activity');
document.getElementById('tab-report').onclick = () => switchTab('report');

// --- 4. DATA LISTENER & FEED ---
onSnapshot(query(collection(db, "issues"), orderBy("timestamp", "desc")), (snapshot) => {
    allIssues = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    processAndRender();
});

function processAndRender() {
    const data = currentView === 'my-activity' ? allIssues.filter(i => i.uid === auth.currentUser.uid) : allIssues;
    let up = 0, res = 0, pen = 0, tId = null, maxV = 0;

    data.forEach(i => {
        const v = i.upvotes ? i.upvotes.length : 0;
        up += v; i.status === 'resolved' ? res++ : pen++;
        if (currentView === 'feed' && v > maxV && v > 0) { maxV = v; tId = i.id; }
    });

    document.getElementById('total-upvotes-stats').innerText = up;
    document.getElementById('total-resolved-stats').innerText = res;
    document.getElementById('total-pending-stats').innerText = pen;
    document.getElementById('community-power').innerText = data.length ? Math.round((up / data.length) * 10) + '%' : '0%';
    renderFeed(data, tId);
}

function renderFeed(data, trendingId) {
    if (!data.length) { feedContainer.innerHTML = `<div class="col-span-full py-20 text-slate-400 font-bold text-center">Empty</div>`; return; }

    const getCat = (c) => ({ 'Electrical': 'bg-red-50 text-red-600', 'Parking': 'bg-slate-100 text-slate-700' }[c] || 'bg-indigo-50 text-indigo-600');

    feedContainer.innerHTML = data.map(i => {
        const isT = i.id === trendingId;
        const init = i.reporterName ? i.reporterName[0].toUpperCase() : 'S';
        return `
        <div class="bg-white rounded-[2.5rem] p-8 border ${isT ? 'trending-card' : 'border-slate-100'} relative animate-fadeIn">
            ${isT ? '<div class="absolute -top-3 left-6 bg-indigo-600 text-white text-[10px] font-black px-3 py-1 rounded-lg uppercase">🔥 Trending</div>' : ''}
            <div class="flex justify-between items-start mb-6">
                <span class="${getCat(i.category)} px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">${i.category}</span>
                <span class="text-[9px] font-black text-slate-300 uppercase">${i.status}</span>
            </div>
            <h3 class="text-xl font-black text-slate-800 leading-tight mb-2">${i.location}</h3>
            <p class="text-sm text-slate-500 mb-6 line-clamp-2">${i.description}</p>
            
            <div class="flex items-center gap-2 mb-6 p-2 bg-slate-50 rounded-2xl w-fit">
                <div class="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center text-[10px] font-black">${init}</div>
                <div>
                    <p class="text-[11px] font-black text-slate-700 leading-none">${i.reporterName || 'Student'}</p>
                    <p class="text-[8px] font-bold text-slate-400 uppercase mt-0.5">${i.course || ''} ${i.year || ''} - Roll: ${i.rollNo || 'N/A'}</p>
                </div>
            </div>

            <div class="flex gap-3 pt-4 border-t border-slate-50">
                <button onclick="upvote('${i.id}')" class="flex-1 bg-slate-50 py-3 rounded-2xl flex items-center justify-center gap-2 font-black text-xs">▲ ${i.upvotes?.length || 0}</button>
                <button onclick="showComments('${i.id}')" class="flex-1 bg-slate-50 py-3 rounded-2xl flex items-center justify-center font-black text-xs text-slate-600 uppercase">💬 Discuss</button>
            </div>
        </div>`;
    }).join("");
}

// --- 5. INTERACTIONS ---
window.upvote = async (id) => {
    const ref = doc(db, "issues", id); const snap = await getDoc(ref); const v = snap.data().upvotes || [];
    v.includes(auth.currentUser.uid) ? await updateDoc(ref, { upvotes: arrayRemove(auth.currentUser.uid) }) : await updateDoc(ref, { upvotes: arrayUnion(auth.currentUser.uid) });
};

window.showComments = (id) => {
    activeIssueId = id; toggleModal('comment-modal', true);
    onSnapshot(query(collection(db, "issues", id, "comments"), orderBy("timestamp", "asc")), (snap) => {
        document.getElementById('comments-list').innerHTML = snap.docs.map(d => {
            const data = d.data();
            return `<div class="flex gap-3 items-start animate-fadeIn">
                <div class="w-8 h-8 bg-slate-800 text-white rounded-full flex items-center justify-center text-[10px] font-black">${data.authorName[0]}</div>
                <div class="bg-slate-100 p-4 rounded-2xl rounded-tl-none flex-1">
                    <p class="text-[10px] font-black uppercase text-slate-400 mb-1">${data.authorName}</p>
                    <p class="text-sm text-slate-600">${data.text}</p>
                </div>
            </div>`;
        }).join("");
    });
};

document.getElementById('send-comment').onclick = async () => {
    const i = document.getElementById('new-comment'); if (!i.value.trim()) return;
    const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
    await addDoc(collection(db, "issues", activeIssueId, "comments"), {
        text: i.value, authorName: userDoc.data().name, uid: auth.currentUser.uid, likes: [], timestamp: serverTimestamp()
    });
    i.value = "";
};

document.getElementById('issue-form').onsubmit = async (e) => {
    e.preventDefault();
    const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
    const ud = userDoc.data();
    await addDoc(collection(db, "issues"), {
        category: categorySelect.value === 'Other' ? otherInput.value : categorySelect.value,
        location: document.getElementById('location').value,
        description: document.getElementById('description').value,
        status: "reported", uid: auth.currentUser.uid,
        reporterName: ud.name, course: ud.course || '', year: ud.year || '', rollNo: ud.rollNo || '',
        upvotes: [], timestamp: serverTimestamp()
    });
    switchTab('feed'); document.getElementById('issue-form').reset();
};

document.getElementById('logout-btn').onclick = () => signOut(auth).then(() => window.location.href = "index.html");