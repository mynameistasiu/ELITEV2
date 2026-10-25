// pages/buy-code.js

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import Layout from "../components/Layout";
import { loadUser, saveTx } from "../utils/storage";

const CODE_PRICE = 7000;
const VAT_CHARGE = 150;
const GRAND_TOTAL = CODE_PRICE + VAT_CHARGE;

// WhatsApp support number.
// Keep it clean: country code + number, without +, spaces or hidden characters.
const WA_NUMBER = "2347039425245";

function LockIcon({ size = 24 }) {
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
        rx="2.5"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M8 10V7a4 4 0 0 1 8 0v3"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />

      <circle
        cx="12"
        cy="15"
        r="1.2"
        fill="currentColor"
      />
    </svg>
  );
}

function CreditCardIcon({ size = 30 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="3"
        y="5"
        width="18"
        height="14"
        rx="3"
        stroke="currentColor"
        strokeWidth="1.6"
      />

      <path
        d="M3 10h18"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />

      <path
        d="M7 15h4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SupportIcon({ size = 19 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M20 11.5a8 8 0 0 1-8 8H7l-3 2v-5.2a8 8 0 1 1 16-4.8Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />

      <path
        d="M8 12h.01M12 12h.01M16 12h.01"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ArrowIcon({ size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M5 12h13"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />

      <path
        d="m13 6 6 6-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ReceiptIcon({ size = 22 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />

      <path
        d="M9 8h6M9 12h6M9 16h4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
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

export default function BuyCode() {
  const router = useRouter();

  const [phone, setPhone] = useState("");
  const [confirmName, setConfirmName] = useState("");
  const [user, setUser] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [processing, setProcessing] = useState(false);

  const modalRef = useRef(null);
  const nameInputRef = useRef(null);
  const buyButtonRef = useRef(null);

  /*
   * Load logged-in user
   */
  useEffect(() => {
    const savedUser = loadUser();

    if (!savedUser) {
      router.push("/login");
      return;
    }

    setUser(savedUser);
    setConfirmName(savedUser.fullName || "");
    setPhone(savedUser.phone || "");
  }, [router]);

  /*
   * Normalize Nigerian phone numbers
   */
  const normalizePhone = (value) => {
    let normalized = String(value || "").replace(
      /\s+/g,
      ""
    );

    if (normalized.startsWith("+234")) {
      normalized =
        "0" + normalized.slice(4);
    }

    return normalized
      .replace(/[^0-9]/g, "")
      .slice(0, 11);
  };

  /*
   * Open confirmation modal
   */
  const handleBuyClick = (event) => {
    event.preventDefault();

    buyButtonRef.current =
      event.currentTarget;

    setShowModal(true);
  };

  /*
   * Modal focus + keyboard control
   */
  useEffect(() => {
    if (!showModal) {
      if (buyButtonRef.current) {
        buyButtonRef.current.focus();
      }

      return;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    const focusTimer = setTimeout(() => {
      if (nameInputRef.current) {
        nameInputRef.current.focus();
      }
    }, 80);

    const handleKeyDown = (event) => {
      if (
        event.key === "Escape" &&
        !processing
      ) {
        setShowModal(false);
        return;
      }

      if (event.key !== "Tab") return;

      const modal = modalRef.current;

      if (!modal) return;

      const focusable =
        modal.querySelectorAll(
          'button:not([disabled]), input:not([disabled]), a[href]'
        );

      if (!focusable.length) return;

      const first =
        focusable[0];

      const last =
        focusable[focusable.length - 1];

      if (
        event.shiftKey &&
        document.activeElement === first
      ) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        document.activeElement === last
      ) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      clearTimeout(focusTimer);

      document.removeEventListener(
        "keydown",
        handleKeyDown
      );

      document.body.style.overflow =
        previousOverflow;
    };
  }, [showModal, processing]);

  /*
   * WhatsApp support only.
   * Payment is NOT handled through WhatsApp.
   */
  const openWhatsAppSupport = () => {
    const message =
      `Hello ElitePay Support, I need assistance with my withdrawal code purchase.\n\n` +
      `Name: ${
        confirmName || "Not provided"
      }\n` +
      `Phone: ${
        phone || "Not provided"
      }\n` +
      `Amount: NGN ${GRAND_TOTAL.toLocaleString()}`;

    const whatsappUrl =
      `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(
        message
      )}`;

    window.open(
      whatsappUrl,
      "_blank",
      "noopener,noreferrer"
    );
  };

  /*
   * ---------------------------------------------------------
   * PROCEED TO OUR CHECKOUT PAGE
   * ---------------------------------------------------------
   */
  const openPaymentInstructions = () => {
    const nameToUse = (
      confirmName ||
      user?.fullName ||
      ""
    ).trim();

    const phoneToUse =
      normalizePhone(
        phone ||
          user?.phone ||
          ""
      );

    if (!nameToUse) {
      alert(
        "Your account name was not found. Please update your profile first."
      );
      return;
    }

    if (!phoneToUse) {
      alert(
        "Your account phone number was not found. Please update your profile first."
      );
      return;
    }

    setProcessing(true);

    /*
     * Save pending transaction using
     * the actual GRAND TOTAL.
     */
    try {
      saveTx({
        type: "buy_code",
        amount: GRAND_TOTAL,
        status: "pending",

        meta: {
          product:
            "Withdrawal Activation Code",

          subtotal: CODE_PRICE,

          vat: VAT_CHARGE,

          grand_total: GRAND_TOTAL,

          gateway: "manual_bank_transfer",

          payment_method: "bank_transfer",

          customer_name:
            nameToUse,

          customer_phone:
            phoneToUse,

          checkout_path:
            "/checkout",
        },

        created_at:
          new Date().toISOString(),
      });
    } catch (error) {
      console.error(
        "Could not save pending transaction:",
        error
      );
    }

    /*
     * Send customer to the transfer instructions page.
     */
    const checkoutUrl =
      `/checkout?name=${encodeURIComponent(
        nameToUse
      )}` +
      `&phone=${encodeURIComponent(
        phoneToUse
      )}` +
      `&amount=${GRAND_TOTAL}` +
      `&subtotal=${CODE_PRICE}` +
      `&vat=${VAT_CHARGE}`;

    setTimeout(() => {
      router.push(
        checkoutUrl
      );
    }, 500);
  };

  return (
    <Layout title="Buy Withdrawal Code - ElitePay">

      <div className="buy-code-shell">

        <div className="buy-code-container">

          {/* =================================================
              HERO
          ================================================== */}

          <motion.section
            className="hero-section"
            initial={{
              opacity: 0,
              y: 14,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.45,
            }}
          >

            <h1>
              Buy withdrawal code
            </h1>

            <p className="hero-description">
              Review the price, then follow the bank transfer instructions.
            </p>

          </motion.section>

          {/* =================================================
              PAYMENT CARD
          ================================================== */}

          <motion.section
            className="payment-card"
            initial={{
              opacity: 0,
              y: 18,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.1,
              duration: 0.45,
            }}
          >

            <div className="payment-card-top">

              <div className="payment-method-icon">
                <CreditCardIcon size={30} />
              </div>

              <div className="payment-method-info">

                <span className="payment-method-label">
                  PAYMENT METHOD
                </span>

                <h2>
                  Bank transfer
                </h2>

                <p>
                  Manual payment instructions with receipt confirmation.
                </p>

              </div>

              <span className="recommended-pill">Manual review</span>

            </div>

            <div className="payment-divider" />

            {/* =================================================
                PAYMENT SUMMARY
            ================================================== */}

            <div className="payment-summary">

              <div className="summary-title">
                <ReceiptIcon size={17} />

                <span>
                  Payment Summary
                </span>
              </div>

              <div className="summary-row">

                <span>
                  Product
                </span>

                <strong>
                  Withdrawal Activation Code
                </strong>

              </div>

              <div className="summary-row">

                <span>
                  Subtotal
                </span>

                <strong>
                  ₦{CODE_PRICE.toLocaleString(
                    "en-NG",
                    {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }
                  )}
                </strong>

              </div>

              <div className="summary-row vat-row">

                <span>
                  VAT Charges
                </span>

                <strong>
                  ₦{VAT_CHARGE.toLocaleString(
                    "en-NG",
                    {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }
                  )}
                </strong>

              </div>

              <div className="summary-divider" />

              <div className="grand-total-row">

                <div>
                  <span>
                    Grand Total
                  </span>

                  <small>
                    Amount to pay
                  </small>
                </div>

                <strong>
                  ₦{GRAND_TOTAL.toLocaleString(
                    "en-NG",
                    {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }
                  )}
                </strong>

              </div>

            </div>

            {/* =================================================
                MAIN BUTTON
            ================================================== */}

            <button
              className="primary-payment-button"
              onClick={
                handleBuyClick
              }
              type="button"
            >

              <span>
                Continue to payment instructions
              </span>

              <ArrowIcon />

            </button>

            <div className="secure-payment-note">

              <ReceiptIcon size={14} />

              <span>
                No online payment gateway is connected. Follow transfer instructions and submit your receipt for review.
              </span>

            </div>

          </motion.section>

          {/* =================================================
              SUPPORT
          ================================================== */}

          <motion.section
            className="support-card"
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            transition={{
              delay: 0.22,
            }}
          >

            <div className="support-icon">
              <SupportIcon />
            </div>

            <div className="support-content">

              <h3>
                Need help with your payment?
              </h3>

              <p>
                Contact support if you need help with the transfer or receipt.
              </p>

            </div>

            <button
              className="support-button"
              onClick={
                openWhatsAppSupport
              }
              type="button"
            >
              Contact Support
            </button>

          </motion.section>

          {/* =================================================
              CONFIRMATION MODAL
          ================================================== */}

          <AnimatePresence>

            {showModal && (

              <motion.div
                className="overlay"
                initial={{
                  opacity: 0,
                }}
                animate={{
                  opacity: 1,
                }}
                exit={{
                  opacity: 0,
                }}
                onClick={() => {
                  if (!processing) {
                    setShowModal(
                      false
                    );
                  }
                }}
              >

                <motion.div
                  className="modal"
                  ref={modalRef}
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="confirm-title"

                  initial={{
                    opacity: 0,
                    y: 25,
                    scale: 0.96,
                  }}

                  animate={{
                    opacity: 1,
                    y: 0,
                    scale: 1,
                  }}

                  exit={{
                    opacity: 0,
                    y: 15,
                    scale: 0.97,
                  }}

                  transition={{
                    type: "spring",
                    stiffness: 340,
                    damping: 27,
                  }}

                  onClick={(event) =>
                    event.stopPropagation()
                  }
                >

                  <div className="modal-icon">
                    <CreditCardIcon
                      size={25}
                    />
                  </div>

                  <div className="modal-header">

                    <h3 id="confirm-title">
                      Confirm Your Details
                    </h3>

                    <p>
                      Check your contact details and total before continuing.
                    </p>

                  </div>

                  {/* =================================================
                      CUSTOMER DETAILS
                  ================================================== */}

                  <div className="customer-details">

                    <div className="detail-heading">
                      CUSTOMER INFORMATION
                    </div>

                    <div className="detail-row">

                      <span>
                        Full name
                      </span>

                      <strong>
                        {confirmName ||
                          "Not provided"}
                      </strong>

                    </div>

                    <div className="detail-row">

                      <span>
                        Phone number
                      </span>

                      <strong>
                        {phone ||
                          "Not provided"}
                      </strong>

                    </div>

                    <div className="detail-row">

                      <span>
                        Purchase
                      </span>

                      <strong>
                        Withdrawal Code
                      </strong>

                    </div>

                  </div>

                  {/* =================================================
                      PAYMENT BREAKDOWN
                  ================================================== */}

                  <div className="modal-payment-summary">

                    <div className="modal-summary-heading">

                      <span>
                        PAYMENT SUMMARY
                      </span>

                      <span className="secure-mini">Bank transfer</span>

                    </div>

                    <div className="modal-summary-row">

                      <span>
                        Subtotal
                      </span>

                      <strong>
                        ₦{CODE_PRICE.toLocaleString(
                          "en-NG",
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }
                        )}
                      </strong>

                    </div>

                    <div className="modal-summary-row">

                      <span>
                        VAT Charges
                      </span>

                      <strong>
                        ₦{VAT_CHARGE.toLocaleString(
                          "en-NG",
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }
                        )}
                      </strong>

                    </div>

                    <div className="modal-summary-divider" />

                    <div className="modal-grand-total">

                      <div>

                        <span>
                          Grand Total
                        </span>

                        <small>
                          Total amount to pay
                        </small>

                      </div>

                      <strong>
                        ₦{GRAND_TOTAL.toLocaleString(
                          "en-NG",
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }
                        )}
                      </strong>

                    </div>

                  </div>

                  {/* =================================================
                      NAME
                  ================================================== */}

                  <div className="form-field">

                    <label htmlFor="confirm-name">
                      Full Name
                    </label>

                    <input
                      id="confirm-name"
                      ref={nameInputRef}
                      value={confirmName}
                      onChange={(event) =>
                        setConfirmName(
                          event.target.value
                        )
                      }
                      disabled={
                        processing
                      }
                      placeholder="Enter your full name"
                      autoComplete="name"
                    />

                  </div>

                  {/* =================================================
                      PHONE
                  ================================================== */}

                  <div className="form-field">

                    <label htmlFor="confirm-phone">
                      Phone Number
                    </label>

                    <input
                      id="confirm-phone"
                      value={phone}
                      onChange={(event) =>
                        setPhone(
                          event.target.value
                        )
                      }
                      disabled={
                        processing
                      }
                      placeholder="Enter your phone number"
                      inputMode="tel"
                      autoComplete="tel"
                    />

                  </div>

                  {/* =================================================
                      SECURITY NOTE
                  ================================================== */}

                  <div className="modal-security">

                    <LockIcon size={15} />

                    <span>
                      Review the final amount carefully.
                      The amount to pay is{" "}
                      <strong>
                        ₦{GRAND_TOTAL.toLocaleString(
                          "en-NG",
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }
                        )}
                      </strong>
                      .
                    </span>

                  </div>

                  {/* =================================================
                      ACTION BUTTONS
                  ================================================== */}

                  <div className="modal-actions">

                    <button
                      className="continue-button"
                      onClick={openPaymentInstructions}
                      disabled={
                        !confirmName.trim() ||
                        !phone.trim() ||
                        processing
                      }
                      type="button"
                    >

                      {processing ? (

                        <span className="button-loading">

                          <Spinner />

                          Preparing checkout...

                        </span>

                      ) : (

                        <>
                          <span>
                            View payment instructions
                          </span>

                          <ArrowIcon />
                        </>

                      )}

                    </button>

                    <button
                      className="cancel-button"
                      onClick={() =>
                        setShowModal(
                          false
                        )
                      }
                      disabled={
                        processing
                      }
                      type="button"
                    >
                      Go Back
                    </button>

                  </div>

                  <div className="gateway-note">
                    This continues to bank transfer instructions; payment is not automatically verified.
                  </div>

                </motion.div>

              </motion.div>

            )}

          </AnimatePresence>

        </div>

      </div>

      <style jsx>{`

        /* =====================================================
           PAGE
        ====================================================== */

        .buy-code-shell {
          min-height: calc(100vh - 160px);
          padding: 20px 16px 34px;
          background: #f6f9f7;
        }

        .buy-code-container {
          width:
            min(
              620px,
              100%
            );

          margin:
            0 auto;
        }

        /* =====================================================
           HERO
        ====================================================== */

        .hero-section {
          text-align:
            center;

          margin-bottom: 14px;
        }

        .secure-badge {
          width:
            fit-content;

          margin:
            0 auto 14px;

          display:
            inline-flex;

          align-items:
            center;

          gap:
            6px;

          padding:
            7px 11px;

          border-radius:
            999px;

          background:
            #f1f7f3;

          border:
            1px solid #deeee3;

          color:
            #308b78;

          font-size:
            10px;

          font-weight:
            950;

          letter-spacing:
            0.08em;
        }

        .hero-section h1 {
          margin:
            0;

          color:
            #172b24;

          font-size:
            clamp(
              28px,
              5vw,
              38px
            );

          line-height:
            1.08;

          font-weight:
            950;

          letter-spacing:
            -0.04em;
        }

        .hero-description {
          max-width: 460px;
          margin: 7px auto 0;

          color:
            #687a72;

          font-size: 13px;

          line-height:
            1.65;
        }

        .hero-price {
          width:
            min(
              460px,
              100%
            );

          margin:
            20px auto 0;

          padding:
            16px 18px;

          display:
            flex;

          align-items:
            center;

          justify-content:
            space-between;

          gap:
            15px;

          text-align:
            left;

          border-radius:
            15px;

          background:
            #ffffff;

          border:
            1px solid #e3ebe6;

          box-shadow:
            0 12px 35px
              rgba(
                15,
                23,
                42,
                0.06
              );
        }

        .price-caption {
          display:
            block;

          color:
            #84948b;

          font-size:
            10px;

          font-weight:
            900;

          text-transform:
            uppercase;

          letter-spacing:
            0.08em;

          margin-bottom:
            3px;
        }

        .price-value {
          display:
            block;

          color:
            #172b24;

          font-size:
            24px;

          font-weight:
            950;
        }

        .price-chip {
          padding:
            7px 10px;

          border-radius:
            999px;

          background:
            #ecfdf5;

          border:
            1px solid #bbf7d0;

          color:
            #15803d;

          font-size:
            10px;

          font-weight:
            900;

          white-space:
            nowrap;
        }

        /* =====================================================
           PAYMENT CARD
        ====================================================== */

        .payment-card {
          overflow:
            hidden;

          background:
            #ffffff;

          border:
            1px solid #e3ebe6;

          border-radius: 16px;
          box-shadow: 0 10px 30px rgba(15, 40, 26, 0.07);
        }

        .payment-card-top {
          display:
            flex;

          align-items:
            center;

          gap:
            14px;

          padding: 17px 18px;
        }

        .payment-method-icon {
          width:
            52px;

          height:
            52px;

          display:
            grid;

          place-items:
            center;

          flex-shrink:
            0;

          border-radius:
            14px;

          background:
            #f1f7f3;

          border:
            1px solid #deeee3;

          color:
            #308b78;
        }

        .payment-method-info {
          flex:
            1;

          min-width:
            0;
        }

        .payment-method-label {
          display:
            block;

          color:
            #84948b;

          font-size:
            9px;

          font-weight:
            950;

          letter-spacing:
            0.1em;

          margin-bottom:
            3px;
        }

        .payment-method-info h2 {
          margin:
            0;

          color:
            #172b24;

          font-size:
            19px;

          font-weight:
            950;
        }

        .payment-method-info p {
          margin:
            4px 0 0;

          color:
            #687a72;

          font-size:
            12px;

          line-height:
            1.4;
        }

        .recommended-pill {
          flex-shrink:
            0;

          padding:
            6px 8px;

          border-radius:
            999px;

          background:
            #ecfdf5;

          color:
            #15803d;

          border:
            1px solid #bbf7d0;

          font-size:
            9px;

          font-weight:
            950;
        }

        .payment-divider {
          height:
            1px;

          background:
            #eef2f7;
        }

        /* =====================================================
           PAYMENT SUMMARY
        ====================================================== */

        .payment-summary {
          padding:
            14px 18px 12px;
        }

        .summary-title {
          display:
            flex;

          align-items:
            center;

          gap:
            7px;

          margin-bottom:
            8px;

          color:
            #172b24;

          font-size:
            12px;

          font-weight:
            950;
        }

        .summary-title svg {
          color:
            #308b78;
        }

        .summary-row {
          display:
            flex;

          align-items:
            center;

          justify-content:
            space-between;

          gap:
            20px;

          padding:
            9px 0;

          color:
            #687a72;

          font-size:
            12px;
        }

        .summary-row strong {
          color:
            #172b24;

          font-weight:
            850;

          text-align:
            right;
        }

        .vat-row strong {
          color:
            #b45309;
        }

        .summary-divider {
          margin:
            8px 0;

          border-top:
            1px dashed #dbe3ec;
        }

        .grand-total-row {
          display:
            flex;

          align-items:
            center;

          justify-content:
            space-between;

          gap:
            20px;

          padding:
            12px;

          margin-top:
            4px;

          border-radius:
            13px;

          background: #f0f8f2;

          border:
            1px solid #deeee3;
        }

        .grand-total-row span {
          display:
            block;

          color:
            #203b2e;

          font-size:
            13px;

          font-weight:
            950;
        }

        .grand-total-row small {
          display:
            block;

          margin-top:
            2px;

          color:
            #687a72;

          font-size:
            9px;
        }

        .grand-total-row strong {
          color:
            #308b78;

          font-size:
            22px;

          font-weight:
            950;

          white-space:
            nowrap;
        }

        /* =====================================================
           BENEFITS
        ====================================================== */

        .benefits {
          display:
            grid;

          grid-template-columns:
            repeat(
              3,
              1fr
            );

          gap:
            8px;

          padding:
            8px 20px 18px;
        }

        .benefit-item {
          min-height:
            76px;

          display:
            flex;

          flex-direction:
            column;

          align-items:
            center;

          justify-content:
            center;

          gap:
            7px;

          padding:
            10px 7px;

          text-align:
            center;

          background:
            #f7faf8;

          border:
            1px solid #edf2f7;

          border-radius:
            11px;

          color:
            #52645b;

          font-size:
            10px;

          font-weight:
            800;

          line-height:
            1.35;
        }

        .benefit-icon {
          width:
            23px;

          height:
            23px;

          display:
            grid;

          place-items:
            center;

          border-radius:
            50%;

          background:
            #dcfce7;

          color:
            #15803d;
        }

        /* =====================================================
           MAIN PAYMENT BUTTON
        ====================================================== */

        .primary-payment-button {
          width:
            calc(
              100% - 36px
            );

          margin:
            0 18px;

          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          gap:
            10px;

          border:
            0;

          border-radius:
            13px;

          min-height: 50px;
          padding:
            13px 16px;

          background: linear-gradient(135deg, #087449, #159568);

          color:
            #ffffff;

          font-size:
            14px;

          font-weight:
            950;

          cursor:
            pointer;

          box-shadow: 0 8px 18px rgba(8, 116, 73, 0.2);

          transition:
            transform 0.16s ease,
            box-shadow 0.16s ease;
        }

        .primary-payment-button:hover {
          transform:
            translateY(-1px);

          box-shadow: 0 11px 22px rgba(8, 116, 73, 0.26);
        }

        .secure-payment-note {
          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          gap:
            6px;

          padding:
            10px 18px 14px;

          color:
            #84948b;

          font-size:
            10px;

          text-align:
            center;
        }

        /* =====================================================
           SUPPORT
        ====================================================== */

        .support-card {
          margin-top:
            12px;

          padding:
            15px;

          display:
            flex;

          align-items:
            center;

          gap:
            12px;

          background:
            #ffffff;

          border:
            1px solid #e3ebe6;

          border-radius:
            13px;

          box-shadow:
            0 5px 16px rgba(15, 23, 42, 0.04);
        }

        .support-icon {
          width:
            43px;

          height:
            43px;

          flex-shrink:
            0;

          display:
            grid;

          place-items:
            center;

          border-radius:
            12px;

          background:
            #f1f5f9;

          color:
            #52645b;
        }

        .support-content {
          flex:
            1;

          min-width:
            0;
        }

        .support-content h3 {
          margin:
            0;

          color:
            #172b24;

          font-size:
            13px;

          font-weight:
            900;
        }

        .support-content p {
          margin:
            3px 0 0;

          color:
            #84948b;

          font-size:
            10px;

          line-height:
            1.4;
        }

        .support-button {
          flex-shrink:
            0;

          border:
            1px solid #dbe3ec;

          border-radius:
            10px;

          padding:
            9px 11px;

          background:
            #ffffff;

          color:
            #40554a;

          font-size:
            10px;

          font-weight:
            900;

          cursor:
            pointer;
        }

        .footer-note {
          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          gap:
            6px;

          margin-top:
            14px;

          color:
            #84948b;

          font-size:
            9px;

          text-align:
            center;
        }

        /* =====================================================
           MODAL
        ====================================================== */

        .overlay {
          position:
            fixed;

          inset:
            0;

          z-index:
            9999;

          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          padding:
            16px;

          background:
            rgba(
              15,
              23,
              42,
              0.64
            );

          backdrop-filter:
            blur(7px);
        }

        .modal {
          width:
            min(
              440px,
              100%
            );

          max-height:
            92vh;

          overflow-y:
            auto;

          padding:
            21px;

          background:
            #ffffff;

          border-radius:
            19px;

          border:
            1px solid #e3ebe6;

          box-shadow: 0 22px 60px rgba(15, 23, 42, 0.24);
        }

        .modal-icon {
          width:
            50px;

          height:
            50px;

          display:
            grid;

          place-items:
            center;

          margin-bottom:
            12px;

          border-radius:
            14px;

          background:
            #f1f7f3;

          border:
            1px solid #deeee3;

          color:
            #308b78;
        }

        .modal-header h3 {
          margin:
            0;

          color:
            #172b24;

          font-size:
            21px;

          font-weight:
            950;
        }

        .modal-header p {
          margin:
            6px 0 17px;

          color:
            #687a72;

          font-size:
            12px;

          line-height:
            1.5;
        }

        /* =====================================================
           CUSTOMER DETAILS
        ====================================================== */

        .customer-details {
          padding:
            12px;

          margin-bottom:
            12px;

          background:
            #f7faf8;

          border:
            1px solid #e3ebe6;

          border-radius:
            12px;
        }

        .detail-heading {
          color:
            #84948b;

          font-size:
            9px;

          font-weight:
            950;

          letter-spacing:
            0.08em;

          margin-bottom:
            8px;
        }

        .detail-row {
          display:
            flex;

          align-items:
            center;

          justify-content:
            space-between;

          gap:
            15px;

          padding:
            8px 0;

          border-bottom:
            1px dashed #e3ebe6;

          font-size:
            11px;
        }

        .detail-row:last-child {
          border-bottom:
            0;

          padding-bottom:
            0;
        }

        .detail-row:first-of-type {
          padding-top:
            0;
        }

        .detail-row span {
          color:
            #687a72;

          font-weight:
            700;
        }

        .detail-row strong {
          color:
            #172b24;

          text-align:
            right;

          font-weight:
            900;
        }

        /* =====================================================
           MODAL PAYMENT SUMMARY
        ====================================================== */

        .modal-payment-summary {
          padding:
            13px;

          margin-bottom:
            15px;

          border-radius:
            14px;

          background:
            linear-gradient(
              135deg,
              #f8fbff,
              #ffffff
            );

          border:
            1px solid #deeee3;
        }

        .modal-summary-heading {
          display:
            flex;

          align-items:
            center;

          justify-content:
            space-between;

          gap:
            10px;

          margin-bottom:
            7px;

          color:
            #1e3a5f;

          font-size:
            10px;

          font-weight:
            950;

          letter-spacing:
            0.07em;
        }

        .secure-mini {
          display:
            inline-flex;

          align-items:
            center;

          gap:
            4px;

          color:
            #15803d;

          font-size:
            9px;

          letter-spacing:
            0;
        }

        .modal-summary-row {
          display:
            flex;

          justify-content:
            space-between;

          gap:
            15px;

          padding:
            7px 0;

          color:
            #687a72;

          font-size:
            11px;
        }

        .modal-summary-row strong {
          color:
            #172b24;

          font-weight:
            900;
        }

        .modal-summary-divider {
          border-top:
            1px dashed #cbd5e1;

          margin:
            6px 0;
        }

        .modal-grand-total {
          display:
            flex;

          align-items:
            center;

          justify-content:
            space-between;

          gap:
            15px;

          padding-top:
            7px;
        }

        .modal-grand-total span {
          display:
            block;

          color:
            #172b24;

          font-size:
            12px;

          font-weight:
            950;
        }

        .modal-grand-total small {
          display:
            block;

          margin-top:
            2px;

          color:
            #84948b;

          font-size:
            8px;
        }

        .modal-grand-total strong {
          color:
            #308b78;

          font-size:
            21px;

          font-weight:
            950;

          white-space:
            nowrap;
        }

        /* =====================================================
           FORM
        ====================================================== */

        .form-field {
          margin-bottom:
            13px;
        }

        .form-field label {
          display:
            block;

          margin-bottom:
            6px;

          color:
            #40554a;

          font-size:
            11px;

          font-weight:
            900;
        }

        .form-field input {
          width:
            100%;

          box-sizing:
            border-box;

          border:
            1px solid #cbd5e1;

          border-radius:
            10px;

          background:
            #ffffff;

          color:
            #172b24;

          padding:
            11px 12px;

          outline:
            none;

          font-size:
            12px;
        }

        .form-field input:focus {
          border-color:
            #308b78;

          box-shadow:
            0 0 0 3px
              rgba(
                37,
                99,
                235,
                0.1
              );
        }

        .form-field input:disabled {
          background:
            #f7faf8;

          color:
            #84948b;
        }

        /* =====================================================
           MODAL SECURITY
        ====================================================== */

        .modal-security {
          display:
            flex;

          align-items:
            flex-start;

          gap:
            7px;

          margin:
            5px 0 15px;

          padding:
            10px;

          border-radius:
            9px;

          background:
            #f7faf8;

          color:
            #687a72;

          font-size:
            10px;

          line-height:
            1.45;
        }

        .modal-security strong {
          color:
            #172b24;

          font-weight:
            950;
        }

        /* =====================================================
           BUTTONS
        ====================================================== */

        .modal-actions {
          display:
            grid;

          gap:
            8px;
        }

        .continue-button {
          width:
            100%;

          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          gap:
            9px;

          border:
            0;

          border-radius:
            12px;

          padding:
            14px 16px;

          background:
            linear-gradient(
              135deg,
              #308b78,
              #1d4ed8
            );

          color:
            #ffffff;

          font-size:
            13px;

          font-weight:
            950;

          cursor:
            pointer;

          box-shadow:
            0 14px 28px
              rgba(
                37,
                99,
                235,
                0.2
              );
        }

        .continue-button:disabled {
          opacity:
            0.62;

          cursor:
            not-allowed;
        }

        .cancel-button {
          width:
            100%;

          border:
            1px solid #e3ebe6;

          border-radius:
            12px;

          padding:
            12px 16px;

          background:
            #ffffff;

          color:
            #52645b;

          font-size:
            12px;

          font-weight:
            900;

          cursor:
            pointer;
        }

        .cancel-button:disabled {
          opacity:
            0.5;

          cursor:
            not-allowed;
        }

        .button-loading {
          display:
            inline-flex;

          align-items:
            center;

          justify-content:
            center;

          gap:
            8px;
        }

        .spinner {
          width:
            16px;

          height:
            16px;

          display:
            inline-block;

          border:
            2px solid
              rgba(
                255,
                255,
                255,
                0.35
              );

          border-top-color:
            #ffffff;

          border-radius:
            50%;

          animation:
            spin 0.75s
            linear infinite;
        }

        .gateway-note {
          margin-top:
            11px;

          color:
            #84948b;

          font-size:
            9px;

          text-align:
            center;
        }

        @keyframes spin {
          to {
            transform:
              rotate(360deg);
          }
        }

        /* =====================================================
           MOBILE
        ====================================================== */

        @media (max-width: 600px) {

          .buy-code-shell {
            padding:
              20px 10px 35px;
          }

          .hero-description {
            font-size:
              13px;
          }

          .hero-price {
            padding:
              14px;
          }

          .payment-card-top {
            align-items:
              flex-start;
          }

          .payment-method-info p {
            font-size: 11px;
          }

          .support-card {
            align-items:
              flex-start;

            flex-wrap:
              wrap;
          }

          .support-content {
            min-width:
              calc(
                100% - 60px
              );
          }

          .support-button {
            width:
              100%;

            margin-top:
              2px;
          }

          .summary-row {
            align-items:
              flex-start;
          }

          .summary-row strong {
            max-width:
              55%;
          }

          .detail-row {
            align-items:
              flex-start;
          }

          .detail-row strong {
            max-width:
              58%;

            word-break:
              break-word;
          }

          .modal-grand-total strong {
            font-size:
              19px;
          }
        }

      `}</style>
    </Layout>
  );
}