export interface LedgerEntry {
  id: string;
  player_id: string;
  amount: number;
  entry_type: 'game_credit' | 'game_debit' | 'expense' | 'settlement';
  game_id: string | null;
  settlement_item_id: string | null;
  description: string | null;
  created_at: string;
  player?: {
    id: string;
    name: string;
  };
}

export interface Settlement {
  id: string;
  created_at: string;
  status: 'active' | 'replaced';
  created_by: string | null;
  items?: SettlementItem[];
}

export interface SettlementItem {
  id: string;
  settlement_id: string;
  from_player_id: string;
  to_player_id: string;
  amount: number;
  paid_at: string | null;
  created_at: string;
  from_player?: { id: string; name: string };
  to_player?: { id: string; name: string };
}

export interface PlayerBalance {
  playerId: string;
  playerName: string;
  balance: number;
  pixKey?: string | null;
}
