/**
 * =========================================================================
 *  TOWN AND FRONTIER TYPES
 * =========================================================================
 * These types define the core structures of the game world.
 * 
 * SUGGESTION FOR NEW FEATURES:
 * If you want to add a new Location Type (e.g., 'casino_boat', 'gold_rush_camp'),
 * add it here to `LocationType`. Then, make sure you update:
 * 1. `procedural.ts` to generate it on the map.
 * 2. `OverlandMap.tsx` to give it a map icon.
 * 3. `TownView.tsx` to handle what it looks like when visited.
 */
export type LocationType =
  | "boomtown"
  | "ghost_town"
  | "outlaw_haven"
  | "railway_hub"
  | "desert_oasis"
  | "hostile_camp"
  | "mine"
  | "ranch"
  | "cavalry_fort"
  | "ephemeral_stash"
  | "marked_grave"
  | "native_settlement";

/**
 * =========================================================================
 *  ITEM & WEAPON DEFINITIONS
 * =========================================================================
 * SUGGESTION FOR NEW FEATURES:
 * To add new item mechanics (like armor, mounts, clothing), extend 
 * the `InventoryItem` type below. E.g., add `armorStats` or `mountStats`.
 */
export interface Weapon {
  name: string;
  dmg: number;
  range: number;
  maxClip: number;
  clip: number;
  value: number;
  customName?: string;
  condition?: number; // 0 to 100 percentage
  ammoType: "pistol" | "rifle" | "shotgun";
  equippedParts?: {
    barrel?: InventoryItem;
    cylinder?: InventoryItem;
    stock?: InventoryItem;
    action?: InventoryItem;
  };
}

export interface InventoryItem {
  id: string;
  name: string;
  type: "consumable" | "weapon" | "value" | "weapon_part" | "map_note";
  value: number;
  count: number;
  details?: string;
  targetLocationId?: string;
  weaponStats?: {
    dmg: number;
    range: number;
    maxClip: number;
    condition?: number;
    ammoType?: "pistol" | "rifle" | "shotgun";
  };
  partStats?: {
    condition: number;
    type: "barrel" | "cylinder" | "stock" | "action";
    perks?: {
      accuracyBonus?: number;
      apCostReduction?: number;
      dmgBonus?: number;
      maxClipBonus?: number;
      description: string;
    }[];
  };
}

export interface FactionReputation {
  lawmen: number; // -100 to +100
  outlaws: number; // -100 to +100
  tribes: number; // -100 to +100
}

export interface WeaponUpgrades {
  dmgBonus: number;
  rangeBonus: number;
  clipBonus: number;
  accuracyBonus: number;
  hasScope: boolean;
  nameModifier?: string;
}

export type BodyPartStatus =
  | "NORMAL"
  | "INJURED"
  | "CRIPPLED"
  | "AMPUTATED"
  | "PROSTHETIC";

export interface BodyPart {
  integrity: number; // 0 to 100
  status: BodyPartStatus;
  tourniquetApplied?: boolean;
  isUntreated?: boolean;
}

export interface InjurySystem {
  bloodVolume: number; // Max 100.0, Min 0.0
  bleedingRate: number; // Total blood lost per turn
  shockLevel: number; // 0.0 to 100.0
  painLevel: number;
  parts: {
    HEAD: BodyPart;
    TORSO: BodyPart;
    LEFT_ARM: BodyPart;
    RIGHT_ARM: BodyPart;
    LEGS: BodyPart;
  };
}

export interface PosseMember {
  id: string;
  name: string;
  role: "Gunslinger" | "Scout" | "Medic" | "Bodyguard" | "Bounty Hunter" | "Trade Guard";
  hp: number;
  maxHp: number;
  dmg: number;
  range: number;
  dailyRateGold: number;
  portrait: string;
  description: string;
  backstory?: string;
  morale?: number; // 0 to 100
  trait?: "loyal" | "mercenary" | "coward" | "bloodthirsty";
  injuries?: InjurySystem;
}

export interface Nemesis {
  id: string;
  name: string;
  type: string;
  powerLevel: number;
  gangSize: number;
  faction: string;
  isHunting: boolean;
  encounters: number;
}

export interface Mount {
  type: "donkey" | "mule" | "regular_horse" | "post_horse" | "thoroughbred";
  name: string;
  baseSpeedMultiplier: number;
}

export type CarriageTier = 'small_carriage' | 'medium_carriage' | 'large_carriage';

export interface Carriage {
  type: CarriageTier;
  maxWeight: number;
  mountsRequired: { type: 'donkey' | 'regular_horse', count: number };
}

