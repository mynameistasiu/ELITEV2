// utils/storage.js
// Robust localStorage helpers for ElitePay Wallet
const USER_KEY = 'gt_user';
const BALANCE_KEY = 'gt_balance';
const TX_KEY = 'gt_transactions';
const PENDING_WITHDRAW = 'gt_pending_withdraw';
const LAST_PHONE = 'gt_last_phone'; // Store last used phone for quick login
const TASK_CLAIMS_KEY = 'gt_task_claims';

function isBrowser() {
  return typeof window !== 'undefined' && !!window.localStorage;
}

export function save(key, value) {
  if (!isBrowser()) return false;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.error('storage.save error', e);
    return false;
  }
}

export function load(key) {
  if (!isBrowser()) return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.error('storage.load error', e);
    return null;
  }
}

/* ---------------- User & balance ---------------- */
export function saveUser(u) {
  const saved = save(USER_KEY, u);
  if (!saved) return false;

  // Also save phone number for quick login later
  if (u && u.phone) {
    try {
      localStorage.setItem(LAST_PHONE, u.phone);
    } catch (e) {
      console.error('saveLastPhone error', e);
    }
  }
  if (isBrowser()) window.dispatchEvent(new Event('elitepay:auth-changed'));
  return true;
}
export function loadUser() { return load(USER_KEY); }

export function loadLastPhone() {
  if (!isBrowser()) return null;
  try {
    return localStorage.getItem(LAST_PHONE);
  } catch (e) {
    console.error('loadLastPhone error', e);
    return null;
  }
}

export function logout() {
  if (!isBrowser()) return;
  try {
    // Clear user session but keep phone number for next login
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(BALANCE_KEY);
    // Note: We keep gt_transactions, gt_last_phone, gt_theme, etc. so they persist
  } catch (e) {
    console.error('logout error', e);
  }
  window.dispatchEvent(new Event('elitepay:auth-changed'));
}

export function saveBalance(n) {
  // store numeric balance (but keep it JSON serializable)
  if (!isBrowser()) return;
  try {
    const val = Number(n || 0);
    localStorage.setItem(BALANCE_KEY, JSON.stringify(val));
  } catch (e) {
    console.error('saveBalance error', e);
  }
}
export function loadBalance() {
  const v = load(BALANCE_KEY);
  return (v === null || v === undefined) ? 0 : Number(v || 0);
}

