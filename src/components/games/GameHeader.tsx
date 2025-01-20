import { ArrowLeft, Trash2 } from "lucide-react";
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

interface GameHeaderProps {
  status: string;
  onDeleteGame?: () => void;
}

export const GameHeader = ({ status, onDeleteGame }: GameHeaderProps) => {
  const isMobile = useIsMobile();

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-4">
        <Link to="/games">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Game Details</h1>
          <p className="text-sm text-muted-foreground">
            Status: {status.charAt(0).toUpperCase() + status.slice(1)}
          </p>
        </div>
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
  );
};