import { Player } from "../types";

export interface StandoffOption {
  id: string;
  name: string;
  description: string;
  skill: "charisma" | "stealth" | "perception" | "marksman" | "survival";
  baseChance: number; // e.g. 0.5 for 50%
  successText: string;
  failureText: string;
  cost?: { type: "gold" | "ammo"; amount: number };
  
  // Custom modifiers applied on resolution
  onSuccess: (player: Player) => {
    playerUpdates: Partial<Player>;
    log: string;
    combatBonus?: {
      surpriseTurns?: number;
      enemyHpMultiplier?: number;
      bypassCombat?: boolean;
      enemyCountReduction?: number;
      bonusMessage?: string;
    };
  };
  onFailure: (player: Player) => {
    playerUpdates: Partial<Player>;
    log: string;
    combatPenalty?: {
      playerHpReduction?: number;
      lostInitiative?: boolean;
      enemyDamageBoost?: boolean;
      bonusMessage?: string;
    };
  };
}

// Master list of 15 immersive, generic options (3 per skill)
const ALL_STANDOFF_OPTIONS: StandoffOption[] = [
  // --- CHARISMA ---
  {
    id: "charisma_charm_sentry",
    name: "💬 Soft-Talk the Sentry",
    description: "Reason with the lookouts or offer small pleasantries to relax their guard.",
    skill: "charisma",
    baseChance: 0.55,
    successText: "Success! You lulled the watchmen with pleasant talk. They let down their guard, granting you surprise initiative!",
    failureText: "Failure! The sentries spat in the dust and shouted the alarm. Combat starts immediately with lost initiative!",
    onSuccess: (player) => ({
      playerUpdates: {
        reputation: Math.min(100, (player.reputation || 0) + 1),
      },
      log: "💬 SOFT-TALK SUCCESS: You gained 1 Surprise Turn in combat!",
      combatBonus: {
        surpriseTurns: 1,
        bonusMessage: "Surprise Initiative: Enemies delayed for 1 turn!",
      },
    }),
    onFailure: (player) => ({
      playerUpdates: {},
      log: "💬 SOFT-TALK FAILURE: Sentry sounded the alarm! Lost initiative.",
      combatPenalty: {
        lostInitiative: true,
        bonusMessage: "Alarm sounded! Enemies fire first!",
      },
    }),
  },
  {
    id: "charisma_bluff_badge",
    name: "💬 Bluff with Fake Authority",
    description: "Exert absolute confidence, shouting that you represent the federal marshals.",
    skill: "charisma",
    baseChance: 0.45,
    successText: "Success! They panicked under your authoritative glare. All hostiles lose their confidence (-25% starting HP)!",
    failureText: "Failure! They saw through your bluff immediately and mockingly drew iron first!",
    onSuccess: (player) => ({
      playerUpdates: {
        xp: player.xp + 25,
      },
      log: "💬 AUTHORITATIVE BLUFF SUCCESS: Enemies weakened (-25% starting HP)!",
      combatBonus: {
        enemyHpMultiplier: 0.75,
        bonusMessage: "Demoralized Foes: Enemies start with 25% lower HP!",
      },
    }),
    onFailure: (player) => ({
      playerUpdates: {},
      log: "💬 BLUFF FAILURE: Your authority was mocked. Lost initiative.",
      combatPenalty: {
        lostInitiative: true,
        bonusMessage: "Busted Bluff: Hostiles react quickly and shoot first!",
      },
    }),
  },
  {
    id: "charisma_bribe_sentry",
    name: "💰 Pay Off the Lookout ($20)",
    description: "Offer a pocketful of shiny gold coins to make the lookouts turn a blind eye.",
    skill: "charisma",
    baseChance: 0.65,
    cost: { type: "gold", amount: 20 },
    successText: "Success! The watchman grabbed the gold greedily and slipped away. One enemy has been permanently removed from the fray!",
    failureText: "Failure! They pocketed your $20, laughed, and opened fire anyway!",
    onSuccess: (player) => ({
      playerUpdates: {
        gold: Math.max(0, (player.gold || 0) - 20),
      },
      log: "💰 BRIBE SUCCESS: Sentry departed. Enemy force size reduced by 1!",
      combatBonus: {
        enemyCountReduction: 1,
        bonusMessage: "Paid Watchman: One less hostile spawns on the grid!",
      },
    }),
    onFailure: (player) => ({
      playerUpdates: {
        gold: Math.max(0, (player.gold || 0) - 20),
      },
      log: "💰 BRIBE FAILURE: Sentry took your gold and fired! Lost initiative.",
      combatPenalty: {
        lostInitiative: true,
        bonusMessage: "Double-Cross: Lost $20 gold and enemies fire first!",
      },
    }),
  },

  // --- STEALTH ---
  {
    id: "stealth_sabotage_mounts",
    name: "👣 Sabotage Enemy Mounts",
    description: "Creep into the corral to cut cinch straps and spook their horses.",
    skill: "stealth",
    baseChance: 0.55,
    successText: "Success! You disabled their saddle rigs. Hostiles are disorganized and fail to take cover (+1 turn of surprise)!",
    failureText: "Failure! A horse squealed, alerting the camp. They cornered you in the open corral!",
    onSuccess: (player) => ({
      playerUpdates: {
        xp: player.xp + 30,
      },
      log: "👣 MOUNT SABOTAGE SUCCESS: Enemies disorganized! Gained 1 Surprise Turn.",
      combatBonus: {
        surpriseTurns: 1,
        bonusMessage: "Saddle Sabotage: Gained 1 complete turn of surprise!",
      },
    }),
    onFailure: (player) => ({
      playerUpdates: {
        hp: Math.max(5, player.hp - 8),
      },
      log: "👣 SABOTAGE FAILURE: Cornered! Suffer -8 HP damage from alert sentries.",
      combatPenalty: {
        playerHpReduction: 8,
        lostInitiative: true,
        bonusMessage: "Trampled Escape: You took 8 damage and enemies shoot first!",
      },
    }),
  },
  {
    id: "stealth_poison_stewpot",
    name: "👣 Poison Camp Water Supply",
    description: "Slip some bitter weed or toxic desert dust into their water bucket or soup pot.",
    skill: "stealth",
    baseChance: 0.50,
    successText: "Success! Several enemies drank the toxic brew. All enemies start combat severely weakened (-35% HP)!",
    failureText: "Failure! You were caught near the water line. A sentry shot you before you could react!",
    onSuccess: (player) => ({
      playerUpdates: {},
      log: "👣 TACTICAL POISON SUCCESS: Enemies severely weakened (-35% HP)!",
      combatBonus: {
        enemyHpMultiplier: 0.65,
        bonusMessage: "Toxic Sickness: Enemies start with 35% lower health!",
      },
    }),
    onFailure: (player) => ({
      playerUpdates: {
        hp: Math.max(5, player.hp - 12),
      },
      log: "👣 POISON FAILURE: Shot at water line! Suffer -12 HP.",
      combatPenalty: {
        playerHpReduction: 12,
        lostInitiative: true,
        bonusMessage: "Caught Poisoner: Took 12 shrapnel/gunshot damage!",
      },
    }),
  },
  {
    id: "stealth_shadow_path",
    name: "👣 Slip in via Shadows",
    description: "Utilize visual blindspots and dry creek beds to sneak deep behind their line.",
    skill: "stealth",
    baseChance: 0.60,
    successText: "Success! You secured a flawless high-ground vantage point behind them. Gained 2 Surprise Turns!",
    failureText: "Failure! You tripped a dry brush rattle. They spotted you and launched a surprise barrage!",
    onSuccess: (player) => ({
      playerUpdates: {
        xp: player.xp + 40,
      },
      log: "👣 SHADOW ENTRY SUCCESS: Flawless positioning! Gained 2 Surprise Turns.",
      combatBonus: {
        surpriseTurns: 2,
        bonusMessage: "Vantage Surprise: Gained 2 full turns of surprise!",
      },
    }),
    onFailure: (player) => ({
      playerUpdates: {
        hp: Math.max(5, player.hp - 10),
      },
      log: "👣 SHADOW ENTRY FAILURE: Suffer -10 HP from initial ambush.",
      combatPenalty: {
        playerHpReduction: 10,
        lostInitiative: true,
        bonusMessage: "Fumbled Infiltration: Took 10 crossfire damage!",
      },
    }),
  },

  // --- PERCEPTION ---
  {
    id: "perception_spot_snipers",
    name: "👁️ Scan for High-Ground Snipers",
    description: "Audit the rocky ridges carefully to locate and suppress hidden gunmen.",
    skill: "perception",
    baseChance: 0.55,
    successText: "Success! You spotted the glint of a sniper barrel. You easily flank and neutralize them before the firefight begins!",
    failureText: "Failure! You didn't spot them. The sniper landed a devastating surprise shot on you first!",
    onSuccess: (player) => ({
      playerUpdates: {
        xp: player.xp + 30,
      },
      log: "👁️ SNIPER SPOT SUCCESS: Suppressed high-ground sniper. Force size reduced!",
      combatBonus: {
        enemyCountReduction: 1,
        bonusMessage: "Sniper Disabled: Force size reduced by 1 hostile!",
      },
    }),
    onFailure: (player) => ({
      playerUpdates: {
        hp: Math.max(5, player.hp - 15),
      },
      log: "👁️ SNIPER SPOT FAILURE: Sniper shot you! Suffer -15 HP.",
      combatPenalty: {
        playerHpReduction: 15,
        lostInitiative: true,
        bonusMessage: "Sniper Ambushed: Devastating -15 HP shot taken!",
      },
    }),
  },
  {
    id: "perception_blind_spot",
    name: "👁️ Deduce Enemy Blind Spot",
    description: "Map out the local topography to identify premium cover positions.",
    skill: "perception",
    baseChance: 0.60,
    successText: "Success! You discovered a bulletproof stone redoubt, boosting your starting survivability (+20 Temporary HP)!",
    failureText: "Failure! You miscalculated cover lines, starting the firefight pinned down in an exposed gully!",
    onSuccess: (player) => ({
      playerUpdates: {
        hp: player.hp + 20, // Give them extra health (healed/overhealed)
      },
      log: "👁️ BLIND SPOT SUCCESS: Secured premium cover! Gained +20 HP.",
      combatBonus: {
        bonusMessage: "Premium Redoubt: HP boosted by +20 for this standoff!",
      },
    }),
    onFailure: (player) => ({
      playerUpdates: {},
      log: "👁️ BLIND SPOT FAILURE: Pinned down in gully. Enemy fires first.",
      combatPenalty: {
        lostInitiative: true,
        bonusMessage: "Exposed Gully: Pinned down, enemies shoot first!",
      },
    }),
  },
  {
    id: "perception_footprint_stash",
    name: "👁️ Analyze Footprint Trails",
    description: "Observe disturbed sands to find where they buried their emergency supply cache.",
    skill: "perception",
    baseChance: 0.50,
    successText: "Success! You dug up a forgotten stash containing $15 gold and +12 heavy caliber ammunition!",
    failureText: "Failure! You wasted precious minutes scanning empty dunes and got bitten by a hidden sand viper!",
    onSuccess: (player) => {
      const updatedInv = [...player.inventory];
      const ammoType = player.weapon.ammoType || "pistol";
      const idx = updatedInv.findIndex((i) => i.id === `ammo_${ammoType}`);
      if (idx !== -1) {
        updatedInv[idx] = { ...updatedInv[idx], count: updatedInv[idx].count + 12 };
      }
      return {
        playerUpdates: {
          gold: (player.gold || 0) + 15,
          inventory: updatedInv,
        },
        log: "👁️ TRACKING SUCCESS: Dug up $15 gold and +12 ammo!",
        combatBonus: {
          bonusMessage: "Scavenged Stash: Gained +12 rounds & $15 Gold!",
        },
      };
    },
    onFailure: (player) => ({
      playerUpdates: {
        hp: Math.max(5, player.hp - 8),
      },
      log: "👁️ TRACKING FAILURE: Viper bite! Suffer -8 HP.",
      combatPenalty: {
        playerHpReduction: 8,
        bonusMessage: "Sand Viper Bite: Lost 8 health before starting!",
      },
    }),
  },

  // --- MARKSMAN ---
  {
    id: "marksman_warning_shot",
    name: "🤠 Fire Precise Warning Shot",
    description: "Creep up and split a wooden pillar right next to their heads to shake their nerves.",
    skill: "marksman",
    baseChance: 0.60,
    successText: "Success! The terrifying precision of your shot scattered their hirelings. One minor combatant fled the field!",
    failureText: "Failure! Your shot missed entirely, drawing their immediate, enraged fire on your exact location!",
    onSuccess: (player) => ({
      playerUpdates: {
        xp: player.xp + 25,
      },
      log: "🤠 WARNING SHOT SUCCESS: One enemy fled in panic!",
      combatBonus: {
        enemyCountReduction: 1,
        bonusMessage: "Frightened Foes: One coward fled! Force size reduced.",
      },
    }),
    onFailure: (player) => ({
      playerUpdates: {},
      log: "🤠 WARNING SHOT FAILURE: Outlaws angered! Enemy damage boosted.",
      combatPenalty: {
        enemyDamageBoost: true,
        lostInitiative: true,
        bonusMessage: "Alerted Guard: Hostiles are enraged (+25% enemy dmg)!",
      },
    }),
  },
  {
    id: "marksman_chandelier_hazard",
    name: "🤠 Rig Environmental Explosion",
    description: "Align your barrel to shoot a loose kerosene lantern hanging directly above their heads.",
    skill: "marksman",
    baseChance: 0.45,
    successText: "Success! Direct hit! The exploding lantern showers them in fire, dealing heavy damage to all hostiles (-35% starting HP)!",
    failureText: "Failure! You missed the latch. The spark gave away your position and you took direct bullet fire!",
    onSuccess: (player) => ({
      playerUpdates: {},
      log: "🤠 ENV TRAP SUCCESS: Exploded lantern! Enemies start at 65% HP.",
      combatBonus: {
        enemyHpMultiplier: 0.65,
        bonusMessage: "Fiery Explosion: Enemies scorched! All start at 65% HP.",
      },
    }),
    onFailure: (player) => ({
      playerUpdates: {
        hp: Math.max(5, player.hp - 10),
      },
      log: "🤠 ENV TRAP FAILURE: Pinned! Suffer -10 HP damage.",
      combatPenalty: {
        playerHpReduction: 10,
        lostInitiative: true,
        bonusMessage: "Counterfire: Took 10 gunshot damage!",
      },
    }),
  },
  {
    id: "marksman_disarm_boss",
    name: "🤠 Attempt Quick-Draw Disarm",
    description: "Exert peerless marksmanship: shoot the sidearms right out of their fingers.",
    skill: "marksman",
    baseChance: 0.50,
    successText: "Success! Clang! Your lead shattered their primary gun grip. Enemies start combat heavily disarmed (-25% enemy damage)!",
    failureText: "Failure! Your shot went wide. You jammed your own cylinder in the rush (-15% weapon condition)!",
    onSuccess: (player) => ({
      playerUpdates: {
        xp: player.xp + 50,
      },
      log: "🤠 QUICK DISARM SUCCESS: Disarmed foes! All hostiles deal less damage.",
      combatBonus: {
        bonusMessage: "Disarmed Outlaws: Enemies deal 25% lower damage!",
      },
    }),
    onFailure: (player) => {
      const updatedWeapon = {
        ...player.weapon,
        condition: Math.max(20, (player.weapon.condition || 100) - 15),
      };
      return {
        playerUpdates: {
          weapon: updatedWeapon,
        },
        log: "🤠 QUICK DISARM FAILURE: Cylinder jammed! Weapon condition reduced by 15%.",
        combatPenalty: {
          lostInitiative: true,
          bonusMessage: "Jammed Chamber: Weapon condition -15% & lost initiative!",
        },
      };
    },
  },

  // --- SURVIVAL ---
  {
    id: "survival_herb_stimulant",
    name: "🌿 Brew Desert Cactus Stimulant",
    description: "Blend local bitter root and prickly pulp to supercharge your constitution.",
    skill: "survival",
    baseChance: 0.55,
    successText: "Success! The natural stimulant numbs all fatigue, fully restoring your HP and hydration before combat!",
    failureText: "Failure! The toxic alkaloids upset your stomach, causing severe nausea (-10 starting HP)!",
    onSuccess: (player) => ({
      playerUpdates: {
        hp: player.maxHp || 35,
        hydration: player.maxHydration || 100,
      },
      log: "🌿 STIMULANT SUCCESS: Fully restored HP & Hydration!",
      combatBonus: {
        bonusMessage: "Adrenaline Surge: Fully restored to peak condition!",
      },
    }),
    onFailure: (player) => ({
      playerUpdates: {
        hp: Math.max(5, player.hp - 10),
      },
      log: "🌿 STIMULANT FAILURE: Nausea! Suffer -10 HP.",
      combatPenalty: {
        playerHpReduction: 10,
        bonusMessage: "Toxic Sickness: Digestion cramped! Start at -10 HP.",
      },
    }),
  },
  {
    id: "survival_decoy_campfire",
    name: "🌿 Set up Decoy Campsite",
    description: "Light a false fire with brushwood and dummy hats to confuse their patrol.",
    skill: "survival",
    baseChance: 0.60,
    successText: "Success! Outlaws shot wildly at dummy shadows. You flank them flawlessly, gaining 1 Surprise Turn!",
    failureText: "Failure! Dry embers sparked out of control, singing your clothes and alerting them to your cover!",
    onSuccess: (player) => ({
      playerUpdates: {
        xp: player.xp + 30,
      },
      log: "🌿 DECOY SUCCESS: Flanked! Gained 1 Surprise Turn.",
      combatBonus: {
        surpriseTurns: 1,
        bonusMessage: "Bamboozled Patrol: You gained 1 Surprise Turn!",
      },
    }),
    onFailure: (player) => ({
      playerUpdates: {
        hp: Math.max(5, player.hp - 5),
      },
      log: "🌿 DECOY FAILURE: Scorched brush! Suffer -5 HP and lost initiative.",
      combatPenalty: {
        playerHpReduction: 5,
        lostInitiative: true,
        bonusMessage: "Scorched Brushes: Lost 5 health and lost initiative!",
      },
    }),
  },
  {
    id: "survival_wild_beast",
    name: "🌿 Coax Wild Horned Bull / Stampede",
    description: "Soothe or agitate local wild steer/bison to create a sudden stampede through their outpost.",
    skill: "survival",
    baseChance: 0.50,
    successText: "Success! A raging bull charges directly through their defenses, trampling outlaws for heavy initial damage (-30% starting HP)!",
    failureText: "Failure! The agitated beast turned directly onto you, charging and throwing you into the dust!",
    onSuccess: (player) => ({
      playerUpdates: {
        xp: player.xp + 45,
      },
      log: "🌿 BULL STAMPEDE SUCCESS: Steer crushed outlaws! Enemies start at 70% HP.",
      combatBonus: {
        enemyHpMultiplier: 0.70,
        bonusMessage: "Stampede Chaos: Enemies start with 30% lower HP!",
      },
    }),
    onFailure: (player) => ({
      playerUpdates: {
        hp: Math.max(5, player.hp - 12),
      },
      log: "🌿 STAMPEDE FAILURE: Trampled! Suffer -12 HP.",
      combatPenalty: {
        playerHpReduction: 12,
        lostInitiative: true,
        bonusMessage: "Gored by Bull: Suffer 12 heavy crush damage!",
      },
    }),
  },
];

