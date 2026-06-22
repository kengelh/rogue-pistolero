# Wild West Trade Economy Design Document

## 1. System Overview & Core Mechanics

The Trade Economy system introduces a "buy low, sell high" loop layered on top of the existing roguelike mechanics. It leverages distance, local prosperity, and cargo weight to create a risk-vs-reward progression system reminiscent of classic space-trading games, adapted for the Wild West.

### Dynamic Items
Here are 12 tongue-in-cheek trade goods with baseline metrics:

1. **Snake Oil**: Base Price: $15 | Weight: 2 lbs (High demand everywhere, entirely useless)
2. **Glow-in-the-Dark Moonshine**: Base Price: $25 | Weight: 5 lbs (Volatile, high demand in wealthy towns)
3. **Canned Beans (Aged 10 Years)**: Base Price: $5 | Weight: 3 lbs (Staple food, high demand in poor towns)
4. **"Genuine" Jackalope Horns**: Base Price: $40 | Weight: 1 lbs (Luxury curiosity)
5. **Used Spittoons (Premium)**: Base Price: $10 | Weight: 8 lbs (Heavy, moderate demand)
6. **Tumbleweed Seeds**: Base Price: $2 | Weight: 0.5 lbs (For the farmer who has everything)
7. **Sarsaparilla Syrup extract**: Base Price: $20 | Weight: 4 lbs (A refined luxury)
8. **Prospector's Fool's Gold**: Base Price: $50 | Weight: 10 lbs (Heavy, high scamming potential)
9. **Questionable Salve**: Base Price: $12 | Weight: 1 lbs (Medical supply)
10. **Rattlesnake Leather Boots**: Base Price: $35 | Weight: 3 lbs (Status symbol)
11. **Cholera-Free Water Barrels**: Base Price: $8 | Weight: 25 lbs (Very heavy, highly demanded in deserts)
12. **Dynamite (Sweating)**: Base Price: $60 | Weight: 5 lbs (High value, high risk)

### Supply & Demand by Prosperity
Each settlement has a `prosperityLevel` (e.g., Poor, Struggling, Stable, Wealthy).
* **Poor/Struggling Towns** overvalue basic survival goods (Beans, Water, Salve) but will pay very little for luxuries (Jackalope Horns, Moonshine).
* **Wealthy Towns** underpay for basic staples (highly supplied) but pay a premium multiplier for luxury and status goods (Rattlesnake Boots, Sarsaparilla).

### Geographic Price Variance
Prices are simulated using a geographic grouping model to incentivize long-haul trade routes. 
* Nearby towns share similar local resources, meaning the price differential between them is minimal (+/- 5%). 
* The further a player travels from the source, the higher the price variance. Transporting a region-specific good to the opposite side of the map will yield the highest profit margins.

### Logistics & Progressive Weight Tiers
Cargo capacity acts as the primary bottleneck for establishing a trade empire. Players must invest in their transport to scale their profits. 

* **On Foot**: Base carry capacity is strictly limited (e.g., 50 lbs) before severe encumbrance penalties apply.
* **On Horseback**: A saddlebag upgrade. Moderate carry capacity (e.g., 150 lbs). 
* **Carriages**: Represent the advanced trade progression. Validating ownership of required mounts is strict before purchase/use:
  * **Small Carriage**: 500 lbs max capacity. *Requirement*: Player must own at least 1 donkey.
  * **Medium Carriage**: 1500 lbs max capacity. *Requirement*: Player must own at least 2 horses.
  * **Large Carriage**: 4000 lbs max capacity. *Requirement*: Player must own at least 4 horses.

### Local Market Availability
Town generation will randomly assign *only ONE* carriage type to be available for purchase at the local Stable/Mercantile at any given time (or none at all). This turns carriage upgrades into exciting discoveries rather than guaranteed commodities.

### Risk vs. Reward (Overland Ambushes)
Transporting valuable goods comes with a target on the player's back. 
* **Ambush Probability Formula**: `Base Encouner Rate + (Total Cargo Value * Value_Multiplier) + (Total Cargo Weight * Weight_Multiplier)`
* **Intensity Escalation**: The more the carriage is worth, the better equipped the bandits will be. Robbing a heavily laden Large Carriage will spawn Elite outlaws dynamically, turning a mundane trade route into a tense survival gauntlet.

---

## 2. Module Breakdown, Complexity, and "Fun" Impact

