import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Home, Cards, Users, Trophy, DollarSign } from "lucide-react";

export const Navigation = () => {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const navItems = [
    { path: "/", label: "Home", icon: Home },
    { path: "/games", label: "Games", icon: Cards },
    { path: "/players", label: "Players", icon: Users },
    { path: "/leaderboard", label: "Leaderboard", icon: Trophy },
    { path: "/financials", label: "Financials", icon: DollarSign },
  ];

  return (
    <nav className="bg-card border-b border-muted">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link 
            to="/" 
            className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"
          >
            Poker Manager
          </Link>
          <div className="flex space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "px-4 py-2 rounded-md transition-all duration-200 flex items-center gap-2 hover:bg-muted",
                    isActive(item.path) 
                      ? "bg-primary text-primary-foreground" 
                      : "text-foreground/80 hover:text-foreground"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};