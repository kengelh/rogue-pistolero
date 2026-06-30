import { OverlandActor, Location } from "../types";
import { TRADE_GOODS } from "./trade";

export const OVERLAND_ACTOR_TEMPLATES = [
  {
    id: "actor_silas_thorne",
    name: "Silas Thorne",
    type: "bounty_hunter" as const,
    speed: 1.6,
    avatarIcon: "🤠",
    description: "A grizzled veteran bounty hunter wearing a dark duster, checking a stack of wanted posters.",
    bountyTargetPrice: 150,
  },
  {
    id: "actor_deputy_miller",
    name: "Deputy Miller",
    type: "bounty_hunter" as const,
    speed: 1.4,
    avatarIcon: "⭐",
    description: "An official deputy carrying a shiny silver badge and heavy iron shackles.",
    bountyTargetPrice: 100,
  },
  {
    id: "actor_red_river_bob",
    name: "Red River Bob",
    type: "bandit" as const,
    speed: 1.5,
    avatarIcon: "💀",
    description: "An outlaw on a black stallion, his face hidden behind a blood-red bandana.",
    bountyTargetPrice: 120,
  },
  {
    id: "actor_belle_starr",
    name: "Belle Starr",
    type: "bandit" as const,
    speed: 1.8,
    avatarIcon: "👠",
    description: "A high-risk bandit queen with twin pistols and an eye for shiny caravans.",
    bountyTargetPrice: 200,
  },
  {
    id: "actor_wagonmaster_mcgee",
    name: "Wagonmaster McGee",
    type: "trader" as const,
    speed: 0.9,
    avatarIcon: "🛒",
    description: "A cheerful merchant towing a heavy, wooden covered wagon loaded with basic goods.",
  },
  {
    id: "actor_chester_peddler",
    name: "Chester the Peddler",
    type: "trader" as const,
    speed: 1.2,
    avatarIcon: "🎒",
    description: "A travelling salesman carrying an enormous pack of strange elixirs and novelties.",
  },
  {
    id: "actor_running_elk",
    name: "Chief Running Elk",
    type: "native" as const,
    speed: 1.5,
    avatarIcon: "🏹",
    description: "An elder tracker of the native tribes, moving with incredible stealth and carrying hand-woven medicines.",
  },
  {
    id: "actor_silver_feather",
    name: "Silver Feather",
    type: "native" as const,
    speed: 1.7,
    avatarIcon: "🪶",
    description: "A quiet tribal scout who knows every river valley and hidden oasis in the badlands.",
  },
];

export function generateOverlandActors(locations: Location[]): OverlandActor[] {
  if (locations.length === 0) return [];

  const startingTown = locations[0];

  return OVERLAND_ACTOR_TEMPLATES.map((tpl, idx) => {
    let startLoc = locations[idx % locations.length];

    if (tpl.type === "bandit") {
      // Find locations that are far from the starting town (at least 25 units away)
      const farLocs = locations.filter(
        (l) => Math.hypot(l.x - startingTown.x, l.y - startingTown.y) > 25
      );
      // Prefer outlaw factions or hostile camps
      const outlawLocs = farLocs.filter(
        (l) => l.controllingFaction === "outlaws" || l.type === "hostile_camp" || l.type === "outlaw_haven"
      );
      const chosenPool = outlawLocs.length > 0 ? outlawLocs : farLocs.length > 0 ? farLocs : locations;
      startLoc = chosenPool[Math.floor(Math.random() * chosenPool.length)];
    }

    // Slight offset from the town so they aren't directly on top initially
    const angle = (idx * Math.PI * 2) / OVERLAND_ACTOR_TEMPLATES.length;
    let x = Math.max(5, Math.min(95, startLoc.x + Math.cos(angle) * 8));
    let y = Math.max(5, Math.min(95, startLoc.y + Math.sin(angle) * 8));

    // Force bandit position to stay away from the starting town if somehow close
    if (tpl.type === "bandit" && startingTown) {
      const distToStart = Math.hypot(x - startingTown.x, y - startingTown.y);
      if (distToStart < 25) {
        const dirX = x - startingTown.x || 1;
        const dirY = y - startingTown.y || 1;
        const len = Math.hypot(dirX, dirY) || 1;
        x = Math.max(5, Math.min(95, startingTown.x + (dirX / len) * 30));
        y = Math.max(5, Math.min(95, startingTown.y + (dirY / len) * 30));
      }
    }

    // Assign custom trade inventory for traders and natives
    let tradeInventory: { itemId: string; quantity: number; priceMultiplier: number }[] | undefined;
    if (tpl.type === "trader") {
      tradeInventory = [
        { itemId: "canned_beans", quantity: Math.floor(Math.random() * 8) + 5, priceMultiplier: 0.8 },
        { itemId: "sarsaparilla", quantity: Math.floor(Math.random() * 4) + 2, priceMultiplier: 1.1 },
        { itemId: "used_spittoons", quantity: Math.floor(Math.random() * 2) + 1, priceMultiplier: 0.7 },
        { itemId: "questionable_salve", quantity: Math.floor(Math.random() * 5) + 3, priceMultiplier: 1.0 },
      ];
    } else if (tpl.type === "native") {
      tradeInventory = [
        { itemId: "questionable_salve", quantity: Math.floor(Math.random() * 4) + 4, priceMultiplier: 0.7 },
        { itemId: "jackalope_horns", quantity: Math.floor(Math.random() * 2) + 1, priceMultiplier: 0.8 },
        { itemId: "tumbleweed_seeds", quantity: Math.floor(Math.random() * 10) + 5, priceMultiplier: 0.5 },
      ];
    }

    return {
      id: tpl.id,
      name: tpl.name,
      type: tpl.type,
      x,
      y,
      speed: tpl.speed,
      state: "wandering" as const,
      health: 100,
      maxHealth: 100,
      bountyTargetPrice: tpl.bountyTargetPrice,
      tradeInventory,
      avatarIcon: tpl.avatarIcon,
      description: tpl.description,
      isDefeated: false,
    };
  });
}

