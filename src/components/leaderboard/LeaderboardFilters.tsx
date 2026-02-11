import { cn } from "@/lib/utils";

interface TimeFilterProps {
  active: string;
  onChange: (period: string) => void;
  availableYears?: number[];
}

export const TimeFilter = ({ active, onChange, availableYears = [] }: TimeFilterProps) => {
  const currentYear = new Date().getFullYear();
  
  // Build filters: current year first, then previous years, then "All Time"
  const yearFilters = availableYears.length > 0
    ? [...new Set([currentYear, ...availableYears])].sort((a, b) => b - a).map(String)
    : [String(currentYear)];
  
  const filters = [...yearFilters, "All Time"];

  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {filters.map((filter) => (
        <button
          key={filter}
          onClick={() => onChange(filter)}
          className={cn(
            "px-4 py-2 rounded-full text-sm whitespace-nowrap transition-all",
            active === filter 
              ? "bg-primary text-primary-foreground" 
              : "bg-card hover:bg-muted"
          )}
        >
          {filter}
        </button>
      ))}
    </div>
  );
};
