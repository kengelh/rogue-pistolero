import { Location, Mission } from '../types';
import { generateOutlawName } from './procedural';

// Define the steps representing our "Quest Cards"
export interface StorylineTemplate {
  act: 1 | 2 | 3 | 4 | 5;
  id: string; // e.g. "act1_rumor"
  titleTemplate: string;
  type: Mission['type'];
  danger: Mission['danger'];
  targetNameTemplate: string; 
  descTemplate: string; 
  reputationChange: number;
}

const titlesAct1 = ["Rumor of the Lost {relic}", "Blood on the Sand", "The Missing Stagecoach", "A Desperate Plea", "The Broken Fence", "Whispers in the Dark", "A Stranger in Town", "The Stolen Locket", "Midnight Meeting", "The Torn Letter", "Shadow on the Ridge", "The Drunken Tell", "A Trail of Tokens", "The Secret Stash", "Scouting the Pass", "The Wandering Merchant", "A Deal Gone Wrong", "The Locked Chest", "A Warning Shot", "The Dusty Trail"];

const ACT_1_TEMPLATES: StorylineTemplate[] = titlesAct1.map((title, i) => ({
    act: 1,
    id: `act1_event_${i}`,
    type: (i % 2 === 0) ? 'story_investigation' : 'scavenge',
    danger: 'low',
    titleTemplate: title,
    targetNameTemplate: 'Target {npc}',
    descTemplate: `Follow the winding path of fate. Investigate the ${title} at {targetTown}.`,
    reputationChange: 2
}));

const titlesAct2 = ["Squeezing the Rat", "The Safe Box", "The Forward Camp", "Riding Down the Courier", "Free the Informant", "Ambush at the Pass", "The Traitor's Price", "A Train to Rob", "The Hostage Situation", "Stealing the Plans", "The Guarded Depot", "Breaking the Syndicate", "The Sabotaged Bridge", "Intercepting the Goods", "The Hidden Outpost", "A Midnight Heist", "Rescuing the Mayor", "The Arms Deal", "The Smuggler's Cove", "The Rival Gang"];

const ACT_2_TEMPLATES: StorylineTemplate[] = titlesAct2.map((title, i) => ({
    act: 2,
    id: `act2_event_${i}`,
    type: (i % 3 === 0) ? 'story_heist' : (i % 3 === 1 ? 'story_assassination' : 'nest_clearing'),
    danger: 'medium',
    titleTemplate: title,
    targetNameTemplate: 'Target {villain}',
    descTemplate: `The stakes increase. Deal with the ${title} at {targetTown}.`,
    reputationChange: -2
}));

const titlesAct3 = ["Head of the Snake", "The Lost Motherlode", "The Midnight Express", "Canyon of No Return", "High Noon Showdown", "The Baron's Fall", "Assault on the Stronghold", "The Final Stand", "Death in the Mines", "The Great Train Robbery", "The Riverboat Casino", "The Corrupt Sheriff", "The Governor's Mansion", "The Dynamite Plot", "The Arsenal Siege", "The Gatling Gun", "The Desert Ambush", "The Last Stand", "The Executioner", "The Mastermind"];

const ACT_3_TEMPLATES: StorylineTemplate[] = titlesAct3.map((title, i) => ({
    act: 3,
    id: `act3_event_${i}`,
    type: (i % 2 === 0) ? 'story_assassination' : 'story_exploration',
    danger: 'deadly',
    titleTemplate: title,
    targetNameTemplate: 'Target {villainBoss}',
    descTemplate: `This is the climax. Survive the ${title} at {targetTown}.`,
    reputationChange: 20
}));

const titlesAct4 = ["Flee the Posse", "Stash the Loot", "Scavenge the Wreckage", "Tying Loose Ends", "The Doctor's Bills", "A Hasty Retreat", "The Bribe", "Covering Tracks", "The Wanted Posters", "A New Identity", "The Safehouse", "The Border Crossing", "The Smuggler's Route", "The Secret Deal", "The Stolen Horses", "The Desert Storm", "The Tracker", "The Ambush Survivor", "The Traitor's Fate", "The Final Bribe"];

const ACT_4_TEMPLATES: StorylineTemplate[] = titlesAct4.map((title, i) => ({
    act: 4,
    id: `act4_event_${i}`,
    type: (i % 2 === 0) ? 'escort' : 'story_delivery',
    danger: 'medium',
    titleTemplate: title,
    targetNameTemplate: 'Ally {npc}',
    descTemplate: `The aftermath of your decisions. Push through the ${title} at {targetTown}.`,
    reputationChange: 5
}));

