
import { GamePlayer } from "@/types/game";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Crown, Heart, Diamond, Club, Spade } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SpecialHandsSummaryProps {
  players: GamePlayer[];
}

export const SpecialHandsSummary = ({ players }: SpecialHandsSummaryProps) => {
  const playersWithSpecialHands = players.filter(
    (player) => player.special_hands && Object.keys(player.special_hands).length > 0
  );

  if (playersWithSpecialHands.length === 0) {
    return null;
  }

  const getHandIcon = (handType: string) => {
    switch (handType) {
      case "royal_flush":
        return <Crown className="w-5 h-5 text-yellow-500" />;
      case "straight_flush":
        return <Spade className="w-5 h-5 text-purple-500" />;
      case "four_of_a_kind":
        return <Diamond className="w-5 h-5 text-red-500" />;
      case "full_house":
        return <Club className="w-5 h-5 text-green-500" />;
      default:
        return <Heart className="w-5 h-5 text-pink-500" />;
    }
  };

  return (
    <Card className="w-full animate-fade-in">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Mãos Especiais</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[200px] pr-4">
          <div className="space-y-4">
            {playersWithSpecialHands.map((player) => (
              <div key={player.id} className="space-y-2">
                <h4 className="font-medium text-sm">{player.player.name}</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {Object.entries(player.special_hands || {}).map(([handType, count]) => (
                    <div
                      key={`${player.id}-${handType}`}
                      className="flex items-center gap-2 p-2 rounded-lg bg-muted/50"
                    >
                      {getHandIcon(handType)}
                      <span className="text-sm">
                        {handType.split('_').map(word => 
                          word.charAt(0).toUpperCase() + word.slice(1)
                        ).join(' ')}
                      </span>
                      <span className="ml-auto font-medium text-sm">
                        {count}x
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
