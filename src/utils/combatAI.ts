
import { CombatActor, GridCell } from '../types';

/**
 * Interface that holds everything the AI needs to make a decision
 */
export interface AIContext {
  enemy: CombatActor;
  grid: GridCell[];
  targetPos: { x: number; y: number };
  enemies: CombatActor[];
  targetHp: number;
  hasCannonMap: boolean;
  checkVisibility: (actor: CombatActor) => boolean;
}

export interface AIResult {
  newX: number;
  newY: number;
  newFacing: 'up' | 'down' | 'left' | 'right';
  newStance: 'standing' | 'crouching' | 'lying';
  logs: string[];
}

export function processAILogic(context: AIContext): AIResult {
  const { enemy, grid, targetPos, enemies, hasCannonMap, checkVisibility } = context;
  const logs: string[] = [];
  
  let finalX = enemy.x;
  let finalY = enemy.y;
  let finalFacing = enemy.facing || 'down';
  let finalStance = enemy.stance || 'standing';

  const isDisarmedHuman = ['sheriff', 'deputy'].includes(enemy.type) && enemy.clip <= 0;
  
  let effectiveRange = Math.round(enemy.range / 2) + Math.ceil(enemy.accuracy / 15);
  if (enemy.type === 'scorpion' || isDisarmedHuman) {
    effectiveRange = 1;
  }
  
  finalFacing = getFacingToTarget(finalX, finalY, targetPos.x, targetPos.y);
  
  const mockBeforeMove = { ...enemy, facing: finalFacing };
  let isTargetVisible = checkVisibility(mockBeforeMove);

  const initialDist = Math.hypot(enemy.x - targetPos.x, enemy.y - targetPos.y);

  const intl = getEnemyIntelligence(enemy);
  const isHurt = enemy.hp < enemy.maxHp * 0.4;
  const wantsCover = isHurt || intl >= 7;

  let shouldMove = false;
  if (!isTargetVisible) shouldMove = true;
  if (initialDist > effectiveRange) shouldMove = true;
  if (wantsCover && intl >= 5) shouldMove = true;

  if (shouldMove) {
    const candidates: { x: number; y: number; distToTarget: number; coverScore: number }[] = [];
    const searchRadius = intl >= 6 ? 2 : 1; 

    for (let nx = enemy.x - searchRadius; nx <= enemy.x + searchRadius; nx++) {
      for (let ny = enemy.y - searchRadius; ny <= enemy.y + searchRadius; ny++) {
        if (nx >= 0 && nx < 9 && ny >= 0 && ny < 9) {
          const isObstacle = hasCannonMap && nx === 4 && ny === 4;
          
          const isOccupied = grid.some(c => c.x === nx && c.y === ny && c.type !== 'empty') || 
                             enemies.some(e => e.x === nx && e.y === ny && !e.isDead && !e.isSurrendered && !e.isUnconscious && e.id !== enemy.id) ||
                             (targetPos.x === nx && targetPos.y === ny);
          
          if (!isOccupied && !isObstacle) {
            let coverQuality = 0;
            grid.forEach(c => {
              if (c.type !== 'empty' && c.type !== 'rail' && Math.abs(c.x - nx) <= 1 && Math.abs(c.y - ny) <= 1) {
                const isHigh = ['high_cover', 'tree', 'tombstone', 'boulder', 'wooden_wall', 'brick_wall', 'tipi'].includes(c.type);
                coverQuality += isHigh ? 2 : 1;
              }
            });
            const d = Math.hypot(nx - targetPos.x, ny - targetPos.y);
            
            if (d < initialDist || d <= effectiveRange || coverQuality > 0) {
              candidates.push({ x: nx, y: ny, distToTarget: d, coverScore: coverQuality });
            }
          }
        }
      }
    }

    if (candidates.length > 0) {
      candidates.sort((a, b) => {
        if (intl >= 6) {
          if (wantsCover) {
            return (b.coverScore - a.coverScore) || (a.distToTarget - b.distToTarget);
          } else {
             const aInRange = a.distToTarget <= effectiveRange ? 1 : 0;
             const bInRange = b.distToTarget <= effectiveRange ? 1 : 0;
             if (aInRange !== bInRange) return bInRange - aInRange;
             if (aInRange === 1 && bInRange === 1) return (b.coverScore - a.coverScore);
             return (b.coverScore - a.coverScore) || (a.distToTarget - b.distToTarget);
          }
        } else {
          return a.distToTarget - b.distToTarget;
        }
      });

      const bestStep = candidates[0];
      
      if (bestStep && (bestStep.x !== enemy.x || bestStep.y !== enemy.y)) {
         finalX = bestStep.x;
         finalY = bestStep.y;
         finalFacing = getFacingToTarget(finalX, finalY, targetPos.x, targetPos.y);
         finalStance = 'standing';

         if (intl >= 6 && wantsCover) {
            logs.push(`🧠 ${enemy.name} retreated to cover at (${finalX}, ${finalY})!`);
         } else {
            logs.push(`👣 ${enemy.name} moved to (${finalX}, ${finalY}).`);
         }
      } else {
        finalStance = 'standing';
        logs.push(`⏳ ${enemy.name} holds position in cover stance: ${finalStance}.`);
      }
    }
  } else {
    finalStance = 'standing';
  }

  finalFacing = getFacingToTarget(finalX, finalY, targetPos.x, targetPos.y);

  return {
    newX: finalX,
    newY: finalY,
    newFacing: finalFacing,
    newStance: finalStance,
    logs
  };
}

function getEnemyIntelligence(enemy: CombatActor): number {
  if (enemy.type === 'sheriff') return 9;
  if (enemy.type === 'deputy') return 7;
  if (enemy.type === 'scorpion') return 2;
  if (enemy.type === 'posse') return 8; // Posse members are smart!
  return 4;
}

function getFacingToTarget(startX: number, startY: number, targetX: number, targetY: number): 'up' | 'down' | 'left' | 'right' {
  const innerDiffX = targetX - startX;
  const innerDiffY = targetY - startY;
  
  if (Math.abs(innerDiffX) > Math.abs(innerDiffY)) {
    return innerDiffX > 0 ? 'right' : 'left';
  } else {
    return innerDiffY > 0 ? 'down' : 'up';
  }
}
