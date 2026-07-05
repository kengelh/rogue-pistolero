import React, { useState } from "react";
import { MISSIONS } from "./data/missions";
import { MissionView } from "./components/MissionView";
import { Code, Terminal, ChevronRight, CheckCircle } from "lucide-react";

export default function App() {
  const [activeMissionId, setActiveMissionId] = useState<string>(MISSIONS[0].id);

  const activeMissionIndex = MISSIONS.findIndex(m => m.id === activeMissionId);
  const currentMission = MISSIONS[activeMissionIndex];

  const handleNext = () => {
    if (activeMissionIndex < MISSIONS.length - 1) {
      setActiveMissionId(MISSIONS[activeMissionIndex + 1].id);
    }
  };

  return (
    <div className="min-h-screen bg-[#21160d] flex p-4 md:p-6 gap-6 font-sans text-stone-200">
      
      {/* Sidebar Navigation */}
      <div className="w-full md:w-1/4 max-w-sm flex flex-col gap-4">
        {/* Branding */}
        <div className="bg-[#3a2717] border-4 border-[#593c24] p-6 rounded shadow-xl text-center relative overflow-hidden">
          <div className="absolute -top-10 -right-10 opacity-5 text-stone-100">
            <Terminal size={150} />
          </div>
          <h1 className="text-2xl font-black text-[#ebdcb9] uppercase tracking-widest font-serif leading-tight relative z-10">
            Frontier<br/><span className="text-[#a82c2c]">Python</span>
          </h1>
          <p className="text-[#a98f71] text-xs font-mono uppercase tracking-wider mt-2 relative z-10">
            Build a Western RPG
          </p>
        </div>

        {/* Mission List */}
        <div className="flex-1 bg-[#1c120a] border border-[#3a2717] rounded shadow-inner overflow-y-auto p-4 flex flex-col gap-2">
          <h3 className="text-[#a98f71] text-[10px] font-bold uppercase tracking-widest mb-2 px-2">
            Curriculum
          </h3>
          
          {MISSIONS.map((mission, index) => {
            const isActive = mission.id === activeMissionId;
            const isCompleted = index < activeMissionIndex;

            return (
              <button
                key={mission.id}
                onClick={() => setActiveMissionId(mission.id)}
                className={`text-left p-3 rounded-sm border transition-all flex items-center justify-between ${
                  isActive 
                    ? 'bg-[#4a2e1b] border-[#a82c2c]/50 shadow-[0_0_15px_rgba(168,44,44,0.2)] text-[#ebdcb9]' 
                    : isCompleted
                      ? 'bg-[#1c120a] border-[#2b1b10] text-[#a98f71] hover:border-[#4a2e1b]'
                      : 'bg-[#150d07] border-transparent text-stone-600 hover:text-stone-400'
                }`}
              >
                <div className="flex-1">
                  <div className={`font-serif font-bold text-sm tracking-wide ${isActive ? 'text-white' : ''}`}>
                    {mission.title}
                  </div>
                  <div className="font-mono text-[9px] uppercase mt-1 opacity-70">
                    {mission.conceptTitle}
                  </div>
                </div>
                
                {isCompleted && !isActive && (
                  <CheckCircle size={14} className="text-green-700 ml-2" />
                )}
                {isActive && (
                  <ChevronRight size={16} className="text-[#ebdcb9]" />
                )}
              </button>
            );
          })}
        </div>

        {/* Instructions */}
        <div className="bg-[#2b1b10] border border-[#4a2e1b] p-4 rounded text-[#a98f71] text-xs leading-relaxed text-center shadow-lg">
          <Code size={20} className="mx-auto mb-2 opacity-50" />
          <p>
            Use <strong className="text-[#ebdcb9]">Replit.com</strong>, <strong className="text-[#ebdcb9]">VS Code</strong>, or any Python editor to follow along and write your code.
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      {currentMission ? (
        <MissionView 
          mission={currentMission} 
          onNext={handleNext} 
          isLast={activeMissionIndex === MISSIONS.length - 1} 
        />
      ) : (
        <div className="flex-1 flex items-center justify-center text-white">Loading...</div>
      )}

    </div>
  );
}
