import React, { useState, useEffect } from 'react';
import { Tile } from '../layout/Tile';
import { API_URL } from '../../config';
import {
  Server,
  GitBranch,
  Zap,
  Database,
  CheckCircle,
  XCircle,
  Cpu,
  Search,
} from 'lucide-react';

interface HealthData {
  status: string;
  nessie_connected: boolean;
  anomaly_engine: boolean;
  producer_active: boolean;
  vector_store_enabled: boolean;
  neo4j_connected: boolean;
  redis_connected: boolean;
}

function StatusRow({
  icon,
  label,
  connected,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  connected: boolean;
  color: string;
}) {
  return (
    <div className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-gray-800/20 border border-gray-700/15">
      <div className="flex items-center gap-2">
        <span style={{ color: connected ? color : '#4b5563' }}>{icon}</span>
        <span className="text-xs text-gray-300 font-medium">{label}</span>
      </div>
      <div className="flex items-center gap-1.5">
        {connected ? (
          <>
            <CheckCircle size={12} className="text-emerald-400" />
            <span className="text-[10px] text-emerald-400 font-mono tracking-wider">
              ONLINE
            </span>
          </>
        ) : (
          <>
            <XCircle size={12} className="text-gray-500" />
            <span className="text-[10px] text-gray-500 font-mono tracking-wider">
              OFFLINE
            </span>
          </>
        )}
      </div>
    </div>
  );
}

export function InfraStatus() {
  const [health, setHealth] = useState<HealthData | null>(null);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const res = await fetch(`${API_URL}/api/health`);
        const data = await res.json();
        setHealth(data);
      } catch {
        setHealth(null);
      }
    };
    fetchHealth();
    const interval = setInterval(fetchHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  const services = health
    ? [
        {
          icon: <Database size={14} />,
          label: 'Nessie API',
          connected: health.nessie_connected,
          color: '#22c55e',
        },
        {
          icon: <Cpu size={14} />,
          label: 'Anomaly Engine',
          connected: health.anomaly_engine,
          color: '#f59e0b',
        },
        {
          icon: <Search size={14} />,
          label: 'FAISS Vector Store',
          connected: health.vector_store_enabled,
          color: '#a855f7',
        },
        {
          icon: <GitBranch size={14} />,
          label: 'Neo4j Graph DB',
          connected: health.neo4j_connected,
          color: '#3b82f6',
        },
        {
          icon: <Zap size={14} />,
          label: 'Redis Cache',
          connected: health.redis_connected,
          color: '#dc2626',
        },
        {
          icon: <Server size={14} />,
          label: 'Redpanda Kafka',
          connected: health.producer_active,
          color: '#ef4444',
        },
      ]
    : [];

  const onlineCount = services.filter((s) => s.connected).length;

  const badge = health ? (
    <span
      className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono border ${
        onlineCount === services.length
          ? 'bg-emerald-900/30 text-emerald-400 border-emerald-500/30'
          : 'bg-amber-900/30 text-amber-400 border-amber-500/30'
      }`}
    >
      {onlineCount}/{services.length}
    </span>
  ) : null;

  return (
    <Tile
      title="Infrastructure"
      accentColor="#ea580c"
      className="h-full"
      badge={badge}
    >
      <div className="space-y-1.5 overflow-y-auto h-full pr-1">
        {!health && (
          <div className="text-gray-500 text-sm text-center py-8 flex flex-col items-center gap-2">
            <div className="w-5 h-5 border-2 border-emerald-500/50 border-t-transparent rounded-full animate-spin" />
            Checking services...
          </div>
        )}
        {services.map((svc, i) => (
          <StatusRow key={i} {...svc} />
        ))}
      </div>
    </Tile>
  );
}
