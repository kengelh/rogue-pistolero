import { Location, LocationType, Mission, ShopItem, Weapon, Player } from '../types';
import { generateEconomyProfile } from './trade';

const TOWN_PREFIXES = [
  'Gallows', 'Dusty', 'Red', 'Silver', 'Tombstone', 'Dead', 'Whiskey', 'Coyote', 
  'Snake', 'Buffalo', 'Rattlesnake', 'Golden', 'Iron', 'Dry', 'Lone', 'Bleak'
];

const TOWN_SUFFIXES = [
  'Gulch', 'Ridge', 'Flat', 'Canyon', 'Springs', 'Wood', 'Lode', 'Pass', 
  'Gap', 'Butte', 'Creek', 'Hills', 'Flats', 'Basin', 'Gravel', 'Vapor'
];

const OUTLAW_FIRST_NAMES = [
  'Jesse', 'Billy', 'Bart', 'Butch', 'Sundance', 'Cole', 'Deadeye', 'Calamity', 
  'Ringo', 'Mad Dog', 'One-Eyed', 'Quickdraw', 'Silas', 'Clay', 'Doc', 'Wyatt'
];

const OUTLAW_LAST_NAMES = [
  'James', 'the Kid', 'Kerr', 'Cassidy', 'Younger', 'Starr', 'Plummer', 'Dalton', 
  'Miller', 'Holliday', 'Earp', 'Hardin', 'Clanton', 'McLaury', 'Red', 'Vane'
];

export function generateLocationName(type: LocationType): string {
  if (type === 'ghost_town') {
    const list = ['Ashes Drop', 'Grave Creek', 'Purgatory Valley', 'Coffin Hill', 'Bone Dry Pass', 'Whispering Sands'];
    return list[Math.floor(Math.random() * list.length)];
  }
  if (type === 'mine') {
    const list = ['Lost Dutchman Mine', 'Crimson Silt Shaft', 'Gold Fever Pit', 'Iron Lobe Diggings', 'Grizzly Mine', 'Sulfur Creek Cut'];
    return list[Math.floor(Math.random() * list.length)];
  }
  if (type === 'desert_oasis') {
    const list = ['Aqua Fria', 'Oasis Springs', 'Mirage Wells', 'Green Palm', 'Hidden Springs'];
    return list[Math.floor(Math.random() * list.length)];
  }
  if (type === 'hostile_camp') {
    const list = ["Bandit's Roost", 'Red Gang Hideout', 'Scorpion Nest', 'Gila Bend', 'Dead End Canyon'];
    return list[Math.floor(Math.random() * list.length)];
  }
  if (type === 'ranch') {
    const list = ['Twin Pines Ranch', 'Iron Horse Pasture', 'Big Valley Homestead', 'Dry River Ranch', 'Lone Oak Property'];
    return list[Math.floor(Math.random() * list.length)];
  }
  if (type === 'cavalry_fort') {
    const list = ['Fort Defiance', 'Fort Custer', 'Garrison Point', 'Outpost Liberty', 'Camp Bravo'];
    return list[Math.floor(Math.random() * list.length)];
  }
  if (type === 'native_settlement') {
    const list = ['Tall Pines Village', 'Red Earth Settlement', 'Whispering River Camp', 'Running Water Village', 'Eagle Valley Camp'];
    return list[Math.floor(Math.random() * list.length)];
  }
  
  const pref = TOWN_PREFIXES[Math.floor(Math.random() * TOWN_PREFIXES.length)];
  const suff = TOWN_SUFFIXES[Math.floor(Math.random() * TOWN_SUFFIXES.length)];
  return `${pref} ${suff}`;
}

export function generateOutlawName(): string {
  const first = OUTLAW_FIRST_NAMES[Math.floor(Math.random() * OUTLAW_FIRST_NAMES.length)];
  const last = OUTLAW_LAST_NAMES[Math.floor(Math.random() * OUTLAW_LAST_NAMES.length)];
  return `${first} ${last}`;
}

const WEAPON_POOL = [
  { name: 'Rusty Revolver', dmg: 10, range: 4, maxClip: 6, value: 50, ammoType: 'pistol' as const },
  { name: 'Colt Single Action Army', dmg: 18, range: 5, maxClip: 6, value: 150, ammoType: 'pistol' as const },
  { name: 'Smith & Wesson Schofield', dmg: 24, range: 4, maxClip: 6, value: 240, ammoType: 'pistol' as const },
  { name: 'Winchester Repeating Rifle', dmg: 32, range: 8, maxClip: 10, value: 450, ammoType: 'rifle' as const },
  { name: 'Double Barrel Shotgun', dmg: 45, range: 3, maxClip: 2, value: 350, ammoType: 'shotgun' as const },
  { name: 'Peacemaker Special', dmg: 38, range: 6, maxClip: 6, value: 600, ammoType: 'pistol' as const }
];

