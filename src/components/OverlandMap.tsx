import React, { useState, useEffect, useRef } from 'react';
import { Location, Player, LocationType } from '../types';
import { distance, generateChunkLocations, globalGeneratedChunks } from '../utils/procedural';
import { Compass, Sparkles, MapPin, Navigation, Map as MapIcon, Eye, Zap, AlertTriangle, ShieldCheck, Waves, Mountain, Wheat, Sun, Moon } from 'lucide-react';

const overlandImg = '/images/overland_1780566810461.png';

export const getBiomeAt = (x: number, y: number) => {
  // Purely repeating continuous river path calculations
  const riverVal = Math.sin(x / 25) * 40 + Math.cos(x / 40) * 15;
  const isRiver = Math.abs(y - (riverVal + 50)) < 4.5;

  if (isRiver) {
    return {
      name: 'River Valley',
      icon: <Waves size={16} />,
      speedModifier: 0.7,
      hydrationModifier: 0.25,
      color: 'text-sky-300 bg-teal-950 border-sky-850',
      desc: 'Cool flowing river. Slow to ford.'
    };
  }

  // Repeating mountain clusters
  const mountainVal = Math.sin(x / 30) * Math.sin(y / 30);
  if (mountainVal > 0.25) {
    const isHigh = mountainVal > 0.6;
    const isLow = mountainVal < 0.4;
    return {
      name: 'Rocky Ridge',
      icon: <Mountain size={16} />,
      speedModifier: 0.33,
      hydrationModifier: 1.0,
      color: isHigh ? 'text-slate-200 bg-slate-800 border-slate-700' : isLow ? 'text-zinc-400 bg-zinc-900 border-zinc-800' : 'text-gray-300 bg-gray-800 border-gray-700',
      desc: 'Canyon peaks and granite crests. Treacherous hiking.'
    };
  }

  // Repeating grasslands
  const plainsVal = Math.cos(x / 35 + y / 35);
  if (plainsVal > 0.30) {
    const isLush = plainsVal > 0.70;
    const isDry = plainsVal < 0.50;
    return {
      name: 'Savannah Plains',
      icon: <Wheat size={16} />,
      speedModifier: 1.0,
      hydrationModifier: 1.0,
      color: isLush ? 'text-green-300 bg-green-800 border-green-700' : isDry ? 'text-lime-300 bg-lime-900 border-lime-800' : 'text-emerald-400 bg-emerald-900 border-emerald-800',
      desc: 'Lush valley grasslands, fast tracks.'
    };
  }

  // Hills biome
  const hillsVal = Math.sin(x / 15 + y / 20);
  if (hillsVal > 0.4) {
    return {
      name: 'Rolling Hills',
      icon: <span className="text-sm font-bold">◠</span>,
      speedModifier: 0.85,
      hydrationModifier: 1.25,
      color: 'text-amber-300 bg-amber-800 border-amber-700',
      desc: 'Dusty rolling hills. Uneven ground.'
    };
  }

  // Desert fallback
  const desertRandom = Math.sin(x * 12.3 + y * 7.7);
  const desertColor = desertRandom > 0.5 ? 'text-yellow-200 bg-yellow-900 border-yellow-800' : desertRandom < -0.5 ? 'text-amber-200 bg-amber-800 border-amber-700' : 'text-orange-300 bg-orange-950 border-orange-900';

  return {
    name: 'Searing Desert',
    icon: <Sun size={16} />,
    speedModifier: 0.9,
    hydrationModifier: 1.75,
    color: desertColor,
    desc: 'Searing dunes. High water consumption!'
  };
};

export const getZoneAt = (x: number, y: number): 'safe' | 'bandit' | 'tribe' => {
  const noise = Math.sin(x/50 + y/40) + Math.cos(x/30 - y/60);
  if (noise > 1.2) return 'bandit';
  if (noise < -1.2) return 'tribe';
  return 'safe';
};

interface OverlandMapProps {
  locations: Location[];
  currentLocationId: string;
  player: Player;
  onTravel: (targetLocationId: string, method: 'horse' | 'train') => void;
  travelStatus?: {
    isTraveling: boolean;
    sourceLocId: string;
    targetLocId: string;
    currentX: number;
    currentY: number;
    hoursPassed: number;
    totalDistance: number;
    method: 'foot' | 'horse';
  } | null;
  playerX: number;
  playerY: number;
  setPlayerX: React.Dispatch<React.SetStateAction<number>>;
  setPlayerY: React.Dispatch<React.SetStateAction<number>>;
  onUpdatePlayer: React.Dispatch<React.SetStateAction<Player>>;
  setWorldLocations: React.Dispatch<React.SetStateAction<Location[]>>;
  setCurrentLocationId: (id: string) => void;
  addLogMessage: (text: string, type: 'system' | 'combat' | 'loot' | 'reputation' | 'travel' | 'danger') => void;
  onEnterTown: () => void;
  passedSectors?: string[];
  gameTimeHour: number;
  globalWeather: 'clear' | 'heatwave' | 'rain' | 'fog';
  advanceGameTime: (hours: number) => void;
  onStartCombat: (type: 'train_robbery' | 'ambush' | 'camp_ambush' | 'nest_clearing' | 'bounty', risk: number, mission?: any) => void;
  onConfrontBoss: (mission: any) => void;
}

