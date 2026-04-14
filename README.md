# OSS Available Issue Finder

A small web application that helps contributors quickly find **genuinely available GitHub issues created by maintainers (owners / collaborators / active mentors)**.

Instead of relying only on labels or guesswork, this tool uses **intent-based filtering + smart maintainer detection** to surface issues that are most likely open for contributors.

---

## 🎯 Problem Statement

During OSS events, contributors often struggle to find issues that are:

* Actually meant for contributors
* Not already assigned or implicitly claimed
* Low competition

A major problem is that **many issues are created by contributors themselves**, not maintainers. These issues are often:

* Created with the intent of being self-assigned later
* Claimed quickly by the author
* Already discussed privately

👉 Picking such issues is risky and often leads to **wasted effort**.

---

## 💡 Key Insight (Core Idea)

Not all issues are equal.

* ❌ Issues by random contributors → **high risk**
* ✅ Issues by maintainers → **high probability of acceptance**

So instead of relying only on:

* labels (`good first issue`)
* comments
* or luck

👉 This project focuses on **WHO created the issue**.

---

## 🧠 Smart Maintainer Detection (Your Upgrade 🔥)

Instead of just using GitHub collaborators API (which may fail due to permissions), this app **intelligently builds a maintainer set** using multiple signals:

### Maintainer = ANY of:

1. 👑 **Repository Owner**
2. 🤝 **Collaborators (if accessible via API)**
3. 🔁 **Users who assign issues**
4. 🔥 **Users who created multiple open issues**

> This ensures we still detect mentors/maintainers even when GitHub restricts collaborator visibility.

---

## ✅ What This App Does

Given a GitHub repository URL, the app:

1. Fetches all **open issues**
2. Dynamically builds a **maintainer/mentor set**
3. Filters issues to show only those that:

   * Are **open**
   * Are **created by detected maintainers**
   * Are **not assigned**
   * Have **no linked pull request**
   * Have **low comments** (configurable)

---

## 🧠 Core Filtering Logic

An issue is considered **available** only if:

* `state === open`
* `issue creator ∈ maintainerSet`
* `assignee === null`
* `pull_request === undefined`
* `comments <= maxComments` (default: `0`)

---

## ⚙️ Maintainer Detection Logic (Detailed)

The backend builds:

```js
maintainerSet = union(
  repoOwner,
  collaborators,
  issueAssignees,
  frequentIssueCreators (>= 2 open issues)
)
```

This makes the system:

* ✅ More robust
* ✅ Less dependent on permissions
* ✅ Better at detecting real mentors

---

## 🖥️ Tech Stack

### Frontend

* React
* Fetch / Axios
* Minimal CSS / Tailwind (optional)

### Backend

* Node.js
* Express
* GitHub REST API

---

## 🔐 Why a Backend Is Used

* Protects GitHub token
* Avoids rate limits
* Centralizes filtering + logic

---

## 📡 API Endpoints Used

* `GET /repos/{owner}/{repo}`
* `GET /repos/{owner}/{repo}/collaborators`
* `GET /repos/{owner}/{repo}/issues`

---

## 📦 Setup Instructions

### 1️⃣ Clone

```bash
git clone <repo-url>
cd oss-available-issue-finder
```

---

### 2️⃣ Backend

```bash
cd backend
npm install
```

Create `.env`:

```env
GITHUB_TOKEN=your_token
PORT=5000
```

Run:

```bash
npm start
```

---

### 3️⃣ Frontend

```bash
cd frontend
npm install
npm start
```

---

## 🧪 Usage

1. Enter a GitHub repo URL
2. Set optional **Max Comments filter**
3. Click **Find Available Issues**
4. Open issues directly from results

---

## 🚫 Non-Goals

* No auth / login
* No DB
* No issue assignment
* No automation on GitHub

👉 Focus = **fast discovery only**

---

## 🌱 Future Enhancements

* Label filters (`good first issue`)
* Issue difficulty scoring
* Multi-repo scanning
* Chrome extension version

---

## 💡 Why This Project Stands Out

* Uses **intent-based filtering (creator-driven)**
* Adds **behavior-based maintainer detection** 🔥
* Solves a real OSS pain point
* Lightweight but impactful

---

## 📄 License

MIT

---

## 🚀 Final Thought

> This tool helps you find issues that are not just open — but **actually meant for you**.

---