export function getBaseProsperityAndFaction(type: LocationType): { prosperity: number, controllingFaction: 'lawmen' | 'outlaws' | 'tribes' | 'neutral' } {
  switch (type) {
    case 'boomtown':
    case 'railway_hub':
    case 'cavalry_fort':
      return { prosperity: Math.floor(70 + Math.random() * 30), controllingFaction: 'lawmen' };
    case 'outlaw_haven':
    case 'hostile_camp':
      return { prosperity: Math.floor(30 + Math.random() * 40), controllingFaction: 'outlaws' };
    case 'ranch':
      return { prosperity: Math.floor(40 + Math.random() * 30), controllingFaction: 'neutral' };
    case 'desert_oasis':
    case 'native_settlement':
      return { prosperity: Math.floor(40 + Math.random() * 30), controllingFaction: 'tribes' };
    case 'mine':
      return { prosperity: Math.floor(50 + Math.random() * 30), controllingFaction: 'neutral' };
    case 'ghost_town':
    default:
      return { prosperity: Math.floor(Math.random() * 20), controllingFaction: 'neutral' };
  }
}

export function generateShop(type: LocationType, risk: number, prosperity: number = 50, controllingFaction: 'lawmen' | 'outlaws' | 'tribes' | 'neutral' = 'neutral'): ShopItem[] {
  // Base shop items available anywhere
  const shop: ShopItem[] = [
    { id: 'canteen', name: 'Trail Canteen (Water)', type: 'consumable', cost: 5, details: 'Hydration essential. Provides multiple swigs of water to stave off dehydration on the overland map. (Weight: 2 lbs)' },
    { id: 'whiskey', name: 'Premium Whiskey', type: 'consumable', cost: 20, details: 'Restores 25 HP. (Weight: 1 lb)' },
    { id: 'ammo_pistol', name: 'Box of .45 Colt (Pistol)', type: 'consumable', cost: 10, details: 'Pistol ammunition. Adds 12 shots. (Weight: 1 lb)' },
    { id: 'ammo_rifle', name: 'Box of .44-40 (Rifle)', type: 'consumable', cost: 20, details: 'Rifle ammunition. Adds 10 shots. (Weight: 2 lbs)' },
    { id: 'ammo_shotgun', name: 'Box of 12 Gauge (Shotgun)', type: 'consumable', cost: 25, details: 'Shotgun shells. Adds 8 shots. (Weight: 2 lbs)' },
    { id: 'bandage', name: 'Clean Bandage', type: 'consumable', cost: 10, details: 'Restores 35 HP on use. Crucial for stemming arterial bleeding. (Weight: 0.5 lbs)' },
  ];

  // High prosperity items
  if (prosperity > 50) {
    shop.push({ id: 'elixir', name: 'Snake Oil Elixir', type: 'consumable', cost: 40, details: 'Heals 50 HP immediately. (Weight: 1 lb)' });
    shop.push({ id: 'tourniquet', name: 'Field Tourniquet', type: 'consumable', cost: 15, details: 'Instantly curbs catastrophic limb bleeding. Caps integrity loss. (Weight: 0.2 lbs)' });
    shop.push({ id: 'gunpowder', name: 'Gunpowder Jar', type: 'consumable', cost: 12, details: 'Crafting ingredient. Fine black powder to increase cartridge force. (Weight: 1.5 lbs)' });
    shop.push({ id: 'glass_scope', name: 'Polished Lead Lens', type: 'consumable', cost: 45, details: 'Crafting ingredient. Magnifies targets for precision snipers. (Weight: 1 lb)' });
    shop.push({ id: 'safe_springs', name: 'Coiled Steel Springs', type: 'consumable', cost: 15, details: 'Crafting ingredient. Fine wound steel to quicken weapon action clips. (Weight: 0.5 lbs)' });
  }

  // Add exactly ONE Mount based on prosperity
  const possibleMounts = [];
  if (prosperity >= 0) {
    possibleMounts.push({ id: 'mount_donkey', name: '🫏 Stubborn Donkey', type: 'consumable', cost: 150, details: 'Very slow (1.3x speed). Better than walking, but barely. (Weight: 0 lbs)' });
  }
  if (prosperity > 20) {
    possibleMounts.push({ id: 'mount_mule', name: '🐴 Pack Mule', type: 'consumable', cost: 350, details: 'Reliable mixed breed (1.7x speed). Good for long hauls. (Weight: 0 lbs)' });
  }
  if (prosperity > 40) {
    possibleMounts.push({ id: 'mount_regular_horse', name: '🐴 Quarter Horse', type: 'consumable', cost: 750, details: 'Standard frontier horse (2.1x speed). Fast and loyal. (Weight: 0 lbs)' });
  }
  if (prosperity > 60) {
    possibleMounts.push({ id: 'mount_post_horse', name: '🐴 Post Relay Horse', type: 'consumable', cost: 1400, details: 'Rested and bred for deep overland travel (2.5x speed). (Weight: 0 lbs)' });
  }
  if (prosperity > 80) {
    possibleMounts.push({ id: 'mount_thoroughbred', name: '🐎 Kentucky Thoroughbred', type: 'consumable', cost: 2800, details: 'The fastest breed in the west (3.0x speed). Blistering pace! (Weight: 0 lbs)' });
  }

  if (possibleMounts.length > 0) {
    // Pick the best available mount, or randomly one of the top two? Let's just pick randomly from available, biased towards better
    shop.push(possibleMounts[Math.floor(Math.random() * possibleMounts.length)]);
  }

  // Gunsmith pristine parts if high prosperity
  if (prosperity > 60) {
     const PART_TYPES = ['barrel', 'cylinder', 'action', 'stock'];
     const pType = PART_TYPES[Math.floor(Math.random() * PART_TYPES.length)];
     let perkObj: any = { accuracyBonus: 10, description: '+10% Accuracy' };
     if (pType === 'cylinder') perkObj = { maxClipBonus: 2, description: '+2 Max Clip' };
     if (pType === 'stock') perkObj = { dmgBonus: 4, description: '+4 Damage' };
     if (pType === 'action') perkObj = { apCostReduction: 1, description: '-1 AP Cost' };
     
     shop.push({
       id: `pristine_${pType}_shop_${Math.random()}`,
       name: `Pristine ${pType.charAt(0).toUpperCase() + pType.slice(1)} (Factory Grade)`,
       type: 'weapon_part' as const,
       cost: 350,
       details: `Premium gunsmith ${pType}. Can be slotted onto sidearm at the workbench. (Weight: 2.5 lbs)`,
       partStats: {
          condition: 100,
          type: pType as 'barrel' | 'cylinder' | 'action' | 'stock',
          perks: [perkObj]
       }
     });
  }

  // Add random weapon based on risk and prosperity
  const availableWeapons = WEAPON_POOL.filter(w => {
    if (prosperity < 30) return w.value <= 150;
    if (prosperity < 60) return w.value <= 350;
    return true;
  });

  if (availableWeapons.length > 0) {
    const numWeaps = Math.random() > 0.5 ? 2 : 1;
    for (let i = 0; i < numWeaps; i++) {
      const w = availableWeapons[Math.floor(Math.random() * availableWeapons.length)];
      const modifierRoll = Math.random();
      let modName = "";
      let dmgMod = 0;
      let rangeMod = 0;
      let clipMod = 0;
      let costMult = 2.5; // Gold Sink baseline
      
      // Prosperity effects masterwork chance
      const masterWorkChance = prosperity / 100 * 0.3; // Up to 30% chance for masterwork at 100 prosperity
      
      if (modifierRoll > (1 - masterWorkChance)) {
        modName = "Masterwork ";
        dmgMod = 12;
        rangeMod = 1;
        clipMod = 1;
        costMult = 6.0; // Extreme Gold Sink for masterwork
      } else if (modifierRoll < 0.25 || prosperity < 30) { // low prosperity guarantees rusty
        modName = "Rusty ";
        dmgMod = -8;
        rangeMod = 0;
        clipMod = 0;
        costMult = 1.0; // Rusty is normal baseline
      }
      
      const finalName = `${modName}${w.name}`;

      if (!shop.some(item => item.name === finalName)) {
        shop.push({
          id: `wpn_${finalName.toLowerCase().replace(/ /g, '_')}`,
          name: finalName,
          type: 'weapon',
          cost: Math.round(w.value * (1 + risk * 0.4) * costMult),
          details: `Damage: ${w.dmg + dmgMod}, Range: ${w.range + rangeMod}, Clip: ${w.maxClip + clipMod}`,
          weaponStats: {
            dmg: w.dmg + dmgMod,
            range: w.range + rangeMod,
            maxClip: w.maxClip + clipMod
          }
        });
      }
    }
  }

  // Faction specific items
  if (controllingFaction === 'outlaws') {
    shop.push({ id: 'dynamite', name: 'Stick of Dynamite (Contraband)', type: 'consumable', cost: Math.round(250 * (Math.random() * 0.5 + 0.8)), details: 'Deals 60 explosive damage to a group.' });
    shop.push({ id: 'lockpick', name: 'Skeleton Keys (Contraband)', type: 'consumable', cost: Math.round(30 * (Math.random() * 0.5 + 0.8)), details: 'Assists in opening bank vault quietly.' });
    
    // Adjust shop prices to be erratic
    shop.forEach(item => {
      item.cost = Math.round(item.cost * (Math.random() * 0.8 + 0.6));
    });
  } else if (controllingFaction === 'lawmen') {
    // Lawmen towns regularize prices and maybe sell badges or better armor if we added it, but let's just make prices stable
  }

  if (type === 'ghost_town' || type === 'hostile_camp') {
    shop.push({ id: 'ancient_relic', name: 'Apache Thunderbird Relic', type: 'value', cost: 350, details: 'A legendary sacred artifact belonging to the spirits of the canyon. (Can be held or sold)' });
  }

  return shop;
}

