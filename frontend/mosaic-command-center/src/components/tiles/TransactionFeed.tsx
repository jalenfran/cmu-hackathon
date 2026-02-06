import React from 'react';
import { TransactionEvent } from '../../types/events';
import { formatCurrency, timeAgo, getRiskColor } from '../../utils/formatters';
import { Tile } from '../layout/Tile';

interface TransactionFeedProps {
  transactions: TransactionEvent[];
}

export function TransactionFeed({ transactions }: TransactionFeedProps) {
  return (
    <Tile title="Live Transactions" icon="📡" className="col-span-2" accentColor="#22c55e">
      <div className="overflow-y-auto h-full space-y-1.5 pr-1 scrollbar-thin">
        {transactions.length === 0 && (
          <div className="text-gray-500 text-sm text-center py-8">
            Waiting for transactions...
          </div>
        )}
        {transactions.slice(0, 50).map((txn, i) => (
          <div
            key={txn.id + i}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-300 ${
              txn.is_anomaly
                ? 'bg-red-900/30 border border-red-500/30 animate-pulse-once'
                : 'bg-gray-800/30 border border-transparent hover:border-gray-700/50'
            }`}
            style={{
              animation: i === 0 ? 'slideIn 0.3s ease-out' : undefined,
            }}
          >
            {/* Risk indicator dot */}
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: getRiskColor(txn.risk_score) }}
            />

            {/* Merchant & category */}
            <div className="flex-1 min-w-0">
              <div className="text-sm text-white truncate">{txn.merchant_name}</div>
              <div className="text-xs text-gray-500">
                {txn.category} &middot; {txn.city || 'Online'}, {txn.country}
              </div>
            </div>

            {/* Amount */}
            <div className={`text-sm font-mono font-semibold ${txn.is_anomaly ? 'text-red-400' : 'text-white'}`}>
              {formatCurrency(txn.amount)}
            </div>

            {/* Time */}
            <div className="text-xs text-gray-500 w-16 text-right flex-shrink-0">
              {timeAgo(txn.timestamp)}
            </div>
          </div>
        ))}
      </div>
    </Tile>
  );
}
