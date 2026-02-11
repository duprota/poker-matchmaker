
import { TimeFilter } from "./LeaderboardFilters";
import { RankingType } from "@/types/leaderboard";
import { Toggle } from "@/components/ui/toggle";

interface LeaderboardHeaderProps {
  timeFilter: string;
  onTimeFilterChange: (filter: string) => void;
  rankingType: RankingType;
  onRankingTypeChange: (type: RankingType) => void;
  availableYears?: number[];
  headerTitle: string;
}

export const LeaderboardHeader = ({
  timeFilter,
  onTimeFilterChange,
  rankingType,
  onRankingTypeChange,
  availableYears,
  headerTitle,
}: LeaderboardHeaderProps) => {
  return (
    <>
      <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent mb-6">
        {headerTitle}
      </h1>
      
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <TimeFilter active={timeFilter} onChange={onTimeFilterChange} availableYears={availableYears} />
        <div className="flex gap-2 flex-wrap">
          <Toggle
            pressed={rankingType === "total"}
            onPressedChange={() => onRankingTypeChange("total")}
            className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
          >
            Total Net Earnings
          </Toggle>
          <Toggle
            pressed={rankingType === "average"}
            onPressedChange={() => onRankingTypeChange("average")}
            className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
          >
            Average Net per Game
          </Toggle>
          <Toggle
            pressed={rankingType === "special"}
            onPressedChange={() => onRankingTypeChange("special")}
            className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
          >
            Special Hands
          </Toggle>
        </div>
      </div>
    </>
  );
};
