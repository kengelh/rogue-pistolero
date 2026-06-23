/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import hero1Img from "./assets/img_tactical/hero1.png";
import hero2Img from "./assets/img_tactical/hero2.png";
import hero3Img from "./assets/img_tactical/hero3.png";

import { applyAutoBandaging } from "./utils/injuries";
import {
  Player,
  Location,
  Mission,
  ShopItem,
  LogMessage,
  InventoryItem,
  Nemesis,
  InjurySystem,
} from "./types";

const getEffectiveMaxHp = (playerObj: Player) => {
  if (!playerObj.injuries) return playerObj.maxHp;
  let penaltyPercent = 0;
  Object.values(playerObj.injuries.parts).forEach((part) => {
    if (part.isUntreated) {
      if (part.status === "CRIPPLED") penaltyPercent += 0.25;
      else if (part.status === "INJURED") penaltyPercent += 0.1;
    }
  });
  penaltyPercent = Math.min(0.9, penaltyPercent);
  return Math.floor(playerObj.maxHp * (1 - penaltyPercent));
};
import { generateWorldMap } from "./utils/procedural";
import { instantiateStorylineQuest } from "./utils/storylines";
import { TRADE_GOODS } from "./utils/trade";
import { CharacterSheet } from "./components/CharacterSheet";
import { OverlandMap } from "./components/OverlandMap";
import { TownView } from "./components/TownView";
import { CombatView } from "./components/CombatView";
import { GameLogs } from "./components/GameLogs";
import { DataExplorer } from "./components/DataExplorer";
import { WeaponBenchModal } from "./components/WeaponBenchModal";
import { LedgerModal } from "./components/LedgerModal";
import {
  FORBIDDEN_NAMES,
  MALE_FIRST_NAMES,
  FEMALE_FIRST_NAMES,
  LAST_NAMES,
} from "./utils/names";
import { GodModeModal } from "./components/GodModeModal";
import { motion } from "motion/react";
import {
  Compass,
  Sparkles,
  Skull,
  Map,
  ShieldAlert,
  Award,
  RefreshCw,
  HelpCircle,
  Waves,
  Volume2,
  Landmark,
  VolumeX,
  Database,
  Save,
  Download,
} from "lucide-react";
import { FrontierAudio } from "./utils/AudioSynth";

const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Ignore security errors in sandboxed iframes
    }
  },
};

