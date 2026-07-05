import React, { useState } from "react";
import {
  ShieldAlert,
  Users,
  TrainFront,
  Tent,
  Crosshair,
  Skull,
  Banknote,
  MapPin,
  Search,
  PlusCircle,
  X,
  Power,
  CloudLightning,
  MoonStar,
} from "lucide-react";
import { Player, PosseMember } from "../types";

interface GodModeModalProps {
  isActive: boolean;
  onToggle: (active: boolean) => void;
  onClose: () => void;
  onTriggerEvent: (
    type: "train_robbery" | "ambush" | "camp_ambush" | "robbery" | "nest_clearing" | "bounty",
  ) => void;
  onAddPosseMember: (member: PosseMember) => void;
  forcedWeather?: string | null;
  onForceWeather?: (weather: string | null) => void;
  forcedTimeOfDay?: "day" | "night" | null;
  onForceTimeOfDay?: (time: "day" | "night" | null) => void;
}

const SAMPLE_POSSE_MEMBERS: PosseMember[] = [
  {
    id: "recruit_holliday",
    name: "Doc Holliday",
    role: "Medic",
    hp: 40,
    maxHp: 40,
    dmg: 20,
    range: 40,
    dailyRateGold: 0,
    portrait: "🩺",
    description: "A sharp-shooting dentist with a heavy cough.",
  },
  {
    id: "recruit_swift",
    name: "Jack Swift",
    role: "Gunslinger",
    hp: 45,
    maxHp: 45,
    dmg: 25,
    range: 50,
    dailyRateGold: 0,
    portrait: "🔫",
    description: "Lightning-fast fan-firer.",
  },
  {
    id: "recruit_scout",
    name: "Apache Scout",
    role: "Scout",
    hp: 50,
    maxHp: 50,
    dmg: 15,
    range: 60,
    dailyRateGold: 0,
    portrait: "🦅",
    description: "Marks enemy locations instantly.",
  },
  {
    id: "recruit_buster",
    name: "Buster Cleaver",
    role: "Bodyguard",
    hp: 80,
    maxHp: 80,
    dmg: 10,
    range: 20,
    dailyRateGold: 0,
    portrait: "🛡️",
    description: "Absorbs shots with boiler plates.",
  },
  {
    id: "recruit_hunter",
    name: "Jesse The Marshal",
    role: "Bounty Hunter",
    hp: 60,
    maxHp: 60,
    dmg: 35,
    range: 80,
    dailyRateGold: 0,
    portrait: "🤠",
    description: "Custom copper rounds for massive damage.",
  },
];

