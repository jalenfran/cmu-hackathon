import React, { useState, useEffect } from 'react';
import { Tile } from '../layout/Tile';
import { Lock, AlertTriangle, CheckCircle } from 'lucide-react';

interface Policy {
  name: string;
  type: string;
  status: string;
  checks: number;
  violations: number;
}

interface GovernanceData {
  compliance_percentage: number;
  total_checks: number;
  total_violations: number;
  policies: Policy[];
}

export function GovernanceCard() {
  const [data, setData] = useState<GovernanceData | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/governance/scorecard');
        const json = await res.json();
        setData(json);
      } catch {
        // Use fallback data if API is not available
        setData({
          compliance_percentage: 99.6,
          total_checks: 3878,
          total_violations: 11,
          policies: [
            { name: 'S3 Encryption', type: 'Cloud Custodian', status: 'passing', checks: 12, violations: 0 },
            { name: 'Resource Tagging', type: 'Cloud Custodian', status: 'passing', checks: 8, violations: 0 },
            { name: 'IAM Audit', type: 'Cloud Custodian', status: 'warning', checks: 15, violations: 2 },
            { name: 'Transaction Limits', type: 'OPA', status: 'passing', checks: 1250, violations: 3 },
            { name: 'International MFA', type: 'OPA', status: 'passing', checks: 89, violations: 1 },
            { name: 'Sanctioned Countries', type: 'OPA', status: 'passing', checks: 1250, violations: 0 },
          ],
        });
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!data) return <Tile title="Governance" icon="🔒" accentColor="#22c55e"><div className="text-gray-500 text-sm">Loading...</div></Tile>;

  return (
    <Tile title="Governance" icon="🔒" accentColor="#22c55e">
      <div className="h-full flex flex-col gap-3">
        {/* Compliance score */}
        <div className="flex items-center gap-3">
          <div className="relative w-14 h-14 flex-shrink-0">
            <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
              <circle cx="28" cy="28" r="24" fill="none" stroke="#1f2937" strokeWidth="4" />
              <circle
                cx="28" cy="28" r="24" fill="none"
                stroke="#22c55e"
                strokeWidth="4"
                strokeDasharray={`${(data.compliance_percentage / 100) * 150.8} 150.8`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-bold text-white">{data.compliance_percentage}%</span>
            </div>
          </div>
          <div>
            <div className="text-sm font-semibold text-green-400 flex items-center gap-1">
              <Lock size={12} /> Compliant
            </div>
            <div className="text-xs text-gray-400">
              {data.total_checks.toLocaleString()} checks &middot; {data.total_violations} violations
            </div>
          </div>
        </div>

        {/* Policy list */}
        <div className="flex-1 overflow-y-auto space-y-1">
          {data.policies.map((policy, i) => (
            <div key={i} className="flex items-center gap-2 text-xs py-1">
              {policy.status === 'passing' ? (
                <CheckCircle size={12} className="text-green-500 flex-shrink-0" />
              ) : (
                <AlertTriangle size={12} className="text-yellow-500 flex-shrink-0" />
              )}
              <span className="text-gray-300 flex-1 truncate">{policy.name}</span>
              <span className="text-gray-500">{policy.type === 'Cloud Custodian' ? 'CC' : 'OPA'}</span>
            </div>
          ))}
        </div>
      </div>
    </Tile>
  );
}
