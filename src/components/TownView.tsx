import React, { useState, useEffect } from "react";
import {
  SALOON_EVENTS,
  SaloonEvent,
  SaloonEventOption,
} from "../utils/saloonEvents";
import { Location, Player, Mission, ShopItem, PosseMember } from "../types";
import {
  TRADE_GOODS,
  CARRIAGES,
  getCargoWeight,
  getMaxCapacity,
  calculateLocalPrice,
} from "../utils/trade";
import {
  Store,
  GlassWater,
  Landmark,
  Beer,
  Sparkles,
  PlusCircle,
  Award,
  Target,
  HelpCircle,
  ShieldAlert,
  Waves,
  Hammer,
  HelpCircle as HelpIcon,
  Flame,
  Heart,
  Compass,
  Users,
  MapPin,
  Package,
} from "lucide-react";

interface TownViewProps {
  location: Location;
  worldLocations: Location[];
  player: Player;
  onAcceptMission: (mission: Mission) => void;
  onBuyItem: (item: ShopItem) => void;
  onSellItem: (itemId: string, sellValue: number) => void;
  onSellMount?: () => void;
  onBuyTradeItem?: (goodId: string, quantity: number, cost: number) => void;
  onSellTradeItem?: (goodId: string, quantity: number, revenue: number) => void;
  onBuyCarriage?: (
    carriageType: import("../types").CarriageTier,
    cost: number,
  ) => void;
  onBuyRumor: () => string;
  onDrinkWhiskey: () => void;
  onHoldUpBank: () => void;
  onSelectPerk: (perk: string) => void;
  onCraftUpgrade: (
    upgradeType: "barrel" | "clip" | "scope" | "rifling",
    materialsUsed: { [key: string]: number },
  ) => void;
  onCraftWeapon: (
    weaponName: string,
    weaponId: string,
    stats: { dmg: number; range: number; maxClip: number },
    materialsUsed: { [key: string]: number },
  ) => void;
  onUpdatePlayer: (updater: (prev: Player) => Player) => void;
  onRevealLocation: (locId: string) => void;
  onStartCombat: (
    type: "bounty" | "robbery" | "nest_clearing" | "ambush" | "duel",
    risk: number,
    targetMission?: Mission | null,
    provokedNpcId?: string,
    provokedNpcName?: string
  ) => void;
  onReturnToMap: () => void;
  addLogMessage: (
    text: string,
    type: "system" | "combat" | "loot" | "reputation" | "travel" | "danger",
  ) => void;
  onCollectBounty?: (itemId: string) => void;
  onRaidStash?: (locId: string) => void;
  onTriggerTip?: (id: string, title: string, desc: string) => void;
}

const PERK_OPTIONS = [
  // Gunslinger Tree
  {
    id: "deadeye",
    name: "Deadeye Focus",
    desc: "Increases tactical fire critical chance by +30%.",
    tree: "Gunslinger",
  },
  {
    id: "fast_hands",
    name: "Fast Hands",
    desc: "Allows free instant weapon reloads in combat.",
    tree: "Gunslinger",
  },
  {
    id: "quickdraw",
    name: "Quickdraw Specialist",
    desc: "Always turns first in battles, preempting enemy fire.",
    tree: "Gunslinger",
  },
  {
    id: "eagle_eye",
    name: "Eagle Eye",
    desc: "Provides +1 maximum range to all equipped firearms.",
    tree: "Gunslinger",
  },
  {
    id: "fanning",
    name: "Fanning the Hammer",
    desc: "Pistol shots consume 1 less AP but hit chance is slightly reduced.",
    tree: "Gunslinger",
  },
  {
    id: "steady_aim",
    name: "Steady Aim",
    desc: "Standing still increases your hit chance by 15% with rifles.",
    tree: "Gunslinger",
  },
  {
    id: "executioner",
    name: "Executioner",
    desc: "Deal +50% critical damage to enemies under 50% HP.",
    tree: "Gunslinger",
  },

  // Survivalist Tree
  {
    id: "hardy",
    name: "Hardy Desert Horseman",
    desc: "Saves 30% water hydration when traveling overland.",
    tree: "Survivalist",
  },
  {
    id: "iron_gut",
    name: "Iron Gut",
    desc: "Healing salves and whiskey restore +25 additional Health Points.",
    tree: "Survivalist",
  },
  {
    id: "thick_skin",
    name: "Thick Skin",
    desc: "Dulls pain, mitigating -2 damage from all incoming hits.",
    tree: "Survivalist",
  },
  {
    id: "field_medic",
    name: "Field Medic",
    desc: "Reduces the AP cost of using Bandages and Tourniquets by 1.",
    tree: "Survivalist",
  },
  {
    id: "tinkerer",
    name: "Gunsmith Tinkerer",
    desc: "Your equipped weapons degrade 50% slower from firing.",
    tree: "Survivalist",
  },
  {
    id: "lucky",
    name: "Lucky Jack",
    desc: "Gives a flat 10% chance to miraculously dodge any bullet.",
    tree: "Survivalist",
  },

  // Renegade Tree
  {
    id: "silver_tongue",
    name: "Silver Tongue",
    desc: "Provides general discounts of 20% at town shops.",
    tree: "Renegade",
  },
  {
    id: "bounty_hunter",
    name: "Bounty Hunter",
    desc: "Yields +20% more gold when turning in Sheriff bounties.",
    tree: "Renegade",
  },
  {
    id: "scavenger",
    name: "Dune Scavenger",
    desc: "Find +20% more gold from defeated outlaws in combat loot.",
    tree: "Renegade",
  },
  {
    id: "shadow",
    name: "Shadow of the Canyon",
    desc: "Reduces overland ambush frequencies by 50% traveling at night.",
    tree: "Renegade",
  },
  {
    id: "dynamite_expert",
    name: "Dynamite Expert",
    desc: "Explosives deal +25 flat damage and never misfire.",
    tree: "Renegade",
  },
  {
    id: "intimidation",
    name: "Intimidation",
    desc: "Severely wounded enemies have a higher chance of sudden surrender.",
    tree: "Renegade",
  },
];

export const MERCENARY_POOL: (PosseMember & {
  signupCost: number;
  alignment: "lawful" | "outlaw" | "neutral";
})[] = [
  {
    id: "recruit_holliday",
    name: "Red Doc Holliday",
    role: "Medic",
    hp: 80,
    maxHp: 80,
    dmg: 15,
    range: 4,
    dailyRateGold: 2,
    portrait: "🩺",
    description:
      "Sore-lungs card dealer and local doctor. Mends you with vital stitching in critical fights.",
    backstory:
      "Once a prominent surgeon, he lost his practice to a gambling addiction and a nasty cough.",
    trait: "loyal",
    morale: 80,
    signupCost: 150,
    alignment: "neutral",
  },
  {
    id: "recruit_swift",
    name: 'Jack "Deadeye" Swift',
    role: "Gunslinger",
    hp: 95,
    maxHp: 95,
    dmg: 24,
    range: 5,
    dailyRateGold: 3,
    portrait: "🔫",
    description:
      "Lightning speed hair-trigger marksman. Unloads twin Colt cylinders for rapid suppression.",
    backstory:
      "A former cavalry sharpshooter who prefers the quiet efficiency of a bounty contract over army rations.",
    trait: "mercenary",
    morale: 70,
    signupCost: 200,
    alignment: "outlaw",
  },
  {
    id: "recruit_scout",
    name: '"Whispering" Apache Scout',
    role: "Scout",
    hp: 85,
    maxHp: 85,
    dmg: 12,
    range: 6,
    dailyRateGold: 1,
    portrait: "🦅",
    description:
      "Silent canyon paths tracker. Lights up hostile targets, raising your accuracy in fights.",
    backstory:
      "Raised by the harsh frontier elements, he trusts scorpions more than he trusts city folk.",
    trait: "coward",
    morale: 50,
    signupCost: 100,
    alignment: "neutral",
  },
  {
    id: "recruit_buster",
    name: 'Ironclad "Buster" Cleaver',
    role: "Bodyguard",
    hp: 130,
    maxHp: 130,
    dmg: 10,
    range: 3,
    dailyRateGold: 2,
    portrait: "🛡️",
    description:
      "Sturdy fistfighter wearing boiler steel. Absorbs sniper bullet trauma to buffer your HP.",
    backstory:
      "Left a trail of broken taverns from Dodge to Tombstone. He loves the fight more than the gold.",
    trait: "bloodthirsty",
    morale: 60,
    signupCost: 160,
    alignment: "outlaw",
  },
  {
    id: "recruit_hunter",
    name: "Bounty Ranger Jesse",
    role: "Bounty Hunter",
    hp: 100,
    maxHp: 100,
    dmg: 30,
    range: 7,
    dailyRateGold: 3,
    portrait: "🤠",
    description:
      "Formidable lawmaker and sharpshooter carrying high-yield custom repeating Winchester rifle.",
    backstory:
      "Lost his brother to a raid, now he hunts the men responsible and anyone else with a price on their head.",
    trait: "loyal",
    morale: 90,
    signupCost: 225,
    alignment: "lawful",
  },
  {
    id: "recruit_guard_billy",
    name: "Billy 'Shotgun' Wheeler",
    role: "Trade Guard",
    hp: 90,
    maxHp: 90,
    dmg: 18,
    range: 3,
    dailyRateGold: 1,
    portrait: "💂",
    description: "Cheap wagon guard. Reduces road ambush chance by 20% (stackable with other Trade Guards).",
    backstory: "A reliable farmhand who's spent years riding shotgun on grain wagons. No fancy tricks, just a steady aim.",
    trait: "loyal",
    morale: 65,
    signupCost: 45,
    alignment: "lawful",
  },
  {
    id: "recruit_guard_silas",
    name: "Silas 'Caravan' Cooper",
    role: "Trade Guard",
    hp: 100,
    maxHp: 100,
    dmg: 14,
    range: 4,
    dailyRateGold: 1,
    portrait: "🛡️",
    description: "Experienced wagon sentinel. Reduces road ambush chance by 20% (stackable with other Trade Guards).",
    backstory: "Guarded lumber shipments in Oregon before heading south. Knows exactly where highwaymen hide.",
    trait: "loyal",
    morale: 70,
    signupCost: 50,
    alignment: "neutral",
  },
];