// Returns localized details of a skill and its success metrics
export function getSkillMetrics(
  skillType: "charisma" | "stealth" | "perception" | "marksman" | "survival",
  player: Player,
  baseChance: number
) {
  let name = "";
  let level = 0;
  let mastery = 0;

  switch (skillType) {
    case "charisma":
      name = "Charisma & Persuasion";
      level = player.barterSkillLevel || 0;
      mastery = player.barterSkill || 0;
      break;
    case "stealth":
      name = "Stealth & Sabotage";
      level = player.silenceSkillLevel || 0;
      mastery = player.silenceSkill || 0;
      break;
    case "perception":
      name = "Perception & Scouting";
      level = player.scoutingSkill || 0;
      mastery = player.scoutingMastery || 0;
      break;
    case "marksman":
      name = "Marksman & Grit";
      level = Math.max(player.pistolSkillLevel || 0, player.rifleSkillLevel || 0);
      mastery = Math.max(player.pistolSkill || 0, player.rifleSkill || 0);
      // Clamp mastery to 100 for percentage calculation helper
      mastery = Math.min(100, Math.round(mastery / 2)); 
      break;
    case "survival":
      name = "Survival & Medicine";
      level = player.medicineSkillLevel || 0;
      mastery = player.medicineSkill || 0;
      break;
  }

  // Formula: Base Chance + 12% per Skill Level + 0.25% per Mastery Point
  const levelBonus = level * 0.12;
  const masteryBonus = mastery * 0.0025;
  const totalChance = Math.min(0.95, baseChance + levelBonus + masteryBonus);

  return {
    name,
    level,
    mastery,
    totalChance: Math.round(totalChance * 100),
    levelBonus: Math.round(levelBonus * 100),
    masteryBonus: Math.round(masteryBonus * 100),
  };
}

