import IssueCard from "./IssueCard";
import StatsBar from "./StatsBar";
import styles from "./IssueList.module.css";

// ADDED: simple Pagination bar
function Pagination({ pagination, onPrev, onNext }) {
  const { page, totalPages, total } = pagination;
  if (totalPages <= 1) return null;

  return (
    <div className={styles.pagination}>
      <span className={styles.pageInfo}>
        Page {page} of {totalPages} &nbsp;·&nbsp; {total} issue{total !== 1 ? "s" : ""}
      </span>
      <div className={styles.pageButtons}>
        <button
          className={styles.pageBtn}
          onClick={onPrev}
          disabled={page <= 1}
          data-disabled={page <= 1}
        >
          ← Prev
        </button>
        <button
          className={styles.pageBtn}
          onClick={onNext}
          disabled={page >= totalPages}
          data-disabled={page >= totalPages}
        >
          Next →
        </button>
      </div>
    </div>
  );
}

// MODIFIED: accept pagination + mode props
export default function IssueList({ data, maxComments, mode, page, onPrev, onNext }) {
  return (
    <div className={styles.wrapper}>
      <StatsBar data={data} />

      {data.availableIssues.length === 0 ? (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>🔍</span>
          <p className={styles.emptyTitle}>No relevant issues found</p>
          <p className={styles.emptyBody}>
            {mode === "normal"
              ? "No open issues with 0 comments were found."
              : `No open issues match all criteria: created by a maintainer, unassigned, no PR, and ≤ ${maxComments} comment${maxComments !== 1 ? "s" : ""}.`}
          </p>
        </div>
      ) : (
        <>
          <div className={styles.list}>
            {data.availableIssues.map((issue, i) => (
              <IssueCard key={issue.id} issue={issue} index={i} />
            ))}
          </div>

          {/* ADDED */}
          <Pagination pagination={data.pagination} onPrev={onPrev} onNext={onNext} />
        </>
      )}
    </div>
  );
}
