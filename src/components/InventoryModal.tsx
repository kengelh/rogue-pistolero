import React, { useState } from "react";
import { Player, InventoryItem } from "../types";
import {
  Package,
  X,
  Target,
  Droplets,
  Sparkles,
  Map,
  ChevronDown,
  ChevronRight,
  Trash2,
  ArrowUp,
  Scale,
  AlertTriangle,
  Shield,
  Wrench,
  CheckCircle2,
  Crosshair,
  Gauge,
  Eye,
  Info,
  Circle,
  TrendingUp,
} from "lucide-react";

interface InventoryModalProps {
  player: Player;
  onClose: () => void;
  onDropItem?: (itemId: string) => void;
  onEquipWeapon?: (itemId: string) => void;
  onEquipMount?: (mountIndex: number) => void;
}

export function getItemWeight(item: {
  id: string;
  name: string;
  type: string;
}): number {
  if (item.id === "whiskey") return 1.0;
  if (item.id === "elixir") return 1.0;
  if (item.id === "ammo_pistol" || item.id === "ammo_45_colt") return 0.1;
  if (item.id === "ammo_rifle" || item.id === "ammo_44_40_winchester") return 0.15;
  if (item.id === "ammo_shotgun" || item.id === "ammo_12_gauge") return 0.2;
  if (item.id === "ammo_box") return 3.0; // fallback
  if (item.id === "bandage") return 0.5;
  if (item.id === "gunpowder") return 1.5;
  if (item.id === "glass_scope") return 1.0;
  if (item.id === "safe_springs") return 0.5;
  if (item.id === "dynamite") return 1.5;
  if (item.id === "lockpick") return 0.2;
  if (item.id === "ancient_relic") return 8.0;
  if (item.id.startsWith("wpn_") || item.type === "weapon") {
    const n = item.name.toLowerCase();
    if (n.includes("shotgun")) return 10.0;
    if (n.includes("rifle")) return 12.0;
    if (
      n.includes("revolver") ||
      n.includes("colt") ||
      n.includes("pistol") ||
      n.includes("peacemaker")
    )
      return 3.0;
    return 6.0;
  }
  return 0.5; // default
}

function getWeaponItemStats(item: InventoryItem) {
  if (item.weaponStats) {
    return {
      dmg: item.weaponStats.dmg,
      range: item.weaponStats.range,
      maxClip: item.weaponStats.maxClip,
      ammoType: item.weaponStats.ammoType || "pistol",
    };
  }
  const idLower = item.id.toLowerCase();
  if (idLower.includes("shotgun")) {
    return { dmg: 35, range: 3, maxClip: 2, ammoType: "shotgun" as const };
  } else if (idLower.includes("rifle")) {
    return { dmg: 28, range: 8, maxClip: 6, ammoType: "rifle" as const };
  } else {
    return { dmg: 18, range: 5, maxClip: 6, ammoType: "pistol" as const };
  }
}

