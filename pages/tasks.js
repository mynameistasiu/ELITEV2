import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Layout from "../components/Layout";
import { claimTaskReward, load, loadUser } from "../utils/storage";

const TASK_CLAIMS_KEY = "gt_task_claims";
const TASK_REWARD = 5000;
const tasks = [
  {
    id: "video-1",
    type: "video",
    title: "Watch & Earn · Video 1",
    description: "Explore a YouTube video about personal finance.",
    href: "https://www.youtube.com/results?search_query=personal+finance+basics",
  },
  {
    id: "video-2",
    type: "video",
    title: "Watch & Earn · Video 2",
    description: "Explore a YouTube video about digital wallet safety.",
    href: "https://www.youtube.com/results?search_query=digital+wallet+security",
  },
  {
    id: "video-3",
    type: "video",
    title: "Watch & Earn · Video 3",
    description: "Explore a YouTube video about saving and budgeting.",
    href: "https://www.youtube.com/results?search_query=saving+and+budgeting+tips",
  },
  {
    id: "telegram",
    type: "community",
    title: "Join Our Community",
    description: "Visit the ElitePay Telegram community.",
    href: "https://t.me/ueiejao",
  },
];

export default function Tasks() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [claimedTasks, setClaimedTasks] = useState({});
  const [taskMessage, setTaskMessage] = useState("");

  useEffect(() => {
    const user = loadUser();
    if (!user) {
      router.replace("/login");
      return;
    }
    const allClaims = load(TASK_CLAIMS_KEY) || {};
    const accountKey = String(user.phone || user.email || user.fullName || "account");
    setClaimedTasks(allClaims[accountKey] || {});
    setReady(true);
  }, [router]);

  const completeTask = (event, task) => {
    const result = claimTaskReward(task.id, TASK_REWARD);

    if (result.status === "error") {
      event.preventDefault();
      setTaskMessage(
        "We couldn’t save this reward. Please check your device storage and try again."
      );
      return;
    }

    const user = loadUser();
    const allClaims = load(TASK_CLAIMS_KEY) || {};
    const accountKey = String(user?.phone || user?.email || user?.fullName || "account");
    setClaimedTasks(allClaims[accountKey] || {});

    if (result.status === "claimed") {
      setTaskMessage(`Task completed. ₦${TASK_REWARD.toLocaleString()} was added to your wallet balance.`);
    } else {
      setTaskMessage("You’ve already claimed the reward for this task.");
    }
  };

  return (
    <Layout title="Tasks - ElitePay Wallet">
      <main className="tasks-page">
        <header className="tasks-header">
          <div>
            <p className="eyebrow">ELITEPAY REWARDS</p>
            <h1>Tasks</h1>
            <p>Choose an activity to open it in a new tab.</p>
          </div>
          <div className="reward-summary">
            <span>Reward per task</span>
            <strong>₦5,000</strong>
            <small>Claim each activity once · ₦20,000 total</small>
          </div>
        </header>

        <div className="task-notice" role="note">
          <strong>How rewards work:</strong> Opening a task marks it complete
          and adds ₦5,000 to your in-app wallet once. This app stores balances
          only in this browser; it does not verify that a video was watched or
          a channel joined, and the displayed balance is not a confirmed payout.
        </div>
        {taskMessage && (
          <p className="task-message" role="status">
            {taskMessage}
          </p>
        )}

        {!ready ? (
          <div className="tasks-loading" aria-live="polite">
            Loading tasks...
          </div>
        ) : (
          <section className="task-grid" aria-label="Available tasks">
            {tasks.map((task, index) => (
              <article className="task-card" key={task.id}>
                <div className="task-card-top">
                  <span className="task-number">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="task-reward">
                    {claimedTasks[task.id] ? "₦5,000 claimed" : "₦5,000 reward"}
                  </span>
                </div>
                <div className="task-icon" aria-hidden="true">
                  {task.type === "video" ? "▶" : "✦"}
                </div>
                <h2>{task.title}</h2>
                <p>{task.description}</p>
                <a
                  className={`task-button${claimedTasks[task.id] ? " is-claimed" : ""}`}
                  href={task.href}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(event) => completeTask(event, task)}
                  aria-label={
                    claimedTasks[task.id]
                      ? `${task.title}: reward already claimed, open link again`
                      : `${task.title}: open task and claim reward`
                  }
                >
                  <span>
                    {claimedTasks[task.id]
                      ? "Reward claimed"
                      : task.type === "video"
                        ? "Open & claim reward"
                        : "Join Telegram"}
                  </span>
                  <span aria-hidden="true">
                    {claimedTasks[task.id] ? "✓" : "↗"}
                  </span>
                </a>
              </article>
            ))}
          </section>
        )}

        <button
          className="back-button"
          type="button"
          onClick={() => router.push("/dashboard")}
        >
          ← Back to dashboard
        </button>
      </main>

      <style jsx>{`
        .tasks-page {
          width: min(100%, 1080px);
          margin: 0 auto;
          padding: 24px 0 40px;
        }

        .tasks-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 20px;
        }

        .eyebrow {
          margin: 0 0 6px;
          color: var(--gt-primary);
          font-size: 11px;
          font-weight: 850;
          letter-spacing: 0.08em;
        }

        h1 {
          margin: 0;
          font-size: clamp(28px, 5vw, 36px);
        }

        .tasks-header p:not(.eyebrow) {
          margin: 6px 0 0;
          color: var(--gt-muted);
        }

        .reward-summary {
          display: grid;
          gap: 2px;
          min-width: 220px;
          padding: 16px 18px;
          border: 1px solid var(--gt-border);
          border-radius: var(--gt-radius);
          background: var(--gt-card);
        }

        .reward-summary span,
        .reward-summary small {
          color: var(--gt-muted);
          font-size: 11px;
        }

        .reward-summary strong {
          color: var(--gt-primary-dark);
          font-size: 22px;
        }

        .task-notice {
          margin-bottom: 20px;
          padding: 14px 16px;
          border: 1px solid #e8d7a9;
          border-radius: var(--gt-radius-sm);
          color: #654e1c;
          background: #fff9e9;
          font-size: 12px;
          line-height: 1.6;
        }

        .task-message {
          margin: -8px 0 18px;
          padding: 11px 14px;
          border: 1px solid #bfe6d1;
          border-radius: var(--gt-radius-sm);
          color: var(--gt-success);
          background: #effaf3;
          font-size: 12px;
          font-weight: 750;
        }

        .task-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }

        .task-card {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          min-height: 220px;
          padding: 16px;
          border: 1px solid var(--gt-border);
          border-radius: var(--gt-radius-lg);
          background: var(--gt-card);
          box-shadow: var(--gt-shadow);
          overflow: hidden;
          position: relative;
        }

        .task-card::before {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 4px;
          content: "";
          background: linear-gradient(90deg, #0d9665, #63d4a0);
        }

        .task-card:nth-child(2)::before {
          background: linear-gradient(90deg, #5b45cd, #b38bff);
        }

        .task-card:nth-child(3)::before {
          background: linear-gradient(90deg, #df722d, #ffc15f);
        }

        .task-card:nth-child(4)::before {
          background: linear-gradient(90deg, #16899b, #57d5c5);
        }

        .task-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
        }

        .task-number {
          color: var(--gt-muted);
          font-size: 12px;
          font-weight: 850;
        }

        .task-reward {
          padding: 5px 9px;
          border-radius: 999px;
          color: var(--gt-primary-dark);
          background: var(--gt-panel);
          font-size: 11px;
          font-weight: 800;
        }

        .task-icon {
          display: grid;
          place-items: center;
          width: 40px;
          height: 40px;
          margin-top: 13px;
          border-radius: 14px;
          color: #fff;
          background: linear-gradient(135deg, #11855c, #35ad79);
          font-size: 19px;
        }

        .task-card:nth-child(2) .task-icon {
          background: linear-gradient(135deg, #6546c7, #9472ef);
        }

        .task-card:nth-child(3) .task-icon {
          background: linear-gradient(135deg, #cf7132, #f2a04c);
        }

        .task-card:nth-child(4) .task-icon {
          background: linear-gradient(135deg, #118b83, #35b7a9);
        }

        .task-card h2 {
          margin: 11px 0 4px;
          font-size: 15px;
        }

        .task-card p {
          margin: 0 0 13px;
          color: var(--gt-muted);
          font-size: 12px;
        }

        .task-button {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          width: 100%;
          min-width: 0;
          min-height: 42px;
          margin-top: auto;
          padding: 9px 12px;
          border-radius: 12px;
          color: #fff;
          background: linear-gradient(135deg, #10845b, #36b77f);
          box-shadow: 0 7px 17px rgba(16, 132, 91, 0.2);
          font-size: 12px;
          font-weight: 800;
          text-decoration: none;
          transition: transform 160ms ease, box-shadow 160ms ease, filter 160ms ease;
        }

        .task-button:hover {
          transform: translateY(-1px);
          filter: saturate(1.08) brightness(1.03);
          box-shadow: 0 10px 22px rgba(16, 132, 91, 0.24);
        }

        .task-card:nth-child(2) .task-button {
          background: linear-gradient(135deg, #6546c7, #9472ef);
          box-shadow: 0 7px 17px rgba(101, 70, 199, 0.2);
        }

        .task-card:nth-child(3) .task-button {
          background: linear-gradient(135deg, #cf7132, #f2a04c);
          box-shadow: 0 7px 17px rgba(207, 113, 50, 0.2);
        }

        .task-card:nth-child(4) .task-button {
          background: linear-gradient(135deg, #118b83, #35b7a9);
          box-shadow: 0 7px 17px rgba(17, 139, 131, 0.2);
        }

        .task-button.is-claimed {
          background: linear-gradient(135deg, #53675d, #74877d);
          box-shadow: none;
        }

        .back-button {
          margin-top: 20px;
          padding: 9px 0;
          border: 0;
          color: var(--gt-primary-dark);
          background: transparent;
          font: inherit;
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
        }

        .tasks-loading {
          padding: 32px;
          border: 1px solid var(--gt-border);
          border-radius: var(--gt-radius);
          background: var(--gt-card);
          color: var(--gt-muted);
          text-align: center;
        }

        @media (max-width: 640px) {
          .tasks-header {
            align-items: stretch;
            flex-direction: column;
          }

          .reward-summary {
            min-width: 0;
          }

          .task-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 10px;
          }

          .task-card {
            min-height: 205px;
            padding: 13px;
          }

          .task-card-top {
            align-items: flex-start;
            gap: 5px;
          }

          .task-number {
            font-size: 10px;
          }

          .task-reward {
            padding: 4px 6px;
            font-size: 9px;
          }

          .task-card h2 {
            font-size: 13px;
          }

          .task-card p {
            font-size: 11px;
          }

          .task-button {
            min-height: 40px;
            padding: 8px 9px;
            font-size: 10px;
          }
        }

        @media (max-width: 360px) {
          .task-card {
            min-height: 198px;
            padding: 11px;
          }

          .task-reward {
            font-size: 8px;
          }

          .task-button {
            font-size: 9px;
          }
        }
      `}</style>
    </Layout>
  );
}
