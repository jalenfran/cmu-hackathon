import React from 'react';
import { useWebSocket } from './hooks/useWebSocket';
import { BentoGrid } from './components/layout/BentoGrid';
import { StatsOverview } from './components/tiles/StatsOverview';
import { TransactionFeed } from './components/tiles/TransactionFeed';
import { AlertPanel } from './components/tiles/AlertPanel';
import { RiskChart } from './components/tiles/RiskChart';
import { AgentConsole } from './components/tiles/AgentConsole';
import { TopologyMap } from './components/tiles/TopologyMap';
import { GovernanceCard } from './components/tiles/GovernanceCard';
import { Shield, Wifi, WifiOff } from 'lucide-react';
import './App.css';

function App() {
  const { transactions, alerts, agentTraces, stats, isConnected } = useWebSocket();

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Header */}
      <header className="h-16 flex items-center justify-between px-6 border-b border-gray-800/50 bg-gray-900/30 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <Shield className="text-emerald-400" size={24} />
          <div>
            <h1 className="text-lg font-bold tracking-tight">
              <span className="text-emerald-400">SENTINEL</span>{' '}
              <span className="text-gray-300">MOSAIC</span>
            </h1>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest -mt-0.5">
              Autonomous Financial Governance & Fraud Shield
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-xs text-gray-500 font-mono">
            CMU Hackathon 2026
          </div>
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs ${
            isConnected
              ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-500/30'
              : 'bg-red-900/30 text-red-400 border border-red-500/30'
          }`}>
            {isConnected ? <Wifi size={12} /> : <WifiOff size={12} />}
            {isConnected ? 'LIVE' : 'DISCONNECTED'}
          </div>
        </div>
      </header>

      {/* Dashboard Grid */}
      <BentoGrid>
        {/* Row 1: Stats strip */}
        <StatsOverview stats={stats} />

        {/* Row 2: Transaction feed + Alerts + Risk chart */}
        <TransactionFeed transactions={transactions} />
        <AlertPanel alerts={alerts} />
        <RiskChart transactions={transactions} />

        {/* Row 3: Agent console + Topology + Governance */}
        <AgentConsole traces={agentTraces} />
        <TopologyMap isActive={isConnected && transactions.length > 0} />
        <GovernanceCard />
      </BentoGrid>
    </div>
  );
}

export default App;
