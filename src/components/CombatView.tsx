import cowboyDuelBg from "../assets/images/duel_bg_1780491608169-1.png";
import tacticalAllies from "../assets/img_tactical/allies.png";
import tacticalPinkerton from "../assets/img_tactical/pinkerton.png";
import tacticalNative1 from "../assets/img_tactical/native1.jpg";
import tacticalNative2 from "../assets/img_tactical/native2.png";
import tacticalSherrif from "../assets/img_tactical/sherrif.png";
import tacticalBandit1 from "../assets/img_tactical/bandit1.png";
import tacticalBandit2 from "../assets/img_tactical/bandit2.jpg";
import tilesetImg from "../assets/img_tactical/tileset.png";
import React, { useState, useEffect } from "react";
import {
  Player,
  CombatActor,
  GridCell,
  Weapon,
  InventoryItem,
  InjurySystem,
} from "../types";
import {
  Skull,
  Compass,
  Crosshair,
  ArrowRight,
  User,
  RefreshCw,
  Sparkles,
  Shield,
  Heart,
  Scale,
} from "lucide-react";
import { processAILogic } from "../utils/combatAI";
import { FrontierAudio } from "../utils/AudioSynth";
import {
  createInitialInjuries,
  applyTakeDamage,
  useMedicalItem,
} from "../utils/injuries";
import { BodySilhouette } from "./BodySilhouette";

interface CombatViewProps {
  player: Player;
  onVictory: (
    lootGold: number,
    xpReward: number,
    hp: number,
    clip: number,
    ammo: number,
    survivingPosseIds: string[],
    capturedCount: number,
    finalInjuries: InjurySystem | undefined,
    lootItems: InventoryItem[],
  ) => void;
  onDefeat: () => void;
  combatType: "bounty" | "robbery" | "nest_clearing" | "ambush" | "camp_ambush" | "duel";
  difficultyRisk: number;
  onEquipWeapon?: (itemId: string) => void; // Sidearm swap callback
  onUpdatePlayer?: (player: Player) => void;
  currentLocation?: any;
  activeMissionTarget?: any;
  activeProvokedNpcId?: string | null;
  forcedWeather?: string | null;
  forcedTimeOfDay?: "day" | "night" | null;
  onTriggerTip?: (id: string, title: string, desc: string) => void;
  gameTimeHour?: number;
}

// Helper to check item weight in bags
const getItemWeight = (item: { id: string; name: string; type: string }) => {
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
  return 0.5;
};

const getTacticalImage = (actor: any) => {
  if (actor.type === "posse") return tacticalAllies;
  if (actor.type === "scorpion") return "";

  let n = (actor.name || "").toLowerCase();

  let idInt = 0;
  if (actor.id) {
    for (let i = 0; i < actor.id.length; i++) {
      idInt += actor.id.charCodeAt(i);
    }
  }

  if (n.includes("pinkerton")) return tacticalPinkerton;
  if (
    n.includes("native") ||
    n.includes("tribe") ||
    n.includes("navajo") ||
    n.includes("chief") ||
    n.includes("brave") ||
    n.includes("warrior")
  ) {
    return idInt % 2 === 0 ? tacticalNative1 : tacticalNative2;
  }
  if (
    actor.type === "sheriff" ||
    actor.type === "deputy" ||
    n.includes("sheriff") ||
    n.includes("deputy") ||
    n.includes("marshal") ||
    n.includes("guard")
  ) {
    return tacticalSherrif;
  }
  return idInt % 2 === 0 ? tacticalBandit1 : tacticalBandit2;
};

