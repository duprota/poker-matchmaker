export interface GamePlayer {
  id: string;
  player: {
    name: string;
    email: string;
  };
  initial_buyin: number;
  total_rebuys: number;
  final_result: number | null;
  payment_status: string;
  payment_amount: number;
}

export interface Game {
  id: string;
  date: string;
  status: string;
  players: GamePlayer[];
  name?: string;
  place?: string;
}