# Wild West Roguelike: Feature Roadmap & Design Document

As a world-class game designer, I've reviewed the proposed mechanics. To ensure a successful development cycle and a compounding loop of player engagement, we must prioritize these features based on their **Implementation Difficulty** vs. **Impact on Core Loop**. 

We will build the foundation first (moment-to-moment friction), expand the systemic world (economy), and finally overhaul the complex systems (combat & meta-progression).

Here is the prioritized roadmap, from easiest to hardest to implement:

## Phase 1: High Impact, Low Friction (Immediate Additions)
*These features leverage existing systems (travel, encounters, stats) and add immediate tactical depth with minimal structural changes.*

### 1. The Campfire Ambush Mechanic (Completed)
* **Stepwise Approach:**
  * Add state for `pendingCampChoice`.
  * Intercept automatic resting to show a modal for "Cold Camp" vs "Fire Camp".
  * Implement `handleStartCamping` to apply healing bonuses (30% vs 100%) and ambush chance (0% vs 20%).
* **Difficulty:** Low
* **Design Rationale:** This introduces immediate "Risk vs. Reward" micro-decisions to the travel loop. It forces the player to gamble their safety for resources, a core tenet of roguelikes.
* **Implementation:** Add a choice prompt when resting ("Cold Camp" vs. "Fire Camp"). "Cold" grants 30% HP recovery. "Fire" grants 100% HP recovery but rolls a 20% chance to trigger an immediate combat encounter.

### 2. High-Stakes Geography & Biome Friction (Completed)
* **Stepwise Approach:**
  * Tag map tiles with biomes (e.g., Searing Desert).
  * Modify travel logic: if in the desert, multiply water drain by 1.75 -> 3.0.
  * Adjust dehydration speed penalty: running out of water reduces movement speed down to 0 after 72 hours.
  * Set survival/rescue rules: at 72 hours, the Mysterious Stranger rescues the player 100% of the time on normal difficulty, and 50% on hardcore (difficult) mode (otherwise the player dies).
  * Added rewards: chance to find rare stashes of gold or items while surviving the Searing Desert.
* **Difficulty:** Low-Medium
* **Design Rationale:** Travel shouldn't just cost time; it should cost preparation. This turns the map from a simple grid into a resource puzzle.
* **Implementation:** When moving through "Searing Desert," water drain is multiplied by 3.0. Hitting 0 water progressively reduces speed to 0. At 72 hours dehydration, the Mysterious Stranger has a 100% chance (Normal) or 50% chance (Difficult) to rescue the player.

## Phase 2: Systemic World & Basic Meta-Progression
*These features require persistent state tracking (saving data across runs or across town visits) but don't fundamentally rewrite the core gameplay engines.*

### 3. Frontier Legacy Badges System (Completed)
* **Stepwise Approach:**
  * Add a persistent store for legacy achievements / badges.
  * Define key badges: Win 10 Duels, Amass $1,000 Cash/Bank, Get $100+ head bounty, Survive 10 Days, successfully Rob 3 Banks.
  * Integrate badge verification on death or active achievement tracking.
  * Render unlocked/locked badges elegantly in the Character modal with custom status indicators and Western medals.
* **Difficulty:** Medium
* **Design Rationale:** Encourages high-stakes gameplay, persistent achievements across multiple lives, and allows players to build a legacy through milestones.
* **Implementation:** Persistence is managed using sandboxed browser `localStorage`. Player achievements are continuously monitored and validated on death. Unlocked badges display as high-contrast copper and gold medals in the Character Sheet.

### 4. Dynamic Town Prosperity (Completed)
* **Stepwise Approach:**
  * Add `prosperity` value to town locations. (Completed)
  * Update shop prices and stock dynamically based on `prosperity`. (Completed)
  * Adjust prosperity when events happen (e.g. bounty collected or bank robbed). (Completed)
* **Difficulty:** Medium
* **Design Rationale:** Makes the world feel reactive and alive. Player actions (or inactions) have visible consequences on their safe havens.
* **Implementation:** Add a `prosperity` integer (0-100) to town objects. Scale shop prices and inventory quality based on this number. Tie specific events (killing a local bounty = +prosperity, robbing the bank = -prosperity) to update this value.

### 5. Lineage & Inheritance System (Completed)
* **Stepwise Approach:**
  * Upon player death, serialize their inventory and generate a persistent `marked_grave` location at their exact coordinates.
  * Keep the same map and generate a brand-new player character who spawns in a different Town location as a descendant drifter.
  * Enable the new player to travel to the marked grave, pay respects, and retrieve one random item from the original player's inventory as inherited legacy.
* **Difficulty:** Medium-High
* **Design Rationale:** Softens the blow of permadeath, encourages exploration of the same territory, and creates a physical narrative continuity across generations.
* **Implementation:** Death events (combat defeat or dehydration) serialize the drifter's inventory and register a wooden grave marker on the coordinates. New characters start fresh at a random town on the same map, tracking the ancestor's tombstone for scavenging.

## Phase 3: Complex Overhauls (The Deep End)
*These features require significant re-engineering of existing systems, new AI logic, or global event managers.*

### 6. Dynamic Ecology: "Gold Rushes"
* **Stepwise Approach:**
  * Implement global events manager that ticks over time.
  * Randomly spawn a "Mine" point of interest.
  * Apply local area effect to towns (inflated prices) and travel (higher bandit rate).
* **Difficulty:** High
* **Design Rationale:** Breaks the predictability of the map. Forces players to abandon their planned routes for sudden, high-risk/high-reward opportunities.
* **Implementation:** Requires a global "Tick/Time" manager. At random intervals, generate a new "Mine" node on the map. Apply an aura effect around the node that inflates local town prices and significantly increases the spawn rate/difficulty of bandit encounters in that radius.

### 7. Specific Enemy Behaviors & Status Effects
* **Stepwise Approach:**
  * Extend combat engine with a status effects system (Poison, Bleed, etc.).
  * Add basic AI decision trees for enemy types (e.g. Lawmen disarming).
* **Difficulty:** High
* **Design Rationale:** Prevents combat from becoming a math spreadsheet. Players must prioritize targets based on what the enemy *does*, not just their HP.
* **Implementation:** Requires extending the combat engine to support Status Effects (Poison, Bleed) and Debuffs (Disarmed). Requires building a simple AI state machine for enemies (e.g., Lawmen prioritize "Disarm" action if player weapon damage > X; Tribal Scouts apply "Poison" on hit).

### 8. Tactical Combat Depth: Action Point (AP) System
* **Stepwise Approach:**
  * Overhaul combat UI to support AP.
  * Implement discrete combat actions (Aim, Take Cover) with distinct AP costs.
  * Balance damage and evasion numbers.
* **Difficulty:** Very High
* **Design Rationale:** The holy grail of tactical RPG combat. Transforms simple duels into deep, strategic puzzles.
* **Implementation:** A fundamental rewrite of the combat loop. Introduce an AP stat. Break down attacks into granular actions (Aim, Fan the Hammer, Take Cover) with distinct AP costs, accuracy modifiers, and damage values. Requires a completely new combat UI to support action queuing or turn-based AP spending.
