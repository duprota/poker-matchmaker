
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, Trash2, Hand, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PlayerSpecialHandPanel } from "./PlayerSpecialHandPanel";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import type { GamePlayer } from "@/types/game";
import { Badge } from "@/components/ui/badge";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";

interface PlayerGameCardProps {
  player: GamePlayer;
  onRebuyChange: (playerId: string, newRebuys: number) => Promise<void>;
  onSpecialHandsChange: (playerId: string, specialHands: { [key: string]: number }) => Promise<void>;
  onRemovePlayer?: (playerId: string) => void;
  isProcessing: boolean;
}

export function PlayerGameCard({
  player,
  onRebuyChange,
  onSpecialHandsChange,
  onRemovePlayer,
  isProcessing
}: PlayerGameCardProps) {
  const isMobile = useIsMobile();
  const totalAmount = player.initial_buyin + (player.total_rebuys * player.initial_buyin);
  const specialHandsCount = player.special_hands ? 
    Object.values(player.special_hands).reduce((sum, count) => sum + count, 0) : 0;
  
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [openSpecialHands, setOpenSpecialHands] = useState(false);
  const [openRebuyPanel, setOpenRebuyPanel] = useState(false);
  const [processingAction, setProcessingAction] = useState<string | null>(null);

  const handleQuickRebuy = async () => {
    if (isProcessing || processingAction) return;
    
    setProcessingAction('rebuy');
    try {
      await onRebuyChange(player.id, player.total_rebuys + 1);
      toast.success("Rebuy adicionado com sucesso!", {
        description: `${player.player.name} agora tem ${player.total_rebuys + 1} rebuys`,
        position: "top-center",
      });
    } finally {
      setProcessingAction(null);
    }
  };

  const handleSpecialHandsChange = async (specialHands: { [key: string]: number }) => {
    if (isProcessing || processingAction) return;
    
    setProcessingAction('hands');
    try {
      await onSpecialHandsChange(player.id, specialHands);
      toast.success("Mãos especiais atualizadas!", {
        description: `Jogadas de ${player.player.name} foram registradas`,
        position: "top-center",
      });
      setOpenSpecialHands(false);
    } finally {
      setProcessingAction(null);
    }
  };

  const handleSetRebuyValue = async (value: number) => {
    if (isProcessing || processingAction) return;
    
    setProcessingAction('rebuy-set');
    try {
      await onRebuyChange(player.id, value);
      toast.success("Rebuys atualizados!", {
        description: `${player.player.name} agora tem ${value} rebuys`,
        position: "top-center",
      });
      setOpenRebuyPanel(false);
    } finally {
      setProcessingAction(null);
    }
  };

  const handleRemovePlayer = () => {
    if (onRemovePlayer) {
      onRemovePlayer(player.id);
    }
    setConfirmRemove(false);
  };

  // Get player initials for avatar
  const getInitials = (name: string) => {
    return name.split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const ControlComponent = isMobile ? Drawer : Dialog;
  const TriggerComponent = isMobile ? DrawerTrigger : DialogTrigger;
  const ContentComponent = isMobile ? DrawerContent : DialogContent;

  const ConfirmDialog = () => (
    <ControlComponent open={confirmRemove} onOpenChange={setConfirmRemove}>
      <ContentComponent className="sm:max-w-[425px]">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">Confirmar remoção</h2>
          <p className="mb-6">
            Tem certeza que deseja remover <span className="font-semibold">{player.player.name}</span> da mesa?
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirmRemove(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleRemovePlayer}>
              Remover
            </Button>
          </div>
        </div>
      </ContentComponent>
    </ControlComponent>
  );

  const RebuyPanel = () => (
    <ControlComponent open={openRebuyPanel} onOpenChange={setOpenRebuyPanel}>
      <TriggerComponent asChild>
        <Button
          variant="outline" 
          size="sm"
          className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 hover:from-blue-500/20 hover:to-purple-500/20 border-blue-500/20"
        >
          <Plus className="w-4 h-4 mr-1 text-blue-500" />
          Editar
        </Button>
      </TriggerComponent>
      <ContentComponent className="sm:max-w-[425px]">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">Rebuys de {player.player.name}</h2>
          <div className="grid grid-cols-4 gap-3 mb-6">
            {[0, 1, 2, 3, 4, 5, 6, 7].map((value) => (
              <Button
                key={value}
                onClick={() => handleSetRebuyValue(value)}
                variant={player.total_rebuys === value ? "default" : "outline"}
                className={player.total_rebuys === value ? "bg-blue-500 hover:bg-blue-600" : ""}
                disabled={processingAction === 'rebuy-set'}
              >
                {value}
              </Button>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            Valor total: ${totalAmount}
          </p>
        </div>
      </ContentComponent>
    </ControlComponent>
  );

  const SpecialHandsPanel = () => (
    <Sheet open={openSpecialHands} onOpenChange={setOpenSpecialHands}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`relative bg-gradient-to-r ${
            specialHandsCount > 0 
              ? "from-amber-500/10 to-purple-500/10 hover:from-amber-500/20 hover:to-purple-500/20 border-amber-500/20" 
              : "border-muted"
          }`}
        >
          <Hand className={`w-4 h-4 mr-1 ${specialHandsCount > 0 ? "text-amber-500" : ""}`} />
          {specialHandsCount > 0 ? `${specialHandsCount} mãos` : "Mãos"}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[80vh] rounded-t-[20px]">
        <PlayerSpecialHandPanel
          specialHands={player.special_hands || {}}
          onChange={handleSpecialHandsChange}
          playerName={player.player.name}
        />
      </SheetContent>
    </Sheet>
  );

  return (
    <>
      <motion.div
        whileHover={{ y: -5 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-zinc-900/40 to-zinc-900/10 backdrop-blur-md">
          <div className="relative">
            {/* Top gradient accent */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500" />
            
            <div className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <Avatar className="h-10 w-10 border-2 border-blue-500/50">
                  <AvatarFallback className="bg-blue-500/10 text-blue-500">
                    {getInitials(player.player.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-bold">{player.player.name}</h3>
                  <Badge variant="outline" className="text-xs font-normal opacity-70">
                    ID: {player.id.substring(0, 8)}...
                  </Badge>
                </div>
                {onRemovePlayer && (
                  <Button
                    variant="ghost" 
                    size="icon"
                    className="absolute top-3 right-3 text-muted-foreground hover:text-destructive"
                    onClick={() => setConfirmRemove(true)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-3 mb-4">
                <motion.div 
                  className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 p-3 rounded-lg"
                  key={`total-${totalAmount}`}
                  initial={{ scale: 1 }}
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  <p className="text-xs text-muted-foreground mb-1">Total</p>
                  <AnimatePresence mode="wait">
                    <motion.p 
                      key={totalAmount}
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      transition={{ duration: 0.2 }}
                      className="text-2xl font-bold text-blue-500"
                    >
                      ${totalAmount}
                    </motion.p>
                  </AnimatePresence>
                </motion.div>
                <motion.div 
                  className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 p-3 rounded-lg"
                  key={`rebuys-${player.total_rebuys}`}
                  initial={{ scale: 1 }}
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  <p className="text-xs text-muted-foreground mb-1">Rebuys</p>
                  <AnimatePresence mode="wait">
                    <motion.p 
                      key={player.total_rebuys}
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      transition={{ duration: 0.2 }}
                      className="text-2xl font-bold text-purple-500"
                    >
                      {player.total_rebuys}
                    </motion.p>
                  </AnimatePresence>
                </motion.div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={handleQuickRebuy}
                  disabled={isProcessing || processingAction !== null}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white border-0"
                >
                  {isProcessing || processingAction === 'rebuy' ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  Rebuy Rápido
                </Button>
                
                <RebuyPanel />
                <SpecialHandsPanel />
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
      
      <ConfirmDialog />
    </>
  );
}