export function tickOverlandActors(
  actors: OverlandActor[],
  playerX: number,
  playerY: number,
  playerBounty: number,
  playerReputation: number,
  locations: Location[],
  hoursDelta: number
): { updatedActors: OverlandActor[]; logs: string[] } {
  const logs: string[] = [];
  const startingTown = locations[0];

  const updatedActors = actors.map((actor) => {
    if (actor.isDefeated) return actor;

    const distToPlayer = Math.hypot(playerX - actor.x, playerY - actor.y);
    let state = actor.state;
    let nextX = actor.x;
    let nextY = actor.y;
    let speed = actor.speed * hoursDelta * 6.5; // Scale speed per game hours ticks

    // State machine logic
    if (actor.type === "bounty_hunter") {
      if (playerBounty >= 50) {
        state = "hunting";
        // Head directly towards the player
        const angle = Math.atan2(playerY - actor.y, playerX - actor.x);
        nextX += Math.cos(angle) * speed * 1.3;
        nextY += Math.sin(angle) * speed * 1.3;
        
        // Notify if they are on your tail
        if (Math.random() < 0.15 && distToPlayer > 3 && distToPlayer < 25) {
          logs.push(`⚠️ BOUNTY TRACKER: ${actor.name} has picked up your scent in Sector ${Math.round(actor.x)},${Math.round(actor.y)}!`);
        }
      } else {
        state = "patrolling";
        // Patrol towards the closest town, choose next town if near
        if (!actor.targetLocationId && locations.length > 0) {
          const randTown = locations[Math.floor(Math.random() * locations.length)];
          actor.targetLocationId = randTown.id;
          actor.targetX = randTown.x;
          actor.targetY = randTown.y;
        }

        if (actor.targetX !== undefined && actor.targetY !== undefined) {
          const distToTarget = Math.hypot(actor.targetX - actor.x, actor.targetY - actor.y);
          if (distToTarget < 2.5 && locations.length > 1) {
            // Pick a new town
            const remaining = locations.filter(l => l.id !== actor.targetLocationId);
            const nextTown = remaining[Math.floor(Math.random() * remaining.length)];
            actor.targetLocationId = nextTown.id;
            actor.targetX = nextTown.x;
            actor.targetY = nextTown.y;
          }

          const angle = Math.atan2(actor.targetY - actor.y, actor.targetX - actor.x);
          nextX += Math.cos(angle) * speed * 0.9;
          nextY += Math.sin(angle) * speed * 0.9;
        }
      }
    } else if (actor.type === "bandit") {
      const distPlayerToStart = startingTown ? Math.hypot(playerX - startingTown.x, playerY - startingTown.y) : 100;
      
      // Only hunt/threaten player if the player is far from starting town (> 25 units)
      if (distToPlayer <= 15 && distPlayerToStart > 25) {
        state = "hunting";
        const angle = Math.atan2(playerY - actor.y, playerX - actor.x);
        nextX += Math.cos(angle) * speed * 1.1;
        nextY += Math.sin(angle) * speed * 1.1;
        if (Math.random() < 0.12 && distToPlayer > 3) {
          logs.push(`💀 OUTLAW THREAT: ${actor.name} spotted you and is in hot pursuit!`);
        }
      } else {
        // Wandering around outlaw/remote territory, repelled by starting town
        state = "wandering";
        const angle = (Math.sin(actor.x * 0.5) + Math.cos(actor.y * 0.5)) * Math.PI;
        let candidateX = actor.x + Math.cos(angle) * speed * 0.5;
        let candidateY = actor.y + Math.sin(angle) * speed * 0.5;

        if (startingTown) {
          const distCandidateToStart = Math.hypot(candidateX - startingTown.x, candidateY - startingTown.y);
          if (distCandidateToStart < 25) {
            // Repel from starting town
            const repelAngle = Math.atan2(actor.y - startingTown.y, actor.x - startingTown.x);
            candidateX = actor.x + Math.cos(repelAngle) * speed * 0.6;
            candidateY = actor.y + Math.sin(repelAngle) * speed * 0.6;
          }
        }
        nextX = candidateX;
        nextY = candidateY;
      }
    } else if (actor.type === "trader") {
      state = "patrolling";
      // Patrol back and forth between two random settlements
      if (!actor.targetLocationId && locations.length > 0) {
        const randTown = locations[Math.floor(Math.random() * locations.length)];
        actor.targetLocationId = randTown.id;
        actor.targetX = randTown.x;
        actor.targetY = randTown.y;
      }

      if (actor.targetX !== undefined && actor.targetY !== undefined) {
        const distToTarget = Math.hypot(actor.targetX - actor.x, actor.targetY - actor.y);
        if (distToTarget < 2.0 && locations.length > 1) {
          const remaining = locations.filter(l => l.id !== actor.targetLocationId);
          const nextTown = remaining[Math.floor(Math.random() * remaining.length)];
          actor.targetLocationId = nextTown.id;
          actor.targetX = nextTown.x;
          actor.targetY = nextTown.y;
        }

        const angle = Math.atan2(actor.targetY - actor.y, actor.targetX - actor.x);
        nextX += Math.cos(angle) * speed * 0.7;
        nextY += Math.sin(angle) * speed * 0.7;
      }
    } else if (actor.type === "native") {
      state = "wandering";
      // Quiet scout wanders forest/river spaces (simple wander with sine)
      const angle = (Math.cos(actor.x * 0.2) + Math.sin(actor.y * 0.2)) * Math.PI * 2;
      nextX += Math.cos(angle) * speed * 0.8;
      nextY += Math.sin(angle) * speed * 0.8;
    }

    // Keep actors on bounds
    nextX = Math.max(3, Math.min(97, nextX));
    nextY = Math.max(3, Math.min(97, nextY));

    return {
      ...actor,
      state,
      x: nextX,
      y: nextY,
    };
  });

  return { updatedActors, logs };
}

