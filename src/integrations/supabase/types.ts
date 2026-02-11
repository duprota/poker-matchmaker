export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      game_history: {
        Row: {
          amount: number | null
          created_at: string | null
          event_type: Database["public"]["Enums"]["game_event_type"]
          game_id: string | null
          game_player_id: string | null
          id: string
          metadata: Json | null
          player_id: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          event_type: Database["public"]["Enums"]["game_event_type"]
          game_id?: string | null
          game_player_id?: string | null
          id?: string
          metadata?: Json | null
          player_id?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          event_type?: Database["public"]["Enums"]["game_event_type"]
          game_id?: string | null
          game_player_id?: string | null
          id?: string
          metadata?: Json | null
          player_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_game_history_game_player"
            columns: ["game_player_id"]
            isOneToOne: false
            referencedRelation: "game_players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_history_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_history_game_player_id_fkey"
            columns: ["game_player_id"]
            isOneToOne: false
            referencedRelation: "game_players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_history_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      game_players: {
        Row: {
          created_at: string
          final_result: number | null
          game_id: string | null
          id: string
          initial_buyin: number
          payment_amount: number | null
          payment_date: string | null
          payment_status: string | null
          player_id: string | null
          special_hands: Json | null
          special_hands_count: number | null
          total_rebuys: number
        }
        Insert: {
          created_at?: string
          final_result?: number | null
          game_id?: string | null
          id?: string
          initial_buyin?: number
          payment_amount?: number | null
          payment_date?: string | null
          payment_status?: string | null
          player_id?: string | null
          special_hands?: Json | null
          special_hands_count?: number | null
          total_rebuys?: number
        }
        Update: {
          created_at?: string
          final_result?: number | null
          game_id?: string | null
          id?: string
          initial_buyin?: number
          payment_amount?: number | null
          payment_date?: string | null
          payment_status?: string | null
          player_id?: string | null
          special_hands?: Json | null
          special_hands_count?: number | null
          total_rebuys?: number
        }
        Relationships: [
          {
            foreignKeyName: "game_players_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_players_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      game_transactions: {
        Row: {
          amount: number
          created_at: string | null
          from_player_id: string | null
          game_id: string | null
          id: string
          payment_date: string | null
          payment_status: string | null
          to_player_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          from_player_id?: string | null
          game_id?: string | null
          id?: string
          payment_date?: string | null
          payment_status?: string | null
          to_player_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          from_player_id?: string | null
          game_id?: string | null
          id?: string
          payment_date?: string | null
          payment_status?: string | null
          to_player_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "game_transactions_from_player_id_fkey"
            columns: ["from_player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_transactions_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_transactions_to_player_id_fkey"
            columns: ["to_player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      games: {
        Row: {
          created_at: string
          date: string
          group_id: string | null
          id: string
          manager_id: string | null
          name: string | null
          place: string | null
          started_at: string | null
          status: string
        }
        Insert: {
          created_at?: string
          date?: string
          group_id?: string | null
          id?: string
          manager_id?: string | null
          name?: string | null
          place?: string | null
          started_at?: string | null
          status: string
        }
        Update: {
          created_at?: string
          date?: string
          group_id?: string | null
          id?: string
          manager_id?: string | null
          name?: string | null
          place?: string | null
          started_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "games_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_members: {
        Row: {
          created_at: string
          group_id: string | null
          id: string
          permissions: Json | null
          player_id: string | null
          role: Database["public"]["Enums"]["group_member_role"]
        }
        Insert: {
          created_at?: string
          group_id?: string | null
          id?: string
          permissions?: Json | null
          player_id?: string | null
          role?: Database["public"]["Enums"]["group_member_role"]
        }
        Update: {
          created_at?: string
          group_id?: string | null
          id?: string
          permissions?: Json | null
          player_id?: string | null
          role?: Database["public"]["Enums"]["group_member_role"]
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_members_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          created_at: string
          description: string | null
          id: string
          manager_id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          manager_id: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          manager_id?: string
          name?: string
        }
        Relationships: []
      }
      ledger_entries: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          entry_type: string
          game_id: string | null
          id: string
          player_id: string
          settlement_item_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          entry_type: string
          game_id?: string | null
          id?: string
          player_id: string
          settlement_item_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          entry_type?: string
          game_id?: string | null
          id?: string
          player_id?: string
          settlement_item_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_ledger_settlement_item"
            columns: ["settlement_item_id"]
            isOneToOne: false
            referencedRelation: "settlement_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_entries_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_entries_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      player_feedback: {
        Row: {
          comment: string | null
          created_at: string
          from_player_id: string
          id: string
          to_player_id: string
          vote_type: Database["public"]["Enums"]["player_vote_type"]
        }
        Insert: {
          comment?: string | null
          created_at?: string
          from_player_id: string
          id?: string
          to_player_id: string
          vote_type: Database["public"]["Enums"]["player_vote_type"]
        }
        Update: {
          comment?: string | null
          created_at?: string
          from_player_id?: string
          id?: string
          to_player_id?: string
          vote_type?: Database["public"]["Enums"]["player_vote_type"]
        }
        Relationships: [
          {
            foreignKeyName: "player_feedback_to_player_id_fkey"
            columns: ["to_player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          pix_key: string | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          pix_key?: string | null
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          pix_key?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      poker_hands: {
        Row: {
          created_at: string
          description: string | null
          game_id: string
          hand_type: Database["public"]["Enums"]["poker_hand_type"]
          id: string
          player_id: string
          value: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          game_id: string
          hand_type: Database["public"]["Enums"]["poker_hand_type"]
          id?: string
          player_id: string
          value?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          game_id?: string
          hand_type?: Database["public"]["Enums"]["poker_hand_type"]
          id?: string
          player_id?: string
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "poker_hands_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "poker_hands_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["user_role"] | null
        }
        Insert: {
          created_at?: string
          id: string
          role?: Database["public"]["Enums"]["user_role"] | null
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"] | null
        }
        Relationships: []
      }
      settlement_items: {
        Row: {
          amount: number
          created_at: string
          from_player_id: string
          id: string
          paid_at: string | null
          settlement_id: string
          to_player_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          from_player_id: string
          id?: string
          paid_at?: string | null
          settlement_id: string
          to_player_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          from_player_id?: string
          id?: string
          paid_at?: string | null
          settlement_id?: string
          to_player_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "settlement_items_from_player_id_fkey"
            columns: ["from_player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "settlement_items_settlement_id_fkey"
            columns: ["settlement_id"]
            isOneToOne: false
            referencedRelation: "settlements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "settlement_items_to_player_id_fkey"
            columns: ["to_player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      settlements: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          status: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          status?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          status?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      promote_to_manager: { Args: { user_id: string }; Returns: undefined }
    }
    Enums: {
      game_event_type: "rebuy" | "result_update"
      group_member_role: "admin" | "member"
      player_vote_type: "like" | "dislike"
      poker_hand_type:
        | "full_house"
        | "four_of_a_kind"
        | "straight_flush"
        | "royal_flush"
      user_role: "user" | "manager"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      game_event_type: ["rebuy", "result_update"],
      group_member_role: ["admin", "member"],
      player_vote_type: ["like", "dislike"],
      poker_hand_type: [
        "full_house",
        "four_of_a_kind",
        "straight_flush",
        "royal_flush",
      ],
      user_role: ["user", "manager"],
    },
  },
} as const
