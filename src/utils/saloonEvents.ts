import { Player, InventoryItem } from '../types';

function modifyAmmo(p: Player, amount: number): Partial<Player> {
  const ammoItemId = `ammo_${p.weapon.ammoType || 'pistol'}`;
  const inv = [...p.inventory];
  const target = inv.find(i => i.id === ammoItemId);
  if (target) {
    target.count = Math.max(0, target.count + amount);
    if (target.count <= 0) {
      return { inventory: inv.filter(i => i.id !== ammoItemId) };
    }
  } else if (amount > 0) {
    inv.push({
      id: ammoItemId,
      name: `Special Ammunition`,
      type: 'consumable',
      value: 10,
      count: amount,
      details: 'Ammunition.'
    });
  }
  return { inventory: inv };
}

export interface SaloonEventOption {
  text: string;
  effectMessage: string;
  effect: (player: Player) => Partial<Player>;
}

export interface SaloonEvent {
  id: string;
  title: string;
  description: string;
  options: SaloonEventOption[];
}

export const SALOON_EVENTS: SaloonEvent[] = [
  {
    id: "cheat_poker",
    title: "The River Card",
    description: "You notice a slick-looking gambler slipping an Ace of Spades up his sleeve during high-stakes poker.",
    options: [
      { text: "Call him out loud", effectMessage: "You draw iron and call him a cheat. He flees, leaving some gold behind.", effect: (p) => ({ gold: p.gold + 20, reputation: p.reputation + 5 }) },
      { text: "Blackmail him quietly", effectMessage: "He slips you a heavy purse under the table to keep your mouth shut.", effect: (p) => ({ gold: p.gold + 50, reputation: p.reputation - 5 }) },
      { text: "Ignore it", effectMessage: "Not your money, not your problem.", effect: (p) => ({}) }
    ]
  },
  {
    id: "arm_wrestle",
    title: "Test of Strength",
    description: "A hulking, drunk miner slams his fist on the table and challenges you to an arm wrestle.",
    options: [
      { text: "Accept fairly", effectMessage: "You win and the crowd cheers. He buys you a drink.", effect: (p) => ({ hp: Math.min(p.maxHp, p.hp + 15), reputation: p.reputation + 2 }) },
      { text: "Kick his shin", effectMessage: "You cheat to win. He looks confused but hands over his bet.", effect: (p) => ({ gold: p.gold + 15, reputation: p.reputation - 2 }) },
      { text: "Decline", effectMessage: "He calls you yellow but leaves you alone.", effect: (p) => ({ reputation: p.reputation - 1 }) }
    ]
  },
  {
    id: "annoying_piano",
    title: "Plinky Plonk",
    description: "The piano player is butchering a saloon tune so badly it's rattling your teeth.",
    options: [
      { text: "Tip him to stop", effectMessage: "You flip him a coin. Silence is golden.", effect: (p) => ({ gold: Math.max(0, p.gold - 2) }) },
      { text: "Shoot the piano", effectMessage: "You blow the piano keys clean off. The crowd is terrified.", effect: (p) => ({ ...modifyAmmo(p, -1), reputation: p.reputation - 10 }) },
      { text: "Endure it", effectMessage: "Your ears ring, but you tough it out. (+XP)", effect: (p) => ({ xp: p.xp + 10 }) }
    ]
  },
  {
    id: "card_sharp",
    title: "Sure Thing",
    description: "A card sharp offers you a 'sure thing' side bet on a game of faro.",
    options: [
      { text: "Take the bet", effectMessage: "It wasn't a sure thing. You lost some coin.", effect: (p) => ({ gold: Math.max(0, p.gold - 20) }) },
      { text: "Call his bluff", effectMessage: "You stare him down. He nervously hands you some hush money.", effect: (p) => ({ gold: p.gold + 15, reputation: p.reputation + 2 }) },
      { text: "Walk away", effectMessage: "Fools and their gold are soon parted.", effect: (p) => ({}) }
    ]
  },
  {
    id: "lost_horse",
    title: "Weeping Cowboy",
    description: "A cowboy is crying into his whiskey because his best horse threw a shoe and ran off.",
    options: [
      { text: "Buy him a drink", effectMessage: "You buy him a shot. He teaches you a riding trick.", effect: (p) => ({ gold: Math.max(0, p.gold - 5), horsemanship: (p.horsemanship || 0) + 5 }) },
      { text: "Tell him to man up", effectMessage: "You tell him to stop crying. He punches you in the jaw.", effect: (p) => ({ hp: Math.max(0, p.hp - 5), reputation: p.reputation - 2 }) },
      { text: "Ignore him", effectMessage: "He continues to sob loudly.", effect: (p) => ({}) }
    ]
  },
  {
    id: "dog_steak",
    title: "Stolen Steak",
    description: "A mangy mutt sprints past you with a patron's ribeye steak in its mouth.",
    options: [
      { text: "Kick the dog", effectMessage: "You meanly kick the dog. Everyone thinks you're a jerk.", effect: (p) => ({ reputation: p.reputation - 15 }) },
      { text: "Laugh at the patron", effectMessage: "You chuckle as the patron curses the dog.", effect: (p) => ({ reputation: p.reputation - 1 }) },
      { text: "Feed dog some of yours", effectMessage: "You toss the dog some scraps. It wags its tail happily.", effect: (p) => ({ reputation: p.reputation + 5, xp: p.xp + 10 }) }
    ]
  },
  {
    id: "snake_oil",
    title: "Miracle Cure",
    description: "A smartly dressed salesman approaches offering 'Dr. Higgins' Miracle Nerve Tonic'.",
    options: [
      { text: "Buy a bottle (-10g)", effectMessage: "It tastes awful but surprisingly makes you feel great!", effect: (p) => ({ gold: Math.max(0, p.gold - 10), hp: Math.min(p.maxHp, p.hp + 25) }) },
      { text: "Drink a free sample", effectMessage: "You take a sip and immediately throw up. Awful stuff.", effect: (p) => ({ hp: Math.max(1, p.hp - 10) }) },
      { text: "Chase him out", effectMessage: "You run the fraud out of the saloon. The bartender thanks you.", effect: (p) => ({ gold: p.gold + 5, reputation: p.reputation + 5 }) }
    ]
  },
  {
    id: "spilt_whiskey",
    title: "Spilt Whiskey",
    description: "A drunken ranch hand stumbles and spills whiskey on your boots.",
    options: [
      { text: "Demand compensation", effectMessage: "He apologizes and hands you a crumpled dollar.", effect: (p) => ({ gold: p.gold + 2 }) },
      { text: "Shove him", effectMessage: "You shove him. He falls over and the crowd gives you space.", effect: (p) => ({ reputation: p.reputation - 2 }) },
      { text: "Laugh it off", effectMessage: "You laugh it off and the bartender buys you a replacement drink.", effect: (p) => ({ hp: Math.min(p.maxHp, p.hp + 5), reputation: p.reputation + 2 }) }
    ]
  },
  {
    id: "brawl_starts",
    title: "Bar Brawl",
    description: "Two cowpokes start trading blows. Chairs are flying!",
    options: [
      { text: "Join the fray", effectMessage: "You crack some skulls! You take a few hits but feel invigorated.", effect: (p) => ({ hp: Math.max(1, p.hp - 15), xp: p.xp + 30 }) },
      { text: "Duck behind the bar", effectMessage: "You hide safely until it blows over.", effect: (p) => ({}) },
      { text: "Loot the tables", effectMessage: "You snatch some loose coins while everyone is distracted.", effect: (p) => ({ gold: p.gold + 15, reputation: p.reputation - 5 }) }
    ]
  },
  {
    id: "gold_nugget",
    title: "Shiny Floor",
    description: "You spot a glint of gold under a dusty spittoon.",
    options: [
      { text: "Pick it up", effectMessage: "You discretely pocket a small nugget.", effect: (p) => ({ gold: p.gold + 10 }) },
      { text: "Announce it", effectMessage: "You hold it up. The bartender claims it's his tip money.", effect: (p) => ({ reputation: p.reputation + 3 }) },
      { text: "Leave it", effectMessage: "You aren't desperate enough to touch spittoon floor dust.", effect: (p) => ({}) }
    ]
  },
  {
    id: "preacher",
    title: "Fire and Brimstone",
    description: "A loud preacher is standing on a table, shouting about the sins of whiskey and gambling.",
    options: [
      { text: "Listen intently", effectMessage: "His words give you pause to reflect on your life choices.", effect: (p) => ({ xp: p.xp + 15, reputation: p.reputation + 2 }) },
      { text: "Heckle him", effectMessage: "You mock him. He tells you you're going to hell.", effect: (p) => ({ reputation: p.reputation - 5 }) },
      { text: "Buy him a drink", effectMessage: "You slide him a whiskey. He pauses, chugs it, and leaves in shame.", effect: (p) => ({ gold: Math.max(0, p.gold - 5), reputation: p.reputation - 2 }) }
    ]
  },
  {
    id: "stolen_hat",
    title: "That's My Hat!",
    description: "A blurry-eyed drunk accuses you of wearing his hat.",
    options: [
      { text: "Stare him down", effectMessage: "Your icy glare makes him back off.", effect: (p) => ({ reputation: p.reputation + 2 }) },
      { text: "Give him a 'refund'", effectMessage: "You punch him square in the nose. He hits the floor.", effect: (p) => ({ reputation: p.reputation - 5 }) },
      { text: "Offer to buy it", effectMessage: "You confusingly offer to buy your own hat. He accepts $2.", effect: (p) => ({ gold: Math.max(0, p.gold - 2) }) }
    ]
  },
  {
    id: "wealthy_baron",
    title: "The Cattle Baron",
    description: "A rich baron tosses a coin and offers you $20 to pour a drink on a poor farmer's head.",
    options: [
      { text: "Do it for the money", effectMessage: "You humiliate the farmer. The baron laughs and pays you.", effect: (p) => ({ gold: p.gold + 20, reputation: p.reputation - 20 }) },
      { text: "Refuse honorably", effectMessage: "You refuse. The farmer nods in silent thanks.", effect: (p) => ({ reputation: p.reputation + 10 }) },
      { text: "Pour it on the baron", effectMessage: "You dump it on the baron! He storms out furiously.", effect: (p) => ({ reputation: p.reputation + 20, factionReputation: { ...p.factionReputation, lawmen: p.factionReputation.lawmen - 5 } }) }
    ]
  },
  {
    id: "talkative_drunk",
    title: "The Talker",
    description: "A friendly but incredibly drunk patron wraps an arm around you and starts rambling.",
    options: [
      { text: "Humor him", effectMessage: "You listen to his nonsense for an hour. Strangely, you learned something.", effect: (p) => ({ xp: p.xp + 25 }) },
      { text: "Brush him off", effectMessage: "You push him away. He sulks in the corner.", effect: (p) => ({}) },
      { text: "Pick his pocket", effectMessage: "You relieve him of some excess weight.", effect: (p) => ({ gold: p.gold + 8, reputation: p.reputation - 5 }) }
    ]
  },
  {
    id: "bounty_glare",
    title: "Cold Stares",
    description: "A notorious bounty hunter is glaring at you from across the dimly lit room.",
    options: [
      { text: "Glare back", effectMessage: "You match his stare. He tips his hat in grudging respect.", effect: (p) => ({ reputation: p.reputation + 5 }) },
      { text: "Buy him a drink", effectMessage: "You send a drink over. He nods and leaves you alone.", effect: (p) => ({ gold: Math.max(0, p.gold - 3) }) },
      { text: "Leave immediately", effectMessage: "You duck out before things get ugly. Cowardly but safe.", effect: (p) => ({ reputation: p.reputation - 5 }) }
    ]
  },
  {
    id: "stray_calf",
    title: "Moo-ving Violation",
    description: "A dirty stray calf has wandered through the swinging doors into the saloon.",
    options: [
      { text: "Guide it out gently", effectMessage: "You herd the calf outside. The barkeep is grateful.", effect: (p) => ({ reputation: p.reputation + 5 }) },
      { text: "Yell at it", effectMessage: "You spook it. It kicks over a table on the way out.", effect: (p) => ({ reputation: p.reputation - 2 }) },
      { text: "Try to ride it", effectMessage: "You try to ride the calf. You fall off and look like a fool.", effect: (p) => ({ reputation: p.reputation - 10, hp: Math.max(1, p.hp - 5) }) }
    ]
  },
  {
    id: "shoot_coin",
    title: "Trick Shot",
    description: "Someone tosses a silver dollar into the air and challenges you to blast it.",
    options: [
      { text: "Take the shot", effectMessage: "You draw and fire. PING! The crowd goes wild.", effect: (p) => ({ ...modifyAmmo(p, -1), reputation: p.reputation + 10, xp: p.xp + 15 }) },
      { text: "Pocket the coin", effectMessage: "You catch the coin and keep it. People boo.", effect: (p) => ({ gold: p.gold + 1, reputation: p.reputation - 5 }) },
      { text: "Ignore them", effectMessage: "You sip your drink. Let them play their games.", effect: (p) => ({}) }
    ]
  },
  {
    id: "shady_rifle",
    title: "Back Alleys",
    description: "A sketchy guy offers you an 'advanced scoped rifle' for cheap.",
    options: [
      { text: "Buy it (-50g)", effectMessage: "You buy it. It's literally a stick with a glass bottle tied to it. You've been conned.", effect: (p) => ({ gold: Math.max(0, p.gold - 50) }) },
      { text: "Intimidate him", effectMessage: "You threaten to call the sheriff. He runs off, dropping a few bullets.", effect: (p) => ({ ...modifyAmmo(p, 5) }) },
      { text: "Decline", effectMessage: "You know a scam when you see one.", effect: (p) => ({}) }
    ]
  },
  {
    id: "spittoon_miss",
    title: "Bad Aim",
    description: "A tobacco-chewing patron tries to spit in the spittoon and grossly misses, hitting your boot.",
    options: [
      { text: "Demand he cleans it", effectMessage: "He drunkenly wipes your boot with his sleeve. Gross, but respected.", effect: (p) => ({ reputation: p.reputation + 3 }) },
      { text: "Draw your gun", effectMessage: "He panics and runs out of the bar, leaving his drink.", effect: (p) => ({ reputation: p.reputation - 5 }) },
      { text: "Wipe it off quietly", effectMessage: "You sigh and clean it yourself.", effect: (p) => ({ reputation: p.reputation - 2 }) }
    ]
  },
  {
    id: "local_tough",
    title: "My Chair",
    description: "A local tough guy walks up, says 'You're in my chair,' and looms over you.",
    options: [
      { text: "Stand up and fight", effectMessage: "You throw hands! You bruised him, but took a black eye.", effect: (p) => ({ hp: Math.max(1, p.hp - 10), reputation: p.reputation + 8 }) },
      { text: "Smooth talk him", effectMessage: "You talk him down and buy him a drink.", effect: (p) => ({ gold: Math.max(0, p.gold - 2), xp: p.xp + 10 }) },
      { text: "Move seats", effectMessage: "You quietly move. The bar patrons snicker at you.", effect: (p) => ({ reputation: p.reputation - 8 }) }
    ]
  },
  {
    id: "bawdy_tune",
    title: "Singalong",
    description: "The whole bar erupts into a rowdy, bawdy singing tune. They want you to join.",
    options: [
      { text: "Sing along loudly", effectMessage: "Your terrible singing voice brings joy to the room.", effect: (p) => ({ reputation: p.reputation + 5, xp: p.xp + 5 }) },
      { text: "Nurse your drink", effectMessage: "You ignore them. You miserable cuss.", effect: (p) => ({ reputation: p.reputation - 1 }) },
      { text: "Dance on the table", effectMessage: "You dance wildly, breaking a table. You have to pay for it.", effect: (p) => ({ gold: Math.max(0, p.gold - 10), reputation: p.reputation + 10 }) }
    ]
  },
  {
    id: "rabid_bat",
    title: "Bat Country",
    description: "A wild bat flies through the window and causes panic in the saloon.",
    options: [
      { text: "Shoot it", effectMessage: "You blast it out of the air. Everyone is impressed by your aim.", effect: (p) => ({ ...modifyAmmo(p, -1), reputation: p.reputation + 5, pistolSkill: (p.pistolSkill || 0) + 2 }) },
      { text: "Catch it in a hat", effectMessage: "You trap it and release it outside. A true hero of nature.", effect: (p) => ({ reputation: p.reputation + 5 }) },
      { text: "Hide under a table", effectMessage: "You cower. Nobody likes a coward.", effect: (p) => ({ reputation: p.reputation - 5 }) }
    ]
  },
  {
    id: "estranged_sibling",
    title: "Long Lost Brother?",
    description: "An elderly lady with poor eyesight hugs you, thinking you're her long-lost relative.",
    options: [
      { text: "Play along", effectMessage: "You humor her. She leaves happy and slips a coin in your pocket.", effect: (p) => ({ gold: p.gold + 5, reputation: p.reputation + 5 }) },
      { text: "Correct her", effectMessage: "She apologizes profusely and shuffles away.", effect: (p) => ({}) },
      { text: "Ask for an inheritance", effectMessage: "You ask for money. She realizes you're a scoundrel and hits you with a purse.", effect: (p) => ({ hp: Math.max(1, p.hp - 2), reputation: p.reputation - 10 }) }
    ]
  },
  {
    id: "dice_luck",
    title: "Lucky Roll",
    description: "A gambler asks you to roll the dice for him, hoping you have 'lady luck'.",
    options: [
      { text: "Roll the dice", effectMessage: "Snake eyes! He loses everything and glares at you.", effect: (p) => ({ reputation: p.reputation - 2 }) },
      { text: "Roll and cheat", effectMessage: "You tilt the dice. He wins big and shares the cut!", effect: (p) => ({ gold: p.gold + 15 }) },
      { text: "Refuse", effectMessage: "You decline. You make your own luck.", effect: (p) => ({}) }
    ]
  },
  {
    id: "lucky_rabbit",
    title: "Rabbit's Foot",
    description: "A scruffy patron offers to sell you his 'lucky rabbit foot' for $5.",
    options: [
      { text: "Buy it", effectMessage: "You buy it. You feel slightly more fortunate... maybe?", effect: (p) => ({ gold: Math.max(0, p.gold - 5), xp: p.xp + 10 }) },
      { text: "Lodge a bet instead", effectMessage: "You wager $5 on a coin flip and win!", effect: (p) => ({ gold: p.gold + 5 }) },
      { text: "Say no", effectMessage: "You don't need luck, you have bullets.", effect: (p) => ({}) }
    ]
  },
  {
    id: "turpentine_whiskey",
    title: "Paint Thinner",
    description: "The bartender serves you a whiskey that tastes exactly like turpentine.",
    options: [
      { text: "Complain", effectMessage: "He apologizes and gives you a good bottle on the house.", effect: (p) => ({ hp: Math.min(p.maxHp, p.hp + 5) }) },
      { text: "Drink it without flinching", effectMessage: "You slam it down. The locals are amazed by your iron stomach.", effect: (p) => ({ hp: Math.max(1, p.hp - 5), reputation: p.reputation + 10 }) },
      { text: "Spit it in his face", effectMessage: "He pulls a shotgun! You have to scramble out the window.", effect: (p) => ({ reputation: p.reputation - 10 }) }
    ]
  },
  {
    id: "wanted_lookalike",
    title: "Familiar Face",
    description: "You notice a Wanted poster on the wall. The drawing looks exactly like you with a mustache.",
    options: [
      { text: "Draw a unibrow on it", effectMessage: "You discreetly deface the poster so no one gets suspicious.", effect: (p) => ({ xp: p.xp + 5 }) },
      { text: "Tear it down", effectMessage: "The bartender yells at you for ruining decor.", effect: (p) => ({ reputation: p.reputation - 2 }) },
      { text: "Grow a mustache", effectMessage: "Wait, that's not helping.", effect: (p) => ({}) }
    ]
  },
  {
    id: "old_timer",
    title: "Rambling Tales",
    description: "An old timer with a missing ear sits next to you and starts telling a story that goes nowhere.",
    options: [
      { text: "Listen carefully", effectMessage: "You endure 4 hours of talking about onions on belts. You gain immense patience.", effect: (p) => ({ xp: p.xp + 30 }) },
      { text: "Interrupt and leave", effectMessage: "You rudely walk off. He yells at a cloud.", effect: (p) => ({ reputation: p.reputation - 2 }) },
      { text: "Buy his silence", effectMessage: "You pay him $1 to stop talking.", effect: (p) => ({ gold: Math.max(0, p.gold - 1) }) }
    ]
  },
  {
    id: "lady_of_the_evening",
    title: "Painted Lady",
    description: "A heavily perfumed saloon girl asks if you want to buy her an overpriced drink.",
    options: [
      { text: "Buy the drink", effectMessage: "She tells you a secret about the local sheriff.", effect: (p) => ({ gold: Math.max(0, p.gold - 8), xp: p.xp + 15 }) },
      { text: "Politely decline", effectMessage: "She huffs and walks to the next table.", effect: (p) => ({}) },
      { text: "Lecture her on morals", effectMessage: "She throws a glass of cheap wine in your face.", effect: (p) => ({ reputation: p.reputation - 5 }) }
    ]
  },
  {
    id: "pickpocket_bump",
    title: "Light Fingers",
    description: "A scrawny kid bumps into you near the saloon doors. You check your pocket...",
    options: [
      { text: "Grab him!", effectMessage: "You catch him. He drops your coin purse and runs.", effect: (p) => ({ xp: p.xp + 5 }) },
      { text: "Let him go", effectMessage: "You sigh and accept you lost a few bucks.", effect: (p) => ({ gold: Math.max(0, p.gold - 10) }) },
      { text: "Pick HIS pocket", effectMessage: "You counter-pickpocket! You lose nothing and grab a bullet.", effect: (p) => ({ ...modifyAmmo(p, 1) }) }
    ]
  },
  {
    id: "famous_author",
    title: "Dime Novel",
    description: "An author for 'Dime Westerns' wants to write a sensational fake story about you.",
    options: [
      { text: "Agree", effectMessage: "Your reputation skyrockets, though the stories are all lies.", effect: (p) => ({ reputation: p.reputation + 20 }) },
      { text: "Demand royalities", effectMessage: "He pays you upfront but writes you as the villain.", effect: (p) => ({ gold: p.gold + 25, reputation: p.reputation - 15 }) },
      { text: "Refuse", effectMessage: "You prefer to be a mystery.", effect: (p) => ({}) }
    ]
  },
  {
    id: "dropped_derringer",
    title: "Misfire!",
    description: "A nervous patron drops a tiny derringer. It hits the floor and goes off randomly!",
    options: [
      { text: "Dive for cover", effectMessage: "You dodge! The bullet hits a whiskey bottle instead.", effect: (p) => ({ xp: p.xp + 10 }) },
      { text: "Stand still", effectMessage: "The bullet grazes your arm. Ouch!", effect: (p) => ({ hp: Math.max(1, p.hp - 10) }) },
      { text: "Confiscate the gun", effectMessage: "You take the derringer away and scold him.", effect: (p) => ({ reputation: p.reputation + 5 }) }
    ]
  },
  {
    id: "cowboy_window",
    title: "Defenestration",
    description: "A loud crash! A cowboy literally gets thrown through the saloon window from outside.",
    options: [
      { text: "Help him up", effectMessage: "You help him. He thanks you and limps away.", effect: (p) => ({ reputation: p.reputation + 3 }) },
      { text: "Loot his pockets", effectMessage: "He's unconscious. You steal his pocket watch.", effect: (p) => ({ gold: p.gold + 12, reputation: p.reputation - 10 }) },
      { text: "Order another drink", effectMessage: "Just another Tuesday in the west.", effect: (p) => ({}) }
    ]
  },
  {
    id: "piano_stops",
    title: "Dead Silence",
    description: "You walk in and the piano player stops playing. Everyone glares at you.",
    options: [
      { text: "'What're you looking at?'", effectMessage: "Your intimidation works. The piano resumes.", effect: (p) => ({ reputation: p.reputation + 5 }) },
      { text: "Buy a round for the house", effectMessage: "You spend $15, but suddenly everyone loves you.", effect: (p) => ({ gold: Math.max(0, p.gold - 15), reputation: p.reputation + 15 }) },
      { text: "Back out slowly", effectMessage: "You leave nervously.", effect: (p) => ({ reputation: p.reputation - 5 }) }
    ]
  },
  {
    id: "baron_donation",
    title: "Charity Box",
    description: "The sheriff is walking around with a hat, asking for donations for the widow's fund.",
    options: [
      { text: "Donate $5", effectMessage: "You drop some coins in. The sheriff nods appreciatively.", effect: (p) => ({ gold: Math.max(0, p.gold - 5), reputation: p.reputation + 5, factionReputation: { ...p.factionReputation, lawmen: p.factionReputation.lawmen + 5 } }) },
      { text: "Donate $20", effectMessage: "A very generous donation! The lawmen won't forget this.", effect: (p) => ({ gold: Math.max(0, p.gold - 20), reputation: p.reputation + 10, factionReputation: { ...p.factionReputation, lawmen: p.factionReputation.lawmen + 15 } }) },
      { text: "Refuse", effectMessage: "You shake your head. The sheriff gives you a dirty look.", effect: (p) => ({ factionReputation: { ...p.factionReputation, lawmen: p.factionReputation.lawmen - 2 } }) }
    ]
  },
  {
    id: "stranger_map",
    title: "The Mysterious Map",
    description: "A shady cloaked figure at a corner table offers you a 'treasure map' for $10.",
    options: [
      { text: "Buy it", effectMessage: "It's just a doodle of a cactus. You've been scammed.", effect: (p) => ({ gold: Math.max(0, p.gold - 10) }) },
      { text: "Threaten him", effectMessage: "He stutters and gives you the map for free. Still a doodle.", effect: (p) => ({ reputation: p.reputation - 2 }) },
      { text: "Ignore the lunatic", effectMessage: "You keep your money.", effect: (p) => ({}) }
    ]
  },
  {
    id: "left_steak",
    title: "Free Food?",
    description: "Someone left a perfectly good, half-eaten steak on an empty table.",
    options: [
      { text: "Eat it", effectMessage: "It was a bit chewy, but free food is free food. You feel healthy.", effect: (p) => ({ hp: Math.min(p.maxHp, p.hp + 10) }) },
      { text: "Leave it", effectMessage: "You aren't a feral dog.", effect: (p) => ({}) },
      { text: "Feed it to the dog", effectMessage: "The local mutt appreciates it.", effect: (p) => ({ reputation: p.reputation + 2 }) }
    ]
  },
  {
    id: "tinhorn_braggart",
    title: "The Tinhorn",
    description: "A loudmouthed tinhorn from out east is bragging about his fast draw to a disinterested crowd.",
    options: [
      { text: "Challenge him", effectMessage: "He gets terrified and runs out of the saloon.", effect: (p) => ({ reputation: p.reputation + 5 }) },
      { text: "Mingle in his crowd", effectMessage: "You lift his fancy pocket watch while he's talking.", effect: (p) => ({ gold: p.gold + 10, reputation: p.reputation - 5 }) },
      { text: "Laugh at him", effectMessage: "The crowd joins you in laughter. He sits down, embarrassed.", effect: (p) => ({ reputation: p.reputation + 2 }) }
    ]
  },
  {
    id: "argument_poker",
    title: "Rules of the Game",
    description: "Two angry prospectors ask you to settle a dispute: Does a straight beat a flush?",
    options: [
      { text: "Straight beats a flush!", effectMessage: "You're wrong, but you sounded confident. (You lose respect)", effect: (p) => ({ reputation: p.reputation - 2 }) },
      { text: "Flush beats a straight!", effectMessage: "Correct! The winner buys you a drink.", effect: (p) => ({ xp: p.xp + 10, hp: Math.min(p.maxHp, p.hp + 5) }) },
      { text: "Draw your gun", effectMessage: "You tell them the gun beats everything. They scatter.", effect: (p) => ({ reputation: p.reputation - 5 }) }
    ]
  },
  {
    id: "loud_spurs",
    title: "Jingle Jangle",
    description: "Your spurs are jingling so loudly on the floorboards that a patron complains.",
    options: [
      { text: "Apologize and walk softly", effectMessage: "You show manners.", effect: (p) => ({ reputation: p.reputation + 2 }) },
      { text: "Jingle louder", effectMessage: "You intentionally stomp around. You obnoxious cowboy.", effect: (p) => ({ reputation: p.reputation - 5 }) },
      { text: "Take them off", effectMessage: "You remove them. Much quieter now.", effect: (p) => ({}) }
    ]
  },
  {
    id: "snake_floor",
    title: "Slithering Surprise",
    description: "A rattlesnake has slithered under near your stool.",
    options: [
      { text: "Shoot it", effectMessage: "BLAM! You blew a hole in the floorboard, but the snake is dead.", effect: (p) => ({ ...modifyAmmo(p, -1), reputation: p.reputation + 2 }) },
      { text: "Catch it by the neck", effectMessage: "You grab it like a pro and toss it out the window. Badass.", effect: (p) => ({ reputation: p.reputation + 10, xp: p.xp + 15 }) },
      { text: "Scream and jump on a chair", effectMessage: "Everyone laughs at you.", effect: (p) => ({ reputation: p.reputation - 10 }) }
    ]
  },
  {
    id: "stranger_tab",
    title: "The Ghost Tab",
    description: "A stranger buys a round for the whole bar, then slips out the back before paying.",
    options: [
      { text: "Pay his tab", effectMessage: "You pay the $15. The barkeep is extremely grateful.", effect: (p) => ({ gold: Math.max(0, p.gold - 15), reputation: p.reputation + 15 }) },
      { text: "Chase him", effectMessage: "You run out back but lose him in the alley. Oh well.", effect: (p) => ({}) },
      { text: "Slip out too", effectMessage: "You sneak out the front. Not your problem.", effect: (p) => ({ reputation: p.reputation - 2 }) }
    ]
  },
  {
    id: "loose_floorboard",
    title: "Hidden Stash",
    description: "You step on a loose floorboard near the piano and hear a clinking sound.",
    options: [
      { text: "Pry it open", effectMessage: "You find a hidden stash of bullets!", effect: (p) => ({ ...modifyAmmo(p, 8) }) },
      { text: "Ignore it", effectMessage: "It's probably just mice.", effect: (p) => ({}) },
      { text: "Tell the barkeep", effectMessage: "He opens it and finds his missing watch. He gives you a small reward.", effect: (p) => ({ gold: p.gold + 5, reputation: p.reputation + 5 }) }
    ]
  }
];
