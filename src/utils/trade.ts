import { TradeItemDef, SettlementEconomyProfile, CarriageTier, Location } from '../types';

export const TRADE_GOODS: TradeItemDef[] = [
  { id: 'snake_oil', name: 'Snake Oil', basePrice: 15, weight: 2, tier: 'basic', description: 'High demand everywhere, entirely useless.' },
  { id: 'moonshine', name: 'Glow-in-the-Dark Moonshine', basePrice: 25, weight: 5, tier: 'contraband', description: 'Volatile, high demand in wealthy towns.' },
  { id: 'canned_beans', name: 'Canned Beans (Aged 10 Years)', basePrice: 5, weight: 3, tier: 'basic', description: 'Staple food, high demand in poor towns.' },
  { id: 'jackalope_horns', name: '"Genuine" Jackalope Horns', basePrice: 40, weight: 1, tier: 'luxury', description: 'Luxury curiosity.' },
  { id: 'used_spittoons', name: 'Used Spittoons (Premium)', basePrice: 10, weight: 8, tier: 'basic', description: 'Heavy, moderate demand.' },
  { id: 'tumbleweed_seeds', name: 'Tumbleweed Seeds', basePrice: 2, weight: 0.5, tier: 'basic', description: 'For the farmer who has everything.' },
  { id: 'sarsaparilla', name: 'Sarsaparilla Syrup Extract', basePrice: 20, weight: 4, tier: 'luxury', description: 'A refined luxury.' },
  { id: 'fools_gold', name: 'Prospector\'s Fool\'s Gold', basePrice: 50, weight: 10, tier: 'luxury', description: 'Heavy, high scamming potential.' },
  { id: 'questionable_salve', name: 'Questionable Salve', basePrice: 12, weight: 1, tier: 'basic', description: 'Medical supply.' },
  { id: 'rattlesnake_boots', name: 'Rattlesnake Leather Boots', basePrice: 35, weight: 3, tier: 'luxury', description: 'Status symbol.' },
  { id: 'water_barrel', name: 'Cholera-Free Water Barrels', basePrice: 8, weight: 25, tier: 'basic', description: 'Very heavy, highly demanded in deserts.' },
  { id: 'sweating_dynamite', name: 'Dynamite (Sweating)', basePrice: 60, weight: 5, tier: 'contraband', description: 'High value, high risk.' }
];

export const CARRIAGES: Record<CarriageTier, { name: string, maxWeight: number, price: number, requiredMount: 'donkey' | 'regular_horse', reqCount: number }> = {
  'small_carriage': { name: 'Small Carriage', maxWeight: 250, price: 150, requiredMount: 'donkey', reqCount: 1 },
  'medium_carriage': { name: 'Medium Carriage', maxWeight: 750, price: 500, requiredMount: 'regular_horse', reqCount: 2 },
  'large_carriage': { name: 'Large Carriage', maxWeight: 1500, price: 1200, requiredMount: 'regular_horse', reqCount: 4 }
};

export const MAX_WEIGHT_FOOT = 10;
export const MAX_WEIGHT_HORSE = 50;

export function getCargoWeight(inventory: {itemId: string, quantity: number}[]): number {
  if (!inventory) return 0;
  return inventory.reduce((total, stack) => {
    const item = TRADE_GOODS.find(g => g.id === stack.itemId);
    return total + (item ? item.weight * stack.quantity : 0);
  }, 0);
}

export function getMaxCapacity(hasHorse: boolean, activeCarriage: CarriageTier | null | undefined, player?: any): number {
  let baseCap = MAX_WEIGHT_FOOT;
  if (activeCarriage && CARRIAGES[activeCarriage]) {
    baseCap = CARRIAGES[activeCarriage].maxWeight;
  } else if (hasHorse) {
    baseCap = MAX_WEIGHT_HORSE;
  }

  // Caravan Master (logisticsSkillLevel)
  const logisticsLvl = player?.logisticsSkillLevel || 0;
  if (logisticsLvl === 1) {
    baseCap = Math.round(baseCap * 1.25);
  } else if (logisticsLvl === 2) {
    baseCap = Math.round(baseCap * 1.50);
  } else if (logisticsLvl === 3) {
    baseCap = Math.round(baseCap * 2.00); // Double capacity!
  }

  return baseCap;
}

