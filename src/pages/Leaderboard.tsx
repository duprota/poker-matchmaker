import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { useLeaderboardData } from "@/hooks/useLeaderboardData";
import { GroupSelector } from "@/components/leaderboard/GroupSelector";
import { LeaderboardTable } from "@/components/leaderboard/LeaderboardTable";

const Leaderboard = () => {
  const [selectedGroupId, setSelectedGroupId] = useState<string | undefined>();
  const { groupsQuery, leaderboardQuery } = useLeaderboardData(selectedGroupId);

  const { data: groups, isLoading: isLoadingGroups, error: groupsError } = groupsQuery;
  const { data: leaderboard, isLoading, error } = leaderboardQuery;

  if (isLoadingGroups) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto py-8">
          <h1 className="text-3xl font-bold text-white mb-6">2024 Leaderboard</h1>
          <Card className="p-4">
            <div className="text-center py-8">Loading groups...</div>
          </Card>
        </div>
      </div>
    );
  }

  if (groupsError || error) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto py-8">
          <h1 className="text-3xl font-bold text-white mb-6">2024 Leaderboard</h1>
          <Card className="p-4">
            <div className="text-center py-8 text-red-500">
              Error loading data. Please try again later.
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-white">2024 Leaderboard</h1>
          <GroupSelector
            groups={groups}
            selectedGroupId={selectedGroupId}
            onGroupChange={setSelectedGroupId}
          />
        </div>
        
        <Card className="p-4">
          <LeaderboardTable
            entries={leaderboard}
            isLoading={isLoading}
          />
        </Card>
      </div>
    </div>
  );
};

export default Leaderboard;