import { Game } from "@/types/game";
import { OngoingGameForm } from "./OngoingGameForm";
import { GameMoneyFlowChart } from "./GameMoneyFlowChart";

interface GameContainerProps {
  game: Game;
  refreshGame: () => void;
}

export const GameContainer = ({ game, refreshGame }: GameContainerProps) => {
  return (
    <div className="grid gap-8">
      <div className="grid gap-4">
        {game.status === "ongoing" && (
          <OngoingGameForm
            players={game.players}
            rebuys={{}}
            onRebuyChange={() => {
              console.log("Rebuy change detected");
              refreshGame();
            }}
            onSaveRebuys={() => {
              console.log("Rebuys saved");
              refreshGame();
            }}
            savingRebuys={false}
            setRebuys={() => {
              console.log("Rebuys updated");
              refreshGame();
            }}
          />
        )}
      </div>

      <GameMoneyFlowChart
        players={game.players}
        gameHistory={[]}
      />
    </div>
  );
};