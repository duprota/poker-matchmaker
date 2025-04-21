import { useState } from "react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import { SpecialHandIcon, SpecialHandType } from "@/components/shared/SpecialHandIcon";

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const totalHandsCount = Object.values(localHands).reduce((sum, count) => sum + count, 0);
  const hasChanges = JSON.stringify(localHands) !== JSON.stringify(specialHands);

  const specialHandOptions: { value: SpecialHandType }[] = [
    { value: "full_house" },
    { value: "four_of_a_kind" },
    { value: "straight_flush" },
    { value: "royal_flush" }
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

  const saveChanges = async () => {
    setIsSubmitting(true);
    try {
      await onChange(localHands);
    } finally {
      setIsSubmitting(false);
    }
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div className="space-y-6 py-4">
      <div className="px-2">
        <h2 className="text-xl font-bold mb-1">Jogadas Especiais</h2>
        <p className="text-muted-foreground text-sm mb-6">
          Registre as mãos especiais de {playerName}
        </p>
      </div>
      
      <motion.div 
        className="space-y-4"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {specialHandOptions.map((option) => {
          const handCount = localHands[option.value] || 0;
          const originalCount = specialHands[option.value] || 0;
          const hasChanged = handCount !== originalCount;
          
          return (
            <motion.div 
              key={option.value}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-lg ${
                hasChanged ? "ring-2 ring-blue-500/40" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <SpecialHandIcon 
                  type={option.value} 
                  showLabel 
                  showDescription
                />
                
                <div className="flex items-center">
                  <Button 
                    variant="outline"
                    size="icon"
                    onClick={() => decrementHand(option.value)}
                    disabled={!handCount || isSubmitting}
                    className="h-8 w-8 rounded-full"
                  >
                    -
                  </Button>
                  
                  <AnimatePresence mode="wait">
                    <motion.span 
                      key={handCount}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="w-10 text-center font-bold text-lg"
                    >
                      {handCount}
                    </motion.span>
                  </AnimatePresence>
                  
                  <Button 
                    variant="outline"
                    size="icon"
                    onClick={() => incrementHand(option.value)}
                    disabled={isSubmitting}
                    className="h-8 w-8 rounded-full"
                  >
                    +
                  </Button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
      
      <div className="border-t border-border pt-4 flex justify-between items-center px-2">
        <div>
          <p className="text-sm">Total de mãos: <span className="font-bold">{totalHandsCount}</span></p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={clearAllHands}
            disabled={totalHandsCount === 0 || isSubmitting}
          >
            Limpar
          </Button>
          
          <Button
            size="sm"
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
            onClick={saveChanges}
            disabled={!hasChanges || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              "Salvar Alterações"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
