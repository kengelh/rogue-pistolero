import React from 'react';
import { Player, Location } from '../types';

interface DataExplorerProps {
  player: Player;
  worldLocations: Location[];
}

export const DataExplorer: React.FC<DataExplorerProps> = ({ player, worldLocations }) => {
  return (
    <div className="p-4 bg-[#0c0908] text-[#8a705a] font-mono text-xs overflow-auto h-full rounded-sm border border-[#3d2d21]">
      <h2 className="text-xl font-bold mb-4 text-[#e8b923] font-serif uppercase tracking-wider">Daten Explorer</h2>
      
      <div className="mb-8">
        <h3 className="text-lg font-bold mb-2 text-[#d4c3a1] border-b border-[#3d2d21] pb-1 uppercase font-serif tracking-widest">Player Data</h3>
        <pre className="bg-[#150f0c] p-2 rounded-sm border border-[#2d2118] whitespace-pre-wrap">
          {JSON.stringify(player, null, 2)}
        </pre>
      </div>

      <div>
        <h3 className="text-lg font-bold mb-2 text-[#d4c3a1] border-b border-[#3d2d21] pb-1 uppercase font-serif tracking-widest">World Data</h3>
        <pre className="bg-[#150f0c] p-2 rounded-sm border border-[#2d2118] whitespace-pre-wrap">
          {JSON.stringify(worldLocations, null, 2)}
        </pre>
      </div>
    </div>
  );
};
