
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface PlayerAvatarProps {
  playerName: string;
}

export const PlayerAvatar = ({ playerName }: PlayerAvatarProps) => {
  const getInitials = (name: string) => {
    return name.split(' ').map(part => part[0]).join('').toUpperCase().substring(0, 2);
  };

  return (
    <Avatar className="h-10 w-10 border-2 border-blue-500/50">
      <AvatarFallback className="bg-blue-500/10 text-blue-500">
        {getInitials(playerName)}
      </AvatarFallback>
    </Avatar>
  );
};
