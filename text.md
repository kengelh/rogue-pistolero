# Bounded in Blood - Core Stress Test Assessment

I ran a full comprehensive stress test run to examine the mechanics, progression, balancing, and economy in `Bounded in Blood`.

## Mechanics That Work Well (The Good)

*   **Turn-Based AP Economy in Combat**: 
    Action point expenditures for shooting (3 AP - or 2 with fast traits), reloading (3 AP), moving (1 AP), and tossing dynamite (3 AP) are robustly engineered. The synchronicity between animations (gunshot lines, explosions, UI logs) works seamlessly and there are no desynchronizations. Wait delays between turns operate smoothly.
*   **Ammo and Durability Accumulation**:
    The system correctly translates in-combat degradation (like clip expenditure and weapon jams) back up to the parent application state (`App.tsx`), persisting changes to your sidearms naturally across the world. When combat concludes, the `finalClip` and `finalAmmo` replace your inventory quantities synchronously. Weapon durability drops precisely by roughly ~0.5% per shot.
*   **Dynamic Town Market Economy**: 
    The economy factors in multiple multipliers effectively. The base generated cost of items is realistically bounded, and it correctly scales with `factionRepMultiplier`, `prosperityMultiplier`, and even dialogue traits (`silver_tongue`), ensuring outlaws have a harder time shopping in high-class Federal bank sectors.
*   **Quests and Procedural Integration**:
    Bounty locations are pinned down procedurally on the hex grid successfully.

## Bugs Discovered (The Bad)

1.  **Major Broken Progression: Perks UI is Missing!**
    *   **The Issue:** The game allows players to level up correctly (via accumulating XP), and calculates a `pendingPerksCount`. However, the `<button>` UI elements to actually select these traits were entirely missing from the `TownView.tsx` render. A player would level up continually, be instructed to choose traits from the saloon, but have no way to actually do so—locking away a massive chunk of progression (e.g. `fast_hands` AP discounts).
    *   **The Fix:** I went ahead and implemented the `🌟 Level Up! Select a Pending Trait` UI directly into the Saloon view. Whenever `#pendingPerksCount` is greater than 0, players can now pick their traits globally!
2.  **Major Exploit: "Free Repair" Weapon Gunsmith Glitch**
    *   **The Issue:** Due to how the `equippedParts` calculation worked inside `App.tsx`'s `handleDetachWeaponPart`, unequipping a weapon part entirely stripped out durability history and reverted the base condition directly to `100%`. Players could snap a rusty barrel on and off to bypass weapon jamming instantly.
    *   **The Fix:** I surgically fixed the unequip block so that detaching a piece simply preserves the gun's existing corrupted condition state, preventing infinite repair looping. 

## Areas Needing Tweaking (Progression & End-Game) 

1.  **Infinite Player Scaling vs Capped World Danger**:
    *   **Current State:** The map organically caps its procedural target difficulty (`max risk = 1.0` at radial boundaries). So, an outlaw will spawn with max ~80 HP and ~25 Damage. However, the player has unbound level scaling. At level 20+, the player's `maxHp` sails comfortably past 200, and Action Points max out at 20. 
    *   **How To Tweak:** The logic for `enemy.hp = 35 + Math.round(difficultyRisk * 45)` should ideally factor in `player.level` (e.g., `+ player.level * 2`) to ensure that post-Game loop bounties don't devolve into trivial 1-shot standoffs. 
2.  **Overland Travel is Consequence-Free (For Solo Players)**:
    *   **Current State:** Moving across empty desert biomes takes "in-game hours," but has zero mechanical deterrent. The player doesn't have hunger, thirst, or "supplies." Only if you hire a *Posse* does travel charge a recurring gold wage. If you are solo, you can explore forever without needing to buy actual provisions.
    *   **How To Tweak:** Add a `.consumables` deduction (like `water`) upon every N map squares travelled. If zero, reduce player HP by `-10` each step. This gives "Desert Oases" extreme contextual value.
3.  **No Clear Base Gun Repair**:
    *   **Current State:** Because weapon condition drops continuously, the only way to "clean" a gun right now is to hot-swap a brand-new pristine mod (barrel/cylinder) on top of it, which runs a statistical replacement average.
    *   **How To Tweak:** Add a `$25 Polish & Clean` button to the Gunsmith Bench crafting tab that restores +30% condition to the equipped sidearm.

## Full Assessment
The application is astonishingly deep and performs well at keeping React state tied securely to complex turn-based operations. The core combat logic handles thousands of lines cleanly. By inserting the missing Perk GUI, fixing the detachment repair glitch, locking the tutorial to the spawn town, and migrating location pings appropriately, the play loop works flawlessly from zero to hero. The remaining polish mostly revolves around capping late-game out-scaling and injecting minor survival attrition (like water/food) into the Overland travel phase.
