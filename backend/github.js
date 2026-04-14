const axios = require("axios");

const GITHUB_API = "https://api.github.com";

/**
 * Build an axios instance with auth headers.
 */
function githubClient() {
  const headers = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (process.env.GITHUB_TOKEN) {
    headers["Authorization"] = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return axios.create({ baseURL: GITHUB_API, headers });
}

/**
 * Parse a GitHub URL into { owner, repo }.
 */
function parseRepoUrl(url) {
  try {
    const cleaned = url.trim().replace(/\.git$/, "");
    const parsed = new URL(cleaned);
    if (parsed.hostname !== "github.com") {
      throw new Error("URL must be a github.com repository.");
    }
    const parts = parsed.pathname.split("/").filter(Boolean);
    if (parts.length < 2) {
      throw new Error("URL must include both owner and repository name.");
    }
    return { owner: parts[0], repo: parts[1] };
  } catch (err) {
    if (err.message.includes("github.com") || err.message.includes("owner")) {
      throw err;
    }
    throw new Error("Invalid URL format. Example: https://github.com/owner/repo");
  }
}

/**
 * Fetch the repository owner login.
 */
async function getRepoOwner(client, owner, repo) {
  const { data } = await client.get(`/repos/${owner}/${repo}`);
  return data.owner.login;
}

/**
 * Fetch collaborators (may fail silently if no permission).
 */
async function getCollaborators(client, owner, repo) {
  const logins = new Set();
  let page = 1;

  while (true) {
    try {
      const { data } = await client.get(`/repos/${owner}/${repo}/collaborators`, {
        params: { per_page: 100, page },
      });
      if (!data.length) break;
      data.forEach((u) => logins.add(u.login));
      if (data.length < 100) break;
      page++;
    } catch (err) {
      if (err.response?.status === 403 || err.response?.status === 404) break;
      throw err;
    }
  }

  return logins;
}

/**
 * Fetch ALL open issues (excluding PRs).
 */
async function getOpenIssues(client, owner, repo) {
  const issues = [];
  let page = 1;

  while (true) {
    const { data } = await client.get(`/repos/${owner}/${repo}/issues`, {
      params: { state: "open", per_page: 100, page },
    });
    if (!data.length) break;

    const realIssues = data.filter((i) => !i.pull_request);
    issues.push(...realIssues);

    if (data.length < 100) break;
    page++;
  }

  return issues;
}

/**
 * 🔥 Detect frequent issue creators (>= 2 open & unassigned)
 */
function getFrequentCreators(issues, minIssues = 2) {
  const countMap = new Map();

  issues.forEach((issue) => {
    if (issue.assignee) return; // only unassigned
    const user = issue.user?.login;
    if (!user || user.toLowerCase().includes("bot")) return;

    countMap.set(user, (countMap.get(user) || 0) + 1);
  });

  const frequent = new Set();

  for (const [user, count] of countMap.entries()) {
    if (count >= minIssues) {
      frequent.add(user);
    }
  }

  return frequent;
}

/**
 * 🔥 Assignment pattern maintainers (open + closed)
 */
async function getAssignmentPatternMaintainers(client, owner, repo, minIssues = 2) {
  const map = new Map();
  let page = 1;

  while (true) {
    const { data } = await client.get(`/repos/${owner}/${repo}/issues`, {
      params: { state: "all", per_page: 100, page },
    });

    if (!data.length) break;

    const realIssues = data.filter((i) => !i.pull_request);

    realIssues.forEach((issue) => {
      const creator = issue.user?.login;
      const assignee = issue.assignee?.login;

      if (!creator || !assignee) return;
      if (creator === assignee) return;
      if (creator.toLowerCase().includes("bot")) return;

      map.set(creator, (map.get(creator) || 0) + 1);
    });

    if (data.length < 100) break;
    page++;
  }

  const result = new Set();

  for (const [user, count] of map.entries()) {
    if (count >= minIssues) result.add(user);
  }

  return result;
}

/**
 * 🔥 Build mentor set (FINAL LOGIC)
 */
async function buildMentorSet(client, owner, repo, ownerLogin, collaborators) {
  const openIssues = await getOpenIssues(client, owner, repo);

  // ✅ STEP 1: Assignment pattern FIRST (strong signal)
  const assignmentPattern = await getAssignmentPatternMaintainers(
    client,
    owner,
    repo,
    2
  );

  let selectedMaintainer = null;

  // ✅ Case 1: exactly one strong maintainer → use directly
  if (assignmentPattern.size >= 1) {
    selectedMaintainer = [...assignmentPattern][0];
  }

  // ✅ Case 2: multiple → still prefer them (don’t collapse to one unless you want)
  // else if (assignmentPattern.size > 1) {
  //   // OPTION A: pick all (better accuracy)
  //   // OPTION B: pick none and fallback (your strict logic)
    
  //   // 👉 If you want STRICT 1-person logic:
  //   selectedMaintainer = [...assignmentPattern][0]; // or apply tie-break if needed
  // }

  // ✅ Case 3: no assignment pattern → fallback to freq
  else {
    const countMap = new Map();

    openIssues.forEach((issue) => {
      if (issue.assignee) return;

      const user = issue.user?.login;
      if (!user || user.toLowerCase().includes("bot")) return;

      countMap.set(user, (countMap.get(user) || 0) + 1);
    });

    // ✅ filter only users with >= 2
    const validUsers = [...countMap.entries()].filter(
      ([_, count]) => count >= 2
    );

    if (validUsers.length === 0) {
      console.log("⚠️ No user with >=2 unassigned issues → no maintainer selected");
      selectedMaintainer = null;
    } else {
      // pick max among valid users
      let maxCount = 0;

      for (const [user, count] of validUsers) {
        if (count > maxCount) {
          maxCount = count;
          selectedMaintainer = user;
        }
      }

      console.log("⚠️ Fallback to Frequent Creators (>=2)");
      console.log("🎯 Selected:", selectedMaintainer, "Count:", maxCount);
    }
  }

  // ✅ Final mentor set
  const mentorSet = new Set([
    ownerLogin,
    ...collaborators,
  ]);

  if (selectedMaintainer) {
    mentorSet.add(selectedMaintainer);
  }

  console.log("👑 Owner:", ownerLogin);
  console.log("🤝 Collaborators:", [...collaborators]);
  console.log("📌 Assignment Pattern:", [...assignmentPattern]);
  console.log("🎯 Selected Maintainer:", selectedMaintainer);
  console.log("🧠 Mentor Set:", [...mentorSet]);

  return { mentorSet, openIssues };
}

/**
 * Core filtering logic.
 */
function filterAvailableIssues(issues, mentorSet, maxComments) {
  return issues.filter((issue) => {
    const isOpen = issue.state === "open";
    const createdByMentor = mentorSet.has(issue.user?.login);
    const notAssigned = issue.assignee === null || issue.assignee === undefined;
    const noPR = !issue.pull_request;
    const lowComments = issue.comments <= maxComments;

    return isOpen && createdByMentor && notAssigned && noPR && lowComments;
  });
}

/**
 * Format issue output.
 */
function formatIssue(issue) {
  return {
    id: issue.number,
    title: issue.title,
    url: issue.html_url,
    creator: issue.user?.login ?? "unknown",
    labels: issue.labels.map((l) => ({
      name: l.name,
      color: l.color,
    })),
    comments: issue.comments,
    createdAt: issue.created_at,
  };
}

async function getAllIssues(client, owner, repo) {
  const issues = [];
  let page = 1;

  while (true) {
    const { data } = await client.get(`/repos/${owner}/${repo}/issues`, {
      params: { state: "all", per_page: 100, page },
    });

    if (!data.length) break;

    const realIssues = data.filter((i) => !i.pull_request);
    issues.push(...realIssues);

    if (data.length < 100) break;
    page++;
  }

  return issues;
}

module.exports = {
  githubClient,
  parseRepoUrl,
  getRepoOwner,
  getCollaborators,
  getOpenIssues,
  getAllIssues,
  filterAvailableIssues,
  formatIssue,
  buildMentorSet,
};