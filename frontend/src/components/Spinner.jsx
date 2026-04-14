import styles from "./Spinner.module.css";

export default function Spinner() {
  return (
    <div className={styles.wrapper}>
      <div className={styles.ring} />
      <p className={styles.label}>scanning repository...</p>
    </div>
  );
}
