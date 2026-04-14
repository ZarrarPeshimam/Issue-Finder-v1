import { useState, useCallback, useEffect } from "react";
import Header from "./components/Header";
import SearchForm from "./components/SearchForm";
import IssueList from "./components/IssueList";
import Spinner from "./components/Spinner";                 // your original small spinner
import FullScreenSpinner from "./components/FullScreenSpinner"; // full screen

import styles from "./App.module.css";

const LIMIT = 10;
const API_BASE = import.meta.env.VITE_API_BASE;

export default function App() {
  const [repoUrl, setRepoUrl] = useState("");
  const [maxComments, setMaxComments] = useState(0);
  const [mode, setMode] = useState("normal");

  const [initialLoading, setInitialLoading] = useState(true);   // Full screen on load
  const [loading, setLoading] = useState(false);                // Small spinner on Search
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);

  // ==================== INITIAL FULL SCREEN SPINNER (Onboarding) ====================
  useEffect(() => {
    const checkBackend = async () => {
      try {
        // Try to reach backend (will wait up to 25 seconds)
        const health = await fetch(`${API_BASE}/health`, {
          signal: AbortSignal.timeout(25000),
        });

        if (health.ok) {
          setInitialLoading(false);
        } else {
          throw new Error("not ok");
        }
      } catch (err) {
        // Backend is slow, cold, or completely off
        // Keep full screen spinner visible and show helpful error
        setError(
          "Server is starting up or not running.\n\n" +
          "Please start the backend with:\n" +
          "`npm run dev` in the backend folder\n\n" +
          "Or wait a few more seconds if it's waking up."
        );
        // Do NOT hide initialLoading here → user stays on full screen spinner
      }
    };

    checkBackend();
  }, [API_BASE]);

  // ==================== MANUAL SEARCH (uses small spinner) ====================
  const fetchPage = useCallback(
    async (targetPage) => {
      if (!repoUrl.trim()) return;

      setError(null);
      setResult(null);
      setLoading(true);

      const startTime = Date.now();

      try {
        const res = await fetch(`${API_BASE}/api/find-issues`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            repoUrl: repoUrl.trim(),
            maxComments,
            mode,
            page: targetPage,
            limit: LIMIT,
          }),
          signal: AbortSignal.timeout(40000), // 40 seconds max
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Something went wrong");
        } else {
          setResult(data);
          setPage(data.pagination?.page || targetPage);
        }
      } catch (err) {
        console.error(err);
        setError("Backend is not responding. Please check if server is running.");
      } finally {
        const elapsed = Date.now() - startTime;
        setTimeout(() => setLoading(false), Math.max(0, 400 - elapsed));
      }
    },
    [repoUrl, maxComments, mode, API_BASE]
  );

  const handleSubmit = useCallback(() => {
    setPage(1);
    fetchPage(1);
  }, [fetchPage]);

  const handlePrev = () => page > 1 && fetchPage(page - 1);
  const handleNext = () => fetchPage(page + 1);

  // Show full screen spinner on first visit (this stays until backend responds)
  if (initialLoading) {
    return <FullScreenSpinner />;
  }

  return (
    <div className={styles.page}>
      <Header />

      <SearchForm
        repoUrl={repoUrl}
        setRepoUrl={setRepoUrl}
        maxComments={maxComments}
        setMaxComments={setMaxComments}
        mode={mode}
        setMode={setMode}
        onSubmit={handleSubmit}
        loading={loading}
      />

      <div className={styles.contentWrapper}>
        {/* Original small scanning spinner for manual search */}
        {loading && <Spinner overlay />}

        {error && !loading && (
          <div className={styles.error}>⚠ {error}</div>
        )}

        {result && !loading && (
          <IssueList
            data={result}
            maxComments={maxComments}
            mode={mode}
            page={page}
            onPrev={handlePrev}
            onNext={handleNext}
          />
        )}
      </div>
    </div>
  );
}