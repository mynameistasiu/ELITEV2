import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import Layout from "../components/Layout";
import {
  loadUser,
  saveUser,
  saveTx,
} from "../utils/storage";

const ACTIVATION_FEE = 3000;

// Payment account — same details used on your checkout page.
const ACCOUNT_NUMBER = "6511699109";
const ACCOUNT_NAME = "Abdulrahim Usman";
const BANK_NAME = "Moniepoint MFB BANK";

const ACTIVATION_REASONS = [
  {
    value: "first-withdrawal",
    label: "First Time Withdrawal",
  },
  {
    value: "account-reactivation",
    label: "Account Reactivation",
  },
  {
    value: "security-verification",
    label: "Security Verification Required",
  },
  {
    value: "premium-features",
    label: "Access Premium Features",
  },
  {
    value: "account-upgrade",
    label: "Account Upgrade",
  },
  {
    value: "other",
    label: "Other Reason",
  },
];

function CopyIcon({ size = 16 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="8"
        y="8"
        width="11"
        height="11"
        rx="2"
        stroke="currentColor"
        strokeWidth="2"
      />

      <path
        d="M5 15H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function LockIcon({ size = 20 }) {
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

function CheckIcon({ size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="M5 12.5 9.5 17 19 7.5"
        stroke="currentColor"
        strokeWidth="2.4"
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

function MoniepointMark() {
  return (
    <div className="moniepoint-mark">
      <svg
        width="42"
        height="42"
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          cx="50"
          cy="50"
          r="50"
          fill="#0866C6"
        />

        <text
          x="50"
          y="60"
          textAnchor="middle"
          fontFamily="Arial, sans-serif"
          fontSize="65"
          fontWeight="bold"
          fill="white"
        >
          M
        </text>
      </svg>
    </div>
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

export default function Activation() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [reason, setReason] = useState(
    "first-withdrawal"
  );

  const [errors, setErrors] = useState({});

  // Step 1 = form
  // Step 2 = payment details
  const [step, setStep] = useState(1);

  const [processing, setProcessing] =
    useState(false);

  const [copied, setCopied] = useState("");

  const [countdown, setCountdown] =
    useState(10 * 60);

  const timerRef = useRef(null);

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

    try {
      const activated =
        localStorage.getItem(
          "gt_activated"
        ) === "true";

      if (activated) {
        router.replace(
          "/dashboard?activated=success"
        );
        return;
      }
    } catch (error) {
      console.error(
        "Activation status error:",
        error
      );
    }

    setUser(currentUser);
    setFullName(currentUser.fullName || "");
    setPhone(currentUser.phone || "");
    setLoading(false);
  }, [router]);

  /*
   * ---------------------------------------------------------
   * PAYMENT TIMER
   * ---------------------------------------------------------
   */
  useEffect(() => {
    if (step !== 2) {
      clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setCountdown((current) => {
        if (current <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () =>
      clearInterval(timerRef.current);
  }, [step]);

  /*
   * ---------------------------------------------------------
   * VALIDATION
   * ---------------------------------------------------------
   */
  const validateForm = () => {
    const newErrors = {};

    if (
      !fullName ||
      fullName.trim().length < 2
    ) {
      newErrors.fullName =
        "Please enter your full name.";
    }

    const normalizedPhone = phone
      .replace(/\D/g, "");

    if (!normalizedPhone) {
      newErrors.phone =
        "Phone number is required.";
    } else if (
      !/^\d{11}$/.test(
        normalizedPhone
      )
    ) {
      newErrors.phone =
        "Phone number must contain 11 digits.";
    }

    if (!reason) {
      newErrors.reason =
        "Please select a reason.";
    }

    return newErrors;
  };

  /*
   * ---------------------------------------------------------
   * FORM CHANGES
   * ---------------------------------------------------------
   */
  const handlePhoneChange = (event) => {
    const digits =
      event.target.value.replace(
        /\D/g,
        ""
      );

    setPhone(digits.slice(0, 11));

    if (errors.phone) {
      setErrors((prev) => ({
        ...prev,
        phone: null,
      }));
    }
  };

  const handleNameChange = (event) => {
    setFullName(
      event.target.value
    );

    if (errors.fullName) {
      setErrors((prev) => ({
        ...prev,
        fullName: null,
      }));
    }
  };

  /*
   * ---------------------------------------------------------
   * GET REASON LABEL
   * ---------------------------------------------------------
   */
  const getReasonLabel = () => {
    return (
      ACTIVATION_REASONS.find(
        (item) =>
          item.value === reason
      )?.label ||
      "Account Activation"
    );
  };

  /*
   * ---------------------------------------------------------
   * PROCEED TO PAYMENT DETAILS
   * ---------------------------------------------------------
   */
  const handleProceed = (event) => {
    event.preventDefault();

    const validationErrors =
      validateForm();

    if (
      Object.keys(validationErrors)
        .length > 0
    ) {
      setErrors(validationErrors);
      return;
    }

    const normalizedPhone =
      phone.replace(/\D/g, "");

    const updatedUser = {
      ...user,
      fullName: fullName.trim(),
      phone: normalizedPhone,
    };

    saveUser(updatedUser);
    setUser(updatedUser);

    /*
     * Save activation request as pending.
     */
    try {
      saveTx({
        type: "activation_request",
        amount: ACTIVATION_FEE,
        status: "pending",
        meta: {
          reason,
          reasonLabel:
            getReasonLabel(),
          fullName:
            fullName.trim(),
          phone: normalizedPhone,
          bank: BANK_NAME,
          accountNumber:
            ACCOUNT_NUMBER,
          accountName:
            ACCOUNT_NAME,
        },
        created_at:
          new Date().toISOString(),
      });
    } catch (error) {
      console.error(
        "Error saving activation transaction:",
        error
      );
    }

    /*
     * Save pending activation information.
     */
    try {
      localStorage.setItem(
        "gt_activation_pending",
        JSON.stringify({
          fullName:
            fullName.trim(),
          phone: normalizedPhone,
          reason,
          reasonLabel:
            getReasonLabel(),
          amount: ACTIVATION_FEE,
          initiatedAt: Date.now(),
        })
      );
    } catch (error) {
      console.error(
        "Error saving activation data:",
        error
      );
    }

    setCountdown(10 * 60);
    setStep(2);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  /*
   * ---------------------------------------------------------
   * COPY
   * ---------------------------------------------------------
   */
  const copyText = async (
    label,
    value
  ) => {
    try {
      await navigator.clipboard.writeText(
        value
      );

      setCopied(label);

      setTimeout(() => {
        setCopied("");
      }, 1400);
    } catch (error) {
      window.prompt(
        `Copy ${label}:`,
        value
      );
    }
  };

  /*
   * ---------------------------------------------------------
   * USER CLICKED "I HAVE MADE PAYMENT"
   * ---------------------------------------------------------
   */
  const handlePaymentConfirmation = () => {
    if (countdown === 0) {
      alert(
        "Your payment window has expired. Please start the activation process again."
      );

      setStep(1);
      setCountdown(10 * 60);

      return;
    }

    setProcessing(true);

    /*
     * Save that customer submitted a payment
     * confirmation. Actual verification should
     * happen before activating the account.
     */
    try {
      saveTx({
        type: "activation_payment",
        amount: ACTIVATION_FEE,
        status: "pending",
        meta: {
          fullName:
            fullName.trim(),
          phone: phone.replace(
            /\D/g,
            ""
          ),
          reason,
          reasonLabel:
            getReasonLabel(),
          bank: BANK_NAME,
          accountNumber:
            ACCOUNT_NUMBER,
          accountName:
            ACCOUNT_NAME,
        },
        created_at:
          new Date().toISOString(),
      });
    } catch (error) {
      console.error(
        "Payment confirmation save error:",
        error
      );
    }

    /*
     * Keep the customer on this page.
     *
     * Payment must be verified before
     * setting gt_activated = true.
     */
    setTimeout(() => {
      setProcessing(false);

      alert(
        "Your payment confirmation has been submitted. Your activation will be processed after payment verification."
      );
    }, 1200);
  };

  /*
   * ---------------------------------------------------------
   * LOADING
   * ---------------------------------------------------------
   */
  if (loading) {
    return (
      <Layout>
        <div className="activation-loading">
          <div className="loading-card">
            <div className="loading-spinner" />

            <div>
              <strong>
                Loading activation...
              </strong>

              <span>
                Preparing your secure account
              </span>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const minutes = String(
    Math.floor(
      countdown / 60
    )
  ).padStart(2, "0");

  const seconds = String(
    countdown % 60
  ).padStart(2, "0");

  const progress =
    Math.max(
      0,
      Math.min(
        100,
        (countdown /
          (10 * 60)) *
          100
      )
    );

  return (
    <Layout title="Account Activation - ElitePay Wallet">
      <style>{`

        /* ==================================================
           PAGE
        ================================================== */

        .activation-shell {
          min-height: calc(100vh - 170px);
          padding: 20px 10px 40px;
          background:
            radial-gradient(
              circle at top,
              rgba(
                15,
                159,
                110,
                0.07
              ),
              transparent 35%
            ),
            #f7fafc;
        }

        .activation-container {
          width: min(620px, 100%);
          margin: 0 auto;
        }

        .activation-card {
          overflow: hidden;
          background: #ffffff;
          border: 1px solid #e1e8f0;
          border-radius: 22px;
          box-shadow:
            0 22px 65px
              rgba(
                16,
                32,
                51,
                0.09
              );
        }

        /* ==================================================
           HEADER
        ================================================== */

        .activation-header {
          padding: 25px 24px 20px;
          text-align: center;
          border-bottom: 1px solid #eef2f6;
        }

        .activation-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 10px;
          border-radius: 999px;
          background: #eefaf6;
          border: 1px solid #d3eee4;
          color: #13845d;
          font-size: 9px;
          font-weight: 950;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .activation-header h1 {
          margin: 13px 0 7px;
          color: #172b24;
          font-size: clamp(
            26px,
            6vw,
            34px
          );
          line-height: 1.1;
          font-weight: 950;
          letter-spacing: -0.04em;
        }

        .activation-header p {
          max-width: 480px;
          margin: 0 auto;
          color: #687a72;
          font-size: 12px;
          line-height: 1.65;
        }

        .fee-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          margin-top: 17px;
          padding: 13px 15px;
          background:
            linear-gradient(
              135deg,
              #f1faf7,
              #eef8ff
            );
          border: 1px solid #d9ebe5;
          border-radius: 13px;
          text-align: left;
        }

        .fee-label {
          display: block;
          color: #687a72;
          font-size: 9px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.07em;
        }

        .fee-value {
          display: block;
          margin-top: 3px;
          color: #0b654b;
          font-size: 23px;
          font-weight: 950;
        }

        .fee-chip {
          padding: 6px 9px;
          border-radius: 999px;
          background: #ffffff;
          border: 1px solid #d8e7f0;
          color: #52645b;
          font-size: 9px;
          font-weight: 900;
          white-space: nowrap;
        }

        /* ==================================================
           STEPS
        ================================================== */

        .steps {
          display: grid;
          grid-template-columns:
            1fr 1fr;
          gap: 8px;
          padding: 14px 20px;
          background: #fbfdff;
          border-bottom: 1px solid #eef2f6;
        }

        .step {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #84948b;
          font-size: 10px;
          font-weight: 850;
        }

        .step-number {
          width: 25px;
          height: 25px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          background: #e8eef4;
          color: #687a72;
          font-size: 9px;
          font-weight: 950;
        }

        .step.active {
          color: #13845d;
        }

        .step.active
          .step-number {
          background: #13845d;
          color: #ffffff;
        }

        /* ==================================================
           FORM
        ================================================== */

        .activation-body {
          padding: 22px;
        }

        .form-title {
          margin: 0;
          color: #172b24;
          font-size: 16px;
          font-weight: 950;
        }

        .form-description {
          margin: 5px 0 18px;
          color: #84948b;
          font-size: 10px;
          line-height: 1.5;
        }

        .form-group {
          margin-bottom: 15px;
        }

        .form-label {
          display: block;
          margin-bottom: 6px;
          color: #40554a;
          font-size: 10px;
          font-weight: 950;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        .input-wrap {
          position: relative;
        }

        .input-wrap input,
        .input-wrap select {
          width: 100%;
          box-sizing: border-box;
          padding: 12px 13px;
          border: 1px solid #d6e0e9;
          border-radius: 11px;
          outline: none;
          background: #ffffff;
          color: #172b24;
          font-size: 12px;
          transition:
            border-color 0.16s ease,
            box-shadow 0.16s ease;
        }

        .input-wrap input:focus,
        .input-wrap select:focus {
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

        .input-error {
          border-color: #ef4444 !important;
          background: #fffafa !important;
        }

        .form-error {
          display: block;
          margin-top: 5px;
          color: #dc2626;
          font-size: 9px;
          font-weight: 800;
        }

        /* ==================================================
           REASON INFORMATION
        ================================================== */

        .reason-preview {
          display: flex;
          align-items: flex-start;
          gap: 9px;
          margin-top: 6px;
          padding: 11px;
          border-radius: 11px;
          background: #f7faf8;
          border: 1px solid #e4ebf2;
          color: #687a72;
          font-size: 10px;
          line-height: 1.45;
        }

        .reason-icon {
          width: 23px;
          height: 23px;
          flex-shrink: 0;
          display: grid;
          place-items: center;
          border-radius: 7px;
          background: #eefaf6;
          color: #13845d;
        }

        /* ==================================================
           BENEFITS
        ================================================== */

        .benefits-box {
          margin-top: 18px;
          padding: 14px;
          border-radius: 13px;
          background: #f1faf7;
          border: 1px solid #d8eee6;
        }

        .benefits-title {
          margin-bottom: 9px;
          color: #13845d;
          font-size: 10px;
          font-weight: 950;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        .benefits-list {
          display: grid;
          grid-template-columns:
            1fr 1fr;
          gap: 7px;
        }

        .benefit {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #477569;
          font-size: 9px;
          font-weight: 750;
        }

        .benefit-check {
          width: 19px;
          height: 19px;
          flex-shrink: 0;
          display: grid;
          place-items: center;
          border-radius: 50%;
          background: #d9f4e9;
          color: #13845d;
        }

        /* ==================================================
           FORM BUTTONS
        ================================================== */

        .button-row {
          display: grid;
          grid-template-columns:
            0.85fr 1.5fr;
          gap: 9px;
          margin-top: 19px;
        }

        .cancel-button,
        .proceed-button {
          min-height: 46px;
          border-radius: 11px;
          font-size: 11px;
          font-weight: 950;
          cursor: pointer;
        }

        .cancel-button {
          border: 1px solid #dbe4ec;
          background: #ffffff;
          color: #52645b;
        }

        .proceed-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          border: 0;
          background:
            linear-gradient(
              135deg,
              #13845d,
              #13845d
            );
          color: #ffffff;
          box-shadow:
            0 12px 24px
              rgba(
                15,
                159,
                110,
                0.2
              );
        }

        .proceed-button:disabled,
        .cancel-button:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        /* ==================================================
           PAYMENT PAGE
        ================================================== */

        .payment-body {
          padding: 22px;
        }

        .payment-top {
          text-align: center;
        }

        .payment-top-icon {
          width: 50px;
          height: 50px;
          margin: 0 auto 10px;
          display: grid;
          place-items: center;
          border-radius: 15px;
          background: #eefaf6;
          color: #13845d;
        }

        .payment-top h2 {
          margin: 0;
          color: #172b24;
          font-size: 20px;
          font-weight: 950;
        }

        .payment-top p {
          max-width: 450px;
          margin: 6px auto 0;
          color: #687a72;
          font-size: 11px;
          line-height: 1.5;
        }

        /* ==================================================
           CUSTOMER SUMMARY
        ================================================== */

        .customer-summary {
          margin-top: 17px;
          padding: 12px;
          border-radius: 13px;
          background: #f7faf8;
          border: 1px solid #e1e8f0;
        }

        .summary-title {
          margin-bottom: 8px;
          color: #40554a;
          font-size: 9px;
          font-weight: 950;
          text-transform: uppercase;
          letter-spacing: 0.07em;
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          padding: 7px 0;
          border-bottom: 1px dashed #e1e8f0;
          color: #687a72;
          font-size: 10px;
        }

        .summary-row:last-child {
          border-bottom: 0;
          padding-bottom: 0;
        }

        .summary-row:first-of-type {
          padding-top: 0;
        }

        .summary-value {
          color: #172b24;
          font-weight: 900;
          text-align: right;
        }

        /* ==================================================
           PAYMENT INSTRUCTION
        ================================================== */

        .payment-instruction {
          margin-top: 15px;
          padding: 13px;
          border-radius: 12px;
          background: #fff7ed;
          border: 1px solid #fed7aa;
          color: #9a3412;
          text-align: center;
          font-size: 10px;
          line-height: 1.5;
        }

        .payment-instruction strong {
          color: #c2410c;
          font-size: 12px;
        }

        /* ==================================================
           ACCOUNT CARD
        ================================================== */

        .account-card {
          overflow: hidden;
          margin-top: 14px;
          background: #ffffff;
          border: 1px solid #dfe7ef;
          border-radius: 15px;
          box-shadow:
            0 14px 35px
              rgba(
                15,
                23,
                42,
                0.07
              );
        }

        .account-main {
          padding: 18px;
          text-align: center;
        }

        .bank-row {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 14px;
        }

        .moniepoint-mark {
          width: 42px;
          height: 42px;
          overflow: hidden;
          border-radius: 10px;
          box-shadow:
            0 6px 15px
              rgba(
                0,
                0,
                0,
                0.1
              );
        }

        .moniepoint-mark svg {
          display: block;
          width: 100%;
          height: 100%;
        }

        .bank-meta {
          text-align: left;
        }

        .bank-label {
          display: block;
          color: #84948b;
          font-size: 8px;
          font-weight: 950;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 3px;
        }

        .bank-name {
          color: #172b24;
          font-size: 14px;
          font-weight: 950;
        }

        .account-number-box {
          padding: 13px 10px;
          border-radius: 12px;
          background: #f7fbff;
          border: 1px solid #deeee3;
        }

        .account-number-label {
          color: #687a72;
          font-size: 8px;
          font-weight: 950;
          text-transform: uppercase;
          letter-spacing: 0.07em;
        }

        .account-number-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 4px;
          border: 0;
          background: transparent;
          color: #1677f2;
          font-size: 28px;
          font-weight: 950;
          letter-spacing: 0.03em;
          cursor: pointer;
        }

        .account-name {
          margin-top: 9px;
          color: #174473;
          font-size: 15px;
          font-weight: 900;
        }

        .account-warning {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          padding: 10px;
          background: #f7faf8;
          border-top: 1px solid #edf2f7;
          color: #687a72;
          font-size: 9px;
          font-weight: 800;
          text-align: center;
        }

        .warning-icon {
          width: 17px;
          height: 17px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          background: #fee2e2;
          color: #dc2626;
          font-size: 10px;
          font-weight: 950;
        }

        .copied {
          min-height: 17px;
          margin-top: 7px;
          color: #13845d;
          font-size: 9px;
          font-weight: 900;
          text-align: center;
        }

        /* ==================================================
           TIMER
        ================================================== */

        .timer-card {
          margin-top: 14px;
          padding: 13px;
          border-radius: 12px;
          background: #f7faf8;
          border: 1px solid #e5eaf0;
        }

        .timer-top {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 7px;
          color: #687a72;
          font-size: 9px;
          font-weight: 850;
        }

        .timer-value {
          color: #172b24;
        }

        .progress {
          height: 6px;
          overflow: hidden;
          border-radius: 999px;
          background: #e3ebe6;
        }

        .progress-bar {
          height: 100%;
          border-radius: inherit;
          background: #13845d;
          transition: width 0.5s ease;
        }

        /* ==================================================
           PAYMENT NOTE
        ================================================== */

        .payment-note {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          margin-top: 13px;
          padding: 11px;
          border-radius: 11px;
          background: #f1f7f3;
          border: 1px solid #deeee3;
          color: #52645b;
          font-size: 9px;
          line-height: 1.5;
        }

        /* ==================================================
           PAYMENT BUTTONS
        ================================================== */

        .payment-buttons {
          display: grid;
          grid-template-columns:
            0.85fr 1.5fr;
          gap: 9px;
          margin-top: 17px;
        }

        .back-payment,
        .confirm-payment {
          min-height: 47px;
          border-radius: 11px;
          font-size: 10px;
          font-weight: 950;
          cursor: pointer;
        }

        .back-payment {
          border: 1px solid #dbe4ec;
          background: #ffffff;
          color: #52645b;
        }

        .confirm-payment {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          border: 0;
          background:
            linear-gradient(
              135deg,
              #13845d,
              #13845d
            );
          color: #ffffff;
          box-shadow:
            0 12px 24px
              rgba(
                15,
                159,
                110,
                0.19
              );
        }

        .confirm-payment:disabled,
        .back-payment:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* ==================================================
           LOADING
        ================================================== */

        .activation-loading {
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

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        /* ==================================================
           MOBILE
        ================================================== */

        @media (max-width: 560px) {

          .activation-shell {
            padding:
              10px 7px 30px;
          }

          .activation-header {
            padding:
              21px 16px 17px;
          }

          .activation-body,
          .payment-body {
            padding: 17px;
          }

          .fee-value {
            font-size: 20px;
          }

          .benefits-list {
            grid-template-columns:
              1fr;
          }

          .button-row,
          .payment-buttons {
            grid-template-columns:
              1fr;
          }

          .account-number-button {
            font-size: 23px;
          }

          .steps {
            padding:
              12px 14px;
          }

        }

      `}</style>

      <div className="activation-shell">
        <div className="activation-container">
          <div className="activation-card">

            {/* =================================================
                HEADER
            ================================================== */}

            <header className="activation-header">

              <div className="activation-badge">
                <LockIcon size={13} />
                Secure account activation
              </div>

              <h1>
                Activate Your Wallet
              </h1>

              <p>
                Complete the activation process to restore
                access to restricted wallet features and
                continue using ElitePay.
              </p>

              <div className="fee-card">
                <div>
                  <span className="fee-label">
                    Activation fee
                  </span>

                  <span className="fee-value">
                    ₦
                    {ACTIVATION_FEE.toLocaleString()}
                  </span>
                </div>

                <span className="fee-chip">
                  One-time payment
                </span>
              </div>

            </header>

            {/* =================================================
                STEPS
            ================================================== */}

            <div className="steps">

              <div
                className={`step ${
                  step === 1
                    ? "active"
                    : ""
                }`}
              >
                <span className="step-number">
                  {step > 1 ? (
                    <CheckIcon size={13} />
                  ) : (
                    "1"
                  )}
                </span>

                <span>
                  Account details
                </span>
              </div>

              <div
                className={`step ${
                  step === 2
                    ? "active"
                    : ""
                }`}
              >
                <span className="step-number">
                  2
                </span>

                <span>
                  Make payment
                </span>
              </div>

            </div>

            {/* =================================================
                STEP 1
            ================================================== */}

            {step === 1 && (
              <div className="activation-body">

                <h2 className="form-title">
                  Activation Request
                </h2>

                <p className="form-description">
                  Enter and confirm your details below.
                  Your selected reason will be attached
                  to the activation request.
                </p>

                <form
                  onSubmit={handleProceed}
                >

                  {/* FULL NAME */}

                  <div className="form-group">

                    <label
                      className="form-label"
                      htmlFor="fullName"
                    >
                      Full Name
                    </label>

                    <div className="input-wrap">
                      <input
                        id="fullName"
                        type="text"
                        value={fullName}
                        onChange={
                          handleNameChange
                        }
                        placeholder="Enter your full name"
                        className={
                          errors.fullName
                            ? "input-error"
                            : ""
                        }
                      />
                    </div>

                    {errors.fullName && (
                      <span className="form-error">
                        {errors.fullName}
                      </span>
                    )}

                  </div>

                  {/* PHONE */}

                  <div className="form-group">

                    <label
                      className="form-label"
                      htmlFor="phone"
                    >
                      Phone Number
                    </label>

                    <div className="input-wrap">
                      <input
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={
                          handlePhoneChange
                        }
                        placeholder="08012345678"
                        inputMode="numeric"
                        maxLength={11}
                        className={
                          errors.phone
                            ? "input-error"
                            : ""
                        }
                      />
                    </div>

                    {errors.phone && (
                      <span className="form-error">
                        {errors.phone}
                      </span>
                    )}

                  </div>

                  {/* REASON */}

                  <div className="form-group">

                    <label
                      className="form-label"
                      htmlFor="reason"
                    >
                      Reason for Activation
                    </label>

                    <div className="input-wrap">
                      <select
                        id="reason"
                        value={reason}
                        onChange={(event) => {
                          setReason(
                            event.target.value
                          );

                          if (
                            errors.reason
                          ) {
                            setErrors(
                              (prev) => ({
                                ...prev,
                                reason: null,
                              })
                            );
                          }
                        }}
                        className={
                          errors.reason
                            ? "input-error"
                            : ""
                        }
                      >
                        {ACTIVATION_REASONS.map(
                          (item) => (
                            <option
                              key={
                                item.value
                              }
                              value={
                                item.value
                              }
                            >
                              {item.label}
                            </option>
                          )
                        )}
                      </select>
                    </div>

                    {errors.reason && (
                      <span className="form-error">
                        {errors.reason}
                      </span>
                    )}

                    <div className="reason-preview">
                      <span className="reason-icon">
                        <AlertIcon size={14} />
                      </span>

                      <span>
                        Activation reason:{" "}
                        <strong>
                          {getReasonLabel()}
                        </strong>
                      </span>
                    </div>

                  </div>

                  {/* BENEFITS */}

                  <div className="benefits-box">

                    <div className="benefits-title">
                      After successful activation
                    </div>

                    <div className="benefits-list">

                      <div className="benefit">
                        <span className="benefit-check">
                          <CheckIcon size={12} />
                        </span>
                        Restore restricted wallet access
                      </div>

                      <div className="benefit">
                        <span className="benefit-check">
                          <CheckIcon size={12} />
                        </span>
                        Continue withdrawal activities
                      </div>

                      <div className="benefit">
                        <span className="benefit-check">
                          <CheckIcon size={12} />
                        </span>
                        Continue using wallet features
                      </div>

                      <div className="benefit">
                        <span className="benefit-check">
                          <CheckIcon size={12} />
                        </span>
                        Maintain your wallet history
                      </div>

                    </div>

                  </div>

                  {/* BUTTONS */}

                  <div className="button-row">

                    <button
                      type="button"
                      className="cancel-button"
                      onClick={() =>
                        router.push(
                          "/dashboard"
                        )
                      }
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      className="proceed-button"
                    >
                      Continue to Payment
                    </button>

                  </div>

                </form>

              </div>
            )}

            {/* =================================================
                STEP 2 — PAYMENT DETAILS
            ================================================== */}

            {step === 2 && (
              <div className="payment-body">

                <div className="payment-top">

                  <div className="payment-top-icon">
                    <LockIcon size={24} />
                  </div>

                  <h2>
                    Make Activation Payment
                  </h2>

                  <p>
                    Transfer exactly the activation fee
                    to the account below. After payment,
                    click “I have made payment”.
                  </p>

                </div>

                {/* CUSTOMER SUMMARY */}

                <div className="customer-summary">

                  <div className="summary-title">
                    Activation details
                  </div>

                  <div className="summary-row">
                    <span>
                      Full name
                    </span>

                    <span className="summary-value">
                      {fullName}
                    </span>
                  </div>

                  <div className="summary-row">
                    <span>
                      Phone
                    </span>

                    <span className="summary-value">
                      {phone}
                    </span>
                  </div>

                  <div className="summary-row">
                    <span>
                      Reason
                    </span>

                    <span className="summary-value">
                      {getReasonLabel()}
                    </span>
                  </div>

                  <div className="summary-row">
                    <span>
                      Activation fee
                    </span>

                    <span className="summary-value">
                      ₦
                      {ACTIVATION_FEE.toLocaleString()}
                    </span>
                  </div>

                </div>

                {/* INSTRUCTION */}

                <div className="payment-instruction">
                  Transfer exactly{" "}
                  <strong>
                    ₦
                    {ACTIVATION_FEE.toLocaleString()}
                  </strong>{" "}
                  to the account below.
                </div>

                {/* ACCOUNT CARD */}

                <div className="account-card">

                  <div className="account-main">

                    <div className="bank-row">

                      <MoniepointMark />

                      <div className="bank-meta">

                        <span className="bank-label">
                          Bank name
                        </span>

                        <div className="bank-name">
                          {BANK_NAME}
                        </div>

                      </div>

                    </div>

                    <div className="account-number-box">

                      <div className="account-number-label">
                        Account number
                      </div>

                      <button
                        type="button"
                        className="account-number-button"
                        onClick={() =>
                          copyText(
                            "account number",
                            ACCOUNT_NUMBER
                          )
                        }
                      >
                        {ACCOUNT_NUMBER}
                        <CopyIcon size={18} />
                      </button>

                    </div>

                    <div className="account-name">
                      {ACCOUNT_NAME}
                    </div>

                    <div className="copied">
                      {copied
                        ? `${copied} copied`
                        : ""}
                    </div>

                  </div>

                  <div className="account-warning">
                    <span className="warning-icon">
                      !
                    </span>

                    <span>
                      Transfer only the exact activation
                      amount and keep your payment receipt.
                    </span>
                  </div>

                </div>

                {/* TIMER */}

                <div className="timer-card">

                  <div className="timer-top">
                    <span>
                      Payment window
                    </span>

                    <span className="timer-value">
                      {minutes}:{seconds}
                    </span>
                  </div>

                  <div className="progress">
                    <div
                      className="progress-bar"
                      style={{
                        width: `${progress}%`,
                        background:
                          countdown <=
                          60
                            ? "#ef4444"
                            : "#13845d",
                      }}
                    />
                  </div>

                </div>

                {/* NOTE */}

                <div className="payment-note">
                  <LockIcon
                    size={14}
                  />

                  <span>
                    Your activation request has been saved.
                    Payment verification should be completed
                    before your account is marked as activated.
                  </span>
                </div>

                {/* BUTTONS */}

                <div className="payment-buttons">

                  <button
                    type="button"
                    className="back-payment"
                    disabled={processing}
                    onClick={() =>
                      setStep(1)
                    }
                  >
                    Edit Details
                  </button>

                  <button
                    type="button"
                    className="confirm-payment"
                    disabled={
                      processing ||
                      countdown === 0
                    }
                    onClick={
                      handlePaymentConfirmation
                    }
                  >
                    {processing ? (
                      <>
                        <Spinner />
                        Submitting...
                      </>
                    ) : (
                      "I Have Made Payment"
                    )}
                  </button>

                </div>

              </div>
            )}

          </div>
        </div>
      </div>
    </Layout>
  );
}
