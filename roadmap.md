# 🌵 Frontier RPG: Dynamic Quest Interaction & Skill Check System (Roadmap)

This roadmap outlines a proposed system to enhance active quests with interactive, skill-gated options. Instead of hardcoded binary choices, quests can dynamically roll from a pool of contextual interaction slots based on player attributes, location, and quest type.

---

## ⚙️ 1. Core Mechanics & Random Slotting

To keep encounters unpredictable and highly replayable, we propose a **Dynamic Quest Option Generator**:
* **Pool Categorization**: Options are grouped by tags (e.g., `#urban`, `#wilderness`, `#combat`, `#investigation`, `#stealth`).
* **Slotting Engine**: When an accepted quest is activated in town or on the trail:
  1. It reserves **Slot 1** for the **Standard Resolution** (e.g., immediate combat or completion).
  2. It randomly picks **Slot 2** and **Slot 3** from matching category pools.
* **Skill Scaling**: Success rates scale dynamically with player stats (e.g., `base_chance + (player.attribute * 5%)`).

---

## 🎯 2. The 50 Generic Dynamic Interaction Options

Below is a master catalog of 50 generic interaction options, complete with situational contexts, required skills, success thresholds, and balanced narrative outcomes.

### 💬 Category A: Charisma & Silver Tongue (Persuasion, Intimidation, Deception)

| ID | Generic Option | Universal Situation | Required Skill | Threshold | Success Outcome | Failure Consequence |
|----|----------------|---------------------|----------------|-----------|-----------------|---------------------|
| 1 | **Charm a Sentry** | Confronting a lone guard at any entrance. | Charisma | Medium (60%) | Guard lets you pass peacefully; gain Surprise advantage. | Guard sounds the alarm; combat starts with enemy firing first. |
| 2 | **Bluff with Authority** | Confronting skittish outlaws or nervous guards. | Deception | Hard (75%) | Targets surrender immediately, offering gold as a bribe. | They recognize the bluff and draw weapons; lost initiative. |
| 3 | **Buy Information** | Seeking leads on a hiding target in any town/settlement. | Charisma | Easy (45%) | Target's exact coordinate is revealed on the map. | You get conned; lose $15 gold and gain zero leads. |
| 4 | **Bribe with Counterfeit Goods**| Meeting a corrupt or greedy guard, scout, or trader. | Sleight of Hand | Medium (65%) | Target lets you bypass a locked gate or gives key. | Caught red-handed; local reputation drops by 10. |
| 5 | **Intimidate with Raw Brawn** | Facing a weak target surrounded by several lackeys. | Strength / Grit | Hard (70%) | Minor lackeys flee the scene, leaving target isolated. | The entire gang gets agitated, fighting with boosted damage. |
| 6 | **Demand a Cut of the Booty** | Intercepting a thief or scavenger before they escape. | Charisma | Hard (80%) | Secure 50% of the stash peacefully; quest completes. | Target gets defensive and fires; player starts combat at -10 HP. |
| 7 | **Spin a Sympathy Story** | Caught trespassing in restricted areas. | Empathy / Charisma | Easy (50%) | Occupants apologize, offering directions or healing items. | Occupants attack immediately, calling reinforcements. |
| 8 | **De-escalate Hostility** | Cornered by hostile forces with civilians nearby. | Charisma | Hard (85%) | Hostages are freed safely; massive reputation and honor boost. | Fight starts instantly; quest reward is halved. |
| 9 | **Blackmail with Secret Intel** | Forcing an uncooperative official or local leader. | Insight | Medium (60%) | Target hands over key codes or extra funding. | Target calls guards; player gets fined or branded an outlaw. |
| 10 | **Stir Up a Crowd Distraction** | Trying to sneak into a heavily guarded building. | Charisma | Medium (65%) | Sentry leaves post to investigate; path cleared. | Caught inciting a riot; lose 1 turn or get jailed. |

---

### 👣 Category B: Stealth, Infiltration & Sabotage

