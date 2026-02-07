import { useState, useEffect, useRef, useCallback } from 'react';
import { TransactionEvent, AlertEvent, AgentTrace, DashboardStats, DisputeEvent } from '../types/events';
import { WS_URL } from '../config';
const MAX_TRANSACTIONS = 200;
const MAX_ALERTS = 50;
const MAX_TRACES = 100;
const MAX_DISPUTES = 50;

export function useWebSocket() {
  const [transactions, setTransactions] = useState<TransactionEvent[]>([]);
  const [alerts, setAlerts] = useState<AlertEvent[]>([]);
  const [agentTraces, setAgentTraces] = useState<AgentTrace[]>([]);
  const [disputes, setDisputes] = useState<DisputeEvent[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    total_transactions: 0,
    flagged_count: 0,
    blocked_count: 0,
    cleared_count: 0,
    avg_risk_score: 0,
    total_amount: 0,
    money_saved: 0,
    investigations_completed: 0,
    disputes_filed: 0,
    disputes_approved: 0,
    disputes_denied: 0,
  });
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout>(undefined);
  const reconnectDelay = useRef(1000);

  const connect = useCallback(() => {
    // Close any existing connection first (handles React StrictMode double-mount)
    if (wsRef.current) {
      wsRef.current.onclose = null; // Prevent reconnect loop from old socket
      wsRef.current.close();
      wsRef.current = null;
    }

    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        reconnectDelay.current = 1000;
        // Send keepalive pings every 20 seconds
        const pingInterval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send('ping');
          }
        }, 20000);
        ws.addEventListener('close', () => clearInterval(pingInterval));
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          const { type, data } = message;

          switch (type) {
            case 'backfill':
              // Initial state snapshot on connect - replace, don't append
              if (data.transactions) {
                setTransactions(data.transactions as TransactionEvent[]);
              }
              if (data.alerts) {
                setAlerts(data.alerts as AlertEvent[]);
              }
              if (data.disputes) {
                setDisputes(data.disputes as DisputeEvent[]);
              }
              break;
            case 'transaction':
              setTransactions(prev => {
                const next = [data as TransactionEvent, ...prev];
                return next.slice(0, MAX_TRANSACTIONS);
              });
              break;
            case 'alert':
              setAlerts(prev => {
                const next = [data as AlertEvent, ...prev];
                return next.slice(0, MAX_ALERTS);
              });
              break;
            case 'agent_trace':
              setAgentTraces(prev => {
                const next = [...prev, data as AgentTrace];
                return next.slice(-MAX_TRACES);
              });
              break;
            case 'alert_update':
              setAlerts(prev => prev.map(a =>
                a.id === (data as AlertEvent).id ? (data as AlertEvent) : a
              ));
              break;
            case 'dispute':
              setDisputes(prev => {
                const next = [data as DisputeEvent, ...prev];
                return next.slice(0, MAX_DISPUTES);
              });
              break;
            case 'dispute_update':
              setDisputes(prev => prev.map(d =>
                d.id === (data as DisputeEvent).id ? (data as DisputeEvent) : d
              ));
              break;
            case 'stats':
              setStats(data as DashboardStats);
              break;
          }
        } catch (e) {
          console.error('Failed to parse WebSocket message:', e);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        wsRef.current = null;
        // Auto-reconnect with exponential backoff
        reconnectTimeout.current = setTimeout(() => {
          reconnectDelay.current = Math.min(reconnectDelay.current * 2, 10000);
          connect();
        }, reconnectDelay.current);
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch (e) {
      console.error('WebSocket connection failed:', e);
    }
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [connect]);

  return { transactions, alerts, agentTraces, disputes, stats, isConnected };
}
