import classNames from "classnames";
import styles from "./status-feed.module.css";

export interface RunLog {
  id: string;
  status: "progress" | "success" | "error" | "info" | "uploading";
  title: string;
  detail?: string;
  timestamp: string;
  meta?: Record<string, unknown>;
}

interface Props {
  logs: RunLog[];
  active: boolean;
}

export function StatusFeed({ logs, active }: Props) {
  return (
    <div className={styles.wrapper}>
      <header>
        <h2>Status Stream</h2>
        <span
          className={classNames(styles.badge, {
            [styles.running]: active,
            [styles.idle]: !active
          })}
        >
          {active ? "running" : "idle"}
        </span>
      </header>
      <div className={styles.feed}>
        {logs.map((log) => (
          <article key={log.id} className={styles.row}>
            <span
              className={classNames(styles.pip, {
                [styles.success]: log.status === "success",
                [styles.error]: log.status === "error",
                [styles.progress]: log.status === "progress",
                [styles.info]: log.status === "info",
                [styles.uploading]: log.status === "uploading"
              })}
            />
            <div>
              <div className={styles.rowHeader}>
                <strong>{log.title}</strong>
                <time>{formatTime(log.timestamp)}</time>
              </div>
              {log.detail ? <p>{log.detail}</p> : null}
              {log.meta ? (
                <pre className={styles.meta}>
                  {JSON.stringify(log.meta, null, 2)}
                </pre>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function formatTime(timestamp: string) {
  try {
    const date = new Date(timestamp);
    return date.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
  } catch {
    return timestamp;
  }
}
