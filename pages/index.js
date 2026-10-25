import Layout from "../components/Layout";
import Link from "next/link";

export default function Home() {
  return (
    <Layout title="ElitePay | Wallet and rewards">
      <div className="elite-home">
        <section className="hero">
          <div className="bonus">
            <span className="gift">✦</span>
            Your wallet, in one place
          </div>

          <h1>
            Manage your wallet.
            <br />
            <span className="brand-name">Keep it clear.</span>
          </h1>

          <p className="description">
            View your balance, check rewards, review transactions, and manage
            withdrawals from your ElitePay account.
          </p>

          <div className="actions">
            <Link href="/register" className="btn btn-primary">
              Get started <span>→</span>
            </Link>

            <Link href="/login" className="btn btn-secondary">
              Sign in
            </Link>
          </div>

          <div className="benefits">
            <div className="benefit">
              <span className="benefit-icon">✓</span>
              <span>Wallet overview</span>
            </div>

            <div className="benefit">
              <span className="benefit-icon">↗</span>
              <span>Activity and rewards</span>
            </div>
          </div>
        </section>

        <style jsx>{`
          .elite-home {
            min-height: min(76vh, 720px);
            padding: 0 12px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            color: #172b23;
          }

          .hero {
            width: 100%;
            max-width: 710px;
            margin: auto;
            padding: 65px 0 75px;
            text-align: center;
          }

          .bonus {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            max-width: 100%;
            padding: 10px 16px;
            border: 1px solid #d7eee0;
            border-radius: 7px;
            background: #eff9f2;
            color: #087449;
            font-size: 12px;
            font-weight: 800;
          }

          .gift {
            font-size: 15px;
          }

          h1 {
            margin: 29px 0 0;
            color: #182e24;
            font-size: clamp(37px, 6vw, 61px);
            line-height: 1.12;
            letter-spacing: -2.6px;
            font-weight: 900;
          }

          .brand-name {
            color: #10845b;
          }

          .description {
            max-width: 590px;
            margin: 22px auto 0;
            color: #68776f;
            font-size: 15px;
            line-height: 1.9;
          }

          .actions {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            justify-content: center;
            gap: 12px;
            margin-top: 28px;
          }

          .btn {
            min-height: 49px;
            padding: 14px 20px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            border-radius: 7px;
            text-decoration: none;
            font-size: 13px;
            font-weight: 800;
            transition: background 0.2s ease;
          }

          .btn-primary {
            color: white;
            background: #10845b;
            border: 1px solid #10845b;
            font-weight: 900;
            box-shadow: 0 8px 18px rgba(16, 132, 91, 0.18);
          }

          .btn-primary:hover {
            background: #086644;
          }

          .btn-secondary {
            color: #263e32;
            background: white;
            border: 1px solid #dce6df;
            font-weight: 750;
          }

          .btn-secondary:hover {
            background: #f5f9f6;
          }

          .benefits {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            justify-content: center;
            gap: 25px;
            margin-top: 29px;
          }

          .benefit {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            color: #596a60;
            font-size: 11px;
            font-weight: 650;
          }

          .benefit-icon {
            width: 20px;
            height: 20px;
            display: grid;
            place-items: center;
            border-radius: 50%;
            background: #eaf7ee;
            color: #10845b;
            font-size: 12px;
            font-weight: 900;
          }

          @media (max-width: 600px) {
            .elite-home {
              min-height: 70vh;
              padding: 0 4px;
            }

            .hero {
              padding: 55px 0;
            }

            .bonus {
              font-size: 10px;
              padding: 9px 11px;
            }

            h1 {
              margin-top: 24px;
              font-size: clamp(35px, 9vw, 46px);
              letter-spacing: -1.8px;
            }

            .description {
              font-size: 13px;
              line-height: 1.8;
            }

            .actions {
              flex-direction: column;
              align-items: stretch;
            }

            .btn {
              width: 100%;
              box-sizing: border-box;
            }

            .benefits {
              gap: 14px 20px;
            }

          }
        `}</style>
      </div>
    </Layout>
  );
}