export function getActorDialogue(
  actor: OverlandActor,
  playerBounty: number,
  playerReputation: number
): { text: string; options: { text: string; action: string }[] } {
  const options = [
    { text: "Ask for rumors & information", action: "ask_info" },
  ];

  if (actor.tradeInventory && actor.tradeInventory.length > 0) {
    options.push({ text: "Examine trade goods", action: "trade" });
  }

  options.push({ text: "Draw iron & Attack them!", action: "attack" });

  let text = "";
  if (actor.type === "bounty_hunter") {
    if (playerBounty >= 50) {
      text = `"Hands where I can see 'em, Stranger! There's $${playerBounty} riding on your saddle, and I plan to collect. Throw down your gun or face the lead!"`;
      return {
        text,
        options: [
          { text: "Fight! (Start shootout)", action: "attack" },
          { text: `Bribe them ($${Math.round(playerBounty * 1.5)} Gold)`, action: "bribe" },
          { text: "Surrender & Submit to Law", action: "surrender" },
        ],
      };
    } else {
      text = `"Keep your hands clean, Stranger. I only hunt outlaws with a price on their head, but I'm keeping an eye on you."`;
    }
  } else if (actor.type === "bandit") {
    text = `"Well look what crawled out of the brush! This is bandit territory, friend. Hand over $50 trail toll or prepare to meet your maker!"`;
    return {
      text,
      options: [
        { text: "Pay $50 trail toll", action: "pay_bandit" },
        { text: "Attack! (Defend yourself)", action: "attack" },
        { text: "Ask if they have any useful info", action: "ask_info_bandit" },
      ],
    };
  } else if (actor.type === "trader") {
    text = `"Howdy, fellow traveler! McGee's Expeditions welcomes you. The badlands are dry and dusty, but my wagon is full of crisp supplies. Care to browse?"`;
  } else if (actor.type === "native") {
    text = `"May the great skies guide you. The earth is warm today. We do not seek conflict, but we have sacred salves and herbs if you wish to trade peacefully."`;
  }

  return { text, options };
}