import { instantiateStorylineQuest } from './storylines';

export function generateMissionsForLocation(originId: string, locations: Location[]): Mission[] {
  const missions: Mission[] = [];
  const targetPool = locations.filter(loc => loc.id !== originId);
  const originLoc = locations.find(loc => loc.id === originId);
  if (targetPool.length === 0 || !originLoc) return [];

  // Story Starters: randomly roll to add a storyline starter here
  if (Math.random() < 0.25) {
    const storyQuest = instantiateStorylineQuest('generate_act_1', locations, originId);
    if (storyQuest) missions.push(storyQuest);
  }

  // Cavalry Fort Quests
  if (originLoc.type === 'cavalry_fort') {
    const deserterTargetLoc = targetPool[Math.floor(Math.random() * targetPool.length)];
    const deserter = generateOutlawName();
    missions.push({
      id: `mission_deserter_${Math.random().toString(36).substr(2, 5)}`,
      title: `Retrieve Deserter: Private ${deserter}`,
      type: 'bounty',
      targetName: deserter,
      targetLevel: Math.floor(2 + Math.random() * 4),
      rewardGold: 150,
      rewardXp: 120,
      reputationChange: 20,
      danger: 'medium',
      description: `The Fort Commander requires you to track down Private ${deserter}, who deserted his post. Last seen near ${deserterTargetLoc.name}.`,
      originLocationId: originId,
      targetLocationId: deserterTargetLoc.id
    });
    
    const escortTargetLoc = targetPool.find(l => l.type === 'boomtown' || l.type === 'railway_hub' || l.type === 'mine') || targetPool[0];
    missions.push({
      id: `mission_supply_${Math.random().toString(36).substr(2, 5)}`,
      title: `Military Supply Run to ${escortTargetLoc.name}`,
      type: 'escort',
      targetName: 'Supply Marauders',
      rewardGold: 220,
      rewardXp: 150,
      reputationChange: 15,
      danger: 'high',
      description: `Escort a military supply wagon loaded with munitions to ${escortTargetLoc.name}. Hostiles are likely to ambush.`,
      originLocationId: originId,
      targetLocationId: escortTargetLoc.id
    });
  }

  // Native Settlement Quests
  if (originLoc.type === 'native_settlement') {
    const sacredLoc = targetPool.find(l => l.type === 'ghost_town' || l.type === 'hostile_camp' || l.type === 'mine') || targetPool[0];
    missions.push({
      id: `mission_scavenge_native_${Math.random().toString(36).substr(2, 5)}`,
      title: `Reclaim Stolen Heirlooms from ${sacredLoc.name}`,
      type: 'scavenge',
      targetName: 'Tomb Robbers',
      rewardGold: 100,
      rewardXp: 200,
      reputationChange: 30, // Big Tribes rep
      danger: 'high',
      description: `Sacred heirlooms were taken by grave robbers who fled to ${sacredLoc.name}. Return them to the village elders.`,
      originLocationId: originId,
      targetLocationId: sacredLoc.id
    });
    
    const diplomaticTargetLoc = targetPool.find(l => l.type === 'boomtown' || l.type === 'cavalry_fort') || targetPool[0];
    missions.push({
      id: `mission_diplo_native_${Math.random().toString(36).substr(2, 5)}`,
      title: `Deliver Treaty Terms to ${diplomaticTargetLoc.name}`,
      type: 'diplomacy',
      targetName: 'Town Officials',
      rewardGold: 150,
      rewardXp: 150,
      reputationChange: 25,
      danger: 'low',
      description: `The elders wish to establish trade and peace. Deliver their treaty terms safely to the leadership in ${diplomaticTargetLoc.name}.`,
      originLocationId: originId,
      targetLocationId: diplomaticTargetLoc.id,
      stage: 1,
      maxStages: 1,
      stageTargets: [diplomaticTargetLoc.id],
      stageInstructions: [`Ride to ${diplomaticTargetLoc.name} and speak with the leadership.`]
    });
  }

  // Bounty Hunt Mission
  const bountyTargetLoc = targetPool[Math.floor(Math.random() * targetPool.length)];
  const outlaw = bountyTargetLoc.leaderName && Math.random() > 0.5 ? bountyTargetLoc.leaderName : generateOutlawName();
  const targetLevel = Math.max(1, Math.round(1 + bountyTargetLoc.risk * 16 + Math.random() * 4));
  const calculatedBountyReward = Math.round(targetLevel * 10 + Math.pow(targetLevel, 1.5) * 1.5 + 10);

  missions.push({
    id: `mission_bounty_${Math.random().toString(36).substr(2, 5)}`,
    title: `Bounty Hunt: ${outlaw} (Lvl ${targetLevel})`,
    type: 'bounty',
    targetName: outlaw,
    targetLevel: targetLevel,
    rewardGold: calculatedBountyReward,
    rewardXp: Math.round(50 + targetLevel * 10),
    reputationChange: 15,
    danger: targetLevel < 5 ? 'low' : targetLevel < 12 ? 'medium' : targetLevel < 18 ? 'high' : 'deadly',
    description: `The Sheriff is offering a reward for bringing in ${outlaw} (Level ${targetLevel}) dead or alive. Last spotted hiding out in the vicinity of ${bountyTargetLoc.name}.`,
    originLocationId: originId,
    targetLocationId: bountyTargetLoc.id
  });

  // Bank Robbery Mission
  const robberyTargetLoc = targetPool.filter(loc => loc.type === 'boomtown' || loc.type === 'railway_hub')[0] || targetPool[0];
  missions.push({
    id: `mission_robbery_${Math.random().toString(36).substr(2, 5)}`,
    title: `Bank Heist at ${robberyTargetLoc.name}`,
    type: 'robbery',
    targetName: 'Bank Teller & Guards',
    rewardGold: Math.round(300 + Math.random() * 200 + robberyTargetLoc.risk * 300),
    rewardXp: Math.round(80 + robberyTargetLoc.risk * 100),
    reputationChange: -25,
    danger: robberyTargetLoc.risk < 0.4 ? 'medium' : robberyTargetLoc.risk < 0.75 ? 'high' : 'deadly',
    description: `Crack the vault at the bank in ${robberyTargetLoc.name}. Beware! The local deputies are highly armed and robbing them will severely damage your local legal standing.`,
    originLocationId: originId,
    targetLocationId: robberyTargetLoc.id
  });

  // Clear Infestation (Desert or Ghost Town)
  const nestLoc = targetPool.find(l => l.type === 'desert_oasis' || l.type === 'ghost_town') || targetPool[0];
  missions.push({
    id: `mission_nest_${Math.random().toString(36).substr(2, 5)}`,
    title: `Clear Scorpion Nest at ${nestLoc.name}`,
    type: 'nest_clearing',
    targetName: 'Alpha Emperor Scorpion',
    rewardGold: Math.round(100 + Math.random() * 100 + nestLoc.risk * 150),
    rewardXp: Math.round(50 + nestLoc.risk * 80),
    reputationChange: 10,
    danger: nestLoc.risk < 0.4 ? 'low' : nestLoc.risk < 0.7 ? 'medium' : 'high',
    description: `Giant scorpions are threatening water sources in ${nestLoc.name}. Ride out and clear them to allow travelers safe passage.`,
    originLocationId: originId,
    targetLocationId: nestLoc.id
  });

  // Settler Wagon Escort
  const escortTargetLoc = targetPool.find(l => l.type === 'boomtown' || l.type === 'railway_hub') || targetPool[0];
  missions.push({
    id: `mission_escort_${Math.random().toString(36).substr(2, 5)}`,
    title: `Escort Settler Wagon to ${escortTargetLoc.name}`,
    type: 'escort',
    targetName: 'Caravan Marauders',
    rewardGold: Math.round(180 + Math.random() * 120 + escortTargetLoc.risk * 200),
    rewardXp: Math.round(70 + escortTargetLoc.risk * 90),
    reputationChange: 15, // positive Lawmen & Native Tribes
    danger: escortTargetLoc.risk < 0.35 ? 'low' : escortTargetLoc.risk < 0.7 ? 'medium' : 'high',
    description: `Protect a family of pioneer settlers driving their covered wagon through dangerous territories to ${escortTargetLoc.name}. Outlaw gangs plan an ambush.`,
    originLocationId: originId,
    targetLocationId: escortTargetLoc.id
  });

  // Native Tribe Sacred Relic Salvage
  const sacredLoc = targetPool.find(l => l.type === 'ghost_town' || l.type === 'hostile_camp') || targetPool[0];
  missions.push({
    id: `mission_scavenge_${Math.random().toString(36).substr(2, 5)}`,
    title: `Recover Apache Relics from ${sacredLoc.name}`,
    type: 'scavenge',
    targetName: 'Desecrator Gang',
    rewardGold: Math.round(130 + Math.random() * 140),
    rewardXp: Math.round(90 + sacredLoc.risk * 100),
    reputationChange: 20, // +20 Tribes rep
    danger: sacredLoc.risk < 0.5 ? 'medium' : sacredLoc.risk < 0.8 ? 'high' : 'deadly',
    description: `A sacred turquoise talisman was stolen by graverobbers camped in ${sacredLoc.name}. Retrieve it to earn high favor with the local native scouts.`,
    originLocationId: originId,
    targetLocationId: sacredLoc.id
  });

  // Myth Quest (Procedural Multi-Stage Investigation)
  const townsPool = targetPool.filter(l => l.type === 'boomtown' || l.type === 'railway_hub');
  const wildernessPool = targetPool.filter(l => l.type === 'desert_oasis' || l.type === 'ghost_town' || l.type === 'outlaw_haven' || l.type === 'hostile_camp');

  const m1 = townsPool[0] || targetPool[0];
  const m2 = townsPool[1] || targetPool[Math.min(1, targetPool.length - 1)];
  const m3 = wildernessPool[0] || targetPool[Math.min(2, targetPool.length - 1)];

  missions.push({
    id: `mission_myth_${Math.random().toString(36).substr(2, 5)}`,
    title: "The Myth of the Dutchman's Gold",
    type: "myth",
    targetName: "Lost Dutchman's Mine",
    rewardGold: 500,
    rewardXp: 300,
    reputationChange: 15,
    danger: "medium",
    description: "Search for the legendary Lost Dutchman's Gold. Gather maps from archives, decode symbols with local scholars, and excavate the hidden cave.",
    originLocationId: originId,
    targetLocationId: m1.id,
    stage: 1,
    maxStages: 3,
    stageTargets: [m1.id, m2.id, m3.id],
    stageInstructions: [
      `Search town archives in ${m1.name} to locate early cartography drawings of the Superstition Range.`,
      `Decode ancient map markings with a well-traveled scholar or barkeep in ${m2.name}.`,
      `Locate and unseal the hidden gold cave coordinates at ${m3.name}.`
    ]
  });

  // Diplomacy Quest (Procedural Multi-Stage Mediation)
  const d1 = wildernessPool[1] || targetPool[Math.min(3, targetPool.length - 1)];
  const d2 = townsPool[2] || targetPool[Math.min(4, targetPool.length - 1)];
  const d3 = townsPool[3] || targetPool[Math.min(5, targetPool.length - 1)];

  missions.push({
    id: `mission_diplo_${Math.random().toString(36).substr(2, 5)}`,
    title: "Treaty of the Painted Canyon",
    type: "diplomacy",
    targetName: "Chief Red Cloud",
    rewardGold: 400,
    rewardXp: 250,
    reputationChange: 35,
    danger: "low",
    description: "Tensions are rising between the railway expansionists and Apache clans. Mediate a peace treaty to avoid bloodshed across the territory.",
    originLocationId: originId,
    targetLocationId: d1.id,
    stage: 1,
    maxStages: 3,
    stageTargets: [d1.id, d2.id, d3.id],
    stageInstructions: [
      `Deliver fresh supplies and goodwill gestures to Chief Red Cloud's delegation at ${d1.name}.`,
      `Negotiate boundary deeds with the land bureau and local sheriff in ${d2.name}.`,
      `Ferry the formal agreements back to the commissioners in ${d3.name} to seal the peace.`
    ]
  });

  return missions;
}

