import React from 'react';

export interface PlayerAppearance {
  gender: "male" | "female";
  skinTone: string;
  hat: "none" | "cowboy" | "bowler" | "sombrero";
  shirtColor: "white" | "red" | "blue" | "black";
  hairStyle: "none" | "short" | "long";
  hairColor: "black" | "brown" | "blonde" | "gray";
  facialHair: "none" | "mustache" | "beard";
}

interface PlayerAvatarProps {
  appearance?: PlayerAppearance;
  className?: string;
}

export const PlayerAvatar: React.FC<PlayerAvatarProps> = ({ appearance, className = "" }) => {
  const app = appearance || {
    gender: "male",
    skinTone: "#fcdbb6",
    hat: "cowboy",
    shirtColor: "white",
    hairStyle: "short",
    hairColor: "brown",
    facialHair: "none"
  };

  const getShirtColorHex = (color: string) => {
    switch (color) {
      case 'red': return '#ef4444';
      case 'blue': return '#3b82f6';
      case 'black': return '#1f2937';
      default: return '#f3f4f6';
    }
  };

  const getHairColorHex = (color: string) => {
    switch (color) {
      case 'black': return '#111827';
      case 'brown': return '#78350f';
      case 'blonde': return '#fef08a';
      case 'gray': return '#9ca3af';
      default: return '#78350f';
    }
  };

  const hrColor = getHairColorHex(app.hairColor);
  const shColor = getShirtColorHex(app.shirtColor);

  return (
    <div className={`relative flex flex-col items-center justify-end overflow-hidden ${className}`}>
      {/* Background */}
      <div className="absolute inset-0 bg-[#dcd1b9]" />
      
      {/* Container to handle scaling */}
      <div className="relative w-full h-[120%] flex flex-col items-center justify-end translate-y-2">
        {/* Hair Back (Long) */}
        {app.hairStyle === 'long' && (
          <div className="absolute top-[25%] absolute w-[60%] h-[50%] rounded-b-full bg-current shadow-lg" style={{ backgroundColor: hrColor }} />
        )}
        
        {/* Shoulders / Shirt */}
        <div className="w-[85%] h-[40%] rounded-t-xl bg-current border border-black/20 z-10" style={{ backgroundColor: shColor }}>
          {/* Collar/Neck hole */}
          <div className="mx-auto w-[40%] h-[30%] bg-current rounded-b-full border-b border-black/20" style={{ backgroundColor: app.skinTone }} />
        </div>

        {/* Head */}
        <div className="absolute top-[28%] w-[55%] h-[45%] rounded-t-[45%] rounded-b-[40%] bg-current z-20 border border-black/10 shadow-sm flex flex-col items-center" style={{ backgroundColor: app.skinTone }}>
          
          {/* Eyes */}
          <div className="w-full flex justify-center gap-[20%] mt-[35%]">
            <div className="w-[12%] h-[15%] bg-stone-800 rounded-full" />
            <div className="w-[12%] h-[15%] bg-stone-800 rounded-full" />
          </div>

          {/* Hair Front (Short/Long) */}
          {app.hairStyle !== 'none' && (
            <div className="absolute top-[-5%] w-[110%] h-[35%] bg-current rounded-t-full" style={{ backgroundColor: hrColor }} />
          )}

          {/* Facial Hair */}
          {app.gender === 'male' && app.facialHair === 'mustache' && (
             <div className="absolute top-[60%] w-[45%] h-[15%] bg-current rounded-full" style={{ backgroundColor: hrColor }} />
          )}
          {app.gender === 'male' && app.facialHair === 'beard' && (
             <div className="absolute bottom-[-10%] w-[110%] h-[45%] bg-current rounded-b-full" style={{ backgroundColor: hrColor }} />
          )}

        </div>

        {/* Hats */}
        {app.hat === 'cowboy' && (
          <div className="absolute top-[18%] w-[95%] h-[18%] bg-stone-700 z-30 rounded-full border border-stone-800 shadow-md flex justify-center">
            <div className="w-[60%] h-[150%] bg-stone-700 rounded-t-xl border border-stone-800 absolute bottom-[50%]" />
          </div>
        )}
        
        {app.hat === 'bowler' && (
          <div className="absolute top-[20%] w-[70%] h-[12%] bg-stone-900 z-30 rounded-full border border-black shadow-md flex justify-center">
            <div className="w-[70%] h-[180%] bg-stone-900 rounded-t-full border border-black absolute bottom-[50%]" />
          </div>
        )}

        {app.hat === 'sombrero' && (
          <div className="absolute top-[12%] w-[120%] h-[20%] bg-amber-700 z-30 rounded-full border border-amber-900 shadow-md flex justify-center">
            <div className="w-[45%] h-[150%] bg-amber-700 rounded-t-full border border-amber-900 absolute bottom-[60%]" />
          </div>
        )}

      </div>
    </div>
  );
};
