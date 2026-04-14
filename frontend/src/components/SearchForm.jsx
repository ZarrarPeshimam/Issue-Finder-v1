import { IconSearch } from "./Icons";
import styles from "./SearchForm.module.css";

// ADDED: mode options
const MODE_OPTIONS = [
  { value: "normal",   label: "Normal Mode" },
  { value: "advanced", label: "Advanced Mode" },
];

export default function SearchForm({
  repoUrl, setRepoUrl,
  maxComments, setMaxComments,
  mode, setMode,          // ADDED
  onSubmit, loading,
}) {
  const disabled = loading || !repoUrl.trim();

  const handleKey = (e) => {
    if (e.key === "Enter") onSubmit();
  };

  return (
    <div className={styles.card}>
      <div className={styles.field}>
        <label className={styles.label}>Repository URL</label>
        <input
          type="url"
          className={styles.input}
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
          onKeyDown={handleKey}
          placeholder="https://github.com/owner/repo"
          disabled={loading}  // ADDED: disable while loading
        />
      </div>

      {/* ADDED: Mode selector row */}
      <div className={styles.field}>
        <label className={styles.label}>Mode</label>
        <select
          className={styles.select}
          value={mode}
          onChange={(e) => setMode(e.target.value)}
          disabled={loading}
        >
          {MODE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <div className={styles.row}>
        {/* MODIFIED: hide maxComments in normal mode (it's unused there) */}
        {mode === "advanced" && (
          <div className={styles.field}>
            <label className={styles.label}>Max Comments</label>
            <input
              type="number"
              className={styles.inputNarrow}
              value={maxComments}
              min={0}
              onChange={(e) => setMaxComments(Number(e.target.value))}
              disabled={loading}
            />
          </div>
        )}

        <button
          className={styles.button}
          onClick={onSubmit}
          disabled={disabled}
          data-disabled={disabled}
        >
          <IconSearch />
          {loading ? "Scanning..." : "Find Available Issues"}
        </button>
      </div>
    </div>
  );
}
