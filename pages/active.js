import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Layout from "../components/Layout";
import { loadUser } from "../utils/storage";

export default function Active() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [activated, setActivated] = useState(false);
  const [activationError, setActivationError] = useState("");

  useEffect(() => {
    if (!loadUser()) {
      router.replace("/login");
      return;
    }

    try {
      setActivated(localStorage.getItem("gt_activated") === "true");
    } catch (error) {
      console.error("Unable to read activation status:", error);
    }
    setReady(true);
  }, [router]);

  const activateAndContinue = () => {
    setActivationError("");

    if (activated) {
      router.replace("/dashboard");
      return;
    }

    try {
      localStorage.setItem("gt_activated", "true");
      localStorage.removeItem("gt_restriction_end");
      setActivated(true);
      router.replace("/dashboard");
    } catch (error) {
      console.error("Unable to activate account:", error);
      setActivationError(
        "We couldn’t update your account status. Please check your browser storage and try again."
      );
    }
  };

  return (
    <Layout title="Account Activation - ElitePay Wallet">
      <main className="activation-page">
        <section className="activation-card" aria-live="polite">
          <div className={`status-pill${activated ? " is-active" : ""}`}>
            <span className="status-dot" />
            {activated ? "ACCOUNT ACTIVE" : "ACCOUNT RESTRICTED"}
          </div>

          <h1>{activated ? "You’re all set" : "Restore wallet access"}</h1>
          <p className="activation-description">
            {activated
              ? "Your account is activated. Continue to your wallet dashboard."
              : "Tap the button to restore wallet access and return to your dashboard."}
          </p>

          <button
            className={`activation-circle${activated ? " is-active" : ""}`}
            type="button"
            onClick={activateAndContinue}
            disabled={!ready}
            aria-label={activated ? "Continue to dashboard" : "Activate account and open dashboard"}
          >
            <span className="circle-ring circle-ring-one" />
            <span className="circle-ring circle-ring-two" />
            <span className="circle-content">
              <span className="circle-icon" aria-hidden="true">
                {activated ? "✓" : "↗"}
              </span>
              <strong>
                {!ready
                  ? "Loading"
                  : activated
                    ? "Open Wallet"
                    : "Activate"}
              </strong>
              {!activated && <small>Tap to open dashboard</small>}
            </span>
          </button>

          {activationError && (
            <p className="activation-error" role="alert">
              {activationError}
            </p>
          )}

          <div className="activation-hint">
            {activated
              ? "Wallet access is currently active."
              : "This updates the activation status saved in this browser."}
          </div>

          {!activated && (
            <div className="activation-details">
              <h2>What this does</h2>
              <div className="activation-step">
                <span>✓</span>
                <p>Removes the local wallet restriction and opens your dashboard.</p>
              </div>
              <p className="activation-note">
                This app stores account status in your browser. It does not verify
                payment or change any server-side account status.
              </p>
            </div>
          )}
        </section>
      </main>

      <style jsx>{`
        .activation-page {
          display: grid;
          place-items: center;
          min-height: 70vh;
          padding: 26px 0 40px;
        }

        .activation-card {
          width: min(100%, 560px);
          padding: clamp(22px, 5vw, 38px);
          border: 1px solid var(--gt-border);
          border-radius: 24px;
          background:
            radial-gradient(circle at 50% 22%, rgba(29, 158, 104, 0.07), transparent 34%),
            var(--gt-card);
          box-shadow: var(--gt-shadow-hover);
          text-align: center;
        }

        .status-pill {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 7px 11px;
          border: 1px solid #f0dfb6;
          border-radius: 999px;
          color: #80520e;
          background: #fff8e8;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 0.07em;
        }

        .status-pill.is-active {
          border-color: #cce8d7;
          color: var(--gt-success);
          background: #effaf3;
        }

        .status-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #d49625;
        }

        .is-active .status-dot {
          background: var(--gt-success);
        }

        h1 {
          margin: 15px 0 7px;
          font-size: clamp(24px, 5vw, 32px);
          letter-spacing: -0.03em;
        }

        .activation-description {
          max-width: 420px;
          margin: 0 auto;
          color: var(--gt-muted);
          font-size: 13px;
          line-height: 1.65;
        }

        .activation-circle {
          position: relative;
          display: grid;
          place-items: center;
          width: 156px;
          height: 156px;
          margin: 33px auto 17px;
          padding: 0;
          border: 0;
          border-radius: 50%;
          color: #fff;
          background: linear-gradient(145deg, #0b6747, #159568 58%, #35b77f);
          box-shadow:
            0 16px 34px rgba(12, 112, 75, 0.28),
            inset 0 2px 4px rgba(255, 255, 255, 0.32);
          cursor: pointer;
          transition: transform 180ms ease, box-shadow 180ms ease;
          isolation: isolate;
        }

        .activation-circle:hover:not(:disabled) {
          transform: translateY(-3px) scale(1.025);
          box-shadow:
            0 20px 42px rgba(12, 112, 75, 0.34),
            inset 0 2px 4px rgba(255, 255, 255, 0.32);
        }

        .activation-circle:focus-visible {
          outline: 4px solid rgba(16, 132, 91, 0.24);
          outline-offset: 5px;
        }

        .activation-circle:disabled {
          cursor: wait;
          opacity: 0.72;
        }

        .activation-circle.is-active {
          background: linear-gradient(145deg, #087449, #159568);
        }

        .circle-ring {
          position: absolute;
          z-index: -1;
          inset: -11px;
          border: 1px solid rgba(16, 132, 91, 0.24);
          border-radius: 50%;
        }

        .circle-ring-two {
          inset: -21px;
          border-color: rgba(16, 132, 91, 0.12);
        }

        .circle-content {
          display: grid;
          justify-items: center;
          gap: 3px;
        }

        .circle-icon {
          display: grid;
          place-items: center;
          width: 39px;
          height: 39px;
          margin-bottom: 3px;
          border: 1px solid rgba(255, 255, 255, 0.33);
          border-radius: 13px;
          background: rgba(255, 255, 255, 0.15);
          font-size: 22px;
          font-weight: 850;
        }

        .circle-content strong {
          font-size: 16px;
          font-weight: 950;
        }

        .circle-content small {
          color: rgba(255, 255, 255, 0.82);
          font-size: 10px;
        }

        .activation-hint {
          color: var(--gt-muted);
          font-size: 11px;
        }

        .activation-error {
          margin: 12px 0;
          color: var(--gt-danger);
          font-size: 12px;
          font-weight: 700;
        }

        .activation-details {
          margin-top: 28px;
          padding-top: 21px;
          border-top: 1px solid var(--gt-border);
          text-align: left;
        }

        .activation-details h2 {
          margin: 0 0 12px;
          font-size: 14px;
        }

        .activation-step {
          display: flex;
          align-items: center;
          gap: 11px;
          margin-top: 8px;
          padding: 10px 12px;
          border: 1px solid var(--gt-border);
          border-radius: 11px;
          background: rgba(247, 251, 248, 0.85);
        }

        .activation-step span {
          display: grid;
          flex: 0 0 29px;
          place-items: center;
          width: 29px;
          height: 29px;
          border-radius: 9px;
          color: var(--gt-primary-dark);
          background: #e8f5ed;
          font-size: 10px;
          font-weight: 900;
        }

        .activation-step p {
          margin: 0;
          color: #52645b;
          font-size: 11px;
          line-height: 1.45;
        }

        .activation-note {
          margin: 13px 0 0;
          color: var(--gt-muted);
          font-size: 10px;
          line-height: 1.5;
        }

        @media (prefers-reduced-motion: reduce) {
          .activation-circle {
            transition: none;
          }
        }
      `}</style>
    </Layout>
  );
}
