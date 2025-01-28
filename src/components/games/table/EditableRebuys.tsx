import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Pencil, Save, X } from "lucide-react";

interface EditableRebuysProps {
  playerId: string;
  initialValue: number;
  onSave: (value: number) => void;
}

export const EditableRebuys = ({ playerId, initialValue, onSave }: EditableRebuysProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(initialValue);

  const handleSave = () => {
    onSave(editValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(initialValue);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="flex justify-end gap-2">
        <Input
          type="number"
          value={editValue}
          onChange={(e) => setEditValue(Number(e.target.value))}
          className="w-20 ml-auto"
        />
        <Button variant="ghost" size="icon" onClick={handleSave}>
          <Save className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={handleCancel}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex justify-end gap-2">
      <span className="mr-2">{initialValue}</span>
      <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)}>
        <Pencil className="h-4 w-4" />
      </Button>
    </div>
  );
};