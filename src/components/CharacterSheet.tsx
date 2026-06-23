import React, { useState } from "react";
import { Player, InventoryItem } from "../types";
import overlandImg from "../assets/images/overland_1780566810461.png";
import {
  Shield,
  Sparkles,
  Heart,
  Droplets,
  Target,
  Award,
  Trash2,
  ShieldAlert,
  Users,
  Scale,
  AlertTriangle,
  ArrowUp,
  ChevronDown,
  ChevronRight,
  Package,
  Map,
} from "lucide-react";
import { PlayerAvatar, PlayerAppearance } from "./PlayerAvatar";

interface CharacterSheetProps {
  player: Player;
  onDropItem?: (itemId: string) => void;
  onEquipWeapon?: (itemId: string) => void;
  onCraftBandage?: () => void;
  onUpgradeCampSkill?: () => void;
  onRenameHorse?: (newName: string) => void;
  onRenameWeapon?: (newName: string) => void;
  onDismissPosseMember?: (id: string) => void;
  onOpenGunsmith?: () => void;
  onUpdateAppearance?: (appearance: PlayerAppearance) => void;
}

export function getItemWeight(item: {
  id: string;
  name: string;
  type: string;
}): number {
  if (item.id === "whiskey") return 1.0;
  if (item.id === "elixir") return 1.0;
  if (item.id === "ammo_pistol") return 1.0;
  if (item.id === "ammo_rifle") return 2.0;
  if (item.id === "ammo_shotgun") return 2.0;
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

export const CharacterSheet: React.FC<CharacterSheetProps> = ({
  player,
  onDropItem,
  onEquipWeapon,
  onCraftBandage,
  onRenameHorse,
  onRenameWeapon,
  onDismissPosseMember,
  onOpenGunsmith,
  onUpdateAppearance,
}) => {
  const [isEditingHorseName, setIsEditingHorseName] = useState(false);
  const [tempHorseName, setTempHorseName] = useState("");
  const [isEditingWeaponName, setIsEditingWeaponName] = useState(false);
  const [tempWeaponName, setTempWeaponName] = useState("");
  const [isEditingAppearance, setIsEditingAppearance] = useState(false);
  const [tempAppearance, setTempAppearance] = useState<PlayerAppearance>(
    player.appearance || {
      gender: player.gender || "male",
      skinTone: "#fcdbb6",
      hat: "cowboy",
      shirtColor: "white",
      hairStyle: "short",
      hairColor: "brown",
      facialHair: "none",
    },
  );
  const [openCategories, setOpenCategories] = useState<{
    [key: string]: boolean;
  }>({
    weapon: true,
    consumable: true,
    value: true,
    weapon_part: false,
    map_note: false,
  });

  const toggleCategory = (cat: string) => {
    setOpenCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  const handleSaveHorseName = () => {
    if (tempHorseName.trim() && onRenameHorse) {
      onRenameHorse(tempHorseName.trim());
    }
    setIsEditingHorseName(false);
  };

  const handleSaveWeaponName = () => {
    if (tempWeaponName.trim() && onRenameWeapon) {
      onRenameWeapon(tempWeaponName.trim());
    }
    setIsEditingWeaponName(false);
  };

  const oatsAvailable = player.inventory.some((item) => item.id === "hay_bale");

  const getReputationLabel = (rep: number) => {
    if (rep <= -80)
      return {
        label: "MOST WANTED OUTLAW (Gallows Threat)",
        color: "text-[#c4451a] animate-pulse font-serif",
      };
    if (rep <= -40)
      return { label: "Desperado Bandit", color: "text-rose-400" };
    if (rep <= -15) return { label: "Petty Thief", color: "text-pink-300" };
    if (rep < 15)
      return {
        label: "Neutral Frontier Drifter",
        color: "text-[#4a3928] italic",
      };
    if (rep < 40) return { label: "Deputy Protector", color: "text-sky-300" };
    if (rep < 80)
      return { label: "Honorable Marshal", color: "text-[#2a8ec4] font-serif" };
    return {
      label: "LEGENDARY FRONTIER HERO",
      color: "text-[#8c6b0c] font-bold animate-pulse font-serif",
    };
  };

  const repStats = getReputationLabel(player.reputation);

  // Factions helpers
  const getFactionLabel = (
    val: number,
    type: "lawmen" | "outlaws" | "tribes",
  ) => {
    if (type === "lawmen") {
      if (val >= 60) return { label: "Regarded Deputy", color: "text-sky-400" };
      if (val >= 15) return { label: "Law-at-heart", color: "text-teal-400" };
      if (val < -40)
        return {
          label: "Wanted Bandit (Hostile)",
          color: "text-red-500 font-bold",
        };
      return { label: "Drifter Bystander", color: "text-[#5a4838]" };
    } else if (type === "outlaws") {
      if (val >= 50) return { label: "Gang Captain", color: "text-rose-400" };
      if (val >= 15)
        return { label: "Rustler Friend", color: "text-orange-300" };
      if (val < -30)
        return {
          label: "Snitch Target (Marked)",
          color: "text-sky-500 font-semibold",
        };
      return { label: "Untrue Outlaw", color: "text-[#5a4838]" };
    } else {
      if (val >= 50)
        return {
          label: "Sacred Pathfinder / Brother",
          color: "text-amber-400",
        };
      if (val >= 15)
        return { label: "Respected Guest", color: "text-yellow-600" };
      if (val < -35)
        return {
          label: "Tomb Raider (Hated)",
          color: "text-red-600 font-bold",
        };
      return { label: "Stranger Traveler", color: "text-[#5a4838]" };
    }
  };

  // Perk helpers
  const getPerkInfo = (perk: string) => {
    switch (perk) {
      case "deadeye":
        return {
          name: "Deadeye Focus",
          desc: "Increases tactical fire critical chance by +30%.",
        };
      case "fast_hands":
        return {
          name: "Fast Hands",
          desc: "Allows free instant weapon reloads in combat.",
        };
      case "hardy":
        return {
          name: "Hardy Desert Horseman",
          desc: "Allows faster desert movement and better endurance.",
        };
      case "silver_tongue":
        return {
          name: "Silver Tongue",
          desc: "Provides discounts of 20% at town shops.",
        };
      case "quickdraw":
        return {
          name: "Quickdraw Specialist",
          desc: "Always turns first in battles, preempting enemy fire.",
        };
      default:
        return { name: perk, desc: "Specialized perk" };
    }
  };

  const hpPercentage = Math.round((player.hp / player.maxHp) * 100);
  const xpPercentage = Math.round((player.xp / player.xpToNextLevel) * 100);

  // Calculate total carrying weight
  const totalWeight = parseFloat(
    player.inventory
      .reduce((sum, item) => sum + getItemWeight(item) * item.count, 0)
      .toFixed(1),
  );
  const maxWeight = 40.0;
  const isOverburdened = totalWeight > maxWeight;

  return (
    <div
      id="character-sheet-component"
      className="bg-[#f4ead5] border border-[#bfae96] p-5 rounded-sm space-y-4 flex flex-col h-full shadow-xl"
    >
      {/* Top Banner Player Identity */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-[#bfae96] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-sm border border-[#e8b923]/30 flex items-center justify-center font-bold text-[#8c6b0c] text-lg bg-[#dcd1b9] overflow-hidden relative">
              <img
                src={player.avatarImage || overlandImg}
                alt={`${player.name} Avatar`}
                className="absolute inset-0 w-full h-full object-cover scale-[1.3] transform translate-y-1 drop-shadow-md"
                style={{ imageRendering: "pixelated" }}
              />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-widest text-[#664d36] font-serif block">
                Frontier Hero Card
              </span>
              <h3 className="text-[#8c6b0c] font-bold uppercase tracking-wider text-sm flex items-center gap-1 font-serif mt-0.5">
                {player.name || "Silas Vane"}
              </h3>
            </div>
          </div>

          <div className="text-right flex flex-col items-end">
            <span className="text-[9px] uppercase tracking-widest text-[#664d36] font-serif">
              XP TO NEXT
            </span>
            <span className="text-xs font-mono text-[#4a3928] mt-0.5">
              {player.xp} / {player.xpToNextLevel} XP
            </span>
          </div>
        </div>

        {/* Level & XP Gauge */}
        <div className="space-y-1 bg-[#e8dec7] p-2.5 rounded-sm border border-[#bfae96]/40">
          <div className="flex justify-between text-[9px] text-[#664d36] font-serif uppercase tracking-wider">
            <span>LEVEL & XP</span>
            <span>
              {player.level} (Perks: {player.perks.length})
            </span>
          </div>
          <div className="w-full h-2 bg-[#dcd1b9] rounded-full overflow-hidden border border-[#bfae96]/60">
            <div
              className="h-full bg-gradient-to-r from-[#8a705a] to-[#e8b923] transition-all duration-300 shadow-[0_0_8px_#e8b923]"
              style={{ width: `${Math.min(100, xpPercentage)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Health Indicator */}
      <div className="grid grid-cols-1 gap-3">
        {/* Health point meter */}
        <div className="bg-[#e8dec7] border border-[#bfae96] p-3 rounded-sm space-y-1.5 shadow-md">
          <div className="flex justify-between items-center">
            <span className="text-[#664d36] flex items-center gap-1 font-serif font-semibold text-[10px] tracking-wider">
              <Heart size={10} className="text-[#c4451a] fill-current" /> HP
            </span>
            <span className="text-[#c4451a] font-bold font-mono text-xs">
              {player.hp}/{player.maxHp}
            </span>
          </div>
          <div className="w-full h-2 bg-[#2d0a0a] rounded-full mt-1 border border-[#4d1a1a] overflow-hidden">
            <div
              className="h-full bg-[#c4451a] rounded-full shadow-[0_0_8px_#c4451a] transition-all duration-300"
              style={{ width: `${Math.min(100, hpPercentage)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Weight Gauge System */}
      <div className="bg-[#e8dec7] border border-[#bfae96] p-3 rounded-sm space-y-2">
        <div className="flex justify-between items-center text-[10px] uppercase font-serif tracking-wider">
          <span className="text-[#664d36] flex items-center gap-1 font-bold">
            <Scale
              size={11}
              className={
                isOverburdened ? "text-red-500 animate-pulse" : "text-[#8c6b0c]"
              }
            />{" "}
            WEIGHT
          </span>
          <span
            className={`font-mono font-bold text-xs ${isOverburdened ? "text-red-500" : "text-[#8c6b0c]"}`}
          >
            {totalWeight} / {maxWeight} LBS
          </span>
        </div>

        <div className="w-full h-2.5 bg-[#dcd1b9] rounded-full overflow-hidden border border-[#bfae96] relative">
          <div
            className={`h-full transition-all duration-300 ${isOverburdened ? "bg-[#c4451a] shadow-[0_0_6px_red]" : "bg-[#e8b923]"}`}
            style={{
              width: `${Math.min(100, (totalWeight / maxWeight) * 100)}%`,
            }}
          />
        </div>

        {isOverburdened && (
          <p className="text-[9px] text-[#c4451a] font-semibold flex items-center gap-1 bg-red-950/20 p-1 border border-red-950/40 rounded-sm">
            <AlertTriangle size={10} /> OVERENCUMBERED: High travel costs &
            slower combat moves!
          </p>
        )}
      </div>

      {/* Equipped Gun & Ammo Frame */}
      <div className="bg-[#dfd4bd] border border-[#bfae96] rounded-sm p-3.5 shadow-md">
        <div className="text-[10px] text-[#664d36] uppercase font-serif font-bold tracking-widest border-b border-[#bfae96] pb-1 flex justify-between">
          <span className="flex items-center gap-1">
            <Target size={11} className="text-[#8c6b0c]" /> EQUIPPED WEAPON
          </span>
          <span className="text-[#8c6b0c]">
            LOADED: {player.weapon.clip} RNDS
          </span>
        </div>

        <div className="mt-2 flex justify-between items-start text-xs gap-2">
          <div className="space-y-1 flex-1 min-w-0">
            {isEditingWeaponName ? (
              <div className="flex items-center gap-1 mb-1">
                <input
                  type="text"
                  value={tempWeaponName}
                  onChange={(e) => setTempWeaponName(e.target.value)}
                  className="bg-[#d4cbba] border border-[#bfae96] text-xs text-[#8c6b0c] px-1.5 py-0.5 rounded-sm focus:outline-none w-32 font-bold font-serif"
                  placeholder="Gun Name..."
                  maxLength={20}
                />
                <button
                  onClick={handleSaveWeaponName}
                  className="px-1.5 py-0.5 bg-[#e8b923] text-[#1a130f] text-[10px] font-bold uppercase tracking-wider rounded-sm hover:bg-amber-500"
                >
                  Save
                </button>
                <button
                  onClick={() => setIsEditingWeaponName(false)}
                  className="px-1.5 py-0.5 bg-stone-800 text-[#2d2119] text-[10px] font-bold uppercase tracking-wider rounded-sm hover:bg-stone-700"
                >
                  X
                </button>
              </div>
            ) : (
              <span className="text-[#8c6b0c] font-bold font-serif text-[12px] block flex items-center flex-wrap gap-1.5">
                {player.weapon.customName
                  ? `"${player.weapon.customName}" (${player.weapon.name})`
                  : player.weapon.name}
                {player.weaponUpgrades?.hasScope && (
                  <span className="text-[9px] text-teal-400 font-sans font-normal">
                    (Scoped)
                  </span>
                )}

                {(player.weapon.fightCount || 0) >= 50 && (
                  <button
                    onClick={() => {
                      setTempWeaponName(
                        player.weapon.customName || player.weapon.name,
                      );
                      setIsEditingWeaponName(true);
                    }}
                    className="text-[9px] text-teal-400 hover:text-teal-300 underline cursor-pointer font-sans font-normal"
                  >
                    (Rename Gun)
                  </button>
                )}
              </span>
            )}
            <span className="text-[10px] text-[#4a3928] block leading-normal">
              Power:{" "}
              <b className="text-[#c4451a] font-mono font-normal">
                {player.weapon.dmg + (player.weaponUpgrades?.dmgBonus || 0)} HP
              </b>{" "}
              • Range:{" "}
              <b className="text-[#8c6b0c] font-mono font-normal">
                {player.weapon.range + (player.weaponUpgrades?.rangeBonus || 0)}{" "}
                tiles
              </b>
            </span>
            <span className="text-[8.5px] text-[#664d36] block">
              Clip Cap:{" "}
              {player.weapon.maxClip + (player.weaponUpgrades?.clipBonus || 0)}{" "}
              Rnds • Crit Boost: +{player.weaponUpgrades?.accuracyBonus || 0}%
            </span>

            {/* Weapon Fights Progress Bar */}
            <div className="pt-2 border-t border-[#bfae96]/40 mt-1">
              <div className="flex justify-between items-center text-[8.5px] text-[#664d36] font-serif uppercase tracking-wider mb-0.5">
                <span>WEAPON MASTERY</span>
                <span>{player.weapon.fightCount || 0} / 50 Fights</span>
              </div>
              <div className="w-full h-1.5 bg-[#dcd1b9] rounded-full overflow-hidden border border-[#bfae96]/60">
                <div
                  className={`h-full transition-all duration-300 ${(player.weapon.fightCount || 0) >= 50 ? "bg-teal-400 shadow-[0_0_4px_#2dd4bf]" : "bg-[#e8b923]"}`}
                  style={{
                    width: `${Math.min(100, ((player.weapon.fightCount || 0) / 50) * 100)}%`,
                  }}
                />
              </div>
            </div>

            {/* Weapon Condition */}
            <div className="pt-1 mt-1">
              <div className="flex justify-between items-center text-[8.5px] font-serif uppercase tracking-wider mb-0.5">
                <span
                  className={`${(player.weapon.condition ?? 100) < 40 ? "text-red-500 animate-pulse" : "text-[#664d36]"}`}
                >
                  DURABILITY
                </span>
                <span
                  className={`${(player.weapon.condition ?? 100) < 40 ? "text-red-500" : "text-[#664d36]"}`}
                >
                  {Math.round(player.weapon.condition ?? 100)}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-[#dcd1b9] rounded-full overflow-hidden border border-[#bfae96]/60 flex">
                <div
                  className={`h-full transition-all duration-300 ${(player.weapon.condition ?? 100) < 40 ? "bg-red-500" : "bg-emerald-600"}`}
                  style={{ width: `${player.weapon.condition ?? 100}%` }}
                />
              </div>
              <div className="mt-1.5 flex justify-end items-center">
                <div className="flex gap-1">
                  <button
                    onClick={onOpenGunsmith}
                    className="py-0.5 px-2 bg-[#1a130f] hover:bg-[#3d2d21] text-[#e8b923] text-[8px] uppercase tracking-wider rounded-xs font-bold border border-[#e8b923]/40 transition-colors"
                  >
                    Workbench
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="text-right flex-shrink-0">
            <span className="text-[#3d2d21] font-bold font-mono block">
              {player.inventory.find(
                (i) => i.id === `ammo_${player.weapon.ammoType || "pistol"}`,
              )?.count || 0}{" "}
              Cartridges
            </span>
            <span className="text-[9px] text-[#664d36] uppercase tracking-wider font-serif">
              In belt
            </span>
          </div>
        </div>
      </div>

      {/* Skills Overview Frame */}
      <div className="bg-[#e8dec7] border border-[#bfae96] rounded-sm p-3.5 shadow-md space-y-3">
        <div
          id="skills-overview-title"
          className="text-[10px] text-[#664d36] uppercase font-serif font-bold tracking-widest border-b border-[#bfae96] pb-1 flex justify-between"
        >
          <span>🎯 Skills Overview</span>
          <span className="text-[#8c6b0c]">Practice Makes Perfect</span>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center text-xs border-b border-stone-800 pb-2">
            <div className="space-y-0.5">
              <span className="text-[#2d2119] font-bold font-serif text-[11px] block">
                Pistol Handling:
              </span>
              <span className="text-[10px] text-[#4a3928] block leading-normal font-sans">
                Improves accuracy with revolvers and colts.
              </span>
            </div>
            <div className="text-right">
              <span className="text-teal-400 font-mono font-bold text-sm">
                {Math.floor(player.pistolSkill || 0)}%
              </span>
              <span className="text-[9px] text-[#5a4838] block">MAX 200%</span>
            </div>
          </div>

          <div className="flex justify-between items-center text-xs border-b border-stone-800 pb-2">
            <div className="space-y-0.5 pr-2">
              <span className="text-[#2d2119] font-bold font-serif text-[11px] block">
                Rifle Proficiency:
              </span>
              <span className="text-[10px] text-[#4a3928] block leading-normal font-sans">
                Improves accuracy with repeaters and shotguns.
              </span>
            </div>
            <div className="text-right">
              <span className="text-teal-400 font-mono font-bold text-sm">
                {Math.floor(player.rifleSkill || 0)}%
              </span>
              <span className="text-[9px] text-[#5a4838] block">MAX 200%</span>
            </div>
          </div>

          <div className="flex justify-between items-center text-xs border-b border-stone-800 pb-2">
            <div className="space-y-0.5 pr-2">
              <span className="text-[#2d2119] font-bold font-serif text-[11px] block">
                Reload Mastery:
              </span>
              <span className="text-[10px] text-[#4a3928] block leading-normal font-sans">
                Every time you reload in combat, you gain mastery.
              </span>
            </div>
            <div className="text-right">
              <span className="text-teal-400 font-mono font-bold text-sm">
                {Math.floor(player.reloadSkill || 0)}%
              </span>
              <span className="text-[9px] text-[#5a4838] block">MAX 200%</span>
            </div>
          </div>

          <div className="flex justify-between items-center text-xs">
            <div className="space-y-0.5 pr-2">
              <span className="text-[#2d2119] font-bold font-serif text-[11px] block">
                Horsemanship:
              </span>
              <span className="text-[10px] text-[#4a3928] block leading-normal font-sans">
                Riding increases your horse's overland speed.
              </span>
            </div>
            <div className="text-right">
              <span className="text-teal-400 font-mono font-bold text-sm">
                {Math.floor(player.horsemanship || 0)}%
              </span>
              <span className="text-[9px] text-[#5a4838] block">MAX 200%</span>
            </div>
          </div>

          <div className="flex justify-between items-center text-xs">
            <div className="space-y-0.5 pr-2">
              <span className="text-[#2d2119] font-bold font-serif text-[11px] block">
                Silence:
              </span>
              <span className="text-[10px] text-[#4a3928] block leading-normal font-sans">
                Move behind obstacles often to become stealthier.
              </span>
            </div>
            <div className="text-right">
              <span className="text-teal-400 font-mono font-bold text-sm">
                {Math.floor(player.silenceSkill || 0)}%
              </span>
              <span className="text-[9px] text-[#5a4838] block">MAX 200%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Faction Reputation Breakdown Gauges */}
      <div className="bg-[#e8dec7] border border-[#bfae96] rounded-sm p-3 space-y-2">
        <div className="text-[10px] text-[#8c6b0c] uppercase font-bold tracking-widest font-serif flex items-center gap-1.5 border-b border-[#bfae96]/60 pb-1.5">
          <Users size={11} className="text-[#8c6b0c]" /> Faction Standings
        </div>

        <div className="space-y-2 font-sans text-[11px]">
          {/* Faction 1: Lawmen */}
          <div className="flex flex-col">
            <div className="flex justify-between items-center">
              <span className="text-[#2d2119] font-semibold">
                Federal Lawmen
              </span>
              <span
                className={
                  getFactionLabel(
                    player.factionReputation?.lawmen ?? 0,
                    "lawmen",
                  ).color
                }
              >
                {
                  getFactionLabel(
                    player.factionReputation?.lawmen ?? 0,
                    "lawmen",
                  ).label
                }
              </span>
            </div>
            <div className="w-full h-1 bg-[#d4cbba] rounded-full mt-1 overflow-hidden border border-stone-850">
              <div
                className="h-full bg-sky-500"
                style={{
                  width: `${(((player.factionReputation?.lawmen ?? 0) + 100) / 200) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Faction 2: Outlaws */}
          <div className="flex flex-col border-t border-[#bfae96]/30 pt-1.5">
            <div className="flex justify-between items-center">
              <span className="text-[#2d2119] font-semibold">Outlaw Gangs</span>
              <span
                className={
                  getFactionLabel(
                    player.factionReputation?.outlaws ?? 0,
                    "outlaws",
                  ).color
                }
              >
                {
                  getFactionLabel(
                    player.factionReputation?.outlaws ?? 0,
                    "outlaws",
                  ).label
                }
              </span>
            </div>
            <div className="w-full h-1 bg-[#d4cbba] rounded-full mt-1 overflow-hidden border border-stone-850">
              <div
                className="h-full bg-rose-500"
                style={{
                  width: `${(((player.factionReputation?.outlaws ?? 0) + 100) / 200) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Faction 3: Tribes */}
          <div className="flex flex-col border-t border-[#bfae96]/30 pt-1.5">
            <div className="flex justify-between items-center">
              <span className="text-[#2d2119] font-semibold">
                Native Tribes
              </span>
              <span
                className={
                  getFactionLabel(
                    player.factionReputation?.tribes ?? 10,
                    "tribes",
                  ).color
                }
              >
                {
                  getFactionLabel(
                    player.factionReputation?.tribes ?? 10,
                    "tribes",
                  ).label
                }
              </span>
            </div>
            <div className="w-full h-1 bg-[#d4cbba] rounded-full mt-1 overflow-hidden border border-stone-850">
              <div
                className="h-full bg-amber-500"
                style={{
                  width: `${(((player.factionReputation?.tribes ?? 10) + 100) / 200) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Horse Companion Frame */}
      {player.hasHorse && (
        <div className="bg-[#d8dcc8] border border-[#2f3d21] rounded-sm p-3.5 shadow-md space-y-2.5">
          <div className="text-[10px] text-[#71924c] uppercase font-bold tracking-widest font-serif flex items-center justify-between border-b border-[#2f3d21]/60 pb-1.55">
            <span>🐴 Horse Companion</span>
            <span className="text-[#5a4838] font-mono text-[9px]">Steed</span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#1a130f] font-bold font-serif w-full block">
                {isEditingHorseName ? (
                  <div className="flex items-center gap-1 w-full flex-wrap">
                    <input
                      type="text"
                      value={tempHorseName}
                      onChange={(e) => setTempHorseName(e.target.value)}
                      className="bg-[#d4cbba] border border-[#2f3d21] text-xs text-[#71924c] px-1.5 py-0.5 rounded-sm focus:outline-none flex-1 font-bold font-serif min-w-0"
                      placeholder="Steed Name..."
                      maxLength={18}
                    />
                    <button
                      onClick={handleSaveHorseName}
                      className="px-2 py-0.5 bg-[#71924c] text-stone-900 text-[10px] font-bold uppercase tracking-wider rounded-sm hover:bg-[#8bb45f] cursor-pointer shrink-0"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setIsEditingHorseName(false)}
                      className="px-1.5 py-0.5 bg-stone-800 text-[#2d2119] text-[10px] font-bold uppercase tracking-wider rounded-sm hover:bg-stone-700 cursor-pointer shrink-0"
                    >
                      X
                    </button>
                  </div>
                ) : (
                  <span className="text-stone-100 flex items-center justify-between w-full gap-2 block">
                    <span className="truncate">
                      {player.horseName ||
                        player.mount?.name ||
                        "Kentucky Stallion"}
                    </span>
                    <button
                      onClick={() => {
                        setTempHorseName(
                          player.horseName ||
                            player.mount?.name ||
                            "Kentucky Stallion",
                        );
                        setIsEditingHorseName(true);
                      }}
                      className="text-[9px] text-[#71924c] hover:text-[#8bb45f] underline cursor-pointer font-sans font-normal shrink-0"
                    >
                      (Rename Steed)
                    </button>
                  </span>
                )}
              </span>
            </div>
            {player.mount && (
              <div className="flex justify-between items-center text-[10px] font-mono mt-1 text-[#2f3d21]">
                <span className="uppercase tracking-widest">
                  {player.mount.type.replace("_", " ")}
                </span>
                <span
                  className={
                    player.hoursDehydrated && player.hoursDehydrated > 0
                      ? "text-red-700 animate-pulse font-bold"
                      : ""
                  }
                >
                  {player.mount.baseSpeedMultiplier.toFixed(2)}x Speed
                  {player.hoursDehydrated && player.hoursDehydrated > 0
                    ? " (THIRSTY!)"
                    : ""}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Active Posse Frame */}
      <div className="bg-[#d9d5db] border border-[#3e2d3e]/80 rounded-sm p-3.5 shadow-md space-y-2.5">
        <div
          id="militia-posse-title"
          className="text-[10px] text-[#ae8fdb] uppercase font-bold tracking-widest font-serif flex items-center justify-between border-b border-[#3e2d3e]/40 pb-1.5"
        >
          <span className="flex items-center gap-1.5">
            <Users size={12} className="text-[#a78bfa] animate-pulse" />{" "}
            Frontier Militia Posse ({player.posse ? player.posse.length : 0} /
            5)
          </span>
          <span className="text-[#5a4838] font-mono text-[9px]">
            Enlisted Protection
          </span>
        </div>

        {!player.posse || player.posse.length === 0 ? (
          <p className="text-[10px] text-[#5a4838] italic text-center py-2 font-serif">
            No active gunfighters under contract. Visit a town Saloon to enlist
            protection!
          </p>
        ) : (
          <div className="space-y-2">
            <div className="p-1 px-1.5 bg-[#ccc6cf] rounded border border-purple-950/40 flex justify-between items-center text-[9px] font-mono text-purple-300">
              <span>Posse Turn Expenses:</span>
              <span className="text-right">
                🪙 -{player.posse.reduce((s, p) => s + p.dailyRateGold, 0)}g
              </span>
            </div>
            <div className="space-y-1.5 max-h-[180px] overflow-y-auto pr-1">
              {player.posse.map((member) => (
                <div
                  key={member.id}
                  className="bg-[#1e1324]/20 hover:bg-[#1e1324]/40 border border-purple-950/30 p-2 rounded-sm flex flex-col gap-1 text-[11px]"
                >
                  <div className="flex justify-between items-start gap-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-sm shrink-0">
                        {member.portrait || "🤠"}
                      </span>
                      <div className="min-w-0">
                        <span className="text-[#c084fc] font-bold font-serif text-[11px] block truncate">
                          {member.name}
                        </span>
                        <span className="text-[8.5px] text-[#e9d5ff]/70 block">
                          {member.role}
                        </span>
                      </div>
                    </div>
                    {onDismissPosseMember && (
                      <button
                        onClick={() => onDismissPosseMember(member.id)}
                        className="text-[9px] text-red-400 hover:text-red-300 hover:underline font-serif font-bold cursor-pointer transition-all uppercase shrink-0"
                      >
                        Dismiss
                      </button>
                    )}
                  </div>

                  <div className="flex justify-between text-[8px] text-[#5a4838] font-mono border-t border-purple-950/20 pt-1">
                    <span>
                      ❤️ HP: {member.hp}/{member.maxHp}
                    </span>
                    <span>💥 DMG: {member.dmg}</span>
                    <span>🎯 RNG: {member.range}</span>
                  </div>
                  <p className="text-[9px] italic text-[#d8b4fe]/60 leading-tight font-sans">
                    "{member.description}"
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Saddlebags Inventories (Drop items and backup weapons list) */}
      <div className="bg-[#f4ead5] border border-[#bfae96] rounded-sm p-3.5 flex-1 min-h-[140px] flex flex-col justify-start">
        <div className="text-[10px] text-[#664d36] uppercase font-bold tracking-widest font-serif border-b border-[#bfae96] pb-1.5 mb-2 flex justify-between">
          <span>Saddlebags Inventory</span>
          <span>{player.inventory.length} items</span>
        </div>

        {player.inventory.length === 0 ? (
          <div className="text-[11px] text-[#664d36] italic py-8 text-center font-serif leading-relaxed">
            Saddlebags are empty. Pick up gear or salvage ghost town dustups.
          </div>
        ) : (
          <div className="space-y-2 overflow-y-auto max-h-[220px] pr-1">
            {[
              {
                id: "weapon",
                label: "Weapons & Ammo",
                Icon: Target,
                iconColor: "text-[#8c6b0c]",
              },
              {
                id: "consumable",
                label: "Medical & Provisions",
                Icon: Droplets,
                iconColor: "text-[#c4451a]",
              },
              {
                id: "value",
                label: "Valuables",
                Icon: Sparkles,
                iconColor: "text-amber-500",
              },
              {
                id: "weapon_part",
                label: "Components",
                Icon: Package,
                iconColor: "text-[#664d36]",
              },
              {
                id: "map_note",
                label: "Intel",
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
                  className="border border-[#bfae96]/40 rounded-sm overflow-hidden mb-1"
                >
                  <button
                    onClick={() => toggleCategory(category.id)}
                    className="w-full bg-[#e8dec7] hover:bg-[#dcd1b9] px-2 py-1.5 flex justify-between items-center transition-colors text-left"
                  >
                    <div className="flex items-center gap-1.5 text-[10px] font-bold font-serif uppercase tracking-wider text-[#3d2d21]">
                      <category.Icon size={11} className={category.iconColor} />
                      {category.label} ({itemsInCategory.length})
                    </div>
                    {openCategories[category.id] ? (
                      <ChevronDown size={12} className="text-[#664d36]" />
                    ) : (
                      <ChevronRight size={12} className="text-[#664d36]" />
                    )}
                  </button>
                  {openCategories[category.id] && (
                    <div className="bg-[#f0e8d5] p-1.5 space-y-1">
                      {itemsInCategory.map((item) => {
                        const weightItem = getItemWeight(item);
                        const totalW = parseFloat(
                          (weightItem * item.count).toFixed(1),
                        );

                        return (
                          <div
                            key={item.id}
                            className="flex items-center justify-between bg-[#e8dec7] hover:bg-[#201712] hover:text-[#e8dec7] p-2 rounded-sm border border-[#bfae96]/60 transition-colors text-xs gap-1 group/item"
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
                                <span className="text-[8px] text-[#5a4838] group-hover/item:text-stone-400 font-mono flex-shrink-0">
                                  {totalW} lbs
                                </span>
                              </div>
                              <span className="text-[9px] text-[#5a4838] group-hover/item:text-stone-400 block truncate mt-0.5">
                                {item.details}
                              </span>

                              {/* Action button if the item is a backup weapon (Equip!) */}
                              {item.type === "weapon" &&
                                (item.id.startsWith("wpn_") ||
                                  item.id === "special_shotgun" ||
                                  item.id === "special_rifle") &&
                                onEquipWeapon && (
                                  <button
                                    id={`equip-backup-${item.id}`}
                                    onClick={() => onEquipWeapon(item.id)}
                                    className="mt-1 px-1.5 py-0.5 bg-[#3d2d21] hover:bg-[#4d3a2b] text-[#8c6b0c] border border-[#8a705a]/60 text-[8px] uppercase font-bold tracking-wider rounded-sm font-serif cursor-pointer flex items-center gap-0.5"
                                  >
                                    <ArrowUp size={8} /> Equip Sidearm
                                  </button>
                                )}
                            </div>

                            {/* Discard button */}
                            {onDropItem && (
                              <button
                                id={`drop-item-${item.id}`}
                                onClick={() => onDropItem(item.id)}
                                title={`Discard / Drop ${item.name}`}
                                className="p-1 text-[#5a4838] group-hover/item:text-red-500 hover:bg-stone-800 rounded-sm cursor-pointer shrink-0 transition-colors"
                              >
                                <Trash2 size={12} />
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

      {/* Perks list */}
      {player.perks.length > 0 && (
        <div className="bg-[#f4ead5] border border-[#bfae96] p-3 rounded-sm">
          <span className="text-[9px] text-[#664d36] font-serif uppercase tracking-widest block border-b border-[#bfae96] pb-1.5 mb-1.5">
            Active Talent Perks
          </span>
          <div className="flex flex-wrap gap-1">
            {player.perks.map((p) => (
              <span
                key={p}
                className="text-[8px] uppercase tracking-wider bg-[#dfd4bd] text-[#8c6b0c] border border-[#bfae96] px-1.5 py-0.5 rounded-sm font-serif font-bold"
              >
                {getPerkInfo(p).name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Appearance Editor Modal Overlay */}
      {/* 
      isEditingAppearance && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
          <div className="bg-[#e8dec7] border border-[#bfae96] p-5 rounded-sm max-w-sm w-full shadow-2xl relative">
            <h3 className="text-[#8c6b0c] font-bold font-serif uppercase border-b border-[#bfae96] pb-2 mb-4">Edit Appearance</h3>
            
            <div className="flex gap-4">
               {/* Live Preview * /}
               <div className="w-24 h-32 border border-[#bfae96] bg-[#dcd1b9] shrink-0 rounded-sm overflow-hidden flex items-center justify-center shadow-inner">
                  <PlayerAvatar appearance={tempAppearance} className="w-full h-full scale-[1.2]" />
               </div>

               {/* Controls * /}
               <div className="space-y-3 flex-1">
                  <div>
                    <label className="text-[10px] text-[#664d36] uppercase font-bold font-serif mb-1 block">Gender / Base</label>
                    <select 
                      className="w-full bg-[#f4ead5] border border-[#bfae96] text-xs py-1 px-2 rounded-sm text-[#3d2d21]"
                      value={tempAppearance.gender} 
                      onChange={(e) => setTempAppearance({...tempAppearance, gender: e.target.value as any})}
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-[10px] text-[#664d36] uppercase font-bold font-serif mb-1 block">Hat Style</label>
                    <select 
                      className="w-full bg-[#f4ead5] border border-[#bfae96] text-xs py-1 px-2 rounded-sm text-[#3d2d21]"
                      value={tempAppearance.hat} 
                      onChange={(e) => setTempAppearance({...tempAppearance, hat: e.target.value as any})}
                    >
                      <option value="none">No Hat</option>
                      <option value="cowboy">Cowboy Hat</option>
                      <option value="bowler">Bowler Hat</option>
                      <option value="sombrero">Sombrero</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-[#664d36] uppercase font-bold font-serif mb-1 block">Shirt Color</label>
                    <select 
                      className="w-full bg-[#f4ead5] border border-[#bfae96] text-xs py-1 px-2 rounded-sm text-[#3d2d21]"
                      value={tempAppearance.shirtColor} 
                      onChange={(e) => setTempAppearance({...tempAppearance, shirtColor: e.target.value as any})}
                    >
                      <option value="white">Standard White</option>
                      <option value="red">Barn Red</option>
                      <option value="blue">Denim Blue</option>
                      <option value="black">Coal Black</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-[#664d36] uppercase font-bold font-serif mb-1 block">Hair Style & Color</label>
                    <div className="flex gap-1">
                      <select 
                        className="w-1/2 bg-[#f4ead5] border border-[#bfae96] text-xs py-1 px-1 rounded-sm text-[#3d2d21]"
                        value={tempAppearance.hairStyle} 
                        onChange={(e) => setTempAppearance({...tempAppearance, hairStyle: e.target.value as any})}
                      >
                        <option value="none">Bald</option>
                        <option value="short">Short</option>
                        <option value="long">Long</option>
                      </select>
                      <select 
                        className="w-1/2 bg-[#f4ead5] border border-[#bfae96] text-xs py-1 px-1 rounded-sm text-[#3d2d21]"
                        value={tempAppearance.hairColor} 
                        onChange={(e) => setTempAppearance({...tempAppearance, hairColor: e.target.value as any})}
                      >
                        <option value="black">Black</option>
                        <option value="brown">Brown</option>
                        <option value="blonde">Blonde</option>
                        <option value="gray">Gray</option>
                      </select>
                    </div>
                  </div>

                  {tempAppearance.gender === 'male' && (
                    <div>
                      <label className="text-[10px] text-[#664d36] uppercase font-bold font-serif mb-1 block">Facial Hair</label>
                      <select 
                        className="w-full bg-[#f4ead5] border border-[#bfae96] text-xs py-1 px-2 rounded-sm text-[#3d2d21]"
                        value={tempAppearance.facialHair} 
                        onChange={(e) => setTempAppearance({...tempAppearance, facialHair: e.target.value as any})}
                      >
                        <option value="none">Clean Shaven</option>
                        <option value="mustache">Mustache</option>
                        <option value="beard">Full Beard</option>
                      </select>
                    </div>
                  )}

                  <div>
                     <label className="text-[10px] text-[#664d36] uppercase font-bold font-serif mb-1 block">Skin Tone</label>
                     <div className="flex gap-2">
                       {['#fcdbb6', '#ebb58a', '#c28157', '#6c3f24'].map(tone => (
                          <button key={tone} className={`w-6 h-6 rounded-full border-2 ${tempAppearance.skinTone === tone ? 'border-sky-500' : 'border-stone-800'}`} style={{ backgroundColor: tone }} onClick={() => setTempAppearance({...tempAppearance, skinTone: tone})} />
                       ))}
                     </div>
                  </div>

               </div>
            </div>

            <div className="mt-5 flex justify-end gap-2 border-t border-[#bfae96]/60 pt-3">
               <button 
                 onClick={() => setIsEditingAppearance(false)}
                 className="px-4 py-1.5 bg-stone-800 text-stone-200 text-xs font-bold uppercase tracking-wider rounded-sm hover:bg-stone-700"
               >
                 Cancel
               </button>
               <button 
                 onClick={() => {
                   if (onUpdateAppearance) onUpdateAppearance(tempAppearance);
                   setIsEditingAppearance(false);
                 }}
                 className="px-4 py-1.5 bg-[#8c6b0c] text-[#1a130f] text-xs font-bold uppercase tracking-wider rounded-sm hover:bg-amber-600"
               >
                 Save Looks
               </button>
            </div>
          </div>
        </div>
      )
      */}
    </div>
  );
};
