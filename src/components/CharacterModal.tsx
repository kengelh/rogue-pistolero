import React, { useState } from "react";
import { Player } from "../types";
import overlandImg from "../assets/images/overland_1780566810461.png";
import {
  Shield,
  Sparkles,
  Heart,
  Droplets,
  Target,
  Award,
  Users,
  Scale,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  X,
  MapPin,
  Flame,
} from "lucide-react";
import { PlayerAvatar, PlayerAppearance } from "./PlayerAvatar";

interface CharacterModalProps {
  player: Player;
  onClose: () => void;
  onDismissPosseMember?: (id: string) => void;
  onRenameHorse?: (newName: string) => void;
  onRenameWeapon?: (newName: string) => void;
  onOpenGunsmith?: () => void;
  onUpdateAppearance?: (appearance: PlayerAppearance) => void;
  onUpgradeSkill?: (skillKey: string) => void;
}

export const CharacterModal: React.FC<CharacterModalProps> = ({
  player,
  onClose,
  onDismissPosseMember,
  onRenameHorse,
  onRenameWeapon,
  onOpenGunsmith,
  onUpdateAppearance,
  onUpgradeSkill,
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

  return (
    <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-0 sm:p-4 z-[100] backdrop-blur-md">
      <div className="bg-[#f4ead5] w-full h-full sm:h-auto max-w-4xl border-0 sm:border-4 border-[#3d2d21] sm:rounded-sm flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.9)] max-h-screen sm:max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-[#3d2d21] text-[#f4ead5] p-3 sm:p-4 flex justify-between items-center border-b border-[#2d2119] shrink-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <Award size={18} className="text-[#e8b923] animate-pulse" />
            <h2 className="text-sm sm:text-xl font-bold uppercase tracking-widest font-serif truncate">
              Character Details & Traits
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-[#bfae96] hover:text-white transition-colors cursor-pointer p-1"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Panel Grid */}
        <div className="p-3 sm:p-5 overflow-y-auto custom-scrollbar flex-1 bg-[#1a130f] space-y-4 sm:space-y-5 text-stone-300">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* COLUMN 1: IDENTITY, STATS, REPUTATION, APPERANCE */}
            <div className="space-y-4">
              
              {/* Identity & Basic Stats Card */}
              <div className="bg-[#f4ead5] text-[#3d2d21] p-4 rounded-sm border border-[#bfae96] shadow-md space-y-3">
                <div className="flex items-center justify-between border-b border-[#bfae96]/60 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-12 h-12 rounded-sm border border-[#e8b923]/30 flex items-center justify-center font-bold text-[#8c6b0c] text-lg bg-[#dcd1b9] overflow-hidden relative">
                      <img
                        src={player.avatarImage || overlandImg}
                        alt={`${player.name} Avatar`}
                        className="absolute inset-0 w-full h-full object-cover scale-[1.3] transform translate-y-1 drop-shadow-md"
                        style={{ imageRendering: "pixelated" }}
                      />
                    </div>
                    <div>
                      <span className="text-[9px] uppercase tracking-widest text-[#664d36] font-serif block">
                        Frontier Hero Card
                      </span>
                      <h3 className="text-[#8c6b0c] font-bold uppercase tracking-wider text-base font-serif">
                        {player.name || "Silas Vane"}
                      </h3>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[9px] uppercase tracking-widest text-[#664d36] font-serif block">
                      XP TO LEVEL
                    </span>
                    <span className="text-xs font-mono text-[#4a3928] font-bold">
                      {player.xp} / {player.xpToNextLevel} XP
                    </span>
                  </div>
                </div>

                {/* Level Progress Gauge */}
                <div className="space-y-1 bg-[#e8dec7] p-2.5 rounded-sm border border-[#bfae96]/40">
                  <div className="flex justify-between text-[9px] text-[#664d36] font-serif uppercase tracking-wider">
                    <span>LEVEL STATUS</span>
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

                {/* HP & Hydration */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="bg-[#e8dec7] p-2.5 rounded-sm border border-[#bfae96]/40 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-[#664d36] flex items-center gap-1 font-serif font-semibold text-[10px] tracking-wider">
                        <Heart size={10} className="text-[#c4451a] fill-current" /> HP
                      </span>
                      <span className="text-[#c4451a] font-bold font-mono text-xs">
                        {player.hp}/{player.maxHp}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-[#2d0a0a] rounded-full border border-[#4d1a1a] overflow-hidden">
                      <div
                        className="h-full bg-[#c4451a] rounded-full shadow-[0_0_8px_#c4451a]"
                        style={{ width: `${Math.min(100, hpPercentage)}%` }}
                      />
                    </div>
                  </div>

                  <div className="bg-[#e8dec7] p-2.5 rounded-sm border border-[#bfae96]/40 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-[#664d36] flex items-center gap-1 font-serif font-semibold text-[10px] tracking-wider">
                        <Droplets size={10} className="text-blue-600 fill-current" /> WATER
                      </span>
                      <span className="text-blue-700 font-bold font-mono text-xs">
                        {Math.round(player.hydration)}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-sky-950 rounded-full border border-sky-800 overflow-hidden">
                      <div
                        className="h-full bg-sky-500 rounded-full shadow-[0_0_8px_sky]"
                        style={{ width: `${Math.min(100, (player.hydration / player.maxHydration) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Faction Reputations and Ranks */}
              <div className="bg-[#f4ead5] text-[#3d2d21] p-4 rounded-sm border border-[#bfae96] shadow-md space-y-3">
                <div className="text-[10px] text-[#664d36] uppercase font-serif font-bold tracking-widest border-b border-[#bfae96]/60 pb-1 flex justify-between">
                  <span>⚖️ Frontier Allegiances</span>
                  <span className={repStats.color}>{repStats.label}</span>
                </div>

                <div className="space-y-2 pt-1">
                  {[
                    {
                      key: "lawmen",
                      name: "Town Sheriff & Marshals",
                      val: player.factionReputation?.lawmen || 0,
                    },
                    {
                      key: "outlaws",
                      name: "Desperado Bandit Gangs",
                      val: player.factionReputation?.outlaws || 0,
                    },
                    {
                      key: "tribes",
                      name: "Apache Pathfinder Tribes",
                      val: player.factionReputation?.tribes || 0,
                    },
                  ].map((fac) => {
                    const status = getFactionLabel(
                      fac.val,
                      fac.key as "lawmen" | "outlaws" | "tribes",
                    );
                    return (
                      <div
                        key={fac.key}
                        className="p-2 bg-[#e8dec7] border border-[#bfae96]/40 rounded-sm text-xs flex justify-between items-center"
                      >
                        <div>
                          <span className="font-serif font-bold text-[#3d2d21] block">
                            {fac.name}
                          </span>
                          <span className={`text-[10px] ${status.color}`}>
                            {status.label}
                          </span>
                        </div>
                        <span className="font-mono font-bold text-[#8c6b0c] text-xs">
                          {fac.val >= 0 ? `+${fac.val}` : fac.val}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Perks List */}
              <div className="bg-[#f4ead5] text-[#3d2d21] p-4 rounded-sm border border-[#bfae96] shadow-md space-y-2">
                <div className="text-[10px] text-[#664d36] uppercase font-serif font-bold tracking-widest border-b border-[#bfae96]/60 pb-1">
                  ⭐ Acquired Perks ({player.perks.length})
                </div>

                {player.perks.length === 0 ? (
                  <p className="text-[11px] text-[#664d36] italic text-center py-4 font-serif">
                    No traits selected. Unlock legendary skills to obtain Perks.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 gap-1.5 max-h-[140px] overflow-y-auto pr-1">
                    {player.perks.map((p) => {
                      const info = getPerkInfo(p);
                      return (
                        <div
                          key={p}
                          className="bg-[#e8dec7] p-2 border border-[#bfae96]/40 rounded-sm text-[11px]"
                        >
                          <strong className="text-[#8c6b0c] block font-serif uppercase tracking-wider text-xs">
                            {info.name}
                          </strong>
                          <span className="text-[#664d36] block text-[10px] leading-relaxed mt-0.5">
                            {info.desc}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Visual Appearance Customization */}
              <div className="bg-[#f4ead5] text-[#3d2d21] p-4 rounded-sm border border-[#bfae96] shadow-md space-y-2">
                <div className="text-[10px] text-[#664d36] uppercase font-serif font-bold tracking-widest border-b border-[#bfae96]/60 pb-1 flex justify-between">
                  <span>🎨 Customize Appearance</span>
                  <button
                    onClick={() => setIsEditingAppearance(!isEditingAppearance)}
                    className="text-[9px] text-[#8c6b0c] underline hover:text-[#3d2d21] cursor-pointer font-bold"
                  >
                    {isEditingAppearance ? "Collapse Creator" : "Modify Features"}
                  </button>
                </div>

                {isEditingAppearance && onUpdateAppearance && (
                  <div className="bg-[#e8dec7] p-2.5 rounded-sm border border-[#bfae96]/40 space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="block text-[9px] font-bold text-[#664d36] uppercase font-serif">Skin Tone</label>
                        <select
                          value={tempAppearance.skinTone}
                          onChange={(e) => {
                            const val = e.target.value;
                            setTempAppearance((prev) => {
                              const next = { ...prev, skinTone: val };
                              onUpdateAppearance(next);
                              return next;
                            });
                          }}
                          className="w-full bg-[#f4ead5] border border-[#bfae96] p-1 rounded-sm text-xs font-semibold focus:outline-none mt-1"
                        >
                          <option value="#fcdbb6">Pale White</option>
                          <option value="#e2b189">Sun-Bronzed</option>
                          <option value="#c68a5c">Frontier Native</option>
                          <option value="#8c583c">Deep Tan</option>
                          <option value="#50301e">Dark Charcoal</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[9px] font-bold text-[#664d36] uppercase font-serif">Hat Variant</label>
                        <select
                          value={tempAppearance.hat}
                          onChange={(e) => {
                            const val = e.target.value;
                            setTempAppearance((prev) => {
                              const next = { ...prev, hat: val };
                              onUpdateAppearance(next);
                              return next;
                            });
                          }}
                          className="w-full bg-[#f4ead5] border border-[#bfae96] p-1 rounded-sm text-xs font-semibold focus:outline-none mt-1"
                        >
                          <option value="cowboy">Classic Stetson</option>
                          <option value="sombrero">Desert Sombrero</option>
                          <option value="none">No Hat (Wild Hair)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[9px] font-bold text-[#664d36] uppercase font-serif">Shirt Outfit</label>
                        <select
                          value={tempAppearance.shirtColor}
                          onChange={(e) => {
                            const val = e.target.value;
                            setTempAppearance((prev) => {
                              const next = { ...prev, shirtColor: val };
                              onUpdateAppearance(next);
                              return next;
                            });
                          }}
                          className="w-full bg-[#f4ead5] border border-[#bfae96] p-1 rounded-sm text-xs font-semibold focus:outline-none mt-1"
                        >
                          <option value="white">Dusty White</option>
                          <option value="red">Blood Red</option>
                          <option value="blue">Union Blue</option>
                          <option value="black">Desperado Black</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[9px] font-bold text-[#664d36] uppercase font-serif">Facial Hair</label>
                        <select
                          value={tempAppearance.facialHair}
                          onChange={(e) => {
                            const val = e.target.value;
                            setTempAppearance((prev) => {
                              const next = { ...prev, facialHair: val };
                              onUpdateAppearance(next);
                              return next;
                            });
                          }}
                          className="w-full bg-[#f4ead5] border border-[#bfae96] p-1 rounded-sm text-xs font-semibold focus:outline-none mt-1"
                        >
                          <option value="none">Clean Shaven</option>
                          <option value="mustache">Sheriff Mustache</option>
                          <option value="beard">Full Mountain Beard</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Compact Preview rendering */}
                <div className="flex justify-center py-2 bg-[#e8dec7]/50 rounded border border-[#bfae96]/40">
                  <PlayerAvatar appearance={player.appearance || tempAppearance} size={70} />
                </div>
              </div>

            </div>

            {/* COLUMN 2: WEAPONS, SKILLS TREE, POSSE, MOUNT */}
            <div className="space-y-4">
              
              {/* Equipped Weapon Card */}
              <div className="bg-[#f4ead5] text-[#3d2d21] p-4 rounded-sm border border-[#bfae96] shadow-md space-y-3">
                <div className="text-[10px] text-[#664d36] uppercase font-serif font-bold tracking-widest border-b border-[#bfae96]/60 pb-1 flex justify-between">
                  <span className="flex items-center gap-1">
                    <Target size={11} className="text-[#8c6b0c]" /> EQUIPPED FIREARM
                  </span>
                  <span className="text-[#8c6b0c]">
                    LOADED: {player.weapon.clip} / {player.weapon.maxClip + (player.weaponUpgrades?.clipBonus || 0)} RNDS
                  </span>
                </div>

                <div className="flex justify-between items-start text-xs gap-2 pt-1">
                  <div className="space-y-1 flex-1 min-w-0">
                    {isEditingWeaponName ? (
                      <div className="flex items-center gap-1 mb-1">
                        <input
                          type="text"
                          value={tempWeaponName}
                          onChange={(e) => setTempWeaponName(e.target.value)}
                          className="bg-[#d4cbba] border border-[#bfae96] text-xs text-[#8c6b0c] px-1.5 py-0.5 rounded-sm focus:outline-none w-36 font-bold font-serif"
                          placeholder="Gun Name..."
                          maxLength={20}
                        />
                        <button
                          onClick={handleSaveWeaponName}
                          className="px-1.5 py-0.5 bg-[#e8b923] text-[#1a130f] text-[10px] font-bold uppercase tracking-wider rounded-sm hover:bg-amber-500 cursor-pointer"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setIsEditingWeaponName(false)}
                          className="px-1.5 py-0.5 bg-stone-800 text-stone-200 text-[10px] font-bold uppercase tracking-wider rounded-sm hover:bg-stone-700 cursor-pointer"
                        >
                          X
                        </button>
                      </div>
                    ) : (
                      <span className="text-[#8c6b0c] font-bold font-serif text-sm block flex items-center flex-wrap gap-1.5">
                        {player.weapon.customName
                          ? `"${player.weapon.customName}" (${player.weapon.name})`
                          : player.weapon.name}
                        {player.weaponUpgrades?.hasScope && (
                          <span className="text-[9px] text-teal-600 font-sans font-normal">
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
                            className="text-[9px] text-teal-600 hover:text-teal-700 underline cursor-pointer font-sans font-normal"
                          >
                            (Rename Gun)
                          </button>
                        )}
                      </span>
                    )}

                    <span className="text-[10px] text-[#4a3928] block leading-normal">
                      Power:{" "}
                      <strong className="text-[#c4451a] font-mono">
                        {player.weapon.dmg + (player.weaponUpgrades?.dmgBonus || 0)} HP
                      </strong>{" "}
                      • Range:{" "}
                      <strong className="text-[#8c6b0c] font-mono">
                        {player.weapon.range + (player.weaponUpgrades?.rangeBonus || 0)} tiles
                      </strong>
                    </span>
                    <span className="text-[9px] text-[#664d36] block">
                      Ammo Type: <strong className="uppercase font-mono text-[#8c6b0c]">{player.weapon.ammoType || "pistol"}</strong> (Caliber rules applied)
                    </span>

                    {/* Weapon mastery progress bar */}
                    <div className="pt-2 border-t border-[#bfae96]/40 mt-1.5">
                      <div className="flex justify-between items-center text-[8.5px] text-[#664d36] font-serif uppercase tracking-wider mb-0.5">
                        <span>WEAPON MASTERY</span>
                        <span>{player.weapon.fightCount || 0} / 50 Fights</span>
                      </div>
                      <div className="w-full h-1.5 bg-[#dcd1b9] rounded-full overflow-hidden border border-[#bfae96]/60">
                        <div
                          className={`h-full transition-all duration-300 ${(player.weapon.fightCount || 0) >= 50 ? "bg-teal-600 shadow-[0_0_4px_teal]" : "bg-[#e8b923]"}`}
                          style={{
                            width: `${Math.min(100, ((player.weapon.fightCount || 0) / 50) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Weapon Durability Condition */}
                    <div className="pt-1 mt-1">
                      <div className="flex justify-between items-center text-[8.5px] font-serif uppercase tracking-wider mb-0.5">
                        <span className={(player.weapon.condition ?? 100) < 40 ? "text-red-500 animate-pulse font-semibold" : "text-[#664d36]"}>
                          DURABILITY
                        </span>
                        <span className={(player.weapon.condition ?? 100) < 40 ? "text-red-500 font-bold" : "text-[#664d36]"}>
                          {Math.round(player.weapon.condition ?? 100)}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-[#dcd1b9] rounded-full overflow-hidden border border-[#bfae96]/60 flex">
                        <div
                          className={`h-full transition-all duration-300 ${(player.weapon.condition ?? 100) < 40 ? "bg-red-500" : "bg-emerald-600"}`}
                          style={{ width: `${player.weapon.condition ?? 100}%` }}
                        />
                      </div>
                      <div className="mt-2 flex justify-end">
                        <button
                          onClick={() => {
                            if (onOpenGunsmith) onOpenGunsmith();
                            onClose(); // close this modal to let them use the bench overlay
                          }}
                          className="py-1 px-3 bg-[#1a130f] hover:bg-[#3d2d21] text-[#e8b923] text-[9px] uppercase tracking-wider rounded-xs font-bold border border-[#e8b923]/40 transition-colors cursor-pointer"
                        >
                          Modify at Gunsmith Workbench
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Skills Tree Frame */}
              <div className="bg-[#f4ead5] text-[#3d2d21] p-4 rounded-sm border border-[#bfae96] shadow-md space-y-3">
                <div className="text-[10px] text-[#664d36] uppercase font-serif font-bold tracking-widest border-b border-[#bfae96]/60 pb-1 flex justify-between">
                  <span>🎯 Skills & Perks Tree</span>
                  <span className="text-[#8c6b0c] font-bold">Points: {player.skillPoints || 0} unspent</span>
                </div>

                {player.skillPoints && player.skillPoints > 0 ? (
                  <div className="text-[9px] bg-amber-50 text-[#8c6b0c] p-1.5 border border-[#e8b923]/40 rounded-sm font-semibold animate-pulse text-center">
                    🌟 YOU HAVE UNSPENT POINTS! INVEST BELOW TO UNLOCK PERKS
                  </div>
                ) : null}

                <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                  {[
                    {
                      branch: "Branch I: The Gunslinger 🤠",
                      skills: [
                        {
                          key: "pistolSkill",
                          name: "Pistol Handling",
                          description: "Improves precision and quickdraw speed with revolvers.",
                          mastery: player.pistolSkill || 0,
                          level: player.pistolSkillLevel || 0,
                        },
                        {
                          key: "rifleSkill",
                          name: "Rifle Proficiency",
                          description: "Improves precision and maximum range with repeaters and shotguns.",
                          mastery: player.rifleSkill || 0,
                          level: player.rifleSkillLevel || 0,
                        },
                      ],
                    },
                    {
                      branch: "Branch II: Tactical Survivalist 🦂",
                      skills: [
                        {
                          key: "reloadSkill",
                          name: "Speed Reloading",
                          description: "Slashes Action Point reload costs during heavy tactical combat.",
                          mastery: player.reloadSkill || 0,
                          level: player.reloadSkillLevel || 0,
                        },
                        {
                          key: "medicineSkill",
                          name: "Field Medicine",
                          description: "Increases hitpoints recovered when applying bandages in cover.",
                          mastery: player.medicineSkill || 0,
                          level: player.medicineSkillLevel || 0,
                        },
                        {
                          key: "scoutingSkill",
                          name: "Scouting & Perception",
                          description: "Permits seeing outlaw ambushes further on the map.",
                          mastery: player.scoutingSkill || 0,
                          level: player.scoutingSkill || 0, // scout maps directly to scoutingSkill
                        },
                      ],
                    },
                  ].map((branchData) => (
                    <div key={branchData.branch} className="space-y-2 border-t border-[#bfae96]/30 pt-2 first:border-0 first:pt-0">
                      <span className="text-[9px] font-bold text-[#664d36] uppercase tracking-wider block font-serif">
                        {branchData.branch}
                      </span>
                      <div className="space-y-2">
                        {branchData.skills.map((s) => {
                          const canUpgrade = player.skillPoints && player.skillPoints > 0 && s.level < 3;
                          return (
                            <div key={s.key} className="p-2 bg-[#e8dec7] border border-[#bfae96]/40 rounded-sm flex items-center justify-between gap-3 text-xs">
                              <div className="space-y-0.5 flex-1 min-w-0">
                                <span className="font-serif font-bold text-[#3d2d21] block leading-snug">
                                  {s.name} (Lvl {s.level}/3)
                                </span>
                                <span className="text-[9px] text-[#5a4838] block leading-tight">
                                  {s.description}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                {canUpgrade && onUpgradeSkill ? (
                                  <button
                                    onClick={() => onUpgradeSkill(s.key)}
                                    className="px-2 py-1 bg-[#8c6b0c] hover:bg-[#a68013] text-white font-serif font-bold text-[9px] uppercase tracking-wider rounded shadow transition-all cursor-pointer"
                                  >
                                    Level Up
                                  </button>
                                ) : (
                                  <span className="text-[9px] text-[#664d36] italic uppercase font-mono">
                                    {s.level >= 3 ? "Maxed" : "No pts"}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Posse Members & Mounts Card */}
              <div className="bg-[#f4ead5] text-[#3d2d21] p-4 rounded-sm border border-[#bfae96] shadow-md space-y-3">
                <div className="text-[10px] text-[#664d36] uppercase font-serif font-bold tracking-widest border-b border-[#bfae96]/60 pb-1">
                  👥 Posse Crew ({player.posse ? player.posse.length : 0} / 3)
                </div>

                {!player.posse || player.posse.length === 0 ? (
                  <p className="text-[11px] text-[#664d36] italic text-center py-4 font-serif">
                    Riding solo. Recruit hired guns in town saloons to help in fights.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                    {player.posse.map((member) => (
                      <div
                        key={member.id}
                        className="p-2.5 bg-[#3d2d21] text-stone-300 rounded-sm border border-stone-800 text-[11px] flex justify-between items-center gap-2"
                      >
                        <div className="space-y-0.5 flex-1 min-w-0">
                          <strong className="text-[#e8b923] font-serif block">
                            {member.name} ({member.class || "Gunhand"})
                          </strong>
                          <div className="flex gap-2 text-[9px] text-stone-400 font-mono">
                            <span>❤️ HP: {member.hp}</span>
                            <span>💥 DMG: {member.dmg}</span>
                          </div>
                        </div>
                        {onDismissPosseMember && (
                          <button
                            onClick={() => onDismissPosseMember(member.id)}
                            className="px-1.5 py-0.5 bg-red-950/40 hover:bg-red-900 border border-red-800 text-red-400 text-[8px] font-bold uppercase tracking-wider rounded-sm cursor-pointer"
                          >
                            Dismiss
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Active Horse Mount Section */}
                <div className="border-t border-[#bfae96]/40 pt-2 space-y-2">
                  <div className="text-[10px] text-[#664d36] font-serif font-bold uppercase tracking-wider flex justify-between">
                    <span>🐴 Saddle Mount Status</span>
                    {player.hasHorse ? (
                      <span className="text-[#8c6b0c] font-mono">Active Mount</span>
                    ) : (
                      <span className="text-red-600 font-mono animate-pulse">FOOTSORE (No Mount)</span>
                    )}
                  </div>

                  {player.hasHorse ? (
                    <div className="p-2.5 bg-[#e8dec7] rounded border border-[#bfae96]/50 text-xs space-y-1">
                      <div className="flex justify-between items-center">
                        <div>
                          {isEditingHorseName ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                value={tempHorseName}
                                onChange={(e) => setTempHorseName(e.target.value)}
                                className="bg-[#f4ead5] border border-[#bfae96] text-xs text-[#8c6b0c] px-1.5 py-0.5 rounded-sm focus:outline-none w-28 font-serif"
                                placeholder="Horse Name..."
                                maxLength={20}
                              />
                              <button
                                onClick={handleSaveHorseName}
                                className="px-1.5 py-0.5 bg-[#e8b923] text-black text-[9px] font-bold uppercase rounded-sm cursor-pointer"
                              >
                                Save
                              </button>
                            </div>
                          ) : (
                            <strong className="text-[#3d2d21] font-serif block text-sm">
                              "{player.mount?.name || "Bucephalus"}" (Wild Mustang)
                              <button
                                onClick={() => {
                                  setTempHorseName(player.mount?.name || "Bucephalus");
                                  setIsEditingHorseName(true);
                                }}
                                className="text-[9px] text-[#8c6b0c] underline hover:text-[#3d2d21] ml-2 font-sans font-normal cursor-pointer"
                              >
                                Rename
                              </button>
                            </strong>
                          )}
                        </div>
                      </div>
                      <p className="text-[10px] text-[#664d36] leading-relaxed font-sans">
                        Increases overland speed, grants immunity to hydration penalty during heatwaves, and expands carrying limits.
                      </p>
                    </div>
                  ) : (
                    <div className="p-2.5 bg-red-950/10 border border-red-950/20 text-red-850 rounded text-[10px] leading-relaxed">
                      ⚠️ Walking on foot. Travel speeds are halved, and water consumption is doubled during active movement. Purchase a horse or carriage in the local Town Stables!
                    </div>
                  )}
                </div>
              </div>

            </div>

          </div>

        </div>

        {/* Footer */}
        <div className="bg-[#3d2d21] p-2.5 sm:p-3 text-center border-t border-[#2d2119] flex justify-between items-center px-4 sm:px-6 shrink-0">
          <span className="text-[9px] sm:text-[10px] text-[#bfae96] font-mono tracking-wider truncate mr-2 hidden xs:inline">
            ROUGHPENT CLASSIC RECORD BOOK • VER. 1.0
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#e8b923] hover:bg-amber-500 text-stone-900 font-serif font-bold text-xs uppercase tracking-widest rounded-sm shadow cursor-pointer transition-all ml-auto"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
