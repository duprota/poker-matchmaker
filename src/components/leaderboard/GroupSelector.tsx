import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Group {
  id: string;
  name: string;
}

interface GroupSelectorProps {
  groups: Group[] | undefined;
  selectedGroupId: string | undefined;
  onGroupChange: (value: string) => void;
}

export const GroupSelector = ({ groups, selectedGroupId, onGroupChange }: GroupSelectorProps) => {
  return (
    <Select
      value={selectedGroupId}
      onValueChange={onGroupChange}
    >
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="All Groups" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={undefined}>All Groups</SelectItem>
        {groups?.map((group) => (
          <SelectItem key={group.id} value={group.id}>
            {group.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};