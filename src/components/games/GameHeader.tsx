import { ArrowLeft, Trash2, Pencil, X, Check } from "lucide-react";
import { Link } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface GameHeaderProps {
  status: string;
  name?: string;
  gameId: string;
  onDeleteGame?: () => void;
  onNameUpdated?: () => void;
}

export const GameHeader = ({ status, name, gameId, onDeleteGame, onNameUpdated }: GameHeaderProps) => {
  const isMobile = useIsMobile();
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(name || "");
  const canEdit = status !== "completed";

  const handleUpdateName = async () => {
    if (!newName.trim()) {
      toast.error("Game name cannot be empty");
      return;
    }

    try {
      const { error } = await supabase
        .from("games")
        .update({ name: newName.trim() })
        .eq("id", gameId);

      if (error) throw error;

      toast.success("Game name updated successfully");
      setIsEditing(false);
      if (onNameUpdated) onNameUpdated();
    } catch (error) {
      console.error("Error updating game name:", error);
      toast.error("Failed to update game name");
    }
  };

  return (
    <div className="mb-8">
      <div className="flex items-center gap-4 mb-2">
        <Link to="/games">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Game Details</h1>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Enter game name"
                className="w-[200px] text-xl font-semibold"
                autoFocus
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={handleUpdateName}
                className="text-green-500 hover:text-green-600"
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setIsEditing(false);
                  setNewName(name || "");
                }}
                className="text-red-500 hover:text-red-600"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold">
                {name || "Unnamed Game"}
              </h2>
              {canEdit && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsEditing(true)}
                  className="text-muted-foreground hover:text-primary"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
          <span className="text-sm text-muted-foreground">
            Status: {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        </div>
        
        {onDeleteGame && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                className="text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className={isMobile ? "w-[95vw]" : ""}>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure you want to delete this game?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the game and all associated data.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className={isMobile ? "flex-col gap-2" : ""}>
                <AlertDialogCancel className={isMobile ? "w-full" : ""}>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={onDeleteGame}
                  className={isMobile ? "w-full" : ""}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </div>
  );
};
