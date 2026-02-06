import React from 'react';
import { DashboardStats } from '../../types/events';
import { formatCurrency } from '../../utils/formatters';
import { Activity, AlertTriangle, ShieldCheck, ShieldOff } from 'lucide-react';

interface StatsOverviewProps {
  stats: DashboardStats;
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="flex items-center gap-3 bg-gray-800/50 rounded-xl px-4 py-2 border border-gray-700/30">
      <div style={{ color }} className="flex-shrink-0">{icon}</div>
      <div>
        <div className="text-xs text-gray-400 uppercase tracking-wider">{label}</div>
        <div className="text-lg font-bold text-white">{value}</div>
      </div>
    </div>
  );
}

export function StatsOverview({ stats }: StatsOverviewProps) {
  return (
    <div className="col-span-4 grid grid-cols-5 gap-3">
      <StatCard
        icon={<Activity size={20} />}
        label="Transactions"
        value={stats.total_transactions.toLocaleString()}
        color="#22c55e"
      />
      <StatCard
        icon={<AlertTriangle size={20} />}
        label="Flagged"
        value={stats.flagged_count.toString()}
        color="#f59e0b"
      />
      <StatCard
        icon={<ShieldOff size={20} />}
        label="Blocked"
        value={stats.blocked_count.toString()}
        color="#ef4444"
      />
      <StatCard
        icon={<ShieldCheck size={20} />}
        label="Cleared"
        value={stats.cleared_count.toString()}
        color="#06b6d4"
      />
      <StatCard
        icon={<Activity size={20} />}
        label="Total Volume"
        value={formatCurrency(stats.total_amount)}
        color="#a855f7"
      />
    </div>
  );
}
