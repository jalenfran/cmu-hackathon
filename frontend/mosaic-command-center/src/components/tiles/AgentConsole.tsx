import React, { useRef, useEffect } from 'react';
import { AgentTrace } from '../../types/events';
import { getTraceColor, getTracePrefix, formatTime } from '../../utils/formatters';
import { Tile } from '../layout/Tile';

interface AgentConsoleProps {
  traces: AgentTrace[];
}

export function AgentConsole({ traces }: AgentConsoleProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [traces]);

  const currentAlert = traces.length > 0 ? traces[traces.length - 1].alert_id : null;
  const isActive = traces.length > 0 && traces[traces.length - 1].step_type !== 'verdict';

  // Count investigation steps for progress
  const currentTraces = currentAlert
    ? traces.filter(t => t.alert_id === currentAlert)
    : [];
  const stepCount = currentTraces.length;

  const statusBadge = (
    <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${
      isActive
        ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-500/30'
        : 'bg-gray-800/50 text-gray-500 border border-gray-700/30'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-400 animate-pulse' : 'bg-gray-600'}`} />
      {isActive ? `Step ${stepCount}` : 'IDLE'}
    </div>
  );

  return (
    <Tile title="Agent Brain Trace" className="col-span-2" accentColor="#10b981" badge={statusBadge}>
      <div className="h-full flex flex-col">
        {/* Terminal window */}
        <div className="flex-1 rounded-xl overflow-hidden border border-gray-800/50 flex flex-col">
          {/* Terminal chrome bar */}
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-900/80 border-b border-gray-800/50">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
            </div>
            <span className="text-[10px] text-gray-500 font-mono ml-2">
              aegis-agent — {isActive ? `investigating ${currentAlert}` : 'monitoring'}
            </span>
          </div>

          {/* Console output */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto font-mono text-xs space-y-0.5 p-3 bg-[#0a0a10] scrollbar-thin"
          >
            {traces.length === 0 && (
              <div className="text-center py-6">
                <pre className="text-emerald-500/40 text-[10px] leading-tight">{`╔══════════════════════════════════╗
║   AEGIS AGENT v2.0               ║
║   Model: Llama 3.2 3B            ║
║   Status: MONITORING             ║
║   Awaiting anomaly trigger...    ║
╚══════════════════════════════════╝`}</pre>
                <div className="text-gray-600 mt-3 text-xs cursor-blink">
                  Ready
                </div>
              </div>
            )}
            {traces.map((trace, i) => {
              const isLast = i === traces.length - 1;
              const isVerdict = trace.step_type === 'verdict';
              return (
                <div
                  key={i}
                  className={`flex gap-2 py-0.5 px-1 rounded ${
                    isVerdict ? 'bg-emerald-500/5 border-l-2 border-emerald-500/50 pl-2 verdict-scanline' : ''
                  }`}
                  style={{
                    animation: isLast ? 'traceSlideIn 0.3s ease-out' : undefined,
                  }}
                >
                  <span className="text-gray-700 flex-shrink-0 w-14 text-[10px]">
                    {formatTime(trace.timestamp)}
                  </span>
                  <span
                    className="font-bold flex-shrink-0 w-20 text-[11px]"
                    style={{ color: getTraceColor(trace.step_type) }}
                  >
                    {getTracePrefix(trace.step_type)}
                  </span>
                  <span
                    className="break-words leading-relaxed"
                    style={{
                      color: isVerdict ? '#ffffff' :
                             trace.step_type === 'tool_result' ? '#9ca3af' : '#d1d5db',
                      fontWeight: isVerdict ? 'bold' : undefined,
                      fontStyle: trace.step_type === 'tool_result' ? 'italic' : undefined,
                    }}
                  >
                    {trace.content}
                  </span>
                </div>
              );
            })}
            {/* Active investigation cursor */}
            {isActive && (
              <div className="flex gap-2 py-0.5 px-1">
                <span className="text-gray-700 flex-shrink-0 w-14 text-[10px]" />
                <span className="flex-shrink-0 w-20" />
                <span className="text-emerald-500 cursor-blink" />
              </div>
            )}
          </div>

          {/* Bottom status bar */}
          <div className="flex items-center justify-between px-3 py-1.5 bg-gray-900/80 border-t border-gray-800/50 text-[10px] text-gray-600 font-mono">
            <span>{traces.length} trace entries</span>
            <span>{isActive ? 'ACTIVE' : 'STANDBY'}</span>
          </div>
        </div>
      </div>
    </Tile>
  );
}
