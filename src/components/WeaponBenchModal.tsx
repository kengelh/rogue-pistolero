import React from 'react';
import { Player, InventoryItem, Weapon } from '../types';

interface WeaponBenchModalProps {
  player: Player;
  onClose: () => void;
  onUpdatePlayer: (player: Player) => void;
  onAttachPart: (part: InventoryItem, slot: 'barrel' | 'cylinder' | 'stock' | 'action') => void;
  onDetachPart: (slot: 'barrel' | 'cylinder' | 'stock' | 'action') => void;
}

export const WeaponBenchModal: React.FC<WeaponBenchModalProps> = ({
  player,
  onClose,
  onUpdatePlayer,
  onAttachPart,
  onDetachPart
}) => {
  const partsInInventory = player.inventory.filter(i => i.type === 'weapon_part');

  const renderSlot = (slot: 'barrel' | 'cylinder' | 'stock' | 'action', label: string) => {
    const equippedPart = player.weapon.equippedParts?.[slot];
    
    // Filter parts that match the chosen slot and match the general gun type (very simple type matching)
    const slotParts = partsInInventory.filter(p => p.partStats?.type === slot);

    return (
      <div className="border border-[#bfae96] bg-[#dfd4bd] rounded-sm p-3 mb-2">
        <div className="flex justify-between items-center mb-2">
          <span className="font-serif font-bold text-[#3d2d21] uppercase text-[11px] tracking-wider">{label}</span>
          {equippedPart ? (
            <button
              onClick={() => onDetachPart(slot)}
              className="text-[9px] bg-red-900/10 hover:bg-red-900/20 text-red-800 border border-red-900/30 px-2 py-0.5 rounded cursor-pointer transition-colors uppercase"
            >
              Detach
            </button>
          ) : (
             <span className="text-[9px] text-[#8a705a] uppercase font-bold">Base (Empty)</span>
          )}
        </div>
        
        {equippedPart ? (
          <div className="bg-[#c4b9a1] p-2 flex gap-2 border border-[#8a705a]/50 rounded-xs mb-3 shadow-[inset_0_1px_3px_rgba(0,0,0,0.1)]">
             <div>
               <div className="font-bold text-[#1a130f] text-[10px]">{equippedPart.name}</div>
               <div className="text-[9px] text-[#4a3928]">{equippedPart.details}</div>
             </div>
          </div>
        ) : (
          <div className="bg-[#e8dec7] p-2 text-[10px] text-[#8a705a] italic rounded-xs mb-3 border border-transparent shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]">
             Standard factory {slot}. Modding this slot improves stats and restores durability.
          </div>
        )}

        <div className="space-y-1">
          {slotParts.length > 0 ? (
            <>
              <div className="text-[9px] uppercase tracking-wider text-[#664d36] mb-1 font-bold">Compatible Parts in Saddlebags:</div>
              {slotParts.map(part => (
                <div key={part.id} className="flex justify-between items-center bg-[#f4ead5] border border-[#dcd1b9] p-2 rounded-xs">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-[#1a130f]">{part.name}</span>
                    <span className="text-[9px] text-[#664d36] line-clamp-1">{part.details}</span>
                  </div>
                  <button
                    onClick={() => onAttachPart(part, slot)}
                    className="ml-2 text-[9px] bg-[#3d2d21] hover:bg-[#1a130f] text-[#dcd1b9] px-2 py-1 rounded cursor-pointer transition-colors shadow-sm uppercase font-serif"
                  >
                    Equip
                  </button>
                </div>
              ))}
            </>
          ) : (
            <div className="text-[9px] text-[#8a705a]">No compatible {slot}s found in inventory.</div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-[2px]">
      <div className="bg-[#f4ead5] border-2 border-[#8a705a] rounded-md shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        <div className="bg-[#2d2119] text-[#e8b923] p-4 flex justify-between items-center border-b border-[#1a130f] shrink-0">
          <div>
            <h2 className="text-xl font-black uppercase tracking-[0.15em] font-serif">Gunsmith & Maintenance</h2>
            <p className="text-[10px] text-[#bfae96] font-sans font-normal mt-0.5">Attach and maintain weapon components to restore functionality.</p>
          </div>
          <button onClick={onClose} className="text-[#e8b923] hover:text-white transition-colors cursor-pointer text-sm bg-white/10 px-3 py-1.5 rounded-sm">
            CLOSE (Esc)
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1 custom-scrollbar">
          <div className="mb-4 bg-[#dfd4bd] border border-[#bfae96] p-3 rounded-sm flex justify-between items-center shadow-sm">
             <div>
                <span className="text-[10px] uppercase font-serif tracking-widest text-[#664d36] font-bold block mb-1">Active Weapon</span>
                <span className="text-lg font-black text-[#1a130f] font-serif">{player.weapon.customName ? `"${player.weapon.customName}"` : player.weapon.name}</span>
             </div>
             <div className="text-right">
                <span className="text-[9px] uppercase tracking-wider text-[#664d36] font-bold block mb-1">Base Condition</span>
                <span className={`text-xl font-black font-mono ${player.weapon.condition && player.weapon.condition < 40 ? 'text-red-600' : 'text-[#8c6b0c]'}`}>
                   {Math.round(player.weapon.condition || 100)}%
                </span>
             </div>
          </div>
          
          <div className="text-[10px] text-[#664d36] mb-3 leading-relaxed border-l-2 border-[#bfae96] pl-2">
            Equipping a part temporarily modifies your weapon's stats based on the part's perks. However, its immediate condition directly impacts your gun's overall reliability. Scavenge high-grade parts to improve performance!
          </div>

          <div className="space-y-4">
             {renderSlot('barrel', 'Barrel Modular')}
             {renderSlot('cylinder', 'Cylinder & Loading')}
             {renderSlot('action', 'Firing Action')}
             {renderSlot('stock', 'Stock & Grip')}
          </div>
        </div>
      </div>
    </div>
  );
};
