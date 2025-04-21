
import { useState } from "react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Hand } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";

type SpecialHandType = "full_house" | "four_of_a_kind" | "straight_flush" | "royal_flush";

interface SpecialHandCount {
  [key: string]: number;
}

const specialHandOptions: {
  value: SpecialHandType;
  label: string;
  icon: React.ReactNode;
}[] = [
  {
    value: "full_house",
    label: "Full House",
    icon: (
      <span className="text-yellow-600">
        <svg width="20" height="20" aria-hidden="true" focusable="false">
          <use href="#full-house"></use>
        </svg>
      </span>
    ),
  },
  {
    value: "four_of_a_kind",
    label: "Four of a Kind",
    icon: (
      <span className="text-pink-700">
        <svg width="20" height="20" aria-hidden="true" focusable="false">
          <use href="#four-of-a-kind"></use>
        </svg>
      </span>
    ),
  },
  {
    value: "straight_flush",
    label: "Straight Flush",
    icon: (
      <span className="text-blue-700">
        <svg width="20" height="20" aria-hidden="true" focusable="false">
          <use href="#straight-flush"></use>
        </svg>
      </span>
    ),
  },
  {
    value: "royal_flush",
    label: "Royal Flush",
    icon: <span className="text-amber-700">👑</span>,
  },
];

export interface PlayerSpecialHandReactionProps {
  value: SpecialHandCount;
  onChange: (v: SpecialHandCount) => void;
}

export function PlayerSpecialHandReaction({ value = {}, onChange }: PlayerSpecialHandReactionProps) {
  const [open, setOpen] = useState(false);
  
  // Ensure value is never null - if it is, use empty object
  const safeValue = value || {};
  
  // Calculate total hands count
  const totalHandsCount = Object.values(safeValue).reduce((sum, count) => sum + count, 0);
  
  // Function to increment a hand count
  const incrementHand = (handType: SpecialHandType) => {
    const currentCount = safeValue[handType] || 0;
    const newValue = { ...safeValue, [handType]: currentCount + 1 };
    onChange(newValue);
  };
  
  // Function to decrement a hand count
  const decrementHand = (handType: SpecialHandType) => {
    const currentCount = safeValue[handType] || 0;
    if (currentCount <= 0) return;
    
    const newValue = { ...safeValue };
    newValue[handType] = currentCount - 1;
    
    // Remove the key if count becomes 0
    if (newValue[handType] === 0) {
      delete newValue[handType];
    }
    
    onChange(newValue);
  };
  
  // Function to clear all hand counts
  const clearAllHands = () => {
    onChange({});
    setOpen(false);
  };

  return (
    <>
      <EmojiSVGDefs />
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button 
                  size="icon" 
                  variant={totalHandsCount > 0 ? "outline" : "ghost"} 
                  className="relative"
                  aria-label="Registrar jogadas especiais"
                >
                  {totalHandsCount > 0 ? (
                    <div className="flex items-center justify-center">
                      <Hand size={18} className="text-primary" aria-hidden="true" />
                      <Badge variant="secondary" className="absolute -top-2 -right-2 h-5 min-w-5 flex items-center justify-center text-xs px-1">
                        {totalHandsCount}
                      </Badge>
                    </div>
                  ) : (
                    <span className="text-slate-500">
                      <Hand size={20} aria-hidden="true" />
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              
              <PopoverContent className="w-auto flex flex-col gap-3 px-3 py-3">
                <div className="flex flex-col gap-4">
                  <div className="text-sm font-medium">Jogadas Especiais</div>
                  
                  {/* Hand options with counters */}
                  <div className="grid grid-cols-2 gap-3">
                    {specialHandOptions.map((option) => {
                      // Safely access the hand count, default to 0 if undefined
                      const handCount = safeValue[option.value] || 0;
                      
                      return (
                        <div 
                          key={option.value}
                          className="flex items-center justify-between bg-muted/30 rounded-md p-2"
                        >
                          <div className="flex items-center gap-2">
                            <div className="flex-shrink-0">{option.icon}</div>
                            <div className="text-xs font-medium">{option.label}</div>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6 text-xs rounded-full"
                              onClick={() => decrementHand(option.value)}
                              disabled={handCount === 0}
                              aria-label={`Diminuir ${option.label}`}
                            >
                              -
                            </Button>
                            
                            <span className="w-4 text-center text-xs">
                              {handCount}
                            </span>
                            
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6 text-xs rounded-full"
                              onClick={() => incrementHand(option.value)}
                              aria-label={`Aumentar ${option.label}`}
                            >
                              +
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                {/* Total count and clear button */}
                <div className="flex items-center justify-between border-t pt-2 mt-1">
                  <div className="text-sm">
                    Total: <span className="font-bold">{totalHandsCount}</span>
                  </div>
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs text-muted-foreground hover:text-destructive"
                    onClick={clearAllHands}
                    disabled={totalHandsCount === 0}
                    aria-label="Limpar todas as jogadas"
                  >
                    Limpar
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {totalHandsCount > 0 ? `${totalHandsCount} jogadas especiais` : "Registrar jogadas especiais"}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </>
  );
}

// SVG Sprites (normally imported as SVGs, but here inline for simplicity)
export const EmojiSVGDefs = () => (
  <svg style={{ display: "none" }} aria-hidden="true" focusable="false">
    <symbol id="full-house" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" fill="#facc15" />
      <text x="12" y="16" textAnchor="middle" fontSize="12" fill="#fff">
        FH
      </text>
    </symbol>
    <symbol id="four-of-a-kind" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" fill="#ec4899" />
      <text x="12" y="16" textAnchor="middle" fontSize="12" fill="#fff">
        4K
      </text>
    </symbol>
    <symbol id="straight-flush" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" fill="#3b82f6" />
      <text x="12" y="16" textAnchor="middle" fontSize="12" fill="#fff">
        SF
      </text>
    </symbol>
    <symbol id="hand" viewBox="0 0 24 24">
      <rect x="6" y="7" width="12" height="10" rx="4" fill="#666" />
    </symbol>
  </svg>
);