/* ---------------- Transactions ----------------
 - saveTx(tx) will accept either:
   * an array -> replace the stored transaction array
   * an object -> append normalized transaction to the head
 - normalize ensures receipt code can read consistent fields:
   id, type, amount (Number), status, created_at, fullName, phone, meta, account, bank
*/
export function saveTx(txOrArray) {
  if (!isBrowser()) return;
  try {
    if (Array.isArray(txOrArray)) {
      // replace entire tx array
      save(TX_KEY, txOrArray);
      return;
    }

    const prev = load(TX_KEY) || [];
    // normalize tx object
    const user = loadUser() || {};
    const normalized = {
      id: txOrArray.id || `tx-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
      type: txOrArray.type || 'unknown',
      amount: Number(txOrArray.amount || 0),
      status: txOrArray.status || 'pending',
      created_at: txOrArray.created_at || new Date().toISOString(),
      // user fields
      fullName: txOrArray.fullName || txOrArray.initiatedBy || user.fullName || '',
      phone: txOrArray.phone || user.phone || '',
      // meta: free-form object for beneficiary, remark, etc.
      meta: (txOrArray.meta && typeof txOrArray.meta === 'object') ? txOrArray.meta : (txOrArray.meta ? { note: txOrArray.meta } : {}),
      // legacy / convenience fields
      account: txOrArray.account || undefined,
      bank: txOrArray.bank || undefined
    };

    prev.unshift(normalized);
    save(TX_KEY, prev);
  } catch (e) {
    console.error('saveTx error', e);
  }
}

export function loadTx() {
  const t = load(TX_KEY);
  return Array.isArray(t) ? t : [];
}

export function claimTaskReward(taskId, amount) {
  if (!isBrowser()) return { status: 'error' };

  const normalizedTaskId = String(taskId || '').trim();
  const reward = Number(amount);
  const user = loadUser();

  if (!normalizedTaskId || !Number.isFinite(reward) || reward <= 0 || !user) {
    console.error('claimTaskReward error: invalid task, reward, or user');
    return { status: 'error' };
  }

  let previousBalance;
  let previousTransactions;
  let previousClaims;

  try {
    const balanceRaw = localStorage.getItem(BALANCE_KEY);
    const transactionsRaw = localStorage.getItem(TX_KEY);
    const claimsRaw = localStorage.getItem(TASK_CLAIMS_KEY);

    const balance = balanceRaw === null ? 0 : Number(JSON.parse(balanceRaw));
    const transactions =
      transactionsRaw === null ? [] : JSON.parse(transactionsRaw);
    const claims = claimsRaw === null ? {} : JSON.parse(claimsRaw);

    if (
      !Number.isFinite(balance) ||
      !Array.isArray(transactions) ||
      !claims ||
      typeof claims !== 'object' ||
      Array.isArray(claims)
    ) {
      console.error('claimTaskReward error: wallet data is invalid');
      return { status: 'error' };
    }

    const accountKey = String(user.phone || user.email || user.fullName || 'account');
    const accountClaims = claims[accountKey] || {};
    if (accountClaims[normalizedTaskId]) {
      return { status: 'already-claimed', balance };
    }

    previousBalance = balanceRaw;
    previousTransactions = transactionsRaw;
    previousClaims = claimsRaw;

    const createdAt = new Date().toISOString();
    const updatedTransactions = [
      {
        id: `task-reward-${accountKey}-${normalizedTaskId}`,
        type: 'task_reward',
        amount: reward,
        status: 'success',
        created_at: createdAt,
        fullName: user.fullName || '',
        phone: user.phone || '',
        meta: {
          taskId: normalizedTaskId,
          completion: 'opened',
          creditedAt: createdAt,
        },
      },
      ...transactions,
    ];
    const updatedClaims = {
      ...claims,
      [accountKey]: {
        ...accountClaims,
        [normalizedTaskId]: {
          amount: reward,
          completedAt: createdAt,
        },
      },
    };

    localStorage.setItem(BALANCE_KEY, JSON.stringify(balance + reward));
    localStorage.setItem(TX_KEY, JSON.stringify(updatedTransactions));
    localStorage.setItem(TASK_CLAIMS_KEY, JSON.stringify(updatedClaims));
    window.dispatchEvent(new Event('elitepay:wallet-changed'));

    return { status: 'claimed', balance: balance + reward };
  } catch (error) {
    console.error('claimTaskReward error', error);

    const restore = (key, previousValue) => {
      try {
        if (previousValue === undefined) return;
        if (previousValue === null) {
          localStorage.removeItem(key);
        } else {
          localStorage.setItem(key, previousValue);
        }
      } catch (restoreError) {
        console.error('claimTaskReward rollback error', restoreError);
      }
    };

    restore(BALANCE_KEY, previousBalance);
    restore(TX_KEY, previousTransactions);
    restore(TASK_CLAIMS_KEY, previousClaims);
    return { status: 'error' };
  }
}

export function claimMineReward(sessionId, amount, meta = {}) {
  if (!isBrowser()) return { status: 'error' };

  const normalizedSessionId = String(sessionId || '').trim();
  const reward = Number(amount);
  const user = loadUser();
  const accountKey = String(user?.phone || user?.email || user?.fullName || '').trim();

  if (!normalizedSessionId || !Number.isFinite(reward) || reward <= 0 || !accountKey) {
    console.error('claimMineReward error: invalid session, reward, or user');
    return { status: 'error' };
  }

  const claimsKey = 'ep_mine_claims';
  const pendingKey = 'ep_mine_pending_reward';
  let previousBalance;
  let previousTransactions;
  let previousClaims;
  let previousPending;

  try {
    const balanceRaw = localStorage.getItem(BALANCE_KEY);
    const transactionsRaw = localStorage.getItem(TX_KEY);
    const claimsRaw = localStorage.getItem(claimsKey);
    const pendingRaw = localStorage.getItem(pendingKey);
    const balance = balanceRaw === null ? 0 : Number(JSON.parse(balanceRaw));
    const transactions = transactionsRaw === null ? [] : JSON.parse(transactionsRaw);
    const claims = claimsRaw === null ? {} : JSON.parse(claimsRaw);
    const pending = pendingRaw === null ? null : JSON.parse(pendingRaw);

    if (
      !Number.isFinite(balance) ||
      !Array.isArray(transactions) ||
      !claims ||
      typeof claims !== 'object' ||
      Array.isArray(claims)
    ) {
      console.error('claimMineReward error: wallet data is invalid');
      return { status: 'error' };
    }

    const accountClaims = claims[accountKey] || {};
    if (accountClaims[normalizedSessionId]) {
      return { status: 'already-claimed', balance };
    }

    if (
      !pending ||
      pending.sessionId !== normalizedSessionId ||
      pending.accountKey !== accountKey ||
      Number(pending.amount) !== reward
    ) {
      console.error('claimMineReward error: pending mining reward does not match');
      return { status: 'error' };
    }

    previousBalance = balanceRaw;
    previousTransactions = transactionsRaw;
    previousClaims = claimsRaw;
    previousPending = pendingRaw;

    const createdAt = new Date().toISOString();
    const updatedTransactions = [
      {
        id: `mine-reward-${accountKey}-${normalizedSessionId}`,
        type: 'mine',
        amount: reward,
        status: 'claimed',
        created_at: createdAt,
        fullName: user.fullName || '',
        phone: user.phone || '',
        meta: {
          ...meta,
          sessionId: normalizedSessionId,
          simulation: true,
          creditedAt: createdAt,
        },
      },
      ...transactions,
    ];
    const updatedClaims = {
      ...claims,
      [accountKey]: {
        ...accountClaims,
        [normalizedSessionId]: {
          amount: reward,
          claimedAt: createdAt,
        },
      },
    };

    localStorage.setItem(BALANCE_KEY, JSON.stringify(balance + reward));
    localStorage.setItem(TX_KEY, JSON.stringify(updatedTransactions));
    localStorage.setItem(claimsKey, JSON.stringify(updatedClaims));
    localStorage.removeItem(pendingKey);
    window.dispatchEvent(new Event('elitepay:wallet-changed'));

    return { status: 'claimed', balance: balance + reward };
  } catch (error) {
    console.error('claimMineReward error', error);

    const restore = (key, previousValue) => {
      try {
        if (previousValue === undefined) return;
        if (previousValue === null) {
          localStorage.removeItem(key);
        } else {
          localStorage.setItem(key, previousValue);
        }
      } catch (restoreError) {
        console.error('claimMineReward rollback error', restoreError);
      }
    };

    restore(BALANCE_KEY, previousBalance);
    restore(TX_KEY, previousTransactions);
    restore(claimsKey, previousClaims);
    restore(pendingKey, previousPending);
    return { status: 'error' };
  }
}

/* ---------------- Pending withdraw ----------------
 Save structured pending withdraw so history/receipt can fallback to it.
*/
export function savePendingWithdraw(payload) {
  if (!isBrowser()) return;
  try {
    const obj = {
      account: payload.account || payload.accountNumber || payload.account_no || '',
      bank: payload.bank || payload.bankName || '',
      amount: Number(payload.amount || 0),
      created_at: payload.created_at || new Date().toISOString(),
      meta: payload.meta || {}
    };
    save(PENDING_WITHDRAW, obj);
  } catch (e) {
    console.error('savePendingWithdraw error', e);
  }
}

export function loadPendingWithdraw() {
  return load(PENDING_WITHDRAW);
}

export function clearPendingWithdraw() {
  if (!isBrowser()) return;
  try {
    localStorage.removeItem(PENDING_WITHDRAW);
  } catch (e) {
    console.error('clearPendingWithdraw error', e);
  }
}

/* ---------------- Convenience helpers ---------------- */
// Remove a tx by id (useful for admin/debug)
export function removeTxById(id) {
  if (!isBrowser()) return;
  try {
    const tx = loadTx();
    const filtered = tx.filter(t => t.id !== id);
    save(TX_KEY, filtered);
  } catch (e) {
    console.error('removeTxById error', e);
  }
}
