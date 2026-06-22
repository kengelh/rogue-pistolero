# Western RPG Development Roadmap

This document outlines the priority roadmap for new features, expanding heavily into interlocking mechanisms, crafting, and dynamic quests to improve replayability and depth. It serves as a detailed context and architectural guide for LLM development to program advanced, interlocking gameplay mechanisms.

Features are sorted by Priority and Ease of Implementation.

## 1. Balanced Loot Tiering & Economy (Status: Complete)
**Priority: High | Complexity: Low**
- **Mechanic**: Restructure the combat loot drop logic to heavily restrict high-tier/legendary drops.
- **Interlocking Value**: Ensures the early game (e.g., Tutorial Pete) only drops basic consumables or rusted, low-tier parts. Legendary or pristine weapon parts are *strictly* reserved for high-risk bounties or Nemesis encounters.
- **Implementation**: 
  - Add an enemy tier/difficulty check in the `onVictory` loot calculation.
  - Tutorial encounters hardcoded to only drop basic `scrap_metal`, `bandage`, or nothing.

## 2. Dynamic Faction Retaliation & Ambush Hooks (Status: Complete)
**Priority: High | Complexity: Medium**
- **Mechanic**: Earning positive reputation with Lawmen greatly diminishes Outlaw reputation. Outlaw gangs will dynamically ambush you on the Overland Map based on how infamous you are to them.
- **Interlocking Value**: Connects the Bounty/Quest system directly to Overland Travel. Taking bounties makes travel more dangerous but more rewarding if you survive the ambushes.
- **Implementation**: 
  - `setTravelStatus` event hooks have been updated to factor in `factionReputation.outlaws` when rolling for ambushes in `OverlandMap.tsx`.
  - Tie specific high-tier loot drops to these retaliatory ambushes (Implied through difficulty scaling).

## 3. Modular Gun Architecture & Scavenging (Status: Complete)
*Replacing Universal "Scrap Metal" Repairs*
**Priority: Medium-High | Complexity: Medium**
- **Mechanic**: Weapon architecture contains specific component slots (`barrel`, `cylinder`, `stock`, `action`). Looting enemies provides specific rusted/used/pristine gun component items appropriate to their weapon type.
- **Interlocking Value**: Pushes players to hunt specific enemy types (e.g., tracking down riflemen if the player needs a new rifle lever). 
- **Implementation**:
  - Enemies drop specific components (e.g. `Rusted Revolver Barrel`) based on their combat tier instead of universal scrap.
  - Parts provide explicit perks (`accuracyBonus`, `maxClipBonus`) and have their own condition value that gets averaged into the player's sidearm condition.
  - *Known Issue/Refinement:* Base `scrap_metal` is still lingering as a primitive repair option for simplicity, which may undercut the new scavenging loop if not balanced perfectly. Consider deprecating `scrap_metal` entirely in a future pass.

## 4. Gun Bench UI & Swapping Mechanism (Status: Complete)
**Priority: Medium | Complexity: High**
- **Mechanic**: A "Gun Maintenance" menu in the Character Sheet to manually detach and attach harvested weapon parts.
- **Interlocking Value**: Makes scavenging exciting. Swapping low-condition parts with pristine components restores the weapon's condition natively and attaches powerful perks.
- **Implementation**:
  - Built `WeaponBenchModal.tsx` for component slot management.
  - Integrated with `App.tsx` state to handle equipping/detaching and resolving stat bonuses (accuracy, clip size, damage).
  - High-tier hubs (`boomtown`, `railway_hub`) dynamically generate pristine components in the shop.

