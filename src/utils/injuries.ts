import { InjurySystem, BodyPartStatus } from '../types';

export const BODY_PARTS_MULTIPLIERS = {
  HEAD: 2.0,
  TORSO: 1.5,
  LEFT_ARM: 0.5,
  RIGHT_ARM: 0.5,
  LEGS: 0.7
};

export type HitLocation = 'HEAD' | 'TORSO' | 'LEFT_ARM' | 'RIGHT_ARM' | 'LEGS';

export function createInitialInjuries(maxHp: number): InjurySystem {
  return {
    bloodVolume: 100.0,
    bleedingRate: 0.0,
    shockLevel: 0.0,
    painLevel: 0.0,
    parts: {
      HEAD: { integrity: 100, status: 'NORMAL' },
      TORSO: { integrity: 100, status: 'NORMAL' },
      LEFT_ARM: { integrity: 100, status: 'NORMAL' },
      RIGHT_ARM: { integrity: 100, status: 'NORMAL' },
      LEGS: { integrity: 100, status: 'NORMAL' }
    }
  };
}

export function applyTakeDamage(
  injuries: InjurySystem, 
  incomingDamage: number, 
  hitLocation: HitLocation
): { updatedInjuries: InjurySystem, addedBleed: number } {
  // Deep clone to avoid mutating input directly
  const newState = JSON.parse(JSON.stringify(injuries)) as InjurySystem;
  
  const targetPart = newState.parts[hitLocation];
  
  // Deduct integrity
  targetPart.integrity = Math.max(0, targetPart.integrity - incomingDamage);
  newState.painLevel += incomingDamage * 0.15; // Scaled down pain
  
  let addedBleed = 0;
  
  if (targetPart.integrity === 0) {
    if (targetPart.status !== 'CRIPPLED') {
      targetPart.status = 'CRIPPLED';
      addedBleed = incomingDamage * BODY_PARTS_MULTIPLIERS[hitLocation] * 0.15;
    }
  } else if (targetPart.integrity < 50) {
    if (targetPart.status === 'NORMAL') {
      targetPart.status = 'INJURED';
      addedBleed = incomingDamage * BODY_PARTS_MULTIPLIERS[hitLocation] * 0.05;
    }
  }
  
  newState.bleedingRate += addedBleed;
  
  // High pain contributes to shock
  newState.shockLevel += incomingDamage * 0.25; // Scaled down shock
  
  return { updatedInjuries: newState, addedBleed };
}

export function processTurnTick(injuries: InjurySystem): InjurySystem {
  const newState = JSON.parse(JSON.stringify(injuries)) as InjurySystem;
  
  newState.bloodVolume = Math.max(0, newState.bloodVolume - newState.bleedingRate);
  
  return newState;
}

export function getRandomHitLocation(): HitLocation {
  const roll = Math.random();
  if (roll < 0.1) return 'HEAD';
  if (roll < 0.5) return 'TORSO';
  if (roll < 0.65) return 'LEFT_ARM';
  if (roll < 0.8) return 'RIGHT_ARM';
  return 'LEGS';
}

export function applyAutoBandaging(injuries: InjurySystem, inventory: any[], medicineSkillLevel?: number): { newInjuries: InjurySystem, newInventory: any[], logMsgs: string[] } {
  const newState = JSON.parse(JSON.stringify(injuries)) as InjurySystem;
  const newInv = [...inventory];
  const logs: string[] = [];
  
  // Sort limbs: CRIPPLED first, then INJURED
  const hurtParts = Object.entries(newState.parts)
    .filter(([_, part]) => part.status === 'CRIPPLED' || part.status === 'INJURED')
    .sort((a, b) => {
      if (a[1].status === 'CRIPPLED' && b[1].status !== 'CRIPPLED') return -1;
      if (b[1].status === 'CRIPPLED' && a[1].status !== 'CRIPPLED') return 1;
      return 0;
    });

  for (const [partName, part] of hurtParts) {
    const bandageIdx = newInv.findIndex(i => i.id === 'bandage');
    
    if (bandageIdx !== -1) {
      newInv[bandageIdx].count -= 1;
      if (newInv[bandageIdx].count <= 0) {
        newInv.splice(bandageIdx, 1);
      }
      part.isUntreated = false;
      logs.push(`Medical: Applied a bandage to ${partName}.`);
    } else if (medicineSkillLevel && medicineSkillLevel >= 2) {
      // Level 2 Field Medicine: Herbal Remedies
      part.isUntreated = false;
      part.integrity = Math.min(100, part.integrity + 10);
      logs.push(`Medical: Out of bandages, but crafted a Potent Herbal Wrap to treat ${partName} (+10 Part HP)!`);
    } else {
      part.isUntreated = true;
      logs.push(`Medical: Out of bandages! ${partName} is left untreated!`);
    }
  }

  // Stabilize overall combat bleeding since we're leaving combat
  newState.bleedingRate = 0;
  
  return { newInjuries: newState, newInventory: newInv, logMsgs: logs };
}

export function useMedicalItem(
  injuries: InjurySystem,
  itemType: 'TOURNIQUET' | 'WHISKEY',
  targetPart?: HitLocation
): InjurySystem {
  const newState = JSON.parse(JSON.stringify(injuries)) as InjurySystem;

  if (itemType === 'TOURNIQUET' && targetPart) {
    if (['LEFT_ARM', 'RIGHT_ARM', 'LEGS'].includes(targetPart)) {
      const part = newState.parts[targetPart];
      part.tourniquetApplied = true;
      part.integrity = Math.min(part.integrity, 50); // Ceils max integrity to 50
      
      // We would recalculate bleeding here based on removing the limb's contribution,
      // but a simpler approach is to subtract the typical contribution or simply set a flag that suppresses bleeding from that limb.
      // To properly recalculate, we need baseline or to store addedBleed per limb.
      // For now, let's just heavily reduce global bleeding rate as a simplification, or reduce it by 5.0 flat.
      newState.bleedingRate = Math.max(0, newState.bleedingRate - 5.0);
    }
  }

  if (itemType === 'WHISKEY') {
    newState.shockLevel = Math.max(0, newState.shockLevel - 40);
  }

  return newState;
}

export function getStatModifiers(injuries?: InjurySystem) {
  const mods = {
    accuracyPenalty: 0,
    canUseTwoHanded: true,
    moveApMultiplier: 1,
    maxApDivider: 1,
    losPenaltyMultiplier: 1
  };

  if (!injuries) return mods;

  if (injuries.parts.RIGHT_ARM.status === 'CRIPPLED') {
    mods.canUseTwoHanded = false;
    mods.accuracyPenalty = 0.6; // 60% penalty
  } else if (injuries.parts.RIGHT_ARM.status === 'INJURED') {
    mods.accuracyPenalty = 0.2;
  }

  if (injuries.parts.LEGS.status === 'CRIPPLED') {
    mods.moveApMultiplier = 2;
  } else if (injuries.parts.LEGS.status === 'INJURED') {
    mods.moveApMultiplier = 1.5;
  }

  if (injuries.parts.TORSO.status === 'CRIPPLED') {
    mods.maxApDivider = 2; // Halve max action points
  }

  if (injuries.bloodVolume < 50) {
    mods.losPenaltyMultiplier = 0.8; // 20% penalty to vision and move speed (via AP or another stat)
  }

  return mods;
}

