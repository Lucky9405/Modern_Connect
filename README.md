# 🚀 ModernConnect
> **The Unified Campus Transparency & Safety Ecosystem**

ModernConnect is a full-stack MVP designed to bridge the communication gap between students and college administration. It transforms traditional grievance handling into a real-time, data-driven experience.

---

## ✨ Key Features

### 👨‍🎓 Student Portal
* **Campus Pulse:** A real-time feed of infrastructure & academic issues (Electrical, IT, Hygiene, etc.).
* **Upvote System:** Community-driven priority—popular issues get a "Trending" badge.
* **Digital ID Profile:** Students manage their Academic ID (Course, Year, Roll No) within the app.
* **Safety SOS:** One-tap emergency alert that sends exact GPS coordinates to the Admin console.
* **Admin Broadcasts:** Instant view of official college announcements via a global banner.
* **Direct Feedback:** A direct line for students to suggest features or report bugs.

### 🛡️ Admin Dashboard
* **Analytics Hub:** Real-time charts showing the distribution of issues across categories.
* **Moderation Queue:** Sort and filter issues by priority (upvotes) and status (Pending/Resolved).
* **SOS Command Center:** Instant red alerts with Google Maps integration for student emergencies.
* **Broadcast Manager:** Post global announcements that reach all student devices instantly.
* **Feedback Review:** Dedicated section to read and manage student suggestions.

---

## 🛠 Tech Stack

- **Frontend:** HTML5, CSS3, JavaScript (ES6+)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Database:** [Firebase Firestore](https://firebase.google.com/docs/firestore) (Real-time NoSQL)
- **Authentication:** [Firebase Auth](https://firebase.google.com/docs/auth) (Role-Based Access Control)
- **Visualization:** [Chart.js](https://www.chartjs.org/)
- **Mobile:** WebView Wrapper for Android APK

---

## ⚙️ Security & Roles (RBAC)
The system is secured using **Role-Based Access Control (RBAC)** via Firebase Security Rules:
- **Students:** Can create reports, upvote, and edit their own academic profiles.
- **Admins:** Can delete reports, resolve issues, post broadcasts, and view sensitive feedback/SOS data.
- **Login Guard:** Prevents Admins from entering student portals and vice versa based on Firestore roles.

---

## 📂 Repository Structure
```text
├── index.html              # Landing Page & Student Auth
├── admin-login.html        # Restricted Admin Access Portal
├── student.html            # Student Pulse Dashboard
├── admin.html              # Management & Analytics Console
├── js/
│   ├── firebase-config.js  # DB Configuration & API Keys
│   ├── login.js            # Student Auth & Role Guard
│   ├── admin-login.js      # Admin Auth & Role Guard
│   ├── community-student.js # Core Student Logic (SOS, Feed, Profile)
│   └── admin.js            # Core Admin Logic (Charts, Broadcasts)
└── README.md               # Documentation
