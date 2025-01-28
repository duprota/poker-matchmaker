import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { GameStatus } from "@/types/game";

const OngoingGameForm = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    date: "",
    status: "ongoing" as GameStatus,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const createGame = async (data: any) => {
    try {
      console.log('Creating new game with data:', data);
      const { data: gameData, error: gameError } = await supabase
        .from('games')
        .insert([
          { 
            ...data,
            status: data.status as GameStatus // Cast to enum type
          }
        ])
        .select()
        .single();

      if (gameError) throw gameError;
      return gameData;
    } catch (error) {
      console.error('Error creating game:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createGame(formData);
      toast({
        title: "Success",
        description: "Game created successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create game",
        variant: "destructive",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        name="name"
        value={formData.name}
        onChange={handleChange}
        placeholder="Game Name"
        required
      />
      <input
        type="date"
        name="date"
        value={formData.date}
        onChange={handleChange}
        required
      />
      <button type="submit">Create Game</button>
    </form>
  );
};

export default OngoingGameForm;
