import { useState, useEffect } from "react";
import styles from "./FullScreenSpinner.module.css";

export default function FullScreenSpinner() {
  const [message, setMessage] = useState("Connecting to server...");

  useEffect(() => {
    // Change message only if it's taking longer
    const timer = setTimeout(() => {
      setMessage("Waking up the server...\nThis may take a few seconds.");
    }, 4500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={styles.overlay}>
      <div className={styles.ring} />
      <p className={styles.label}>{message}</p>
    </div>
  );
}