export const OverlandMap: React.FC<OverlandMapProps> = ({
  locations,
  currentLocationId,
  player,
  onTravel,
  travelStatus,
  playerX,
  playerY,
  setPlayerX,
  setPlayerY,
  onUpdatePlayer,
  setWorldLocations,
  setCurrentLocationId,
  addLogMessage,
  onEnterTown,
  passedSectors = [],
  gameTimeHour,
  globalWeather,
  advanceGameTime,
  onStartCombat,
  onConfrontBoss,
}) => {
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);

  const [isAutoTraveling, setIsAutoTraveling] = useState(false);
  const [autoTravelTargetId, setAutoTravelTargetId] = useState<string | null>(null);
  const autoTravelTimerRef = useRef<NodeJS.Timeout | null>(null);

  const currentLocation = locations.find(loc => loc.id === currentLocationId) || locations[0];
  const selectedLocation = locations.find(loc => loc.id === selectedLocationId);

  const handleRefillCanteen = () => {
    onUpdatePlayer(p => {
      const updatedInv = [...p.inventory];
      const canteenIdx = updatedInv.findIndex(i => i.id === 'canteen');
      if (canteenIdx !== -1) {
          updatedInv[canteenIdx].count = Math.max(updatedInv[canteenIdx].count, 10);
      } else {
          updatedInv.push({ id: 'canteen', name: 'Water Canteen', type: 'consumable', value: 15, count: 10, details: 'Restores trail hydration automatically.' });
      }
      setTimeout(() => {
        addLogMessage('💦 FILLED CANTEEN: Gathered fresh river water (10 swigs stored). Hand-fed horse.', 'loot');
      }, 50);
      return { ...p, inventory: updatedInv, hydration: p.maxHydration ?? 100, hoursDehydrated: 0 };
    });
  };

  const checkChunkExpansion = (px: number, py: number) => {
    const cx = Math.floor(px / 100);
    const cy = Math.floor(py / 100);
    const newLocs = generateChunkLocations(cx, cy);
    if (newLocs.length > 0) {
      setWorldLocations(prev => [...prev, ...newLocs]);
      addLogMessage(`🗺️ BADLANDS EXPANSION: ${player.name} crested the far horizon of Sector ${cx},${cy}! Procedurally chartered ${newLocs.length} new landmarks.`, 'system');
    }
  };

  // Helper consumption
  const applyStepConsumption = (biome: any) => {
    onUpdatePlayer(prev => {
      const isHardy = prev.perks.includes('hardy');
      
      const currentPosse = prev.posse ? [...prev.posse] : [];
      let costGold = currentPosse.reduce((sum, m) => sum + m.dailyRateGold, 0);
      
      let nextGold = prev.gold;
      let desertedCount = 0;
      let finalPosse = [...currentPosse];
      
      if (finalPosse.length > 0) {
        if (nextGold < costGold) {
          while (finalPosse.length > 0 && nextGold < costGold) {
            finalPosse.pop();
            desertedCount++;
            costGold = finalPosse.reduce((sum, m) => sum + m.dailyRateGold, 0);
          }
        }
        nextGold = Math.max(0, nextGold - costGold);
      }
      
      if (desertedCount > 0) {
        setTimeout(() => {
          addLogMessage(`💸 DESERTION: ${desertedCount} recruited gunfighters abandoned ${prev.name}'s posse because he lacked the gold to pay their turn wages!`, 'danger');
        }, 50);
      }

      let nextHp = prev.hp;
      let nextHorsemanship = prev.horsemanship || 0;
      if (prev.hasHorse) {
        nextHorsemanship = Math.min(200, nextHorsemanship + 0.25);
      }

      // ----------------------------------------
      // Hydration Mechanics (Consumption & Auto-drink)
      // ----------------------------------------
      let nextHydration = prev.hydration ?? 100;
      let inventory = [...prev.inventory];
      
      // Base water consumption per field step
      let waterReq = 1.0; 
      
      // Biome modifier
      waterReq *= (biome.hydrationModifier || 1.0);
      
      // Weather modifier
      if (globalWeather === 'heatwave') {
          waterReq *= 2.0;
      } else if (globalWeather === 'rain') {
          waterReq *= 0.5; // less water needed during rain
      }
      
      // Perk modifier
      if (isHardy) waterReq *= 0.7; // "Saves 30% water hydration"
      
      nextHydration -= waterReq;
      
      // Auto-Drink from 'canteen' in inventory if dropping low
      while (nextHydration < 50) {
          const canteenIdx = inventory.findIndex(item => item.id === 'canteen' && item.count > 0);
          if (canteenIdx === -1) break;
          
          inventory[canteenIdx] = { ...inventory[canteenIdx], count: inventory[canteenIdx].count - 1 };
          nextHydration = Math.min(prev.maxHydration ?? 100, nextHydration + 25);
          
          setTimeout(() => {
            addLogMessage(`💦 AUTO-DRINK: You took a swig from your Canteen.`, 'system');
          }, 50);
          
          // Clean up empty canteen? We keep it so it can be refilled.
      }
      
      let nextHoursDehydrated = prev.hoursDehydrated || 0;
      let nextMount = prev.mount;
      let nextHasHorse = prev.hasHorse;
      let nextHorseName = prev.horseName;

      if (nextHydration <= 0) {
          nextHydration = 0;
          nextHoursDehydrated += 1;
          
          if (nextHasHorse && nextHoursDehydrated === 24) {
             setTimeout(() => {
               addLogMessage(`🐴 THIRSTING HORSE: ${prev.horseName || 'Your mount'} is suffering severely from dehydration!`, 'danger');
             }, 50);
          } else if (nextHasHorse && nextHoursDehydrated >= 48) {
             setTimeout(() => {
               addLogMessage(`🐴 TRAGEDY: ${prev.horseName || 'Your mount'} collapsed and died from severe dehydration!`, 'danger');
             }, 50);
             nextMount = undefined;
             nextHasHorse = false;
             nextHorseName = undefined;
          } else if (nextHoursDehydrated === 1) {
             setTimeout(() => {
               addLogMessage(`🥵 DEHYDRATION: You are out of water! Max AP reduced, HP regen halted.`, 'danger');
             }, 50);
          }
      } else {
          nextHoursDehydrated = 0;
      }

      return {
        ...prev,
        gold: nextGold,
        posse: finalPosse,
        hp: nextHp,
        horsemanship: nextHorsemanship,
        hydration: nextHydration,
        hoursDehydrated: nextHoursDehydrated,
        mount: nextMount,
        hasHorse: nextHasHorse,
        horseName: nextHorseName,
        inventory: inventory
      };
    });
  };

  const checkTopographyDiscovery = (cx: number, cy: number) => {
    setWorldLocations(prev => {
      let newlyRevealedNames: string[] = [];
      const nextLocations = prev.map(loc => {
        if (!loc.isExplored) {
          const dist = Math.hypot(loc.x - cx, loc.y - cy);
          if (dist <= 18) {
            newlyRevealedNames.push(loc.name);
            return { ...loc, isExplored: true };
          }
        }
        return loc;
      });
      if (newlyRevealedNames.length > 0) {
        newlyRevealedNames.forEach(name => {
          addLogMessage(`🗺️ LANDMARK DISCOVERED: Scouted ${name} through New Mexico mapping!`, 'loot');
        });
      }
      return nextLocations;
    });
  };

  const getPlayerSpeed = (player: Player) => {
    if (player.mount) {
      // +/- 10% variance already applied in baseSpeedMultiplier during generation
      let speed = player.mount.baseSpeedMultiplier;
      // penalty if dehydrated
      if ((player.hydration || 0) <= 0) {
        speed *= 0.5; // Dehydrated horse penalty
      }
      return speed;
    }
    return player.hasHorse ? 1.6 : 0.8; 
  };

  const [travelByNight, setTravelByNight] = useState(false);
  const [showCampFire, setShowCampFire] = useState(false);

  const processOverlandStep = (prevX: number, prevY: number, nextX: number, nextY: number): boolean => {
    if (showCampFire) return false;

    let isNight = gameTimeHour >= 22 || gameTimeHour < 6;

    const shouldRestDayTravel = !travelByNight && (gameTimeHour >= 21 || gameTimeHour < 6.95);
    const shouldRestNightTravel = travelByNight && (gameTimeHour >= 7.05 && gameTimeHour < 16.95);

    if (shouldRestDayTravel || shouldRestNightTravel) {
      if (autoTravelTimerRef.current) {
        clearTimeout(autoTravelTimerRef.current);
        autoTravelTimerRef.current = null;
      }
      setIsAutoTraveling(false);
      setAutoTravelTargetId(null);
      
      setShowCampFire(true);
      
      let targetHourDay = 7;
      if (shouldRestNightTravel) {
        targetHourDay = 17;
      } else {
        targetHourDay = gameTimeHour >= 21 ? 24 + 7 : 7;
      }
      
      let tick = 0;
      const totalTicks = 50; 
      const totalSleepHours = (targetHourDay - gameTimeHour);
      const hourDelta = totalSleepHours / totalTicks;

      const fastForwardInterval = setInterval(() => {
         tick++;
         advanceGameTime(hourDelta);

         if (tick >= totalTicks) {
            clearInterval(fastForwardInterval);
            setShowCampFire(false);
            let ambushChance = 0.1;
            if ((player.hydration ?? 100) <= 0) ambushChance += 0.2; // increased ambush chance due to exhaustion
            
            if (Math.random() < ambushChance) {
              setShowCampFire(false);
              addLogMessage(`⚠️ AMBUSH AT CAMP: Outlaws jumped your camp while resting!`, 'danger');
              onStartCombat('camp_ambush', 0.65);
            } else {
              if ((player.hydration ?? 100) > 0) {
                  onUpdatePlayer(p => ({ ...p, hp: Math.min(p.maxHp, p.hp + 20) }));
                  addLogMessage(`⛺ CAMPED SAFELY: You safely rested until ${shouldRestNightTravel ? 'dusk' : 'dawn'} (+20 HP).`, 'system');
              } else {
                  addLogMessage(`⛺ CAMPED EXHAUSTED: You survived the night but couldn't recover without water (Dehydrated).`, 'system');
              }
            }
         }
      }, 50);
      
      return false; // Did not travel, just camped
    }

    const prevZone = getZoneAt(prevX, prevY);
    const nextZone = getZoneAt(nextX, nextY);

    if (prevZone !== nextZone) {
      if (nextZone === 'bandit') {
        const feelings = ["I have a bad feeling about this...", "Your horse whinnies nervously.", player.posse.length > 0 ? `${player.posse[0].name} mutters: "I've heard bad things about this area."` : "You quickly check your revolver's cylinder."];
        addLogMessage(`⚠️ ${feelings[Math.floor(Math.random() * feelings.length)]} (Entered Bandit Territory)`, 'danger');
      } else if (nextZone === 'tribe') {
        addLogMessage(`⛺ Entered Native Tribal Lands. Keep your hands where they can see them.`, 'system');
      } else {
        addLogMessage(`🕊️ Back in safer territory.`, 'system');
      }
    }

    const biome = getBiomeAt(nextX, nextY);
    applyStepConsumption(biome);
    checkTopographyDiscovery(nextX, nextY);
    checkChunkExpansion(nextX, nextY);
    
    advanceGameTime(player.hasHorse ? 0.3 : 0.6);

    let eventChance = 0.015;
    if (nextZone === 'bandit') eventChance = 0.04;
    if (nextZone === 'tribe') eventChance = 0.025;
    
    // adjust for travel by night config
    if (travelByNight) {
       if (isNight) {
          eventChance += 0.02;
       } else {
          eventChance += 0.05; // higher chance to get jumped by day if they typically travel by night
       }
    }

    // Dynamic ambush hook based on outlaw reputation
    const outlawRep = player.factionReputation?.outlaws || 0;
    const retaliationBonusChance = outlawRep < -10 ? (Math.abs(outlawRep) / 100) * 0.1 : 0;
    eventChance += retaliationBonusChance;

    // High chance of injury in treacherous biomes
    const isTreacherous = biome.name.includes('Rocky') || biome.name.includes('Searing');
    if (isTreacherous) eventChance += 0.02;

    // --- Nemesis Hunting Logic ---
    const activeNemeses = player.nemeses?.filter(n => n.isHunting) || [];
    if (activeNemeses.length > 0 && Math.random() < 0.03) { // 3% chance per step if hunted
       const nemesis = activeNemeses[Math.floor(Math.random() * activeNemeses.length)];
       if (isAutoTraveling) {
         setIsAutoTraveling(false);
         if (autoTravelTimerRef.current) {
            clearTimeout(autoTravelTimerRef.current);
            autoTravelTimerRef.current = null;
         }
       }
       addLogMessage(`💀 NEMESIS AMBUSH: ${nemesis.name} has tracked you down to exact their revenge!`, 'danger');
       
       onStartCombat('bounty', 0.8, { 
         id: nemesis.id, 
         type: 'bounty', 
         targetName: nemesis.name, 
         title: `Nemesis Ambush: ${nemesis.name}` 
       });
       return true;
    }

    // --- Boss Hideout Discovery Logic ---
    const activeInvestigationsFinal = player.inventory.map(invItem => {
        let mission: any = null;
        for (const l of locations) {
          const q = l.quests?.find(quest => quest.id === invItem.id);
          if (q && q.hiddenTargetHex && (q.currentCluePoints || 0) >= (q.maxClueThreshold || 3) && q.questState !== 'COMPLETED_BOUNTY') {
            mission = q;
            break;
          }
        }
        return mission;
    }).filter(m => m !== null);

    for (const mission of activeInvestigationsFinal) {
       if (Math.hypot(nextX - mission.hiddenTargetHex[0], nextY - mission.hiddenTargetHex[1]) < 4.0) {
           if (isAutoTraveling) {
              setIsAutoTraveling(false);
              if (autoTravelTimerRef.current) clearTimeout(autoTravelTimerRef.current);
           }
           
           if (mission.twistType !== 'STANDARD' && mission.questState === 'TWIST_REVEALED') {
              addLogMessage(`⚠️ CONFRONTATION: You found ${mission.targetName}'s hideout. Time to make a choice.`, 'danger');
              onConfrontBoss(mission);
           } else {
              addLogMessage(`⚠️ BOUNTY LOCATED: You reached ${mission.targetName}'s precise hideout. Draw weapons!`, 'danger');
              onStartCombat('bounty', 0.85, mission);
           }
           return false;
       }
    }

    // --- Investigation Tracks Spawn/Pickup Logic ---
    let pickUpTrackId: string | null = null;

    const activeInvestigations = player.inventory.map(invItem => {
        let mission: any = null;
        for (const l of locations) {
          const q = l.quests?.find(quest => quest.id === invItem.id);
          if (q && q.hiddenTargetHex && (q.currentCluePoints || 0) < (q.maxClueThreshold || 3)) {
            mission = q;
            break;
          }
        }
        return mission;
    }).filter(m => m !== null);

    if (activeInvestigations.length > 0 && Math.random() < 0.08) {
        const mission = activeInvestigations[Math.floor(Math.random() * activeInvestigations.length)];
        const distToHidden = Math.hypot(nextX - mission.hiddenTargetHex[0], nextY - mission.hiddenTargetHex[1]);
        if (distToHidden <= 25) {
            if (!locations.some(l => l.id === `track_${mission.id}`)) {
                const trackLoc = {
                    id: `track_${mission.id}`,
                    name: 'Disturbed Campfire',
                    type: 'ghost_town',
                    x: Math.round(nextX + (Math.random() * 8 - 4)),
                    y: Math.round(nextY + (Math.random() * 8 - 4)),
                    description: 'Fresh tracks leading away from a dying fire.',
                    isExplored: true,
                    shop: [],
                    quests: [],
                } as Location;
                setWorldLocations(prev => [...prev, trackLoc]);
                addLogMessage(`👣 INVESTIGATION: You noticed signs of an outlaw passing through nearby. A 'Disturbed Campfire' appeared on the map! Walk to it to gather a clue.`, 'system');
            }
        }
    }

    // Check if stepped on a track
    const tracksNearby = locations.filter(l => l.id.startsWith('track_'));
    for (const track of tracksNearby) {
      if (Math.hypot(nextX - track.x, nextY - track.y) < 3.0) {
        pickUpTrackId = track.id;
        break;
      }
    }

    if (pickUpTrackId) {
      if (isAutoTraveling) {
         setIsAutoTraveling(false);
         if (autoTravelTimerRef.current) {
            clearTimeout(autoTravelTimerRef.current);
            autoTravelTimerRef.current = null;
         }
      }
      const missionId = pickUpTrackId.replace('track_', '');
      
      let targetName = "";
      let twistRevealed = false;

      setWorldLocations(prev => {
        return prev.filter(l => l.id !== pickUpTrackId).map(loc => {
           return {
             ...loc,
             quests: loc.quests.map(q => {
               if (q.id === missionId && q.hiddenTargetHex) {
                 targetName = q.targetName;
                 const newClues = (q.currentCluePoints || 0) + 1;
                 let newState = q.questState || 'HUNTING';
                 if (newClues === 2 && q.twistType && q.twistType !== 'STANDARD') {
                   twistRevealed = true;
                   newState = 'TWIST_REVEALED';
                 }
                 return { ...q, currentCluePoints: newClues, questState: newState };
               }
               return q;
             })
           }
        })
      });

      addLogMessage(`🔍 CLUE FOUND: Examined the campfire. Learned more about the location of ${targetName !== "" ? targetName : 'the target'}. The marking glow tightened on your map!`, 'loot');
      
      if (twistRevealed) {
        addLogMessage(`⚠️ INVESTIGATION TWIST: Some items discarded at the camp point to an alarming motive... Check the map thoroughly!`, 'danger');
      }

      return false; // Did not travel, picked up clue
    }

    if (Math.random() < eventChance) {
      const roll = Math.random();
      
      let ambushThreshold = 0.45;
      const outlawRepVal = player.factionReputation?.outlaws || 0;
      if (outlawRepVal < -10) {
        ambushThreshold += (Math.abs(outlawRepVal) / 100) * 0.4;
      }
      
      // Shadow of the Canyon reduces ambush frequency at night by 50%
      if (isNight && player.perks.includes("shadow")) {
        ambushThreshold *= 0.5;
      }

      const isRetaliation = outlawRepVal < -10 && roll < ambushThreshold;
      let isAmbush = isRetaliation || (nextZone === 'bandit' && roll < 0.45) || (travelByNight && !isNight && roll < 0.3);
      if (isNight && player.perks.includes("shadow")) isAmbush = isAmbush && Math.random() > 0.5;
      
      const isNightAttackOnNPC = travelByNight && isNight && roll < 0.2;
      const isInjury = !isRetaliation && isTreacherous && roll > 0.8;

      if (isNightAttackOnNPC) {
         addLogMessage(`🌙 NIGHT SURPRISE: You got the drop on an outlaw camp in the dark! Confiscated $15 gold!`, 'loot');
         onUpdatePlayer(p => ({ ...p, gold: p.gold + 15 }));
      } else if (isAmbush) {
        if (isAutoTraveling) {
          setIsAutoTraveling(false);
          if (autoTravelTimerRef.current) {
             clearTimeout(autoTravelTimerRef.current);
             autoTravelTimerRef.current = null;
          }
        }
        if (isRetaliation) {
           addLogMessage(`💀 FACTION RETALIATION: An outlaw gang hit squad ambushed you on the open trail!`, 'danger');
           onStartCombat('ambush', 0.85, undefined);
           return true; 
        } else {
           addLogMessage(`⚔️ BANDIT AMBUSH: Outlaws spotted your trail and fired a warning shot! You lose 5 HP!`, 'danger');
           onUpdatePlayer(p => ({ ...p, hp: Math.max(1, p.hp - 5) }));
        }
      } else if (isInjury) {
        if (isAutoTraveling) {
          setIsAutoTraveling(false);
          if (autoTravelTimerRef.current) {
             clearTimeout(autoTravelTimerRef.current);
             autoTravelTimerRef.current = null;
          }
        }
        addLogMessage(`⚠️ TREACHEROUS TERRAIN: You slipped and suffered an injury in the harsh ${biome.name}! (-5 HP)`, 'danger');
        onUpdatePlayer(p => ({ ...p, hp: Math.max(1, p.hp - 5) }));
      } else if (roll < 0.1) {
        addLogMessage(`🚂 You pass a chain gang of prisoners building a railroad out in the dust. The guards nod at you.`, 'system');
      } else if (roll < 0.2) {
        addLogMessage(`🤠 A traveling trader crosses your path. He tosses you an old canteen!`, 'loot');
      } else if (roll < 0.3) {
        const foundGold = 10 + Math.floor(Math.random() * 20);
        addLogMessage(`🏚️ You found a lost, abandoned hacienda! You search the old pots and find $${foundGold}.`, 'loot');
        onUpdatePlayer(p => {
          return { ...p, gold: p.gold + foundGold };
        });
      } else if (roll < 0.45 && nextZone !== 'bandit') {
        onUpdatePlayer(p => {
          const updatedInv = [...p.inventory];
          const badgeIndex = updatedInv.findIndex(i => i.id === 'bandage');
          if (badgeIndex !== -1) updatedInv[badgeIndex].count += 1;
          else updatedInv.push({ id: 'bandage', name: 'Clean Bandage', type: 'consumable', value: 10, count: 1, details: 'Restores 35 HP on use. Crucial for stemming arterial bleeding. (Weight: 0.5 lbs)' });
          return { ...p, inventory: updatedInv };
        });
        addLogMessage(`🛠️ FOUND SUPPLIES: You scavenged an old clean bandage from a ruined wagon!`, 'loot');
      } else if (roll < 0.7) {
        addLogMessage(`💦 TRAILSIDE CACHE: Located some clear water under high shade peaks.`, 'loot');
      } else {
        addLogMessage(`☀️ ARIZONA HEATWAVE: Suffocated under extremely hot dry air gusts.`, 'danger');
      }
    }
    return true;
  };

  // Keyboard controls listener for manual keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const validKeys = ['w', 'a', 's', 'd', 'q', 'e', 'y', 'z', 'c'];
      if (!validKeys.includes(key)) return;

      e.preventDefault();

      // Cancel auto-travel if active
      if (isAutoTraveling) {
        setIsAutoTraveling(false);
        if (autoTravelTimerRef.current) {
          clearTimeout(autoTravelTimerRef.current);
          autoTravelTimerRef.current = null;
        }
        addLogMessage('⌨️ MANUAL OVERRIDE: Switched back to manual badlands exploration.', 'system');
      }

      let dx = 0;
      let dy = 0;
      const stepSize = getPlayerSpeed(player);

      if (key === 'w') { dy = -stepSize; }
      else if (key === 's') { dy = stepSize; }
      else if (key === 'a') { dx = -stepSize; }
      else if (key === 'd') { dx = stepSize; }
      else if (key === 'q') { dx = -stepSize * 0.7; dy = -stepSize * 0.7; }
      else if (key === 'e') { dx = stepSize * 0.7; dy = -stepSize * 0.7; }
      else if (key === 'y' || key === 'z') { dx = -stepSize * 0.7; dy = stepSize * 0.7; }
      else if (key === 'c') { dx = stepSize * 0.7; dy = stepSize * 0.7; }

      const prevX = playerX;
      const prevY = playerY;
      const nextX = prevX + dx;
      const nextY = prevY + dy;

      const allowedTravel = processOverlandStep(prevX, prevY, nextX, nextY);
      if (allowedTravel) {
        setPlayerX(nextX);
        setPlayerY(nextY);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isAutoTraveling, playerX, playerY, gameTimeHour, travelByNight, showCampFire]);

  // Handle Clean Cleanup of Auto-Travel on Unmount
  useEffect(() => {
    return () => {
      if (autoTravelTimerRef.current) {
        clearTimeout(autoTravelTimerRef.current);
      }
    };
  }, []);

  const handleAutoTravelTo = (targetLoc: Location) => {
    const visited = player.visitedLocationIds || [];
    if (!visited.includes(targetLoc.id)) {
      addLogMessage(`🔒 LOCKED DESTINATION: You haven't explored/visited ${targetLoc.name} yet! Walk there manually using keys first.`, 'danger');
      return;
    }

    if (isAutoTraveling) {
      if (autoTravelTimerRef.current) clearTimeout(autoTravelTimerRef.current);
    }

    setIsAutoTraveling(true);
    setAutoTravelTargetId(targetLoc.id);
    addLogMessage(`🏇 AUTO-TRAVEL ENGAGED: ${player.name} began auto-traveling towards ${targetLoc.name}. You can break or override anytime using W, A, S, D, Q, E, Y, C.`, 'travel');
  };

  useEffect(() => {
    if (!isAutoTraveling || !autoTravelTargetId) return;

    const timer = setTimeout(() => {
      const targetLoc = locations.find(loc => loc.id === autoTravelTargetId);
      if (!targetLoc) {
        setIsAutoTraveling(false);
        setAutoTravelTargetId(null);
        return;
      }

      const px = playerX;
      const py = playerY;

      const distanceToTarget = Math.hypot(targetLoc.x - px, targetLoc.y - py);
      if (distanceToTarget < 2.5) {
        setIsAutoTraveling(false);
        setAutoTravelTargetId(null);
        setCurrentLocationId(targetLoc.id);
        addLogMessage(`🏇 ARRIVED: Reached your known target destination: ${targetLoc.name}.`, 'travel');
        return;
      }

      const angle = Math.atan2(targetLoc.y - py, targetLoc.x - px);
      const biome = getBiomeAt(px, py);
      const finalSpeed = getPlayerSpeed(player) * biome.speedModifier; 

      const nextX = px + Math.cos(angle) * finalSpeed;
      const nextY = py + Math.sin(angle) * finalSpeed;

      const allowedTravel = processOverlandStep(px, py, nextX, nextY);
      if (allowedTravel) {
        setPlayerX(nextX);
        setPlayerY(nextY);
      }

    }, 450);

    autoTravelTimerRef.current = timer;

    return () => {
      clearTimeout(timer);
    };
  }, [isAutoTraveling, autoTravelTargetId, playerX, playerY, gameTimeHour, travelByNight, showCampFire]);

  // Calculate costs to current selected
  let travelDistance = 0;
  let trainTicketCost = 0;
  let worksWithTrain = false;
  let canAffordTrain = false;

  if (selectedLocation && selectedLocation.id !== currentLocation.id) {
    travelDistance = distance(currentLocation, selectedLocation);

    // Train Gold Ticket
    if (currentLocation.hasTrain && selectedLocation.hasTrain) {
      worksWithTrain = true;
      trainTicketCost = Math.round(travelDistance * 1.5);
      if (player.perks.includes('silver_tongue')) {
        trainTicketCost = Math.round(trainTicketCost * 0.8);
      }
    }

     canAffordTrain = player.gold >= trainTicketCost;
   }
 
   const handleRideHorse = () => {
     if (selectedLocation) {
       handleAutoTravelTo(selectedLocation);
       setSelectedLocationId(null);
     }
   };
 
   const handleTakeTrain = () => {
     if (selectedLocationId && worksWithTrain && canAffordTrain) {
       const targetLoc = locations.find(loc => loc.id === selectedLocationId);
       if (targetLoc) {
         setPlayerX(targetLoc.x);
         setPlayerY(targetLoc.y);
         onUpdatePlayer(prev => {
           const list = prev.visitedLocationIds || [];
           if (!list.includes(targetLoc.id)) {
             return { ...prev, visitedLocationIds: [...list, targetLoc.id] };
           }
           return prev;
         });
       }
       onTravel(selectedLocationId, 'train');
       setSelectedLocationId(null);
     }
   };

  const getLocationIcon = (type: Location['type']) => {
    switch (type) {
      case 'boomtown':
        return <span className="text-[#8c6b0c] font-extrabold text-sm">✦</span>;
      case 'railway_hub':
        return <span className="text-[#2a8ec4] font-extrabold text-sm">⚙</span>;
      case 'outlaw_haven':
        return <span className="text-[#c4451a] font-extrabold text-sm">☠</span>;
      case 'ghost_town':
        return <span className="text-[#664d36] font-extrabold text-sm">✝</span>;
      case 'mine':
        return <span className="text-orange-400 font-extrabold text-sm">⚒</span>;
      case 'desert_oasis':
        return <span className="text-[#2a8ec4] font-extrabold text-sm">▲</span>;
      case 'hostile_camp':
        return <span className="text-[#c4451a] font-extrabold text-sm">⚔</span>;
      case 'ephemeral_stash':
        return <span className="text-[#8c6b0c] font-extrabold text-sm">✖</span>;
      default:
        return <span className="text-[#3d2d21] font-extrabold text-sm">●</span>;
    }
  };

  const getLocationColorClass = (type: Location['type']) => {
    switch (type) {
      case 'boomtown': return 'text-[#8c6b0c]';
      case 'railway_hub': return 'text-[#2a8ec4]';
      case 'outlaw_haven': return 'text-[#c4451a]';
      case 'ghost_town': return 'text-[#664d36]';
      case 'mine': return 'text-orange-400';
      case 'desert_oasis': return 'text-[#2a8ec4]';
      case 'hostile_camp': return 'text-[#c4451a]';
      case 'ephemeral_stash': return 'text-[#8c6b0c]';
      default: return 'text-[#3d2d21]';
    }
  };

  const getLocationTypeName = (type: Location['type']) => {
    switch (type) {
      case 'boomtown': return 'Boomtown (Trading Settlement)';
      case 'railway_hub': return 'Railway Depot (Transport Hub)';
      case 'outlaw_haven': return 'Outlaw Refuge (Black Market)';
      case 'ghost_town': return 'Decaying Ghost Town';
      case 'mine': return 'Abandoned Gold Mine Dungeon';
      case 'desert_oasis': return 'Arid Desert Oasis (Free Springs)';
      case 'hostile_camp': return 'Hostile Gang Outpost';
      case 'ephemeral_stash': return 'Temporary Cache / Hideout';
      default: return 'Region Hub';
    }
  };

  // Draw railway hub lines
  const railwayHubs = locations.filter(loc => loc.hasTrain);

  const CAMERA_VIEW_SIZE = 80;
  const cameraX = playerX - CAMERA_VIEW_SIZE / 2;
  const cameraY = playerY - CAMERA_VIEW_SIZE / 2;

  // Helper to get relative coordinates in our viewport
  const getViewportCoords = (gx: number, gy: number) => {
    const rx = ((gx - cameraX) / CAMERA_VIEW_SIZE) * 100;
    const ry = ((gy - cameraY) / CAMERA_VIEW_SIZE) * 100;
    return { x: rx, y: ry, visible: rx >= -20 && rx <= 120 && ry >= -20 && ry <= 120 };
  };

  return (
    <div id="overland-map-screen" className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-full">
      {/* Interactive Map Layout */}
      <div className="lg:col-span-8 flex flex-col bg-[#f4ead5] border border-[#bfae96] rounded-sm p-4 h-full min-h-[480px]">
        <div className="flex items-center justify-between mb-4 pb-2.5 border-b border-[#bfae96]">
          <div className="flex items-center gap-2">
            <Compass size={16} className="text-[#8c6b0c] animate-spin-slow" />
            <h2 className="text-xs font-serif tracking-wider font-bold text-[#8c6b0c] uppercase">New Mexico Badlands Territory Chart</h2>
          </div>
          <div className="hidden sm:flex gap-3 text-[9px] font-mono text-[#664d36] uppercase tracking-wider font-semibold">
            <span className="flex items-center gap-1"><span className="text-[#8c6b0c]">✦</span> Settlement</span>
            <span className="flex items-center gap-1"><span className="text-[#2a8ec4]">⚙</span> Railway</span>
            <span className="flex items-center gap-1"><span className="text-[#c4451a]">☠</span> Gang Haven</span>
            <span className="flex items-center gap-1"><span className="text-[#2a8ec4]">▲</span> Basin Oasis</span>
            <span className="flex items-center gap-1"><span className="text-[#664d36]">✝</span> Ruins</span>
            <span className="flex items-center gap-1"><span className="text-orange-400">⚒</span> Mine</span>
          </div>
        </div>

        {/* Dynamic Graphic SVG Map Container matching Immersive UI exactly */}
        <div className="flex-1 bg-[radial-gradient(circle_at_center,_#e6d9b9_0%,_#d2bb95_100%)] border border-[#bfae96] rounded-sm relative overflow-hidden group min-h-[380px]">
          {/* Day/Night Time Filter Overlay */}
          {(() => {
            let darknessOpacity = 0;
            if (gameTimeHour >= 18.5 && gameTimeHour < 22) {
              darknessOpacity = ((gameTimeHour - 18.5) / (22 - 18.5)) * 0.9;
            } else if (gameTimeHour >= 22 || gameTimeHour < 6) {
              darknessOpacity = 0.9;
            } else if (gameTimeHour >= 6 && gameTimeHour < 7.5) {
              darknessOpacity = 0.9 - ((gameTimeHour - 6) / 1.5) * 0.9;
            }

            let heatOpacity = 0;
            if (gameTimeHour >= 12 && gameTimeHour < 16) {
              heatOpacity = 0.15;
            }

            return (
              <>
                <div 
                  className="absolute inset-0 pointer-events-none mix-blend-multiply z-10 bg-blue-950 transition-opacity duration-700" 
                  style={{ opacity: darknessOpacity }} 
                />
                <div 
                  className="absolute inset-0 pointer-events-none mix-blend-multiply z-10 bg-orange-800 transition-opacity duration-700" 
                  style={{ opacity: heatOpacity }} 
                />
              </>
            );
          })()}

          {/* Day/Night Sun/Moon Dial */}
          <div 
            className="absolute top-4 right-4 w-12 h-12 rounded-full border-2 border-[#bfae96] overflow-hidden shadow-lg z-40 transition-colors duration-1000"
            style={{
              background: (gameTimeHour >= 6 && gameTimeHour < 19)
                ? 'linear-gradient(to bottom, #87CEEB, #e6d9b9)' 
                : 'linear-gradient(to bottom, #0A1128, #1A2849)',
            }}
          >
            <div 
              className="absolute inset-0 flex flex-col justify-between items-center py-0.5"
              style={{ 
                transform: `rotate(${(gameTimeHour - 12) * 15}deg)`, 
                transition: 'transform 0.5s linear' 
              }}
            >
              {/* Sun (Top when gameTimeHour is 12) */}
              <div className="text-yellow-400 drop-shadow-[0_0_6px_rgba(250,204,21,1)]">
                <Sun size={16} fill="currentColor" />
              </div>
              
              {/* Moon (Bottom when gameTimeHour is 12) */}
              <div className="text-slate-200 drop-shadow-[0_0_6px_rgba(226,232,240,0.8)] rotate-180 mb-0.5">
                <Moon size={14} fill="currentColor" />
              </div>
            </div>
            
            <div className="absolute w-full h-full rounded-full ring-inset ring-2 ring-black/10 pointer-events-none" />
          </div>

          {/* Grid lines pattern overlay */}
          <svg className="w-full h-full absolute inset-0 pointer-events-none mix-blend-overlay opacity-20" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern
                id="mapGrid"
                width={4 / CAMERA_VIEW_SIZE * 100}
                height={4 / CAMERA_VIEW_SIZE * 100}
                patternUnits="userSpaceOnUse"
                x={(-cameraX / CAMERA_VIEW_SIZE * 100)}
                y={(-cameraY / CAMERA_VIEW_SIZE * 100)}
              >
                <path d={`M ${4 / CAMERA_VIEW_SIZE * 100} 0 L 0 0 0 ${4 / CAMERA_VIEW_SIZE * 100}`} fill="none" stroke="#8c6b0c" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#mapGrid)" />
          </svg>

          {/* Passed sectors / biomes overlay trail */}
          {passedSectors.map(key => {
            const [cx, cy] = key.split(',').map(Number);
            const bucketSize = 4;
            const px = (cx + 0.5) * bucketSize;
            const py = (cy + 0.5) * bucketSize;
            
            const coords = getViewportCoords(px, py);
            if (!coords.visible) return null;
            
            const biome = getBiomeAt(px, py);
            
            // Generate deterministic random for "now and then" icons
            // e.g. cactus in desert, or nothing in plains
            const rand = Math.sin(cx * 12.9898 + cy * 78.233) * 43758.5453;
            const randFrac = rand - Math.floor(rand);
            
            let bgColor = 'bg-transparent';
            let iconToRender = null;
            
            if (biome.name === 'Savannah Plains') {
              bgColor = 'bg-green-700/60';
              // no icon for plains as requested
            } else if (biome.name === 'Rolling Hills') {
              bgColor = 'bg-amber-800/50';
              if (randFrac > 0.5) iconToRender = <span className="font-bold text-amber-900/40">◠</span>;
            } else if (biome.name === 'Searing Desert') {
              bgColor = 'bg-yellow-600/40';
              if (randFrac > 0.8) {
                iconToRender = '🌵';
              }
            } else if (biome.name === 'Rocky Ridge') {
              bgColor = 'bg-stone-500/60';
              iconToRender = <Mountain size={12} className="text-[#2d2119]" />;
            } else if (biome.name === 'River Valley') {
              bgColor = 'bg-blue-600/50';
              iconToRender = <Waves size={12} className="text-sky-300" />;
            }

            const sizePct = (bucketSize / CAMERA_VIEW_SIZE) * 100;

            return (
              <div
                id={`passed-sector-${key}`}
                key={`sector-${key}`}
                className={`absolute transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none select-none z-0 ${bgColor}`}
                style={{ 
                  left: `${coords.x}%`, 
                  top: `${coords.y}%`,
                  width: `${sizePct}%`,
                  height: `${sizePct}%`
                }}
              >
                {iconToRender && (
                  <span className="text-[10px] leading-none opacity-80">
                    {iconToRender}
                  </span>
                )}
              </div>
            );
          })}
          
          <div className="absolute top-4 left-4 bg-[#e8dec7]/80 px-3 py-1 rounded-sm border border-[#bfae96] text-[10px] text-[#664d36] font-serif uppercase tracking-widest pointer-events-none">
            Tactical Topographical Survey
          </div>

          {/* Draw procedural mountain peak icons in the background */}
          {(() => {
            const peaks = [];
            const snap = 10; // sample density
            const startGX = Math.floor(cameraX / snap) * snap - snap;
            const startGY = Math.floor(cameraY / snap) * snap - snap;
            for (let x = startGX; x < cameraX + CAMERA_VIEW_SIZE + snap; x += snap) {
              for (let y = startGY; y < cameraY + CAMERA_VIEW_SIZE + snap; y += snap) {
                const mountainVal = Math.sin(x / 30) * Math.sin(y / 30);
                if (mountainVal > 0.25) {
                  const coords = getViewportCoords(x + Math.sin(y)*1.5, y + Math.cos(x)*1.5);
                  if (coords.visible) {
                    peaks.push(
                      <div
                        key={`mountain-peak-${x}-${y}`}
                        className="absolute pointer-events-none select-none transform -translate-x-1/2 -translate-y-1/2 text-[#5a4838]/15"
                        style={{ left: `${coords.x}%`, top: `${coords.y}%` }}
                      >
                        <Mountain size={14} />
                      </div>
                    );
                  }
                }
              }
            }
            return peaks;
          })()}

          <svg className="w-full h-full absolute inset-0 pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
            {/* Draw procedural winding river path inside the viewport! */}
            {(() => {
              const riverPoints: string[] = [];
              const snap = 4;
              const startGX = Math.floor(cameraX / snap) * snap - snap;
              for (let vx = startGX; vx <= cameraX + CAMERA_VIEW_SIZE + snap; vx += snap) {
                const riverVal = Math.sin(vx / 25) * 40 + Math.cos(vx / 40) * 15;
                const vy = riverVal + 50;
                const coords = getViewportCoords(vx, vy);
                riverPoints.push(`${coords.x},${coords.y}`);
              }
              const dPath = `M ${riverPoints.join(' L ')}`;
              return (
                <g>
                  {/* Outer glowing river shore */}
                  <path
                    d={dPath}
                    fill="none"
                    stroke="#144d6b"
                    strokeWidth="3.5"
                    className="opacity-25"
                  />
                  {/* Inner rushing water stream */}
                  <path
                    d={dPath}
                    fill="none"
                    stroke="#2a8ec4"
                    strokeWidth="1.5"
                    className="opacity-45"
                    strokeDasharray="4 2"
                  />
                </g>
              );
            })()}

            {/* Draw Rail Link Tracks */}
            {railwayHubs.map((hubA, i) => 
              railwayHubs.slice(i + 1).map((hubB) => {
                const isAExplored = hubA.isExplored || hubA.id === currentLocationId;
                const isBExplored = hubB.isExplored || hubB.id === currentLocationId;
                if (!isAExplored || !isBExplored) return null;

                const coordsA = getViewportCoords(hubA.x, hubA.y);
                const coordsB = getViewportCoords(hubB.x, hubB.y);
                if (!coordsA.visible && !coordsB.visible) return null;

                return (
                  <line
                    id={`rail-line-${hubA.id}-${hubB.id}`}
                    key={`rail-${hubA.id}-${hubB.id}`}
                    x1={coordsA.x}
                    y1={coordsA.y}
                    x2={coordsB.x}
                    y2={coordsB.y}
                    stroke="#2a8ec4"
                    strokeWidth="0.8"
                    strokeDasharray="2 1.5"
                    className="opacity-40"
                  />
                );
              })
            )}

            {/* Dotted Lines from Player current location to selected target */}
            {selectedLocation && selectedLocation.id !== currentLocation.id && (() => {
              const coordsPlayer = { x: 50, y: 50 }; // Player is at 50,50 relative viewport center
              const coordsTarget = getViewportCoords(selectedLocation.x, selectedLocation.y);
              return (
                <line
                  id="active-travel-destination-path"
                  x1={coordsPlayer.x}
                  y1={coordsPlayer.y}
                  x2={coordsTarget.x}
                  y2={coordsTarget.y}
                  stroke="#e8b923"
                  strokeWidth="1.2"
                  strokeDasharray="2.5 2"
                  className="opacity-80 animate-pulse"
                />
              );
            })()}
          </svg>

          {/* Investigation Areas Overlay */}
          {player.inventory.map(invItem => {
            let mission: any = null;
            for (const l of locations) {
              const q = l.quests?.find(quest => quest.id === invItem.id);
              if (q && q.hiddenTargetHex) {
                mission = q;
                break;
              }
            }
            if (!mission || mission.questState === 'COMPLETED_BOUNTY') return null;

            const [tx, ty] = mission.hiddenTargetHex;
            const clues = mission.currentCluePoints || 0;
            if (clues === 0) return null;

            const bossCoords = getViewportCoords(tx, ty);
            if (!bossCoords.visible) return null;

            if (clues === 1) {
              return (
                <div key={`investigate-${mission.id}`} className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-red-500/50 bg-red-500/20 pointer-events-none z-10 animate-pulse" style={{ left: `${bossCoords.x}%`, top: `${bossCoords.y}%`, width: '25%', height: '25%' }} />
              );
            }
            if (clues === 2) {
              return (
                <div key={`investigate-${mission.id}`} className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-red-600/70 bg-red-500/30 pointer-events-none z-10 animate-pulse" style={{ left: `${bossCoords.x}%`, top: `${bossCoords.y}%`, width: '7.5%', height: '7.5%' }} />
              );
            }
            if (clues >= 3) {
              return (
                 <div
                   key={`investigate-${mission.id}`}
                   className="absolute font-bold text-xl drop-shadow-md -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-auto cursor-pointer hover:scale-125 transition-transform"
                   style={{ left: `${bossCoords.x}%`, top: `${bossCoords.y}%` }}
                   onClick={() => {
                      if (mission.twistType !== 'STANDARD' && mission.questState === 'TWIST_REVEALED') {
                         addLogMessage(`⚠️ CONFRONTATION: You found ${mission.targetName}'s hideout. Time to make a choice.`, 'danger');
                         onConfrontBoss(mission);
                      } else {
                         addLogMessage(`⚠️ BOUNTY LOCATED: You reached ${mission.targetName}'s precise hideout. Draw weapons!`, 'danger');
                         onStartCombat('bounty', 0.85, mission);
                      }
                   }}
                 >
                   🤠
                 </div>
              )
            }
            return null;
          })}

          {/* Location buttons overlay */}
          {locations.map((loc) => {
            const coords = getViewportCoords(loc.x, loc.y);
            if (!coords.visible) return null;

            const isCurrent = loc.id === currentLocationId;
            const isSelected = loc.id === selectedLocationId;
            
            // Check if this is the target of any active signed bounty/quest
            const isActiveQuestTarget = player.inventory.some(invItem => {
              for (const l of locations) {
                const q = l.quests.find(quest => quest.id === invItem.id);
                if (q && q.targetLocationId === loc.id) return true;
              }
              return false;
            });

            // Determine if node is revealed/visible
            const isRevealed = loc.isExplored || isCurrent;
            const dist = Math.hypot(playerX - loc.x, playerY - loc.y);
            const isClose = dist <= 16;
            
            // Only show known or close locations!
            const isKnown = isRevealed || isActiveQuestTarget || isClose;
            if (!isKnown) return null;
            
            const nodeDisplayName = isRevealed 
              ? loc.name 
              : isActiveQuestTarget 
              ? "🎯 Target (Approx)" 
              : "Settlement (Unknown)";

            return (
              <button
                id={`map-node-${loc.id}`}
                key={loc.id}
                onClick={() => setSelectedLocationId(loc.id)}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group transition-all duration-300 z-10"
                style={{ left: `${coords.x}%`, top: `${coords.y}%` }}
              >
                {/* Sonar target glow approximate radar if this is an active quest target (even if revealed, to make it obvious!) */}
                {isActiveQuestTarget && (
                  <div className="absolute w-12 h-12 bg-red-600/20 border-2 border-red-500 rounded-full animate-ping pointer-events-none z-0" />
                )}

                {/* Node Ring Indicator */}
                <div 
                  className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 relative ${
                    isCurrent 
                      ? 'bg-[#e8dec7] border-[#e8b923] scale-110 z-30 shadow-[0_0_12px_#e8b923]' 
                      : isSelected
                      ? 'bg-[#dfd4bd] border-[#e8b923] scale-105 z-25 shadow-[0_0_8px_rgba(232,185,35,0.4)]'
                      : !isRevealed
                      ? 'bg-[#d0b89a] border-[#b8a081] opacity-70 hover:opacity-100 hover:border-[#8f795d] mix-blend-multiply'
                      : 'bg-[#dcd1b9] border-[#bfae96] hover:border-[#8a705a] hover:scale-105'
                  }`}
                >
                  {!isRevealed ? (
                    <span className="text-[#64523b] font-bold opacity-70 scale-[0.6] pointer-events-none select-none">
                      {isActiveQuestTarget ? "🎯" : getLocationIcon(loc.type)}
                    </span>
                  ) : (
                    isActiveQuestTarget ? "🎯" : getLocationIcon(loc.type)
                  )}
                </div>

                {isCurrent && (
                  <div className="absolute -top-1.5 -right-1.5 bg-[#e8b923] p-0.5 rounded-full text-[#1a130f] shadow-md z-40">
                    <Navigation size={8} className="fill-current transform rotate-45" />
                  </div>
                )}

                {/* Label box */}
                <div className="mt-1 flex flex-col items-center pointer-events-none z-10">
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-sm select-none tracking-wide font-sans ${
                    isCurrent 
                      ? 'text-[#8c6b0c] bg-[#e8dec7] border border-[#bfae96]' 
                      : isSelected 
                      ? 'text-[#8c6b0c] bg-[#e8dec7] border border-[#bfae96] font-bold'
                      : !isRevealed
                      ? 'text-[#4a3928] bg-[#d9c3a6]/80 border border-[#b8a081]'
                      : 'text-[#3d2d21] bg-[#dcd1b9]/90 border border-[#bfae96]/40'
                  }`}>
                    {nodeDisplayName}
                  </span>
                </div>
              </button>
            );
          })}

          {/* Real-time ${player.name} coordinate sprite on the Overland Map (always centered under camera viewport) */}
          <div 
            className="absolute transform -translate-x-1/2 -translate-y-full z-40 transition-all duration-300 flex items-center justify-center pointer-events-none"
            style={{ left: `50%`, top: `50%` }}
          >
            <div className="relative flex justify-center items-center">
              <img 
                src={overlandImg} 
                alt="Player sprite" 
                className={`object-contain filter drop-shadow-[0_0_8px_rgba(232,185,35,0.8)] ${player.hasHorse ? 'h-16' : 'h-10'}`} 
                style={{ imageRendering: 'pixelated' }} 
              />
              {showCampFire && (
               <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 flex flex-col items-center z-50 transition-opacity">
                  <span className="text-2xl drop-shadow-[0_0_15px_rgba(249,115,22,1)] animate-bounce">⛺</span>
                  <span className="text-[9px] font-bold uppercase text-orange-400 bg-black/80 px-2 py-0.5 rounded-sm mt-1 whitespace-nowrap shadow-md">Resting</span>
               </div>
              )}
            </div>
          </div>

          {/* Elegant top-center banner for Active Auto-Travel */}
          {isAutoTraveling && (
            <div className="absolute top-3 left-1/2 transform -translate-x-1/2 bg-amber-950/90 border-2 border-amber-500 text-amber-200 px-4 py-1.5 rounded-full text-[10px] font-sans font-bold uppercase tracking-wider shadow-lg flex items-center gap-2 z-50 animate-bounce">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              🏇 ${player.name} is Auto-Traveling (Press W, S, A, D to halt)
            </div>
          )}

        </div>
      </div>

      {/* Information Panel (Right-Side Control Center) */}
      <div className="lg:col-span-4 flex flex-col gap-4 bg-[#f4ead5] border border-[#bfae96] p-5 rounded-sm h-full justify-between shadow-xl">
        <div className="flex-1 flex flex-col">
          {/* Survival Instruments & Biome Tracker */}
          <div className="bg-[#dcd1b9] border border-[#bfae96]/60 rounded-sm p-3.5 mb-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[9px] text-[#664d36] uppercase font-serif tracking-widest font-bold">Trail Instruments</span>
              <div className={`px-2 py-0.5 rounded text-[9px] uppercase font-mono border ${getBiomeAt(playerX, playerY).color}`}>
                {getBiomeAt(playerX, playerY).icon} {getBiomeAt(playerX, playerY).name}
              </div>
            </div>
            <div className="border-t border-[#bfae96]/30 pt-2 flex justify-between text-[10px] font-mono text-[#4a3928]">
              <span>Badlands Coords:</span>
              <span className="text-[#8c6b0c]">({Math.round(playerX)}°W, {Math.round(playerY)}°N)</span>
            </div>
            <div className="flex justify-between text-[10px] font-mono text-[#4a3928]">
              <span>Local Time:</span>
              <span className="text-[#8c6b0c]">
                {Math.floor(gameTimeHour) % 12 || 12}:{Math.floor((gameTimeHour % 1) * 60).toString().padStart(2, '0')} {gameTimeHour >= 12 ? 'PM' : 'AM'} 
                {gameTimeHour >= 12 && gameTimeHour < 16 && ' (Scorching Heat)'}
                {(gameTimeHour >= 20 || gameTimeHour < 6) && ' (Nighttime Cooling)'}
              </span>
            </div>
            <div className="flex justify-between items-center text-[10px] font-mono text-[#4a3928]">
              <span>Camp Behavior:</span>
              <button 
                onClick={() => setTravelByNight(!travelByNight)}
                className={`px-2 py-0.5 rounded uppercase font-bold text-[9px] border transition-colors ${travelByNight ? 'bg-indigo-950 border-indigo-500 text-indigo-300' : 'bg-[#f4ead5] border-[#bfae96] text-[#5a4838]'}`}
              >
                {travelByNight ? 'Travel By Night' : 'Camp Overnight'}
              </button>
            </div>
            <div className="flex justify-between text-[10px] font-mono text-[#4a3928]">
              <span>Weather Zone:</span>
              <span className="text-[#2d2119] capitalize">{getBiomeAt(playerX, playerY).desc}</span>
            </div>
            {getBiomeAt(playerX, playerY).name === 'River Valley' && (
               <div className="flex justify-between items-center text-[10px] font-mono text-[#4a3928] border-t border-[#bfae96]/30 pt-2 mt-2">
                 <span>Fresh Water:</span>
                 <button
                   onClick={handleRefillCanteen}
                   className="px-2 py-0.5 rounded bg-sky-900 border border-sky-500 text-sky-200 font-bold uppercase text-[9px] hover:bg-sky-800 transition-colors"
                 >
                   Refill Canteen
                 </button>
               </div>
            )}
            <div className="border-t border-[#bfae96]/30 pt-2 mt-2 text-[9px] text-[#664d36] uppercase leading-relaxed font-sans">
              🚀 <b>Manual Steering:</b> Use <b>WASD</b> for cardinal movement, <b>Q, E, Y, C</b> for diagonal tracking to navigate manually.
            </div>
          </div>

          {/* Near Town Proximity Entry Button */}
          {(() => {
            const nearLocation = locations.find(loc => {
              return loc.isExplored && Math.hypot(loc.x - playerX, loc.y - playerY) < 3.5;
            });
            if (!nearLocation) return null;
            return (
              <div className="bg-[#1e1511] border-2 border-[#e8b923] p-3 rounded-sm mb-4 space-y-2 text-center shadow-lg">
                <div className="text-[9.5px] text-[#8c6b0c] uppercase font-bold font-serif tracking-widest animate-pulse">
                  🏘️ ARRIVAL: STANDING NEAR {nearLocation.name}
                </div>
                <p className="text-[9px] text-[#4a3928] leading-normal font-sans">
                  Saddle down and click the button below to dismount and enter buildings, offices and saloons here.
                </p>
                <button
                  id="btn-sidebar-enter-town"
                  onClick={() => {
                    onUpdatePlayer(prev => {
                      const list = prev.visitedLocationIds || [];
                      if (!list.includes(nearLocation.id)) {
                        return { ...prev, visitedLocationIds: [...list, nearLocation.id] };
                      }
                      return prev;
                    });
                    setCurrentLocationId(nearLocation.id);
                    onEnterTown();
                  }}
                  className="w-full bg-[#e8b923] hover:bg-[#ffcf33] text-[#1a130f] py-2 px-3 rounded-sm font-serif uppercase tracking-wider font-extrabold text-[11px] cursor-pointer border-b-2 border-amber-900 transition-colors"
                >
                  Enter Outpost
                </button>
              </div>
            );
          })()}

          <div className="flex border-b border-[#bfae96] pb-2.5 items-center gap-2 mb-4">
            <MapIcon size={16} className="text-[#8c6b0c]" />
            <span className="text-[10px] font-serif font-bold tracking-widest text-[#664d36] uppercase">Intelligence Report</span>
          </div>

          {!selectedLocation ? (
            <div className="flex-1 flex flex-col justify-center items-center py-10 text-center px-4 space-y-4">
              <div className="p-4 bg-[#e8dec7] border border-[#bfae96] rounded-full text-[#664d36] animate-pulse">
                <Compass size={28} className="text-[#8c6b0c]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-[#8c6b0c] font-serif text-xs font-bold uppercase tracking-wider">Map Navigation Ready</h3>
                <p className="text-[#4a3928] text-[11px] leading-relaxed max-w-[240px] font-sans">
                  Scout individual desert districts on the chart map to track risks, secure spring coordinates, trade, and mount up.
                </p>
              </div>

              {/* Current Station status box */}
              <div className="w-full bg-[#dfd4bd] border border-[#bfae96] rounded-sm p-3 text-left space-y-1.5">
                <div className="text-[9px] text-[#664d36] uppercase tracking-wider font-serif">Current Outpost</div>
                <div className="text-[#8c6b0c] font-serif font-bold text-xs">{currentLocation.name}</div>
                <div className="text-[#4a3928] text-[10px] leading-relaxed italic font-sans">{currentLocation.description}</div>
              </div>
            </div>
          ) : (() => {
            const isSelectedRevealed = selectedLocation.isExplored || selectedLocation.id === currentLocationId;
            const isSelectedQuestTarget = selectedLocation.quests.some(quest => 
              player.inventory.some(invItem => invItem.id === quest.id)
            );
            
            const selectedDisplayName = isSelectedRevealed 
              ? selectedLocation.name 
              : isSelectedQuestTarget 
              ? "🎯 Target Frontier District (Approx)" 
              : "❔ Unknown Settlement";

            const selectedDisplayDesc = isSelectedRevealed 
              ? selectedLocation.description 
              : "Uncharted settlement or camp. Its exact nature is obscured in the dust. Approach to investigate.";


            return (
              <div className="space-y-4 flex-1 flex flex-col justify-between">
                {/* Selected Town Header Details matching design html structure */}
                <div className="bg-[#dfd4bd] p-4 border border-[#bfae96] rounded-sm space-y-3.5">
                  <div className="flex justify-between items-start border-b border-[#bfae96]/60 pb-2">
                    <div>
                      <span className={`text-[9.5px] font-serif uppercase tracking-widest font-bold ${getLocationColorClass(selectedLocation.type)}`}>
                        {isSelectedRevealed ? getLocationTypeName(selectedLocation.type) : "Obscured Sector"}
                      </span>
                      <h3 className="text-[#8c6b0c] font-serif font-bold text-base mt-0.5">{selectedDisplayName}</h3>
                    </div>
                    {selectedLocation.id === currentLocation.id && (
                      <span className="text-[9px] bg-[#3d2d21] text-[#8c6b0c] border border-[#8a705a] px-1.5 py-0.5 rounded-sm font-serif uppercase animate-pulse">
                        CAMPED
                      </span>
                    )}
                  </div>
                  <p className="text-[#4a3928] text-xs italic leading-relaxed font-sans">{selectedDisplayDesc}</p>
                  
                  {/* Specific listings structure requested by mockup */}
                  <div className="mt-4 space-y-2 border-t border-[#bfae96]/60 pt-3">
                    <div className="flex justify-between text-xs font-sans">
                      <span className="text-[#664d36]">Threat Index:</span>
                      <span className={`font-mono font-bold ${
                        !isSelectedRevealed ? 'text-zinc-500' :
                        selectedLocation.risk < 0.35 ? 'text-emerald-400' :
                        selectedLocation.risk < 0.7 ? 'text-[#8c6b0c]' : 'text-[#c4451a] animate-pulse'
                      }`}>
                        {!isSelectedRevealed ? 'Obscured' : selectedLocation.risk >= 0.7 ? 'CRITICAL LETHAL' : `${Math.round(selectedLocation.risk * 100)}% Danger`}
                      </span>
                    </div>

                    <div className="flex justify-between text-xs font-sans">
                      <span className="text-[#664d36]">Bank Vault Reserve:</span>
                      <span className="text-[#8c6b0c] font-mono font-semibold text-right">
                        {!isSelectedRevealed ? 'Unknown' : selectedLocation.bankGold > 0 ? `$${selectedLocation.bankGold} Nuggets` : 'Exhausted'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Travel Action Interface */}
                {selectedLocation.id !== currentLocation.id && (
                  <div className="space-y-3 pt-2">
                    <span className="text-[10px] uppercase font-serif tracking-widest text-[#664d36] block">Select Transportation</span>
                    
                    {/* Method 1: Overland Badlands (Horse / Pedestrian) */}
                    <div className="bg-[#e8dec7] border border-[#bfae96] rounded-sm p-3.5 space-y-2.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-[#3d2d21] font-bold font-serif flex items-center gap-1.5">
                          {player.hasHorse ? "🐴 Mount Kentucky Stallion" : "🚶 Travel on Foot"}
                        </span>
                        <span className="text-[10px] text-[#664d36] font-serif font-mono">{travelDistance} Miles</span>
                      </div>

                      {player.visitedLocationIds?.includes(selectedLocation.id) ? (
                        <>
                          <div className="flex flex-col gap-1 text-[11px] font-sans border-t border-[#bfae96]/40 pt-2 pb-1 text-[#4a3928] leading-relaxed">
                            <p>This destination is <b>Visited & Known</b>. Engaging auto-travel will automatically steer ${player.name} one sector step at a time, consuming supplies based on the local biome.</p>
                          </div>

                          <button
                            id="btn-ride-horse"
                            onClick={handleRideHorse}
                            className="w-full py-2.5 rounded-sm bg-[#e8b923] hover:bg-[#ffcf33] text-[#1a130f] font-serif uppercase tracking-[0.14em] font-extrabold text-xs transition-colors border-0 flex items-center justify-center cursor-pointer shadow-md"
                          >
                            🏇 Engage Auto-Travel Here
                          </button>
                        </>
                      ) : (
                        <div className="border-t border-[#bfae96]/50 pt-2 space-y-2">
                          <div className="bg-amber-950/20 border border-amber-900/60 p-2.5 rounded-sm text-[10px] text-amber-400 font-sans leading-relaxed">
                            🔒 <b>UNCHARTED OUTPOST:</b> You have not visited this location yet. Auto-travel is locked. You must manually scout the badlands terrain using standard key commands <b>[W, S, A, D] or [Q, E, Y, C]</b> to reach and discover this point of interest first!
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Method 2: Train Transit */}
                    <div className="bg-[#e8dec7] border border-[#bfae96] rounded-sm p-3.5 space-y-2.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-[#3d2d21] font-bold font-serif flex items-center gap-1.5">
                          🚂 Express Train
                        </span>
                        <span className="text-[9px] bg-[#2a8ec4]/10 text-[#2a8ec4] border border-[#2a8ec4]/30 px-1.5 py-0.2 rounded-sm font-serif uppercase">Instant / 100% Safe</span>
                      </div>

                      {worksWithTrain ? (
                        <>
                          <div className="flex justify-between items-center text-[11px] font-sans">
                            <span className="text-[#4a3928]">Railway Passenger Fare:</span>
                            <span className={`${canAffordTrain ? 'text-[#8c6b0c]' : 'text-[#c4451a] font-bold'} font-mono`}>
                              ${trainTicketCost} Gold Nuggets
                            </span>
                          </div>

                          <button
                            id="btn-board-train"
                            onClick={handleTakeTrain}
                            disabled={!canAffordTrain}
                            className={`w-full py-2.5 rounded-sm font-serif uppercase tracking-[0.14em] font-bold text-xs transition-colors border-0 flex items-center justify-center ${
                              canAffordTrain
                                ? 'bg-[#1e3a8a] hover:bg-indigo-900 text-[#8c6b0c] border-b-4 border-[#0c0908] cursor-pointer'
                                : 'bg-[#e8dec7] text-[#664d36] cursor-not-allowed opacity-40'
                            }`}
                          >
                            {canAffordTrain ? 'Take Railway Express' : 'Inadequate coinage'}
                          </button>
                          
                          {/* Train Robbery Button */}
                          <button
                            id="btn-rob-train"
                            onClick={() => {
                              addLogMessage(`🚨 TRAIN HEIST: You drew your iron and stopped the Railway Express! Guards are opening fire!`, 'danger');
                              onStartCombat('train_robbery', selectedLocation?.risk || 0.6);
                            }}
                            className="w-full mt-2 py-2.5 rounded-sm font-serif uppercase tracking-[0.14em] font-bold text-xs transition-colors border-0 flex items-center justify-center bg-[#4a1313] hover:bg-[#5c1a1a] text-[#8c6b0c] border-b-4 border-[#1a0808] cursor-pointer"
                          >
                            Stick up Railway Express
                          </button>
                        </>
                      ) : (
                        <div className="text-[10px] text-[#664d36] font-serif italic py-1 text-center bg-[#dcd1b9]/50 rounded-sm border border-[#bfae96]/30">
                          Both region hubs must possess connected rail depots.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        {/* Legend Notes / Health warning */}
        <div className="mt-4 pt-3 border-t border-[#bfae96] font-serif text-[10px] text-[#8a7560] leading-relaxed text-center leading-normal">
          ⚡ DESERTS ARE SCORCHING: Outposts in deep desert terrain trigger aggressive scorpion raids.
        </div>
      </div>
    </div>
  );
};
