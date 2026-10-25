import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { loadUser, loadLastPhone } from '../utils/storage';

export default function Login() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Preparing secure session...');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const lastPhone = loadLastPhone();
    if (lastPhone) setPhone(lastPhone);
  }, []);

  const onPhoneChange = (value) => {
    const digits = value.replace(/\D/g, '');
    setPhone(digits.slice(0, 11));
    if (errors.phone) setErrors((prev) => ({ ...prev, phone: null }));
  };

  const validate = () => {
    const nextErrors = {};
    if (!phone) nextErrors.phone = 'Please enter your phone number.';
    else if (!/^\d{11}$/.test(phone)) nextErrors.phone = 'Phone must be 11 digits, for example 08031234567.';
    return nextErrors;
  };

  const startLoader = (message = 'Preparing secure session...') => {
    setLoadingMessage(message);
    setLoading(true);
    setTimeout(() => setLoadingMessage('Checking account...'), 600);
    setTimeout(() => setLoadingMessage('Securing your session...'), 1200);
  };

  const login = () => {
    const nextErrors = validate();
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      alert(Object.values(nextErrors)[0]);
      return;
    }

    startLoader('Looking up your account...');
    setTimeout(() => {
      const user = loadUser();
      if (user && user.phone === phone) {
        setTimeout(() => router.push('/dashboard'), 300);
      } else {
        setLoading(false);
        alert('User not found. Please register first.');
        router.push('/register');
      }
    }, 1600);
  };

  return (
    <Layout title="Login - ElitePay Wallet">
      <style>{`
        .auth-shell {
          min-height: calc(100vh - 190px);
          display: grid;
          place-items: center;
          padding: 16px 0 28px;
        }

        .auth-card {
          width: min(940px, 100%);
          display: grid;
          grid-template-columns: 0.9fr 1.1fr;
          overflow: hidden;
          padding: 0;
        }

        .auth-brand {
          display: grid;
          align-content: center;
          justify-items: center;
          gap: 14px;
          min-height: 430px;
          padding: 28px;
          color: #ffffff;
          text-align: center;
          background:
            radial-gradient(circle at 50% 32%, rgba(15, 159, 110, 0.34), transparent 48%),
            linear-gradient(135deg, #172b24, #0f5f48);
        }

        .auth-brand img {
          width: min(220px, 78%);
          height: auto;
          filter: drop-shadow(0 18px 26px rgba(0, 0, 0, 0.28));
        }

        .auth-brand h1 {
          margin: 0;
          font-size: 28px;
          line-height: 1.05;
        }

        .auth-brand p {
          margin: 0;
          max-width: 300px;
          color: rgba(255, 255, 255, 0.76);
        }

        .auth-form {
          padding: 34px;
          background: #ffffff;
        }

        .auth-kicker {
          display: inline-flex;
          padding: 6px 10px;
          border-radius: 999px;
          background: #e9f8f2;
          color: #096b4a;
          font-size: 12px;
          font-weight: 900;
          margin-bottom: 12px;
        }

        .auth-title {
          margin: 0;
          color: #172b24;
          font-size: 30px;
          font-weight: 950;
        }

        .auth-copy {
          margin: 8px 0 22px;
          color: #687a72;
        }

        .field-label {
          display: block;
          margin-bottom: 6px;
          color: #40554a;
          font-size: 13px;
          font-weight: 850;
        }

        .field-help {
          margin-top: 4px;
          color: #687a72;
          font-size: 12px;
        }

        .field-error {
          margin-top: 6px;
          color: #b42318;
          font-size: 13px;
          font-weight: 800;
        }

        .auth-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-top: 18px;
        }

        .auth-switch {
          margin-top: 16px;
          color: #687a72;
          font-size: 13px;
        }

        .auth-switch button {
          border: 0;
          background: transparent;
          color: #096b4a;
          font-weight: 900;
          cursor: pointer;
          padding: 0;
        }

        @media (max-width: 760px) {
          .auth-card {
            grid-template-columns: 1fr;
          }

          .auth-brand {
            min-height: 240px;
            padding: 22px;
          }

          .auth-brand img {
            width: min(170px, 72%);
          }

          .auth-form {
            padding: 24px 18px;
          }
        }
      `}</style>

      <div className="auth-shell">
        <section className="card auth-card">
          <div className="auth-brand">
            <img src="/elitepay-logo.png" alt="ElitePay logo" />
            <h1>Welcome back</h1>
            <p>Continue to your ElitePay wallet with your registered phone number.</p>
          </div>

          <div className="auth-form">
            <span className="auth-kicker">Secure login</span>
            <h2 className="auth-title">Login</h2>
            <p className="auth-copy">Enter the phone number you used when creating your account.</p>

            <label className="field-label" htmlFor="login-phone">Phone number</label>
            <input
              id="login-phone"
              className="input"
              placeholder="08031234567"
              value={phone}
              onChange={(e) => onPhoneChange(e.target.value)}
              maxLength={11}
              disabled={loading}
              inputMode="numeric"
            />
            <div className="field-help">Use your 11-digit local phone number.</div>
            {errors.phone && <div className="field-error">{errors.phone}</div>}

            <div className="auth-actions">
              <button className="btn" onClick={login} disabled={loading}>
                {loading ? 'Checking...' : 'Login'}
              </button>
              <button className="btnGhost" onClick={() => router.push('/register')} disabled={loading}>
                Create Account
              </button>
            </div>

            <div className="auth-switch">
              New to ElitePay? <button onClick={() => router.push('/register')}>Register here</button>
            </div>
          </div>
        </section>
      </div>

      {loading && (
        <div className="loadingOverlay" role="status" aria-live="polite">
          <div className="loadingBox">
            <div className="loader" aria-hidden="true">
              <span className="ring" />
              <span className="ring ring2" />
              <span className="spark" />
            </div>
            <div>
              <div className="loaderText">{loadingMessage}</div>
              <div className="small muted" style={{ marginTop: 6 }}>Checking your details securely...</div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
