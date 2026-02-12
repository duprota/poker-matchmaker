import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Home, LayoutGrid, Users, Trophy, DollarSign, Receipt, Menu } from "lucide-react";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "./ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export const Navigation = () => {
  const location = useLocation();
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const navItems = [
    { path: "/", label: "Home", icon: Home },
    { path: "/games", label: "Games", icon: LayoutGrid },
    { path: "/players", label: "Players", icon: Users },
    { path: "/leaderboard", label: "Leaderboard", icon: Trophy },
    { path: "/financials", label: "Financials", icon: DollarSign },
    { path: "/expenses", label: "Expenses", icon: Receipt },
  ];

  const NavLinks = () => (
    <>
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.path}
            to={item.path}
            onClick={() => setIsOpen(false)}
            className={cn(
              "px-4 py-2 rounded-md transition-all duration-200 flex items-center gap-2 hover:bg-muted w-full",
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
    </>
  );

  return (
    <nav className="bg-card border-b border-muted sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link 
            to="/" 
            className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"
          >
            Poker Manager
          </Link>

          {isMobile ? (
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[85vw] sm:w-[385px]">
                <SheetHeader>
                  <SheetTitle className="text-left">Menu</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-2 mt-6">
                  <NavLinks />
                </div>
              </SheetContent>
            </Sheet>
          ) : (
            <div className="flex space-x-1">
              <NavLinks />
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};