| Module Name | Implementation Complexity | Impact on "Fun" | Description / Justification |
| :--- | :--- | :--- | :--- |
| **EconomyEngine** | **Medium** | **High** | *Complexity*: Requires smooth mathematical formulas to map coordinates, prosperity, and base prices to prevent exploits.<br>*Fun*: Drives the core "Trader" fantasy. Seeing a massive profit margin after a long trek is highly satisfying. |
| **LogisticsManager** | **Medium** | **Medium** | *Complexity*: Hooking into the existing Mount systems, validating arrays of owned mounts, handling capacity UI.<br>*Fun*: Provides clear progression goals and "build crafting." Buying a Large Carriage feels like levelling up. |
| **EncounterDirector (Ambush Scaler)** | **Low** | **High** | *Complexity*: Simple scaling formulas modifying the existing random encounter logic based on current inventory bounds.<br>*Fun*: Generates organic tension. Greed directly heightens risk, making trade runs exhilarating and dangerous. |
| **MarketUI** | **High** | **Medium** | *Complexity*: Needs to display buying/selling prices, weights, local variations, and affordances cleanly across mobile and desktop.<br>*Fun*: A clunky UI ruins trading games. A clean, snappy spreadsheet-like UI is deeply satisfying for min/maxers. |

---

## 3. Technical Architecture & Data Schemas

### Trade Item Definition
```typescript
interface TradeItemDef {
  id: string; // e.g., 'snake_oil'
  name: string;
  basePrice: number;
  weight: number;
  tier: 'basic' | 'luxury' | 'contraband';
  description: string;
}

interface CargoStack {
  itemId: string;
  quantity: number;
}
```

### Settlement Economic Profile
```typescript
interface SettlementEconomyProfile {
  prosperityLevel: 'poor' | 'struggling' | 'stable' | 'wealthy';
  localPriceModifiers: Record<string, number>; // Maps itemId to a multiplier (e.g., {'snake_oil': 1.25})
  availableCarriageForSale: CarriageTier | null; // e.g., 'medium_carriage' or null
}

type CarriageTier = 'small_carriage' | 'medium_carriage' | 'large_carriage';
```

### Player Transport & Cargo State
```typescript
interface Carriage {
  type: CarriageTier;
  maxWeight: number;
  mountsRequired: { type: 'donkey' | 'horse', count: number };
}

interface PlayerTransportState {
  // Existing Mount properties...
  ownedMounts: Mount[]; 
  
  // Trade properties
  activeCarriage: Carriage | null;
  tradeInventory: CargoStack[];
  
  // Derived state (calculated dynamically)
  // currentWeight: number;
  // maxCapacity: number;
}
```

---

## 4. Implementation Backlog

This prioritized step-by-step roadmap outlines the delivery execution.

* **Phase 1: Foundations & Data (The "Ledger" Update)**
  * **Task 1.1**: Define `TradeItemDef` constants (the 12 goods, weights, base prices).
  * **Task 1.2**: Extend the `Player` state schema to include `tradeInventory` and `activeCarriage`.
  * **Task 1.3**: Extend the `Location` schema to support `prosperityLevel` and generate a `SettlementEconomyProfile` upon world generation.

* **Phase 2: The Economy Engine (The "Gold Rush" Update)**
  * **Task 2.1**: Build the `calculateLocalPrice()` utility function incorporating geographic distance penalties and prosperity base scales.
  * **Task 2.2**: Build the Market UI inside the `TownView`, allowing players to buy/sell trade goods with visible weight consequences.

* **Phase 3: Logistics & Upgrades (The "Wagon Train" Update)**
  * **Task 3.1**: Implement the capacity check logic (determining if the player can carry a trade based on Foot/Mounts/Carriage max capacities).
  * **Task 3.2**: Add the logic to seed *one* random carriage to towns.
  * **Task 3.3**: Create the Carriage Purchasing UI, explicitly validating the required quantity and types of animals in the player's `ownedMounts`.

* **Phase 4: Risk & Reward (The "Highwayman" Update)**
  * **Task 4.1**: Modify the Overland Travel encounter randomizer. Inject the `Total Cargo Value` and `Total Cargo Weight` modifiers.
  * **Task 4.2**: Adjust enemy spawning algorithms so high-tier cargo spawns higher-tier outlaws natively.
  * **Task 4.3**: End-to-end balance pass (Playtesting the profit margins against the ambush rates).
