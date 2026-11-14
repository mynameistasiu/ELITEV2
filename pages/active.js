import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Layout from "../components/Layout";
import { loadUser } from "../utils/storage";

export default function Active() {
  const router = useRouter();

  const [ready, setReady] = useState(false);
  const [activated, setActivated] = useState(false);
  const [activationError, setActivationError] = useState("");
  const [timeRemaining, setTimeRemaining] = useState(0);

  /*
   * ---------------------------------------------------------
   * CHECK ACCOUNT + RESTRICTION TIMER
   * ---------------------------------------------------------
   */
  useEffect(() => {
    if (!loadUser()) {
      router.replace("/login");
      return;
    }

    const checkStatus = () => {
      try {
        const end = Number(
          localStorage.getItem("gt_restriction_end") || 0
        );

        if (Number.isFinite(end) && end > Date.now()) {
          setTimeRemaining(end - Date.now());
        } else {
          setTimeRemaining(0);
        }

        setActivated(
          localStorage.getItem("gt_activated") === "true"
        );
      } catch (error) {
        console.error(
          "Unable to read account status:",
          error
        );
      }
    };

    checkStatus();

    const interval = setInterval(checkStatus, 1000);

    setReady(true);

    return () => clearInterval(interval);
  }, [router]);

  /*
   * ---------------------------------------------------------
   * FORMAT COUNTDOWN
   * ---------------------------------------------------------
   */
  const formatTime = (ms) => {
    const totalSeconds = Math.ceil(ms / 1000);

    const minutes = Math.floor(totalSeconds / 60);

    const seconds = totalSeconds % 60;

    return `${minutes}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  /*
   * ---------------------------------------------------------
   * ACCOUNT ACTIVATION
   * ---------------------------------------------------------
   */
  const activateAndContinue = () => {
    setActivationError("");

    try {
      const storedEnd = localStorage.getItem(
        "gt_restriction_end"
      );

      const restrictionEnd = Number(storedEnd || 0);

      // Prevent activation while the restriction timer is running.
      if (
        storedEnd &&
        Number.isFinite(restrictionEnd) &&
        restrictionEnd > Date.now()
      ) {
        const remaining = restrictionEnd - Date.now();

        setTimeRemaining(remaining);

        setActivationError(
          "Your wallet is still restricted. Please wait for the countdown to finish."
        );

        return;
      }

      // Remove an expired or invalid restriction timestamp.
      localStorage.removeItem("gt_restriction_end");

      // Already activated: continue to the dashboard.
      if (activated) {
        router.replace("/dashboard");
        return;
      }

      // Activate after the restriction period has ended.
      localStorage.setItem("gt_activated", "true");

      setActivated(true);
      setTimeRemaining(0);

      router.replace("/dashboard");
    } catch (error) {
      console.error(
        "Unable to activate account:",
        error
      );

      setActivationError(
        "We couldn't update your account status. Please check your browser storage and try again."
      );
    }
  };

  const waiting = timeRemaining > 0;

  return (
    <Layout title="Account Activation - ElitePay Wallet">
      <main className="activation-page">
        <section className="activation-card" aria-live="polite">

          {/* ACCOUNT STATUS */}
          <div
            className={`status-pill${
              activated && !waiting ? " is-active" : ""
            }`}
          >
            <span className="status-dot" />

            {waiting
              ? "RESTRICTION IN PROGRESS"
              : activated
                ? "ACCOUNT ACTIVE"
                : "ACCOUNT RESTRICTED"}
          </div>

          {/* PAGE TITLE */}
          <h1>
            {waiting
              ? "Please wait"
              : activated
                ? "You're all set"
                : "Restore wallet access"}
          </h1>

          <p className="activation-description">
            {waiting
              ? "Your wallet restriction period is still running. You can restore access when the countdown finishes."
              : activated
                ? "Your account is activated. Continue to your wallet dashboard."
                : "Your restriction period has ended. Activate your account to restore wallet access."}
          </p>

          {/* ACTIVATION BUTTON */}
          <button
            className={`activation-circle${
              activated && !waiting ? " is-active" : ""
            }`}
            type="button"
            onClick={activateAndContinue}
            disabled={!ready || waiting}
            aria-label={
              waiting
                ? "Please wait for restriction period to end"
                : activated
                  ? "Continue to dashboard"
                  : "Activate account and open dashboard"
            }
          >
            <span className="circle-ring circle-ring-one" />
            <span className="circle-ring circle-ring-two" />

            <span className="circle-content">
              <span className="circle-icon" aria-hidden="true">
                {waiting
                  ? "⌛"
                  : activated
                    ? "✓"
                    : "↗"}
              </span>

              <strong>
                {!ready
                  ? "Loading"
                  : waiting
                    ? "Please Wait"
                    : activated
                      ? "Open Wallet"
                      : "Activate"}
              </strong>

              {waiting ? (
                <small>
                  {formatTime(timeRemaining)} remaining
                </small>
              ) : (
                !activated && (
                  <small>Tap to open dashboard</small>
                )
              )}
            </span>
          </button>

          {/* ERROR MESSAGE */}
          {activationError && (
            <p className="activation-error" role="alert">
              {activationError}
            </p>
          )}

          {/* INFORMATION */}
          <div className="activation-hint">
            {waiting
              ? `Please wait ${formatTime(timeRemaining)} before continuing.`
              : activated
                ? "Wallet access is currently active."
                : "Your restriction period has ended. You can now restore access."}
          </div>

          {/* ACTIVATION DETAILS */}
          {!activated && (
            <div className="activation-details">
              <h2>
                {waiting
                  ? "Restriction information"
                  : "What happens next"}
              </h2>

              <div className="activation-step">
                <span>✓</span>

                <p>
                  {waiting
                    ? "Your wallet access will remain restricted until the countdown reaches zero."
                    : "Activate your account to remove the expired restriction and return to your dashboard."}
                </p>
              </div>

              <div className="activation-note">
                Account status is currently stored in your browser.
                This page does not verify payment or activation codes
                through a server.
              </div>
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
            radial-gradient(
              circle at 50% 22%,
              rgba(29, 158, 104, 0.07),
              transparent 34%
            ),
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
          background: linear-gradient(
            145deg,
            #0b6747,
            #159568 58%,
            #35b77f
          );
          box-shadow:
            0 16px 34px rgba(12, 112, 75, 0.28),
            inset 0 2px 4px rgba(255, 255, 255, 0.32);
          cursor: pointer;
          transition:
            transform 180ms ease,
            box-shadow 180ms ease;
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
          cursor: not-allowed;
          opacity: 0.72;
          transform: none;
        }

        .activation-circle.is-active {
          background: linear-gradient(
            145deg,
            #087449,
            #159568
          );
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