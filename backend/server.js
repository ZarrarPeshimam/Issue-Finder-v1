require("dotenv").config();
const express = require("express");
const cors = require("cors");

const {
  githubClient,
  parseRepoUrl,
  getRepoOwner,
  getCollaborators,
  getOpenIssues,
  filterAvailableIssues,
  formatIssue,
  buildMentorSet,
} = require("./github");

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ─── Health check ─────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => res.json({ status: "ok" }));

// ─── Main endpoint ─────────────────────────────────────────────────────────────
/**
 * POST /api/find-issues
 * Body: { repoUrl: string, maxComments?: number, page?: number, limit?: number, mode?: string }
 * Returns: Issue[]
 */
app.post("/api/find-issues", async (req, res) => {
  // MODIFIED: destructure new fields page, limit, mode
  const { repoUrl, maxComments: rawMax, page: rawPage, limit: rawLimit, mode } = req.body;

  // ── Validate input ──────────────────────────────────────────────────────────
  if (!repoUrl || typeof repoUrl !== "string") {
    return res.status(400).json({ error: "repoUrl is required." });
  }

  const maxComments =
    rawMax !== undefined && rawMax !== null && rawMax !== ""
      ? parseInt(rawMax, 10)
      : 0;

  if (isNaN(maxComments) || maxComments < 0) {
    return res.status(400).json({ error: "maxComments must be a non-negative integer." });
  }

  // ADDED: pagination params
  const page  = Math.max(1, parseInt(rawPage,  10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(rawLimit, 10) || 10));

  // ADDED: mode param — "normal" or "advanced" (default = "normal")
  const selectedMode = mode === "advanced" ? "advanced" : "normal";

  // ── Parse URL ───────────────────────────────────────────────────────────────
  let owner, repo;
  try {
    ({ owner, repo } = parseRepoUrl(repoUrl));
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }

  const client = githubClient();

  try {
    // ── Step 1: Get repo owner ─────────────────────────────────────────────────
    let ownerLogin;
    try {
      ownerLogin = await getRepoOwner(client, owner, repo);
    } catch (err) {
      if (err.response?.status === 404) {
        return res.status(404).json({ error: `Repository "${owner}/${repo}" not found.` });
      }
      throw err;
    }

    // ── Step 2: Get collaborators ──────────────────────────────────────────────
    const collaborators = await getCollaborators(client, owner, repo);

    // MODIFIED: branch on mode — normal uses simple filter, advanced uses existing buildMentorSet logic
    let available;
    let openIssues;
    let mentorSet;

    if (selectedMode === "normal") {
      // ADDED: Normal mode — simple filter: open, no PR, 0 comments
      openIssues = await getOpenIssues(client, owner, repo);
      mentorSet  = new Set([ownerLogin, ...collaborators]); // still build for mentorCount stat
      available  = openIssues.filter(
        (i) => i.state === "open" && !i.pull_request && i.comments === 0
      );
    } else {
      // EXISTING advanced logic — untouched
      ({ mentorSet, openIssues } = await buildMentorSet(
        client, owner, repo, ownerLogin, collaborators
      ));
      available = filterAvailableIssues(openIssues, mentorSet, maxComments);
    }

    // ADDED: Pagination — applied AFTER all filtering
    const totalCount = available.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / limit));
    const safePage   = Math.min(page, totalPages);
    const start      = (safePage - 1) * limit;
    const paginated  = available.slice(start, start + limit);

    // ── Format & respond ───────────────────────────────────────────────────────
    return res.json({
      repo: `${owner}/${repo}`,
      ownerLogin,
      mentorCount: mentorSet.size,
      totalOpenIssues: openIssues.length,
      // MODIFIED: availableIssues is now paginated slice
      availableIssues: paginated.map(formatIssue),
      // ADDED: pagination metadata
      pagination: {
        total: totalCount,
        totalPages,
        page: safePage,
        limit,
      },
    });
  } catch (err) {
    console.error("[find-issues error]", err.message);

    if (err.response?.status === 403) {
      return res.status(403).json({
        error: "GitHub API rate limit exceeded or insufficient token permissions. Add a GITHUB_TOKEN in .env.",
      });
    }

    if (err.response?.data?.message) {
      return res.status(502).json({ error: `GitHub API error: ${err.response.data.message}` });
    }

    return res.status(500).json({ error: "An unexpected error occurred. Please try again." });
  }
});

// ─── 404 catch-all ────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: "Route not found." }));

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅  GitHub Issue Finder backend running on http://localhost:${PORT}`);
  if (!process.env.GITHUB_TOKEN) {
    console.warn("⚠️   No GITHUB_TOKEN set. You will hit GitHub's unauthenticated rate limit (60 req/hr).");
  }
});
