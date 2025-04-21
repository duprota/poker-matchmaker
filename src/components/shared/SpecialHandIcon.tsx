
import React from 'react';

export type SpecialHandType = "full_house" | "four_of_a_kind" | "straight_flush" | "royal_flush";

const handIcons: Record<SpecialHandType, { icon: string; label: string; description: string }> = {
  "full_house": {
    icon: "🏠",
    label: "Full House",
    description: "Três cartas de um valor e duas de outro"
  },
  "four_of_a_kind": {
    icon: "4️⃣",
    label: "Quadra",
    description: "Quatro cartas do mesmo valor"
  },
  "straight_flush": {
    icon: "🔄",
    label: "Straight Flush",
    description: "Cinco cartas sequenciais do mesmo naipe"
  },
  "royal_flush": {
    icon: "👑",
    label: "Royal Flush",
    description: "A, K, Q, J, 10 do mesmo naipe"
  }
};

interface SpecialHandIconProps {
  type: SpecialHandType;
  showLabel?: boolean;
  showDescription?: boolean;
  size?: "sm" | "md" | "lg";
}

export const SpecialHandIcon = ({ 
  type, 
  showLabel = false, 
  showDescription = false,
  size = "md" 
}: SpecialHandIconProps) => {
  const handInfo = handIcons[type];
  
  const sizeClasses = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-3xl"
  };

  return (
    <div className="flex items-center gap-2">
      <span className={sizeClasses[size]}>{handInfo.icon}</span>
      {(showLabel || showDescription) && (
        <div className="flex flex-col">
          {showLabel && (
            <span className="font-medium">{handInfo.label}</span>
          )}
          {showDescription && (
            <span className="text-sm text-muted-foreground">{handInfo.description}</span>
          )}
        </div>
      )}
    </div>
  );
};

export const getSpecialHandInfo = (type: SpecialHandType) => handIcons[type];
