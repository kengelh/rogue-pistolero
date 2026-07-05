import React from 'react';
import { InjurySystem } from '../types';

export const BodySilhouette = ({ injuries }: { injuries: InjurySystem }) => {
  const getColor = (integrity: number) => {
    if (integrity >= 100) return '#9ca3af'; // gray-400
    if (integrity >= 50) return '#eab308'; // yellow-500
    if (integrity > 0) return '#f97316'; // orange-500
    return '#ef4444'; // red-500
  };

  return (
    <div className="relative w-14 h-24 flex flex-col items-center justify-center scale-75">
      {/* Head */}
      <div 
        className="w-4 h-4 rounded-full mb-0.5 border border-[#4d3b2c] shrink-0 drop-shadow-sm" 
        style={{ backgroundColor: getColor(injuries.parts.HEAD.integrity) }} 
      />
      {/* Arms & Torso */}
      <div className="flex gap-0.5">
        {/* Left Arm */}
        <div 
          className="w-2 h-8 rounded-full border border-[#4d3b2c] drop-shadow-sm" 
          style={{ backgroundColor: getColor(injuries.parts.RIGHT_ARM.integrity) }} 
        />
        {/* Torso */}
        <div 
          className="w-6 h-10 rounded shadow-sm border border-[#4d3b2c] drop-shadow-sm" 
          style={{ backgroundColor: getColor(injuries.parts.TORSO.integrity) }} 
        />
        {/* Right Arm */}
        <div 
          className="w-2 h-8 rounded-full border border-[#4d3b2c] drop-shadow-sm" 
          style={{ backgroundColor: getColor(injuries.parts.LEFT_ARM.integrity) }} 
        />
      </div>
      {/* Legs */}
      <div className="flex gap-0.5 mt-0.5">
        <div 
          className="w-2.5 h-10 rounded-full border border-[#4d3b2c] drop-shadow-sm" 
          style={{ backgroundColor: getColor(injuries.parts.LEGS.integrity) }} 
        />
        <div 
          className="w-2.5 h-10 rounded-full border border-[#4d3b2c] drop-shadow-sm" 
          style={{ backgroundColor: getColor(injuries.parts.LEGS.integrity) }} 
        />
      </div>
    </div>
  );
};
