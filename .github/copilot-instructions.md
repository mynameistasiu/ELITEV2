# GoldTrust Wallet - AI Coding Agent Instructions

## Project Overview
GoldTrust is a Next.js 13 **digital wallet application** for gold trading in Nigeria. It's a client-side app (no backend) that manages user accounts, transaction history, and account activation via localStorage.

**Key Tech Stack:**
- Next.js 13 + React 18 (Pages Router)
- Pure localStorage for persistence (no database)
- QR code generation (qrcode), PDF export (jspdf + html2canvas)

---

## Architecture & Data Flow

### Core Pages (pages/)
- **login.js** / **register.js** → Auth flow; saves user object + balance + tx to localStorage
- **dashboard.js** → Main hub; displays balance, intro slides (first visit), account restriction timer, transactions
- **buy-code.js** → Purchase activation codes (₦5500); generates referral QRs; manual WhatsApp confirmation
- **activate.js** / **verify-code.js** → Unlock account restrictions via code; sets `gt_activated='true'`
- **history.js** → Browse past transactions
- **withdraw.js** → Create withdrawal requests
- **mine.js** / **profile.js** / **receipt.js** → Supporting transaction/user views

### Components (components/)
- **Layout.js** → Wraps pages with header, footer, meta tags; includes LogoHeader automatically
- **LogoHeader.js** → Main nav + theme toggle (dark/light); loads user from storage; links to WhatsApp contact

### Data Layer (utils/)
- **storage.js** → localStorage helpers (`save`/`load`/`saveUser`/`loadBalance`/`saveTx` etc.)
  - User: `gt_user` (fullName, phone, email, plan, referral)
  - Balance: `gt_balance` (numeric, JSON wrapped)
  - Transactions: `gt_transactions` (array of tx objects)
  - Activation state: `gt_activated` (boolean flag), `gt_restriction_end` (timestamp)
  - UI state: `gt_theme` (light/dark), `gt_seen_intro`, `gt_seen_welcome`
  - Last phone: `gt_last_phone` (for quick re-login after logout)
- **format.js** → `formatNaira(n)` for ₦ currency display

---

## Critical Patterns & Conventions

### 1. **Account Restriction & Activation Flow**
**Problem:** New accounts are restricted for 10 minutes until they activate via code.

**Implementation:**
- After registration, `gt_restriction_end` = now + 10 min (set in dashboard.js)
- If not activated, UI shows countdown timer + WhatsApp link to contact support
- `verify-code.js` validates code, then sets `gt_activated='true'` (disables timer)
- **Pattern:** Check both `gt_activated` AND `gt_restriction_end` timestamp in dashboard useEffect

### 2. **localStorage Null Checks**
All storage getters return safe defaults:
- `loadUser()` → null if missing → guard all usages with `if(!user) router.push('/')`
- `loadBalance()` → 0 if missing
- `loadTx()` → [] if missing

### 3. **Phone Number Input Validation**
Standard across register/login/buy-code:
- Strip non-digits: `value.replace(/\D/g, '')`
- Enforce 11 digits: `slice(0, 11)` or regex `^\d{11}$`
- Nigerian format: 08xxx or 07xxx

### 4. **Loading State Pattern**
Multi-stage loading messages:
```javascript
const startLoader = (msg = 'Loading...') => {
  setLoadingMessage(msg);
  setLoading(true);
  setTimeout(() => setLoadingMessage('Step 2...'), 600);
  setTimeout(() => setLoadingMessage('Step 3...'), 1200);
};
```

### 5. **Transaction Object Structure**
```javascript
{
  type: 'buy_code' | 'withdraw' | 'mine',
  amount: number,
  status: 'pending' | 'success' | 'failed',
  date: timestamp or ISO string,
  meta: { name, phone, email, code, ... } // extra context
}
```

### 6. **WhatsApp Integration**
All manual confirmations route via WhatsApp:
- Buy code: `https://wa.me/2348136347797` (payment confirmation)
- Activation: `https://wa.me/2347085462173` (get activation code)
- Contact: `https://wa.me/2348161662371` (general support)
Use `target="_blank" rel="noreferrer"` for security.

### 7. **Theming**
- Toggle stored in `gt_theme` localStorage
- Applied via `document.documentElement.setAttribute('data-theme', 'light'|'dark')`
- CSS vars in `styles/globals.css`
- Light mode: background #f5f5f5 (light gray), cards white, text #333333 (dark gray)
- Dark mode: uses default variables

### 8. **Layout Pattern - Single Header**
All pages wrap content with `<Layout>` component:
```javascript
<Layout>
  <div>Page content here</div>
</Layout>
```
- Layout automatically includes LogoHeader at top + footer at bottom
- Do NOT import LogoHeader separately in pages
- Do NOT use both Layout and LogoHeader - it will create duplicates

### 9. **Logout & Quick Re-login**
- User logout clears session but saves phone number
- Logout button in header: shows confirmation, clears user, redirects to login
- Login page pre-fills saved phone from `loadLastPhone()`
- Functions: `logout()`, `loadLastPhone()` in storage.js

---

## Build & Run Commands

```bash
npm install        # Install dependencies (next, react, qrcode, jspdf, html2canvas)
npm run dev        # Start dev server on http://localhost:3000
npm run build      # Production build
npm run start      # Serve production build
```

---

## Common Implementation Tasks

### Adding a New Page
1. Create `pages/newpage.js` → export default function
2. Import `Layout` from `../components/Layout` (do NOT import LogoHeader)
3. Wrap content with `<Layout>` → includes header + footer automatically
4. Access user via `loadUser()` at component mount; guard with `if(!user) router.push('/')`

### Updating Transactions
1. `loadTx()` → returns array
2. Add new transaction object → `.push(newTx)`
3. `saveTx(updatedArray)` → persists

### Sending WhatsApp Links
- Always use `https://wa.me/{number}` (+ prefix included in number)
- Text parameter: `?text=Hello...` (URL encoded)
- Open in new tab: `target="_blank" rel="noreferrer"`

### Working with Account Restrictions
- Check: `const activated = localStorage.getItem('gt_activated') === 'true'`
- Check timer: `const end = localStorage.getItem('gt_restriction_end'); const ms = parseInt(end) - Date.now();`
- Set on activation: `localStorage.setItem('gt_activated', 'true')`

---

## Key Files to Know
- pages/_app.js — Root wrapper (minimal; imports styles)
- components/Layout.js — Page layout + footer + LogoHeader
- components/LogoHeader.js — Header with nav + theme + logout button
- utils/storage.js — All localStorage operations
- styles/globals.css — Theme vars, animations, card styles
- pages/dashboard.js — Account restrictions + main flow (longest file—reference for patterns)

---

## Important Notes
- **No Backend API**: All state is client-side. Real features require API integration.
- **Browser-Only**: Check `typeof window !== 'undefined'` before accessing localStorage.
- **Referral System**: User can generate referral QR (not fully shown but data saved in user object).
- **Transaction History**: Persists via localStorage; cleared only on explicit user action.
- **CSS/Theming**: Use CSS variables for light/dark theme support. Never hardcode colors.
- **Logo**: Uses `/public/logo.png` - update all image src references to use logo.png not logo.svg
