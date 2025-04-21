
import { Button } from "@/components/ui/button";
import { ArrowLeft, Check } from "lucide-react";

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
    <div className="fixed bottom-6 left-0 right-0 z-50">
      <div className="container mx-auto flex justify-between gap-4 px-4">
        <Button 
          onClick={() => window.history.back()}
          variant="outline"
          className="shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        
        <div>
          {status === "created" && (
            <Button 
              onClick={onStartGame}
              className="bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Check className="w-4 h-4 mr-2" />
              Iniciar Jogo
            </Button>
          )}
          {status === "ongoing" && (
            <Button 
              onClick={onShowFinalizeForm}
              className="bg-primary hover:bg-primary/90 text-white shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Check className="w-4 h-4 mr-2" />
              Finalizar Jogo
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