export default function App() {
  const [isMuted, setIsMuted] = useState(true); // Default muted to comply with browser policy
  const [isGodModeOpen, setIsGodModeOpen] = useState(false);
  const [isGodModeActive, setIsGodModeActive] = useState(false);
  const [preGodModeState, setPreGodModeState] =
    useState<Partial<Player> | null>(null);
  const [godModeWeather, setGodModeWeather] = useState<string | null>(null);
  const [godModeTimeOfDay, setGodModeTimeOfDay] = useState<
    "day" | "night" | null
  >(null);

  const [worldLocations, setWorldLocations] = useState<Location[]>([]);
  const [currentLocationId, setCurrentLocationId] = useState<string>("");
  const [player, setPlayer] = useState<Player>({
    gender: "male",
    avatarImage: hero1Img,
    hp: 35,
    maxHp: 35,
    hydration: 100,
    maxHydration: 100,
    gold: 25,
    bounty: 0,
    bankBalance: 0,
    level: 1,
    xp: 0,
    xpToNextLevel: 100,
    perks: [],
    reputation: 0,
    campMovementLvl: 0,
    pistolSkill: 0,
    rifleSkill: 0,
    weapon: {
      name: "Rusty Colt Revolver",
      dmg: 12,
      range: 4,
      maxClip: 6,
      clip: 6,
      value: 30,
      condition: 100,
      ammoType: "pistol",
    },
    factionReputation: {
      lawmen: 0,
      outlaws: 0,
      tribes: 10,
    },
    weaponUpgrades: {
      dmgBonus: 0,
      rangeBonus: 0,
      clipBonus: 0,
      accuracyBonus: 0,
      hasScope: false,
    },
    inventory: [
      {
        id: "ammo_pistol",
        name: "Box of .45 Colt (Pistol)",
        type: "consumable",
        value: 10,
        count: 36,
        details: "Ammunition for pistols.",
      },
    ],
    hasHorse: false,
    visitedLocationIds: [],
    tradeInventory: [],
    activeCarriage: null,
    name: "The Stranger",
    horseName: "Kentucky Stallion",
    posse: [],
    stats: {
      duelsWon: 0,
      bountiesCollected: 0,
      banksRobbed: 0,
      daysSurvived: 0,
    },
  });

  const [activeView, setActiveView] = useState<
    | "intro"
    | "map"
    | "town"
    | "combat"
    | "gameover"
    | "victory"
    | "data"
    | "ambush_defeat"
  >("intro");
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [introFirstName, setIntroFirstName] = useState("The");
  const [introLastName, setIntroLastName] = useState("Stranger");
  const [introNameError, setIntroNameError] = useState<string | null>(null);
  const [seenTips, setSeenTips] = useState<Record<string, boolean>>({});
  const [activeTip, setActiveTip] = useState<{
    id: string;
    title: string;
    desc: string;
  } | null>(null);

  const triggerTip = (id: string, title: string, desc: string) => {
    setSeenTips((prev) => {
      if (!prev[id]) {
        setActiveTip({ id, title, desc });
        return { ...prev, [id]: true };
      }
      return prev;
    });
  };

  const [showWeaponBenchModal, setShowWeaponBenchModal] = useState(false);
  const [showLedgerModal, setShowLedgerModal] = useState(false);
  const [confrontationModal, setConfrontationModal] = useState<Mission | null>(
    null,
  );
  const [investigationModal, setInvestigationModal] = useState<Mission | null>(
    null,
  );
  const [logs, setLogs] = useState<LogMessage[]>([]);

  // Player manual badlands coordinates
  const [playerX, setPlayerX] = useState<number>(0);
  const [playerY, setPlayerY] = useState<number>(0);
  const [gameTimeHour, setGameTimeHour] = useState<number>(8);
  const [globalWeather, setGlobalWeather] = useState<
    "clear" | "heatwave" | "rain" | "fog"
  >("clear");

  // Track sectors/biomes the player has passed/visited
  const [passedSectors, setPassedSectors] = useState<string[]>([]);

  useEffect(() => {
    // Spatial bucket hashing for trail dots
    const bucketSize = 4;
    const cx = Math.floor(playerX / bucketSize);
    const cy = Math.floor(playerY / bucketSize);

    setPassedSectors((prev) => {
      const newSectors = [...prev];
      let added = false;
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const key = `${cx + dx},${cy + dy}`;
          if (!newSectors.includes(key)) {
            newSectors.push(key);
            added = true;
          }
        }
      }
      return added ? newSectors : prev;
    });
  }, [playerX, playerY]);

  // Real-time travel & quest indicators
  const [travelStatus, setTravelStatus] = useState<{
    isTraveling: boolean;
    sourceLocId: string;
    targetLocId: string;
    currentX: number;
    currentY: number;
    hoursPassed: number;
    totalDistance: number;
    method: "foot" | "horse";
  } | null>(null);

  const [tutorialShown, setTutorialShown] = useState(false);
  const [locatePulseLocId, setLocatePulseLocId] = useState<string | null>(null);

  // Synchronize with FrontierAudio
  useEffect(() => {
    FrontierAudio.setMute(isMuted);
  }, [isMuted]);

  useEffect(() => {
    if (activeView === "intro" || activeView === "map") {
      FrontierAudio.playMusic("world");
    } else if (activeView === "town") {
      FrontierAudio.playMusic("town");

      // Auto-fill canteen and remove hydration effects upon entering a city
      setPlayer((prev) => {
        let needsUpdate = false;
        if ((prev.hoursDehydrated || 0) > 0) {
          needsUpdate = true;
        }
        if (prev.hydration < (prev.maxHydration ?? 100)) {
          needsUpdate = true;
        }

        const hasCanteen = prev.inventory.some((i) => i.id === "canteen");
        const canteenFull = prev.inventory.every(
          (i) => i.id !== "canteen" || i.count >= 5,
        );
        if (hasCanteen && !canteenFull) {
          needsUpdate = true;
        }

        if (!needsUpdate) return prev;

        const updatedInv = prev.inventory.map((i) =>
          i.id === "canteen" ? { ...i, count: Math.max(i.count, 5) } : i,
        );

        setTimeout(() => {
          addLogMessage(
            "💧 TOWN WELCOME: Your trail canteens have been refilled with clean well water, and dehydration effects are completely gone!",
            "loot",
          );
        }, 50);

        return {
          ...prev,
          hoursDehydrated: 0,
          hydration: prev.maxHydration ?? 100,
          inventory: updatedInv,
        };
      });
    } else if (activeView === "combat") {
      // Handled inside CombatView.tsx to trigger 'duel' then 'combat' (tactical)!
    } else {
      FrontierAudio.stop();
    }
  }, [activeView]);

  // Combat details state
  const [combatType, setCombatType] = useState<
    | "bounty"
    | "robbery"
    | "nest_clearing"
    | "ambush"
    | "camp_ambush"
    | "train_robbery"
  >("ambush");

  const [combatRisk, setCombatRisk] = useState<number>(0.2);
  const [activeMissionTarget, setActiveMissionTarget] =
    useState<Mission | null>(null);
  const [activeProvokedNpcId, setActiveProvokedNpcId] = useState<string | null>(
    null,
  );
  const [pendingCombat, setPendingCombat] = useState<{
    type:
      | "bounty"
      | "robbery"
      | "nest_clearing"
      | "ambush"
      | "camp_ambush"
      | "train_robbery"
      | "duel";
    risk: number;
    mission: Mission | null;
    provokedNpcId: string | null;
    previousView: "town" | "map";
  } | null>(null);

  const [preCombatView, setPreCombatView] = useState<"map" | "town">("town");
  const [victoryStoryDetails, setVictoryStoryDetails] = useState<{
    lootGold: number;
    xpReward: number;
    outlawName: string | null;
    isBounty: boolean;
    isRobbery: boolean;
  } | null>(null);
  const [activeBountyClaim, setActiveBountyClaim] = useState<{
    itemId: string;
    outlawName: string;
    bountyGold: number;
    xpReward: number;
    repChange: number;
  } | null>(null);

  // Check for posse desertion on reputation change
  useEffect(() => {
    if (player.posse && player.posse.length > 0) {
      const playerAlignment =
        player.reputation >= 20
          ? "lawful"
          : player.reputation <= -20
            ? "outlaw"
            : "neutral";

      const newPosse = player.posse.filter((merc) => {
        // Derive alignment based on role, matching TownView's definition
        const mercAlignment = ["Lawman", "Bounty Hunter"].includes(merc.role)
          ? "lawful"
          : ["Gunslinger", "Bodyguard", "Demolitionist"].includes(merc.role)
            ? "outlaw"
            : "neutral";

        const isMismatch =
          (playerAlignment === "lawful" && mercAlignment === "outlaw") ||
          (playerAlignment === "outlaw" && mercAlignment === "lawful");

        if (isMismatch) {
          addLogMessage(
            `👋 DESERTION: "${merc.name}" left your posse! Your reputation no longer aligns with their code.`,
            "danger",
          );
          return false;
        }
        return true;
      });

      if (newPosse.length !== player.posse.length) {
        setPlayer((prev) => ({ ...prev, posse: newPosse }));
      }
    }
  }, [player.reputation, player.posse]);

  // Initialize game world
  useEffect(() => {
    const freshMap = generateWorldMap();
    if (freshMap.length > 0) {
      const startingTown = freshMap[0];
      const tutorialMission: Mission = {
        id: "tutorial_get_horse",
        title: "🐴 TUTORIAL: Capture Saloon Horse Thief",
        type: "bounty",
        targetName: "Slippery Pete",
        rewardGold: 20,
        rewardXp: 80,
        reputationChange: 15,
        danger: "low",
        description:
          "Slippery Pete has pocketed equine gold key tokens. Walk into the Saloon tab, accept Pete's bounty, click and secure his capture!",
        originLocationId: startingTown.id,
        targetLocationId: startingTown.id,
      };
      startingTown.quests = [tutorialMission, ...startingTown.quests];
      setWorldLocations(freshMap);
      setCurrentLocationId(startingTown.id);
      setPlayerX(startingTown.x);
      setPlayerY(startingTown.y);
      setPlayer((prev) => ({
        ...prev,
        visitedLocationIds: [startingTown.id],
      }));
    }

    // Initial logs with immediate step-by-step frontier instructions
    addLogMessage(
      '🌵 FRONTIER ADVICE: Click "Saloon" below, accept the "TUTORIAL: Capture Saloon Horse Thief" contract, and then assault "Slippery Pete" in the tactical grid to seize your first bounty gold!',
      "system",
    );
  }, []);

  const advanceGameTime = (hours: number) => {
    setGameTimeHour((prev) => {
      // Avoid rounding to just 2 decimals during micro-advances to prevent infinite rest loops
      const nextTime = Math.round((prev + hours) * 10000) / 10000;
      const daysPassed = Math.floor(nextTime / 24);
      const remainingHours = nextTime % 24;

      if (daysPassed > 0) {
        // Change weather occasionally each day
        if (Math.random() < 0.3) {
          const weathers = [
            "clear",
            "clear",
            "clear",
            "heatwave",
            "rain",
            "fog",
          ] as const;
          setGlobalWeather(
            weathers[Math.floor(Math.random() * weathers.length)],
          );
        }
      }

      if (hours > 0) {
        setPlayer((p) => {
          let updatedPlayer = { ...p };
          const previousHoursSurvived = updatedPlayer.stats?.hoursSurvived || 0;
          const newHoursSurvived = previousHoursSurvived + hours;

          let newBounty = updatedPlayer.bounty || 0;

          // dropping heat and bounty value by 1% every 100 game hours
          const previous100s = Math.floor(previousHoursSurvived / 100);
          const new100s = Math.floor(newHoursSurvived / 100);

          if (new100s > previous100s) {
            const drops = new100s - previous100s;
            for (let i = 0; i < drops; i++) {
              newBounty = newBounty * 0.99; // drop 1%
            }
          }

          updatedPlayer.bounty = Math.max(0, Math.floor(newBounty));

          // only show player update in bounty after 1000 in game hours
          const previous1000s = Math.floor(previousHoursSurvived / 1000);
          const new1000s = Math.floor(newHoursSurvived / 1000);
          if (new1000s > previous1000s && newBounty > 0) {
            addLogMessage(
              `📉 The trail goes cold... Your bounty and heat naturally decreased over long expeditions to $${Math.floor(newBounty)}.`,
              "system",
            );
          }

          updatedPlayer.stats = {
            ...updatedPlayer.stats,
            daysSurvived: (updatedPlayer.stats?.daysSurvived || 0) + daysPassed,
            hoursSurvived: newHoursSurvived,
          };

          // Filter out expired locations
          setWorldLocations((prevLocs) => {
            const nextLocs = prevLocs.filter(
              (l) => !l.expiresAtTime || l.expiresAtTime > newHoursSurvived,
            );
            if (nextLocs.length < prevLocs.length) {
              setTimeout(
                () =>
                  addLogMessage(
                    `⏳ An ephemeral location on your map has disappeared...`,
                    "system",
                  ),
                0,
              );
            }
            return nextLocs;
          });

          // Posse daily payments or desertion
          if (
            daysPassed > 0 &&
            updatedPlayer.posse &&
            updatedPlayer.posse.length > 0
          ) {
            let totalDailyCost = 0;
            const leavingMembers: string[] = [];
            updatedPlayer.posse.forEach(
              (member) => (totalDailyCost += member.dailyRateGold),
            );

            if (updatedPlayer.gold >= totalDailyCost) {
              updatedPlayer.gold -= totalDailyCost;
              // setTimeout to avoid update within setPlayer rendering
              setTimeout(
                () =>
                  addLogMessage(
                    `💰 Paid daily wages of $${totalDailyCost} to posse members.`,
                    "system",
                  ),
                0,
              );
            } else {
              updatedPlayer.posse.forEach((member) => {
                if (member.trait === "loyal" && Math.random() < 0.5) return; // partially forgives
                leavingMembers.push(member.name);
              });
              updatedPlayer.posse = updatedPlayer.posse.filter(
                (m) => !leavingMembers.includes(m.name),
              );
              if (leavingMembers.length > 0) {
                setTimeout(
                  () =>
                    addLogMessage(
                      `⚠️ UNPAID POSSE: You could not afford daily wages. Members deserted: ${leavingMembers.join(", ")}`,
                      "danger",
                    ),
                  0,
                );
              }
            }
          }

          return updatedPlayer;
        });
      }
      return remainingHours;
    });
  };

  const addLogMessage = (text: string, type: LogMessage["type"]) => {
    const timestamp = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    let formattedText = text;
    if (player && player.name) {
      formattedText = formattedText.replace(
        /\b${player.name} Vane\b/gi,
        player.name,
      );
      formattedText = formattedText.replace(
        /\b${player.name}\b/gi,
        player.name,
      );
    }
    if (player && player.hasHorse && player.horseName) {
      formattedText = formattedText.replace(
        /\bKentucky Stallion\b/gi,
        player.horseName,
      );
    }
    setLogs((prev) => [
      ...prev,
      {
        id: `log_${Date.now()}_${Math.random()}`,
        text: formattedText,
        type,
        timestamp,
      },
    ]);
  };

  const currentLoc = worldLocations.find((loc) => loc.id === currentLocationId);

  // Helper action: travel to another town
  const handleTravel = (
    targetLocationId: string,
    method: "horse" | "train",
  ) => {
    const targetLoc = worldLocations.find((l) => l.id === targetLocationId);
    if (!targetLoc || !currentLoc) return;

    // Calculate final costs
    const dx = Math.abs(currentLoc.x - targetLoc.x);
    const dy = Math.abs(currentLoc.y - targetLoc.y);
    const dist = Math.max(2, Math.round(Math.hypot(dx, dy)));

    if (method === "train") {
      let trainCost = Math.round(dist * 1.5);
      if (player.perks.includes("silver_tongue")) {
        trainCost = Math.round(trainCost * 0.8);
      }
      if (player.gold < trainCost) {
        addLogMessage(
          "⚠️ Insufficient gold nuggets for the Railway Train ticket!",
          "danger",
        );
        return;
      }
      setPlayer((prev) => ({
        ...prev,
        gold: Math.max(0, prev.gold - trainCost),
      }));
      addLogMessage(
        `🚂 BOARDED STEAM TRAIN: ${player.name} boarded the Trans-District Iron Locomotive to ${targetLoc.name}. Ticket cost: -$${trainCost} Gold. Safely bypassed Badlands threats!`,
        "travel",
      );

      // Instant travel
      setCurrentLocationId(targetLocationId);
      if (!targetLoc.isExplored) {
        setWorldLocations((prev) =>
          prev.map((l) =>
            l.id === targetLoc.id ? { ...l, isExplored: true } : l,
          ),
        );
        addLogMessage(
          `🗺️ Discovered new settlement district: ${targetLoc.name}.`,
          "loot",
        );
      }
      setActiveView("town");
      return;
    }

    // Step-by-step overland travel (Moves 1 field per hour)
    const travelMethod = player.hasHorse ? "horse" : "foot";
    if (travelMethod === "foot") {
      addLogMessage(
        `🚶 STEPPING BY FOOT: ${player.name} has no horse available! ${player.name} begins walking through parched badlands with heavy gear... Moving 1 field per hour!`,
        "travel",
      );
    } else {
      addLogMessage(
        `🏇 FRONTIER RIDE: ${player.name} mounts Kentucky Stallion to ride across sands towards ${targetLoc.name}. Moving 1 field per hour!`,
        "travel",
      );
    }

    setTravelStatus({
      isTraveling: true,
      sourceLocId: currentLocationId,
      targetLocId: targetLocationId,
      currentX: currentLoc.x,
      currentY: currentLoc.y,
      hoursPassed: 0,
      totalDistance: dist,
      method: travelMethod,
    });
    setActiveView("map");
  };

  const getPreCombatDetails = () => {
    if (!pendingCombat) return null;
    let numEnemies = Math.max(
      1,
      Math.min(4, Math.round(1 + pendingCombat.risk * 3)),
    );

    // Nemesis Override check
    const nemesisTarget = player.nemeses?.find(
      (n) => n.id === pendingCombat.mission?.id,
    );

    if (nemesisTarget) {
      numEnemies = nemesisTarget.gangSize;
    } else if (pendingCombat.provokedNpcId) {
      numEnemies = 1;
    } else if (pendingCombat.mission && pendingCombat.mission.targetName) {
      const nameLower = pendingCombat.mission.targetName.toLowerCase();
      if (
        nameLower.includes("gang") ||
        nameLower.includes("boys") ||
        nameLower.includes("brothers") ||
        nameLower.includes("bandits") ||
        (pendingCombat.mission.difficulty &&
          pendingCombat.mission.difficulty >= 2)
      ) {
        numEnemies = Math.max(
          1,
          Math.min(
            4,
            Math.round(1 + (pendingCombat.mission.difficulty || 1) * 1.5),
          ),
        );
      } else {
        numEnemies = 1;
      }
    }

    let label = "Standoff";
    let sublabel = "Desert Shootout";
    let desc = "Armed hostile signatures detected in the vicinity.";
    let icon = "⚔️";

    if (pendingCombat.type === "nest_clearing") {
      label = "🦂 Desert Infestation Nest";
      sublabel = "Mojave Canyon Spines";
      desc =
        "A group of aggressive, venomous scorpions is claiming territory. Watch out for dangerous tail stingers!";
      icon = "🦂";
    } else if (pendingCombat.type === "camp_ambush") {
      label = "⛺ Midnight Camp Ambush";
      sublabel = "Defend Your Campfire";
      desc =
        "Hostiles have crept into the light of your campfire! Defend yourself in close-quarters.";
      icon = "⛺";
    } else if (pendingCombat.type === "bounty") {
      label = `🎯 Bounty Confrontation: ${pendingCombat.mission?.targetName || "Outlaw"}`;
      sublabel = "Guaranteed Arrest Warrant";
      const isSolo =
        numEnemies <= 1 || pendingCombat.provokedNpcId === "slippery_pete";
      desc = isSolo
        ? `You finally cornered your bounty contract target. They are alone but dangerous, carrying $${pendingCombat.mission?.rewardGold || 150} in reward coin!`
        : `You tracked down your bounty contract target. They are surrounded by heavily armed outlaws but carrying $${pendingCombat.mission?.rewardGold || 150} in reward coin!`;
      icon = "🎯";
    } else if (pendingCombat.type === "robbery") {
      label = "🏦 Bank Heist Confrontation";
      sublabel = "Local Security Retaliation";
      desc =
        "Marshal Pat Garrett has mobilized alert town deputies to block your bank getaway! They will shoot on sight!";
      icon = "🏦";
    } else if (pendingCombat.type === "ambush") {
      label = "⚔️ Highwaymen Plaza Ambush";
      sublabel = "Surprise Wild Gunfight";
      desc =
        "Dangerous badlands outlaws are flanking the road gates. They drawn steel and demanded your saddlebags!";
      icon = "🤠";
    }

    let difficulty = "EASY (Favorable Fray)";
    let diffColor = "text-emerald-400 border-emerald-500/30 bg-emerald-950/25";
    if (pendingCombat.risk >= 0.7 || numEnemies >= 4) {
      difficulty = "DEADLY (Extreme peril! High chance of death)";
      diffColor = "text-red-500 border-red-500/30 bg-red-950/25 animate-pulse";
    } else if (pendingCombat.risk >= 0.4 || numEnemies >= 3) {
      difficulty = "CHALLENGING (Requires cover & strategic swapping)";
      diffColor = "text-amber-500 border-amber-500/30 bg-amber-950/25";
    } else if (pendingCombat.risk >= 0.2 || numEnemies >= 2) {
      difficulty = "MODERATE (Standard shootout)";
      diffColor = "text-yellow-400 border-yellow-500/30 bg-yellow-950/25";
    }

    return {
      label,
      sublabel,
      desc,
      icon,
      numEnemies,
      difficulty,
      diffColor,
    };
  };

  const handleRevealLocation = (locId: string) => {
    setWorldLocations((prev) =>
      prev.map((l) => (l.id === locId ? { ...l, isExplored: true } : l)),
    );
  };

  // Sign contract/mission
  const handleAcceptMission = (mission: Mission) => {
    // Determine investigation mechanics variables
    const targetLoc = worldLocations.find(
      (l) => l.id === mission.targetLocationId,
    );
    let hiddenTargetHex: [number, number] | undefined = undefined;
    if (mission.type === "bounty" && mission.id !== "tutorial_get_horse") {
      const offsetX = Math.floor(Math.random() * 5) - 2;
      const offsetY = Math.floor(Math.random() * 5) - 2;
      hiddenTargetHex = [
        (targetLoc?.x || 0) + offsetX,
        (targetLoc?.y || 0) + offsetY,
      ];
    }

    const twistOptions = [
      "STANDARD",
      "ROBIN_HOOD",
      "FRAMED_INNOCENT",
      "MYSTICAL_CULTIST",
    ] as const;
    const randomTwist =
      twistOptions[Math.floor(Math.random() * twistOptions.length)];

    // Update the mission in the world map
    setWorldLocations((prev) =>
      prev.map((loc) => {
        if (loc.id === mission.originLocationId) {
          return {
            ...loc,
            quests: loc.quests.map((q) => {
              if (q.id === mission.id) {
                return {
                  ...q,
                  ...(hiddenTargetHex && {
                    hiddenTargetHex,
                    currentCluePoints: 0,
                    maxClueThreshold: 3,
                    twistType: randomTwist,
                    questState: "HUNTING",
                  }),
                };
              }
              return q;
            }),
          };
        }
        return loc;
      }),
    );

    // Add contract note to inventory
    const contractNote = {
      id: mission.id,
      name: `📜 Contract: ${mission.title}`,
      type: "value" as const,
      value: 0,
      count: 1,
      details: `Hunt down outlaw ${mission.targetName} near ${targetLoc?.name || "desert"}.`,
    };

    const acceptedQuestDetails: Mission = {
      ...mission,
      ...(hiddenTargetHex && {
        hiddenTargetHex,
        currentCluePoints: 0,
        maxClueThreshold: 3,
        twistType: randomTwist,
        questState: "HUNTING",
      }),
    };

    setPlayer((prev) => ({
      ...prev,
      inventory: [...prev.inventory, contractNote],
      acceptedQuests: [...(prev.acceptedQuests || []), acceptedQuestDetails],
    }));

    addLogMessage(
      `Accepted bounty task: ${mission.title}. Saddle up and ride near target territory.`,
      "system",
    );

    if (!tutorialShown) {
      setTutorialShown(true);
      setShowHelpModal(true);
      addLogMessage(
        `📖 HOW TO PLAY: You accepted the Horse Capture Contract! Look above the tabs for a RED button: "Assault ${mission.targetName}". Click it to enter tactical grid combat. Defeat him to collect the reward!`,
        "system",
      );
    } else {
      addLogMessage(
        `📍 ADVICE: The target location for this quest is marked on your Overland Map as a fuzzy approximate glowing circle. Gather clues to pinpoint the location!`,
        "system",
      );
    }
  };

  const handleBuyRumor = (): string => {
    setPlayer((prev) => ({ ...prev, gold: prev.gold - 15 }));
    let foundClue = false;
    let targetName = "";
    let twistRevealed = false;

    setWorldLocations((prev) =>
      prev.map((loc) => {
        return {
          ...loc,
          quests: loc.quests.map((q) => {
            if (
              player.inventory.some((i) => i.id === q.id) &&
              q.hiddenTargetHex &&
              (q.currentCluePoints || 0) < (q.maxClueThreshold || 3)
            ) {
              foundClue = true;
              targetName = q.targetName;
              const newClues = (q.currentCluePoints || 0) + 1;
              let newState = q.questState || "HUNTING";
              if (newClues === 2 && q.twistType && q.twistType !== "STANDARD") {
                twistRevealed = true;
                newState = "TWIST_REVEALED";
              }
              const updatedQuest = {
                ...q,
                currentCluePoints: newClues,
                questState: newState,
              };

              // Also update the player's acceptedQuest log
              setPlayer((p) => ({
                ...p,
                acceptedQuests: p.acceptedQuests?.map((aq) =>
                  aq.id === q.id ? updatedQuest : aq,
                ),
              }));

              return updatedQuest;
            }
            return q;
          }),
        };
      }),
    );

    if (twistRevealed) {
      addLogMessage(
        `⚠️ INVESTIGATION TWIST: You uncovered alarming rumors about ${targetName}! Check your clues!`,
        "danger",
      );
    }

    if (foundClue) {
      return `I hear some folks whispering about ${targetName}. Sounds like they might be hiding out slightly further than we thought. I marked their approximate location on your map...`;
    }

    // fallback rumors
    if (Math.random() < 0.1) {
      // Ephemeral Stash
      const currLoc = worldLocations.find((l) => l.id === currentLocationId);
      if (currLoc) {
        const offX = (Math.random() > 0.5 ? 1 : -1) * (15 + Math.random() * 10);
        const offY = (Math.random() > 0.5 ? 1 : -1) * (15 + Math.random() * 10);
        const stashX = currLoc.x + offX;
        const stashY = currLoc.y + offY;

        const stashId = `stash_${Date.now()}`;
        const expirationHours = (player.stats?.hoursSurvived || 0) + 48; // Disappears in 48 in-game hours

        const isBandit = Math.random() > 0.5;

        const ephemeralStash: Location = {
          id: stashId,
          name: isBandit ? "Hidden Stagecoach Loot" : "Abandoned Supply Cache",
          type: "ephemeral_stash",
          x: stashX,
          y: stashY,
          risk: isBandit ? 0.6 : 0.2, // Higher risk means maybe bandits guarding it if they go to map
          description: isBandit
            ? "A temporary stash where stagecoach robbers hid their haul. You might have 48 hours to raid it before they return to move the gold."
            : "An abandoned miner cache. Mostly forgotten, but could hold valuable supplies if reached quickly.",
          hasTrain: false,
          quests: [],
          shop: [],
          bankGold: 0,
          bankGuards: 0,
          isExplored: true,
          expiresAtTime: expirationHours,
        };

        setWorldLocations((prev) => [...prev, ephemeralStash]);
        return `Listen close. Word is there's a ${isBandit ? "bandit stash" : "supply cache"} hidden out in the wastes, but they'll be moving it within a couple days. I marked it. You better ride hard!`;
      }
    }

    const unvisited = worldLocations.filter(
      (loc) =>
        !(player.visitedLocationIds || []).includes(loc.id) &&
        loc.id !== currentLocationId,
    );
    if (unvisited.length > 0) {
      const target = unvisited[Math.floor(Math.random() * unvisited.length)];
      return `If you're tracking new ground, I hear ${target.name} has strange happenings lately.`;
    }

    return "I ain't heard much lately. Just dusty trails and rattlesnakes.";
  };

  // Real-time Badlands travel simulation loop (1 tick per 850ms representing 1 hour)
  useEffect(() => {
    if (!travelStatus || !travelStatus.isTraveling) return;

    const interval = setInterval(() => {
      const targetLoc = worldLocations.find(
        (l) => l.id === travelStatus.targetLocId,
      );
      const sourceLoc = worldLocations.find(
        (l) => l.id === travelStatus.sourceLocId,
      );
      if (!targetLoc || !sourceLoc) {
        setTravelStatus(null);
        return;
      }

      const nextHours = travelStatus.hoursPassed + 1;
      const totalDist = travelStatus.totalDistance;

      // Calculate progress percentage
      const pct = Math.min(1, nextHours / totalDist);
      const nextX = sourceLoc.x + (targetLoc.x - sourceLoc.x) * pct;
      const nextY = sourceLoc.y + (targetLoc.y - sourceLoc.y) * pct;

      // Adjust Player & Steed survival states
      setPlayer((prev) => {
        let nextHp = prev.hp;
        let horseOwned = prev.hasHorse;

        return {
          ...prev,
          hp: nextHp,
          hasHorse: horseOwned,
        };
      });

      // Update travel coordinate states
      setTravelStatus((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          hoursPassed: nextHours,
          currentX: nextX,
          currentY: nextY,
        };
      });

      // Spontaneous over-the-top Mojave events (6% chance per hour)
      if (Math.random() < 0.06) {
        const randEvent = Math.random();
        if (randEvent < 0.25) {
          addLogMessage(
            `💦 TRAILSIDE CACHE: ${player.name} spotted a hidden natural spring oasis. Recovered +10 HP!`,
            "loot",
          );
          setPlayer((prev) => ({
            ...prev,
            hp: Math.min(getEffectiveMaxHp(prev), prev.hp + 10),
          }));
        } else if (randEvent < 0.5) {
          // Scorpion grids
          addLogMessage(
            `🦂 Mojave emperor scorpions cluster the desert road! Arm weapon cylinders!`,
            "danger",
          );
          clearInterval(interval);
          setTravelStatus((prev) =>
            prev ? { ...prev, isTraveling: false } : null,
          );
          setPendingCombat({
            type: "nest_clearing",
            risk: targetLoc.risk,
            mission: null,
            provokedNpcId: null,
            previousView: "map",
          });
          return;
        } else if (randEvent < 0.7) {
          const foundGold = Math.floor(Math.random() * 8) + 3;
          setPlayer((prev) => ({ ...prev, gold: prev.gold + foundGold }));
          addLogMessage(
            `💰 SCAVENGED WAGON: ${player.name} searched a deserted mining wagon and found $${foundGold}!`,
            "loot",
          );
        } else if (randEvent < 0.85) {
          setPlayer((prev) => {
            const nextInv = [...prev.inventory];
            const exist = nextInv.find((i) => i.id === "bandage");
            if (exist) {
              exist.count += 1;
            } else {
              nextInv.push({
                id: "bandage",
                name: "Cotton Bandage",
                type: "consumable",
                value: 5,
                count: 1,
                details:
                  "Restores light wounds and stops bleeding. (Weight: 0.1 lbs)",
              });
            }
            return { ...prev, inventory: nextInv };
          });
          addLogMessage(
            `🎒 DESERTED CAMP: ${player.name} searched an old camp and found 1x Cotton Bandage!`,
            "loot",
          );
        } else {
          addLogMessage(
            `☀️ ARIZONA HEATWAVE: Dry, suffocating wind gusts!`,
            "danger",
          );
        }
      }

      // Reveal nearby topography along the travel path
      setWorldLocations((prev) => {
        let newlyRevealedNames: string[] = [];
        const nextLocations = prev.map((loc) => {
          if (!loc.isExplored) {
            const dist = Math.hypot(loc.x - nextX, loc.y - nextY);
            if (dist <= 18) {
              newlyRevealedNames.push(loc.name);
              return { ...loc, isExplored: true };
            }
          }
          return loc;
        });
        if (newlyRevealedNames.length > 0) {
          newlyRevealedNames.forEach((name) => {
            // Log for player
            addLogMessage(
              `🗺️ LANDMARK DISCOVERED: Dust clouds cleared to reveal ${name} nearby!`,
              "loot",
            );
          });
        }
        return nextLocations;
      });

      // Check arrival
      if (nextHours >= totalDist) {
        clearInterval(interval);
        setTravelStatus(null);
        setCurrentLocationId(targetLoc.id);

        if (!targetLoc.isExplored) {
          setWorldLocations((prev) =>
            prev.map((l) =>
              l.id === targetLoc.id ? { ...l, isExplored: true } : l,
            ),
          );
          addLogMessage(
            `🗺️ Discovered unexplored town outpost: ${targetLoc.name}!`,
            "loot",
          );
        }

        // Potential arrival ambush or bounty hunter intercept
        let baseAmbushChance = 0.08 + targetLoc.risk * 0.15;
        const bountyHunterChance =
          (player.bounty || 0) > 0
            ? Math.min(0.5, (player.bounty || 0) / 2000)
            : 0;

        const outlawRep = player.factionReputation?.outlaws || 0;
        const outlawRetaliationChance =
          outlawRep < -10 ? (Math.abs(outlawRep) / 100) * 0.4 : 0;

        let cargoValueMod = 0;
        let cargoWeightMod = 0;
        if (player.tradeInventory) {
          player.tradeInventory.forEach((stack) => {
            const good = TRADE_GOODS.find((g) => g.id === stack.itemId);
            if (good) {
              cargoValueMod += good.basePrice * stack.quantity * 0.0002;
              cargoWeightMod += good.weight * stack.quantity * 0.0001;
            }
          });
        }

        let totalAmbushChance =
          baseAmbushChance +
          bountyHunterChance +
          outlawRetaliationChance +
          cargoValueMod +
          cargoWeightMod;

        // Cap ambush chance
        totalAmbushChance = Math.min(0.85, totalAmbushChance);

        if (Math.random() < totalAmbushChance) {
          const rollForType = Math.random() * totalAmbushChance;
          const isBountyHunters = rollForType < bountyHunterChance;
          const isOutlawRetaliation =
            !isBountyHunters &&
            rollForType < bountyHunterChance + outlawRetaliationChance;

          let ambushRisk = targetLoc.risk;
          let msg = `Road highwaymen are blocking the entry post of ${targetLoc.name}!`;
          if (isBountyHunters) {
            ambushRisk += 0.3;
            msg = `Pinkertons and bounty hunters cornered you at the entry post!`;
          } else if (isOutlawRetaliation) {
            ambushRisk += 0.5; // High tier for better loot and tension
            msg = `Outlaw cartel hit squad tracked you down for a retaliatory strike!`;
          }

          addLogMessage(`⚔️ AMBUSHED: ${msg} Ready firearms!`, "danger");
          setPendingCombat({
            type: "ambush",
            risk: ambushRisk,
            mission: null,
            provokedNpcId: null,
            previousView: "map",
          });
        } else {
          addLogMessage(
            `🏇 ARRIVED: Reached the district of ${targetLoc.name} successfully.`,
            "travel",
          );
          setActiveView("town");
        }
      }
    }, 850);

    return () => clearInterval(interval);
  }, [travelStatus, worldLocations]);

  // Purchase items
  const handleBuyItem = (item: ShopItem) => {
    if (player.gold < item.cost) {
      addLogMessage("⚠️ Inefficient gold to purchase item!", "danger");
      return;
    }

    advanceGameTime(2); // Take 2 hours

    setPlayer((prev) => {
      let nextGold = prev.gold - item.cost;
      let nextHp = prev.hp;
      let nextWeapon = prev.weapon;
      let nextInventory = [...prev.inventory];

      if (item.id.startsWith("mount_")) {
        let baseMultiplier = 1.0;
        let mountType: any = "regular_horse";
        let mountName = item.name.replace(/^[^\w]*/, "").trim(); // Remove the emoji

        switch (item.id) {
          case "mount_donkey":
            baseMultiplier = 1.3;
            mountType = "donkey";
            break;
          case "mount_mule":
            baseMultiplier = 1.7;
            mountType = "mule";
            break;
          case "mount_regular_horse":
            baseMultiplier = 2.1;
            mountType = "regular_horse";
            break;
          case "mount_post_horse":
            baseMultiplier = 2.5;
            mountType = "post_horse";
            break;
          case "mount_thoroughbred":
            baseMultiplier = 3.0;
            mountType = "thoroughbred";
            break;
        }

        let refundMsg = "";
        let ownedMounts = [...(prev.ownedMounts || [])];
        if (prev.hasHorse && prev.mount) {
          // Instead of refunding, just add to owned mounts. The `prev.mount` becomes the active mount.
          // Wait, if we keep multiple, let's still refund the active one if we want, OR let them keep it.
          // Let's just keep the active one and add this to ownedMounts too.
          // Actually, we'll keep the refund logic to not break the game economy, but we will add the new mount to ownedMounts. Wait, if we refund, they only ever own ONE mount.
          // trade.md explicitly says "Requires 4 horses". How can they buy 4 horses if buying one refunds the last one?
          // We need to NOT refund, but just add to owned mounts.
        }

        const newMount: import("./types").Mount = {
          type: mountType,
          name: mountName,
          baseSpeedMultiplier: baseMultiplier,
        };
        ownedMounts.push(newMount);

        // Apply +/- 10% variance
        const variance = 1.0 + (Math.random() * 0.2 - 0.1);
        baseMultiplier *= variance;
        newMount.baseSpeedMultiplier *= variance;

        addLogMessage(
          `🐴 MOUNT PURCHASED: ${player.name} bought a ${mountName}! (${baseMultiplier.toFixed(2)}x Overland Speed).`,
          "loot",
        );
        return {
          ...prev,
          gold: nextGold,
          hasHorse: true,
          horseName: mountName,
          mount: newMount, // set as active
          ownedMounts,
        };
      } else if (item.id === "whiskey") {
        nextHp = Math.min(getEffectiveMaxHp(prev), prev.hp + 25);
        addLogMessage(`Downed glass of Rye Whiskey. Restored +25 HP.`, "loot");
      } else if (item.id === "elixir") {
        nextHp = Math.min(getEffectiveMaxHp(prev), prev.hp + 50);
        addLogMessage(
          "Chugged Snake Oil Elixir. Purified wound cells (+50 HP).",
          "loot",
        );
      } else if (
        item.id === "ammo_pistol" ||
        item.id === "ammo_rifle" ||
        item.id === "ammo_shotgun" ||
        item.id === "canteen"
      ) {
        let ammoCount = 0;
        let ammoName = "";
        let details = "";
        if (item.id === "canteen") {
          ammoCount = 5;
          ammoName = "Trail Water Swigs";
          details = "Hydration equivalent doses.";
        } else {
          ammoCount =
            item.id === "ammo_pistol" ? 12 : item.id === "ammo_rifle" ? 10 : 8;
          const nameMap: Record<string, string> = {
            ammo_pistol: ".45 Colt (Pistol)",
            ammo_rifle: ".44-40 (Rifle)",
            ammo_shotgun: "12 Gauge (Shotgun)",
          };
          ammoName = nameMap[item.id];
          details = `Ammunition for ${item.id.replace("ammo_", "")}s.`;
        }

        const exist = nextInventory.find((i) => i.id === item.id);
        if (exist) {
          exist.count += ammoCount;
        } else {
          nextInventory.push({
            id: item.id,
            name: ammoName,
            type: "consumable",
            value: Math.round(item.cost / ammoCount),
            count: ammoCount,
            details: details,
          });
        }
        addLogMessage(
          `Purchased ${ammoCount}x ${ammoName} for $${item.cost}.`,
          "loot",
        );
      } else if (item.id.startsWith("wpn_") && item.weaponStats) {
        nextWeapon = {
          name: item.name,
          dmg: item.weaponStats.dmg,
          range: item.weaponStats.range,
          maxClip: item.weaponStats.maxClip,
          clip: item.weaponStats.maxClip,
          value: Math.round(item.cost / 2),
          condition: item.weaponStats.condition ?? 100,
        };
        addLogMessage(
          `Equipped brand new ${item.name}! Packed chamber cylinders.`,
          "loot",
        );
      } else if (item.id === "ancient_relic") {
        const nextRelics = [...(prev.relics || [])];
        if (!nextRelics.includes(item.name)) {
          nextRelics.push(item.name);
        }
        addLogMessage(
          `Acquired mystical artifact: ${item.name}! Kept securely in the saddlebags.`,
          "loot",
        );
        return {
          ...prev,
          gold: nextGold,
          relics: nextRelics,
        };
      } else {
        // General inventory items
        const exist = nextInventory.find((i) => i.id === item.id);
        if (exist) {
          exist.count += 1;
        } else {
          nextInventory.push({
            id: item.id,
            name: item.name,
            type: item.type,
            value: item.cost,
            count: 1,
            details: item.details,
          });
        }
        addLogMessage(`Purchased ${item.name} into horse carriage.`, "loot");
      }

      return {
        ...prev,
        gold: nextGold,
        hp: nextHp,
        weapon: nextWeapon,
        inventory: nextInventory,
      };
    });
  };

  // Sell valuables
  const handleSellItem = (itemId: string, sellValue: number) => {
    advanceGameTime(2); // Take 2 hours

    setPlayer((prev) => {
      const targetItem = prev.inventory.find((i) => i.id === itemId);
      if (!targetItem) return prev;

      let nextInventory = prev.inventory;
      if (targetItem.count > 1) {
        nextInventory = prev.inventory.map((i) =>
          i.id === itemId ? { ...i, count: i.count - 1 } : i,
        );
      } else {
        nextInventory = prev.inventory.filter((i) => i.id !== itemId);
      }

      addLogMessage(
        `Sold ${targetItem.name} to general merchant for +$${sellValue} Gold.`,
        "loot",
      );
      return {
        ...prev,
        gold: prev.gold + sellValue,
        inventory: nextInventory,
      };
    });
  };

  const handleSellMount = () => {
    advanceGameTime(1);
    setPlayer((prev) => {
      if (!prev.mount || !prev.hasHorse) return prev;

      const mountPrices: Record<string, number> = {
        donkey: 150,
        mule: 350,
        regular_horse: 750,
        post_horse: 1400,
        thoroughbred: 2800,
      };

      let price = Math.floor((mountPrices[prev.mount.type] || 250) * 0.5);

      const hasSilverTongue = prev.perks.includes("silver_tongue");
      if (hasSilverTongue) {
        price = Math.floor(price * 1.2); // Get 20% more when selling with silver tongue
      }

      addLogMessage(
        `💰 SOLD MOUNT: You sold ${prev.mount.name} to the stables for $${price}.`,
        "loot",
      );

      return {
        ...prev,
        gold: prev.gold + price,
        hasHorse: false,
        mount: undefined,
        horseName: undefined,
      };
    });
  };

  const handleBuyTradeItem = (
    goodId: string,
    quantity: number,
    cost: number,
  ) => {
    advanceGameTime(1);

    setWorldLocations((prevLocs) => {
      return prevLocs.map((loc) => {
        if (loc.id === currentLocationId && loc.economyProfile) {
          return {
            ...loc,
            economyProfile: {
              ...loc.economyProfile,
              localInventory: {
                ...loc.economyProfile.localInventory,
                [goodId]: Math.max(
                  0,
                  (loc.economyProfile.localInventory[goodId] || 0) - quantity,
                ),
              },
            },
          };
        }
        return loc;
      });
    });

    setPlayer((prev) => {
      const tradeInventory = [...(prev.tradeInventory || [])];
      const exist = tradeInventory.find((t) => t.itemId === goodId);
      if (exist) {
        exist.quantity += quantity;
      } else {
        tradeInventory.push({ itemId: goodId, quantity });
      }
      addLogMessage(`Bought ${quantity}x trade good for $${cost}.`, "loot");
      return { ...prev, gold: prev.gold - cost, tradeInventory };
    });
  };

  const handleSellTradeItem = (
    goodId: string,
    quantity: number,
    revenue: number,
  ) => {
    advanceGameTime(1);

    setWorldLocations((prevLocs) => {
      return prevLocs.map((loc) => {
        if (loc.id === currentLocationId && loc.economyProfile) {
          return {
            ...loc,
            economyProfile: {
              ...loc.economyProfile,
              localInventory: {
                ...loc.economyProfile.localInventory,
                [goodId]:
                  (loc.economyProfile.localInventory[goodId] || 0) + quantity,
              },
            },
          };
        }
        return loc;
      });
    });

    setPlayer((prev) => {
      let tradeInventory = [...(prev.tradeInventory || [])];
      const exist = tradeInventory.find((t) => t.itemId === goodId);
      if (exist && exist.quantity >= quantity) {
        exist.quantity -= quantity;
        if (exist.quantity <= 0) {
          tradeInventory = tradeInventory.filter((t) => t.itemId !== goodId);
        }
        addLogMessage(
          `Sold ${quantity}x trade good for $${revenue} profit margin!`,
          "loot",
        );
        return { ...prev, gold: prev.gold + revenue, tradeInventory };
      }
      return prev;
    });
  };

  const handleBuyCarriage = (
    carriageType: import("./types").CarriageTier,
    cost: number,
  ) => {
    advanceGameTime(4);
    setPlayer((prev) => {
      addLogMessage(`Acquired Carriage! Max capacity increased.`, "system");
      return {
        ...prev,
        gold: prev.gold - cost,
        activeCarriage: {
          type: carriageType,
          maxWeight: 0,
          mountsRequired: { type: "donkey", count: 1 },
        },
      };
    });
  };

  const handleRaidStash = (locId: string) => {
    const loc = worldLocations.find((l) => l.id === locId);
    if (!loc) return;

    // Always remove from map once interacted with
    setWorldLocations((prev) => prev.filter((l) => l.id !== locId));
    setActiveView("map");

    if (Math.random() < loc.risk) {
      addLogMessage(
        `⚠️ STASH AMBUSHED: You started digging, but armed guards returned!`,
        "danger",
      );
      setCombatType("ambush");
      setCombatRisk(0.75);
      setActiveMissionTarget(null);
      setActiveProvokedNpcId(null);
      setPreCombatView("map");
      setActiveView("combat");
    } else {
      const goldEarned = Math.floor(40 + Math.random() * 80);
      setPlayer((p) => {
        return { ...p, gold: p.gold + goldEarned };
      });
      addLogMessage(`💰 STASH RAIDED: You dug up $${goldEarned}!`, "loot");
    }
  };

  // Drink Whiskey
  const handleDrinkWhiskey = () => {
    if (player.gold < 20) {
      addLogMessage("⚠️ Bar barkeep demands $20 cash for whiskey.", "danger");
      return;
    }

    advanceGameTime(2); // Take 2 hours

    setPlayer((prev) => ({
      ...prev,
      gold: prev.gold - 20,
      hp: Math.min(prev.maxHp, prev.hp + 25),
      hydration: prev.maxHydration ?? 100,
    }));

    addLogMessage(
      "A wild shot of Saloon Bourbon! Restored +25 HP and rehydrated.",
      "loot",
    );
  };

  // Choose perk upon level up
  const handleSelectPerk = (perkId: string) => {
    setPlayer((prev) => {
      if (prev.perks.includes(perkId)) return prev;
      return {
        ...prev,
        perks: [...prev.perks, perkId],
      };
    });
    addLogMessage(
      `🌟 ACQUIRED TALENT: You unlocked the ${perkId.replace("_", " ").toUpperCase()} perk!`,
      "reputation",
    );
  };

  // Initiate bank robbery heist
  const handleHoldUpBank = () => {
    if (!currentLoc) return;

    advanceGameTime(2); // Take 2 hours

    addLogMessage(
      `🚨 STICK UP! You draw your colt on the bank vault teller in ${currentLoc.name}! Alarm bells ring!`,
      "danger",
    );
    setPendingCombat({
      type: "robbery",
      risk: currentLoc.risk,
      mission: null,
      provokedNpcId: null,
      previousView: "town",
    });
  };

  // Launch active bounty hunter battle
  const startActiveBountyBattle = (mission: Mission) => {
    advanceGameTime(2); // Tracking takes 2 hours

    addLogMessage(
      `⚔️ AMBUSH CONTRACT: Tracking ${mission.targetName}. You found their hideout perimeter. Draw weapons!`,
      "danger",
    );
    setPendingCombat({
      type: mission.type,
      risk: currentLoc ? currentLoc.risk : 0.4,
      mission: mission,
      provokedNpcId: null,
      previousView: "town",
    });
  };

  // Handle combat resolution
  const handleCombatVictory = (
    lootGold: number,
    xpReward: number,
    finalHp: number,
    finalClip: number,
    finalAmmo: number,
    survivingPosseIds: string[],
    capturedCount: number,
    finalInjuries: InjurySystem | undefined,
    lootItems: InventoryItem[],
  ) => {
    addLogMessage(
      `🏆 VICTORY: Combat cleared. Scurried outlaws and gained $${lootGold} Gold and +${xpReward} XP.`,
      "loot",
    );

    let nextInventory = [...player.inventory];
    if (lootItems && lootItems.length > 0) {
      const itemNames = lootItems.map((item) => item.name).join(", ");
      addLogMessage(`📦 LOOT: Found items on the bodies: ${itemNames}`, "loot");

      lootItems.forEach((lootItem) => {
        const exist = nextInventory.find((i) => i.id === lootItem.id);
        if (exist) {
          exist.count += lootItem.count;
        } else {
          nextInventory.push(lootItem);
        }
      });
    }

    // Announce any fallen posse members
    if (player.posse && player.posse.length > 0) {
      const fallenMembers = player.posse.filter(
        (p) => !survivingPosseIds.includes(p.id),
      );
      fallenMembers.forEach((fallen) => {
        addLogMessage(
          `🪦 PERMADEATH: Honor to the fallen... Your posse member "${fallen.name}" did not survive the gunfight.`,
          "danger",
        );
      });
    }

    if (capturedCount > 0) {
      // Interrogate captive for clues
      let foundClue = false;
      let clueTarget = "";
      let twistRevealed = false;

      const activeInvestigationsIds = player.inventory
        .filter((i) => i.name.includes("Contract:"))
        .map((i) => i.id);
      if (activeInvestigationsIds.length > 0) {
        setWorldLocations((prev) =>
          prev.map((loc) => {
            return {
              ...loc,
              quests: loc.quests.map((q) => {
                if (
                  activeInvestigationsIds.includes(q.id) &&
                  q.hiddenTargetHex &&
                  !foundClue &&
                  (q.currentCluePoints || 0) < (q.maxClueThreshold || 3)
                ) {
                  foundClue = true;
                  clueTarget = q.targetName;
                  const newClues = (q.currentCluePoints || 0) + 1;
                  let newState = q.questState || "HUNTING";
                  if (
                    newClues === 2 &&
                    q.twistType &&
                    q.twistType !== "STANDARD"
                  ) {
                    twistRevealed = true;
                    newState = "TWIST_REVEALED";
                  }
                  return {
                    ...q,
                    currentCluePoints: newClues,
                    questState: newState,
                  };
                }
                return q;
              }),
            };
          }),
        );

        setTimeout(() => {
          if (foundClue) {
            addLogMessage(
              `🔍 INTERROGATION: You pressed a captured outlaw for answers. "Alright! I'll talk! ${clueTarget} is holed up out there..." (+1 Clue Point)`,
              "loot",
            );
          }
          if (twistRevealed) {
            addLogMessage(
              `⚠️ INVESTIGATION TWIST: The captive revealed a stunning twist about the bounty! Check the map to see the new details.`,
              "danger",
            );
          }
        }, 1500);
      }
    }

    // Check if we cleared an active tracked mission contract
    let missionBonusGold = 0;
    let missionBonusXp = 0;
    let nextRep = player.reputation;

    const isSlipperyPeteCaptured = activeProvokedNpcId === "slippery_pete";

    let nextNemeses = player.nemeses || [];
    if (activeMissionTarget) {
      // Remove from nemesis list if they were targeted
      const defeatedNemesis = nextNemeses.find(
        (n) => n.name === activeMissionTarget.targetName,
      );
      if (defeatedNemesis) {
        nextNemeses = nextNemeses.filter(
          (n) => n.name !== activeMissionTarget.targetName,
        );
        addLogMessage(
          `💀 NEMESIS DEFEATED: The long rivalry with ${activeMissionTarget.targetName} has finally ended.`,
          "loot",
        );
      }

      // Clean target note from our inventory bags
      nextInventory = nextInventory.filter(
        (item) => item.id !== activeMissionTarget.id,
      );

      // Remove from active ledger
      setPlayer((p) => ({
        ...p,
        acceptedQuests: p.acceptedQuests?.filter(
          (q) => q.id !== activeMissionTarget.id,
        ),
      }));

      if (activeMissionTarget.type === "bounty") {
        // Normal Bounties require bringing the captive back
        const capturedItem: InventoryItem = {
          id: `captured_${activeMissionTarget.id}`,
          name: `⛓️ Captured: ${activeMissionTarget.targetName}`,
          type: "value" as const,
          value: activeMissionTarget.rewardGold,
          count: 1,
          details: `Captured outlaw bound inside heavy trail handcuffs. Present this captive to any Town Sheriff Office / Custody Desk in any town district to collect the reward gold ($${activeMissionTarget.rewardGold})!`,
        };
        nextInventory = [...nextInventory, capturedItem];
        addLogMessage(
          `⛓️ OUTLAW BOUND: ${player.name} handcuffed ${activeMissionTarget.targetName}! Report back to any Town Sheriff to claim the reward coin.`,
          "loot",
        );
      } else {
        // Other missions and story quests are immediately rewarded on survival/clear
        missionBonusGold += activeMissionTarget.rewardGold;
        missionBonusXp += activeMissionTarget.rewardXp;
        nextRep = Math.max(
          -100,
          Math.min(
            100,
            player.reputation + activeMissionTarget.reputationChange,
          ),
        );
        addLogMessage(
          `📜 MISSION ACCOMPLISHED: ${activeMissionTarget.title}. Earned $${activeMissionTarget.rewardGold} and ${activeMissionTarget.rewardXp} XP!`,
          "loot",
        );

        if (activeMissionTarget.type === "robbery" && currentLoc) {
          missionBonusGold += currentLoc.bankGold;
          addLogMessage(
            `💰 PLUS BANK VAULT CLEARED! Added ${currentLoc.bankGold} gold bullions from the vault into your pockets!`,
            "loot",
          );
          setWorldLocations((prev) =>
            prev.map((loc) => {
              if (loc.id === currentLoc.id) {
                const newProsperity = Math.max(0, (loc.prosperity || 50) - 20);
                let newFaction = loc.controllingFaction;
                if (newProsperity < 30) newFaction = "outlaws";
                return {
                  ...loc,
                  bankGold: 0,
                  prosperity: newProsperity,
                  controllingFaction: newFaction,
                };
              }
              return loc;
            }),
          );
        }

        // Increase prosperity of mission origin town
        setWorldLocations((prev) =>
          prev.map((loc) => {
            if (loc.id === activeMissionTarget.originLocationId) {
              const increase =
                activeMissionTarget.type === "robbery" ? -15 : 10;
              const newProsperity = Math.max(
                0,
                Math.min(100, (loc.prosperity || 50) + increase),
              );
              let newFaction = loc.controllingFaction;
              if (newProsperity > 60) newFaction = "lawmen";
              else if (newProsperity < 30) newFaction = "outlaws";
              return {
                ...loc,
                prosperity: newProsperity,
                controllingFaction: newFaction,
              };
            }
            return loc;
          }),
        );

        // Spawn next storyline quest if needed
        if (
          activeMissionTarget.isStoryline &&
          activeMissionTarget.nextQuestTemplateId
        ) {
          const nextQ = instantiateStorylineQuest(
            activeMissionTarget.nextQuestTemplateId,
            worldLocations,
            currentLoc!.id,
          );
          if (nextQ) {
            setWorldLocations((prev) =>
              prev.map((loc) => {
                if (loc.id === nextQ.originLocationId) {
                  return { ...loc, quests: [...loc.quests, nextQ] };
                }
                return loc;
              }),
            );
            addLogMessage(
              `📖 NEW STORY CLUE: A rumor leads you forward. Check your town quest boards or overland map!`,
              "travel",
            );
          }
        }
      }

      // Remove completed mission from world town listings so we don't repeat it
      setWorldLocations((prev) =>
        prev.map((loc) => ({
          ...loc,
          quests: loc.quests.filter((q) => q.id !== activeMissionTarget!.id),
        })),
      );
    } else if (isSlipperyPeteCaptured) {
      // Find the tutorial quest in the starting town
      const tutorialQuest = worldLocations[0]?.quests.find(
        (q) => q.id === "tutorial_get_horse",
      );
      if (tutorialQuest) {
        nextInventory = nextInventory.filter(
          (item) => item.id !== tutorialQuest.id,
        );

        const capturedItem: InventoryItem = {
          id: `captured_${tutorialQuest.id}`,
          name: `⛓️ Captured: Slippery Pete`,
          type: "value" as const,
          value: 20,
          count: 1,
          details: `Captured outlaw bound inside heavy trail handcuffs. Present this captive to any Town Sheriff Office / Custody Desk in town to collect the reward gold ($20)!`,
        };
        nextInventory = [...nextInventory, capturedItem];

        // Remove completed mission from starting town lists
        setWorldLocations((prev) =>
          prev.map((loc) => ({
            ...loc,
            quests: loc.quests.filter((q) => q.id !== "tutorial_get_horse"),
          })),
        );

        addLogMessage(
          `⛓️ OUTLAW BOUND: ${player.name} handcuffed Slippery Pete! Head to the Sheriff Office to claim the $20 bounty gold!`,
          "loot",
        );
      }
    } else if (combatType === "train_robbery") {
      const trainLoot = Math.floor(Math.random() * 300) + 150;
      missionBonusGold = trainLoot;
      missionBonusXp = 150;
      nextRep = Math.max(-100, Math.min(100, player.reputation - 25));
      const newBounty = (player.bounty || 0) + 350;

      addLogMessage(
        `💰 TRAIN ROBBERY SUCCESS! Plundered $${trainLoot} gold from the luxury passenger cars and luggage! Your wanted status deepened (-25 Rep) and your bounty increased to $${newBounty}.`,
        "reputation",
      );

      setPlayer((prev) => ({
        ...prev,
        bounty: newBounty,
        factionReputation: {
          ...(prev.factionReputation || { lawmen: 0, outlaws: 0, tribes: 10 }),
          lawmen: Math.max(-100, (prev.factionReputation?.lawmen || 0) - 20),
          outlaws: Math.min(100, (prev.factionReputation?.outlaws || 0) + 20),
        },
      }));
    } else if (combatType === "robbery" && currentLoc) {
      // If it was a successful bank heist robbery
      missionBonusGold = currentLoc.bankGold;
      missionBonusXp = 100;
      nextRep = Math.max(-100, Math.min(100, player.reputation - 30));
      const newBounty = (player.bounty || 0) + 400;

      addLogMessage(
        `💰 BANK ROBBERY SUCCESS! Stashed $${currentLoc.bankGold} gold bullions from the vault into your pockets! Faction alignment shifted towards INFAMY (-30 Rep), bounty increased to $${newBounty}.`,
        "reputation",
      );

      // Drain bank reserve
      setWorldLocations((prev) =>
        prev.map((loc) =>
          loc.id === currentLoc.id ? { ...loc, bankGold: 0 } : loc,
        ),
      );
      setPlayer((prev) => ({
        ...prev,
        bounty: newBounty,
        factionReputation: {
          ...(prev.factionReputation || { lawmen: 0, outlaws: 0, tribes: 10 }),
          lawmen: Math.max(-100, (prev.factionReputation?.lawmen || 0) - 30),
          outlaws: Math.min(100, (prev.factionReputation?.outlaws || 0) + 20),
        },
      }));
    }

    // Accumulating gold, XP and checking Level Up milestones
    setPlayer((prev) => {
      const scavMult = prev.perks.includes("scavenger") ? 1.2 : 1.0;
      const finalGold =
        prev.gold + Math.round(lootGold * scavMult) + missionBonusGold; // bank heist gold is immediate, bounties are claimed at town Sheriff!
      const totalXp = prev.xp + xpReward + missionBonusXp;

      let level = prev.level;
      let nextXpToNext = prev.xpToNextLevel;
      let actualXp = totalXp;
      let newMaxHp = prev.maxHp;
      let newHp = finalHp;

      if (totalXp >= nextXpToNext && level < 10) {
        level += 1;
        actualXp = Math.max(0, totalXp - nextXpToNext);
        nextXpToNext = Math.round(nextXpToNext * 2.1); // exponential scaling (Elite style)

        const staminaGain = Math.floor(Math.random() * 4) + 2;
        newMaxHp = Math.min(75, prev.maxHp + staminaGain); // Ceiling of 75 HP max
        newHp = newHp + (newMaxHp - prev.maxHp);

        addLogMessage(
          `⚡ LEVEL UP! You reached level ${level}! Max HP +${newMaxHp - prev.maxHp}, +0.5 AP.${level >= 3 ? "The next town's got a trait for ya!" : " Your frontier skills organically improve!"}`,
          "reputation",
        );
      }

      const currentDefeated = prev.defeatedNpcs || [];
      const nextDefeated = activeProvokedNpcId
        ? [...currentDefeated, activeProvokedNpcId]
        : currentDefeated;

      const nextFightCount = (prev.weapon.fightCount || 0) + 1;
      const updatedWeapon = {
        ...prev.weapon,
        fightCount: nextFightCount,
      };

      if (nextFightCount === 50) {
        // Triggered upon hitting 50 fights milestone with weapon
        setTimeout(() => {
          addLogMessage(
            `🎉 WEAPON EXPERIENCED: Your ${prev.weapon.name} sidearm has reached 50 active battles! Open your HUD Character Sheet to give it a unique name!`,
            "loot",
          );
        }, 500);
      }

      const ammoItemId = `ammo_${prev.weapon.ammoType || "pistol"}`;
      const ammoTarget = nextInventory.find((i) => i.id === ammoItemId);
      if (ammoTarget) {
        ammoTarget.count = finalAmmo;
        if (ammoTarget.count <= 0) {
          nextInventory = nextInventory.filter((i) => i.id !== ammoItemId);
        }
      } else if (finalAmmo > 0) {
        // Should rarely happen, but just in case
        nextInventory.push({
          id: ammoItemId,
          name: `Ammunition`,
          type: "consumable",
          value: 10,
          count: finalAmmo,
        });
      }

      let returnedInjuries = prev.injuries;
      if (finalInjuries) {
        const {
          newInjuries,
          newInventory: updatedInv,
          logMsgs,
        } = applyAutoBandaging(finalInjuries, nextInventory);
        returnedInjuries = newInjuries;
        nextInventory = updatedInv;

        setTimeout(() => {
          logMsgs.forEach((msg) => addLogMessage(msg, "danger"));
        }, 1000);
      }

      return {
        ...prev,
        hp: newHp,
        maxHp: newMaxHp,
        gold: finalGold,
        xp: actualXp,
        level,
        xpToNextLevel: nextXpToNext,
        reputation: nextRep,
        inventory: nextInventory,
        defeatedNpcs: nextDefeated,
        nemeses: nextNemeses,
        posse: prev.posse
          ? prev.posse.filter((p) => survivingPosseIds.includes(p.id))
          : [],
        weapon: { ...updatedWeapon, clip: finalClip },
        injuries: returnedInjuries,
        stats: {
          ...prev.stats,
          banksRobbed:
            prev.stats.banksRobbed + (combatType === "robbery" ? 1 : 0),
          duelsWon: prev.stats.duelsWon + 1,
        },
      };
    });

    // Populate storytelling details and switch to the narrative victory view!
    setVictoryStoryDetails({
      lootGold,
      xpReward,
      outlawName: activeMissionTarget
        ? activeMissionTarget.targetName
        : isSlipperyPeteCaptured
          ? "Slippery Pete"
          : combatType === "nest_clearing"
            ? "Mojave Scorpions"
            : "Highway Robbers",
      isBounty: !!activeMissionTarget || isSlipperyPeteCaptured,
      isRobbery: combatType === "robbery",
    });

    setActiveView("victory_story");
  };

  const handleCombatDefeat = () => {
    if (combatType === "ambush") {
      let msg = `⚠️ AMBUSHED & ROBBED! Thugs beat you down and stole all your $${player.gold} pocket gold! They left you in the dirt.`;
      if (player.tradeInventory && player.tradeInventory.length > 0) {
        msg = `⚠️ AMBUSHED & ROBBED! Thugs beat you down, stole all your $${player.gold} gold, AND hijacked your entire cargo supply!`;
      }

      addLogMessage(msg, "danger");
      setPlayer((prev) => ({
        ...prev,
        gold: 0,
        hp: Math.max(15, Math.floor(prev.maxHp * 0.2)),
        tradeInventory: [],
      }));
      setActiveView("ambush_defeat");
    } else {
      addLogMessage(
        "☠️ Wounded in the deserts... Gila vultures picked your pockets clean.",
        "danger",
      );

      const currentHighScore = parseInt(
        safeLocalStorage.getItem("frontierHighScoreDays") || "0",
        10,
      );
      if (
        player.stats?.daysSurvived &&
        player.stats.daysSurvived > currentHighScore
      ) {
        safeLocalStorage.setItem(
          "frontierHighScoreDays",
          player.stats.daysSurvived.toString(),
        );
      }

      setActiveView("gameover");
    }
  };

  const handleCloseVictoryStory = () => {
    setActiveMissionTarget(null);
    setActiveProvokedNpcId(null);
    setVictoryStoryDetails(null);
    setActiveView(preCombatView); // Retain where they were standing before combat!
  };

  const handleSaveGame = () => {
    const saveData = {
      player,
      worldLocations,
      currentLocationId,
      activeView,
      logs,
      playerX,
      playerY,
      gameTimeHour,
      passedSectors,
    };
    try {
      safeLocalStorage.setItem("frontierSave", JSON.stringify(saveData));
      addLogMessage("💾 Game saved successfully.", "system");
    } catch (err) {
      addLogMessage("⚠️ Failed to save game.", "danger");
    }
  };

  const handleLoadGame = () => {
    try {
      const saveDataString = safeLocalStorage.getItem("frontierSave");
      if (saveDataString) {
        const saveData = JSON.stringify(JSON.parse(saveDataString));
        const data = JSON.parse(saveData);
        if (data.player) setPlayer(data.player);
        if (data.worldLocations) setWorldLocations(data.worldLocations);
        if (data.currentLocationId)
          setCurrentLocationId(data.currentLocationId);
        if (data.activeView) setActiveView(data.activeView);
        if (data.logs) setLogs(data.logs);
        if (data.playerX !== undefined) setPlayerX(data.playerX);
        if (data.playerY !== undefined) setPlayerY(data.playerY);
        if (data.gameTimeHour !== undefined) setGameTimeHour(data.gameTimeHour);
        if (data.passedSectors) setPassedSectors(data.passedSectors);
        addLogMessage("💾 Game loaded successfully.", "system");
      } else {
        addLogMessage("⚠️ No saved game found.", "danger");
      }
    } catch (err) {
      addLogMessage("⚠️ Failed to load game.", "danger");
    }
  };

  const handleCollectBounty = (itemId: string) => {
    const item = player.inventory.find((i) => i.id === itemId);
    if (!item) return;

    // Extract quest ID or check for special id
    const questId = itemId.replace("captured_", "");
    const isSlipperyPete =
      itemId.includes("tutorial_get_horse") || itemId.includes("slippery_pete");

    // Find original mission
    let originalMission: Mission | null = null;
    for (const loc of worldLocations) {
      const m = loc.quests.find((q) => q.id === questId);
      if (m) originalMission = m;
    }

    const bountyGold = originalMission
      ? originalMission.rewardGold
      : isSlipperyPete
        ? 350
        : 250;
    const xpReward = originalMission
      ? originalMission.rewardXp
      : isSlipperyPete
        ? 80
        : 50;
    const repChange = originalMission
      ? originalMission.reputationChange
      : isSlipperyPete
        ? 15
        : 10;
    const outlawName = item.name
      .replace("⛓️ Captured: ", "")
      .replace("⛓️ Handcuffed: ", "");

    setActiveBountyClaim({
      itemId,
      outlawName,
      bountyGold,
      xpReward,
      repChange,
    });

    setActiveView("sheriff_meeting");
  };

  const handlePocketBounty = () => {
    if (!activeBountyClaim) return;

    const { itemId, bountyGold, xpReward, repChange } = activeBountyClaim;

    // Increase current town prosperity since we delivered outlaw there
    if (activeView === "sheriff_meeting" || activeView === "town") {
      setWorldLocations((prev) =>
        prev.map((loc) => {
          if (loc.id === currentLocationId) {
            const newProsperity = Math.max(
              0,
              Math.min(100, (loc.prosperity || 50) + 15),
            );
            let newFaction = loc.controllingFaction;
            if (newProsperity > 60) newFaction = "lawmen";
            return {
              ...loc,
              prosperity: newProsperity,
              controllingFaction: newFaction,
            };
          }
          return loc;
        }),
      );
    }

    setPlayer((prev) => {
      const bhMult = prev.perks.includes("bounty_hunter") ? 1.2 : 1.0;
      const finalBountyGold = Math.round(bountyGold * bhMult);

      const nextInv = prev.inventory.filter((i) => i.id !== itemId);
      const totalXp = prev.xp + xpReward;
      let level = prev.level;
      let nextXpToNext = prev.xpToNextLevel;
      let actualXp = totalXp;
      let newMaxHp = prev.maxHp;

      if (totalXp >= nextXpToNext && level < 10) {
        level += 1;
        actualXp = Math.max(0, totalXp - nextXpToNext);
        nextXpToNext = Math.round(nextXpToNext * 2.1); // exponential scaling

        const staminaGain = Math.floor(Math.random() * 4) + 2;
        newMaxHp = Math.min(75, prev.maxHp + staminaGain); // Ceiling of 75 HP max
        addLogMessage(
          `⚡ LEVEL UP! ${player.name} reached level ${level}! Max HP +${newMaxHp - prev.maxHp}, +0.5 AP.${level >= 3 ? " A new Trait awaits in town!" : ""}`,
          "reputation",
        );
      }

      const nextRep = Math.max(
        -100,
        Math.min(100, prev.reputation + repChange),
      );

      const currentFactionRep = prev.factionReputation || {
        lawmen: 0,
        outlaws: 0,
        tribes: 0,
      };
      const nextLawmenRep = Math.min(100, currentFactionRep.lawmen + 10);
      const nextOutlawsRep = Math.max(-100, currentFactionRep.outlaws - 20); // Severely angers outlaws to take bounties

      return {
        ...prev,
        gold: prev.gold + finalBountyGold,
        hp: prev.hp + (newMaxHp - prev.maxHp),
        maxHp: newMaxHp,
        xp: actualXp,
        level,
        xpToNextLevel: nextXpToNext,
        reputation: nextRep,
        factionReputation: {
          ...currentFactionRep,
          lawmen: nextLawmenRep,
          outlaws: nextOutlawsRep,
        },
        inventory: nextInv,
        stats: {
          ...prev.stats,
          bountiesCollected: prev.stats.bountiesCollected + 1,
        },
      };
    });

    addLogMessage(
      `💰 BOUNTY CLAIMED: Handed over ${activeBountyClaim.outlawName} custody. Pocketed reward of $${bountyGold} Gold!`,
      "reputation",
    );

    setActiveBountyClaim(null);
    setActiveView("town");
  };

  const handleUpgradeCampSkill = () => {
    if (player.gold < 100) return;
    setPlayer((prev) => ({
      ...prev,
      gold: Math.max(0, prev.gold - 100),
      campMovementLvl: (prev.campMovementLvl || 0) + 1,
    }));
    addLogMessage(
      "⛺ CAMP TRAINING: Spent $100 gold and completed campfire run mobility training. Max Combat AP increased by +1!",
      "reputation",
    );
  };

  const handleBuyDoublePistol = () => {
    if (player.gold < 250 || player.perks.includes("akimbo")) return;
    setPlayer((prev) => ({
      ...prev,
      gold: Math.max(0, prev.gold - 250),
      perks: [...prev.perks, "akimbo"],
    }));
    addLogMessage(
      "⛺ CAMP TRAINING: Spent $250 gold on Double Pistol Yielder. You can now dual wield pistols in combat!",
      "loot",
    );
  };

  const handleBuyFastShooter = () => {
    if (player.gold < 250 || player.perks.includes("fast_shooter")) return;
    setPlayer((prev) => ({
      ...prev,
      gold: Math.max(0, prev.gold - 250),
      perks: [...prev.perks, "fast_shooter"],
    }));
    addLogMessage(
      "⛺ CAMP TRAINING: Spent $250 gold on Fast Shooter. Each gun can fire 2 shots in duels!",
      "loot",
    );
  };

  const handleDismissPosseMember = (id: string) => {
    setPlayer((prev) => {
      const target = prev.posse ? prev.posse.find((m) => m.id === id) : null;
      const filtered = prev.posse ? prev.posse.filter((m) => m.id !== id) : [];
      if (target) {
        addLogMessage(
          `👋 DISMISSED: ${player.name} paid off ${target.name} and dismissed them from his protection detail.`,
          "system",
        );
      }
      return {
        ...prev,
        posse: filtered,
      };
    });
  };

  // Drop / Discard weight item from saddlebag priority list
  const handleDropItem = (itemId: string) => {
    setPlayer((prev) => {
      const matchItem = prev.inventory.find((i) => i.id === itemId);
      let nextInv = prev.inventory;
      if (matchItem) {
        if (matchItem.count > 1) {
          nextInv = prev.inventory.map((i) =>
            i.id === itemId ? { ...i, count: i.count - 1 } : i,
          );
        } else {
          nextInv = prev.inventory.filter((i) => i.id !== itemId);
        }
        addLogMessage(
          `🗑️ Discarded 1x ${matchItem.name} onto badlands dust to lighten horse baggage.`,
          "system",
        );
      }
      return {
        ...prev,
        inventory: nextInv,
      };
    });
  };

  // Custom rename horse companion
  const handleRenameHorse = (newName: string) => {
    setPlayer((prev) => ({
      ...prev,
      horseName: newName,
    }));
    addLogMessage(
      `🐴 STEED CUSTOMIZATION: You registered your companion steed's official territory name as: "${newName}"!`,
      "system",
    );
  };

  // Custom rename battle-hardened weapon
  const handleRenameWeapon = (newName: string) => {
    setPlayer((prev) => ({
      ...prev,
      weapon: {
        ...prev.weapon,
        customName: newName,
      },
    }));
    addLogMessage(
      `🔫 WEAPON ENGRAVING: You have engraved custom details onto your sidearm, naming it: "${newName}"!`,
      "loot",
    );
  };
  const handleAttachWeaponPart = (
    part: InventoryItem,
    slot: "barrel" | "cylinder" | "stock" | "action",
  ) => {
    setPlayer((prev) => {
      const currentEquippedParts = prev.weapon.equippedParts || {};
      const nextInventory = prev.inventory.filter((i) => i.id !== part.id);

      // If there's an existing part in this slot, return it to inventory
      const existingPart = currentEquippedParts[slot];
      if (existingPart) {
        nextInventory.push(existingPart);
      }

      // Remove previous perks and add new perks
      let nextBaseUpgrades = { ...prev.weaponUpgrades };

      if (existingPart?.partStats?.perks) {
        existingPart.partStats.perks.forEach((p: any) => {
          if (p.accuracyBonus)
            nextBaseUpgrades.accuracyBonus =
              (nextBaseUpgrades.accuracyBonus || 0) - p.accuracyBonus;
          if (p.maxClipBonus)
            nextBaseUpgrades.clipBonus =
              (nextBaseUpgrades.clipBonus || 0) - p.maxClipBonus;
          if (p.dmgBonus)
            nextBaseUpgrades.dmgBonus =
              (nextBaseUpgrades.dmgBonus || 0) - p.dmgBonus;
          if (p.apCostReduction)
            nextBaseUpgrades.apCostReduction =
              (nextBaseUpgrades.apCostReduction || 0) - p.apCostReduction;
        });
      }

      if (part.partStats?.perks) {
        part.partStats.perks.forEach((p: any) => {
          if (p.accuracyBonus)
            nextBaseUpgrades.accuracyBonus =
              (nextBaseUpgrades.accuracyBonus || 0) + p.accuracyBonus;
          if (p.maxClipBonus)
            nextBaseUpgrades.clipBonus =
              (nextBaseUpgrades.clipBonus || 0) + p.maxClipBonus;
          if (p.dmgBonus)
            nextBaseUpgrades.dmgBonus =
              (nextBaseUpgrades.dmgBonus || 0) + p.dmgBonus;
          if (p.apCostReduction)
            nextBaseUpgrades.apCostReduction =
              (nextBaseUpgrades.apCostReduction || 0) + p.apCostReduction;
        });
      }

      const newEquippedParts = { ...currentEquippedParts, [slot]: part };

      // Calculate new base condition as an average of parts equipped + default base
      const partsArr = Object.values(newEquippedParts).filter(
        Boolean,
      ) as InventoryItem[];
      let weaponCondition = prev.weapon.condition || 100;
      if (partsArr.length > 0) {
        const partsCondSum = partsArr.reduce(
          (sum, p) => sum + (p.partStats?.condition || 0),
          0,
        );
        // Let's do a weighted average where base weapon is 1 part weight
        weaponCondition = (100 + partsCondSum) / (1 + partsArr.length);
      }

      addLogMessage(
        `🔧 GUNSMITH: Slotted "${part.name}" onto ${prev.weapon.customName || prev.weapon.name}. Stats adjusted!`,
        "reputation",
      );

      return {
        ...prev,
        inventory: nextInventory,
        weaponUpgrades: nextBaseUpgrades,
        weapon: {
          ...prev.weapon,
          condition: weaponCondition,
          equippedParts: newEquippedParts,
        },
      };
    });
  };

  const handleDetachWeaponPart = (
    slot: "barrel" | "cylinder" | "stock" | "action",
  ) => {
    setPlayer((prev) => {
      const currentEquippedParts = prev.weapon.equippedParts || {};
      const existingPart = currentEquippedParts[slot];
      if (!existingPart) return prev;

      const nextInventory = [...prev.inventory, existingPart];
      const newEquippedParts = { ...currentEquippedParts };
      delete newEquippedParts[slot];

      const nextBaseUpgrades = { ...prev.weaponUpgrades };
      if (existingPart.partStats?.perks) {
        existingPart.partStats.perks.forEach((p: any) => {
          if (p.accuracyBonus)
            nextBaseUpgrades.accuracyBonus =
              (nextBaseUpgrades.accuracyBonus || 0) - p.accuracyBonus;
          if (p.maxClipBonus)
            nextBaseUpgrades.clipBonus =
              (nextBaseUpgrades.clipBonus || 0) - p.maxClipBonus;
          if (p.dmgBonus)
            nextBaseUpgrades.dmgBonus =
              (nextBaseUpgrades.dmgBonus || 0) - p.dmgBonus;
          if (p.apCostReduction)
            nextBaseUpgrades.apCostReduction =
              (nextBaseUpgrades.apCostReduction || 0) - p.apCostReduction;
        });
      }

      const partsArr = Object.values(newEquippedParts).filter(
        Boolean,
      ) as InventoryItem[];
      // Removing a part shouldn't magically repair the gun to 100%.
      // Let's just keep the current overall condition, or do a more realistic re-average.
      let weaponCondition = prev.weapon.condition || 100;

      addLogMessage(
        `🔧 GUNSMITH: Detached "${existingPart.name}" from ${prev.weapon.customName || prev.weapon.name}.`,
        "reputation",
      );

      return {
        ...prev,
        inventory: nextInventory,
        weaponUpgrades: nextBaseUpgrades,
        weapon: {
          ...prev.weapon,
          condition: weaponCondition,
          equippedParts: newEquippedParts,
        },
      };
    });
  };

  const handleEquipWeapon = (itemId: string) => {
    setPlayer((prev) => {
      const selectedWeapon = prev.inventory.find((i) => i.id === itemId);
      if (!selectedWeapon) return prev;

      // Extract details
      const oldWeaponId =
        "wpn_" + prev.weapon.name.toLowerCase().replace(/[^a-z0-9]/g, "_");
      const oldWeaponItem = {
        id: oldWeaponId,
        name: prev.weapon.name,
        type: "weapon" as const,
        value: prev.weapon.value,
        count: 1,
        details: `Sidearm. Weapon power: ${prev.weapon.dmg} HP, Range: ${prev.weapon.range} tiles.`,
      };

      // Set stats of target weapon
      let baseDmg = selectedWeapon.weaponStats?.dmg || 12;
      let baseRange = selectedWeapon.weaponStats?.range || 4;
      let baseClip = selectedWeapon.weaponStats?.maxClip || 6;
      let caliber: "pistol" | "rifle" | "shotgun" =
        selectedWeapon.weaponStats?.ammoType || "pistol";

      if (!selectedWeapon.weaponStats) {
        if (itemId.includes("shotgun")) {
          baseDmg = 35;
          baseRange = 3;
          baseClip = 2;
          caliber = "shotgun";
        } else if (itemId.includes("rifle")) {
          baseDmg = 28;
          baseRange = 8;
          baseClip = 6;
          caliber = "rifle";
        } else {
          baseDmg = 18;
          baseRange = 5;
          baseClip = 6;
          caliber = "pistol";
        }
      }

      const activeWeapon = {
        name: selectedWeapon.name,
        dmg: baseDmg,
        range: baseRange,
        maxClip: baseClip,
        clip: baseClip,
        value: selectedWeapon.value,
        condition: selectedWeapon.weaponStats?.condition || 100,
        ammoType: caliber,
      };

      // Filter out new equipped gun, push previously equipped gun back into saddlebags
      const nextInv = prev.inventory.filter((i) => i.id !== itemId);
      nextInv.push(oldWeaponItem);

      addLogMessage(
        `🔫 Ready Sidearm: ${player.name} equipped ${selectedWeapon.name}!`,
        "loot",
      );

      return {
        ...prev,
        weapon: activeWeapon,
        inventory: nextInv,
      };
    });
  };

  // permanent gun mods crafting
  const handleCraftUpgrade = (
    upgradeType: "barrel" | "clip" | "scope" | "rifling",
    materialsUsed: { [key: string]: number },
  ) => {
    advanceGameTime(2); // taking 2 hours
    setPlayer((prev) => {
      let nextInv = [...prev.inventory];
      Object.entries(materialsUsed).forEach(([matId, countNeeded]) => {
        const mat = nextInv.find((i) => i.id === matId);
        if (mat) {
          if (mat.count > countNeeded) {
            mat.count -= countNeeded;
          } else {
            nextInv = nextInv.filter((i) => i.id !== matId);
          }
        }
      });

      const nextUpgrades = prev.weaponUpgrades
        ? { ...prev.weaponUpgrades }
        : {
            dmgBonus: 0,
            rangeBonus: 0,
            clipBonus: 0,
            accuracyBonus: 0,
            hasScope: false,
          };

      let bonusText = "";
      if (upgradeType === "barrel") {
        nextUpgrades.dmgBonus += 8;
        bonusText = "Heavy Steel Barrel (+8 Sidearm Dmg)";
      } else if (upgradeType === "clip") {
        nextUpgrades.clipBonus += 4;
        bonusText = "Extended Cylindrical Drum Cylinder (+4 cylinder capacity)";
      } else if (upgradeType === "scope") {
        nextUpgrades.hasScope = true;
        nextUpgrades.rangeBonus += 3;
        nextUpgrades.accuracyBonus += 30;
        bonusText =
          "Optical Scope Alignment (+3 Range, +30% Combat Accuracy, Firing takes 2 AP)";
      } else if (upgradeType === "rifling") {
        nextUpgrades.accuracyBonus += 15;
        bonusText = "Campfire Rifling Grooves (+15% trigger accuracy)";
      }

      addLogMessage(
        `🔧 GUNSMITH UPGRADE: Swirled sparks and forged ${bonusText}!`,
        "reputation",
      );

      return {
        ...prev,
        weaponUpgrades: nextUpgrades,
        inventory: nextInv,
      };
    });
  };

  // crafting whole new sidearms
  const handleCraftWeapon = (
    weaponName: string,
    weaponId: string,
    stats: { dmg: number; range: number; maxClip: number },
    materialsUsed: { [key: string]: number },
  ) => {
    advanceGameTime(2); // taking 2 hours
    setPlayer((prev) => {
      let nextInv = [...prev.inventory];
      Object.entries(materialsUsed).forEach(([matId, countNeeded]) => {
        const mat = nextInv.find((i) => i.id === matId);
        if (mat) {
          if (mat.count > countNeeded) {
            mat.count -= countNeeded;
          } else {
            nextInv = nextInv.filter((i) => i.id !== matId);
          }
        }
      });

      nextInv.push({
        id: weaponId,
        name: weaponName,
        type: "weapon",
        value: 120,
        count: 1,
        details: `Special firearm. Power: ${stats.dmg} Dmg, Max Range: ${stats.range} tiles.`,
        weaponStats: {
          dmg: stats.dmg,
          range: stats.range,
          maxClip: stats.maxClip,
          condition: 100,
          ammoType: weaponName.toLowerCase().includes("shotgun")
            ? "shotgun"
            : weaponName.toLowerCase().includes("rifle")
              ? "rifle"
              : "pistol",
        },
      });

      addLogMessage(
        `🔧 GUNSMITH SUCCESS: Successfully forged a brand new ${weaponName}! Stashed in bags (Weighs ${weaponName.includes("Shotgun") ? "10" : "12"} lbs).`,
        "loot",
      );

      return {
        ...prev,
        inventory: nextInv,
      };
    });
  };

  // Restart trigger
  const handleRestart = () => {
    const freshMap = generateWorldMap();
    setWorldLocations(freshMap);
    setCurrentLocationId(freshMap[0].id);

    setPlayer({
      gender: "male",
      avatarImage: hero1Img,
      name: "The Stranger",
      hp: 35,
      maxHp: 35,
      hydration: 100,
      maxHydration: 100,
      gold: 25,
      bounty: 0,
      level: 1,
      xp: 0,
      xpToNextLevel: 100,
      perks: [],
      reputation: 0,
      weapon: {
        name: "Rusty Colt Revolver",
        dmg: 12,
        range: 4,
        maxClip: 6,
        clip: 6,
        value: 30,
      },
      factionReputation: {
        lawmen: 0,
        outlaws: 0,
        tribes: 10,
      },
      weaponUpgrades: {
        dmgBonus: 0,
        rangeBonus: 0,
        clipBonus: 0,
        accuracyBonus: 0,
        hasScope: false,
      },
      inventory: [],
      tradeInventory: [],
      activeCarriage: null,
      hasHorse: false,
      posse: [],
      pistolSkill: 0,
      rifleSkill: 0,
      reloadSkill: 0,
      horsemanship: 0,
      campMovementLvl: 0,
      stats: {
        duelsWon: 0,
        bountiesCollected: 0,
        banksRobbed: 0,
        daysSurvived: 0,
      },
    });

    setLogs([]);
    addLogMessage(
      "🌵 Saddle up! A fresh frontier awaits your courage.",
      "system",
    );
    setActiveView("intro");
  };

  // Find active contracts in player bags targeting this specific location
  const currentTownMissionsTracked = player.inventory
    ? player.inventory
        .map((item) => {
          // Find corresponding real mission structural info
          for (const loc of worldLocations) {
            const m = loc.quests?.find((q) => q.id === item.id);
            if (m) return m;
          }
          return null;
        })
        .filter(
          (m): m is Mission =>
            m !== null &&
            m.targetLocationId === currentLocationId &&
            !m.hiddenTargetHex,
        )
    : [];

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#eedfb8_0%,_#cbae82_100%)] text-[#3d2d21] font-sans flex flex-col select-none selection:bg-[#3d2d21] selection:text-white pb-6 border-t-[8px] border-[#bfae96] relative">
      <div className="absolute inset-0 opacity-10 bg-grid-pattern pointer-events-none mix-blend-overlay z-0" />
      <div className="relative z-10 flex-1 flex flex-col">
        {/* Dynamic Header Navbar Bar matching Immersive UI Mockup */}
        <header className="h-20 bg-[#e8dec7] border-b-2 border-[#bfae96] flex items-center justify-between px-6 md:px-8 shadow-2xl z-40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#e8b923]/10 border border-[#e8b923]/30 rounded-full flex items-center justify-center text-[#8c6b0c]">
              <Skull className="animate-pulse text-[#8c6b0c]" size={18} />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] tracking-widest text-[#664d36] uppercase font-serif">
                Wild West Roguelike
              </span>
              <h1 className="text-lg md:text-xl font-bold text-[#8c6b0c] drop-shadow-md font-serif tracking-wide">
                Rogue Pistolero
              </h1>
            </div>
          </div>

          {/* Global Stats HUD quick stats - styled as Immersive UI */}
          <div className="flex gap-4 lg:gap-8 items-center">
            {/* Vitality Gauge */}
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-[9px] uppercase text-[#664d36] font-serif tracking-wider">
                Vitality
              </span>
              <div className="w-24 md:w-32 h-2 bg-[#2d0a0a] rounded-full mt-1 border border-[#4d1a1a] overflow-hidden">
                <div
                  className="h-full bg-[#c4451a] rounded-full shadow-[0_0_8px_#c4451a] transition-all duration-300"
                  style={{
                    width: `${Math.round((player.hp / Math.max(1, getEffectiveMaxHp(player))) * 100)}%`,
                  }}
                />
              </div>
              {/* Hydration Bar */}
              <div
                className="w-24 md:w-32 h-1.5 bg-[#0a1a2d] rounded-full mt-1 border border-[#1a3a4d] overflow-hidden"
                title={`Hydration: ${Math.round(player.hydration)}/${player.maxHydration}`}
              >
                <div
                  className="h-full bg-[#1e88e5] rounded-full shadow-[0_0_8px_#1e88e5] transition-all duration-300"
                  style={{
                    width: `${Math.round((Math.max(0, player.hydration) / Math.max(1, player.maxHydration)) * 100)}%`,
                  }}
                />
              </div>
            </div>

            {/* Player level standing */}
            <div className="flex flex-col items-center px-4 border-l border-[#bfae96]">
              <span className="text-[9px] uppercase text-[#664d36] font-serif tracking-wider">
                Level
              </span>
              <span className="text-lg md:text-xl font-mono text-[#8c6b0c] font-bold">
                {player.level}
              </span>
            </div>

            {/* Bullet Ammo Status Indicator */}
            <div className="hidden md:flex flex-col items-center px-4 border-l border-[#bfae96]">
              <span className="text-[9px] uppercase text-[#664d36] font-serif tracking-wider">
                AMMO
              </span>
              <span className="text-sm font-mono text-[#2a8ec4] font-bold">
                {player.weapon.clip} /{" "}
                {player.inventory.find(
                  (i) => i.id === `ammo_${player.weapon.ammoType || "pistol"}`,
                )?.count || 0}
              </span>
            </div>

            {/* Gold Nuggets Display matching Design HTML exactly */}
            <div className="flex items-center gap-2.5 pl-4 border-l border-[#bfae96]">
              <div className="text-right">
                <span className="text-[9px] uppercase block text-[#664d36] font-serif tracking-widest">
                  Gold Nuggets
                </span>
                <span className="text-base md:text-lg font-mono text-[#8c6b0c] font-bold">
                  {player.gold}
                </span>
              </div>
              <div className="w-9 h-9 bg-[#e8b923]/10 border border-[#e8b923]/30 rounded flex items-center justify-center text-[#8c6b0c] text-lg font-bold font-serif shadow-md">
                $
              </div>
            </div>

            {/* Wanted Bounty */}
            {(player.bounty || 0) > 0 && (
              <div className="hidden sm:flex items-center gap-2.5 pl-4 border-l border-[#bfae96]">
                <div className="text-right">
                  <span className="text-[9px] uppercase block text-red-500 font-serif tracking-widest animate-pulse">
                    Wanted Bounty
                  </span>
                  <span className="text-sm md:text-md font-mono text-red-600 font-bold">
                    ${player.bounty}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Guide and menu settings */}
          <div className="flex items-center gap-1.5 pl-4 ml-2 border-l border-[#bfae96]/60">
            {/* God Mode Commented Out
            <button
              onClick={() => setIsGodModeOpen(true)}
              className="w-10 h-10 border border-[#bfae96] bg-[#dcd1b9] rounded flex justify-center items-center text-[#664d36] hover:bg-[#cbae82] hover:text-[#3d2d21] object-contain transition-colors cursor-pointer mr-1 relative group"
            >
              <ShieldAlert size={18} />
              <div className="absolute right-0 top-12 bg-stone-800 text-stone-200 text-[10px] px-2 py-1 rounded hidden group-hover:block whitespace-nowrap z-50">
                God Mode
              </div>
            </button>
            */}

            <button
              id="btn-sound-toggle"
              onClick={() => {
                const nextMute = !isMuted;
                setIsMuted(nextMute);
                // user clicked, trigger the audio context
                FrontierAudio.setMute(nextMute);
                if (!nextMute) {
                  if (activeView === "intro" || activeView === "map") {
                    FrontierAudio.playMusic("world");
                  } else if (activeView === "town") {
                    FrontierAudio.playMusic("town");
                  }
                }
              }}
              className={`p-1 px-2.5 rounded border transition-all cursor-pointer flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider font-serif ${isMuted ? "bg-red-950/20 text-red-400 border-red-900/40" : "bg-green-950/20 text-green-400 border-green-900/40 animate-pulse"}`}
              title={
                isMuted
                  ? "Click to enable looping frontier background music loops!"
                  : "Mute procedural ambient soundscapes"
              }
            >
              {isMuted ? <VolumeX size={12} /> : <Volume2 size={12} />}
              <span>Music: {isMuted ? "OFF 🔇" : "ON 🔊"}</span>
            </button>

            <button
              onClick={() => handleSaveGame()}
              className="p-1 px-2.5 rounded bg-[#f4ead5] text-[#4a3928] hover:text-[#8c6b0c] border border-[#bfae96] transition-all cursor-pointer flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider font-serif"
            >
              <Save size={12} className="text-[#8c6b0c]" />
              <span className="hidden sm:inline">Save</span>
            </button>

            <button
              onClick={() => handleLoadGame()}
              className="p-1 px-2.5 rounded bg-[#f4ead5] text-[#4a3928] hover:text-[#8c6b0c] border border-[#bfae96] transition-all cursor-pointer flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider font-serif"
            >
              <Download size={12} className="text-[#8c6b0c]" />
              <span className="hidden sm:inline">Load</span>
            </button>

            <button
              id="btn-help-modal"
              onClick={() => setShowHelpModal(true)}
              className="p-1 px-2.5 rounded bg-[#f4ead5] text-[#4a3928] hover:text-[#8c6b0c] border border-[#bfae96] transition-all cursor-pointer flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider font-serif"
            >
              <HelpCircle size={12} className="text-[#8c6b0c]" />
              <span className="hidden sm:inline">Guide</span>
            </button>
          </div>
        </header>

        {/* Nav Menu Tab Row wrapper */}
        {activeView !== "intro" &&
          activeView !== "combat" &&
          activeView !== "gameover" &&
          activeView !== "victory_story" &&
          activeView !== "sheriff_meeting" && (
            <div className="bg-[#f4ead5] border-b border-[#bfae96] px-5 py-2.5 flex items-center justify-between">
              <div className="flex gap-2">
                <button
                  id="btn-open-map"
                  onClick={() => setActiveView("map")}
                  className={`py-1.5 px-4 rounded-sm font-bold uppercase transition-all flex items-center gap-1.5 text-[11px] tracking-wider font-serif ${
                    activeView === "map"
                      ? "bg-[#3d2d21] text-[#8c6b0c] border border-[#8a705a]"
                      : "text-[#664d36] hover:text-[#3d2d21] bg-[#dcd1b9]/40 border border-[#bfae96]"
                  }`}
                >
                  <Map size={12} className="text-[#8c6b0c]" />
                  <span>Overland Map</span>
                </button>

                <button
                  id="btn-open-town"
                  onClick={() => setActiveView("town")}
                  className={`py-1.5 px-4 rounded-sm font-bold uppercase transition-all flex items-center gap-1.5 text-[11px] tracking-wider font-serif ${
                    activeView === "town"
                      ? "bg-[#3d2d21] text-[#8c6b0c] border border-[#8a705a]"
                      : "text-[#664d36] hover:text-[#3d2d21] bg-[#dcd1b9]/40 border border-[#bfae96]"
                  }`}
                >
                  <Compass size={12} className="text-[#8c6b0c]" />
                  <span>Town District</span>
                </button>

                {/* <button
                  id="btn-open-data"
                  onClick={() => setActiveView("data")}
                  className={`py-1.5 px-4 rounded-sm font-bold uppercase transition-all flex items-center gap-1.5 text-[11px] tracking-wider font-serif ${
                    activeView === "data"
                      ? "bg-[#3d2d21] text-[#8c6b0c] border border-[#8a705a]"
                      : "text-[#664d36] hover:text-[#3d2d21] bg-[#dcd1b9]/40 border border-[#bfae96]"
                  }`}
                >
                  <Database size={12} className="text-[#8c6b0c]" />
                  <span>Daten Explorer</span>
                </button> */}

                <button
                  id="btn-open-ledger"
                  onClick={() => setShowLedgerModal(true)}
                  className={`py-1.5 px-4 rounded-sm font-bold uppercase transition-all flex items-center gap-1.5 text-[11px] tracking-wider font-serif text-[#664d36] hover:text-[#3d2d21] bg-[#dcd1b9]/40 border border-[#bfae96]`}
                >
                  <span className="text-[#8c6b0c]">📜</span>
                  <span>Ledger</span>
                </button>
              </div>

              <span className="text-[10px] font-sans text-[#664d36] italic hidden md:inline">
                📍 Currently camped at {currentLoc?.name || "Gallows Ridge"}{" "}
                District
              </span>
            </div>
          )}

        {/* Primary Central Container */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 mt-5 grid grid-cols-1 lg:grid-cols-12 gap-5 relative">
          {/* Intro Story slide Screen overlay */}
          {activeView === "intro" && (
            <div className="lg:col-span-12 max-w-2xl mx-auto w-full bg-[#f4ead5] border border-[#bfae96] rounded-sm p-6 py-10 text-center flex flex-col items-center justify-center space-y-6 shadow-2xl relative my-8">
              <div className="absolute top-0 right-0 p-4 opacity-5 text-[#664d36]">
                <Skull size={180} />
              </div>

              <Skull size={48} className="text-[#8c6b0c]" />

              <div className="space-y-2">
                <h2 className="text-2xl font-bold uppercase tracking-wide text-[#8c6b0c] font-serif">
                  Rogue Pistolero
                </h2>
                <div className="w-16 h-0.5 bg-[#e8b923]" />
              </div>

              <p className="text-[#4a3928] text-xs font-sans leading-relaxed max-w-xl mx-auto italic">
                "Well look what the tumbleweeds dragged in! Another 'hero'
                riding into {currentLoc?.name || "Gallows Ridge"} with a rusty
                iron and a pocketful of lint. Welcome to the territory,
                stranger. It's mostly just scorpions, sand, and folks who'd just
                as soon shoot you as look at you. So what'll it be? Playing
                shiny-badge deputy to the Sheriff, riding shotgun for the wagon
                tycoons, or... well, let's just say banks here got more money
                than sense, and out on the trail... some train schedules are
                mighty predictable. Try not to die before sundown, won't you?"
              </p>

              <div className="space-y-6 w-full max-w-xl mx-auto">
                <div className="bg-[#e8dec7] border border-[#bfae96] p-4 rounded-sm text-center">
                  <span className="font-bold text-[#8c6b0c] uppercase text-sm tracking-wider block font-serif mb-3">
                    Choose Your Look
                  </span>
                  <div className="flex gap-4 justify-center">
                    {[
                      { id: hero1Img, label: "Hero 1" },
                      { id: hero2Img, label: "Hero 2" },
                      { id: hero3Img, label: "Hero 3" },
                    ].map((h) => (
                      <button
                        key={h.id}
                        onClick={() =>
                          setPlayer({ ...player, avatarImage: h.id })
                        }
                        className={`flex flex-col items-center p-2 border rounded-sm transition-all focus:outline-none w-24 h-24 ${player.avatarImage === h.id ? "border-[#e8b923] bg-[#dfd4bd] shadow-[0_0_15px_rgba(232,185,35,0.15)] ring-1 ring-[#e8b923]" : "border-[#bfae96] bg-[#f4ead5] opacity-60 hover:opacity-100 grayscale hover:grayscale-[0.5]"}`}
                      >
                        <img
                          src={h.id}
                          alt={h.label}
                          className="h-full w-full object-contain"
                          style={{ imageRendering: "pixelated" }}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-[#e8dec7] border border-[#bfae96] p-4 rounded-sm text-center">
                  <span className="font-bold text-[#8c6b0c] uppercase text-sm tracking-wider block font-serif mb-3">
                    Gender
                  </span>
                  <div className="flex gap-4 justify-center">
                    {(["male", "female", "diverse"] as const).map((g) => (
                      <button
                        key={g}
                        onClick={() => {
                          setPlayer({ ...player, gender: g });
                          const namesPool =
                            g === "male"
                              ? MALE_FIRST_NAMES
                              : g === "female"
                                ? FEMALE_FIRST_NAMES
                                : [...MALE_FIRST_NAMES, ...FEMALE_FIRST_NAMES];
                          let fName =
                            namesPool[
                              Math.floor(Math.random() * namesPool.length)
                            ];
                          let lName =
                            LAST_NAMES[
                              Math.floor(Math.random() * LAST_NAMES.length)
                            ];
                          setIntroFirstName(fName);
                          setIntroLastName(lName);
                        }}
                        className={`px-4 py-2 border rounded-sm text-[10px] font-bold uppercase tracking-wider font-serif transition-colors focus:outline-none ${player.gender === g ? "border-[#e8b923] text-[#1a130f] bg-[#e8b923] shadow-[0_0_15px_rgba(232,185,35,0.15)]" : "border-[#bfae96] text-[#664d36] bg-[#f4ead5] hover:bg-[#dcd1b9]"}`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sign the Ledger inline */}
              <div className="bg-[#e8dec7] border border-[#bfae96] p-4 rounded-sm text-left text-[#4a3928] space-y-4 max-w-xl w-full mx-auto">
                <span className="font-bold text-[#8c6b0c] uppercase text-sm tracking-wider block font-serif flex items-center gap-2">
                  <span>🖋️ Sign the Ledger</span>
                </span>
                <p className="text-xs italic opacity-80">
                  What do folks call you out in the Badlands?
                </p>

                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-[10px] uppercase font-bold text-[#8a705a] tracking-wider mb-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={introFirstName}
                      onChange={(e) => setIntroFirstName(e.target.value)}
                      className="w-full bg-[#f4ead5] border border-[#bfae96] text-[#4a3928] p-2 rounded-sm outline-none focus:border-[#e8b923] font-serif"
                      placeholder="e.g. Wyatt"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-[10px] uppercase font-bold text-[#8a705a] tracking-wider mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={introLastName}
                      onChange={(e) => setIntroLastName(e.target.value)}
                      className="w-full bg-[#f4ead5] border border-[#bfae96] text-[#4a3928] p-2 rounded-sm outline-none focus:border-[#e8b923] font-serif"
                      placeholder="e.g. Vane"
                    />
                  </div>
                </div>
                {introNameError && (
                  <div className="text-red-600 text-xs text-center font-bold bg-red-100 p-2 rounded border border-red-300">
                    {introNameError}
                  </div>
                )}
              </div>

              <button
                id="btn-start-game"
                onClick={() => {
                  const cleanFirst = introFirstName.trim();
                  const cleanLast = introLastName.trim();
                  if (!cleanFirst || !cleanLast) {
                    setIntroNameError(
                      "Both first and last name are required, partner.",
                    );
                    return;
                  }
                  const fullName = `${cleanFirst} ${cleanLast}`.toLowerCase();
                  if (
                    FORBIDDEN_NAMES.some((forbidden) =>
                      fullName.includes(forbidden),
                    )
                  ) {
                    setIntroNameError(
                      "Historical or popular fictional names ain't welcome in these parts.",
                    );
                    return;
                  }

                  setIntroNameError(null);
                  setPlayer((prev) => ({
                    ...prev,
                    name: `${cleanFirst} ${cleanLast}`,
                  }));
                  setActiveView("town");
                  addLogMessage(
                    `📝 BAPTIZED: Known formally on the registry bounds as ${cleanFirst} ${cleanLast}.`,
                    "system",
                  );
                  // FrontierAudio.setMute(false);
                  // setIsMuted(false);
                  // FrontierAudio.playMusic("world");
                }}
                className="w-full sm:w-auto bg-[#3d2d21] hover:bg-[#4d3a2b] text-amber-200 py-3 px-8 rounded-sm border-b-4 border-[#1a130f] uppercase tracking-[0.2em] font-bold text-xs transition-colors cursor-pointer"
              >
                Enter Town
              </button>
            </div>
          )}

          {/* OVERLAND MAP VIEW */}
          {activeView === "map" && !pendingCombat && (
            <div className="lg:col-span-12 h-full">
              <OverlandMap
                locations={worldLocations}
                currentLocationId={currentLocationId}
                globalWeather={globalWeather}
                player={player}
                onTravel={handleTravel}
                travelStatus={travelStatus}
                playerX={playerX}
                playerY={playerY}
                setPlayerX={setPlayerX}
                setPlayerY={setPlayerY}
                onUpdatePlayer={setPlayer}
                setWorldLocations={setWorldLocations}
                setCurrentLocationId={setCurrentLocationId}
                addLogMessage={addLogMessage}
                onEnterTown={() => {
                  setActiveView("town");
                  addLogMessage(
                    `🏘️ ENTERED DISTRICT: ${player.name} rode into the local town borders of ${currentLoc?.name || "settlement"}.`,
                    "travel",
                  );
                }}
                passedSectors={passedSectors}
                gameTimeHour={gameTimeHour}
                advanceGameTime={advanceGameTime}
                onStartCombat={(type, risk, mission) => {
                  if (type === "ambush" || type === "duel") {
                    setCombatType(type);
                    setCombatRisk(risk);
                    setActiveMissionTarget(mission || null);
                    setActiveProvokedNpcId(null);
                    setPreCombatView("map");
                    setActiveView("combat");
                    addLogMessage(
                      `⚔️ COMBAT STARTED: ${player.name} steps into the field!`,
                      "danger",
                    );
                  } else {
                    setPendingCombat({
                      type,
                      risk,
                      mission: mission || null,
                      provokedNpcId: null,
                      previousView: "map",
                    });
                  }
                }}
                onConfrontBoss={(mission) => setConfrontationModal(mission)}
              />
            </div>
          )}

          {/* TOWN VIEW DISTRICT */}
          {activeView === "town" && !pendingCombat && currentLoc && (
            <div className="lg:col-span-8 flex flex-col gap-4">
              {/* Active Bounty Targets nearby warnings inside your inventory (Contract note checks) */}
              {currentTownMissionsTracked.length > 0 && (
                <div className="flex flex-col gap-2">
                  {currentTownMissionsTracked.map((m) => {
                    const isCombat = [
                      "bounty",
                      "robbery",
                      "nest_clearing",
                      "escort",
                      "story_assassination",
                      "story_heist",
                    ].includes(m.type);

                    return (
                      <div
                        key={m.id}
                        className={`${isCombat ? "bg-red-950/50 border-red-800" : "bg-[#e8dec7] border-[#bfae96]"} border p-3.5 rounded-md flex flex-col sm:flex-row justify-between items-center gap-3`}
                      >
                        <div className="space-y-1">
                          <span
                            className={`${isCombat ? "text-red-400" : "text-[#8c6b0c]"} font-bold block text-xs flex items-center gap-1`}
                          >
                            {isCombat ? (
                              <>
                                <Skull
                                  size={13}
                                  className="animate-spin-slow text-red-500 shrink-0"
                                />{" "}
                                Target Sighted: Outlaw hideout located here!
                              </>
                            ) : (
                              <>
                                <Compass
                                  size={13}
                                  className="text-[#8c6b0c] shrink-0"
                                />{" "}
                                Investigation Point: Gather Clues
                              </>
                            )}
                          </span>
                          <p className="text-[#2d2119] text-[10px] font-sans">
                            {isCombat
                              ? `Your accepted bounty/infestation contract target is hiding within the outskirts saloon perimeter of ${currentLoc.name}. Ensure weapon cylinder is fully loaded before pulling trigger.`
                              : `You need to look around ${currentLoc.name} and ask questions. Keep a low profile and find leads on ${m.targetName}.`}
                          </p>
                        </div>

                        <div className="flex gap-2 shrink-0 items-center">
                          {m.type === "escort" && (
                            <p className="text-red-400 text-[10px] pr-2 hidden md:block">
                              As you bring the wagon into {currentLoc.name},
                              outlaw ambushers try to stop you! Defend the
                              settlers!
                            </p>
                          )}
                          <button
                            id={`btn-target-fight-${m.id}`}
                            onClick={() => {
                              if (isCombat) {
                                startActiveBountyBattle(m);
                              } else {
                                setInvestigationModal(m);
                              }
                            }}
                            className={`py-2 px-3 rounded font-bold uppercase text-[9px] tracking-wider cursor-pointer ${
                              isCombat
                                ? "bg-red-700 hover:bg-red-600 border border-red-600 text-stone-100"
                                : "bg-[#3d2d21] hover:bg-[#2d2119] border border-[#1a130f] text-amber-200"
                            }`}
                          >
                            {isCombat
                              ? m.type === "escort"
                                ? `Defend against ${m.targetName}`
                                : `Assault ${m.targetName}`
                              : `Investigate Area`}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <TownView
                location={currentLoc}
                worldLocations={worldLocations}
                player={player}
                onAcceptMission={handleAcceptMission}
                onBuyItem={handleBuyItem}
                onSellItem={handleSellItem}
                onSellMount={handleSellMount}
                onBuyTradeItem={handleBuyTradeItem}
                onSellTradeItem={handleSellTradeItem}
                onBuyCarriage={handleBuyCarriage}
                onBuyRumor={handleBuyRumor}
                onDrinkWhiskey={handleDrinkWhiskey}
                onHoldUpBank={handleHoldUpBank}
                onSelectPerk={handleSelectPerk}
                onCraftUpgrade={handleCraftUpgrade}
                onCraftWeapon={handleCraftWeapon}
                onUpdatePlayer={setPlayer}
                onRevealLocation={handleRevealLocation}
                onReturnToMap={() => setActiveView("map")}
                onRaidStash={handleRaidStash}
                onTriggerTip={triggerTip}
                onStartCombat={(type, risk, mission, provokedNpcId) => {
                  if (type === "duel" || type === "ambush") {
                    setCombatType(type);
                    setCombatRisk(risk);
                    setActiveMissionTarget(mission || null);
                    setActiveProvokedNpcId(provokedNpcId || null);
                    setPreCombatView("town");
                    setActiveView("combat");
                    addLogMessage(
                      `⚔️ COMBAT STARTED: ${player.name} steps into the field!`,
                      "danger",
                    );
                  } else {
                    setPendingCombat({
                      type,
                      risk,
                      mission: mission || null,
                      provokedNpcId: provokedNpcId || null,
                      previousView: "town",
                    });
                  }
                }}
                addLogMessage={addLogMessage}
                onCollectBounty={handleCollectBounty}
              />
            </div>
          )}

          {/* PRE-COMBAT STANDOFF INTELLIGENCE DOSSIER SCREEN */}
          {pendingCombat &&
            (() => {
              const info = getPreCombatDetails();
              if (!info) return null;

              return (
                <div
                  id="combat-standoff-dossier"
                  className="lg:col-span-12 max-w-lg mx-auto w-full bg-[#dcd1b9] border-2 border-[#e8b923] rounded-sm p-6 space-y-6 shadow-2xl relative my-6 text-left"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-5 text-[#664d36] pointer-events-none">
                    <Skull size={100} />
                  </div>

                  {/* Header */}
                  <div className="border-b border-[#bfae96] pb-3 text-center">
                    <span className="text-xl inline-block mr-1">
                      {info.icon}
                    </span>
                    <h2 className="text-lg font-serif font-bold uppercase tracking-widest text-[#8c6b0c] inline-block mt-1">
                      Alrighty...
                    </h2>
                    <p className="text-[10px] uppercase font-mono text-[#664d36] tracking-wider mt-0.5">
                      Look who we got here
                    </p>
                  </div>

                  {/* Scenario Context */}
                  <div className="space-y-1.5 bg-[#dcd1b9] p-3 rounded border border-[#bfae96]/40">
                    <span className="text-[9px] uppercase tracking-wider font-serif text-[#8c6b0c] font-bold block">
                      {info.label}
                    </span>
                    <span className="text-[10px] text-[#664d36] font-mono font-semibold block uppercase">
                      {info.sublabel}
                    </span>
                    <p className="text-[#2d2119] text-xs leading-relaxed font-sans">
                      {info.desc}
                    </p>
                  </div>

                  {/* Force Assessment */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[#c6ba9f] border border-[#bfae96]/50 p-3 rounded">
                      <span className="text-[9px] uppercase tracking-wider font-serif text-[#664d36] font-bold block">
                        Enemy Force Size:
                      </span>
                      <span className="text-xl font-mono text-red-500 font-bold block">
                        {info.numEnemies} Hostiles
                      </span>
                      <p className="text-[8.5px] text-[#5a4838] font-mono mt-0.5">
                        Expected combatants spawning on the field.
                      </p>
                    </div>
                    <div
                      className={`border p-3 rounded flex flex-col justify-between ${info.diffColor}`}
                    >
                      <div>
                        <span className="text-[9px] uppercase tracking-wider font-serif text-[#664d36] font-bold block">
                          Perceived Difficulty:
                        </span>
                        <span className="text-[11px] font-sans font-bold block mt-1 uppercase leading-tight">
                          {info.difficulty}
                        </span>
                      </div>
                      <p className="text-[8px] text-[#5a4838] font-mono mt-1 font-semibold">
                        Based on district crime index.
                      </p>
                    </div>
                  </div>

                  {/* Player Status Check */}
                  <div className="bg-[#dcd1b9] border border-[#bfae96]/30 p-3 rounded space-y-2">
                    <span className="text-[9px] uppercase tracking-wider font-serif text-[#664d36] font-semibold block">
                      {player.name}'s Current Readiness:
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                      <div className="text-[#2d2119]">
                        Vitality (HP):{" "}
                        <span
                          className={`${player.hp / getEffectiveMaxHp(player) < 0.4 ? "text-red-650 font-bold animate-pulse" : "text-[#8c6b0c]"}`}
                        >
                          {player.hp} / {getEffectiveMaxHp(player)} HP
                        </span>
                      </div>
                      <div className="text-[#2d2119]">
                        Drifter Lvl:{" "}
                        <span className="text-stone-100">{player.level}</span>
                      </div>
                      <div className="text-[#2d2119]">
                        Firearm Arm:{" "}
                        <span className="text-[#8c6b0c] font-sans text-[10px]">
                          {player.weapon.name}
                        </span>
                      </div>
                      <div className="text-[#2d2119]">
                        Ammunition:{" "}
                        <span
                          className={`${(player.inventory.find((i) => i.id === `ammo_${player.weapon.ammoType || "pistol"}`)?.count || 0) === 0 ? "text-red-500 font-bold" : "text-stone-100"}`}
                        >
                          {player.inventory.find(
                            (i) =>
                              i.id ===
                              `ammo_${player.weapon.ammoType || "pistol"}`,
                          )?.count || 0}{" "}
                          RDS ({player.weapon.ammoType || "pistol"})
                        </span>
                      </div>
                    </div>
                    {player.hp / getEffectiveMaxHp(player) < 0.25 && (
                      <p className="text-[8.5px] text-red-800 font-mono bg-red-200 px-1.5 py-1 rounded border border-red-400/40">
                        ⚠️ CRITICAL WARNING: {player.name} is heavily injured! A
                        stray lead bullet or scorpion tail whip could be fatal!
                      </p>
                    )}
                  </div>

                  {/* Decisions Buttons */}
                  <div className="space-y-2 pt-2 border-t border-[#bfae96]/45">
                    <button
                      id="btn-standoff-fight"
                      onClick={() => {
                        // Activate combat views using pending details
                        setCombatType(pendingCombat.type);
                        setCombatRisk(pendingCombat.risk);
                        setActiveMissionTarget(pendingCombat.mission);
                        if (pendingCombat.provokedNpcId) {
                          setActiveProvokedNpcId(pendingCombat.provokedNpcId);
                        } else {
                          setActiveProvokedNpcId(null);
                        }
                        setPreCombatView(pendingCombat.previousView);
                        setActiveView("combat");
                        setPendingCombat(null);
                        addLogMessage(
                          `⚔️ ENGAGEMENT STARTED: ${player.name} stepped into the field against ${info.numEnemies} hostiles!`,
                          "danger",
                        );
                      }}
                      className="w-full py-2.5 bg-red-800 hover:bg-red-700 active:bg-red-900 border border-red-500 hover:border-red-400 text-stone-100 font-serif font-bold text-xs uppercase tracking-widest rounded-sm cursor-pointer transition-colors shadow-lg shadow-black"
                    >
                      🤠 Draw Iron & Fight (Commence Firefight)
                    </button>
                    <button
                      id="btn-standoff-retreat"
                      onClick={() => {
                        // Evade combat
                        const prev = pendingCombat.previousView;

                        if (
                          pendingCombat.type === "bounty" &&
                          pendingCombat.mission
                        ) {
                          const escapedName = pendingCombat.mission.targetName;
                          setPlayer((p) => {
                            const existingNemesis = (p.nemeses || []).find(
                              (n) => n.name === escapedName,
                            );
                            if (existingNemesis) {
                              addLogMessage(
                                `😠 NEMESIS ESCAPED: ${escapedName} slipped away again! They will bolster their numbers and hunt you down.`,
                                "danger",
                              );
                              return {
                                ...p,
                                nemeses: p.nemeses!.map((n) =>
                                  n.name === escapedName
                                    ? {
                                        ...n,
                                        powerLevel: n.powerLevel + 0.2,
                                        gangSize: Math.min(4, n.gangSize + 1),
                                        encounters: n.encounters + 1,
                                        isHunting: true,
                                      }
                                    : n,
                                ),
                              };
                            } else {
                              addLogMessage(
                                `😠 NEMESIS CREATED: You retreated from ${escapedName}. They won't forget this slight and are now hunting you across the frontier!`,
                                "danger",
                              );
                              const newNemesis: Nemesis = {
                                id: pendingCombat.mission!.id,
                                name: escapedName,
                                type: "bounty",
                                powerLevel: 1.2,
                                gangSize: 2,
                                faction: "outlaws",
                                isHunting: true,
                                encounters: 1,
                              };
                              return {
                                ...p,
                                nemeses: [...(p.nemeses || []), newNemesis],
                              };
                            }
                          });
                        }

                        setPendingCombat(null);
                        setActiveView(prev);
                        addLogMessage(
                          `🏃 EVADED FIREFIGHT: ${player.name} stealthily recoiled from the standoff and slipped back to safe cover.`,
                          "system",
                        );
                      }}
                      className="w-full py-2 bg-[#dfd4bd] hover:bg-[#3d2d21] border border-[#e8b923]/30 hover:border-[#e8b923]/50 text-[#2d2119] hover:text-white font-serif font-bold text-[10px] uppercase tracking-wider rounded-sm cursor-pointer transition-colors"
                    >
                      🏃 Retreat / Evade Standoff (Retreat Safely)
                    </button>
                  </div>
                </div>
              );
            })()}

          {/* COMBAT VIEW */}
          {activeView === "combat" && !pendingCombat && (
            <div className="lg:col-span-12 h-full">
              <CombatView
                player={player}
                combatType={combatType}
                difficultyRisk={combatRisk}
                onVictory={handleCombatVictory}
                onDefeat={handleCombatDefeat}
                onEquipWeapon={handleEquipWeapon}
                onUpdatePlayer={setPlayer}
                onTriggerTip={triggerTip}
                currentLocation={currentLoc}
                activeMissionTarget={activeMissionTarget}
                activeProvokedNpcId={activeProvokedNpcId}
                forcedWeather={godModeWeather}
                forcedTimeOfDay={godModeTimeOfDay}
                gameTimeHour={gameTimeHour}
              />
            </div>
          )}

          {/* AMBUSH DEFEAT VIEW */}
          {activeView === "ambush_defeat" && (
            <div className="lg:col-span-12 max-w-md mx-auto w-full bg-[#d4cbba]/90 border border-[#c4451a] rounded-lg p-6 py-12 text-center flex flex-col items-center justify-center space-y-6 shadow-2xl relative shadow-black">
              <Skull size={50} className="text-[#c4451a] animate-pulse" />

              <div className="space-y-1">
                <h2 className="text-xl font-extrabold uppercase tracking-widest text-[#c4451a]">
                  Ambushed & Robbed
                </h2>
              </div>

              <p className="text-[#2d2119] text-xs font-sans leading-relaxed">
                Thugs beat you down and left you in the dirt. All of your pocket
                gold was stolen. You barely survived the encounter.
              </p>

              <button
                onClick={() => setActiveView(preCombatView)}
                className="mt-6 py-3 px-8 text-xs font-serif font-black uppercase tracking-widest bg-stone-900 border-2 border-[#bfae96] text-[#bfae96] hover:bg-stone-800 hover:text-white rounded cursor-pointer transition-all hover:scale-105"
              >
                🏇 Drag Yourself Up
              </button>
            </div>
          )}

          {/* DATA EXPLORER VIEW (Commented out for release) */}
          {/* activeView === "data" && (
            <div className="lg:col-span-12 h-[calc(100vh-270px)] sm:min-h-0 min-h-[400px]">
              <DataExplorer player={player} worldLocations={worldLocations} />
            </div>
          ) */}

          {/* GAME OVER (Cowboy Death) Screen Overlay */}
          {activeView === "gameover" && (
            <div className="lg:col-span-12 max-w-md mx-auto w-full bg-[#d4cbba]/90 border border-red-950 rounded-lg p-6 py-12 text-center flex flex-col items-center justify-center space-y-6 shadow-2xl relative shadow-black">
              <Skull size={64} className="text-red-600 animate-bounce" />

              <div className="space-y-1">
                <h2 className="text-xl font-extrabold uppercase tracking-widest text-red-500">
                  Killed in Standoff Duel
                </h2>
                <span className="text-[10px] text-[#5a4838] uppercase font-mono">
                  You reached level {player.level} Drifter
                </span>
              </div>

              <p className="text-[#2d2119] text-xs font-sans leading-relaxed">
                Whiskey flats, scorpions, and badlands claimed another victim.
                The Gila buzzards hover safely in circles. Gold was pillaged
                back to dust.
              </p>

              <div className="w-full bg-[#3d2d21]/10 p-4 border border-[#3d2d21]/30 rounded-sm">
                <h3 className="font-serif uppercase font-bold text-[#3d2d21] text-xs mb-3 border-b border-[#3d2d21]/30 pb-2">
                  Final Legacy Stats
                </h3>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 text-[10px] font-mono text-[#4a3928]">
                  <div className="flex flex-col items-center">
                    <span className="text-xl text-[#c4451a] font-bold">
                      {player.stats?.daysSurvived || 0}
                    </span>
                    <span className="flex flex-col items-center text-center">
                      Days Survived
                      <span className="text-[8px] opacity-70 border-t border-[#4a3928]/30 pt-0.5 mt-0.5">
                        Top Record:{" "}
                        {safeLocalStorage.getItem("frontierHighScoreDays") || 0}
                      </span>
                    </span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-xl text-[#c4451a] font-bold">
                      {player.stats?.duelsWon || 0}
                    </span>
                    <span>Duels Survived</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-xl text-[#c4451a] font-bold">
                      {player.stats?.bountiesCollected || 0}
                    </span>
                    <span>Bounties Collected</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-xl text-[#c4451a] font-bold">
                      {player.stats?.banksRobbed || 0}
                    </span>
                    <span>Banks Robbed</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-xl text-[#c4451a] font-bold">
                      ${player.gold}
                    </span>
                    <span>Final Gold Wealth</span>
                  </div>
                </div>
              </div>

              <button
                id="btn-restart-game"
                onClick={handleRestart}
                className="py-2.5 px-6 bg-red-850 hover:bg-red-700 text-stone-100 rounded font-bold uppercase text-xs tracking-wider transition-all cursor-pointer border border-red-800"
              >
                Draw another Colt (Respawn Cowboy)
              </button>
            </div>
          )}

          {/* COMBAT VICTORY STORY SCREEN */}
          {activeView === "victory_story" && victoryStoryDetails && (
            <div className="lg:col-span-12 max-w-2xl mx-auto w-full bg-[#e8dec7] border-2 border-[#8a705a] rounded-sm p-8 text-center flex flex-col items-center space-y-6 shadow-2xl relative">
              <div className="w-16 h-16 bg-[#e8b923]/10 border border-[#e8b923]/50 rounded-full flex items-center justify-center text-[#8c6b0c] animate-pulse">
                <span className="text-3xl">⛓️</span>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-[#664d36] uppercase font-mono tracking-widest font-bold">
                  Gun smoke set-down scroll
                </span>
                <h2 className="text-2xl font-serif font-extrabold uppercase tracking-wider text-[#8c6b0c]">
                  Tactical Battle Resolved
                </h2>
              </div>

              <div className="bg-[#dcd1b9] border border-[#bfae96]/60 p-6 rounded-sm text-left font-sans text-[#2d2119] leading-relaxed text-xs space-y-4 max-w-xl shadow-inner italic">
                <p>
                  The violent echo of gunfire fades into the whispering desert
                  winds. ${player.name} takes a slow, controlled breath,
                  lowering his barrel as the remaining outlaws drop their
                  smoking weapons in defeat.
                </p>

                {victoryStoryDetails.isBounty ? (
                  <p>
                    ${player.name} steps forward onto the cracked, dusty trail,
                    unholstering heavy-iron custody handcuffs. He pins the
                    outlaw, <b>{victoryStoryDetails.outlawName}</b>, securely
                    behind their back with trail ropes. Securing the prisoner's
                    arms with steel handcuffs, ${player.name} drags them under
                    the heavy shadow of the transport carriage.
                  </p>
                ) : victoryStoryDetails.isRobbery ? (
                  <p>
                    With alarm bells screaming through the district, $
                    {player.name} quickly loads multiple gold bullions and sacks
                    of banknotes into his saddlebags. ${player.name} ties the
                    vault cords shut and escapes before the sheriff's deputies
                    can secure the roads!
                  </p>
                ) : (
                  <p>
                    ${player.name} secures the region, searching the saddlebags
                    and pockets of the defeated highwaymen. He finds some
                    scattered bullion coins, trail supplies, and leaves the
                    bound scoundrels tied back-to-back on a Joshua tree to think
                    about their life of crime.
                  </p>
                )}

                <div className="border-t border-[#bfae96]/55 pt-4">
                  <span className="text-[10px] text-[#664d36] uppercase font-mono font-bold block mb-2 not-italic">
                    💰 Spoils Left on the Field:
                  </span>
                  <ul className="space-y-1 not-italic text-[#1a130f] text-[11px] font-mono">
                    <li className="flex justify-between">
                      <span>Battleground Loot Cash:</span>
                      <span className="text-[#8c6b0c] font-bold">
                        +${victoryStoryDetails.lootGold} Gold
                      </span>
                    </li>
                    <li className="flex justify-between">
                      <span>Combat Action Experience:</span>
                      <span className="text-sky-400 font-bold">
                        +{victoryStoryDetails.xpReward} XP
                      </span>
                    </li>
                    {victoryStoryDetails.isBounty && (
                      <li className="flex justify-between bg-amber-950/20 p-2 rounded border border-amber-900/40 text-amber-300 mt-2 text-[10px] leading-relaxed">
                        <span>⚠️ UNCLAIMED CONTRACT BOUNTY:</span>
                        <span className="font-sans font-bold uppercase text-right">
                          Must handover in town!
                        </span>
                      </li>
                    )}
                  </ul>
                </div>
              </div>

              {victoryStoryDetails.isBounty && (
                <div className="bg-[#241a14]/60 border border-[#e8b923]/30 p-4 rounded-sm text-center max-w-xl text-[11px] text-[#3d2d21]">
                  📌 <b>SHERIFF NOTIFICATION</b>: You have handcuffed{" "}
                  <b>{victoryStoryDetails.outlawName}</b> securely. To receive
                  the bounty cash, ride back to any town outpost, click on the
                  contract bounty section, and report to the Marshall Desk to
                  collect your reward gold!
                </div>
              )}

              <button
                id="btn-victory-story-continue"
                onClick={handleCloseVictoryStory}
                className="py-2.5 px-8 bg-[#e8b923] hover:bg-[#ffcf33] text-[#1a130f] rounded-sm font-serif uppercase tracking-widest font-extrabold text-xs transition-colors cursor-pointer shadow-lg active:scale-95"
              >
                🤠 Resume Frontier Journey
              </button>
            </div>
          )}

          {/* SHERIFF BOUNTY MEETING SCREEN */}
          {activeView === "sheriff_meeting" && activeBountyClaim && (
            <div className="lg:col-span-12 max-w-2xl mx-auto w-full bg-[#e8dec7] border-2 border-[#e8b923]/80 rounded-sm p-8 text-center flex flex-col items-center space-y-6 shadow-2xl relative">
              <div className="w-16 h-16 bg-blue-950/20 border border-blue-500/50 rounded-full flex items-center justify-center text-blue-400 animate-pulse">
                <span className="text-3xl">👮</span>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-blue-400 uppercase font-mono tracking-widest font-bold">
                  District Court & Justice Desk
                </span>
                <h2 className="text-2xl font-serif font-extrabold uppercase tracking-wider text-[#8c6b0c]">
                  Sheriff's Office Handover
                </h2>
              </div>

              <div className="bg-[#dcd1b9] border border-[#bfae96]/60 p-6 rounded-sm text-left font-sans text-[#2d2119] leading-relaxed text-xs space-y-4 max-w-xl shadow-inner">
                <div className="flex gap-4 items-start border-b border-[#bfae96]/50 pb-4">
                  <div className="w-12 h-12 bg-[#2d2119] rounded-sm flex items-center justify-center font-bold text-2xl border border-[#bfae96] shrink-0">
                    👴
                  </div>
                  <div className="space-y-1">
                    <span className="font-serif font-bold text-blue-400 text-xs block uppercase">
                      Sheriff Pat Garrett
                    </span>
                    <p className="italic text-[#2d2119]">
                      "So let's see here, ${player.name}... Well, I'll be. You
                      actually dragged in <b>{activeBountyClaim.outlawName}</b>{" "}
                      in heavy iron chains! My deputies have been looking for
                      this varmint for three seasons. The badlands judges are
                      drafting the gallows warrants as we speak."
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-[#4a3928] italic leading-relaxed text-[11px]">
                    Sheriff Garrett smiles, puffing on his brass pipe, before
                    pulling out a locked pine drawer with keys. He stacks a
                    heavy leather pouch loaded with official treasury coins onto
                    the desk.
                  </p>

                  <p className="italic text-[#2d2119] font-serif font-semibold text-center text-amber-500 py-1 border-y border-[#bfae96]/40">
                    "This settlement owes you its security, cowboy. Here is your
                    federal bounty cash. Pleasure doing business with you, $
                    {player.name}."
                  </p>
                </div>

                <div className="pt-2 border-t border-[#bfae96]/50">
                  <span className="text-[10px] text-[#664d36] uppercase font-mono font-bold block mb-2">
                    🎁 Handover Payout Details:
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="bg-[#e8dec7] p-2 rounded border border-[#bfae96]/55 text-center">
                      <span className="text-[#664d36] text-[9px] block">
                        BOUNTY CASH
                      </span>
                      <span className="text-[#8c6b0c] font-bold text-sm">
                        +${activeBountyClaim.bountyGold} Gold
                      </span>
                    </div>
                    <div className="bg-[#e8dec7] p-2 rounded border border-[#bfae96]/55 text-center">
                      <span className="text-[#664d36] text-[9px] block">
                        REPUTATION BONUS
                      </span>
                      <span className="text-emerald-400 font-bold text-sm">
                        +{activeBountyClaim.repChange} Honor
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <button
                id="btn-collect-bounty-pocket"
                onClick={handlePocketBounty}
                className="py-2.5 px-8 bg-[#e8b923] hover:bg-[#ffcf33] text-[#1a130f] rounded-sm font-serif uppercase tracking-widest font-extrabold text-xs transition-colors cursor-pointer shadow-lg active:scale-95"
              >
                🤠 Pocket Gold & Handover Prisoner
              </button>
            </div>
          )}

          {/* SIDEBARS: Visible when actually playing */}
          {activeView !== "intro" &&
            activeView !== "combat" &&
            activeView !== "gameover" &&
            activeView !== "victory_story" &&
            activeView !== "sheriff_meeting" && (
              <>
                {/* Left/Middle Column Panel (Character HUD details) */}
                <div
                  className={`lg:col-span-4 flex flex-col gap-4 transition-all duration-500 hover:opacity-100 ${activeView === "map" ? "opacity-40 saturate-50" : "opacity-100"}`}
                >
                  <CharacterSheet
                    player={player}
                    onDropItem={handleDropItem}
                    onEquipWeapon={handleEquipWeapon}
                    onDismissPosseMember={handleDismissPosseMember}
                    onRenameHorse={handleRenameHorse}
                    onRenameWeapon={handleRenameWeapon}
                    onOpenGunsmith={() => setShowWeaponBenchModal(true)}
                    onUpdateAppearance={(appearance) =>
                      setPlayer((p) => ({ ...p, appearance }))
                    }
                  />
                </div>

                {/* Bottom notification log feed */}
                <div
                  className={`lg:col-span-12 h-[180px] mt-4 transition-opacity duration-500 hover:opacity-100 ${activeView === "map" ? "opacity-50" : "opacity-100"}`}
                >
                  <GameLogs logs={logs} />
                </div>
              </>
            )}
        </main>

        {/* HELP INSTRUCTIONS MODAL CARD OVERLAY */}
        {showWeaponBenchModal && (
          <WeaponBenchModal
            player={player}
            onClose={() => setShowWeaponBenchModal(false)}
            onUpdatePlayer={setPlayer}
            onAttachPart={handleAttachWeaponPart}
            onDetachPart={handleDetachWeaponPart}
          />
        )}

        {showLedgerModal && (
          <LedgerModal
            player={player}
            onClose={() => setShowLedgerModal(false)}
          />
        )}

        {/* Confrontation Modal */}
        {confrontationModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[100] backdrop-blur-sm">
            <div className="bg-[#f4ead5] w-full max-w-xl border-4 border-[#3d2d21] rounded-sm p-6 shadow-[0_0_40px_rgba(0,0,0,0.8)]">
              <h2 className="text-xl font-bold uppercase text-red-700 tracking-widest font-serif mb-4 flex items-center gap-2 border-b-2 border-red-900/20 pb-2">
                <Skull className="text-red-700" /> Confrontation:{" "}
                {confrontationModal.targetName}
              </h2>
              <div className="text-sm font-sans text-[#4d3a2b] space-y-4 mb-6">
                <p>
                  You step into the dilapidated hideout, hand hovering closely
                  over your revolver. Before you can draw,{" "}
                  {confrontationModal.targetName} steps out from the shadows,
                  hands raised but not surrendered.
                </p>
                {confrontationModal.twistType === "ROBIN_HOOD" && (
                  <p className="font-bold italic">
                    "Wait! The money I took from the railway isn't for me! Look
                    around—I'm feeding the starving miners the company
                    abandoned. If you take me in, they all die."
                  </p>
                )}
                {confrontationModal.twistType === "FRAMED_INNOCENT" && (
                  <p className="font-bold italic">
                    "I didn't do it! The Sheriff is corrupt, he pinned the
                    robbery on me because I found his ledger! If you kill me,
                    the real outlaws win."
                  </p>
                )}
                {confrontationModal.twistType === "MYSTICAL_CULTIST" && (
                  <p className="font-bold italic">
                    "Your guns mean nothing to the spirits of the Badlands. The
                    blood I spill is payment to the earth. Join us, or become
                    nourishment."
                  </p>
                )}
                <p className="text-xs mt-4 italic text-zinc-600 font-serif">
                  You hold the contract for ${confrontationModal.rewardGold}.
                  Returning with their head (or capturing them) fulfills it. But
                  you could also turn a blind eye...
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => {
                    setConfrontationModal(null);
                    setCombatType("bounty");
                    setCombatRisk(0.85);
                    setActiveMissionTarget(confrontationModal);
                    setPreCombatView(activeView);
                    setActiveView("combat");
                    addLogMessage(
                      `⚔️ No deals for outlaws. You draw your weapon on ${confrontationModal.targetName}!`,
                      "danger",
                    );
                  }}
                  className="w-full py-2 bg-[#dfd4bd] hover:bg-red-900 hover:text-white text-[#664d36] font-bold text-xs uppercase tracking-widest border border-[#bfae96] transition-colors text-left px-4"
                >
                  1. "I'm just here for the bounty." (Initiate Combat)
                </button>

                <button
                  onClick={() => {
                    setConfrontationModal(null);

                    // Clean target note from our inventory
                    setPlayer((prev) => ({
                      ...prev,
                      inventory: prev.inventory.filter(
                        (item) => item.id !== confrontationModal.id,
                      ),
                      reputation: Math.max(0, prev.reputation - 15), // Cost of failing the bounty
                    }));

                    // Mark Quest as Betrayal
                    setWorldLocations((prev) =>
                      prev.map((loc) => ({
                        ...loc,
                        quests: loc.quests.map((q) =>
                          q.id === confrontationModal.id
                            ? { ...q, questState: "ALLIED_WITH_TARGET" }
                            : q,
                        ),
                      })),
                    );

                    addLogMessage(
                      `🤝 You lowered your weapon, letting ${confrontationModal.targetName} walk away. The town won't be happy. (-15 Reputation)`,
                      "system",
                    );
                  }}
                  className="w-full py-2 bg-[#dfd4bd] hover:bg-[#dcd1b9] text-[#2a8ec4] font-bold text-xs uppercase tracking-widest border border-[#bfae96] transition-colors text-left px-4"
                >
                  2. "Turn around and run. I never saw you." (Let them go)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Investigation Modal */}
        {investigationModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[100] backdrop-blur-sm">
            <div className="bg-[#f4ead5] w-full max-w-xl border-4 border-[#3d2d21] rounded-sm p-6 shadow-[0_0_40px_rgba(0,0,0,0.8)]">
              <h2 className="text-xl font-bold uppercase text-[#8c6b0c] tracking-widest font-serif mb-4 flex items-center gap-2 border-b-2 border-[#bfae96] pb-2">
                <Compass className="text-[#8c6b0c]" /> Investigation:{" "}
                {investigationModal.title}
              </h2>
              <div className="text-sm font-sans text-[#4d3a2b] space-y-4 mb-6">
                <p>
                  You decided to investigate the rumor regarding{" "}
                  {investigationModal.targetName}. You look around the area for
                  clues or anyone who might know something.
                </p>
                <p className="text-xs mt-4 italic text-zinc-600 font-serif">
                  You can attempt to gather information or use your intuition.
                  What do you do?
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => {
                    setInvestigationModal(null);

                    // Simple resolution: Give XP, a small amount of gold, and complete it
                    setPlayer((prev) => ({
                      ...prev,
                      gold: prev.gold + (investigationModal.rewardGold || 50),
                      xp: prev.xp + (investigationModal.rewardXp || 20),
                      inventory: prev.inventory.filter(
                        (item) => item.id !== investigationModal.id,
                      ),
                    }));

                    addLogMessage(
                      `🔍 INVESTIGATION COMPLETE: You uncovered the truth about ${investigationModal.targetName} and found a hidden stash of $${investigationModal.rewardGold}.`,
                      "system",
                    );
                  }}
                  className="w-full py-2 bg-[#dfd4bd] hover:bg-[#dcd1b9] text-[#2a8ec4] font-bold text-xs uppercase tracking-widest border border-[#bfae96] transition-colors text-left px-4"
                >
                  1. "I'll follow the trail..." (Resolve Investigation)
                </button>

                <button
                  onClick={() => {
                    setInvestigationModal(null);
                  }}
                  className="w-full py-2 bg-transparent hover:bg-black/5 text-[#664d36] font-bold text-xs uppercase tracking-widest border border-transparent transition-colors text-left px-4"
                >
                  2. Step away for now.
                </button>
              </div>
            </div>
          </div>
        )}

        {showHelpModal && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-[#d4cbba] border border-stone-800 rounded-lg p-5 max-w-md w-full relative space-y-4 shadow-2xl">
              <div className="flex justify-between items-center border-b border-stone-800 pb-2">
                <h3 className="text-sm font-bold uppercase text-white flex items-center gap-1.5">
                  <Compass size={14} className="text-amber-500" /> Arizona
                  Cowboy Survival Compendium
                </h3>
                <button
                  id="btn-close-help"
                  onClick={() => setShowHelpModal(false)}
                  className="text-[#5a4838] hover:text-white font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 font-sans text-xs text-[#2d2119] leading-relaxed">
                <div className="space-y-1">
                  <span className="font-mono text-[10px] text-amber-500 font-bold block">
                    1. OVERLAND TRAVEL
                  </span>
                  <p>
                    Use Horseback to ride from town to town. Desert regions
                    contain dangerous scorpion ambush grids. Taking trains costs
                    cash tickets but avoids any ambushes entirely.
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="font-mono text-[10px] text-amber-500 font-bold block">
                    2. TACTICAL COMBAT ACTIONS
                  </span>
                  <p>
                    Move, Shoot, or Reload using Your Action Points (AP). Target
                    enemies by tapping cells inside weapon range. Duck behind
                    solid objects like crates (📦) and rocks (🪨) to scale down
                    enemy shot chances.
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="font-mono text-[10px] text-amber-500 font-bold block">
                    3. BANK ROBBERIES Heist Choice
                  </span>
                  <p>
                    A fast trick to acquire thousands of gold immediately! But
                    wait, you will be ambushed immediately by armed deputies,
                    and your local Honor/Reputation will degrade towards
                    Infamous, raising shop markup prices.
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="font-mono text-[10px] text-amber-500 font-bold block">
                    4. LEVELING UP
                  </span>
                  <p>
                    Gather experience (XP) from bounty clears. Gain a level to
                    automatically unlock powerful traits (Fast Hands, Hardy
                    Horseman) from local Saloon bureaus.
                  </p>
                </div>
              </div>

              <button
                id="btn-confirm-close-help"
                onClick={() => setShowHelpModal(false)}
                className="w-full py-1.5 bg-stone-950 hover:bg-stone-850 text-[#2d2119] rounded font-bold uppercase text-[10px] border border-stone-800 cursor-pointer"
              >
                Return to Battle
              </button>
            </div>
          </div>
        )}

        {activeTip && (
          <div className="fixed inset-0 z-[200] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-[#150f0c] border-2 border-[#e8b923] p-6 rounded-sm max-w-sm w-full text-center shadow-2xl relative">
              <span className="text-3xl mb-3 block">💡</span>
              <h2 className="text-[#e8b923] font-serif font-bold tracking-widest uppercase mb-3 text-lg">
                {activeTip.title}
              </h2>
              <p className="text-[#d4c3a1] font-sans text-xs leading-relaxed mb-6">
                {activeTip.desc}
              </p>
              <button
                onClick={() => setActiveTip(null)}
                className="w-full bg-[#1a130f] hover:bg-[#e8b923]/20 border border-[#e8b923]/30 text-[#e8b923] font-bold uppercase text-[10px] tracking-widest py-2 rounded-sm transition-colors"
              >
                Acknowledge
              </button>
            </div>
          </div>
        )}

        {isGodModeOpen && (
          <GodModeModal
            isActive={isGodModeActive}
            forcedWeather={godModeWeather}
            onForceWeather={setGodModeWeather}
            forcedTimeOfDay={godModeTimeOfDay}
            onForceTimeOfDay={setGodModeTimeOfDay}
            onToggle={(active) => {
              setIsGodModeActive(active);
              if (active) {
                setPreGodModeState({
                  gold: player.gold,
                  hp: player.hp,
                  maxHp: player.maxHp,
                  pistolSkill: player.pistolSkill,
                  rifleSkill: player.rifleSkill,
                  reloadSkill: player.reloadSkill,
                  horsemanship: player.horsemanship,
                  silenceSkill: player.silenceSkill,
                  posse: player.posse,
                });
                setPlayer((prev) => ({
                  ...prev,
                  gold: 999999,
                  hp: 9999,
                  maxHp: 9999,
                  pistolSkill: 100,
                  rifleSkill: 100,
                  reloadSkill: 100,
                  horsemanship: 100,
                  silenceSkill: 100,
                }));
                addLogMessage(
                  "⚡ GOD MODE ACTIVATED: Unlimited Stats enabled.",
                  "system",
                );
              } else {
                if (preGodModeState) {
                  setPlayer((prev) => ({
                    ...prev,
                    gold: preGodModeState.gold || prev.gold,
                    hp: preGodModeState.hp || prev.hp,
                    maxHp: preGodModeState.maxHp || prev.maxHp,
                    pistolSkill:
                      preGodModeState.pistolSkill || prev.pistolSkill,
                    rifleSkill: preGodModeState.rifleSkill || prev.rifleSkill,
                    reloadSkill:
                      preGodModeState.reloadSkill || prev.reloadSkill,
                    horsemanship:
                      preGodModeState.horsemanship || prev.horsemanship,
                    silenceSkill:
                      preGodModeState.silenceSkill || prev.silenceSkill,
                    posse: preGodModeState.posse || prev.posse,
                  }));
                }
                addLogMessage(
                  "🛑 GOD MODE DEACTIVATED: Stats reverted.",
                  "system",
                );
              }
            }}
            onClose={() => setIsGodModeOpen(false)}
            onTriggerEvent={(type) => {
              setPendingCombat({
                type,
                risk: Math.random() * 0.5 + 0.5,
                mission: null,
                provokedNpcId: null,
                previousView: activeView,
              });
              setIsGodModeOpen(false);
            }}
            onAddPosseMember={(member) => {
              if (player.posse.find((p) => p.id === member.id)) {
                addLogMessage(
                  `⚠️ ${member.name} is already in your posse!`,
                  "danger",
                );
                return;
              }
              setPlayer((prev) => ({
                ...prev,
                posse: [...prev.posse, member],
              }));
              addLogMessage(
                `🤠 ${member.name} has joined your posse!`,
                "system",
              );
            }}
          />
        )}
      </div>
    </div>
  );
}
