import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

interface ConqueredBadge {
  player_id: string;
  player_name: string;
  badge_code: string;
  badge_name: string;
  emoji: string;
  description: string;
  metadata: any;
}

interface BadgeAnimationProps {
  badges: ConqueredBadge[];
  onComplete: () => void;
}

export const BadgeAnimation = ({ badges, onComplete }: BadgeAnimationProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (badges.length === 0) {
      onComplete();
      return;
    }

    const timer = setTimeout(() => {
      if (currentIndex < badges.length - 1) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        onComplete();
      }
    }, 2400);

    return () => clearTimeout(timer);
  }, [currentIndex, badges.length, onComplete]);

  if (badges.length === 0) return null;

  const badge = badges[currentIndex];

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">
        🏅 Nova Badge Conquistada!
      </p>
      <AnimatePresence mode="wait">
        <motion.div
          key={badge.badge_code + currentIndex}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 1.15, 1], opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="flex flex-col items-center gap-3"
        >
          <span className="text-6xl">{badge.emoji}</span>
          <h3 className="text-xl font-bold text-foreground">{badge.badge_name}</h3>
          <p className="text-sm text-muted-foreground text-center max-w-xs">
            {badge.description}
          </p>
          <p className="text-xs text-primary font-medium">{badge.player_name}</p>
        </motion.div>
      </AnimatePresence>
      <div className="flex gap-1.5 mt-6">
        {badges.map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-colors ${
              i === currentIndex ? "bg-primary" : "bg-muted"
            }`}
          />
        ))}
      </div>
    </div>
  );
};
