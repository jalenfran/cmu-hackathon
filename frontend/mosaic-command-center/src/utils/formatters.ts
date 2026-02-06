export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function timeAgo(timestamp: string): string {
  const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  return `${Math.floor(seconds / 3600)}h ago`;
}

export function getRiskColor(score: number): string {
  if (score >= 0.7) return '#ef4444'; // red
  if (score >= 0.4) return '#f59e0b'; // amber
  if (score >= 0.2) return '#eab308'; // yellow
  return '#22c55e'; // green
}

export function getRiskLevel(score: number): string {
  if (score >= 0.7) return 'Critical';
  if (score >= 0.4) return 'High';
  if (score >= 0.2) return 'Medium';
  return 'Low';
}

export function getTraceColor(stepType: string): string {
  switch (stepType) {
    case 'thinking': return '#22c55e';
    case 'tool_call': return '#eab308';
    case 'tool_result': return '#06b6d4';
    case 'action': return '#a855f7';
    case 'verdict': return '#ffffff';
    default: return '#9ca3af';
  }
}

export function getTracePrefix(stepType: string): string {
  switch (stepType) {
    case 'thinking': return '💭 THOUGHT';
    case 'tool_call': return '🔧 ACTION';
    case 'tool_result': return '📊 RESULT';
    case 'action': return '⚡ DECIDED';
    case 'verdict': return '🎯 VERDICT';
    default: return '▸';
  }
}
