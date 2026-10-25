import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Layout from "../components/Layout";
import {
  loadUser,
  loadBalance,
  loadTx,
} from "../utils/storage";
import { formatNaira } from "../utils/format";

export default function Dashboard() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [balance, setBalance] = useState(0);
  const [tx, setTx] = useState([]);

  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] =
    useState("Loading dashboard...");
  const [accessMessage, setAccessMessage] =
    useState("Checking your account...");

  const [showIntro, setShowIntro] = useState(false);

  const [stats, setStats] = useState({ txCount: 0 });

  const [restricted, setRestricted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  /*
   * ---------------------------------------------------------
   * LOAD USER + WALLET
   * ---------------------------------------------------------
   */
  useEffect(() => {
    const currentUser = loadUser();

    if (!currentUser) {
      setAccessMessage("No signed-in account found. Redirecting to sign in...");
      router.push("/");
      return;
    }

    if (currentUser.kycCompleted !== true) {
      setAccessMessage("KYC is required. Opening your profile...");
      router.replace("/profile?kyc=required");
      return;
    }

    setUser(currentUser);

    const currentBalance = Number(loadBalance() || 0);
    setBalance(currentBalance);

    const transactions = loadTx() || [];
    setTx(transactions);

    computeStats(transactions);

    try {
      if (!localStorage.getItem("gt_seen_intro_v2")) {
        setShowIntro(true);
        localStorage.setItem("gt_seen_intro_v2", "1");
      }
    } catch (error) {
      console.error(
        "Dashboard onboarding error:",
        error
      );
    }
  }, [router]);

  /*
   * ---------------------------------------------------------
   * RESTRICTION CHECK
   * ---------------------------------------------------------
   */
  useEffect(() => {
    const checkRestriction = () => {
      try {
        const activated =
          localStorage.getItem("gt_activated") === "true";

        if (activated) {
          setRestricted(false);
          setTimeLeft(0);
          return;
        }

        const end =
          localStorage.getItem(
            "gt_restriction_end"
          );

        if (!end) {
          setRestricted(false);
          setTimeLeft(0);
          return;
        }

        const remaining =
          Number(end) - Date.now();

        if (remaining <= 0) {
          setRestricted(true);
          setTimeLeft(0);
        } else {
          setRestricted(false);
          setTimeLeft(remaining);
        }
      } catch (error) {
        console.error(
          "Restriction check error:",
          error
        );
      }
    };

    checkRestriction();

    const interval = setInterval(
      checkRestriction,
      1000
    );

    return () => clearInterval(interval);
  }, []);

  /*
   * ---------------------------------------------------------
   * PREVENT BACK NAVIGATION DURING RESTRICTION
   * ---------------------------------------------------------
   */
  useEffect(() => {
    if (!restricted) return;

    const blockBack = () => {
      try {
        window.history.pushState(
          null,
          "",
          window.location.href
        );
      } catch (error) {
        console.error(
          "Navigation protection error:",
          error
        );
      }
    };

    blockBack();

    window.addEventListener(
      "popstate",
      blockBack
    );

    return () => {
      window.removeEventListener(
        "popstate",
        blockBack
      );
    };
  }, [restricted]);

  /*
   * ---------------------------------------------------------
   * STATS
   * ---------------------------------------------------------
   */
  function computeStats(transactions) {
    setStats({
      txCount: transactions.length || 0,
    });
  }

  /*
   * ---------------------------------------------------------
   * QUICK NAVIGATION
   * ---------------------------------------------------------
   */
  const startQuick = (
    path,
    message = "Opening..."
  ) => {
    setLoadingMessage(message);
    setLoading(true);

    setTimeout(() => {
      setLoadingMessage(
        "Preparing secure session..."
      );
    }, 450);

    setTimeout(() => {
      router.push(path);
    }, 900);
  };

  /*
   * ---------------------------------------------------------
   * REFERRAL
   * ---------------------------------------------------------
   */
  const copyReferral = async () => {
    const referralLink =
      `${
        typeof window !== "undefined"
          ? window.location.origin
          : ""
      }/register?ref=${user?.phone || ""}`;

    try {
      await navigator.clipboard.writeText(
        referralLink
      );

      alert(
        "Referral link copied to clipboard."
      );
    } catch (error) {
      window.prompt(
        "Copy this referral link:",
        referralLink
      );
    }
  };

  /*
   * ---------------------------------------------------------
   * SHARE
   * ---------------------------------------------------------
   */
  const shareWallet = async () => {
    const shareUrl =
      typeof window !== "undefined"
        ? window.location.origin
        : "";

    const shareData = {
      title: "ElitePay Wallet",
      text:
        "Join me on ElitePay Wallet.",
      url: shareUrl,
    };

    try {
      if (
        navigator.share &&
        typeof navigator.share === "function"
      ) {
        await navigator.share(shareData);
        return;
      }

      await navigator.clipboard.writeText(
        shareUrl
      );

      alert(
        "ElitePay link copied to clipboard."
      );
    } catch (error) {
      if (
        error?.name !== "AbortError"
      ) {
        copyReferral();
      }
    }
  };

  /*
   * ---------------------------------------------------------
   * TIME FORMAT
   * ---------------------------------------------------------
   */
  const formatTime = (ms) => {
    const secondsTotal = Math.floor(
      ms / 1000
    );

    const minutes = Math.floor(
      secondsTotal / 60
    );

    const seconds =
      secondsTotal % 60;

    return `${minutes}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  /*
   * ---------------------------------------------------------
   * TRANSACTION HELPERS
   * ---------------------------------------------------------
   */
  const getTransactionTitle = (item) => {
    const type = String(
      item?.type || "transaction"
    );

    const titles = {
      mine: "Mining Reward",
      withdraw: "Withdrawal",
      withdraw_confirm:
        "Withdrawal Confirmed",
      buy_code:
        "Withdrawal Code Purchase",
      activation:
        "Account Activation",
    };

    return (
      titles[type] ||
      type
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) =>
          char.toUpperCase()
        )
    );
  };

  const getTransactionStatus = (
    status
  ) => {
    const normalized = String(
      status || "pending"
    ).toLowerCase();

    if (
      normalized === "successful" ||
      normalized === "claimed" ||
      normalized === "completed"
    ) {
      return {
        label: "Completed",
        className: "success",
      };
    }

    if (
      normalized === "failed" ||
      normalized === "rejected" ||
      normalized === "cancelled"
    ) {
      return {
        label: "Failed",
        className: "failed",
      };
    }

    return {
      label: "Pending",
      className: "pending",
    };
  };

  /*
   * ---------------------------------------------------------
   * LOADING SCREEN
   * ---------------------------------------------------------
   */
  if (!user) {
    return (
      <Layout>
        <div className="dashboard-loading">
          <div className="loading-card">
            <div className="big-spinner" />
            <strong>
              {accessMessage}
            </strong>
            <span>
              You will be redirected automatically.
            </span>
          </div>
        </div>
      </Layout>
    );
  }

  const firstName =
    user.fullName?.split(" ")[0] ||
    "User";

  const initials = user.fullName
    ? user.fullName
        .split(" ")
        .filter(Boolean)
        .map((part) => part[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "EP";

  const previewTx = (
    tx || []
  ).slice(0, 5);

  return (
    <Layout title="Wallet - ElitePay">
      <style>{`

        /* ==================================================
           GLOBAL DASHBOARD
        ================================================== */

        .wallet-shell {
          max-width: 1180px;
          margin: 0 auto;
          padding: 16px 0 35px;
        }

        .wallet-container {
          display: grid;
          gap: 18px;
        }

        /* ==================================================
           TOP BAR
        ================================================== */

        .wallet-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
        }

        .welcome-title {
          margin: 0;
          color: #172b24;
          font-size: 25px;
          font-weight: 950;
          letter-spacing: -0.03em;
        }

        .welcome-subtitle {
          margin: 5px 0 0;
          color: #718096;
          font-size: 13px;
        }

        .avatar-button {
          width: 48px;
          height: 48px;
          border: 0;
          border-radius: 50%;
          display: grid;
          place-items: center;
          background: linear-gradient(
            135deg,
            #13845d,
            #1bb9a7
          );
          color: #ffffff;
          font-size: 15px;
          font-weight: 950;
          cursor: pointer;
          box-shadow:
            0 9px 22px rgba(
              15,
              159,
              110,
              0.2
            );
        }

        /* ==================================================
           WALLET HERO
        ================================================== */

        .wallet-hero {
          position: relative;
          overflow: hidden;
          min-height: 285px;
          padding: 25px;
          border-radius: 24px;
          color: #ffffff;
          background:
            radial-gradient(
              circle at 83% 12%,
              rgba(
                45,
                212,
                191,
                0.28
              ),
              transparent 30%
            ),
            radial-gradient(
              circle at 5% 115%,
              rgba(
                255,
                255,
                255,
                0.08
              ),
              transparent 28%
            ),
            linear-gradient(
              135deg,
              #0d1f32,
              #0d513f 62%,
              #087f61
            );
          box-shadow:
            0 24px 55px rgba(
              15,
              54,
              45,
              0.2
            );
        }

        .wallet-hero::before {
          content: "";
          position: absolute;
          width: 260px;
          height: 260px;
          right: -115px;
          top: -120px;
          border-radius: 50%;
          border: 1px solid
            rgba(
              255,
              255,
              255,
              0.12
            );
          box-shadow:
            0 0 0 35px
              rgba(
                255,
                255,
                255,
                0.035
              ),
            0 0 0 70px
              rgba(
                255,
                255,
                255,
                0.02
              );
        }

        .wallet-hero-content {
          position: relative;
          z-index: 2;
        }

        .wallet-top-line {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
        }

        .wallet-label {
          color: rgba(
            255,
            255,
            255,
            0.68
          );
          font-size: 11px;
          font-weight: 850;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .wallet-status {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 10px;
          border-radius: 999px;
          background: rgba(
            255,
            255,
            255,
            0.1
          );
          border: 1px solid
            rgba(
              255,
              255,
              255,
              0.12
            );
          font-size: 10px;
          font-weight: 850;
        }

        .wallet-status-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #5ee9a8;
          box-shadow: 0 0 0 4px
            rgba(
              94,
              233,
              168,
              0.11
            );
        }

        .wallet-balance-label {
          margin-top: 28px;
          color: rgba(
            255,
            255,
            255,
            0.68
          );
          font-size: 12px;
          font-weight: 750;
        }

        .wallet-balance {
          margin: 6px 0 0;
          font-size: clamp(
            38px,
            7vw,
            58px
          );
          line-height: 1;
          letter-spacing: -0.045em;
          font-weight: 950;
        }

        .wallet-account {
          margin-top: 9px;
          color: rgba(
            255,
            255,
            255,
            0.58
          );
          font-size: 11px;
        }

        .wallet-actions {
          display: grid;
          grid-template-columns:
            1fr 1fr 1fr;
          gap: 9px;
          margin-top: 28px;
          max-width: 600px;
        }

        .wallet-action {
          min-height: 48px;
          border: 1px solid
            rgba(
              255,
              255,
              255,
              0.15
            );
          border-radius: 12px;
          background: rgba(
            255,
            255,
            255,
            0.09
          );
          color: #ffffff;
          font-size: 12px;
          font-weight: 900;
          cursor: pointer;
          backdrop-filter: blur(8px);
          transition:
            transform 0.16s ease,
            background 0.16s ease;
        }

        .wallet-action:hover {
          transform: translateY(-1px);
          background: rgba(
            255,
            255,
            255,
            0.15
          );
        }

        .wallet-action.primary {
          background: #ffffff;
          color: #0c7658;
          border-color: #ffffff;
        }

        .wallet-action:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        /* ==================================================
           WALLET STATISTICS
        ================================================== */

        .wallet-stats {
          display: grid;
          grid-template-columns:
            repeat(3, 1fr);
          gap: 12px;
        }

        .wallet-stat {
          padding: 17px;
          border-radius: 16px;
          border: 1px solid #dfe8f1;
          background: #ffffff;
          box-shadow:
            0 10px 30px
              rgba(
                16,
                32,
                51,
                0.05
              );
        }

        .wallet-stat-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
        }

        .wallet-stat-icon {
          width: 35px;
          height: 35px;
          display: grid;
          place-items: center;
          border-radius: 10px;
          background: #eefaf6;
          color: #13845d;
          font-size: 15px;
          font-weight: 950;
        }

        .wallet-stat small {
          color: #687a72;
          font-size: 10px;
          font-weight: 850;
        }

        .wallet-stat strong {
          display: block;
          margin-top: 9px;
          color: #172b24;
          font-size: 21px;
          font-weight: 950;
        }

        /* ==================================================
           MAIN GRID
        ================================================== */

        .wallet-main-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          gap: 16px;
          align-items: start;
        }

        .wallet-card {
          padding: 18px;
          border-radius: 18px;
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

        .card-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 14px;
        }

        .card-heading h2 {
          margin: 0;
          color: #172b24;
          font-size: 17px;
          font-weight: 950;
        }

        .card-heading p {
          margin: 3px 0 0;
          color: #84948b;
          font-size: 10px;
        }

        .view-link {
          border: 0;
          background: transparent;
          color: #13845d;
          font-size: 11px;
          font-weight: 900;
          cursor: pointer;
        }

        /* ==================================================
           QUICK ACTIONS
        ================================================== */

        .quick-access-card {
          grid-column: 1 / -1;
        }

        .quick-actions {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
        }

        .quick-action {
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 10px;
          min-height: 76px;
          padding: 11px 12px;
          border: 1px solid transparent;
          border-radius: 14px;
          background: linear-gradient(135deg, #11855c, #35ad79);
          color: #ffffff;
          text-align: left;
          text-decoration: none;
          cursor: pointer;
          transition:
            border-color 0.16s ease,
            background 0.16s ease,
            transform 0.16s ease,
            box-shadow 0.16s ease;
        }

        .quick-action:hover {
          transform: translateY(-2px);
          filter: saturate(1.08) brightness(1.03);
          box-shadow: 0 9px 20px rgba(16, 65, 43, 0.16);
        }

        .quick-action:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px rgba(16, 132, 91, 0.2);
        }

        .quick-action:nth-child(2) {
          background: linear-gradient(135deg, #6546c7, #9472ef);
        }

        .quick-action:nth-child(3) {
          background: linear-gradient(135deg, #cf7132, #f2a04c);
        }

        .quick-action:nth-child(4) {
          background: linear-gradient(135deg, #2470bd, #48a5df);
        }

        .quick-action:nth-child(5) {
          background: linear-gradient(135deg, #118b83, #35b7a9);
        }

        .quick-action:nth-child(6) {
          background: linear-gradient(135deg, #33465a, #61798f);
        }

        .quick-icon {
          width: 38px;
          height: 38px;
          display: grid;
          place-items: center;
          flex-shrink: 0;
          border-radius: 11px;
          background: rgba(255, 255, 255, 0.18);
          color: #ffffff;
          font-size: 17px;
          font-weight: 950;
        }

        .quick-copy {
          flex: 1;
          min-width: 0;
        }

        .quick-copy strong {
          display: block;
          color: #ffffff;
          font-size: 12px;
          font-weight: 900;
        }

        .quick-copy span {
          display: block;
          margin-top: 3px;
          color: rgba(255, 255, 255, 0.84);
          font-size: 10px;
          line-height: 1.45;
        }

        /* ==================================================
           TRANSACTIONS
        ================================================== */

        .transaction-list {
          display: grid;
          gap: 9px;
        }

        .transaction-item {
          display: grid;
          grid-template-columns:
            42px minmax(0, 1fr)
            auto;
          align-items: center;
          gap: 10px;
          padding: 11px;
          border-radius: 12px;
          border: 1px solid #e8eef4;
          background: #fbfdff;
        }

        .transaction-icon {
          width: 40px;
          height: 40px;
          display: grid;
          place-items: center;
          border-radius: 11px;
          background: #eefaf6;
          color: #13845d;
          font-size: 14px;
          font-weight: 950;
        }

        .transaction-main {
          min-width: 0;
        }

        .transaction-title {
          color: #172b24;
          font-size: 12px;
          font-weight: 900;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .transaction-date {
          margin-top: 3px;
          color: #84948b;
          font-size: 9px;
        }

        .transaction-right {
          text-align: right;
        }

        .transaction-amount {
          color: #172b24;
          font-size: 12px;
          font-weight: 950;
        }

        .transaction-status {
          display: inline-flex;
          margin-top: 4px;
          padding: 4px 7px;
          border-radius: 999px;
          font-size: 9px;
          font-weight: 900;
        }

        .transaction-status.success {
          background: #eaf9f2;
          color: #13845d;
        }

        .transaction-status.pending {
          background: #fff8e7;
          color: #a66a00;
        }

        .transaction-status.failed {
          background: #fff1f2;
          color: #be263d;
        }

        .empty-transactions {
          padding: 26px 15px;
          text-align: center;
          border: 1px dashed #cdd8e3;
          border-radius: 13px;
          background: #f7faf8;
        }

        .empty-icon {
          width: 42px;
          height: 42px;
          margin: 0 auto 8px;
          display: grid;
          place-items: center;
          border-radius: 12px;
          background: #eef2f7;
          color: #687a72;
          font-weight: 950;
        }

        .empty-transactions strong {
          display: block;
          color: #40554a;
          font-size: 12px;
        }

        .empty-transactions span {
          display: block;
          margin-top: 4px;
          color: #84948b;
          font-size: 10px;
        }

        /* ==================================================
           PROFILE / REFERRAL
        ================================================== */

        .profile-wallet {
          margin-top: 16px;
          display: grid;
          grid-template-columns:
            minmax(0, 1fr)
            minmax(0, 1fr);
          gap: 16px;
        }

        .profile-mini {
          display: flex;
          align-items: center;
          gap: 11px;
        }

        .profile-avatar {
          width: 45px;
          height: 45px;
          display: grid;
          place-items: center;
          border-radius: 13px;
          background: linear-gradient(
            135deg,
            #13845d,
            #18b7a4
          );
          color: #ffffff;
          font-size: 14px;
          font-weight: 950;
        }

        .profile-mini strong {
          display: block;
          color: #172b24;
          font-size: 12px;
          font-weight: 950;
        }

        .profile-mini span {
          display: block;
          margin-top: 2px;
          color: #84948b;
          font-size: 10px;
        }

        .profile-details {
          margin-top: 13px;
          display: grid;
          gap: 0;
        }

        .profile-detail {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          padding: 9px 0;
          border-top: 1px solid #edf2f7;
          font-size: 10px;
        }

        .profile-detail span {
          color: #84948b;
        }

        .profile-detail strong {
          color: #40554a;
          text-align: right;
        }

        .referral-box {
          position: relative;
          overflow: hidden;
          padding: 16px;
          border-radius: 15px;
          background:
            linear-gradient(
              135deg,
              #f4fbf8,
              #ebf8f4
            );
          border: 1px solid #d6eee5;
        }

        .referral-box::after {
          content: "";
          position: absolute;
          width: 110px;
          height: 110px;
          right: -45px;
          top: -45px;
          border-radius: 50%;
          border: 20px solid
            rgba(
              15,
              159,
              110,
              0.06
            );
        }

        .referral-box h3 {
          position: relative;
          z-index: 1;
          margin: 0;
          color: #172b24;
          font-size: 13px;
          font-weight: 950;
        }

        .referral-box p {
          position: relative;
          z-index: 1;
          margin: 5px 0 12px;
          color: #687a72;
          font-size: 10px;
          line-height: 1.5;
        }

        .referral-button {
          position: relative;
          z-index: 1;
          width: 100%;
          border: 1px solid #bfe3d5;
          border-radius: 10px;
          padding: 10px;
          background: #ffffff;
          color: #13845d;
          font-size: 10px;
          font-weight: 900;
          cursor: pointer;
        }

        /* ==================================================
           RESTRICTION
        ================================================== */

        .restriction-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 18px;
          background:
            rgba(
              15,
              23,
              42,
              0.68
            );
          backdrop-filter: blur(9px);
          -webkit-backdrop-filter: blur(9px);
        }

        .restriction-card {
          width: min(530px, 100%);
          padding: 23px;
          border-radius: 19px;
          background: #ffffff;
          box-shadow:
            0 35px 100px
              rgba(
                15,
                23,
                42,
                0.27
              );
          text-align: center;
        }

        .restriction-icon {
          width: 60px;
          height: 60px;
          margin: 0 auto 13px;
          display: grid;
          place-items: center;
          border-radius: 17px;
          background: #fff1f2;
          color: #be263d;
          border: 1px solid #fecdd3;
          font-size: 24px;
          font-weight: 950;
        }

        .restriction-card h2 {
          margin: 0;
          color: #172b24;
          font-size: 21px;
          font-weight: 950;
        }

        .restriction-card > p {
          margin: 8px auto 14px;
          max-width: 440px;
          color: #687a72;
          font-size: 12px;
          line-height: 1.55;
        }

        .restriction-list {
          display: grid;
          gap: 7px;
          padding: 0;
          margin: 0 0 16px;
          list-style: none;
          text-align: left;
        }

        .restriction-list li {
          display: grid;
          grid-template-columns:
            25px minmax(0, 1fr);
          gap: 9px;
          align-items: start;
          padding: 9px;
          border-radius: 10px;
          background: #fff8f8;
          border: 1px solid #fee2e2;
          color: #52645b;
          font-size: 10px;
          line-height: 1.45;
        }

        .restriction-number {
          width: 23px;
          height: 23px;
          display: grid;
          place-items: center;
          border-radius: 8px;
          background: #fee2e2;
          color: #b42318;
          font-size: 9px;
          font-weight: 950;
        }

        .restriction-button {
          width: 100%;
          border: 0;
          border-radius: 11px;
          padding: 13px 16px;
          background: linear-gradient(
            135deg,
            #13845d,
            #13845d
          );
          color: #ffffff;
          font-size: 12px;
          font-weight: 950;
          cursor: pointer;
          box-shadow:
            0 12px 25px
              rgba(
                15,
                159,
                110,
                0.2
              );
        }

        /* ==================================================
           INTRO MODAL
        ================================================== */

        .intro-overlay,
        .welcome-overlay,
        .dashboard-loading {
          position: fixed;
          inset: 0;
          z-index: 9998;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 18px;
        }

        .intro-overlay,
        .dashboard-loading {
          background:
            rgba(
              15,
              23,
              42,
              0.57
            );
          backdrop-filter: blur(7px);
        }

        .welcome-overlay {
          pointer-events: none;
        }

        .intro-modal {
          width: min(510px, 100%);
          overflow: hidden;
          border: 1px solid #dcebe1;
          border-radius: 22px;
          background: #ffffff;
          box-shadow: 0 32px 90px rgba(15, 42, 28, 0.28);
          animation: welcomeIn 0.3s ease;
        }

        .intro-hero {
          position: relative;
          overflow: hidden;
          padding: 25px 25px 22px;
          color: #ffffff;
          background:
            radial-gradient(circle at 88% 18%, rgba(255, 255, 255, 0.2), transparent 26%),
            linear-gradient(135deg, #0b6143, #159568 62%, #35b77f);
        }

        .intro-hero::after {
          position: absolute;
          right: -26px;
          bottom: -100px;
          width: 220px;
          height: 220px;
          border: 1px solid rgba(255, 255, 255, 0.16);
          border-radius: 50%;
          box-shadow: 0 0 0 22px rgba(255, 255, 255, 0.05), 0 0 0 48px rgba(255, 255, 255, 0.04);
          content: "";
          pointer-events: none;
        }

        .intro-hero-top,
        .intro-brand,
        .intro-content,
        .intro-footer {
          position: relative;
          z-index: 1;
        }

        .intro-hero-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .intro-brand {
          display: flex;
          align-items: center;
          gap: 11px;
        }

        .intro-icon {
          display: grid;
          place-items: center;
          width: 46px;
          height: 46px;
          border: 1px solid rgba(255, 255, 255, 0.28);
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.15);
          font-size: 15px;
          font-weight: 950;
          letter-spacing: -0.04em;
        }

        .intro-kicker {
          color: rgba(255, 255, 255, 0.78);
          font-size: 9px;
          font-weight: 850;
          letter-spacing: 0.14em;
        }

        .intro-brand-name {
          margin-top: 2px;
          color: #ffffff;
          font-size: 15px;
          font-weight: 950;
        }

        .intro-close {
          display: grid;
          place-items: center;
          width: 34px;
          height: 34px;
          border: 1px solid rgba(255, 255, 255, 0.25);
          border-radius: 50%;
          color: #ffffff;
          background: rgba(255, 255, 255, 0.12);
          font-size: 21px;
          line-height: 1;
          cursor: pointer;
        }

        .intro-content {
          padding: 22px 25px 24px;
        }

        .intro-content h2 {
          margin: 0;
          color: #172b24;
          font-size: clamp(21px, 5vw, 27px);
          font-weight: 950;
          letter-spacing: -0.035em;
          line-height: 1.2;
        }

        .intro-description {
          margin: 9px 0 19px;
          color: #687a72;
          font-size: 13px;
          line-height: 1.65;
        }

        .intro-section-title {
          margin: 0 0 10px;
          color: #172b24;
          font-size: 12px;
          font-weight: 900;
        }

        .intro-steps {
          display: grid;
          gap: 9px;
          padding: 0;
          margin: 0;
          list-style: none;
        }

        .intro-steps li {
          display: grid;
          grid-template-columns: 30px minmax(0, 1fr);
          align-items: start;
          gap: 10px;
          padding: 10px 11px;
          border: 1px solid #e8f0eb;
          border-radius: 12px;
          background: #f8fbf9;
        }

        .intro-step-number {
          display: grid;
          place-items: center;
          width: 28px;
          height: 28px;
          border-radius: 9px;
          color: #087449;
          background: #e4f5eb;
          font-size: 11px;
          font-weight: 950;
        }

        .intro-steps strong {
          display: block;
          color: #20392e;
          font-size: 11px;
          font-weight: 850;
        }

        .intro-steps small {
          display: block;
          margin-top: 2px;
          color: #74837b;
          font-size: 10px;
          line-height: 1.45;
        }

        .intro-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-top: 18px;
        }

        .intro-footer-note {
          color: #84948b;
          font-size: 10px;
        }

        .intro-button {
          min-height: 42px;
          padding: 10px 17px;
          border: 0;
          border-radius: 11px;
          color: #ffffff;
          background: linear-gradient(135deg, #0b7651, #159568);
          box-shadow: 0 7px 17px rgba(16, 132, 91, 0.2);
          font-size: 12px;
          font-weight: 900;
          cursor: pointer;
          transition: transform 160ms ease, box-shadow 160ms ease;
        }

        .intro-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 10px 20px rgba(16, 132, 91, 0.25);
        }

        @media (max-width: 480px) {
          .intro-hero {
            padding: 20px 19px 18px;
          }

          .intro-content {
            padding: 19px;
          }

          .intro-footer-note {
            max-width: 150px;
          }
        }

        /* ==================================================
           LOADING
        ================================================== */

        .loading-card {
          width: min(360px, 100%);
          padding: 24px;
          display: flex;
          align-items: center;
          gap: 13px;
          border-radius: 17px;
          background: #ffffff;
          box-shadow:
            0 25px 70px
              rgba(
                15,
                23,
                42,
                0.2
              );
        }

        .loader-ring {
          width: 31px;
          height: 31px;
          flex-shrink: 0;
          border-radius: 50%;
          border: 3px solid #e3ebe6;
          border-top-color: #13845d;
          animation:
            spin 0.8s linear infinite;
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
          font-size: 10px;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes welcomeIn {
          from {
            opacity: 0;
            transform:
              translateY(12px)
              scale(0.97);
          }

          to {
            opacity: 1;
            transform:
              translateY(0)
              scale(1);
          }
        }

        /* ==================================================
           RESPONSIVE
        ================================================== */

        @media (max-width: 940px) {
          .wallet-main-grid {
            grid-template-columns: 1fr;
          }

          .profile-wallet {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 700px) {
          .wallet-shell {
            padding:
              10px 0 28px;
          }

          .quick-actions {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .wallet-topbar {
            padding: 0 2px;
          }

          .welcome-title {
            font-size: 21px;
          }

          .wallet-hero {
            padding: 20px;
            border-radius: 20px;
          }

          .wallet-actions {
            grid-template-columns:
              1fr;
            max-width: none;
          }

          .wallet-stats {
            grid-template-columns:
              1fr;
          }

          .wallet-stat {
            padding: 15px;
          }

          .transaction-item {
            grid-template-columns:
              39px minmax(0, 1fr);
          }

          .transaction-right {
            grid-column: 2;
            text-align: left;
          }
        }

        @media (max-width: 480px) {
          .quick-actions {
            grid-template-columns: 1fr;
          }

          .wallet-balance {
            font-size: 38px;
          }

          .wallet-top-line {
            align-items: flex-start;
          }

          .wallet-status {
            font-size: 8px;
          }

          .wallet-stat strong {
            font-size: 19px;
          }
        }
      `}</style>

      <div className="wallet-shell">
        <div className="wallet-container">

          {/* ==================================================
             TOP BAR
          ================================================== */}
          <section className="wallet-topbar">
            <div>
              <h1 className="welcome-title">
                Hello, {firstName} 👋
              </h1>

              <p className="welcome-subtitle">
                Welcome back to your ElitePay wallet.
              </p>
            </div>

            <button
              className="avatar-button"
              onClick={() =>
                router.push("/profile")
              }
              aria-label="Open profile"
            >
              {initials}
            </button>
          </section>

          {/* ==================================================
             MAIN WALLET CARD
          ================================================== */}
          <section className="wallet-hero">
            <div className="wallet-hero-content">

              <div className="wallet-top-line">
                <span className="wallet-label">
                  ElitePay Wallet
                </span>

                <span className="wallet-status">
                  <span className="wallet-status-dot" />
                  Wallet Active
                </span>
              </div>

              <div className="wallet-balance-label">
                Available Balance
              </div>

              <div className="wallet-balance">
                {formatNaira(balance)}
              </div>

              <div className="wallet-account">
                Account holder:{" "}
                {user.fullName}
              </div>

              {/* WALLET ACTIONS */}
              <div className="wallet-actions">

                <button
                  className="wallet-action primary"
                  onClick={() =>
                    startQuick(
                      "/mine",
                      "Preparing Pulse Miner..."
                    )
                  }
                >
                  ⛏ Mine
                </button>

                <button
                  className="wallet-action"
                  disabled={restricted}
                  onClick={() =>
                    startQuick(
                      "/withdraw",
                      "Opening withdrawal..."
                    )
                  }
                >
                  ↗ Withdraw
                </button>

              </div>
            </div>
          </section>

          {/* ==================================================
             MAIN CONTENT
          ================================================== */}
          <section className="wallet-main-grid">

            {/* QUICK ACTIONS */}
            <div className="wallet-card">
              <div className="card-heading">
                <div>
                  <h2>
                    Quick Actions
                  </h2>

                  <p>
                    Manage your wallet quickly.
                  </p>
                </div>
              </div>

              <div className="quick-actions">
                <button
                  className="quick-action"
                  onClick={() => startQuick("/buy-code", "Opening coupon code purchase...")}
                >
                  <span className="quick-icon">▣</span>
                  <span className="quick-copy">
                    <strong>Buy Coupon Code</strong>
                    <span>Get a code for your wallet</span>
                  </span>
                </button>

                <button
                  className="quick-action"
                  onClick={() => startQuick("/tasks", "Loading available tasks...")}
                >
                  <span className="quick-icon">▶</span>
                  <span className="quick-copy">
                    <strong>Watch &amp; Earn</strong>
                    <span>Explore videos and community tasks</span>
                  </span>
                </button>

                <button
                  className="quick-action"
                  onClick={() => startQuick("/mine", "Preparing Pulse Miner...")}
                >
                  <span className="quick-icon">⛏</span>
                  <span className="quick-copy">
                    <strong>Mine</strong>
                    <span>Open your Pulse Miner</span>
                  </span>
                </button>

                <button
                  className="quick-action"
                  disabled={restricted}
                  onClick={() => startQuick("/withdraw", "Opening withdrawal...")}
                >
                  <span className="quick-icon">↗</span>
                  <span className="quick-copy">
                    <strong>Withdraw</strong>
                    <span>Manage a wallet withdrawal</span>
                  </span>
                </button>

                <a
                  className="quick-action"
                  href="https://t.me/ueiejao"
                  target="_blank"
                  rel="noreferrer"
                >
                  <span className="quick-icon">✦</span>
                  <span className="quick-copy">
                    <strong>Join Our Community</strong>
                    <span>Connect with ElitePay on Telegram</span>
                  </span>
                </a>

                <button
                  className="quick-action"
                  onClick={() => startQuick("/history", "Loading transactions...")}
                >
                  <span className="quick-icon">≡</span>
                  <span className="quick-copy">
                    <strong>Transaction History</strong>
                    <span>Review your wallet activity</span>
                  </span>
                </button>
              </div>
            </div>

            {/* RECENT TRANSACTIONS */}
            <div className="wallet-card">

              <div className="card-heading">
                <div>
                  <h2>
                    Recent Activity
                  </h2>

                  <p>
                    Your latest wallet transactions.
                  </p>
                </div>

                <button
                  className="view-link"
                  onClick={() =>
                    startQuick(
                      "/history",
                      "Loading transactions..."
                    )
                  }
                >
                  View all
                </button>
              </div>

              <div className="transaction-list">

                {previewTx.length === 0 && (
                  <div className="empty-transactions">
                    <div className="empty-icon">
                      ≡
                    </div>

                    <strong>
                      No transactions yet
                    </strong>

                    <span>
                      Your wallet activity will appear
                      here.
                    </span>
                  </div>
                )}

                {previewTx.map(
                  (item, index) => {
                    const transactionStatus =
                      getTransactionStatus(
                        item?.status
                      );

                    const transactionDate =
                      item?.created_at
                        ? new Date(
                            item.created_at
                          ).toLocaleString()
                        : "Unknown date";

                    return (
                      <article
                        className="transaction-item"
                        key={
                          item?.id ||
                          item?.created_at ||
                          `${item?.type}-${index}`
                        }
                      >
                        <div className="transaction-icon">
                          {item?.type ===
                          "mine"
                            ? "⛏"
                            : item?.type ===
                              "withdraw" ||
                              item?.type ===
                                "withdraw_confirm"
                            ? "↗"
                            : "+"}
                        </div>

                        <div className="transaction-main">
                          <div className="transaction-title">
                            {getTransactionTitle(
                              item
                            )}
                          </div>

                          <div className="transaction-date">
                            {transactionDate}
                          </div>
                        </div>

                        <div className="transaction-right">
                          <div className="transaction-amount">
                            {formatNaira(
                              item?.amount ||
                                0
                            )}
                          </div>

                          <span
                            className={`transaction-status ${transactionStatus.className}`}
                          >
                            {
                              transactionStatus.label
                            }
                          </span>
                        </div>
                      </article>
                    );
                  }
                )}

              </div>
            </div>

          </section>

          {/* ==================================================
             PROFILE + REFERRAL
          ================================================== */}
          <section className="profile-wallet">

           
            <div className="referral-box">
              <h3>
                Invite & Grow
              </h3>

              <p>
                Share your ElitePay referral link
                with friends and grow your network.
              </p>

              <button
                className="referral-button"
                onClick={copyReferral}
              >
                Copy Referral Link
              </button>

              <button
                className="referral-button"
                style={{
                  marginTop: 7,
                  background: "#13845d",
                  color: "#ffffff",
                  borderColor: "#13845d",
                }}
                onClick={shareWallet}
              >
                Share ElitePay
              </button>
            </div>

          </section>

        </div>
      </div>

      {/* ==================================================
         RESTRICTION MODAL
      ================================================== */}
      {restricted && (
        <div
          className="restriction-overlay"
          role="dialog"
          aria-modal="true"
        >
          <div className="restriction-card">

            <div className="restriction-icon">
              !
            </div>

            <h2>
              Wallet Access Restricted
            </h2>

            <p>
              Dear{" "}
              <strong>
                {user.fullName}
              </strong>
              , some wallet features are currently
              restricted. Activate your account to
              continue using ElitePay.
            </p>

            <ul className="restriction-list">

              <li>
                <span className="restriction-number">
                  1
                </span>

                <div>
                  Accessing the website again after
                  a completed withdrawal.
                </div>
              </li>

              <li>
                <span className="restriction-number">
                  2
                </span>

                <div>
                  Incorrect account name or phone
                  number on a withdrawal request.
                </div>
              </li>

              <li>
                <span className="restriction-number">
                  3
                </span>

                <div>
                  Making multiple withdrawal requests
                  at the same time.
                </div>
              </li>

              <li>
                <span className="restriction-number">
                  4
                </span>

                <div>
                  Using one activation code on a
                  different account.
                </div>
              </li>

            </ul>

            <button
              className="restriction-button"
              onClick={() =>
                router.push("/active")
              }
            >
              Activate Account
            </button>

          </div>
        </div>
      )}

      {/* ==================================================
         INTRO MODAL
      ================================================== */}
      {showIntro && (
        <div
          className="intro-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="welcome-title"
        >
          <div className="intro-modal">
            <div className="intro-hero">
              <div className="intro-hero-top">
                <div className="intro-brand">
                  <div className="intro-icon" aria-hidden="true">EP</div>
                  <div>
                    <div className="intro-kicker">WELCOME TO</div>
                    <div className="intro-brand-name">ElitePay Wallet</div>
                  </div>
                </div>
                <button
                  className="intro-close"
                  type="button"
                  aria-label="Close welcome message"
                  onClick={() => setShowIntro(false)}
                >
                  ×
                </button>
              </div>
            </div>

            <div className="intro-content">
              <h2 id="welcome-title">
                Your wallet, made simple{firstName ? `, ${firstName}` : ""}
              </h2>
              <p className="intro-description">
                ElitePay brings your wallet balance, rewards, withdrawals,
                coupons, and account activity together in one easy-to-use place.
              </p>

              <h3 className="intro-section-title">How it works</h3>
              <ol className="intro-steps">
                <li>
                  <span className="intro-step-number">1</span>
                  <span>
                    <strong>Explore your wallet</strong>
                    <small>Check your balance and use the quick-access tools.</small>
                  </span>
                </li>
                <li>
                  <span className="intro-step-number">2</span>
                  <span>
                    <strong>Use wallet features</strong>
                    <small>Visit tasks, mining, coupons, or withdrawal pages.</small>
                  </span>
                </li>
                <li>
                  <span className="intro-step-number">3</span>
                  <span>
                    <strong>Stay up to date</strong>
                    <small>Review your transaction history and profile details.</small>
                  </span>
                </li>
              </ol>

              <div className="intro-footer">
                <span className="intro-footer-note">
                  Your dashboard is ready whenever you are.
                </span>
                <button
                  className="intro-button"
                  type="button"
                  onClick={() => setShowIntro(false)}
                >
                  Go to dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================
         QUICK LOADING OVERLAY
      ================================================== */}
      {loading && (
        <div
          className="dashboard-loading"
          role="status"
          aria-live="polite"
        >
          <div className="loading-card">

            <div className="loader-ring" />

            <div>
              <strong>
                {loadingMessage}
              </strong>

              <span>
                Preparing your secure wallet session...
              </span>
            </div>

          </div>
        </div>
      )}

    </Layout>
  );
}
