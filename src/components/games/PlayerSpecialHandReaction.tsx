
import { useState } from "react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { hand } from "lucide-react";
import { Button } from "@/components/ui/button";

type SpecialHandType = "full_house" | "four_of_a_kind" | "straight_flush" | "royal_flush" | null;

const specialHandOptions: {
  value: SpecialHandType;
  label: string;
  icon: React.ReactNode;
}[] = [
  {
    value: "full_house",
    label: "Full House",
    icon: (
      <span className="text-yellow-600">
        <svg width="20" height="20" aria-hidden="true" focusable="false">
          <use href="#full-house"></use>
        </svg>
      </span>
    ),
  },
  {
    value: "four_of_a_kind",
    label: "Four of a Kind",
    icon: (
      <span className="text-pink-700">
        <svg width="20" height="20" aria-hidden="true" focusable="false">
          <use href="#four-of-a-kind"></use>
        </svg>
      </span>
    ),
  },
  {
    value: "straight_flush",
    label: "Straight Flush",
    icon: (
      <span className="text-blue-700">
        <svg width="20" height="20" aria-hidden="true" focusable="false">
          <use href="#straight-flush"></use>
        </svg>
      </span>
    ),
  },
  {
    value: "royal_flush",
    label: "Royal Flush",
    icon: <span className="text-amber-700">👑</span>,
  },
];

export interface PlayerSpecialHandReactionProps {
  value: SpecialHandType;
  onChange: (v: SpecialHandType) => void;
}

export function PlayerSpecialHandReaction({ value, onChange }: PlayerSpecialHandReactionProps) {
  const [open, setOpen] = useState(false);

  const selected = specialHandOptions.find((o) => o.value === value);

  return (
    <>
      <EmojiSVGDefs />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button size="icon" variant="ghost" aria-label="Registrar jogada especial">
            {selected ? (
              selected.icon
            ) : (
              <span className="text-slate-500">
                <hand size={20} aria-hidden="true" />
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto flex flex-col gap-2 px-2 py-2">
          <div className="flex gap-3 items-center">
            {specialHandOptions.map((option) => (
              <button
                key={option.value}
                className={`transition hover:scale-105 bg-background p-1 rounded-full border border-transparent focus:outline-none ${
                  value === option.value ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                aria-label={option.label}
                type="button"
              >
                {option.icon}
              </button>
            ))}
            <button
              aria-label="Limpar emoji"
              className="text-muted-foreground px-1 rounded-full ml-2 hover:text-primary"
              onClick={() => {
                onChange(null);
                setOpen(false);
              }}
              type="button"
            >
              <svg width="18" height="18" aria-hidden="true">
                <circle cx="9" cy="9" r="8" fill="#ececec" />
                <text x="9" y="13" textAnchor="middle" fontSize="12" fill="#666">
                  –
                </text>
              </svg>
            </button>
          </div>
          {/* Optional labels */}
          <div className="flex flex-col gap-1 text-[0.8rem] text-muted-foreground pl-1">
            {selected?.label || "Nenhuma jogada registrada"}
          </div>
        </PopoverContent>
      </Popover>
    </>
  );
}

// SVG Sprites (normally imported as SVGs, but here inline for simplicity)
export const EmojiSVGDefs = () => (
  <svg style={{ display: "none" }} aria-hidden="true" focusable="false">
    <symbol id="full-house" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" fill="#facc15" />
      <text x="12" y="16" textAnchor="middle" fontSize="12" fill="#fff">
        FH
      </text>
    </symbol>
    <symbol id="four-of-a-kind" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" fill="#ec4899" />
      <text x="12" y="16" textAnchor="middle" fontSize="12" fill="#fff">
        4K
      </text>
    </symbol>
    <symbol id="straight-flush" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" fill="#3b82f6" />
      <text x="12" y="16" textAnchor="middle" fontSize="12" fill="#fff">
        SF
      </text>
    </symbol>
    <symbol id="hand" viewBox="0 0 24 24">
      <rect x="6" y="7" width="12" height="10" rx="4" fill="#666" />
    </symbol>
  </svg>
);
