import React from 'react';
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, Trash2, Hand, RefreshCw, LogOut, Check, DollarSign } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PlayerSpecialHandPanel } from "./PlayerSpecialHandPanel";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import type { GamePlayer } from "@/types/game";
import { Badge } from "@/components/ui/badge";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface PlayerGameCardProps {
  player: GamePlayer;
  onRebuyChange: (playerId: string, newRebuys: number) => Promise<void>;
  onSpecialHandsChange: (playerId: string, specialHands: {
    [key: string]: number;
  }) => Promise<void>;
  onCashOut?: (playerId: string, finalStack: number) => Promise<void>;
  onRemovePlayer?: (playerId: string) => void;
  isProcessing: boolean;
}

export function PlayerGameCard({
  player,
  onRebuyChange,
  onSpecialHandsChange,
  onCashOut,
  onRemovePlayer,
  isProcessing
}: PlayerGameCardProps) {
  const isMobile = useIsMobile();
  const totalAmount = player.initial_buyin + player.total_rebuys * player.initial_buyin;
  const specialHandsCount = player.special_hands ? Object.values(player.special_hands).reduce((sum, count) => sum + count, 0) : 0;
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [openSpecialHands, setOpenSpecialHands] = useState(false);
  const [openRebuyPanel, setOpenRebuyPanel] = useState(false);
  const [processingAction, setProcessingAction] = useState<string | null>(null);
  const [showCashOut, setShowCashOut] = useState(false);
  const [cashOutValue, setCashOutValue] = useState("");
  const [editingCashOut, setEditingCashOut] = useState(false);

  const isCashedOut = player.final_result !== null;
  const netResult = isCashedOut ? (player.final_result! - totalAmount) : 0;

  const handleQuickRebuy = async () => {
    if (isProcessing || processingAction) return;
    setProcessingAction('rebuy');
    try {
      await onRebuyChange(player.id, player.total_rebuys + 1);
      toast.success("Rebuy adicionado com sucesso!", {
        description: `${player.player.name} agora tem ${player.total_rebuys + 1} rebuys`,
        position: "top-center"
      });
    } finally {
      setProcessingAction(null);
    }
  };

  const handleSpecialHandsChange = async (specialHands: {
    [key: string]: number;
  }) => {
    if (isProcessing || processingAction) return;
    setProcessingAction('hands');
    try {
      await onSpecialHandsChange(player.id, specialHands);
      toast.success("Mãos especiais atualizadas!", {
        description: `Jogadas de ${player.player.name} foram registradas`,
        position: "top-center"
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
        position: "top-center"
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

  const handleCashOut = async () => {
    if (!onCashOut || isProcessing || processingAction) return;
    const value = parseFloat(cashOutValue);
    if (isNaN(value) || value < 0) {
      toast.error("Informe um valor válido para o stack final");
      return;
    }
    setProcessingAction('cashout');
    try {
      await onCashOut(player.id, value);
      toast.success(`${player.player.name} encerrou a mesa!`, {
        description: `Stack final: $${value}`,
        position: "top-center"
      });
      setShowCashOut(false);
      setEditingCashOut(false);
    } finally {
      setProcessingAction(null);
    }
  };

  const handleUpdateCashOut = async () => {
    if (!onCashOut || isProcessing || processingAction) return;
    const value = parseFloat(cashOutValue);
    if (isNaN(value) || value < 0) {
      toast.error("Informe um valor válido");
      return;
    }
    setProcessingAction('cashout-edit');
    try {
      await onCashOut(player.id, value);
      toast.success("Valor atualizado!", { position: "top-center" });
      setEditingCashOut(false);
    } finally {
      setProcessingAction(null);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(part => part[0]).join('').toUpperCase().substring(0, 2);
  };

  const ControlComponent = isMobile ? Drawer : Dialog;
  const TriggerComponent = isMobile ? DrawerTrigger : DialogTrigger;
  const ContentComponent = isMobile ? DrawerContent : DialogContent;

  const ConfirmDialog = () => <ControlComponent open={confirmRemove} onOpenChange={setConfirmRemove}>
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
    </ControlComponent>;

  const RebuyPanel = () => <ControlComponent open={openRebuyPanel} onOpenChange={setOpenRebuyPanel}>
      <TriggerComponent asChild>
        <Button variant="outline" size="sm" className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 hover:from-blue-500/20 hover:to-purple-500/20 border-blue-500/20">
          <Plus className="w-4 h-4 mr-1 text-blue-500" />
          Editar
        </Button>
      </TriggerComponent>
      <ContentComponent className="sm:max-w-[425px]">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">Rebuys de {player.player.name}</h2>
          <div className="grid grid-cols-4 gap-3 mb-6">
            {[0, 1, 2, 3, 4, 5, 6, 7].map(value => <Button key={value} onClick={() => handleSetRebuyValue(value)} variant={player.total_rebuys === value ? "default" : "outline"} className={player.total_rebuys === value ? "bg-blue-500 hover:bg-blue-600" : ""} disabled={processingAction === 'rebuy-set'}>
                {value}
              </Button>)}
          </div>
          <p className="text-sm text-muted-foreground">
            Valor total: ${totalAmount}
          </p>
        </div>
      </ContentComponent>
    </ControlComponent>;

  const SpecialHandsPanel = () => <Sheet open={openSpecialHands} onOpenChange={setOpenSpecialHands}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className={`relative bg-gradient-to-r ${specialHandsCount > 0 ? "from-amber-500/10 to-purple-500/10 hover:from-amber-500/20 hover:to-purple-500/20 border-amber-500/20" : "border-muted"}`}>
          <Hand className={`w-4 h-4 mr-1 ${specialHandsCount > 0 ? "text-amber-500" : ""}`} />
          {specialHandsCount > 0 ? `${specialHandsCount} mãos` : "Mãos"}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[80vh] rounded-t-[20px]">
        <PlayerSpecialHandPanel specialHands={player.special_hands || {}} onChange={handleSpecialHandsChange} playerName={player.player.name} />
      </SheetContent>
    </Sheet>;

  // Cash-out dialog
  const CashOutDialog = () => <ControlComponent open={showCashOut} onOpenChange={(open) => {
    setShowCashOut(open);
    if (!open) setCashOutValue("");
  }}>
      <ContentComponent className="sm:max-w-[425px]">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-2">Encerrar {player.player.name}</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Total investido: ${totalAmount} (buy-in + {player.total_rebuys} rebuys)
          </p>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Stack final ($)</label>
              <Input
                type="number"
                inputMode="numeric"
                value={cashOutValue}
                onChange={e => setCashOutValue(e.target.value)}
                placeholder="Valor do stack final"
                className="h-12 text-lg"
                autoFocus
              />
            </div>
            {cashOutValue && !isNaN(parseFloat(cashOutValue)) && (
              <div className={`p-3 rounded-lg ${parseFloat(cashOutValue) - totalAmount >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                <p className="text-sm text-muted-foreground">Resultado líquido</p>
                <p className={`text-xl font-bold ${parseFloat(cashOutValue) - totalAmount >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {parseFloat(cashOutValue) - totalAmount >= 0 ? '+' : ''}${parseFloat(cashOutValue) - totalAmount}
                </p>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setShowCashOut(false)}>Cancelar</Button>
            <Button 
              onClick={handleCashOut} 
              disabled={!cashOutValue || isNaN(parseFloat(cashOutValue)) || processingAction === 'cashout'}
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
            >
              {processingAction === 'cashout' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
              Confirmar
            </Button>
          </div>
        </div>
      </ContentComponent>
    </ControlComponent>;

  // If player is cashed out, show different card
  if (isCashedOut) {
    return <>
      <motion.div whileHover={{ y: -5 }} transition={{ type: "spring", stiffness: 300 }}>
        <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-zinc-900/40 to-zinc-900/10 backdrop-blur-md opacity-80">
          <div className="relative">
            <div className={`absolute top-0 left-0 right-0 h-1 ${netResult >= 0 ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gradient-to-r from-red-500 to-orange-500'}`} />
            
            <div className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <Avatar className="h-10 w-10 border-2 border-muted-foreground/30">
                  <AvatarFallback className="bg-muted text-muted-foreground">
                    {getInitials(player.player.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-bold">{player.player.name}</h3>
                  <Badge variant="outline" className="text-xs mt-1">
                    <LogOut className="w-3 h-3 mr-1" /> Encerrado
                  </Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-muted/30 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Investido</p>
                  <p className="text-lg font-bold">${totalAmount}</p>
                </div>
                <div className="bg-muted/30 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Stack Final</p>
                  {editingCashOut ? (
                    <Input
                      type="number"
                      inputMode="numeric"
                      value={cashOutValue}
                      onChange={e => setCashOutValue(e.target.value)}
                      className="h-8 text-sm w-full"
                      autoFocus
                    />
                  ) : (
                    <p className="text-lg font-bold">${player.final_result}</p>
                  )}
                </div>
                <div className={`p-3 rounded-lg ${netResult >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                  <p className="text-xs text-muted-foreground mb-1">Resultado</p>
                  <p className={`text-lg font-bold ${netResult >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {netResult >= 0 ? '+' : ''}${netResult}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                {editingCashOut ? (
                  <>
                    <Button variant="outline" size="sm" onClick={() => setEditingCashOut(false)}>Cancelar</Button>
                    <Button size="sm" onClick={handleUpdateCashOut} disabled={processingAction === 'cashout-edit'}
                      className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
                      {processingAction === 'cashout-edit' ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
                      Salvar
                    </Button>
                  </>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => {
                    setCashOutValue(String(player.final_result || 0));
                    setEditingCashOut(true);
                  }}>
                    <DollarSign className="h-4 w-4 mr-1" /> Editar valor
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
      <ConfirmDialog />
    </>;
  }

  return <>
      <motion.div whileHover={{
      y: -5
    }} transition={{
      type: "spring",
      stiffness: 300
    }}>
        <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-zinc-900/40 to-zinc-900/10 backdrop-blur-md">
          <div className="relative">
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
                  
                </div>
                {onRemovePlayer && <Button variant="ghost" size="icon" className="absolute top-3 right-3 text-muted-foreground hover:text-destructive" onClick={() => setConfirmRemove(true)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>}
              </div>
              
              <div className="grid grid-cols-2 gap-3 mb-4">
                <motion.div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 p-3 rounded-lg" key={`total-${totalAmount}`} initial={{
                scale: 1
              }} animate={{
                scale: [1, 1.05, 1]
              }} transition={{
                duration: 0.3,
                ease: "easeInOut"
              }}>
                  <p className="text-xs text-muted-foreground mb-1">Total</p>
                  <AnimatePresence mode="wait">
                    <motion.p key={totalAmount} initial={{
                    opacity: 0,
                    y: -5
                  }} animate={{
                    opacity: 1,
                    y: 0
                  }} exit={{
                    opacity: 0,
                    y: 5
                  }} transition={{
                    duration: 0.2
                  }} className="text-2xl font-bold text-blue-500">
                      ${totalAmount}
                    </motion.p>
                  </AnimatePresence>
                </motion.div>
                <motion.div className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 p-3 rounded-lg" key={`rebuys-${player.total_rebuys}`} initial={{
                scale: 1
              }} animate={{
                scale: [1, 1.05, 1]
              }} transition={{
                duration: 0.3,
                ease: "easeInOut"
              }}>
                  <p className="text-xs text-muted-foreground mb-1">Rebuys</p>
                  <AnimatePresence mode="wait">
                    <motion.p key={player.total_rebuys} initial={{
                    opacity: 0,
                    y: -5
                  }} animate={{
                    opacity: 1,
                    y: 0
                  }} exit={{
                    opacity: 0,
                    y: 5
                  }} transition={{
                    duration: 0.2
                  }} className="text-2xl font-bold text-purple-500">
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
                  {isProcessing || processingAction === 'rebuy' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                  Rebuy
                </Button>
                
                <RebuyPanel />
                <SpecialHandsPanel />

                {onCashOut && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setShowCashOut(true)}
                    className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 hover:from-green-500/20 hover:to-emerald-500/20 border-green-500/20"
                  >
                    <LogOut className="w-4 h-4 mr-1 text-green-500" />
                    Encerrar
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
      
      <ConfirmDialog />
      <CashOutDialog />
    </>;
}
