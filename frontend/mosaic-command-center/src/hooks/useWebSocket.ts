import { useState, useEffect, useRef, useCallback } from 'react';
import { TransactionEvent, AlertEvent, AgentTrace, DashboardStats } from '../types/events';

const WS_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:8000/ws/feed';
const MAX_TRANSACTIONS = 200;
const MAX_ALERTS = 50;
const MAX_TRACES = 100;

export function useWebSocket() {
  const [transactions, setTransactions] = useState<TransactionEvent[]>([]);
  const [alerts, setAlerts] = useState<AlertEvent[]>([]);
  const [agentTraces, setAgentTraces] = useState<AgentTrace[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    total_transactions: 0,
    flagged_count: 0,
    blocked_count: 0,
    cleared_count: 0,
    avg_risk_score: 0,
    total_amount: 0,
  });
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout>(undefined);
  const reconnectDelay = useRef(1000);

  const connect = useCallback(() => {
    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        reconnectDelay.current = 1000;
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          const { type, data } = message;

          switch (type) {
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

  return { transactions, alerts, agentTraces, stats, isConnected };
}
