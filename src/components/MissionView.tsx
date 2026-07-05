import React, { useState } from "react";
import { Mission } from "../types";
import { Code, Terminal, BookOpen, CheckCircle, Target, ChevronRight, Play } from "lucide-react";

interface Props {
  mission: Mission;
  onNext: () => void;
  isLast: boolean;
}

export const MissionView: React.FC<Props> = ({ mission, onNext, isLast }) => {
  const [showSolution, setShowSolution] = useState(false);

  return (
    <div className="flex-1 bg-[#ebdcb9] border-8 border-[#cfbfa0] border-double rounded-sm shadow-2xl overflow-hidden flex flex-col font-sans">
      {/* Header */}
      <div className="bg-[#3a2717] text-[#ebdcb9] p-6 border-b-4 border-[#21160d]">
        <h1 className="text-3xl md:text-4xl font-serif font-black tracking-tight uppercase flex items-center gap-3">
          {mission.title}
        </h1>
        <p className="mt-4 text-[#a98f71] font-serif italic text-lg leading-relaxed max-w-4xl">
          "{mission.lore}"
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-10">
        
        {/* Concept Section */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <BookOpen size={24} className="text-[#a82c2c]" />
            <h2 className="text-2xl font-serif font-bold text-stone-900 uppercase tracking-widest">
              Concept: {mission.conceptTitle}
            </h2>
          </div>
          <div className="bg-stone-100 p-5 rounded border border-stone-300 shadow-inner">
            <p className="text-stone-800 text-lg leading-relaxed">
              {mission.conceptExplanation}
            </p>
          </div>
        </section>

        {/* Example Section */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Terminal size={20} className="text-stone-700" />
            <h3 className="text-xl font-bold text-stone-800 font-sans tracking-wide">
              Example Code
            </h3>
          </div>
          <div className="bg-[#1e1e1e] rounded-md overflow-hidden shadow-lg border border-stone-800">
            <div className="bg-[#2d2d2d] px-4 py-2 border-b border-[#404040] flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500"></span>
              <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
              <span className="w-3 h-3 rounded-full bg-green-500"></span>
              <span className="ml-2 text-xs font-mono text-stone-400">example.py</span>
            </div>
            <pre className="p-5 text-[14px] md:text-[15px] font-mono text-stone-300 overflow-x-auto leading-relaxed">
              <code>{mission.exampleCode}</code>
            </pre>
          </div>
        </section>

        {/* Task Section */}
        <section className="bg-[#eedfbf] border-4 border-[#cfbfa0] p-6 rounded-sm relative">
          <div className="absolute -top-4 -left-4 bg-[#a82c2c] text-white p-2 rounded-full shadow-lg">
            <Target size={24} />
          </div>
          <h2 className="text-2xl font-black font-serif uppercase tracking-widest text-stone-900 ml-6 mb-4">
            Your Objective
          </h2>
          <p className="text-stone-800 text-lg ml-6 font-medium">
            {mission.task}
          </p>

          <div className="mt-6 ml-6">
            <h4 className="text-sm font-bold uppercase tracking-widest text-stone-500 mb-2">Base Code</h4>
            <div className="bg-[#1e1e1e] rounded-md overflow-hidden border border-stone-800">
              <pre className="p-4 text-[14px] font-mono text-stone-300 overflow-x-auto">
                <code>{mission.baseCode}</code>
              </pre>
            </div>
          </div>
        </section>

        {/* Solution Toggle */}
        <section className="pt-4 border-t border-stone-300">
          <button
            onClick={() => setShowSolution(!showSolution)}
            className="flex items-center gap-2 text-[#a82c2c] hover:text-red-600 font-bold uppercase tracking-wider text-sm transition-colors"
          >
            <CheckCircle size={18} />
            {showSolution ? "Hide Solution" : "Reveal Solution"}
          </button>

          {showSolution && (
            <div className="mt-4 bg-[#1e1e1e] rounded-md overflow-hidden shadow-lg border border-green-900/50">
               <div className="bg-green-950/30 px-4 py-2 border-b border-green-900/50 flex items-center gap-2">
                <span className="text-xs font-mono text-green-400">solution.py</span>
              </div>
              <pre className="p-5 text-[14px] font-mono text-green-300 overflow-x-auto leading-relaxed">
                <code>{mission.solutionCode}</code>
              </pre>
            </div>
          )}
        </section>

      </div>

      {/* Footer / Next Button */}
      <div className="bg-stone-200 p-4 border-t-2 border-stone-300 flex justify-end">
        {!isLast && (
          <button
            onClick={() => {
              setShowSolution(false);
              onNext();
            }}
            className="bg-[#3a2717] hover:bg-[#523d2e] text-[#ebdcb9] px-6 py-3 rounded font-serif font-bold uppercase tracking-widest flex items-center gap-2 transition-transform hover:scale-105 shadow-lg"
          >
            Next Mission <ChevronRight size={18} />
          </button>
        )}
        {isLast && (
          <div className="text-green-700 font-black uppercase tracking-widest font-serif flex items-center gap-2">
            <CheckCircle size={24} /> Course Complete!
          </div>
        )}
      </div>
    </div>
  );
};
