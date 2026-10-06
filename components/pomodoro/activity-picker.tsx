"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ActivitySummary } from "@/lib/data/activities";

type ActivityPickerProps = {
  activities: ActivitySummary[];
  value: string | null;
  onChange: (id: string) => void;
};

export function ActivityPicker({
  activities,
  value,
  onChange,
}: ActivityPickerProps) {
  return (
    <div className="flex w-full max-w-xs flex-col gap-2">
      <Label htmlFor="pomodoro-activity">Activity</Label>
      <Select value={value ?? ""} onValueChange={onChange}>
        <SelectTrigger id="pomodoro-activity" className="w-full">
          <SelectValue placeholder="Choose an activity" />
        </SelectTrigger>
        <SelectContent>
          {activities.map((activity) => (
            <SelectItem key={activity.id} value={activity.id}>
              {activity.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