export interface TradeItemDef {
  id: string;
  name: string;
  basePrice: number;
  weight: number;
  tier: 'basic' | 'luxury' | 'contraband';
  description: string;
}

export interface CargoStack {
  itemId: string;
  quantity: number;
}

export interface SettlementEconomyProfile {
  prosperityLevel: 'poor' | 'struggling' | 'stable' | 'wealthy';
  localPriceModifiers: Record<string, number>; // Maps itemId to a multiplier (e.g., {'snake_oil': 1.25})
  localInventory: Record<string, number>;
  availableCarriageForSale: CarriageTier | null;
}

export interface MarketBulletin {
  locationId: string;
  locationName: string;
  itemId: string;
  itemName: string;
  priceMultiplier: number;
  message: string;
}

/**
 * =========================================================================
 *  PLAYER & POSSE DEFINITIONS
 * =========================================================================
 * SUGGESTION FOR NEW FEATURES:
 * To add new progression mechanics (like new skills, diseases, hunger/thirst tracking), 
 * extend the `Player` interface below.
 * E.g., `hunger: number;`, `stamina: number;`, `wantedLevelInSpecificTowns: Record<string, number>`
 */
export interface Player {
  appearance?: {
    gender: "male" | "female";
    skinTone: string;
    hat: "none" | "cowboy" | "bowler" | "sombrero";
    shirtColor: "white" | "red" | "blue" | "black";
    hairStyle: "none" | "short" | "long";
    hairColor: "black" | "brown" | "blonde" | "gray";
    facialHair: "none" | "mustache" | "beard";
  };
  mount?: Mount;
  hoursDehydrated?: number;
  gender: "male" | "female" | "diverse";
  avatarImage?: string;
  hp: number;
  maxHp: number;
  gold: number;
  bounty: number;
  hydration: number;
  maxHydration: number;
  level: number;
  xp: number;
  xpToNextLevel: number;
  perks: string[];
  reputation: number; // -100 (Most Wanted Criminal) to +100 (Legendary Sheriff)
  campMovementLvl?: number;
  factionReputation: FactionReputation;
  nemeses?: Nemesis[];
  weapon: Weapon;
  weaponUpgrades: WeaponUpgrades;
  inventory: InventoryItem[];
  hasHorse: boolean;
  activeCarriage?: Carriage | null;
  tradeInventory?: CargoStack[];
  ownedMounts?: Mount[];
  defeatedNpcs?: string[];
  visitedLocationIds?: string[];
  name?: string;
  horseName?: string;
  posse: PosseMember[];
  relics?: string[]; // IDs of passive modifiers
  pistolSkill?: number;
  rifleSkill?: number;
  reloadSkill?: number;
  horsemanship?: number;
  silenceSkill?: number;
  scoutingSkill?: number;
  scoutingMastery?: number;
  barterSkill?: number;
  medicineSkill?: number;
  pistolSkillLevel?: number;
  rifleSkillLevel?: number;
  reloadSkillLevel?: number;
  horsemanshipLevel?: number;
  silenceSkillLevel?: number;
  barterSkillLevel?: number;
  logisticsSkillLevel?: number;
  appraisalSkillLevel?: number;
  salvageSkillLevel?: number;
  gunsmithSkillLevel?: number;
  medicineSkillLevel?: number;
  skillPoints?: number;
  bankBalance?: number;
  stats: {
    duelsWon: number;
    bountiesCollected: number;
    banksRobbed: number;
    daysSurvived: number;
    hoursSurvived?: number;
  };
  injuries?: InjurySystem;
  acceptedQuests?: Mission[];
  journalEntries?: { id: string; date: string; title: string; text: string }[];
  difficulty?: "normal" | "difficult";
  ammoScarcity?: boolean;
  activeMarketBulletin?: MarketBulletin | null;
}

export interface Mission {
  id: string;
  title: string;
  type:
    | "bounty"
    | "robbery"
    | "escort"
    | "scavenge"
    | "nest_clearing"
    | "story_assassination"
    | "story_investigation"
    | "story_delivery"
    | "story_heist"
    | "story_exploration"
    | "myth"
    | "diplomacy";
  targetName: string;
  rewardGold: number;
  rewardXp: number;
  reputationChange: number; // positive for bounties, negative for robberies
  danger: "low" | "medium" | "high" | "deadly";
  description: string;
  originLocationId: string;
  targetLocationId: string;
  isStoryline?: boolean;
  nextQuestTemplateId?: string; // used to spawn the next part of the story
  targetLevel?: number;
  difficulty?: number;