// Helper to transform standoff options based on settings, environment, and enemy counts
function getContextualOption(
  option: StandoffOption,
  isSlipperyPete?: boolean,
  isNestClearing?: boolean,
  numEnemies?: number,
  isBankRobbery?: boolean,
  isSheriffDuel?: boolean,
  isBossDuel?: boolean
): StandoffOption {
  let name = option.name;
  let description = option.description;
  let successText = option.successText;
  let failureText = option.failureText;
  
  let customOnSuccess = option.onSuccess;
  let customOnFailure = option.onFailure;

  if (isSheriffDuel || isBossDuel) {
    const duelTarget = isBossDuel ? "Bandit Boss" : "Sheriff";
    switch (option.id) {
      case "charisma_charm_sentry":
        name = "💬 De-escalate the Duel";
        description = isBossDuel
          ? "Convince the Bandit Boss that there is enough gold for both of you and no need for blood."
          : "Remind the Sheriff of his oath to the town, attempting to defuse the standoff through civil discussion.";
        successText = `Success! The ${duelTarget} hesitates, lowering his iron. He agrees to let you walk away if you leave town.`;
        failureText = "Failure! He spits on your boot and tells you to draw! You lost the initiative.";
        customOnSuccess = (player) => {
          const res = option.onSuccess(player);
          return {
            ...res,
            log: "💬 DE-ESCALATION SUCCESS: You talked your way out of it. Combat bypassed.",
            combatBonus: { bypassCombat: true, bonusMessage: "Walked Away!" }
          };
        };
        break;
      case "charisma_bluff_badge":
        name = "💬 Intimidate the Crowd";
        description = `Shout to the gathered townsfolk that the ${duelTarget} is corrupt, causing him to hesitate.`;
        successText = `Success! The crowd murmurs against him. The ${duelTarget} loses confidence and falters on the draw (-25% starting HP).`;
        failureText = `Failure! The crowd laughs at you. The ${duelTarget} gains confidence and draws fast!`;
        break;
      case "charisma_bribe_sentry":
        name = "💰 Offer a Heavy Bribe ($100)";
        description = `Subtly offer a heavy purse of gold to the ${duelTarget} to look the other way and end this.`;
        successText = `Success! The ${duelTarget} subtly accepts the bribe, ensuring the duel never happens. You can walk away.`;
        failureText = `Failure! The ${duelTarget} publicly shames your bribe attempt and fires at your boots!`;
        option.cost = { type: "gold", amount: 100 };
        customOnSuccess = (player) => {
          return {
            playerUpdates: { gold: Math.max(0, (player.gold || 0) - 100) },
            log: `💰 HEAVY BRIBE SUCCESS: The ${duelTarget} accepts the gold. Combat bypassed.`,
            combatBonus: { bypassCombat: true, bonusMessage: "Bribed Successfully!" }
          };
        };
        break;
      case "stealth_sabotage_mounts":
        name = "👣 Blind Him With Dust";
        description = "Discreetly kick up a small cloud of dust right as the clock strikes noon.";
        successText = "Success! He blinks and coughs, giving you a massive advantage (+1 Surprise Turn)!";
        failureText = "Failure! The wind blows the dust right back into your eyes!";
        break;
      case "stealth_poison_stewpot":
        name = "👣 Shift into the Sun's Glare";
        description = `Stealthily adjust your stance so the midday sun reflects directly into the ${duelTarget}'s eyes.`;
        successText = `Success! The ${duelTarget} is blinded by the glare! He starts disorganized (-30% HP).`;
        failureText = "Failure! You stumbled awkwardly and lost your balance before the draw!";
        break;
      case "stealth_plant_explosive":
        name = "👣 Reposition Behind Cover";
        description = "Quickly slip behind a nearby water trough just before the guns are drawn.";
        successText = `Success! You found solid cover just in time. The ${duelTarget} misses his first shots (+2 Surprise Turns)!`;
        failureText = "Failure! You tripped on a loose floorboard while trying to hide!";
        break;
      case "survival_forage_herbs":
        name = "🌿 Keep Your Heart Rate Low";
        description = "Focus on your breathing to maintain a perfectly steady hand during the high-stress standoff.";
        successText = "Success! Your iron nerves grant you superior reflexes, wounding him on the draw (-20% HP).";
        failureText = "Failure! The adrenaline hits too hard; your hands are shaking badly.";
        break;
      case "survival_wild_beast":
        name = "🌿 Assess His Injuries";
        description = `Analyze the ${duelTarget}'s posture to identify an old, unhealed wound to target.`;
        successText = "Success! You notice his bad left knee and target it instantly, crippling him (-30% HP)!";
        failureText = "Failure! You spend too long staring and miss the moment to draw!";
        break;
      case "survival_make_camp":
        name = "🌿 Apply Numbing Balm";
        description = "Quickly rub a strong medicinal salve onto your chest to ignore initial pain.";
        successText = "Success! You are prepared to take a hit. Your steady posture shakes him (+1 Surprise Turn).";
        failureText = "Failure! The salve burns your skin, distracting you completely!";
        break;
      case "perception_spot_snipers":
        name = "👁️ Read His Draw Tell";
        description = "Watch his fingers closely to anticipate the exact millisecond he goes for his iron.";
        successText = "Success! You perfectly predict his draw and react faster, forcing him back (-20% HP).";
        failureText = "Failure! He faked you out, and now you're behind on the draw!";
        break;
      case "perception_track_footprints":
        name = "👁️ Check His Holster";
        description = "Notice the worn leather on his holster to determine if his gun might snag.";
        successText = "Success! You realize his holster is stiff. You capitalize on his slow draw (+1 Surprise Turn).";
        failureText = "Failure! His draw is perfectly smooth, catching you off guard!";
        break;
      case "perception_study_terrain":
        name = "👁️ Gauge the Wind";
        description = "Account for the strong crosswind down the main street to ensure your first shot lands true.";
        successText = "Success! Your first shot is perfectly accurate, disarming his initial advantage (-25% HP).";
        failureText = "Failure! A sudden gust throws dust in your eyes as you draw!";
        break;
      case "marksman_warning_shot":
        name = "🤠 Flash a Trick Draw";
        description = "Perform a lightning-fast gun spin to intimidate him before the actual duel starts.";
        successText = "Success! The Sheriff is visibly shaken by your speed and hesitates (+2 Surprise Turns).";
        failureText = "Failure! You dropped your revolver in the dust! Embarrassing and fatal.";
        break;
      case "marksman_deadeye_aim":
        name = "🤠 Quick Draw: Shoot His Hat";
        description = "Draw incredibly fast and shoot the hat off his head to demoralize him completely.";
        successText = "Success! The Sheriff is stunned by the display of skill. He starts demoralized (-30% HP).";
        failureText = "Failure! You aimed too high and missed completely, wasting your first shot!";
        break;
      case "marksman_ambush_shot":
        name = "🤠 Fanning the Hammer";
        description = "Prepare to fan the hammer the moment the clock strikes, favoring sheer volume over accuracy.";
        successText = "Success! The barrage of bullets grazes him heavily before he can even aim (-35% HP)!";
        failureText = "Failure! Your gun jammed on the second shot, leaving you exposed!";
        break;
    }
  } else if (isSlipperyPete) {
    // Custom overrides for the Slippery Pete saloon/donkey tutorial encounter
    switch (option.id) {
      case "charisma_charm_sentry":
        name = "💬 Talk Sense to Drunk Pete";
        description = "Reason with Pete's drunken logic, telling him the 'stallion' is just the Mayor's prize donkey.";
        successText = "Success! Pete tearfully hugs you, sobbing about his 'beautiful stallion.' He starts combat completely disoriented and drops his guard!";
        failureText = "Failure! Pete calls you a donkey-thief and angrily flings a half-empty bottle of bourbon at your forehead!";
        break;
      case "charisma_bluff_badge":
        name = "💬 Fluster Pete with Authority";
        description = "Shout with absolute marshal authority, demanding he dismount the Mayor's donkey immediately.";
        successText = "Success! Pete panics under your authoritative glare, stumbling and weakening his stance (-25% starting HP)!";
        failureText = "Failure! Pete sneers, shouting that he's a sovereign citizen of the Mojave, and fumbles for his gun first!";
        break;
      case "charisma_bribe_sentry":
        name = "💰 Buy Pete Another Bourbon ($20)";
        description = "Offer to buy Pete another strong saloon drink to get him to pass out peacefully.";
        successText = "Success! Pete happily swallows the bourbon and immediately passes out! Pete starts combat severely dazed and off-guard.";
        failureText = "Failure! He took your gold, drank the bourbon, laughed, and shot at your boots anyway!";
        customOnSuccess = (player) => {
          const res = option.onSuccess(player);
          return {
            ...res,
            log: "💰 BOURBON SUCCESS: Pete passed out on the table! You can bypass combat completely.",
            combatBonus: { bypassCombat: true, bonusMessage: "Drunk & Passed Out!" }
          };
        };
        break;

      case "stealth_sabotage_mounts":
        name = "👣 Quietly Untie the Mayor's Donkey";
        description = "Sneak up behind Pete's stolen donkey to loose its saddle cinch, preventing Pete from escaping easily.";
        successText = "Success! You disabled his saddle rigs. Pete is disorganized and fails to react quickly (+1 turn of surprise)!";
        failureText = "Failure! The donkey brays loudly, alerting Pete who cornered you in the saloon!";
        break;
      case "stealth_poison_stewpot":
        name = "👣 Spike Pete's Drink with Sleep-Root";
        description = "Slip some bitter desert weed or sleeping sedative into Pete's half-empty bourbon glass.";
        successText = "Success! Pete drank the spiked bourbon. He starts combat severely dazed and weakened (-35% HP)!";
        failureText = "Failure! You were caught near his table. Pete threw his glass at you and drew his gun!";
        customOnSuccess = (player) => {
          const res = option.onSuccess(player);
          return {
            ...res,
            log: "🌿 SLEEP-ROOT SUCCESS: Pete collapses into a deep sleep! You can bypass combat completely.",
            combatBonus: { bypassCombat: true, bonusMessage: "Sedated!" }
          };
        };
        break;
      case "stealth_shadow_path":
        name = "👣 Sneak Behind Saloon Pillars";
        description = "Utilize the dark corners of the tavern to sneak up right behind Pete's barstool.";
        successText = "Success! You secured a flawless flank position right behind him. Gained 2 Surprise Turns!";
        failureText = "Failure! You tripped over a spittoon, alerting Pete who immediately turned and fired!";
        break;

      case "perception_spot_snipers":
        name = "👁️ Scan for Pete's Concealed Weapons";
        description = "Observe Pete's coat to spot if he's carrying any extra hidden derringers or knives.";
        successText = "Success! You spot a pocket pistol in his vest and kick it away before he can grab it. He's much less dangerous now!";
        failureText = "Failure! You got too close. Pete noticed you staring and drew a hidden revolver first!";
        break;
      case "perception_blind_spot":
        name = "👁️ Secure Sturdy Oak Table Cover";
        description = "Deduce the best angle to stand so you can dive behind a heavy mahogany table if lead flies.";
        successText = "Success! You position yourself next to a heavy bulletproof bar table, boosting your starting safety (+20 Temporary HP)!";
        failureText = "Failure! You miscalculated cover lines, starting the duel exposed near the glass window!";
        break;
      case "perception_footprint_stash":
        name = "👁️ Scavenge Lost Card-Table Chips";
        description = "Observe the saloon floor near the poker tables to find dropped gold coins or ammunition.";
        successText = "Success! You found a discarded pouch containing $15 gold and +12 rounds of ammo!";
        failureText = "Failure! You wasted time searching dirty floorboards and got pinched by a saloon rat (-8 HP)!";
        break;

      case "marksman_warning_shot":
        name = "🤠 Fire Bullet into the Saloon Piano";
        description = "Shatter the tavern's upright piano keyboard with a lightning-fast warning shot to terrify Pete.";
        successText = "Success! The deafening sound of your shot shatters his nerves. Pete is terrified and cowed!";
        failureText = "Failure! Your warning shot missed and angered the saloon owner, who threw a heavy glass at you!";
        break;
      case "marksman_chandelier_hazard":
        name = "🤠 Shoot the Kerosene Chandelier";
        description = "Aim and shoot the hanging kerosene chandelier chain right above Pete's head.";
        successText = "Success! Direct hit! The chandelier crashes down in flames, scorching Pete (-35% starting HP)!";
        failureText = "Failure! You missed the chain, and Pete immediately returned fire, hitting your shoulder!";
        break;
      case "marksman_disarm_boss":
        name = "🤠 Shoot the Colt out of Pete's Hand";
        description = "Exert peerless quick-draw skill: shoot Pete's rusty revolver right out of his drunken grip.";
        successText = "Success! Clang! Your lead shattered his gun grip. Pete starts combat heavily disarmed (-25% damage)!";
        failureText = "Failure! Your shot went wide, and you jammed your cylinder in the rush (-15% weapon condition)!";
        break;

      case "survival_herb_stimulant":
        name = "🌿 Down a Mug of Black Saloon Coffee";
        description = "Gulp down a scalding mug of strong black coffee from the counter to sharpen your reflexes.";
        successText = "Success! The caffeine rush fully restores your HP and hydration before the fight!";
        failureText = "Failure! The scalding coffee burned your mouth, causing extreme discomfort (-10 starting HP)!";
        break;
      case "survival_decoy_campfire":
        name = "🌿 Create a Decoy Mirror Reflection";
        description = "Position yourself near the saloon mirror to confuse Pete about your true position.";
        successText = "Success! Drunk Pete shot at your mirror reflection, allowing you to flank him (+1 Surprise Turn)!";
        failureText = "Failure! The glare of the mirror betrayed your position, and Pete shot you instead!";
        break;
      case "survival_wild_beast":
        name = "🌿 Spook the Mayor's Donkey";
        description = "Slap the Mayor's donkey to make it kick wildly right next to Pete.";
        successText = "Success! The braying donkey kicks Pete square in the ribs, dealing heavy initial damage (-30% starting HP)!";
        failureText = "Failure! The agitated donkey kicked you instead, sending you flying into a pile of whiskey crates (-12 HP)!";
        break;
    }
  } else if (isNestClearing) {
    // Custom overrides for the scorpion canyon/cave nest environment
    switch (option.id) {
      case "charisma_charm_sentry":
        name = "💬 Lure with Trail Jerky";
        description = "Toss some salted beef jerky to the scorpions to distract them and get them to lower their stingers.";
        successText = "Success! The scorpions scramble for the meat, allowing you to sneak up and gain surprise initiative!";
        failureText = "Failure! The scorpions ignore the meat and charge directly at you! Lost initiative.";
        break;
      case "charisma_bluff_badge":
        name = "💬 Wave a Blazing Pine Torch";
        description = "Sway a blazing fire torch to assert dominance and terrify the skittish cave arachnids.";
        successText = "Success! They scurry back from the flame. The scorpions are disorganized (-25% starting HP)!";
        failureText = "Failure! They are agitated by the smoke and lash out aggressively first!";
        break;
      case "charisma_bribe_sentry":
        name = "💰 Roll a High-Frequency Chime ($20)";
        description = "Toss a ringing metal bell to emit high frequency sound waves that confuse their sensory hairs.";
        successText = "Success! One of the scorpions runs off in panic, reducing the nest threat!";
        failureText = "Failure! The sound attracts them even more. They swarm your location first!";
        break;

      case "stealth_sabotage_mounts":
        name = "👣 Sabotage Their Crevice Exits";
        description = "Quietly roll large stones to block up the side crevices where backup scorpions could emerge.";
        successText = "Success! You block their exit lines. The scorpions are trapped and slow to respond (+1 turn of surprise)!";
        failureText = "Failure! A stone slips loudly, and a scorpion lashes out from the darkness!";
        break;
      case "stealth_poison_stewpot":
        name = "👣 Spray Corrosive Acid Weed";
        description = "Squeeze some toxic acid sap from desert bitter weeds directly into their nest pits.";
        successText = "Success! Several scorpions are burned by the caustic sap. They start severely weakened (-35% HP)!";
        failureText = "Failure! You got too close to the nest pit and were stung before you could retreat!";
        break;
      case "stealth_shadow_path":
        name = "👣 Scale the Canyon Crevice";
        description = "Use shadow crevices to climb onto a stone ledge right above the main scorpion nest.";
        successText = "Success! Flawless high-ground positioning! Gained 2 Surprise Turns!";
        failureText = "Failure! You slipped on loose shale, falling into their midst and starting combat injured!";
        break;

      case "perception_spot_snipers":
        name = "👁️ Scan for Camouflaged Stingers";
        description = "Audit the sand carefully to spot camouflaged sand scorpions before they strike.";
        successText = "Success! You spot a hidden sand scorpion and crush it before the battle begins. Nest size reduced!";
        failureText = "Failure! You missed them. A hidden scorpion struck you with a painful, surprising tail sting!";
        break;
      case "perception_blind_spot":
        name = "👁️ Locate the Dry Elevated Rock";
        description = "Find an elevated stone slab where the scorpions cannot easily climb to flank you.";
        successText = "Success! You secure an elevated stone redoubt, boosting your starting safety (+20 Temporary HP)!";
        failureText = "Failure! You stepped into a slippery pit, starting the fight pinned down and exposed!";
        break;
      case "perception_footprint_stash":
        name = "👁️ Inspect Bones of Previous Victims";
        description = "Search the skeletal remains of lost travelers in the nest for any remaining gold or ammo.";
        successText = "Success! You scavenged a small pouch with $15 gold and +12 rounds of ammo!";
        failureText = "Failure! A venomous desert centipede bit your finger as you searched (-8 HP)!";
        break;

      case "marksman_warning_shot":
        name = "🤠 Shoot the Cave Rock Formations";
        description = "Shoot a precise bullet into the ceiling's stalactites to send shards of rock raining down.";
        successText = "Success! The falling debris scares the scorpions, causing one of them to flee into a crack!";
        failureText = "Failure! Your bullet ricochets off the stone, sending rock chips into your face and alerting them!";
        break;
      case "marksman_chandelier_hazard":
        name = "🤠 Explode Kerosene Flask in Nest";
        description = "Throw a flask of kerosene into the center of the nest and ignite it with a swift, fiery gunshot.";
        successText = "Success! Direct hit! The fiery blast scorches the entire nest (-35% starting HP)!";
        failureText = "Failure! The flask shattered without igniting, and the noise drew their instant rage!";
        break;
      case "marksman_disarm_boss":
        name = "🤠 Shoot the Lead Scorpion's Tail";
        description = "Attempt an extremely high-skill shot to sever or disable the lead scorpion's venomous stinger.";
        successText = "Success! Clang! Your bullet breaks the stinger tip. Scorpions start combat with weakened damage (-25% damage)!";
        failureText = "Failure! Your shot misses the slender tail, and you jam your gun cylinder in the rush (-15% weapon condition)!";
        break;

      case "survival_herb_stimulant":
        name = "🌿 Apply Antivenom Root Salve";
        description = "Chew and apply protective snakeroot salve to inoculate your system against scorpion toxins.";
        successText = "Success! The antivenom fully heals your wounds and hydrates you before the battle!";
        failureText = "Failure! The root was stale and caused sudden stomach cramps (-10 starting HP)!";
        break;
      case "survival_decoy_campfire":
        name = "🌿 Throw a Burning Flares Decoy";
        description = "Throw a high-smoke sulfur flare to blind the heat-sensing organs of the scorpions.";
        successText = "Success! The scorpions strike blindly at the smoke, letting you flank them (+1 Surprise Turn)!";
        failureText = "Failure! The bright glare backfired, illuminating your position and drawing their attack!";
        break;
      case "survival_wild_beast":
        name = "🌿 Agitate a Sidewinder Rattlesnake";
        description = "Poke a nearby sidewinder rattlesnake to provoke it into attacking the scorpions instead.";
        successText = "Success! The venomous snake fights the scorpions, severely weakening their HP (-30% starting HP)!";
        failureText = "Failure! The agitated rattlesnake turned and bit you, injecting painful poison (-12 HP)!";
        break;
    }
  } else if (isBankRobbery) {
    // Custom overrides for Bank Robberies
    switch (option.id) {
      case "charisma_charm_sentry":
        name = "💬 Intimidate the Bank Teller";
        description = "Slam your fist on the counter and order the teller to open the vault quietly.";
        successText = "Success! The terrified teller complies and throws the vault open! You catch the guards off guard (+1 Surprise Turn).";
        failureText = "Failure! The teller panics and hits the silent alarm! Guards rush out immediately!";
        break;
      case "charisma_bluff_badge":
        name = "💬 Bluff as an Inspector";
        description = "Wave a fake inspector badge and demand to check the vault's security protocols.";
        successText = "Success! The confused guards let you into the back room, giving you perfect positioning!";
        failureText = "Failure! The manager recognizes you from a wanted poster and shouts for the guards!";
        break;
      case "charisma_bribe_sentry":
        name = "💰 Bribe the Vault Guard ($20)";
        description = "Slide a gold coin to the bored guard and tell him to take a lunch break.";
        successText = "Success! The guard pockets the coin and walks out. One less gun to worry about!";
        failureText = "Failure! The honest guard refuses the bribe and readies his shotgun!";
        break;
      case "stealth_sabotage_mounts":
        name = "👣 Sabotage the Telegraph Line";
        description = "Sneak to the back alley and cut the telegraph wires to prevent them from calling the sheriff.";
        successText = "Success! Reinforcements are delayed! Enemies start disorganized and weakened (-20% HP).";
        failureText = "Failure! You shocked yourself on the wire and made a loud noise (-10 HP)!";
        break;
      case "stealth_poison_stewpot":
        name = "👣 Lock the Front Doors";
        description = "Quietly slide the heavy iron bolt on the main entrance to trap the guards inside with you.";
        successText = "Success! The guards are trapped and panic! They suffer a severe morale penalty (-30% HP).";
        failureText = "Failure! The heavy bolt squeaks loudly, alerting the entire bank to your presence!";
        break;
      case "perception_spot_snipers":
        name = "👁️ Spot the Balcony Guard";
        description = "Scan the second-floor mezzanine for hidden guards before drawing your weapon.";
        successText = "Success! You spot a sniper on the balcony and force him into cover. He's much less dangerous now!";
        failureText = "Failure! The balcony guard spotted you staring and took a potshot at your hat!";
        break;
      case "marksman_warning_shot":
        name = "🤠 Shoot the Ceiling Plaster";
        description = "Fire a deafening shot into the ceiling to establish dominance and clear the lobby.";
        successText = "Success! Civilians flee and the guards dive for cover! You gain massive tactical advantage (+2 Surprise Turns).";
        failureText = "Failure! Your shot went wide and hit the reinforced vault, ricocheting back (-15 HP)!";
        break;
    }
  } else if (numEnemies === 1) {
    // If it is any general 1-on-1 encounter, refine plural words to singular
    name = name.replace("Lookout", "Sentry").replace("Sentry", "Guard").replace("Watchman", "Guard");
    description = description
      .replace("lookouts", "lone guard")
      .replace("sentries", "guard")
      .replace("the camp", "their hideout")
      .replace("foes", "target")
      .replace("outlaws", "outlaw")
      .replace("enemies", "the target")
      .replace("hostiles", "the target");
    successText = successText
      .replace("sentries", "guard")
      .replace("watchmen", "guard")
      .replace("foes", "target")
      .replace("outlaws", "outlaw")
      .replace("enemies", "the target")
      .replace("hostiles", "the target");
    failureText = failureText
      .replace("sentries", "guard")
      .replace("watchmen", "guard")
      .replace("foes", "target")
      .replace("outlaws", "outlaw")
      .replace("enemies", "the target")
      .replace("hostiles", "the target");
  }

  return {
    ...option,
    name,
    description,
    successText,
    failureText,
    onSuccess: customOnSuccess,
    onFailure: customOnFailure
  };
}

// Generate 2 random standoff options from the master list (never from the same skill branch)
export function generateInteractiveStandoffOptions(
  isSlipperyPete?: boolean,
  isNestClearing?: boolean,
  numEnemies?: number,
  isBankRobbery?: boolean,
  isSheriffDuel?: boolean,
  isBossDuel?: boolean
): StandoffOption[] {
  const shuffled = [...ALL_STANDOFF_OPTIONS].sort(() => 0.5 - Math.random());
  const selected: StandoffOption[] = [];
  const selectedSkills = new Set<string>();

  for (const option of shuffled) {
    if (!selectedSkills.has(option.skill)) {
      const contextual = getContextualOption(option, isSlipperyPete, isNestClearing, numEnemies, isBankRobbery, isSheriffDuel, isBossDuel);
      selected.push(contextual);
      selectedSkills.add(option.skill);
    }
    if (selected.length >= 2) break;
  }

  return selected;
}
