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

interface GameHeaderProps {
  status: string;
  onFinalize: () => void;
  onDelete: () => void;
  finalizing: boolean;
}

export const GameHeader = ({ status, onFinalize, onDelete, finalizing }: GameHeaderProps) => {
  return (
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-3xl font-bold text-white">Game Details</h1>
      <div className="flex gap-4">
        {status === "ongoing" && (
          <Button 
            onClick={onFinalize} 
            disabled={finalizing}
            variant="destructive"
          >
            {finalizing ? "Finalizing..." : "Finalize Game"}
          </Button>
        )}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">Delete Game</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure you want to delete this game?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the game and all associated data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};