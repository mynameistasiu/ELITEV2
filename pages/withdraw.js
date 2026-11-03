 import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Layout from "../components/Layout";
import { formatNaira } from "../utils/format";
import {
  loadUser,
  loadBalance,
  saveBalance,
  saveTx,
  loadTx,
  savePendingWithdraw,
} from "../utils/storage";

const WITHDRAW_CODE = "KYX1819";

const WITHDRAWAL_FEE = 0;

function LockIcon({ size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="5"
        y="10"
        width="14"
        height="10"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M8 10V7a4 4 0 0 1 8 0v3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function WalletIcon({ size = 20 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 7a3 3 0 0 1 3-3h11a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a3 3 0 0 1-3-3V7Z"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M4 7h12a3 3 0 0 1 3 3v1h-4a2 2 0 1 0 0 4h4v1a3 3 0 0 1-3 3H7"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <circle cx="15.5" cy="13" r="1" fill="currentColor" />
    </svg>
  );
}

function ArrowUpIcon({ size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 19V5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="m6 11 6-6 6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ShieldIcon({ size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 3 19 6v5c0 4.9-2.9 8.1-7 10-4.1-1.9-7-5.1-7-10V6l7-3Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="m9 12 2 2 4-4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BankIcon({ size = 20 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="m3 9 9-5 9 5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5 10h14M6 10v8M10 10v8M14 10v8M18 10v8M4 19h16"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function HistoryIcon({ size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M3 12a9 9 0 1 0 3-6.7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M3 5v5h5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 7v5l3 2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon({ size = 16 }) {
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
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function AlertIcon({ size = 20 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M12 7v5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle
        cx="12"
        cy="16"
        r="1"
        fill="currentColor"
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

export default function Withdraw() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [balance, setBalance] = useState(0);

  const [bank, setBank] = useState("");
  const [account, setAccount] = useState("");
  const [accountName, setAccountName] =
    useState("");
  const [amount, setAmount] = useState("");
  const [code, setCode] = useState("");

  const [recentTx, setRecentTx] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [isRestricted, setIsRestricted] =
    useState(false);

  const [
    showRestrictionPopup,
    setShowRestrictionPopup,
  ] = useState(false);

  const [
    showSuccessPopup,
    setShowSuccessPopup,
  ] = useState(false);

  const [successAmount, setSuccessAmount] =
    useState(0);

  const [showReview, setShowReview] =
    useState(false);

  const [timeLeft, setTimeLeft] =
    useState(0);

  /*
   * ---------------------------------------------------------
   * HELPERS
   * ---------------------------------------------------------
   */

  const parseAmount = (value) =>
    Number(
      String(value || "").replace(
        /,/g,
        ""
      )
    );

  const formatAmountInput = (value) => {
    const digits = String(value || "")
      .replace(/\D/g, "");

    return digits
      ? Number(digits).toLocaleString()
      : "";
  };

  const cleanAccountNumber = account
    .replace(/\D/g, "")
    .slice(0, 10);

  const withdrawalAmount =
    parseAmount(amount);

  const remainingBalance = Math.max(
    0,
    Number(balance) -
      Number(
        withdrawalAmount || 0
      )
  );

  const isValidAccount =
    cleanAccountNumber.length === 10;

  const hasProfileBankDetails =
    Boolean(bank && isValidAccount && accountName.trim());

  const canContinue =
    !isRestricted &&
    hasProfileBankDetails &&
    withdrawalAmount > 0 &&
    withdrawalAmount <= balance &&
    code.trim();

  /*
   * ---------------------------------------------------------
   * LOAD USER
   * ---------------------------------------------------------
   */

  useEffect(() => {
    const currentUser =
      loadUser();

    if (!currentUser) {
      router.push("/");
      return;
    }

    if (currentUser.kycCompleted !== true) {
      router.replace("/profile?kyc=required");
      return;
    }

    setUser(currentUser);

    const currentBalance =
      Number(
        currentUser.balance ||
          loadBalance() ||
          0
      );

    setBalance(
      currentBalance
    );

    setBank(currentUser.kyc?.bankName || "");
    setAccount(
      String(currentUser.kyc?.bankAccountNumber || "")
        .replace(/\D/g, "")
        .slice(0, 10)
    );
    setAccountName(currentUser.fullName || "");

    const transactions =
      loadTx() || [];

    const withdrawals =
      transactions
        .filter(
          (item) =>
            item.type ===
              "withdraw" ||
            item.type ===
              "withdraw_confirm"
        )
        .sort(
          (a, b) =>
            new Date(
              b.created_at
            ) -
            new Date(
              a.created_at
            )
        );

    setRecentTx(
      withdrawals.slice(0, 4)
    );
  }, [router]);

  /*
   * ---------------------------------------------------------
   * RESTRICTION
   * ---------------------------------------------------------
   */

  useEffect(() => {
    const checkRestriction =
      () => {
        try {
          const activated =
            localStorage.getItem(
              "gt_activated"
            ) === "true";

          if (activated) {
            setIsRestricted(
              false
            );
            setShowRestrictionPopup(
              false
            );
            setTimeLeft(0);
            return;
          }

          const end =
            localStorage.getItem(
              "gt_restriction_end"
            );

          if (!end) {
            setIsRestricted(
              false
            );
            setShowRestrictionPopup(
              false
            );
            setTimeLeft(0);
            return;
          }

          const remaining =
            Number(end) -
            Date.now();

          if (remaining <= 0) {
            setIsRestricted(
              true
            );
            setShowRestrictionPopup(
              true
            );
            setTimeLeft(0);
          } else {
            setIsRestricted(
              false
            );
            setShowRestrictionPopup(
              false
            );
            setTimeLeft(
              remaining
            );
          }
        } catch (error) {
          console.error(
            "Restriction check error:",
            error
          );
        }
      };

    checkRestriction();

    const interval =
      setInterval(
        checkRestriction,
        1000
      );

    return () =>
      clearInterval(
        interval
      );
  }, []);

  /*
   * Prevent back navigation while restricted.
   */

  useEffect(() => {
    if (!isRestricted) {
      return;
    }

    const blockBack = () => {
      try {
        window.history.pushState(
          null,
          "",
          window.location.href
        );
      } catch (error) {
        console.error(
          "Back navigation error:",
          error
        );
      }
    };

    blockBack();

    window.addEventListener(
      "popstate",
      blockBack
    );

    return () =>
      window.removeEventListener(
        "popstate",
        blockBack
      );
  }, [isRestricted]);

  /*
   * ---------------------------------------------------------
   * REVIEW
   * ---------------------------------------------------------
   */

  const openReview = () => {
    if (isRestricted) {
      setShowRestrictionPopup(
        true
      );
      return;
    }

    if (!bank) {
      alert(
        "Add your bank details to your profile before withdrawing."
      );
      return;
    }

    if (
      cleanAccountNumber.length !==
      10
    ) {
      alert(
        "Account number must contain 10 digits."
      );
      return;
    }

    if (!accountName.trim()) {
      alert(
        "Add your full name to your profile before withdrawing."
      );
      return;
    }

    if (
      !withdrawalAmount ||
      withdrawalAmount <= 0
    ) {
      alert(
        "Please enter a valid withdrawal amount."
      );
      return;
    }

    if (
      withdrawalAmount >
      balance
    ) {
      alert(
        "Insufficient wallet balance."
      );
      return;
    }

    if (!code.trim()) {
      alert(
        "Please enter your activation code."
      );
      return;
    }

    setShowReview(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  /*
   * ---------------------------------------------------------
   * CONFIRM WITHDRAWAL
   * ---------------------------------------------------------
   */

  const proceed = () => {
    if (
      loading ||
      isRestricted
    ) {
      return;
    }

    setLoading(true);

    setTimeout(() => {
      let validCode =
        WITHDRAW_CODE;

      try {
        const stored =
          localStorage.getItem(
            "gt_activation_code"
          );

        if (
          stored &&
          String(
            stored
          ).trim()
        ) {
          validCode =
            String(
              stored
            ).trim();
        }
      } catch (error) {
        console.error(
          "Activation code read error:",
          error
        );
      }

      if (
        String(
          code
        )
          .trim()
          .toUpperCase() !==
        String(
          validCode
        )
          .trim()
          .toUpperCase()
      ) {
        setLoading(
          false
        );

        setShowReview(
          false
        );

        alert(
          "Invalid activation code. Please check the code and try again."
        );

        return;
      }

      const currentBalance =
        Number(
          loadBalance() ||
            0
        );

      if (
        withdrawalAmount >
        currentBalance
      ) {
        setLoading(
          false
        );

        setShowReview(
          false
        );

        alert(
          "Your wallet balance has changed. Please review the withdrawal again."
        );

        setBalance(
          currentBalance
        );

        return;
      }

      const newBalance =
        currentBalance -
        withdrawalAmount;

      try {
        saveBalance(
          newBalance
        );
      } catch (error) {
        console.error(
          "Balance save error:",
          error
        );
      }

      setBalance(
        newBalance
      );

      const transaction = {
        type: "withdraw_confirm",
        amount:
          withdrawalAmount,
        status:
          "successful",
        created_at:
          new Date().toISOString(),
        fullName:
          user.fullName ||
          "",
        phone:
          user.phone ||
          "",
        meta: {
          beneficiaryName:
            accountName.trim(),
          beneficiaryAccount:
            cleanAccountNumber,
          bank,
          activationCode:
            code
              .trim()
              .toUpperCase(),
          fee:
            WITHDRAWAL_FEE,
          remark:
            "Withdrawal confirmed on ElitePay wallet flow",
        },
      };

      try {
        savePendingWithdraw({
          account:
            cleanAccountNumber,
          bank,
          amount:
            withdrawalAmount,
          meta: {
            beneficiaryName:
              accountName.trim(),
          },
        });

        saveTx(
          transaction
        );
      } catch (error) {
        console.error(
          "Transaction save error:",
          error
        );
      }

      /*
       * Restrict access after withdrawal.
       */
      try {
        localStorage.setItem(
          "gt_restriction_end",
          String(
            Date.now() +
              10 *
                60 *
                1000
          )
        );

        localStorage.removeItem(
          "gt_activated"
        );
      } catch (error) {
        console.error(
          "Restriction save error:",
          error
        );
      }

      setLoading(
        false
      );

      setShowReview(
        false
      );

      setSuccessAmount(
        withdrawalAmount
      );

      setShowSuccessPopup(
        true
      );

      setTimeout(() => {
        router.push(
          "/dashboard"
        );
      }, 3200);
    }, 1400);
  };

  /*
   * ---------------------------------------------------------
   * TIME
   * ---------------------------------------------------------
   */

  const formatTime = (
    milliseconds
  ) => {
    const secondsTotal =
      Math.floor(
        milliseconds /
          1000
      );

    const minutes =
      Math.floor(
        secondsTotal /
          60
      );

    const seconds =
      secondsTotal %
      60;

    return `${minutes}:${seconds
      .toString()
      .padStart(
        2,
        "0"
      )}`;
  };

  /*
   * ---------------------------------------------------------
   * TRANSACTION DISPLAY
   * ---------------------------------------------------------
   */

  const formatTransactionDate = (
    value
  ) => {
    if (!value) {
      return "Unknown date";
    }

    try {
      return new Date(
        value
      ).toLocaleString();
    } catch (error) {
      return "Unknown date";
    }
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
            <Spinner />
            <div>
              <strong>
                Loading wallet...
              </strong>
              <span>
                Preparing withdrawal center
              </span>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const amountDisplay =
    withdrawalAmount > 0
      ? formatNaira(
          withdrawalAmount
        )
      : "₦0";

  return (
    <Layout title="Withdraw Funds - ElitePay Wallet">
      <style>{`

        /* ==================================================
           PAGE
        ================================================== */

        .withdraw-page {
          max-width: 1120px;
          margin: 0 auto;
          padding: 8px 0 35px;
        }

        .withdraw-layout {
          display: grid;
          grid-template-columns:
            minmax(0, 1.35fr)
            minmax(300px, 0.72fr);
          gap: 17px;
          align-items: start;
        }

        /* ==================================================
           HERO
        ================================================== */

        .withdraw-hero {
          position: relative;
          overflow: hidden;
          padding: 24px;
          border-radius: 22px;
          color: #ffffff;
          background:
            radial-gradient(
              circle at 83% 10%,
              rgba(
                31,
                196,
                171,
                0.30
              ),
              transparent 30%
            ),
            radial-gradient(
              circle at 0% 100%,
              rgba(
                255,
                255,
                255,
                0.06
              ),
              transparent 30%
            ),
            linear-gradient(
              135deg,
              #086644,
              #10845b 62%,
              #22a36c
            );
          box-shadow:
            0 22px 55px
              rgba(
                12,
                67,
                54,
                0.19
              );
        }

        .withdraw-hero::after {
          content: "";
          position: absolute;
          width: 190px;
          height: 190px;
          right: -90px;
          bottom: -100px;
          border-radius: 50%;
          border: 26px solid
            rgba(
              255,
              255,
              255,
              0.06
            );
        }

        .hero-content {
          position: relative;
          z-index: 2;
        }

        .hero-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 9px;
          border-radius: 999px;
          background:
            rgba(
              255,
              255,
              255,
              0.10
            );
          border: 1px solid
            rgba(
              255,
              255,
              255,
              0.14
            );
          color: rgba(
            255,
            255,
            255,
            0.88
          );
          font-size: 9px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .hero-title {
          margin: 15px 0 5px;
          font-size: 29px;
          line-height: 1.05;
          font-weight: 950;
          letter-spacing: -0.04em;
        }

        .hero-text {
          max-width: 650px;
          margin: 0;
          color: rgba(
            255,
            255,
            255,
            0.70
          );
          font-size: 11px;
          line-height: 1.6;
        }

        .balance-grid {
          display: grid;
          grid-template-columns:
            1.15fr
            0.85fr;
          gap: 9px;
          margin-top: 20px;
        }

        .balance-box {
          padding: 14px;
          border-radius: 13px;
          background:
            rgba(
              255,
              255,
              255,
              0.09
            );
          border: 1px solid
            rgba(
              255,
              255,
              255,
              0.14
            );
        }

        .balance-box span {
          display: block;
          color: rgba(
            255,
            255,
            255,
            0.58
          );
          font-size: 8px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.07em;
        }

        .balance-box strong {
          display: block;
          margin-top: 5px;
          color: #ffffff;
          font-size: 22px;
          font-weight: 950;
        }

        .progress-step {
          display: flex;
          align-items: center;
          gap: 7px;
          margin-top: 18px;
          color: rgba(
            255,
            255,
            255,
            0.66
          );
          font-size: 9px;
          font-weight: 850;
        }

        .step-dot {
          width: 20px;
          height: 20px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          background:
            rgba(
              255,
              255,
              255,
              0.13
            );
          color: #ffffff;
          font-size: 8px;
          font-weight: 950;
        }

        .step-dot.active {
          background: #ffffff;
          color: #13845d;
        }

        /* ==================================================
           MAIN FORM CARD
        ================================================== */

        .form-card {
          margin-top: 16px;
          padding: 20px;
          border-radius: 18px;
          background: #ffffff;
          border: 1px solid #d8e9df;
          box-shadow:
            0 16px 40px
              rgba(
                16,
                32,
                51,
                0.06
              );
        }

        .section-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 15px;
        }

        .section-heading {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .section-icon {
          width: 38px;
          height: 38px;
          display: grid;
          place-items: center;
          border-radius: 11px;
          background: #eefaf6;
          color: #13845d;
        }

        .section-head h2 {
          margin: 0;
          color: #172b24;
          font-size: 17px;
          font-weight: 950;
        }

        .section-head p {
          margin: 3px 0 0;
          color: #84948b;
          font-size: 9px;
        }

        /* ==================================================
           SAVED ACCOUNTS
        ================================================== */

        .kyc-account-card {
          margin-bottom: 15px;
          padding: 15px;
          border: 1px solid #d6eadc;
          border-radius: 14px;
          background: linear-gradient(135deg, #f0faf3, #f8fcf9);
        }

        .kyc-account-card__top {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .kyc-account-card__icon,
        .kyc-account-card__check {
          display: grid;
          flex: 0 0 auto;
          place-items: center;
          width: 36px;
          height: 36px;
          border-radius: 11px;
          background: #dff3e6;
          color: #087449;
        }

        .kyc-account-card__top > div {
          display: grid;
          flex: 1;
          gap: 2px;
        }

        .kyc-account-card__top strong {
          color: #203b2e;
          font-size: 12px;
          font-weight: 900;
        }

        .kyc-account-card__top > div span {
          color: #687a72;
          font-size: 10px;
        }

        .kyc-account-card__check {
          width: 28px;
          height: 28px;
          border-radius: 999px;
          background: #13845d;
          color: white;
        }

        .kyc-account-card__details {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 9px;
          margin-top: 13px;
          padding-top: 12px;
          border-top: 1px solid #dcebe1;
        }

        .kyc-account-card__details div {
          min-width: 0;
        }

        .kyc-account-card__details span {
          display: block;
          margin-bottom: 4px;
          color: #6c7e74;
          font-size: 9px;
        }

        .kyc-account-card__details strong {
          display: block;
          overflow-wrap: anywhere;
          color: #203b2e;
          font-size: 11px;
          font-weight: 850;
        }

        .kyc-account-card__missing {
          margin-top: 12px;
          padding-top: 11px;
          border-top: 1px solid #dcebe1;
          color: #675332;
          font-size: 11px;
        }

        .kyc-account-card__missing p {
          margin: 0 0 8px;
        }

        .kyc-account-card__missing a {
          display: inline-flex;
          align-items: center;
          min-height: 34px;
          padding: 0 12px;
          border-radius: 9px;
          background: #13845d;
          color: #fff;
          font-size: 10px;
          font-weight: 800;
        }

        /* ==================================================
           FORM
        ================================================== */

        .form-grid {
          display: grid;
          gap: 13px;
        }

        .field label {
          display: block;
          margin-bottom: 6px;
          color: #40554a;
          font-size: 12px;
          font-weight: 950;
        }

        .field-wrap {
          position: relative;
        }

        .field input,
        .field select {
          width: 100%;
          box-sizing: border-box;
          min-height: 44px;
          padding: 10px 12px;
          border: 1px solid #d7e5dc;
          border-radius: 10px;
          background: #ffffff;
          color: #172b24;
          outline: none;
          font-size: 14px;
          transition:
            border-color 0.16s ease,
            box-shadow 0.16s ease;
        }

        .field input:focus,
        .field select:focus {
          border-color: #13845d;
          box-shadow:
            0 0 0 3px
              rgba(
                15,
                159,
                110,
                0.09
              );
        }

        .field-hint {
          margin-top: 5px;
          color: #84948b;
          font-size: 10px;
        }

        .verification-box {
          margin-top: 6px;
          padding: 10px;
          border-radius: 10px;
          background: #f7faf8;
          border: 1px solid #e4ebf1;
        }

        .verification-box.ready {
          background: #eefaf6;
          border-color: #d5eee5;
        }

        .verification-top {
          display: flex;
          align-items: center;
          gap: 7px;
          color: #687a72;
          font-size: 9px;
          font-weight: 800;
        }

        .verification-box.ready
          .verification-top {
          color: #13845d;
        }

        .verification-name {
          margin-top: 6px;
          color: #172b24;
          font-size: 12px;
          font-weight: 950;
        }

        /* ==================================================
           AMOUNT CARD
        ================================================== */

        .amount-card {
          padding: 13px;
          border-radius: 12px;
          background:
            linear-gradient(
              135deg,
              #f5fbf8,
              #f2f8ff
            );
          border: 1px solid #dcebe5;
        }

        .amount-label {
          display: block;
          color: #687a72;
          font-size: 10px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.07em;
        }

        .amount-field {
          display: flex;
          align-items: center;
          gap: 10px;
          min-height: 58px;
          margin-top: 8px;
          padding: 7px 14px;
          border: 1px solid #b9dcca;
          border-radius: 12px;
          background: #ffffff;
          box-shadow: 0 3px 10px rgba(22, 91, 55, 0.05);
          transition: border-color 160ms ease, box-shadow 160ms ease;
        }

        .amount-field:focus-within {
          border-color: #13845d;
          box-shadow: 0 0 0 3px rgba(15, 159, 110, 0.12);
        }

        .amount-prefix {
          color: #13845d;
          font-size: 22px;
          font-weight: 950;
        }

        .amount-input {
          width: 100%;
          min-width: 0;
          min-height: 40px !important;
          padding: 4px 0 !important;
          border: 0 !important;
          background: transparent !important;
          box-shadow: none !important;
          color: #172b24 !important;
          font-size: 24px !important;
          font-weight: 950;
        }

        .amount-input::placeholder {
          color: #84948b;
        }

        .amount-meta {
          display: grid;
          grid-template-columns:
            1fr
            1fr;
          gap: 8px;
          margin-top: 9px;
        }

        .amount-meta-box {
          padding: 8px 9px;
          border-radius: 8px;
          background: #ffffff;
          border: 1px solid #e2eaf0;
        }

        .amount-meta-box span {
          display: block;
          color: #84948b;
          font-size: 10px;
        }

        .amount-meta-box strong {
          display: block;
          margin-top: 3px;
          color: #40554a;
          font-size: 12px;
          font-weight: 900;
        }

        /* ==================================================
           CODE
        ================================================== */

        .code-card {
          padding: 13px;
          border-radius: 12px;
          background: #f6fbf8;
          border: 1px solid #dcebe2;
        }

        .code-entry {
          display: flex;
          align-items: stretch;
          gap: 8px;
          padding: 5px;
          border: 1px solid #b9dcca;
          border-radius: 12px;
          background: #ffffff;
          transition: border-color 160ms ease, box-shadow 160ms ease;
        }

        .code-entry:focus-within {
          border-color: #13845d;
          box-shadow: 0 0 0 3px rgba(15, 159, 110, 0.12);
        }

        .code-entry input {
          flex: 1;
          min-width: 0;
          min-height: 42px;
          padding: 9px 10px;
          border: 0;
          outline: 0;
          background: transparent;
          color: #172b24;
          font-size: 13px;
        }

        .buy-code-button {
          display: inline-flex;
          flex: 0 0 auto;
          align-items: center;
          justify-content: center;
          gap: 6px;
          min-height: 42px;
          padding: 0 14px;
          border: 0;
          border-radius: 9px;
          background: linear-gradient(135deg, #087449, #18a66d);
          box-shadow: 0 5px 13px rgba(8, 116, 73, 0.22);
          color: #ffffff;
          font-size: 11px;
          font-weight: 900;
          cursor: pointer;
          transition: transform 150ms ease, box-shadow 150ms ease;
        }

        .buy-code-button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 17px rgba(8, 116, 73, 0.28);
        }

        .buy-code-button:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .code-help {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 8px;
        }

        .code-help span {
          color: #687a72;
          font-size: 10px;
          line-height: 1.45;
          line-height: 1.4;
        }

        /* ==================================================
           REVIEW BUTTON
        ================================================== */

        .review-button {
          width: 100%;
          min-height: 47px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border: 0;
          border-radius: 11px;
          background: linear-gradient(135deg, #087449, #159568);
          color: #ffffff;
          font-size: 13px;
          font-weight: 950;
          cursor: pointer;
          box-shadow:
            0 13px 27px
              rgba(
                15,
                159,
                110,
                0.19
              );
        }

        .review-button:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        /* ==================================================
           SIDEBAR
        ================================================== */

        .side-column {
          display: grid;
          gap: 14px;
        }

        .side-card {
          padding: 17px;
          border-radius: 17px;
          background: #ffffff;
          border: 1px solid #dfe7ef;
          box-shadow:
            0 12px 30px
              rgba(
                16,
                32,
                51,
                0.05
              );
        }

        .side-heading {
          display: flex;
          align-items: center;
          gap: 9px;
          margin-bottom: 4px;
          color: #172b24;
          font-size: 14px;
          font-weight: 950;
        }

        .side-subtitle {
          margin: 0 0 13px;
          color: #84948b;
          font-size: 9px;
          line-height: 1.5;
        }

        .quick-list {
          display: grid;
          gap: 8px;
        }

        .quick-row {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 10px;
          border-radius: 10px;
          background: #f7faf8;
          border: 1px solid #e6edf3;
        }

        .quick-icon {
          width: 32px;
          height: 32px;
          display: grid;
          place-items: center;
          flex-shrink: 0;
          border-radius: 9px;
          background: #eefaf6;
          color: #13845d;
        }

        .quick-row strong {
          display: block;
          color: #40554a;
          font-size: 9px;
        }

        .quick-row span {
          display: block;
          margin-top: 2px;
          color: #84948b;
          font-size: 8px;
        }

        /* ==================================================
           RECENT TRANSACTIONS
        ================================================== */

        .recent-list {
          display: grid;
          gap: 8px;
        }

        .recent-item {
          padding: 10px;
          border-radius: 10px;
          background: #fbfdff;
          border: 1px solid #e6edf3;
        }

        .recent-top {
          display: flex;
          justify-content: space-between;
          gap: 9px;
        }

        .recent-item strong {
          color: #172b24;
          font-size: 10px;
          font-weight: 950;
        }

        .recent-amount {
          color: #13845d !important;
        }

        .recent-bottom {
          display: flex;
          justify-content: space-between;
          gap: 9px;
          margin-top: 4px;
          color: #84948b;
          font-size: 8px;
        }

        .status-pill {
          display: inline-flex;
          padding: 3px 6px;
          border-radius: 999px;
          font-weight: 900;
          background: #eaf9f2;
          color: #13845d;
        }

        /* ==================================================
           SECURITY CARD
        ================================================== */

        .security-card {
          background:
            linear-gradient(
              135deg,
              #f4fbf8,
              #f7fbff
            );
          border-color: #d8e9e2;
        }

        .security-line {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          color: #687a72;
          font-size: 9px;
          line-height: 1.5;
        }

        .security-check {
          width: 20px;
          height: 20px;
          display: grid;
          place-items: center;
          flex-shrink: 0;
          border-radius: 7px;
          background: #e1f5ec;
          color: #13845d;
        }

        /* ==================================================
           RESTRICTION
        ================================================== */

        .overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 17px;
          background:
            rgba(
              15,
              23,
              42,
              0.66
            );
          backdrop-filter: blur(8px);
        }

        .restriction-card,
        .success-card,
        .review-modal {
          width: min(510px, 100%);
          max-height: 92vh;
          overflow-y: auto;
          padding: 22px;
          border-radius: 19px;
          background: #ffffff;
          border: 1px solid #e3ebe6;
          box-shadow:
            0 32px 100px
              rgba(
                15,
                23,
                42,
                0.25
              );
        }

        .restriction-icon,
        .success-icon {
          width: 60px;
          height: 60px;
          margin: 0 auto 12px;
          display: grid;
          place-items: center;
          border-radius: 17px;
        }

        .restriction-icon {
          background: #fff1f2;
          border: 1px solid #fecdd3;
          color: #be263d;
        }

        .success-icon {
          background: #eaf9f2;
          border: 1px solid #c7efdd;
          color: #13845d;
        }

        .restriction-card h2,
        .success-card h2,
        .review-modal h2 {
          margin: 0;
          color: #172b24;
          font-size: 20px;
          font-weight: 950;
          text-align: center;
        }

        .modal-text {
          margin: 7px auto 14px;
          max-width: 430px;
          color: #687a72;
          font-size: 11px;
          line-height: 1.55;
          text-align: center;
        }

        .restriction-list {
          display: grid;
          gap: 7px;
          margin: 15px 0;
          padding: 0;
          list-style: none;
        }

        .restriction-list li {
          display: grid;
          grid-template-columns:
            24px
            minmax(0, 1fr);
          gap: 8px;
          padding: 9px;
          border-radius: 10px;
          background: #fff8f8;
          border: 1px solid #fee2e2;
          color: #52645b;
          font-size: 9px;
          line-height: 1.45;
        }

        .restriction-number {
          width: 22px;
          height: 22px;
          display: grid;
          place-items: center;
          border-radius: 7px;
          background: #fee2e2;
          color: #b42318;
          font-size: 8px;
          font-weight: 950;
        }

        .activate-button,
        .success-button {
          width: 100%;
          min-height: 45px;
          border: 0;
          border-radius: 11px;
          background:
            linear-gradient(
              135deg,
              #13845d,
              #13845d
            );
          color: #ffffff;
          font-size: 10px;
          font-weight: 950;
          cursor: pointer;
        }

        /* ==================================================
           REVIEW MODAL
        ================================================== */

        .review-summary {
          margin-top: 15px;
          padding: 12px;
          border-radius: 12px;
          background: #f7faf8;
          border: 1px solid #e3ebf2;
        }

        .review-row {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          padding: 8px 0;
          border-bottom: 1px dashed #dfe7ef;
          color: #687a72;
          font-size: 9px;
        }

        .review-row:last-child {
          border-bottom: 0;
          padding-bottom: 0;
        }

        .review-value {
          color: #172b24;
          font-weight: 950;
          text-align: right;
        }

        .review-total {
          margin-top: 10px;
          padding: 11px;
          border-radius: 10px;
          background: #eefaf6;
          border: 1px solid #d6eee5;
        }

        .review-total span {
          display: block;
          color: #687a72;
          font-size: 8px;
          font-weight: 800;
        }

        .review-total strong {
          display: block;
          margin-top: 3px;
          color: #13845d;
          font-size: 24px;
          font-weight: 950;
        }

        .review-actions {
          display: grid;
          grid-template-columns:
            0.8fr
            1.3fr;
          gap: 8px;
          margin-top: 15px;
        }

        .review-cancel {
          border: 1px solid #dbe4ec;
          border-radius: 10px;
          background: #ffffff;
          color: #52645b;
          font-size: 10px;
          font-weight: 900;
          cursor: pointer;
        }

        .review-confirm {
          min-height: 45px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          border: 0;
          border-radius: 10px;
          background:
            linear-gradient(
              135deg,
              #13845d,
              #13845d
            );
          color: #ffffff;
          font-size: 10px;
          font-weight: 950;
          cursor: pointer;
        }

        .review-confirm:disabled,
        .review-cancel:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        /* ==================================================
           SUCCESS
        ================================================== */

        .success-amount {
          margin: 9px 0;
          color: #13845d;
          font-size: 34px;
          font-weight: 950;
          text-align: center;
        }

        .success-info {
          margin-top: 12px;
          padding: 11px;
          border-radius: 10px;
          background: #eefaf6;
          border: 1px solid #d4eee4;
          color: #477569;
          font-size: 9px;
          line-height: 1.55;
          text-align: center;
        }

        /* ==================================================
           PAGE LOADING
        ================================================== */

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
          gap: 11px;
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
          font-size: 11px;
          font-weight: 950;
        }

        .loading-card span {
          display: block;
          margin-top: 3px;
          color: #84948b;
          font-size: 8px;
        }

        .spinner {
          width: 18px;
          height: 18px;
          display: inline-block;
          flex-shrink: 0;
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
          .withdraw-layout {
            grid-template-columns:
              1fr;
          }
        }

        @media (max-width: 600px) {
          .withdraw-page {
            padding:
              4px 0 28px;
          }

          .withdraw-hero {
            padding: 19px;
            border-radius: 18px;
          }

          .hero-title {
            font-size: 25px;
          }

          .balance-grid {
            grid-template-columns:
              1fr;
          }

          .form-card {
            padding: 16px;
          }

          .kyc-account-card__details {
            grid-template-columns: 1fr;
            gap: 10px;
          }

          .amount-meta {
            grid-template-columns:
              1fr;
          }

          .review-actions {
            grid-template-columns:
              1fr;
          }
        }

      `}</style>

      {/* =====================================================
          RESTRICTION MODAL
      ====================================================== */}

      {showRestrictionPopup &&
        isRestricted && (
          <div
            className="overlay"
            role="dialog"
            aria-modal="true"
          >
            <div className="restriction-card">

              <div className="restriction-icon">
                <LockIcon
                  size={25}
                />
              </div>

              <h2>
                Wallet Access Restricted
              </h2>

              <p className="modal-text">
                Dear{" "}
                <strong>
                  {user.fullName}
                </strong>
                , your previous withdrawal has
                triggered a temporary security
                restriction. Activate your account
                to continue.
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
                    Making multiple withdrawal
                    requests at the same time.
                  </div>
                </li>

                <li>
                  <span className="restriction-number">
                    4
                  </span>
                  <div>
                    Using one activation code on
                    another account.
                  </div>
                </li>
              </ul>

              <button
                className="activate-button"
                onClick={() =>
                  router.push(
                    "/active"
                  )
                }
              >
                Activate Account
              </button>

            </div>
          </div>
        )}

      {/* =====================================================
          REVIEW MODAL
      ====================================================== */}

      {showReview && (
        <div
          className="overlay"
          role="dialog"
          aria-modal="true"
        >
          <div className="review-modal">

            <div
              className="section-icon"
              style={{
                margin:
                  "0 auto 11px",
              }}
            >
              <ShieldIcon
                size={22}
              />
            </div>

            <h2>
              Review Withdrawal
            </h2>

            <p className="modal-text">
              Check the beneficiary and amount before
              confirming this withdrawal.
            </p>

            <div className="review-summary">

              <div className="review-row">
                <span>
                  Recipient
                </span>

                <span className="review-value">
                  {accountName}
                </span>
              </div>

              <div className="review-row">
                <span>
                  Bank
                </span>

                <span className="review-value">
                  {bank}
                </span>
              </div>

              <div className="review-row">
                <span>
                  Account
                </span>

                <span className="review-value">
                  {maskAccount(
                    cleanAccountNumber
                  )}
                </span>
              </div>

              <div className="review-row">
                <span>
                  Activation code
                </span>

                <span className="review-value">
                  {code
                    .trim()
                    .toUpperCase()}
                </span>
              </div>

              {WITHDRAWAL_FEE > 0 && (
                <div className="review-row">
                  <span>
                    Withdrawal fee
                  </span>

                  <span className="review-value">
                    {formatNaira(
                      WITHDRAWAL_FEE
                    )}
                  </span>
                </div>
              )}

            </div>

            <div className="review-total">
              <span>
                Withdrawal amount
              </span>

              <strong>
                {amountDisplay}
              </strong>
            </div>

            <div
              className="review-total"
              style={{
                marginTop: 8,
                background:
                  "#f7faf8",
                borderColor:
                  "#e4ebf1",
              }}
            >
              <span>
                Wallet balance after withdrawal
              </span>

              <strong
                style={{
                  color:
                    "#40554a",
                  fontSize:
                    18,
                }}
              >
                {formatNaira(
                  remainingBalance
                )}
              </strong>
            </div>

            <div className="review-actions">

              <button
                className="review-cancel"
                disabled={loading}
                onClick={() =>
                  setShowReview(
                    false
                  )
                }
              >
                Edit Details
              </button>

              <button
                className="review-confirm"
                disabled={loading}
                onClick={
                  proceed
                }
              >
                {loading ? (
                  <>
                    <Spinner />
                    Processing...
                  </>
                ) : (
                  <>
                    <ArrowUpIcon
                      size={15}
                    />
                    Confirm Withdrawal
                  </>
                )}
              </button>

            </div>

          </div>
        </div>
      )}

      {/* =====================================================
          SUCCESS MODAL
      ====================================================== */}

      {showSuccessPopup && (
        <div
          className="overlay"
          role="dialog"
          aria-modal="true"
        >
          <div className="success-card">

            <div className="success-icon">
              <CheckIcon
                size={28}
              />
            </div>

            <h2>
              Withdrawal Successful
            </h2>

            <div className="success-amount">
              {formatNaira(
                successAmount
              )}
            </div>

            <p className="modal-text">
              Your withdrawal request has been
              recorded successfully.
            </p>

            <div className="success-info">
              The amount has been deducted from
              your wallet balance. You will be
              redirected to your dashboard shortly.
            </div>

            <button
              className="success-button"
              style={{
                marginTop: 14,
              }}
              onClick={() =>
                router.push(
                  "/dashboard"
                )
              }
            >
              Continue to Wallet
            </button>

          </div>
        </div>
      )}

      {/* =====================================================
          MAIN PAGE
      ====================================================== */}

      <div className="withdraw-page">

        <div className="withdraw-layout">

          <main>

            {/* HERO */}

            <section className="withdraw-hero">
              <div className="hero-content">

                <div className="hero-top">

                  <div className="hero-badge">
                    <WalletIcon
                      size={12}
                    />
                    ElitePay Wallet
                  </div>

                  <div className="hero-badge">
                    <ShieldIcon
                      size={12}
                    />
                    Secure
                  </div>

                </div>

                <h1 className="hero-title">
                  Withdraw Funds
                </h1>

                <p className="hero-text">
                  Send available wallet funds to a Nigerian
                  bank account. Review your recipient details
                  and amount before confirming the transaction.
                </p>

                <div className="balance-grid">

                  <div className="balance-box">
                    <span>
                      Available balance
                    </span>

                    <strong>
                      {formatNaira(
                        balance
                      )}
                    </strong>
                  </div>

                  <div className="balance-box">
                    <span>
                      Current status
                    </span>

                    <strong
                      style={{
                        fontSize:
                          16,
                      }}
                    >
                      {isRestricted
                        ? "Restricted"
                        : "Ready"}
                    </strong>
                  </div>

                </div>

                <div className="progress-step">
                  <span className="step-dot active">
                    1
                  </span>
                  Enter details
                  <span
                    style={{
                      opacity:
                        0.35,
                    }}
                  >
                    ─────────
                  </span>
                  <span
                    className="step-dot"
                    style={{
                      opacity:
                        0.55,
                    }}
                  >
                    2
                  </span>
                  Review & confirm
                </div>

              </div>
            </section>

            {/* FORM CARD */}

            <section className="form-card">

              <div className="section-head">
                <div className="section-heading">

                  <div className="section-icon">
                    <BankIcon
                      size={19}
                    />
                  </div>

                  <div>
                    <h2>
                      Recipient Details
                    </h2>

                    <p>Your saved KYC bank account will receive the withdrawal.</p>
                  </div>

                </div>
              </div>

              <div className="form-grid">
                <div className="kyc-account-card">
                  <div className="kyc-account-card__top">
                    <span className="kyc-account-card__icon">
                      <BankIcon size={18} />
                    </span>
                    <div>
                      <strong>Profile bank account</strong>
                      <span>Used as the withdrawal destination</span>
                    </div>
                    <span className="kyc-account-card__check" aria-label="From KYC profile">
                      <CheckIcon size={14} />
                    </span>
                  </div>
                  {hasProfileBankDetails ? (
                    <div className="kyc-account-card__details">
                      <div>
                        <span>Account name</span>
                        <strong>{accountName}</strong>
                      </div>
                      <div>
                        <span>Bank</span>
                        <strong>{bank}</strong>
                      </div>
                      <div>
                        <span>Account number</span>
                        <strong>{maskAccount(cleanAccountNumber)}</strong>
                      </div>
                    </div>
                  ) : (
                    <div className="kyc-account-card__missing">
                      <p>Add your bank and account number to your profile before withdrawing.</p>
                      <a href="/profile">Update KYC profile</a>
                    </div>
                  )}
                </div>

                {/* AMOUNT */}

                <div className="amount-card">
                  <span className="amount-label">
                    Withdrawal amount
                  </span>

                  <div className="amount-field">
                    <span className="amount-prefix">
                      ₦
                    </span>

                    <input
                      className="amount-input"
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      value={
                        amount
                      }
                      onChange={(
                        event
                      ) =>
                        setAmount(
                          formatAmountInput(
                            event
                              .target
                              .value
                          )
                        )
                      }
                      disabled={
                        isRestricted
                      }
                    />
                  </div>

                  <div className="amount-meta">

                    <div className="amount-meta-box">
                      <span>
                        Available
                      </span>

                      <strong>
                        {formatNaira(
                          balance
                        )}
                      </strong>
                    </div>

                    <div className="amount-meta-box">
                      <span>
                        Remaining
                      </span>

                      <strong>
                        {formatNaira(
                          remainingBalance
                        )}
                      </strong>
                    </div>

                  </div>
                </div>

                {/* CODE */}

                <div className="code-card">

                  <div className="field">
                    <label htmlFor="code">
                      Activation Code
                    </label>

                    <div className="code-entry">
                      <input
                        id="code"
                        type="text"
                        placeholder="Enter activation code"
                        value={code}
                        onChange={(event) => setCode(event.target.value)}
                        disabled={isRestricted}
                        aria-label="Activation code"
                      />
                      <button
                        className="buy-code-button"
                        type="button"
                        onClick={() => router.push("/buy-code")}
                        disabled={isRestricted}
                      >
                        <span aria-hidden="true">＋</span>
                        Buy Code
                      </button>
                    </div>

                    <div className="code-help">
                      <span>
                        Enter your code to authorize the withdrawal, or buy one if you don’t have it.
                      </span>
                    </div>

                  </div>

                </div>

                {/* REVIEW */}

                <button
                  className="review-button"
                  onClick={
                    openReview
                  }
                  disabled={
                    !canContinue
                  }
                >
                  <ShieldIcon
                    size={16}
                  />
                  Review Withdrawal
                </button>

              </div>
            </section>

          </main>

          {/* ==================================================
             SIDEBAR
          ================================================== */}

          <aside className="side-column">

            {/* SUMMARY */}

            <section className="side-card">

              <div className="side-heading">
                <WalletIcon
                  size={18}
                />
                Withdrawal Summary
              </div>

              <p className="side-subtitle">
                A quick overview of this transaction.
              </p>

              <div className="quick-list">

                <div className="quick-row">
                  <div className="quick-icon">
                    <BankIcon
                      size={16}
                    />
                  </div>

                  <div>
                    <strong>
                      Destination
                    </strong>

                    <span>
                      {bank ||
                        "No bank selected"}
                    </span>
                  </div>
                </div>

                <div className="quick-row">
                  <div className="quick-icon">
                    <ArrowUpIcon
                      size={16}
                    />
                  </div>

                  <div>
                    <strong>
                      Amount
                    </strong>

                    <span>
                      {amountDisplay}
                    </span>
                  </div>
                </div>

                <div className="quick-row">
                  <div className="quick-icon">
                    <ShieldIcon
                      size={16}
                    />
                  </div>

                  <div>
                    <strong>
                      Authorization
                    </strong>

                    <span>
                      {code.trim()
                        ? "Code entered"
                        : "Code required"}
                    </span>
                  </div>
                </div>

              </div>

            </section>

            {/* RECENT WITHDRAWALS */}

            <section className="side-card">

              <div className="side-heading">
                <HistoryIcon
                  size={18}
                />
                Recent Withdrawals
              </div>

              <p className="side-subtitle">
                Your latest withdrawal activity.
              </p>

              <div className="recent-list">

                {recentTx.length ===
                  0 && (
                  <div
                    style={{
                      padding:
                        "15px",
                      borderRadius:
                        10,
                      background:
                        "#f7faf8",
                      border:
                        "1px dashed #d7e0e8",
                      color:
                        "#84948b",
                      fontSize:
                        9,
                      textAlign:
                        "center",
                    }}
                  >
                    No withdrawal activity yet.
                  </div>
                )}

                {recentTx.map(
                  (
                    item,
                    index
                  ) => (
                    <div
                      className="recent-item"
                      key={
                        item.id ||
                        item.created_at ||
                        index
                      }
                    >
                      <div className="recent-top">
                        <strong>
                          Withdrawal
                        </strong>

                        <strong className="recent-amount">
                          {formatNaira(
                            item.amount ||
                              0
                          )}
                        </strong>
                      </div>

                      <div className="recent-bottom">

                        <span>
                          {formatTransactionDate(
                            item.created_at
                          )}
                        </span>

                        <span className="status-pill">
                          {item.status ||
                            "pending"}
                        </span>

                      </div>
                    </div>
                  )
                )}

              </div>

              <button
                className="btnGhost"
                onClick={() =>
                  router.push(
                    "/history"
                  )
              }
                type="button"
              >
                View Full History
              </button>

            </section>

            {/* SECURITY */}

            <section className="side-card security-card">

              <div className="side-heading">
                <ShieldIcon
                  size={18}
                />
                Security
              </div>

              <p className="side-subtitle">
                Keep your withdrawal activity secure.
              </p>

              <div
                style={{
                  display:
                    "grid",
                  gap: 9,
                }}
              >

                <div className="security-line">
                  <span className="security-check">
                    <CheckIcon
                      size={11}
                    />
                  </span>

                  <span>
                    Always verify the recipient account
                    before confirming.
                  </span>
                </div>

                <div className="security-line">
                  <span className="security-check">
                    <CheckIcon
                      size={11}
                    />
                  </span>

                  <span>
                    Keep your activation code private.
                  </span>
                </div>

                <div className="security-line">
                  <span className="security-check">
                    <CheckIcon
                      size={11}
                    />
                  </span>

                  <span>
                    Review the amount and remaining balance
                    before submitting.
                  </span>
                </div>

              </div>

            </section>

            {/* WALLET ACTIONS */}

            <section className="side-card">

              <div className="side-heading">
                <WalletIcon
                  size={18}
                />
                Wallet
              </div>

              <button
                className="btnGhost"
                type="button"
                onClick={() =>
                  router.push(
                    "/dashboard"
                  )
                }
              >
                Back to Wallet
              </button>

              <button
                className="btnGhost"
                type="button"
                onClick={() =>
                  router.push(
                    "/buy-code"
                  )
                }
              >
                Buy Withdrawal Code
              </button>

            </section>

          </aside>

        </div>
      </div>
    </Layout>
  );
}

function maskAccount(account) {
  if (!account) {
    return "";
  }

  const value = String(
    account
  ).replace(
    /\s+/g,
    ""
  );

  if (value.length <= 4) {
    return value;
  }

  return `**** ${value.slice(
    -4
  )}`;
}