const titlesAct5 = ["The Final Claim", "A Governor's Pardon", "The Last Laugh", "Bury the Hatchet", "Collect the Blood Money", "The Legend Grows", "The Hometown Hero", "The Sheriff's Badge", "The Stolen Fortune", "The Last Ride", "The Sunset Boulevard", "The Peaceful Town", "The New Mayor", "The Boomtown", "The Legacy", "The Ghost Town", "The Final Showdown", "The Reconciliation", "The Forgiveness", "The Execution"];

const ACT_5_TEMPLATES: StorylineTemplate[] = titlesAct5.map((title, i) => ({
    act: 5,
    id: `act5_event_${i}`,
    type: (i % 3 === 0) ? 'scavenge' : (i % 3 === 1 ? 'story_delivery' : 'bounty'),
    danger: 'low',
    titleTemplate: title,
    targetNameTemplate: '{npc}',
    descTemplate: `A new beginning. Find resolution in the ${title} at {targetTown}.`,
    reputationChange: 15
}));

export const ALL_STORYLINE_TEMPLATES = [
  ...ACT_1_TEMPLATES,
  ...ACT_2_TEMPLATES,
  ...ACT_3_TEMPLATES,
  ...ACT_4_TEMPLATES,
  ...ACT_5_TEMPLATES
];

export function instantiateStorylineQuest(
  templateId: string, 
  worldLocations: Location[], 
  currentLocationId: string
): Mission | null {
  
  let template: StorylineTemplate | undefined;

  // Handle dynamic Act hooks
  if (templateId === 'generate_act_1') {
    template = ACT_1_TEMPLATES[Math.floor(Math.random() * ACT_1_TEMPLATES.length)];
  } else if (templateId === 'generate_act_2') {
    template = ACT_2_TEMPLATES[Math.floor(Math.random() * ACT_2_TEMPLATES.length)];
  } else if (templateId === 'generate_act_3') {
    template = ACT_3_TEMPLATES[Math.floor(Math.random() * ACT_3_TEMPLATES.length)];
  } else if (templateId === 'generate_act_4') {
    template = ACT_4_TEMPLATES[Math.floor(Math.random() * ACT_4_TEMPLATES.length)];
  } else if (templateId === 'generate_act_5') {
    template = ACT_5_TEMPLATES[Math.floor(Math.random() * ACT_5_TEMPLATES.length)];
  } else {
    // Exact match (in case some other logic triggers a specific one)
    template = ALL_STORYLINE_TEMPLATES.find(t => t.id === templateId);
  }

  if (!template) return null;

  // Determine what the Next Quest should be (if there is one)
  let nextQuestTemplateId: string | undefined = undefined;
  if (template.act === 1) nextQuestTemplateId = 'generate_act_2';
  if (template.act === 2) nextQuestTemplateId = 'generate_act_3';
  if (template.act === 3) nextQuestTemplateId = 'generate_act_4';
  if (template.act === 4) nextQuestTemplateId = 'generate_act_5';
  // Act 5 has no next quest, ending the storyline

  // Pick a random target location (different from current if possible)
  let targetLoc = worldLocations.find(l => l.id !== currentLocationId);
  if (!targetLoc) targetLoc = worldLocations[0];

  const npc = generateOutlawName().split(' ')[0]; // just a first name
  const villain = generateOutlawName();
  const villainBoss = generateOutlawName();
  
  const relics = ["Gold Crate", "Dutchman's Map", "Silver Spur", "Ledger", "Jade Idol"];
  const relic = relics[Math.floor(Math.random() * relics.length)];

  const hydrate = (str: string) => {
    return str
      .replace(/{npc}/g, npc)
      .replace(/{villain}/g, villain)
      .replace(/{villainBoss}/g, villainBoss)
      .replace(/{targetTown}/g, targetLoc!.name)
      .replace(/{relic}/g, relic);
  };

  const isDeadly = template.danger === 'deadly';

  return {
    id: `story_${template.id}_${Math.random().toString(36).substr(2, 5)}`,
    title: hydrate(template.titleTemplate),
    type: template.type,
    targetName: hydrate(template.targetNameTemplate),
    rewardGold: isDeadly ? 1000 : 350 + Math.floor(Math.random() * 200),
    rewardXp: isDeadly ? 500 : 150 + Math.floor(Math.random() * 50),
    reputationChange: template.reputationChange,
    danger: template.danger,
    description: hydrate(template.descTemplate),
    originLocationId: currentLocationId,
    targetLocationId: targetLoc.id,
    isStoryline: true,
    nextQuestTemplateId: nextQuestTemplateId
  };
}
