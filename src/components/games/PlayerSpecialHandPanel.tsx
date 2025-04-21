
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

type SpecialHandType = "full_house" | "four_of_a_kind" | "straight_flush" | "royal_flush";

interface SpecialHandOption {
  value: SpecialHandType;
  label: string;
  icon: React.ReactNode;
  color: string;
  description: string;
}

interface PlayerSpecialHandPanelProps {
  specialHands: { [key: string]: number };
  onChange: (specialHands: { [key: string]: number }) => void;
  playerName: string;
}

export function PlayerSpecialHandPanel({
  specialHands,
  onChange,
  playerName
}: PlayerSpecialHandPanelProps) {
  const [localHands, setLocalHands] = useState<{ [key: string]: number }>(specialHands || {});
  const totalHandsCount = Object.values(localHands).reduce((sum, count) => sum + count, 0);

  const specialHandOptions: SpecialHandOption[] = [
    {
      value: "full_house",
      label: "Full House",
      icon: "🏠",
      color: "from-yellow-500/20 to-yellow-600/10",
      description: "Três cartas de um valor e duas de outro"
    }, 
    {
      value: "four_of_a_kind",
      label: "Quadra",
      icon: "4️⃣",
      color: "from-pink-500/20 to-pink-600/10",
      description: "Quatro cartas do mesmo valor"
    }, 
    {
      value: "straight_flush",
      label: "Straight Flush",
      icon: "🔄",
      color: "from-blue-500/20 to-blue-600/10",
      description: "Cinco cartas sequenciais do mesmo naipe"
    }, 
    {
      value: "royal_flush",
      label: "Royal Flush",
      icon: "👑",
      color: "from-amber-500/20 to-amber-600/10",
      description: "A, K, Q, J, 10 do mesmo naipe"
    }
  ];

  const incrementHand = (handType: SpecialHandType) => {
    const newHands = { 
      ...localHands,
      [handType]: (localHands[handType] || 0) + 1
    };
    setLocalHands(newHands);
  };

  const decrementHand = (handType: SpecialHandType) => {
    if (!localHands[handType] || localHands[handType] <= 0) return;
    
    const newHands = { ...localHands };
    newHands[handType] = newHands[handType] - 1;
    
    if (newHands[handType] === 0) {
      delete newHands[handType];
    }
    
    setLocalHands(newHands);
  };

  const clearAllHands = () => {
    setLocalHands({});
  };

  const saveChanges = () => {
    onChange(localHands);
  };

  return (
    <div className="space-y-6 py-4">
      <div className="px-2">
        <h2 className="text-xl font-bold mb-1">Jogadas Especiais</h2>
        <p className="text-muted-foreground text-sm mb-6">
          Registre as mãos especiais de {playerName}
        </p>
      </div>
      
      <div className="space-y-4">
        {specialHandOptions.map((option) => {
          const handCount = localHands[option.value] || 0;
          
          return (
            <motion.div 
              key={option.value}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-gradient-to-r ${option.color} p-4 rounded-lg`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{option.icon}</div>
                  <div>
                    <h3 className="font-semibold">{option.label}</h3>
                    <p className="text-xs text-muted-foreground">{option.description}</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Button 
                    variant="outline"
                    size="icon"
                    onClick={() => decrementHand(option.value)}
                    disabled={!handCount}
                    className="h-8 w-8 rounded-full"
                  >
                    -
                  </Button>
                  
                  <span className="w-10 text-center font-bold text-lg">
                    {handCount}
                  </span>
                  
                  <Button 
                    variant="outline"
                    size="icon"
                    onClick={() => incrementHand(option.value)}
                    className="h-8 w-8 rounded-full"
                  >
                    +
                  </Button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
      
      <div className="border-t border-border pt-4 flex justify-between items-center px-2">
        <div>
          <p className="text-sm">Total de mãos: <span className="font-bold">{totalHandsCount}</span></p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={clearAllHands}
            disabled={totalHandsCount === 0}
          >
            Limpar
          </Button>
          
          <Button
            size="sm"
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
            onClick={saveChanges}
          >
            Salvar Alterações
          </Button>
        </div>
      </div>
    </div>
  );
}
