import { useEffect, useState } from "react";

const withdrawals = [
  { username: "User8393", amount: 105420 },
  { username: "User2841", amount: 82750 },
  { username: "User7295", amount: 119680 },
  { username: "User6182", amount: 94300 },
  { username: "User4739", amount: 127150 },
  { username: "User9056", amount: 76890 },
  { username: "User3518", amount: 110250 },
  { username: "User8624", amount: 98740 },
  { username: "User1947", amount: 121500 },
  { username: "User5362", amount: 73600 },
  { username: "User7481", amount: 115890 },
  { username: "User3206", amount: 89450 },
  { username: "User6719", amount: 103780 },
  { username: "User4583", amount: 128600 },
  { username: "User9172", amount: 84120 },
  { username: "User2638", amount: 96350 },
  { username: "User5847", amount: 122740 },
  { username: "User7015", amount: 71950 },
  { username: "User3964", amount: 108630 },
  { username: "User8257", amount: 91280 },
  { username: "User1429", amount: 117450 },
  { username: "User6531", amount: 79300 },
  { username: "User4876", amount: 124890 },
  { username: "User9304", amount: 100650 },
  { username: "User2168", amount: 86740 },
  { username: "User5742", amount: 112980 },
  { username: "User8091", amount: 75420 },
  { username: "User3456", amount: 126300 },
  { username: "User6927", amount: 93850 },
  { username: "User1584", amount: 107200 },
  { username: "User7643", amount: 120450 },
  { username: "User4317", amount: 81670 },
  { username: "User2865", amount: 114300 },
  { username: "User9571", amount: 97560 },
  { username: "User6038", amount: 129100 },
  { username: "User3724", amount: 88920 },
  { username: "User8159", amount: 104750 },
  { username: "User2496", amount: 72800 },
  { username: "User5683", amount: 118640 },
  { username: "User7240", amount: 99350 },
];

function shuffledWithdrawals() {
  const shuffled = [...withdrawals];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }

  return shuffled;
}

export default function WithdrawalActivityBanner({ rotationInterval = 4000 }) {
  const [sequence, setSequence] = useState(withdrawals);
  const [activeIndex, setActiveIndex] = useState(0);
  const withdrawal = sequence[activeIndex];
  const formattedAmount = `₦${withdrawal.amount.toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  useEffect(() => {
    setSequence(shuffledWithdrawals());
    const intervalId = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % sequence.length);
    }, rotationInterval);

    return () => window.clearInterval(intervalId);
  }, [rotationInterval, sequence.length]);

  return (
    <div className="container withdrawal-activity-wrap">
      <aside className="withdrawal-activity" aria-label="Sample withdrawal activity">
        <span className="withdrawal-activity__sample">
          <span className="withdrawal-activity__dot" aria-hidden="true" />
          
        </span>
        <svg
          className="withdrawal-activity__trend"
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m3 17 6-6 4 4 8-8" />
          <path d="M15 7h6v6" />
        </svg>
        <span className="withdrawal-activity__message" key={withdrawal.username}>
          <strong>{withdrawal.username}</strong>
          <span> made a withdrawal of</span>
          <strong className="withdrawal-activity__amount">{formattedAmount}</strong>
        </span>
        </aside>
      <style jsx>{`
        .withdrawal-activity-wrap {
          margin-top: 8px;
          margin-bottom: 0;
          padding-top: 0;
          padding-bottom: 0;
        }

        .withdrawal-activity {
          display: flex;
          min-height: 50px;
          align-items: center;
          gap: 10px;
          padding: 9px 14px;
          border: 1px solid #b9e4ca;
          border-radius: 999px;
          background: #effaf2;
          color: #245b3b;
          box-shadow: 0 3px 12px rgba(22, 91, 55, 0.05);
        }

        .withdrawal-activity__sample {
          display: inline-flex;
          flex: 0 0 auto;
          align-items: center;
          gap: 6px;
          padding: 4px 9px;
          border-radius: 999px;
          background: #197a4a;
          color: #fff;
          font-size: 9px;
          font-weight: 850;
          letter-spacing: 0.06em;
          line-height: 1;
        }

        .withdrawal-activity__dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #fff;
        }

        .withdrawal-activity__trend {
          flex: 0 0 auto;
          color: #208550;
        }

        .withdrawal-activity__message {
          display: flex;
          min-width: 0;
          flex: 1;
          align-items: baseline;
          gap: 5px;
          animation: activity-enter 280ms ease both;
          font-size: 12px;
          line-height: 1.35;
        }

        .withdrawal-activity__message strong {
          color: #172b24;
          font-weight: 800;
        }

        .withdrawal-activity__message > span {
          color: #64756b;
          white-space: nowrap;
        }

        .withdrawal-activity__amount {
          color: #086644 !important;
          white-space: nowrap;
        }

        .withdrawal-activity__disclaimer {
          flex: 0 0 auto;
          color: #587263;
          font-size: 9px;
          font-weight: 650;
          white-space: nowrap;
        }

        @keyframes activity-enter {
          from {
            opacity: 0;
            transform: translateY(4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 560px) {
          .withdrawal-activity {
            flex-wrap: wrap;
            gap: 7px;
            padding: 10px 12px;
            border-radius: 17px;
          }

          .withdrawal-activity__message {
            flex-wrap: wrap;
            gap: 3px 5px;
            font-size: 11px;
          }

          .withdrawal-activity__disclaimer {
            width: 100%;
            margin-left: 27px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .withdrawal-activity__message {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
