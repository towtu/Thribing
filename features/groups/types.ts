import type { Difficulty } from "@/features/tasks/types";

export interface GroupHabit {
  id: string;
  title: string;
  notes: string;
  difficulty: Difficulty;
  weekly_target: number;
  session_target_count: number | null;
  session_unit: string | null;
  created_by: string;
  member_uids: string[];
  created_at: Date;
}

export interface GroupMember {
  uid: string;
  displayName: string;
  username: string;
  player_class: string;
  level: number;
  status: "invited" | "active" | "left";
  weekly_completions: string[];
  session_current_count: number;
  streak: number;
  joined_at: Date;
}

export interface GroupInvite {
  groupId: string;
  title: string;
  invited_by: string;
  invited_by_name: string;
  created_at: Date;
}
