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

  return (
    <Tile title="Agent Brain Trace" icon="🧠" className="col-span-2" accentColor="#06b6d4">
      <div className="h-full flex flex-col">
        {/* Status bar */}
        <div className="flex items-center gap-2 mb-2 px-2 py-1 bg-gray-800/50 rounded-lg text-xs">
          <div
            className={`w-2 h-2 rounded-full ${
              traces.length > 0 && traces[traces.length - 1].step_type !== 'verdict'
                ? 'bg-green-500 animate-pulse'
                : 'bg-gray-500'
            }`}
          />
          <span className="text-gray-400">
            {traces.length === 0
              ? 'Agent idle — awaiting next anomaly'
              : traces[traces.length - 1].step_type === 'verdict'
              ? `Investigation complete for ${currentAlert}`
              : `Investigating ${currentAlert}...`}
          </span>
        </div>

        {/* Console output */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto font-mono text-xs space-y-1 pr-1 bg-black/30 rounded-lg p-3"
        >
          {traces.length === 0 && (
            <div className="text-gray-600 text-center py-4">
              <pre className="text-green-500/50">{`
  ╔═══════════════════════════════╗
  ║   SENTINEL AGENT v1.0        ║
  ║   Status: MONITORING          ║
  ║   Model: Llama 3 8B           ║
  ╚═══════════════════════════════╝
              `}</pre>
              <div className="text-gray-500 mt-2">Waiting for anomaly detection trigger...</div>
            </div>
          )}
          {traces.map((trace, i) => (
            <div
              key={i}
              className="flex gap-2 py-0.5"
              style={{
                animation: i === traces.length - 1 ? 'fadeIn 0.3s ease-out' : undefined,
              }}
            >
              <span className="text-gray-600 flex-shrink-0 w-16">
                {formatTime(trace.timestamp)}
              </span>
              <span
                className="font-bold flex-shrink-0 w-20"
                style={{ color: getTraceColor(trace.step_type) }}
              >
                {getTracePrefix(trace.step_type)}
              </span>
              <span
                className="text-gray-300 break-words"
                style={{
                  color: trace.step_type === 'verdict' ? '#ffffff' : undefined,
                  fontWeight: trace.step_type === 'verdict' ? 'bold' : undefined,
                }}
              >
                {trace.content}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Tile>
  );
}
