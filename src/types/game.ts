export interface GamePlayer {
  id: string;
  game_id: string;
  player: {
    id: string;
    name: string;
    email: string;
  };
  initial_buyin: number;
  total_rebuys: number;
  final_result: number | null;
  payment_status: string;
  payment_amount: number;
  special_hands?: { [key: string]: number } | null; // allow null from db, but code will treat it as {}
}

export type GameStatus = string;

export interface Game {
  id: string;
  date: string;
  status: GameStatus;
  players: GamePlayer[];
  name?: string;
  place?: string;
  started_at?: string;
}