export function generateEconomyProfile(seed: number): SettlementEconomyProfile {
  // Simple deterministic generation based on seed (e.g. location x*y)
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  const prosperityRoll = rand();
  let prosperityLevel: 'poor' | 'struggling' | 'stable' | 'wealthy' = 'stable';
  if (prosperityRoll < 0.25) prosperityLevel = 'poor';
  else if (prosperityRoll < 0.5) prosperityLevel = 'struggling';
  else if (prosperityRoll < 0.8) prosperityLevel = 'stable';
  else prosperityLevel = 'wealthy';

  const localModifiers: Record<string, number> = {};
  const localInventory: Record<string, number> = {};

  let baseStockMax = 50;
  if (prosperityLevel === 'struggling') baseStockMax = 100;
  else if (prosperityLevel === 'stable') baseStockMax = 250;
  else if (prosperityLevel === 'wealthy') baseStockMax = 500;

  TRADE_GOODS.forEach(good => {
    // base +/- 20%
    let modifier = 0.8 + (rand() * 0.4);
    
    if (prosperityLevel === 'poor' || prosperityLevel === 'struggling') {
      if (good.tier === 'basic') modifier *= 1.2;
      if (good.tier === 'luxury') modifier *= 0.6;
    } else if (prosperityLevel === 'wealthy') {
      if (good.tier === 'basic') modifier *= 0.8;
      if (good.tier === 'luxury' || good.tier === 'contraband') modifier *= 1.3;
    }
    localModifiers[good.id] = modifier;

    let maxStock = baseStockMax;
    if (prosperityLevel === 'poor' && good.tier === 'luxury') maxStock = Math.floor(maxStock * 0.1);
    if (prosperityLevel === 'wealthy' && good.tier === 'luxury') maxStock = Math.floor(maxStock * 1.5);
    
    // Add base randomness
    localInventory[good.id] = Math.floor(rand() * maxStock);
  });

  const carriageRoll = rand();
  let carriage: CarriageTier | null = null;
  if (carriageRoll > 0.6) { // 40% chance of a carriage for sale
    const cTypeRoll = rand();
    if (cTypeRoll < 0.5) carriage = 'small_carriage';
    else if (cTypeRoll < 0.8) carriage = 'medium_carriage';
    else carriage = 'large_carriage';
  }

  return {
    prosperityLevel,
    localPriceModifiers: localModifiers,
    localInventory,
    availableCarriageForSale: carriage
  };
}

export function calculateLocalPrice(goodId: string, basePrice: number, location: Location, player?: any, isSell?: boolean): number {
  if (!location.economyProfile) return basePrice;
  let mod = location.economyProfile.localPriceModifiers[goodId] || 1;

  const barterLvl = player?.barterSkillLevel || 0;

  // Level 2 Barter & Haggling: Neutralize bad inflation/deflation (prosperity effects)
  if (barterLvl >= 2) {
    const isProsperityInflation = mod > 1;
    const isProsperityDeflation = mod < 1;
    if (isProsperityInflation && !isSell) {
      // Don't buy at heavily inflated prices
      mod = 1.0 + (mod - 1.0) * 0.5; // reduce markup by 50%
    } else if (isProsperityDeflation && isSell) {
      // Don't sell at heavily deflated prices
      mod = 1.0 - (1.0 - mod) * 0.5; // reduce markdown by 50%
    }
  }

  let finalPrice = Math.max(1, Math.floor(basePrice * mod));

  // Level 1 Appraisal & Con Sales: Snake Oil Hustle (+50% base sell value of snake oil / moonshine)
  const appraisalLvl = player?.appraisalSkillLevel || 0;
  if (isSell && appraisalLvl >= 1 && (goodId === 'snake_oil' || goodId === 'moonshine')) {
    finalPrice = Math.round(finalPrice * 1.5);
  }

  // Level 1 / Level 3 Barter & Haggling discounts/markups
  if (barterLvl >= 1) {
    const buyDiscount = 0.90; // -10% buy price
    const sellBonus = barterLvl >= 3 ? 1.25 : 1.10; // +10% sell level 1, +25% sell level 3

    if (isSell) {
      finalPrice = Math.round(finalPrice * sellBonus);
    } else {
      finalPrice = Math.round(finalPrice * buyDiscount);
    }
  }

  // Apply active Market Bulletin multiplier if this town matches and item matches
  if (isSell && player?.activeMarketBulletin) {
    const ab = player.activeMarketBulletin;
    if (ab.locationId === location.id && ab.itemId === goodId) {
      finalPrice = Math.round(finalPrice * ab.priceMultiplier);
    }
  }

  return Math.max(1, finalPrice);
}

