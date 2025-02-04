import { Button } from "@/components/ui/button";
import { PlayIcon } from "lucide-react";

interface GameActionsProps {
  status: string;
  onStartGame: () => void;
  onShowFinalizeForm: () => void;
}

export const GameActions = ({ 
  status, 
  onStartGame, 
  onShowFinalizeForm 
}: GameActionsProps) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-sm border-t border-border">
      <div className="container mx-auto flex justify-end gap-4">
        {status === "created" && (
          <Button 
            onClick={onStartGame}
            className="w-full sm:w-auto bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <PlayIcon className="w-4 h-4 mr-2" />
            Start Game
          </Button>
        )}
        {status === "ongoing" && (
          <Button 
            onClick={onShowFinalizeForm} 
            className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white shadow-lg hover:shadow-xl transition-all duration-200"
          >
            Finalize Game
          </Button>
        )}
      </div>
    </div>
  );
};