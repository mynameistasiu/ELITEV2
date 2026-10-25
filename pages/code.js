import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import Layout from '../components/Layout';
import { loadTx, loadUser, saveTx } from '../utils/storage';

const WITHDRAWAL_CODE = 'GT1024W';
const CODE_PRICE = 7000;

const steps = [
  'Payment verified',
  'Withdrawal code generated',
  'Ready for wallet withdrawal',
];

export default function CodeSuccess() {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [userName, setUserName] = useState('ElitePay user');
  const recordedRef = useRef(false);

  useEffect(() => {
    const user = loadUser();
    if (user?.fullName) setUserName(user.fullName);
  }, []);

  const generatedAt = useMemo(() => {
    return new Intl.DateTimeFormat('en-NG', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date());
  }, []);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(WITHDRAWAL_CODE);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch (error) {
      const fallback = document.createElement('textarea');
      fallback.value = WITHDRAWAL_CODE;
      fallback.setAttribute('readonly', '');
      fallback.style.position = 'absolute';
      fallback.style.left = '-9999px';
      document.body.appendChild(fallback);
      fallback.select();
      document.execCommand('copy');
      document.body.removeChild(fallback);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    }
  };

  const recordSuccessfulPayment = () => {
    if (recordedRef.current) return;
    recordedRef.current = true;

    const createdAt = new Date().toISOString();

    try {
      const transactions = loadTx();
      const pendingIndex = transactions.findIndex((tx) => {
        return tx.type === 'buy_code' && tx.status !== 'successful';
      });

      if (pendingIndex >= 0) {
        const updated = transactions.slice();
        const pending = updated[pendingIndex];
        updated[pendingIndex] = {
          ...pending,
          amount: Number(pending.amount || CODE_PRICE),
          status: 'successful',
          created_at: pending.created_at || createdAt,
          meta: {
            ...(pending.meta || {}),
            withdrawalCode: WITHDRAWAL_CODE,
            remark: 'Buy code payment successful',
            completed_at: createdAt,
          },
        };
        saveTx(updated);
        return;
      }

      saveTx({
        type: 'buy_code',
        amount: CODE_PRICE,
        status: 'successful',
        created_at: createdAt,
        meta: {
          withdrawalCode: WITHDRAWAL_CODE,
          remark: 'Buy code payment successful',
        },
      });
    } catch (error) {
      saveTx({
        type: 'buy_code',
        amount: CODE_PRICE,
        status: 'successful',
        created_at: createdAt,
        meta: {
          withdrawalCode: WITHDRAWAL_CODE,
          remark: 'Buy code payment successful',
        },
      });
    }
  };

  const goTo = (path) => {
    recordSuccessfulPayment();
    router.push(path);
  };

  useEffect(() => {
    if (!router.isReady) return;

    if (router.query.payment === 'online' || router.query.reference) {
      recordSuccessfulPayment();
    }
  }, [router.isReady, router.query.payment, router.query.reference]);

  return (
    <Layout title="Payment Successful - ElitePay">
      <section className="codeSuccess">
        <motion.div
          className="codeSuccess__hero card"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.38, ease: 'easeOut' }}
        >
          <div className="codeSuccess__markWrap" aria-hidden="true">
            <motion.div
              className="codeSuccess__ring"
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.42, ease: 'backOut' }}
            >
              <motion.svg viewBox="0 0 64 64" className="codeSuccess__check">
                <motion.circle
                  cx="32"
                  cy="32"
                  r="27"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.55, ease: 'easeInOut' }}
                />
                <motion.path
                  d="M19 33.5 28 42l18-21"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: 0.42, duration: 0.45, ease: 'easeOut' }}
                />
              </motion.svg>
            </motion.div>
          </div>

          <p className="codeSuccess__eyebrow">Payment confirmed</p>
          <h1>Your payment was successful</h1>
          <p className="codeSuccess__intro">
            {userName}, your ElitePay withdrawal access code has been generated and is ready to use.
          </p>

          <motion.div
            className="codeSuccess__codePanel"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.72, duration: 0.32 }}
          >
            <div>
              <span className="small muted">Withdrawal code</span>
              <strong>{WITHDRAWAL_CODE}</strong>
            </div>
            <button className="codeSuccess__copy" onClick={copyCode} type="button">
              {copied ? 'Copied' : 'Copy'}
            </button>
          </motion.div>

          <div className="codeSuccess__actions">
            <button className="btn" type="button" onClick={() => goTo('/withdraw')}>
              Continue to Withdrawal
            </button>
            <button className="btnGhost" type="button" onClick={() => goTo('/dashboard')}>
              Back to Dashboard
            </button>
          </div>
        </motion.div>

        <aside className="codeSuccess__side">
          <div className="card codeSuccess__summary">
            <h2>Transaction summary</h2>
            <div className="tx">
              <span>Status</span>
              <strong className="success">Successful</strong>
            </div>
            <div className="tx">
              <span>Generated</span>
              <strong>{generatedAt}</strong>
            </div>
            <div className="tx">
              <span>Code use</span>
              <strong>Withdrawal</strong>
            </div>
          </div>

          <div className="card codeSuccess__steps">
            <h2>What happens next</h2>
            {steps.map((step, index) => (
              <motion.div
                className="codeSuccess__step"
                key={step}
                initial={{ opacity: 0, x: 14 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + index * 0.12 }}
              >
                <span>{index + 1}</span>
                <p>{step}</p>
              </motion.div>
            ))}
          </div>
        </aside>
      </section>
    </Layout>
  );
}
