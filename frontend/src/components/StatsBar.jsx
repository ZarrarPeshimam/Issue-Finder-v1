import styles from "./StatsBar.module.css";

// MODIFIED: use pagination.total for accurate "Available" count
const STATS = (data) => [
  { label: "Repository",    value: data.repo,                                   accent: false },
  { label: "Open Issues",   value: data.totalOpenIssues,                        accent: false },
  { label: "Maintainers Found", value: data.mentorCount,                            accent: false },
  { label: "Available",     value: data.pagination?.total ?? data.availableIssues.length, accent: true },
];

export default function StatsBar({ data }) {
  return (
    <div className={styles.bar}>
      {STATS(data).map((stat, i) => (
        <div
          key={stat.label}
          className={`${styles.cell} ${stat.accent ? styles.accent : ""} ${i < 3 ? styles.bordered : ""}`}
        >
          <span className={styles.cellLabel}>{stat.label}</span>
          <span className={styles.cellValue} data-small={i === 0}>{stat.value}</span>
        </div>
      ))}
    </div>
  );
}
