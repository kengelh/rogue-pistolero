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

export function getMaxCapacity(hasHorse: boolean, activeCarriage: CarriageTier | null | undefined): number {
  if (activeCarriage && CARRIAGES[activeCarriage]) {
    return CARRIAGES[activeCarriage].maxWeight;
  }
  if (hasHorse) {
    return MAX_WEIGHT_HORSE;
  }
  return MAX_WEIGHT_FOOT;
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

export function calculateLocalPrice(goodId: string, basePrice: number, location: Location): number {
  if (!location.economyProfile) return basePrice;
  const mod = location.economyProfile.localPriceModifiers[goodId] || 1;
  // Geographic variance can be baked into the local modifiers as we don't track source
  return Math.max(1, Math.floor(basePrice * mod));
}
