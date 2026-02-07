import React from 'react';
import { TransactionEvent } from '../../types/events';
import { formatCurrency, timeAgo, getRiskColor } from '../../utils/formatters';
import { Tile } from '../layout/Tile';

interface TransactionFeedProps {
  transactions: TransactionEvent[];
}

const CATEGORY_COLORS: Record<string, string> = {
  Coffee: '#059669',
  Grocery: '#10b981',
  Gas: '#047857',
  Restaurant: '#34d399',
  restaurant: '#34d399',
  Retail: '#0d9488',
  Transport: '#14b8a6',
  Online: '#0f766e',
  Subscription: '#065f46',
  Pharmacy: '#059669',
  Entertainment: '#10b981',
  Food: '#34d399',
  food: '#34d399',
  cafe: '#047857',
  store: '#0d9488',
  Tech: '#065f46',
  tech: '#065f46',
  Clothing: '#14b8a6',
  Health: '#0f766e',
  Lodging: '#059669',
  Luxury: '#047857',
  Jewelry: '#065f46',
  Electronics: '#0d9488',
  Financial: '#14b8a6',
  Unknown: '#374151',
  Gambling: '#0f766e',
  furniture_store: '#065f46',
  bar: '#059669',
  meal_takeaway: '#34d399',
  department_store: '#0d9488',
  hardware_store: '#047857',
  book_store: '#10b981',
  car_dealer: '#14b8a6',
  car_repair: '#0f766e',
};

function MerchantAvatar({ name, category }: { name: string; category: string }) {
  const letter = name.charAt(0).toUpperCase();
  const bgColor = CATEGORY_COLORS[category] || '#374151';

  return (
    <div
      className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
      style={{ backgroundColor: bgColor }}
    >
      {letter}
    </div>
  );
}

function RiskBar({ score }: { score: number }) {
  return (
    <div className="w-12 h-1 bg-gray-800 rounded-full overflow-hidden flex-shrink-0">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{
          width: `${Math.max(score * 100, 3)}%`,
          backgroundColor: getRiskColor(score),
        }}
      />
    </div>
  );
}

export function TransactionFeed({ transactions }: TransactionFeedProps) {
  const liveBadge = (
    <div className="flex items-center gap-1.5 text-xs text-emerald-400">
      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
      LIVE
    </div>
  );

  return (
    <Tile title="Live Transactions" className="col-span-2" accentColor="#10b981" badge={liveBadge}>
      <div className="overflow-y-auto h-full space-y-1 pr-1 scrollbar-thin">
        {transactions.length === 0 && (
          <div className="text-gray-500 text-sm text-center py-8 flex flex-col items-center gap-2">
            <div className="w-5 h-5 border-2 border-emerald-500/50 border-t-transparent rounded-full animate-spin" />
            Waiting for transactions...
          </div>
        )}
        {transactions.slice(0, 50).map((txn, i) => (
          <div
            key={txn.id + i}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all duration-300 ${
              txn.is_anomaly
                ? 'bg-red-950/40 border border-red-500/30 anomaly-border'
                : 'bg-gray-800/20 border border-transparent hover:bg-gray-800/40 hover:border-gray-700/30'
            }`}
            style={{
              animation: i === 0 ? 'slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)' : undefined,
            }}
          >
            {/* Merchant avatar */}
            <MerchantAvatar name={txn.merchant_name} category={txn.category} />

            {/* Merchant & category */}
            <div className="flex-1 min-w-0">
              <div className="text-sm text-white truncate font-medium">{txn.merchant_name}</div>
              <div className="text-[11px] text-gray-500">
                {txn.category} · {txn.city || 'Online'}, {txn.country}
              </div>
            </div>

            {/* Risk mini-bar */}
            <RiskBar score={txn.risk_score} />

            {/* Amount */}
            <div className={`text-sm font-mono font-bold tabular-nums ${txn.is_anomaly ? 'text-red-400' : 'text-white'}`}>
              {formatCurrency(txn.amount)}
            </div>

            {/* Time */}
            <div className="text-[11px] text-gray-600 w-14 text-right flex-shrink-0 font-mono">
              {timeAgo(txn.timestamp)}
            </div>
          </div>
        ))}
      </div>
    </Tile>
  );
}