export const GodModeModal: React.FC<GodModeModalProps> = ({
  isActive,
  onToggle,
  onClose,
  onTriggerEvent,
  onAddPosseMember,
  forcedWeather,
  onForceWeather,
  forcedTimeOfDay,
  onForceTimeOfDay,
}) => {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-0 sm:p-4 z-50 backdrop-blur-sm">
      <div className="bg-[#e8dec7] border-0 sm:border-4 border-[#3d2d21] p-4 sm:p-6 max-w-sm sm:max-w-md w-full h-full sm:h-auto max-h-screen sm:max-h-[90vh] sm:rounded-sm shadow-2xl relative flex flex-col overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-[#3d2d21] hover:text-red-700 p-2 z-10 cursor-pointer"
        >
          <X size={20} />
        </button>

        <div className="flex flex-col items-center gap-1.5 mb-4 pb-3 border-b-2 border-[#bfae96] text-center shrink-0">
          <ShieldAlert
            size={40}
            className={
              isActive ? "text-amber-500 animate-pulse" : "text-stone-500"
            }
          />
          <h2 className="text-xl font-black uppercase tracking-widest text-[#3d2d21]">
            Dev Tool
          </h2>
          <p className="text-xs text-stone-600 font-serif leading-tight">
            Master control for debug overrides.
          </p>
        </div>

        <div className="space-y-4 sm:space-y-6 overflow-y-auto flex-1 pr-1 custom-scrollbar">
          <div className="bg-[#dcd1b9] p-4 rounded border-2 border-[#bfae96]">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg flex items-center gap-2 text-[#3d2d21] uppercase tracking-wide">
                  <Power size={18} /> Global Override
                </h3>
                <p className="text-xs text-stone-700 italic">
                  Toggle Unlimited Money & Max Skills.
                </p>
              </div>
              <button
                onClick={() => onToggle(!isActive)}
                className={`py-2 px-4 font-bold border-2 rounded ${
                  isActive
                    ? "bg-amber-500 text-stone-900 border-amber-600 shadow-[0_0_15px_rgba(245,158,11,0.5)]"
                    : "bg-stone-300 text-stone-600 border-stone-400 hover:bg-stone-400"
                }`}
              >
                {isActive ? "ENABLED" : "DISABLED"}
              </button>
            </div>
            {isActive && (
              <div className="text-[10px] text-amber-700 mt-2">
                Changes will be reverted when deactivated!
              </div>
            )}
          </div>

          <div>
            <h3 className="font-bold text-lg mb-2 flex items-center gap-2 text-[#3d2d21] uppercase tracking-wide border-b border-[#bfae96] pb-1">
              <Crosshair size={18} /> Trigger Scenarios
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onTriggerEvent("train_robbery")}
                className="bg-[#2d2119] text-stone-100 p-2 text-left font-bold text-xs hover:bg-amber-800 transition-colors border border-stone-900 shadow-sm flex items-center gap-2"
              >
                <TrainFront size={14} /> Train Robbery
              </button>
              <button
                onClick={() => onTriggerEvent("camp_ambush")}
                className="bg-[#2d2119] text-stone-100 p-2 text-left font-bold text-xs hover:bg-amber-800 transition-colors border border-stone-900 shadow-sm flex items-center gap-2"
              >
                <Tent size={14} /> Camp Ambush
              </button>
              <button
                onClick={() => onTriggerEvent("robbery")}
                className="bg-[#2d2119] text-stone-100 p-2 text-left font-bold text-xs hover:bg-amber-800 transition-colors border border-stone-900 shadow-sm flex items-center gap-2"
              >
                <Banknote size={14} /> Bank Heist
              </button>
              <button
                onClick={() => onTriggerEvent("nest_clearing")}
                className="bg-[#2d2119] text-stone-100 p-2 text-left font-bold text-xs hover:bg-amber-800 transition-colors border border-stone-900 shadow-sm flex items-center gap-2"
              >
                <Skull size={14} /> Outlaw Nest
              </button>
              <button
                onClick={() => onTriggerEvent("bounty")}
                className="col-span-2 bg-[#2d2119] text-stone-100 p-2 text-left font-bold text-xs hover:bg-amber-800 transition-colors border border-stone-900 shadow-sm flex items-center gap-2"
              >
                <Search size={14} /> Track Random Bounty
              </button>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-2 flex items-center gap-2 text-[#3d2d21] uppercase tracking-wide border-b border-[#bfae96] pb-1">
              <CloudLightning size={18} /> Battle Weather
            </h3>
            <p className="text-xs text-stone-700 italic mb-2">
              Forces the next combat engagement to use this weather. Must be set
              before entering combat.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onForceWeather?.(null)}
                className={`p-2 text-left font-bold text-xs transition-colors border shadow-sm flex items-center gap-2 ${forcedWeather === null || forcedWeather === undefined ? "bg-amber-500 text-stone-900 border-amber-600" : "bg-[#dcd1b9] text-stone-800 border-[#bfae96] hover:bg-[#cbae82]"}`}
              >
                🎲 Random
              </button>
              <button
                onClick={() => onForceWeather?.("clear")}
                className={`p-2 text-left font-bold text-xs transition-colors border shadow-sm flex items-center gap-2 ${forcedWeather === "clear" ? "bg-amber-500 text-stone-900 border-amber-600" : "bg-[#dcd1b9] text-stone-800 border-[#bfae96] hover:bg-[#cbae82]"}`}
              >
                ☀️ Clear
              </button>
              <button
                onClick={() => onForceWeather?.("heatwave")}
                className={`p-2 text-left font-bold text-xs transition-colors border shadow-sm flex items-center gap-2 ${forcedWeather === "heatwave" ? "bg-amber-500 text-stone-900 border-amber-600" : "bg-[#dcd1b9] text-stone-800 border-[#bfae96] hover:bg-[#cbae82]"}`}
              >
                🌵 Heatwave
              </button>
              <button
                onClick={() => onForceWeather?.("fog")}
                className={`p-2 text-left font-bold text-xs transition-colors border shadow-sm flex items-center gap-2 ${forcedWeather === "fog" ? "bg-amber-500 text-stone-900 border-amber-600" : "bg-[#dcd1b9] text-stone-800 border-[#bfae96] hover:bg-[#cbae82]"}`}
              >
                🌫️ Fog
              </button>
              <button
                onClick={() => onForceWeather?.("blinding_sun")}
                className={`p-2 text-left font-bold text-xs transition-colors border shadow-sm flex items-center gap-2 ${forcedWeather === "blinding_sun" ? "bg-amber-500 text-stone-900 border-amber-600" : "bg-[#dcd1b9] text-stone-800 border-[#bfae96] hover:bg-[#cbae82]"}`}
              >
                🌞 Blinding Sun
              </button>
              <button
                onClick={() => onForceWeather?.("overcast")}
                className={`p-2 text-left font-bold text-xs transition-colors border shadow-sm flex items-center gap-2 ${forcedWeather === "overcast" ? "bg-amber-500 text-stone-900 border-amber-600" : "bg-[#dcd1b9] text-stone-800 border-[#bfae96] hover:bg-[#cbae82]"}`}
              >
                ☁️ Overcast
              </button>
              <button
                onClick={() => onForceWeather?.("desert_mirage")}
                className={`col-span-2 p-2 text-left font-bold text-xs transition-colors border shadow-sm flex items-center gap-2 ${forcedWeather === "desert_mirage" ? "bg-amber-500 text-stone-900 border-amber-600" : "bg-[#dcd1b9] text-stone-800 border-[#bfae96] hover:bg-[#cbae82]"}`}
              >
                🏜️ Desert Mirage
              </button>
              <button
                onClick={() => onForceWeather?.("lightning_storm")}
                className={`col-span-2 p-2 text-left font-bold text-xs transition-colors border shadow-sm flex items-center gap-2 ${forcedWeather === "lightning_storm" ? "bg-amber-500 text-stone-900 border-amber-600" : "bg-[#dcd1b9] text-stone-800 border-[#bfae96] hover:bg-[#cbae82]"}`}
              >
                ⚡ Lightning Storm
              </button>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-2 flex items-center gap-2 text-[#3d2d21] uppercase tracking-wide border-b border-[#bfae96] pb-1">
              <MoonStar size={18} /> Time of Day
            </h3>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => onForceTimeOfDay?.(null)}
                className={`p-2 text-left font-bold text-xs transition-colors border shadow-sm flex items-center justify-center gap-2 ${forcedTimeOfDay === null || forcedTimeOfDay === undefined ? "bg-amber-500 text-stone-900 border-amber-600" : "bg-[#dcd1b9] text-stone-800 border-[#bfae96] hover:bg-[#cbae82]"}`}
              >
                🎲 Auto
              </button>
              <button
                onClick={() => onForceTimeOfDay?.("day")}
                className={`p-2 text-left font-bold text-xs transition-colors border shadow-sm flex items-center justify-center gap-2 ${forcedTimeOfDay === "day" ? "bg-amber-500 text-stone-900 border-amber-600" : "bg-[#dcd1b9] text-stone-800 border-[#bfae96] hover:bg-[#cbae82]"}`}
              >
                ☀️ Day
              </button>
              <button
                onClick={() => onForceTimeOfDay?.("night")}
                className={`p-2 text-left font-bold text-xs transition-colors border shadow-sm flex items-center justify-center gap-2 ${forcedTimeOfDay === "night" ? "bg-amber-500 text-stone-900 border-amber-600" : "bg-[#dcd1b9] text-stone-800 border-[#bfae96] hover:bg-[#cbae82]"}`}
              >
                🌙 Night
              </button>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-2 flex items-center gap-2 text-[#3d2d21] uppercase tracking-wide border-b border-[#bfae96] pb-1">
              <Users size={18} /> Spawn Posse
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {SAMPLE_POSSE_MEMBERS.map((member) => (
                <button
                  key={member.id}
                  onClick={() => onAddPosseMember(member)}
                  className="w-full text-left bg-[#dcd1b9] border border-[#bfae96] hover:border-amber-600 hover:shadow shadow-sm p-3 flex items-center gap-3 transition-colors group"
                >
                  <div className="text-2xl w-10 h-10 flex items-center justify-center bg-[#2d2119] rounded-full border-2 border-[#bfae96] group-hover:border-amber-500">
                    {member.portrait}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold uppercase text-xs text-[#3d2d21]">
                      {member.name}
                    </div>
                    <div className="text-[10px] text-amber-800 font-bold tracking-widest">
                      {member.role}
                    </div>
                    <div className="text-[10px] text-stone-600 font-serif leading-tight">
                      {member.description}
                    </div>
                  </div>
                  <PlusCircle
                    size={20}
                    className="text-stone-400 group-hover:text-amber-600"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#3d2d21] p-2.5 sm:p-3 text-center border-t border-[#2d2119] flex justify-end items-center mt-3 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#e8b923] hover:bg-amber-500 text-stone-900 font-serif font-bold text-xs uppercase tracking-widest rounded-sm shadow cursor-pointer transition-all w-full"
          >
            Close Dev Tool
          </button>
        </div>
      </div>
    </div>
  );
};