export function generateMarketBulletin(locations: Location[]): any | null {
  if (!locations || locations.length === 0) return null;

  // Choose a town that is valid/revealed/exists
  const towns = locations.filter(l => l.id && l.name && l.id !== 'desert' && l.id !== 'wilderness' && (l.type === 'boomtown' || l.type === 'railway_hub'));
  if (towns.length === 0) return null;
  const targetTown = towns[Math.floor(Math.random() * towns.length)];

  const bulletinTemplates = [
    {
      itemId: 'water_barrel',
      itemName: 'Cholera-Free Water Barrels',
      priceMultiplier: 3.0,
      messageTemplate: "📈 Market Alert: A severe water contamination outbreak in {townName} has spiked the demand for Water Barrels! Selling them there yields 3.0x gold!"
    },
    {
      itemId: 'sweating_dynamite',
      itemName: 'Dynamite (Sweating)',
      priceMultiplier: 2.5,
      messageTemplate: "📈 Market Alert: A rich gold vein was struck in the local mines of {townName}! Mining operations are paying a 2.5x premium for Dynamite!"
    },
    {
      itemId: 'canned_beans',
      itemName: 'Canned Beans (Aged 10 Years)',
      priceMultiplier: 3.5,
      messageTemplate: "📈 Market Alert: Heavy locust swarms destroyed the silos in {townName}! Famine has skyrocketed the value of Canned Beans to 3.5x!"
    },
    {
      itemId: 'moonshine',
      itemName: 'Glow-in-the-Dark Moonshine',
      priceMultiplier: 2.5,
      messageTemplate: "📈 Market Alert: Grand opening of a high-stakes saloon in {townName}! Speakeasies are buying Glow-in-the-Dark Moonshine at 2.5x price!"
    },
    {
      itemId: 'snake_oil',
      itemName: 'Snake Oil',
      priceMultiplier: 4.0,
      messageTemplate: "📈 Market Alert: A credulous eastern magnate is visiting {townName} buying 'miracle cures'! Snake Oil sell value is boosted to 4.0x!"
    },
    {
      itemId: 'fools_gold',
      itemName: 'Prospector\'s Fool\'s Gold',
      priceMultiplier: 2.0,
      messageTemplate: "📈 Market Alert: A gullible assayer has set up shop in {townName}! Fool's Gold trade-in rates are up by 2.0x!"
    },
    {
      itemId: 'jackalope_horns',
      itemName: '"Genuine" Jackalope Horns',
      priceMultiplier: 2.8,
      messageTemplate: "📈 Market Alert: A royal taxidermy collector has checked into {townName} Saloon! Jackalope Horns can be sold at 2.8x price!"
    }
  ];

  const template = bulletinTemplates[Math.floor(Math.random() * bulletinTemplates.length)];
  return {
    locationId: targetTown.id,
    locationName: targetTown.name,
    itemId: template.itemId,
    itemName: template.itemName,
    priceMultiplier: template.priceMultiplier,
    message: template.messageTemplate.replace("{townName}", targetTown.name)
  };
}
