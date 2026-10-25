import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { loadUser, logout } from '../utils/storage';

const WA_NUMBER = '+2348161662371';

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/mine', label: 'Mine' },
  { href: '/buy-code', label: 'Buy Code' },
  { href: '/withdraw', label: 'Withdraw' },
  { href: '/history', label: 'History' },
];

export default function LogoHeader({ small }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const syncUser = () => setUser(loadUser() || null);
    syncUser();
    window.addEventListener('storage', syncUser);
    window.addEventListener('elitepay:auth-changed', syncUser);

    return () => {
      window.removeEventListener('storage', syncUser);
      window.removeEventListener('elitepay:auth-changed', syncUser);
    };
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [router.pathname]);

  useEffect(() => {
    if (!open) return undefined;

    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };

    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [open]);

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      logout();
      setUser(null);
      router.push('/login');
    }
  };

  const firstName = user?.fullName ? user.fullName.split(' ')[0] : 'Account';

  return (
    <header className={`gt-header ${small ? 'gt-header--small' : ''}`}>
      <div className="gt-header__inner">
        <Link href="/" className="gt-brand" aria-label="ElitePay home">
          <span className="gt-brand__mark">
            <Image src="/elitepay-logo.png" alt="" width={44} height={44} priority />
          </span>
          <span className="gt-brand__text">
            <span className="gt-title">ElitePay</span>
            {!small && <span className="gt-sub">Fast. Secure. Verified.</span>}
          </span>
        </Link>

        <nav id="main-navigation" className={`gt-nav ${open ? 'open' : ''}`} aria-label="Main navigation">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`gt-nav__link ${router.pathname === item.href ? 'active' : ''}`}
              aria-current={router.pathname === item.href ? 'page' : undefined}
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <a
            className="gt-nav__link gt-nav__support"
            href={`https://wa.me/${WA_NUMBER.replace('+', '')}`}
            target="_blank"
            rel="noreferrer"
            onClick={() => setOpen(false)}
          >
            Support
          </a>
        </nav>

        <div className="gt-actions">
          {user ? (
            <div className="gt-account">
              <Link href="/profile" className="gt-profile" title="Profile">
                <span className="gt-avatar">{firstName.charAt(0).toUpperCase()}</span>
                <span className="gt-profile__text">
                  <span>{firstName}</span>
                  <small>Wallet</small>
                </span>
              </Link>
              <button type="button" className="gt-logout" onClick={handleLogout} title="Logout">
                Logout
              </button>
            </div>
          ) : (
            <div className="gt-auth">
              <Link href="/login" className="gt-ghost">Login</Link>
              <Link href="/register" className="gt-cta">Get Started</Link>
            </div>
          )}

          <button
            type="button"
            className={`gt-hamburger ${open ? 'open' : ''}`}
            onClick={() => setOpen((value) => !value)}
            aria-label={open ? 'Close navigation' : 'Open navigation'}
            aria-expanded={open}
            aria-controls="main-navigation"
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>
    </header>
  );
}