export function generateWorldMap(): Location[] {
  const locations: Location[] = [];
  // Generate 16 varied points
  const types: LocationType[] = [
    'boomtown',      // 0
    'boomtown',      // 1
    'railway_hub',   // 2
    'railway_hub',   // 3
    'outlaw_haven',  // 4
    'outlaw_haven',  // 5
    'ghost_town',    // 6
    'ghost_town',    // 7
    'desert_oasis',  // 8
    'native_settlement', // 9
    'hostile_camp',  // 10
    'hostile_camp',  // 11
    'mine',          // 12
    'mine',          // 13
    'ranch',         // 14
    'cavalry_fort'   // 15
  ];

  // Distribute positions properly across a 100x100 grid with minimum separation
  const positions: {x: number, y: number}[] = [];
  
  types.forEach((type, idx) => {
    let x = 0;
    let y = 0;
    let valid = false;
    let attempts = 0;

    while (!valid && attempts < 100) {
      x = Math.round(10 + Math.random() * 80);
      y = Math.round(10 + Math.random() * 80);
      valid = true;
      attempts++;

      // Enforce minimum coordinate separation helper
      for (const pos of positions) {
        const dist = Math.hypot(pos.x - x, pos.y - y);
        if (dist < 18) { // Increased separation so locations are further apart initially
          valid = false;
          break;
        }
      }
    }
    positions.push({ x, y });

    // Derive attributes based on type
    let risk = 0.1;
    let description = '';
    let bankGold = 0;
    let bankGuards = 0;
    let hasTrain = false;

    switch (type) {
      case 'boomtown':
        risk = 0.15 + Math.random() * 0.15;
        description = 'A growing frontier settlement powered by miners and cattle trade. Well policed by deputies.';
        bankGold = Math.round(400 + Math.random() * 300);
        bankGuards = 2;
        break;
      case 'railway_hub':
        risk = 0.1 + Math.random() * 0.15;
        description = 'A crucial transport depot where rails meet. Connects long distance travel seamlessly.';
        bankGold = Math.round(700 + Math.random() * 400);
        bankGuards = 3;
        hasTrain = true;
        break;
      case 'outlaw_haven':
        risk = 0.5 + Math.random() * 0.25;
        description = 'An ungoverned settlement hidden in the badlands. Refuge for robbers, gamblers, and hired guns.';
        bankGold = Math.round(200 + Math.random() * 150);
        bankGuards = 1;
        break;
      case 'ghost_town':
        risk = 0.7 + Math.random() * 0.25;
        description = 'An abandoned mining claim decaying under the hot sun. Rumored to hold forgotten treasure chest vaults, but overrun by deadly gang squatters.';
        bankGold = Math.round(1000 + Math.random() * 800);
        bankGuards = 4; // heavily hoarded by bandits
        break;
      case 'mine':
        risk = 0.6 + Math.random() * 0.3;
        description = 'An abandoned underground mine shaft with deep dark corridors. Supposed to hold leftover gold veins, guarded intensely by hostile sentries.';
        bankGold = Math.round(1200 + Math.random() * 1000); // Mines have high gold yields!
        bankGuards = 3; 
        break;
      case 'desert_oasis':
        risk = 0.3 + Math.random() * 0.3;
        description = 'A rare oasis in the Scorching Flats. Offers safe, free pure drinking water, though dangerous scorpions nest nearby.';
        bankGold = 0;
        bankGuards = 0;
        break;
      case 'hostile_camp':
        risk = 0.6 + Math.random() * 0.3;
        description = 'A temporary bivouac populated by hostile gangs. High risk, ambush central.';
        bankGold = 0;
        bankGuards = 0;
        break;
      case 'ranch':
        risk = 0.2 + Math.random() * 0.2;
        description = 'A pioneer homestead ranch with grazing pastures. Often targeted by scuttling thieves or wild beasts.';
        bankGold = Math.round(150 + Math.random() * 100);
        bankGuards = 1;
        break;
      case 'cavalry_fort':
        risk = 0.1;
        description = 'A heavily fortified standing army outpost enforcing frontier law. Safe, heavily armed, and imposing.';
        bankGold = Math.round(1500 + Math.random() * 500);
        bankGuards = 6;
        break;
      case 'native_settlement':
        risk = 0.2 + Math.random() * 0.3;
        description = 'A tribal settlement respecting the old ways. Friendly if you respect their traditions.';
        bankGold = 0;
        bankGuards = 0;
        break;
    }

    const { prosperity, controllingFaction } = getBaseProsperityAndFaction(type);
    const locId = `loc_${idx}_${type}`;
    
    // Generate economy profile seeded by location coordinates so it's deterministic but varies by location
    const economyProfile = generateEconomyProfile((x + 1) * (y + 1));
    
    let leaderName: string | undefined = undefined;
    if (type === 'outlaw_haven' || type === 'hostile_camp') {
      leaderName = generateOutlawName();
    } else if (type === 'cavalry_fort') {
      leaderName = `Captain ${generateOutlawName().split(' ')[1] || 'Smith'}`;
    } else if (type === 'native_settlement') {
      const nativeNames = ["Red Cloud", "Sitting Bull", "Crazy Horse", "Geronimo", "Chief Joseph", "Cochise", "Quanah Parker", "Black Kettle", "Roman Nose", "Little Wolf"];
      leaderName = nativeNames[Math.floor(Math.random() * nativeNames.length)];
    } else if (type === 'boomtown' || type === 'railway_hub' || type === 'ranch') {
      leaderName = `Sheriff ${generateOutlawName().split(' ')[1] || 'Jones'}`;
    }

    locations.push({
      id: locId,
      name: generateLocationName(type),
      type,
      x,
      y,
      risk,
      description,
      hasTrain,
      quests: [],
      shop: [],
      bankGold,
      bankGuards,
      prosperity,
      economyProfile,
      controllingFaction,
      leaderName,
      isExplored: idx === 0 // Start with only the default starting town revealed (hidden map)
    });
  });

  // Second pass: Populate shops and missions
  locations.forEach(loc => {
    loc.shop = generateShop(loc.type, loc.risk, loc.prosperity, loc.controllingFaction);
  });

  locations.forEach(loc => {
    loc.quests = generateMissionsForLocation(loc.id, locations);
  });

  return locations;
}

