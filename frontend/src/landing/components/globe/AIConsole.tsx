import { useEffect, useState, useRef } from "react";

const logMessages = [
  { type: "info", message: "Scanning network traffic..." },
  { type: "alert", message: "Anomaly Detected: Unusual velocity pattern" },
  { type: "process", message: "Cross-referencing KYC database..." },
  { type: "success", message: "Identity verified: 98.7% confidence" },
  { type: "info", message: "Analyzing transaction cluster #4821" },
  { type: "alert", message: "Risk score elevated: 73/100" },
  { type: "process", message: "AI agent investigating alert..." },
  { type: "success", message: "False positive resolved automatically" },
  { type: "info", message: "Monitoring 847 active sessions" },
  { type: "alert", message: "Geo-velocity breach: NYC → Tokyo (2h)" },
  { type: "process", message: "Triggering step-up authentication..." },
  { type: "success", message: "Threat neutralized in 1.2 seconds" },
  { type: "info", message: "Updating ML model with new patterns" },
  { type: "alert", message: "Card testing detected: IP 185.X.X.X" },
  { type: "process", message: "Blocking suspicious IP range..." },
  { type: "success", message: "47 fraudulent attempts prevented" },
];

interface LogEntry {
  id: number;
  type: string;
  message: string;
  timestamp: string;
}

const AIConsole = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const logIdRef = useRef(0);
  
  useEffect(() => {
    const addLog = () => {
      const randomLog = logMessages[Math.floor(Math.random() * logMessages.length)];
      const now = new Date();
      const timestamp = now.toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      
      const newLog: LogEntry = {
        id: logIdRef.current++,
        type: randomLog.type,
        message: randomLog.message,
        timestamp,
      };
      
      setLogs((prev) => {
        const updated = [...prev, newLog];
        return updated.slice(-6); // Keep last 6 logs
      });
    };
    
    // Add initial logs
    for (let i = 0; i < 3; i++) {
      setTimeout(() => addLog(), i * 200);
    }
    
    // Add new log every 2-4 seconds
    const interval = setInterval(() => {
      addLog();
    }, 2000 + Math.random() * 2000);
    
    return () => clearInterval(interval);
  }, []);
  
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);
  
  const getTypeColor = (type: string) => {
    switch (type) {
      case "alert":
        return "text-red-400";
      case "success":
        return "text-green-400";
      case "process":
        return "text-yellow-400";
      default:
        return "text-muted-foreground";
    }
  };
  
  const getTypePrefix = (type: string) => {
    switch (type) {
      case "alert":
        return "⚠";
      case "success":
        return "✓";
      case "process":
        return "◎";
      default:
        return "›";
    }
  };
  
  return (
    <div className="absolute bottom-4 left-4 right-4 bg-background/80 backdrop-blur-md border border-border/50 rounded-lg overflow-hidden">
      <div className="px-3 py-2 border-b border-border/50 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-foreground/70 animate-pulse" />
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          AI Reasoning Console
        </span>
      </div>
      
      <div
        ref={scrollRef}
        className="p-3 h-28 overflow-y-auto font-mono text-xs space-y-1"
      >
        {logs.map((log) => (
          <div
            key={log.id}
            className="flex items-start gap-2 animate-fade-in"
          >
            <span className="text-muted-foreground/50 shrink-0">
              [{log.timestamp}]
            </span>
            <span className={`shrink-0 ${getTypeColor(log.type)}`}>
              {getTypePrefix(log.type)}
            </span>
            <span className={getTypeColor(log.type)}>
              {log.message}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AIConsole;