  // NEW INVESTIGATION & TWIST MECHANICS
  hiddenTargetHex?: number[]; // [x, y]
  currentCluePoints?: number;
  maxClueThreshold?: number;
  twistType?:
    | "STANDARD"
    | "ROBIN_HOOD"
    | "FRAMED_INNOCENT"
    | "MYSTICAL_CULTIST";
  questState?:
    | "HUNTING"
    | "TWIST_REVEALED"
    | "ALLIED_WITH_TARGET"
    | "COMPLETED_BOUNTY"
    | "COMPLETED_BETRAYAL";

  // MULTI-STAGE TRACKING
  stage?: number;
  maxStages?: number;
  stageTargets?: string[]; // Array of locationIds for successive stages
  stageInstructions?: string[]; // Custom instructions/details for each stage
  clueItemNeeded?: string;
}

export interface ShopItem {
  id: string;
  name: string;
  type: "consumable" | "weapon" | "value" | "weapon_part";
  cost: number;
  details: string;
  weaponStats?: {
    dmg: number;
    range: number;
    maxClip: number;
    condition?: number;
    ammoType?: "pistol" | "rifle" | "shotgun";
  };
  partStats?: {
    condition: number;
    type: "barrel" | "cylinder" | "action" | "stock";
    perks?: any[];
  };
}

export interface Location {
  id: string;
  name: string;
  type: LocationType;
  x: number; // 0 to 100 for SVG coordinates
  y: number; // 0 to 100 for SVG coordinates
  risk: number; // 0 (safe) to 1.0 (deadly)
  description: string;
  hasTrain: boolean;
  quests: Mission[];
  shop: ShopItem[];
  bankGold: number;
  bankGuards: number;
  isExplored: boolean;
  prosperity?: number; // 0 to 100
  economyProfile?: SettlementEconomyProfile;
  controllingFaction?: "lawmen" | "outlaws" | "tribes" | "neutral";
  leaderName?: string;
  expiresAtTime?: number;
  isHidden?: boolean;
  graveInventory?: InventoryItem[];
  gravePlayerName?: string;
  graveLooted?: boolean;
}

export interface GridCell {
  x: number;
  y: number;
  type:
    | "empty"
    | "low_cover"
    | "high_cover"
    | "cactus"
    | "rail"
    | "tnt_barrel"
    | "tree"
    | "wagon"
    | "crates"
    | "tombstone"
    | "fence"
    | "water_trough"
    | "boulder"
    | "mining_cart"
    | "wooden_wall"
    | "brick_wall"
    | "well"
    | "table"
    | "bar"
    | "tent"
    | "tipi"
    | "camp_fire"
    | "lantern"
    | "rubble"
    | "fire";
  sprite?: string;
  hp?: number;
  maxHp?: number;
  isOnFire?: boolean;
  turnsOnFire?: number;
}

export interface CombatActor {
  id: string;
  name: string;
  level?: number;
  type:
    | "player"
    | "posse"
    | "scorpion"
    | "bandit"
    | "outlaw_leader"
    | "deputy"
    | "sheriff"
    | "horse";
  hp: number;
  maxHp: number;
  x: number;
  y: number;
  dmg: number;
  range: number;
  clip: number;
  maxClip: number;
  accuracy: number; // 0 to 1
  agility?: number;
  intelligence?: number; // scale 1-10 dictating AI behavior
  isDead: boolean;
  alerted: boolean;
  facing?: "up" | "down" | "left" | "right";
  stance?: "standing" | "crouching" | "lying";
  isSurrendered?: boolean;
  injuredLeg?: boolean;
  injuredArm?: boolean;
  isUnconscious?: boolean;
  isDisarmed?: boolean;
  statusBleeding?: number; // turns left
  statusPoison?: number; // turns left
  roundsDisarmedWithoutGun?: number;
  trait?: "quickdraw" | "armored" | "ruthless" | "slippery" | "glass_cannon";
  weaponName?: string;
  currentTargetInfo?: any;
  overwatchAp?: number; // Stores invested AP for overwatch
  injuries?: InjurySystem;
}

export interface LogMessage {
  id: string;
  text: string;
  type: "system" | "combat" | "loot" | "reputation" | "travel" | "danger";
  timestamp: string;
}

export interface OverlandActor {
  id: string;
  name: string;
  type: "bounty_hunter" | "bandit" | "trader" | "native";
  x: number;
  y: number;
  speed: number;
  state: "patrolling" | "hunting" | "wandering" | "fleeing";
  targetX?: number;
  targetY?: number;
  health: number;
  maxHealth: number;
  bountyTargetPrice?: number;
  tradeInventory?: { itemId: string; quantity: number; priceMultiplier: number }[];
  avatarIcon: string;
  description: string;
  targetLocationId?: string;
  isDefeated?: boolean;
}