| ID | Generic Option | Universal Situation | Required Skill | Threshold | Success Outcome | Failure Consequence |
|----|----------------|---------------------|----------------|-----------|-----------------|---------------------|
| 11 | **Pickpocket Key Item** | Slipping past an oblivious guard or sleeping boss. | Stealth | Medium (60%) | Obtain keys or quest items without triggering combat. | Caught red-handed; target alerts camp, combat begins. |
| 12 | **Sabotage Mounts / Vehicles** | Approaching an enemy camp with horses/carriages. | Agility | Medium (65%) | Enemies cannot flee or chase you; delay enemy arrivals. | Spooked animals alert camp; combat starts out in the open. |
| 13 | **Taint the Camp Supplies** | Infiltrating an active camp during their resting hour. | Survival | Hard (75%) | Several minor combatants start combat asleep or weakened. | Spotted at the supply line; forced into a close shootout. |
| 14 | **Infiltrate via Alternate Entry**| Entering any locked building or structure. | Agility | Easy (50%) | Bypasses front guards and traps entirely. | Caught in tight space; start combat with a penalty to defense. |
| 15 | **Rig Environmental Hazard** | Finding explosive or hazardous barrels in the area. | Engineering | Hard (80%) | Trigger a massive trap dealing heavy area damage to targets. | Trap detonates prematurely; player takes massive blast damage. |
| 16 | **Shadow an Associative Target** | Tracking a hard-to-find target in an urban area. | Stealth | Easy (55%) | Target is tracked directly back to their hideout. | Lose the trail; waste time and suffer increased dehydration. |
| 17 | **Blend in with Disguise** | Entering a heavily guarded fortress, camp, or manor. | Deception | Medium (70%) | Walk straight to the objective without raising alarms. | Disguise falls off; instant shootout with zero initial cover. |
| 18 | **Cut Communications** | Infiltrating a modern fort, depot, or post. | Agility | Easy (45%) | Targets are unable to call for reinforcements during combat. | Trigger electrical shock or alarm; enemies alert. |
| 19 | **Infiltrate & Loot Private Quarters** | Entering an enemy leader's tent or study undetected. | Stealth | Medium (60%) | Find a chest of gold or maps to bonus stash. | Trigger a tripwire; take 15 shrapnel damage and sound alarm. |
| 20 | **Smuggle Concealed Weapons** | Entering a safe-zone town or high-security building. | Deception | Hard (75%) | Retain full arsenal of primary weapons inside. | Primary weapons confiscated; forced to fight with fists or knife. |

---

### 👁️ Category C: Insight, Perception & Tracking

| ID | Generic Option | Universal Situation | Required Skill | Threshold | Success Outcome | Failure Consequence |
|----|----------------|---------------------|----------------|-----------|-----------------|---------------------|
| 21 | **Scan for High-Ground Threats**| Approaching a tight canyon or narrow trail. | Perception | Medium (60%) | Avoid ambush entirely; reverse-ambush sniper targets. | Sniper fires first; player takes heavy damage on turn one. |
| 22 | **Examine Broken Ground Trails** | Tracking a target through wilderness or forest biomes. | Survival | Easy (50%) | Shorten travel steps by 50%; catch target off guard. | Wander into a hunting trap; take damage and lose speed. |
| 23 | **Identify Unlocked Entryway** | Looking for a way inside a secure warehouse or shop. | Perception | Easy (40%) | Slip inside unnoticed; gain 1 turn of complete surprise. | Squeaky frame alerts target; they flee or secure the entrance. |
| 24 | **Decipher Coded Markers** | Hunting an elusive target who leaves hidden signs. | Insight | Medium (65%) | Uncover hidden supply caches and enemy patrol weakness. | Code is misread; walk straight into a hazard or toxic area. |
| 25 | **Deduce Distance from Audio Echoes**| Hearing distant sounds or gunfire on the trail. | Perception | Easy (55%) | Arrive at the distress signal in time to save allies; double loot.| Miscalculate direction; arrive too late, finding ruined ruins. |
| 26 | **Spot Structural Weak Point** | Confronting enemies inside a fragile/decaying building. | Insight | Hard (75%) | Collapse a beam or wall, defeating minor targets instantly. | Structure collapses on you; take heavy blunt damage. |
| 27 | **Analyze Trail Tread Depth** | Deciding between multiple paths or tracks on the road. | Insight | Medium (60%) | Follow the track with the gold/supplies, avoiding empty decoys.| Follow dummy path; get ambushed by lookouts. |
| 28 | **Detect Nervous Behavioral Tell**| Interrogating an uncooperative or lying suspect. | Empathy | Medium (65%) | Suspect breaks under pressure, giving up location of loot. | Accuse wrong person; lose local reputation and honor. |
| 29 | **Read Wildlife Movements** | Searching for missing assets or lost persons in wasteland. | Survival | Easy (50%) | Locate targets quickly; gain high reputation boost. | Waste time following false trails; lose hydration. |
| 30 | **Audit Records for Discrepancies**| Investigating suspect accounts or trade manifests. | Insight | Hard (80%) | Expose corruption; gain large bounty reward and merchant trust. | Exposed as meddling; thugs ambush you in next safe town. |

---

### 🤠 Category D: Marksman, Grit & Combat Ingenuity