## 5. Saloon Rumors, Hidden Bounties & Ephemeral Stashes (Status: Complete)
*(Interlocking: Gold, Overland Map, & Scavenging)*
**Priority: Medium | Complexity: Medium**
- **Concept:** Spending gold in town should yield tangible exploration benefits, reducing blind wandering on the Overland map. Instead of immediately knowing where legendary bounties are, you must buy "Rumors" at Saloons or find encrypted "Notes" on standard bandits.
- **Mechanic**: 
  - **The Rumor Mill:** Drinking/talking at the Saloon opens a Rumors option. For a gold fee, the player can unlock clues for their active bounties.
  - **Hidden Bounties:** Some targets require Gathering Clues at "Disturbed Campfires" plotted on the Overland Map based on the rumors bought. Finding enough clues triggers boss showdowns or narrative twists.
  - **Ephemeral Stashes:** The rumor mill might also reveal temporary POIs (e.g., "Abandoned Bandit Cache") that spawn on the map but only exist for a limited `worldTime` window (48 hours). 
- **Implementation Details**:
  - `map_note` added to `InventoryItem` types for clue storage.
  - Added `spawnEphemeralLocation` logic in `App.tsx` and expiration cleanup dynamically via `hoursSurvived`.
  - Stash raid mechanics in `TownView` allowing players to loot gold and parts at a risk of an ambush.

> **Known Issue/Refinement:** The legacy `scrap_metal` logic still exists on the character sheet for simple condition repair. This slightly clashes with the precision component wear system and either needs to be deprecated or rebalanced.

## 6. Posse Traits, Logistics, Loyalty & Ideology (Status: Pending)
*(Interlocking: Mercenaries, Combat, Survival & Narrative Choices)*
**Priority: Low | Complexity: High**
- **Concept:** Posse members are living entities with moral compasses, requiring upkeep over time, not just passive combat bots. They provide map/travel skills (e.g., Scout reveals adjacent hexes, Scavenger increases loot drop rates by 15%).
- **Mechanic**: 
  - **Ideology Alignment:** Every posse companion aligns with a faction or ideology (e.g., "Lawful", "Renegade", "Mercenary").
  - **Dynamic Loyalty:** Making narrative choices (e.g., capturing vs. killing bounties, running from fights, hitting max Outlaw rep) shifts individual posse `loyalty`. 
  - **Combat & Upkeep Impact:** 
    - *High Loyalty:* Stat buffs, willingness to take cover, or even auto-heal the player.
    - *Low Loyalty:* They demand higher passive gold upkeep (bribes). If unpaid or deeply ideologically opposed, they might desert during camp or flee mid-combat.
- **Interlocking Value**: Ties the followers system into the survival and economy mechanics. More guns = more mouths to feed, causing players to continuously hunt bounties or scavenge to maintain their crew.
- **Implementation Guidelines**: 
  - Update `PosseMember` in `types.ts` with `trait`, `ideology: string`, `loyalty: number`, and `dailyUpkeep: number`. 
  - Add daily deductions to the `worldTime` loop in `OverlandMap` and apply trait modifiers globally.
  - Hook loyalty modifiers into narrative quest resolutions, alignment gains, and `worldTime` tracking (for daily pay deductions).

## 7. Town Prosperity & Faction Warfare (Status: Complete)
*(Interlocking: Reputation, Shops, Missions, & Overland Map)*
**Priority: Low | Complexity: High**
- **Concept:** Towns are not static hubs; they are dynamic ecosystems affected by the player's actions and faction influence.
- **Mechanic**: 
  - **Prosperity Level:** Towns possess a `prosperity` stat (e.g., 0-100%). High prosperity attracts better merchants, premium gunsmithing parts, and rare horses. Low prosperity means barren shops and desperate, low-paying quests.
  - **Faction Control:** Towns can swing between "Law-Abiding" and "Outlaw Controlled" based on player actions. Completing official bounties increases Lawmen control and prosperity. Failing to stop local outlaw missions or aiding bandits drops prosperity and shifts control to Outlaws.