export function distance(loc1: {x: number, y: number}, loc2: {x: number, y: number}): number {
  return Math.round(Math.hypot(loc1.x - loc2.x, loc1.y - loc2.y));
}

export const globalGeneratedChunks = new Set<string>();

export function generateChunkLocations(cx: number, cy: number): Location[] {
  const chunkKey = `${cx},${cy}`;
  if (globalGeneratedChunks.has(chunkKey)) return [];
  globalGeneratedChunks.add(chunkKey);

  // Purely deterministic random generator based on chunk坐标
  const seed = `chunk_${cx}_${cy}_badlands_procedural_epic`;
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h << 5) - h + seed.charCodeAt(i);
    h |= 0;
  }
  const rng = () => {
    let t = (h += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const types: LocationType[] = [
    'boomtown', 'boomtown', 
    'mine', 'mine', 
    'outlaw_haven', 'outlaw_haven', 
    'desert_oasis', 'desert_oasis', 
    'hostile_camp', 'hostile_camp', 
    'ghost_town', 'ghost_town',
    'native_settlement', 'native_settlement', 
    'cavalry_fort'
  ];
  const locations: Location[] = [];
  
  const distFromCenter = Math.hypot(cx, cy);
  
  let numLocations = 0;
  if (rng() > Math.min(0.85, 0.2 + distFromCenter * 0.15)) {
    // Fewer locations the further out we go, reducing town spam
    numLocations = 1 + Math.floor(rng() * 2); 
  } else if (rng() > 0.85) {
    // 15% chance to cluster a few towns far out to give a sense of realism
    numLocations = 3;
  }
  
  for (let i = 0; i < numLocations; i++) {
    const type = types[Math.floor(rng() * types.length)];
    const rx = Math.floor(rng() * 70) + 15; // padding
    const ry = Math.floor(rng() * 70) + 15;
    
    const absX = cx * 100 + rx;
    const absY = cy * 100 + ry;
    
    const id = `procedural_${cx}_${cy}_${i}_${type}`;
    const name = generateLocationName(type) + ` [Sector ${cx},${cy}]`;
    
    let risk = 0.25 + rng() * 0.55;
    let description = `A newly surveyed point in Sector ${cx}, ${cy}. High risk, rich options.`;
    let bankGold = Math.round(400 + rng() * 800);
    let bankGuards = 2;
    let hasTrain = rng() < 0.45; // connected with rail
    
    if (type === 'mine') {
      risk = 0.55 + rng() * 0.35;
      description = 'An immense gold mine dungeon holding raw ores and locked vault cars.';
      bankGold = Math.round(1500 + rng() * 1200);
      bankGuards = 3;
    } else if (type === 'outlaw_haven') {
      risk = 0.65 + rng() * 0.3;
      description = 'Refuge for bandits and red gang desperadoes.';
    } else if (type === 'ghost_town') {
      risk = 0.7 + rng() * 0.25;
      description = 'A silent sand-swept settlement with abandoned storage safes.';
    } else if (type === 'desert_oasis') {
      risk = 0.2 + rng() * 0.35;
      description = 'A natural hot spring badlands oasis. Water is completely free at the center well.';
      bankGold = 0;
      bankGuards = 0;
    } else if (type === 'cavalry_fort') {
      risk = 0.1;
      description = 'A heavily fortified standing army outpost enforcing frontier law. Safe, heavily armed, and imposing.';
      bankGold = Math.round(1500 + rng() * 500);
      bankGuards = 6;
      hasTrain = false;
    } else if (type === 'native_settlement') {
      risk = 0.2 + rng() * 0.3;
      description = 'A tribal settlement respecting the old ways. Friendly if you respect their traditions.';
      bankGold = 0;
      bankGuards = 0;
      hasTrain = false;
    }

    const { prosperity, controllingFaction } = getBaseProsperityAndFaction(type);
    
    let leaderName: string | undefined = undefined;
    if (type === 'outlaw_haven' || type === 'hostile_camp') {
      leaderName = generateOutlawName();
    } else if (type === 'cavalry_fort') {
      leaderName = `Captain ${generateOutlawName().split(' ')[1] || 'Smith'}`;
    } else if (type === 'native_settlement') {
      const nativeNames = ["Red Cloud", "Sitting Bull", "Crazy Horse", "Geronimo", "Chief Joseph", "Cochise", "Quanah Parker", "Black Kettle", "Roman Nose", "Little Wolf"];
      leaderName = nativeNames[Math.floor(rng() * nativeNames.length)];
    } else if (type === 'boomtown' || type === 'railway_hub' || type === 'ranch') {
      leaderName = `Sheriff ${generateOutlawName().split(' ')[1] || 'Jones'}`;
    }

    const loc: Location = {
      id,
      name,
      type,
      x: absX,
      y: absY,
      risk,
      description,
      hasTrain,
      quests: [],
      shop: [],
      bankGold,
      bankGuards,
      prosperity,
      controllingFaction,
      leaderName,
      isExplored: false
    };

    loc.shop = generateShop(type, risk, prosperity, controllingFaction);
    locations.push(loc);
  }

  // Populate quests between generated spots
  locations.forEach(loc => {
    loc.quests = generateMissionsForLocation(loc.id, locations);
  });
  
  return locations;
}
