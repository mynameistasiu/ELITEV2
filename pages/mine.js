import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Layout from "../components/Layout";
import {
  loadUser,
  loadBalance,
  claimMineReward,
} from "../utils/storage";
import { formatNaira } from "../utils/format";

const MIN_REWARD = 70000;
const MAX_REWARD = 100000;

const phases = [
  {
    at: 0,
    label: "Starting session",
  },
  {
    at: 18,
    label: "Preparing session",
  },
  {
    at: 38,
    label: "Processing activity",
  },
  {
    at: 58,
    label: "Updating session progress",
  },
  {
    at: 78,
    label: "Preparing reward",
  },
  {
    at: 94,
    label: "Finishing session",
  },
];

function MineIcon({ size = 22 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 18h16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M6 18V9l6-5 6 5v9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M9 18v-5h6v5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function WalletIcon({ size = 19 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 6.5A2.5 2.5 0 0 1 6.5 4H18a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6.5A2.5 2.5 0 0 1 4 17.5v-11Z"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M4 7h14"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M15 13h3"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <circle
        cx="15"
        cy="13"
        r="1"
        fill="currentColor"
      />
    </svg>
  );
}

function CheckIcon({ size = 15 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="m5 12.5 4.5 4.5L19 7.5"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Spinner() {
  return (
    <span
      className="spinner"
      aria-hidden="true"
    />
  );
}

export default function Mine() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [balance, setBalance] = useState(0);

  const [stage, setStage] = useState("idle");
  const [amount, setAmount] = useState(0);
  const [progress, setProgress] = useState(0);
  const [sessionId, setSessionId] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [hasMined, setHasMined] =
    useState(false);

  const [sessionTime, setSessionTime] =
    useState(0);

  const [claimLoading, setClaimLoading] =
    useState(false);

  /*
   * ---------------------------------------------------------
   * LOAD USER
   * ---------------------------------------------------------
   */
  useEffect(() => {
    const currentUser = loadUser();

    if (!currentUser) {
      router.push("/");
      return;
    }

    setUser(currentUser);
    setBalance(
      Number(loadBalance() || 0)
    );

    try {
      const minedFlag =
        localStorage.getItem(
          "hasMined"
        );

      if (minedFlag === "true") {
        setHasMined(true);
        const pending = JSON.parse(
          localStorage.getItem("ep_mine_pending_reward") || "null"
        );

        if (
          pending &&
          pending.accountKey === String(currentUser.phone || currentUser.email || currentUser.fullName || "") &&
          pending.sessionId &&
          Number.isFinite(Number(pending.amount))
        ) {
          setAmount(Number(pending.amount));
          setSessionId(pending.sessionId);
          setStage("result");
        } else {
          setStage("done");
        }
      }
    } catch (error) {
      console.error(
        "Mining state error:",
        error
      );
    }
  }, [router]);

  /*
   * ---------------------------------------------------------
   * CURRENT PHASE
   * ---------------------------------------------------------
   */
  const phase = useMemo(() => {
    return (
      [...phases]
        .reverse()
        .find(
          (item) =>
            progress >= item.at
        ) || phases[0]
    );
  }, [progress]);

  /*
   * ---------------------------------------------------------
   * FORMATTING
   * ---------------------------------------------------------
   */
  const formatSessionTime = (seconds) => {
    const minutes = Math.floor(
      seconds / 60
    );

    const remaining =
      seconds % 60;

    return `${String(minutes).padStart(
      2,
      "0"
    )}:${String(
      remaining
    ).padStart(2, "0")}`;
  };

  /*
   * ---------------------------------------------------------
   * START MINING
   * ---------------------------------------------------------
   */
  const startMine = () => {
    if (
      hasMined ||
      stage === "mining"
    ) {
      return;
    }

    const baseReward =
      Math.floor(
        Math.random() *
          (MAX_REWARD -
            MIN_REWARD +
            1)
      ) + MIN_REWARD;

    const finalReward = baseReward;
    const newSessionId = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    setAmount(finalReward);
    setSessionId(newSessionId);
    setErrorMessage("");
    setStage("mining");
    setProgress(0);
    setSessionTime(0);

    let currentProgress = 0;
    let currentTime = 0;

    const interval =
      setInterval(() => {
        currentProgress = Math.min(
          100,
          currentProgress +
            Math.floor(
              Math.random() * 7
            ) +
            3
        );

        currentTime += 1;

        setProgress(
          currentProgress
        );

        setSessionTime(
          currentTime
        );

        if (
          currentProgress >=
          100
        ) {
          clearInterval(
            interval
          );

          setProgress(100);
          try {
            const accountKey = String(user.phone || user.email || user.fullName || "");
            localStorage.setItem(
              "ep_mine_pending_reward",
              JSON.stringify({
                sessionId: newSessionId,
                accountKey,
                amount: finalReward,
              })
            );
            localStorage.setItem(
              "hasMined",
              "true"
            );
            setStage("result");
            setHasMined(true);
          } catch (error) {
            setStage("idle");
            setProgress(0);
            setAmount(0);
            setSessionId("");
            setErrorMessage("Could not save this session in browser storage. Please try again.");
            console.error(
              "Mining state save error:",
              error
            );
          }
        }
      }, 420);
  };

  /*
   * ---------------------------------------------------------
   * CLAIM REWARD
   * ---------------------------------------------------------
   */
  const claim = () => {
    if (
      claimLoading ||
      !amount ||
      !sessionId
    ) {
      return;
    }

    setClaimLoading(true);
    setErrorMessage("");
    setStage("claiming");

    window.setTimeout(() => {
      const result = claimMineReward(sessionId, amount, {
        engine: "ElitePay Pulse Miner",
        sessionTime,
      });

      setClaimLoading(false);

      if (result.status === "error") {
        setErrorMessage("Could not add the reward. Your wallet was not updated; please try again.");
        setStage("result");
        return;
      }

      setBalance(result.balance);
      setStage("claimed");
    }, 500);
  };

  /*
   * ---------------------------------------------------------
   * LOADING
   * ---------------------------------------------------------
   */
  if (!user) {
    return (
      <Layout>
        <div className="page-loading">
          <div className="loading-card">
            <div className="loading-spinner" />

            <div>
              <strong>
                Loading Pulse Miner...
              </strong>

              <span>
                Preparing your mining session
              </span>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Pulse Miner - ElitePay">
      <style>{`

        /* ==================================================
           PAGE
        ================================================== */

        .mine-page {
          max-width: 920px;
          margin: 0 auto;
          padding: 8px 0 35px;
        }

        .mine-layout {
          display: block;
          max-width: 720px;
          margin: 0 auto;
        }

        /* ==================================================
           HEADER
        ================================================== */

        .mine-header {
          display: flex;
          justify-content: space-between;
          gap: 18px;
          align-items: center;
          margin-bottom: 12px;
        }

        .eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 9px;
          border-radius: 999px;
          background: #eefaf6;
          border: 1px solid #d5eee5;
          color: #13845d;
          font-size: 9px;
          font-weight: 950;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .mine-error {
          max-width: 450px;
          margin: 0 auto 12px;
          padding: 10px 12px;
          border: 1px solid #f2caca;
          border-radius: 10px;
          background: #fff4f4;
          color: #a52d2d;
          font-size: 12px;
          font-weight: 700;
          text-align: center;
        }

        .mine-disclosure {
          display: flex;
          max-width: 720px;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin: 10px auto 0;
          padding: 11px 13px;
          border: 1px solid #e2eae4;
          border-radius: 11px;
          background: #f8fbf9;
          color: #617268;
          font-size: 10px;
        }

        .mine-disclosure button {
          flex: 0 0 auto;
          border: 0;
          padding: 5px 0;
          background: transparent;
          color: #087449;
          font-size: 10px;
          font-weight: 800;
          cursor: pointer;
        }

        .mine-header h1 {
          margin: 10px 0 4px;
          color: #172b24;
          font-size: 28px;
          font-weight: 950;
          letter-spacing: -0.04em;
        }

        .mine-header p {
          max-width: 650px;
          margin: 0;
          color: #687a72;
          font-size: 12px;
          line-height: 1.55;
        }

        .balance-mini {
          flex-shrink: 0;
          padding: 12px 15px;
          border-radius: 13px;
          background: #ffffff;
          border: 1px solid #dfe8f1;
          box-shadow:
            0 9px 24px
              rgba(
                16,
                32,
                51,
                0.05
              );
          text-align: right;
        }

        .balance-mini span {
          display: block;
          color: #84948b;
          font-size: 8px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.07em;
        }

        .balance-mini strong {
          display: block;
          margin-top: 3px;
          color: #13845d;
          font-size: 18px;
          font-weight: 950;
        }

        /* ==================================================
           MINER CARD
        ================================================== */

        .miner-card {
          position: relative;
          overflow: hidden;
          min-height: 0;
          padding: 22px;
          border-radius: 17px;
          background: #ffffff;
          border: 1px solid #dfe8f1;
          box-shadow: 0 10px 28px rgba(16, 32, 51, 0.06);
        }

        .miner-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .miner-status {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 9px;
          border-radius: 999px;
          background: #f1f5f9;
          color: #687a72;
          font-size: 9px;
          font-weight: 900;
        }

        .miner-status.live {
          background: #eaf9f2;
          color: #13845d;
        }

        .status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: currentColor;
        }

        .miner-card-title {
          margin: 14px 0 3px;
          color: #172b24;
          font-size: 17px;
          font-weight: 950;
        }

        .miner-card-subtitle {
          margin: 0;
          color: #84948b;
          font-size: 10px;
        }

        /* ==================================================
           MINER VISUAL
        ================================================== */

        .miner-area {
          position: relative;
          width: 178px;
          aspect-ratio: 1;
          margin: 18px auto 12px;
          display: grid;
          place-items: center;
        }

        .orbit {
          position: absolute;
          border-radius: 50%;
          border: 1px solid
            rgba(
              15,
              159,
              110,
              0.18
            );
          animation:
            rotate 10s linear infinite;
        }

        .orbit.one {
          inset: 4%;
        }

        .orbit.two {
          inset: 15%;
          border-color:
            rgba(
              29,
              127,
              242,
              0.17
            );
          animation-duration: 7s;
          animation-direction: reverse;
        }

        .orbit.three {
          inset: 26%;
          border-style: dashed;
          border-color:
            rgba(
              15,
              159,
              110,
              0.25
            );
          animation-duration: 5s;
        }

        .orbit-dot {
          position: absolute;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #13845d;
          box-shadow:
            0 0 0 5px
              rgba(
                15,
                159,
                110,
                0.08
              );
        }

        .dot-a {
          top: 8%;
          left: 49%;
        }

        .dot-b {
          right: 6%;
          top: 45%;
          background: #308b78;
        }

        .dot-c {
          bottom: 8%;
          left: 27%;
        }

        .miner-core {
          position: relative;
          z-index: 3;
          width: 142px;
          height: 142px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          background: linear-gradient(145deg, #1aa66c, #087449);
          border: 5px solid #e8f7ee;
          color: #ffffff;
          box-shadow: 0 12px 28px rgba(8, 116, 73, 0.24), 0 0 0 8px #f2faf5;
          cursor: pointer;
          font: inherit;
          transition: transform 160ms ease, box-shadow 160ms ease;
          animation:
            ${stage === "mining"
              ? "pulse 1.25s ease-in-out infinite"
              : "none"};
        }

        .miner-core:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 16px 34px rgba(8, 116, 73, 0.3), 0 0 0 8px #f2faf5;
        }

        .miner-core:focus-visible {
          outline: 3px solid rgba(16, 132, 91, 0.35);
          outline-offset: 7px;
        }

        .miner-core:disabled {
          cursor: default;
          opacity: 0.9;
        }

        .miner-core-inner {
          text-align: center;
        }

        .miner-core-mark {
          font-size: 29px;
          line-height: 1;
          font-weight: 950;
        }

        .miner-core-label {
          margin-top: 6px;
          font-size: 8px;
          font-weight: 900;
          opacity: 0.8;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        /* ==================================================
           IDLE STATE
        ================================================== */

        .start-panel {
          max-width: 450px;
          margin: 0 auto;
          text-align: center;
        }

        .start-panel h2 {
          margin: 0;
          color: #172b24;
          font-size: 19px;
          font-weight: 950;
        }

        .start-panel p {
          margin: 6px 0 14px;
          color: #718096;
          font-size: 11px;
          line-height: 1.55;
        }

        .primary-button {
          width: 100%;
          max-width: 370px;
          min-height: 48px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border: 0;
          border-radius: 12px;
          background:
            linear-gradient(
              135deg,
              #13845d,
              #13845d
            );
          color: #ffffff;
          font-size: 12px;
          font-weight: 950;
          cursor: pointer;
          box-shadow:
            0 14px 27px
              rgba(
                15,
                159,
                110,
                0.21
              );
        }

        /* ==================================================
           MINING STATE
        ================================================== */

        .mining-panel {
          max-width: 500px;
          margin: 0 auto;
        }

        .mining-message {
          text-align: center;
          color: #40554a;
          font-size: 11px;
          font-weight: 850;
        }

        .progress-track {
          height: 10px;
          margin-top: 13px;
          border-radius: 999px;
          overflow: hidden;
          background: #dce7ef;
        }

        .progress-fill {
          position: relative;
          height: 100%;
          border-radius: inherit;
          background:
            linear-gradient(
              90deg,
              #13845d,
              #18b7a4,
              #308b78
            );
          transition:
            width 0.32s ease;
        }

        .progress-fill::after {
          content: "";
          position: absolute;
          inset: 0;
          background:
            linear-gradient(
              90deg,
              transparent,
              rgba(
                255,
                255,
                255,
                0.5
              ),
              transparent
            );
          animation:
            scan 1.1s linear infinite;
        }

        .progress-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 7px;
          color: #84948b;
          font-size: 9px;
          font-weight: 800;
        }

        .live-stats {
          display: grid;
          grid-template-columns:
            repeat(3, 1fr);
          gap: 7px;
          margin-top: 13px;
        }

        .live-stat {
          padding: 10px;
          border-radius: 10px;
          background: #f7faf8;
          border: 1px solid #e6edf3;
          text-align: center;
        }

        .live-stat span {
          display: block;
          color: #84948b;
          font-size: 8px;
          font-weight: 800;
        }

        .live-stat strong {
          display: block;
          margin-top: 4px;
          color: #172b24;
          font-size: 13px;
          font-weight: 950;
        }

        /* ==================================================
           RESULT
        ================================================== */

        .reward-panel {
          max-width: 450px;
          margin: 0 auto;
          padding: 18px;
          border-radius: 16px;
          background:
            linear-gradient(
              135deg,
              #eefaf6,
              #eef8ff
            );
          border: 1px solid #cfe9df;
          text-align: center;
        }

        .reward-ready {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 9px;
          border-radius: 999px;
          background: #ffffff;
          color: #13845d;
          font-size: 9px;
          font-weight: 950;
        }

        .reward-label {
          margin-top: 10px;
          color: #687a72;
          font-size: 9px;
          font-weight: 850;
          text-transform: uppercase;
          letter-spacing: 0.07em;
        }

        .reward-value {
          margin: 5px 0 4px;
          color: #13845d;
          font-size: 37px;
          line-height: 1;
          font-weight: 950;
          letter-spacing: -0.04em;
        }

        .reward-note {
          margin: 0 auto 13px;
          color: #687a72;
          max-width: 380px;
          font-size: 10px;
          line-height: 1.5;
        }

        .claim-button {
          width: 100%;
          min-height: 47px;
          border: 0;
          border-radius: 11px;
          background:
            linear-gradient(
              135deg,
              #13845d,
              #13845d
            );
          color: #ffffff;
          font-size: 11px;
          font-weight: 950;
          cursor: pointer;
          box-shadow:
            0 13px 24px
              rgba(
                15,
                159,
                110,
                0.2
              );
        }

        /* ==================================================
           DONE
        ================================================== */

        .done-panel {
          max-width: 450px;
          margin: 0 auto;
          padding: 17px;
          border-radius: 15px;
          background: #f7faf8;
          border: 1px solid #e1e8ef;
          text-align: center;
        }

        .done-icon {
          width: 45px;
          height: 45px;
          margin: 0 auto 8px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          background: #eaf9f2;
          color: #13845d;
        }

        .done-panel h3 {
          margin: 0;
          color: #172b24;
          font-size: 15px;
          font-weight: 950;
        }

        .done-panel p {
          margin: 5px 0 12px;
          color: #84948b;
          font-size: 10px;
        }

        .outline-button {
          min-height: 42px;
          padding: 0 15px;
          border-radius: 10px;
          border: 1px solid #d9e3eb;
          background: #ffffff;
          color: #40554a;
          font-size: 10px;
          font-weight: 900;
          cursor: pointer;
        }

        /* ==================================================
           SIDE PANEL
        ================================================== */

        .side-column {
          display: grid;
          gap: 14px;
        }

        .side-card {
          padding: 17px;
          border-radius: 17px;
          background: #ffffff;
          border: 1px solid #dfe8f1;
          box-shadow:
            0 12px 30px
              rgba(
                16,
                32,
                51,
                0.055
              );
        }

        .side-title {
          display: flex;
          align-items: center;
          gap: 9px;
          margin-bottom: 5px;
          color: #172b24;
          font-size: 14px;
          font-weight: 950;
        }

        .side-subtitle {
          margin: 0 0 13px;
          color: #84948b;
          font-size: 10px;
          line-height: 1.45;
        }

        /* BOOST */

        .boost-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 12px;
          border-radius: 12px;
          background: #f7faf8;
          border: 1px solid #e4ebf1;
        }

        .boost-label {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .boost-icon {
          width: 35px;
          height: 35px;
          display: grid;
          place-items: center;
          border-radius: 10px;
          background: #fff7ed;
          color: #ea580c;
        }

        .boost-label strong {
          display: block;
          color: #172b24;
          font-size: 11px;
        }

        .boost-label span {
          display: block;
          margin-top: 2px;
          color: #84948b;
          font-size: 8px;
        }

        .switch {
          width: 46px;
          height: 26px;
          padding: 3px;
          border: 0;
          border-radius: 999px;
          background: #cbd5e1;
          cursor: pointer;
        }

        .switch.active {
          background: #13845d;
        }

        .switch-knob {
          display: block;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #ffffff;
          transform:
            translateX(0);
          transition:
            transform 0.18s ease;
        }

        .switch.active
          .switch-knob {
          transform:
            translateX(20px);
        }

        /* REWARD PREVIEW */

        .reward-preview {
          padding: 13px;
          border-radius: 12px;
          background: #f1faf7;
          border: 1px solid #d8eee6;
        }

        .reward-preview-label {
          color: #687a72;
          font-size: 8px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.07em;
        }

        .reward-preview-value {
          margin-top: 5px;
          color: #13845d;
          font-size: 19px;
          font-weight: 950;
        }

        .reward-preview-note {
          margin-top: 5px;
          color: #648579;
          font-size: 8px;
          line-height: 1.4;
        }

        /* MINING INFO */

        .info-list {
          display: grid;
          gap: 8px;
        }

        .info-item {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          color: #687a72;
          font-size: 9px;
          line-height: 1.45;
        }

        .info-check {
          width: 20px;
          height: 20px;
          display: grid;
          place-items: center;
          flex-shrink: 0;
          border-radius: 7px;
          background: #eefaf6;
          color: #13845d;
        }

        /* SIDE BUTTONS */

        .side-button {
          width: 100%;
          min-height: 43px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          border: 1px solid #dbe5ed;
          border-radius: 10px;
          background: #ffffff;
          color: #40554a;
          font-size: 10px;
          font-weight: 900;
          cursor: pointer;
        }

        .side-button:hover {
          background: #f7faf8;
        }

        /* MODAL */

        .info-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          background:
            rgba(
              15,
              23,
              42,
              0.58
            );
          backdrop-filter: blur(7px);
        }

        .info-modal {
          width: min(450px, 100%);
          padding: 20px;
          border-radius: 17px;
          background: #ffffff;
          box-shadow:
            0 30px 85px
              rgba(
                15,
                23,
                42,
                0.25
              );
        }

        .info-modal h2 {
          margin: 0;
          color: #172b24;
          font-size: 18px;
          font-weight: 950;
        }

        .info-modal p {
          color: #687a72;
          font-size: 11px;
          line-height: 1.55;
        }

        .modal-close {
          width: 100%;
          min-height: 43px;
          border: 0;
          border-radius: 10px;
          background: #172b24;
          color: #ffffff;
          font-size: 10px;
          font-weight: 900;
          cursor: pointer;
        }

        /* LOADING */

        .page-loading {
          min-height: 65vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .loading-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 19px;
          border-radius: 14px;
          background: #ffffff;
          border: 1px solid #e3ebe6;
          box-shadow:
            0 18px 45px
              rgba(
                15,
                23,
                42,
                0.08
              );
        }

        .loading-card strong {
          display: block;
          color: #172b24;
          font-size: 12px;
          font-weight: 950;
        }

        .loading-card span {
          display: block;
          margin-top: 3px;
          color: #84948b;
          font-size: 9px;
        }

        .loading-spinner,
        .spinner {
          border-radius: 50%;
          border: 2px solid
            rgba(
              15,
              159,
              110,
              0.22
            );
          border-top-color: #13845d;
          animation:
            spin 0.75s linear infinite;
        }

        .loading-spinner {
          width: 24px;
          height: 24px;
        }

        .spinner {
          width: 15px;
          height: 15px;
          border-color:
            rgba(
              255,
              255,
              255,
              0.3
            );
          border-top-color: #ffffff;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.035); }
        }

        @keyframes rotate {
          from {
            transform:
              rotate(0deg);
          }

          to {
            transform:
              rotate(360deg);
          }
        }

        @keyframes scan {
          from {
            transform:
              translateX(-100%);
          }

          to {
            transform:
              translateX(100%);
          }
        }

        @keyframes spin {
          to {
            transform:
              rotate(360deg);
          }
        }

        /* ==================================================
           RESPONSIVE
        ================================================== */

        @media (max-width: 900px) {
          .mine-layout {
            grid-template-columns:
              1fr;
          }

          .side-column {
            grid-template-columns:
              1fr 1fr;
          }
        }

        @media (max-width: 700px) {
          .mine-page {
            padding:
              4px 0 28px;
          }

          .mine-header {
            align-items: flex-start;
            flex-direction: column;
          }

          .balance-mini {
            width: 100%;
            text-align: left;
            box-sizing: border-box;
          }

          .miner-card {
            min-height: auto;
            padding: 18px;
            border-radius: 18px;
          }

          .side-column {
            grid-template-columns:
              1fr;
          }
        }

        @media (max-width: 500px) {
          .mine-header h1 {
            font-size: 23px;
          }

          .miner-area {
            width: min(
              270px,
              82vw
            );
          }

          .miner-core {
            width: 108px;
            height: 108px;
          }

          .live-stats {
            grid-template-columns:
              1fr 1fr 1fr;
          }

          .reward-value {
            font-size: 32px;
          }
        }

      `}</style>

      <div className="mine-page">

        {/* ==================================================
           HEADER
        ================================================== */}

        <header className="mine-header">
          <div>
            <h1>
              Mine &amp; earn
            </h1>

            <p>Tap the circle to start. Claim your reward when the session finishes.</p>
          </div>

          <div className="balance-mini">
            <span>
              Current wallet balance
            </span>

            <strong>
              {formatNaira(balance)}
            </strong>
          </div>
        </header>

        <div className="mine-layout">

          {/* ==================================================
             MAIN MINER
          ================================================== */}

          <section className="miner-card">

            <div className="miner-topbar">
              <div>
                <div className="eyebrow">
                  <MineIcon size={12} />
                  Mining
                </div>
              </div>

              <div
                className={`miner-status ${
                  stage === "mining"
                    ? "live"
                    : ""
                }`}
              >
                <span className="status-dot" />
                {stage === "mining"
                  ? "Mining live"
                  : stage === "result"
                  ? "Reward ready"
                  : stage === "claimed"
                  ? "Completed"
                  : stage === "done"
                  ? "Completed"
                  : "Ready"}
              </div>
            </div>

            <h2 className="miner-card-title">
              {stage === "mining"
                ? "Mining in progress"
                : stage === "result"
                ? "Your reward is ready"
                : stage === "claimed"
                ? "Reward successfully claimed"
                : stage === "done"
                ? "Mining session completed"
                : "Ready for your mining session"}
            </h2>

            <p className="miner-card-subtitle">
              {stage === "mining"
                ? phase.label
                : "Pulse Miner"}
            </p>

            {/* MINER VISUAL */}

            <div className="miner-area">
              <button
                className="miner-core"
                type="button"
                onClick={startMine}
                disabled={stage !== "idle" || hasMined}
                aria-label={
                  stage === "idle" && !hasMined
                    ? "Tap to start mining"
                    : stage === "mining"
                      ? "Mining in progress"
                      : "Mining session complete"
                }
              >

                <div className="miner-core-inner">
                  <div className="miner-core-mark">
                    {stage === "mining"
                      ? `${progress}%`
                      : stage === "result"
                        ? "READY"
                        : stage === "claimed" || stage === "done"
                          ? "DONE"
                          : "MINE"}
                  </div>

                  <div className="miner-core-label">
                    {stage === "mining"
                      ? "In progress"
                      : stage === "result"
                        ? "Claim below"
                        : stage === "claimed" || stage === "done"
                          ? "Complete"
                          : "Tap to start"}
                  </div>
                </div>

              </button>

            </div>

            {errorMessage && (
              <p className="mine-error" role="alert">
                {errorMessage}
              </p>
            )}

            {/* ==================================================
               IDLE
            ================================================== */}

            {stage === "idle" &&
              !hasMined && (
                <div className="start-panel">

                  <h2>Tap the circle to mine</h2>
                  <p>One session is available on this device.</p>

                </div>
              )}

            {/* ==================================================
               ALREADY MINED
            ================================================== */}

            {stage === "done" && (
              <div className="done-panel">

                <div className="done-icon">
                  <CheckIcon size={22} />
                </div>

                <h3>
                  Mining session completed
                </h3>

                <p>Your session is already complete.</p>

                <button
                  className="outline-button"
                  type="button"
                  onClick={() =>
                    router.push(
                      "/dashboard"
                    )
                  }
                >
                  Back to dashboard
                </button>

              </div>
            )}

            {/* ==================================================
               MINING
            ================================================== */}

            {stage === "mining" && (
              <div className="mining-panel">

                <div className="mining-message">
                  {phase.label}
                </div>

                <div className="progress-track">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${progress}%`,
                    }}
                  />
                </div>

                <div className="progress-meta">
                  <span>
                    Processing reward
                  </span>

                  <span>
                    {progress}%
                  </span>
                </div>

                <div className="live-stats">
                  <div className="live-stat">
                    <span>Session time</span>
                    <strong>{formatSessionTime(sessionTime)}</strong>
                  </div>
                </div>

              </div>
            )}

            {/* ==================================================
               RESULT
            ================================================== */}

            {stage === "result" && (
              <div className="reward-panel">

                <span className="reward-ready">
                  <CheckIcon size={12} />
                  Reward ready
                </span>

                <div className="reward-label">
                   Reward
                </div>

                <div className="reward-value">
                  {formatNaira(
                    amount
                  )}
                </div>

                <p className="reward-note">
                  Claim to add this simulated amount to the wallet balance stored on this device.
                </p>

                <button
                  className="claim-button"
                  onClick={claim}
                  disabled={
                    claimLoading
                  }
                >
                  {claimLoading ? (
                    <>
                      <Spinner />
                      Adding to wallet...
                    </>
                  ) : (
                    <>
                      <WalletIcon size={16} />
                      Claim to Wallet
                    </>
                  )}
                </button>

              </div>
            )}

            {/* ==================================================
               CLAIMING
            ================================================== */}

            {stage ===
              "claiming" && (
              <div className="reward-panel">

                <Spinner />

                <div
                  style={{
                    marginTop: 10,
                    color: "#172b24",
                    fontSize: 13,
                    fontWeight: 950,
                  }}
                >
                  Updating wallet...
                </div>

                <p className="reward-note">
                  Applying the simulated reward to the wallet stored on this device.
                </p>

              </div>
            )}

            {/* ==================================================
               CLAIMED
            ================================================== */}

            {stage === "claimed" && (
              <div className="reward-panel">

                <span className="reward-ready">
                  <CheckIcon size={12} />
                  Successfully claimed
                </span>

                <div className="reward-value">
                  {formatNaira(
                    amount
                  )}
                </div>

                <p className="reward-note">
                  The simulated amount was added to this device’s wallet balance.
                </p>
                <button
                  className="outline-button"
                  type="button"
                  onClick={() => router.push("/dashboard")}
                >
                  Back to dashboard
                </button>

              </div>
            )}

          </section>

        </div>
        <div className="mine-disclosure">
          Real mining activity and rewards are displayed in your account. All payouts are subject to verification and processing.
          <button type="button" onClick={() => router.push("/history")}>
            View wallet history
          </button>
        </div>
      </div>

    </Layout>
  );
}