export const InventoryModal: React.FC<InventoryModalProps> = ({
  player,
  onClose,
  onDropItem,
  onEquipWeapon,
  onEquipMount,
}) => {
  const [openCategories, setOpenCategories] = useState<{
    [key: string]: boolean;
  }>({
    weapon: true,
    consumable: true,
    value: true,
    weapon_part: false,
    map_note: false,
  });

  const [hoveredWeapon, setHoveredWeapon] = useState<InventoryItem | null>(null);

  const toggleCategory = (cat: string) => {
    setOpenCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  const totalWeight = parseFloat(
    player.inventory
      .reduce((sum, item) => sum + getItemWeight(item) * item.count, 0)
      .toFixed(1),
  );
  const maxWeight = player.activeCarriage ? player.activeCarriage.maxWeight : 40.0;
  const isOverburdened = totalWeight > maxWeight;

  // Active Equipped Weapon details
  const equippedWeapon = player.weapon;
  const equippedDmg = equippedWeapon.dmg;
  const equippedRange = equippedWeapon.range;
  const equippedMaxClip = equippedWeapon.maxClip;

  // Stats comparison when hovering over an unequipped weapon
  const comparedStats = hoveredWeapon ? getWeaponItemStats(hoveredWeapon) : null;

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-0 sm:p-4 z-[100] backdrop-blur-md">
      <div className="bg-[#f4ead5] w-full h-full sm:h-auto max-w-5xl border-0 sm:border-4 border-[#3d2d21] sm:rounded-sm flex flex-col shadow-[0_0_60px_rgba(0,0,0,0.95)] max-h-screen sm:max-h-[95vh]">
        
        {/* Header */}
        <div className="bg-[#3d2d21] text-[#f4ead5] p-3 sm:p-4 flex justify-between items-center border-b border-[#2d2119] shrink-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <Package size={18} className="text-[#e8b923]" />
            <h2 className="text-sm sm:text-xl font-bold uppercase tracking-widest font-serif truncate">
              Saddlebags & Equipage
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-[#bfae96] hover:text-white transition-colors cursor-pointer p-1"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Panel (Responsive Grid) */}
        <div className="p-3 sm:p-5 overflow-y-auto custom-scrollbar flex-1 bg-[#150f0c] grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 text-stone-300">
          
          {/* LEFT COLUMN: ACTIVE LOADOUT (Visual Gun Rack & Mount Stables) */}
          <div className="lg:col-span-5 space-y-4 flex flex-col justify-start">
            
            {/* Title / Section Header */}
            <div className="bg-[#2d2119] border border-[#5c4033] p-2.5 rounded-sm shadow-sm flex items-center gap-2">
              <span className="text-[#e8b923]">🤠</span>
              <span className="font-serif font-bold text-xs uppercase tracking-wider text-stone-100">
                Active Equipped Loadout
              </span>
            </div>

            {/* VISUAL FIREARM rack */}
            <div className="bg-[#251b15] border-2 border-[#8c6b0c] p-4 rounded-sm shadow-md space-y-4 relative overflow-hidden">
              {/* Background Accent Lines resembling a wooden gun cabinet */}
              <div className="absolute top-0 right-0 p-4 opacity-5 text-amber-500 pointer-events-none">
                <Target size={120} />
              </div>

              <div className="flex justify-between items-start border-b border-[#5a4838]/40 pb-2">
                <div>
                  <span className="text-[9px] uppercase font-mono tracking-widest text-amber-500 block">
                    Equipped Primary Weapon
                  </span>
                  <h3 className="text-base font-serif font-black text-stone-100 tracking-wide mt-0.5">
                    {equippedWeapon.name}
                  </h3>
                </div>
                <div className="text-right">
                  <span className="px-2 py-0.5 bg-[#8c6b0c]/30 text-[#e8b923] text-[9px] font-mono font-bold uppercase tracking-wider rounded-sm border border-[#8c6b0c]/50">
                    {equippedWeapon.ammoType.toUpperCase()} CALIBER
                  </span>
                </div>
              </div>

              {/* Weapon Visual Illustration Placeholder Based on Caliber */}
              <div className="w-full h-14 bg-gradient-to-r from-stone-900/80 to-stone-950/80 rounded border border-[#5a4838]/30 flex items-center justify-center relative overflow-hidden p-2">
                <div className="absolute left-2 text-[#bfae96]/15 font-mono text-[9px] select-none">
                  STEEL CHAMBER • ENGRAVED
                </div>
                <div className="text-3xl filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] select-none">
                  {equippedWeapon.ammoType === "shotgun" ? "💥" : equippedWeapon.ammoType === "rifle" ? "🎯" : "🔫"}
                </div>
                
                {/* Durability indicator bar */}
                <div className="absolute bottom-1 right-2 flex items-center gap-1.5 text-[9px] text-[#bfae96] font-mono">
                  <Shield size={10} className="text-[#8c6b0c]" />
                  <span>Condition:</span>
                  <span className="text-amber-500 font-bold">
                    {equippedWeapon.condition !== undefined ? `${equippedWeapon.condition}%` : "100%"}
                  </span>
                </div>
              </div>

              {/* STATS GAUGES / BARS WITH HOVER COMPARISONS */}
              <div className="space-y-3 font-sans">
                
                {/* 1. DAMAGE STAT */}
                <div>
                  <div className="flex justify-between text-[10px] uppercase font-bold tracking-wider text-stone-400 mb-1">
                    <span className="flex items-center gap-1">
                      <Gauge size={11} className="text-red-500" /> Damage Power
                    </span>
                    <span className="font-mono">
                      {equippedDmg} HP
                      {comparedStats && (
                        <span className={`ml-2 font-bold ${comparedStats.dmg > equippedDmg ? "text-green-400" : comparedStats.dmg < equippedDmg ? "text-red-400" : "text-stone-400"}`}>
                          {comparedStats.dmg > equippedDmg ? `(+${comparedStats.dmg - equippedDmg})` : comparedStats.dmg < equippedDmg ? `(${comparedStats.dmg - equippedDmg})` : "(=)"}
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-stone-900 rounded-sm overflow-hidden relative border border-[#5a4838]/30">
                    <div
                      className="h-full bg-red-600 transition-all duration-300"
                      style={{ width: `${Math.min(100, (equippedDmg / 50) * 100)}%` }}
                    />
                    {/* Hover comparison overlay bar */}
                    {comparedStats && comparedStats.dmg > equippedDmg && (
                      <div
                        className="absolute top-0 h-full bg-green-500/60 animate-pulse"
                        style={{
                          left: `${(equippedDmg / 50) * 100}%`,
                          width: `${Math.min(100, ((comparedStats.dmg - equippedDmg) / 50) * 100)}%`,
                        }}
                      />
                    )}
                  </div>
                </div>

                {/* 2. RANGE STAT */}
                <div>
                  <div className="flex justify-between text-[10px] uppercase font-bold tracking-wider text-stone-400 mb-1">
                    <span className="flex items-center gap-1">
                      <Eye size={11} className="text-blue-400" /> Range / Accuracy
                    </span>
                    <span className="font-mono">
                      {equippedRange} Tiles
                      {comparedStats && (
                        <span className={`ml-2 font-bold ${comparedStats.range > equippedRange ? "text-green-400" : comparedStats.range < equippedRange ? "text-red-400" : "text-stone-400"}`}>
                          {comparedStats.range > equippedRange ? `(+${comparedStats.range - equippedRange})` : comparedStats.range < equippedRange ? `(${comparedStats.range - equippedRange})` : "(=)"}
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-stone-900 rounded-sm overflow-hidden relative border border-[#5a4838]/30">
                    <div
                      className="h-full bg-blue-500 transition-all duration-300"
                      style={{ width: `${Math.min(100, (equippedRange / 12) * 100)}%` }}
                    />
                    {/* Hover comparison overlay bar */}
                    {comparedStats && comparedStats.range > equippedRange && (
                      <div
                        className="absolute top-0 h-full bg-green-500/60 animate-pulse"
                        style={{
                          left: `${(equippedRange / 12) * 100}%`,
                          width: `${Math.min(100, ((comparedStats.range - equippedRange) / 12) * 100)}%`,
                        }}
                      />
                    )}
                  </div>
                </div>

                {/* 3. CLIP/MAX CLIP STAT */}
                <div>
                  <div className="flex justify-between text-[10px] uppercase font-bold tracking-wider text-stone-400 mb-1">
                    <span className="flex items-center gap-1">
                      <Crosshair size={11} className="text-amber-500" /> Chamber Capacity
                    </span>
                    <span className="font-mono">
                      {equippedMaxClip} Rounds
                      {comparedStats && (
                        <span className={`ml-2 font-bold ${comparedStats.maxClip > equippedMaxClip ? "text-green-400" : comparedStats.maxClip < equippedMaxClip ? "text-red-400" : "text-stone-400"}`}>
                          {comparedStats.maxClip > equippedMaxClip ? `(+${comparedStats.maxClip - equippedMaxClip})` : comparedStats.maxClip < equippedMaxClip ? `(${comparedStats.maxClip - equippedMaxClip})` : "(=)"}
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-stone-900 rounded-sm overflow-hidden relative border border-[#5a4838]/30">
                    <div
                      className="h-full bg-amber-500 transition-all duration-300"
                      style={{ width: `${Math.min(100, (equippedMaxClip / 10) * 100)}%` }}
                    />
                    {/* Hover comparison overlay bar */}
                    {comparedStats && comparedStats.maxClip > equippedMaxClip && (
                      <div
                        className="absolute top-0 h-full bg-green-500/60 animate-pulse"
                        style={{
                          left: `${(equippedMaxClip / 10) * 100}%`,
                          width: `${Math.min(100, ((comparedStats.maxClip - equippedMaxClip) / 10) * 100)}%`,
                        }}
                      />
                    )}
                  </div>
                </div>

              </div>

              {/* TACTILE REVOLVER CYLINDER/CHAMBER INDICATOR */}
              <div className="bg-[#1b1410] p-3 border border-[#5a4838]/30 rounded-sm space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] uppercase font-mono tracking-wider text-[#bfae96] flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" /> Ready Chambers:
                  </span>
                  <span className="text-xs font-mono font-bold text-[#e8b923]">
                    {equippedWeapon.clip} / {equippedWeapon.maxClip} LOADED
                  </span>
                </div>
                
                <div className="flex items-center justify-center gap-2 py-1">
                  {Array.from({ length: equippedWeapon.maxClip }).map((_, idx) => {
                    const isLoaded = idx < equippedWeapon.clip;
                    return (
                      <div
                        key={idx}
                        className={`w-4 h-6 rounded-t-md rounded-b-sm border transition-all duration-300 flex flex-col items-center justify-between p-0.5 ${
                          isLoaded
                            ? "bg-gradient-to-b from-amber-400 to-amber-600 border-amber-600 shadow-[0_2px_4px_rgba(232,185,35,0.4)]"
                            : "bg-stone-950/40 border-[#5a4838] opacity-40"
                        }`}
                        title={isLoaded ? "Live Cartridge" : "Spent Brass Casing"}
                      >
                        {/* Bullet tip illustration */}
                        <div className={`w-1.5 h-1.5 rounded-full ${isLoaded ? "bg-stone-500" : "bg-transparent"}`} />
                        {/* Cartridge Primer base */}
                        <div className={`w-2.5 h-1 rounded-sm ${isLoaded ? "bg-amber-300" : "bg-transparent"}`} />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* EQUIPPED WEAPON UPGRADE PARTS Sockets */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center gap-1 text-[9px] uppercase font-bold tracking-widest text-[#bfae96]">
                  <Wrench size={10} />
                  <span>Gunsmith Attachments / Modification Parts</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  {[
                    { slot: "barrel", label: "Barrel", display: equippedWeapon.equippedParts?.barrel?.name || "Standard Barrel" },
                    { slot: "cylinder", label: "Cylinder", display: equippedWeapon.equippedParts?.cylinder?.name || "Standard Cylinder" },
                    { slot: "stock", label: "Stock/Grip", display: equippedWeapon.equippedParts?.stock?.name || "Standard Wood Grip" },
                    { slot: "action", label: "Hammer/Action", display: equippedWeapon.equippedParts?.action?.name || "Standard Action" },
                  ].map((part) => {
                    const hasUpgradedPart = equippedWeapon.equippedParts && (equippedWeapon.equippedParts as any)[part.slot];
                    return (
                      <div
                        key={part.slot}
                        className={`p-2 rounded-sm border flex items-center justify-between gap-1 ${
                          hasUpgradedPart
                            ? "bg-[#8c6b0c]/15 border-[#8c6b0c] text-amber-100"
                            : "bg-stone-900/40 border-[#5a4838]/25 text-stone-500"
                        }`}
                      >
                        <div className="truncate">
                          <span className="text-[8px] font-mono block uppercase text-stone-500">
                            {part.label}
                          </span>
                          <span className="font-serif truncate block font-bold">
                            {part.display}
                          </span>
                        </div>
                        {hasUpgradedPart && (
                          <CheckCircle2 size={12} className="text-amber-500 shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* VISUAL TRANSPORT (Mount & Stable Management) */}
            <div className="bg-[#251b15] border border-[#5c4033]/60 p-4 rounded-sm shadow-md space-y-3.5">
              <div className="flex justify-between items-center border-b border-[#5a4838]/40 pb-2">
                <span className="text-[9px] uppercase font-mono tracking-widest text-amber-500 block">
                  Active Mount & Stables
                </span>
                <span className="text-xs">🐴</span>
              </div>

              {player.hasHorse && player.mount ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 bg-stone-900/60 p-3 rounded border border-[#5a4838]/35">
                    <div className="text-2xl p-1 bg-[#8c6b0c]/10 rounded border border-[#8c6b0c]/30">
                      {player.mount.type === "donkey" ? "🫏" : "🐎"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[9px] font-mono block uppercase text-stone-500">
                        {player.mount.type.toUpperCase().replace("_", " ")} MOUNT
                      </span>
                      <h4 className="font-serif font-bold text-stone-100 truncate text-xs">
                        {player.mount.name}
                      </h4>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[10px] uppercase font-mono text-[#e8b923] font-bold block">
                        SPEED MULTIPLIER
                      </span>
                      <span className="font-mono text-xs text-stone-100 font-bold bg-[#8c6b0c]/20 px-2 py-0.5 rounded border border-[#8c6b0c]/40">
                        {player.mount.baseSpeedMultiplier.toFixed(2)}x
                      </span>
                    </div>
                  </div>

                  {/* Other Stabled Mounts - Equipped vs Unequipped swapping! */}
                  {player.ownedMounts && player.ownedMounts.length > 1 && (
                    <div className="space-y-1.5 pt-1.5 border-t border-[#5a4838]/20">
                      <span className="text-[9px] uppercase font-mono text-[#bfae96] block tracking-wide font-bold">
                        Other Owned Stable Horses ({player.ownedMounts.length - 1})
                      </span>
                      <div className="space-y-2 max-h-[110px] overflow-y-auto custom-scrollbar pr-1">
                        {player.ownedMounts.map((m, idx) => {
                          const isActive = player.mount && player.mount.name === m.name && player.mount.type === m.type;
                          if (isActive) return null; // don't list active horse

                          return (
                            <div
                              key={idx}
                              className="flex items-center justify-between bg-stone-900/40 hover:bg-stone-900/80 p-2 rounded-sm border border-[#5a4838]/20 text-xs transition-colors"
                            >
                              <div className="flex items-center gap-1.5">
                                <span>{m.type === "donkey" ? "🫏" : "🐎"}</span>
                                <div>
                                  <span className="font-serif block text-[11px] font-bold text-stone-300">
                                    {m.name}
                                  </span>
                                  <span className="text-[9px] text-[#5a4838] block uppercase">
                                    Speed: {m.baseSpeedMultiplier.toFixed(2)}x
                                  </span>
                                </div>
                              </div>

                              {onEquipMount && (
                                <button
                                  id={`equip-mount-button-${idx}`}
                                  onClick={() => onEquipMount(idx)}
                                  className="px-2 py-1 bg-[#8c6b0c] hover:bg-amber-600 active:bg-amber-700 text-stone-950 font-serif font-black text-[9px] uppercase tracking-wider rounded-sm transition-all cursor-pointer flex items-center gap-0.5"
                                >
                                  <ArrowUp size={8} /> Saddle Up
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-red-950/20 p-3 rounded border border-red-950/40 text-center space-y-1.5">
                  <p className="text-red-400 text-xs italic">
                    🚶 TRAVELING ON FOOT: You do not have an active mount!
                  </p>
                  <p className="text-[9px] text-stone-400">
                    Sands travel takes twice as long, and water hydration depletion rates are doubled. Visit a Stable in any district to buy a horse!
                  </p>
                </div>
              )}
            </div>

          </div>

          {/* RIGHT COLUMN: SADDLEBAGS CARGO (Unequipped inventory with tabs) */}
          <div className="lg:col-span-7 flex flex-col justify-start space-y-4">
            
            {/* Carrying capacity bar */}
            <div className="bg-[#f4ead5] text-[#3d2d21] p-4 rounded-sm border border-[#bfae96] shadow-md space-y-2.5">
              <div className="flex justify-between items-center text-[10px] uppercase font-serif tracking-wider">
                <span className="text-[#664d36] flex items-center gap-1.5 font-bold">
                  <Scale
                    size={12}
                    className={
                      isOverburdened ? "text-red-500 animate-pulse" : "text-[#8c6b0c]"
                    }
                  />{" "}
                  SADDLEBAG CAPACITY
                </span>
                <span
                  className={`font-mono font-bold text-sm ${isOverburdened ? "text-red-600 animate-pulse font-extrabold" : "text-[#8c6b0c]"}`}
                >
                  {totalWeight} / {maxWeight} LBS
                </span>
              </div>

              <div className="w-full h-3 bg-[#dcd1b9] rounded-full overflow-hidden border border-[#bfae96] relative">
                <div
                  className={`h-full transition-all duration-300 ${isOverburdened ? "bg-[#c4451a] shadow-[0_0_6px_red]" : "bg-[#e8b923]"}`}
                  style={{
                    width: `${Math.min(100, (totalWeight / maxWeight) * 100)}%`,
                  }}
                />
              </div>

              {isOverburdened && (
                <p className="text-[10px] text-[#c4451a] font-semibold flex items-center gap-1 bg-red-950/25 p-1.5 border border-red-950/40 rounded-sm">
                  <AlertTriangle size={11} className="shrink-0 animate-bounce" /> OVERENCUMBERED: Heatwave/water penalties doubled & overland travel costs increased!
                </p>
              )}
            </div>

            {/* Saddlebags List Container */}
            <div className="bg-[#f4ead5] text-[#3d2d21] border border-[#bfae96] rounded-sm p-4 flex flex-col flex-1 min-h-[400px]">
              <div className="text-[11px] text-[#664d36] uppercase font-bold tracking-widest font-serif border-b border-[#bfae96] pb-1.5 mb-3 flex justify-between items-center">
                <span>Cargo Pack Ledger</span>
                <span className="font-mono text-[10px] bg-[#3d2d21] text-[#f4ead5] px-2 py-0.5 rounded-sm">
                  {player.inventory.length} Load Slots
                </span>
              </div>

              {player.inventory.length === 0 ? (
                <div className="text-xs text-[#664d36] italic py-20 text-center font-serif leading-relaxed max-w-sm mx-auto">
                  "Your saddlebags are flapping empty in the badlands breeze, partner. Loot outlaws, salvage ruins, or purchase goods from district stores to stock cargo."
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
                  {[
                    {
                      id: "weapon",
                      label: "Weapons & Firearms",
                      Icon: Target,
                      iconColor: "text-[#8c6b0c]",
                    },
                    {
                      id: "consumable",
                      label: "Medical & Rations",
                      Icon: Droplets,
                      iconColor: "text-[#c4451a]",
                    },
                    {
                      id: "value",
                      label: "Valuables & Cargo Goods",
                      Icon: Sparkles,
                      iconColor: "text-amber-500",
                    },
                    {
                      id: "weapon_part",
                      label: "Gunsmith Modifications",
                      Icon: Package,
                      iconColor: "text-[#664d36]",
                    },
                    {
                      id: "map_note",
                      label: "Intel & Contract Deeds",
                      Icon: Map,
                      iconColor: "text-blue-500",
                    },
                  ].map((category) => {
                    const itemsInCategory = player.inventory.filter(
                      (item) => item.type === category.id,
                    );
                    if (itemsInCategory.length === 0) return null;

                    return (
                      <div
                        key={category.id}
                        className="border border-[#bfae96]/40 rounded-sm overflow-hidden mb-1 bg-[#eae0cc]"
                      >
                        {/* CATEGORY ACCORDION HEADER */}
                        <button
                          onClick={() => toggleCategory(category.id)}
                          className="w-full bg-[#e8dec7] hover:bg-[#dcd1b9] px-2.5 py-2 flex justify-between items-center transition-colors text-left border-b border-[#bfae96]/20 cursor-pointer"
                        >
                          <div className="flex items-center gap-1.5 text-[10px] font-bold font-serif uppercase tracking-wider text-[#3d2d21]">
                            <category.Icon size={12} className={category.iconColor} />
                            {category.label} ({itemsInCategory.length})
                          </div>
                          {openCategories[category.id] ? (
                            <ChevronDown size={13} className="text-[#664d36]" />
                          ) : (
                            <ChevronRight size={13} className="text-[#664d36]" />
                          )}
                        </button>
                        
                        {/* ITEMS LIST */}
                        {openCategories[category.id] && (
                          <div className="bg-[#f0e8d5] p-2 space-y-1.5">
                            {itemsInCategory.map((item) => {
                              const weightItem = getItemWeight(item);
                              const totalW = parseFloat(
                                (weightItem * item.count).toFixed(1),
                              );
                              const isItemWeapon = item.type === "weapon" && (item.id.startsWith("wpn_") || item.id === "special_shotgun" || item.id === "special_rifle");

                              return (
                                <div
                                  key={item.id}
                                  className="flex items-center justify-between bg-[#e8dec7] hover:bg-[#201712] hover:text-[#e8dec7] p-2.5 rounded-sm border border-[#bfae96]/60 transition-colors text-xs gap-2 group/item"
                                  onMouseEnter={() => {
                                    if (isItemWeapon) {
                                      setHoveredWeapon(item);
                                    }
                                  }}
                                  onMouseLeave={() => {
                                    if (isItemWeapon) {
                                      setHoveredWeapon(null);
                                    }
                                  }}
                                >
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-1">
                                      <span className="text-[#8c6b0c] group-hover/item:text-[#e8b923] font-serif font-bold truncate block">
                                        {item.name}{" "}
                                        {item.count > 1 && (
                                          <span className="text-[#5a4838] group-hover/item:text-stone-400 text-[10px]">
                                            ({item.count}x)
                                          </span>
                                        )}
                                      </span>
                                      
                                      <div className="flex items-center gap-2 flex-shrink-0">
                                        {isItemWeapon && (
                                          <span className="text-[8px] bg-amber-500/10 text-amber-600 group-hover/item:text-amber-400 font-mono font-bold uppercase tracking-widest border border-amber-500/20 px-1 py-0.2 rounded-sm flex items-center gap-0.5">
                                            <TrendingUp size={8} /> Compare Active
                                          </span>
                                        )}
                                        <span className="text-[9px] text-[#5a4838] group-hover/item:text-stone-400 font-mono">
                                          {totalW} lbs
                                        </span>
                                      </div>
                                    </div>
                                    <p className="text-[10px] text-[#5a4838] group-hover/item:text-stone-300 block truncate mt-0.5 leading-relaxed">
                                      {item.details}
                                    </p>

                                    {/* Action button if the item is a backup weapon (Equip!) */}
                                    {isItemWeapon && onEquipWeapon && (
                                      <button
                                        id={`equip-backup-modal-${item.id}`}
                                        onClick={() => onEquipWeapon(item.id)}
                                        className="mt-1.5 px-2 py-1 bg-[#3d2d21] hover:bg-[#4d3a2b] text-[#e8b923] group-hover/item:text-amber-400 group-hover/item:bg-amber-950 border border-[#8a705a]/60 text-[9px] uppercase font-bold tracking-wider rounded-sm font-serif cursor-pointer flex items-center gap-0.5 transition-all shadow-sm"
                                      >
                                        <ArrowUp size={9} /> Equip Sidearm
                                      </button>
                                    )}
                                  </div>

                                  {/* Discard button */}
                                  {onDropItem && (
                                    <button
                                      id={`drop-item-modal-${item.id}`}
                                      onClick={() => onDropItem(item.id)}
                                      title={`Discard / Drop ${item.name}`}
                                      className="p-1.5 text-[#5a4838] group-hover/item:text-red-400 hover:text-red-500 hover:bg-stone-850 rounded-sm cursor-pointer shrink-0 transition-colors"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

        </div>

        {/* Footer */}
        <div className="bg-[#3d2d21] p-2.5 sm:p-3 text-center border-t border-[#2d2119] flex justify-between items-center px-4 sm:px-6 shrink-0">
          <span className="text-[9px] sm:text-[10px] text-[#bfae96] font-mono tracking-wider flex items-center gap-1 sm:gap-1.5 hidden md:flex truncate mr-2">
            <Info size={11} className="text-[#e8b923]" />
            HOVER OVER UNEQUIPPED WEAPONS TO INITIATE SIDE-BY-SIDE LOADOUT COMPARISONS
          </span>
          <button
            onClick={onClose}
            className="px-4 sm:px-6 py-1.5 bg-[#e8b923] hover:bg-amber-500 text-stone-900 font-serif font-black text-xs uppercase tracking-widest rounded-sm shadow cursor-pointer transition-all ml-auto"
          >
            Return to Trail
          </button>
        </div>

      </div>
    </div>
  );
};
