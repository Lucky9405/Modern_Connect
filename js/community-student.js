import { auth, db } from './firebase-config.js';
import { 
    collection, addDoc, onSnapshot, query, orderBy, 
    doc, updateDoc, arrayUnion, arrayRemove, getDoc, 
    serverTimestamp, limit 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// --- DOM ELEMENTS ---
const feedContainer = document.getElementById('community-feed');
const searchInput = document.getElementById('search-feed');
const categorySelect = document.getElementById('category');
const otherContainer = document.getElementById('other-category-container');
const otherInput = document.getElementById('other-category-input');
let allIssues = [];
let currentView = 'feed';

// --- 1. GLOBAL BROADCAST LISTENER ---
onSnapshot(query(collection(db, "broadcasts"), orderBy("timestamp", "desc"), limit(1)), (snapshot) => {
    const banner = document.getElementById('admin-announcement');
    const text = document.getElementById('announcement-text');
    if (!snapshot.empty) {
        text.innerText = snapshot.docs[0].data().message;
        banner.classList.remove('hidden');
    }
});

// --- 2. AUTH & ROLE PROTECTION ---
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
            const d = userDoc.data();
            if (d.role !== 'student') {
                alert("Admins must use the Admin Portal.");
                await signOut(auth);
                window.location.href = "index.html";
                return;
            }
            // Sync Profile UI
            const init = d.name[0].toUpperCase();
            document.getElementById('nav-user-initial').innerText = init;
            document.getElementById('nav-user-name').innerText = d.name;
            document.getElementById('modal-user-initial').innerText = init;
            document.getElementById('modal-user-name').innerText = d.name;
            document.getElementById('modal-user-email').innerText = d.email;
            
            // Sync Profile Edit Form
            document.getElementById('edit-course').value = d.course || '';
            document.getElementById('edit-year').value = d.year || '';
            document.getElementById('edit-div').value = d.division || '';
            document.getElementById('edit-roll').value = d.rollNo || '';
        }
    } else { 
        window.location.href = "index.html"; 
    }
});

// --- 3. FEEDBACK SUBMISSION ---
window.submitFeedback = async () => {
    const feedbackField = document.getElementById('feedback-text');
    const btn = document.getElementById('send-feedback-btn');
    if (!feedbackField.value.trim()) return;

    btn.disabled = true;
    try {
        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
        const ud = userDoc.data();

        await addDoc(collection(db, "feedback"), {
            text: feedbackField.value,
            senderName: ud.name,
            senderInfo: `${ud.course || ''} ${ud.year || ''}`,
            timestamp: serverTimestamp()
        });

        alert("Feedback sent!");
        feedbackField.value = "";
        toggleModal('feedback-modal', false);
    } catch (e) {
        alert("Error sending feedback. Check Rules.");
    } finally {
        btn.disabled = false;
    }
};

// --- 4. ISSUE FORM SUBMISSION ---
document.getElementById('issue-form').onsubmit = async (e) => {
    e.preventDefault();
    const submitBtn = e.target.querySelector('button');
    submitBtn.disabled = true;

    try {
        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
        const ud = userDoc.data();
        const finalCat = categorySelect.value === 'Other' ? otherInput.value : categorySelect.value;

        await addDoc(collection(db, "issues"), {
            category: finalCat,
            location: document.getElementById('location').value,
            description: document.getElementById('description').value,
            status: "reported",
            uid: auth.currentUser.uid,
            reporterName: ud.name,
            course: ud.course || '',
            year: ud.year || '',
            rollNo: ud.rollNo || '',
            upvotes: [],
            timestamp: serverTimestamp()
        });

        document.getElementById('issue-form').reset();
        switchTab('feed');
        document.getElementById('success-toast').classList.remove('hidden');
        setTimeout(() => document.getElementById('success-toast').classList.add('hidden'), 3000);
    } catch (err) {
        alert("Failed to post issue.");
    } finally {
        submitBtn.disabled = false;
    }
};

// --- 5. DATA RENDER (KEEP AS IS) ---
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
    feedContainer.innerHTML = data.map(i => {
        const isT = i.id === trendingId;
        return `
        <div class="bg-white rounded-[2.5rem] p-8 border ${isT ? 'trending-card' : 'border-slate-100'} relative animate-fadeIn">
            ${isT ? '<div class="absolute -top-3 left-6 bg-indigo-600 text-white text-[10px] font-black px-3 py-1 rounded-lg">🔥 Trending</div>' : ''}
            <div class="flex justify-between items-start mb-6">
                <span class="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">${i.category}</span>
                <span class="text-[9px] font-black text-slate-300 uppercase">${i.status}</span>
            </div>
            <h3 class="text-xl font-black text-slate-800 leading-tight mb-2">${i.location}</h3>
            <p class="text-sm text-slate-500 mb-6 line-clamp-2">${i.description}</p>
            <div class="flex items-center gap-2 mb-6 p-2 bg-slate-50 rounded-2xl w-fit">
                <div class="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center text-[10px] font-black">${i.reporterName ? i.reporterName[0] : 'S'}</div>
                <div>
                    <p class="text-[11px] font-black text-slate-700 leading-none">${i.reporterName}</p>
                    <p class="text-[8px] font-bold text-slate-400 uppercase mt-0.5">${i.course || ''} ${i.year || ''}</p>
                </div>
            </div>
            <div class="flex gap-3 pt-4 border-t border-slate-50">
                <button onclick="upvote('${i.id}')" class="flex-1 bg-slate-50 py-3 rounded-2xl font-black text-xs">▲ ${i.upvotes?.length || 0}</button>
                <button onclick="showComments('${i.id}')" class="flex-1 bg-slate-50 py-3 rounded-2xl font-black text-xs text-slate-600 uppercase">💬 Discuss</button>
            </div>
        </div>`;
    }).join("");
}

// --- GLOBAL ATTACHMENTS ---
window.toggleModal = (id, show) => document.getElementById(id).classList.toggle('hidden', !show);
window.upvote = async (id) => {
    const ref = doc(db, "issues", id); const snap = await getDoc(ref); const v = snap.data().upvotes || [];
    v.includes(auth.currentUser.uid) ? await updateDoc(ref, { upvotes: arrayRemove(auth.currentUser.uid) }) : await updateDoc(ref, { upvotes: arrayUnion(auth.currentUser.uid) });
};
const switchTab = (tab) => {
    currentView = tab;
    document.getElementById('feed-section').classList.toggle('hidden', tab === 'report');
    document.getElementById('stats-bar').classList.toggle('hidden', tab === 'report');
    document.getElementById('report-section').classList.toggle('hidden', tab !== 'report');
    processAndRender();
};
document.getElementById('tab-feed').onclick = () => switchTab('feed');
document.getElementById('tab-my-activity').onclick = () => switchTab('my-activity');
document.getElementById('tab-report').onclick = () => switchTab('report');
document.getElementById('logout-btn').onclick = () => signOut(auth).then(() => window.location.href = "index.html");