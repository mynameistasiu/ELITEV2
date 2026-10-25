import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import Layout from "../components/Layout";
import { loadUser, loadTx } from "../utils/storage";

export default function Notifications() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    const currentUser = loadUser();
    if (!currentUser) {
      router.replace("/login");
      return;
    }

    setUser(currentUser);
    setTransactions(loadTx().slice(0, 5));
  }, [router]);

  return (
    <Layout title="Notifications - ElitePay Wallet">
      <main className="notifications-page">
        <header className="notifications-heading">
          <p className="eyebrow">YOUR WALLET</p>
          <h1>Notifications</h1>
          <p>Important account updates and recent activity.</p>
        </header>

        {!user ? (
          <div className="notification-empty" aria-live="polite">
            Loading your notifications...
          </div>
        ) : (
          <section className="notification-list" aria-label="Notifications">
            {user.kycCompleted !== true && (
              <article className="notification-card notification-card--attention">
                <span className="notification-icon" aria-hidden="true">!</span>
                <div>
                  <strong>Complete your profile</strong>
                  <p>Finish your profile details to access the dashboard.</p>
                  <Link href="/profile">Complete profile →</Link>
                </div>
              </article>
            )}

            <article className="notification-card">
              <span className="notification-icon" aria-hidden="true">✦</span>
              <div>
                <strong>Welcome to ElitePay</strong>
                <p>Manage your wallet, review activity, and find account tools from your dashboard.</p>
                <Link href="/dashboard">Open dashboard →</Link>
              </div>
            </article>

            {transactions.map((transaction) => (
              <article className="notification-card" key={transaction.id || transaction.created_at}>
                <span className="notification-icon" aria-hidden="true">↗</span>
                <div>
                  <strong>
                    {String(transaction.type || "Wallet activity")
                      .replace(/[_-]/g, " ")
                      .replace(/\b\w/g, (letter) => letter.toUpperCase())}
                  </strong>
                  <p>
                    Status: {String(transaction.status || "recorded").toLowerCase()}.
                    {transaction.created_at
                      ? ` ${new Date(transaction.created_at).toLocaleString()}`
                      : ""}
                  </p>
                  <Link href="/history">View transaction history →</Link>
                </div>
              </article>
            ))}

            {transactions.length === 0 && (
              <div className="notification-empty">
                <span aria-hidden="true">✓</span>
                <strong>You’re all caught up</strong>
                <p>No new wallet activity to show.</p>
              </div>
            )}
          </section>
        )}
      </main>

      <style jsx>{`
        .notifications-page {
          width: min(100%, 760px);
          margin: 0 auto;
          padding: 24px 0 38px;
        }

        .notifications-heading {
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
          font-size: clamp(27px, 5vw, 34px);
        }

        .notifications-heading > p:last-child {
          margin: 6px 0 0;
          color: var(--gt-muted);
        }

        .notification-list {
          display: grid;
          gap: 11px;
        }

        .notification-card,
        .notification-empty {
          display: flex;
          align-items: flex-start;
          gap: 13px;
          padding: 17px;
          border: 1px solid var(--gt-border);
          border-radius: var(--gt-radius);
          background: var(--gt-card);
          box-shadow: var(--gt-shadow);
        }

        .notification-card--attention {
          border-color: #e8d7a9;
          background: #fffdf6;
        }

        .notification-icon {
          display: grid;
          flex: 0 0 38px;
          place-items: center;
          width: 38px;
          height: 38px;
          border-radius: 12px;
          color: var(--gt-primary-dark);
          background: var(--gt-panel);
          font-weight: 850;
        }

        .notification-card--attention .notification-icon {
          color: #8a5a10;
          background: #fff2cf;
        }

        .notification-card strong,
        .notification-empty strong {
          color: var(--gt-ink);
          font-size: 13px;
        }

        .notification-card p,
        .notification-empty p {
          margin: 4px 0 7px;
          color: var(--gt-muted);
          font-size: 12px;
          line-height: 1.5;
        }

        .notification-card a {
          font-size: 11px;
          font-weight: 800;
        }

        .notification-empty {
          flex-direction: column;
          align-items: center;
          padding: 34px 18px;
          color: var(--gt-primary);
          text-align: center;
        }

        .notification-empty p {
          margin-bottom: 0;
        }
      `}</style>
    </Layout>
  );
}
