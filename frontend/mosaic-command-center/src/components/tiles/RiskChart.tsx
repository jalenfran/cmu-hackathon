import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TransactionEvent } from '../../types/events';
import { Tile } from '../layout/Tile';

interface RiskChartProps {
  transactions: TransactionEvent[];
}

export function RiskChart({ transactions }: RiskChartProps) {
  const chartData = useMemo(() => {
    return transactions
      .slice(0, 50)
      .reverse()
      .map((txn, i) => ({
        index: i,
        time: new Date(txn.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        risk: Math.round(txn.risk_score * 100),
        amount: txn.amount,
      }));
  }, [transactions]);

  return (
    <Tile title="Risk Timeline" icon="📈" accentColor="#f59e0b">
      <div className="h-full w-full">
        {chartData.length === 0 ? (
          <div className="text-gray-500 text-sm text-center py-8">
            Collecting data...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="50%" stopColor="#f59e0b" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="time"
                tick={{ fill: '#6b7280', fontSize: 10 }}
                axisLine={{ stroke: '#374151' }}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: '#6b7280', fontSize: 10 }}
                axisLine={{ stroke: '#374151' }}
                tickLine={false}
                width={30}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  fontSize: 12,
                }}
                labelStyle={{ color: '#9ca3af' }}
              />
              <Area
                type="monotone"
                dataKey="risk"
                stroke="#f59e0b"
                strokeWidth={2}
                fill="url(#riskGradient)"
                animationDuration={300}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </Tile>
  );
}
