import { cn } from "@/lib/utils";

interface TimeFilterProps {
  active: string;
  onChange: (period: string) => void;
}

export const TimeFilter = ({ active, onChange }: TimeFilterProps) => {
  const filters = ["All Time", "This Month", "This Week"];
  
  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {filters.map((filter) => (
        <button
          key={filter}
          onClick={() => onChange(filter)}
          className={cn(
            "px-4 py-2 rounded-full text-sm whitespace-nowrap transition-all",
            active === filter 
              ? "bg-primary text-white" 
              : "bg-card hover:bg-muted"
          )}
        >
          {filter}
        </button>
      ))}
    </div>
  );
};