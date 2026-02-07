import React, { useState, useEffect } from 'react';
import { useWebSocket } from './hooks/useWebSocket';
import { BentoGrid } from './components/layout/BentoGrid';
import { StatsOverview } from './components/tiles/StatsOverview';
import { TransactionFeed } from './components/tiles/TransactionFeed';
import { AlertPanel } from './components/tiles/AlertPanel';
import { RiskChart } from './components/tiles/RiskChart';
import { AgentConsole } from './components/tiles/AgentConsole';
import { DisputePanel } from './components/tiles/DisputePanel';
import { AccountActivity } from './components/tiles/AccountActivity';
import { Shield, Wifi, WifiOff, Database, Clock, Maximize, Minimize } from 'lucide-react';
import { API_URL } from './config';
import './App.css';

function App() {
  const { transactions, alerts, agentTraces, disputes, stats, isConnected } = useWebSocket();
  const [nessieConnected, setNessieConnected] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Sync fullscreen state with browser
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Check backend health for Nessie status
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch(`${API_URL}/api/health`);
        const data = await res.json();
        setNessieConnected(data.nessie_connected || false);
      } catch {
        setNessieConnected(false);
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Animated background gradient */}
      <div className="fixed inset-0 bg-gradient-mesh pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 h-16 flex items-center justify-between px-6 border-b border-gray-800/40 bg-gray-950/60 backdrop-blur-2xl header-glow">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Shield className="text-emerald-400" size={26} />
            <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">
              <span className="bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent">
                AEGIS
              </span>
            </h1>
            <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em] -mt-0.5">
              Financial Fraud Detection & Governance
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Clock */}
          <div className="flex items-center gap-1.5 text-gray-400 text-xs font-mono">
            <Clock size={11} />
            {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>

          {/* Status Indicators */}
          <div className="flex items-center gap-2">
            {/* Fullscreen toggle */}
            <button
              onClick={toggleFullscreen}
              className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs bg-gray-800/50 text-gray-400 border border-gray-700/30 hover:bg-emerald-900/30 hover:text-emerald-400 hover:border-emerald-500/30 transition-all"
              title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            >
              {isFullscreen ? <Minimize size={12} /> : <Maximize size={12} />}
              {isFullscreen ? 'EXIT' : 'FULLSCREEN'}
            </button>

            {/* Nessie API status */}
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs ${
              nessieConnected
                ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-500/30'
                : 'bg-gray-800/50 text-gray-500 border border-gray-700/30'
            }`}>
              <Database size={10} />
              {nessieConnected ? 'NESSIE' : 'MOCK'}
            </div>

            {/* Connection status */}
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs ${
              isConnected
                ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-500/30'
                : 'bg-red-900/30 text-red-400 border border-red-500/30'
            }`}>
              {isConnected ? <Wifi size={12} /> : <WifiOff size={12} />}
              {isConnected ? (
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                  LIVE
                </span>
              ) : 'DISCONNECTED'}
            </div>
          </div>
        </div>
      </header>

      {/* Dashboard Grid */}
      <BentoGrid>
        {/* Row 1: Stats strip */}
        <StatsOverview stats={stats} />

        {/* Row 2: Transaction feed + Alerts + Disputes */}
        <TransactionFeed transactions={transactions} />
        <AlertPanel alerts={alerts} agentTraces={agentTraces} />
        <DisputePanel disputes={disputes} />

        {/* Row 3: Agent console + Risk chart + Account Activity */}
        <AgentConsole traces={agentTraces} />
        <RiskChart transactions={transactions} />
        <AccountActivity transactions={transactions} alerts={alerts} />
      </BentoGrid>
    </div>
  );
}

export default App;
