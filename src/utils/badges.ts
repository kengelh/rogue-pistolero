import { Player } from "../types";

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  check: (player: Player) => boolean;
}

export const BADGES: Badge[] = [
  {
    id: "quickdraw_legend",
    name: "Quickdraw Legend",
    description: "Win 10 Stand-off Duels in the badlands.",
    icon: "🎯",
    check: (player) => (player.stats?.duelsWon || 0) >= 10,
  },
  {
    id: "frontier_tycoon",
    name: "Frontier Tycoon",
    description: "Amass a bank balance or cash pocket of $1,000.",
    icon: "🪙",
    check: (player) => (player.bankBalance || 0) >= 1000 || (player.gold || 0) >= 1000,
  },
  {
    id: "most_wanted",
    name: "Most Wanted Criminal",
    description: "Get a $100+ bounty on your own head.",
    icon: "📜",
    check: (player) => (player.bounty || 0) >= 100,
  },
  {
    id: "iron_survivor",
    name: "Iron Survivor",
    description: "Survive 10 grueling days in the frontier.",
    icon: "🌵",
    check: (player) => (player.stats?.daysSurvived || 0) >= 10,
  },
  {
    id: "master_thief",
    name: "Master Bank Robber",
    description: "Successfully rob 3 local banks.",
    icon: "🏦",
    check: (player) => (player.stats?.banksRobbed || 0) >= 3,
  },
];

const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value);
    } catch {
    }
  },
};

export function getUnlockedBadges(): string[] {
  try {
    const data = safeLocalStorage.getItem("frontier_unlocked_badges");
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveUnlockedBadge(badgeId: string): void {
  try {
    const current = getUnlockedBadges();
    if (!current.includes(badgeId)) {
      current.push(badgeId);
      safeLocalStorage.setItem("frontier_unlocked_badges", JSON.stringify(current));
    }
  } catch {}
}

export function checkAndUnlockBadges(player: Player, onUnlockNotify?: (badge: Badge) => void): string[] {
  const unlocked = getUnlockedBadges();
  const newlyUnlocked: string[] = [];

  for (const badge of BADGES) {
    if (!unlocked.includes(badge.id)) {
      if (badge.check(player)) {
        saveUnlockedBadge(badge.id);
        newlyUnlocked.push(badge.id);
        if (onUnlockNotify) {
          onUnlockNotify(badge);
        }
      }
    }
  }

  return newlyUnlocked;
}
