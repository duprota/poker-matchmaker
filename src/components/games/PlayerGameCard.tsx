import React from 'react';
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, LogOut, DollarSign } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import type { GamePlayer } from "@/types/game";
import { Badge } from "@/components/ui/badge";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { CashOutDialog } from "./CashOutDialog";

interface PlayerGameCardProps {
  player: GamePlayer;
  onRebuyChange: (playerId: string, newRebuys: number) => Promise<void>;
  onCashOut?: (playerId: string, finalStack: number) => Promise<void>;
  onRemovePlayer?: (playerId: string) => void;
  isProcessing: boolean;
}

export function PlayerGameCard({
  player,
  onRebuyChange,
  onCashOut,
  onRemovePlayer,
  isProcessing
}: PlayerGameCardProps) {
  const isMobile = useIsMobile();
  // Optimistic rebuys: increment instantly on click, sync to DB in background
  const [optimisticRebuys, setOptimisticRebuys] = useState<number | null>(null);
  const rebuys = optimisticRebuys ?? player.total_rebuys;
  const totalAmount = player.initial_buyin + rebuys * player.initial_buyin;
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [openRebuyPanel, setOpenRebuyPanel] = useState(false);
  const [processingAction, setProcessingAction] = useState<string | null>(null);
  const [showCashOut, setShowCashOut] = useState(false);
  const [cashOutValue, setCashOutValue] = useState("");
  const [editingCashOut, setEditingCashOut] = useState(false);
  const [cashOutError, setCashOutError] = useState<string | null>(null);

  const isCashedOut = player.final_result !== null;
  const netResult = (player.final_result ?? 0) - totalAmount;

  // Clear optimistic value once the server value catches up
  useEffect(() => {
    if (optimisticRebuys !== null && player.total_rebuys >= optimisticRebuys) {
      setOptimisticRebuys(null);
    }
  }, [player.total_rebuys, optimisticRebuys]);

  const handleQuickRebuy = () => {
    const newValue = rebuys + 1;
    setOptimisticRebuys(newValue);
    // Fire-and-forget: user can fix mistakes later via the edit panel
    onRebuyChange(player.id, newValue).catch(() => {
      setOptimisticRebuys(null);
      toast.error("Erro ao registrar rebuy — tente novamente", { position: "top-center" });
    });
  };

  const handleSetRebuyValue = (value: number) => {
    setOptimisticRebuys(value);
    setOpenRebuyPanel(false);
    onRebuyChange(player.id, value).catch(() => {
      setOptimisticRebuys(null);
      toast.error("Erro ao atualizar rebuys — tente novamente", { position: "top-center" });
    });
  };

  const handleRemovePlayer = () => {
    if (onRemovePlayer) {
      onRemovePlayer(player.id);
    }
    setConfirmRemove(false);
  };

  const openCashOut = (editing: boolean) => {
    setEditingCashOut(editing);
    setCashOutError(null);
    setCashOutValue(editing ? String(player.final_result ?? 0) : "");
    setShowCashOut(true);
  };

  const handleCashOut = async () => {
    if (!onCashOut || isProcessing || processingAction) return;
    const value = Number(cashOutValue);
    if (cashOutValue.trim() === "" || !Number.isFinite(value) || value < 0) return;
    setCashOutError(null);
    setProcessingAction('cashout');
    try {
      await onCashOut(player.id, value);
      setShowCashOut(false);
      setEditingCashOut(false);
      setCashOutValue("");
    } catch (error) {
      console.error("Error cashing out:", error);
      setCashOutError("Não foi possível salvar. O valor foi mantido; tente novamente.");
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
            {[0, 1, 2, 3, 4, 5, 6, 7].map(value => <Button key={value} onClick={() => handleSetRebuyValue(value)} variant={rebuys === value ? "default" : "outline"} className={rebuys === value ? "bg-blue-500 hover:bg-blue-600" : ""}>
                {value}
              </Button>)}
          </div>
          <p className="text-sm text-muted-foreground">
            Valor total: ${totalAmount}
          </p>
        </div>
      </ContentComponent>
    </ControlComponent>;


  const cashOutDialog = <CashOutDialog
    open={showCashOut}
    onOpenChange={open => {
      if (processingAction === "cashout" || isProcessing) return;
      setShowCashOut(open);
      if (!open) { setCashOutValue(""); setCashOutError(null); }
    }}
    mobile={isMobile}
    name={player.player.name}
    avatarUrl={player.player.avatar_url}
    editing={editingCashOut}
    error={cashOutError}
    invested={totalAmount}
    rebuys={rebuys}
    value={cashOutValue}
    onValueChange={value => { setCashOutValue(value); setCashOutError(null); }}
    onConfirm={handleCashOut}
    saving={processingAction === "cashout" || isProcessing}
  />;

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
                  {isProcessing && <span role="status" className="text-xs text-muted-foreground ml-2">Salvando…</span>}
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-muted/30 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Investido</p>
                  <p className="text-lg font-bold">${totalAmount}</p>
                </div>
                <div className="bg-muted/30 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Stack Final</p>
                  <p className="text-lg font-bold">${player.final_result}</p>
                </div>
                <div className={`p-3 rounded-lg ${netResult >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                  <p className="text-xs text-muted-foreground mb-1">Resultado</p>
                  <p className={`text-lg font-bold ${netResult >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {netResult >= 0 ? '+' : ''}${netResult}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={isProcessing} onClick={() => openCashOut(true)}>
                  <DollarSign className="h-4 w-4 mr-1" /> Editar valor
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
      <ConfirmDialog />
      {cashOutDialog}
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
                <motion.div className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 p-3 rounded-lg" key={`rebuys-${rebuys}`} initial={{
                scale: 1
              }} animate={{
                scale: [1, 1.05, 1]
              }} transition={{
                duration: 0.3,
                ease: "easeInOut"
              }}>
                  <p className="text-xs text-muted-foreground mb-1">Rebuys</p>
                  <AnimatePresence mode="wait">
                    <motion.p key={rebuys} initial={{
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
                      {rebuys}
                    </motion.p>
                  </AnimatePresence>
                </motion.div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={handleQuickRebuy}
                  disabled={isProcessing}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white border-0"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Rebuy
                </Button>
                
                <RebuyPanel />
                

                {onCashOut && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={isProcessing}
                    onClick={() => openCashOut(false)}
                    className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 hover:from-green-500/20 hover:to-emerald-500/20 border-green-500/20"
                  >
                    <LogOut className="w-4 h-4 mr-1 text-green-500" />
                    Registrar saída
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
      
      <ConfirmDialog />
      {cashOutDialog}
    </>;
}
