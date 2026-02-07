import React, { useState, useEffect } from 'react';
import { AlertEvent, AgentTrace, KYCResult } from '../../types/events';
import { formatCurrency, timeAgo, getRiskColor, getRiskLevel, getTraceColor, getTracePrefix } from '../../utils/formatters';
import { Tile } from '../layout/Tile';
import { ChevronDown, ChevronRight, Shield } from 'lucide-react';
import { API_URL } from '../../config';

interface AlertPanelProps {
  alerts: AlertEvent[];
  agentTraces?: AgentTrace[];
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-900/50 text-yellow-400 border-yellow-500/30',
    investigating: 'bg-emerald-900/50 text-emerald-400 border-emerald-500/30',
    blocked: 'bg-red-900/50 text-red-400 border-red-500/30',
    cleared: 'bg-emerald-900/50 text-emerald-400 border-emerald-500/30',
    flagged: 'bg-amber-900/50 text-amber-400 border-amber-500/30',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border ${colors[status] || colors.pending}`}>
      {status.toUpperCase()}
    </span>
  );
}

function AlertKYC({ accountId }: { accountId: string }) {
  const [kyc, setKyc] = useState<KYCResult | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/kyc/${accountId}`)
      .then(r => r.json())
      .then(data => setKyc(data))
      .catch(() => {});
  }, [accountId]);

  if (!kyc) return null;

  const kycColors: Record<string, string> = {
    low: 'text-emerald-400 border-emerald-500/30 bg-emerald-900/20',
    medium: 'text-yellow-400 border-yellow-500/30 bg-yellow-900/20',
    high: 'text-red-400 border-red-500/30 bg-red-900/20',
    critical: 'text-red-400 border-red-500/50 bg-red-900/30',
  };

  return (
    <div className={`text-xs rounded p-2 border ${kycColors[kyc.risk_level] || kycColors.low}`}>
      <div className="flex items-center gap-1 font-semibold mb-1">
        <Shield size={10} />
        KYC Identity Check: {kyc.risk_level.toUpperCase()} ({kyc.risk_score}/100)
      </div>
      {kyc.flags.map((flag, i) => (
        <div key={i} className="text-gray-400 pl-3">- {flag}</div>
      ))}
    </div>
  );
}

export function AlertPanel({ alerts, agentTraces = [] }: AlertPanelProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <Tile title="Anomaly Alerts" accentColor="#10b981">
      <div className="overflow-y-auto h-full space-y-2 pr-1 scrollbar-thin">
        {alerts.length === 0 && (
          <div className="text-gray-500 text-sm text-center py-8 flex flex-col items-center gap-2">
            <div className="w-5 h-5 border-2 border-emerald-500/50 border-t-transparent rounded-full animate-spin" />
            Monitoring for anomalies...
          </div>
        )}
        {alerts.map((alert, i) => {
          const isExpanded = expandedId === alert.id;
          const alertTraces = agentTraces.filter(t => t.alert_id === alert.id);

          return (
            <div
              key={alert.id}
              className={`bg-red-950/30 border rounded-lg p-3 space-y-2 cursor-pointer transition-all ${
                isExpanded ? 'border-red-500/40' : 'border-red-500/20 hover:border-red-500/30'
              }`}
              style={{
                animation: i === 0 ? 'slideIn 0.3s ease-out' : undefined,
              }}
              onClick={() => setExpandedId(isExpanded ? null : alert.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  {isExpanded
                    ? <ChevronDown size={12} className="text-gray-500" />
                    : <ChevronRight size={12} className="text-gray-500" />
                  }
                  <span className="text-sm font-semibold text-red-300">
                    {alert.transaction.merchant_name}
                  </span>
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

              {/* Risk factors (always show top 2, show all when expanded) */}
              <div className="space-y-1">
                {alert.risk_factors.slice(0, isExpanded ? undefined : 2).map((factor, j) => (
                  <div key={j} className="text-xs text-gray-400 flex items-start gap-1">
                    <span className="text-red-500 mt-0.5">!</span>
                    <span>{factor}</span>
                  </div>
                ))}
              </div>

              {/* Expanded section */}
              {isExpanded && (
                <div className="mt-2 space-y-2 border-t border-red-500/10 pt-2">
                  {/* Transaction details */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                    <div>
                      <span className="text-gray-500">Account: </span>
                      <span className="text-gray-300 font-mono">{alert.transaction.account_id}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Merchant ID: </span>
                      <span className="text-gray-300 font-mono">{alert.transaction.merchant_id}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Location: </span>
                      <span className="text-gray-300">
                        {alert.transaction.city || 'Unknown'}, {alert.transaction.country}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Category: </span>
                      <span className="text-gray-300">{alert.transaction.category}</span>
                    </div>
                    {alert.transaction.latitude && (
                      <div className="col-span-2">
                        <span className="text-gray-500">Coordinates: </span>
                        <span className="text-gray-300 font-mono">
                          {alert.transaction.latitude.toFixed(4)}, {alert.transaction.longitude?.toFixed(4)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* KYC Identity Risk */}
                  <AlertKYC accountId={alert.transaction.account_id} />

                  {/* Agent verdict */}
                  {alert.agent_verdict && (
                    <div className="text-xs bg-gray-800/50 rounded p-2 text-gray-300 border-l-2 border-emerald-500">
                      <div className="text-emerald-400 font-semibold mb-1">AI Agent Verdict</div>
                      {alert.agent_verdict.slice(0, 300)}{alert.agent_verdict.length > 300 ? '...' : ''}
                    </div>
                  )}

                  {/* Agent investigation trace */}
                  {alertTraces.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
                        Investigation Trace
                      </div>
                      <div className="max-h-32 overflow-y-auto space-y-0.5">
                        {alertTraces.map((trace, k) => (
                          <div key={k} className="text-xs flex gap-1">
                            <span
                              style={{ color: getTraceColor(trace.step_type) }}
                              className="font-bold flex-shrink-0"
                            >
                              {getTracePrefix(trace.step_type)}
                            </span>
                            <span className="text-gray-400 truncate">
                              {trace.content.slice(0, 120)}{trace.content.length > 120 ? '...' : ''}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Agent verdict (compact, when not expanded) */}
              {!isExpanded && alert.agent_verdict && (
                <div className="text-xs bg-gray-800/50 rounded p-2 text-gray-300 border-l-2 border-emerald-500 truncate">
                  {alert.agent_verdict.slice(0, 100)}{alert.agent_verdict.length > 100 ? '...' : ''}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Tile>
  );
}
