import React, { useRef, useEffect, useState, useMemo } from 'react';
import { AgentTrace } from '../../types/events';
import { getTraceColor, getTracePrefix, formatTime, getVerdictColor, parseVerdict, parseStepNumber } from '../../utils/formatters';
import { Tile } from '../layout/Tile';
import { ChevronDown, ChevronRight, Brain, Zap, ClipboardList, Target, Scale } from 'lucide-react';

interface AgentConsoleProps {
  traces: AgentTrace[];
}

function StepIcon({ type }: { type: string }) {
  const color = getTraceColor(type);
  const props = { size: 12, style: { color }, strokeWidth: 2 };
  switch (type) {
    case 'thinking': return <Brain {...props} />;
    case 'tool_call': return <Zap {...props} />;
    case 'tool_result': return <ClipboardList {...props} />;
    case 'action': return <Target {...props} />;
    case 'verdict': return <Scale {...props} />;
    default: return <Zap {...props} />;
  }
}

export function AgentConsole({ traces }: AgentConsoleProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [traces]);

  // Group traces by alert_id into investigations
  const investigations = useMemo(() => {
    const groups = new Map<string, AgentTrace[]>();
    for (const trace of traces) {
      const existing = groups.get(trace.alert_id) || [];
      existing.push(trace);
      groups.set(trace.alert_id, existing);
    }
    return Array.from(groups.entries());
  }, [traces]);

  const currentAlert = traces.length > 0 ? traces[traces.length - 1].alert_id : null;
  const isActive = traces.length > 0 && traces[traces.length - 1].step_type !== 'verdict';

  // Get current step progress from latest trace
  const latestTrace = traces.length > 0 ? traces[traces.length - 1] : null;
  const stepInfo = latestTrace ? parseStepNumber(latestTrace.content) : null;

  const toggleCollapse = (alertId: string) => {
    setCollapsed(prev => {
      const next = new Set(prev);
      if (next.has(alertId)) next.delete(alertId);
      else next.add(alertId);
      return next;
    });
  };

  const statusBadge = (
    <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${
      isActive
        ? 'bg-cyan-900/30 text-cyan-400 border border-cyan-500/30'
        : 'bg-gray-800/50 text-gray-500 border border-gray-700/30'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-cyan-400 animate-pulse' : 'bg-gray-600'}`} />
      {isActive && stepInfo ? `Step ${stepInfo.step}/${stepInfo.total}` : isActive ? 'ACTIVE' : 'IDLE'}
    </div>
  );

  // Render a single trace line
  const renderTrace = (trace: AgentTrace, i: number, isLast: boolean) => {
    const isVerdict = trace.step_type === 'verdict';
    const stepData = parseStepNumber(trace.content);
    const displayContent = stepData ? stepData.text : trace.content;

    // Special verdict card rendering
    if (isVerdict) {
      const verdict = parseVerdict(displayContent);
      const verdictColor = verdict ? getVerdictColor(verdict.action) : '#fbbf24';
      const scanClass = verdict?.action.includes('BLOCK') ? 'verdict-block'
        : verdict?.action.includes('CLEAR') ? 'verdict-clear' : 'verdict-flag';

      return (
        <div
          key={i}
          className={`mt-2 rounded-lg border overflow-hidden ${scanClass}`}
          style={{
            borderColor: `${verdictColor}30`,
            background: `linear-gradient(135deg, ${verdictColor}08 0%, transparent 100%)`,
            animation: isLast ? 'traceSlideIn 0.3s ease-out' : undefined,
          }}
        >
          <div className="flex items-center gap-2 px-3 py-2">
            <StepIcon type="verdict" />
            {verdict && (
              <span
                className="px-2 py-0.5 rounded text-[11px] font-bold tracking-wider"
                style={{
                  color: verdictColor,
                  background: `${verdictColor}15`,
                  border: `1px solid ${verdictColor}30`,
                }}
              >
                {verdict.action}
              </span>
            )}
            <span className="text-gray-400 text-[10px] font-mono ml-auto">
              {formatTime(trace.timestamp)}
            </span>
          </div>
          {verdict && (
            <div className="px-3 pb-2 space-y-1.5">
              <p className="text-gray-300 text-xs leading-relaxed">{verdict.reason}</p>
              {verdict.evidence.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {verdict.evidence.map((e, j) => (
                    <span key={j} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800/60 text-gray-400 border border-gray-700/30">
                      {e}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
          {!verdict && (
            <div className="px-3 pb-2">
              <p className="text-white text-xs font-medium leading-relaxed">{displayContent}</p>
            </div>
          )}
        </div>
      );
    }

    // Regular trace line with icon + color
    return (
      <div
        key={i}
        className="flex gap-2 py-0.5 px-1 rounded hover:bg-gray-800/20 transition-colors"
        style={{ animation: isLast ? 'traceSlideIn 0.3s ease-out' : undefined }}
      >
        <span className="text-gray-700 flex-shrink-0 w-14 text-[10px] pt-0.5">
          {formatTime(trace.timestamp)}
        </span>
        <span className="flex-shrink-0 pt-0.5" style={{ width: '18px' }}>
          <StepIcon type={trace.step_type} />
        </span>
        <span
          className="font-bold flex-shrink-0 text-[10px] pt-0.5 uppercase tracking-wider"
          style={{ color: getTraceColor(trace.step_type), width: '52px' }}
        >
          {getTracePrefix(trace.step_type)}
        </span>
        <span
          className="break-words leading-relaxed text-xs"
          style={{
            color: trace.step_type === 'tool_result' ? '#9ca3af' : '#d1d5db',
            fontStyle: trace.step_type === 'tool_result' ? 'italic' : undefined,
          }}
        >
          {trace.step_type === 'tool_result' ? renderToolResult(displayContent) : displayContent}
        </span>
      </div>
    );
  };

  // Highlight key-value pairs and keywords in tool results
  const renderToolResult = (content: string) => {
    return content.split('\n').map((line, i) => {
      // Highlight WARNING/VERIFIED/NOT REGISTERED keywords
      let processed = line;
      const highlights: Array<{ text: string; color: string }> = [];

      if (/WARNING|NOT REGISTERED|FRAUD|IMPOSSIBLE/i.test(line)) {
        return (
          <span key={i} className="block">
            <span className="text-red-400">{line}</span>
          </span>
        );
      }
      if (/VERIFIED|FEASIBLE|REGISTERED|SAFE/i.test(line)) {
        return (
          <span key={i} className="block">
            <span className="text-emerald-400">{line}</span>
          </span>
        );
      }

      // Key: Value highlighting
      const kvMatch = line.match(/^(\s*[\w\s]+?):\s+(.+)$/);
      if (kvMatch) {
        return (
          <span key={i} className="block">
            <span className="text-gray-500">{kvMatch[1]}:</span>{' '}
            <span className="text-gray-300">{kvMatch[2]}</span>
          </span>
        );
      }

      return <span key={i} className="block">{line}</span>;
    });
  };

  return (
    <Tile title="Agent Brain Trace" className="col-span-2" accentColor="#38bdf8" badge={statusBadge}>
      <div className="h-full flex flex-col">
        {/* Terminal window */}
        <div className="flex-1 rounded-xl overflow-hidden border border-gray-800/30 flex flex-col">
          {/* Terminal header bar */}
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-900/80 border-b border-gray-800/30">
            <span className="text-[10px] text-gray-500 font-mono">
              aegis-agent {isActive ? <>&mdash; investigating {currentAlert?.slice(0, 16)}</> : <>&mdash; monitoring</>}
            </span>
            {isActive && stepInfo && (
              <div className="ml-auto flex items-center gap-2">
                <div className="w-24 h-1 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${(stepInfo.step / stepInfo.total) * 100}%`,
                      background: 'linear-gradient(90deg, #38bdf8, #a78bfa)',
                    }}
                  />
                </div>
                <span className="text-[10px] text-cyan-400/60 font-mono">{stepInfo.step}/{stepInfo.total}</span>
              </div>
            )}
          </div>

          {/* Console output */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto font-mono text-xs space-y-0.5 p-3 bg-[#0a0a10] scrollbar-thin"
          >
            {traces.length === 0 && (
              <div className="text-center py-6">
                <pre className="text-cyan-500/30 text-[10px] leading-tight">{`\u256D\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u256E
\u2502  AEGIS AUTONOMOUS AGENT v2.1    \u2502
\u2502  Model: Llama 3 \u00B7 ReAct Loop    \u2502
\u2502  Status: MONITORING             \u2502
\u2502  Awaiting anomaly trigger...    \u2502
\u2570\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u256F`}</pre>
                <div className="text-gray-600 mt-3 text-xs cursor-blink">
                  Ready
                </div>
              </div>
            )}

            {/* Render investigations grouped by alert_id */}
            {investigations.map(([alertId, alertTraces], groupIdx) => {
              const isCurrentGroup = alertId === currentAlert;
              const isCollapsed = collapsed.has(alertId);
              const hasVerdict = alertTraces.some(t => t.step_type === 'verdict');
              const verdictTrace = alertTraces.find(t => t.step_type === 'verdict');
              const verdict = verdictTrace ? parseVerdict(
                parseStepNumber(verdictTrace.content)?.text || verdictTrace.content
              ) : null;
              const verdictColor = verdict ? getVerdictColor(verdict.action) : null;

              // Get max step from traces
              let maxStep = 0;
              alertTraces.forEach(t => {
                const s = parseStepNumber(t.content);
                if (s && s.step > maxStep) maxStep = s.step;
              });

              return (
                <div key={alertId} className={groupIdx > 0 ? 'mt-3 pt-3 border-t border-gray-800/30' : ''}>
                  {/* Investigation header (only show if multiple investigations) */}
                  {investigations.length > 1 && (
                    <button
                      onClick={() => toggleCollapse(alertId)}
                      className="flex items-center gap-2 w-full text-left px-1 py-1 rounded hover:bg-gray-800/30 transition-colors mb-1"
                    >
                      {isCollapsed
                        ? <ChevronRight size={12} className="text-gray-600" />
                        : <ChevronDown size={12} className="text-gray-600" />
                      }
                      <span className="text-[10px] text-gray-500 font-mono">
                        {alertId.slice(0, 16)}
                      </span>
                      <span className="text-[10px] text-gray-600">
                        {maxStep > 0 ? `${maxStep}/6 steps` : `${alertTraces.length} entries`}
                      </span>
                      {hasVerdict && verdict && (
                        <span
                          className="text-[10px] px-1.5 py-0 rounded font-bold ml-auto"
                          style={{
                            color: verdictColor || '#fbbf24',
                            background: `${verdictColor}15`,
                            border: `1px solid ${verdictColor}30`,
                          }}
                        >
                          {verdict.action}
                        </span>
                      )}
                      {!hasVerdict && isCurrentGroup && (
                        <span className="text-[10px] text-cyan-400/60 ml-auto flex items-center gap-1">
                          <span className="w-1 h-1 bg-cyan-400 rounded-full animate-pulse" />
                          investigating
                        </span>
                      )}
                    </button>
                  )}

                  {/* Traces */}
                  {!isCollapsed && alertTraces.map((trace, i) =>
                    renderTrace(trace, groupIdx * 1000 + i, groupIdx === investigations.length - 1 && i === alertTraces.length - 1)
                  )}
                </div>
              );
            })}

            {/* Active investigation cursor */}
            {isActive && (
              <div className="flex gap-2 py-0.5 px-1">
                <span className="text-gray-700 flex-shrink-0 w-14 text-[10px]" />
                <span className="flex-shrink-0" style={{ width: '18px' }} />
                <span className="flex-shrink-0" style={{ width: '52px' }} />
                <span className="text-cyan-500 cursor-blink" />
              </div>
            )}
          </div>

          {/* Bottom status bar */}
          <div className="flex items-center justify-between px-3 py-1.5 bg-gray-900/80 border-t border-gray-800/30 text-[10px] text-gray-600 font-mono">
            <span>{investigations.length} investigation{investigations.length !== 1 ? 's' : ''} · {traces.length} traces</span>
            <span className={isActive ? 'text-cyan-400/60' : ''}>{isActive ? 'ACTIVE' : 'STANDBY'}</span>
          </div>
        </div>
      </div>
    </Tile>
  );
}
