import { useIsMobile } from "@/hooks/use-mobile";

interface GameHeaderProps {
  status: string;
}

export const GameHeader = ({ status }: GameHeaderProps) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-white">Game Details</h1>
    </div>
  );
};