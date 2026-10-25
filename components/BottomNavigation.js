import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { loadUser } from "../utils/storage";

const tabs = [
  { href: "/dashboard", label: "Dashboard", icon: "home" },
  { href: "/history", label: "Transactions", icon: "list" },
  { href: "/buy-code", label: "My coupons", icon: "coupon" },
  { href: "/notifications", label: "Notifications", icon: "bell" },
  { href: "/profile", label: "Profile", icon: "profile" },
];

function TabIcon({ name }) {
  const paths = {
    home: (
      <>
        <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z" />
      </>
    ),
    list: (
      <>
        <path d="M8 6h13M8 12h13M8 18h13" />
        <path d="M3 6h.01M3 12h.01M3 18h.01" />
      </>
    ),
    coupon: (
      <>
        <path d="M4 5h16v4a3 3 0 0 0 0 6v4H4v-4a3 3 0 0 0 0-6z" />
        <path d="M12 8v1m0 3v1m0 3v1" />
      </>
    ),
    bell: (
      <>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path d="M10 21h4" />
      </>
    ),
    profile: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </>
    ),
  };

  return (
    <svg
      viewBox="0 0 24 24"
      width="21"
      height="21"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

export default function BottomNavigation() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const syncUser = () => setUser(loadUser() || null);
    syncUser();
    window.addEventListener("storage", syncUser);
    window.addEventListener("elitepay:auth-changed", syncUser);

    return () => {
      window.removeEventListener("storage", syncUser);
      window.removeEventListener("elitepay:auth-changed", syncUser);
    };
  }, []);

  if (!user) return null;

  return (
    <nav className="bottom-tab-bar" aria-label="Main navigation">
      {tabs.map((tab) => {
        const active = router.pathname === tab.href;
        return (
          <Link
            className={`bottom-tab${active ? " is-active" : ""}`}
            href={tab.href}
            key={tab.href}
            aria-current={active ? "page" : undefined}
          >
            <span className="bottom-tab__icon">
              <TabIcon name={tab.icon} />
              {active && <span className="bottom-tab__indicator" />}
            </span>
            <span className="bottom-tab__label">{tab.label}</span>
          </Link>
        );
      })}
      <style jsx>{`
        .bottom-tab-bar {
          position: fixed;
          z-index: 1300;
          left: 50%;
          bottom: max(8px, env(safe-area-inset-bottom));
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          align-items: stretch;
          gap: 4px;
          box-sizing: border-box;
          width: min(680px, calc(100vw - 24px));
          padding: 7px;
          border: 1px solid rgba(221, 233, 225, 0.95);
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.97);
          box-shadow: 0 8px 28px rgba(20, 48, 34, 0.15);
          transform: translateX(-50%);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
        }

        .bottom-tab {
          position: relative;
          display: flex;
          min-width: 0;
          min-height: 56px;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          padding: 5px 2px;
          border-radius: 12px;
          color: #87958d;
          text-decoration: none;
          transition: color 160ms ease, background 160ms ease;
          -webkit-tap-highlight-color: transparent;
        }

        .bottom-tab.is-active {
          color: var(--gt-primary-dark);
          background: #eaf6ee;
        }

        .bottom-tab__icon {
          position: relative;
          display: flex;
          width: 24px;
          height: 24px;
          flex: 0 0 24px;
          align-items: center;
          justify-content: center;
        }

        .bottom-tab__icon :global(svg) {
          display: block;
          flex: 0 0 auto;
        }

        .bottom-tab__indicator {
          position: absolute;
          top: -3px;
          right: -3px;
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--gt-primary);
          box-shadow: 0 0 0 2px #fff;
        }

        .bottom-tab__label {
          display: block;
          width: 100%;
          min-width: 0;
          min-height: 18px;
          text-align: center;
          max-width: 100%;
          overflow: hidden;
          font-size: clamp(7px, 2.25vw, 9px);
          font-weight: 750;
          line-height: 18px;
          letter-spacing: -0.02em;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        @media (max-width: 360px) {
          .bottom-tab-bar {
            width: calc(100vw - 16px);
            gap: 2px;
            padding: 6px 5px;
          }

          .bottom-tab__label {
            font-size: 7px;
            letter-spacing: -0.035em;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .bottom-tab {
            transition: none;
          }
        }
      `}</style>
    </nav>
  );
}
