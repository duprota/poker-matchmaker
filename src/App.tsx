import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Games from "./pages/Games";
import NewGame from "./pages/Games/NewGame";
import GameDetails from "./pages/Games/GameDetails";
import Players from "./pages/Players";
import Leaderboard from "./pages/Leaderboard";
import Financials from "./pages/Financials";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5000,
      retry: 1,
    },
  },
});

const App: React.FC = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/games" element={<Games />} />
            <Route path="/games/new" element={<NewGame />} />
            <Route path="/games/:id" element={<GameDetails />} />
            <Route path="/players" element={<Players />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/financials" element={<Financials />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;