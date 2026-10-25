// pages/activation-callback.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { loadUser, saveUser, saveTx } from '../utils/storage';

export default function ActivationCallback() {
  const router = useRouter();
  const [status, setStatus] = useState('processing'); // 'processing' | 'success' | 'error'
  const [message, setMessage] = useState('Processing your payment...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Check if user is logged in
        const user = loadUser();
        if (!user) {
          setStatus('error');
          setMessage('Session expired. Please login again.');
          setTimeout(() => router.push('/login'), 2000);
          return;
        }

        // Get query parameters from Korapay
        const { status: paymentStatus, reference, amount } = router.query;

        // Check for activation pending data
        const activationPending = localStorage.getItem('gt_activation_pending');
        if (!activationPending) {
          setStatus('error');
          setMessage('Activation data not found. Please try again.');
          setTimeout(() => router.push('/activation'), 2000);
          return;
        }

        const activationData = JSON.parse(activationPending);

        // If payment was successful (Korapay will set status=success or similar)
        if (paymentStatus === 'success' || paymentStatus === 'completed' || paymentStatus === 'paid') {
          // Mark account as activated
          try {
            localStorage.setItem('gt_activated', 'true');
            localStorage.removeItem('gt_restriction_end');

            // Save activation success transaction
            saveTx({
              type: 'activation_payment',
              amount: 2500,
              status: 'success',
              meta: {
                reason: activationData.reason,
                reference: reference || 'korapay',
                paymentStatus: paymentStatus,
                completedAt: new Date().toISOString(),
              },
              created_at: new Date().toISOString(),
            });

            // Clear activation pending data
            localStorage.removeItem('gt_activation_pending');

            setStatus('success');
            setMessage('✅ Payment Successful! Your account is now activated.');

            // Redirect to dashboard after 2 seconds
            setTimeout(() => {
              router.push('/dashboard?activated=success');
            }, 2000);
          } catch (e) {
            console.error('Error activating account:', e);
            setStatus('error');
            setMessage('Error activating account. Please contact support.');
            setTimeout(() => router.push('/activation'), 2500);
          }
        } else if (paymentStatus === 'failed' || paymentStatus === 'cancelled') {
          // Payment failed
          try {
            // Save failed payment transaction
            saveTx({
              type: 'activation_payment',
              amount: 2500,
              status: 'failed',
              meta: {
                reason: activationData.reason,
                reference: reference || 'korapay',
                paymentStatus: paymentStatus,
                failedAt: new Date().toISOString(),
              },
              created_at: new Date().toISOString(),
            });
          } catch (e) {
            console.error('Error saving failed transaction:', e);
          }

          setStatus('error');
          setMessage(
            paymentStatus === 'cancelled'
              ? '❌ Payment cancelled. Please try again.'
              : '❌ Payment failed. Please try again or contact support.'
          );

          // Clear activation pending data
          localStorage.removeItem('gt_activation_pending');

          // Redirect back to activation page after 2 seconds
          setTimeout(() => router.push('/activation'), 2500);
        } else {
          // Unknown status
          setStatus('error');
          setMessage('Unknown payment status. Please contact support.');
          setTimeout(() => router.push('/activation'), 2500);
        }
      } catch (error) {
        console.error('Callback error:', error);
        setStatus('error');
        setMessage('An error occurred. Please try again.');
        setTimeout(() => router.push('/activation'), 2500);
      }
    };

    // Only run on client side and when router is ready
    if (router.isReady) {
      handleCallback();
    }
  }, [router.isReady, router]);

  return (
    <Layout title="Payment Processing - ElitePay Wallet">
      <style>{`
        .callback-shell {
          min-height: calc(100vh - 200px);
          display: grid;
          place-items: center;
          padding: 32px 16px;
          background: linear-gradient(135deg, rgba(15, 159, 110, 0.04) 0%, rgba(29, 127, 242, 0.04) 100%);
        }

        .callback-card {
          width: 100%;
          max-width: 500px;
          background: #ffffff;
          border: 1px solid #dfe9e3;
          border-radius: 12px;
          padding: 48px 32px;
          box-shadow: 0 18px 45px rgba(16, 32, 51, 0.08);
          text-align: center;
        }

        .callback-icon {
          font-size: 64px;
          margin-bottom: 20px;
          display: block;
          animation: bounce 2s infinite;
        }

        .callback-status {
          font-size: 22px;
          font-weight: 950;
          margin-bottom: 12px;
          color: #172b24;
        }

        .callback-status.success {
          color: #096b4a;
        }

        .callback-status.error {
          color: #ef4444;
        }

        .callback-message {
          font-size: 14px;
          color: #687a72;
          line-height: 1.6;
          margin-bottom: 24px;
        }

        .callback-spinner {
          display: inline-block;
          width: 20px;
          height: 20px;
          border: 3px solid #dfe9e3;
          border-top-color: #13845d;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        .callback-loader-text {
          font-size: 13px;
          color: #687a72;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 640px) {
          .callback-card {
            padding: 32px 20px;
          }

          .callback-icon {
            font-size: 48px;
          }

          .callback-status {
            font-size: 18px;
          }
        }
      `}</style>

      <div className="callback-shell">
        <div className="callback-card">
          {status === 'processing' && (
            <>
              <span className="callback-icon">⏳</span>
              <div className="callback-status">Processing Payment</div>
              <div className="callback-message">{message}</div>
              <div className="callback-loader-text">
                <span className="callback-spinner"></span>
                Please wait...
              </div>
            </>
          )}

          {status === 'success' && (
            <>
              <span className="callback-icon">✅</span>
              <div className="callback-status success">Payment Successful</div>
              <div className="callback-message">{message}</div>
              <div className="callback-loader-text">
                <span className="callback-spinner"></span>
                Redirecting to dashboard...
              </div>
            </>
          )}

          {status === 'error' && (
            <>
              <span className="callback-icon">❌</span>
              <div className="callback-status error">Payment Failed</div>
              <div className="callback-message">{message}</div>
              <div className="callback-loader-text">
                <span className="callback-spinner"></span>
                Redirecting...
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
