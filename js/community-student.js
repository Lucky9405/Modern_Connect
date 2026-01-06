import { auth, db } from './firebase-config.js';
import { collection, addDoc, onSnapshot, query, orderBy, doc, updateDoc, arrayUnion, arrayRemove, getDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const feedContainer = document.getElementById('community-feed');
const searchInput = document.getElementById('search-feed');
const categorySelect = document.getElementById('category');
const otherContainer = document.getElementById('other-category-container');
const otherInput = document.getElementById('other-category-input');
let activeIssueId = null;
let allIssues = [];
let currentView = 'feed'; // Track if user is in 'feed' or 'my-activity'

// --- 1. TAB & CATEGORY LOGIC ---
categorySelect.addEventListener('change', (e) => {
    if (e.target.value === 'Other') {
        otherContainer.classList.remove('hidden');
        otherInput.required = true;
    } else {
        otherContainer.classList.add('hidden');
        otherInput.required = false;
    }
});

const switchTab = (tab) => {
    currentView = tab;
    const feed = document.getElementById('feed-section');
    const report = document.getElementById('report-section');
    const stats = document.getElementById('stats-bar');

    feed.classList.toggle('hidden', tab === 'report');
    stats.classList.toggle('hidden', tab === 'report');
    report.classList.toggle('hidden', tab !== 'report');

    const tabs = ['tab-feed', 'tab-my-activity', 'tab-report'];
    tabs.forEach(t => {
        const btn = document.getElementById(t);
        if (t === `tab-${tab}`) {
            btn.className = 'px-5 py-2 rounded-xl font-bold text-xs bg-white shadow-sm text-indigo-600 transition-all';
        } else {
            btn.className = 'px-5 py-2 rounded-xl font-bold text-xs text-slate-500 hover:text-indigo-600 transition-all';
        }
    });

    if(tab !== 'report') processAndRender();
};

document.getElementById('tab-feed').onclick = () => switchTab('feed');
document.getElementById('tab-my-activity').onclick = () => switchTab('my-activity');
document.getElementById('tab-report').onclick = () => switchTab('report');

// --- 2. DATA LISTENER & STATS ---
onSnapshot(query(collection(db, "issues"), orderBy("timestamp", "desc")), (snapshot) => {
    allIssues = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    processAndRender();
});

function processAndRender() {
    const displayData = currentView === 'my-activity' 
        ? allIssues.filter(i => i.uid === auth.currentUser.uid)
        : allIssues;

    // Calculate Stats
    let totalUpvotes = 0, resolved = 0, pending = 0, trendingId = null, maxVotes = 0;
    displayData.forEach(i => {
        const v = i.upvotes ? i.upvotes.length : 0;
        totalUpvotes += v;
        i.status === 'resolved' ? resolved++ : pending++;
    });

    // Trending logic only for main feed
    if (currentView === 'feed') {
        allIssues.forEach(i => {
            const v = i.upvotes ? i.upvotes.length : 0;
            if (v > maxVotes && v > 0) { maxVotes = v; trendingId = i.id; }
        });
    }

    // Update Stats Bar
    document.getElementById('total-upvotes-stats').innerText = totalUpvotes;
    document.getElementById('total-resolved-stats').innerText = resolved;
    document.getElementById('total-pending-stats').innerText = pending;
    document.getElementById('community-power').innerText = displayData.length ? Math.round((totalUpvotes / displayData.length) * 10) + '%' : '0%';
    document.getElementById('stat-label-upvotes').innerText = currentView === 'my-activity' ? 'My Support' : 'Global Support';

    renderFeed(displayData, trendingId);
}

// --- 3. PROFESSIONAL RENDERING (SHOWS REPORTER) ---
function renderFeed(data, trendingId) {
    if (data.length === 0) {
        feedContainer.innerHTML = `<div class="col-span-full text-center py-20 text-slate-400 font-bold italic">No reports found in this view.</div>`;
        return;
    }

    const getCatStyle = (cat) => {
        const map = {
            'Electrical': 'bg-red-50 text-red-600', 'IT Support': 'bg-indigo-50 text-indigo-600',
            'Hygiene': 'bg-emerald-50 text-emerald-600', 'Infrastructure': 'bg-amber-50 text-amber-600',
            'Parking': 'bg-slate-100 text-slate-700', 'Cafeteria': 'bg-orange-50 text-orange-600',
            'Security': 'bg-rose-50 text-rose-600'
        };
        return map[cat] || 'bg-slate-50 text-slate-500 border border-slate-200';
    };

    feedContainer.innerHTML = data.map(i => {
        const isTrending = i.id === trendingId;
        const initial = i.reporterName ? i.reporterName[0].toUpperCase() : 'S';
        const dateStr = i.timestamp ? new Date(i.timestamp.seconds * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Just now';

        return `
        <div class="bg-white rounded-[2.5rem] p-8 shadow-sm border ${isTrending ? 'trending-card' : 'border-slate-100'} relative animate-fadeIn transition-all duration-300">
            ${isTrending ? '<div class="absolute -top-3 left-6 bg-indigo-600 text-white text-[10px] font-black px-3 py-1 rounded-lg uppercase tracking-widest shadow-lg">🔥 Trending</div>' : ''}
            <div class="flex justify-between items-start mb-6">
                <span class="${getCatStyle(i.category)} px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">${i.category}</span>
                <span class="text-[9px] font-black ${i.status === 'resolved' ? 'text-emerald-500' : 'text-amber-500'} uppercase">${i.status}</span>
            </div>
            
            <h3 class="text-xl font-black text-slate-800 leading-tight mb-2">${i.location}</h3>
            <p class="text-sm text-slate-500 mb-6 line-clamp-2">${i.description}</p>
            
            <div class="flex items-center gap-2 mb-6 p-2 bg-slate-50/80 rounded-2xl w-fit">
                <div class="w-7 h-7 bg-indigo-600 text-white rounded-full flex items-center justify-center text-[10px] font-black shadow-sm">${initial}</div>
                <div class="pr-2">
                    <p class="text-[9px] font-bold text-slate-400 uppercase leading-none mb-0.5">Reported By</p>
                    <p class="text-[11px] font-black text-slate-700 leading-none">${i.reporterName || 'Student'} • ${dateStr}</p>
                </div>
            </div>

            <div class="flex gap-3 pt-4 border-t border-slate-50">
                <button onclick="upvote('${i.id}')" class="flex-1 bg-slate-50 hover:bg-indigo-50 py-3 rounded-2xl flex items-center justify-center gap-2 transition-all group/btn">
                    <span class="text-slate-400 group-hover:text-indigo-600 font-bold transition-transform group-active/btn:scale-125">▲</span>
                    <span class="text-xs font-black text-slate-600">${i.upvotes ? i.upvotes.length : 0}</span>
                </button>
                <button onclick="showComments('${i.id}')" class="flex-1 bg-slate-50 hover:bg-slate-100 py-3 rounded-2xl flex items-center justify-center gap-2 transition-all">
                    <span class="text-sm font-bold text-slate-400">💬 Discuss</span>
                </button>
            </div>
        </div>`;
    }).join("");
}

// --- 4. INTERACTIONS (UPVOTE, LIKES, COMMENTS) ---
window.upvote = async (id) => {
    const user = auth.currentUser;
    const ref = doc(db, "issues", id);
    const snap = await getDoc(ref);
    const votes = snap.data().upvotes || [];
    votes.includes(user.uid) ? await updateDoc(ref, { upvotes: arrayRemove(user.uid) }) : await updateDoc(ref, { upvotes: arrayUnion(user.uid) });
};

window.showComments = (id) => {
    activeIssueId = id;
    document.getElementById('comment-modal').classList.remove('hidden');
    onSnapshot(query(collection(db, "issues", id, "comments"), orderBy("timestamp", "asc")), (snap) => {
        const list = document.getElementById('comments-list');
        const colors = ['bg-indigo-500', 'bg-rose-500', 'bg-emerald-500', 'bg-amber-500', 'bg-sky-500'];
        list.innerHTML = snap.docs.map(d => {
            const data = d.data();
            const name = data.authorName || "Student";
            const init = name[0].toUpperCase();
            const color = colors[name.length % colors.length];
            const isLiked = data.likes?.includes(auth.currentUser.uid);
            return `
            <div class="flex gap-3 items-start animate-fadeIn">
                <div class="w-9 h-9 ${color} rounded-full flex-shrink-0 flex items-center justify-center text-white font-black text-[10px] shadow-md">${init}</div>
                <div class="flex-1">
                    <div class="bg-slate-100 p-4 rounded-2xl rounded-tl-none border border-slate-200/50 shadow-sm">
                        <div class="flex justify-between items-center mb-1">
                            <span class="text-[10px] font-black text-slate-800 uppercase tracking-tight">${name}</span>
                            <button onclick="likeComment('${id}', '${d.id}')" class="text-[10px] font-black ${isLiked ? 'text-rose-500' : 'text-slate-400'}">
                                ${isLiked ? '❤️' : '🤍'} ${data.likes?.length || 0}
                            </button>
                        </div>
                        <p class="text-sm text-slate-600 leading-relaxed">${data.text}</p>
                    </div>
                </div>
            </div>`;
        }).join("");
        list.scrollTop = list.scrollHeight;
    });
};

document.getElementById('send-comment').onclick = async () => {
    const input = document.getElementById('new-comment');
    if (!input.value.trim()) return;
    const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
    await addDoc(collection(db, "issues", activeIssueId, "comments"), {
        text: input.value, authorName: userDoc.data()?.name || "Student",
        uid: auth.currentUser.uid, likes: [], timestamp: serverTimestamp()
    });
    input.value = "";
};

window.likeComment = async (issueId, commentId) => {
    const ref = doc(db, "issues", issueId, "comments", commentId);
    const snap = await getDoc(ref);
    const likes = snap.data().likes || [];
    likes.includes(auth.currentUser.uid) ? await updateDoc(ref, { likes: arrayRemove(auth.currentUser.uid) }) : await updateDoc(ref, { likes: arrayUnion(auth.currentUser.uid) });
};

// --- 5. SEARCH & SUBMIT ---
searchInput.oninput = (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = allIssues.filter(i => i.location.toLowerCase().includes(term) || i.category.toLowerCase().includes(term));
    renderFeed(filtered, null);
};

document.getElementById('issue-form').onsubmit = async (e) => {
    e.preventDefault();
    let finalCat = categorySelect.value === 'Other' ? otherInput.value : categorySelect.value;
    const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));

    await addDoc(collection(db, "issues"), {
        category: finalCat, location: document.getElementById('location').value,
        description: document.getElementById('description').value, status: "reported",
        uid: auth.currentUser.uid, reporterName: userDoc.data()?.name || "Student",
        upvotes: [], timestamp: serverTimestamp()
    });
    switchTab('feed');
    document.getElementById('issue-form').reset();
    otherContainer.classList.add('hidden');
};

document.getElementById('logout-btn').onclick = () => signOut(auth).then(() => window.location.href = "index.html");