# UX & UI Review / Optimization Findings

## Core Philosophy
The current interface presents an overwhelming amount of information to the player at all times. By adopting a contextual, progressive-disclosure approach, we can drastically reduce cognitive load, particularly during high-stakes tactical combat.

## 1. Tactical Combat (CombatView.tsx)
The combat view is the most critical area for UX improvements. It currently suffers from "dashboard syndrome"—every possible action and metric is visible all the time.

### Findings & Clutter Sources:
- **Medical & Consumable Actions:** Buttons for Tourniquet, Whiskey, Bandages, and Elixirs often take up space even when the player isn't actively bleeding, poisoned, or sometimes when lacking the items.
- **Weapon Actions:** Reload, Fanning, and Scoped Targeting buttons cluster the interface, drawing focus away from the grid.
- **Combat Logs:** Text logs are overly verbose, rapidly expanding, and take up valuable screen real estate. Reading them distracts from the visual state of the board.
- **Stats Overhead:** Background calculations and stat readouts clutter the immediate tactical decisions.
- **Action Points (AP):** Often represented as numbers, making calculating sequential actions mentally taxing compared to visual indicators.

### Recommendations (What the Player *Actually* Needs to Know):
- [x] (Complete) **Visual AP Pips:** Convert Action Points into visual 'pips' or a segmented bar. Hovering over a grid cell or action should 'ghost' (preview) the AP cost by reducing the opacity of those pips.
- [x] (Complete) **Contextual Action Bar (Progressive Disclosure):**
  - [x] (Complete) **Hide** medical items unless health is damaged or a specific injury (bleeding, venom) is active. Only show them if the player actually has them in their inventory.
  - [x] (Complete) **Hide** "Reload" if the clip is full. Highlight it aggressively (e.g., pulsing red) if the clip is empty.
  - [x] (Complete) **Hide** "Targeting/Fanning" unless an enemy is actively selected or in range.
- [x] (Complete) **Simplified Target Overlay:** When an enemy is clicked, show a clean, floating mini-card near them (or fixed at the bottom edge) with just: HP bar, Hit Chance %, and AP cost to fire.
- [x] (Complete) **Log Reduction:** Compress the combat log into a 3-line ephemeral ticker, or rely entirely on the floating text animations on the grid itself (hit-splats, status icons) for immediate feedback.

## 2. General Navigation & Overland Map
### Findings & Clutter Sources:
- Traveling encounters and status updates can feel text-heavy.
- The distinction between active interactions and passive information isn't always visually clear.

### Recommendations:
- [x] (Complete) **Clean Focus Modes:** While traveling the overland map, dim out or hide inventory and non-essential stats until camp is made. 
- [x] (Complete) **Time Visualization:** Use a visual sun/moon dial or dynamic background sky for the time of day instead of raw hour strings, as time heavily impacts travel risk and ambush chances.

## 3. Character Sheet & Inventory
### Findings & Clutter Sources:
- The inventory and trait lists can become long walls of text as the game progresses.

### Recommendations:
- [x] (Complete) **Collapsible Categories:** Group items into strict categories (Weapons, Consumables, Valuables) with accordion closures.
- [x] (Complete) **Consistent Iconography:** Lean harder into standard icons for stats (Heart = HP, Boot = AP/Movement, Shield = Resistance) to reduce word count.

---
**Awaiting your instructions** on which of these areas you would like to tackle first. We can begin by doing a major decluttering pass on `CombatView.tsx` to implement contextual action menus and visual AP indicators.

## 4. Hydration Mechanics (Current Status & Recommendations)
### Current Implementation:
Currently, the game **does not have an active hydration metric or thirst decay system**. "Water" only exists as flavor text in travel logs (e.g., "💦 TRAILSIDE CACHE: Located some clear water...") or as town descriptions/perk descriptions ("Hardy Desert Horseman: Saves 30% water hydration"). 

### Recommendations for Implementation:
If you want to implement meaningful hydration mechanics rather than just flavor:
1. **Core Metric (Clean UI):** Add an `Energy` or `Hydration` bar (e.g., a blue water-drop meter) below the HP bar in the general game layout (`App.tsx`).
2. **Decay System:** Every time the player travels on the Overland Map, they lose hydration relative to the distance and the weather condition (e.g., Heatwaves drain double).
3. **Penalties:** Reaching 0 hydration should not outright kill the player to avoid frustration, but it should cause significant debuffs (e.g., -50% max AP in combat, loss of HP regen, increased ambush chance due to exhaustion).
4. **Replenishment:** Add a "Canteen" item to the trail saddlebags that can be refilled at Town Wells or Oasis points on the map. Drinking it replenishes the bar.
5. **Declutter Synergy:** Keep the hydration bar completely hidden during tactical combats, as dehydration penalties should simply be reflected in your total AP limit before the fight starts.
