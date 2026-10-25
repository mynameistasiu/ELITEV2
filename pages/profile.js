import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Layout from "../components/Layout";
import { loadUser, saveUser } from "../utils/storage";
import BANKS from "../utils/banks";

const emptyForm = {
  fullName: "",
  phone: "",
  email: "",
  dateOfBirth: "",
  nin: "",
  bankName: "",
  bankAccountNumber: "",
};

export default function Profile() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showCongratulations, setShowCongratulations] = useState(false);

  useEffect(() => {
    const currentUser = loadUser();
    if (!currentUser) {
      router.replace("/");
      return;
    }

    setUser(currentUser);
    setForm({
      fullName: currentUser.fullName || "",
      phone: currentUser.phone || "",
      email: currentUser.email || "",
      dateOfBirth: currentUser.kyc?.dateOfBirth || "",
      nin: currentUser.kyc?.nin || "",
      bankName: currentUser.kyc?.bankName || "",
      bankAccountNumber: currentUser.kyc?.bankAccountNumber || "",
    });
  }, [router]);

  const updateField = (field, value) => {
    setForm((previous) => ({ ...previous, [field]: value }));
    setErrors((previous) => ({ ...previous, [field]: "" }));
    setSaved(false);
  };

  const updateDigits = (field, value, length) => {
    updateField(field, value.replace(/\D/g, "").slice(0, length));
  };

  const completeKyc = (event) => {
    event.preventDefault();
    if (!user || saving) return;

    const nextErrors = {};
    if (form.fullName.trim().length < 2) {
      nextErrors.fullName = "Enter your full legal name.";
    }
    if (!/^\d{11}$/.test(form.phone)) {
      nextErrors.phone = "Enter a valid 11-digit Nigerian phone number.";
    }
    if (!form.dateOfBirth) {
      nextErrors.dateOfBirth = "Enter your date of birth.";
    } else if (form.dateOfBirth > new Date().toISOString().slice(0, 10)) {
      nextErrors.dateOfBirth = "Date of birth cannot be in the future.";
    }
    if (!/^\d{11}$/.test(form.nin)) {
      nextErrors.nin = "NIN must contain 11 digits.";
    }
    if (!BANKS.includes(form.bankName)) {
      nextErrors.bankName = "Select your bank from the list.";
    }
    if (!/^\d{10}$/.test(form.bankAccountNumber)) {
      nextErrors.bankAccountNumber = "Account number must contain 10 digits.";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    const wasComplete = user.kycCompleted === true;
    const updatedUser = {
      ...user,
      fullName: form.fullName.trim(),
      phone: form.phone,
      email: form.email.trim(),
      kyc: {
        ...user.kyc,
        dateOfBirth: form.dateOfBirth,
        nin: form.nin,
        bankName: form.bankName.trim(),
        bankAccountNumber: form.bankAccountNumber,
        completedAt: user.kyc?.completedAt || new Date().toISOString(),
      },
      kycCompleted: true,
    };

    if (!saveUser(updatedUser)) {
      setErrors({
        form: "Your details could not be saved on this device. Please try again.",
      });
      setSaving(false);
      return;
    }

    setUser(updatedUser);
    setSaved(true);
    setSaving(false);
    if (!wasComplete) setShowCongratulations(true);
  };

  const fieldError = (name) =>
    errors[name] ? (
      <span className="field-error" role="alert">
        {errors[name]}
      </span>
    ) : null;

  return (
    <Layout title="Complete your KYC - ElitePay Wallet">
      <main className="profile-page">
        {user ? (
          <section className="kyc-card">
            <div className="kyc-heading">
              <p className="eyebrow">ACCOUNT SETUP</p>
              <h1>Complete your KYC</h1>
              <p>
                Add your personal and bank details to unlock your dashboard.
                Fields marked required must be completed.
              </p>
              {user.kycCompleted && (
                <span className="kyc-status">KYC details completed</span>
              )}
            </div>

            <div className="privacy-notice" role="note">
              <strong>Privacy notice:</strong> We ensure your data is securely stored and protected on our servers.
            </div>

            {errors.form && (
              <p className="form-error" role="alert">
                {errors.form}
              </p>
            )}

            <form onSubmit={completeKyc} noValidate>
              <fieldset disabled={saving}>
                <legend>Personal details</legend>

                <div className="field">
                  <label htmlFor="kyc-full-name">Full legal name *</label>
                  <input
                    id="kyc-full-name"
                    className="input"
                    autoComplete="name"
                    value={form.fullName}
                    onChange={(event) =>
                      updateField("fullName", event.target.value)
                    }
                    required
                  />
                  {fieldError("fullName")}
                </div>

                <div className="field">
                  <label htmlFor="kyc-phone">Phone number *</label>
                  <input
                    id="kyc-phone"
                    className="input"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    maxLength={11}
                    value={form.phone}
                    onChange={(event) =>
                      updateDigits("phone", event.target.value, 11)
                    }
                    required
                  />
                  {fieldError("phone")}
                </div>

                <div className="field">
                  <label htmlFor="kyc-email">Email address (optional)</label>
                  <input
                    id="kyc-email"
                    className="input"
                    type="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={(event) => updateField("email", event.target.value)}
                  />
                </div>

                <div className="field">
                  <label htmlFor="kyc-dob">Date of birth *</label>
                  <input
                    id="kyc-dob"
                    className="input"
                    type="date"
                    autoComplete="bday"
                    max={new Date().toISOString().slice(0, 10)}
                    value={form.dateOfBirth}
                    onChange={(event) =>
                      updateField("dateOfBirth", event.target.value)
                    }
                    required
                  />
                  {fieldError("dateOfBirth")}
                </div>

                <div className="field">
                  <label htmlFor="kyc-nin">National Identification Number (NIN) *</label>
                  <input
                    id="kyc-nin"
                    className="input"
                    type="password"
                    inputMode="numeric"
                    autoComplete="off"
                    maxLength={11}
                    value={form.nin}
                    onChange={(event) =>
                      updateDigits("nin", event.target.value, 11)
                    }
                    aria-describedby="nin-hint"
                    required
                  />
                  <span className="field-hint" id="nin-hint">
                    Enter your 11-digit NIN. It will be masked while typing.
                  </span>
                  {fieldError("nin")}
                </div>
              </fieldset>

              <fieldset disabled={saving}>
                <legend>Bank details</legend>

                <div className="field">
                  <label htmlFor="kyc-bank-name">Bank name *</label>
                  <select
                    id="kyc-bank-name"
                    className="input"
                    value={form.bankName}
                    onChange={(event) =>
                      updateField("bankName", event.target.value)
                    }
                    required
                  >
                    <option value="">Select your bank</option>
                    {BANKS.map((bank) => (
                      <option value={bank} key={bank}>
                        {bank}
                      </option>
                    ))}
                  </select>
                  {fieldError("bankName")}
                </div>

                <div className="field">
                  <label htmlFor="kyc-account-number">Bank account number *</label>
                  <input
                    id="kyc-account-number"
                    className="input"
                    type="password"
                    inputMode="numeric"
                    autoComplete="off"
                    maxLength={10}
                    value={form.bankAccountNumber}
                    onChange={(event) =>
                      updateDigits("bankAccountNumber", event.target.value, 10)
                    }
                    aria-describedby="account-hint"
                    required
                  />
                  <span className="field-hint" id="account-hint">
                    Enter your 10-digit account number. It will be masked while
                    typing.
                  </span>
                  {fieldError("bankAccountNumber")}
                </div>
              </fieldset>

              <button className="btn submit-button" type="submit" disabled={saving}>
                {saving
                  ? "Saving..."
                  : user.kycCompleted
                    ? "Save profile changes"
                    : "Submit KYC details"}
              </button>
              {saved && (
                <p className="saved-message" role="status">
                  Your profile changes have been saved on this device.
                </p>
              )}
            </form>
          </section>
        ) : (
          <section className="kyc-card" aria-live="polite">
            <p>Loading your profile...</p>
          </section>
        )}
      </main>

      {showCongratulations && (
        <div className="congrats-backdrop">
          <section
            className="congrats-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="congrats-title"
          >
            <div className="congrats-icon" aria-hidden="true">🎉</div>
            <p className="eyebrow">PROFILE COMPLETE</p>
            <h2 id="congrats-title">Congratulations!</h2>
            <p>
              You have completed your profile details. Welcome to the
              ElitePay community.
            </p>
            <a
              className="btn community-button"
              href="https://t.me/ueiejao"
              target="_blank"
              rel="noreferrer"
            >
              Join our community now
            </a>
            <button
              className="btnGhost"
              type="button"
              onClick={() => router.replace("/dashboard")}
            >
              Continue to dashboard
            </button>
          </section>
        </div>
      )}

      <style jsx>{`
        .profile-page {
          width: min(100%, 760px);
          margin: 0 auto;
          padding: 22px 0 38px;
        }

        .kyc-card,
        .congrats-dialog {
          padding: clamp(20px, 5vw, 36px);
          border: 1px solid var(--gt-border);
          border-radius: var(--gt-radius-lg);
          background: var(--gt-card);
          box-shadow: var(--gt-shadow);
        }

        .kyc-heading {
          margin-bottom: 22px;
        }

        .eyebrow {
          margin: 0 0 8px;
          color: var(--gt-primary);
          font-size: 11px;
          font-weight: 850;
          letter-spacing: 0.08em;
        }

        .kyc-heading h1,
        .congrats-dialog h2 {
          margin: 0;
          font-size: clamp(24px, 5vw, 32px);
        }

        .kyc-heading > p:not(.eyebrow),
        .congrats-dialog > p:not(.eyebrow) {
          color: var(--gt-muted);
        }

        .kyc-status {
          display: inline-flex;
          margin-top: 4px;
          padding: 5px 10px;
          border-radius: 999px;
          color: var(--gt-success);
          background: var(--gt-panel);
          font-size: 12px;
          font-weight: 750;
        }

        .privacy-notice {
          margin: 18px 0 24px;
          padding: 13px 15px;
          border: 1px solid #e8d7a9;
          border-radius: var(--gt-radius-sm);
          color: #654e1c;
          background: #fff9e9;
          font-size: 12px;
          line-height: 1.6;
        }

        fieldset {
          min-width: 0;
          margin: 0 0 22px;
          padding: 0;
          border: 0;
        }

        legend {
          width: 100%;
          margin-bottom: 8px;
          padding: 0 0 8px;
          border-bottom: 1px solid var(--gt-border);
          color: var(--gt-ink);
          font-size: 16px;
          font-weight: 800;
        }

        .field {
          margin: 12px 0 16px;
        }

        .field label {
          display: block;
          margin-bottom: 2px;
        }

        .field .input {
          margin: 4px 0;
        }

        .field-error {
          display: block;
          margin-top: 3px;
          color: var(--gt-danger);
          font-size: 12px;
        }

        .field-hint {
          display: block;
          color: var(--gt-muted);
          font-size: 11px;
        }

        .form-error {
          color: var(--gt-danger);
        }

        .submit-button {
          width: 100%;
          margin-top: 2px;
        }

        .saved-message {
          color: var(--gt-success);
          text-align: center;
        }

        .congrats-backdrop {
          position: fixed;
          inset: 0;
          z-index: 2000;
          display: grid;
          place-items: center;
          padding: 20px;
          background: rgba(13, 30, 22, 0.62);
          animation: fade-in 180ms ease-out;
        }

        .congrats-dialog {
          width: min(100%, 440px);
          text-align: center;
          animation: rise-in 260ms ease-out;
        }

        .congrats-icon {
          margin-bottom: 10px;
          font-size: 48px;
        }

        .community-button,
        .congrats-dialog :global(.btnGhost) {
          width: 100%;
          margin-top: 12px;
        }

        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes rise-in {
          from { opacity: 0; transform: translateY(12px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        @media (prefers-reduced-motion: reduce) {
          .congrats-backdrop,
          .congrats-dialog {
            animation: none;
          }
        }
      `}</style>
    </Layout>
  );
}
