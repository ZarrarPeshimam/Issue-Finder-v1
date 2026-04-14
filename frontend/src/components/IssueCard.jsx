import { IconIssue, IconArrow, IconUser, IconComment } from "./Icons";
import styles from "./IssueCard.module.css";

function getLabelStyle(hexColor) {
  const r = parseInt(hexColor.slice(0, 2), 16);
  const g = parseInt(hexColor.slice(2, 4), 16);
  const b = parseInt(hexColor.slice(4, 6), 16);
  return {
    background: `rgba(${r},${g},${b},0.15)`,
    borderColor: `rgba(${r},${g},${b},0.5)`,
    color: `rgb(${Math.min(r + 60, 255)},${Math.min(g + 60, 255)},${Math.min(b + 60, 255)})`,
  };
}

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  return `${Math.floor(diff / 2592000)}mo ago`;
}

export default function IssueCard({ issue, index }) {
  return (
    <a
      href={issue.url}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.card}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <span className={styles.issueIcon}><IconIssue /></span>
          <span className={styles.title}>{issue.title}</span>
        </div>
        <span className={styles.arrowIcon}><IconArrow /></span>
      </div>

      {issue.labels.length > 0 && (
        <div className={styles.labels}>
          {issue.labels.map((label) => (
            <span key={label.name} className={styles.label} style={getLabelStyle(label.color)}>
              {label.name}
            </span>
          ))}
        </div>
      )}

      <div className={styles.meta}>
        <span className={styles.metaItem}>
          <IconUser /> {issue.creator}
        </span>
        <span className={styles.metaItem}>
          <IconComment /> {issue.comments} comment{issue.comments !== 1 ? "s" : ""}
        </span>
        <span className={styles.metaRight}>
          #{issue.id} · {timeAgo(issue.createdAt)}
        </span>
      </div>
    </a>
  );
}
