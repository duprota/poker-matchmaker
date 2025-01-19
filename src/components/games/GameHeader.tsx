import { Button } from "@/components/ui/button";
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
import { useIsMobile } from "@/hooks/use-mobile";

interface GameHeaderProps {
  status: string;
  onFinalize: () => void;
  onDelete: () => void;
  finalizing: boolean;
}

export const GameHeader = ({ status, onFinalize, onDelete, finalizing }: GameHeaderProps) => {
  const isMobile = useIsMobile();

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-white">Game Details</h1>
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full sm:w-auto">
        {status === "ongoing" && (
          <Button 
            onClick={onFinalize} 
            disabled={finalizing}
            variant="destructive"
            className="w-full sm:w-auto"
          >
            {finalizing ? "Finalizing..." : "Finalize Game"}
          </Button>
        )}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button 
              variant="outline"
              className="w-full sm:w-auto text-muted-foreground hover:text-destructive transition-colors"
            >
              Delete Game
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
                onClick={onDelete}
                className={isMobile ? "w-full" : ""}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};