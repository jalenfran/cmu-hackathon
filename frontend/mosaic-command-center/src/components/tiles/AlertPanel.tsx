import React from 'react';
import { AlertEvent } from '../../types/events';
import { formatCurrency, timeAgo, getRiskColor, getRiskLevel } from '../../utils/formatters';
import { Tile } from '../layout/Tile';

interface AlertPanelProps {
  alerts: AlertEvent[];
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-900/50 text-yellow-400 border-yellow-500/30',
    investigating: 'bg-blue-900/50 text-blue-400 border-blue-500/30',
    blocked: 'bg-red-900/50 text-red-400 border-red-500/30',
    cleared: 'bg-green-900/50 text-green-400 border-green-500/30',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border ${colors[status] || colors.pending}`}>
      {status.toUpperCase()}
    </span>
  );
}

export function AlertPanel({ alerts }: AlertPanelProps) {
  return (
    <Tile title="Anomaly Alerts" icon="🚨" accentColor="#ef4444">
      <div className="overflow-y-auto h-full space-y-2 pr-1">
        {alerts.length === 0 && (
          <div className="text-gray-500 text-sm text-center py-8">
            No anomalies detected yet
          </div>
        )}
        {alerts.map((alert, i) => (
          <div
            key={alert.id}
            className="bg-red-950/30 border border-red-500/20 rounded-lg p-3 space-y-2"
            style={{
              animation: i === 0 ? 'slideIn 0.3s ease-out' : undefined,
            }}
          >
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-red-300">
                {alert.transaction.merchant_name}
              </div>
              <StatusBadge status={alert.status} />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-lg font-mono font-bold text-red-400">
                {formatCurrency(alert.transaction.amount)}
              </span>
              <span className="text-xs text-gray-400">
                {timeAgo(alert.timestamp)}
              </span>
            </div>

            {/* Risk score bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Risk Score</span>
                <span style={{ color: getRiskColor(alert.risk_score) }}>
                  {(alert.risk_score * 100).toFixed(0)}% - {getRiskLevel(alert.risk_score)}
                </span>
              </div>
              <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${alert.risk_score * 100}%`,
                    backgroundColor: getRiskColor(alert.risk_score),
                  }}
                />
              </div>
            </div>

            {/* Risk factors */}
            <div className="space-y-1">
              {alert.risk_factors.slice(0, 3).map((factor, j) => (
                <div key={j} className="text-xs text-gray-400 flex items-start gap-1">
                  <span className="text-red-500 mt-0.5">!</span>
                  <span>{factor}</span>
                </div>
              ))}
            </div>

            {/* Agent verdict */}
            {alert.agent_verdict && (
              <div className="text-xs bg-gray-800/50 rounded p-2 text-gray-300 border-l-2 border-cyan-500">
                {alert.agent_verdict}
              </div>
            )}
          </div>
        ))}
      </div>
    </Tile>
  );
}
