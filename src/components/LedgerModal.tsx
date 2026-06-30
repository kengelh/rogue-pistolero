import React, { useState } from "react";
import { Player } from "../types";
import { BookOpen, X, MapPin, Eye, Skull, Flag, FileText } from "lucide-react";

interface LedgerModalProps {
  player: Player;
  onClose: () => void;
}

export const LedgerModal: React.FC<LedgerModalProps> = ({ player, onClose }) => {
  const [activeTab, setActiveTab] = useState<"quests" | "journal">("quests");
  const quests = player.acceptedQuests || [];
  const journalEntries = player.journalEntries || [];

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-0 sm:p-4 z-[100] backdrop-blur-sm">
      <div className="bg-[#f4ead5] w-full h-full sm:h-auto max-w-2xl border-0 sm:border-4 border-[#3d2d21] sm:rounded-sm flex flex-col shadow-[0_0_40px_rgba(0,0,0,0.8)] max-h-screen sm:max-h-[85vh]">
        
        {/* Header */}
        <div className="bg-[#3d2d21] text-[#f4ead5] p-3 sm:p-4 flex justify-between items-center border-b border-[#2d2119] shrink-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <BookOpen size={18} className="text-[#e8b923]" />
            <h2 className="text-sm sm:text-xl font-bold uppercase tracking-widest font-serif truncate">
              Journal & Posters
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-[#bfae96] hover:text-white transition-colors cursor-pointer p-1"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#bfae96] shrink-0">
          <button
            onClick={() => setActiveTab("quests")}
            className={`flex-1 py-2 font-serif text-xs sm:text-sm uppercase tracking-widest font-bold border-r border-[#bfae96] cursor-pointer ${activeTab === "quests" ? "bg-[#e8b923] text-[#3d2d21]" : "bg-[#dcd1b9] text-[#664d36] hover:bg-[#e4d8bc]"}`}
          >
            Active Quests
          </button>
          <button
            onClick={() => setActiveTab("journal")}
            className={`flex-1 py-2 font-serif text-xs sm:text-sm uppercase tracking-widest font-bold cursor-pointer ${activeTab === "journal" ? "bg-[#e8b923] text-[#3d2d21]" : "bg-[#dcd1b9] text-[#664d36] hover:bg-[#e4d8bc]"}`}
          >
            Investigation Log
          </button>
        </div>

        {/* Content */}
        <div className="p-3 sm:p-4 overflow-y-auto custom-scrollbar flex-1 bg-[#1a130f]">
          {activeTab === "quests" && (
            quests.length === 0 ? (
              <div className="text-center py-6 text-[#664d36] font-mono text-xs border border-[#3d2d21] rounded bg-[black]/20">
                No active posters. Check local saloons for bounty notices.
              </div>
            ) : (
              <div className="space-y-2">
                {quests.map((q) => (
                  <div key={q.id} className="bg-[#f4ead5] p-3 border border-[#bfae96] shadow-sm rounded-sm">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-bold font-serif text-[#3d2d21] text-sm uppercase tracking-wider flex items-center gap-1.5">
                        {q.type === "bounty" ? <Skull size={14} className="text-red-700" /> : <Flag size={14} className="text-blue-700" />}
                        <span className="truncate">{q.title}</span>
                      </h3>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 flex-shrink-0 rounded bg-[#3d2d21] text-[#e8b923]">
                        ${q.rewardGold} REWARD
                      </span>
                    </div>
                    
                    <p className="text-xs text-[#4a3928] font-serif italic mb-1.5 whitespace-pre-wrap leading-snug">
                      {q.description}
                    </p>

                    <div className="flex justify-between items-end gap-4 mt-2 pt-1.5 border-t border-[#bfae96]/40">
                      <div className="text-xs">
                        <span className="text-[#664d36] font-mono text-[9px] uppercase tracking-wider block mb-0.5">
                          Target Name
                        </span>
                        <strong className="text-[#8c6b0c] text-xs">{q.targetName}</strong>
                      </div>
                      {q.currentCluePoints !== undefined && (
                        <div className="text-xs flex-1 max-w-[100px]">
                          <span className="text-[#664d36] font-mono text-[9px] uppercase tracking-wider block text-right mb-0.5">
                            Progress
                          </span>
                          <div className="flex gap-0.5 h-1.5">
                            {Array.from({ length: q.maxClueThreshold || 3 }).map((_, i) => (
                              <div
                                key={i}
                                className={`h-full flex-1 rounded border border-[#3d2d21] ${
                                  i < (q.currentCluePoints || 0)
                                    ? "bg-[#8c6b0c]"
                                    : "bg-transparent opacity-20"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
          
          {activeTab === "journal" && (
            journalEntries.length === 0 ? (
              <div className="text-center py-6 text-[#664d36] font-mono text-xs border border-[#3d2d21] rounded bg-[black]/20">
                Your journal is empty. Investigate mysteries to uncover clues.
              </div>
            ) : (
              <div className="space-y-4">
                {journalEntries.map((entry) => (
                  <div key={entry.id} className="bg-[#f4ead5] p-3 border border-[#bfae96] shadow-sm rounded-sm">
                    <div className="flex justify-between items-start mb-2 border-b border-[#bfae96] pb-1">
                      <h3 className="font-bold font-serif text-[#3d2d21] text-sm uppercase flex items-center gap-1.5">
                        <FileText size={14} className="text-[#8c6b0c]" />
                        {entry.title}
                      </h3>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded text-[#664d36]">
                        {entry.date}
                      </span>
                    </div>
                    <p className="text-xs text-[#4a3928] font-serif italic whitespace-pre-wrap leading-snug">
                      {entry.text}
                    </p>
                  </div>
                ))}
              </div>
            )
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#3d2d21] p-2.5 sm:p-3 text-center border-t border-[#2d2119] flex justify-end items-center px-4 sm:px-6 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#e8b923] hover:bg-amber-500 text-stone-900 font-serif font-bold text-xs uppercase tracking-widest rounded-sm shadow cursor-pointer transition-all w-full sm:w-auto"
          >
            Close Ledger
          </button>
        </div>
      </div>
    </div>
  );
};
