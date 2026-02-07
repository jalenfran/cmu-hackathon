import React, { useEffect, useRef, useState } from 'react';
import { DashboardStats } from '../../types/events';
import { formatCurrency } from '../../utils/formatters';
import { Activity, AlertTriangle, ShieldCheck, ShieldOff, DollarSign, Gavel, TrendingUp } from 'lucide-react';

interface StatsOverviewProps {
  stats: DashboardStats;
}

function AnimatedNumber({ value, prefix = '' }: { value: string; prefix?: string }) {
  const [displayValue, setDisplayValue] = useState(value);
  const prevRef = useRef(value);

  useEffect(() => {
    if (prevRef.current !== value) {
      prevRef.current = value;
      setDisplayValue(value);
    }
  }, [value]);

  return (
    <span key={displayValue} className="inline-block animate-count-up">
      {prefix}{displayValue}
    </span>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
  glow,
  large = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  glow?: string;
  large?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 rounded-xl px-4 py-2 border transition-all duration-300 ${glow || ''}`}
      style={{
        background: `linear-gradient(135deg, ${color}08 0%, transparent 100%)`,
        borderColor: `${color}20`,
      }}
    >
      <div
        className="flex-shrink-0 p-1.5 rounded-lg"
        style={{ backgroundColor: `${color}15`, color }}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-[10px] text-gray-500 uppercase tracking-[0.15em] font-medium">{label}</div>
        <div className={`font-bold text-white truncate ${large ? 'text-xl money-saved-glow' : 'text-lg'}`}>
          <AnimatedNumber value={value} />
        </div>
      </div>
    </div>
  );
}

export function StatsOverview({ stats }: StatsOverviewProps) {
  return (
    <div className="col-span-4 grid grid-cols-7 gap-2">
      <StatCard
        icon={<Activity size={18} />}
        label="Transactions"
        value={stats.total_transactions.toLocaleString()}
        color="#10b981"
        glow="stat-glow-emerald"
      />
      <StatCard
        icon={<AlertTriangle size={18} />}
        label="Flagged"
        value={stats.flagged_count.toString()}
        color="#f59e0b"
        glow="stat-glow-amber"
      />
      <StatCard
        icon={<ShieldOff size={18} />}
        label="Blocked"
        value={stats.blocked_count.toString()}
        color="#ef4444"
        glow="stat-glow-red"
      />
      <StatCard
        icon={<ShieldCheck size={18} />}
        label="Cleared"
        value={stats.cleared_count.toString()}
        color="#10b981"
        glow="stat-glow-emerald"
      />
      <StatCard
        icon={<Gavel size={18} />}
        label="Disputes"
        value={stats.disputes_filed.toString()}
        color="#10b981"
        glow="stat-glow-emerald"
      />
      <StatCard
        icon={<DollarSign size={18} />}
        label="Money Saved"
        value={formatCurrency(stats.money_saved)}
        color="#10b981"
        glow="stat-glow-emerald"
        large
      />
      <StatCard
        icon={<TrendingUp size={18} />}
        label="Volume"
        value={formatCurrency(stats.total_amount)}
        color="#10b981"
        glow="stat-glow-emerald"
      />
    </div>
  );
}