- **Interlocking Value**: Connects reputation to the economy. Prosperous/Lawful towns have better high-end items, while Outlaw-controlled towns offer contraband at erratic prices.
- **Implementation Steps**: 
  - **Step 1: Extend Types (Completed)** - Expand `Location` in `types.ts` with `prosperity: number` and `controllingFaction: 'lawmen' | 'outlaws' | 'neutral'`.
  - **Step 2: Generate Initial Stats (Completed)** - Update `procedural.ts` to assign base prosperity and faction values during world generation.
  - **Step 3: Dynamic Shop Generation (Completed)** - Update shop generators to filter items and scale prices dynamically based on these metrics. (Contraband dynamite/lockpicks exist in outlaw towns).
  - **Step 4: Town UI Integration (Completed)** - Update `TownView.tsx` to display the town's prosperity and use `controllingFaction`.
  - **Step 5: Dynamic State Shifts (Completed)** - Hooked into the combat victory and quest resolution pipelines to mutate location stats over time (claiming bounties increases prosperity, successfully robbing drains it and shifts it to Outlaw).

## 8. Weapon Calibers & Ammo Scarcity (Status: Pending)
*(Interlocking: Firearms & Inventory)*
**Priority: Medium | Complexity: Medium**
- **Concept:** Replace the generic `ammo` pool with specific calibers to encourage weapon swapping, resource management, and tactical planning.
- **Mechanic**: 
  - **Caliber Types:** Introduce specific ammo types as distinct inventory items: `.45 Colt` (Revolvers), `.44-40 Winchester` (Rifles), `12 Gauge Shells` (Shotguns).
  - **Scarcity Mechanics:** A town might be completely out of a certain ammo type, forcing the player to buy a cheap alternate weapon to survive the next bounty hunt. Enemies drop ammo corresponding *only* to the weapon they wield.
- **Interlocking Value**: Deepens the inventory and economic mechanics. High-tier weapons are balanced by ammo scarcity; forces adaptation if specific ammo is unavailable in shops or drops without needing arbitrarily spongey enemies.
- **Implementation Guidelines**: 
  - Remove global `player.ammo`. 
  - Expand `Weapon` type to require an `ammoType` or `caliber` property.
  - Create standard `InventoryItem` subtypes for standard calibers.
  - Update combat actions (`handleShoot`) to deduct specific items instead of a global pool.

## 9. Advanced Quest Typology & Investigation Mechanics (Status: Implementing)
*(Interlocking: Storylines, Overland Map, Items & Non-Combat Resolution)*
**Priority: High | Complexity: High**
- **Concept:** Ensure that not all rumors and story quests escalate to a tactical shootout immediately. Quests generated under types like `story_investigation`, `myth` and `diplomacy` must involve multi-step paths involving exploration, dialogue, and puzzle/item collection.
- **Mechanic**:
  - **Multi-Step Paths:** A rumor (like "Lost Dutchman's Map") spawns a Clue token (e.g. Encrypted Map) rather than an outlaw hideout.
  - **Non-Combat Prompts:** Reaching a quest objective on the Overland map may bring up an Investigation Dialog (e.g., Talk to a survivor, Search a wreck, Pay a Bribe) rather than an instant `onStartCombat` call.
  - **Sequential Logic:** Resolving the first step increments `questState` and points to a new target hex. Only the final stage might involve combat (e.g., fighting a guardian for the treasure) or could be entirely peaceful (e.g., paying off a loan shark).
- **Interlocking Value**: Gives the game a true RPG feel. Makes rumors significantly differ from Bounties. It leverages the global `inventory` (requiring items to solve puzzles) and Posse skills (a Scout might auto-resolve an investigation step).
- **Implementation Steps**:
  - **Step 1: Differentiate Quest Endpoints (Completed)** - Prevent `story_investigation` and `scavenge` quests from triggering the "Target Sighted: Outlaw Hideout" combat prompt.
  - **Step 2: Investigation Modal (Completed)** - Build `InvestigationModal` in `App.tsx` to handle passive resolutions, giving XP/Gold and completing the quest without a shootout.
  - **Step 3: Multi-Stage Tracking** - Track `stage` inside the `Mission` state to handle sequential clue gathering across the Overland map.
