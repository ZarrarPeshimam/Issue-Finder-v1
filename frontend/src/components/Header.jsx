import { IconGithub } from "./Icons";
import styles from "./Header.module.css";

export default function Header() {
  return (
    <div className={styles.wrapper}>
      <div className={styles.iconBox}>
        <IconGithub />
      </div>
      <div>
        <h1 className={styles.title}>Contributor Issue Finder</h1>
        <p className={styles.subtitle}>
          Finds open issues created by repo maintainers — unassigned,
          unlinked to a PR, and low in comments. The best "good first issue" candidates.
        </p>
      </div>
    </div>
  );
}
