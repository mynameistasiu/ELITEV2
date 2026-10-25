import Head from 'next/head';
import LogoHeader from './LogoHeader';
import WalletGuide from './WalletGuide';
import BottomNavigation from './BottomNavigation';
import WithdrawalActivityBanner from './WithdrawalActivityBanner';

export default function Layout({ children, title = 'ElitePay Wallet' }) {
  return (
    <div className="app-root">
      <Head>
        <title>{title}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#f5f8f6" />
        <meta name="description" content="Manage your ElitePay wallet, rewards, withdrawals, and activity in one place." />
        <link rel="icon" href="/elitepay-logo.png" />
      </Head>

      <LogoHeader />
      <WithdrawalActivityBanner />
      <main className="container page-fade">{children}</main>
      <WalletGuide />
      <BottomNavigation />

      <footer className="gt-footer">
        <div className="container gt-footer__inner">
          <span>© {new Date().getFullYear()} ElitePay</span>
          <span>Fast. Secure. Verified.</span>
        </div>
      </footer>
    </div>
  );
}
