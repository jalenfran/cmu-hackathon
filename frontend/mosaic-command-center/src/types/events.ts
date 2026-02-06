export interface TransactionEvent {
  id: string;
  account_id: string;
  merchant_name: string;
  merchant_id: string;
  amount: number;
  currency: string;
  category: string;
  latitude: number | null;
  longitude: number | null;
  city: string | null;
  country: string;
  timestamp: string;
  risk_score: number;
  is_anomaly: boolean;
}

export interface AlertEvent {
  id: string;
  transaction: TransactionEvent;
  risk_score: number;
  risk_factors: string[];
  status: 'pending' | 'investigating' | 'blocked' | 'cleared';
  agent_verdict: string | null;
  timestamp: string;
}

export interface AgentTrace {
  alert_id: string;
  step_type: 'thinking' | 'tool_call' | 'tool_result' | 'action' | 'verdict';
  content: string;
  timestamp: string;
}

export interface DashboardStats {
  total_transactions: number;
  flagged_count: number;
  blocked_count: number;
  cleared_count: number;
  avg_risk_score: number;
  total_amount: number;
}

export interface WebSocketMessage {
  type: 'transaction' | 'alert' | 'agent_trace' | 'stats';
  data: any;
}
