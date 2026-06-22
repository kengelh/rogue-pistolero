import React from "react";
import { Player } from "../types";
import { BookOpen, X, MapPin, Eye, Skull, Flag } from "lucide-react";

interface LedgerModalProps {
  player: Player;
  onClose: () => void;
}

export const LedgerModal: React.FC<LedgerModalProps> = ({ player, onClose }) => {
  const quests = player.acceptedQuests || [];

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[100] backdrop-blur-sm">
      <div className="bg-[#f4ead5] w-full max-w-2xl border-4 border-[#3d2d21] rounded-sm flex flex-col shadow-[0_0_40px_rgba(0,0,0,0.8)] max-h-[85vh]">
        
        {/* Header */}
        <div className="bg-[#3d2d21] text-[#f4ead5] p-4 flex justify-between items-center border-b border-[#2d2119]">
          <div className="flex items-center gap-3">
            <BookOpen size={20} className="text-[#e8b923]" />
            <h2 className="text-xl font-bold uppercase tracking-widest font-serif">
              Posters & Quests
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-[#bfae96] hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto custom-scrollbar flex-1 bg-[#1a130f]">
          {quests.length === 0 ? (
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
          )}
        </div>
      </div>
    </div>
  );
};
