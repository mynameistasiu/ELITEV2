import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { loadBalance, loadTx } from '../utils/storage';

const QUICK_PROMPTS = [
  'Summarize my activity',
  'How do I withdraw?',
  'Where are my rewards?',
];

const naira = (amount) => `₦${Number(amount || 0).toLocaleString('en-NG')}`;

function getLocalSummary() {
  const transactions = loadTx();
  const balance = loadBalance();
  const pending = transactions.filter((tx) => String(tx.status || '').toLowerCase() === 'pending').length;
  const latest = transactions[0];

  return `Your saved wallet balance is ${naira(balance)}. You have ${transactions.length} recorded ${transactions.length === 1 ? 'transaction' : 'transactions'}${pending ? `, including ${pending} pending` : ''}${latest ? `. Your latest activity is ${String(latest.type || 'transaction').replace(/[_-]/g, ' ')} (${String(latest.status || 'recorded').toLowerCase()})` : ''}.`;
}

function answerPrompt(prompt) {
  const query = prompt.toLowerCase();

  if (/summar|activity|transaction|history|spend|record/.test(query)) {
    return {
      text: getLocalSummary(),
      link: { href: '/history', label: 'View activity' },
    };
  }

  if (/withdraw|cash ?out|bank|transfer/.test(query)) {
    return {
      text: 'Open Withdraw to review the requirements, choose a saved bank account, and check the amount before submitting.',
      link: { href: '/withdraw', label: 'Open withdrawals' },
    };
  }

  if (/reward|mine|pulse|earn/.test(query)) {
    return {
      text: 'Pulse Miner shows your current mining session and available reward actions. Check the session details before claiming.',
      link: { href: '/mine', label: 'Open Pulse Miner' },
    };
  }

  if (/balance|wallet|fund/.test(query)) {
    return {
      text: `Your saved wallet balance is ${naira(loadBalance())}. The dashboard shows your account overview and recent activity.`,
      link: { href: '/dashboard', label: 'Open dashboard' },
    };
  }

  if (/account|profile|phone|name|detail/.test(query)) {
    return {
      text: 'You can review your saved account details from Profile. Keep your sign-in information private.',
      link: { href: '/profile', label: 'Open profile' },
    };
  }

  return {
    text: 'I can help you find your balance, activity, Pulse Miner rewards, withdrawals, or profile. Choose a prompt below or ask about one of those topics.',
    link: null,
  };
}

export default function WalletGuide() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const handleEscape = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [open]);

  const ask = (question) => {
    const cleanQuestion = question.trim();
    if (!cleanQuestion) return;
    setMessages((current) => [
      ...current,
      { id: `${Date.now()}-q`, role: 'user', text: cleanQuestion },
      { id: `${Date.now()}-a`, role: 'guide', ...answerPrompt(cleanQuestion) },
    ]);
    setInput('');
  };

  return (
    <div className="wallet-guide">
      {open && (
        <section className="wallet-guide__panel" aria-label="Smart Wallet Guide">
          <div className="wallet-guide__header">
            <div className="wallet-guide__identity">
              <span className="wallet-guide__avatar" aria-hidden="true">E</span>
              <div>
                <strong>Smart Wallet Guide</strong>
                <small>Private, on-device help</small>
              </div>
            </div>
            <button className="wallet-guide__close" type="button" onClick={() => setOpen(false)} aria-label="Close wallet guide">×</button>
          </div>

          <div className="wallet-guide__body" aria-live="polite">
            {messages.length === 0 ? (
              <div className="wallet-guide__welcome">
                <strong>What can I help you find?</strong>
                <p>Get a quick summary or find the right wallet tool.</p>
                <button type="button" className="wallet-guide__summary" onClick={() => ask('Summarize my activity')}>
                  Show my activity summary <span aria-hidden="true">→</span>
                </button>
              </div>
            ) : messages.map((message) => (
              <div className={`wallet-guide__message wallet-guide__message--${message.role}`} key={message.id}>
                <p>{message.text}</p>
                {message.link && <Link href={message.link.href} onClick={() => setOpen(false)}>{message.link.label} →</Link>}
              </div>
            ))}
          </div>

          <div className="wallet-guide__prompts">
            {QUICK_PROMPTS.map((prompt) => (
              <button type="button" key={prompt} onClick={() => ask(prompt)}>{prompt}</button>
            ))}
          </div>

          <form className="wallet-guide__form" onSubmit={(event) => { event.preventDefault(); ask(input); }}>
            <input
              ref={inputRef}
              aria-label="Ask the Wallet Guide"
              placeholder="Ask about your wallet…"
              value={input}
              onChange={(event) => setInput(event.target.value)}
            />
            <button type="submit" disabled={!input.trim()} aria-label="Send question">Send</button>
          </form>
          <p className="wallet-guide__privacy">Uses saved data on this device. Not financial advice.</p>
        </section>
      )}

      <button
        className="wallet-guide__launcher"
        type="button"
        aria-expanded={open}
        aria-label={open ? 'Close Smart Wallet Guide' : 'Open Smart Wallet Guide'}
        onClick={() => {
          setOpen((value) => !value);
          window.setTimeout(() => inputRef.current?.focus(), 0);
        }}
      >
        <span className="wallet-guide__launcher-icon" aria-hidden="true">✦</span>
        <span>{open ? 'Close guide' : 'Wallet guide'}</span>
      </button>
    </div>
  );
}
