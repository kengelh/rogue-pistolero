import React, { useEffect, useRef } from 'react';
import { LogMessage } from '../types';
import { MessageSquare, ShieldAlert, Award, Compass, Search, Coins } from 'lucide-react';

interface GameLogsProps {
  logs: LogMessage[];
}

export const GameLogs: React.FC<GameLogsProps> = ({ logs }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  const getLogIcon = (type: LogMessage['type']) => {
    switch (type) {
      case 'danger':
        return <ShieldAlert size={14} className="text-[#c4451a] shrink-0" />;
      case 'reputation':
        return <Award size={14} className="text-purple-400 shrink-0" />;
      case 'travel':
        return <Compass size={14} className="text-[#2a8ec4] shrink-0" />;
      case 'loot':
        return <Coins size={14} className="text-[#e8b923] shrink-0" />;
      case 'system':
      default:
        return <MessageSquare size={14} className="text-[#8a705a] shrink-0" />;
    }
  };

  const getMessageColor = (type: LogMessage['type']) => {
    switch (type) {
      case 'danger':
        return 'text-[#e8b923] bg-[#2d0a0a]/40 border-[#4d1a1a]/30';
      case 'combat':
        return 'text-red-300 bg-[#2d0a0a]/20 border-[#4d1a1a]/20';
      case 'reputation':
        return 'text-purple-300 bg-[#1a130f]/60 border-[#3d2d21]/40';
      case 'travel':
        return 'text-sky-300 bg-[#0a1b2d]/30 border-[#1a3a4d]/20';
      case 'loot':
        return 'text-[#e8b923] bg-[#241b14]/50 border-[#3d2d21]/40';
      case 'system':
      default:
        return 'text-[#d4c3a1] bg-[#1a130f]/60 border-[#3d2d21]/40';
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#150f0c] border border-[#3d2d21] rounded-sm overflow-hidden shadow-xl">
      <div className="px-3.5 py-2.5 bg-[#1a130f] border-b border-[#3d2d21] flex items-center gap-2 justify-between">
        <div className="flex items-center gap-2">
          <Search size={14} className="text-[#8a705a]" />
          <span className="text-xs font-serif tracking-widest font-bold text-[#8a705a] uppercase">Arizona Gazette Journal Logs</span>
        </div>
        <span className="text-[9px] font-mono uppercase tracking-widest text-[#e8b923] bg-[#0c0908] px-2 py-0.5 rounded-sm border border-[#3d2d21]/60">REALTIME TELETYPE</span>
      </div>

      <div 
        ref={containerRef}
        className="flex-1 p-3.5 overflow-y-auto space-y-1.5 scrollbar-thin scrollbar-thumb-[#3d2d21]"
      >
        {logs.length === 0 ? (
          <div className="text-xs text-[#8a705a] font-serif text-center py-10 italic">
            No active journal clippings logged. Saddle up to track badlands affairs.
          </div>
        ) : (
          logs.map((log) => (
            <div 
              id={`log-${log.id}`}
              key={log.id} 
              className={`flex items-start gap-2 text-xs font-mono py-1.5 px-3 border rounded-sm transition-all duration-300 ${getMessageColor(log.type)}`}
            >
              <div className="mt-0.5">{getLogIcon(log.type)}</div>
              <div className="flex-1 leading-relaxed">
                <span className="text-[9.5px] text-[#8a705a] mr-2 font-mono">[{log.timestamp}]</span>
                <span className="font-sans font-medium">{log.text}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