export const TownView: React.FC<TownViewProps> = ({
  location,
  worldLocations,
  player,
  onAcceptMission,
  onBuyItem,
  onSellItem,
  onSellMount,
  onBuyTradeItem,
  onSellTradeItem,
  onBuyCarriage,
  onBuyRumor,
  onDrinkWhiskey,
  onHoldUpBank,
  onSelectPerk,
  onCraftUpgrade,
  onCraftWeapon,
  onUpdatePlayer,
  onRevealLocation,
  onStartCombat,
  addLogMessage,
  onCollectBounty,
  onReturnToMap,
  onRaidStash,
  onTriggerTip,
}) => {
  const [activeTab, setActiveTab] = useState<
    | "map"
    | "saloon"
    | "general"
    | "trading"
    | "bank"
    | "crafting"
    | "sheriff"
    | "doctor"
  >("map");
  const [saloonDuelChallenger, setSaloonDuelChallenger] = useState<any>(null);
  const [saloonRandomEvent, setSaloonRandomEvent] =
    useState<SaloonEvent | null>(null);
  const [saloonEventResult, setSaloonEventResult] = useState<string | null>(
    null,
  );
  const [showDirectionsMenu, setShowDirectionsMenu] = useState(false);
  const [tradeModal, setTradeModal] = useState<{
    action: "buy" | "sell";
    goodId: string;
  } | null>(null);
  const [tradeInputQty, setTradeInputQty] = useState<string>("");

  const currentWeight = player.tradeInventory
    ? getCargoWeight(player.tradeInventory)
    : 0;
  const maxCapacity = getMaxCapacity(
    player.hasHorse,
    player.activeCarriage?.type,
    player,
  );
  const [directionsCost, setDirectionsCost] = useState(10);

  useEffect(() => {
    if (onTriggerTip) {
      if (activeTab === "sheriff") {
        onTriggerTip(
          "sheriff",
          "The Sheriff's Office",
          "Here you can collect bounties on outlaws you've defeated or check the town's current needs.",
        );
      } else if (activeTab === "saloon") {
        onTriggerTip(
          "saloon",
          "The Local Saloon",
          "A hotbed of activity. Hire posse members, rest up, gamble, or find trouble. Beware, your reputation dictates how folks treat you.",
        );
      } else if (activeTab === "bank") {
        onTriggerTip(
          "bank",
          "The Bank",
          "You can attempt to hold up the bank for quick gold, but doing so drops your reputation into Outlaw territory and summons armed guards instantly.",
        );
      } else if (activeTab === "crafting") {
        onTriggerTip(
          "gunsmith",
          "Gunsmith",
          "Upgrade weapons with barrel rifling for damage, expanded cylinders, or scopes for better range using local spare parts you scavenge.",
        );
      }
    }
  }, [activeTab, onTriggerTip]);

  useEffect(() => {
    if (
      activeTab === "saloon" &&
      !saloonDuelChallenger &&
      !saloonRandomEvent &&
      !saloonEventResult
    ) {
      // Roll for duel challenge
      const rollDuel = Math.random();
      let duelTriggered = false;
      if (rollDuel < 0.3) {
        const isGoodRep = player.reputation > 20;
        const isBadRep = player.reputation < -20;

        if (rollDuel < 0.15 && isGoodRep) {
          setSaloonDuelChallenger({
            name: "Mad Dog Miller",
            desc: "A notorious outlaw wants to make a name by killing the famous lawman.",
            risk: 0.6,
            provokedNpcId: "saloon_outlaw",
          });
          duelTriggered = true;
        } else if (rollDuel >= 0.15 && isBadRep) {
          setSaloonDuelChallenger({
            name: "Bounty Hunter 'Texas' Red",
            desc: "A hotshot bounty hunter recognized your face from a wanted poster.",
            risk: 0.7,
            provokedNpcId: "saloon_lawman",
          });
          duelTriggered = true;
        } else if (rollDuel < 0.05 && !isGoodRep && !isBadRep) {
          setSaloonDuelChallenger({
            name: "Drunk Local",
            desc: "A drunken local bumped into you and drew his weapon!",
            risk: 0.1,
            provokedNpcId: "saloon_drunk",
          });
          duelTriggered = true;
        }
      }

      // If no duel triggered, roll for random bar event
      if (!duelTriggered && Math.random() < 0.75) {
        const event =
          SALOON_EVENTS[Math.floor(Math.random() * SALOON_EVENTS.length)];
        setSaloonRandomEvent(event);
      }
    } else if (activeTab !== "saloon") {
      setSaloonDuelChallenger(null);
      setSaloonRandomEvent(null);
      setSaloonEventResult(null);
    }
  }, [activeTab]);

  const handleSaloonEventOption = (option: SaloonEventOption) => {
    onUpdatePlayer((prev) => ({ ...prev, ...option.effect(prev) }));
    setSaloonEventResult(option.effectMessage);
    setSaloonRandomEvent(null);
  };

  const handleAskDirections = (
    targetType: string,
    specificName?: string,
    x?: number,
    y?: number,
    questId?: string,
  ) => {
    if (player.gold < directionsCost) return;

    // Gruff reply chance
    if (Math.random() < 0.2) {
      setBarkeepDialogue({
        speaker: "Saloon Barkeep",
        text: "Do I look like the Wild West information desk to you? Drink your whiskey and get out.",
      });
      onUpdatePlayer((prev) => ({ ...prev, gold: prev.gold - directionsCost }));
      setDirectionsCost((prev) => prev + 5);
      return;
    }

    let targetLoc: { x: number; y: number; id?: string } | undefined;
    let fallbackText = "";

    if (x !== undefined && y !== undefined) {
      // We have coordinates (e.g. from a quest target)
      targetLoc = { x, y };
      fallbackText = `I ain't heard of nobody named ${specificName}.`;
    } else {
      // Find nearest location of type
      const possibleLocs = worldLocations.filter(
        (loc) =>
          loc.id !== location.id && loc.type === targetType && !loc.isHidden,
      );
      if (possibleLocs.length > 0) {
        // Find nearest
        targetLoc = possibleLocs.reduce((prev, curr) => {
          const distPrev = Math.hypot(prev.x - location.x, prev.y - location.y);
          const distCurr = Math.hypot(curr.x - location.x, curr.y - location.y);
          return distCurr < distPrev ? curr : prev;
        });
      } else {
        fallbackText = `There ain't no ${targetType.replace("_", " ")}s around here, partner.`;
      }
    }

    let savedDirection = "";

    if (!targetLoc) {
      setBarkeepDialogue({ speaker: "Saloon Barkeep", text: fallbackText });
    } else if (Math.abs(targetLoc.x - location.x) < 1 && Math.abs(targetLoc.y - location.y) < 1) {
      setBarkeepDialogue({
        speaker: "Saloon Barkeep",
        text: `Are you blind, partner? You're standin' right in the middle of ${specificName || "it"}! Look around town or check your logs.`,
      });
      setShowDirectionsMenu(false);
      return;
    } else {
      // Get direction
      const dx = targetLoc.x - location.x;
      const dy = targetLoc.y - location.y;

      let direction = "yonder";
      if (Math.abs(dx) > Math.abs(dy)) {
        direction = dx > 0 ? "East" : "West";
        if (Math.abs(dy) > 10) {
          direction += dy > 0 ? " and South" : " and North";
        }
      } else {
        direction = dy > 0 ? "South" : "North";
        if (Math.abs(dx) > 10) {
          direction += dx > 0 ? " and East" : " and West";
        }
      }
      savedDirection = direction;

      setBarkeepDialogue({
        speaker: "Saloon Barkeep",
        text: `Yeah, I heard whispers. If you're lookin' for ${specificName ? specificName : "that"}, you wanna head out ${direction}.`,
      });

      // Optionally reveal location on map if it's a specific place
      if (targetLoc.id) {
        onRevealLocation(targetLoc.id);
      }
    }

    onUpdatePlayer((prev) => {
      let updatedQuests = prev.acceptedQuests;
      if (questId && updatedQuests && savedDirection) {
        updatedQuests = updatedQuests.map((q) => {
          if (q.id === questId) {
            const addText = `\n[Rumor]: Barkeep located it out ${savedDirection}.`;
            return {
              ...q,
              description: q.description.includes("[Rumor]")
                ? q.description
                : q.description + addText,
              currentCluePoints: Math.min(
                (q.currentCluePoints || 0) + 1,
                q.maxClueThreshold || 3,
              ),
            };
          }
          return q;
        });
      }
      return {
        ...prev,
        acceptedQuests: updatedQuests,
        gold: prev.gold - directionsCost,
      };
    });
    setDirectionsCost((prev) => prev + 5);
    setShowDirectionsMenu(false);
  };

  // Pending perks check
  const earnedLevelPerksCount = player.perks.filter((pId) =>
    PERK_OPTIONS.some((opt) => opt.id === pId),
  ).length;
  const pendingPerksCount =
    Math.max(0, player.level - 2) - earnedLevelPerksCount;
  const availablePerksSelect = PERK_OPTIONS.filter(
    (p) => !player.perks.includes(p.id),
  );

  // Count items in inventory for crafting calculations
  const countMaterial = (materialId: string) => {
    const item = player.inventory.find((i) => i.id === materialId);
    return item ? item.count : 0;
  };

  const gunpowderCount = countMaterial("gunpowder");
  const glassScopeCount = countMaterial("glass_scope");
  const safeSpringsCount = countMaterial("safe_springs");

  // Reputations & pricing multipliers
  let factionType: "lawmen" | "outlaws" | "tribes" | "neutral" =
    location.controllingFaction ?? "lawmen";
  let factionTitle = "Federal Lawmen";
  let repValue = player.factionReputation?.lawmen ?? 0;

  if (!location.controllingFaction) {
    if (location.type === "outlaw_haven" || location.type === "hostile_camp") {
      factionType = "outlaws";
    } else if (
      location.type === "desert_oasis" ||
      location.type === "ghost_town"
    ) {
      factionType = "neutral";
    }
  }

  if (factionType === "outlaws") {
    factionTitle = "Outlaw Gangs";
    repValue = player.factionReputation?.outlaws ?? 0;
  } else if (factionType === "tribes") {
    factionTitle = "Native Tribes";
    repValue = player.factionReputation?.tribes ?? 10;
  } else if (factionType === "neutral") {
    factionTitle = "Locals & Scavengers";
    repValue = player.factionReputation?.tribes ?? 10; // Use tribes rep or generic
  } else {
    factionTitle = "Federal Lawmen";
    repValue = player.factionReputation?.lawmen ?? 0;
  }

  const locType = location.type;
  const prosperity = location.prosperity ?? 50;

  const hasSaloon = 
    locType === "boomtown" || 
    locType === "outlaw_haven" || 
    locType === "railway_hub" || 
    (prosperity >= 30 && locType !== "hostile_camp" && locType !== "ephemeral_stash" && locType !== "desert_oasis" && locType !== "mine");

  const hasGeneralStore = 
    locType !== "ephemeral_stash" && locType !== "hostile_camp"; 

  const hasCrafting = 
    locType === "boomtown" || 
    locType === "railway_hub" || 
    locType === "cavalry_fort" ||
    (prosperity >= 40 && locType !== "ephemeral_stash" && locType !== "desert_oasis" && locType !== "mine");

  const hasTrading = 
    locType === "railway_hub" || 
    locType === "cavalry_fort" || 
    locType === "boomtown" || 
    (prosperity >= 60 && locType !== "ephemeral_stash" && locType !== "mine" && locType !== "hostile_camp");

  const hasBank = 
    locType === "boomtown" || 
    locType === "railway_hub" || 
    (prosperity >= 50 && locType !== "ephemeral_stash" && locType !== "mine" && locType !== "ghost_town" && locType !== "hostile_camp" && locType !== "outlaw_haven");

  const hasSheriff = 
    locType === "cavalry_fort" || 
    ((factionType === "lawmen" || factionType === "neutral") && locType !== "ephemeral_stash" && locType !== "mine" && locType !== "hostile_camp" && locType !== "outlaw_haven" && locType !== "ghost_town" && prosperity >= 20);

  const hasBanditBoss = 
    locType === "outlaw_haven" || locType === "hostile_camp";

  const hasDoctor = 
    locType === "boomtown" || 
    locType === "railway_hub" || 
    locType === "cavalry_fort" || 
    (prosperity >= 35 && locType !== "ephemeral_stash" && locType !== "hostile_camp");

  let labelSaloon = "Local Saloon";
  if (locType === "cavalry_fort") labelSaloon = "Officer's Mess";
  if (locType === "native_settlement") labelSaloon = "Communal Fire";

  let labelGeneralStore = "Merchant Yard";
  if (locType === "cavalry_fort") labelGeneralStore = "Quartermaster";
  if (locType === "native_settlement") labelGeneralStore = "Trader's Tent";

  let labelCrafting = "Gunsmith Bench";
  if (locType === "cavalry_fort") labelCrafting = "Armory";
  if (locType === "native_settlement") labelCrafting = "Crafter's Lodge";

  let labelTrading = "Trade Depot";
  if (locType === "cavalry_fort") labelTrading = "Supply Depot";
  if (locType === "native_settlement") labelTrading = "Trade Exchange";

  let labelBank = "Outpost Bank";
  if (locType === "cavalry_fort") labelBank = "Fort Treasury";
  if (locType === "native_settlement") labelBank = "Communal Cache";

  let labelSheriff = "Sheriff's Office";
  if (hasBanditBoss) labelSheriff = location.leaderName ? `${location.leaderName}'s Tent` : "Bandit Boss";
  else if (locType === "cavalry_fort") labelSheriff = location.leaderName ? `${location.leaderName}'s Tent` : "Command Tent";
  else if (locType === "native_settlement") labelSheriff = location.leaderName ? `${location.leaderName}'s Lodge` : "Peacekeeper";
  else if (location.leaderName) labelSheriff = `${location.leaderName}'s Office`;

  let labelDoctor = "Surgeon";
  if (locType === "cavalry_fort") labelDoctor = "Field Hospital";
  if (locType === "native_settlement") labelDoctor = "Healer's Lodge";

  useEffect(() => {
    // If player traveled to a location that doesn't support the active tab, fall back to map
    if (activeTab === "saloon" && !hasSaloon) setActiveTab("map");
    if (activeTab === "general" && !hasGeneralStore) setActiveTab("map");
    if (activeTab === "crafting" && !hasCrafting) setActiveTab("map");
    if (activeTab === "trading" && !hasTrading) setActiveTab("map");
    if (activeTab === "bank" && !hasBank) setActiveTab("map");
    if (activeTab === "sheriff" && !hasSheriff && !hasBanditBoss) setActiveTab("map");
    if (activeTab === "doctor" && !hasDoctor) setActiveTab("map");
  }, [location.id, activeTab, hasSaloon, hasGeneralStore, hasCrafting, hasTrading, hasBank, hasSheriff, hasBanditBoss, hasDoctor]);

  const ratingColor =
    repValue >= 20
      ? "text-teal-400"
      : repValue <= -20
        ? "text-red-400"
        : "text-[#8c6b0c]";

  // Price adjustment: High reputation = discount (up to 30%), low reputation = surcharge (up to 50%)
  const factionRepMultiplier = 1.0 - repValue / 250; // +100 rep gives 0.6x (40% off), -100 rep gives 1.4x (40% markup)
  const perkMultiplier = player.perks.includes("silver_tongue") ? 0.8 : 1.0;
  const prosperityMultiplier =
    location.prosperity !== undefined
      ? 1 + (50 - location.prosperity) / 100
      : 1.0;
  const costMultiplier = Math.max(
    0.5,
    Math.min(2.0, perkMultiplier * factionRepMultiplier * prosperityMultiplier),
  );

  // Quest Locks
  // Bounties are locked if Lawmen reputation is <-15
  // Robberies or Bank locks if Outlaw reputation is <-30
  // Tribe/Relic scavenger quests locked if Tribes reputation is <-20
  const isLawmenHostile = (player.factionReputation?.lawmen ?? 0) < -15;
  const isTribesHostile = (player.factionReputation?.tribes ?? 10) < -20;

  // SHOOT ON SIGHT FACTION LOGIC
  const checkShootOnSight = () => {
    if (factionType === "lawmen" && repValue <= -50)
      return {
        hostile: true,
        guards: "Sheriff Posse",
        desc: 'The Law has posted "Wanted Dead or Alive" posters of you on every wall. The deputies recognize you immediately and draw their irons!',
      };
    if (factionType === "outlaws" && repValue <= -30)
      return {
        hostile: true,
        guards: "Outlaw Enforcers",
        desc: "Your face is hated among the outlaws here. Men scramble for their rifles as soon as your horse trots into the hideout.",
      };
    if (factionType === "tribes" && repValue <= -50)
      return {
        hostile: true,
        guards: "Tribal Braves",
        desc: "You have desecrated tribal lands too deeply. The braves loose arrows in your direction before you even dismount.",
      };
    return { hostile: false, guards: "", desc: "" };
  };

  const shootOnSightInfo = checkShootOnSight();

  const availableMissions = location.quests.filter((m) => {
    const isAccepted = player.inventory.some((item) => item.id === m.id);
    return !isAccepted;
  });

  const [barkeepDialogue, setBarkeepDialogue] = useState<{
    speaker: string;
    text: string;
  } | null>(null);

  // Altered NPC dialogue in Saloon depending on faction ratings
  const getResponsiveDialogue = () => {
    if (barkeepDialogue) return barkeepDialogue;
    const lawRep = player.factionReputation?.lawmen ?? 0;
    const outRep = player.factionReputation?.outlaws ?? 0;
    const triRep = player.factionReputation?.tribes ?? 10;

    if (lawRep >= 55) {
      return {
        speaker: "Sheriff Deputy",
        text: '"Greetings, Marshal. The county judges sleep soundly knowing your Colt is keeping peace. Let us know if you spotted any wanted lowlifes along the rail trail."',
      };
    }
    if (outRep >= 50) {
      return {
        speaker: "Grizzled Bank-agent",
        text: `"Hey ${player.name}! The boys at Dead Canyon speak highly of your hold-ups. There is plenty of safe bullion sitting in that hub trust box if you are looking to load up."`,
      };
    }
    if (lawRep <= -40) {
      return {
        speaker: "Nervous Merchant",
        text: "\"Don't want no trouble, drifter. The Sheriff's deputies have posted flyers with your name. They say you are a trigger-happy stick-up artist. Finish your water and ride on.\"",
      };
    }
    if (triRep >= 50) {
      return {
        speaker: "Tribe Pathfinder",
        text: `"${player.name}, the arid wind speaks of your courage. You returned the Navajo relics and preserved settler lines from desert scorpions. Safe springs are always yours."`,
      };
    }
    if (triRep <= -40) {
      return {
        speaker: "Tribal Brave",
        text: '"You are a graverobber. You desecrate sacred mounds to buy whiskey gold. Take your iron wagon out of our ancestral dunes before the spirits summon Gila snakes."',
      };
    }
    return {
      speaker: "Barkeep Sam",
      text: '"Warm welcome, drifter. Whiskey is cold, ammunition is sold, and the desert scorpions are nesting hot. Pick up bounties if you need coin, or Rob the bank vault to drift dark."',
    };
  };

  const npcDialogue = getResponsiveDialogue();

  // Crafting trigger helpers
  const getRequiredMaterialCount = (baseCount: number) => {
    if ((player.salvageSkillLevel || 0) >= 3) {
      return Math.max(1, Math.round(baseCount * 0.70));
    }
    return baseCount;
  };

  const canCraftUpgrade = (type: "barrel" | "clip" | "scope" | "rifling") => {
    if (type === "barrel") return gunpowderCount >= getRequiredMaterialCount(5);
    if (type === "clip") return safeSpringsCount >= getRequiredMaterialCount(3);
    if (type === "scope") return glassScopeCount >= getRequiredMaterialCount(3);
    if (type === "rifling") return safeSpringsCount >= getRequiredMaterialCount(4);
    return false;
  };

  const handleCraftUpgrade = (
    type: "barrel" | "clip" | "scope" | "rifling",
  ) => {
    let mats: { [key: string]: number } = {};
    if (type === "barrel") mats = { gunpowder: getRequiredMaterialCount(5) };
    if (type === "clip") mats = { safe_springs: getRequiredMaterialCount(3) };
    if (type === "scope") mats = { glass_scope: getRequiredMaterialCount(3) };
    if (type === "rifling") mats = { safe_springs: getRequiredMaterialCount(4) };

    onCraftUpgrade(type, mats);
  };

  const canCraftWeapon = (type: "shotgun" | "rifle") => {
    if (type === "shotgun") return gunpowderCount >= getRequiredMaterialCount(5);
    if (type === "rifle") return gunpowderCount >= getRequiredMaterialCount(6) && safeSpringsCount >= getRequiredMaterialCount(4);
    return false;
  };

  const handleCraftWeapon = (type: "shotgun" | "rifle") => {
    if (type === "shotgun") {
      onCraftWeapon(
        "Sawed-Off Shotgun (Crafted)",
        "wpn_shotgun_crafted",
        { dmg: 35, range: 3, maxClip: 2 },
        { gunpowder: getRequiredMaterialCount(5) },
      );
    } else {
      onCraftWeapon(
        "Winchester Rifle (Crafted)",
        "wpn_rifle_crafted",
        { dmg: 28, range: 8, maxClip: 6 },
        { gunpowder: getRequiredMaterialCount(6), safe_springs: getRequiredMaterialCount(4) },
      );
    }
  };

  const activeTutorialQuest =
    worldLocations[0]?.quests.find((q) => q.id === "tutorial_get_horse") ||
    player.acceptedQuests?.find((q) => q.id === "tutorial_get_horse");
  const hasTutorialQuest =
    (player.inventory.some((i) => i.id === "tutorial_get_horse") ||
      player.acceptedQuests?.some((q) => q.id === "tutorial_get_horse")) &&
    location.id === worldLocations[0]?.id;

  // Helper to handle general street interactions
  const handleStreetTalk = (
    action:
      | "info"
      | "bribe"
      | "provoke_pete"
      | "provoke_sheriff"
      | "provoke_outlaw",
  ) => {
    if (action === "info") {
      const locIds = worldLocations.map((l) => l.id);
      const unrevealed = locIds.filter(
        (id) => !player.revealedLocations.includes(id),
      );
      if (unrevealed.length > 0) {
        const randomLoc =
          unrevealed[Math.floor(Math.random() * unrevealed.length)];
        onRevealLocation(randomLoc);
        addLogMessage(
          `🗺️ LOCAL GOSSIP: A street sweeper whispered about a place called '${worldLocations.find((l) => l.id === randomLoc)?.name}'. It is now marked on your Overland Map!`,
          "travel",
        );
      } else {
        addLogMessage(
          `💬 The locals have no new secrets to share about the frontier.`,
          "system",
        );
      }
    } else if (action === "bribe") {
      if (player.gold >= 50) {
        onUpdatePlayer((prev) => ({
          ...prev,
          gold: prev.gold - 50,
          factionReputation: { ...prev.factionReputation, lawmen: 0 },
        }));
        addLogMessage(
          `🤝 BRIBED THE LAW: You slipped $50 to the local Sheriff. Your federal bounties have been cleared!`,
          "reputation",
        );
      } else {
        addLogMessage(
          `⚠️ You don't have enough Gold ($50) to bribe the Sheriff.`,
          "system",
        );
      }
    } else if (action === "provoke_pete") {
      addLogMessage(
        `🚨 ARREST ATTEMPT: ${player.name} draws cuffs and weapon on Slippery Pete!`,
        "danger",
      );
      onStartCombat(
        "bounty",
        0.1,
        activeTutorialQuest || null,
        "slippery_pete",
      );
    } else if (action === "provoke_sheriff") {
      addLogMessage(
        `⚔️ LAWLESS: ${player.name} draws iron on the local Federal Sheriff!`,
        "danger",
      );
      onStartCombat("ambush", location.risk, null, "sheriff_garrett");
    } else if (action === "provoke_outlaw") {
      addLogMessage(
        `⚔️ GANG WAR: ${player.name} kicks open the outlaw den and challenges the Cap'n!`,
        "danger",
      );
      onStartCombat("ambush", location.risk, null, "sheriff_garrett");
    }
  };

  if (shootOnSightInfo.hostile) {
    return (
      <div
        id="town-view"
        className="bg-[#1a0f0a] border border-red-900 p-8 rounded-sm flex flex-col items-center justify-center h-full shadow-xl"
      >
        <h1 className="text-red-500 font-serif font-black text-2xl uppercase tracking-[0.2em] mb-2">
          {shootOnSightInfo.guards} Attack!
        </h1>
        <p className="text-amber-100/70 font-serif italic mb-6 text-center max-w-md">
          {shootOnSightInfo.desc}
        </p>

        <div className="flex flex-col gap-3 w-full max-w-sm">
          <button
            onClick={() => onStartCombat("ambush", location.risk + 0.2)}
            className="w-full py-4 bg-red-950 hover:bg-red-800 border uppercase border-red-600 text-white font-serif font-bold text-xs tracking-widest transition-all"
          >
            ⚔️ Stand Your Ground (Combat)
          </button>
          <button
            onClick={onReturnToMap}
            className="w-full py-3 bg-[#dfd4bd] hover:bg-[#3d2d21] border uppercase border-[#bfae96] text-[#2d2119] hover:text-[#dfd4bd] font-serif font-bold text-xs tracking-widest transition-all"
          >
            🏃 Flee the Settlement (Return to Map)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      id="town-view"
      className="bg-[#f4ead5] border border-[#bfae96] p-5 rounded-sm flex flex-col h-full justify-between shadow-xl"
    >
      {/* Town Banner Header */}
      <div className="border-b border-[#bfae96] pb-3 mb-4 flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="text-[10px] text-[#8c6b0c] font-bold uppercase tracking-widest font-serif flex items-center gap-2">
            <span>
              REGION OUTPOST DISTRICT • Governing Faction:{" "}
              <span className="text-stone-600">{factionTitle}</span>
            </span>
            {location.prosperity !== undefined && (
              <span
                className={`px-2 py-[1px] border rounded-sm font-black ${
                  location.prosperity < 20
                    ? "bg-red-950/20 text-red-800 border-red-800/30"
                    : location.prosperity > 80
                      ? "bg-green-950/20 text-green-800 border-green-800/30"
                      : "bg-amber-950/20 text-amber-800 border-amber-800/30"
                }`}
              >
                PROSPERITY: {Math.floor(location.prosperity)}%
                {location.prosperity < 20
                  ? " (Ghost Town)"
                  : location.prosperity > 80
                    ? " (Boom Town)"
                    : " (Developing)"}
              </span>
            )}
          </div>
          <h2 className="text-base font-bold text-[#8c6b0c] tracking-wide mt-0.5 font-serif">
            {location.name}{" "}
            {location.prosperity && location.prosperity < 20
              ? "(Abandoned)"
              : "(Frontier Hub)"}
          </h2>
          <p className="text-[#4a3928] text-xs italic mt-1 font-sans">
            {location.description}
          </p>
        </div>

        <div className="flex gap-2 items-center">
          {location.type === "desert_oasis" && (
            <span className="text-[9px] bg-sky-950/40 text-sky-400 px-2 py-1 rounded-sm border border-[#2a8ec4]/30 font-bold flex items-center gap-1 font-serif uppercase tracking-wider">
              <Waves size={10} /> FREE SPRINGS
            </span>
          )}
          <span className="text-[11px] bg-[#e8dec7] border border-[#bfae96] px-2.5 py-1 rounded-sm text-[#4a3928] font-mono">
            {location.type === "outlaw_haven"
              ? "Outlaws Standing: "
              : location.type === "desert_oasis"
                ? "Tribal standing: "
                : "Law Reputation: "}
            <b className={`${ratingColor}`}>{repValue}</b>
          </span>
        </div>
      </div>

      {/* Center Layout Split matching Immersive UI */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-1">
        {/* Navigation Sidebar Districts — Plank buttons */}
        <div className="md:col-span-1 flex flex-row md:flex-col gap-2 md:border-r md:border-[#bfae96]/60 md:pr-4 overflow-x-auto pb-2 md:pb-0">
          <button
            id="tab-map"
            onClick={() => setActiveTab("map")}
            className={`flex-shrink-0 md:flex-none py-2 px-3 rounded-sm flex items-center justify-center md:justify-start gap-2.5 font-bold transition-all text-xs font-serif tracking-wider ${
              activeTab === "map"
                ? "bg-[#3d2d21] text-[#8c6b0c] border border-[#8a705a] shadow-inner"
                : "text-[#664d36] hover:text-[#3d2d21] bg-[#e8dec7]/60 hover:bg-[#e8dec7] border border-[#bfae96]/60"
            }`}
          >
            <Compass size={13} className="text-[#8c6b0c]" />
            <span>
              {location.type === "ephemeral_stash"
                ? "Stash Cache"
                : "Town Square"}
            </span>
          </button>

          {location.type !== "ephemeral_stash" && (
            <>
              {hasSaloon && (
                <button
                  id="tab-saloon"
                  onClick={() => setActiveTab("saloon")}
                  className={`flex-shrink-0 md:flex-none py-2 px-3 rounded-sm flex items-center justify-center md:justify-start gap-2.5 font-bold transition-all text-xs font-serif tracking-wider ${
                    activeTab === "saloon"
                      ? "bg-[#3d2d21] text-[#8c6b0c] border border-[#8a705a] shadow-inner"
                      : "text-[#664d36] hover:text-[#3d2d21] bg-[#e8dec7]/60 hover:bg-[#e8dec7] border border-[#bfae96]/60"
                  }`}
                >
                  <Beer size={13} className="text-[#8c6b0c]" />
                  <span>{labelSaloon}</span>
                </button>
              )}

              {hasGeneralStore && (
                <button
                  id="tab-general"
                  onClick={() => setActiveTab("general")}
                  className={`flex-shrink-0 md:flex-none py-2 px-3 rounded-sm flex items-center justify-center md:justify-start gap-2.5 font-bold transition-all text-xs font-serif tracking-wider ${
                    activeTab === "general"
                      ? "bg-[#3d2d21] text-[#8c6b0c] border border-[#8a705a] shadow-inner"
                      : "text-[#664d36] hover:text-[#3d2d21] bg-[#e8dec7]/60 hover:bg-[#e8dec7] border border-[#bfae96]/60"
                  }`}
                >
                  <Store size={13} className="text-[#8c6b0c]" />
                  <span>{labelGeneralStore}</span>
                </button>
              )}

              {hasCrafting && (
                <button
                  id="tab-crafting"
                  onClick={() => setActiveTab("crafting")}
                  className={`flex-shrink-0 md:flex-none py-2 px-3 rounded-sm flex items-center justify-center md:justify-start gap-2.5 font-bold transition-all text-xs font-serif tracking-wider ${
                    activeTab === "crafting"
                      ? "bg-[#3d2d21] text-[#8c6b0c] border border-[#8a705a] shadow-inner"
                      : "text-[#664d36] hover:text-[#3d2d21] bg-[#e8dec7]/60 hover:bg-[#e8dec7] border border-[#bfae96]/60"
                  }`}
                >
                  <Hammer size={13} className="text-[#8c6b0c]" />
                  <span>{labelCrafting}</span>
                </button>
              )}

              {hasTrading && (
                <button
                  id="tab-trading"
                  onClick={() => setActiveTab("trading")}
                  className={`flex-shrink-0 md:flex-none py-2 px-3 rounded-sm flex items-center justify-center md:justify-start gap-2.5 font-bold transition-all text-xs font-serif tracking-wider ${
                    activeTab === "trading"
                      ? "bg-[#3d2d21] text-[#8c6b0c] border border-[#8a705a] shadow-inner"
                      : "text-[#664d36] hover:text-[#3d2d21] bg-[#e8dec7]/60 hover:bg-[#e8dec7] border border-[#bfae96]/60"
                  }`}
                >
                  <Package size={13} className="text-[#8c6b0c]" />
                  <span>{labelTrading}</span>
                </button>
              )}

              {hasBank && (
                <button
                  id="tab-bank"
                  onClick={() => setActiveTab("bank")}
                  className={`flex-shrink-0 md:flex-none py-2 px-3 rounded-sm flex items-center justify-center md:justify-start gap-2.5 font-bold transition-all text-xs font-serif tracking-wider ${
                    activeTab === "bank"
                      ? "bg-[#3d2d21] text-[#8c6b0c] border border-[#8a705a] shadow-inner"
                      : "text-[#664d36] hover:text-[#3d2d21] bg-[#e8dec7]/60 hover:bg-[#e8dec7] border border-[#bfae96]/60"
                  }`}
                >
                  <Landmark size={13} className="text-[#8c6b0c]" />
                  <span>{labelBank}</span>
                </button>
              )}

              {(hasSheriff || hasBanditBoss) && (
                <button
                  id="tab-sheriff"
                  onClick={() => setActiveTab("sheriff")}
                  className={`flex-shrink-0 md:flex-none py-2 px-3 rounded-sm flex items-center justify-center md:justify-start gap-2.5 font-bold transition-all text-xs font-serif tracking-wider ${
                    activeTab === "sheriff"
                      ? "bg-[#3d2d21] text-[#8c6b0c] border border-[#8a705a] shadow-inner"
                      : "text-[#664d36] hover:text-[#3d2d21] bg-[#e8dec7]/60 hover:bg-[#e8dec7] border border-[#bfae96]/60"
                  }`}
                >
                  <ShieldAlert size={13} className="text-[#8c6b0c]" />
                  <span>{labelSheriff}</span>
                </button>
              )}

              {hasDoctor && (
                <button
                  id="tab-doctor"
                  onClick={() => setActiveTab("doctor")}
                  className={`flex-shrink-0 md:flex-none py-2 px-3 rounded-sm flex items-center justify-center md:justify-start gap-2.5 font-bold transition-all text-xs font-serif tracking-wider ${
                    activeTab === "doctor"
                      ? "bg-[#3d2d21] text-[#8c6b0c] border border-[#8a705a] shadow-inner"
                      : "text-[#664d36] hover:text-[#3d2d21] bg-[#e8dec7]/60 hover:bg-[#e8dec7] border border-[#bfae96]/60"
                  }`}
                >
                  <PlusCircle size={13} className="text-[#8c6b0c]" />
                  <span>{labelDoctor}</span>
                </button>
              )}
            </>
          )}
        </div>

        {/* District Detail Page Content */}
        <div className="md:col-span-3 min-h-[340px] flex flex-col justify-between">
          {/* TAB: DISTRICT GRID MAP (Interactive walk & npc interactions) */}
          {activeTab === "map" && (
            <div className="space-y-4 flex-1">
              <div className="bg-[#e8dec7] border border-[#bfae96] p-4 rounded-sm flex flex-col justify-center items-center text-center space-y-4 min-h-[300px]">
                <div className="text-4xl">
                  {location.type === "mine"
                    ? "⛏️"
                    : location.type === "ephemeral_stash"
                      ? "📦"
                      : "🏜️"}
                </div>
                <h3 className="text-[#8c6b0c] font-serif font-bold text-lg uppercase tracking-widest">
                  {location.name}{" "}
                  {location.type === "mine"
                    ? "Mine Entry"
                    : location.type === "ephemeral_stash"
                      ? "Site"
                      : "Square"}
                </h3>
                <p className="text-[#4a3928] max-w-sm text-sm italic font-serif">
                  {location.type === "mine"
                    ? "Dusty prospectors cough rhythmically while eyeing your pockets. A donkey kicks a dynamite barrel nearby, and the foreman's mustache trembles in fear."
                    : location.type === "ephemeral_stash"
                      ? "A hastily buried cache of supplies and valuables. The dirt is freshly turned. Raid it quickly before the owners return."
                      : location.type === "abandoned"
                        ? "Tumbleweeds roll gracefully past skeletal remains of a saloon. A lonely vulture watches you, clearly hoping you forget to drink water today."
                        : location.type === "indian_camp"
                          ? "Stoic warriors polish their carbines while completely ignoring your attempts at sign language. The smell of burning sage makes you want a cigar."
                          : "The quintessential frontier town: three saloons, one bank just begging to be robbed, and a sheriff who looks suspiciously like he's two days from retirement."}
                </p>
                <div className="w-full max-w-md bg-[#dcd1b9] p-3 rounded-sm border border-[#bfae96]/60 flex flex-col gap-2 mx-auto">
                  {location.type === "ephemeral_stash" && onRaidStash && (
                    <button
                      onClick={() => onRaidStash(location.id)}
                      className="w-full py-4 bg-[#8c6b0c] hover:bg-[#6c5107] border border-[#d4af37]/50 text-white font-bold text-xs font-serif uppercase tracking-wider rounded"
                    >
                      💰 Raid the Cache Now
                    </button>
                  )}

                  {/* Tutorial special */}
                  {hasTutorialQuest && (
                    <button
                      onClick={() => handleStreetTalk("provoke_pete")}
                      className="w-full py-2 bg-red-950 hover:bg-red-900 border border-red-500/50 text-white font-bold text-xs font-serif uppercase tracking-wider rounded"
                    >
                      🚨 Confront Slippery Pete
                    </button>
                  )}

                  {factionType === "outlaws" && (
                    <button
                      onClick={() => handleStreetTalk("provoke_outlaw")}
                      className="w-full py-2 bg-[#301010] hover:bg-red-950 border border-red-950 text-[#2d2119] font-bold text-[10px] font-mono uppercase tracking-widest rounded"
                    >
                      ⚔️ Provoke the Outlaw Cap'n
                    </button>
                  )}


                </div>
              </div>

              {/* Saloon Jobs Bulletin board / Wanted Posters */}
              <div className="bg-[#e8dec7] border border-[#bfae96]/60 p-4 rounded-sm space-y-2 mt-4">
                <h4 className="text-[10px] font-serif font-bold text-[#664d36] uppercase tracking-widest flex items-center gap-1.5 pb-1 border-b border-[#bfae96]/60">
                  <Target size={12} className="text-[#c4451a]" /> Wanted Posters
                  & Town Bounties
                </h4>

                {/* Reputation Blocks */}
                {isLawmenHostile && (
                  <div className="bg-red-950/20 border border-red-900 p-2.5 rounded-sm text-[10px] text-red-500 font-sans">
                    ⚠️ <b>BOUNTIES LOCKED</b>: The local Sheriff will not offer
                    bounties to wanted outlaws. (Need Law Reputation &gt; -15,
                    currently {player.factionReputation?.lawmen ?? 0} Infamy)
                  </div>
                )}

                {isTribesHostile && (
                  <div className="bg-orange-950/20 border border-orange-950 p-2.5 rounded-sm text-[10px] text-orange-400 font-sans mt-2">
                    ⚠️ <b>TRIBAL MISSIONS COLD</b>: Native pathfinders are wary
                    of you and sacred tasks are locked. (Need Tribes standing
                    &gt; -20)
                  </div>
                )}

                {availableMissions.length === 0 ? (
                  <div className="text-[11px] p-6 bg-[#e8dec7] text-[#664d36] italic text-center rounded-sm border border-[#bfae96]/35 font-serif">
                    No active assignments on the board. Ride out to adjacent
                    districts to renew targets.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                    {availableMissions.map((mission) => {
                      const repChangeLabel =
                        mission.reputationChange > 0
                          ? `+${mission.reputationChange} Honor`
                          : `${mission.reputationChange} Infamy`;

                      // Lock check
                      const isLocked =
                        (mission.type === "bounty" && isLawmenHostile) ||
                        (mission.type === "scavenge" && isTribesHostile) ||
                        (mission.type === "escort" && isLawmenHostile);

                      return (
                        <div
                          key={mission.id}
                          className={`p-3 bg-[#dfd4bd] border rounded-sm flex flex-col justify-between sm:flex-row sm:items-center gap-3 transition-all ${isLocked ? "border-red-950/40 opacity-40" : "border-[#bfae96] hover:border-[#8a705a]/50"}`}
                        >
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2">
                              {isLocked ? (
                                <span className="text-red-500 font-serif font-bold text-xs">
                                  [LOCKED] {mission.title}
                                </span>
                              ) : (
                                <span className="text-[#8c6b0c] font-serif font-bold text-xs">
                                  {mission.isStoryline ? (
                                    <span className="text-purple-400 mr-1 animate-pulse">
                                      ✦
                                    </span>
                                  ) : (
                                    ""
                                  )}
                                  {mission.title}
                                </span>
                              )}
                              <span
                                className={`text-[8px] px-1.5 rounded-sm uppercase tracking-wider font-semibold font-serif ${
                                  mission.danger === "low"
                                    ? "bg-[#1a3a4d]/40 text-sky-400 border border-sky-900/40"
                                    : mission.danger === "medium"
                                      ? "bg-[#dfd4bd] text-[#8c6b0c] border border-[#bfae96]"
                                      : mission.danger === "high"
                                        ? "bg-[#2d0a0a] text-[#c4451a] border border-[#4d1a1a]"
                                        : "bg-red-950/80 text-red-400 border border-red-800 animate-pulse"
                                }`}
                              >
                                {mission.danger} risk
                              </span>
                            </div>
                            <p className="text-[10px] text-[#4a3928] leading-normal font-sans">
                              {mission.description}
                            </p>
                          </div>

                          <div className="text-right sm:border-l sm:border-[#bfae96] sm:pl-3 min-w-[130px] space-y-1.5 flex flex-col items-end">
                            <div className="text-right font-mono text-[9px] uppercase tracking-wide leading-tight text-[#664d36]">
                              <div className="text-[#8c6b0c] font-bold">
                                Payout: ${mission.rewardGold}
                              </div>
                              <div className="text-sky-400">
                                XP: +{mission.rewardXp}
                              </div>
                              <div className="text-purple-400 font-bold">
                                {repChangeLabel}
                              </div>
                            </div>

                            {!isLocked ? (
                              <button
                                id={`accept-${mission.id}`}
                                onClick={() => onAcceptMission(mission)}
                                className="w-full py-1 px-2.5 bg-[#3d2d21] hover:bg-[#4d3a2b] text-[#8c6b0c] rounded-sm font-bold uppercase text-[9px] tracking-wider transition-all border-b border-[#1a130f] cursor-pointer font-serif"
                              >
                                Take poster!
                              </button>
                            ) : (
                              <span className="text-[8px] text-red-500 uppercase tracking-widest font-serif">
                                Hostile Alignment
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 1: SALOON (Missions, Drink details) */}
          {activeTab === "saloon" && (
            <div className="space-y-4 flex-1">
              {saloonDuelChallenger && (
                <div className="bg-red-950/20 border border-red-800 p-4 rounded-sm animate-pulse">
                  <h3 className="text-red-500 font-serif font-black uppercase text-sm mb-1">
                    ⚔️ Duel Challenge: {saloonDuelChallenger.name}
                  </h3>
                  <p className="text-red-200/70 text-xs italic mb-4">
                    {saloonDuelChallenger.desc}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        onStartCombat(
                          "duel" as any,
                          saloonDuelChallenger.risk,
                          null,
                          saloonDuelChallenger.provokedNpcId,
                        );
                      }}
                      className="py-2 px-4 bg-red-900 hover:bg-red-700 text-white font-serif tracking-widest text-xs uppercase font-bold rounded shadow-lg active:scale-95"
                    >
                      Accept Duel
                    </button>
                    <button
                      onClick={() => setSaloonDuelChallenger(null)}
                      className="py-2 px-4 bg-transparent border border-red-800 text-red-500 hover:bg-red-950 font-serif tracking-widest text-xs uppercase font-bold rounded"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              )}

              {saloonRandomEvent && (
                <div className="bg-[#dfd4bd]/50 border border-[#bfae96] p-4 rounded-sm shadow-md">
                  <h3 className="text-[#8c6b0c] font-serif font-black uppercase text-sm mb-1">
                    🎭 {saloonRandomEvent.title}
                  </h3>
                  <p className="text-[#4a3928] text-xs italic mb-4">
                    {saloonRandomEvent.description}
                  </p>
                  <div className="flex flex-col gap-2">
                    {saloonRandomEvent.options.map((opt, i) => (
                      <button
                        key={i}
                        onClick={() => handleSaloonEventOption(opt)}
                        className="w-full text-left py-2 px-3 bg-[#e8dec7] hover:bg-[#dcd1b9] border border-[#cfba99] text-[#2d2119] font-serif tracking-wide text-xs font-bold rounded transition-colors"
                      >
                        {opt.text}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {saloonEventResult && (
                <div className="bg-emerald-950/20 border border-emerald-800/50 p-3 rounded-sm shadow-inner fade-in">
                  <p className="text-emerald-800 font-serif text-xs italic">
                    {saloonEventResult}
                  </p>
                  <button
                    onClick={() => setSaloonEventResult(null)}
                    className="mt-2 text-[10px] uppercase tracking-widest font-bold text-emerald-700 hover:text-emerald-900"
                  >
                    [Dismiss]
                  </button>
                </div>
              )}

              {/* NPC dialogue response */}
              <div className="bg-[#e8dec7] border-l-4 border-[#e8b923] p-3 rounded-sm text-xs text-[#2d2119]">
                <span className="font-serif font-bold text-[#8c6b0c] block mb-1">
                  {npcDialogue.speaker}:
                </span>
                <p className="font-sans italic leading-relaxed text-[#4a3928]">
                  {npcDialogue.text}
                </p>
              </div>

              {/* Saloon Barkeep Service */}
              <div className="flex justify-between items-center bg-[#dfd4bd] p-3 rounded-sm border border-[#bfae96] flex-wrap gap-2">
                <div className="space-y-0.5">
                  <span className="font-bold text-white text-xs font-serif tracking-wide block text-[#8c6b0c]">
                    Saloon Barkeep Service
                  </span>
                  <span className="text-[10px] text-[#4a3928] block font-sans">
                    Settle down for cold whiskey and ask about local rumors.
                  </span>
                </div>

                {/* Saloon drink buttons */}
                <div className="flex gap-2 relative">
                  <button
                    disabled={player.gold < 15}
                    onClick={() => {
                      if (player.gold < 15) return;
                      const text = onBuyRumor();
                      setBarkeepDialogue({ speaker: "Saloon Barkeep", text });
                    }}
                    className="py-1.5 px-3 bg-[#e8dec7] hover:bg-[#dcd1b9] rounded-sm font-bold text-[10px] uppercase text-[#664d36] border border-[#bfae96] transition-all flex items-center gap-1 cursor-pointer font-serif tracking-wider focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <HelpCircle size={11} className="text-[#8c6b0c]" /> Buy
                    Drinks for Gossip ($15)
                  </button>

                  <div className="relative">
                    <button
                      onClick={() => setShowDirectionsMenu(!showDirectionsMenu)}
                      className="py-1.5 px-3 bg-[#e8dec7] hover:bg-[#dcd1b9] rounded-sm font-bold text-[10px] uppercase text-[#664d36] border border-[#bfae96] transition-all flex items-center gap-1 cursor-pointer font-serif tracking-wider focus:outline-none"
                    >
                      <MapPin size={11} className="text-[#8c6b0c]" /> Ask for
                      Directions (${directionsCost})
                    </button>

                    {showDirectionsMenu && (
                      <div className="absolute top-full left-0 mt-1 min-w-[200px] w-full bg-[#3d2d21] border border-[#bfae96] rounded-sm shadow-xl z-20 flex flex-col items-stretch overflow-hidden">
                        {player.acceptedQuests &&
                          player.acceptedQuests.length > 0 &&
                          player.acceptedQuests.map((q) => {
                            const tLoc = worldLocations.find(
                              (l) => l.id === q.targetLocationId,
                            );
                            let locName = tLoc ? tLoc.name : "the wilderness";
                            if (q.hiddenTargetHex) locName = "the hideout";

                            return (
                              <button
                                key={q.id}
                                onClick={() => {
                                  let targetX, targetY;
                                  if (q.hiddenTargetHex) {
                                    targetX = q.hiddenTargetHex[0];
                                    targetY = q.hiddenTargetHex[1];
                                  } else if (tLoc) {
                                    targetX = tLoc.x;
                                    targetY = tLoc.y;
                                  }
                                  handleAskDirections(
                                    "quest",
                                    locName,
                                    targetX,
                                    targetY,
                                    q.id,
                                  );
                                }}
                                className="text-left px-3 py-2 border-b border-[#2d2119] text-[9.5px] font-mono text-[#bfae96] hover:bg-[#4d3a2b] hover:text-[#e8b923]"
                              >
                                Where's {locName}?
                              </button>
                            );
                          })}
                        <button
                          onClick={() => handleAskDirections("hostile_camp")}
                          className="text-left px-3 py-2 border-b border-[#2d2119] text-[9.5px] font-mono text-[#bfae96] hover:bg-[#4d3a2b] hover:text-[#e8b923]"
                        >
                          Where's the nearest Bandit Camp?
                        </button>
                        <button
                          onClick={() => handleAskDirections("mine")}
                          className="text-left px-3 py-2 text-[9.5px] font-mono text-[#bfae96] hover:bg-[#4d3a2b] hover:text-[#e8b923]"
                        >
                          Where's the nearest Mine?
                        </button>
                      </div>
                    )}
                  </div>

                  <button
                    id="btn-drink-whiskey"
                    onClick={onDrinkWhiskey}
                    disabled={player.gold < 20}
                    className="py-1.5 px-3 bg-[#3d2d21] hover:bg-[#4d3a2b] rounded-sm font-bold text-[10px] uppercase text-[#8c6b0c] border-b-2 border-[#1a130f] transition-all flex items-center gap-1 disabled:opacity-30 cursor-pointer font-serif tracking-wider focus:outline-none"
                  >
                    <Beer size={11} className="text-[#8c6b0c]" /> Rest ($20)
                  </button>
                </div>
              </div>

              {/* === APPLIED FIX: PLAYER PERKS === */}
              {pendingPerksCount > 0 && (
                <div className="bg-[#412711] border border-[#a26829] p-3 rounded-sm flex flex-col gap-2">
                  <h4 className="text-[11px] font-bold text-[#e8b923] uppercase tracking-wider font-serif">
                    🌟 Level Up! Select a Pending Trait ({pendingPerksCount}{" "}
                    left)
                  </h4>
                  <div className="flex flex-col gap-3">
                    {["Gunslinger", "Survivalist", "Renegade"].map(
                      (treeName) => {
                        const treePerks = availablePerksSelect.filter(
                          (p) => p.tree === treeName,
                        );
                        if (treePerks.length === 0) return null;
                        return (
                          <div key={treeName}>
                            <h5 className="text-[10px] text-[#a89073] uppercase tracking-widest font-bold mb-1 border-b border-[#a89073]/30 pb-0.5">
                              {treeName} Path
                            </h5>
                            <div className="flex flex-wrap gap-2">
                              {treePerks.map((perk) => (
                                <button
                                  key={perk.id}
                                  onClick={() => onSelectPerk(perk.id)}
                                  className="flex flex-col bg-[#2d1b0a] hover:bg-[#523315] border border-[#a26829] p-2 rounded-sm cursor-pointer text-left focus:outline-none transition-colors w-full sm:w-[calc(50%-0.25rem)]"
                                >
                                  <span className="font-bold text-[#e8dec7] text-[10px] uppercase tracking-wider">
                                    +{perk.name}
                                  </span>
                                  <span className="text-[#a89073] text-[9px] mt-0.5">
                                    {perk.desc}
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      },
                    )}
                  </div>
                </div>
              )}

              {/* Saloon Guns for Hire / Posse Recruitment Desk */}
              <div
                id="militia-hiring-panel"
                className="bg-[#140f13] border border-purple-950/40 p-4 rounded-sm space-y-3.5 shadow-md"
              >
                <div className="flex items-center justify-between border-b border-purple-950/30 pb-2">
                  <div className="flex items-center gap-1.5">
                    <Users size={14} className="text-[#a78bfa]" />
                    <h4 className="text-[12px] font-serif font-bold text-[#c084fc] uppercase tracking-wider">
                      Saloon Guns-For-Hire Bulletin (Militia Board)
                    </h4>
                  </div>
                  <span className="text-[9px] font-mono text-[#5a4838] uppercase">
                    Posse size: {player.posse ? player.posse.length : 0} / 5
                  </span>
                </div>

                <p className="text-[10.5px] text-[#5a4838] font-sans leading-relaxed">
                  Enlist armed company to protect you on the hazardous badlands
                  trails. Hired hands fight with you in combat and consume gold
                  per turn. Costs decrease as your level increases.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
                  {(() => {
                    const availableMercIndex =
                      Math.abs(
                        (location.name || "").charCodeAt(0) +
                          location.x +
                          location.y,
                      ) % MERCENARY_POOL.length;
                    const availableMercs = [MERCENARY_POOL[availableMercIndex]];

                    return availableMercs.map((merc) => {
                      const levelRatio = Math.max(
                        0,
                        Math.min(1, (80 - player.level) / 79),
                      );
                      const dynamicSignupCost = Math.floor(
                        50 + 950 * levelRatio,
                      );

                      const isEnlisted =
                        player.posse &&
                        player.posse.some((p) => p.id === merc.id);
                      const canAfford = player.gold >= dynamicSignupCost;
                      const isFull = player.posse && player.posse.length >= 5;
                      const playerAlignment =
                        player.reputation >= 20
                          ? "lawful"
                          : player.reputation <= -20
                            ? "outlaw"
                            : "neutral";
                      const isAlignmentMismatch =
                        (playerAlignment === "lawful" &&
                          merc.alignment === "outlaw") ||
                        (playerAlignment === "outlaw" &&
                          merc.alignment === "lawful");
                      const canHire =
                        !isEnlisted &&
                        !isFull &&
                        canAfford &&
                        !isAlignmentMismatch;

                      return (
                        <div
                          key={merc.id}
                          className={`p-3 rounded-sm border transition-all col-span-1 md:col-span-2 ${
                            isEnlisted
                              ? "bg-purple-950/15 border-[#a78bfa]/30 opacity-90"
                              : "bg-[#1b151e]/55 border-[#3d2d3d] hover:border-[#a78bfa]/30"
                          }`}
                        >
                          <div className="flex justify-between items-start gap-1">
                            <div className="flex items-start gap-2 min-w-0">
                              <span className="text-xl shrink-0">
                                {merc.portrait}
                              </span>
                              <div className="min-w-0">
                                <span className="font-serif font-bold text-[#ae8fdb] text-[12px] block truncate">
                                  {merc.name}
                                </span>
                                <span className="text-[9px] text-[#5a4838] block pt-0.5">
                                  Role:{" "}
                                  <b className="text-purple-300 font-normal">
                                    {merc.role}
                                  </b>
                                </span>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <span className="text-xs font-serif font-black text-[#8c6b0c] block">
                                ${dynamicSignupCost}
                              </span>
                              <span className="text-[8px] text-[#5a4838] uppercase tracking-wider block">
                                Upfront Fee
                              </span>
                            </div>
                          </div>

                          {/* Stats bullet list */}
                          <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#100b12] rounded mt-2 text-center text-[10px] font-mono border border-purple-950/20 text-[#c084fc]">
                            <div>
                              <span className="block text-[8px] text-[#5a4838] uppercase font-sans">
                                Max HP
                              </span>
                              <b>{merc.maxHp}</b>
                            </div>
                            <div>
                              <span className="block text-[8px] text-[#5a4838] uppercase font-sans">
                                Attack
                              </span>
                              <b>{merc.dmg} DMG</b>
                            </div>
                            <div>
                              <span className="block text-[8px] text-[#5a4838] uppercase font-sans">
                                Range
                              </span>
                              <b>{merc.range} tiles</b>
                            </div>
                          </div>

                          {/* Costs per step info */}
                          <p className="text-[9px] text-[#4a3928] mt-1.5 leading-tight font-sans">
                            Upkeep Cost per Step: 🪙 {merc.dailyRateGold}g
                            &nbsp;|&nbsp; Alignment:{" "}
                            <span className="uppercase">{merc.alignment}</span>{" "}
                            &nbsp;|&nbsp; Trait:{" "}
                            <span className="uppercase text-[#8c6b0c]">
                              {merc.trait}
                            </span>
                          </p>
                          <p className="text-[9.5px] italic text-[#d8b4fe]/60 mt-1 leading-snug font-serif">
                            "{merc.description} {merc.backstory}"
                          </p>

                          <button
                            id={`btn-hire-${merc.id}`}
                            disabled={!canHire}
                            onClick={() => {
                              if (!canHire) return;

                              onUpdatePlayer((prev) => {
                                const updatedPosse = [...(prev.posse || [])];
                                if (updatedPosse.some((p) => p.id === merc.id))
                                  return prev;

                                const newMember: PosseMember = {
                                  id: merc.id,
                                  name: merc.name,
                                  role: merc.role,
                                  hp: merc.hp,
                                  maxHp: merc.maxHp,
                                  dmg: merc.dmg,
                                  range: merc.range,
                                  dailyRateGold: merc.dailyRateGold,
                                  portrait: merc.portrait,
                                  description: merc.description,
                                  backstory: merc.backstory,
                                  trait: merc.trait,
                                  morale: merc.morale,
                                };
                                updatedPosse.push(newMember);

                                return {
                                  ...prev,
                                  gold: prev.gold - dynamicSignupCost,
                                  posse: updatedPosse,
                                };
                              });

                              addLogMessage(
                                `🤠 RECRUITED: ${player.name} hired "${merc.name}" into his protecting posse to secure the Arizona outposts!`,
                                "loot",
                              );
                            }}
                            className={`w-full mt-3 py-1.5 px-3 rounded-sm font-serif font-bold text-[10px] uppercase tracking-wider cursor-pointer border transition-colors ${
                              isEnlisted
                                ? "bg-purple-950/40 text-[#c084fc] border-[#a78bfa]/20 cursor-default"
                                : isAlignmentMismatch
                                  ? "bg-red-950/40 border-red-900 text-red-500 cursor-not-allowed"
                                  : isFull
                                    ? "bg-[#d4cbba] border-stone-800 text-stone-600 cursor-not-allowed"
                                    : !canAfford
                                      ? "bg-[#d4cbba] border-stone-800 text-[#5a4838] cursor-not-allowed"
                                      : "bg-[#2e1d3d] border-[#ae8fdb]/40 text-[#d8b4fe] hover:bg-[#3f2554] hover:border-[#ae8fdb]"
                            }`}
                          >
                            {isEnlisted
                              ? "🛡️ Currently Hired"
                              : isAlignmentMismatch
                                ? "Refuses Your Alignment"
                                : isFull
                                  ? "🚫 Posse At Max Cap (5)"
                                  : !canAfford
                                    ? `❌ Lacks Gold (Need $${dynamicSignupCost})`
                                    : `🤝 Hire Companion ($${dynamicSignupCost})`}
                          </button>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: GENERAL STORE MERCHANT */}
          {activeTab === "general" && (
            <div className="space-y-4 flex-1">
              <div className="bg-[#dfd4bd] p-3 rounded-sm border border-[#bfae96] flex justify-between items-center flex-wrap gap-2 text-xs">
                <div className="space-y-0.5">
                  <span className="text-white font-serif font-bold block">
                    Arid Frontier Supply Yard
                  </span>
                  <span className="text-[10px] text-[#4a3928] font-sans">
                    Stock cartridge reserves, canteen storage, and crafting
                    gears.
                  </span>
                </div>

                <div className="flex gap-2">
                  <span className="bg-[#e8dec7] text-[#2d2119] text-[10px] py-1 px-2 rounded-sm border border-[#bfae96] font-bold font-serif uppercase">
                    Rep multiplier:{" "}
                    <b
                      className={
                        repValue >= 0 ? "text-green-400" : "text-rose-400"
                      }
                    >
                      {costMultiplier.toFixed(2)}x
                    </b>
                  </span>
                </div>
              </div>

              {/* Sell Mount */}
              {player.hasHorse && player.mount && onSellMount && (
                <div className="bg-[#e8dec7] border border-[#bfae96] p-3 rounded-sm space-y-2">
                  <span className="text-[9px] text-[#8c6b0c] font-serif font-bold block uppercase tracking-wide">
                    Livery Stables
                  </span>
                  <div className="flex justify-between items-center text-xs bg-[#dfd4bd] px-3 py-1.5 rounded-sm border border-[#bfae96]/60">
                    <span className="text-[#3d2d21] font-bold font-serif">
                      {player.mount.name} ({player.mount.type.replace("_", " ")}
                      )
                    </span>
                    <button
                      onClick={onSellMount}
                      className="bg-[#3d2d21] hover:bg-[#4d3a2b] text-[#8c6b0c] border-b border-[#1a130f] py-0.5 px-2 rounded-sm font-bold uppercase text-[9px] tracking-wider cursor-pointer font-serif focus:outline-none"
                    >
                      Sell Mount (${" "}
                      {Math.floor(
                        (player.mount.type === "donkey"
                          ? 150
                          : player.mount.type === "mule"
                            ? 350
                            : player.mount.type === "regular_horse"
                              ? 750
                              : player.mount.type === "post_horse"
                                ? 1400
                                : player.mount.type === "thoroughbred"
                                  ? 2800
                                  : 250) * 0.5,
                      )}
                      )
                    </button>
                  </div>
                </div>
              )}

              {/* Sell List (Ancient Relics, Valuables in inventory) */}
              {player.inventory.some((item) => item.type === "value") && (
                <div className="bg-[#e8dec7] border border-[#bfae96] p-3 rounded-sm space-y-2">
                  <span className="text-[9px] text-[#8c6b0c] font-serif font-bold block uppercase tracking-wide">
                    Pouch Valuables / Relics:
                  </span>
                  <div className="grid grid-cols-1 gap-1.5">
                    {player.inventory
                      .filter((it) => it.type === "value")
                      .map((val) => {
                        const sellPrice = val.value;
                        return (
                          <div
                            key={val.id}
                            className="flex justify-between items-center text-xs bg-[#dfd4bd] px-3 py-1.5 rounded-sm border border-[#bfae96]/60"
                          >
                            <span className="text-[#3d2d21] font-bold font-serif">
                              {val.name} ({val.count}x)
                            </span>
                            <button
                              id={`sell-${val.id}`}
                              onClick={() => onSellItem(val.id, sellPrice)}
                              className="bg-[#3d2d21] hover:bg-[#4d3a2b] text-[#8c6b0c] border-b border-[#1a130f] py-0.5 px-2 rounded-sm font-bold uppercase text-[9px] tracking-wider cursor-pointer font-serif focus:outline-none"
                            >
                              Barter for ${sellPrice} Gold each
                            </button>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Dynamic Merchant Items with modified pricing */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[180px] overflow-y-auto pr-1">
                {(() => {
                  let rawItems = [...location.shop];
                  if (player.ammoScarcity) {
                    rawItems = rawItems.map((item) => {
                      if (item.id === "ammo_pistol") {
                        return {
                          ...item,
                          id: "ammo_45_colt",
                          name: "Box of .45 Colt (Revolver)",
                          cost: 15,
                          details: "Standard revolver caliber cartridges. Adds 12 shots. (Weight: 1 lb)",
                        };
                      }
                      if (item.id === "ammo_rifle") {
                        return {
                          ...item,
                          id: "ammo_44_40_winchester",
                          name: "Box of .44-40 Winchester (Rifle)",
                          cost: 25,
                          details: "Winchester caliber rifle cartridges. Adds 10 shots. (Weight: 2 lbs)",
                        };
                      }
                      if (item.id === "ammo_shotgun") {
                        return {
                          ...item,
                          id: "ammo_12_gauge",
                          name: "Box of 12 Gauge Shells (Shotgun)",
                          cost: 30,
                          details: "12 Gauge shotgun shells. Adds 8 shots. (Weight: 2 lbs)",
                        };
                      }
                      return item;
                    });
                  }

                  const filtered = rawItems
                    .filter((item) => {
                      // If town is abandoned, hide high tier weapons
                      if (
                        item.type === "weapon" &&
                        item.cost > 150 &&
                        location.prosperity !== undefined &&
                        location.prosperity < 30
                      )
                        return false;
                      return true;
                    })
                    .concat(
                      location.prosperity && location.prosperity >= 80
                        ? [
                            {
                              id: "wep_prosperous_rifle",
                              name: "Gilded Buffalo Rifle",
                              type: "weapon",
                              cost: 600,
                              details:
                                "Boom town exclusive. Devastating power and extreme range.",
                              weaponStats: { dmg: 65, range: 9, maxClip: 5 },
                            },
                            {
                              id: "item_prosperous_medkit",
                              name: "Premium Medical Kit",
                              type: "consumable",
                              cost: 100,
                              details:
                                "Restores 100 HP. Imported goods from back East.",
                            },
                          ]
                        : [],
                    );

                  return filtered.map((item) => {
                    const finalCost = Math.round(item.cost * costMultiplier);
                    
                    // Determine if caliber ammo is out of stock in this specific location
                    const isCaliber = item.id === "ammo_45_colt" || item.id === "ammo_44_40_winchester" || item.id === "ammo_12_gauge";
                    const isOutOfStock = player.ammoScarcity && isCaliber && (() => {
                      const str = location.id + item.id;
                      let hash = 0;
                      for (let i = 0; i < str.length; i++) {
                        hash = str.charCodeAt(i) + ((hash << 5) - hash);
                      }
                      return Math.abs(hash) % 10 < 3; // 30% chance out of stock
                    })();

                    const canBuy = player.gold >= finalCost && !isOutOfStock;

                    return (
                      <div
                        key={item.id}
                        className={`p-3 border rounded-sm flex items-center justify-between gap-3 hover:border-[#8a705a]/50 transition-all ${isOutOfStock ? "bg-[#d4cbbaba] border-[#c4451a]/30 opacity-75" : "bg-[#dfd4bd] border-[#bfae96]"}`}
                      >
                        <div className="space-y-1 min-w-0">
                          <span className={`font-serif font-bold block text-xs truncate ${isOutOfStock ? "text-[#c4451a]" : "text-[#8c6b0c]"}`}>
                            {item.name}
                            {isOutOfStock && <span className="ml-1.5 text-[8px] px-1 bg-[#c4451a] text-white rounded font-sans uppercase">Out of Stock</span>}
                          </span>
                          <span className="text-[10px] text-[#4a3928] block font-sans leading-relaxed truncate">
                            {item.details}
                          </span>
                        </div>

                        <div className="text-right flex-shrink-0">
                          {isOutOfStock ? (
                            <span className="text-[#c4451a] font-bold block text-xs font-mono">
                              SOLD OUT
                            </span>
                          ) : (
                            <span className="text-[#8c6b0c] font-bold block text-xs font-mono">
                              ${finalCost}{" "}
                              {costMultiplier !== 1.0 && (
                                <span
                                  className={`text-[8px] font-mono ${costMultiplier < 1.0 ? "text-green-500" : "text-red-400"}`}
                                >
                                  ({costMultiplier < 1.0 ? "Discount" : "Markup"})
                                </span>
                              )}
                            </span>
                          )}
                          <button
                            id={`buy-${item.id}`}
                            onClick={() => {
                              onBuyItem({ ...item, cost: finalCost });
                            }}
                            disabled={!canBuy}
                            className={`mt-1.5 py-1 px-2.5 rounded-sm font-bold uppercase text-[9px] tracking-wider border-0 font-serif ${
                              canBuy
                                ? "bg-[#3d2d21] hover:bg-[#4d3a2b] text-[#8c6b0c] border-b-2 border-[#1a130f] cursor-pointer"
                                : "bg-[#dcd1b9] text-[#664d36] cursor-not-allowed opacity-30 shadow-none"
                            }`}
                          >
                            {isOutOfStock ? "Unavailable" : "Buy Item"}
                          </button>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          )}

          {/* TAB: TRADING DEPOT */}
          {activeTab === "trading" && (
            <div className="space-y-4 flex-1">
              <div className="bg-[#dfd4bd] p-3 rounded-sm border border-[#bfae96] flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <span className="text-white font-serif font-bold block flex items-center gap-1">
                    <Package size={12} /> Frontier Trading Company
                  </span>
                  <span className="text-[10px] text-[#4a3928] font-sans block max-w-xs leading-loose">
                    Buy low, transport, and sell high across the wastes. Prices
                    fluctuate by town prosperity.
                  </span>
                </div>
                <div className="text-right">
                  <span className="bg-[#e8dec7] px-2 py-0.5 border border-[#bfae96]/60 rounded-sm font-bold font-serif shadow-inner block mb-1">
                    Capacity:{" "}
                    <span
                      className={
                        currentWeight >= maxCapacity
                          ? "text-red-500"
                          : "text-[#3d2d21]"
                      }
                    >
                      {currentWeight}
                    </span>{" "}
                    / {maxCapacity} lbs
                  </span>
                  <span className="text-[9px] uppercase tracking-wider font-bold text-[#8c6b0c] block">
                    Transport:{" "}
                    {player.activeCarriage
                      ? CARRIAGES[player.activeCarriage.type].name
                      : player.hasHorse
                        ? "Saddlebags"
                        : "On Foot"}
                  </span>
                </div>
              </div>

              {/* Carriage Purchasing */}
              {location.economyProfile &&
                location.economyProfile.availableCarriageForSale &&
                (!player.activeCarriage ||
                  player.activeCarriage.type !==
                    location.economyProfile.availableCarriageForSale) && (
                  <div className="bg-[#e8dec7] border border-[#bfae96] p-3 rounded-sm flex justify-between items-center bg-gradient-to-r from-[#e8dec7] to-[#dfd4bd]">
                    <div>
                      <span className="text-[10px] text-[#8c6b0c] font-serif font-bold block uppercase tracking-wide">
                        Available Transport Upgrade
                      </span>
                      <span className="font-bold text-[#3d2d21] block">
                        {
                          CARRIAGES[
                            location.economyProfile.availableCarriageForSale
                          ].name
                        }
                      </span>
                      <span className="text-[9px] text-[#4a3928]">
                        Requires{" "}
                        {
                          CARRIAGES[
                            location.economyProfile.availableCarriageForSale
                          ].reqCount
                        }{" "}
                        {
                          CARRIAGES[
                            location.economyProfile.availableCarriageForSale
                          ].requiredMount
                        }
                        . Max wt:{" "}
                        {
                          CARRIAGES[
                            location.economyProfile.availableCarriageForSale
                          ].maxWeight
                        }
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[#8c6b0c] font-bold block text-xs font-mono mb-1">
                        $
                        {
                          CARRIAGES[
                            location.economyProfile.availableCarriageForSale
                          ].price
                        }
                      </span>
                      <button
                        onClick={() => {
                          if (onBuyCarriage && location.economyProfile)
                            onBuyCarriage(
                              location.economyProfile.availableCarriageForSale!,
                              CARRIAGES[
                                location.economyProfile
                                  .availableCarriageForSale!
                              ].price,
                            );
                        }}
                        disabled={
                          player.gold <
                            CARRIAGES[
                              location.economyProfile.availableCarriageForSale
                            ].price ||
                          (player.ownedMounts || []).filter(
                            (m) =>
                              CARRIAGES[
                                location.economyProfile!
                                  .availableCarriageForSale!
                              ].requiredMount === m.type ||
                              (CARRIAGES[
                                location.economyProfile!
                                  .availableCarriageForSale!
                              ].requiredMount === "regular_horse" &&
                                (m.type === "regular_horse" ||
                                  m.type === "post_horse" ||
                                  m.type === "thoroughbred")),
                          ).length <
                            CARRIAGES[
                              location.economyProfile.availableCarriageForSale
                            ].reqCount
                        }
                        className={`py-0.5 px-2 rounded-sm font-bold uppercase text-[9px] tracking-wider font-serif ${player.gold < CARRIAGES[location.economyProfile.availableCarriageForSale].price || (player.ownedMounts || []).filter((m) => CARRIAGES[location.economyProfile!.availableCarriageForSale!].requiredMount === m.type || (CARRIAGES[location.economyProfile!.availableCarriageForSale!].requiredMount === "regular_horse" && (m.type === "regular_horse" || m.type === "post_horse" || m.type === "thoroughbred"))).length < CARRIAGES[location.economyProfile.availableCarriageForSale].reqCount ? "bg-[#dcd1b9] text-[#664d36] cursor-not-allowed opacity-30 shadow-none border-0" : "bg-[#3d2d21] hover:bg-[#4d3a2b] text-[#8c6b0c] cursor-pointer border-b-2 border-[#1a130f]"}`}
                      >
                        Acquire
                      </button>
                    </div>
                  </div>
                )}

              {/* Trade Goods List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pr-1">
                {TRADE_GOODS.map((good) => {
                  const finalPrice = calculateLocalPrice(
                    good.id,
                    good.basePrice,
                    location,
                    player,
                    false,
                  );
                  const playerOwnedObj = player.tradeInventory?.find(
                    (i) => i.itemId === good.id,
                  );
                  const playerOwnedCount = playerOwnedObj
                    ? playerOwnedObj.quantity
                    : 0;
                  const townStock =
                    location.economyProfile?.localInventory[good.id] || 0;

                  // For buy button, just check if town has any stock and if we can buy at least 1
                  const canBuy =
                    townStock > 0 &&
                    player.gold >= finalPrice &&
                    currentWeight + good.weight <= maxCapacity;

                  return (
                    <div
                      key={good.id}
                      className="p-3 bg-[#dfd4bd] border border-[#bfae96] rounded-sm flex flex-col justify-between gap-2"
                    >
                      <div className="space-y-0.5">
                        <span
                          className="text-[#8c6b0c] font-serif font-bold text-[11px] leading-tight block truncate"
                          title={good.name}
                        >
                          {good.name}
                        </span>
                        <div className="flex justify-between items-center text-[9px]">
                          <span className="text-[#5a4838]">
                            {good.weight} lbs/ea •{" "}
                            <span className="capitalize">{good.tier}</span>
                          </span>
                          <span className="text-[#8c6b0c] font-bold font-mono">
                            ${finalPrice}
                          </span>
                        </div>
                      </div>

                      <div className="text-[10px] space-y-1 mb-1 bg-[#e8dec7] p-1.5 rounded-sm border border-[#bfae96]/30">
                        <div className="flex justify-between">
                          <span className="text-[#4a3928]">Town Stock:</span>
                          <span className="font-bold text-[#3d2d21]">
                            {townStock}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#4a3928]">Your Cargo:</span>
                          <span
                            className={`font-bold ${playerOwnedCount > 0 ? "text-green-700" : "text-[#3d2d21]"}`}
                          >
                            {playerOwnedCount}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-1 mt-auto">
                        <button
                          onClick={() => {
                            setTradeModal({ action: "sell", goodId: good.id });
                            setTradeInputQty("1");
                          }}
                          disabled={playerOwnedCount <= 0}
                          className={`py-1 px-2 rounded-sm font-bold uppercase text-[9px] font-serif ${playerOwnedCount > 0 ? "bg-[#e8dec7] text-[#3d2d21] border border-[#bfae96] hover:bg-[#dcd1b9]" : "bg-[#dcd1b9] text-[#bfae96] border border-transparent shadow-none"}`}
                        >
                          Sell
                        </button>
                        <button
                          onClick={() => {
                            setTradeModal({ action: "buy", goodId: good.id });
                            setTradeInputQty("1");
                          }}
                          disabled={!canBuy}
                          className={`py-1 px-2 rounded-sm font-bold uppercase text-[9px] font-serif ${canBuy ? "bg-[#3d2d21] text-[#8c6b0c] hover:bg-[#4d3a2b]" : "bg-[#dcd1b9] text-[#bfae96] border border-transparent shadow-none"}`}
                        >
                          Buy
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: GUNSMITH CRAFTING YARD */}
          {activeTab === "crafting" && (
            <div className="space-y-4 flex-1">
              <div className="bg-[#dfd4bd] p-3 rounded-sm border border-[#bfae96] flex justify-between items-center">
                <div className="space-y-0.5">
                  <span className="text-white font-serif font-bold block text-xs flex items-center gap-1.5">
                    <Hammer size={12} className="text-[#8c6b0c]" /> Frontier
                    Gunsmith Forge
                  </span>
                  <span className="text-[10px] text-[#4a3928] block font-sans">
                    Use salvage debris and powder triggers to weld custom gun
                    improvements.
                  </span>
                </div>

                {/* Available Materials Counter */}
                <div className="flex gap-1.5 font-mono text-[9px] text-[#2d2119]">
                  <span className="bg-[#e8dec7] px-2 py-0.5 border border-[#bfae96] rounded">
                    Powder: <b className="text-red-400">{gunpowderCount}</b>
                  </span>
                  <span className="bg-[#e8dec7] px-2 py-0.5 border border-[#bfae96] rounded">
                    Lens: <b className="text-[#2a8ec4]">{glassScopeCount}</b>
                  </span>
                  <span className="bg-[#e8dec7] px-2 py-0.5 border border-[#bfae96] rounded">
                    Spring: <b className="text-teal-400">{safeSpringsCount}</b>
                  </span>
                </div>
              </div>

              {/* Crafting Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-h-[220px] overflow-y-auto pr-1 text-xs">
                {/* 1. Heavy Barrel Upgrade */}
                <div className="p-3 bg-[#e8dec7] border border-[#bfae96] hover:border-[#8a705a]/40 rounded-sm flex flex-col justify-between space-y-2">
                  <div className="space-y-1">
                    <span className="text-[#8c6b0c] font-serif font-bold block">
                      Heavy Steel Barrel
                    </span>
                    <p className="text-[10px] text-[#5a4838] font-sans">
                      Welds thick steel to reinforce gas load. Permanently adds{" "}
                      <b className="text-red-400 font-normal">
                        +8 Sidearm Damage
                      </b>
                      . (Weighs +1.5 lbs)
                    </p>
                    <div className="text-[9px] text-[#4a3928] font-mono flex gap-1">
                      <span>Requires:</span>
                      <span
                        className={
                          gunpowderCount >= getRequiredMaterialCount(5)
                            ? "text-green-400"
                            : "text-red-400"
                        }
                      >
                        {getRequiredMaterialCount(5)}x Powder ({gunpowderCount}/{getRequiredMaterialCount(5)})
                      </span>
                    </div>
                  </div>
                  <button
                    id="craft-upgrade-barrel"
                    onClick={() => handleCraftUpgrade("barrel")}
                    disabled={!canCraftUpgrade("barrel")}
                    className={`w-full py-1 text-center font-bold uppercase text-[9px] tracking-wider rounded font-serif ${canCraftUpgrade("barrel") ? "bg-[#3d2d21] hover:bg-[#4d3a2b] text-[#8c6b0c] cursor-pointer" : "bg-stone-950 text-stone-600 cursor-not-allowed"}`}
                  >
                    Forge Barrel
                  </button>
                </div>

                {/* 2. Optical Glass Scope */}
                <div className="p-3 bg-[#e8dec7] border border-[#bfae96] hover:border-[#8a705a]/40 rounded-sm flex flex-col justify-between space-y-2">
                  <div className="space-y-1">
                    <span className="text-[#8c6b0c] font-serif font-bold block">
                      Long Optical Scope
                    </span>
                    <p className="text-[10px] text-[#5a4838] font-sans">
                      Mounts polished magnifying lenses. Crucial precision
                      aiming:{" "}
                      <b className="text-[#2a8ec4] font-normal">
                        +3 Block Range & +30% Combat Accuracy
                      </b>
                      , but{" "}
                      <b className="text-red-400 font-normal">
                        makes weapon turn shot cost 2 AP
                      </b>
                      .
                    </p>
                    <div className="text-[9px] text-[#4a3928] font-mono flex gap-1">
                      <span>Requires:</span>
                      <span
                        className={
                          glassScopeCount >= getRequiredMaterialCount(3)
                            ? "text-green-400"
                            : "text-red-400"
                        }
                      >
                        {getRequiredMaterialCount(3)}x Lens ({glassScopeCount}/{getRequiredMaterialCount(3)})
                      </span>
                    </div>
                  </div>
                  <button
                    id="craft-upgrade-scope"
                    onClick={() => handleCraftUpgrade("scope")}
                    disabled={!canCraftUpgrade("scope")}
                    className={`w-full py-1 text-center font-bold uppercase text-[9px] tracking-wider rounded font-serif ${canCraftUpgrade("scope") ? "bg-[#3d2d21] hover:bg-[#4d3a2b] text-[#8c6b0c] cursor-pointer" : "bg-stone-950 text-stone-600 cursor-not-allowed"}`}
                  >
                    Mount Scope
                  </button>
                </div>

                {/* 3. Extended Cylinder Drum */}
                <div className="p-3 bg-[#e8dec7] border border-[#bfae96] hover:border-[#8a705a]/40 rounded-sm flex flex-col justify-between space-y-2">
                  <div className="space-y-1">
                    <span className="text-[#8c6b0c] font-serif font-bold block">
                      Extended Drum Cylinder
                    </span>
                    <p className="text-[10px] text-[#5a4838] font-sans">
                      Integrates deeper wound cylinder coils. Permanently
                      increases cylinder capacity limit by{" "}
                      <b className="text-[#8c6b0c] font-normal">
                        +4 Max Cartridge Clip
                      </b>
                      .
                    </p>
                    <div className="text-[9px] text-[#4a3928] font-mono flex gap-1">
                      <span>Requires:</span>
                      <span
                        className={
                          safeSpringsCount >= getRequiredMaterialCount(3)
                            ? "text-green-400"
                            : "text-red-400"
                        }
                      >
                        {getRequiredMaterialCount(3)}x Spring ({safeSpringsCount}/{getRequiredMaterialCount(3)})
                      </span>
                    </div>
                  </div>
                  <button
                    id="craft-upgrade-clip"
                    onClick={() => handleCraftUpgrade("clip")}
                    disabled={!canCraftUpgrade("clip")}
                    className={`w-full py-1 text-center font-bold uppercase text-[9px] tracking-wider rounded font-serif ${canCraftUpgrade("clip") ? "bg-[#3d2d21] hover:bg-[#4d3a2b] text-[#8c6b0c] cursor-pointer" : "bg-stone-950 text-stone-600 cursor-not-allowed"}`}
                  >
                    Enlarge Cylinder
                  </button>
                </div>

                {/* 4. Coiled Hair Trigger */}
                <div className="p-3 bg-[#e8dec7] border border-[#bfae96] hover:border-[#8a705a]/40 rounded-sm flex flex-col justify-between space-y-2">
                  <div className="space-y-1">
                    <span className="text-[#8c6b0c] font-serif font-bold block">
                      Campfire Rifling Bore
                    </span>
                    <p className="text-[10px] text-[#5a4838] font-sans">
                      Grooves inside the barrel core to stabilize spin.
                      Permanently increases base hit rate and criticals by{" "}
                      <b className="text-teal-400 font-normal">+15% Accuracy</b>
                      .
                    </p>
                    <div className="text-[9px] text-[#4a3928] font-mono flex gap-1">
                      <span>Requires:</span>
                      <span
                        className={
                          safeSpringsCount >= getRequiredMaterialCount(4)
                            ? "text-green-400"
                            : "text-red-400"
                        }
                      >
                        {getRequiredMaterialCount(4)}x Spring ({safeSpringsCount}/{getRequiredMaterialCount(4)})
                      </span>
                    </div>
                  </div>
                  <button
                    id="craft-upgrade-rifling"
                    onClick={() => handleCraftUpgrade("rifling")}
                    disabled={!canCraftUpgrade("rifling")}
                    className={`w-full py-1 text-center font-bold uppercase text-[9px] tracking-wider rounded font-serif ${canCraftUpgrade("rifling") ? "bg-[#3d2d21] hover:bg-[#4d3a2b] text-[#8c6b0c] cursor-pointer" : "bg-stone-950 text-stone-600 cursor-not-allowed"}`}
                  >
                    Bore Rifling
                  </button>
                </div>

                {/* 5. Craft Sawed-Off Shotgun (WEAPON ARMS) */}
                <div className="p-3 bg-rose-950/15 border border-red-950 hover:border-red-900 rounded-sm flex flex-col justify-between space-y-2 col-span-1 sm:col-span-2">
                  <div className="flex justify-between items-start flex-wrap gap-2">
                    <div className="space-y-1 flex-1">
                      <span className="text-rose-400 font-serif font-bold flex items-center gap-1">
                        <Flame size={12} /> Craft New Weapon: Sawed-Off Shotgun
                      </span>
                      <p className="text-[10px] text-[#5a4838] font-sans">
                        Pulls a short wide steel muzzle.{" "}
                        <b>Special Property (SPLASH IMPACT / ENEMY SPRAY)</b>:
                        Shoots a wide 3-cell cone. Deals massive <b>35 Dmg</b>{" "}
                        at close 3 Range. Can target and{" "}
                        <b>disintegrate cacti and wood crates/barrels</b> in
                        tactical combat. Packs into saddlebags (Weighs 10.0
                        lbs).
                      </p>
                      <div className="text-[9px] text-[#4a3928] font-mono flex gap-2">
                        <span>Requires:</span>
                        <span
                          className={
                            gunpowderCount >= getRequiredMaterialCount(5)
                              ? "text-green-400"
                              : "text-red-400"
                          }
                        >
                          {getRequiredMaterialCount(5)}x Powder Jar ({gunpowderCount}/{getRequiredMaterialCount(5)})
                        </span>
                      </div>
                    </div>
                    <button
                      id="craft-weapon-shotgun"
                      onClick={() => handleCraftWeapon("shotgun")}
                      disabled={!canCraftWeapon("shotgun")}
                      className={`py-2 px-4 rounded text-xs tracking-wider uppercase font-bold font-serif ${canCraftWeapon("shotgun") ? "bg-red-700 hover:bg-red-650 text-white cursor-pointer" : "bg-stone-950 text-stone-600 cursor-not-allowed"}`}
                    >
                      Forge Shotgun
                    </button>
                  </div>
                </div>

                {/* 6. Craft Winchester Carbine Rifle */}
                <div className="p-3 bg-sky-950/15 border border-sky-950 hover:border-sky-900 rounded-sm flex flex-col justify-between space-y-2 col-span-1 sm:col-span-2">
                  <div className="flex justify-between items-start flex-wrap gap-2">
                    <div className="space-y-1 flex-1">
                      <span className="text-sky-400 font-serif font-bold flex items-center gap-1">
                        <Award size={12} className="text-[#2a8ec4]" /> Craft New
                        Weapon: Winchester Repeat Carbine Rifle
                      </span>
                      <p className="text-[10px] text-[#5a4838] font-sans">
                        Fleshes out a seamless repeating lever configuration.
                        Superb sniper tool:{" "}
                        <b>28 Dmg with whopping 8 Tiles Range</b> and 6 Cap
                        magazine. Packs into saddlebags (Weighs 12.0 lbs).
                      </p>
                      <div className="text-[9px] text-[#4a3928] font-mono flex gap-2">
                        <span>Requires:</span>
                        <span
                          className={
                            gunpowderCount >= getRequiredMaterialCount(6)
                              ? "text-green-400"
                              : "text-red-400"
                          }
                        >
                          {getRequiredMaterialCount(6)}x Powder Jar ({gunpowderCount}/{getRequiredMaterialCount(6)})
                        </span>{" "}
                        •
                        <span
                          className={
                            safeSpringsCount >= getRequiredMaterialCount(4)
                              ? "text-green-400"
                              : "text-red-400"
                          }
                        >
                          {getRequiredMaterialCount(4)}x Steel Springs ({safeSpringsCount}/{getRequiredMaterialCount(4)})
                        </span>
                      </div>
                    </div>
                    <button
                      id="craft-weapon-rifle"
                      onClick={() => handleCraftWeapon("rifle")}
                      disabled={!canCraftWeapon("rifle")}
                      className={`py-2 px-4 rounded text-xs tracking-wider uppercase font-bold font-serif ${canCraftWeapon("rifle") ? "bg-sky-700 hover:bg-sky-650 text-white cursor-pointer" : "bg-stone-950 text-stone-600 cursor-not-allowed"}`}
                    >
                      Forge Winchester
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: BANK ROBBERY DUSTUP */}
          {activeTab === "bank" && (
            <div className="space-y-4 flex-1">
              <div className="bg-[#dfd4bd] border border-[#bfae96] p-5 rounded-sm text-center flex flex-col items-center">
                <Landmark
                  size={32}
                  className="text-[#8c6b0c] animate-pulse mt-1"
                />

                <div className="mt-2">
                  <h3 className="text-[#8c6b0c] font-serif font-bold text-sm uppercase tracking-widest">
                    {location.name} Trust Vault Box
                  </h3>
                  <p className="text-[#4a3928] text-xs font-sans mt-1 leading-relaxed max-w-sm mx-auto">
                    The lockbox holds greenbacks and golden nuggets that can be
                    pillaged instantly. Beware! Violating federal law triggers
                    immediate ambush and decreases Lawmen reputation!
                  </p>
                </div>

                <div className="bg-[#e8dec7] border border-[#bfae96] p-3 rounded-sm space-y-2 mt-3 text-left max-w-xs w-full">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#664d36] font-serif">
                      Your Bank Balance:
                    </span>
                    <span className="text-teal-400 font-bold font-mono">
                      ${player.bankBalance || 0}
                    </span>
                  </div>

                  <div className="flex gap-2 mt-2 pt-2 border-t border-[#bfae96]/60">
                    <button
                      onClick={() => {
                        if (player.gold > 0 && onUpdatePlayer) {
                          onUpdatePlayer((p) => ({
                            ...p,
                            gold: 0,
                            bankBalance: (p.bankBalance || 0) + player.gold,
                          }));
                        }
                      }}
                      disabled={player.gold <= 0}
                      className="flex-1 py-1 px-2 bg-[#2d3a2b] hover:bg-[#3d4a3b] text-teal-400 disabled:opacity-50 text-[10px] font-bold uppercase rounded-sm border border-teal-900/40 transition-colors cursor-pointer"
                    >
                      Deposit All
                    </button>
                    <button
                      onClick={() => {
                        if ((player.bankBalance || 0) > 0 && onUpdatePlayer) {
                          onUpdatePlayer((p) => ({
                            ...p,
                            gold: p.gold + (p.bankBalance || 0),
                            bankBalance: 0,
                          }));
                        }
                      }}
                      disabled={(player.bankBalance || 0) <= 0}
                      className="flex-1 py-1 px-2 bg-[#2d2119] hover:bg-[#3d2d21] text-[#8c6b0c] disabled:opacity-50 text-[10px] font-bold uppercase rounded-sm border border-[#8a705a]/30 transition-colors cursor-pointer"
                    >
                      Withdraw All
                    </button>
                  </div>
                </div>

                <div className="bg-[#e8dec7] border border-[#bfae96] p-3 rounded-sm space-y-2 mt-3 text-left max-w-xs w-full">
                  <div className="flex justify-between items-center text-xs mb-1 font-serif text-white/50 italic">
                    <span className="text-[10px]">Outlaw Actions</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#664d36] font-serif">
                      Vault Reserves:
                    </span>
                    <span className="text-[#8c6b0c] font-bold font-mono">
                      ${location.bankGold}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#664d36] font-serif">
                      Defensive Guard Force:
                    </span>
                    <span className="text-[#c4451a] font-bold font-mono">
                      {location.bankGuards} Law Deputies
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] border-t border-[#bfae96]/40 pt-2 font-serif uppercase tracking-wider">
                    <span className="text-[#664d36]">Threat Index:</span>
                    <span className="text-[#c4451a] font-bold animate-pulse">
                      {location.bankGuards >= 3
                        ? "⚔️ SUICIDAL LETHAL"
                        : "⚠️ HEAVILY REINFORCED"}
                    </span>
                  </div>
                </div>

                {/* Heist triggers */}
                {location.bankGold > 0 ? (
                  <div className="w-full max-w-xs space-y-2 mt-4">
                    <button
                      id="btn-hold-up-bank"
                      onClick={onHoldUpBank}
                      className="w-full py-2 px-4 bg-[#c4451a] hover:bg-red-800 text-stone-100 rounded-sm font-serif uppercase tracking-widest font-bold text-xs border-b-4 border-black transition-all cursor-pointer flex items-center justify-center gap-1.5 focus:outline-none"
                    >
                      <ShieldAlert size={14} /> HEIST VAULT BOX
                    </button>
                    <span className="text-[9px] text-[#664d36] block font-sans italic">
                      Warning: Places you inside grid combat versus armed
                      deputies instantly.
                    </span>
                  </div>
                ) : (
                  <div className="text-[11px] text-[#664d36] italic p-3 bg-[#e8dec7] rounded-sm border border-[#bfae96] w-full max-w-xs mt-3 text-center">
                    Vault is currently stripped of coinage. Supply cargo has yet
                    to arrive.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: SHERIFF'S OFFICE / BANDIT BOSS */}
          {activeTab === "sheriff" && (
            <div className="space-y-4 flex-1">
              <div className="bg-[#dfd4bd] border border-[#bfae96] p-4 rounded-sm">
                <div className="flex items-center gap-2 mb-4">
                  <ShieldAlert className="text-[#8c6b0c]" size={20} />
                  <h3 className="text-[#8c6b0c] font-serif font-bold text-sm uppercase tracking-widest">
                    {labelSheriff}
                  </h3>
                </div>

                {/* Faction-specific interactions */}
                {factionType === "lawmen" && repValue < 0 && !hasBanditBoss && (
                  <div className="mb-4">
                    <button
                      onClick={() => {
                        if (player.gold >= 50) {
                          onUpdatePlayer((p) => ({
                            ...p,
                            gold: p.gold - 50,
                            factionReputation: {
                              ...p.factionReputation,
                              lawmen: Math.min(
                                0,
                                p.factionReputation.lawmen + 15,
                              ),
                            },
                          }));
                          addLogMessage(
                            `💸 Bribed Sheriff! Paid $50 to clear some of your bounty.`,
                            "reputation",
                          );
                        }
                      }}
                      className="w-full py-2 bg-[#1e293b] hover:bg-slate-700 border border-sky-500/50 text-sky-200 font-bold text-xs font-serif uppercase tracking-wider rounded transition-colors"
                    >
                      🤝 Bribe Sheriff to Clear Bounty ($50)
                    </button>
                  </div>
                )}

                {hasBanditBoss && repValue < 0 && (
                  <div className="mb-4">
                    <button
                      onClick={() => {
                        if (player.gold >= 50) {
                          onUpdatePlayer((p) => ({
                            ...p,
                            gold: p.gold - 50,
                            factionReputation: {
                              ...p.factionReputation,
                              outlaws: Math.min(
                                0,
                                (p.factionReputation?.outlaws || 0) + 15,
                              ),
                            },
                          }));
                          addLogMessage(
                            `💸 Bribed Boss! Paid $50 to get back in the gang's good graces.`,
                            "reputation",
                          );
                        }
                      }}
                      className="w-full py-2 bg-[#2d1e1e] hover:bg-[#3d1e1e] border border-red-500/50 text-red-200 font-bold text-xs font-serif uppercase tracking-wider rounded transition-colors"
                    >
                      🤝 Bribe Boss for Forgiveness ($50)
                    </button>
                  </div>
                )}


                {!hasBanditBoss && factionType === "lawmen" && (
                  <div className="mb-6 pb-6 border-b border-[#bfae96]/60">
                    <button
                      onClick={() =>
                        onStartCombat("bounty", 0.8, null, "sheriff_garrett", undefined, location.leaderName)
                      }
                      className="w-full py-2 bg-[#301010] hover:bg-red-950 border border-red-950 text-red-400 font-bold text-[10px] font-mono uppercase tracking-widest rounded transition-colors"
                    >
                      ⚔️ Provoke {location.leaderName || "Sheriff"} to a Duel
                    </button>
                    <p className="text-[10px] text-[#664d36] mt-2 font-sans italic text-center">
                      (Deadly) Challenging the law puts you in a high stakes
                      tactical duel!
                    </p>
                  </div>
                )}

                {hasBanditBoss && (
                  <div className="mb-6 pb-6 border-b border-[#bfae96]/60">
                    <button
                      onClick={() =>
                        onStartCombat("bounty", 0.8, null, "bandit_boss", undefined, location.leaderName)
                      }
                      className="w-full py-2 bg-[#301010] hover:bg-red-950 border border-red-950 text-red-400 font-bold text-[10px] font-mono uppercase tracking-widest rounded transition-colors"
                    >
                      ⚔️ Provoke {location.leaderName || "Bandit Boss"} to a Duel
                    </button>
                    <p className="text-[10px] text-[#664d36] mt-2 font-sans italic text-center">
                      (Deadly) Challenging the boss puts you in a high stakes
                      tactical duel!
                    </p>
                  </div>
                )}


                {/* Prisoner Delivery Ward */}
                <div
                  id="prisoner-delivery-panel"
                  className="bg-[#e8dec7] border-l-4 border-[#e8b923] p-3.5 rounded-sm space-y-2 border border-[#bfae96]/30"
                >
                  <span className="font-serif font-bold text-[#8c6b0c] text-xs block uppercase tracking-wider">
                    {hasBanditBoss ? "⛓️ Ransom Exchange Desk" : "👮 Bounty Custody Desk"}
                  </span>
                  {player.inventory.some((item) =>
                    item.id.startsWith("captured_"),
                  ) ? (
                    <>
                      <p className="text-[10px] text-[#4a3928] font-sans">
                        {hasBanditBoss ? "You have captured targets. The boss is willing to pay ransom for them." : "You have secured handcuffed outlaws in your saddlebags transport. Turn them over to the law for reward coin!"}
                      </p>
                      <div className="space-y-1.5 pt-1">
                        {player.inventory
                          .filter((item) => item.id.startsWith("captured_"))
                          .map((item) => (
                            <div
                              key={item.id}
                              className="flex justify-between items-center bg-[#dcd1b9] p-2 rounded border border-[#bfae96]/70"
                            >
                              <div className="space-y-0.5">
                                <span className="text-white text-xs font-serif font-bold block">
                                  {item.name}
                                </span>
                                <span className="text-[8px] text-[#664d36] block font-mono">
                                  Status: Handcuffed & Bound
                                </span>
                              </div>
                              <button
                                id={`btn-saloon-claim-${item.id}`}
                                onClick={() =>
                                  onCollectBounty && onCollectBounty(item.id)
                                }
                                className="py-1 px-3 bg-[#e8b923] hover:bg-[#ffcf33] text-[#1a130f] rounded-sm font-serif font-extrabold text-[10px] uppercase cursor-pointer transition-colors"
                              >
                                {hasBanditBoss ? `Collect Ransom ($${item.value})` : `Collect Bounty ($${item.value})`}
                              </button>
                            </div>
                          ))}
                      </div>
                    </>
                  ) : (
                    <p className="text-[10px] text-[#664d36] font-sans italic py-2">
                      {hasBanditBoss ? "No captured targets to ransom right now." : "No captured outlaws to turn in right now. Check the Town Square for Wanted Posters."}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "doctor" && (
            <div className="space-y-4 flex-1 overflow-y-auto max-h-[calc(100vh-340px)] pr-2 custom-scrollbar">
              <div className="bg-[#dfd4bd] border border-[#bfae96] p-4 rounded-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <PlusCircle className="text-red-700" size={20} />
                    <h3 className="text-red-800 font-serif font-bold text-sm uppercase tracking-widest">
                      Surgeon & Physician
                    </h3>
                  </div>
                </div>
                <p className="text-[11px] text-[#4a3928] font-sans mb-4 italic">
                  "Got a bullet lodged in you? Lost a limb to a rattler? The doc
                  can fix you up, for a price."
                </p>

                <div className="space-y-4">
                  {!player.injuries ||
                  (player.injuries.bloodVolume >= 100 &&
                    player.injuries.shockLevel <= 0 &&
                    player.injuries.painLevel <= 0 &&
                    Object.values(player.injuries.parts).every(
                      (p: any) => p.status === "NORMAL",
                    )) ? (
                    <p className="text-[10px] text-[#664d36]">
                      You have no severe injuries that require professional
                      treatment right now.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      <div className="bg-[#dcd1b9] p-3 rounded border border-[#bfae96]/70 pb-3 flex flex-col sm:flex-row justify-between items-center sm:items-start gap-3">
                        <div className="space-y-1 w-full text-left">
                          <span className="font-bold text-[#8c6b0c] text-xs font-serif uppercase tracking-wider block border-b border-[#bfae96] pb-1 w-full text-left">
                            General Triage & Operation
                          </span>
                          <p className="text-[10px] text-[#4a3928]">
                            Heal all HP, fully restore blood volume, and treat
                            all CRIPPLED/INJURED parts (excluding amputations).
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            if (player.gold < 150) {
                              addLogMessage(
                                "⚠️ Not enough gold for surgery!",
                                "danger",
                              );
                              return;
                            }
                            onUpdatePlayer((prev) => {
                              const nextInjuries = prev.injuries
                                ? { ...prev.injuries }
                                : undefined;
                              if (nextInjuries) {
                                nextInjuries.bloodVolume = 100;
                                nextInjuries.bleedingRate = 0;
                                nextInjuries.shockLevel = 0;
                                nextInjuries.painLevel = 0;
                                Object.keys(nextInjuries.parts).forEach(
                                  (key) => {
                                    const partType = key as
                                      | "HEAD"
                                      | "TORSO"
                                      | "LEFT_ARM"
                                      | "RIGHT_ARM"
                                      | "LEGS";
                                    if (
                                      nextInjuries.parts[partType].status !==
                                        "AMPUTATED" &&
                                      nextInjuries.parts[partType].status !==
                                        "PROSTHETIC"
                                    ) {
                                      nextInjuries.parts[partType].status =
                                        "NORMAL";
                                      nextInjuries.parts[partType].integrity =
                                        100;
                                      nextInjuries.parts[partType].isUntreated =
                                        false;
                                    }
                                  },
                                );
                              }
                              return {
                                ...prev,
                                gold: Math.max(0, prev.gold - 150),
                                hp: prev.maxHp,
                                injuries: nextInjuries,
                              };
                            });
                            addLogMessage(
                              "🩺 Survived the surgery! All general injuries patched and blood volume restored.",
                              "loot",
                            );
                          }}
                          className={`px-3 py-1.5 rounded-sm font-bold uppercase text-[10px] tracking-widest transition-colors flex items-center gap-1.5 flex-shrink-0 ${player.gold >= 150 ? "bg-[#3d2d21] text-amber-200 hover:bg-[#2d2119] border border-[#8a705a]" : "bg-[#dcd1b9]/40 text-[#664d36] border border-[#bfae96] cursor-not-allowed opacity-50"}`}
                        >
                          $150 Treat
                        </button>
                      </div>
                      {player.injuries &&
                        Object.keys(player.injuries.parts).map((key) => {
                          const partType = key as
                            | "HEAD"
                            | "TORSO"
                            | "LEFT_ARM"
                            | "RIGHT_ARM"
                            | "LEGS";
                          const p = player.injuries!.parts[partType];
                          if (p.status === "AMPUTATED") {
                            return (
                              <div
                                key={`prosthetic-${key}`}
                                className="bg-[#dcd1b9] p-3 rounded border border-[#bfae96]/70 pb-3 flex flex-col sm:flex-row justify-between items-center sm:items-start gap-3 mt-2"
                              >
                                <div className="space-y-1 w-full text-left">
                                  <span className="font-bold text-[#8c6b0c] text-xs font-serif uppercase tracking-wider block border-b border-[#bfae96] pb-1 w-full text-left">
                                    Install Prosthetic {key.replace("_", " ")}
                                  </span>
                                  <p className="text-[10px] text-[#4a3928]">
                                    Install a peg leg or wooden arm. 50%
                                    effectiveness compared to original limp.
                                  </p>
                                </div>
                                <button
                                  onClick={() => {
                                    if (player.gold < 300) {
                                      addLogMessage(
                                        "⚠️ Not enough gold for prosthetic!",
                                        "danger",
                                      );
                                      return;
                                    }
                                    onUpdatePlayer((prev) => {
                                      const parts = { ...prev.injuries!.parts };
                                      parts[partType].status = "PROSTHETIC";
                                      return {
                                        ...prev,
                                        gold: prev.gold - 300,
                                        injuries: { ...prev.injuries!, parts },
                                      };
                                    });
                                    addLogMessage(
                                      `🩺 Installed wooden prosthetic for ${key.replace("_", " ")}.`,
                                      "loot",
                                    );
                                  }}
                                  className={`px-3 py-1.5 rounded-sm font-bold uppercase text-[10px] tracking-widest transition-colors flex items-center gap-1.5 flex-shrink-0 ${player.gold >= 300 ? "bg-[#3d2d21] text-amber-200 hover:bg-[#2d2119] border border-[#8a705a]" : "bg-[#dcd1b9]/40 text-[#664d36] border border-[#bfae96] cursor-not-allowed opacity-50"}`}
                                >
                                  $300 Buy
                                </button>
                              </div>
                            );
                          }
                          return null;
                        })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Trade Modal */}
          {tradeModal && (
            <div className="fixed inset-0 z-[100] bg-[#2d2119]/80 backdrop-blur-[2px] flex items-start justify-center pt-24 p-4">
              <div className="bg-[#e8dec7] max-w-sm w-full border-2 border-[#3d2d21] rounded shadow-2xl p-4 flex flex-col space-y-4 relative">
                {(() => {
                  const good = TRADE_GOODS.find(
                    (g) => g.id === tradeModal.goodId,
                  );
                  if (!good) return null;

                  const finalPrice = calculateLocalPrice(
                    good.id,
                    good.basePrice,
                    location,
                    player,
                    tradeModal.action === "sell",
                  );
                  const townStock =
                    location.economyProfile?.localInventory[good.id] || 0;
                  const playerOwnedCount =
                    player.tradeInventory?.find((i) => i.itemId === good.id)
                      ?.quantity || 0;

                  let maxCanBuy = 0;
                  if (tradeModal.action === "buy") {
                    const maxByGold = Math.floor(player.gold / finalPrice);
                    const maxByWeight =
                      good.weight === 0
                        ? 9999
                        : Math.floor(
                            (maxCapacity - currentWeight) / good.weight,
                          );
                    maxCanBuy = Math.min(townStock, maxByGold, maxByWeight);
                  }

                  const maxCanSell = playerOwnedCount;

                  const handleTrade = (qtyStr: string) => {
                    const qty = parseInt(qtyStr, 10);
                    if (isNaN(qty) || qty <= 0) return;

                    if (tradeModal.action === "buy" && qty <= maxCanBuy) {
                      if (onBuyTradeItem)
                        onBuyTradeItem(good.id, qty, finalPrice * qty);
                      setTradeModal(null);
                    } else if (
                      tradeModal.action === "sell" &&
                      qty <= maxCanSell
                    ) {
                      if (onSellTradeItem)
                        onSellTradeItem(good.id, qty, finalPrice * qty);
                      setTradeModal(null);
                    }
                  };

                  return (
                    <>
                      <div className="border-b-2 border-[#3d2d21] pb-2 flex justify-between items-start">
                        <h3 className="font-serif font-bold text-lg text-[#3d2d21] capitalize tracking-wide flex items-center gap-2">
                          <Package size={18} className="text-[#8c6b0c]" />
                          {tradeModal.action} {good.name}
                        </h3>
                        <button
                          onClick={() => setTradeModal(null)}
                          className="text-[#664d36] hover:text-[#c4451a] font-bold"
                        >
                          ✕
                        </button>
                      </div>

                      <div className="text-[11px] text-[#4a3928] space-y-1 bg-[#dfd4bd] p-2 rounded-sm border border-[#bfae96]">
                        <div className="flex justify-between">
                          <span>Price per unit:</span>
                          <span className="font-mono text-[#8c6b0c] font-bold">
                            ${finalPrice}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Unit Weight:</span>
                          <span>{good.weight} lbs</span>
                        </div>
                        {tradeModal.action === "buy" && (
                          <div className="flex justify-between">
                            <span>Available Limit:</span>
                            <span>
                              Max <b className="text-green-700">{maxCanBuy}</b>{" "}
                              units
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-[#664d36]">
                          Custom Quantity
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={tradeInputQty}
                            onChange={(e) => setTradeInputQty(e.target.value)}
                            className="flex-1 bg-white/60 border border-[#bfae96] rounded px-2 py-1 text-sm font-bold text-[#3d2d21] focus:outline-none focus:border-[#8c6b0c]"
                            min="1"
                            max={
                              tradeModal.action === "buy"
                                ? maxCanBuy
                                : maxCanSell
                            }
                          />
                          <button
                            onClick={() => handleTrade(tradeInputQty)}
                            disabled={
                              (tradeModal.action === "buy" &&
                                (parseInt(tradeInputQty) > maxCanBuy ||
                                  parseInt(tradeInputQty) <= 0 ||
                                  isNaN(parseInt(tradeInputQty)))) ||
                              (tradeModal.action === "sell" &&
                                (parseInt(tradeInputQty) > maxCanSell ||
                                  parseInt(tradeInputQty) <= 0 ||
                                  isNaN(parseInt(tradeInputQty))))
                            }
                            className="bg-[#3d2d21] text-amber-200 hover:bg-[#2d2119] px-4 py-1 rounded font-bold uppercase text-xs tracking-wider transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-[#1a130f]"
                          >
                            Confirm
                          </button>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-2 gap-2 mt-2">
                        <button
                          onClick={() => {
                            setTradeInputQty("1");
                            handleTrade("1");
                          }}
                          className="flex-1 py-1.5 px-2 border border-[#bfae96] bg-[#dfd4bd] hover:bg-[#e8dec7] rounded font-bold text-[10px] uppercase text-[#3d2d21] shadow-sm"
                        >
                          {tradeModal.action} 1
                        </button>
                        <button
                          onClick={() => {
                            setTradeInputQty("5");
                            handleTrade("5");
                          }}
                          disabled={
                            tradeModal.action === "buy"
                              ? 5 > maxCanBuy
                              : 5 > maxCanSell
                          }
                          className="flex-1 py-1.5 px-2 border border-[#bfae96] bg-[#dfd4bd] hover:bg-[#e8dec7] rounded font-bold text-[10px] uppercase text-[#3d2d21] shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {tradeModal.action} 5
                        </button>
                        {tradeModal.action === "buy" && (
                          <button
                            onClick={() => {
                              setTradeInputQty(maxCanBuy.toString());
                              handleTrade(maxCanBuy.toString());
                            }}
                            className="flex-1 py-1.5 px-2 border border-[#1a130f] bg-[#3d2d21] hover:bg-[#2d2119] text-amber-200 rounded font-bold text-[10px] uppercase shadow-sm"
                            title="Buy all your gold and space allows"
                          >
                            Max ({maxCanBuy})
                          </button>
                        )}
                        {tradeModal.action === "sell" && (
                          <button
                            onClick={() => {
                              setTradeInputQty(maxCanSell.toString());
                              handleTrade(maxCanSell.toString());
                            }}
                            className="flex-1 py-1.5 px-2 border border-[#1a130f] bg-[#3d2d21] hover:bg-[#2d2119] text-amber-200 rounded font-bold text-[10px] uppercase shadow-sm"
                          >
                            All ({maxCanSell})
                          </button>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          )}

          {/* District footer summary of player assets */}
          <div className="mt-4 pt-3 border-t border-[#bfae96] font-serif text-[10px] text-[#664d36] flex justify-between items-center flex-wrap gap-2">
            <span>
              Possessions: <b className="text-[#8c6b0c]">${player.gold} Gold</b>{" "}
              •{" "}
              <b className="text-sky-400">
                {player.inventory.find(
                  (i) => i.id === `ammo_${player.weapon.ammoType || "pistol"}`,
                )?.count || 0}{" "}
                Cartridges
              </b>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
