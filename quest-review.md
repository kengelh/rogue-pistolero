# Quest Engine & Standoff Mechanics Review

## 1. Standoff & Pre-Combat Mechanics
The application utilizes a skill-based "Standoff" system that occurs prior to entering firefights. When an engagement begins, the player is presented with contextual tactical options based on the environment (e.g. saloon, canyon) and enemy types.

### Skill Checks and Outcomes
*   **Generation**: Two random options are pulled from a pool of skill-based actions (Charisma, Stealth, Perception, Marksman, Survival) via `generateInteractiveStandoffOptions()`.
*   **Dynamic Overrides**: Contextual overrides adapt the text and outcomes based on the scenario. For instance, in the tutorial "Slippery Pete" encounter, generic options like "Pay Off the Lookout" transform into "Buy Pete Another Bourbon".
*   **Combat Bypass (Non-Violent Resolution)**: If the player successfully executes a pacifying action (like drugging a drink or getting the enemy drunk), the engine supports the `bypassCombat` flag. This immediately awards a victory and the captive, entirely skipping the violent firefight segment.
*   **Skill Mastery**: Using standoff options progressively levels up passive mastery bars (e.g. using a Stealth option boosts the player's Silence capability).

### Fixes Applied
*   Slippery Pete's non-violent resolutions (Bourbon Bribe, Sleep-root Poison) were previously leading directly into combat regardless of the outcome text. The engine has been updated so that successfully incapacitating Pete now triggers a peaceful `bypassCombat` victory, skipping the firefight entirely.
*   Log lines have been properly customized to ensure the flavor text matches the contextual action (e.g., stopping generic "Sentry Departed" messages from appearing when interacting with Pete).

## 2. Quest / Mission Engine
The procedural quest engine (`generateMissionsForLocation`) populates locations with diverse mission types.

### Quest Types
1.  **Bounties**: Target specific outlaws. Players must track them down, engage in a firefight (or use standoff bypasses), and return the captive to a sheriff's office for the reward.
2.  **Bank Robberies**: High-risk, high-reward heists in towns that severely damage the player's reputation.
3.  **Nest Clearing**: Eliminating creatures like Scorpions in wilderness tiles.
4.  **Escort**: Protecting wagons from outlaws.
5.  **Scavenge**: Finding native relics in hostile camps.
6.  **Investigation/Myth/Diplomacy**: Multi-stage, non-combat narrative quests requiring the player to visit several locations in sequence, resolving skill checks or dialog trees.

### Investigation & UX Flow
*   When arriving at an Investigation quest stage, a modal prompts the player to make a choice or read narrative flavor text.
*   **Recent Fixes**: The investigation modal was previously lacking outcome feedback. Now, players receive a clear "Success" or "Failure" resolution dialogue summarizing the results of their choices, any clues found, and loot collected before the modal is dismissed.

## 3. Risk & Reward Balance
*   **Combat Difficulty**: Mission danger is strictly tied to the Location's intrinsic `risk` modifier, ensuring players do not encounter "deadly" bounties in low-level starting zones.
*   **Loot Economy**: Bounty rewards scale quadratically with the target's level (`targetLevel * 15 + Math.pow(targetLevel - 1, 2) * 1.4 + 10`). This ensures that early bounties pay out a modest $30-50, while late-game high-tier outlaws drop $300+, correctly compensating for the increased ammo consumption and medical costs required to survive them.
*   **Reputation System**: Actions like bank robberies correctly grant high immediate payouts but carry steep reputation penalties (-25), balancing the economic injection by locking the player out of lawful discounts.

## Recommendations for Future Scaling
*   **Investigation Tracking**: Consider adding a "Journal" tab in the player's UI to review previously uncovered clues for multi-stage myth quests.
*   **More Standoff Contexts**: The `getContextualOption` system works excellently for Slippery Pete and Scorpions. This should be expanded to include unique flavor text for Bank Heists (e.g., options to "Intimidate Teller" or "Sabotage Alarm").
