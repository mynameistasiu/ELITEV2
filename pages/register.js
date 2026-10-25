import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Layout from "../components/Layout";

import {
  saveUser,
  saveBalance,
  saveTx,
  loadUser,
} from "../utils/storage";

export default function Register() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [accept, setAccept] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(
    "Creating your account..."
  );

  const [errors, setErrors] = useState({});
  const [created, setCreated] = useState(false);

  // Redirect users who already have an account.
  useEffect(() => {
    if (loadUser()) {
      router.replace("/dashboard");
    }
  }, [router]);

  const clearError = (field) => {
    setErrors((previous) => ({
      ...previous,
      [field]: "",
    }));
  };

  // Validate the registration form.
  const validateForm = () => {
    const nextErrors = {};

    if (!name.trim() || name.trim().length < 2) {
      nextErrors.name = "Please enter your full name.";
    }

    if (!phone) {
      nextErrors.phone = "Your phone number is required.";
    } else if (!/^\d{11}$/.test(phone)) {
      nextErrors.phone =
        "Enter a valid 11-digit Nigerian phone number.";
    }

    if (!password) {
      nextErrors.password = "Please create a password.";
    } else if (password.length < 8) {
      nextErrors.password =
        "Your password must contain at least 8 characters.";
    }

    if (!confirmPassword) {
      nextErrors.confirmPassword =
        "Please confirm your password.";
    } else if (password !== confirmPassword) {
      nextErrors.confirmPassword =
        "Your passwords do not match.";
    }

    if (!accept) {
      nextErrors.accept =
        "Please accept the Terms and Privacy Policy.";
    }

    setErrors(nextErrors);

    const firstInvalid = Object.keys(nextErrors)[0];

    if (firstInvalid) {
      const fieldIds = {
        name: "register-name",
        phone: "register-phone",
        password: "register-password",
        confirmPassword: "confirm-password",
        accept: "accept-terms",
      };

      window.requestAnimationFrame(() => {
        const field = document.getElementById(
          fieldIds[firstInvalid]
        );

        field?.focus();
        field?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      });

      return false;
    }

    return true;
  };

  // Create an account using the existing storage system.
  const createAccount = async (event) => {
    event.preventDefault();

    if (loading) return;
    if (!validateForm()) return;

    setLoading(true);
    setErrors({});

    try {
      setLoadingMessage("Creating your ElitePay account...");

      await new Promise((resolve) =>
        setTimeout(resolve, 350)
      );

      setLoadingMessage("Setting up your wallet...");

      await new Promise((resolve) =>
        setTimeout(resolve, 350)
      );

      const user = {
        fullName: name.trim(),
        phone,
        password,
        plan: "Pulse Miner",
        kyc: {},
        kycCompleted: false,

        // The required identity and bank details are collected in the KYC step.
        withdrawalAccounts: [],
        defaultWithdrawalAccountId: "",

        created_at: new Date().toISOString(),

        preferences: {
          notifications: true,
          transactionAlerts: true,
        },
      };

      saveUser(user);
      saveBalance(0);
      saveTx([]);

      setLoading(false);
      setCreated(true);

      // Open the dashboard after showing confirmation.
      window.setTimeout(() => {
        router.replace("/profile?kyc=required");
      }, 1600);
    } catch (error) {
      console.error("Account creation failed:", error);

      setLoading(false);

      setErrors({
        form:
          "We could not create your account. Please try again.",
      });
    }
  };

  return (
    <Layout
      title={
        created
          ? "Welcome to ElitePay"
          : "Create Your ElitePay Account"
      }
    >
      <main className="register-page">
        {/* SIMPLE BRAND HEADER */}
        <header className="register-header">
          <button
            type="button"
            className="brand"
            onClick={() => router.push("/")}
            aria-label="Go to ElitePay homepage"
          >
            <span className="brand-icon">E</span>

            <span className="brand-name">
              Elite<span>Pay</span>
            </span>
          </button>

          <span className="header-note">
            Simple digital wallet
          </span>
        </header>

        {/* REGISTRATION CARD */}
        <section className="register-card">
          {created ? (
            <div className="success-content">
              <div className="success-icon">✓</div>

              <p className="eyebrow">ACCOUNT CREATED</p>

              <h1>Welcome to ElitePay!</h1>

              <p className="description">
                Your account has been created, {name.trim()}.
                Your wallet is ready for the next step.
              </p>

              <div className="success-note">
                <span>✓</span>
                Your starting wallet balance is ₦0.00.
              </div>

              <button
                type="button"
                className="primary-button"
                onClick={() => router.replace("/profile?kyc=required")}
              >
                Complete my KYC <span>→</span>
              </button>
            </div>
          ) : (
            <>
              {/* FORM HEADING */}
              <div className="form-heading">
                <div className="eyebrow">
                  CREATE YOUR ACCOUNT
                </div>

                <h1>Get started with ElitePay</h1>

                <p className="description">
                  Enter your details to create your account. You will
                  complete your identity and bank details before opening
                  your dashboard.
                </p>
              </div>

              {errors.form && (
                <div className="form-error" role="alert">
                  {errors.form}
                </div>
              )}

              <form onSubmit={createAccount} noValidate>
                {/* FULL NAME */}
                <div className="field">
                  <label htmlFor="register-name">
                    Full name
                  </label>

                  <input
                    id="register-name"
                    type="text"
                    className="form-input"
                    placeholder="Enter your full name"
                    autoComplete="name"
                    value={name}
                    onChange={(event) => {
                      setName(event.target.value);
                      clearError("name");
                    }}
                    disabled={loading}
                    required
                  />

                  {errors.name && (
                    <p className="field-error" role="alert">
                      {errors.name}
                    </p>
                  )}
                </div>

                {/* PHONE NUMBER */}
                <div className="field">
                  <label htmlFor="register-phone">
                    Phone number
                  </label>

                  <div className="phone-input">
                    <span className="phone-prefix">
                      +234
                    </span>

                    <input
                      id="register-phone"
                      type="tel"
                      className="form-input"
                      placeholder="08031234567"
                      inputMode="numeric"
                      autoComplete="tel"
                      maxLength={11}
                      value={phone}
                      onChange={(event) => {
                        const digits =
                          event.target.value
                            .replace(/\D/g, "")
                            .slice(0, 11);

                        setPhone(digits);
                        clearError("phone");
                      }}
                      disabled={loading}
                      required
                    />
                  </div>

                  <p className="field-hint">
                    Enter your 11-digit Nigerian phone number.
                  </p>

                  {errors.phone && (
                    <p className="field-error" role="alert">
                      {errors.phone}
                    </p>
                  )}
                </div>

                {/* PASSWORD */}
                <div className="field">
                  <label htmlFor="register-password">
                    Password
                  </label>

                  <div className="password-wrap">
                    <input
                      id="register-password"
                      type={showPassword ? "text" : "password"}
                      className="form-input"
                      placeholder="Create a password"
                      autoComplete="new-password"
                      value={password}
                      onChange={(event) => {
                        setPassword(event.target.value);
                        clearError("password");
                      }}
                      disabled={loading}
                      required
                    />

                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() =>
                        setShowPassword((value) => !value)
                      }
                      aria-label={
                        showPassword
                          ? "Hide passwords"
                          : "Show passwords"
                      }
                      aria-pressed={showPassword}
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>

                  <p className="field-hint">
                    Use at least 8 characters.
                  </p>

                  {errors.password && (
                    <p className="field-error" role="alert">
                      {errors.password}
                    </p>
                  )}
                </div>

                {/* CONFIRM PASSWORD */}
                <div className="field">
                  <label htmlFor="confirm-password">
                    Confirm password
                  </label>

                  <input
                    id="confirm-password"
                    type={showPassword ? "text" : "password"}
                    className="form-input"
                    placeholder="Enter your password again"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) => {
                      setConfirmPassword(event.target.value);
                      clearError("confirmPassword");
                    }}
                    disabled={loading}
                    required
                  />

                  {errors.confirmPassword && (
                    <p className="field-error" role="alert">
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>

                {/* TERMS */}
                <label className="terms" htmlFor="accept-terms">
                  <input
                    id="accept-terms"
                    type="checkbox"
                    checked={accept}
                    onChange={(event) => {
                      setAccept(event.target.checked);
                      clearError("accept");
                    }}
                    disabled={loading}
                    required
                  />

                  <span>
                    I agree to the ElitePay Terms of Service and
                    Privacy Policy.
                  </span>
                </label>

                {errors.accept && (
                  <p className="field-error" role="alert">
                    {errors.accept}
                  </p>
                )}

                {/* CREATE ACCOUNT */}
                <button
                  type="submit"
                  className="primary-button"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="button-spinner" />
                      Creating account...
                    </>
                  ) : (
                    <>
                      Create account <span>→</span>
                    </>
                  )}
                </button>

                {/* LOGIN LINK */}
                <div className="login-prompt">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => router.push("/login")}
                    disabled={loading}
                  >
                    Sign in
                  </button>
                </div>
              </form>
            </>
          )}
        </section>

        {/* SIMPLE FOOTER */}
        <footer className="register-footer">
          <span>
            © {new Date().getFullYear()} ElitePay
          </span>

          <span>Never share your password with anyone.</span>
        </footer>

        {/* PAGE STYLES */}
        <style jsx>{`
          .register-page {
            min-height: calc(100vh - 100px);
            padding: 0 18px 20px;

            display: flex;
            flex-direction: column;
            align-items: center;

            color: #172b24;
          }

          /* HEADER */

          .register-header {
            width: 100%;
            max-width: 1050px;
            min-height: 76px;

            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;

            margin-bottom: 28px;
            border-bottom: 1px solid #e5ede7;
          }

          .brand {
            display: inline-flex;
            align-items: center;
            gap: 10px;

            padding: 0;
            border: 0;
            background: transparent;
            color: #172b24;

            font-size: 21px;
            font-weight: 900;
            cursor: pointer;
          }

          .brand-icon {
            display: grid;
            place-items: center;

            width: 38px;
            height: 38px;
            border-radius: 11px;

            color: #fff;
            background: #10845b;

            font-size: 20px;
          }

          .brand-name span {
            color: #10845b;
          }

          .header-note {
            color: #718178;
            font-size: 12px;
          }

          /* REGISTRATION CARD */

          .register-card {
            width: min(100%, 460px);
            margin: auto 0;

            padding: 34px;

            border: 1px solid #e0e9e3;
            border-radius: 18px;

            background: #fff;
            box-shadow:
              0 12px 38px rgba(23, 58, 39, 0.055);
          }

          .form-heading {
            margin-bottom: 25px;
          }

          .eyebrow {
            margin: 0 0 10px;

            color: #10845b;
            font-size: 10px;
            font-weight: 900;
            letter-spacing: 0.09em;
          }

          .form-heading h1,
          .success-content h1 {
            margin: 0;

            color: #172b24;
            font-size: clamp(25px, 4vw, 30px);
            font-weight: 900;
            letter-spacing: -1px;
            line-height: 1.2;
          }

          .description {
            margin: 10px 0 0;

            color: #6c7d73;
            font-size: 13px;
            line-height: 1.75;
          }

          /* FIELDS */

          .field {
            margin-bottom: 17px;
          }

          .field label {
            display: block;
            margin-bottom: 7px;

            color: #344d3f;
            font-size: 12px;
            font-weight: 800;
          }

          .form-input {
            display: block;
            width: 100%;
            min-width: 0;
            height: 46px;

            padding: 0 13px;
            margin: 0;

            border: 1px solid #dce7df;
            border-radius: 10px;

            color: #172b24;
            background: #fff;

            font-family: inherit;
            font-size: 13px;

            outline: none;

            transition:
              border-color 0.18s ease,
              box-shadow 0.18s ease;
          }

          .form-input::placeholder {
            color: #a0ada4;
          }

          .form-input:hover {
            border-color: #c4d9ca;
          }

          .form-input:focus {
            border-color: #10845b;
            box-shadow: 0 0 0 3px rgba(16, 132, 91, 0.1);
          }

          .form-input:disabled {
            opacity: 0.65;
            background: #f5f8f6;
          }

          /* PHONE FIELD */

          .phone-input {
            position: relative;
          }

          .phone-prefix {
            position: absolute;
            left: 13px;
            top: 50%;
            transform: translateY(-50%);

            color: #546a5d;
            font-size: 12px;
            font-weight: 800;
          }

          .phone-input .form-input {
            padding-left: 57px;
          }

          .field-hint {
            margin: 6px 0 0;

            color: #89968e;
            font-size: 10px;
            line-height: 1.5;
          }

          .field-error {
            margin: 6px 0 0;

            color: #bc332d;
            font-size: 11px;
            font-weight: 650;
            line-height: 1.5;
          }

          .form-error {
            margin-bottom: 16px;
            padding: 11px 13px;

            border: 1px solid #f0d5d2;
            border-radius: 9px;

            color: #a72c26;
            background: #fff5f4;

            font-size: 12px;
            line-height: 1.5;
          }

          /* PASSWORD */

          .password-wrap {
            position: relative;
          }

          .password-wrap .form-input {
            padding-right: 65px;
          }

          .password-toggle {
            position: absolute;
            top: 50%;
            right: 12px;
            transform: translateY(-50%);

            padding: 5px 0;
            border: 0;

            color: #10845b;
            background: transparent;

            font-size: 11px;
            font-weight: 850;
            cursor: pointer;
          }

          /* TERMS */

          .terms {
            display: flex;
            align-items: flex-start;
            gap: 10px;

            margin: 21px 0;
            padding: 13px;

            border: 1px solid #e3ece5;
            border-radius: 10px;

            background: #f8fbf9;

            color: #617267;
            font-size: 11px;
            line-height: 1.65;

            cursor: pointer;
          }

          .terms input {
            flex: 0 0 auto;

            width: 16px;
            height: 16px;
            margin: 2px 0 0;

            accent-color: #10845b;
            cursor: pointer;
          }

          /* PRIMARY BUTTON */

          .primary-button {
            width: 100%;
            min-height: 47px;

            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;

            padding: 12px 16px;

            border: 1px solid #10845b;
            border-radius: 10px;

            color: #fff;
            background: #10845b;

            font-family: inherit;
            font-size: 13px;
            font-weight: 850;

            cursor: pointer;

            transition:
              background 0.18s ease,
              transform 0.18s ease;
          }

          .primary-button:hover:not(:disabled) {
            background: #086644;
            transform: translateY(-1px);
          }

          .primary-button:disabled {
            opacity: 0.7;
            cursor: wait;
          }

          .button-spinner {
            width: 17px;
            height: 17px;

            border: 2px solid rgba(255, 255, 255, 0.4);
            border-top-color: #fff;
            border-radius: 50%;

            animation: spin 0.7s linear infinite;
          }

          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }

          /* LOGIN PROMPT */

          .login-prompt {
            margin-top: 21px;

            color: #748278;
            font-size: 12px;
            text-align: center;
          }

          .login-prompt button {
            padding: 0;
            border: 0;

            color: #10845b;
            background: transparent;

            font-family: inherit;
            font-size: 12px;
            font-weight: 900;

            cursor: pointer;
          }

          .login-prompt button:hover {
            color: #086644;
            text-decoration: underline;
          }

          /* SUCCESS STATE */

          .success-content {
            padding: 20px 0;
            text-align: center;
          }

          .success-icon {
            display: grid;
            place-items: center;

            width: 68px;
            height: 68px;
            margin: 0 auto 22px;

            border-radius: 50%;

            color: #fff;
            background: #10845b;

            font-size: 32px;
            font-weight: 900;
          }

          .success-content .eyebrow {
            margin-bottom: 9px;
          }

          .success-note {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;

            margin: 23px 0;
            padding: 13px;

            border: 1px solid #d8ecdf;
            border-radius: 10px;

            background: #f0f9f3;
            color: #087449;

            font-size: 12px;
            font-weight: 750;
          }

          /* FOOTER */

          .register-footer {
            display: flex;
            justify-content: space-between;
            gap: 12px;

            width: 100%;
            max-width: 1050px;

            margin-top: 28px;
            padding-top: 17px;

            border-top: 1px solid #e5ede7;

            color: #8a978e;
            font-size: 10px;
          }

          /* MOBILE */

          @media (max-width: 520px) {
            .register-page {
              padding: 0 14px 18px;
            }

            .register-header {
              min-height: 64px;
              margin-bottom: 18px;
            }

            .brand {
              gap: 8px;
              font-size: 19px;
            }

            .brand-icon {
              width: 34px;
              height: 34px;
              font-size: 18px;
            }

            .header-note {
              font-size: 10px;
              text-align: right;
            }

            .register-card {
              padding: 25px 19px;
              border-radius: 14px;
            }

            .form-heading {
              margin-bottom: 22px;
            }

            .form-heading h1,
            .success-content h1 {
              font-size: 26px;
            }

            .field {
              margin-bottom: 16px;
            }

            .register-footer {
              flex-direction: column;
              align-items: center;
              text-align: center;
              gap: 6px;
            }
          }

          @media (prefers-reduced-motion: reduce) {
            *,
            *::before,
            *::after {
              animation-duration: 0.01ms !important;
              animation-iteration-count: 1 !important;
              transition-duration: 0.01ms !important;
            }
          }
        `}</style>
      </main>
    </Layout>
  );
}