export const CombatView: React.FC<CombatViewProps> = ({
  player,
  onVictory,
  onDefeat,
  combatType,
  difficultyRisk,
  onEquipWeapon,
  onUpdatePlayer,
  currentLocation,
  activeMissionTarget,
  activeProvokedNpcId,
  forcedWeather,
  forcedTimeOfDay,
  onTriggerTip,
  gameTimeHour = 12,
}) => {
  const [grid, setGrid] = useState<GridCell[]>([]);
  const [playerHp, setPlayerHp] = useState(player.hp);
  const [playerInjuries, setPlayerInjuries] = useState(
    player.injuries || createInitialInjuries(Math.max(100, player.maxHp)),
  );
  const [playerClip, setPlayerClip] = useState(player.weapon.clip);
  const [playerReserveAmmo, setPlayerReserveAmmo] = useState(() => {
    const ammoItemId = `ammo_${player.weapon.ammoType || "pistol"}`;
    const ammoItem = player.inventory.find((i) => i.id === ammoItemId);
    return ammoItem ? ammoItem.count : 0;
  });
  const baseApFromLevel = Math.min(
    12,
    Math.round(
      7 + (player.campMovementLvl || 0) + Math.max(0, player.level - 1) * 0.5,
    ),
  ) * ((player.hydration ?? 100) <= 0 ? 0.5 : 1.0);
  const playerEffectiveRange = player.weapon.range + (player.perks.includes("eagle_eye") ? 1 : 0);
  const [ap, _setApRaw] = useState(baseApFromLevel); // Action Points pool
  const apRef = React.useRef(baseApFromLevel);
  const setAp = (val) => {
    let nextAp;
    if (typeof val === "function") {
      nextAp = val(apRef.current);
    } else {
      nextAp = val;
    }
    apRef.current = nextAp;
    _setApRaw(nextAp);
  };
  const [turn, setTurn] = useState<"player" | "enemy">("player");

  // CLICK-EMPTY TRIGGER STATE
  const [logsVisible, setLogsVisible] = useState<boolean>(true);
  const [clickEmptyActive, setClickEmptyActive] = useState(false);

  useEffect(() => {
    if (onTriggerTip) {
      if (combatType === "duel") {
        onTriggerTip("duel", "The High Noon Duel", "In a duel, wait for the DRAW! flare, then click PRECISELY on your enemy faster than they shoot you.");
      } else {
        onTriggerTip("combat", "Tactical Combat", "Duck behind cover (📦/🪨) to reduce incoming chance to hit! You have Action Points each turn. Moving costs 1 AP, shooting costs 2-3 AP depending on your weapon.");
      }
    }
  }, [combatType, onTriggerTip]);

  // QUICKDRAW STANDOFF DUEL SYSTEM
  const [isDuelActive, setIsDuelActive] = useState(
    combatType !== "ambush" &&
      combatType !== "nest_clearing" &&
      combatType !== "camp_ambush",
  );
  const [duelStage, setDuelStage] = useState<
    "intro" | "drawing" | "shooting_sequence" | "summary" | "surrendered"
  >("intro");
  const [duelTimerActive, setDuelTimerActive] = useState(false);
  const [duelCountdownText, setDuelCountdownText] = useState("Stand Ready...");
  const [duelReadyToDraw, setDuelReadyToDraw] = useState(false);
  const [duelDrawTriggerTime, setDuelDrawTriggerTime] = useState<number>(0);
  const [duelPlayerClinkBonus, setDuelPlayerClinkBonus] = useState<number>(0); // +agility or -agility depending on speed
  const [duelReactSpeed, setDuelReactSpeed] = useState<number | null>(null);

  const [playerDuelShotsRemaining, setPlayerDuelShotsRemaining] =
    useState<number>(-1);
  const [playerDuelTargetsEngaged, setPlayerDuelTargetsEngaged] = useState<
    Set<string>
  >(new Set());

  // Duel Participant State
  interface DuelParticipant {
    id: string; // 'player' or enemy.id
    name: string;
    isPlayer: boolean;
    hp: number;
    maxHp: number;
    agility: number;
    accuracy: number;
    damage: number;
    isDead: boolean;
    isSurrendered: boolean;
    weaponName: string;
    actionDone: boolean;
    portrait?: string;
  }
  const [duelParticipants, setDuelParticipants] = useState<DuelParticipant[]>(
    [],
  );
  const [activeDuelPointer, setActiveDuelPointer] = useState<number>(0);
  const [duelLogs, setDuelLogs] = useState<string[]>([
    "☀️ Tension mounts under a blazing high noon sun. Initiative is based on Agility stats.",
  ]);
  const [duelFlash, setDuelFlash] = useState<boolean>(false);

  // SEQUENTIAL AI ACTOR TURN CONTROLLER
  const [activeAiEnemyIndex, setActiveAiEnemyIndex] = useState<number | null>(
    null,
  );
  const [playerPos, setPlayerPos] = useState({
    x: 4,
    y: combatType === "camp_ambush" ? 5 : 8,
  });
  const [enemies, setEnemies] = useState<CombatActor[]>([]);
  const [combatLogs, setCombatLogs] = useState<string[]>([]);
  const [explosions, setExplosions] = useState<
    { x: number; y: number; id: string }[]
  >([]);
  const [selectedEnemyId, setSelectedEnemyId] = useState<string | null>(null);
  const [fireAnim, setFireAnim] = useState<boolean>(false);

  // Focus Showdown & Throwable Systems State
  const [emergencyDynamite, setEmergencyDynamite] = useState(0);
  const [isAimingDynamite, setIsAimingDynamite] = useState(false);
  const [playerOverwatchMode, setPlayerOverwatchMode] = useState<number>(0);
  const [hasUsedFirstAid, setHasUsedFirstAid] = useState(false);

  // Special states for Cannon targeting
  const [isAimingCannon, setIsAimingCannon] = useState<boolean>(false);
  const [lastActionCoord, setLastActionCoord] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const [shootLines, setShootLines] = useState<
    {
      sx: number;
      sy: number;
      tx: number;
      ty: number;
      isHit: boolean;
      color: string;
      id: number;
    }[]
  >([]);

  const drawShootLine = (
    sx: number,
    sy: number,
    tx: number,
    ty: number,
    hit: boolean,
    color: string,
    weaponRange: number,
  ) => {
    const dist = Math.hypot(tx - sx, ty - sy);
    let finalTx = tx;
    let finalTy = ty;

    if (dist > weaponRange) {
      const ratio = weaponRange / dist;
      finalTx = sx + (tx - sx) * ratio;
      finalTy = sy + (ty - sy) * ratio;
      if (!hit) {
        finalTx += (Math.random() - 0.5) * 1.5;
        finalTy += (Math.random() - 0.5) * 1.5;
      }
    } else if (!hit) {
      finalTx += (Math.random() - 0.5) * 1.5;
      finalTy += (Math.random() - 0.5) * 1.5;
    }

    const newLineId = Date.now() + Math.random();
    setShootLines((prev) => [
      ...prev,
      { sx, sy, tx: finalTx, ty: finalTy, isHit: hit, color, id: newLineId },
    ]);
    setTimeout(() => {
      setShootLines((prev) => prev.filter((l) => l.id !== newLineId));
    }, 500);
  };

  // New tactical states
  const [stance, setStance] = useState<"standing" | "crouching" | "lying">(
    "standing",
  );
  const [meleeMode, setMeleeMode] = useState<"firearm" | "knife" | "fists">(
    "firearm",
  );
  const [targetedPart, setTargetedPart] = useState<
    "torso" | "arm" | "leg" | "head"
  >("torso");
  const [facing, setFacing] = useState<"up" | "down" | "left" | "right">("up");
  const [isArmInjured, setIsArmInjured] = useState(false);
  const [isLegInjured, setIsLegInjured] = useState(false);
  const [playerBleedTurns, setPlayerBleedTurns] = useState(0);
  const [playerPoisonTurns, setPlayerPoisonTurns] = useState(0);
  const [lastKnownLocations, setLastKnownLocations] = useState<{
    [id: string]: { x: number; y: number; name: string };
  }>({});
  const [playerSpottedDueToShooting, setPlayerSpottedDueToShooting] =
    useState(false);
  const [enemiesSpottedDueToShooting, setEnemiesSpottedDueToShooting] =
    useState<Record<string, boolean>>({});

  const [playerHitPopup, setPlayerHitPopup] = useState<{
    text: string;
    id: number;
  } | null>(null);
  const [playerSkipNextTurn, setPlayerSkipNextTurn] = useState<boolean>(false);

  const triggerPlayerHit = (location: string, gravity: string) => {
    setPlayerHitPopup({ text: `${location}, ${gravity}`, id: Date.now() });
    setTimeout(() => {
      setPlayerHitPopup((prev) => (prev?.id === Date.now() ? null : prev));
    }, 2500);
  };

  const [duelTargetId, setDuelTargetId] = useState<string>("");
  const [posseCombatActionsDone, setPosseCombatActionsDone] = useState<{
    [id: string]: boolean;
  }>({});

  // Auto-select first active enemy as quickdraw duel target on load
  useEffect(() => {
    if (enemies.length > 0 && !duelTargetId) {
      const firstEnemy = enemies.find(
        (e) => !e.isDead && !e.isSurrendered && !e.isUnconscious,
      );
      if (firstEnemy) setDuelTargetId(firstEnemy.id);
    }
  }, [enemies, duelTargetId]);

  const [hasCannonMap, setHasCannonMap] = useState(false);
  const [showEnvModal, setShowEnvModal] = useState(false);

  // Procedural Biome & Weather States
  const [combatBiome, setCombatBiome] = useState<{
    name: string;
    icon: string;
    description: string;
    id:
      | "canyon_ridge"
      | "town_barricade"
      | "railway_terminal"
      | "ghost_ruins"
      | "desert_oasis"
      | "outlaw_holdout";
  }>({
    name: "Standard Standoff",
    icon: "🤠",
    description: "Frontier shootout with standard rules.",
    id: "town_barricade",
  });

  const [combatWeather, setCombatWeather] = useState<{
    name: string;
    icon: string;
    description: string;
    effectText: string;
    id:
      | "clear"
      | "heatwave"
      | "fog"
      | "blinding_sun"
      | "overcast"
      | "desert_mirage"
      | "lightning_storm";
  }>({
    name: "Clear Sky",
    icon: "☀️",
    description: "Dry bright heat, standard range and rules.",
    effectText: "No weather modifiers.",
    id: "clear",
  });

  const GRID_SIZE =
    currentLocation?.type === "mine"
      ? 11
      : currentLocation?.type === "ghost_town"
        ? 10
        : 9;

  // Inventory & Weight
  const totalWeight = parseFloat(
    player.inventory
      .reduce((sum, item) => sum + getItemWeight(item) * item.count, 0)
      .toFixed(1),
  );
  const isHeavy = totalWeight > 40.0;

  // Upgrades
  const damageBonus = player.weaponUpgrades?.dmgBonus || 0;
  const rangeBonus = player.weaponUpgrades?.rangeBonus || 0;
  const accuracyBonus = player.weaponUpgrades?.accuracyBonus || 0;
  const hasScope = player.weaponUpgrades?.hasScope || false;

  // Find out details about the encounter for dossier representation
  const getEncounterDescription = () => {
    const rawCount = enemies.length;
    let bDesc = "";
    const isGang = rawCount > 1;

    let gangText = "";
    if (isGang) {
      gangText = `⚠️ FRONTIER OUTLAW GANG DECLARED: A hostile gang of ${rawCount} gunmen have formed a ring surrounding you! Approach with extreme tactical diligence.`;
    } else if (rawCount === 1) {
      gangText = `🤠 SINGLE COMBATANT: ${player.name} is locked in a direct individual street firefight or wild beast confrontation.`;
    }

    if (combatType === "nest_clearing") {
      bDesc =
        "Dangerous Mojave Scorpions have nested around these rocks. They strike at extremely close quarters, injecting lethal nerve venom with their tails. Handgun blasts are highly recommended.";
    } else if (combatType === "bounty") {
      bDesc =
        "A sanctioned bounty. The target outlaw leader is flanked by supporting trigger agents in high cover. Knocking out or handcuffing (using fists to knock them out or hitting arms to disarm) maximizes payout rewards.";
    } else if (combatType === "robbery") {
      bDesc =
        "Town officers have set up standard barricade perimeters. Deputies and sheriffs are trained to maintain tight covers and fire repeaters on your sight-lines.";
    } else {
      bDesc =
        "Ruthless road scavengers are seeking to loot your horse saddlebags! They will maneuver from crate to crate, utilizing flanking vectors to bypass your defense.";
    }

    const enemyDescriptions = enemies.map((e) => {
      let roleDesc = "";
      if (e.type === "scorpion") {
        if (e.name.includes("Alpha")) {
          roleDesc = `Thick carapace armored venom emperor dealing ${e.dmg} DMG crushing stings.`;
        } else {
          roleDesc = `Quick sand crawler scorpion seeking to poison ${player.name} for ${e.dmg} DMG.`;
        }
      } else {
        const wpn = e.weaponName || "Revolver";
        const traitName = e.trait
          ? `perk: [${e.trait.toUpperCase()}]`
          : "no special perk";
        roleDesc = `Carrying a ${wpn} (targets up to Range ${e.range} dealing ${e.dmg} base DMG). Active trait ${traitName}.`;
      }
      return {
        id: e.id,
        label: `${e.name} (${e.isDead ? "DEFEATED" : e.isSurrendered ? "CAPTURED" : "HP: " + e.hp + "/" + e.maxHp})`,
        desc: roleDesc,
      };
    });

    return {
      title: isGang
        ? `Outlaw Gang Encounter (${rawCount} Hostiles)`
        : `Lethal Crossfire Standoff`,
      gangText,
      description: bDesc,
      icon: combatType === "nest_clearing" ? "🦂" : "☠️",
      enemyDescriptions,
    };
  };

  // Initialize Combat Grid and Spawn Actors
  useEffect(() => {
    // A. Define available procedural biomes and weather conditions
    const biomes: {
      id:
        | "canyon_ridge"
        | "town_barricade"
        | "railway_terminal"
        | "ghost_ruins"
        | "desert_oasis"
        | "outlaw_holdout"
        | "ranch"
        | "ghost_town"
        | "native_camp"
        | "cavalry_fort"
        | "train_wagon";
      name: string;
      icon: string;
      description: string;
    }[] = [
      {
        id: "canyon_ridge",
        name: "Pine Canyon Ridge",
        icon: "🏔️",
        description:
          "Choked pine valley passes surrounded by vertical boulder ridges forming high shelter routes.",
      },
      {
        id: "town_barricade",
        name: "Dusty Town Barricade",
        icon: "🏣",
        description:
          "Unfinished wooden boards and water barrels forming structured horizontal block gates.",
      },
      {
        id: "railway_terminal",
        name: "Railway Crossing Spur",
        icon: "🚂",
        description:
          "Iron-plate railroad tracks split the grid. Steel scrap and low cargo crates are strewn around.",
      },
      {
        id: "ghost_ruins",
        name: "Scorched Ghost Ruins",
        icon: "🥀",
        description:
          "Decayed timber posts and crumbling brick columns from a bygone boom.",
      },
      {
        id: "desert_oasis",
        name: "Dry Prickly Oasis",
        icon: "🌵",
        description:
          "Rare desert spring surrounded by multiple prickly cacti and loose sand dunes.",
      },
      {
        id: "outlaw_holdout",
        name: "Saloon Backalley Alley",
        icon: "🏚️",
        description:
          "Tight-cluttered bottles, cargo luggage, and wooden fences optimal for ambush setups.",
      },
      {
        id: "ranch",
        name: "Pioneer Ranch",
        icon: "🏡",
        description:
          "A homesteader ranch with wooden walls, fences, and animal troughs.",
      },
      {
        id: "ghost_town",
        name: "Abandoned Ghost Town",
        icon: "🛣️",
        description: "Dusty streets between decaying brick and wooden walls.",
      },
      {
        id: "native_camp",
        name: "Native Settlement",
        icon: "⛺",
        description: "Tipis and campfires scattered across the open plains.",
      },
      {
        id: "cavalry_fort",
        name: "Cavalry Outpost",
        icon: "⛺",
        description:
          "Fortified military camp with thick wooden walls, tents, and strict lines of sight.",
      },
      {
        id: "train_wagon",
        name: "Railway Passenger Car",
        icon: "🚃",
        description:
          "Claustrophobic passenger seats and dark luxury luggage carts rushing down the rails.",
      },
    ];

    const weathers: {
      id:
        | "clear"
        | "heatwave"
        | "fog"
        | "blinding_sun"
        | "overcast"
        | "desert_mirage"
        | "lightning_storm";
      name: string;
      icon: string;
      description: string;
      effectText: string;
    }[] = [
      {
        id: "clear",
        name: "Sunny High Noon",
        icon: "☀️",
        description: "Dry bright heat, standard rules apply.",
        effectText: "Standard stats.",
      },
      {
        id: "heatwave",
        name: "Dread Mojave Heatwave",
        icon: "🌵",
        description: "Oven-like heat that saps endurance rapidly.",
        effectText: "${player.name} starts with -1 Max AP due to exhaustion.",
      },
      {
        id: "fog",
        name: "Thick Mountain Fog",
        icon: "🌫️",
        description: "Dense white mist crawling along the boulders.",
        effectText: "Ranged guns have -1.5 Max Range & -15% accuracy.",
      },
      {
        id: "blinding_sun",
        name: "Blinding Sun",
        icon: "🌞",
        description:
          "Searing sunlight reflecting off the dust, making it hard to track targets.",
        effectText: "Accuracy drops slightly due to bright glare.",
      },
      {
        id: "overcast",
        name: "Gloomy Overcast",
        icon: "☁️",
        description:
          "Heavy grey clouds mute the shadows. Slightly lower visibility.",
        effectText: "No major penalties, but sets a grim mood.",
      },
      {
        id: "desert_mirage",
        name: "Desert Mirage",
        icon: "🏜️",
        description: "Heat distortions warp distance perception.",
        effectText:
          "Range calculations are highly inaccurate at long distances.",
      },
      {
        id: "lightning_storm",
        name: "Lightning Thunderclap",
        icon: "⚡",
        description: "Forked strikes from black storm clouds above.",
        effectText:
          "Random lightning strikes (35% chance per turn transition) hit cells dealing 15 damage.",
      },
    ];

    // Pick Biome procedurally matching context
    let chosenBiome = biomes[0];

    if (combatType === "train_robbery") {
      chosenBiome = biomes.find((b) => b.id === "train_wagon")!;
    } else if (combatType === "nest_clearing") {
      chosenBiome =
        Math.random() < 0.6
          ? biomes.find((b) => b.id === "desert_oasis")!
          : biomes[Math.floor(Math.random() * biomes.length)];
    } else if (combatType === "robbery") {
      chosenBiome =
        Math.random() < 0.6
          ? biomes.find((b) => b.id === "town_barricade")!
          : biomes[Math.floor(Math.random() * biomes.length)];
    } else if (currentLocation) {
      if (currentLocation.type === "mine") {
        chosenBiome = biomes.find((b) => b.id === "canyon_ridge")!;
      } else if (currentLocation.type === "ghost_town") {
        chosenBiome = biomes.find((b) => b.id === "ghost_town")!;
      } else if (currentLocation.type === "boomtown") {
        chosenBiome = biomes.find((b) => b.id === "town_barricade")!;
      } else if (currentLocation.type === "railway_hub") {
        chosenBiome = biomes.find((b) => b.id === "railway_terminal")!;
      } else if (currentLocation.type === "outlaw_haven") {
        chosenBiome = biomes.find((b) => b.id === "outlaw_holdout")!;
      } else if (currentLocation.type === "desert_oasis") {
        chosenBiome = biomes.find((b) => b.id === "desert_oasis")!;
      } else if (currentLocation.type === "hostile_camp") {
        chosenBiome =
          Math.random() < 0.5
            ? biomes.find((b) => b.id === "native_camp")!
            : biomes.find((b) => b.id === "outlaw_holdout")!;
      } else if (currentLocation.type === "ranch") {
        chosenBiome = biomes.find((b) => b.id === "ranch")!;
      } else if (currentLocation.type === "cavalry_fort") {
        chosenBiome = biomes.find((b) => b.id === "cavalry_fort")!;
      } else {
        chosenBiome = biomes[Math.floor(Math.random() * biomes.length)];
      }
    } else {
      chosenBiome = biomes[Math.floor(Math.random() * biomes.length)];
    }

    setCombatBiome(chosenBiome);

    // Pick Weather procedurally
    let validWeathers = weathers;
    if (chosenBiome.id !== "desert_oasis") {
      validWeathers = weathers.filter((w) => w.id !== "desert_mirage");
    }

    let chosenWeather =
      validWeathers[Math.floor(Math.random() * validWeathers.length)];
    if (forcedWeather) {
      const found = weathers.find((w) => w.id === forcedWeather);
      if (found) chosenWeather = found;
    }
    setCombatWeather(chosenWeather);

    // Set starting Player AP reflecting weather exhaustion
    let startAp = Math.min(
      12,
      Math.round(
        7 +
          (player.campMovementLvl || 0) +
          Math.max(0, player.level - 1) * 0.5 -
          (chosenWeather.id === "heatwave" ? 1 : 0)
      )
    );
    if ((player.hydration ?? 100) <= 0) startAp = Math.floor(startAp * 0.5);
    setAp(startAp);

    // 1. Generate grid cells with procedural covers based on selected biome
    const newGrid: GridCell[] = [];

    // Check if cannon should spawn
    const allowsCannon =
      currentLocation.type === "mine" ||
      currentLocation.type === "railway_hub" ||
      currentLocation.type === "boomtown";
    const spawnCannonHere =
      allowsCannon && player.level > 1 && Math.random() < 0.05;
    setHasCannonMap(spawnCannonHere);

    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        let type: GridCell["type"] = "empty";

        // Place Cannon at (4, 4) Center
        if (x === 4 && y === 4 && spawnCannonHere) {
          type = "rail" as any; // Stationary Cannon placement cell
        } else if (combatType === "camp_ambush" && x === 4 && y === 4) {
          type = "camp_fire";
        } else if (combatType === "camp_ambush" && Math.abs(x - 4) <= 1 && Math.abs(y - 4) <= 1) {
          type = "empty";
        } else {
          const rand = Math.random();
          switch (chosenBiome.id) {
            case "canyon_ridge":
              if ((x <= 1 || x >= 7) && y !== 4) {
                if (rand < 0.5) type = "boulder";
                else if (rand < 0.7) type = "high_cover";
                else if (rand < 0.85) type = "cactus";
              } else {
                if (rand < 0.08) type = "boulder";
                else if (rand < 0.12) type = "cactus";
              }
              break;

            case "town_barricade":
              if (y === 2 || y === 6) {
                if (x !== 3 && x !== 5) {
                  if (rand < 0.45) type = "fence";
                  else if (rand < 0.6) type = "wagon";
                  else if (rand < 0.8) type = "water_trough";
                }
              } else {
                if (rand < 0.05) type = "crates";
              }
              break;

            case "railway_terminal":
              if (y === 5) {
                type = "rail" as any;
              } else if (Math.abs(y - 5) === 1) {
                if (rand < 0.22) type = "crates";
                else if (rand < 0.32) type = "mining_cart";
              } else {
                if (rand < 0.07) type = "low_cover";
              }
              break;

            case "ghost_ruins":
              const isWallSpot =
                (x === 2 && y === 2) ||
                (x === 2 && y === 3) ||
                (x === 3 && y === 2) ||
                (x === 6 && y === 2) ||
                (x === 6 && y === 3) ||
                (x === 5 && y === 2) ||
                (x === 2 && y === 6) ||
                (x === 3 && y === 6);
              if (isWallSpot) {
                if (rand < 0.4) type = "tombstone";
                else if (rand < 0.75) type = "high_cover";
                else if (rand < 0.9) type = "low_cover";
              } else {
                if (rand < 0.08) type = "cactus";
              }
              break;

            case "desert_oasis":
              const centerDist = Math.hypot(x - 4, y - 4);
              if (centerDist < 2.5 && centerDist > 0.5) {
                if (rand < 0.25) type = "tree";
                else if (rand < 0.4) type = "cactus";
                else if (rand < 0.5) type = "water_trough";
              } else {
                if (rand < 0.16) type = "cactus";
                else if (rand < 0.24) type = "low_cover";
              }
              break;

            case "train_wagon":
              if (x <= 1 || x >= 7) {
                // Wagon walls
                type = "high_cover";
              } else if (x === 4) {
                // center aisle
                type = "empty";
              } else if (y % 2 !== 0 && x !== 4) {
                // Seating
                type = "low_cover";
              } else {
                if (rand < 0.15) type = "crates";
              }
              break;

            case "outlaw_holdout":
              if (y > 1 && y < 7) {
                if (rand < 0.15) type = "crates";
                else if (rand < 0.28) type = "wagon";
                else if (rand < 0.33) type = "high_cover";
              } else {
                if (rand < 0.08) type = "low_cover";
              }
              break;

            case "ranch":
              // house at the top
              if (y <= 2) {
                if (x === 4 && y === 2)
                  type = "empty"; // door
                else if (rand < 0.6) type = "wooden_wall";
                else if (rand < 0.7) type = "table";
              } else if (y === 5 && (x === 2 || x === 6)) {
                type = "well";
              } else if (y >= 6) {
                if (x === 4) type = "empty";
                else if (rand < 0.4) type = "fence";
                else if (rand < 0.5) type = "water_trough";
              } else {
                if (rand < 0.05) type = "tree";
              }
              break;

            case "ghost_town":
              // Street in the middle (x=4)
              if (x === 4) {
                if (rand < 0.1) type = "wagon";
              } else if (x === 2 || x === 6) {
                // Building facades
                if (rand < 0.4) type = "brick_wall";
                else if (rand < 0.7) type = "wooden_wall";
              } else {
                if (rand < 0.1) type = "low_cover";
                else if (rand < 0.15) type = "tombstone";
              }
              break;

            case "native_camp":
              // clustered tipis
              if (Math.abs(x - 4) > 1 && Math.abs(y - 4) > 1) {
                if (rand < 0.3) type = "tipi";
                else if (rand < 0.4) type = "fence";
              } else if (x === 4 && y === 4) {
                type = "camp_fire"; // Campfire
              } else {
                if (rand < 0.05) type = "tree";
              }
              break;

            case "cavalry_fort":
              if (y === 1 || y === 7 || x === 1 || x === 7) {
                if (x === 4 || y === 4)
                  type = "empty"; // gates
                else if (y === 1 || y === 7) type = "wooden_wall";
              } else if (y === 2 || y === 6) {
                if (rand < 0.2) type = "tent";
              } else if (x === 4 && y === 4) {
                type = "boulder"; // center rally point
              } else {
                if (rand < 0.05) type = "crates";
              }
              break;

            default:
              if (y > 1 && y < 7) {
                if (rand < 0.08) type = "tree";
                else if (rand < 0.14) type = "boulder";
              }
              break;
          }

          if (
            type !== "empty" &&
            type !== "rail" &&
            type !== "high_cover" &&
            type !== "boulder"
          ) {
            const allowsTnt =
              currentLocation.type === "mine" ||
              currentLocation.type === "outlaw_haven" ||
              currentLocation.type === "boomtown" ||
              currentLocation.type === "railway_hub";
            if (allowsTnt && Math.random() < 0.08) {
              type = "tnt_barrel";
            }
          }

          if (type === "empty") {
            const isNight =
              forcedTimeOfDay !== undefined && forcedTimeOfDay !== null
                ? forcedTimeOfDay === "night"
                : gameTimeHour <= 5 || gameTimeHour >= 19;
            if (isNight && Math.random() < 0.04) {
              type = "lantern";
            }
          }
        }

        let hp: number | undefined;
        let maxHp: number | undefined;
        if (type === "low_cover") {
          hp = 40;
          maxHp = 40;
        } else if (type === "high_cover") {
          hp = 80;
          maxHp = 80;
        } else if (type === "cactus") {
          hp = 25;
          maxHp = 25;
        } else if (type === "tnt_barrel") {
          hp = 15;
          maxHp = 15;
        } else if (type === "camp_fire" || type === "lantern") {
          hp = 30;
          maxHp = 30;
        } else if (type === "tree") {
          hp = 100;
          maxHp = 100;
        } else if (type === "wagon") {
          hp = 60;
          maxHp = 60;
        } else if (type === "crates") {
          hp = 30;
          maxHp = 30;
        } else if (type === "tombstone") {
          hp = 80;
          maxHp = 80;
        } else if (type === "fence") {
          hp = 20;
          maxHp = 20;
        } else if (type === "water_trough") {
          hp = 45;
          maxHp = 45;
        } else if (type === "boulder") {
          hp = 120;
          maxHp = 120;
        } else if (type === "mining_cart") {
          hp = 90;
          maxHp = 90;
        } else if (type === "wooden_wall") {
          hp = 60;
          maxHp = 60;
        } else if (type === "brick_wall") {
          hp = 100;
          maxHp = 100;
        } else if (type === "well") {
          hp = 70;
          maxHp = 70;
        } else if (type === "table") {
          hp = 25;
          maxHp = 25;
        } else if (type === "bar") {
          hp = 50;
          maxHp = 50;
        } else if (type === "tent") {
          hp = 15;
          maxHp = 15;
        } else if (type === "tipi") {
          hp = 30;
          maxHp = 30;
        }

        newGrid.push({ x, y, type, hp, maxHp });
      }
    }
    setGrid(newGrid);

    // 2. Spawn Enemies fully procedurally
    const spawnedEnemies: CombatActor[] = [];
    let numEnemies = Math.max(
      1,
      Math.min(4, Math.round(1 + difficultyRisk * 3)),
    );

    // Nemesis Override check
    const nemesisTarget = player.nemeses?.find(
      (n) => n.id === activeMissionTarget?.id,
    );

    if (nemesisTarget) {
      numEnemies = nemesisTarget.gangSize;
    } else if (activeProvokedNpcId) {
      numEnemies = 1;
    } else if (activeMissionTarget && activeMissionTarget.targetName) {
      const nameLower = activeMissionTarget.targetName.toLowerCase();
      if (
        nameLower.includes("gang") ||
        nameLower.includes("boys") ||
        nameLower.includes("brothers") ||
        nameLower.includes("bandits") ||
        activeMissionTarget.difficulty >= 2
      ) {
        numEnemies = Math.max(
          1,
          Math.min(
            4,
            Math.round(1 + (activeMissionTarget.difficulty || 1) * 1.5),
          ),
        );
      } else {
        numEnemies = 1;
      }
    }

    const prefixes = [
      "Slippery",
      "Deadeye",
      "Mad Dog",
      "Blind-Eye",
      "Calamity",
      "Rico",
      "Wild",
      "Gallows",
      "Ghost",
      "Rattlesnake",
      "Whiskey",
      "Iron-Sights",
      "Ringo",
    ];
    const midnames = [
      '"The Kid"',
      '"Killer"',
      '"Ace"',
      '"Coyote"',
      '"Snake"',
      '"Trigger"',
      '"Colt"',
      '"Six-Gun"',
    ];
    const lastnames = [
      "James",
      "Kerr",
      "Cassidy",
      "Earp",
      "Hardin",
      "Garrett",
      "Clanton",
      "Jameson",
      "Miller",
      "Plummer",
      "Dalton",
    ];

    const pickEnemyName = (role: "leader" | "bandit" | "deputy") => {
      const p = prefixes[Math.floor(Math.random() * prefixes.length)];
      const m = midnames[Math.floor(Math.random() * midnames.length)];
      const l = lastnames[Math.floor(Math.random() * lastnames.length)];
      if (role === "leader") return `${p} ${m} ${l}`;
      if (role === "deputy") return `Deputy ${p} ${l}`;
      return `${p} "${m}" ${l}`;
    };

    const outlawArchetypes = [
      {
        profile: "heavy_desperado",
        namePrefix: "Heavy Desperado",
        hpMultiplier: 1.4,
        dmgMultiplier: 1.25,
        accuracyModifier: -0.1,
        rangeModifier: -1,
      },
      {
        profile: "agile_scout",
        namePrefix: "Agile Scout",
        hpMultiplier: 0.85,
        dmgMultiplier: 0.85,
        accuracyModifier: 0.05,
        rangeModifier: 0,
      },
      {
        profile: "deadeye_marksman",
        namePrefix: "Deadeye Marksman",
        hpMultiplier: 0.9,
        dmgMultiplier: 1.15,
        accuracyModifier: 0.15,
        rangeModifier: 2,
      },
      {
        profile: "standard_scoundrel",
        namePrefix: "Badlands Raider",
        hpMultiplier: 1.0,
        dmgMultiplier: 1.0,
        accuracyModifier: 0,
        rangeModifier: 0,
      },
    ];

    const weaponArchetypes = [
      { name: "Sawn-off double barrel shotgun 💥", dmg: 35, range: 3, clip: 2 },
      { name: "Smith & Wesson Schofield 🔫", dmg: 22, range: 4, clip: 6 },
      {
        name: "Colt Single Action Army Cavalry 🤠",
        dmg: 18,
        range: 5,
        clip: 6,
      },
      { name: "Winchester Repeating Rifle 🎯", dmg: 28, range: 8, clip: 10 },
      { name: "Derringer Pocket Pistol 🎖️", dmg: 14, range: 3, clip: 4 },
    ];

    for (let i = 0; i < numEnemies; i++) {
      let x = Math.round(1 + i * 2);
      if (x === 4) x = 3;
      if (chosenBiome.id === "train_wagon" && (x <= 1 || x >= 7)) {
        x = 4; // Force to center aisle if attempting to spawn in walls
      }
      let y = Math.round(0 + Math.random() * 1.5);
      if (chosenBiome.id === "train_wagon") {
        y = Math.round(0 + Math.random() * 3); // Spreads them further down the car
      }
      
      if (combatType === "camp_ambush") {
        // Attack from margins
        const edge = Math.floor(Math.random() * 4);
        if (edge === 0) { x = Math.floor(Math.random() * GRID_SIZE); y = 0; }
        else if (edge === 1) { x = Math.floor(Math.random() * GRID_SIZE); y = GRID_SIZE - 1; }
        else if (edge === 2) { x = 0; y = Math.floor(Math.random() * GRID_SIZE); }
        else { x = GRID_SIZE - 1; y = Math.floor(Math.random() * GRID_SIZE); }
      }

      let enemyType: CombatActor["type"] = "bandit";
      let enemyName = "";
      let hp = 35 + Math.round(difficultyRisk * 45);
      let dmg = 10 + Math.round(difficultyRisk * 15);
      let range = 4;
      let clip = 6;
      let accuracy = 0.6 + difficultyRisk * 0.15;
      let chosenTrait: CombatActor["trait"] = undefined;
      let weaponName = "Standard Revolver 🔫";

      if (combatType === "nest_clearing") {
        enemyType = "scorpion";
        if (i === 0) {
          enemyName = "Alpha Brood Emperor 🦂";
          hp = 65 + Math.round(difficultyRisk * 30);
          dmg = 24 + Math.round(difficultyRisk * 8);
          accuracy = 0.8;
        } else {
          const scorpPrefixes = [
            "Stinging",
            "Sand",
            "Canyon",
            "Searing",
            "Venomshell",
          ];
          enemyName = `${scorpPrefixes[Math.floor(Math.random() * scorpPrefixes.length)]} Mojave Scorpion 🦂`;
          hp = 22 + Math.round(difficultyRisk * 15);
          dmg = 12 + Math.round(difficultyRisk * 5);
          accuracy = 0.7;
        }
        range = 1;
        clip = 99;
      } else {
        // Roll standard profiles
        const arch =
          outlawArchetypes[Math.floor(Math.random() * outlawArchetypes.length)];
        const wep =
          weaponArchetypes[Math.floor(Math.random() * weaponArchetypes.length)];

        hp = Math.round(hp * arch.hpMultiplier);
        dmg = Math.round(
          wep.dmg * arch.dmgMultiplier * (1 + difficultyRisk * 0.3),
        );
        accuracy = Math.max(
          0.45,
          Math.min(0.95, accuracy + arch.accuracyModifier),
        );
        range = Math.max(3, wep.range + arch.rangeModifier);
        clip = wep.clip;
        weaponName = wep.name;

        if (combatType === "bounty" && i === 0) {
          enemyType = "outlaw_leader";
          enemyName = pickEnemyName("leader");
          hp = Math.round(hp * 1.5) + 30;
          dmg = Math.round(dmg * 1.25);
          accuracy = Math.min(0.95, accuracy + 0.1);
        } else if (combatType === "train_robbery") {
          if (i === 0) {
            enemyType = "sheriff";
            enemyName = `Pinkerton Agent ${pickEnemyName("leader")}`;
            hp = hp + 55;
            dmg = Math.round(dmg * 1.3);
            accuracy = Math.min(0.95, accuracy + 0.15);
          } else {
            enemyType = "deputy";
            enemyName = `Rail Guard ${pickEnemyName("bandit")}`;
          }
        } else if (combatType === "robbery") {
          if (i === 0) {
            enemyType = "sheriff";
            enemyName = `Marshal ${pickEnemyName("leader")}`;
            hp = hp + 45;
            dmg = Math.round(dmg * 1.2);
            accuracy = Math.min(0.92, accuracy + 0.08);
          } else {
            enemyType = "deputy";
            enemyName = pickEnemyName("deputy");
          }
        } else if (chosenBiome.id === "native_camp") {
          enemyType = "bandit"; // use the same AI mechanics
          enemyName =
            i === 0
              ? "Tribe Chief " + pickEnemyName("leader")
              : "Native Brave " + pickEnemyName("bandit");
        } else {
          enemyType = "bandit";
          enemyName = pickEnemyName("bandit");
        }

        // Add visual suffix descriptors to name
        enemyName = `${enemyName} (The ${arch.namePrefix})`;

        // Override name with specific requested targets
        if (i === 0 && activeProvokedNpcId === "slippery_pete") {
          enemyName = "Slippery Pete (The Horse Thief)";
          enemyType = "outlaw_leader";
          hp = 25;
          dmg = 8;
          weaponName = "Rusty Derringer Pocket Pistol 🎖️";
          clip = 4;
          range = 3;
          accuracy = 0.5;
        } else if (i === 0 && activeProvokedNpcId === "sheriff_garrett") {
          enemyName = "Sheriff Garrett (Federal Law)";
          enemyType = "sheriff";
        } else if (
          i === 0 &&
          activeMissionTarget &&
          activeMissionTarget.targetName
        ) {
          const nemesisDef = player.nemeses?.find(
            (n) => n.id === activeMissionTarget.id,
          );
          if (nemesisDef) {
            enemyName = `${nemesisDef.name} (Nemesis)`;
            enemyType = "outlaw_leader";
            hp = Math.round(hp * nemesisDef.powerLevel);
            dmg = Math.round(dmg * Math.min(1.5, nemesisDef.powerLevel));
          } else {
            enemyName = `${activeMissionTarget.targetName} (Bounty Target)`;
            enemyType = "outlaw_leader";
          }
        }

        // Choose procedural combat traits
        const traitsPoolRef: CombatActor["trait"][] = [
          "quickdraw",
          "armored",
          "ruthless",
          "slippery",
          "glass_cannon",
        ];
        chosenTrait =
          traitsPoolRef[Math.floor(Math.random() * traitsPoolRef.length)];

        if (chosenTrait === "glass_cannon") {
          hp = Math.ceil(hp * 0.6);
          dmg = Math.round(dmg * 1.35);
        } else if (chosenTrait === "armored") {
          hp = Math.round(hp * 1.25);
          accuracy = Math.max(0.4, accuracy - 0.05);
        }
      }

      let enemyAgility = 8 + Math.round(Math.random() * 8);
      if (chosenTrait === "quickdraw")
        enemyAgility = 18 + Math.round(Math.random() * 6);
      if (enemyType === "scorpion")
        enemyAgility = 4 + Math.round(Math.random() * 4);

      spawnedEnemies.push({
        id: `enemy_${i}_${Date.now() + Math.random()}`,
        name: enemyName,
        type: enemyType,
        hp,
        maxHp: hp,
        x,
        y,
        dmg,
        range,
        clip,
        maxClip: clip,
        accuracy,
        agility: enemyAgility,
        intelligence:
          enemyType === "scorpion"
            ? 1
            : Math.round(3 + Math.random() * 5 + difficultyRisk * 2), // 3 to 10
        isDead: false,
        alerted: true,
        trait: chosenTrait,
        weaponName: weaponName,
        stance: "standing",
        injuries: createInitialInjuries(hp),
      });
    }

    if (player.posse && player.posse.length > 0) {
      player.posse.forEach((posseMember, idx) => {
        let isBetraying = false;
        // Lawful posse members betray you if you rob an innocent location
        if (combatType === "robbery") {
          const ali =
            ["Lawman", "Bounty Hunter", "Scout"].includes(posseMember.role) ||
            posseMember.trait === "loyal"
              ? "lawful"
              : "outlaw";
          if (ali === "lawful") isBetraying = true;
        }

        if (isBetraying) {
          addLog(
            `⚠️ MUTINY! "${posseMember.name}" refuses to be part of this dishonorable act and points their weapon at you!`,
          );
        }

        spawnedEnemies.push({
          id: posseMember.id,
          name: posseMember.name,
          type: isBetraying ? "bandit" : "posse",
          hp: posseMember.hp,
          maxHp: posseMember.maxHp,
          x: combatType === "camp_ambush" && !isBetraying
            ? 4 + [{dx: -1, dy: 1}, {dx: 1, dy: 1}, {dx: -1, dy: 0}, {dx: 1, dy: 0}, {dx: 0, dy: -1}, {dx: -1, dy: -1}, {dx: 1, dy: -1}][idx % 7].dx
            : Math.min(
                8,
                Math.max(
                  0,
                  4 + (idx % 2 === 0 ? 1 : -1) * (Math.floor(idx / 2) + 1),
                ),
              ),
          y: combatType === "camp_ambush" && !isBetraying 
            ? 4 + [{dx: -1, dy: 1}, {dx: 1, dy: 1}, {dx: -1, dy: 0}, {dx: 1, dy: 0}, {dx: 0, dy: -1}, {dx: -1, dy: -1}, {dx: 1, dy: -1}][idx % 7].dy 
            : isBetraying ? 1 : 8,
          dmg: posseMember.dmg,
          range: posseMember.range,
          clip: 6,
          maxClip: 6,
          accuracy: 0.8,
          agility: 12 + Math.round(Math.random() * 6),
          intelligence: 8,
          isDead: false,
          alerted: true,
          weaponName: posseMember.role,
          stance: "standing",
          injuries: createInitialInjuries(posseMember.hp),
        });
      });
    }

    spawnedEnemies.sort((a, b) => (b.agility || 0) - (a.agility || 0));
    setEnemies(spawnedEnemies);

    // Initialize Duel Standoff Participants
    const pAgility =
      12 +
      player.level * 2 +
      (player.perks.includes("deadeye") ? 5 : 0) +
      Math.round(accuracyBonus / 10);
    const isPistol =
      player.weapon.name.toLowerCase().includes("pistol") ||
      player.weapon.name.toLowerCase().includes("revolver") ||
      player.weapon.name.toLowerCase().includes("colt");
    const wpnSkill = isPistol
      ? player.pistolSkill || 0
      : player.rifleSkill || 0;

    const pDuel: DuelParticipant = {
      id: "player",
      name: `${player.name} (You) 🤠`,
      isPlayer: true,
      hp: player.hp,
      maxHp: player.maxHp,
      agility: pAgility,
      accuracy: 0.65 + Math.min(0.3, wpnSkill * 0.02) + accuracyBonus / 100,
      damage: player.weapon.dmg + damageBonus,
      isDead: false,
      isSurrendered: false,
      weaponName: player.weapon.name,
      actionDone: false,
    };

    const initialDuelList: DuelParticipant[] = [pDuel];
    spawnedEnemies.forEach((e) => {
      let isBeast = e.type === "scorpion";

      initialDuelList.push({
        id: e.id,
        name: e.type === "posse" ? `${e.name} (Posse) 🤠` : e.name,
        isPlayer: e.type === "posse",
        hp: e.hp,
        maxHp: e.maxHp,
        agility: e.agility || 10,
        accuracy: e.accuracy,
        damage: e.dmg,
        isDead: false,
        isSurrendered: false,
        weaponName:
          e.weaponName || (isBeast ? "Nerve Sting 🦂" : "Revolver 🔫"),
        actionDone: false,
        portrait:
          e.type === "posse"
            ? player.posse?.find((p) => p.id === e.id)?.portrait
            : undefined,
      });
    });

    // Make a raw sort by agility (which will be updated once drawing trigger resolves)
    initialDuelList.sort((a, b) => b.agility - a.agility);
    setDuelParticipants(initialDuelList);
    FrontierAudio.playMusic("duel");

    // Initialize last known locations with starting positions
    const initialK: { [id: string]: { x: number; y: number; name: string } } =
      {};
    spawnedEnemies.forEach((e) => {
      initialK[e.id] = { x: e.x, y: e.y, name: e.name };
    });
    setLastKnownLocations(initialK);
    
    // Explicitly set the player's position for this combat scenario
    setPlayerPos({
      x: 4,
      y: combatType === "camp_ambush" ? 5 : 8,
    });

    // Welcome message
    const introMsg =
      combatType === "nest_clearing"
        ? `🏜️ SCORPION NEST [${chosenBiome.name}]: Prickly spines and scorpions spotted! Atmosphere: ${chosenWeather.name}.`
        : combatType === "camp_ambush"
          ? `⛺ MIDNIGHT AMBUSH [${chosenBiome.name}]: Defend your campfire from aggressive hostiles emerging from the dark! Atmosphere: ${chosenWeather.name}.`
          : combatType === "train_robbery"
            ? `🚂 TRAIN HEIST [${chosenBiome.name}]: Guards pull their irons inside the rushing train car! Atmosphere: ${chosenWeather.name}.`
            : combatType === "robbery"
              ? `🚨 BLOCKADE BRUSH [${chosenBiome.name}]: Town officers surround the perimeters. Atmosphere: ${chosenWeather.name}.`
              : `⚔️ STANDOFF COMBAT [${chosenBiome.name}]: Draw weapons, seek coverage, and aim carefully. Atmosphere: ${chosenWeather.name}.`;
    setCombatLogs([
      introMsg,
      "Frontier Standoff: Spend your Action Points (AP). Move, Reload, Swap or Fire.",
    ]);

    // Auto-trigger environmental modal if there are modifiers (night and/or not clear sky weather)
    const currentIsNight =
      forcedTimeOfDay !== undefined && forcedTimeOfDay !== null
        ? forcedTimeOfDay === "night"
        : gameTimeHour <= 5 || gameTimeHour >= 19;

    if (currentIsNight || chosenWeather.id !== "clear") {
      setShowEnvModal(true);
    }
  }, [combatType, difficultyRisk, player.campMovementLvl, forcedTimeOfDay, forcedWeather, player.stats]);

  // Update lastKnownLocations overlay when enemies move or player looks at them
  useEffect(() => {
    const hasScout =
      player.posse && player.posse.some((p) => p.role === "Scout");

    setLastKnownLocations((prev) => {
      let updated = false;
      const nextKnown = { ...prev };
      enemies.forEach((enemy) => {
        if (enemy.isDead) return;
        let visible = isEnemySpottedByPlayer(enemy);

        // Deep Tracking mechanic: Scouts can track hidden enemies based on footsteps!
        if (!visible && hasScout) {
          // Provide a chance to lock onto their actual grid even out of sight
          if (Math.random() < 0.8) visible = true;
        }

        if (visible) {
          const current = prev[enemy.id];
          if (!current || current.x !== enemy.x || current.y !== enemy.y) {
            nextKnown[enemy.id] = { x: enemy.x, y: enemy.y, name: enemy.name };
            updated = true;
          }
        }
      });
      return updated ? nextKnown : prev;
    });
  }, [enemies, playerPos, facing, enemiesSpottedDueToShooting]);

  // Adjust player clip maximum dynamically if upgraded
  useEffect(() => {
    // Sync clips with max values
    const currentMax =
      player.weapon.maxClip + (player.weaponUpgrades?.clipBonus || 0);
    if (playerClip > currentMax) {
      setPlayerClip(currentMax);
    }
  }, [player.weapon.maxClip, player.weaponUpgrades?.clipBonus]);

  // Preemption from Quickdraw perk
  useEffect(() => {
    if (player.perks.includes("quickdraw")) {
      addLog(
        "⚡ QUICKDRAW SPECIAL: Seized firing priority. Preempt enemy lines instantly.",
      );
    }
  }, [player.perks]);

  const handlePlayerDuelShootTarget = (targetId: string) => {
    if (duelStage !== "shooting_sequence") return;
    const currentActor = duelParticipants[activeDuelPointer];
    if (!currentActor || !currentActor.isPlayer) return;

    const target = duelParticipants.find((p) => p.id === targetId);
    if (!target || target.isDead || target.isSurrendered) return;

    // Flash screen
    setDuelFlash(true);
    setTimeout(() => setDuelFlash(false), 150);
    FrontierAudio.playGunshot();

    // Calculate hit
    let hitPercent =
      currentActor.accuracy +
      (player.pistolSkill || 0) * 0.02 +
      (player.rifleSkill || 0) * 0.02;
    if (player.perks.includes("deadeye")) hitPercent += 0.3; // retain deadeye logic if perk exists
    const hit = Math.random() <= hitPercent;

    if (hit) {
      // 15% chance for a critical hit + stats modifier
      const critChance =
        0.15 + ((player.pistolSkill || 0) + (player.rifleSkill || 0)) * 0.02;
      const isCrit = Math.random() <= critChance;

      const dealtDmg = isCrit ? currentActor.damage * 2 : currentActor.damage;
      const nextTargetHp = Math.max(0, target.hp - dealtDmg);
      const isFatal = nextTargetHp <= 0;

      // Check surrender
      let surrenderFlag = false;
      if (!isFatal && nextTargetHp <= target.maxHp * 0.5) {
        const randSurrender = Math.random();
        const scorp = target.name.includes("🦂");
        if (!scorp) {
          const isSlippery =
            target.name.toLowerCase().includes("slippery") ||
            target.name.toLowerCase().includes("scout");
          const isLeader =
            target.name.toLowerCase().includes("emperor") ||
            target.name.toLowerCase().includes("marshal") ||
            target.name.toLowerCase().includes("leader");
          const capPercent = isSlippery ? 0.75 : isLeader ? 0.2 : 0.5;
          if (randSurrender <= capPercent) {
            surrenderFlag = true;
          }
        }
      }

      setDuelLogs((prev) => [
        ...prev,
        `🎯 DIRECT HIT! ${player.name} fired and struck ${target.name} during the standoff for -${dealtDmg} HP damage!${isCrit ? " (CRITICAL STRIKE! 🔥)" : ""}${
          isFatal ? ` (FATAL ☠️)` : surrenderFlag ? ` (🙌 SURRENDERED!)` : ""
        }`,
      ]);

      setDuelParticipants((prev) =>
        prev.map((p) => {
          if (p.id === targetId) {
            return {
              ...p,
              hp: nextTargetHp,
              isDead: isFatal,
              isSurrendered: surrenderFlag,
            };
          }
          return p;
        }),
      );
    } else {
      setDuelLogs((prev) => [
        ...prev,
        `💨 MISSED! Your heavy slug whistled broad of ${target.name}'s collarbone!`,
      ]);
    }

    if (onUpdatePlayer) {
      const wName = player.weapon.name.toLowerCase();
      const isP =
        wName.includes("pistol") ||
        wName.includes("revolver") ||
        wName.includes("colt");
      onUpdatePlayer({
        ...player,
        pistolSkill: Math.min(25, (player.pistolSkill || 0) + (isP ? 1 : 0)),
        rifleSkill: Math.min(25, (player.rifleSkill || 0) + (!isP ? 1 : 0)),
      });
    }

    const newShotsRemaining = Math.max(0, playerDuelShotsRemaining - 1);
    setPlayerDuelShotsRemaining(newShotsRemaining);
    setPlayerDuelTargetsEngaged((prev) => new Set(prev).add(targetId));

    if (newShotsRemaining > 0) {
      // Don't advance, player gets another shot!
      setDuelLogs((prev) => [
        ...prev,
        `⚡ Fast Hands! ${player.name} queues up another shot! (${newShotsRemaining} remaining)`,
      ]);
      return;
    }

    // Mark done
    setDuelParticipants((prev) =>
      prev.map((p, idx) =>
        idx === activeDuelPointer ? { ...p, actionDone: true } : p,
      ),
    );
    setPlayerDuelShotsRemaining(-1); // Reset for next turn

    // Advance
    setTimeout(() => {
      setActiveDuelPointer((prev) => prev + 1);
    }, 1200);
  };

  const handlePlayerDuelSurrender = () => {
    setDuelStage("surrendered");
    setDuelLogs((prev) => [
      ...prev,
      `🙌 COWARDICE ON THE TRAIL: ${player.name} dropped his Peacemaker and threw up both hands! Outlaws surround you for capture!`,
    ]);
  };

  const startDrawAnimation = () => {
    setDuelStage("drawing");
    setTimeout(() => {
      setDuelStage("shooting_sequence");
    }, 1200);
  };

  const handleHitTheDirt = () => {
    const p = duelParticipants.find((part) => part.id === "player");
    const fastestEnemy = duelParticipants
      .filter((part) => !part.isPlayer && !part.isDead && !part.isSurrendered)
      .sort((a, b) => b.agility - a.agility)[0];

    let logsToAdd = [
      `💨 You dive for the dirt, retreating! (Chicken skill +1)`,
    ];

    if (onUpdatePlayer) {
      onUpdatePlayer({ ...player, chicken: (player.chicken || 0) + 1 });
    }

    let pNextHp = playerHp;
    if (fastestEnemy && p && fastestEnemy.agility > p.agility) {
      logsToAdd.push(
        `⚠️ ${fastestEnemy.name} was faster and fired while you dived!`,
      );
      const hitPercent = Math.max(0.1, fastestEnemy.accuracy - 0.25);
      const hit = Math.random() <= hitPercent;

      if (hit) {
        if (player.perks.includes("lucky") && Math.random() < 0.1) {
          logsToAdd.push(`🍀 LUCKY JACK: You miraculously dodged the ambush shot!`);
        } else {
          let baseEnemyDmg = fastestEnemy.damage;
          if (player.perks.includes("thick_skin")) {
            baseEnemyDmg = Math.max(1, baseEnemyDmg - 2);
          }
          const enemyCritModifier = 0.5 + difficultyRisk * 0.5;
          const hitResult = rollBodyPartHit(
            player.name,
            baseEnemyDmg,
            true,
            enemyCritModifier,
          );

          let finalDamage = hitResult.instantDeath ? playerHp : hitResult.dmg;
          const isSlipperyPete =
            activeProvokedNpcId === "slippery_pete" ||
            fastestEnemy.name.toLowerCase().includes("pete");
          if (isSlipperyPete) {
            finalDamage = Math.min(finalDamage, Math.max(0, playerHp - 1));
          }

          pNextHp = Math.max(0, playerHp - finalDamage);
          setPlayerHp(pNextHp);

          setDuelParticipants((prev) =>
            prev.map((pa) =>
              pa.isPlayer ? { ...pa, hp: pNextHp, isDead: pNextHp <= 0 } : pa,
            ),
          );
          logsToAdd.push(
            `💥 BANG! ${fastestEnemy.name} hit you!\n${isSlipperyPete && finalDamage < (hitResult.instantDeath ? 9999 : hitResult.dmg) ? `🛡️ Bullet grazed your coat sleeve! Only took -${finalDamage} HP (left with 1 HP).` : hitResult.detail}`,
          );
        }
      } else {
        logsToAdd.push(`💨 PHOOSH! ${fastestEnemy.name}'s shot missed you!`);
      }
    }

    setDuelLogs((prev) => [...prev, ...logsToAdd]);

    // We update stage to summary so user can see what happened before proceeding to tactical (if they survived).
    setDuelStage("summary");
  };

  const handleTransitionToTactical = () => {
    // 1. Map participants back to enemies state
    setEnemies((prev) =>
      prev.map((enemy) => {
        const p = duelParticipants.find((part) => part.id === enemy.id);
        if (p) {
          return {
            ...enemy,
            hp: p.hp,
            isDead: p.isDead || p.hp <= 0,
            isSurrendered: p.isSurrendered,
          };
        }
        return enemy;
      }),
    );

    // 2. Map player HP and persist
    const p = duelParticipants.find((part) => part.id === "player");
    if (p) {
      setPlayerHp(p.hp);
      if (onUpdatePlayer) {
        onUpdatePlayer({ ...player, hp: p.hp });
      }
    }

    // 3. Clear Duel state
    setIsDuelActive(false);
    FrontierAudio.playMusic("combat");

    // 4. Log summary of transition inside main tactical game log
    addLog(
      "🛤️ Showdown standoff shootout concludes! ${player.name} and surviving hostiles assume defensive range positions on the 9x9 battle map...",
    );
  };

  useEffect(() => {
    if (!isDuelActive || duelStage !== "shooting_sequence") return;

    if (activeDuelPointer >= duelParticipants.length) {
      setDuelStage("summary");
      return;
    }

    const currentActor = duelParticipants[activeDuelPointer];

    // Skip deceased / surrendered participants
    if (
      currentActor.isDead ||
      currentActor.isSurrendered ||
      currentActor.hp <= 0
    ) {
      setActiveDuelPointer((prev) => prev + 1);
      return;
    }

    // Initialize player shots when turn begins
    if (
      currentActor.isPlayer &&
      !currentActor.actionDone &&
      playerDuelShotsRemaining === -1
    ) {
      const wpnName = player.weapon.name.toLowerCase();
      const isPistol =
        wpnName.includes("pistol") ||
        wpnName.includes("revolver") ||
        wpnName.includes("colt");
      const hasAkimbo = player.perks.includes("akimbo");
      const hasFastShooter = player.perks.includes("fast_shooter");

      const maxTargets = hasAkimbo && isPistol ? 2 : 1;
      const shotsPerTarget = hasFastShooter ? 2 : 1;
      const totalShots = maxTargets * shotsPerTarget;

      setPlayerDuelShotsRemaining(totalShots);
      setPlayerDuelTargetsEngaged(new Set());
      return; // return so state updates first
    }

    // Auto-fire for player
    if (currentActor.isPlayer) {
      if (!currentActor.actionDone) {
        const timer = setTimeout(() => {
          const livingEnemies = duelParticipants.filter(
            (p) => !p.isPlayer && !p.isDead && !p.isSurrendered,
          );

          if (livingEnemies.length > 0) {
            let validTargets = livingEnemies.filter(
              (p) => !playerDuelTargetsEngaged.has(p.id),
            );
            if (player.perks.includes("fast_shooter")) {
              validTargets = livingEnemies;
            }
            if (validTargets.length === 0) validTargets = livingEnemies;

            const targetId =
              validTargets[Math.floor(Math.random() * validTargets.length)].id;

            if (currentActor.id === "player") {
              handlePlayerDuelShootTarget(targetId);
            } else {
              handlePosseDuelShootInteractive(currentActor, targetId);
            }
          } else {
            setDuelParticipants((prev) =>
              prev.map((p, idx) =>
                idx === activeDuelPointer ? { ...p, actionDone: true } : p,
              ),
            );
            setPlayerDuelShotsRemaining(-1);
            setActiveDuelPointer((prev) => prev + 1);
          }
        }, 1200);
        return () => clearTimeout(timer);
      }
      return;
    }

    // Auto-fire for enemy
    if (!currentActor.actionDone) {
      const timer = setTimeout(() => {
        handleEnemyShootInteractive();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [
    isDuelActive,
    duelStage,
    activeDuelPointer,
    duelParticipants.length,
    playerHp,
    playerDuelShotsRemaining,
  ]);

  const handlePosseDuelShootInteractive = (
    actor: DuelParticipant,
    targetId: string,
  ) => {
    setDuelFlash(true);
    setTimeout(() => setDuelFlash(false), 150);
    FrontierAudio.playGunshot();

    const hitChance = actor.accuracy;
    const hit = Math.random() < hitChance;

    if (hit) {
      const takenDmg = actor.damage;

      setDuelParticipants((prev) => {
        const nextArr = [...prev];
        const tIdx = nextArr.findIndex((p) => p.id === targetId);
        if (tIdx > -1) {
          const currentHp = nextArr[tIdx].hp;
          const remaining = Math.max(0, currentHp - takenDmg);
          nextArr[tIdx] = {
            ...nextArr[tIdx],
            hp: remaining,
            isDead: remaining <= 0,
          };

          setDuelLogs((logs) => [
            ...logs,
            `💥 BANG! ${actor.name} fired and hit ${nextArr[tIdx].name} for -${takenDmg} HP!`,
          ]);

          if (remaining <= 0) {
            setDuelLogs((logs) => [
              ...logs,
              `☠️ ${nextArr[tIdx].name} was neutralized by ${actor.name}!`,
            ]);
          }
        }
        return nextArr;
      });
      // also update the actual enemy in tactical grid
      setEnemies((prev) =>
        prev.map((e) =>
          e.id === targetId
            ? {
                ...e,
                hp: Math.max(0, e.hp - takenDmg),
                isDead: Math.max(0, e.hp - takenDmg) <= 0,
              }
            : e,
        ),
      );
    } else {
      setDuelLogs((prev) => [
        ...prev,
        `💨 PHOOSH! ${actor.name} fired but missed!!`,
      ]);
    }

    setDuelParticipants((prev) =>
      prev.map((p, idx) =>
        p.id === actor.id ? { ...p, actionDone: true } : p,
      ),
    );
    setPlayerDuelShotsRemaining(-1);
    setActiveDuelPointer((prev) => prev + 1);
  };

  const handleEnemyShootInteractive = () => {
    const currentActor = duelParticipants[activeDuelPointer];
    if (!currentActor || currentActor.isPlayer) return;

    setDuelFlash(true);
    setTimeout(() => setDuelFlash(false), 150);
    FrontierAudio.playGunshot();

    const hitChance = currentActor.accuracy;
    const hit = Math.random() < hitChance;

    if (hit) {
      const baseEnemyDmg = currentActor.damage;
      const enemyCritModifier =
        0.5 + currentActor.accuracy * 0.5 + difficultyRisk * 1.0;
      const hitResult = rollBodyPartHit(
        player.name,
        baseEnemyDmg,
        true,
        enemyCritModifier,
      );

      let finalDamage = hitResult.instantDeath ? playerHp : hitResult.dmg;
      const isSlipperyPete =
        activeProvokedNpcId === "slippery_pete" ||
        currentActor.name.toLowerCase().includes("pete");
      if (isSlipperyPete) {
        finalDamage = Math.min(finalDamage, Math.max(0, playerHp - 1));
      }

      const nextHp = Math.max(0, playerHp - finalDamage);
      setPlayerHp(nextHp);

      setDuelParticipants((prev) =>
        prev.map((p) =>
          p.isPlayer
            ? { ...p, hp: nextHp, isSurrendered: nextHp <= 0, isDead: false }
            : p,
        ),
      );
      setDuelLogs((prev) => [
        ...prev,
        `💥 BANG! ${currentActor.name} fired and hit you!\n${isSlipperyPete && finalDamage < (hitResult.instantDeath ? 9999 : hitResult.dmg) ? `🛡️ Bullet grazed your coat sleeve! Only took -${finalDamage} HP (left with 1 HP).` : hitResult.detail}`,
      ]);

      if (nextHp <= 0) {
        setDuelLogs((prev) => [
          ...prev,
          `☠️ ${player.name} took a fatal round!`,
        ]);
      }
    } else {
      setDuelLogs((prev) => [
        ...prev,
        `💨 PHOOSH! ${currentActor.name} snapped their trigger but missed! (Grazed hat)`,
      ]);
    }

    // Mark done and instantly move to next actor
    setDuelParticipants((prev) =>
      prev.map((p, idx) =>
        idx === activeDuelPointer ? { ...p, actionDone: true } : p,
      ),
    );
    setActiveDuelPointer((prev) => prev + 1);
  };

  const addLog = (msg: string) => {
    setCombatLogs((prev) => [...prev, msg]);
  };

  // Helper inside CombatView to evaluate vision cone boundaries (90 degrees, 45 or 90 deg range)
  const isCellInVisionCone = (
    sx: number,
    sy: number,
    tx: number,
    ty: number,
    f: "up" | "down" | "left" | "right",
  ): boolean => {
    return true; // Simplification: 360-degree vision, removing tedious facing mechanics.
  };

  // Helper to check for obstacles on the path between (sx, sy) and (rx, ry)
  const hasObstacleBetween = (
    sx: number,
    sy: number,
    rx: number,
    ry: number,
  ): boolean => {
    const numSteps = Math.max(Math.abs(sx - rx), Math.abs(sy - ry));
    for (let i = 1; i < numSteps; i++) {
      const stepX = Math.round(sx + (rx - sx) * (i / numSteps));
      const stepY = Math.round(sy + (ry - sy) * (i / numSteps));
      const cell = grid.find((c) => c.x === stepX && c.y === stepY);
      if (cell && cell.type !== "empty" && cell.type !== "rail") {
        return true;
      }
    }
    return false;
  };

  // Night combat darkness calculations
  const isNight =
    forcedTimeOfDay !== undefined && forcedTimeOfDay !== null
      ? forcedTimeOfDay === "night"
      : gameTimeHour <= 5 || gameTimeHour >= 19;

  const isCellIlluminatedEnvironmentally = (cx: number, cy: number): boolean => {
    // Check environmental light sources
    for (const cell of grid) {
      if (cell.type === "camp_fire" || cell.type === "lantern" || cell.type === "fire") {
        // 3x3 radius: dx <= 1 and dy <= 1
        if (Math.abs(cx - cell.x) <= 1 && Math.abs(cy - cell.y) <= 1) {
          return true;
        }
      }
    }

    // Player muzzle flash
    if (playerSpottedDueToShooting) {
      if (Math.abs(cx - playerPos.x) <= 1 && Math.abs(cy - playerPos.y) <= 1) {
        return true;
      }
    }

    // Check enemies who fired (muzzle flash)
    for (const enemy of enemies) {
      if (enemiesSpottedDueToShooting[enemy.id]) {
        if (Math.abs(cx - enemy.x) <= 1 && Math.abs(cy - enemy.y) <= 1) {
          return true;
        }
      }
    }

    return false;
  };

  const isCellIlluminatedAtNight = (cx: number, cy: number): boolean => {
    // Always illuminate player's immediate 3x3 vicinity visually
    if (Math.abs(cx - playerPos.x) <= 1 && Math.abs(cy - playerPos.y) <= 1) {
      return true;
    }
    return isCellIlluminatedEnvironmentally(cx, cy);
  };

  // Helper to evaluate if player is spotted by a particular enemy
  const isPlayerVisuallySpottedByEnemy = (enemy: CombatActor): boolean => {
    // 1. If player has fired a shot this turn, he is spotted immediately regardless of obstacles
    if (playerSpottedDueToShooting) return true;

    const dist = Math.hypot(playerPos.x - enemy.x, playerPos.y - enemy.y);
    if (combatWeather.id === "fog" && dist > 3.5) return false;
    if (combatWeather.id === "lightning_storm" && dist > 5.5) return false;

    if (isNight) {
      if (!isCellIlluminatedEnvironmentally(playerPos.x, playerPos.y)) {
        return false;
      }
    }

    // 2. Check if there is an obstacle between ${player.name} and the enemy
    if (hasObstacleBetween(enemy.x, enemy.y, playerPos.x, playerPos.y)) {
      return false;
    }

    return true;
  };

  // Helper to evaluate if an enemy is spotted by ${player.name} (accounting for stance and obstacles)
  const isEnemySpottedByPlayer = (enemy: CombatActor): boolean => {
    // 1. If enemy has shot this turn, they are spotted immediately, breaking stealth
    if (enemiesSpottedDueToShooting[enemy.id]) return true;

    const dist = Math.hypot(playerPos.x - enemy.x, playerPos.y - enemy.y);
    if (combatWeather.id === "fog" && dist > 3.5) return false;
    if (combatWeather.id === "lightning_storm" && dist > 5.5) return false;

    if (isNight) {
      if (!isCellIlluminatedAtNight(enemy.x, enemy.y)) return false;
    }

    // 2. Check if there is an obstacle between them and ${player.name}
    if (hasObstacleBetween(playerPos.x, playerPos.y, enemy.x, enemy.y)) {
      return false;
    }

    return true;
  };

  // Emit gunshot sound to force turn of both player and enemies looking at coordinates
  const emitGunshotSound = (sourceX: number, sourceY: number) => {
    addLog(
      `🔊 GUNSHOT SOUND: A roaring shot erupted from coordinate (${sourceX}, ${sourceY})! All eyes turn facing here!`,
    );

    // Face player towards Shot origin (ONLY if the sound originated from elsewhere, preventing resetting facing when shooting)
    if (sourceX !== playerPos.x || sourceY !== playerPos.y) {
      setFacing((prev) => {
        const dx = sourceX - playerPos.x;
        const dy = sourceY - playerPos.y;
        if (Math.abs(dx) > Math.abs(dy)) {
          return dx > 0 ? "right" : "left";
        } else {
          return dy > 0 ? "down" : "up";
        }
      });
    }

    // Set player spotted because they just fired!
    if (sourceX === playerPos.x && sourceY === playerPos.y) {
      setPlayerSpottedDueToShooting(true);
    }

    // Face all alive enemies towards Shot origin
    setEnemies((prev) =>
      prev.map((enemy) => {
        if (enemy.isDead) return enemy;
        const dx = sourceX - enemy.x;
        const dy = sourceY - enemy.y;
        let nextFacing: "up" | "down" | "left" | "right" = "down";
        if (Math.abs(dx) > Math.abs(dy)) {
          nextFacing = dx > 0 ? "right" : "left";
        } else {
          nextFacing = dy > 0 ? "down" : "up";
        }
        return { ...enemy, facing: nextFacing };
      }),
    );
  };

  // Roll Body Part Hit with scaling instant death / critical hit chances based on user's suggestion
  const rollBodyPartHit = (
    receiverName: string,
    baseDmg: number,
    isPlayerTarget: boolean,
    critScalingModifier: number = 1.0,
  ): { dmg: number; detail: string; instantDeath: boolean } => {
    const r = Math.random();

    // Scale instant mortal wounds. Default is 1%, scaled up by crit scaling.
    const heartChance = 0.01 * critScalingModifier;
    const headChance = heartChance + 0.01 * critScalingModifier;
    const legChance = headChance + 0.18;
    const armChance = legChance + 0.15;

    if (r <= heartChance) {
      if (isPlayerTarget) {
        triggerPlayerHit("HEART", "CRIPPLED");
        setPlayerInjuries(
          (prev) => applyTakeDamage(prev, baseDmg, "TORSO").updatedInjuries,
        );
      }
      return {
        dmg: 9999,
        detail:
          "❤️ HEART SHOT: Bullet penetrated directly through the heart! Instant mortality check passed!",
        instantDeath: true,
      };
    }
    if (r <= headChance) {
      if (isPlayerTarget) {
        triggerPlayerHit("HEAD", "CRIPPLED");
        setPlayerInjuries(
          (prev) => applyTakeDamage(prev, baseDmg, "HEAD").updatedInjuries,
        );
      }
      return {
        dmg: 9999,
        detail:
          "🧠 HEADSHOT: Bullet pierced straight through the skull structure! Instant mortality check passed!",
        instantDeath: true,
      };
    }
    if (r <= legChance) {
      if (isPlayerTarget) {
        const hpPercent = baseDmg / player.maxHp;
        if (hpPercent > 0.4 || (hpPercent > 0.15 && Math.random() <= 0.3)) {
          setIsLegInjured(true);
          triggerPlayerHit("LEGS", "INJURED");
          setPlayerInjuries(
            (prev) => applyTakeDamage(prev, baseDmg, "LEGS").updatedInjuries,
          );
          return {
            dmg: Math.round(baseDmg * 0.8),
            detail: `🦿 LEG SHOT: Knee joint shattered! HP drops, ${player.name} suffers a permanent -2 AP mobility penalty for this standoff!`,
            instantDeath: false,
          };
        } else {
          triggerPlayerHit("LEGS", "NORMAL");
          return {
            dmg: Math.round(baseDmg * 0.8),
            detail: `🦿 GRAZED LEG: Glancing blow to the leg. No severe crippling injury.`,
            instantDeath: false,
          };
        }
      } else {
        return {
          dmg: Math.round(baseDmg * 0.8),
          detail: `🦿 LEG SHOT: Blasted ${receiverName}'s thigh! Movement speed heavily crippled!`,
          instantDeath: false,
        };
      }
    }
    if (r <= armChance) {
      if (isPlayerTarget) {
        const hpPercent = baseDmg / player.maxHp;
        if (hpPercent > 0.4 || (hpPercent > 0.15 && Math.random() <= 0.3)) {
          setIsArmInjured(true);
          triggerPlayerHit("ARM", "INJURED");
          setPlayerInjuries(
            (prev) =>
              applyTakeDamage(
                prev,
                baseDmg,
                Math.random() > 0.5 ? "LEFT_ARM" : "RIGHT_ARM",
              ).updatedInjuries,
          );
          return {
            dmg: Math.round(baseDmg * 0.8),
            detail: `🦾 ARM HIT: Trigger wrist lacerated! ${player.name} suffers -25% accuracy modifier for this standoff!`,
            instantDeath: false,
          };
        } else {
          triggerPlayerHit("ARM", "NORMAL");
          return {
            dmg: Math.round(baseDmg * 0.8),
            detail: `🦾 GRAZED ARM: Flesh wound to ${player.name}'s arm. Weapon handling remains steady.`,
            instantDeath: false,
          };
        }
      } else {
        return {
          dmg: Math.round(baseDmg * 0.8),
          detail: `🦾 ARM HIT: Bullet clipped ${receiverName}'s shoulder. Weapon targeting accuracy dropped!`,
          instantDeath: false,
        };
      }
    }

    // Torso 65% standard
    if (isPlayerTarget) {
      const hpPercent = baseDmg / player.maxHp;
      if (hpPercent > 0.4 || (hpPercent > 0.15 && Math.random() <= 0.3)) {
        triggerPlayerHit("TORSO", "INJURED");
        setPlayerInjuries(
          (prev) => applyTakeDamage(prev, baseDmg, "TORSO").updatedInjuries,
        );
        return {
          dmg: baseDmg,
          detail: `🪵 TORSO SHOT: Heavy impact tore through ${player.name}! Internal bleeding!`,
          instantDeath: false,
        };
      } else {
        triggerPlayerHit("TORSO", "NORMAL");
        return {
          dmg: baseDmg,
          detail: `🪵 CHEST HIT: Shallow bullet impact to ${player.name}'s torso. Lost HP but no major trauma.`,
          instantDeath: false,
        };
      }
    }
    return {
      dmg: baseDmg,
      detail: `🪵 TORSO SHOT: Bullet connected with ${receiverName}'s chest plate.`,
      instantDeath: false,
    };
  };

  const hasEndedRef = React.useRef(false);

  const onDefeatRef = React.useRef(onDefeat);
  const onVictoryRef = React.useRef(onVictory);

  // Sync callbacks to mutable refs so they always stay up-to-date without resetting timers
  useEffect(() => {
    onDefeatRef.current = onDefeat;
  }, [onDefeat]);

  useEffect(() => {
    onVictoryRef.current = onVictory;
  }, [onVictory]);

  // Check victory / defeat triggers
  useEffect(() => {
    if (hasEndedRef.current) return;

    let timer: any;
    if (!isDuelActive && playerHp <= 0) {
      addLog("☠️ Fatal round. You fell on dusty soil... The trail ends.");
      hasEndedRef.current = true;
      timer = setTimeout(() => onDefeatRef.current(), 1500);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [playerHp, isDuelActive]);

  // Calculate hit probability from shooter (X1, Y1) to receiver (X2, Y2)
  const calculateHitChance = (
    sx: number,
    sy: number,
    rx: number,
    ry: number,
    baseAccuracy: number,
    weaponRange: number,
  ): {
    value: number;
    coverType: "none" | "low" | "high";
    coverCell?: { x: number; y: number };
  } => {
    const dist = Math.hypot(sx - rx, sy - ry);

    // Procedural Weather & Time effects
    let weatherAccuracyMod = 0;
    let weatherRangeMod = 0;

    if (combatWeather.id === "fog") {
      weatherRangeMod = -1.5;
      weatherAccuracyMod = -0.15;
    } else if (combatWeather.id === "blinding_sun") {
      weatherAccuracyMod = -0.1;
    } else if (combatWeather.id === "desert_mirage") {
      if (dist > 4) {
        weatherAccuracyMod = -0.2;
        weatherRangeMod = -1.0;
      }
    }

    if (isNight) {
      // Small penalty for hitting targets in the dark even if spotted,
      // unless they are near a light source
      if (!isCellIlluminatedAtNight(rx, ry)) {
        weatherAccuracyMod -= 0.1;
        weatherRangeMod -= 1.0;
      }
    }

    // Range penalty
    let accuracy = baseAccuracy + accuracyBonus / 100 + weatherAccuracyMod;

    const finalRange =
      weaponRange + rangeBonus + (hasScope ? 3 : 0) + weatherRangeMod;

    if (dist > finalRange) {
      return { value: 0, coverType: "none" };
    }

    // STANCE & INJURY MODIFIERS:
    const isSenderPlayer = sx === playerPos.x && sy === playerPos.y;
    const isReceiverPlayer = rx === playerPos.x && ry === playerPos.y;

    if (isSenderPlayer) {
      const isPistol =
        player.weapon.name.toLowerCase().includes("pistol") ||
        player.weapon.name.toLowerCase().includes("revolver") ||
        player.weapon.name.toLowerCase().includes("colt");
      const wpnSkill = isPistol
        ? player.pistolSkill || 0
        : player.rifleSkill || 0;
      accuracy += Math.min(0.3, wpnSkill * 0.02);

      if (stance === "crouching") accuracy += 0.15;
      if (stance === "lying") accuracy += 0.3;

      let armPenalty = 0;
      if (player.injuries) {
        const getArmPen = (p: { status: string; integrity: number }) => {
          if (p.status === "AMPUTATED") return 0.5;
          if (p.status === "PROSTHETIC") return 0.25;
          if (p.status === "CRIPPLED") return 0.4;
          if (p.status === "INJURED") return 0.25;
          return 0;
        };
        armPenalty = Math.max(
          getArmPen(player.injuries.parts.LEFT_ARM),
          getArmPen(player.injuries.parts.RIGHT_ARM),
        );
      }
      accuracy -= armPenalty;
      if (isArmInjured && armPenalty === 0) accuracy -= 0.25; // fallback
    }

    if (isReceiverPlayer) {
      if (stance === "crouching") accuracy -= 0.25;
      if (stance === "lying") accuracy -= 0.5;
    }

    // Check intermediate covers
    let coverFound: "none" | "low" | "high" = "none";
    let coverCell: { x: number; y: number } | undefined = undefined;
    const numSteps = Math.max(Math.abs(sx - rx), Math.abs(sy - ry));

    for (let i = 1; i < numSteps; i++) {
      const stepX = Math.round(sx + (rx - sx) * (i / numSteps));
      const stepY = Math.round(sy + (ry - sy) * (i / numSteps));

      const coveringCell = grid.find((c) => c.x === stepX && c.y === stepY);
      if (
        coveringCell &&
        coveringCell.type !== "empty" &&
        coveringCell.type !== "rail"
      ) {
        const isHigh = [
          "high_cover",
          "tree",
          "tombstone",
          "boulder",
          "wooden_wall",
          "brick_wall",
          "tipi",
        ].includes(coveringCell.type);
        if (isHigh) {
          coverFound = "high";
          coverCell = { x: stepX, y: stepY };
          break;
        } else {
          coverFound = "low";
          coverCell = { x: stepX, y: stepY };
        }
      }
    }

    if (coverFound === "high") {
      accuracy -= 0.45;
    } else if (coverFound === "low") {
      accuracy -= 0.22;
    }

    // Dynamic target-based modifiers:
    const targetEnemy = enemies.find(
      (e) => e.x === rx && e.y === ry && !e.isDead,
    );
    if (targetEnemy && targetEnemy.trait === "slippery") {
      accuracy -= 0.15;
    }

    const finalVal = Math.max(0.1, Math.min(0.95, accuracy));
    return { value: finalVal, coverType: coverFound, coverCell };
  };

  // Proc lightning strike under Lightning Storm atmospheric weather
  const procLightningStrike = () => {
    if (combatWeather.id !== "lightning_storm") return;
    if (Math.random() > 0.35) return; // 35% chance per turn pass

    const lX = Math.floor(Math.random() * GRID_SIZE);
    const lY = Math.floor(Math.random() * GRID_SIZE);

    addLog(
      `⚡ LIGHTNING FLASH: A furious bolt of mountain lightning struck cell (${lX}, ${lY}) with a thunderous roar!`,
    );

    // Check if player is on this cell
    if (playerPos.x === lX && playerPos.y === lY) {
      setPlayerHp((prev) => Math.max(0, prev - 15));
      addLog(
        `⚡ DIRECT STRIKE! ${player.name} is singed by the wild electricity, taking -15 HP damage!`,
      );
    }

    // Check if any enemy is on this cell
    setEnemies((prev) =>
      prev.map((e) => {
        if (
          e.x === lX &&
          e.y === lY &&
          !e.isDead &&
          !e.isSurrendered &&
          !e.isUnconscious
        ) {
          addLog(
            `⚡ DIRECT STRIKE! ${e.name} is blasted by the fork of lightning, taking -15 HP damage!`,
          );
          const nextHp = Math.max(0, e.hp - 15);
          return { ...e, hp: nextHp, isDead: nextHp <= 0 };
        }
        return e;
      }),
    );

    // If there is cover on this cell, shatter it!
    const targetCell = grid.find((c) => c.x === lX && c.y === lY);
    if (
      targetCell &&
      targetCell.type !== "empty" &&
      targetCell.type !== "rail" &&
      targetCell.type !== "rubble"
    ) {
      addLog(
        `💥 OBLITERATED: The ${targetCell.type.replace("_", " ")} on cell (${lX}, ${lY}) was shattered to ashes by lightning!`,
      );
      if (targetCell.type === "tnt_barrel") {
        setTimeout(
          () => handleShootEnvironment(lX, lY, "tnt_barrel", true, false),
          500,
        );
      } else if (
        targetCell.type === "tree" ||
        targetCell.type === "wooden_wall" ||
        targetCell.type === "cactus"
      ) {
        setGrid((prev) =>
          prev.map((c) =>
            c.x === lX && c.y === lY
              ? { ...c, type: "fire", isOnFire: true, hp: 0, turnsOnFire: 4 }
              : c,
          ),
        );
      } else {
        const expId = Math.random().toString();
        setExplosions((prevExp) => [...prevExp, { x: lX, y: lY, id: expId }]);
        setTimeout(
          () =>
            setExplosions((prevExp) => prevExp.filter((e) => e.id !== expId)),
          400,
        );
        setGrid((prev) =>
          prev.map((c) =>
            c.x === lX && c.y === lY ? { ...c, type: "rubble", hp: 0 } : c,
          ),
        );
      }
    }
  };

  useEffect(() => {
    procLightningStrike();
  }, [turn]);

  // Action: Move consuming AP. Stance sound emission chance applies!
  const handleMove = (tx: number, ty: number) => {
    if (turn !== "player" || isAimingCannon) return;

    const cellObstacle = grid.find((c) => c.x === tx && c.y === ty);
    const hasEnemy = enemies.some(
      (e) =>
        e.x === tx &&
        e.y === ty &&
        !e.isDead &&
        !e.isSurrendered &&
        !e.isUnconscious,
    );

    // Check if player has enough AP left
    let stepCost = isHeavy ? 2 : 1;
    let isOnRail = false;
    if (cellObstacle && (cellObstacle.type as string) === "rail") {
      stepCost += 1;
      isOnRail = true;
    }

    if (apRef.current < stepCost) {
      addLog(
        `⚠️ Insufficient Action Points! ${player.name} only has ${ap} AP available. Moving here requires ${stepCost} AP!`,
      );
      return;
    }

    // Must be adjacent
    let dx = Math.abs(playerPos.x - tx);
    let dy = Math.abs(playerPos.y - ty);
    if (dx > 1 || dy > 1) {
      addLog("⚠️ Pace is restricted to adjacent 1-step boundaries!");
      return;
    }

    const cellObstacleCheck = grid.find(
      (c) => c.x === tx && c.y === ty && c.type !== "empty",
    );
    if (
      cellObstacleCheck &&
      cellObstacleCheck.type !== "cactus" &&
      (cellObstacleCheck.type as string) !== "rail"
    ) {
      addLog("⚠️ Solid rock blocks your trail.");
      return;
    }
    if (hasEnemy) {
      addLog("⚠️ Cell is occupied by active enemy presence!");
      return;
    }

    // Move player and deduct AP
    setPlayerPos({ x: tx, y: ty });
    setAp((prev) => Math.max(0, prev - stepCost));

    let moveMsg = `🤠 Paced to cell (${tx}, ${ty}). spent ${stepCost} AP.`;
    if (isOnRail) {
      moveMsg += ` 🛤️ Crossed heavy rail iron plates (+1 AP cost).`;
    }

    if (cellObstacle?.type === "cactus") {
      setPlayerHp((h) => Math.max(1, h - 6));
      moveMsg += " Ouch! Poised on desert cactus needles! Lost -6 HP Vitality.";
    }
    addLog(moveMsg);

    // Check if player moved behind cover relative to any enemy
    let gainedCover = false;
    enemies.forEach((e) => {
      if (!e.isDead && !e.isSurrendered && !e.isUnconscious) {
        if (hasObstacleBetween(tx, ty, e.x, e.y)) {
          gainedCover = true;
        }
      }
    });

    const currentSilence = player.silenceSkill || 0;
    if (gainedCover && onUpdatePlayer) {
      onUpdatePlayer({
        ...player,
        silenceSkill: Math.min(200, currentSilence + 0.5),
      });
    }

    // Stance Sound Emission check
    // Walking: 60% chance; Crouching: 20%; Lying: 5%
    let soundChance =
      stance === "standing" ? 0.6 : stance === "crouching" ? 0.2 : 0.05;

    // Silence Skill reduces sound generation chance (up to 50% reduction at max skill 200)
    const soundModifier = 1 - currentSilence / 400;
    soundChance *= soundModifier;

    if (Math.random() <= soundChance) {
      addLog(
        `🔊 CREAK! SILAS GENERATED SOUND AT ROAD CELL (${tx}, ${ty})! Nearby bandits heard your approach and spun towards you!`,
      );

      // Rotate all active enemies to face towards the player positions
      setEnemies((prev) =>
        prev.map((enemy) => {
          if (enemy.isDead) return enemy;
          const diffX = tx - enemy.x;
          const diffY = ty - enemy.y;
          let nextFacing: "up" | "down" | "left" | "right" = "down";
          if (Math.abs(diffX) > Math.abs(diffY)) {
            nextFacing = diffX > 0 ? "right" : "left";
          } else {
            nextFacing = diffY > 0 ? "down" : "up";
          }
          return { ...enemy, facing: nextFacing };
        }),
      );
    }
  };

  // Check if player is adjacent to Cannon piece at (4, 4)
  const canUseCannon =
    hasCannonMap &&
    Math.abs(playerPos.x - 4) <= 1 &&
    Math.abs(playerPos.y - 4) <= 1;

  // Trigger Cannon Aim Mode
  const handleActivateCannon = () => {
    if (turn !== "player" || ap < 2) {
      addLog("⚠️ Firing the Heavy Cannon requires 2 AP!");
      return;
    }
    setIsAimingCannon(true);
    addLog(
      "🎯 CANNON ACTIVE: Select ANY cell on the board to launch a mortar explosive shell!",
    );
  };

  // Fire Cannon Shell at Target (Splash damage 3x3)
  const handleFireCannonShell = (tx: number, ty: number) => {
    // Deduct AP, exit Cannon mode
    setIsAimingCannon(false);
    setAp((prev) => prev - 2);
    setPlayerSpottedDueToShooting(true);

    addLog(
      `💣 BOOM! ${player.name} fires the Field Cannon onto coordinate (${tx}, ${ty})!`,
    );

    // Splash calculations over a 3x3 box
    const hitEnemies: string[] = [];
    const destroyedCovers: string[] = [];

    // Apply 60 damage to all enemies in 3x3 box
    setEnemies((prev) =>
      prev.map((enemy) => {
        const insideBox =
          Math.abs(enemy.x - tx) <= 1 && Math.abs(enemy.y - ty) <= 1;
        if (insideBox && !enemy.isDead) {
          const remainingHp = Math.max(0, enemy.hp - 60);
          hitEnemies.push(`${enemy.name} (-60 HP)`);
          return {
            ...enemy,
            hp: remainingHp,
            isSurrendered: remainingHp <= 0,
            isDead: false,
          };
        }
        return enemy;
      }),
    );

    // Convert all covers in 3x3 box to empty
    setGrid((prevGrid) =>
      prevGrid.map((cell) => {
        const insideBox =
          Math.abs(cell.x - tx) <= 1 && Math.abs(cell.y - ty) <= 1;
        // Don't dismantle the cannon itself (rail cell at 4,4)
        const isTheCannon = hasCannonMap && cell.x === 4 && cell.y === 4;
        if (insideBox && !isTheCannon && cell.type !== "empty") {
          destroyedCovers.push(
            `${cell.type === "cactus" ? "🌵 Cactus" : cell.type === "tree" ? "🌲 Tree" : cell.type === "wagon" ? "🛒 Wagon" : cell.type === "boulder" ? "⛰️ Boulder" : cell.type === "water_trough" ? "🛁 Water Trough" : cell.type === "tombstone" ? "🪦 Tombstone" : cell.type === "crates" ? "🧰 Crates" : cell.type === "fence" ? "🚧 Fence" : cell.type === "mining_cart" ? "⛏️ Mining Cart" : cell.type === "wooden_wall" ? "🪵 Wooden Wall" : cell.type === "brick_wall" ? "🧱 Brick Wall" : cell.type === "well" ? "🚰 Well" : cell.type === "table" ? "🪑 Table" : cell.type === "bar" ? "🍶 Bar" : cell.type === "tent" ? "🎪 Tent" : cell.type === "tipi" ? "⛺ Tipi" : "📦 Obstacle"}`,
          );
          return { ...cell, type: "empty" };
        }
        return cell;
      }),
    );

    // Logs
    if (hitEnemies.length > 0) {
      addLog(`💥 Explosive Blast slammed: ${hitEnemies.join(", ")}!`);
    } else {
      addLog("💨 Mortar hit barren dust, kicking up a huge shockwave!");
    }

    if (destroyedCovers.length > 0) {
      addLog(`🔥 Dust up: ${destroyedCovers.join(", ")} collapsed into ash!`);
    }
  };

  const [floatingText, setFloatingText] = useState<{
    id: string;
    text: string;
    type: "heal" | "buff" | "dmg" | "item";
  } | null>(null);

  const showFloatingText = (
    text: string,
    type: "heal" | "buff" | "dmg" | "item",
  ) => {
    setFloatingText({ id: Math.random().toString(), text, type });
    setTimeout(() => {
      setFloatingText((prev) => (prev && prev.text === text ? null : prev));
    }, 2000);
  };

  const consumeItemInCombat = (itemId: string) => {
    if (!onUpdatePlayer) return;
    const target = player.inventory.find((i) => i.id === itemId);
    if (!target || target.count <= 0) return;
    const nextInv = player.inventory
      .map((i) => {
        if (i.id === itemId) return { ...i, count: i.count - 1 };
        return i;
      })
      .filter((i) => i.count > 0);
    onUpdatePlayer({
      ...player,
      inventory: nextInv,
    });
  };

  const handleThrowDynamite = (tx: number, ty: number) => {
    let armEfficiency = 1;
    if (player.injuries) {
      const right = player.injuries.parts.RIGHT_ARM;
      const left = player.injuries.parts.LEFT_ARM;
      const getEff = (p: { status: string; integrity: number }) => {
        if (p.status === "AMPUTATED") return 0;
        if (p.status === "PROSTHETIC") return 0.5;
        if (p.status === "CRIPPLED") return 0.2;
        if (p.status === "INJURED") return 0.5;
        return 1.0;
      };
      armEfficiency = Math.max(getEff(right), getEff(left)); // Best arm throws
    }
    const maxRange = Math.max(1, Math.round(4 * armEfficiency));

    const dist = Math.hypot(playerPos.x - tx, playerPos.y - ty);
    if (dist > maxRange + 0.5) {
      addLog(
        `⚠️ Target too far! Maximum throwing range is ${maxRange} cells due to arm health.`,
      );
      setIsAimingDynamite(false);
      return;
    }

    const ownedDynamite = player.inventory.find((i) => i.id === "dynamite");
    const playerHasInvDynamite = ownedDynamite && ownedDynamite.count > 0;

    if (emergencyDynamite <= 0 && !playerHasInvDynamite) {
      addLog("⚠️ No dynamite cartridges remaining in saddlebags!");
      setIsAimingDynamite(false);
      return;
    }

    // Deduct AP, exit Dynamite mode
    setIsAimingDynamite(false);
    setAp((prev) => prev - 3);
    setPlayerSpottedDueToShooting(true);

    // Consume item
    if (emergencyDynamite > 0) {
      setEmergencyDynamite((prev) => prev - 1);
    } else if (playerHasInvDynamite) {
      consumeItemInCombat("dynamite");
    }

    addLog(
      `🧨 DYNAMITE THROWN! ${player.name} hurls a fizzing stick of black powder onto Cell (${tx}, ${ty})!`,
    );

    const newExpArr: { x: number; y: number; id: string }[] = [];
    for (let ix = -1; ix <= 1; ix++) {
      for (let iy = -1; iy <= 1; iy++) {
        newExpArr.push({
          x: tx + ix,
          y: ty + iy,
          id: Math.random().toString(),
        });
      }
    }
    setExplosions((prev) => [...prev, ...newExpArr]);
    setTimeout(() => {
      setExplosions((prev) =>
        prev.filter((p) => !newExpArr.find((n) => n.id === p.id)),
      );
    }, 400);

    // Splash calculations over a 3x3 box
    const hitEnemies: string[] = [];
    const destroyedCovers: string[] = [];
    let provokedRockslide = false;

    // Check for rockslides
    grid.forEach((cell) => {
      const insideBox =
        Math.abs(cell.x - tx) <= 1 && Math.abs(cell.y - ty) <= 1;
      if (
        insideBox &&
        cell.type === "boulder" &&
        combatType === "ambush" &&
        Math.random() < 0.7
      ) {
        provokedRockslide = true;
      }
    });

    if (provokedRockslide) {
      addLog(
        `⛰️ AVALANCHE! The explosion reverberates through the canyon walls, triggering a massive ROCKSLIDE!`,
      );
    }

    // Apply 45-65 damage to all enemies in 3x3 box (even more if rockslide)
    setEnemies((prev) =>
      prev.map((enemy) => {
        const insideBox =
          Math.abs(enemy.x - tx) <= (provokedRockslide ? 2 : 1) &&
          Math.abs(enemy.y - ty) <= (provokedRockslide ? 2 : 1);
        if (insideBox && !enemy.isDead) {
          let dmg = Math.round(35 + Math.random() * 20) + (player.perks.includes("dynamite_expert") ? 25 : 0);
          if (provokedRockslide) dmg += Math.round(20 + Math.random() * 30);

          const remainingHp = Math.max(0, enemy.hp - dmg);
          hitEnemies.push(`${enemy.name} (-${dmg} HP)`);

          let surrenderFlag = enemy.isSurrendered;
          if (
            enemy.type !== "scorpion" &&
            remainingHp > 0 &&
            remainingHp <= enemy.maxHp * (player.perks.includes("intimidation") ? 0.5 : 0.3)
          ) {
            surrenderFlag = true;
            addLog(
              `🙌 SHATTERED SPIRIT: ${enemy.name} emerged coughing from the smoke and dropped their weapons! "Hands up! I quit! Don't shoot!"`,
            );
          }

          return {
            ...enemy,
            hp: remainingHp,
            isDead: remainingHp <= 0,
            isSurrendered: surrenderFlag,
          };
        }
        return enemy;
      }),
    );

    // Convert low covers or cacti in 3x3 box to empty
    // Also damage the player!
    if (
      Math.abs(playerPos.x - tx) <= (provokedRockslide ? 2 : 1) &&
      Math.abs(playerPos.y - ty) <= (provokedRockslide ? 2 : 1)
    ) {
      let dmg = Math.round(35 + Math.random() * 20);
      if (provokedRockslide) dmg += Math.round(20 + Math.random() * 30);
      setPlayerHp((prev) => Math.max(0, prev - dmg));
      addLog(
        `💥 CAUGHT IN BLAST! ${player.name} takes ${dmg} explosion damage!`,
      );
    }

    setGrid((prevGrid) =>
      prevGrid.map((cell) => {
        const insideBox =
          Math.abs(cell.x - tx) <= (provokedRockslide ? 2 : 1) &&
          Math.abs(cell.y - ty) <= (provokedRockslide ? 2 : 1);
        const isTheCannon = hasCannonMap && cell.x === 4 && cell.y === 4;
        if (insideBox && !isTheCannon && cell.type !== "empty") {
          const deservesBreak =
            cell.type === "low_cover" ||
            cell.type === "cactus" ||
            (cell.type === "high_cover" && Math.random() < 0.5) ||
            cell.type === "boulder" ||
            provokedRockslide;
          if (deservesBreak) {
            destroyedCovers.push(
              `${cell.type === "cactus" ? "🌵 Cactus" : cell.type === "tree" ? "🌲 Tree" : cell.type === "wagon" ? "🛒 Wagon" : cell.type === "boulder" ? "⛰️ Boulder" : cell.type === "water_trough" ? "🛁 Water Trough" : cell.type === "tombstone" ? "🪦 Tombstone" : cell.type === "crates" ? "🧰 Crates" : cell.type === "fence" ? "🚧 Fence" : cell.type === "mining_cart" ? "⛏️ Mining Cart" : cell.type === "wooden_wall" ? "🪵 Wooden Wall" : cell.type === "brick_wall" ? "🧱 Brick Wall" : cell.type === "well" ? "🚰 Well" : cell.type === "table" ? "🪑 Table" : cell.type === "bar" ? "🍶 Bar" : cell.type === "tent" ? "🎪 Tent" : cell.type === "tipi" ? "⛺ Tipi" : "📦 Obstacle"}`,
            );
            return { ...cell, type: "rubble", hp: 0 };
          }
        }
        return cell;
      }),
    );

    // Logs
    if (hitEnemies.length > 0) {
      addLog(
        `💥 BLASTOUT! Dynamite detonation slammed: ${hitEnemies.join(", ")}!`,
      );
    } else {
      addLog(
        "💨 The dynamite stick exploded harmlessly in the sand, kicking up dirt.",
      );
    }

    if (destroyedCovers.length > 0) {
      addLog(
        `🔥 Cover status: ${destroyedCovers.join(", ")} blasted to smithereens!`,
      );
    }
  };

  const handleDemandSurrender = () => {
    if (turn !== "player" || apRef.current <= 0) return;

    // Find if there is an active adjacent outlaw
    const adjacentActiveEnemies = enemies.filter((enemy) => {
      if (enemy.isDead || enemy.isSurrendered || enemy.isUnconscious)
        return false;
      const dist = Math.hypot(playerPos.x - enemy.x, playerPos.y - enemy.y);
      return dist <= 1.5; // Adjacent checks (includes diagonals)
    });

    if (adjacentActiveEnemies.length === 0) {
      addLog(
        "⚠️ Range too far! ${player.name} must stand adjacent (1 cell range) to a threatening outlaw to demand his surrender.",
      );
      return;
    }

    // Spend 3 AP
    setAp((prev) => prev - 3);

    // Pick the first adjacent enemy
    const targetEnemy = adjacentActiveEnemies[0];

    if (targetEnemy.type === "scorpion") {
      addLog(
        `🦂 "SHOOT!" ${player.name} yells at the Mojave scorpion, but the arachnid lacks logical reasoning and snaps its pincers in anger! Fail.`,
      );
      return;
    }

    // Assess surrender chance
    let baseChance = 0.35; // Default healthy outlaw holds out
    let reason = "intimidation factor";

    const isBoss = targetEnemy.type === "outlaw_leader";
    if (isBoss) {
      baseChance = 0.1; // Outlaw Leaders have very high resolve
      reason = "elite outlaw pride";
    }

    // Health modifier
    const hpPct = targetEnemy.hp / targetEnemy.maxHp;
    if (hpPct <= 0.35) {
      baseChance += 0.55;
      reason = "severe arterial bleeding";
    } else if (hpPct <= 0.6) {
      baseChance += 0.3;
      reason = "bleeding gunshot wounds";
    }

    // Limb modifiers
    if (targetEnemy.isDisarmed || targetEnemy.injuredArm) {
      baseChance += 0.2;
      reason += " and disarmed weapon hand";
    }
    if (targetEnemy.injuredLeg) {
      baseChance += 0.15;
      reason += " and shattered knee joint";
    }

    const roll = Math.random();
    const isSuccess = roll < baseChance;

    addLog(
      `📢 OUTLAW STANDOFF: ${player.name} levels his revolver cold at ${targetEnemy.name}'s collarbone: "BLOW YOUR HORN, OUTLAW! DROP THE IRON!"`,
    );

    if (isSuccess) {
      setEnemies((prev) =>
        prev.map((e) =>
          e.id === targetEnemy.id ? { ...e, isSurrendered: true } : e,
        ),
      );
      addLog(
        `🙌 SUCCESS (${Math.round(baseChance * 100)}% chance due to ${reason}): ${targetEnemy.name} pales, tosses the weapon aside and raises hands! "Ok, drifter! Don't clear my clock, I slow-crawl! I give up!"`,
      );
    } else {
      addLog(
        `😡 FIERCE STANDOFF (${Math.round(baseChance * 100)}% chance): ${targetEnemy.name} spits: "You'll take my heart in a pine box, drifter! Burn steel!"`,
      );
    }
  };

  const handleCombatDrinkWhiskey = () => {
    const owned = player.inventory.find((i) => i.id === "whiskey");
    if (!owned || owned.count <= 0) {
      addLog("⚠️ No whiskey bottles within saddlebags!");
      return;
    }

    if (apRef.current < 1) {
      addLog(`⚠️ Swigging liquid takes time! Need 1 AP.`);
      return;
    }

    setAp((prev) => prev - 1);

    // Restores health and Deadeye Gauge
    const healAmount = player.perks.includes("iron_gut") ? 50 : 25;
    setPlayerHp((prev) => Math.min(player.maxHp, prev + healAmount));
    setPlayerInjuries((prev) => ({
      ...prev,
      shockLevel: Math.max(0, prev.shockLevel - 40),
    }));

    let cureText = "";
    if (playerPoisonTurns > 0) {
      setPlayerPoisonTurns(0);
      cureText = " Purified venom from your veins!";
    }

    // Decrement from inventory
    consumeItemInCombat("whiskey");

    addLog(
      `🥃 FIERY GULP! ${player.name} takes a deep swig of Kentucky Bourbon saloon whiskey! Healed +${healAmount} HP!${cureText}`,
    );
    showFloatingText(`+${healAmount} HP & Buff`, "heal");
  };

  const handleCombatUseMedicalElixir = () => {
    const owned = player.inventory.find((i) => i.id === "elixir");
    if (!owned || owned.count <= 0) {
      addLog("⚠️ No medical elixirs within saddlebags!");
      return;
    }

    const apCost = player.perks.includes("field_medic") ? 0 : 1;
    if (apRef.current < apCost) {
      addLog(`⚠️ Drinking tonic requires ${apCost} AP.`);
      return;
    }

    setAp((prev) => prev - apCost);

    // Heals HP
    setPlayerHp((prev) => Math.min(player.maxHp, prev + 45));
    setPlayerInjuries((prev) => ({
      ...prev,
      bloodVolume: Math.min(100, prev.bloodVolume + 45),
    }));

    let cureText = "";
    if (playerPoisonTurns > 0) {
      setPlayerPoisonTurns(0);
      cureText += " Purified all Venom toxin!";
    }

    // Decrement from inventory
    consumeItemInCombat("elixir");

    addLog(
      `🧪 TACTICAL ELIXIR: ${player.name} downs a thick apothecary medicine! Healed +45 HP!${cureText}`,
    );
    showFloatingText("+45 HP", "heal");
  };

  const handleCombatFirstAidTourniquet = () => {
    const numTourniquets = player.inventory.filter(
      (i) => i.id === "tourniquet",
    ).length;
    if (numTourniquets <= 0) {
      addLog("⚠️ You have no Field Tourniquets in your saddlebags!");
      return;
    }

    const apCost = player.perks.includes("field_medic") ? 2 : 3;
    if (apRef.current < apCost) {
      addLog(`⚠️ Binding deep bullet gashes requires ${apCost} AP.`);
      return;
    }

    setAp((prev) => prev - apCost);

    let bleedText = "";
    if (playerBleedTurns > 0) {
      setPlayerBleedTurns(0);
      bleedText = " 🩹 Clotted severe hemorrhagic bleeding!";
    }

    let curedLimb = "";
    if (isArmInjured && isLegInjured) {
      setIsArmInjured(false);
      setIsLegInjured(false);
      setPlayerInjuries((prev) => {
        let n = useMedicalItem(prev, "TOURNIQUET", "LEFT_ARM");
        n = useMedicalItem(n, "TOURNIQUET", "RIGHT_ARM");
        n = useMedicalItem(n, "TOURNIQUET", "LEGS");
        return n;
      });
      curedLimb = "Arm and Leg";
    } else if (isArmInjured) {
      setIsArmInjured(false);
      setPlayerInjuries((prev) => {
        let n = useMedicalItem(prev, "TOURNIQUET", "LEFT_ARM");
        n = useMedicalItem(n, "TOURNIQUET", "RIGHT_ARM");
        return n;
      });
      curedLimb =
        "Arm (Steady alignment fully restored!) Accuracy penalty removed.";
    } else if (isLegInjured) {
      setIsLegInjured(false);
      setPlayerInjuries((prev) => useMedicalItem(prev, "TOURNIQUET", "LEGS"));
      curedLimb =
        "Leg (Mobilization fully restored!) Run speed penalty removed.";
      setAp((prev) => prev + 2);
    } else {
      curedLimb = "General bullet grazing clotted";
      // Still apply to blood flow in a random part
      setPlayerInjuries((prev) => useMedicalItem(prev, "TOURNIQUET", "TORSO"));
    }

    consumeItemInCombat("tourniquet");
    setPlayerHp((prev) => Math.min(player.maxHp, prev + 20));
    setPlayerInjuries((prev) => ({
      ...prev,
      bloodVolume: Math.min(100, prev.bloodVolume + 20),
    }));
    addLog(
      `🩹 EMERGENCY TOURNIQUET: ${player.name} clamps a heavy clean linen fold over bleeding wounds! Stitched nerves and extracted bullet shrapnel. Restored mobility: ${curedLimb}! +20 HP.`,
    );
    showFloatingText("+20 HP & Bandaged", "heal");
  };

  const handleExecutePosseTacticalOrder = (memberId: string) => {
    if (turn !== "player" || ap < 1 || isAimingCannon) {
      addLog(
        "⚠️ ORDER BLOCK: Issuing militia commands requires ${player.name}'s active turn, 1 AP, and no active artillery aiming!",
      );
      return;
    }

    if (posseCombatActionsDone[memberId]) {
      addLog(
        "⚠️ GUN DOWN: That posse comrade has already acted this turn! Keep them covered until the next round.",
      );
      return;
    }

    const livingEnemies = enemies.filter((e) => !e.isDead && !e.isSurrendered);
    if (livingEnemies.length === 0) {
      addLog("⚠️ NO TARGETS: All enemies are down. Lay down your arms!");
      return;
    }

    const targetEnemy =
      enemies.find(
        (e) => e.id === selectedEnemyId && !e.isDead && !e.isSurrendered,
      ) || livingEnemies[0];

    // Deduct AP and mark acted
    setAp((prev) => Math.max(0, prev - 1));
    setPosseCombatActionsDone((prev) => ({ ...prev, [memberId]: true }));

    switch (memberId) {
      case "recruit_holliday": {
        setPlayerHp((prev) => Math.min(player.maxHp, prev + 25));
        setIsArmInjured(false);
        setIsLegInjured(false);
        FrontierAudio.playClick();
        addLog(
          `🩺 DOC HOLLIDAY: "Hold still, son. This booze'll sting but the threat's over." Red Doc Holliday performs lightning field surgery! Restores +25 HP and mends all broken limbs.`,
        );
        break;
      }
      case "recruit_swift": {
        setEnemies((prev) =>
          prev.map((e) => {
            if (e.id === targetEnemy.id) {
              const nextHp = Math.max(0, e.hp - 25);
              const isDeadNow = nextHp <= 0;
              addLog(
                `🔫 JACK SWIFT: *BANG-BANG-BANG!* Jack Swift fans his Colt at ${e.name}, dealing 25 damage!`,
              );
              return {
                ...e,
                hp: nextHp,
                isSurrendered: isDeadNow,
                isDead: false,
              };
            }
            return e;
          }),
        );
        break;
      }
      case "recruit_scout": {
        const markedKeys: Record<string, boolean> = {};
        enemies.forEach((e) => {
          markedKeys[e.id] = true;
        });
        setEnemiesSpottedDueToShooting((prev) => ({ ...prev, ...markedKeys }));
        addLog(
          `🦅 APACHE SCOUT: Scouting high rock ridges, the scout uncovers and marks all outlaw locations!`,
        );
        break;
      }
      case "recruit_buster": {
        setPlayerHp((prev) => Math.min(player.maxHp, prev + 30));
        addLog(
          `🛡️ BUSTER CLEAVER: Buster stands in front of ${player.name}, absorbing incoming fire behind boiler plates! ${player.name} is shielded with 30 HP of cover buffers.`,
        );
        break;
      }
      case "recruit_hunter": {
        setEnemies((prev) =>
          prev.map((e) => {
            if (e.id === targetEnemy.id) {
              const nextHp = Math.max(0, e.hp - 35);
              const isDeadNow = nextHp <= 0;
              addLog(
                `🤠 BOUNTY MARSHAL: Jesse chambers a premium custom copper round in his Winchester, sniping ${e.name} for 35 damage!${isDeadNow ? " ☠️ TRAGIC CRITICAL KILL!" : ""}`,
              );
              return { ...e, hp: nextHp, isDead: isDeadNow };
            }
            return e;
          }),
        );
        break;
      }
      default: {
        const member = player.posse?.find((p) => p.id === memberId);
        if (member) {
          if (member.role === "Gunslinger" || member.role === "Bounty Hunter") {
            setEnemies((prev) =>
              prev.map((e) => {
                if (e.id === targetEnemy.id) {
                  const nextHp = Math.max(0, e.hp - member.dmg);
                  const isDeadNow = nextHp <= 0;
                  addLog(
                    `🔫 ${member.name}: *BANG!* fires at ${e.name}, dealing ${member.dmg} damage!${isDeadNow ? " ☠️ ELIMINATION!" : ""}`,
                  );
                  return { ...e, hp: nextHp, isDead: isDeadNow };
                }
                return e;
              }),
            );
          } else if (member.role === "Medic") {
            setPlayerHp((prev) => Math.min(player.maxHp, prev + member.hp));
            addLog(
              `🩺 ${member.name} provides field treatment! Restores +${member.hp} HP.`,
            );
          } else if (member.role === "Scout") {
            setEnemiesSpottedDueToShooting((prev) => ({
              ...prev,
              [targetEnemy.id]: true,
            }));
            addLog(`🦅 ${member.name} spots enemies!`);
          } else {
            setPlayerHp((prev) => Math.min(player.maxHp, prev + 20));
            addLog(
              `🛡️ ${member.name} provides covering fire! You gain temporary defense/HP.`,
            );
          }
        } else {
          addLog(
            `🤠 POSSE: A hired gunslinger fires supplementary cover shots, bolstering your defense.`,
          );
        }
        break;
      }
    }
  };

  // Sidearm weapon swap action (1 AP)
  const handleSwapWeapon = (weaponId: string) => {
    if (turn !== "player" || apRef.current <= 0) return;
    if (apRef.current < 2) {
      addLog(`⚠️ Swapping sidearm requires 2 Action Points.`);
      return;
    }
    if (onEquipWeapon) {
      onEquipWeapon(weaponId);
      setAp((prev) => prev - 2);
      addLog(
        `🔫 Weapon swapped. ${player.name} drew sidearm from bags. (Cost: 2 AP)`,
      );
    }
  };

  // Action: Melee attack (knifing or fists brawling adjacent cells)
  const handleMeleeAttack = (enemy: CombatActor) => {
    if (turn !== "player" || apRef.current <= 0 || isAimingCannon) return;

    // Check distance in grid units
    const dist = Math.hypot(playerPos.x - enemy.x, playerPos.y - enemy.y);
    if (dist > 1.5) {
      // Melee adjacent only
      addLog(
        `⚠️ MELEE OUT OF RANGE: ${meleeMode === "knife" ? "Knife 🔪" : "Fists ✊"} attacks require ${player.name} to be immediately adjacent to ${enemy.name}! Move closer (Costs AP) first.`,
      );
      return;
    }

    // Obstacle block check
    const isVisible = isEnemySpottedByPlayer(enemy);
    if (!isVisible) {
      addLog(
        `⚠️ OUT OF SIGHT: Target ${enemy.name} is safely concealed behind cover! Maneuver to acquire target.`,
      );
      return;
    }

    if (apRef.current < 3) {
      addLog(`⚠️ Melee attacks require 3 Action Points. `);
      return;
    }
    // Perform assault animation & deduct AP
    setAp((prev) => Math.max(0, prev - 3));
    setSelectedEnemyId(enemy.id);
    setFireAnim(true);
    setTimeout(() => setFireAnim(false), 200);

    // Stealth Strike Check for bonus damage multiplier at night
    const isStealth = isNight && !isPlayerVisuallySpottedByEnemy(enemy);

    // 🔪 Automatic Knife Attack (Out of ammo close combat)
    const hitChance = isStealth ? 1.0 : 0.9;
    const hitSuccess = Math.random() <= hitChance;

    if (hitSuccess) {
      // High bleed damage, silently bypasses gunshot noise alerts
      let dmg =
        Math.round((meleeMode === "knife" ? 45 : 20) + Math.random() * 10) +
        (player.perks.includes("brawler") ? 10 : 0);

      if (isStealth) {
        dmg *= 3; // Massive stealth critical
        addLog(
          `🥷 STEALTH STRIKE! ${player.name} strikes from the shadows for catastrophic ${dmg} damage!`,
        );
      }

      const remainingHp = Math.max(0, enemy.hp - dmg);
      const isNeutralized = remainingHp <= 0;

      setEnemies((prev) =>
        prev.map((e) => {
          if (e.id === enemy.id) {
            let surrenderFlag = e.isSurrendered;
            const isScorpion = e.type === "scorpion";
            if (
              !isScorpion &&
              remainingHp > 0 &&
              remainingHp <= e.maxHp * 0.3
            ) {
              surrenderFlag = true;
              addLog(
                `🙌 SHATTERED SPIRIT: ${e.name} dropped their weapons. "Stop cutting me! I surrender!"`,
              );
            }
            return {
              ...e,
              hp: remainingHp,
              isSurrendered: isNeutralized || surrenderFlag,
              isDead: false,
            };
          }
          return e;
        }),
      );

      addLog(
        `🔪 SLASH! ${player.name} lunged and slashed ${enemy.name} with his bowie knife, dealing -${dmg} bleed damage!`,
      );
      if (isNeutralized) {
        addLog(`☠️ Target ${enemy.name} bled out on the hot sand.`);
      }
    } else {
      addLog(`💨 Knife slash missed! ${enemy.name} ducked the blade.`);
    }
  };

  const handleShootEnvironment = (
    tx: number,
    ty: number,
    objName: string,
    isExplosive: boolean,
    isFireSource: boolean,
  ) => {
    if (turn !== "player" || apRef.current <= 0 || isAimingCannon) return;

    if (apRef.current < 3) {
      addLog(`⚠️ Shooting requires 3 Action Points.`);
      return;
    }

    if (playerClip <= 0) {
      setAp((prev) => Math.max(0, prev - 3));
      FrontierAudio.playClick();
      addLog("🔊 *CLICK* - Empty!");
      return;
    }

    const calc = calculateHitChance(
      playerPos.x,
      playerPos.y,
      tx,
      ty,
      0.9,
      player.weapon.range,
    );

    // Cone of Vision block check: Must be in player's current facing cone!
    const inCone = isCellInVisionCone(playerPos.x, playerPos.y, tx, ty, facing);
    if (
      !inCone ||
      (hasObstacleBetween(playerPos.x, playerPos.y, tx, ty) &&
        calc.coverType === "high")
    ) {
      addLog(`⚠️ CANT SEE TARGET: blocked by cover.`);
      return;
    }

    setPlayerClip((c) => Math.max(0, c - 1));
    setAp((prev) => Math.max(0, prev - 3));
    emitGunshotSound(playerPos.x, playerPos.y);

    if (onUpdatePlayer) {
      let condition =
        player.weapon?.condition !== undefined ? player.weapon.condition : 100;
      const deterioration = (0.25 + Math.random() * 0.25) * (player.perks.includes("tinkerer") ? 0.5 : 1.0);
      condition = Math.max(0, condition - deterioration);
      onUpdatePlayer({
        ...player,
        weapon: { ...player.weapon, condition: condition },
      });
    }

    if (Math.random() <= calc.value) {
      if (isExplosive) {
        addLog(
          `💥 DIRECT HIT ON ${objName.toUpperCase()}! A massive explosion rocks the trail!`,
        );
        // Explosion logic! 3x3
        const blastRadius = 1;
        let hitEnemies: string[] = [];
        let playerHit = false;

        const newExpArr: { x: number; y: number; id: string }[] = [];
        for (let ix = -1; ix <= 1; ix++) {
          for (let iy = -1; iy <= 1; iy++) {
            newExpArr.push({
              x: tx + ix,
              y: ty + iy,
              id: Math.random().toString(),
            });
          }
        }
        setExplosions((prev) => [...prev, ...newExpArr]);
        setTimeout(() => {
          setExplosions((prev) =>
            prev.filter((p) => !newExpArr.find((n) => n.id === p.id)),
          );
        }, 400);

        // 1. Damage Enemies in radius
        setEnemies((prev) =>
          prev.map((e) => {
            if (!e.isDead && !e.isSurrendered && !e.isUnconscious) {
              if (
                Math.abs(e.x - tx) <= blastRadius &&
                Math.abs(e.y - ty) <= blastRadius
              ) {
                const nextHp = Math.max(0, e.hp - 45); // heavy damage
                hitEnemies.push(e.name);
                return { ...e, hp: nextHp, isDead: nextHp <= 0 };
              }
            }
            return e;
          }),
        );

        // 2. Damage Player if in radius
        if (
          Math.abs(playerPos.x - tx) <= blastRadius &&
          Math.abs(playerPos.y - ty) <= blastRadius
        ) {
          playerHit = true;
          setPlayerHp((prev) => Math.max(0, prev - 35));
        }

        // 3. Destroy grid covers
        setGrid((prev) =>
          prev.map((c) => {
            if (
              Math.abs(c.x - tx) <= blastRadius &&
              Math.abs(c.y - ty) <= blastRadius
            ) {
              if (c.type !== "empty" && c.type !== "rail") {
                return { ...c, type: "empty" };
              }
            }
            return c;
          }),
        );

        if (hitEnemies.length > 0)
          addLog(
            `🔥 BLAST HIT: ${hitEnemies.join(", ")} caught in the blast for 45 damage!`,
          );
        if (playerHit)
          addLog(
            `🔥 CAUGHT IN BLAST! ${player.name} takes 35 explosion damage!`,
          );
      } else if (isFireSource) {
        addLog(
          `🔥 DIRECT HIT ON ${objName.toUpperCase()}! Fire begins to spread!`,
        );
        setGrid((prev) =>
          prev.map((c) => {
            if (c.x === tx && c.y === ty) {
              return {
                ...c,
                type: "fire",
                hp: 0,
                isOnFire: true,
                turnsOnFire: 3,
              };
            }
            return c;
          }),
        );
      } else {
        const baseDmg =
          player.weapon.dmg + (player.perks.includes("high_caliber") ? 15 : 0);
        addLog(`🎯 HIT the ${objName.replace("_", " ")}!`);
        setGrid((prev) =>
          prev.map((c) => {
            if (c.x === tx && c.y === ty && c.hp !== undefined) {
              const newHp = c.hp - baseDmg;
              if (newHp <= 0) {
                addLog(
                  `💥 The ${objName.replace("_", " ")} shattered into pieces!`,
                );
                const expId = Math.random().toString();
                setExplosions((prevExp) => [
                  ...prevExp,
                  { x: tx, y: ty, id: expId },
                ]);
                setTimeout(() => {
                  setExplosions((prevExp) =>
                    prevExp.filter((e) => e.id !== expId),
                  );
                }, 400);
                return { ...c, type: "rubble", hp: 0 };
              } else {
                return { ...c, hp: newHp };
              }
            }
            return c;
          }),
        );
      }
    } else {
      addLog(`💨 MISSED the ${objName.replace("_", " ")}!`);
    }
  };

  // Action: General Fire Shot
  const handleShootEnemy = (enemy: CombatActor) => {
    if (turn !== "player" || apRef.current <= 0 || isAimingCannon) return;

    if (playerClip <= 0) {
      handleReload();
      return;
    }

    // Obstacle block check
    const isVisible = isEnemySpottedByPlayer(enemy);
    if (!isVisible) {
      addLog(
        `⚠️ OUT OF SIGHT: Target ${enemy.name} is safely concealed behind cover! Maneuver to acquire target.`,
      );
      return;
    }

    // Scoped weapon slower shot AP check
    let fireApCost = hasScope ? 6 : 3;
    const isPistol = player.weapon.ammoType === "pistol" || !player.weapon.ammoType;
    if (isPistol && player.perks.includes("fanning")) {
      fireApCost = Math.max(1, fireApCost - 1);
    }

    if (apRef.current < fireApCost) {
      if (hasScope) {
        addLog(
          `⚠️ Scoped targeting requires precision time! (Need ${fireApCost} AP)`,
        );
      } else {
        addLog(`⚠️ Not enough Action Points to fire! (Need ${fireApCost} AP)`);
      }
      return;
    }

    // Shotgun vs Pistol checks
    const wName = player.weapon.name.toLowerCase();
    const isShotgun = wName.includes("shotgun");
    const isP =
      wName.includes("pistol") ||
      wName.includes("revolver") ||
      wName.includes("colt");

    // Weapon condition & Jamming check
    let condition =
      player.weapon?.condition !== undefined ? player.weapon.condition : 100;

    // Decrease condition slightly from firing (0.25% to 0.5% per shot)
    const deterioration = (0.25 + Math.random() * 0.25) * (player.perks.includes("tinkerer") ? 0.5 : 1.0);
    condition = Math.max(0, condition - deterioration);

    // Update weapon and skills state
    if (onUpdatePlayer) {
      onUpdatePlayer({
        ...player,
        pistolSkill: Math.min(200, (player.pistolSkill || 0) + (isP ? 0.2 : 0)),
        rifleSkill: Math.min(200, (player.rifleSkill || 0) + (!isP ? 0.2 : 0)),
        weapon: { ...player.weapon, condition: condition },
      });
    }

    // Jam check! Low condition means higher jam chance
    // If condition is < 40%, chance to jam is linearly up to 15%
    const jamChance = condition < 40 ? ((40 - condition) / 40) * 0.15 : 0.005; // 0.5% base chance min

    if (Math.random() < jamChance) {
      addLog(
        `❌ CLICK! Your ${player.weapon.name} JAMMED! Mechanism failed due to poor condition (${Math.round(condition)}%)!`,
      );
      setAp((a) => Math.max(0, a - fireApCost));
      apRef.current = Math.max(0, apRef.current - fireApCost);
      return;
    }

    // Emit Gunshot Sound flare (forces all turns looking here!)
    emitGunshotSound(playerPos.x, playerPos.y);

    if (isShotgun) {
      // SHOTGUN SPRAY SPLASH AREA ACTION
      setPlayerClip((c) => Math.max(0, c - 1));

      setAp((prev) => Math.max(0, prev - fireApCost));

      setFireAnim(true);
      setTimeout(() => setFireAnim(false), 200);

      const targetX = enemy.x;
      const targetY = enemy.y;

      drawShootLine(
        playerPos.x,
        playerPos.y,
        targetX,
        targetY,
        true,
        "#e8b923",
        player.weapon.range,
      );

      addLog(
        `🔥 SHOTGUN BLAST! ${player.name} fires a wide heavy spray at line coordinate Y=${targetY}!`,
      );

      let hitList: string[] = [];
      let explodedCovers: string[] = [];

      // Loop over 3 horizontal cells
      for (let sx = targetX - 1; sx <= targetX + 1; sx++) {
        if (sx < 0 || sx >= GRID_SIZE) continue;

        // Check if there's an enemy in this cell
        const sprayEnemy = enemies.find(
          (e) =>
            e.x === sx &&
            e.y === targetY &&
            !e.isDead &&
            !e.isSurrendered &&
            !e.isUnconscious,
        );
        if (sprayEnemy) {
          const calc = calculateHitChance(
            playerPos.x,
            playerPos.y,
            sx,
            targetY,
            0.75,
            player.weapon.range,
          );
          const hit = Math.random() <= calc.value;

          if (hit) {
            const baseDmg = player.weapon.dmg + damageBonus;
            const isShotgunPistol =
              player.weapon.name.toLowerCase().includes("pistol") ||
              player.weapon.name.toLowerCase().includes("revolver");
            const wSkill = isShotgunPistol
              ? player.pistolSkill || 0
              : player.rifleSkill || 0;
            const playerCritMod = 1 + wSkill / 50;
            const hitResult = rollBodyPartHit(
              sprayEnemy.name,
              baseDmg,
              false,
              playerCritMod,
            );
            let traitDmg = hitResult.dmg;
            let labelSuffix = "";
            if (sprayEnemy.trait === "armored") {
              traitDmg = Math.round(traitDmg * 0.65);
              labelSuffix = " (🛡️ Armored reduction of 35%)";
            }
            const remainingHp = hitResult.instantDeath
              ? 0
              : Math.max(0, sprayEnemy.hp - traitDmg);
            const isNeutralized = remainingHp <= 0;

            setEnemies((prev) =>
              prev.map((e) => {
                if (e.id === sprayEnemy.id) {
                  let surrenderFlag = e.isSurrendered;
                  const isScorpion = e.type === "scorpion";
                  if (
                    !isScorpion &&
                    remainingHp > 0 &&
                    remainingHp <= e.maxHp * 0.3
                  ) {
                    surrenderFlag = true;
                    addLog(
                      `🙌 SHATTERED SPIRIT: ${e.name} dropped their weapons. "Stop shooting! I surrender!"`,
                    );
                  }
                  return {
                    ...e,
                    hp: remainingHp,
                    isSurrendered: isNeutralized || surrenderFlag,
                    isDead: false,
                    injuredLeg: hitResult.detail.includes("LEG"),
                    injuredArm: hitResult.detail.includes("ARM"),
                  };
                }
                return e;
              }),
            );

            hitList.push(
              `${sprayEnemy.name} [${hitResult.detail} dealt -${hitResult.instantDeath ? "FATAL" : traitDmg} HP${labelSuffix}]`,
            );
          }
        }

        // Environmental destruction in spray cell
        const sprayCell = grid.find((c) => c.x === sx && c.y === targetY);
        if (
          sprayCell &&
          (sprayCell.type === "low_cover" ||
            sprayCell.type === "cactus" ||
            sprayCell.type === "crates" ||
            sprayCell.type === "table")
        ) {
          const label = "fragile cover";
          explodedCovers.push(label);
          setGrid((prev) =>
            prev.map((c) =>
              c.x === sx && c.y === targetY
                ? { ...c, type: "rubble", hp: 0 }
                : c,
            ),
          );
        }
      }

      if (hitList.length > 0) {
        addLog(`🎯 BUCKSHOT GAUGE CONNECTED:\n${hitList.join("\n")}`);
      } else {
        addLog("💨 Buckshot whizzed broad of enemies into barren dunes.");
      }

      if (explodedCovers.length > 0) {
        addLog(
          `💥 SHATTERED: ${explodedCovers.join(" and ")} blown to fragments!`,
        );
      }
    } else {
      // REGULAR WEAPON SHOOT SINGLE TARGET WITH CUSTOM BODY TARGET MODIFIERS
      let targetedPenalty = 0;
      let dmgMultiplier = 1.0;
      if (targetedPart === "arm") {
        targetedPenalty = -0.2;
        dmgMultiplier = 0.7;
      } else if (targetedPart === "leg") {
        targetedPenalty = -0.15;
        dmgMultiplier = 0.8;
      } else if (targetedPart === "head") {
        targetedPenalty = -0.4;
        dmgMultiplier = 2.5;
      }

      if (isPistol && player.perks.includes("fanning")) {
        targetedPenalty -= 0.15; // Decreased accuracy for rapid fanning
      } else if (!isPistol && player.perks.includes("steady_aim")) {
        targetedPenalty += 0.15; // Increased rifle accuracy
      }

      const calcBase = calculateHitChance(
        playerPos.x,
        playerPos.y,
        enemy.x,
        enemy.y,
        0.8,
        player.weapon.range,
      );

      // Adjust hit chance based on active targeting choice
      const adjustedHitValue = Math.max(
        0.1,
        Math.min(0.95, calcBase.value + targetedPenalty),
      );

      setPlayerClip((c) => Math.max(0, c - 1));

      setAp((prev) => Math.max(0, prev - fireApCost));

      setSelectedEnemyId(enemy.id);
      setFireAnim(true);
      setTimeout(() => setFireAnim(false), 200);

      const hitSuccess = Math.random() <= adjustedHitValue;
      drawShootLine(
        playerPos.x,
        playerPos.y,
        enemy.x,
        enemy.y,
        hitSuccess,
        "#e8b923",
        player.weapon.range,
      );

      let baseDmg = player.weapon.dmg + damageBonus;
      baseDmg = Math.round(baseDmg * dmgMultiplier); // Apply targeting multiplier
      if (player.perks.includes("executioner") && enemy.hp < enemy.maxHp / 2) {
        baseDmg = Math.round(baseDmg * 1.5);
      }

      let isCrit = false;
      const critRandomCap = 0.08;
      if (hitSuccess && Math.random() < critRandomCap + accuracyBonus / 100) {
        isCrit = true;
        baseDmg = Math.round(baseDmg * 1.8);
      }

      if (hitSuccess) {
        let dmgRoll = baseDmg;
        let detail = "";
        let armInjured = false;
        let legInjured = false;
        let isInstantKill = false;

        if (targetedPart === "head") {
          const instaRoll = Math.random() <= 0.35; // 35% instant kill check on successful headshot
          if (instaRoll) {
            isInstantKill = true;
            detail = `🧠 HEADSHOT: Bullet pierced straight through the skull structure! Instant mortality check passed!`;
          } else {
            detail = `🧠 BLOW TO SKULL: Heavy bullet struck the forehead directly! Catastrophic headshot!`;
          }
        } else if (targetedPart === "arm") {
          armInjured = true;
          detail = `🦾 ARM SHOT: Bullet shattered their forearm! Hand weapon was flung away (DISARMED) into the dirt!`;
        } else if (targetedPart === "leg") {
          legInjured = true;
          detail = `🦿 LEG SHOT: Knee joint joint was blown! Stance and movement speed permanently crippled!`;
        } else {
          detail = `🪵 TORSO IMPACT: Bullet slammed deep into the chest plates.`;
        }

        if (isCrit) {
          detail += ` Arterial wound causes severe ongoing BLEEDING!`;
        }

        const remainingHp = isInstantKill ? 0 : Math.max(0, enemy.hp - dmgRoll);
        const isNeutralized = remainingHp <= 0;

        setEnemies((prev) =>
          prev.map((e) => {
            if (e.id === enemy.id) {
              let surrenderFlag = e.isSurrendered;
              const isScorpion = e.type === "scorpion";

              if (
                !isScorpion &&
                remainingHp > 0 &&
                remainingHp <= e.maxHp * (player.perks.includes("intimidation") ? 0.5 : 0.3)
              ) {
                surrenderFlag = true;
                addLog(
                  `🙌 WHITE FLAG: ${e.name} tosses their revolver aside and surrenders!`,
                );
              }

              return {
                ...e,
                hp: remainingHp,
                isSurrendered: isNeutralized || surrenderFlag,
                isDead: false,
                isDisarmed: e.isDisarmed || armInjured,
                injuredLeg: e.injuredLeg || legInjured,
                injuredArm: e.injuredArm || armInjured,
                statusBleeding: isCrit
                  ? (e.statusBleeding || 0) + 3
                  : e.statusBleeding,
              };
            }
            return e;
          }),
        );

        const hitStyle = isCrit
          ? "💥 CRITICAL DIRECT BURST!"
          : "🎯 Bullet engaged!";
        const coverDetail =
          calcBase.coverType !== "none"
            ? ` (pierced ${calcBase.coverType} cover)`
            : "";

        addLog(
          `${hitStyle} ${detail} dealing -${isInstantKill ? "FATAL" : dmgRoll} HP damage!${coverDetail}`,
        );

        if (isNeutralized) {
          addLog(`☠️ Target ${enemy.name} was neutralized.`);
        }
      } else {
        let coverMsg = "";
        if (calcBase.coverCell) {
          const coverCell = grid.find(
            (c) =>
              c.x === calcBase.coverCell!.x && c.y === calcBase.coverCell!.y,
          );
          if (coverCell && coverCell.hp !== undefined) {
            const coverDmg = Math.round(baseDmg * 0.7);
            setGrid((prev) =>
              prev.map((c) => {
                if (
                  c.x === calcBase.coverCell!.x &&
                  c.y === calcBase.coverCell!.y
                ) {
                  const newHp = (c.hp || 0) - coverDmg;
                  if (newHp <= 0) {
                    coverMsg = ` The bullet obliterated the ${c.type.replace("_", " ")}!`;
                    if (c.type === "tnt_barrel") {
                      setTimeout(
                        () =>
                          handleShootEnvironment(
                            c.x,
                            c.y,
                            "tnt_barrel",
                            true,
                            false,
                          ),
                        100,
                      );
                      return c;
                    } else if (c.type === "lantern" || c.type === "camp_fire") {
                      coverMsg += " Spreading fire!";
                      return {
                        ...c,
                        type: "fire",
                        hp: 0,
                        isOnFire: true,
                        turnsOnFire: 3,
                      };
                    } else {
                      const expId = Math.random().toString();
                      setExplosions((prevExp) => [
                        ...prevExp,
                        { x: c.x, y: c.y, id: expId },
                      ]);
                      setTimeout(() => {
                        setExplosions((prevExp) =>
                          prevExp.filter((ex) => ex.id !== expId),
                        );
                      }, 400);
                      return { ...c, type: "rubble", hp: 0 };
                    }
                  } else {
                    coverMsg = ` The bullet struck the ${c.type.replace("_", " ")} (Cover HP: ${newHp}/${c.maxHp}).`;
                    return { ...c, hp: newHp };
                  }
                }
                return c;
              }),
            );
          }
        }
        addLog(
          `💨 Bullet whizzed past ${enemy.name}. (Hit chance: ${Math.round(adjustedHitValue * 100)}%)${coverMsg}`,
        );
      }

      setAp((prev) => Math.max(0, prev - fireApCost));
    }
  };

  // Action: Reload
  const handleReload = () => {
    if (turn !== "player" || apRef.current <= 0 || isAimingCannon) return;

    // Check if player has enough AP for reloading (unless free)
    const isFree = player.perks.includes("fast_hands");
    if (!isFree && ap < 3) {
      addLog("⚠️ Reloading requires 3 Action Points!");
      return;
    }

    const maxClipCap =
      player.weapon.maxClip + (player.weaponUpgrades?.clipBonus || 0);

    if (playerClip === maxClipCap) {
      addLog("⚠️ Sidearm cylinders are already fully loaded.");
      return;
    }

    if (playerReserveAmmo <= 0) {
      addLog("⚠️ CLICK-EMPTY! Out of reserve ammunition!");
      setClickEmptyActive(true);
      setTimeout(() => setClickEmptyActive(false), 2000);
      return;
    }

    const totalToLoad = maxClipCap - playerClip;
    const actualLoaded = Math.min(totalToLoad, playerReserveAmmo);

    setPlayerClip((c) => c + actualLoaded);
    setPlayerReserveAmmo((r) => r - actualLoaded);

    if (onUpdatePlayer) {
      onUpdatePlayer({
        ...player,
        reloadSkill: Math.min(200, (player.reloadSkill || 0) + 0.2),
      });
    }

    if (!isFree) {
      setAp((prev) => prev - 3);
    }

    addLog(
      `🔄 Cylinders reloaded with +${actualLoaded} cartridges. Available reserve: ${playerReserveAmmo - actualLoaded}`,
    );
  };

  const handleRotate = (nextFacing: "up" | "down" | "left" | "right") => {
    if (turn !== "player") return;
    if (apRef.current < 1) {
      addLog("⚠️ Rotating your vision cone requires 1 AP!");
      return;
    }
    setFacing(nextFacing);
    setAp((prev) => prev - 1);
    addLog(
      `🧭 ROTATION: Changed vision cone facing to ${nextFacing.toUpperCase()}. (Spent 1 AP)`,
    );
  };

  // Reset shoot-spotting when player's turn starts
  useEffect(() => {
    if (turn === "player") {
      setPlayerSpottedDueToShooting(false);
      setEnemiesSpottedDueToShooting({});

      // Process Player Status Effects
      if (playerBleedTurns > 0) {
        setPlayerHp((prev) => Math.max(0, prev - 10));
        setPlayerBleedTurns((prev) => prev - 1);
        addLog(
          `🩸 CRITICAL BLEED: ${player.name} loses 10 HP from open wounds! (${playerBleedTurns - 1} turns remaining)`,
        );
      }
      if (playerPoisonTurns > 0) {
        setPlayerHp((prev) => Math.max(0, prev - 15));
        setPlayerPoisonTurns((prev) => prev - 1);
        addLog(
          `🤢 SCORPION VENOM: ${player.name} loses 15 HP from thick venom in his veins! (${playerPoisonTurns - 1} turns remaining)`,
        );
      }

      // Process Environmental Fires
      setGrid((prev) => {
        let hasChanges = false;
        const nextGrid = [...prev];
        const newFires: { x: number; y: number }[] = [];

        for (let i = 0; i < nextGrid.length; i++) {
          const cell = nextGrid[i];
          if (cell.type === "fire" || cell.isOnFire) {
            const turnsLeft = (cell.turnsOnFire || 0) - 1;
            hasChanges = true;

            if (turnsLeft <= 0) {
              // Fire dies out
              nextGrid[i] = { ...cell, type: "rubble", isOnFire: false };
            } else {
              nextGrid[i] = { ...cell, turnsOnFire: turnsLeft };

              // Fire spreads to adjacent destructibles!
              const adjacents = prev.filter(
                (c) =>
                  Math.abs(c.x - cell.x) <= 1 &&
                  Math.abs(c.y - cell.y) <= 1 &&
                  !c.isOnFire &&
                  c.hp !== undefined &&
                  c.type !== "empty",
              );
              for (const adj of adjacents) {
                if (Math.random() < 0.25) {
                  // 25% spread chance
                  newFires.push({ x: adj.x, y: adj.y });
                }
              }
            }
          }
        }

        if (newFires.length > 0) {
          hasChanges = true;
          for (const fireCords of newFires) {
            const idx = nextGrid.findIndex(
              (c) => c.x === fireCords.x && c.y === fireCords.y,
            );
            if (idx > -1) {
              if (nextGrid[idx].type === "tnt_barrel") {
                // Wait until grid updates, then trigger explode
                setTimeout(
                  () =>
                    handleShootEnvironment(
                      fireCords.x,
                      fireCords.y,
                      "tnt_barrel",
                      true,
                      false,
                    ),
                  50,
                );
              } else {
                nextGrid[idx] = {
                  ...nextGrid[idx],
                  type: "fire",
                  isOnFire: true,
                  hp: 0,
                  turnsOnFire: 3,
                };
                addLog(
                  `🔥 The fire spreads to the nearby ${nextGrid[idx].type.replace("_", " ")}!`,
                );
              }
            }
          }
        }

        return hasChanges ? nextGrid : prev;
      });

      // Player burning check
      const currentCell = grid.find(
        (c) => c.x === playerPos.x && c.y === playerPos.y,
      );
      if (
        currentCell &&
        (currentCell.type === "fire" || currentCell.isOnFire)
      ) {
        setPlayerHp((prev) => Math.max(0, prev - 15));
        addLog(`🔥 You are standing in the FIRE! Took 15 burning damage!`);
      }
    }
  }, [turn]);

  // KEYBOARD TACTICAL MOVEMENT (wasdqeyc)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (turn !== "player" || isAimingCannon || isAimingDynamite) return;
      if (
        ["INPUT", "TEXTAREA", "SELECT"].includes(
          (e.target as HTMLElement).tagName,
        )
      )
        return;

      const key = e.key.toLowerCase();
      let dx = 0;
      let dy = 0;
      switch (key) {
        case "w":
          dy = -1;
          break;
        case "s":
          dy = 1;
          break;
        case "a":
          dx = -1;
          break;
        case "d":
          dx = 1;
          break;
        case "q":
          dx = -1;
          dy = -1;
          break;
        case "e":
          dx = 1;
          dy = -1;
          break;
        case "y":
        case "z":
          dx = -1;
          dy = 1;
          break;
        case "c":
          dx = 1;
          dy = 1;
          break;
        default:
          return;
      }

      const nx = playerPos.x + dx;
      const ny = playerPos.y + dy;

      if (nx >= 0 && nx < 9 && ny >= 0 && ny < 9) {
        handleMove(nx, ny);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    turn,
    isAimingCannon,
    isAimingDynamite,
    playerPos.x,
    playerPos.y,
    ap,
    enemies,
    grid,
  ]);

  // GLOBAL VICTORY TARGET CHECK
  useEffect(() => {
    if (enemies.length === 0 || playerHp <= 0 || hasEndedRef.current) return;

    // In Duel mode, victory is handled differently
    if (combatType === "duel") return;

    const fightingEnemies = enemies.filter(
      (e) => !e.isDead && !e.isSurrendered && !e.isUnconscious,
    );
    const hostilesRemaining = fightingEnemies.filter((e) => e.type !== "posse");

    // Victory Check
    if (hostilesRemaining.length === 0) {
      const capturedCount = enemies.filter(
        (e) =>
          e.type !== "posse" &&
          (e.isSurrendered || e.isUnconscious) &&
          !e.isDead,
      ).length;
      let bonusLoot = 0;
      let bonusXp = 0;
      if (capturedCount > 0) {
        if (combatType === "train_robbery") {
          addLog(
            `🏳️ HOSTILES SUBDUED: ${capturedCount} rail guards surrendered! ${player.name} plunders the luxory cars!`,
          );
        } else if (combatType === "robbery") {
          addLog(
            `🏳️ HOSTILES SUBDUED: ${capturedCount} bank guards and tellers surrendered, locking themselves in the back room while ${player.name} empties the vault!`,
          );
        } else {
          addLog(
            `👮 CAPTURED ALIVE: ${player.name} bound ${capturedCount} hostiles back-to-back with security ropes! Maximum custody bonus reached!`,
          );
          bonusLoot = capturedCount * 35;
          bonusXp = capturedCount * 25;
        }
      }

      addLog(
        `🏆 VICTORY: All remaining hostiles have surrendered or been neutralized! ${player.name} stands victorious!`,
      );
      const loot =
        Math.round(50 + difficultyRisk * 150 + Math.random() * 80) + bonusLoot;
      const xp = Math.round(40 + difficultyRisk * 80) + bonusXp;

      const survivingPosseIds = enemies
        .filter((e) => e.type === "posse" && !e.isDead)
        .map((e) => e.id);

      const lootItems: InventoryItem[] = [];
      const defeatedHostiles = enemies.filter(
        (e) =>
          e.type !== "posse" &&
          (e.isDead || e.isSurrendered || e.isUnconscious),
      );
      if (defeatedHostiles.length > 0) {
        const isTutorial =
          activeProvokedNpcId === "slippery_pete" || difficultyRisk <= 0.1;
        const isHighTier =
          difficultyRisk >= 0.7 ||
          combatType === "nest_clearing" ||
          activeMissionTarget?.type === "nemesis";

        defeatedHostiles.forEach((enemy) => {
          const roll = Math.random();

          // Determine the enemy's weapon base type
          const wpnLower = (enemy.weaponName || "").toLowerCase();
          let baseType = "Revolver";
          let allowedParts: ("barrel" | "cylinder" | "stock" | "action")[] = [
            "barrel",
            "cylinder",
          ];
          let dropChance = 0.45; // 45% chance to drop a part per enemy

          if (
            wpnLower.includes("rifle") ||
            wpnLower.includes("repeater") ||
            wpnLower.includes("sniper")
          ) {
            baseType = "Rifle";
            allowedParts = ["barrel", "action", "stock"];
          } else if (wpnLower.includes("shotgun")) {
            baseType = "Shotgun";
            allowedParts = ["barrel", "action", "stock"];
          } else if (wpnLower.includes("cannon")) {
            baseType = "Heavy";
            allowedParts = ["barrel"];
          } else if (enemy.type === "scorpion") {
            dropChance = 0; // Beasts drop no weapon parts
            baseType = "";
          }

          const generatePart = (quality: "Rusted" | "Worn" | "Pristine") => {
            const pType =
              allowedParts[Math.floor(Math.random() * allowedParts.length)];
            let partNameStr = `${quality} ${baseType} ${pType.charAt(0).toUpperCase() + pType.slice(1)}`;
            let partCond = 30;
            let val = 15;
            if (quality === "Rusted") {
              partCond = 15 + Math.random() * 20; // 15-35
              val = 25;
            } else if (quality === "Worn") {
              partCond = 35 + Math.random() * 35; // 35-70
              val = 60;
            } else {
              partCond = 75 + Math.random() * 25; // 75-100
              val = 150;
            }

            let partPerk: any;
            if (quality === "Pristine") {
              // High tier pristine perks
              const calculatePerkValue = (max: number) => {
                const normalizedDiff = Math.min(
                  1.2,
                  Math.max(0.1, difficultyRisk),
                );
                const scaledMax = Math.max(1, max * (normalizedDiff / 1.0));
                const scaledMin = scaledMax * 0.5;
                const rollVal = Math.round(
                  scaledMin + Math.random() * (scaledMax - scaledMin),
                );
                return Math.max(1, Math.min(max, rollVal));
              };

              if (pType === "barrel") {
                const pVal = calculatePerkValue(15);
                partPerk = {
                  accuracyBonus: pVal,
                  description: `+${pVal}% Accuracy`,
                };
              } else if (pType === "cylinder") {
                const pVal = calculatePerkValue(2);
                partPerk = {
                  maxClipBonus: pVal,
                  description: `+${pVal} Max Clip`,
                };
              } else if (pType === "stock") {
                const pVal = calculatePerkValue(4);
                partPerk = {
                  dmgBonus: pVal,
                  description: `+${pVal} Damage (Stable Grip)`,
                };
              } else {
                const pVal = calculatePerkValue(1);
                partPerk = {
                  apCostReduction: pVal,
                  description: `-${pVal} AP Fire Cost`,
                };
              }
            }

            return {
              id: `${quality.toLowerCase()}_${baseType.toLowerCase()}_${pType}_${Date.now() + Math.random()}`,
              name: partNameStr,
              type: "weapon_part" as const,
              value: val,
              count: 1,
              details: `${quality} component salvaged from a fallen ${enemy.name}. Condition: ${Math.round(partCond)}%. ${partPerk ? `Perks: ${partPerk.description} ` : ""}(Weight: 2.5 lbs)`,
              partStats: {
                condition: partCond,
                type: pType,
                perks: partPerk ? [partPerk] : undefined,
              },
            };
          };

          if (isTutorial) {
            if (roll < 0.2) {
              lootItems.push({
                id: "bandage",
                name: "Cotton Bandage",
                type: "consumable",
                value: 5,
                count: 1,
                details:
                  "Restores light wounds and stops bleeding. (Weight: 0.1 lbs)",
              });
            } else if (roll < 0.5 && dropChance > 0) {
              lootItems.push(generatePart("Rusted"));
            }
          } else {
            if (roll < 0.15) {
              lootItems.push({
                id: "bandage",
                name: "Cotton Bandage",
                type: "consumable",
                value: 5,
                count: 1,
                details:
                  "Restores light wounds and stops bleeding. (Weight: 0.1 lbs)",
              });
            } else if (roll < 0.25) {
              lootItems.push({
                id: "whiskey",
                name: "Premium Whiskey",
                type: "consumable",
                value: 20,
                count: 1,
                details: "Restores 25 HP. (Weight: 1 lb)",
              });
            } else if (roll < 0.4) {
              const enemyWeaponLower = (enemy.weaponName || "").toLowerCase();
              if (enemyWeaponLower.includes("shotgun")) {
                lootItems.push({
                  id: "ammo_shotgun",
                  name: "Box of 12 Gauge (Shotgun)",
                  type: "consumable",
                  value: 25,
                  count: Math.floor(Math.random() * 4) + 2, // 2-5 shells
                  details: "12 Gauge shotgun ammunition. (Weight: 2 lbs)",
                });
              } else if (
                enemyWeaponLower.includes("rifle") ||
                enemyWeaponLower.includes("winchester") ||
                enemyWeaponLower.includes("repeater") ||
                enemyWeaponLower.includes("sniper")
              ) {
                lootItems.push({
                  id: "ammo_rifle",
                  name: "Box of .44-40 (Rifle)",
                  type: "consumable",
                  value: 20,
                  count: Math.floor(Math.random() * 6) + 4, // 4-9 rounds
                  details: ".44-40 rifle ammunition. (Weight: 2 lbs)",
                });
              } else {
                lootItems.push({
                  id: "ammo_pistol",
                  name: "Box of .45 Colt (Pistol)",
                  type: "consumable",
                  value: 10,
                  count: Math.floor(Math.random() * 8) + 6, // 6-13 rounds
                  details: ".45 Colt ammunition. (Weight: 1 lb)",
                });
              }
            } else if (roll < 0.4 + dropChance) {
              const partRoll = Math.random();
              if (isHighTier && partRoll > 0.6) {
                lootItems.push(generatePart("Pristine"));
              } else if (partRoll > 0.3) {
                lootItems.push(generatePart("Worn"));
              } else {
                lootItems.push(generatePart("Rusted"));
              }
            }
          }
        });
      }

      if (!hasEndedRef.current) {
        hasEndedRef.current = true;
        setTimeout(
          () =>
            onVictoryRef.current(
              loot,
              xp,
              playerHp,
              playerClip,
              playerReserveAmmo,
              survivingPosseIds,
              capturedCount,
              playerInjuries,
              lootItems,
            ),
          1000,
        );
      }
    }
  }, [
    enemies,
    playerHp,
    combatType,
    player.name,
    difficultyRisk,
    playerClip,
    playerReserveAmmo,
  ]);

  // SEQUENTIAL AUTOMATED ENEMY TURN CONTROLLER
  useEffect(() => {
    if (turn !== "enemy") {
      if (activeAiEnemyIndex !== null) {
        setActiveAiEnemyIndex(null);
      }
      return;
    }

    const fightingEnemies = enemies.filter(
      (e) => !e.isDead && !e.isSurrendered && !e.isUnconscious,
    );
    const hostilesRemaining = fightingEnemies.filter((e) => e.type !== "posse");

    // Prevent AI from acting if there are no hostiles (prevent logic errors before victory transitions out)
    if (hostilesRemaining.length === 0) {
      return;
    }

    // Set first enemy active if none is selected
    if (activeAiEnemyIndex === null) {
      setActiveAiEnemyIndex(0);
      return;
    }

    // End of Turn Check
    if (activeAiEnemyIndex >= fightingEnemies.length) {
      if (playerSkipNextTurn) {
        addLog(
          `🤠 You lost your turn recovering your dropped weapon! The enemy loop continues!`,
        );
        setPlayerSkipNextTurn(false);
        setActiveAiEnemyIndex(0);
        return;
      }

      const baseLevelAp = Math.min(
        12,
        Math.round(
          7 +
            (player.campMovementLvl || 0) +
            Math.max(0, player.level - 1) * 0.5,
        ),
      );
      let baseAp = baseLevelAp - (combatWeather.id === "heatwave" ? 1 : 0);
      if ((player.hydration ?? 100) <= 0) baseAp = Math.floor(baseAp * 0.5);
      
      let newAp = baseAp - (isLegInjured ? 2 : 0);
      setAp(newAp);
      setTurn("player");
      setPosseCombatActionsDone({});
      setActiveAiEnemyIndex(null);
      addLog(
        `🤠 Your Turn: Loaded Action Points (${newAp} AP). Move, seek cover, or fire!`,
      );
      return;
    }

    // Get current active enemy
    let enemy = fightingEnemies[activeAiEnemyIndex];

    const aiActionTimer = setTimeout(() => {
      // 0. Process Status Effects (DOT)
      const currentCell = grid.find((c) => c.x === enemy.x && c.y === enemy.y);
      if (
        currentCell &&
        (currentCell.type === "fire" || currentCell.isOnFire)
      ) {
        const fireDmg = 15;
        const burnHp = Math.max(0, enemy.hp - fireDmg);
        addLog(
          `🔥 OUTLAW BURNING: ${enemy.name} loses ${fireDmg} HP standing in the flames!`,
        );
        setEnemies((prev) =>
          prev.map((e) =>
            e.id === enemy.id
              ? { ...e, hp: burnHp, isSurrendered: burnHp <= 0, isDead: false }
              : e,
          ),
        );
        enemy = { ...enemy, hp: burnHp };
        if (burnHp <= 0) {
          enemy.isSurrendered = true;
          enemy.isDead = false;
          setActiveAiEnemyIndex((prev) => prev! + 1);
          return;
        }
      }

      if (enemy.statusBleeding && enemy.statusBleeding > 0) {
        const nextHp = Math.max(0, enemy.hp - 10);
        addLog(
          `🩸 OUTLAW BLEED: ${enemy.name} loses 10 HP to blood loss! (${enemy.statusBleeding - 1} turns remaining)`,
        );
        setEnemies((prev) =>
          prev.map((e) =>
            e.id === enemy.id
              ? {
                  ...e,
                  hp: nextHp,
                  statusBleeding: Math.max(0, e.statusBleeding! - 1),
                  isDead: nextHp <= 0,
                }
              : e,
          ),
        );
        enemy = {
          ...enemy,
          hp: nextHp,
          statusBleeding: enemy.statusBleeding - 1,
        };
        if (nextHp <= 0) {
          enemy.isDead = true;
          setActiveAiEnemyIndex((prev) => prev! + 1);
          return;
        }
      }
      if (enemy.statusPoison && enemy.statusPoison > 0) {
        const nextHp = Math.max(0, enemy.hp - 15);
        addLog(
          `🤢 SCORPION VENOM: ${enemy.name} loses 15 HP to toxic poison! (${enemy.statusPoison - 1} turns remaining)`,
        );
        setEnemies((prev) =>
          prev.map((e) =>
            e.id === enemy.id
              ? {
                  ...e,
                  hp: nextHp,
                  statusPoison: Math.max(0, e.statusPoison! - 1),
                  isDead: nextHp <= 0,
                }
              : e,
          ),
        );
        enemy = { ...enemy, hp: nextHp, statusPoison: enemy.statusPoison - 1 };
        if (nextHp <= 0) {
          enemy.isDead = true;
          setActiveAiEnemyIndex((prev) => prev! + 1);
          return;
        }
      }

      // 1. Core checks
      const isDisarmedHuman = enemy.type !== "scorpion" && enemy.isDisarmed;

      const isFriendlyAI = enemy.type === "posse";
      let targetPos = playerPos;
      let targetHp = playerHp;

      if (isFriendlyAI) {
        // Target nearest hostile
        let nearestDist = Infinity;
        let nearestPos = null;
        enemies.forEach((e) => {
          if (
            e.id !== enemy.id &&
            e.type !== "posse" &&
            !e.isDead &&
            !e.isSurrendered &&
            !e.isUnconscious
          ) {
            const d = Math.hypot(e.x - enemy.x, e.y - enemy.y);
            if (d < nearestDist) {
              nearestDist = d;
              nearestPos = { x: e.x, y: e.y, hp: e.hp };
            }
          }
        });
        if (nearestPos) {
          targetPos = { x: nearestPos.x, y: nearestPos.y };
          targetHp = nearestPos.hp;
        }
      } else {
        // Target nearest player or posse member
        let nearestDist = Math.hypot(
          playerPos.x - enemy.x,
          playerPos.y - enemy.y,
        );
        let nearestPos = { ...playerPos, isPlayer: true, id: "player" };

        enemies.forEach((e) => {
          if (
            e.type === "posse" &&
            !e.isDead &&
            !e.isSurrendered &&
            !e.isUnconscious
          ) {
            const d = Math.hypot(e.x - enemy.x, e.y - enemy.y);
            if (d < nearestDist) {
              nearestDist = d;
              nearestPos = {
                x: e.x,
                y: e.y,
                hp: e.hp,
                isPlayer: false,
                id: e.id,
              };
            }
          }
        });

        targetPos = { x: nearestPos.x, y: nearestPos.y };
        targetHp = nearestPos.isPlayer ? playerHp : nearestPos.hp;
        enemy.currentTargetInfo = nearestPos; // Store temporarily
      }

      // --- DELEGATE TO EXTRACTED AI MODULE ---
      const aiResult = processAILogic({
        enemy,
        grid,
        targetPos,
        enemies,
        targetHp,
        hasCannonMap: combatBiome.id === "rails",
        checkVisibility: (actorToCheck) =>
          isFriendlyAI ? true : isPlayerVisuallySpottedByEnemy(actorToCheck),
      });

      // Apply new positional decisions
      const finalX = aiResult.newX;
      const finalY = aiResult.newY;
      const moveFacing = aiResult.newFacing;
      const newStance = aiResult.newStance;

      setEnemies((prev) =>
        prev.map((e) =>
          e.id === enemy.id
            ? {
                ...e,
                x: finalX,
                y: finalY,
                facing: moveFacing,
                stance: newStance,
              }
            : e,
        ),
      );
      if (aiResult.logs.length > 0) {
        addLog(aiResult.logs.join("\n"));
      }

      // PLAYER OVERWATCH INTERRUPT CHECK
      if (playerOverwatchMode >= 3 && !isFriendlyAI) {
        const spotted = isEnemySpottedByPlayer({
          ...enemy,
          x: finalX,
          y: finalY,
        } as CombatActor);
        if (spotted) {
          addLog(
            `💥 OVERWATCH TRIGGER: ${player.name} fires a prepared shot at ${enemy.name}!`,
          );
          const hitChance = Math.min(0.95, 0.4 + playerOverwatchMode * 0.1);

          if (Math.random() <= hitChance) {
            const oDmg = Math.round(player.weapon.dmg * 1.5);
            const remHp = Math.max(0, enemy.hp - oDmg);
            addLog(
              `🎯 OVERWATCH HIT: ${enemy.name} takes a heavy -${oDmg} HP hit in the open!`,
            );
            setEnemies((prev) =>
              prev.map((e) =>
                e.id === enemy.id
                  ? {
                      ...e,
                      hp: remHp,
                      isSurrendered: remHp <= 0,
                      isDead: false,
                    }
                  : e,
              ),
            );

            setPlayerOverwatchMode(0);

            if (remHp <= 0) {
              addLog(
                `☠️ FATAL OVERWATCH: ${enemy.name} dropped dead before completing their action!`,
              );
              setActiveAiEnemyIndex((prev) => prev! + 1);
              return;
            }
            enemy = { ...enemy, hp: remHp };
          } else {
            addLog(
              `💨 OVERWATCH MISS: ${player.name}'s suppressing shot went wide!`,
            );
            setPlayerOverwatchMode(0);
          }
        }
      }

      // Re-evaluate visibility from the updated cell and facing
      const updatedMockActor = {
        ...enemy,
        x: finalX,
        y: finalY,
        facing: moveFacing,
      };
      const isTargetVisible = isFriendlyAI
        ? true
        : isPlayerVisuallySpottedByEnemy(updatedMockActor);
      const finalDist = Math.hypot(finalX - targetPos.x, finalY - targetPos.y);

      let effectiveRange =
        Math.round(enemy.range / 2) + Math.ceil(enemy.accuracy / 15);
      if (enemy.type === "scorpion" || isDisarmedHuman) {
        effectiveRange = 1; // Melee range
      }

      // 3. Resolve Attack
      if (
        isFriendlyAI &&
        targetPos.x === playerPos.x &&
        targetPos.y === playerPos.y
      ) {
        addLog(
          `⏳ ${enemy.name} holds their fire (No hostile targets in sight).`,
        );
      } else if (isTargetVisible && finalDist <= effectiveRange) {
        if (isDisarmedHuman) {
          // Melee attack
          const hitSuccess = Math.random() <= 0.7;
          const bDmg = Math.round(enemy.dmg * 0.4);
          if (hitSuccess) {
            if (isFriendlyAI || enemy.currentTargetInfo?.isPlayer === false) {
              setEnemies((prev) =>
                prev.map((e) =>
                  e.id === enemy.currentTargetInfo.id
                    ? { ...e, hp: Math.max(0, e.hp - bDmg) }
                    : e,
                ),
              );
              addLog(
                `🥊 BRAWL ATTACK: Disarmed ${enemy.name} hits ${enemy.currentTargetInfo.name || "target"} for -${bDmg} HP!`,
              );
            } else {
              const nextHp = Math.max(0, playerHp - bDmg);
              setPlayerHp(nextHp);
              if (onUpdatePlayer) {
                onUpdatePlayer({ ...player, hp: nextHp });
              }
              addLog(
                `🥊 BRAWL ATTACK: Disarmed ${enemy.name} lunges and swings a fist punch, hitting ${player.name} for -${bDmg} HP!`,
              );
            }
          } else {
            addLog(
              `💨 BRAWL: Disarmed ${enemy.name} threw a punch but missed!`,
            );
          }
        } else if (enemy.type === "scorpion") {
          // Scorpion sting
          const hitSuccess = Math.random() <= 0.8;
          const bDmg = enemy.dmg;
          if (hitSuccess) {
            if (isFriendlyAI || enemy.currentTargetInfo?.isPlayer === false) {
              setEnemies((prev) =>
                prev.map((e) =>
                  e.id === enemy.currentTargetInfo.id
                    ? { ...e, hp: Math.max(0, e.hp - bDmg) }
                    : e,
                ),
              );
              addLog(
                `🦂 TAIL STING: ${enemy.name} stabs its tail venom stinger into ${enemy.currentTargetInfo.name || "target"} for -${bDmg} HP damage!`,
              );
            } else {
              const nextHp = Math.max(0, playerHp - bDmg);
              setPlayerHp(nextHp);
              if (onUpdatePlayer) {
                onUpdatePlayer({ ...player, hp: nextHp });
              }
              setPlayerPoisonTurns((prev) => prev + 3);
              addLog(
                `🦂 TAIL STING: ${enemy.name} stabs its tail venom stinger, dealing -${bDmg} HP damage and INJECTING POISON!`,
              );
            }
          } else {
            addLog(`💨 Venomous stinger stabs the dust, missing the target.`);
          }
        } else {
          // Standard ranged shot
          setEnemiesSpottedDueToShooting((prev) => ({
            ...prev,
            [enemy.id]: true,
          }));

          const calcObj = calculateHitChance(
            finalX,
            finalY,
            targetPos.x,
            targetPos.y,
            enemy.accuracy,
            enemy.range,
          );
          let baseHitChance = calcObj.value;
          // Scale based on world difficulty
          baseHitChance += difficultyRisk * 0.25;
          // Player evasion scaling: reduces enemy hit chance as player levels up
          const playerEvasion = Math.min(0.2, (player.level || 1) * 0.01);
          let modifiedCalcValue = baseHitChance - playerEvasion;

          if (enemy.trait === "quickdraw") {
            modifiedCalcValue += 0.1;
          }
          modifiedCalcValue = Math.max(0.05, Math.min(0.95, modifiedCalcValue));

          let hitSuccess = Math.random() <= modifiedCalcValue;
          drawShootLine(
            finalX,
            finalY,
            targetPos.x,
            targetPos.y,
            hitSuccess,
            isFriendlyAI ? "#3b82f6" : "#ef4444",
            enemy.range,
          );
          let baseEnemyDmg = enemy.dmg;

          if (enemy.trait === "ruthless" && targetHp < 50) {
            baseEnemyDmg = Math.round(baseEnemyDmg * 1.3);
          }
          if (enemy.trait === "glass_cannon") {
            baseEnemyDmg = Math.round(baseEnemyDmg * 1.35);
          }

          if (hitSuccess && !isFriendlyAI && targetPos.x === playerPos.x && targetPos.y === playerPos.y) {
            if (player.perks.includes("lucky") && Math.random() < 0.1) {
              addLog(`🍀 LUCKY JACK: You miraculously dodged the shot!`);
              hitSuccess = false;
            } else if (player.perks.includes("thick_skin")) {
              baseEnemyDmg = Math.max(1, baseEnemyDmg - 2);
            }
          }

          addLog(`🔥 MUZZLE FLASH: ${enemy.name} fires a bullet!`);

          if (hitSuccess) {
            if (isFriendlyAI || enemy.currentTargetInfo?.isPlayer === false) {
              const targetIdLocal = isFriendlyAI
                ? targetPos.x + "_" + targetPos.y
                : enemy.currentTargetInfo?.id || "";
              // Match by coordinate if Posse
              setEnemies((prev) =>
                prev.map((e) => {
                  if (
                    isFriendlyAI
                      ? e.x === targetPos.x && e.y === targetPos.y
                      : e.id === targetIdLocal
                  ) {
                    const hpRemaining = Math.max(0, e.hp - baseEnemyDmg);
                    addLog(
                      `💥 Bullet hit! ${enemy.name} struck ${e.name} for ${baseEnemyDmg} damage!`,
                    );
                    return {
                      ...e,
                      hp: hpRemaining,
                      isSurrendered: hpRemaining <= 0,
                      isDead: false,
                    };
                  }
                  return e;
                }),
              );
            } else {
              // Enemy critical calculation scaling based on enemy stats and map difficulty
              const enemyCritModifier =
                0.5 +
                enemy.accuracy * 0.5 +
                enemy.intelligence * 0.05 +
                difficultyRisk * 1.5;
              const hitResult = rollBodyPartHit(
                player.name,
                baseEnemyDmg,
                true,
                enemyCritModifier,
              );
              const nextHp = hitResult.instantDeath
                ? 0
                : Math.max(0, playerHp - hitResult.dmg);
              setPlayerHp(nextHp);
              if (onUpdatePlayer) {
                onUpdatePlayer({ ...player, hp: nextHp });
              }
              addLog(
                `💥 Bullet hit! ${enemy.name} struck you!\n${hitResult.detail}`,
              );

              // Enemy shoots player's gun out of its hand or destroys a part (Medium to High level enemies only)
              if (difficultyRisk >= 0.5) {
                const disarmChance = 0.02 + difficultyRisk * 0.03; // e.g., 3.5% at 0.5 risk
                if (Math.random() < disarmChance) {
                  const destroyChance = difficultyRisk >= 0.8 ? 0.2 : 0;
                  if (Math.random() < destroyChance) {
                    addLog(
                      `🔥 💥 CRITICAL: ${enemy.name} shot your weapon directly! A piece of your gun shattered! Your weapon condition plummets.`,
                    );
                    if (onUpdatePlayer) {
                      onUpdatePlayer({
                        ...player,
                        weapon: {
                          ...player.weapon,
                          condition: Math.max(
                            0,
                            (player.weapon.condition || 100) - 40,
                          ),
                        },
                      });
                    }
                  } else {
                    addLog(
                      `🖐️ 💥 CRITICAL DISARM: ${enemy.name} shot the gun right out of your hand!`,
                    );
                    setPlayerClip(0);
                    setPlayerSkipNextTurn(true);
                    addLog(
                      `⚠️ Your clip emptied onto the dirt as you fumbled to catch your weapon! You lose your next turn!`,
                    );
                  }
                }
              }
            }
          } else {
            addLog(`💨 Bullet missed! ${enemy.name} missed the shot.`);
          }
        }
      } else {
        if (!isTargetVisible) {
          addLog(
            `🕵️ CONCEALED: Target is hidden from ${enemy.name}'s active sights.`,
          );
        } else {
          addLog(
            `⏳ Range penalty: Target is spotted but too far for ${enemy.name} to fire! Seeking coverage.`,
          );
        }
      }

      // 4. Advance to next enemy AI in the sequence
      setActiveAiEnemyIndex((prev) => (prev !== null ? prev + 1 : null));
    }, 1100);

    return () => clearTimeout(aiActionTimer);
  }, [
    turn,
    activeAiEnemyIndex,
    enemies,
    playerPos,
    playerHp,
    playerSkipNextTurn,
  ]);

  const handleEndPlayerTurn = () => {
    if (turn !== "player") return;

    // Check disarmament surrender counts:
    setEnemies((prev) =>
      prev.map((enemy) => {
        if (!enemy.isDead && !enemy.isSurrendered && !enemy.isUnconscious) {
          const isHuman = enemy.type !== "scorpion";
          if (isHuman && enemy.isDisarmed) {
            const dist = Math.hypot(
              enemy.x - playerPos.x,
              enemy.y - playerPos.y,
            );
            if (dist > 1.5) {
              // not in melee range
              const currentRounds = (enemy.roundsDisarmedWithoutGun || 0) + 1;
              if (currentRounds >= 2) {
                addLog(
                  `🏳️ SURRENDER: ${enemy.name}, disarmed and kept away from melee range for 2 rounds, drops on their knees and surrenders! "Spare me! I throw in the towel!"`,
                );
                return {
                  ...enemy,
                  isSurrendered: true,
                  roundsDisarmedWithoutGun: currentRounds,
                };
              }
              return { ...enemy, roundsDisarmedWithoutGun: currentRounds };
            } else {
              // Reset count if they are close enough to melee combat
              return { ...enemy, roundsDisarmedWithoutGun: 0 };
            }
          }
        }
        return enemy;
      }),
    );

    setIsAimingCannon(false);
    setTurn("enemy");
    addLog("⏳ Lever passed. Target lawmen and beasts aim weapons...");
  };

  const handleOverwatch = () => {
    if (turn !== "player") return;
    if (apRef.current < 3) {
      addLog("⚠️ Insufficient AP for Overwatch. (Minimum 3 AP required)");
      return;
    }

    setPlayerOverwatchMode(apRef.current);
    addLog(
      `⏱️ OVERWATCH: ${player.name} drops into a defensive stance, reserving ${apRef.current} AP to interrupt enemy movement!`,
    );

    // Clear AP and End turn immediately
    setAp(0);
    handleEndPlayerTurn();
  };

  const getTileId = (cell: GridCell) => {
    switch (cell.type) {
      case "tnt_barrel":
        return 9; // Red TNT Barrel
      case "lantern":
        return 13; // Lantern
      case "fire":
        return 7; // Fireplace
      case "low_cover":
      case "boulder":
      case "crates":
      case "high_cover":
      case "table":
        return 5; // Crate
      case "wagon":
      case "mining_cart":
      case "wooden_wall":
      case "brick_wall":
      case "fence":
        return 4; // Dark Wood
      case "water_trough":
        return 14; // Water trough tile
      case "bar":
      case "rail":
      case "empty":
      default:
        return -1;
    }
  };

  const getCellBg = (cell: GridCell) => {
    let bgClasses = "";

    if (isAimingCannon && hasCannonMap && cell.x === 4 && cell.y === 4) {
      bgClasses = "border-dashed border-red-500";
    } else {
      const isPlayer = playerPos.x === cell.x && playerPos.y === cell.y;
      const enemyAt = enemies.find(
        (e) =>
          e.x === cell.x &&
          e.y === cell.y &&
          !e.isDead &&
          !e.isSurrendered &&
          !e.isUnconscious,
      );
      const isEnemyVisible = enemyAt ? isEnemySpottedByPlayer(enemyAt) : false;
      const visibleEnemy = isEnemyVisible ? enemyAt : null;
      const conqueredEnemyAt = enemies.find(
        (e) =>
          e.x === cell.x &&
          e.y === cell.y &&
          (e.isSurrendered || e.isUnconscious) &&
          !e.isDead,
      );

      if (isPlayer) {
        bgClasses = "border-[#e8b923] scale-[0.98] shadow-inner font-serif";
      } else if (visibleEnemy) {
        if (visibleEnemy.id === selectedEnemyId && fireAnim)
          bgClasses = "border-white text-white animate-ping";
        else bgClasses = "border-[#c4451a] hover:opacity-80";
      } else if (conqueredEnemyAt) {
        bgClasses = "border-[#1ac47c]/30 hover:opacity-80";
      } else if (hasCannonMap && cell.x === 4 && cell.y === 4) {
        bgClasses = "border-amber-500 text-amber-500 animate-pulse font-serif";
      } else {
        switch (cell.type) {
          case "cactus":
            bgClasses = "border-[#4d1a1a] text-green-500 animate-pulse";
            break;
          case "camp_fire":
            bgClasses =
              "border-orange-500 text-orange-500 animate-pulse shadow-[0_0_15px_rgba(249,115,22,0.6)]";
            break;
          case "lantern":
            bgClasses =
              "border-yellow-500 text-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.5)]";
            break;
          case "fire":
            bgClasses =
              "border-red-500 text-yellow-400 animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.7)]";
            break;
          case "tnt_barrel":
            bgClasses =
              "border-red-800 text-red-500 font-extrabold animate-pulse";
            break;
          case "rail" as any:
            bgClasses =
              "border-y-2 border-dashed border-[#543b2a] text-[#664d36]";
            break;
          case "rubble":
            bgClasses =
              "border-dashed border-[#bfae96] text-[#664d36] opacity-60";
            break;
          default:
            bgClasses = "border-[#bfae96]/20 hover:opacity-80";
            break;
        }
      }
    }

    if (isNight) {
      if (!isCellIlluminatedAtNight(cell.x, cell.y)) {
        // Obscured cell
        bgClasses +=
          " brightness-[0.2] saturate-0 shadow-[inset_0_0_20px_rgba(0,0,0,0.9)] !border-[#222222]";
      } else {
        // Illuminated night cell with warm atmospheric glow
        bgClasses += " z-10 shadow-[0_0_25px_rgba(232,185,35,0.4)] relative";

        // Use a dark gray border for illuminated tiles, but don't force override
        // special cells like the active glowing lantern or fire.
        if (
          cell.type !== "lantern" &&
          cell.type !== "camp_fire" &&
          cell.type !== "fire"
        ) {
          bgClasses += " !border-[#444444]";
        }
      }
    }

    const distToPlayer = Math.hypot(cell.x - playerPos.x, cell.y - playerPos.y);
    if (!isNight) {
      if (combatWeather.id === "fog" && distToPlayer > 3.5) {
        bgClasses += " !opacity-40 blur-[1px] saturate-0 sepia-[0.5]";
      } else if (combatWeather.id === "lightning_storm" && distToPlayer > 5.5) {
        bgClasses += " brightness-50 contrast-125";
      } else if (combatWeather.id === "desert_mirage" && distToPlayer > 3) {
        bgClasses += " brightness-110 contrast-125 blur-[0.5px] sepia-[0.2]";
      } else if (combatWeather.id === "overcast") {
        bgClasses += " grayscale saturate-0";
      } else if (combatWeather.id === "blinding_sun") {
        bgClasses += " brightness-125 contrast-150 saturate-150";
      }
    }

    return bgClasses;
  };

  const activeEnemiesCount = enemies.filter(
    (e) => !e.isDead && !e.isSurrendered && !e.isUnconscious,
  ).length;

  // Filter player saddlebag inventories for alternate arms
  const alternateWeapons = player.inventory.filter((i) => i.type === "weapon");

  if (isDuelActive) {
    const playerDuelist = duelParticipants.find((p) => p.isPlayer);
    const activeDuelist = duelParticipants[activeDuelPointer];

    return (
      <div className="relative w-full min-h-[580px] bg-stone-950 text-[#1a130f] border border-[#bfae96]/60 rounded-md overflow-hidden flex flex-col justify-between shadow-2xl select-none">
        {/* GUNSHOT FLASH OVERLAY */}
        {duelFlash && (
          <div className="absolute inset-0 bg-white z-50 pointer-events-none transition-opacity duration-300 animate-pulse" />
        )}

        {/* BACKGROUND ART WITH CINEMATIC VIGNETTE */}
        <div className="absolute inset-0 bg-[#3d2d21]/20 z-0"></div>
        <div
          className="absolute inset-0 bg-cover bg-center opacity-80 pointer-events-none z-0 mix-blend-luminosity"
          style={{ backgroundImage: `url(${cowboyDuelBg})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-transparent pointer-events-none z-0" />

        {/* TOP TIMELINE HEADER */}
        <div className="relative z-10 w-full bg-[#120a06]/95 border-b border-[#bfae96]/80 p-3 shadow text-center">
          <h1 className="font-serif font-black text-sm md:text-base uppercase tracking-[0.2em] text-[#8c6b0c]">
            {duelStage === "intro"
              ? "The Standoff"
              : duelStage === "drawing"
                ? "Draw!"
                : duelStage === "shooting_sequence"
                  ? "High Noon Showdown"
                  : duelStage === "summary"
                    ? "Smoke Clears"
                    : "Disarmed"}
          </h1>
          <div className="text-[10px] uppercase font-serif tracking-widest text-[#664d36] mt-1 mb-2">
            Velocity Sequence (Sorted by Agility)
          </div>
          <div className="flex items-center justify-center gap-2 overflow-x-auto py-1">
            {duelParticipants.map((p, idx) => {
              const isActive =
                idx === activeDuelPointer && duelStage === "shooting_sequence";
              const isNext = duelStage === "intro" && idx === 0;
              return (
                <div
                  key={p.id}
                  className={`flex items-center gap-1.5 py-1 px-3 rounded text-[10px] font-mono border transition-all shrink-0 ${
                    p.isDead
                      ? "bg-red-950/20 border-red-900/40 text-red-500/60 line-through"
                      : p.isSurrendered
                        ? "bg-blue-950/20 border-blue-900/40 text-blue-400"
                        : isActive || isNext
                          ? "bg-[#c4451a]/20 border-[#e8b923] text-[#8c6b0c] font-bold animate-pulse shadow-[0_0_10px_rgba(232,185,35,0.2)]"
                          : "bg-stone-950/80 border-[#bfae96] text-[#5a4838]"
                  }`}
                >
                  <span>
                    {idx + 1}. {p.isPlayer ? "You" : p.name}
                  </span>
                  <span className="opacity-60 hidden md:inline">
                    ({p.agility} AGI)
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* CINEMATIC STAGE */}
        <div className="relative z-10 flex-1 flex flex-col justify-end pb-8 px-4 md:px-12">
          {duelStage === "intro" && (
            <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
              <h2 className="text-[#8c6b0c] font-serif font-black text-5xl md:text-7xl uppercase tracking-widest drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)] animate-pulse text-center">
                DRAW!
                <div className="text-xl md:text-2xl text-red-500 mt-4 tracking-normal bg-black/60 px-6 py-2 rounded-full border border-red-900/50 backdrop-blur-sm">
                  {duelParticipants[0]?.isPlayer
                    ? "You have the drop!"
                    : `${duelParticipants[0]?.name} draws first!`}
                </div>
              </h2>
            </div>
          )}

          <div className="flex justify-between items-end w-full h-[220px]">
            {/* PLAYER */}
            <div className="relative flex gap-4 md:gap-8 overflow-visible h-full items-end justify-start flex-1 pr-12 pb-2">
              {duelParticipants
                .filter((p) => p.isPlayer)
                .map((p) => (
                  <div
                    key={p.id}
                    className={`relative flex flex-col items-center transition-all duration-500 ${activeDuelist?.id === p.id && duelStage === "shooting_sequence" ? "scale-110 z-20" : "scale-100 z-10"} ${p.hp <= 0 ? "opacity-30 grayscale blur-[2px]" : ""}`}
                  >
                    {p.id === "player" && playerHitPopup && (
                      <div
                        key={playerHitPopup.id}
                        className="absolute -top-12 z-[100] w-max max-w-[120px] bg-white border border-gray-300 rounded px-2 py-1 shadow-[0_0_10px_rgba(0,0,0,0.5)] flex items-center justify-center animate-bounce"
                      >
                        <span className="text-[10px] font-bold text-red-700 text-center uppercase tracking-tight leading-tight">
                          Ouch! ({playerHitPopup.text})
                        </span>
                        <div className="absolute top-[100%] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[4px] border-l-transparent border-t-[5px] border-t-white border-r-[4px] border-r-transparent drop-shadow-sm"></div>
                      </div>
                    )}
                    {p.id === "player" ? (
                      <img
                        src="/images/overland_1780566810461.png"
                        className={`h-40 md:h-56 object-contain filter drop-shadow-[0_10px_15px_rgba(0,0,0,0.8)] transition-all duration-300 ${activeDuelist?.id === p.id && duelStage === "shooting_sequence" ? "brightness-125" : "brightness-90"} ${p.hp <= 0 ? "rotate-90 translate-y-12" : ""} ${duelStage === "drawing" ? "-translate-y-6 -rotate-6 scale-110 brightness-150" : ""}`}
                        style={{ imageRendering: "pixelated" }}
                      />
                    ) : (
                      <img
                        src={getTacticalImage(p)}
                        className={`h-32 md:h-48 object-contain filter drop-shadow-[0_10px_15px_rgba(0,0,0,0.8)] transition-all duration-300 ${activeDuelist?.id === p.id && duelStage === "shooting_sequence" ? "brightness-125" : "brightness-90"} ${p.hp <= 0 ? "rotate-90 translate-y-12" : ""} ${duelStage === "drawing" ? "-translate-y-6 -rotate-6 scale-110 brightness-150" : ""}`}
                        style={{ imageRendering: "pixelated" }}
                      />
                    )}
                    <div
                      className={`absolute -bottom-6 ${p.id === "player" ? "w-48" : "w-24 md:w-32"} text-center bg-[#120a06]/95 border-b-2 border-t-2 ${p.id === "player" ? "border-[#e8b923]/40" : "border-[#e8b923]/20"} p-2 shadow-2xl backdrop-blur-sm`}
                    >
                      <h3
                        className={`text-[#8c6b0c] font-serif font-black uppercase tracking-wider truncate ${p.id === "player" ? "text-xs" : "text-[9px] md:text-[10px]"}`}
                      >
                        {p.name}
                      </h3>
                      <div className="w-full bg-red-950/60 h-1.5 mt-2 rounded overflow-hidden">
                        <div
                          className="bg-red-600 h-full rounded transition-all"
                          style={{
                            width: `${Math.max(0, (p.hp / p.maxHp) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
            </div>

            {/* ENEMIES */}
            <div className="relative flex gap-4 md:gap-8 overflow-visible h-full items-end justify-end flex-1 pl-12 pb-2">
              {duelParticipants
                .filter((p) => !p.isPlayer)
                .map((p) => (
                  <div
                    key={p.id}
                    className={`relative flex flex-col items-center transition-all duration-500 ${activeDuelist?.id === p.id && duelStage === "shooting_sequence" ? "scale-110 z-20" : "scale-100 z-10"} ${p.isDead || p.isSurrendered ? "opacity-30 grayscale blur-[1px]" : "opacity-100"}`}
                  >
                    {p.portrait ? (
                      <div
                        className={`h-32 md:h-48 text-[70px] md:text-[100px] leading-none drop-shadow-[0_10px_15px_rgba(0,0,0,0.8)] flex items-end justify-center filter transition-all duration-300 ${activeDuelist?.id === p.id && duelStage === "shooting_sequence" ? "brightness-125" : "brightness-90"} ${p.isDead ? "-rotate-90 translate-y-12" : p.isSurrendered ? "brightness-50" : ""} ${duelStage === "drawing" ? "brightness-150" : ""}`}
                        style={{
                          transform: p.isDead
                            ? "scaleX(-1) rotate(-90deg) translateY(3rem)"
                            : duelStage === "drawing"
                              ? "scaleX(-1) translateY(-1.5rem) scale(1.1) rotate(6deg)"
                              : "scaleX(-1)",
                        }}
                      >
                        {p.portrait}
                      </div>
                    ) : (
                      <img
                        src={getTacticalImage(p)}
                        className={`h-32 md:h-48 object-contain filter drop-shadow-[0_10px_15px_rgba(0,0,0,0.8)] transition-all duration-300 ${activeDuelist?.id === p.id && duelStage === "shooting_sequence" ? "brightness-125" : "brightness-90"} ${p.isDead ? "-rotate-90 translate-y-12" : p.isSurrendered ? "brightness-50" : ""} ${duelStage === "drawing" ? "brightness-150" : ""}`}
                        style={{
                          imageRendering: "pixelated",
                          transform: p.isDead
                            ? "scaleX(-1) rotate(-90deg) translateY(3rem)"
                            : duelStage === "drawing"
                              ? "scaleX(-1) translateY(-1.5rem) scale(1.1) rotate(6deg)"
                              : "scaleX(-1)",
                        }}
                      />
                    )}
                    <div
                      className={`absolute -bottom-6 w-24 md:w-32 text-center bg-[#120a06]/90 border-b-2 border-t-2 ${p.isDead ? "border-red-900/40" : p.isSurrendered ? "border-blue-900/40" : "border-red-900/80"} p-2 shadow-2xl backdrop-blur-sm`}
                    >
                      <h3 className="text-[#2d2119] font-serif font-bold uppercase text-[9px] md:text-[10px] truncate">
                        {p.name}
                      </h3>
                      <div className="w-full bg-red-950/60 h-1 mt-1.5 rounded overflow-hidden">
                        <div
                          className="bg-red-600 h-full rounded transition-all"
                          style={{
                            width: `${Math.max(0, (p.hp / p.maxHp) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* BOTTOM ACTION PANEL */}
        <div className="relative z-20 w-full min-h-[140px] bg-gradient-to-t from-stone-950 to-stone-950/90 border-t border-[#bfae96]/60 p-4 shrink-0 flex flex-col items-center justify-center">
          {duelStage === "intro" && (
            <div className="text-center w-full max-w-sm space-y-4">
              <p className="text-[11px] font-serif uppercase tracking-widest text-[#4a3928] italic">
                Tension mounts under a blazing sun...
              </p>
              <div className="flex gap-4">
                <button
                  onClick={startDrawAnimation}
                  className="px-6 py-2 bg-[#e8b923] hover:bg-amber-500 text-stone-900 rounded font-serif font-black uppercase text-sm w-full shadow-lg"
                >
                  DRAW!
                </button>
                <button
                  onClick={handleHitTheDirt}
                  className="px-6 py-2 bg-[#1e293b] hover:bg-slate-700 text-sky-200 border border-sky-500/50 rounded font-serif font-black uppercase text-sm w-full shadow-lg transition-colors"
                >
                  Hit the Dirt
                </button>
              </div>
            </div>
          )}

          {duelStage === "shooting_sequence" && activeDuelist && (
            <div className="w-full max-w-2xl mx-auto">
              {activeDuelist.isPlayer ? (
                <div className="text-center py-4 space-y-4 max-w-sm mx-auto">
                  <div className="inline-flex items-center justify-center gap-3 w-full">
                    <p className="text-[#8c6b0c] text-[16px] font-serif uppercase tracking-widest font-black animate-pulse bg-black/60 p-2 rounded shadow">
                      {activeDuelist.id === "player"
                        ? `YOUR TURN! ${player.name.toUpperCase()} IS AIMING...`
                        : `${activeDuelist.name.toUpperCase()} IS AIMING...`}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 space-y-4 max-w-sm mx-auto">
                  <div className="inline-flex items-center justify-center gap-3 w-full">
                    <p className="text-red-500 text-sm font-serif uppercase tracking-widest font-bold bg-black/60 p-2 rounded shadow">
                      {activeDuelist.name} is aiming...
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {duelLogs.length > 0 &&
            (duelStage === "shooting_sequence" || duelStage === "summary") && (
              <div className="w-full max-w-2xl mx-auto mt-4 mb-2 bg-[#1a100c]/80 border border-[#bfae96] rounded p-2 text-center text-[10px] md:text-[11px] text-[#4a3928] font-mono shadow-inner">
                {duelLogs[duelLogs.length - 1]}
              </div>
            )}

          {duelStage === "summary" && (
            <div className="w-full max-w-sm mx-auto text-center space-y-4">
              <h3 className="text-[#2d2119] font-serif font-black uppercase tracking-[0.2em] text-sm">
                {playerHp <= 0
                  ? "Tragic End"
                  : duelParticipants.filter(
                        (p) => !p.isPlayer && !p.isDead && !p.isSurrendered,
                      ).length === 0
                    ? "Bounty Secured"
                    : "The Smoke Clears"}
              </h3>

              {playerHp <= 0 ? (
                <button
                  onClick={() => onDefeatRef.current()}
                  className="py-3 px-8 text-xs font-serif font-black uppercase tracking-widest bg-red-900 hover:bg-red-950 border-2 border-red-600 text-white rounded cursor-pointer w-full transition-all"
                >
                  ☠️ Trail Ends Here
                </button>
              ) : duelParticipants.filter(
                  (p) => !p.isPlayer && !p.isDead && !p.isSurrendered,
                ).length === 0 ? (
                <button
                  onClick={() => {
                    const droppedItems: InventoryItem[] = [];
                    if (Math.random() < 0.5) {
                      droppedItems.push({
                        id: "whiskey",
                        name: "Premium Whiskey",
                        type: "consumable",
                        value: 20,
                        count: 1,
                        details: "Restores 25 HP. (Weight: 1 lb)",
                      });
                    }
                    onVictoryRef.current(
                      10 + Math.random() * 20,
                      50,
                      playerHp,
                      playerClip,
                      playerReserveAmmo,
                      duelParticipants
                        .filter(
                          (p) => p.isPlayer && p.id !== "player" && !p.isDead,
                        )
                        .map((p) => p.id),
                      0,
                      playerInjuries,
                      droppedItems,
                    );
                  }}
                  className="py-3 px-6 text-xs font-serif font-black uppercase tracking-widest bg-emerald-700 hover:bg-emerald-800 border-2 border-emerald-400 text-white rounded cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.3)] w-full transition-all hover:scale-105"
                >
                  🏆 Collect Bounty
                </button>
              ) : (
                <button
                  onClick={handleTransitionToTactical}
                  className="py-3 px-6 text-xs font-serif font-black uppercase tracking-widest bg-[#c4451a] hover:bg-[#a63412] border-2 border-[#e8b923]/40 text-[#8c6b0c] rounded cursor-pointer shadow-[0_0_15px_rgba(196,69,26,0.5)] w-full transition-all hover:scale-[1.02]"
                >
                  🔌 Seek Cover (Tactical Phase)
                </button>
              )}
            </div>
          )}

          {duelStage === "surrendered" && (
            <div className="w-full max-w-sm mx-auto text-center space-y-4">
              <h3 className="text-red-500 font-serif font-black uppercase tracking-[0.2em] text-sm">
                Surrendered
              </h3>
              <p className="text-[11px] text-zinc-400 font-serif italic mb-4">
                You dropped your weapons. The law collects your belongings.
              </p>
              <button
                onClick={onDefeat}
                className="py-3 px-8 text-xs font-serif font-extrabold uppercase tracking-widest bg-[#d4cbba] hover:bg-[#c6ba9f] border border-[#bfae96] text-red-500 rounded cursor-pointer w-full transition-all"
              >
                ⛓️ Accept Fate
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-full relative">
      {/* CLICK-EMPTY FULL SCREEN WARNING OVERLAY */}
      {clickEmptyActive && (
        <div className="absolute inset-0 bg-red-950/40 backdrop-blur-sm z-50 flex items-center justify-center pointer-events-none animate-bounce">
          <div className="bg-black/95 border-2 border-red-600 rounded-lg p-6 py-8 text-center max-w-sm mx-auto shadow-2xl relative">
            <h2 className="text-xl font-extrabold text-red-500 uppercase tracking-widest font-serif">
              ⚠️ CLICK - EMPTY!
            </h2>
            <p className="text-xs text-[#2d2119] font-mono mt-2">
              Peacemaker cylinder is out of brass cartridges! {player.name} must
              pull the lever & Reload.
            </p>
          </div>
        </div>
      )}
      {/* 2D Grid Section */}
      <div className="lg:col-span-8 bg-[#f4ead5] border border-[#bfae96] rounded-sm p-4 flex flex-col justify-between text-center min-h-[460px] shadow-xl">
        {/* Banner */}
        <div className="flex justify-between items-center pb-2 border-b border-[#bfae96] mb-2 text-xs flex-wrap gap-2">
          <div className="flex items-center gap-1.5">
            <Skull size={14} className="text-[#c4451a]" />
            <span className="text-[#8c6b0c] font-serif font-bold uppercase tracking-widest">
              Tactical Outlaw Crossfire Map
            </span>
          </div>

          <div className="flex gap-4 text-[#664d36] font-serif uppercase tracking-wider font-semibold">
            <span>
              Enemies Remain:{" "}
              <b className="text-[#c4451a] font-mono">{activeEnemiesCount}</b>
            </span>
            <span>
              Firing Turn:{" "}
              <b className="text-[#8c6b0c]">
                {turn === "player"
                  ? `🤠 ${player.name}`
                  : "🤖 Deputies / Outlaws"}
              </b>
            </span>
          </div>
        </div>

        {/* Turn Order Queue */}
        <div className="flex items-center gap-2 mb-3 bg-[#1e1410]/5 p-2 rounded border border-[#bfae96] overflow-x-auto shadow-inner w-full custom-scrollbar">
          <span className="text-[10px] uppercase font-serif tracking-widest text-[#a85a32] flex-shrink-0 font-bold mr-1">
            Action Queue:
          </span>
          <div
            className={`px-3 py-1.5 text-[10px] font-bold font-serif uppercase rounded border flex items-center gap-1.5 flex-shrink-0 transition-all ${turn === "player" ? "bg-[#c4451a] text-white border-red-950 scale-[1.02] shadow-md" : "bg-transparent text-[#a85a32] border-[#c4451a]/40 opacity-70"}`}
          >
            <img
              src="/images/overland_1780566810461.png"
              className="h-3 object-contain brightness-0 opacity-80"
              style={{
                filter:
                  turn === "player" ? "invert(1)" : "grayscale(1) contrast(2)",
              }}
            />
            <span>{turn === "player" ? "YOUR TURN" : player.name}</span>
          </div>

          {enemies
            .filter((e) => !e.isDead && !e.isSurrendered && !e.isUnconscious)
            .map((e, idx) => {
              const EnemyIcon =
                e.type === "scorpion" ? "🦂" : getTacticalImage(e);
              const isActive = turn === "enemy" && idx === activeAiEnemyIndex;

              return (
                <div
                  key={e.id}
                  className={`px-2 py-1.5 text-[9px] font-bold font-serif uppercase rounded border flex-shrink-0 transition-all flex items-center gap-1 ${isActive ? "bg-[#5a4838] text-white border-[#3d2d21] scale-[1.02] shadow-md" : "bg-transparent text-[#8c6b0c] border-[#bfae96] opacity-60"}`}
                >
                  {e.type === "scorpion" ? (
                    <span className="text-sm">{EnemyIcon as string}</span>
                  ) : (
                    <img
                      src={EnemyIcon as string}
                      className="h-4 w-4 object-contain"
                    />
                  )}
                  <span className="truncate max-w-[80px]" title={e.name}>
                    {e.name}
                  </span>
                </div>
              );
            })}
        </div>

        {/* Procedural Environment Dashboard */}
        <div
          id="procedural-env-dashboard"
          className="grid grid-cols-3 gap-2 mb-2"
        >
          <div
            id="env-card-biome"
            onClick={() => setShowEnvModal(true)}
            className="bg-[#120c0a]/95 border border-[#bfae96] hover:border-amber-500 hover:bg-[#1a120e]/95 cursor-pointer transition-colors p-1.5 rounded-sm flex items-center gap-1.5"
          >
            <span className="text-sm p-1 bg-[#1e1410] rounded border border-[#e8b923]/20 shadow">
              {combatBiome.icon}
            </span>
            <div className="flex flex-col text-left overflow-hidden">
              <span className="text-[6.5px] text-[#664d36] uppercase font-serif tracking-widest font-extrabold leading-none mb-0.5">
                Arena
              </span>
              <span className="text-[9.5px] text-[#8c6b0c] font-bold font-serif leading-none truncate">
                {combatBiome.name}
              </span>
            </div>
          </div>
          <div
            id="env-card-weather"
            onClick={() => setShowEnvModal(true)}
            className="bg-[#120c0a]/95 border border-[#bfae96] hover:border-amber-500 hover:bg-[#1a120e]/95 cursor-pointer transition-colors p-1.5 rounded-sm flex items-center gap-1.5"
          >
            <span className="text-sm p-1 bg-[#1e1410] rounded border border-[#e8b923]/20 shadow">
              {combatWeather.icon}
            </span>
            <div className="flex flex-col text-left overflow-hidden">
              <span className="text-[6.5px] text-[#664d36] uppercase font-serif tracking-widest font-extrabold leading-none mb-0.5">
                Climate
              </span>
              <span className="text-[9.5px] text-sky-400 font-bold font-serif leading-none truncate">
                {combatWeather.name}
              </span>
            </div>
          </div>
          <div
            id="env-card-time"
            onClick={() => setShowEnvModal(true)}
            className="bg-[#120c0a]/95 border border-[#bfae96] hover:border-amber-500 hover:bg-[#1a120e]/95 cursor-pointer transition-colors p-1.5 rounded-sm flex items-center gap-1.5"
          >
            <span className="text-sm p-1 bg-[#1e1410] rounded border border-[#e8b923]/20 shadow">
              {isNight ? "🌙" : "☀️"}
            </span>
            <div className="flex flex-col text-left overflow-hidden">
              <span className="text-[6.5px] text-[#664d36] uppercase font-serif tracking-widest font-extrabold leading-none mb-0.5">
                Time
              </span>
              <span className="text-[9.5px] text-orange-300 font-bold font-serif leading-none truncate">
                {isNight ? "Nightfall - Low Vis" : "Daylight"}
              </span>
            </div>
          </div>
        </div>

        {/* Realtime Action combat log (Moved from below) */}
        <div className="mb-3 bg-[#1e1410] border-l-4 border-[#e8b923] p-3 text-left rounded-sm flex flex-col shadow-inner min-h-[50px] border border-[#bfae96]/30">
          <div className="flex justify-between items-center border-b border-[#bfae96]/20 pb-1 mb-1.5">
            <span className="text-[9px] font-serif text-[#e8b923] uppercase tracking-widest font-bold">
              Action Feedback Console
            </span>
          </div>

          <div className="flex-1 overflow-hidden space-y-1 font-mono text-[9.5px] pr-1 flex flex-col justify-end">
            {combatLogs
              .slice(-2)
              .reverse()
              .map((log, lIdx) => (
                <div
                  key={lIdx}
                  className={`leading-tight truncate ${lIdx === 0 ? "text-[#c4451a] font-bold opacity-100" : "text-zinc-400 opacity-80"}`}
                  title={log}
                >
                  <span className="mr-1">{lIdx === 0 ? "▶" : "·"}</span>
                  {log}
                </div>
              ))}
          </div>
        </div>

        {/* Tactical board */}
        <div className="flex-1 flex items-center justify-center p-2">
          <div
            className={`grid gap-1 max-w-[380px] w-full aspect-square ${isNight ? "bg-[#111111]" : "bg-[#dcd1b9]/90"} p-3 rounded-sm shadow-2xl relative border-2 transition-all duration-500 ${
              isNight ? "border-[#222222]" : "border-[#bfae96]"
            }`}
            style={{
              gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
            }}
          >
            <svg
              className="absolute inset-[12px] pointer-events-none z-[100]"
              style={{
                width: "calc(100% - 24px)",
                height: "calc(100% - 24px)",
              }}
            >
              {shootLines.map((l) => (
                <line
                  key={l.id}
                  x1={`${((l.sx + 0.5) / GRID_SIZE) * 100}%`}
                  y1={`${((l.sy + 0.5) / GRID_SIZE) * 100}%`}
                  x2={`${((l.tx + 0.5) / GRID_SIZE) * 100}%`}
                  y2={`${((l.ty + 0.5) / GRID_SIZE) * 100}%`}
                  stroke={l.color}
                  strokeWidth="2.5"
                  strokeDasharray="4 4"
                  className="animate-pulse"
                />
              ))}
            </svg>
            {grid.map((cell) => {
              const isPlayer = playerPos.x === cell.x && playerPos.y === cell.y;

              // Only query visible enemies for main active placement
              const enemyAt = enemies.find(
                (e) =>
                  e.x === cell.x &&
                  e.y === cell.y &&
                  !e.isDead &&
                  !e.isSurrendered &&
                  !e.isUnconscious,
              );
              const isEnemyInCone = enemyAt
                ? isEnemySpottedByPlayer(enemyAt)
                : false;
              const visibleEnemyAt = isEnemyInCone ? enemyAt : null;

              // Query hidden active enemies that might have their last known location here
              const hiddenActiveEnemies = enemies.filter(
                (e) =>
                  !e.isDead &&
                  !e.isSurrendered &&
                  !e.isUnconscious &&
                  !isEnemySpottedByPlayer(e),
              );
              const matchedHiddenEnemy = hiddenActiveEnemies.find((e) => {
                const known = lastKnownLocations[e.id];
                return known && known.x === cell.x && known.y === cell.y;
              });

              const conqueredEnemyAt = enemies.find(
                (e) =>
                  e.x === cell.x &&
                  e.y === cell.y &&
                  (e.isSurrendered || e.isUnconscious) &&
                  !e.isDead,
              );
              const isCannonSpot = hasCannonMap && cell.x === 4 && cell.y === 4;

              const inPlayerCone = isCellInVisionCone(
                playerPos.x,
                playerPos.y,
                cell.x,
                cell.y,
                facing,
              );
              const inEnemyCone = enemies.some(
                (e) =>
                  !e.isDead &&
                  !e.isSurrendered &&
                  isCellInVisionCone(
                    e.x,
                    e.y,
                    cell.x,
                    cell.y,
                    e.facing || "down",
                  ),
              );

              const handleCellClick = () => {
                if (
                  playerHp <= 0 ||
                  turn !== "player" ||
                  apRef.current <= 0 ||
                  fireAnim
                )
                  return;

                // Cannon target mode take over
                if (isAimingCannon) {
                  handleFireCannonShell(cell.x, cell.y);
                  return;
                }

                // Dynamite target mode take over
                if (isAimingDynamite) {
                  handleThrowDynamite(cell.x, cell.y);
                  return;
                }

                if (visibleEnemyAt) {
                  const dist = Math.hypot(
                    playerPos.x - visibleEnemyAt.x,
                    playerPos.y - visibleEnemyAt.y,
                  );
                  if (dist <= 1.5 && playerClip <= 0) {
                    handleMeleeAttack(visibleEnemyAt);
                  } else {
                    handleShootEnemy(visibleEnemyAt);
                  }
                } else if (
                  cell.hp !== undefined &&
                  cell.type !== "empty" &&
                  cell.type !== "rubble"
                ) {
                  const isExplosive = cell.type === "tnt_barrel";
                  const isFireSource =
                    cell.type === "lantern" || cell.type === "camp_fire";
                  handleShootEnvironment(
                    cell.x,
                    cell.y,
                    cell.type,
                    isExplosive,
                    isFireSource,
                  );
                } else {
                  handleMove(cell.x, cell.y);
                }
              };

              let hitChanceOverlay = null;
              if (visibleEnemyAt && turn === "player" && !isAimingCannon) {
                let overlayPct = 0;
                let apCost = hasScope ? 6 : 3;
                const isPistol = player.weapon.ammoType === "pistol" || !player.weapon.ammoType;
                if (isPistol && player.perks.includes("fanning")) {
                  apCost = Math.max(1, apCost - 1);
                }

                const dist = Math.hypot(
                  playerPos.x - visibleEnemyAt.x,
                  playerPos.y - visibleEnemyAt.y,
                );
                if (dist <= 1.5 && playerClip <= 0) {
                  overlayPct = 90; // Knife chance
                  apCost = 2; // Knife ap
                } else {
                  // Firearm
                  const calc = calculateHitChance(
                    playerPos.x,
                    playerPos.y,
                    visibleEnemyAt.x,
                    visibleEnemyAt.y,
                    0.8,
                    player.weapon.range,
                  );
                  overlayPct = Math.max(
                    10,
                    Math.min(95, Math.round(calc.value * 100)),
                  );
                }

                hitChanceOverlay = (
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-[#2d1b0a] border border-[#a26829] text-[#e8dec7] font-bold text-[8px] font-sans px-1.5 py-0.5 rounded-sm whitespace-nowrap z-50 flex items-center gap-1 shadow-lg pointer-events-none">
                    <span className={overlayPct > 50 ? "text-green-400" : "text-amber-500"}>{overlayPct}% Hit</span>
                    <span className="text-[#a89073]">|</span>
                    <span className={apRef.current >= apCost ? "text-sky-300" : "text-red-500"}>-{apCost} AP</span>
                  </div>
                );
              }

              return (
                <button
                  id={`grid-cell-${cell.x}-${cell.y}`}
                  key={`${cell.x}-${cell.y}`}
                  onClick={handleCellClick}
                  disabled={
                    playerHp <= 0 || turn !== "player" || apRef.current <= 0
                  }
                  className={`relative overflow-visible aspect-square border-2 rounded-sm transition-all flex flex-col items-center justify-center cursor-pointer ${getCellBg(cell)} ${isPlayer || visibleEnemyAt || conqueredEnemyAt ? "z-20" : "z-10"}`}
                >
                  {(() => {
                    const tileId = getTileId(cell);
                    if (tileId === -1) return null;
                    const sheetIndex = tileId;

                    const w = 100;
                    const h = 129;
                    const offsetX = 8;
                    const offsetY = -5;
                    const cols = 10;
                    const col = sheetIndex % cols;
                    const row = Math.floor(sheetIndex / cols);

                    const srcX = -(offsetX + col * w);
                    const srcY = -(offsetY + row * h);

                    return (
                      <svg
                        viewBox={`0 0 ${w} ${h}`}
                        className="absolute bottom-0 w-full z-0 pointer-events-none opacity-90 overflow-hidden"
                        style={{ height: `${(h / w) * 100}%` }}
                      >
                        <image
                          href={tilesetImg}
                          x={srcX}
                          y={srcY}
                          width="1380"
                          height="752"
                          style={{ imageRendering: "crisp-edges" }}
                        />
                      </svg>
                    );
                  })()}

                  {isPlayer && (
                    <div
                      id="combatant-cowboy"
                      className={`absolute inset-0 flex flex-col items-center justify-end overflow-visible pointer-events-none z-10 ${turn === "player" ? "animate-bounce" : ""}`}
                    >
                      {floatingText && (
                        <div
                          key={floatingText.id}
                          className="absolute -top-12 z-[100] w-max max-w-[120px] bg-white border border-gray-300 rounded px-2 py-1 shadow-[0_0_10px_rgba(0,0,0,0.5)] flex items-center justify-center animate-bounce"
                        >
                          <span className="text-[8px] font-bold text-[#8c6b0c] text-center uppercase tracking-tight leading-tight">
                            {floatingText.text}
                          </span>
                          <div className="absolute top-[100%] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[3px] border-l-transparent border-t-[4px] border-t-white border-r-[3px] border-r-transparent drop-shadow-sm"></div>
                        </div>
                      )}
                      {playerHitPopup && (
                        <div
                          key={playerHitPopup.id}
                          className="absolute -top-10 z-[100] w-max max-w-[100px] bg-white border border-gray-300 rounded px-1.5 py-1 shadow-[0_0_10px_rgba(0,0,0,0.5)] flex items-center justify-center animate-bounce"
                        >
                          <span className="text-[8px] font-bold text-red-700 text-center uppercase tracking-tight leading-tight">
                            Ouch! ({playerHitPopup.text})
                          </span>
                          <div className="absolute top-[100%] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[3px] border-l-transparent border-t-[4px] border-t-white border-r-[3px] border-r-transparent drop-shadow-sm"></div>
                        </div>
                      )}
                      <img
                        src="/images/overland_1780566810461.png"
                        alt="player"
                        draggable={false}
                        className={`h-10 md:h-12 w-auto object-contain drop-shadow-md select-none ${isNight && !isCellIlluminatedAtNight(playerPos.x, playerPos.y) ? "brightness-[2] contrast-150 drop-shadow-[0_0_8px_rgba(255,255,255,0.2)] opacity-80" : ""}`}
                        style={{ imageRendering: "pixelated" }}
                      />
                    </div>
                  )}

                  {visibleEnemyAt && (
                    <div
                      id={`combatant-enemy-${visibleEnemyAt.id}`}
                      className={`absolute inset-0 flex flex-col items-center justify-end overflow-visible pointer-events-none z-10 ${turn === "enemy" && activeAiEnemyIndex !== null && visibleEnemyAt.id === enemies.filter((e) => !e.isDead && !e.isSurrendered && !e.isUnconscious)[activeAiEnemyIndex]?.id ? "animate-bounce" : ""}`}
                    >
                      <span className="absolute -top-3 text-[8px] font-extrabold text-red-500 font-mono whitespace-nowrap">
                        {visibleEnemyAt.isSurrendered && "🙌"}
                        {visibleEnemyAt.stance === "crouching" && " 🧘"}
                        {visibleEnemyAt.stance === "lying" && " 🛌"}
                      </span>
                      {visibleEnemyAt.type === "scorpion" ? (
                        <span className="select-none text-2xl drop-shadow-md">
                          🦂
                        </span>
                      ) : (
                        <img
                          src={getTacticalImage(visibleEnemyAt)}
                          alt={visibleEnemyAt.type}
                          draggable={false}
                          className="h-10 md:h-12 w-auto object-contain mt-1 drop-shadow-md select-none"
                          style={{ imageRendering: "pixelated" }}
                        />
                      )}
                      {visibleEnemyAt.stance &&
                        visibleEnemyAt.stance !== "standing" && (
                          <span className="absolute -bottom-2 text-[5.5px] uppercase font-serif tracking-widest text-[#8c6b0c] opacity-80 select-none">
                            {visibleEnemyAt.stance}
                          </span>
                        )}
                    </div>
                  )}

                  {/* Render "?" named last known location marker if enemy is hidden outside player's vision cone */}
                  {!isPlayer &&
                    !visibleEnemyAt &&
                    !conqueredEnemyAt &&
                    matchedHiddenEnemy && (
                      <div className="text-[11px] font-bold font-mono flex flex-col items-center leading-none text-red-400 bg-red-950/10 p-0.5 rounded border border-red-900/40 animate-pulse">
                        <span
                          title={`last known location of ${matchedHiddenEnemy.name}`}
                          className="text-xs"
                        >
                          {player.posse?.some((p) => p.role === "Scout")
                            ? "👣"
                            : "❓"}
                        </span>
                        <span className="text-[6px] tracking-tighter uppercase text-[#5a4838] mt-0.5 leading-none">
                          {player.posse?.some((p) => p.role === "Scout")
                            ? "Tracked"
                            : "Last Known"}
                        </span>
                      </div>
                    )}

                  {conqueredEnemyAt && (
                    <div
                      id={`combatant-conquered-${conqueredEnemyAt.id}`}
                      className="text-sm font-bold font-mono flex flex-col items-center leading-none opacity-60"
                    >
                      <span className="text-[8px] font-extrabold text-emerald-400 font-mono mb-0.5">
                        {conqueredEnemyAt.isSurrendered
                          ? "🙌 SURRENDER"
                          : "💤 KO"}
                      </span>
                      <span>
                        {conqueredEnemyAt.isSurrendered ? "🏳️" : "😴"}
                      </span>
                    </div>
                  )}

                  {!isPlayer &&
                    !visibleEnemyAt &&
                    !matchedHiddenEnemy &&
                    !conqueredEnemyAt &&
                    isCannonSpot && (
                      <span className="text-sm select-none animate-pulse">
                        💣
                      </span>
                    )}

                  {!isPlayer &&
                    !visibleEnemyAt &&
                    !matchedHiddenEnemy &&
                    !conqueredEnemyAt &&
                    !isCannonSpot &&
                    cell.type !== "empty" &&
                    (cell.type === "rail" ? (
                      <span className="text-xs select-none tracking-widest opacity-40">
                        🛤️
                      </span>
                    ) : (
                      <div className="flex flex-col items-center leading-none">
                        {getTileId(cell) === -1 && (
                          <span className="text-xs select-none">
                            {cell.type === "tnt_barrel"
                              ? "🛢️"
                              : cell.type === "camp_fire"
                                ? "🔥"
                                : cell.type === "lantern"
                                  ? "🏮"
                                  : cell.type === "fire"
                                    ? "🔥"
                                    : cell.type === "rubble"
                                      ? "🪵"
                                      : cell.type === "low_cover"
                                        ? "📦"
                                        : cell.type === "high_cover"
                                          ? "🪨"
                                          : cell.type === "cactus"
                                            ? "🌵"
                                            : cell.type === "tree"
                                              ? "🌲"
                                              : cell.type === "wagon"
                                                ? "🛒"
                                                : cell.type === "crates"
                                                  ? "🧰"
                                                  : cell.type === "tombstone"
                                                    ? "🪦"
                                                    : cell.type === "fence"
                                                      ? "🚧"
                                                      : cell.type ===
                                                          "water_trough"
                                                        ? "🛁"
                                                        : cell.type ===
                                                            "boulder"
                                                          ? "⛰️"
                                                          : cell.type ===
                                                              "mining_cart"
                                                            ? "⛏️"
                                                            : cell.type ===
                                                                "wooden_wall"
                                                              ? "🪵"
                                                              : cell.type ===
                                                                  "brick_wall"
                                                                ? "🧱"
                                                                : cell.type ===
                                                                    "well"
                                                                  ? "🚰"
                                                                  : cell.type ===
                                                                      "table"
                                                                    ? "🪑"
                                                                    : cell.type ===
                                                                        "bar"
                                                                      ? "🍶"
                                                                      : cell.type ===
                                                                          "tent"
                                                                        ? "🎪"
                                                                        : cell.type ===
                                                                            "tipi"
                                                                          ? "⛺"
                                                                          : ""}
                          </span>
                        )}
                        {cell.hp !== undefined && (
                          <span className="text-[6px] font-mono mt-0.5 text-[#8c6b0c] relative z-20 mix-blend-multiply font-bold">
                            {cell.hp}
                          </span>
                        )}
                      </div>
                    ))}

                  {hitChanceOverlay}
                  {explosions.some((e) => e.x === cell.x && e.y === cell.y) && (
                    <div
                      className="absolute inset-0 z-50 animate-pulse transition-all mix-blend-overlay pointer-events-none"
                      style={{
                        backgroundColor: "rgb(255, 68, 0)",
                        opacity: 0.8,
                        boxShadow: "inset 0 0 15px 5px rgba(255, 255, 0, 0.8)",
                      }}
                    ></div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Grid HUD Details */}
        <div className="mt-4 border-t border-[#bfae96] pt-2 flex justify-between items-center text-[#664d36] text-[9.5px] uppercase font-serif tracking-wider leading-relaxed flex-wrap gap-2">
          <span>📦 Low Cover: -22% chance</span>
          <span>🪨 Bricks: -45% lock</span>
          <span>🌵 Desert Cactus: -6 HP needle</span>
          <span>🛤️ Steel Rails: +1 AP Cost</span>
          <span>💣 Central Cannon: High Area Dmg</span>
        </div>
      </div>

      {/* Control Panel (Console Controls & Logs side) */}
      <div className="lg:col-span-4 flex flex-col gap-4 bg-[#f4ead5] border border-[#bfae96] p-5 rounded-sm justify-between shadow-xl">
        {/* Stats and Action Dashboard */}
        <div className="space-y-4">
          <div className="flex border-b border-[#bfae96] pb-2.5 items-center justify-between">
            <span className="text-[10px] font-serif font-bold tracking-widest text-[#664d36] uppercase">
              Action Dashboard
            </span>
            {/* Visual AP Pips */}
            <span className="flex items-center gap-1.5 px-2 py-1 bg-[#dcd1b9] border border-[#bfae96] rounded-sm shadow-md">
              {Array.from({
                length: Math.min(
                  20,
                  Math.round(
                    7 +
                      (player.campMovementLvl || 0) +
                      Math.max(0, player.level - 1) * 0.5,
                  ),
                ) - (isLegInjured ? 2 : 0)
              }).map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2.5 sm:w-2.5 sm:h-3.5 rounded-[1px] border ${
                    i < ap 
                      ? "bg-[#c4451a] border-[#6b1e06] shadow-[0_0_3px_#c4451a]" 
                      : "bg-[#bfae96]/30 border-[#bfae96]/50"
                  }`}
                />
              ))}
            </span>
          </div>

          {/* Actor health bar progress */}
          <div className="bg-[#dfd4bd] p-4 rounded-sm border border-[#bfae96] space-y-2.5 shadow-md">
            <div className="flex justify-between items-center">
              <span className="text-[#664d36] flex items-center gap-1 font-bold font-serif text-[10px] tracking-wider">
                <Heart size={11} className="text-[#c4451a] fill-current" />{" "}
                STAMINA (HP)
              </span>
              <span className="text-[#c4451a] font-bold font-mono">
                {playerHp} / {player.maxHp}
              </span>
            </div>

            <div className="w-full h-2.5 bg-[#2d0a0a] rounded-full mt-1 border border-[#4d1a1a] overflow-hidden">
              <div
                className="h-full bg-[#c4451a] transition-all duration-300 shadow-[0_0_8px_#c4451a]"
                style={{
                  width: `${Math.max(0, Math.min(100, (playerHp / player.maxHp) * 100))}%`,
                }}
              />
            </div>

            {/* Visual Body Integrity */}
            <div className="flex flex-row items-center border-t border-[#bfae96] pt-2 mt-2">
              <BodySilhouette injuries={playerInjuries} />
              <div className="flex flex-col ml-3 text-[9px] font-mono uppercase text-[#4a3928] gap-1">
                <span className="font-bold flex items-center gap-1">
                  <div className="w-2 h-2 bg-[#9ca3af] rounded-full"></div>{" "}
                  Clean
                </span>
                <span className="font-bold flex items-center gap-1">
                  <div className="w-2 h-2 bg-[#eab308] rounded-full"></div>{" "}
                  Injured
                </span>
                <span className="font-bold flex items-center gap-1">
                  <div className="w-2 h-2 bg-[#f97316] rounded-full"></div>{" "}
                  Mangled
                </span>
                <span className="font-bold flex items-center gap-1">
                  <div className="w-2 h-2 bg-[#ef4444] rounded-full"></div>{" "}
                  Crippled
                </span>
              </div>
            </div>

            <div className="flex justify-between text-[10px] pt-2 border-t border-[#bfae96]/40 text-[#4a3928] uppercase tracking-wider font-serif mb-2">
              <span>Baggage: {totalWeight} / 40 lbs</span>
              <span>
                Revolver clip: {playerClip} /{" "}
                {player.weapon.maxClip +
                  (player.weaponUpgrades?.clipBonus || 0)}
              </span>
            </div>
            <div className="flex justify-between items-center text-[10px] pt-1 border-t border-[#bfae96]/40 text-[#4a3928] uppercase tracking-wider font-serif">
              <span>Reserve Ammo</span>
              <span
                className={`font-mono font-bold ${playerReserveAmmo === 0 ? "text-red-600 animate-pulse" : "text-[#2a8ec4]"}`}
              >
                {playerReserveAmmo} RDS
              </span>
            </div>
            <div className="flex justify-between items-center text-[10px] pt-1 border-t border-[#bfae96]/40 text-[#4a3928] uppercase tracking-wider font-serif">
              <span>Condition</span>
              <span
                className={`font-mono font-bold ${(player.weapon.condition ?? 100) < 40 ? "text-red-600 animate-pulse" : "text-[#2a8ec4]"}`}
              >
                {Math.round(player.weapon.condition ?? 100)}%
              </span>
            </div>
          </div>

          {/* Injury status check */}
          {(isLegInjured || isArmInjured) && (
            <div className="bg-red-950/20 border border-red-900/60 p-2 rounded-sm space-y-1 text-[9px] text-[#c4451a] font-serif uppercase">
              <span className="font-bold">⚠️ Critical Bullet Injuries:</span>
              <ul className="list-disc pl-3 text-[8.5px] font-sans text-[#2d2119] normal-case space-y-0.5">
                {isLegInjured && (
                  <li>
                    <b>Leg Injury:</b> Knee joint cracked! Permanent -2 AP
                    penalty for this standoff.
                  </li>
                )}
                {isArmInjured && (
                  <li>
                    <b>Arm Injury:</b> Trigger wrist lacerated! Flat -25%
                    targeting accuracy.
                  </li>
                )}
              </ul>
            </div>
          )}

          {/* Cannon interaction button (only when adjacent to 4,4) */}
          {canUseCannon && (
            <div className="bg-amber-100/20 border border-amber-950 p-2.5 rounded-sm flex flex-col space-y-2 items-center text-center">
              <span className="text-[9.5px] uppercase font-serif text-amber-500 font-bold block">
                💣 Adjacent to Field Piece Cannon
              </span>
              <button
                id="action-fire-cannon"
                onClick={handleActivateCannon}
                disabled={turn !== "player" || ap < 2 || isAimingCannon}
                className="w-full py-1.5 bg-[#e8b923] text-black font-semibold uppercase text-[10px] rounded hover:bg-yellow-400 font-serif shadow border border-[#bfae96] hover:scale-105 transition-all cursor-pointer disabled:opacity-20 disabled:scale-100"
              >
                🔴 MAN HEAVY CANNON (2 AP)
              </button>
            </div>
          )}

          {/* Removed Combat Mode & Targeted Shot Panels */}

          {/* Pass Turn Button (Moved Up) */}
          <button
            id="action-end-turn"
            onClick={handleEndPlayerTurn}
            disabled={playerHp <= 0 || turn !== "player"}
            className="w-full py-3 mb-2 px-4 rounded-sm font-bold font-serif uppercase tracking-[0.14em] text-xs transition-colors bg-[#c4451a] hover:bg-red-800 text-white border-b-4 border-black disabled:opacity-30 cursor-pointer focus:outline-none flex items-center justify-center gap-1 shadow-md"
          >
            <ArrowRight size={13} />
            <span>Pass Over Turn</span>
          </button>

          {/* Action Trigger Grid buttons */}
          <div className="grid grid-cols-2 gap-2">
            {playerClip < (player.weapon.maxClip + (player.weaponUpgrades?.clipBonus || 0)) && (
              <button
                id="action-reload"
                onClick={handleReload}
                disabled={
                  playerHp <= 0 ||
                  turn !== "player" ||
                  apRef.current <= 0 ||
                  isAimingCannon
                }
                className={`col-span-1 py-2.5 px-3 rounded-sm font-bold font-serif uppercase tracking-wider text-[10px] transition-all flex items-center justify-center gap-1.5 focus:outline-none border-b-2 disabled:opacity-30 cursor-pointer ${
                  playerClip === 0 
                    ? "bg-[#c4451a] text-white border-red-950 animate-pulse hover:bg-red-800" 
                    : "bg-[#dfd4bd] text-[#8c6b0c] hover:bg-[#3d2d21] border-black"
                }`}
              >
                <RefreshCw size={12} className={playerClip === 0 ? "text-white" : "text-[#8c6b0c]"} />
                <span>
                  Reload ({player.perks.includes("fast_hands") ? "0 AP" : "1 AP"})
                </span>
              </button>
            )}

            <button
              id="action-overwatch"
              onClick={handleOverwatch}
              disabled={
                playerHp <= 0 ||
                turn !== "player" ||
                apRef.current < 3 ||
                isAimingCannon
              }
              className={`col-span-1 py-2.5 px-3 rounded-sm font-bold font-serif uppercase tracking-[0.1em] text-[10px] transition-all flex items-center justify-center gap-1.5 bg-[#1f2937] hover:bg-[#111827] text-gray-300 border-b-2 border-black disabled:opacity-30 cursor-pointer focus:outline-none shadow-inner ${playerClip >= (player.weapon.maxClip + (player.weaponUpgrades?.clipBonus || 0)) ? "col-span-2" : ""}`}
            >
              <span className="text-xl leading-none">⏱️</span>
              <span>Overwatch</span>
            </button>

            <button
              id="action-surrender"
              onClick={handleDemandSurrender}
              disabled={
                playerHp <= 0 || turn !== "player" || ap < 1 || isAimingCannon
              }
              className="col-span-2 py-2 px-3 rounded-sm font-bold font-serif uppercase tracking-wider text-[9.5px] bg-[#dfd4bd] hover:bg-[#c6ba9f] text-amber-500 border border-amber-900 border-b-2 disabled:opacity-35 cursor-pointer flex items-center justify-center gap-1.5"
            >
              📢 DEMAND SURRENDER (1 AP)
            </button>

            {/* Trail Saddlebags Consumables Section */}
            {(() => {
              const dynCount = player.inventory.filter((i) => i.id === "dynamite").length + emergencyDynamite;
              const whiskeyCount = player.inventory.filter((i) => i.id === "whiskey").length;
              const elixirCount = player.inventory.filter((i) => i.id === "elixir").length;
              const tourniquetCount = player.inventory.filter((i) => i.id === "tourniquet").length;

              const showDynamite = dynCount > 0 || isAimingDynamite;
              const showWhiskey = whiskeyCount > 0 && playerHp < player.maxHp;
              const showElixir = elixirCount > 0 && (playerHp < player.maxHp || playerPoisonTurns > 0);
              const showTourniquet = tourniquetCount > 0 && (playerHp < player.maxHp || playerBleedTurns > 0 || isLegInjured || isArmInjured);
              
              if (!showDynamite && !showWhiskey && !showElixir && !showTourniquet) return null;

              return (
                <div className="col-span-2 border-t border-[#bfae96] pt-2.5 mt-1">
                  <span className="text-[9px] uppercase font-serif tracking-widest text-[#664d36] font-bold block mb-1.5">
                    🎒 Tactical Items:
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {showDynamite && (
                      <button
                        id="saddlebag-dynamite"
                        onClick={() => {
                          if (isAimingDynamite) {
                            setIsAimingDynamite(false);
                            addLog("🧨 Cancelled dynamite aiming circle.");
                          } else {
                            if (turn !== "player" || ap < 1) {
                              addLog(
                                `⚠️ Priming a dynamite fuse requires ${player.name}'s turn and at least 1 AP!`,
                              );
                              return;
                            }
                            if (dynCount <= 0) {
                              addLog("⚠️ Out of dynamite sticks in your bags!");
                              return;
                            }
                            setIsAimingDynamite(true);
                            addLog(
                              "🧨 FUSE PRIMED: Click any grid cell to hurl the dynamite stick! (1 AP on throw)",
                            );
                          }
                        }}
                        disabled={
                          playerHp <= 0 ||
                          turn !== "player" ||
                          (ap < 1 && !isAimingDynamite) ||
                          isAimingCannon
                        }
                        className={`py-1.5 px-2 text-[8.5px] font-bold uppercase rounded border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          isAimingDynamite
                            ? "bg-red-800 text-white border-red-500 animate-pulse"
                            : "bg-[#dfd4bd] border-[#bfae96] text-[#2d2119] hover:bg-[#3d2d21]"
                        }`}
                      >
                        🧨 {isAimingDynamite ? "Cancel Aim" : "Aim Dynamite"} ({dynCount} left, 1 AP)
                      </button>
                    )}

                    {showWhiskey && (
                      <button
                        id="saddlebag-whiskey"
                        onClick={handleCombatDrinkWhiskey}
                        disabled={
                          playerHp <= 0 ||
                          turn !== "player" ||
                          ap < 1 ||
                          isAimingCannon ||
                          whiskeyCount <= 0
                        }
                        className="py-1.5 px-2 text-[8.5px] font-bold uppercase rounded border border-[#bfae96] bg-[#dfd4bd] text-[#2d2119] hover:bg-[#3d2d21] cursor-pointer disabled:opacity-20 flex items-center justify-center gap-1"
                      >
                        🥃 Whiskey ({whiskeyCount} left, 1 AP)
                      </button>
                    )}

                    {showElixir && (
                      <button
                        id="saddlebag-elixir"
                        onClick={handleCombatUseMedicalElixir}
                        disabled={
                          playerHp <= 0 ||
                          turn !== "player" ||
                          ap < 1 ||
                          isAimingCannon ||
                          elixirCount <= 0
                        }
                        className="py-1.5 px-2 text-[8.5px] font-bold uppercase rounded border border-[#bfae96] bg-[#dfd4bd] text-[#2d2119] hover:bg-[#3d2d21] cursor-pointer disabled:opacity-20 flex items-center justify-center gap-1"
                      >
                        🧪 Elixir ({elixirCount} left, 1 AP)
                      </button>
                    )}

                    {showTourniquet && (
                      <button
                        id="saddlebag-bandage"
                        onClick={handleCombatFirstAidTourniquet}
                        disabled={
                          playerHp <= 0 ||
                          turn !== "player" ||
                          ap < 3 ||
                          isAimingCannon
                        }
                        className="py-1.5 px-2 text-[8.5px] font-bold uppercase rounded border border-[#bfae96] bg-[#dfd4bd] text-[#2d2119] hover:bg-[#3d2d21] cursor-pointer disabled:opacity-20 flex items-center justify-center gap-1"
                      >
                        🩹 Tourniquet ({tourniquetCount} Left, 3 AP)
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Sidearms Swap Combobox Dropdown */}
            {alternateWeapons.length > 0 ? (
              <div className="col-span-2 bg-[#e8dec7] border border-[#bfae96] p-2 rounded-sm space-y-1">
                <label className="text-[9px] uppercase font-serif tracking-widest text-[#5a4838] block">
                  Swap Armed Sidearm (1 AP):
                </label>
                <div className="flex gap-1.5 max-h-[100px] overflow-y-auto pr-1 flex-wrap">
                  {alternateWeapons.map((arm) => (
                    <button
                      id={`swap-weapon-${arm.id}`}
                      key={arm.id}
                      onClick={() => handleSwapWeapon(arm.id)}
                      disabled={
                        playerHp <= 0 ||
                        turn !== "player" ||
                        ap < 1 ||
                        isAimingCannon
                      }
                      className="py-1 px-2 text-[9px] font-bold uppercase font-serif bg-[#dfd4bd] border border-[#bfae96] hover:bg-[#3d2d21] text-[#2d2119] rounded cursor-pointer disabled:opacity-30 disabled:scale-100"
                    >
                      Draw {arm.name}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="col-span-2 text-center text-[8.5px] uppercase font-serif tracking-wider text-[#5a4838] py-1 border border-[#bfae96]/40 rounded-sm">
                Single pistol equipped (No backup arms)
              </div>
            )}
          </div>
        </div>


      </div>

      {/* Environment Detail Modal */}
      {showEnvModal && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[150] backdrop-blur-sm shadow-2xl"
          onClick={() => setShowEnvModal(false)}
        >
          <div
            className="bg-[#dcd1b9] w-full max-w-sm border border-[#1a130f] rounded p-5 relative shadow-[0_0_50px_rgba(30,20,16,0.9)]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-2 right-2 text-2xl text-[#1a130f] opacity-60 hover:opacity-100"
              onClick={() => setShowEnvModal(false)}
            >
              ×
            </button>
            <h2 className="text-xl font-bold uppercase text-[#1a130f] font-serif mb-4 pb-2 border-b border-[#1a130f]/20">
              Battlefield Conditions
            </h2>

            <div className="space-y-4 text-sm font-sans text-[#3d2d21]">
              <div className="bg-[#120c0a]/10 p-3 rounded border border-[#1a130f]/10">
                <div className="font-bold font-serif text-[#c4451a] mb-1 flex items-center gap-1.5">
                  <span className="text-lg">{combatBiome.icon}</span>{" "}
                  {combatBiome.name}
                </div>
                <p className="text-xs leading-relaxed italic opacity-90">
                  {combatBiome.description}
                </p>
              </div>

              <div className="bg-[#120c0a]/10 p-3 rounded border border-[#1a130f]/10">
                <div className="font-bold font-serif text-sky-700 mb-1 flex items-center gap-1.5">
                  <span className="text-lg">{combatWeather.icon}</span>{" "}
                  {combatWeather.name}
                </div>
                <p className="text-xs leading-relaxed italic opacity-90 mb-1.5">
                  {combatWeather.description}
                </p>
                <div className="bg-[#1a130f] text-[#e8dec7] text-[10px] p-2 rounded">
                  <span className="font-bold text-[#c4451a] uppercase text-[9px] block mb-0.5">
                    Effect:
                  </span>
                  {combatWeather.effectText}
                </div>
              </div>

              <div className="bg-[#120c0a]/10 p-3 rounded border border-[#1a130f]/10">
                <div className="font-bold font-serif text-amber-900 mb-1 flex items-center gap-1.5">
                  <span className="text-lg">{isNight ? "🌙" : "☀️"}</span>{" "}
                  {isNight ? "Nightfall" : "Daylight"}
                </div>
                <p className="text-xs leading-relaxed italic opacity-90 mb-1.5">
                  {isNight
                    ? "The moon attempts to pierce the gloom. Darkness heavily penalizes accuracy. Lanterns and campfires provide small radiuses of illuminated safety (the bright orange borders)."
                    : "Clear high noon or crisp morning light. Base visibility is strong, but weather conditions (like fog or mirages) will still impact your effective line of sight."}
                </p>
                {isNight && (
                  <div className="bg-[#1a130f] text-[#e8dec7] text-[10px] p-2 rounded">
                    <span className="font-bold text-[#c4451a] uppercase text-[9px] block mb-0.5">
                      Night Rules:
                    </span>
                    Obscured targets: -10% Hit Chance, -1 Range.
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => setShowEnvModal(false)}
              className="mt-5 w-full bg-[#1a130f] hover:bg-black text-[#dfd4bd] font-serif font-bold uppercase text-xs py-2.5 rounded transition-transform active:scale-95 cursor-pointer border border-transparent shadow-lg"
            >
              Return to Combat
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
