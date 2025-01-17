import { Button } from "@/components/ui/button";

interface GameHeaderProps {
  status: string;
  onFinalize: () => void;
  finalizing: boolean;
}

export const GameHeader = ({ status, onFinalize, finalizing }: GameHeaderProps) => {
  return (
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-3xl font-bold text-white">Game Details</h1>
      {status === "ongoing" && (
        <Button 
          onClick={onFinalize} 
          disabled={finalizing}
          variant="destructive"
        >
          {finalizing ? "Finalizing..." : "Finalize Game"}
        </Button>
      )}
    </div>
  );
};