| ID | Generic Option | Universal Situation | Required Skill | Threshold | Success Outcome | Failure Consequence |
|----|----------------|---------------------|----------------|-----------|-----------------|---------------------|
| 31 | **Shoot Loose Overhead Hazard** | Shootout occurring inside any built structure. | Marksman | Hard (80%) | Environmental object falls, crushing and stunning targets. | Miss hazard; waste precious ammo and lose current cover. |
| 32 | **Fire Loud Warning Shot** | Confronting a group of hostile but hesitant brawlers. | Marksman | Easy (40%) | Hostile crowd disperses; boss is left isolated and afraid. | Crowd gets enraged; you get swarmed, losing initiative. |
| 33 | **Blast Thrown Explosive** | Target attempts to throw dynamite or a grenade. | Marksman | Hard (85%) | Explosive detonates in enemy's hand, wiping out squad. | Explosive lands on player's position; take double damage. |
| 34 | **Shoot Off Locked Fastener** | Trying to escape a locked room, cage, or burning corral.| Marksman | Medium (60%) | Escape instantly without using lockpicks or keys. | Richochet shot grazes player; take minor self-damage. |
| 35 | **Brace for Enemy Charge** | Massive charging beast or rush of melee attackers. | Grit | Medium (65%) | Hold ground and land heavy stopping shots; stop the rush. | Lose nerve and run; trampled or swarmed for massive damage. |
| 36 | **Quick-Draw Disarm** | Standoff or duel with an outlaw boss. | Quick Draw | Hard (80%) | Shoot weapon from target's hand; capture them peacefully. | Target fires first; player starts shootout with low HP. |
| 37 | **Channel Adrenaline Burst** | Surrounded by multiple targets at close range. | Grit | Medium (70%) | Ignore combat pain; weapon reload speed is doubled. | Crash from fatigue early; speed and evasion drop to zero. |
| 38 | **Destroy Water/Fluid Barrier** | Fight taking place near high towers or water valves. | Marksman | Medium (60%) | Wash out enemy positions, destroying their armor/evasion. | Flood your own line of sight; accuracy is halved. |
| 39 | **Attempt Ricochet Shot** | Target is fully hidden behind solid steel/stone cover. | Marksman | Hard (85%) | Bypass target's cover entirely, landing a critical hit. | Gun chamber jams; gun condition drops and waste turn. |
| 40 | **Throw Sand / Dust** | Trapped in close-quarters grapple or tight melee. | Agility | Easy (50%) | Blind attacker for two turns, allowing free escape. | Miss target's eyes; attacker tightens hold, dealing damage. |

---

### 🌿 Category E: Survival, Medicine & Wilderness Wisdom

| ID | Generic Option | Universal Situation | Required Skill | Threshold | Success Outcome | Failure Consequence |
|----|----------------|---------------------|----------------|-----------|-----------------|---------------------|
| 41 | **Apply Crude First Aid** | Encountering wounded travelers or injured informants. | Medicine | Easy (45%) | Target is saved, revealing shortcut and secret map locations.| Target passes away; lose honor and local trust. |
| 42 | **Tame Wild Beast** | Encountering aggressive or unbroken wild mounts. | Survival | Medium (60%) | Beast is tamed; travel speed is increased by 50% for 1 day.| Beast kicks or bites player; take 15 physical damage. |
| 43 | **Brew Emergency Medicine** | Poisoned by local flora, snakes, or dirty arrows. | Medicine | Easy (50%) | Neutralize poison fully; gain temporary immunity to poison.| Poison worsens; lose maximum HP until rest. |
| 44 | **Harvest Nutritious Resources** | Wandering through wilderness or desert locations. | Survival | Easy (40%) | Safely gather food and clean fluids (+30 HP, +20 Hydration). | Trigger allergy or hazard; take damage and suffer blindness. |
| 45 | **Locate Deep Safe Spring** | Running critically low on water in dry biomes. | Survival | Medium (55%) | Uncover hidden water vein; fully restore hydration levels. | Drink contaminated fluid; maximum HP is reduced temporarily. |
| 46 | **Establish Decoy Campsite** | Camping overnight in highly hostile territory. | Survival | Medium (65%) | Bandit ambush attacks empty camp; player gains surprise turn. | Fire goes out of control, burning random inventory items. |
| 47 | **Forage Pain-Relief Herbs** | Tracking a target while player is injured. | Survival | Easy (50%) | Gather natural poultices that heal 25 HP. | Mistake toxic herb for medicine; lose speed and stamina. |
| 48 | **Navigate by Stars / Landmarks**| Traveling during dark hours or dense duststorms. | Navigation | Medium (60%) | Reach destination safely without using rations or water. | Lose direction; wander back to starting coordinates exhausted. |
| 49 | **Apply Natural Sedative Smoke**| Sneaking up on an active, resting enemy campsite. | Medicine | Hard (75%) | Minor sentries fall asleep; bypass security without combat. | Wind shifts; player inhales smoke, falling asleep or confused. |
| 50 | **Follow Blood / Scents in Storm**| Hunting a wounded target during severe storm weather. | Survival | Hard (70%) | Find target's hidden cave before tracks are fully washed out. | Lose trail entirely; target recovers full health. |

---

## 🛠️ 3. Proposed Engineering Implementation

To implement this without breaking the existing framework, we can introduce a lightweight schema in `src/types.ts`:

```typescript
export interface QuestOption {
  id: string;
  name: string;
  skill: "charisma" | "stealth" | "perception" | "marksman" | "survival";
  threshold: number; // e.g. 60
  successText: string;
  failureText: string;
  onSuccess: (player: Player) => Partial<Player>;
  onFailure: (player: Player) => Partial<Player>;
}
```

This structure integrates cleanly into our new automatic town popup triggers, providing rich, non-linear ways to survive the deadly but comically unpredictable frontier!
