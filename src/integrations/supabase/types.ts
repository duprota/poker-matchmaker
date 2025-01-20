export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
      games: {
        Row: {
          created_at: string
          date: string
          group_id: string | null
          id: string
          manager_id: string | null
          name: string | null
          place: string | null
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
      players: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          pix_key: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name: string
          pix_key?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          pix_key?: string | null
          user_id?: string | null
        }
        Relationships: []
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      promote_to_manager: {
        Args: {
          user_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      game_event_type: "rebuy" | "result_update"
      group_member_role: "admin" | "member"
      user_role: "user" | "manager"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
